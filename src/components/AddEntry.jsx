import React, { useState } from 'react';
import { CATEGORIES } from '../constants.js';

const DEFAULT_FORM = {
  description: "", amount: "", category: "food", type: "expense",
  date: new Date().toISOString().split("T")[0],
};

export default function AddEntry({ onAdd }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [success, setSuccess] = useState(false);

  const handleAdd = () => {
    if (!form.description.trim() || !form.amount) return;
    onAdd({ ...form, id: Date.now(), amount: parseFloat(form.amount) });
    setForm(DEFAULT_FORM);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2500);
  };

  return (
    <div className="fade-in" style={{ maxWidth: 560 }}>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, marginBottom: 6 }}>Add Entry</h2>
      <p style={{ color: "#6B7494", fontSize: 14, marginBottom: 28 }}>Record a new income or expense</p>

      {success && (
        <div style={{ background: "#1DD1A122", border: "1px solid #1DD1A1", borderRadius: 10, padding: "12px 16px", marginBottom: 20, color: "#1DD1A1", fontSize: 14, fontWeight: 500 }}>
          ✓ Transaction added successfully!
        </div>
      )}

      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
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

        <button className="btn-primary" onClick={handleAdd} style={{ marginTop: 4, padding: 14, fontSize: 15 }}>
          ＋ Add Transaction
        </button>
      </div>
    </div>
  );
}
