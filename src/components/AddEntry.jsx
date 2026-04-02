import React, { useState } from 'react';
import { CATEGORIES } from '../constants.js';

const DEFAULT_FORM = {
  description: '',
  amount: '',
  category: 'food',
  type: 'expense',
  date: new Date().toISOString().split('T')[0],
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
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, marginBottom: 6, color: 'var(--text-primary)' }}>Add Entry</h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>Add a new transaction</p>

      {success && (
        <div style={{ background: 'var(--teal-muted)', border: '1px solid var(--teal)', borderRadius: 10, padding: '12px 16px', marginBottom: 18, color: 'var(--teal)', fontSize: 14, fontWeight: 500 }}>
          Transaction added successfully!
        </div>
      )}

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 6, fontWeight: 700, letterSpacing: '0.5px' }}>DESCRIPTION</label>
          <input className="input-field" placeholder="e.g. Monthly Rent, Grocery Bill…"
            value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 6, fontWeight: 700, letterSpacing: '0.5px' }}>AMOUNT</label>
            <input className="input-field" type="number" placeholder="0.00" step="0.01"
              value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 6, fontWeight: 700, letterSpacing: '0.5px' }}>DATE</label>
            <input className="input-field" type="date"
              value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
        </div>



        <div>
          <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 8, fontWeight: 700, letterSpacing: '0.5px' }}>CATEGORY</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setForm(f => ({ ...f, category: cat.id }))} style={{
                background: form.category === cat.id ? 'var(--bg-elevated)' : 'transparent',
                border: `1px solid ${form.category === cat.id ? 'var(--text-primary)' : 'var(--border)'}`,
                borderRadius: 10, padding: '10px 4px', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                transition: 'all 0.15s',
              }}>
                <span style={{ fontSize: 18 }}>{cat.icon}</span>
                <span style={{ fontSize: 10, color: form.category === cat.id ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: 500 }}>
                  {cat.label.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>
        </div>

        <button className="btn-primary" onClick={handleAdd} style={{ marginTop: 4, padding: 14, fontSize: 15 }}>
          Add Transaction
        </button>
      </div>
    </div>
  );
}
