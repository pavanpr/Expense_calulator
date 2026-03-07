import React, { useState } from 'react';
import { CATEGORIES } from '../constants.js';
import { formatINR, formatINRFull } from '../utils.js';

export default function Budget({ transactions, currentMonthStr, monthlyBudget, setMonthlyBudget }) {
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState(monthlyBudget);

  const currentMonthTx  = transactions.filter(t => t.date.startsWith(currentMonthStr));
  const currentExpenses = currentMonthTx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const budgetUsed      = (currentExpenses / monthlyBudget) * 100;
  const remaining       = Math.max(monthlyBudget - currentExpenses, 0);

  const catMap = {};
  currentMonthTx.filter(t => t.type === "expense").forEach(t => {
    catMap[t.category] = (catMap[t.category] || 0) + t.amount;
  });
  const breakdown = Object.entries(catMap).sort((a, b) => b[1] - a[1]).map(([id, amount]) => ({
    ...CATEGORIES.find(c => c.id === id), amount, pct: (amount / currentExpenses) * 100,
  }));

  const barColor = budgetUsed > 90
    ? "linear-gradient(90deg,#FF6B6B,#FF4444)"
    : budgetUsed > 70
      ? "linear-gradient(90deg,#FF9F43,#FF7F00)"
      : "linear-gradient(90deg,#1DD1A1,#00A085)";

  const statusText = budgetUsed > 100
    ? "⚠️ Over budget!"
    : budgetUsed > 70
      ? "Getting close to limit"
      : "On track 🎉";

  return (
    <div className="fade-in" style={{ maxWidth: 640 }}>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, marginBottom: 6 }}>Budget Planner</h2>
      <p style={{ color: "#6B7494", fontSize: 14, marginBottom: 28 }}>Set and track your monthly spending limit</p>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 13, color: "#6B7494", marginBottom: 4 }}>Monthly Budget</div>
            {editing ? (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input className="input-field" type="number" value={inputVal} onChange={e => setInputVal(e.target.value)} style={{ width: 160 }} />
                <button className="btn-primary" style={{ padding: "8px 14px" }} onClick={() => {
                  const v = parseFloat(inputVal);
                  if (v > 0) setMonthlyBudget(v);
                  setEditing(false);
                }}>Save</button>
                <button onClick={() => setEditing(false)}
                  style={{ background: "none", border: "1px solid #252A3A", color: "#6B7494", padding: "8px 14px", borderRadius: 10, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                  Cancel
                </button>
              </div>
            ) : (
              <div style={{ fontSize: 28, fontWeight: 700, color: "#E8EAF0" }}>{formatINRFull(monthlyBudget)}</div>
            )}
          </div>
          {!editing && (
            <button className="btn-primary" style={{ padding: "8px 16px" }} onClick={() => { setInputVal(monthlyBudget); setEditing(true); }}>
              ✏️ Edit
            </button>
          )}
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: "#6B7494" }}>
              Spent: <strong style={{ color: "#FF6B6B" }}>{formatINRFull(currentExpenses)}</strong>
            </span>
            <span style={{ fontSize: 13, color: "#6B7494" }}>
              Remaining: <strong style={{ color: budgetUsed > 100 ? "#FF6B6B" : "#1DD1A1" }}>{formatINRFull(remaining)}</strong>
            </span>
          </div>
          <div style={{ height: 12, borderRadius: 6, background: "#1E2436", overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 6, width: `${Math.min(budgetUsed, 100)}%`, background: barColor, transition: "width 0.6s ease" }} />
          </div>
          <div style={{ textAlign: "center", marginTop: 10, fontSize: 13, color: budgetUsed > 90 ? "#FF6B6B" : "#6B7494", fontWeight: 600 }}>
            {Math.round(budgetUsed)}% of budget used — {statusText}
          </div>
        </div>
      </div>

      {/* Per-category */}
      <div className="card">
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Spending by Category</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {breakdown.map(cat => (
            <div key={cat.id} style={{ background: "#1A1D28", borderRadius: 10, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: "#D0D6E8", display: "flex", gap: 6, alignItems: "center" }}>
                  {cat.icon} {cat.label}
                </span>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: cat.color }}>{formatINR(cat.amount)}</span>
                  <span style={{ fontSize: 11, color: "#4A5068" }}> spent</span>
                </div>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: "#1E2436", overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 3, width: `${cat.pct}%`, background: cat.color, transition: "width 0.6s ease" }} />
              </div>
              <div style={{ fontSize: 11, color: "#4A5068", marginTop: 4 }}>
                {cat.pct.toFixed(1)}% of total monthly spending
              </div>
            </div>
          ))}
          {breakdown.length === 0 && (
            <div style={{ textAlign: "center", padding: 30, color: "#4A5068" }}>No expenses this month</div>
          )}
        </div>
      </div>
    </div>
  );
}
