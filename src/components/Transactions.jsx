import React, { useState, useMemo } from 'react';
import { CATEGORIES, MONTHS } from '../constants.js';
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

export default function Transactions({ transactions, onDelete, onEdit, editingId, setEditingId }) {
  const [filterMonth,    setFilterMonth]    = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType,     setFilterType]     = useState('all');
  const [sortKey,        setSortKey]        = useState('date-desc');
  const [editForm,       setEditForm]       = useState({});

  const uniqueMonths = [...new Set(transactions.map(t => t.date.slice(0, 7)))].sort().reverse();

  const filtered = useMemo(() => {
    const [sortBy, sortDir] = sortKey.split('-');
    return transactions
      .filter(t => {
        const monthMatch = filterMonth    === 'all' || t.date.startsWith(filterMonth);
        const catMatch   = filterCategory === 'all' || t.category === filterCategory;
        const typeMatch  = filterType     === 'all' || t.type === filterType;
        return monthMatch && catMatch && typeMatch;
      })
      .sort((a, b) => {
        if (sortBy === 'date')   return sortDir === 'desc' ? b.date.localeCompare(a.date)   : a.date.localeCompare(b.date);
        if (sortBy === 'amount') return sortDir === 'desc' ? b.amount - a.amount             : a.amount - b.amount;
        return 0;
      });
  }, [transactions, filterMonth, filterCategory, filterType, sortKey]);

  const totalExp = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const totalInc = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const net      = totalInc - totalExp;

  const summaryItems = [
    { label: 'Total Expenses', value: totalExp, color: 'var(--expense)' },
    { label: 'Total Income',   value: totalInc, color: 'var(--income)'  },
    { label: 'Net',            value: net,       color: net >= 0 ? 'var(--sky)' : 'var(--expense)' },
  ];

  const inputStyle = {
    fontSize: 12, padding: '5px 8px', borderRadius: 6,
    background: 'var(--bg-base)', border: '1px solid var(--border)',
    color: 'var(--text-primary)',
  };

  return (
    <div className="fade-in">
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, marginBottom: 5, color: 'var(--text-primary)' }}>
        All Transactions
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
        {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'} found
      </p>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        {[
          { value: filterMonth, setter: setFilterMonth, children: [
            <option key="_" value="all">All Months</option>,
            ...uniqueMonths.map(m => <option key={m} value={m}>{MONTHS[parseInt(m.split('-')[1]) - 1]} {m.split('-')[0]}</option>),
          ]},
          { value: filterCategory, setter: setFilterCategory, children: [
            <option key="_" value="all">All Categories</option>,
            ...CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>),
          ]},
          { value: filterType, setter: setFilterType, children: [
            <option key="_" value="all">All Types</option>,
            <option key="e" value="expense">Expenses</option>,
            <option key="i" value="income">Income</option>,
          ]},
          { value: sortKey, setter: setSortKey, children: [
            <option key="dd" value="date-desc">Newest First</option>,
            <option key="da" value="date-asc">Oldest First</option>,
            <option key="ad" value="amount-desc">Highest Amount</option>,
            <option key="aa" value="amount-asc">Lowest Amount</option>,
          ]},
        ].map((sel, i) => (
          <select key={i} className="input-field" style={{ width: 'auto' }}
            value={sel.value} onChange={e => sel.setter(e.target.value)}>
            {sel.children}
          </select>
        ))}
      </div>

      {/* Summary row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {summaryItems.map((s, i) => (
          <div key={i} style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '14px 18px',
          }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.4px', marginBottom: 5 }}>
              {s.label.toUpperCase()}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>
              {formatINR(Math.abs(s.value))}
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '100px 1fr 140px 130px 90px 80px',
          padding: '11px 20px',
          borderBottom: '1px solid var(--border)',
          fontSize: 10,
          color: 'var(--text-muted)',
          fontWeight: 700,
          letterSpacing: '0.7px',
          background: 'var(--bg-elevated)',
        }}>
          <span>DATE</span>
          <span>DESCRIPTION</span>
          <span>CATEGORY</span>
          <span style={{ textAlign: 'right' }}>AMOUNT</span>
          <span style={{ textAlign: 'center' }}>TYPE</span>
          <span style={{ textAlign: 'center' }}>ACTIONS</span>
        </div>

        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {filtered.map(t => {
            const cat       = CATEGORIES.find(c => c.id === t.category);
            const { fill, bg } = catColors(t.category);
            const isEditing = editingId === t.id;
            const currentForm = editForm[t.id] || t;

            return (
              <div key={t.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                {isEditing ? (
                  /* ── Edit row ── */
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '100px 1fr 140px 130px 90px 80px',
                    padding: '10px 20px',
                    alignItems: 'center',
                    gap: 6,
                    background: 'var(--bg-elevated)',
                  }}>
                    <input type="date" value={currentForm.date} style={inputStyle}
                      onChange={e => setEditForm(p => ({ ...p, [t.id]: { ...currentForm, date: e.target.value } }))} />
                    <input type="text" value={currentForm.description} placeholder="Description" style={inputStyle}
                      onChange={e => setEditForm(p => ({ ...p, [t.id]: { ...currentForm, description: e.target.value } }))} />
                    <select value={currentForm.category} style={inputStyle}
                      onChange={e => setEditForm(p => ({ ...p, [t.id]: { ...currentForm, category: e.target.value } }))}>
                      {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                    </select>
                    <input type="number" value={currentForm.amount} style={{ ...inputStyle, textAlign: 'right' }}
                      onChange={e => setEditForm(p => ({ ...p, [t.id]: { ...currentForm, amount: parseFloat(e.target.value) || 0 } }))} />
                    <select value={currentForm.type} style={inputStyle}
                      onChange={e => setEditForm(p => ({ ...p, [t.id]: { ...currentForm, type: e.target.value } }))}>
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                      <button onClick={() => onEdit(t.id, currentForm)} title="Save"
                        style={{ background: 'var(--teal)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 13, padding: '4px 8px', borderRadius: 6, fontWeight: 700 }}>
                        ✓
                      </button>
                      <button onClick={() => { setEditingId(null); setEditForm(p => { const c = { ...p }; delete c[t.id]; return c; }); }} title="Cancel"
                        style={{ background: 'var(--rose)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 13, padding: '4px 8px', borderRadius: 6, fontWeight: 700 }}>
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── View row ── */
                  <div className="tx-row" style={{
                    display: 'grid',
                    gridTemplateColumns: '100px 1fr 140px 130px 90px 80px',
                    padding: '11px 20px',
                    alignItems: 'center',
                  }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.date}</span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                        {cat.icon}
                      </div>
                      {/* description — explicit strong color so it's readable in both themes */}
                      <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {t.description}
                      </span>
                    </div>

                    <span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: bg, color: fill }}>
                        {cat.label}
                      </span>
                    </span>

                    <span style={{ fontSize: 14, fontWeight: 700, color: t.type === 'income' ? 'var(--income)' : 'var(--expense)', textAlign: 'right' }}>
                      {t.type === 'income' ? '+' : '−'}{formatINRFull(t.amount)}
                    </span>

                    <span style={{ textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', padding: '3px 10px',
                        borderRadius: 20, fontSize: 11, fontWeight: 600,
                        background: t.type === 'income' ? 'var(--teal-muted)' : 'var(--rose-muted)',
                        color:      t.type === 'income' ? 'var(--income)'      : 'var(--expense)',
                        textTransform: 'uppercase', letterSpacing: '0.4px',
                      }}>
                        {t.type}
                      </span>
                    </span>

                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                      <button
                        onClick={() => { setEditingId(t.id); setEditForm(p => ({ ...p, [t.id]: t })); }}
                        title="Edit"
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 15, padding: '4px 6px', borderRadius: 4, transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--violet)'; e.currentTarget.style.background = 'var(--violet-muted)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none'; }}
                      >✎</button>
                      <button
                        onClick={() => onDelete(t.id)}
                        title="Delete"
                        style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 17, padding: '4px 6px', borderRadius: 4, transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--rose)'; e.currentTarget.style.background = 'var(--rose-muted)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-dim)'; e.currentTarget.style.background = 'none'; }}
                      >×</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              No transactions found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
