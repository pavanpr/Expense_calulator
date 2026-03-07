import React from 'react';
import { CATEGORIES, MONTHS } from '../constants.js';
import { formatINR, formatINRFull } from '../utils.js';

// Derive a friendly greeting based on the time of day
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

// Format "2026-03" → "March 2026"
function formatMonthLabel(monthStr) {
  const [year, month] = monthStr.split("-");
  return `${MONTHS[parseInt(month) - 1]} ${year}`;
}

export default function Dashboard({ transactions, currentMonthStr, monthlyBudget, setView }) {
  const currentMonthTx  = transactions.filter(t => t.date.startsWith(currentMonthStr));
  const currentExpenses = currentMonthTx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const currentIncome   = currentMonthTx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const savings    = currentIncome - currentExpenses;
  const budgetUsed = (currentExpenses / monthlyBudget) * 100;

  const categoryBreakdown = React.useMemo(() => {
    const map = {};
    currentMonthTx.filter(t => t.type === "expense").forEach(t => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return Object.entries(map).map(([id, amount]) => {
      const cat = CATEGORIES.find(c => c.id === id);
      return { ...cat, amount, pct: (amount / currentExpenses) * 100 };
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

  const kpis = [
    { label: "Total Income",   value: formatINR(currentIncome),   color: "#6BA69D", icon: "↑", sub: "This month" },
    { label: "Total Expenses", value: formatINR(currentExpenses), color: "#C85A54", icon: "↓", sub: "This month" },
    { label: "Net Savings",    value: formatINR(Math.abs(savings)), color: savings >= 0 ? "#6B8CAE" : "#C85A54", icon: "◎", sub: savings >= 0 ? "Surplus" : "Deficit" },
    { label: "Budget Used",    value: `${Math.round(budgetUsed)}%`, color: budgetUsed > 90 ? "#C85A54" : "#A89968", icon: "◉", sub: `of ${formatINR(monthlyBudget)}` },
  ];

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: "#E8EAF0" }}>
          {getGreeting()} 👋
        </h1>
        <p style={{ color: "#6B7494", fontSize: 14, marginTop: 4 }}>
          Here's your financial overview for {formatMonthLabel(currentMonthStr)}
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {kpis.map((kpi, i) => (
          <div key={i} className="card" style={{ borderTop: `3px solid ${kpi.color}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ fontSize: 12, color: "#6B7494", fontWeight: 500 }}>{kpi.label}</div>
              <span style={{ fontSize: 18, color: kpi.color }}>{kpi.icon}</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: kpi.color, margin: "10px 0 4px" }}>{kpi.value}</div>
            <div style={{ fontSize: 12, color: "#4A5068" }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Category Breakdown + Trend */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        <div className="card">
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 18 }}>Spending Breakdown</div>
          {categoryBreakdown.length === 0 ? (
            <div style={{ textAlign: "center", padding: 30, color: "#4A5068", fontSize: 13 }}>No expenses recorded this month</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {categoryBreakdown.slice(0, 6).map(cat => (
                <div key={cat.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 13, color: "#B0B8D0", display: "flex", alignItems: "center", gap: 6 }}>
                      {cat.icon} {cat.label}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: cat.color }}>{formatINR(cat.amount)}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: "#1E2436", overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 3, width: `${cat.pct}%`, background: cat.color, transition: "width 0.6s ease" }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 18 }}>Monthly Trend</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 160, paddingBottom: 8 }}>
            {monthlyTrend.map((m, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 130 }}>
                  <div title={`Income: ${formatINRFull(m.income)}`}
                    style={{ width: 18, height: `${Math.max((m.income / maxTrendVal) * 100, 2)}%`, background: "linear-gradient(180deg,#6BA69D,#5A9188)", borderRadius: "4px 4px 0 0", cursor: "pointer", transition: "height 0.4s ease" }} />
                  <div title={`Expense: ${formatINRFull(m.expense)}`}
                    style={{ width: 18, height: `${Math.max((m.expense / maxTrendVal) * 100, 2)}%`, background: "linear-gradient(180deg,#C85A54,#A84A42)", borderRadius: "4px 4px 0 0", cursor: "pointer", transition: "height 0.4s ease" }} />
                </div>
                <div style={{ fontSize: 10, color: "#4A5068" }}>{MONTHS[parseInt(m.month.split("-")[1]) - 1]}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#6B7494" }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: "#6BA69D" }} /> Income
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#6B7494" }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: "#C85A54" }} /> Expense
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Recent Transactions</div>
          <button className="btn-primary" style={{ padding: "6px 14px", fontSize: 13 }} onClick={() => setView("transactions")}>
            View All
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {transactions
            .filter(t => t.date.startsWith(currentMonthStr))
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 6)
            .map(t => {
              const cat = CATEGORIES.find(c => c.id === t.category);
              return (
                <div key={t.id} className="tx-row" style={{ display: "flex", alignItems: "center", padding: "10px", gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${cat.color}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                    {cat.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#D0D6E8" }}>{t.description}</div>
                    <div style={{ fontSize: 11, color: "#4A5068", marginTop: 1 }}>{t.date} · {cat.label}</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: t.type === "income" ? "#6BA69D" : "#C85A54" }}>
                    {t.type === "income" ? "+" : "-"}{formatINRFull(t.amount)}
                  </div>
                </div>
              );
            })}
          {transactions.filter(t => t.date.startsWith(currentMonthStr)).length === 0 && (
            <div style={{ textAlign: "center", padding: 30, color: "#4A5068", fontSize: 13 }}>No transactions this month yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
