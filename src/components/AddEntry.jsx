import React, { useState } from 'react';
import { CATEGORIES } from '../constants.js';
import { analyzeTransactionWithAI, extractAmountFromDescription } from '../services/aiService.js';

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

const DEFAULT_FORM = {
  description: '', amount: '', category: 'food', type: 'expense',
  date: new Date().toISOString().split('T')[0],
};

export default function AddEntry({ onAdd }) {
  const [form,               setForm]               = useState(DEFAULT_FORM);
  const [success,            setSuccess]            = useState(false);
  const [aiAnalysis,         setAiAnalysis]         = useState(null);
  const [aiLoading,          setAiLoading]          = useState(false);
  const [useAIMode,          setUseAIMode]          = useState(true);
  const [amountError,        setAmountError]        = useState(null);
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
    const extractedAmount = extractAmountFromDescription(form.description);

    if (!form.amount && !extractedAmount) {
      setAmountError("No amount found! Mention it in description (e.g. 'lunch 70') or enter manually.");
      return;
    }

    if (extractedAmount && form.amount && Math.abs(extractedAmount - parseFloat(form.amount)) > 0.01) {
      setAmountConfirmation({ extractedAmount, formAmount: parseFloat(form.amount) });
      return;
    }

    const finalAmount = form.amount ? parseFloat(form.amount) : extractedAmount;
    setAiLoading(true);
    try {
      const analysis = await analyzeTransactionWithAI(form.description, finalAmount);
      setAiAnalysis(analysis);
      if (!form.amount && extractedAmount) setForm(f => ({ ...f, amount: extractedAmount.toString() }));
    } catch {
      setAmountError('Analysis failed. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const applyAIAnalysis = () => {
    if (aiAnalysis) {
      setForm(f => ({ ...f, category: aiAnalysis.category, type: aiAnalysis.type }));
      setAiAnalysis(null);
      setUseAIMode(false);
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: 560 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, margin: 0, color: 'var(--text-primary)' }}>Add Entry</h2>
        <button onClick={() => setUseAIMode(!useAIMode)} style={{
          background: useAIMode ? 'var(--violet)' : 'var(--bg-elevated)',
          border: '1px solid var(--violet)',
          color: useAIMode ? '#fff' : 'var(--violet)',
          padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all 0.2s',
        }}>
          🤖 {useAIMode ? 'AI Mode ON' : 'AI Mode'}
        </button>
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 26 }}>
        {useAIMode ? 'Let AI analyze and categorize your transaction' : 'Record a new income or expense'}
      </p>

      {/* Alerts */}
      {success && (
        <div style={{ background: 'var(--teal-muted)', border: '1px solid var(--teal)', borderRadius: 10, padding: '12px 16px', marginBottom: 18, color: 'var(--teal)', fontSize: 14, fontWeight: 500 }}>
          ✓ Transaction added successfully!
        </div>
      )}
      {amountError && (
        <div style={{ background: 'var(--rose-muted)', border: '1px solid var(--rose)', borderRadius: 10, padding: '12px 16px', marginBottom: 18, color: 'var(--rose)', fontSize: 14, fontWeight: 500 }}>
          ⚠️ {amountError}
        </div>
      )}

      {/* Amount mismatch */}
      {amountConfirmation && (
        <div style={{ background: 'var(--amber-muted)', border: '1px solid var(--amber)', borderRadius: 10, padding: 16, marginBottom: 18 }}>
          <div style={{ color: 'var(--amber)', fontSize: 13, fontWeight: 600, marginBottom: 10 }}>💡 Amount Mismatch</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
            Found <strong>₹{amountConfirmation.extractedAmount}</strong> in description, but you entered <strong>₹{amountConfirmation.formAmount}</strong>. Which to use?
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { setForm(f => ({ ...f, amount: amountConfirmation.extractedAmount.toString() })); setAmountConfirmation(null); }}
              style={{ flex: 1, background: 'var(--amber)', border: 'none', color: '#fff', padding: 10, borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
              From description (₹{amountConfirmation.extractedAmount})
            </button>
            <button onClick={() => setAmountConfirmation(null)}
              style={{ flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)', padding: 10, borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
              Manual entry (₹{amountConfirmation.formAmount})
            </button>
          </div>
        </div>
      )}

      {/* AI result */}
      {aiAnalysis && (
        <div style={{ background: 'var(--violet-muted)', border: '1px solid var(--violet)', borderRadius: 10, padding: 16, marginBottom: 18 }}>
          <div style={{ color: 'var(--violet)', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>🤖 AI Analysis Result</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 700, letterSpacing: '0.5px' }}>DETECTED TYPE</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: aiAnalysis.type === 'expense' ? 'var(--expense)' : 'var(--income)' }}>
                {aiAnalysis.type === 'expense' ? '💸 Expense' : '💰 Income'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 700, letterSpacing: '0.5px' }}>DETECTED CATEGORY</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--violet)' }}>
                {CATEGORIES.find(c => c.id === aiAnalysis.category)?.label}
              </div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>{aiAnalysis.reason}</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={applyAIAnalysis} style={{ flex: 1, background: 'var(--violet)', border: 'none', color: '#fff', padding: 10, borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
              ✓ Apply Analysis
            </button>
            <button onClick={() => setAiAnalysis(null)} style={{ flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)', padding: 10, borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
              ✗ Decline
            </button>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 6, fontWeight: 700, letterSpacing: '0.5px' }}>DESCRIPTION</label>
          <input className="input-field" placeholder="e.g. Monthly Rent, Grocery Bill…"
            value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 6, fontWeight: 700, letterSpacing: '0.5px' }}>AMOUNT (₹)</label>
            <input className="input-field" type="number" placeholder="0.00"
              value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 6, fontWeight: 700, letterSpacing: '0.5px' }}>DATE</label>
            <input className="input-field" type="date"
              value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
        </div>

        {/* Manual type + category (only shown when AI mode off) */}
        {!useAIMode && (
          <>
            <div>
              <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 6, fontWeight: 700, letterSpacing: '0.5px' }}>ENTRY TYPE</label>
              <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: 10, padding: 3, gap: 3 }}>
                {['expense', 'income'].map(type => (
                  <button key={type} onClick={() => setForm(f => ({ ...f, type }))} style={{
                    flex: 1, padding: 8, border: 'none', borderRadius: 8, cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, transition: 'all 0.2s',
                    background: form.type === type ? (type === 'expense' ? 'var(--expense)' : 'var(--income)') : 'transparent',
                    color: form.type === type ? '#fff' : 'var(--text-muted)',
                  }}>
                    {type === 'expense' ? '💸 Expense' : '💰 Income'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 8, fontWeight: 700, letterSpacing: '0.5px' }}>CATEGORY</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                {CATEGORIES.map(cat => {
                  const { fill, bg } = catColors(cat.id);
                  const selected = form.category === cat.id;
                  return (
                    <button key={cat.id} onClick={() => setForm(f => ({ ...f, category: cat.id }))} style={{
                      background: selected ? bg : 'var(--bg-elevated)',
                      border: `1px solid ${selected ? fill : 'var(--border)'}`,
                      borderRadius: 10, padding: '10px 4px', cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                      transition: 'all 0.15s',
                    }}>
                      <span style={{ fontSize: 18 }}>{cat.icon}</span>
                      <span style={{ fontSize: 10, color: selected ? fill : 'var(--text-muted)', fontWeight: 500 }}>
                        {cat.label.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {useAIMode && !aiAnalysis ? (
          <button className="btn-primary" onClick={handleAIAnalyze} disabled={aiLoading}
            style={{ marginTop: 4, padding: 14, fontSize: 15, opacity: aiLoading ? 0.6 : 1 }}>
            {aiLoading ? '🤖 Analysing…' : '🤖 Analyse with AI'}
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
