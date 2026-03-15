import React, { useState, useMemo, useEffect } from 'react';
import { CATEGORIES, MONTHS } from '../constants.js';
import { formatINR, formatINRFull } from '../utils.js';

export default function Transactions({
  transactions,
  onDelete,
  onEdit,
  editingId,
  setEditingId,
  initialCategoryFilter = null,
  onClearCategoryFilter,
}) {
  const [filterMonth,    setFilterMonth]    = useState('all');
  const [filterCategory, setFilterCategory] = useState(initialCategoryFilter || 'all');
  const [filterType,     setFilterType]     = useState('all');
  const [sortKey,        setSortKey]        = useState('date-desc');
  const [editForm,       setEditForm]       = useState({});

  // Sync when the pie-chart filter changes (e.g. user clicks a different category without leaving the view)
  useEffect(() => {
    if (initialCategoryFilter) {
      setFilterCategory(initialCategoryFilter);
    }
  }, [initialCategoryFilter]);

  const uniqueMonths = [...new Set(transactions.map(t => t.date.slice(0, 7)))].sort().reverse();

  const filtered = useMemo(() => {
    const [sortBy, sortDir] = sortKey.split('-');
    return transactions.filter(t => {
      const monthMatch = filterMonth    === 'all' || t.date.startsWith(filterMonth);
      const catMatch   = filterCategory === 'all' || t.category === filterCategory;
      const typeMatch  = filterType     === 'all' || t.type === filterType;
      return monthMatch && catMatch && typeMatch;
    }).sort((a, b) => {
      if (sortBy === 'date')   return sortDir === 'desc' ? b.date.localeCompare(a.date)   : a.date.localeCompare(b.date);
      if (sortBy === 'amount') return sortDir === 'desc' ? b.amount - a.amount             : a.amount - b.amount;
      return 0;
    });
  }, [transactions, filterMonth, filterCategory, filterType, sortKey]);

  const totalExp = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const totalInc = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);

  const activeCatInfo = CATEGORIES.find(c => c.id === filterCategory);

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, marginBottom: 4 }}>All Transactions</h2>
          <p style={{ color: '#6B7494', fontSize: 14 }}>{filtered.length} entries found</p>
        </div>
        {filterCategory !== 'all' && activeCatInfo && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: `${activeCatInfo.color}18`, border: `1px solid ${activeCatInfo.color}44`, borderRadius: 10 }}>
            <span style={{ fontSize: 14 }}>{activeCatInfo.icon}</span>
            <span style={{ fontSize: 13, color: activeCatInfo.color, fontWeight: 600 }}>{activeCatInfo.label}</span>
            <button
              onClick={() => {
                setFilterCategory('all');
                if (onClearCategoryFilter) onClearCategoryFilter();
              }}
              style={{ background: 'none', border: 'none', color: activeCatInfo.color, cursor: 'pointer', fontSize: 14, padding: '0 2px', lineHeight: 1 }}
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <select className="input-field" style={{ width: 'auto' }} value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
          <option value="all">All Months</option>
          {uniqueMonths.map(m => (
            <option key={m} value={m}>{MONTHS[parseInt(m.split('-')[1]) - 1]} {m.split('-')[0]}</option>
          ))}
        </select>
        <select className="input-field" style={{ width: 'auto' }} value={filterCategory} onChange={e => { setFilterCategory(e.target.value); if (onClearCategoryFilter && e.target.value === 'all') onClearCategoryFilter(); }}>
          <option value="all">All Categories</option>
          {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
        </select>
        <select className="input-field" style={{ width: 'auto' }} value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="all">All Types</option>
          <option value="expense">Expenses</option>
          <option value="income">Income</option>
        </select>
        <select className="input-field" style={{ width: 'auto' }} value={sortKey} onChange={e => setSortKey(e.target.value)}>
          <option value="date-desc">Newest First</option>
          <option value="date-asc">Oldest First</option>
          <option value="amount-desc">Highest Amount</option>
          <option value="amount-asc">Lowest Amount</option>
        </select>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Expenses', value: totalExp,            color: '#C85A54' },
          { label: 'Total Income',   value: totalInc,            color: '#6BA69D' },
          { label: 'Net',            value: totalInc - totalExp, color: totalInc - totalExp >= 0 ? '#6B8CAE' : '#C85A54' },
        ].map((s, i) => (
          <div key={i} style={{ background: '#1A1D28', border: '1px solid #252A3A', borderRadius: 12, padding: '14px 18px' }}>
            <div style={{ fontSize: 11, color: '#4A5068', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{formatINR(Math.abs(s.value))}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '100px 1fr 140px 130px 80px 80px',
          padding: '12px 20px', borderBottom: '1px solid #1E2436',
          fontSize: 11, color: '#4A5068', fontWeight: 600, letterSpacing: '0.5px',
        }}>
          <span>DATE</span><span>DESCRIPTION</span><span>CATEGORY</span>
          <span style={{ textAlign: 'right' }}>AMOUNT</span>
          <span style={{ textAlign: 'center' }}>TYPE</span>
          <span style={{ textAlign: 'center' }}>ACTIONS</span>
        </div>
        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {filtered.map(t => {
            const cat = CATEGORIES.find(c => c.id === t.category) || {};
            const isEditing = editingId === t.id;
            const currentForm = editForm[t.id] || t;

            return (
              <div key={t.id}>
                {isEditing ? (
                  <div style={{
                    display: 'grid', gridTemplateColumns: '100px 1fr 140px 130px 80px 80px',
                    padding: '12px 20px', borderBottom: '1px solid #12151E', alignItems: 'center',
                    background: '#1A1D28',
                  }}>
                    <input type="date" value={currentForm.date}
                      onChange={e => setEditForm(p => ({ ...p, [t.id]: { ...currentForm, date: e.target.value } }))}
                      style={{ fontSize: 12, padding: '4px 8px', borderRadius: 6, background: '#0D0F14', border: '1px solid #252A3A', color: '#D0D6E8' }} />
                    <input type="text" value={currentForm.description}
                      onChange={e => setEditForm(p => ({ ...p, [t.id]: { ...currentForm, description: e.target.value } }))}
                      style={{ fontSize: 13, padding: '4px 8px', borderRadius: 6, background: '#0D0F14', border: '1px solid #252A3A', color: '#D0D6E8' }} />
                    <select value={currentForm.category}
                      onChange={e => setEditForm(p => ({ ...p, [t.id]: { ...currentForm, category: e.target.value } }))}
                      style={{ fontSize: 12, padding: '4px 8px', borderRadius: 6, background: '#0D0F14', border: '1px solid #252A3A', color: '#D0D6E8' }}>
                      {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                    </select>
                    <input type="number" value={currentForm.amount}
                      onChange={e => setEditForm(p => ({ ...p, [t.id]: { ...currentForm, amount: parseFloat(e.target.value) || 0 } }))}
                      style={{ fontSize: 12, padding: '4px 8px', borderRadius: 6, background: '#0D0F14', border: '1px solid #252A3A', color: '#D0D6E8', textAlign: 'right' }} />
                    <select value={currentForm.type}
                      onChange={e => setEditForm(p => ({ ...p, [t.id]: { ...currentForm, type: e.target.value } }))}
                      style={{ fontSize: 12, padding: '4px 8px', borderRadius: 6, background: '#0D0F14', border: '1px solid #252A3A', color: '#D0D6E8' }}>
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                      <button onClick={() => onEdit(t.id, currentForm)} title="Save"
                        style={{ background: '#6BA69D', border: 'none', color: 'white', cursor: 'pointer', fontSize: 14, padding: '4px 8px', borderRadius: 6, fontWeight: 700 }}>✓</button>
                      <button onClick={() => { setEditingId(null); setEditForm(p => { const c = { ...p }; delete c[t.id]; return c; }); }} title="Cancel"
                        style={{ background: '#C85A54', border: 'none', color: 'white', cursor: 'pointer', fontSize: 14, padding: '4px 8px', borderRadius: 6, fontWeight: 700 }}>✕</button>
                    </div>
                  </div>
                ) : (
                  <div className="tx-row" style={{
                    display: 'grid', gridTemplateColumns: '100px 1fr 140px 130px 80px 80px',
                    padding: '12px 20px', borderBottom: '1px solid #12151E', alignItems: 'center',
                  }}>
                    <span style={{ fontSize: 12, color: '#4A5068' }}>{t.date}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: `${cat.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                        {cat.icon}
                      </div>
                      <span style={{ fontSize: 13, color: '#D0D6E8', fontWeight: 500 }}>{t.description}</span>
                    </div>
                    <span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: `${cat.color}22`, color: cat.color }}>
                        {cat.label}
                      </span>
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: t.type === 'income' ? '#6BA69D' : '#C85A54', textAlign: 'right' }}>
                      {t.type === 'income' ? '+' : '−'}{formatINRFull(t.amount)}
                    </span>
                    <span style={{ textAlign: 'center' }}>
                      <span style={{ display: 'inline-flex', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: t.type === 'income' ? '#6BA69D22' : '#C85A5422', color: t.type === 'income' ? '#6BA69D' : '#C85A54' }}>
                        {t.type}
                      </span>
                    </span>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                      <button onClick={() => { setEditingId(t.id); setEditForm(p => ({ ...p, [t.id]: t })); }} title="Edit"
                        style={{ background: 'none', border: 'none', color: '#7D6C89', cursor: 'pointer', fontSize: 16, padding: '4px 6px', borderRadius: 4, transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.target.style.color = '#8B7B97'; e.target.style.background = 'rgba(125,108,137,0.1)'; }}
                        onMouseLeave={e => { e.target.style.color = '#7D6C89'; e.target.style.background = 'none'; }}>✎</button>
                      <button onClick={() => onDelete(t.id)} title="Delete"
                        style={{ background: 'none', border: 'none', color: '#3A3F55', cursor: 'pointer', fontSize: 18, padding: '4px 6px', borderRadius: 4, transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.target.style.color = '#C85A54'; e.target.style.background = 'rgba(200,90,84,0.1)'; }}
                        onMouseLeave={e => { e.target.style.color = '#3A3F55'; e.target.style.background = 'none'; }}>×</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: '#4A5068' }}>No transactions found</div>
          )}
        </div>
      </div>
    </div>
  );
}
