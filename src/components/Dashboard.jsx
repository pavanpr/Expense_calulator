import React from 'react';
import { CATEGORIES, MONTHS } from '../constants.js';
import { formatINR, formatINRFull } from '../utils.js';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatMonthLabel(monthStr) {
  const [year, month] = monthStr.split('-');
  return `${MONTHS[parseInt(month) - 1]} ${year}`;
}

// Map semantic roles to CSS variable names
const CAT_VAR = {
  housing:       { fill: 'var(--rose)',  bg: 'var(--rose-muted)'  },
  food:          { fill: 'var(--amber)', bg: 'var(--amber-muted)' },
  transport:     { fill: 'var(--sky)',   bg: 'var(--sky-muted)'   },
  utilities:     { fill: 'var(--violet)',bg: 'var(--violet-muted)'},
  health:        { fill: 'var(--teal)',  bg: 'var(--teal-muted)'  },
  entertainment: { fill: 'var(--rose)',  bg: 'var(--rose-muted)'  },
  shopping:      { fill: 'var(--sky)',   bg: 'var(--sky-muted)'   },
  education:     { fill: 'var(--teal)',  bg: 'var(--teal-muted)'  },
  savings:       { fill: 'var(--amber)', bg: 'var(--amber-muted)' },
  other:         { fill: 'var(--text-muted)', bg: 'var(--bg-hover)' },
};

function catColors(id) { return CAT_VAR[id] || CAT_VAR.other; }

export default function Dashboard({ transactions, currentMonthStr, monthlyBudget, setView }) {
  const currentMonthTx  = transactions.filter(t => t.date.startsWith(currentMonthStr));
  const currentExpenses = currentMonthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const currentIncome   = currentMonthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const savings    = currentIncome - currentExpenses;
  const budgetUsed = (currentExpenses / monthlyBudget) * 100;

  const categoryBreakdown = React.useMemo(() => {
    const map = {};
    currentMonthTx.filter(t => t.type === 'expense').forEach(t => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return Object.entries(map).map(([id, amount]) => {
      const cat = CATEGORIES.find(c => c.id === id);
      return { ...cat, amount, pct: currentExpenses ? (amount / currentExpenses) * 100 : 0 };
    }).sort((a, b) => b.amount - a.amount);
  }, [transactions, currentExpenses]);

  const monthlyTrend = React.useMemo(() => {
    const map = {};
    transactions.forEach(t => {
      const m = t.date.slice(0, 7);
      if (!map[m]) map[m] = { income: 0, expense: 0 };
      map[m][t.type] += t.amount;
    });
    return Object.entries(map).sort().map(([month, data]) => ({ month, ...data }));
  }, [transactions]);

  const maxTrendVal = Math.max(...monthlyTrend.map(m => Math.max(m.income, m.expense)), 1);

  const budgetColor =
    budgetUsed > 90 ? 'var(--rose)' :
    budgetUsed > 70 ? 'var(--amber)' :
    'var(--teal)';

  const kpis = [
    { label: 'Total Income',   value: formatINR(currentIncome),     color: 'var(--income)',  icon: '↑', sub: 'This month' },
    { label: 'Total Expenses', value: formatINR(currentExpenses),   color: 'var(--expense)', icon: '↓', sub: 'This month' },
    { label: 'Net Savings',    value: formatINR(Math.abs(savings)),  color: savings >= 0 ? 'var(--sky)' : 'var(--expense)', icon: '◎', sub: savings >= 0 ? 'Surplus' : 'Deficit' },
    { label: 'Budget Used',    value: `${Math.round(budgetUsed)}%`,  color: budgetColor, icon: '◉', sub: `of ${formatINR(monthlyBudget)}` },
  ];

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 27, color: 'var(--text-primary)' }}>
          {getGreeting()} 👋
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 5 }}>
          Financial overview for {formatMonthLabel(currentMonthStr)}
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 22 }}>
        {kpis.map((kpi, i) => (
          <div key={i} className="card" style={{ borderTop: `3px solid ${kpi.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.4px' }}>{kpi.label.toUpperCase()}</div>
              <span style={{ fontSize: 16, color: kpi.color }}>{kpi.icon}</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: kpi.color, margin: '10px 0 4px' }}>{kpi.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Breakdown + Trend */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 20 }}>

        {/* Category Breakdown */}
        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Spending Breakdown</div>
          {categoryBreakdown.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)', fontSize: 13 }}>No expenses this month</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {categoryBreakdown.slice(0, 6).map(cat => {
                const { fill } = catColors(cat.id);
                return (
                  <div key={cat.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {cat.icon} {cat.label}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: fill }}>{formatINR(cat.amount)}</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${cat.pct}%`, background: fill }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Monthly Trend */}
        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Monthly Trend</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 150, paddingBottom: 6 }}>
            {monthlyTrend.map((m, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 120 }}>
                  <div
                    title={`Income: ${formatINRFull(m.income)}`}
                    style={{ width: 16, height: `${Math.max((m.income / maxTrendVal) * 100, 3)}%`, background: 'var(--income)', borderRadius: '3px 3px 0 0', transition: 'height 0.4s ease' }}
                  />
                  <div
                    title={`Expense: ${formatINRFull(m.expense)}`}
                    style={{ width: 16, height: `${Math.max((m.expense / maxTrendVal) * 100, 3)}%`, background: 'var(--expense)', borderRadius: '3px 3px 0 0', transition: 'height 0.4s ease' }}
                  />
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{MONTHS[parseInt(m.month.split('-')[1]) - 1]}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
            {[['var(--income)', 'Income'], ['var(--expense)', 'Expense']].map(([color, label]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-muted)' }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Recent Transactions</div>
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
              const cat = CATEGORIES.find(c => c.id === t.category);
              const { fill, bg } = catColors(t.category);
              return (
                <div key={t.id} className="tx-row" style={{ display: 'flex', alignItems: 'center', padding: '10px', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                    {cat.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {t.description}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{t.date} · {cat.label}</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: t.type === 'income' ? 'var(--income)' : 'var(--expense)', flexShrink: 0 }}>
                    {t.type === 'income' ? '+' : '−'}{formatINRFull(t.amount)}
                  </div>
                </div>
              );
            })}
          {transactions.filter(t => t.date.startsWith(currentMonthStr)).length === 0 && (
            <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)', fontSize: 13 }}>No transactions this month yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
