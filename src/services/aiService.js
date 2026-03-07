import { CATEGORIES } from '../constants.js';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

/**
 * Extracts amount from description
 * Looks for numbers in various formats
 * Examples: "70", "70.50", "₹70", "70 rupees", etc.
 */
export function extractAmountFromDescription(description) {
  if (!description || description.trim() === "") return null;

  // Regular expressions to match amounts in order of priority
  const patterns = [
    /₹\s*(\d+(?:\.\d{1,2})?)/i,                        // ₹70 or ₹70.50
    /(\d+(?:\.\d{1,2})?)\s*(?:rupee|rupees|rs|r\.s\.)/i,  // 70 rupees, 70 rs, 70 r.s.
    /(\d+(?:\.\d{1,2})?)\s*(?:inr|₹)/i,                // 70 INR
    /^₹?\s*(\d+(?:\.\d{1,2})?)(?:\s|$)/,               // Starts with number: "70 lunch"
    /(\d+(?:\.\d{1,2})?)\s*(?:for|at|each|per)?(?:\s|$)/i, // "70 for lunch"
    /\b(\d+(?:\.\d{1,2})?)\b/,                          // Any standalone number
  ];

  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match) {
      const amount = parseFloat(match[1]);
      // Validate that it's a reasonable amount (not a year or very small number)
      if (amount > 0 && amount < 10000000) {
        return amount;
      }
    }
  }

  return null; // No amount found
}

/**
 * Analyzes a transaction using Google Gemini API
 */
export async function analyzeTransactionWithAI(description, amount) {
  if (!GEMINI_API_KEY) {
    console.error('Gemini API key not configured. Add VITE_GEMINI_API_KEY to .env file');
    return fallbackAnalysis(description, amount);
  }

  const categoryOptions = CATEGORIES.map(c => c.id).join(', ');
  
  const prompt = `Analyze this financial transaction and respond ONLY with valid JSON (no markdown, no extra text):

Transaction Description: "${description}"
Amount: ₹${amount}

Respond with ONLY this JSON structure:
{
  "type": "expense" or "income",
  "category": "one of: ${categoryOptions}",
  "confidence": 0-100,
  "reason": "Brief explanation in 1 sentence"
}

Important: 
- Respond with ONLY valid JSON, nothing else
- Type should be "expense" or "income"
- Category must be one from the list above
- Confidence should be a number 0-100`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract text from Gemini response
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Parse JSON from response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Could not parse AI response:', aiResponse);
      return fallbackAnalysis(description, amount);
    }

    const analysis = JSON.parse(jsonMatch[0]);

    // Validate response
    if (!analysis.type || !analysis.category) {
      return fallbackAnalysis(description, amount);
    }

    // Ensure valid category
    if (!CATEGORIES.find(c => c.id === analysis.category)) {
      analysis.category = 'other'; // Default fallback
    }

    return {
      type: analysis.type,
      category: analysis.category,
      confidence: Math.min(Math.max(analysis.confidence, 0), 100),
      reason: analysis.reason || 'AI analysis completed',
    };
  } catch (error) {
    console.error('Gemini API Error:', error);
    return fallbackAnalysis(description, amount);
  }
}

/**
 * Fallback to local keyword matching if API fails
 */
function fallbackAnalysis(description, amount) {
  const desc = description.toLowerCase();
  
  const categoryKeywords = {
    housing: ['rent', 'mortgage', 'lease', 'property', 'apartment', 'house', 'flat'],
    food: ['grocery', 'food', 'restaurant', 'coffee', 'lunch', 'dinner', 'breakfast', 'pizza', 'burger', 'zomato', 'swiggy'],
    transport: ['fuel', 'petrol', 'diesel', 'taxi', 'uber', 'ola', 'bus', 'train', 'flight', 'car', 'bike', 'parking'],
    shopping: ['clothes', 'shoes', 'shirt', 'pants', 'dress', 'shopping', 'mall', 'amazon', 'flipkart', 'myntra'],
    entertainment: ['movie', 'cinema', 'games', 'concert', 'spotify', 'netflix', 'entertainment', 'ticket', 'show'],
    utilities: ['electricity', 'water', 'gas', 'bill', 'internet', 'phone', 'utility', 'broadband', 'wifi'],
    health: ['doctor', 'medicine', 'hospital', 'pharmacy', 'health', 'gym', 'fitness', 'clinic'],
    education: ['course', 'school', 'college', 'book', 'study', 'tuition'],
    savings: ['sip', 'investment', 'savings', 'fund', 'deposit'],
  };

  let detectedCategory = 'other';
  let maxMatches = 0;

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    const matches = keywords.filter(k => desc.includes(k)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      detectedCategory = category;
    }
  }

  const incomeKeywords = ['salary', 'bonus', 'income', 'payment', 'refund', 'earning', 'freelance'];
  const isIncome = incomeKeywords.some(k => desc.includes(k));

  return {
    type: isIncome ? 'income' : 'expense',
    category: detectedCategory,
    confidence: maxMatches > 0 ? 60 + Math.min(maxMatches * 10, 35) : 45,
    reason: maxMatches > 0 ? `Detected from keywords in description` : `Default categorization`,
  };
}
