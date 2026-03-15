import React, { useState, useMemo, useEffect } from 'react';
import { CATEGORIES, MONTHS } from '../constants.js';
import { formatINR, formatINRFull } from '../utils.js';
import { generateSpendingInsights } from '../services/insightsService.js';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function Dashboard({ transactions, currentMonthStr, monthlyBudget, setView, themeConfig }) {
  const [filterMonth, setFilterMonth] = useState("all");
  const [aiInsights, setAiInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  const uniqueMonths = [...new Set(transactions.map(t => t.date.slice(0, 7)))].sort().reverse();

  const currentMonthTx  = transactions.filter(t => t.date.startsWith(currentMonthStr) && t.type === "expense");
  const currentIncome  = transactions.filter(t => t.date.startsWith(currentMonthStr) && t.type === "income").reduce((s, t) => s + t.amount, 0);
  const currentExpenses = currentMonthTx.reduce((s, t) => s + t.amount, 0);
  const budgetUsed = (currentExpenses / monthlyBudget) * 100;
  const savings = currentIncome - currentExpenses;

  // Filtered data for reports
  const filtered = useMemo(() =>
    transactions.filter(t => filterMonth === "all" || t.date.startsWith(filterMonth)),
    [transactions, filterMonth]);

  const expenses = filtered.filter(t => t.type === "expense");
  const totalExp = expenses.reduce((s, t) => s + t.amount, 0);
  const avg = expenses.length ? totalExp / expenses.length : 0;
  const max = expenses.length ? Math.max(...expenses.map(t => t.amount)) : 0;
  const maxTx = expenses.find(t => t.amount === max);

  // Category breakdown for pie chart
  const categoryBreakdown = useMemo(() => {
    if (currentExpenses === 0) return [];
    const map = {};
    currentMonthTx.forEach(t => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return Object.entries(map)
      .map(([id, amount]) => {
        const cat = CATEGORIES.find(c => c.id === id);
        if (!cat) return null;
        return { ...cat, amount, pct: (amount / currentExpenses) * 100 };
      })
      .filter(Boolean)
      .sort((a, b) => b.amount - a.amount);
  }, [transactions, currentMonthStr, currentExpenses]);

  // Category map for reports section
  const catMap = useMemo(() => {
    const map = {};
    expenses.forEach(t => { map[t.category] = (map[t.category] || 0) + t.amount; });
    return map;
  }, [filtered]);

  const topCat = Object.entries(catMap).length > 0 ? Object.entries(catMap).sort((a, b) => b[1] - a[1])[0] : null;
  const topCatInfo = topCat ? CATEGORIES.find(c => c.id === topCat[0]) : null;

  // Monthly trend
  const monthlyTrend = useMemo(() => {
    const map = {};
    transactions.forEach(t => {
      const m = t.date.slice(0, 7);
      if (!map[m]) map[m] = { income: 0, expense: 0 };
      map[m][t.type] += t.amount;
    });
    return Object.entries(map).sort().map(([month, data]) => ({ month, ...data }));
  }, [transactions]);

  // Pie chart data
  const pieData = useMemo(() => 
    categoryBreakdown.map(cat => ({
      name: cat.label,
      value: cat.amount,
      fill: cat.color
    })),
    [categoryBreakdown]
  );

  // AI Insights
  useEffect(() => {
    if (filtered.length === 0) return;
    setLoadingInsights(true);
    generateSpendingInsights(filtered, catMap, monthlyTrend, currentMonthStr)
      .then(insights => {
        setAiInsights(insights);
        setLoadingInsights(false);
      })
      .catch(() => {
        setLoadingInsights(false);
      });
  }, [filtered, catMap, monthlyTrend, currentMonthStr]);

  const KPIs = [
    { label: "Total Expenses", value: formatINR(currentExpenses), color: themeConfig.expense, icon: "↓", sub: "This month" },
    { label: "Net Savings", value: formatINR(Math.abs(savings)), color: savings >= 0 ? themeConfig.neutral : themeConfig.expense, icon: "◎", sub: savings >= 0 ? "Surplus" : "Deficit" },
    { label: "Budget Used", value: `${Math.round(budgetUsed)}%`, color: budgetUsed > 90 ? themeConfig.expense : themeConfig.warning, icon: "◉", sub: `of ${formatINR(monthlyBudget)}` },
  ];

  return (
    <div className="fade-in">
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, marginBottom: 6, color: themeConfig.text }}>Dashboard & Reports</h2>
      <p style={{ color: themeConfig.muted, fontSize: 14, marginBottom: 20 }}>Complete overview of your expenses</p>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 28 }}>
        {KPIs.map((s, i) => (
          <div key={i} style={{ background: themeConfig.card, border: `1px solid ${themeConfig.border}`, borderRadius: 16, padding: "20px" }}>
            <div style={{ fontSize: 11, color: themeConfig.muted, marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Pie Chart + Category Breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        {/* Pie Chart */}
        <div style={{ background: themeConfig.card, border: `1px solid ${themeConfig.border}`, borderRadius: 16, padding: "20px" }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: themeConfig.text }}>Spending by Category</div>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ value }) => {
                    const total = pieData.reduce((s, d) => s + d.value, 0);
                    const pct = ((value / total) * 100).toFixed(0);
                    return `${pct}%`;
                  }}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  onClick={(entry) => {
                    const categoryName = entry.name;
                    const catId = categoryBreakdown.find(c => c.label === categoryName)?.id;
                    if (catId) {
                      // Navigate to transactions view and pass category filter
                      sessionStorage.setItem('filterCategory', catId);
                      setView('transactions');
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} style={{ cursor: 'pointer' }} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => formatINRFull(value)}
                  contentStyle={{ background: themeConfig.input, border: `1px solid ${themeConfig.border}`, borderRadius: 8, color: themeConfig.text }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: "center", padding: 40, color: themeConfig.muted, height: 280, display: "flex", alignItems: "center", justifyContent: "center" }}>
              No expense data for this month
            </div>
          )}
        </div>

        {/* Category Breakdown */}
        <div style={{ background: themeConfig.card, border: `1px solid ${themeConfig.border}`, borderRadius: 16, padding: "20px" }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: themeConfig.text }}>Top Categories</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {categoryBreakdown.slice(0, 5).map(cat => (
              <div 
                key={cat.id}
                onClick={() => {
                  sessionStorage.setItem('filterCategory', cat.id);
                  setView('transactions');
                }}
                style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 13, color: themeConfig.text, display: "flex", alignItems: "center", gap: 6 }}>
                    {cat.icon} {cat.label}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: cat.color }}>{formatINR(cat.amount)}</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: themeConfig.border, overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 3, width: `${cat.pct}%`, background: cat.color, transition: "width 0.6s ease" }} />
                </div>
              </div>
            ))}
            {categoryBreakdown.length === 0 && (
              <div style={{ textAlign: "center", padding: 30, color: themeConfig.muted }}>No expenses recorded</div>
            )}
          </div>
        </div>
      </div>

      {/* Reports Section */}
      <div style={{ marginTop: 28 }}>
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, marginBottom: 16, color: themeConfig.text }}>Detailed Analysis</h3>

        {/* Summary Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
          {[
            { label: "Total Spent", value: formatINRFull(totalExp), color: themeConfig.expense, sub: `${expenses.length} transactions` },
            { label: "Average", value: formatINR(avg), color: themeConfig.warning, sub: "per expense" },
            { label: "Largest", value: formatINR(max), color: themeConfig.neutral, sub: maxTx?.description || "—" },
            { label: "Top Category", value: topCatInfo ? `${topCatInfo.icon} ${topCatInfo.label}` : "—", color: themeConfig.income, sub: topCat && topCat[1] ? formatINR(topCat[1]) : "" },
          ].map((s, i) => (
            <div key={i} style={{ background: themeConfig.card, border: `1px solid ${s.color}33`, borderRadius: 12, padding: "16px", borderLeft: `3px solid ${s.color}` }}>
              <div style={{ fontSize: 11, color: themeConfig.muted, fontWeight: 500, marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: themeConfig.muted, marginTop: 4 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Month-over-Month */}
        <div style={{ background: themeConfig.card, border: `1px solid ${themeConfig.border}`, borderRadius: 16, padding: "20px", marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: themeConfig.text }}>Month-over-Month Trends</div>
            <select className="input-field" style={{ width: 160 }} value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
              <option value="all">All Time</option>
              {uniqueMonths.map(m => <option key={m} value={m}>{MONTHS[parseInt(m.split("-")[1]) - 1]} {m.split("-")[0]}</option>)}
            </select>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {monthlyTrend.length > 0 ? monthlyTrend.map((m, i) => {
              const prev = i > 0 ? monthlyTrend[i - 1] : null;
              const diff = prev && prev.expense ? m.expense - prev.expense : 0;
              const pct = prev && prev.expense ? (diff / prev.expense) * 100 : 0;
              return (
                <div key={m.month} style={{ background: themeConfig.hover, borderRadius: 10, padding: "12px 14px", border: `1px solid ${themeConfig.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: themeConfig.text }}>
                      {MONTHS[parseInt(m.month.split("-")[1]) - 1]} {m.month.split("-")[0]}
                    </span>
                    {prev && (
                      <span style={{ fontSize: 11, color: diff > 0 ? themeConfig.expense : themeConfig.income, fontWeight: 600 }}>
                        {diff > 0 ? "▲" : "▼"} {Math.abs(pct).toFixed(1)}%
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 16 }}>
                    <span style={{ fontSize: 12, color: themeConfig.expense }}>↓ {formatINR(m.expense)}</span>
                    <span style={{ fontSize: 12, color: m.income - m.expense >= 0 ? themeConfig.neutral : themeConfig.expense }}>
                      = {formatINR(m.income - m.expense)}
                    </span>
                  </div>
                </div>
              );
            }) : (
              <div style={{ textAlign: "center", padding: 20, color: themeConfig.muted, fontSize: 13 }}>No transaction data available</div>
            )}
          </div>
        </div>

        {/* Key Metrics */}
        <div style={{ background: themeConfig.card, border: `1px solid ${themeConfig.border}`, borderRadius: 16, padding: "20px", marginBottom: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: themeConfig.text }}>Key Metrics</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {[
              { label: "Savings Rate", value: `${currentIncome > 0 ? Math.round((savings / currentIncome) * 100) : 0}%`, color: themeConfig.income, desc: "of monthly income" },
              { label: "Daily Average", value: formatINR(currentExpenses / new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()), color: themeConfig.warning, desc: "per day this month" },
              { label: "Avg Transaction", value: formatINR(currentMonthTx.length ? currentExpenses / currentMonthTx.length : 0), color: themeConfig.neutral, desc: "per expense" },
            ].map((s, i) => (
              <div key={i} style={{ background: themeConfig.hover, borderRadius: 12, padding: 18, textAlign: "center", border: `1px solid ${s.color}33` }}>
                <div style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 13, color: themeConfig.text, fontWeight: 600, margin: "6px 0 2px" }}>{s.label}</div>
                <div style={{ fontSize: 11, color: themeConfig.muted }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insights */}
        {(aiInsights || loadingInsights) && (
          <div style={{ background: `${themeConfig.warning}0A`, border: `1px solid ${themeConfig.warning}33`, borderRadius: 16, padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15, fontWeight: 600, marginBottom: 16, color: themeConfig.text }}>
              <span>🤖 AI-Powered Insights</span>
              {loadingInsights && <span style={{ fontSize: 12, color: themeConfig.muted }}>(Analysing...)</span>}
              {aiInsights?.aiGenerated && <span style={{ fontSize: 11, color: themeConfig.warning, background: `${themeConfig.warning}22`, padding: "2px 8px", borderRadius: 4 }}>By Gemini AI</span>}
            </div>

            {loadingInsights && (
              <div style={{ textAlign: "center", padding: 30, color: themeConfig.muted, fontSize: 13 }}>
                ⏳ Generating insights from your spending data...
              </div>
            )}

            {aiInsights && !loadingInsights && (
              <>
                {aiInsights.insights && aiInsights.insights.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: themeConfig.text, marginBottom: 12 }}>Key Findings:</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 12 }}>
                      {aiInsights.insights.map((insight, i) => {
                        const bgColor = insight.severity === 'warning' ? `${themeConfig.expense}22` : insight.severity === 'positive' ? `${themeConfig.income}22` : `${themeConfig.neutral}22`;
                        const borderColor = insight.severity === 'warning' ? themeConfig.expense : insight.severity === 'positive' ? themeConfig.income : themeConfig.neutral;
                        return (
                          <div key={i} style={{ background: bgColor, border: `1px solid ${borderColor}`, borderRadius: 10, padding: 14 }}>
                            <div style={{ fontSize: 24, marginBottom: 8 }}>{insight.emoji}</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: themeConfig.text, marginBottom: 6 }}>{insight.title}</div>
                            <div style={{ fontSize: 12, color: themeConfig.muted, lineHeight: 1.5 }}>{insight.description}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {aiInsights.recommendations && aiInsights.recommendations.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: themeConfig.text, marginBottom: 12 }}>Recommendations:</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {aiInsights.recommendations.map((rec, i) => (
                        <div key={i} style={{ background: themeConfig.hover, padding: 12, borderRadius: 8, fontSize: 12, color: themeConfig.muted, borderLeft: `3px solid ${themeConfig.warning}` }}>
                          ✓ {rec}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {aiInsights.savingsPotential && (
                  <div style={{ background: `${themeConfig.income}22`, border: `1px solid ${themeConfig.income}`, borderRadius: 10, padding: 12, fontSize: 12, color: themeConfig.income }}>
                    💡 <strong>Savings Potential:</strong> {aiInsights.savingsPotential}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
