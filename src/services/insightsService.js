import { CATEGORIES } from '../constants.js';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

/**
 * Generates AI-powered insights about spending patterns
 */
export async function generateSpendingInsights(transactions, categoryBreakdown, monthlyTrend, currentMonth) {
  if (!GEMINI_API_KEY) {
    console.error('Gemini API key not configured');
    return getBasicInsights(transactions, categoryBreakdown, monthlyTrend, currentMonth);
  }

  try {
    // Prepare data for AI analysis
    const totalExpense = Object.values(categoryBreakdown).reduce((a, b) => a + b, 0);
    const topCategories = Object.entries(categoryBreakdown)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat, amount]) => {
        const category = CATEGORIES.find(c => c.id === cat);
        return `${category?.label || cat}: ₹${amount}`;
      });

    const recentTrend = monthlyTrend.length >= 2 
      ? monthlyTrend.slice(-2)
      : monthlyTrend;

    const prompt = `Analyze this person's spending data and provide 3-4 personalized financial insights and recommendations. Be specific and actionable.

Data:
- Total Expenses This Month: ₹${totalExpense}
- Top Spending Categories: ${topCategories.join(', ')}
- Number of Transactions: ${transactions.length}
- Monthly Trend: ${recentTrend.map(m => `${m.month}: ₹${m.expense} spent`).join('; ')}

Provide insights in JSON format:
{
  "insights": [
    {
      "title": "Short title",
      "description": "1-2 sentence actionable insight",
      "severity": "positive|neutral|warning",
      "emoji": "relevant emoji"
    }
  ],
  "recommendations": [
    "Specific actionable recommendation"
  ],
  "savingsPotential": "Estimate of how much they could save with changes"
}`;

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
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parse JSON from response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Could not parse AI response:', aiResponse);
      return getBasicInsights(transactions, categoryBreakdown, monthlyTrend, currentMonth);
    }

    const insights = JSON.parse(jsonMatch[0]);

    return {
      insights: insights.insights || [],
      recommendations: insights.recommendations || [],
      savingsPotential: insights.savingsPotential || '',
      aiGenerated: true,
    };
  } catch (error) {
    console.error('AI Insights Error:', error);
    return getBasicInsights(transactions, categoryBreakdown, monthlyTrend, currentMonth);
  }
}

/**
 * Fallback basic insights if AI fails
 */
function getBasicInsights(transactions, categoryBreakdown, monthlyTrend, currentMonth) {
  const insights = [];
  const recommendations = [];
  const totalExpense = Object.values(categoryBreakdown).reduce((a, b) => a + b, 0);

  // Insight 1: Top spending category
  const topCat = Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1])[0];
  if (topCat) {
    const catName = CATEGORIES.find(c => c.id === topCat[0])?.label || topCat[0];
    const percentage = ((topCat[1] / totalExpense) * 100).toFixed(1);
    insights.push({
      title: `High ${catName} Spending`,
      description: `${catName} accounts for ${percentage}% of your spending. Consider reviewing these expenses.`,
      severity: percentage > 30 ? 'warning' : 'neutral',
      emoji: '🎯',
    });
    recommendations.push(`Review your ${catName} expenses and identify areas to reduce.`);
  }

  // Insight 2: Spending trend
  if (monthlyTrend.length >= 2) {
    const recent = monthlyTrend[monthlyTrend.length - 1];
    const previous = monthlyTrend[monthlyTrend.length - 2];
    const increase = recent.expense > previous.expense;
    const percent = Math.abs(((recent.expense - previous.expense) / previous.expense) * 100).toFixed(1);

    insights.push({
      title: increase ? '📈 Spending Increased' : '📉 Spending Decreased',
      description: `Your expenses ${increase ? 'increased' : 'decreased'} by ${percent}% compared to last month.`,
      severity: increase ? 'warning' : 'positive',
      emoji: increase ? '⚠️' : '✅',
    });
  }

  // Insight 3: Transaction frequency
  insights.push({
    title: 'Transaction Count',
    description: `You made ${transactions.length} transactions. Average spending helps track consistency.`,
    severity: 'neutral',
    emoji: '📊',
  });

  recommendations.push('Track your daily expenses to identify spending patterns.');
  recommendations.push('Set category-wise budgets to control overspending.');

  return {
    insights,
    recommendations,
    savingsPotential: 'Detailed analysis needed to estimate savings potential.',
    aiGenerated: false,
  };
}
