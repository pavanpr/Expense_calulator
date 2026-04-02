import React, { useState, useMemo, useEffect } from 'react';
import { CATEGORIES, MONTHS } from '../constants.js';
import { formatINR, formatINRFull } from '../utils.js';
// AI insights removed — no external insights service used

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

export default function Reports({ transactions, currentMonthStr, monthlyBudget }) {
  const [filterMonth,    setFilterMonth]    = useState('all');
  // AI insights removed

  const uniqueMonths = [...new Set(transactions.map(t => t.date.slice(0, 7)))].sort().reverse();

  const filtered = useMemo(() =>
    transactions.filter(t => filterMonth === 'all' || t.date.startsWith(filterMonth)),
    [transactions, filterMonth]);

  const expenses = filtered.filter(t => t.type === 'expense');
  const totalExp = expenses.reduce((s, t) => s + t.amount, 0);
  const avg      = expenses.length ? totalExp / expenses.length : 0;
  const max      = expenses.length ? Math.max(...expenses.map(t => t.amount)) : 0;
  const maxTx    = expenses.find(t => t.amount === max);

  const catMap = useMemo(() => {
    const map = {};
    expenses.forEach(t => { map[t.category] = (map[t.category] || 0) + t.amount; });
    return map;
  }, [filtered]); // eslint-disable-line react-hooks/exhaustive-deps

  const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];

  const monthlyTrend = useMemo(() => {
    const map = {};
    transactions.forEach(t => {
      const m = t.date.slice(0, 7);
      if (!map[m]) map[m] = { expense: 0 };
      if (t.type === 'expense') map[m].expense += t.amount;
    });
    return Object.entries(map).sort().map(([month, data]) => ({ month, ...data }));
  }, [transactions]);

  const currentMonthTx = transactions.filter(t => t.date.startsWith(currentMonthStr));
  const currentExp     = currentMonthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const topCatInfo = topCat ? CATEGORIES.find(c => c.id === topCat[0]) : null;

  // AI insights removed — no background analysis

  const summaryCards = [
    { label: 'Total Spent',         value: formatINRFull(totalExp), color: 'var(--expense)', sub: `${expenses.length} transactions` },
    { label: 'Average Transaction', value: formatINR(avg),          color: 'var(--amber)',   sub: 'per expense' },
    { label: 'Largest Expense',     value: formatINR(max),          color: 'var(--sky)',     sub: maxTx?.description || '—' },
    { label: 'Top Category',        value: topCatInfo ? `${topCatInfo.icon} ${topCatInfo.label}` : '—', color: 'var(--teal)', sub: topCat ? formatINR(topCat[1]) : '' },
  ];

  const insightBorder = sev =>
    sev === 'warning'  ? 'var(--rose)' :
    sev === 'positive' ? 'var(--teal)' :
    'var(--sky)';

  const insightBg = sev =>
    sev === 'warning'  ? 'var(--rose-muted)' :
    sev === 'positive' ? 'var(--teal-muted)' :
    'var(--sky-muted)';

  return (
    <div className="fade-in">
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, marginBottom: 5, color: 'var(--text-primary)' }}>
        Detailed Reports
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 22 }}>Deep analysis of your spending patterns</p>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 22 }}>
        <select className="input-field" style={{ width: 'auto' }} value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
          <option value="all">All Time</option>
          {uniqueMonths.map(m => <option key={m} value={m}>{MONTHS[parseInt(m.split('-')[1]) - 1]} {m.split('-')[0]}</option>)}
        </select>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 22 }}>
        {summaryCards.map((s, i) => (
          <div key={i} className="card" style={{ borderLeft: `3px solid ${s.color}` }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.5px', marginBottom: 8 }}>{s.label.toUpperCase()}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>

        {/* Category Analysis */}
        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 14 }}>Category Analysis</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 360, overflowY: 'auto' }}>
            {Object.entries(catMap).sort((a, b) => b[1] - a[1]).map(([id, amount]) => {
              const cat = CATEGORIES.find(c => c.id === id);
              const { fill } = catColors(id);
              const pct = totalExp ? (amount / totalExp) * 100 : 0;
              return (
                <div key={id} style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {cat.icon} {cat.label}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: fill }}>{formatINRFull(amount)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="progress-track" style={{ flex: 1 }}>
                      <div className="progress-fill" style={{ width: `${pct}%`, background: fill }} />
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 36 }}>{pct.toFixed(1)}%</span>
                  </div>
                </div>
              );
            })}
            {Object.keys(catMap).length === 0 && (
              <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>No expense data for this period</div>
            )}
          </div>
        </div>

        {/* Month-over-Month */}
        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 14 }}>Month-over-Month</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {monthlyTrend.map((m, i) => {
              const prev = monthlyTrend[i - 1];
              const diff = prev ? m.expense - prev.expense : 0;
              const pct  = prev && prev.expense ? (diff / prev.expense) * 100 : 0;
              return (
                <div key={m.month} style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {MONTHS[parseInt(m.month.split('-')[1]) - 1]} {m.month.split('-')[0]}
                    </span>
                    {prev && (
                      <span style={{ fontSize: 11, color: diff > 0 ? 'var(--expense)' : 'var(--teal)', fontWeight: 600 }}>
                        {diff > 0 ? '▲' : '▼'} {Math.abs(pct).toFixed(1)}%
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <span style={{ fontSize: 12, color: 'var(--expense)' }}>↓ {formatINR(m.expense)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Spending Insights */}
      <div className="card" style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Spending Insights</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {[
            { label: 'Period Spent',  value: formatINRFull(currentExp), color: 'var(--expense)', desc: 'this month' },
            { label: 'Daily Average', value: formatINR(currentExp / new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()), color: 'var(--amber)', desc: 'per day this month' },
            { label: 'Fixed Costs',   value: formatINR(currentMonthTx.filter(t => t.type === 'expense' && ['housing','utilities','fuel'].includes(t.category)).reduce((s, t) => s + t.amount, 0)), color: 'var(--violet)', desc: 'housing + utilities + fuel' },
          ].map((s, i) => (
            <div key={i} style={{ background: 'var(--bg-elevated)', borderRadius: 12, padding: 18, textAlign: 'center', border: `1px solid var(--border)` }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600, margin: '6px 0 2px' }}>{s.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Insights removed */}
    </div>
  );
}
