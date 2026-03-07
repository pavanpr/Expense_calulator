import React, { useState } from 'react';
import { CATEGORIES } from '../constants.js';
import { analyzeTransactionWithAI, extractAmountFromDescription } from '../services/aiService.js';

const DEFAULT_FORM = {
  description: "", amount: "", category: "food", type: "expense",
  date: new Date().toISOString().split("T")[0],
};

export default function AddEntry({ onAdd }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [success, setSuccess] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [useAIMode, setUseAIMode] = useState(true);
  const [amountError, setAmountError] = useState(null);
  const [amountConfirmation, setAmountConfirmation] = useState(null);

  const handleAdd = () => {
    if (!form.description.trim() || !form.amount) return;
    onAdd({ ...form, id: Date.now(), amount: parseFloat(form.amount) });
    setForm(DEFAULT_FORM);
    setAiAnalysis(null);
    setUseAIMode(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2500);
  };

  const handleAIAnalyze = async () => {
    setAmountError(null);
    setAmountConfirmation(null);

    // Try to extract amount from description
    const extractedAmount = extractAmountFromDescription(form.description);

    // If amount field is empty, try extracted amount
    if (!form.amount && !extractedAmount) {
      setAmountError("No amount found! Please mention amount in description (e.g., 'lunch at office 70 rupees') or enter it manually.");
      return;
    }

    // If extracted amount differs from form amount, ask for confirmation
    if (extractedAmount && form.amount && Math.abs(extractedAmount - parseFloat(form.amount)) > 0.01) {
      setAmountConfirmation({
        extractedAmount,
        formAmount: parseFloat(form.amount),
      });
      return;
    }

    // Use extracted amount if form amount is empty
    const finalAmount = form.amount ? parseFloat(form.amount) : extractedAmount;

    setAiLoading(true);
    try {
      const analysis = await analyzeTransactionWithAI(form.description, finalAmount);
      setAiAnalysis(analysis);
      // Update form with extracted amount if it was filled from description
      if (!form.amount && extractedAmount) {
        setForm(f => ({ ...f, amount: extractedAmount.toString() }));
      }
    } catch (error) {
      console.error('AI analysis failed:', error);
      setAmountError('Failed to analyze transaction. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const applyAIAnalysis = () => {
    if (aiAnalysis) {
      setForm(f => ({
        ...f,
        category: aiAnalysis.category,
        type: aiAnalysis.type,
      }));
      setAiAnalysis(null);
      setUseAIMode(false);
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: 560 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, margin: 0 }}>Add Entry</h2>
        <button 
          onClick={() => setUseAIMode(!useAIMode)}
          style={{
            background: useAIMode ? "#6C63FF" : "#252A3A",
            border: "1px solid #6C63FF",
            color: useAIMode ? "white" : "#6C63FF",
            padding: "8px 14px",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
            transition: "all 0.2s",
          }}
        >
          🤖 {useAIMode ? "AI Mode ON" : "AI Mode"}
        </button>
      </div>
      <p style={{ color: "#6B7494", fontSize: 14, marginBottom: 28 }}>
        {useAIMode ? "Let AI analyze and categorize your transaction" : "Record a new income or expense"}
      </p>

      {success && (
        <div style={{ background: "#1DD1A122", border: "1px solid #1DD1A1", borderRadius: 10, padding: "12px 16px", marginBottom: 20, color: "#1DD1A1", fontSize: 14, fontWeight: 500 }}>
          ✓ Transaction added successfully!
        </div>
      )}

      {amountError && (
        <div style={{ background: "#FF6B6B22", border: "1px solid #FF6B6B", borderRadius: 10, padding: "12px 16px", marginBottom: 20, color: "#FF6B6B", fontSize: 14, fontWeight: 500 }}>
          ⚠️ {amountError}
        </div>
      )}

      {amountConfirmation && (
        <div style={{ background: "#F9CA2422", border: "1px solid #F9CA24", borderRadius: 10, padding: 16, marginBottom: 20 }}>
          <div style={{ color: "#F9CA24", fontSize: 13, fontWeight: 600, marginBottom: 12 }}>💡 Amount Mismatch</div>
          <div style={{ fontSize: 13, color: "#6B7494", marginBottom: 14 }}>
            Found <strong>₹{amountConfirmation.extractedAmount}</strong> in description, but you entered <strong>₹{amountConfirmation.formAmount}</strong>. Which one should I use?
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button 
              onClick={() => {
                setForm(f => ({ ...f, amount: amountConfirmation.extractedAmount.toString() }));
                setAmountConfirmation(null);
              }}
              style={{ flex: 1, background: "#F9CA24", border: "none", color: "#0D0F14", padding: 10, borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 }}
            >
              ✓ Use from Description (₹{amountConfirmation.extractedAmount})
            </button>
            <button 
              onClick={() => {
                setAmountConfirmation(null);
              }}
              style={{ flex: 1, background: "#252A3A", border: "1px solid #6B7494", color: "#6B7494", padding: 10, borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 }}
            >
              ✓ Use Manual Entry (₹{amountConfirmation.formAmount})
            </button>
          </div>
        </div>
      )}

      {aiAnalysis && (
        <div style={{ background: "#6C63FF22", border: "1px solid #6C63FF", borderRadius: 10, padding: 16, marginBottom: 20 }}>
          <div style={{ color: "#6C63FF", fontSize: 13, fontWeight: 600, marginBottom: 12 }}>🤖 AI Analysis Result</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 11, color: "#6B7494", marginBottom: 4 }}>DETECTED TYPE</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: aiAnalysis.type === "expense" ? "#FF6B6B" : "#1DD1A1" }}>
                {aiAnalysis.type === "expense" ? "💸 Expense" : "💰 Income"}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#6B7494", marginBottom: 4 }}>DETECTED CATEGORY</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#6C63FF" }}>
                {CATEGORIES.find(c => c.id === aiAnalysis.category)?.label}
              </div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: "#6B7494", marginBottom: 12 }}>{aiAnalysis.reason}</div>
          <div style={{ display: "flex", gap: 10 }}>
            <button 
              onClick={applyAIAnalysis}
              style={{ flex: 1, background: "#6C63FF", border: "none", color: "white", padding: 10, borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 }}
            >
              ✓ Apply Analysis
            </button>
            <button 
              onClick={() => setAiAnalysis(null)}
              style={{ flex: 1, background: "#252A3A", border: "1px solid #6B7494", color: "#6B7494", padding: 10, borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 }}
            >
              ✗ Decline
            </button>
          </div>
        </div>
      )}

      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Description */}
        <div>
          <label style={{ fontSize: 12, color: "#6B7494", display: "block", marginBottom: 6, fontWeight: 500 }}>DESCRIPTION</label>
          <input className="input-field" placeholder="e.g. Monthly Rent, Grocery Bill..."
            value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        </div>

        {/* Amount + Date */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: "#6B7494", display: "block", marginBottom: 6, fontWeight: 500 }}>AMOUNT (₹)</label>
            <input className="input-field" type="number" placeholder="0.00"
              value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#6B7494", display: "block", marginBottom: 6, fontWeight: 500 }}>DATE</label>
            <input className="input-field" type="date"
              value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
        </div>

        {/* Only show Type and Category when NOT in AI mode */}
        {!useAIMode && (
          <>
            {/* Type Toggle */}
            <div>
              <label style={{ fontSize: 12, color: "#6B7494", display: "block", marginBottom: 6, fontWeight: 500 }}>ENTRY TYPE</label>
              <div style={{ display: "flex", background: "#1A1D28", borderRadius: 10, padding: 3, gap: 3 }}>
                {["expense", "income"].map(type => (
                  <button key={type} onClick={() => setForm(f => ({ ...f, type }))}
                    style={{
                      flex: 1, padding: 8, border: "none", borderRadius: 8, cursor: "pointer",
                      fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500,
                      transition: "all 0.2s",
                      background: form.type === type ? (type === "expense" ? "#FF6B6B" : "#1DD1A1") : "transparent",
                      color: form.type === type ? "white" : "#6B7494",
                    }}>
                    {type === "expense" ? "💸 Expense" : "💰 Income"}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Grid */}
            <div>
              <label style={{ fontSize: 12, color: "#6B7494", display: "block", marginBottom: 8, fontWeight: 500 }}>CATEGORY</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
                {CATEGORIES.map(cat => (
                  <button key={cat.id} onClick={() => setForm(f => ({ ...f, category: cat.id }))}
                    style={{
                      background: form.category === cat.id ? `${cat.color}33` : "#1A1D28",
                      border: `1px solid ${form.category === cat.id ? cat.color : "#252A3A"}`,
                      borderRadius: 10, padding: "10px 4px", cursor: "pointer",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                      transition: "all 0.15s",
                    }}>
                    <span style={{ fontSize: 18 }}>{cat.icon}</span>
                    <span style={{ fontSize: 10, color: form.category === cat.id ? cat.color : "#6B7494", fontWeight: 500 }}>
                      {cat.label.split(" ")[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {useAIMode && !aiAnalysis ? (
          <button className="btn-primary" onClick={handleAIAnalyze} disabled={aiLoading} style={{ marginTop: 4, padding: 14, fontSize: 15, opacity: aiLoading ? 0.6 : 1 }}>
            {aiLoading ? "🤖 Analyzing..." : "🤖 Analyze with AI"}
          </button>
        ) : (
          <button className="btn-primary" onClick={handleAdd} style={{ marginTop: 4, padding: 14, fontSize: 15 }}>
            ＋ Add Transaction
          </button>
        )}
      </div>
    </div>
  );
}
