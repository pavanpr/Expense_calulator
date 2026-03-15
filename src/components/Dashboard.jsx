import React, { useState, useMemo, useEffect, useRef } from 'react';
import { CATEGORIES, MONTHS } from '../constants.js';
import { formatINR, formatINRFull } from '../utils.js';
import { generateSpendingInsights } from '../services/insightsService.js';

// ─── helpers ────────────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatMonthLabel(monthStr) {
  const [year, month] = monthStr.split('-');
  return `${MONTHS[parseInt(month) - 1]} ${year}`;
}

// ─── SVG Donut / Pie Chart ───────────────────────────────────────────────────
function DonutChart({ data, total, onSliceClick, activeCategory }) {
  const SIZE = 220;
  const cx = SIZE / 2, cy = SIZE / 2;
  const R_OUTER = 88, R_INNER = 52;
  const [hovered, setHovered] = useState(null);

  if (!data.length || total === 0) {
    return (
      <div style={{ width: SIZE, height: SIZE, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4A5068', fontSize: 13 }}>
        No expense data
      </div>
    );
  }

  let cumAngle = -Math.PI / 2;
  const slices = data.map(item => {
    const pct = item.amount / total;
    const angle = pct * 2 * Math.PI;
    const startAngle = cumAngle;
    cumAngle += angle;
    return { ...item, pct, angle, startAngle, endAngle: cumAngle };
  });

  const arcPath = (startAngle, endAngle, rOuter, rInner, explode = 0) => {
    const midAngle = (startAngle + endAngle) / 2;
    const dx = Math.cos(midAngle) * explode;
    const dy = Math.sin(midAngle) * explode;
    const x1 = cx + dx + rOuter * Math.cos(startAngle);
    const y1 = cy + dy + rOuter * Math.sin(startAngle);
    const x2 = cx + dx + rOuter * Math.cos(endAngle);
    const y2 = cy + dy + rOuter * Math.sin(endAngle);
    const x3 = cx + dx + rInner * Math.cos(endAngle);
    const y3 = cy + dy + rInner * Math.sin(endAngle);
    const x4 = cx + dx + rInner * Math.cos(startAngle);
    const y4 = cy + dy + rInner * Math.sin(startAngle);
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
    return `M ${x1} ${y1} A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${rInner} ${rInner} 0 ${largeArc} 0 ${x4} ${y4} Z`;
  };

  // label outside for slices > 8%
  const labelPos = (startAngle, endAngle, r = R_OUTER + 16) => {
    const mid = (startAngle + endAngle) / 2;
    return [cx + r * Math.cos(mid), cy + r * Math.sin(mid)];
  };

  const activeSlice = slices.find(s => s.id === activeCategory);
  const hoveredSlice = slices.find(s => s.id === hovered);
  const displaySlice = hoveredSlice || activeSlice;

  return (
    <div style={{ position: 'relative', width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} style={{ overflow: 'visible' }}>
        <defs>
          {slices.map(s => (
            <filter key={`shadow-${s.id}`} id={`shadow-${s.id}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor={s.color} floodOpacity="0.5" />
            </filter>
          ))}
        </defs>

        {slices.map(s => {
          const isActive = s.id === activeCategory;
          const isHovered = s.id === hovered;
          const explode = isActive ? 8 : isHovered ? 5 : 0;
          return (
            <path
              key={s.id}
              d={arcPath(s.startAngle, s.endAngle, R_OUTER, R_INNER, explode)}
              fill={s.color}
              opacity={activeCategory && !isActive ? 0.35 : 1}
              filter={isActive || isHovered ? `url(#shadow-${s.id})` : undefined}
              style={{ cursor: 'pointer', transition: 'all 0.25s ease' }}
              onClick={() => onSliceClick(isActive ? null : s.id)}
              onMouseEnter={() => setHovered(s.id)}
              onMouseLeave={() => setHovered(null)}
            />
          );
        })}

        {/* Percentage labels */}
        {slices.map(s => {
          if (s.pct < 0.07) return null;
          const [lx, ly] = labelPos(s.startAngle, s.endAngle, R_OUTER * 0.72 + R_INNER * 0.28);
          return (
            <text key={`lbl-${s.id}`} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
              fill="white" fontSize={s.pct > 0.15 ? 11 : 9} fontWeight="700" fontFamily="DM Sans, sans-serif"
              style={{ pointerEvents: 'none' }}>
              {Math.round(s.pct * 100)}%
            </text>
          );
        })}
      </svg>

      {/* Centre label */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center', pointerEvents: 'none',
        transition: 'all 0.2s ease',
      }}>
        {displaySlice ? (
          <>
            <div style={{ fontSize: 10, color: '#6B7494', fontWeight: 600, letterSpacing: 1, marginBottom: 3 }}>
              {displaySlice.label?.toUpperCase() || displaySlice.id.toUpperCase()}
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: displaySlice.color }}>
              {formatINR(displaySlice.amount)}
            </div>
            <div style={{ fontSize: 10, color: '#6B7494', marginTop: 2 }}>
              {Math.round(displaySlice.pct * 100)}%
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 10, color: '#6B7494', fontWeight: 600, letterSpacing: 1, marginBottom: 3 }}>TOTAL</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#E8EAF0' }}>{formatINR(total)}</div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Animated Number ──────────────────────────────────────────────────────────
function AnimatedNumber({ value, format = v => v, duration = 600 }) {
  const [display, setDisplay] = useState(value);
  const start = useRef(value);
  const startTime = useRef(null);
  const raf = useRef(null);

  useEffect(() => {
    start.current = display;
    startTime.current = null;
    const animate = (ts) => {
      if (!startTime.current) startTime.current = ts;
      const progress = Math.min((ts - startTime.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start.current + (value - start.current) * eased);
      if (progress < 1) raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf.current);
  }, [value]);

  return <>{format(display)}</>;
}

// ─── Sparkline ───────────────────────────────────────────────────────────────
function Sparkline({ data, color, width = 80, height = 32 }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - (v / max) * height * 0.9;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" opacity="0.8" />
      <circle cx={pts.split(' ').pop().split(',')[0]} cy={pts.split(' ').pop().split(',')[1]}
        r="3" fill={color} />
    </svg>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function Dashboard({ transactions, currentMonthStr, monthlyBudget, setView, onCategoryFilter }) {
  const [trendFilter, setTrendFilter] = useState('all');
  const [activePieCategory, setActivePieCategory] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  // ── current month base stats ────────────────────────────────────────────
  const currentMonthTx  = useMemo(() =>
    transactions.filter(t => t.date.startsWith(currentMonthStr)), [transactions, currentMonthStr]);
  const currentExpenses = useMemo(() =>
    currentMonthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0), [currentMonthTx]);
  const currentIncome   = useMemo(() =>
    currentMonthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0), [currentMonthTx]);
  const savings    = currentIncome - currentExpenses;
  const budgetUsed = (currentExpenses / monthlyBudget) * 100;

  // ── category breakdown (current month) ─────────────────────────────────
  const categoryBreakdown = useMemo(() => {
    const map = {};
    currentMonthTx.filter(t => t.type === 'expense').forEach(t => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return Object.entries(map).map(([id, amount]) => {
      const cat = CATEGORIES.find(c => c.id === id) || {};
      return { ...cat, id, amount, pct: currentExpenses > 0 ? (amount / currentExpenses) * 100 : 0 };
    }).sort((a, b) => b.amount - a.amount);
  }, [currentMonthTx, currentExpenses]);

  // ── trend filter window ──────────────────────────────────────────────────
  const filteredTx = useMemo(() => {
    if (trendFilter === 'all') return transactions;
    return transactions.filter(t => t.date.startsWith(trendFilter));
  }, [transactions, trendFilter]);

  const filteredExpenses = useMemo(() =>
    filteredTx.filter(t => t.type === 'expense'), [filteredTx]);

  // ── monthly trend ───────────────────────────────────────────────────────
  const monthlyTrend = useMemo(() => {
    const map = {};
    transactions.forEach(t => {
      const m = t.date.slice(0, 7);
      if (!map[m]) map[m] = { income: 0, expense: 0 };
      map[m][t.type] += t.amount;
    });
    return Object.entries(map).sort().map(([month, data]) => ({ month, ...data }));
  }, [transactions]);

  const uniqueMonths = useMemo(() =>
    [...new Set(transactions.map(t => t.date.slice(0, 7)))].sort().reverse(), [transactions]);

  // ── detailed analysis stats (respect trendFilter) ───────────────────────
  const totalSpent  = filteredExpenses.reduce((s, t) => s + t.amount, 0);
  const avgTx       = filteredExpenses.length ? totalSpent / filteredExpenses.length : 0;
  const maxAmt      = filteredExpenses.length ? Math.max(...filteredExpenses.map(t => t.amount)) : 0;
  const maxTx       = filteredExpenses.find(t => t.amount === maxAmt);
  const topCatEntry = useMemo(() => {
    const map = {};
    filteredExpenses.forEach(t => { map[t.category] = (map[t.category] || 0) + t.amount; });
    const top = Object.entries(map).sort((a, b) => b[1] - a[1])[0];
    if (!top) return null;
    return { ...(CATEGORIES.find(c => c.id === top[0]) || {}), id: top[0], amount: top[1] };
  }, [filteredExpenses]);

  // ── key metrics (always current month) ─────────────────────────────────
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const dailyAvg    = currentExpenses / daysInMonth;
  const savingsRate = currentIncome > 0 ? Math.round((savings / currentIncome) * 100) : 0;
  const fixedCosts  = currentMonthTx
    .filter(t => t.type === 'expense' && ['housing', 'utilities', 'savings'].includes(t.category))
    .reduce((s, t) => s + t.amount, 0);

  // sparkline data per category (last 30 days grouped by category)
  const spendingSparklines = useMemo(() => {
    const result = {};
    categoryBreakdown.forEach(cat => {
      const sorted = transactions
        .filter(t => t.type === 'expense' && t.category === cat.id)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-10)
        .map(t => t.amount);
      result[cat.id] = sorted;
    });
    return result;
  }, [transactions, categoryBreakdown]);

  // ── AI insights (filtered transactions) ────────────────────────────────
  const catMapForAI = useMemo(() => {
    const map = {};
    filteredExpenses.forEach(t => { map[t.category] = (map[t.category] || 0) + t.amount; });
    return map;
  }, [filteredExpenses]);

  useEffect(() => {
    if (filteredExpenses.length === 0) { setAiInsights(null); return; }
    setLoadingInsights(true);
    generateSpendingInsights(filteredTx, catMapForAI, monthlyTrend, currentMonthStr)
      .then(ins => { setAiInsights(ins); setLoadingInsights(false); })
      .catch(() => setLoadingInsights(false));
  }, [filteredTx, catMapForAI, monthlyTrend, currentMonthStr]);

  // ── pie click → jump to filtered transactions ──────────────────────────
  const handlePieClick = (categoryId) => {
    setActivePieCategory(categoryId);
    if (categoryId && onCategoryFilter) {
      onCategoryFilter(categoryId);
    }
  };

  const maxTrendVal = Math.max(...monthlyTrend.map(m => Math.max(m.income, m.expense)), 1);

  return (
    <div className="fade-in" style={{ maxWidth: 1100 }}>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, color: '#E8EAF0', margin: 0 }}>
            Dashboard &amp; Reports
          </h1>
          <p style={{ color: '#6B7494', fontSize: 14, marginTop: 4 }}>
            {getGreeting()} — {formatMonthLabel(currentMonthStr)}
          </p>
        </div>
        <select
          className="input-field"
          style={{ width: 'auto', fontSize: 13 }}
          value={trendFilter}
          onChange={e => setTrendFilter(e.target.value)}
        >
          <option value="all">All Time</option>
          {uniqueMonths.map(m => (
            <option key={m} value={m}>{MONTHS[parseInt(m.split('-')[1]) - 1]} {m.split('-')[0]}</option>
          ))}
        </select>
      </div>

      {/* ── Hero KPI strip ──────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Income',   value: currentIncome,   color: '#1DD1A1', icon: '↑', sub: 'This month', spark: monthlyTrend.map(m => m.income) },
          { label: 'Total Expenses', value: currentExpenses, color: '#FF6B6B', icon: '↓', sub: 'This month', spark: monthlyTrend.map(m => m.expense) },
          { label: 'Net Savings',    value: Math.abs(savings), color: savings >= 0 ? '#54A0FF' : '#FF6B6B', icon: '◎', sub: savings >= 0 ? 'Surplus' : 'Deficit', spark: monthlyTrend.map(m => m.income - m.expense) },
          { label: 'Budget Used',    value: null, color: budgetUsed > 90 ? '#FF6B6B' : budgetUsed > 70 ? '#FF9F43' : '#1DD1A1', icon: '◉', sub: `of ${formatINR(monthlyBudget)}`, pct: budgetUsed },
        ].map((kpi, i) => (
          <div key={i} className="card" style={{
            borderTop: `3px solid ${kpi.color}`,
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: '#6B7494', fontWeight: 600, letterSpacing: '0.5px' }}>{kpi.label.toUpperCase()}</div>
              <span style={{ fontSize: 18, color: kpi.color, opacity: 0.7 }}>{kpi.icon}</span>
            </div>
            {kpi.pct !== undefined ? (
              <>
                <div style={{ fontSize: 26, fontWeight: 800, color: kpi.color, marginBottom: 4 }}>
                  {Math.round(kpi.pct)}%
                </div>
                <div style={{ height: 4, borderRadius: 2, background: '#1E2436', overflow: 'hidden', marginBottom: 6 }}>
                  <div style={{ height: '100%', width: `${Math.min(kpi.pct, 100)}%`, background: kpi.color, borderRadius: 2, transition: 'width 0.6s ease' }} />
                </div>
              </>
            ) : (
              <div style={{ fontSize: 26, fontWeight: 800, color: kpi.color, marginBottom: 4 }}>
                {formatINR(kpi.value)}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 11, color: '#4A5068' }}>{kpi.sub}</div>
              {kpi.spark && <Sparkline data={kpi.spark} color={kpi.color} />}
            </div>
          </div>
        ))}
      </div>

      {/* ── Pie Chart + Top Categories ──────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* Pie */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Spending by Category</div>
            {activePieCategory && (
              <button onClick={() => { setActivePieCategory(null); if (onCategoryFilter) onCategoryFilter(null); }}
                style={{ fontSize: 11, color: '#6C63FF', background: '#6C63FF22', border: '1px solid #6C63FF44', borderRadius: 6, padding: '3px 10px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                ✕ Clear filter
              </button>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '8px 0' }}>
            <DonutChart
              data={categoryBreakdown}
              total={currentExpenses}
              onSliceClick={handlePieClick}
              activeCategory={activePieCategory}
            />
          </div>
          {activePieCategory && (
            <div style={{ marginTop: 12, padding: '10px 14px', background: '#6C63FF11', borderRadius: 10, border: '1px solid #6C63FF33', fontSize: 12, color: '#6B7494', textAlign: 'center' }}>
              Click <strong style={{ color: '#6C63FF' }}>View All Transactions</strong> to see filtered results ↓
              <button
                onClick={() => { if (onCategoryFilter) onCategoryFilter(activePieCategory); setView('transactions'); }}
                style={{ display: 'block', margin: '6px auto 0', fontSize: 12, color: '#6C63FF', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", textDecoration: 'underline' }}>
                Go to Transactions →
              </button>
            </div>
          )}
        </div>

        {/* Top Categories */}
        <div className="card">
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Top Categories</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {categoryBreakdown.slice(0, 6).map(cat => (
              <div
                key={cat.id}
                onClick={() => handlePieClick(activePieCategory === cat.id ? null : cat.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                  borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s',
                  background: activePieCategory === cat.id ? `${cat.color}18` : '#1A1D28',
                  border: `1px solid ${activePieCategory === cat.id ? cat.color + '55' : 'transparent'}`,
                }}
              >
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${cat.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>
                  {cat.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: '#D0D6E8', fontWeight: 500 }}>{cat.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: cat.color }}>{formatINR(cat.amount)}</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: '#1E2436', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${cat.pct}%`, background: `linear-gradient(90deg, ${cat.color}88, ${cat.color})`, borderRadius: 2, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
                <div style={{ fontSize: 11, color: '#4A5068', minWidth: 32, textAlign: 'right' }}>
                  {cat.pct.toFixed(0)}%
                </div>
                <Sparkline data={spendingSparklines[cat.id] || []} color={cat.color} width={50} height={24} />
              </div>
            ))}
            {categoryBreakdown.length === 0 && (
              <div style={{ textAlign: 'center', padding: 30, color: '#4A5068', fontSize: 13 }}>No expenses this month</div>
            )}
          </div>
        </div>
      </div>

      {/* ── Detailed Analysis (4 stat cards) ───────────────────────── */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#6B7494', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 14 }}>
          Detailed Analysis {trendFilter !== 'all' && `· ${MONTHS[parseInt(trendFilter.split('-')[1]) - 1]} ${trendFilter.split('-')[0]}`}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
          {[
            { label: 'Total Spent',         value: formatINRFull(totalSpent), color: '#FF6B6B', sub: `${filteredExpenses.length} transactions` },
            { label: 'Avg Transaction',     value: formatINR(avgTx),         color: '#FF9F43', sub: 'per expense' },
            { label: 'Largest Expense',     value: formatINR(maxAmt),        color: '#54A0FF', sub: maxTx?.description?.slice(0, 20) || '—' },
            { label: 'Top Category',        value: topCatEntry ? `${topCatEntry.icon} ${topCatEntry.label}` : '—', color: '#1DD1A1', sub: topCatEntry ? formatINR(topCatEntry.amount) : '' },
          ].map((s, i) => (
            <div key={i} className="card" style={{ borderLeft: `3px solid ${s.color}`, padding: '16px 18px' }}>
              <div style={{ fontSize: 11, color: '#4A5068', fontWeight: 500, letterSpacing: '0.5px', marginBottom: 8 }}>{s.label.toUpperCase()}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#4A5068', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Month-over-Month Trend chart ────────────────────────────── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Month-over-Month Trends</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 140, paddingBottom: 4, overflowX: 'auto' }}>
          {monthlyTrend.map((m, i) => {
            const prev   = monthlyTrend[i - 1];
            const diff   = prev ? m.expense - prev.expense : 0;
            const diffPct = prev && prev.expense ? ((diff / prev.expense) * 100).toFixed(1) : null;
            const isCurrent = m.month === currentMonthStr;
            return (
              <div key={m.month} style={{ flex: '0 0 auto', minWidth: 52, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                {diffPct !== null && (
                  <div style={{ fontSize: 9, fontWeight: 700, color: diff > 0 ? '#FF6B6B' : '#1DD1A1' }}>
                    {diff > 0 ? '▲' : '▼'}{Math.abs(diffPct)}%
                  </div>
                )}
                <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 110 }}>
                  {/* income bar */}
                  <div
                    title={`Income: ${formatINRFull(m.income)}`}
                    style={{
                      width: 20,
                      height: `${Math.max((m.income / maxTrendVal) * 100, 2)}%`,
                      background: isCurrent ? 'linear-gradient(180deg,#1DD1A1,#00A085)' : 'linear-gradient(180deg,#1DD1A155,#1DD1A133)',
                      borderRadius: '4px 4px 0 0',
                      cursor: 'pointer',
                      transition: 'height 0.4s ease',
                    }}
                  />
                  {/* expense bar */}
                  <div
                    title={`Expense: ${formatINRFull(m.expense)}`}
                    style={{
                      width: 20,
                      height: `${Math.max((m.expense / maxTrendVal) * 100, 2)}%`,
                      background: isCurrent ? 'linear-gradient(180deg,#FF6B6B,#E55555)' : 'linear-gradient(180deg,#FF6B6B55,#FF6B6B33)',
                      borderRadius: '4px 4px 0 0',
                      cursor: 'pointer',
                      transition: 'height 0.4s ease',
                    }}
                  />
                </div>
                <div style={{
                  fontSize: 10, color: isCurrent ? '#E8EAF0' : '#4A5068',
                  fontWeight: isCurrent ? 700 : 400, whiteSpace: 'nowrap',
                }}>
                  {MONTHS[parseInt(m.month.split('-')[1]) - 1]}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 20, marginTop: 12, paddingTop: 12, borderTop: '1px solid #1E2436' }}>
          {[['#1DD1A1', 'Income'], ['#FF6B6B', 'Expenses']].map(([color, label]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#6B7494' }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} /> {label}
            </div>
          ))}
          <div style={{ marginLeft: 'auto', fontSize: 11, color: '#4A5068' }}>
            Brighter bars = current month
          </div>
        </div>
      </div>

      {/* ── Key Metrics ─────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Savings Rate',     value: `${savingsRate}%`,         color: savingsRate >= 0 ? '#1DD1A1' : '#FF6B6B', desc: 'of monthly income',   icon: '💰' },
          { label: 'Daily Average',    value: formatINR(dailyAvg),       color: '#FF9F43',                                  desc: 'per day this month', icon: '📅' },
          { label: 'Fixed Costs',      value: formatINR(fixedCosts),     color: '#5F27CD',                                  desc: 'housing + utilities', icon: '🏠' },
        ].map((s, i) => (
          <div key={i} style={{ background: '#161923', border: `1px solid ${s.color}33`, borderRadius: 16, padding: '20px 22px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 13, color: '#D0D6E8', fontWeight: 600, marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontSize: 11, color: '#4A5068' }}>{s.desc}</div>
            <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: `${s.color}0A` }} />
          </div>
        ))}
      </div>

      {/* ── Recent Transactions ─────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Recent Transactions</div>
          <button className="btn-primary" style={{ padding: '6px 14px', fontSize: 13 }} onClick={() => setView('transactions')}>
            View All
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {transactions
            .filter(t => t.date.startsWith(currentMonthStr))
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 6)
            .map(t => {
              const cat = CATEGORIES.find(c => c.id === t.category) || {};
              return (
                <div key={t.id} className="tx-row" style={{ display: 'flex', alignItems: 'center', padding: '10px', gap: 12, borderRadius: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${cat.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                    {cat.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#D0D6E8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.description}</div>
                    <div style={{ fontSize: 11, color: '#4A5068', marginTop: 1 }}>{t.date} · {cat.label}</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: t.type === 'income' ? '#1DD1A1' : '#FF6B6B', flexShrink: 0 }}>
                    {t.type === 'income' ? '+' : '−'}{formatINRFull(t.amount)}
                  </div>
                </div>
              );
            })}
          {transactions.filter(t => t.date.startsWith(currentMonthStr)).length === 0 && (
            <div style={{ textAlign: 'center', padding: 30, color: '#4A5068', fontSize: 13 }}>No transactions this month yet</div>
          )}
        </div>
      </div>

      {/* ── AI Insights ─────────────────────────────────────────────── */}
      {(aiInsights || loadingInsights) && (
        <div className="card" style={{ background: '#6C63FF08', border: '1px solid #6C63FF33' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
            <span>🤖 AI-Powered Insights</span>
            {loadingInsights && <span style={{ fontSize: 12, color: '#6B7494' }}>(Analysing…)</span>}
            {aiInsights?.aiGenerated && (
              <span style={{ fontSize: 11, color: '#6C63FF', background: '#6C63FF22', padding: '2px 8px', borderRadius: 4 }}>
                Gemini AI
              </span>
            )}
          </div>

          {loadingInsights && (
            <div style={{ textAlign: 'center', padding: 30, color: '#6B7494', fontSize: 13 }}>
              ⏳ Generating insights from your spending data…
            </div>
          )}

          {aiInsights && !loadingInsights && (
            <>
              {aiInsights.insights?.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 16 }}>
                  {aiInsights.insights.map((ins, i) => {
                    const bg  = ins.severity === 'warning' ? '#FF6B6B22' : ins.severity === 'positive' ? '#1DD1A122' : '#54A0FF22';
                    const bdr = ins.severity === 'warning' ? '#FF6B6B'   : ins.severity === 'positive' ? '#1DD1A1'   : '#54A0FF';
                    return (
                      <div key={i} style={{ background: bg, border: `1px solid ${bdr}`, borderRadius: 10, padding: 14 }}>
                        <div style={{ fontSize: 22, marginBottom: 6 }}>{ins.emoji}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#D0D6E8', marginBottom: 4 }}>{ins.title}</div>
                        <div style={{ fontSize: 12, color: '#6B7494', lineHeight: 1.5 }}>{ins.description}</div>
                      </div>
                    );
                  })}
                </div>
              )}
              {aiInsights.recommendations?.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#D0D6E8', marginBottom: 10 }}>Recommendations</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {aiInsights.recommendations.map((rec, i) => (
                      <div key={i} style={{ background: '#1A1D28', padding: '10px 14px', borderRadius: 8, fontSize: 12, color: '#6B7494', borderLeft: '3px solid #6C63FF' }}>
                        ✓ {rec}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {aiInsights.savingsPotential && (
                <div style={{ background: '#1DD1A122', border: '1px solid #1DD1A1', borderRadius: 10, padding: 12, fontSize: 12, color: '#1DD1A1' }}>
                  💡 <strong>Savings Potential:</strong> {aiInsights.savingsPotential}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
