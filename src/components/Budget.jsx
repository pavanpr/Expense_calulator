import React, { useState } from 'react';
import { CATEGORIES } from '../constants.js';
import { formatINR, formatINRFull } from '../utils.js';

const CAT_VAR = {
  housing:       { fill: 'var(--rose)',   bg: 'var(--rose-muted)'   },
  food:          { fill: 'var(--amber)',  bg: 'var(--amber-muted)'  },
  transport:     { fill: 'var(--sky)',    bg: 'var(--sky-muted)'    },
  utilities:     { fill: 'var(--violet)', bg: 'var(--violet-muted)' },
  health:        { fill: 'var(--teal)',   bg: 'var(--teal-muted)'   },
  entertainment: { fill: 'var(--rose)',   bg: 'var(--rose-muted)'   },
  shopping:      { fill: 'var(--sky)',    bg: 'var(--sky-muted)'    },
  education:     { fill: 'var(--teal)',   bg: 'var(--teal-muted)'   },
  savings:       { fill: 'var(--amber)',  bg: 'var(--amber-muted)'  },
  other:         { fill: 'var(--text-secondary)', bg: 'var(--bg-hover)' },
};
function catColors(id) { return CAT_VAR[id] || CAT_VAR.other; }

export default function Budget({ transactions, currentMonthStr, monthlyBudget, setMonthlyBudget }) {
  const [editing,  setEditing]  = useState(false);
  const [inputVal, setInputVal] = useState(monthlyBudget);

  const currentMonthTx  = transactions.filter(t => t.date.startsWith(currentMonthStr));
  const currentExpenses = currentMonthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const budgetUsed      = (currentExpenses / monthlyBudget) * 100;
  const remaining       = Math.max(monthlyBudget - currentExpenses, 0);

  const catMap = {};
  currentMonthTx.filter(t => t.type === 'expense').forEach(t => {
    catMap[t.category] = (catMap[t.category] || 0) + t.amount;
  });
  const breakdown = Object.entries(catMap)
    .sort((a, b) => b[1] - a[1])
    .map(([id, amount]) => ({
      ...CATEGORIES.find(c => c.id === id),
      amount,
      pct: currentExpenses ? (amount / currentExpenses) * 100 : 0,
    }));

  const barColor =
    budgetUsed > 90 ? 'var(--rose)' :
    budgetUsed > 70 ? 'var(--amber)' :
    'var(--teal)';

  const statusText =
    budgetUsed > 100 ? '⚠️ Over budget!' :
    budgetUsed > 70  ? 'Getting close to limit' :
    'On track 🎉';

  return (
    <div className="fade-in" style={{ maxWidth: 640 }}>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, marginBottom: 5, color: 'var(--text-primary)' }}>
        Budget Planner
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 26 }}>Set and track your monthly spending limit</p>

      {/* Budget card */}
      <div className="card" style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.5px', marginBottom: 6 }}>MONTHLY BUDGET</div>
            {editing ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input className="input-field" type="number" value={inputVal} onChange={e => setInputVal(e.target.value)} style={{ width: 160 }} />
                <button className="btn-primary" style={{ padding: '8px 14px' }} onClick={() => {
                  const v = parseFloat(inputVal);
                  if (v > 0) setMonthlyBudget(v);
                  setEditing(false);
                }}>Save</button>
                <button onClick={() => setEditing(false)} style={{
                  background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)',
                  padding: '8px 14px', borderRadius: 10, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                }}>Cancel</button>
              </div>
            ) : (
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)' }}>
                {formatINRFull(monthlyBudget)}
              </div>
            )}
          </div>
          {!editing && (
            <button className="btn-primary" style={{ padding: '8px 16px' }}
              onClick={() => { setInputVal(monthlyBudget); setEditing(true); }}>
              ✏️ Edit
            </button>
          )}
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Spent: <strong style={{ color: 'var(--expense)' }}>{formatINRFull(currentExpenses)}</strong>
            </span>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Remaining: <strong style={{ color: budgetUsed > 100 ? 'var(--expense)' : 'var(--income)' }}>{formatINRFull(remaining)}</strong>
            </span>
          </div>
          <div className="progress-track" style={{ height: 10, borderRadius: 5 }}>
            <div className="progress-fill" style={{ width: `${Math.min(budgetUsed, 100)}%`, background: barColor, height: '100%', borderRadius: 5 }} />
          </div>
          <div style={{ textAlign: 'center', marginTop: 10, fontSize: 13, color: budgetUsed > 90 ? 'var(--expense)' : 'var(--text-muted)', fontWeight: 600 }}>
            {Math.round(budgetUsed)}% used — {statusText}
          </div>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="card">
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Spending by Category</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {breakdown.map(cat => {
            const { fill } = catColors(cat.id);
            return (
              <div key={cat.id} style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', gap: 6, alignItems: 'center' }}>
                    {cat.icon} {cat.label}
                  </span>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: fill }}>{formatINR(cat.amount)}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}> spent</span>
                  </div>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${cat.pct}%`, background: fill }} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>
                  {cat.pct.toFixed(1)}% of total monthly spending
                </div>
              </div>
            );
          })}
          {breakdown.length === 0 && (
            <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>No expenses this month</div>
          )}
        </div>
      </div>
    </div>
  );
}
