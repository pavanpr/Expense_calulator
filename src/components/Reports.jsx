import React, { useState, useMemo, useEffect } from 'react';
import { CATEGORIES, MONTHS } from '../constants.js';
import { formatINR, formatINRFull } from '../utils.js';
import { generateSpendingInsights } from '../services/insightsService.js';

export default function Reports({ transactions, currentMonthStr, monthlyBudget }) {
  const [filterMonth, setFilterMonth] = useState("all");
  const [aiInsights, setAiInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const uniqueMonths = [...new Set(transactions.map(t => t.date.slice(0, 7)))].sort().reverse();

  const filtered = useMemo(() =>
    transactions.filter(t => filterMonth === "all" || t.date.startsWith(filterMonth)),
    [transactions, filterMonth]);

  const expenses = filtered.filter(t => t.type === "expense");
  const totalExp = expenses.reduce((s, t) => s + t.amount, 0);
  const totalInc = filtered.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const avg  = expenses.length ? totalExp / expenses.length : 0;
  const max  = expenses.length ? Math.max(...expenses.map(t => t.amount)) : 0;
  const maxTx = expenses.find(t => t.amount === max);

  const catMap = {};
  expenses.forEach(t => { catMap[t.category] = (catMap[t.category] || 0) + t.amount; });
  const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];

  const monthlyTrend = useMemo(() => {
    const map = {};
    transactions.forEach(t => {
      const m = t.date.slice(0, 7);
      if (!map[m]) map[m] = { income: 0, expense: 0 };
      map[m][t.type] += t.amount;
    });
    return Object.entries(map).sort().map(([month, data]) => ({ month, ...data }));
  }, [transactions]);

  const currentMonthTx = transactions.filter(t => t.date.startsWith(currentMonthStr));
  const currentIncome  = currentMonthTx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const currentExp     = currentMonthTx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const savings        = currentIncome - currentExp;

  const topCatInfo = topCat ? CATEGORIES.find(c => c.id === topCat[0]) : null;

  // Generate AI insights when data changes
  useEffect(() => {
    setLoadingInsights(true);
    generateSpendingInsights(filtered, catMap, monthlyTrend, currentMonthStr).then(insights => {
      setAiInsights(insights);
      setLoadingInsights(false);
    }).catch(() => {
      setLoadingInsights(false);
    });
  }, [filtered, catMap, monthlyTrend]);

  return (
    <div className="fade-in">
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, marginBottom: 6 }}>Detailed Reports</h2>
      <p style={{ color: "#6B7494", fontSize: 14, marginBottom: 24 }}>Deep analysis of your spending patterns</p>

      <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        <select className="input-field" style={{ width: "auto" }} value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
          <option value="all">All Time</option>
          {uniqueMonths.map(m => <option key={m} value={m}>{MONTHS[parseInt(m.split("-")[1]) - 1]} {m.split("-")[0]}</option>)}
        </select>
      </div>

      {/* Summary Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Spent",         value: formatINRFull(totalExp),  color: "#FF6B6B", sub: `${expenses.length} transactions` },
          { label: "Average Transaction", value: formatINR(avg),           color: "#FF9F43", sub: "per expense" },
          { label: "Largest Expense",     value: formatINR(max),           color: "#54A0FF", sub: maxTx?.description || "—" },
          { label: "Top Category",        value: topCatInfo ? `${topCatInfo.icon} ${topCatInfo.label}` : "—", color: "#1DD1A1", sub: topCat ? formatINR(topCat[1]) : "" },
        ].map((s, i) => (
          <div key={i} className="card" style={{ borderLeft: `3px solid ${s.color}` }}>
            <div style={{ fontSize: 11, color: "#4A5068", fontWeight: 500, marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#4A5068", marginTop: 4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* Category Analysis */}
        <div className="card">
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Category Analysis</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 380, overflowY: "auto" }}>
            {Object.entries(catMap).sort((a, b) => b[1] - a[1]).map(([id, amount]) => {
              const cat = CATEGORIES.find(c => c.id === id);
              const pct = (amount / totalExp) * 100;
              return (
                <div key={id} style={{ background: "#1A1D28", borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: "#D0D6E8", display: "flex", alignItems: "center", gap: 6 }}>{cat.icon} {cat.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: cat.color }}>{formatINRFull(amount)}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1, height: 6, borderRadius: 3, background: "#1E2436", overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 3, width: `${pct}%`, background: cat.color, transition: "width 0.6s ease" }} />
                    </div>
                    <span style={{ fontSize: 11, color: "#6B7494", minWidth: 36 }}>{pct.toFixed(1)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Month-over-Month */}
        <div className="card">
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Month-over-Month</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {monthlyTrend.map((m, i) => {
              const prev = monthlyTrend[i - 1];
              const diff = prev ? m.expense - prev.expense : 0;
              const pct  = prev && prev.expense ? (diff / prev.expense) * 100 : 0;
              return (
                <div key={m.month} style={{ background: "#1A1D28", borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#D0D6E8" }}>
                      {MONTHS[parseInt(m.month.split("-")[1]) - 1]} {m.month.split("-")[0]}
                    </span>
                    {prev && (
                      <span style={{ fontSize: 11, color: diff > 0 ? "#FF6B6B" : "#1DD1A1", fontWeight: 600 }}>
                        {diff > 0 ? "▲" : "▼"} {Math.abs(pct).toFixed(1)}%
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 16 }}>
                    <span style={{ fontSize: 12, color: "#1DD1A1" }}>↑ {formatINR(m.income)}</span>
                    <span style={{ fontSize: 12, color: "#FF6B6B" }}>↓ {formatINR(m.expense)}</span>
                    <span style={{ fontSize: 12, color: m.income - m.expense >= 0 ? "#54A0FF" : "#FF6B6B" }}>
                      = {formatINR(m.income - m.expense)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="card">
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Spending Insights</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {[
            { label: "Savings Rate", value: `${currentIncome > 0 ? Math.round((savings / currentIncome) * 100) : 0}%`, color: savings >= 0 ? "#1DD1A1" : "#FF6B6B", desc: "of monthly income" },
            { label: "Daily Average", value: formatINR(currentExp / 31), color: "#FF9F43", desc: "per day this month" },
            { label: "Fixed Costs",   value: formatINR(currentMonthTx.filter(t => t.type === "expense" && ["housing","utilities","savings"].includes(t.category)).reduce((s, t) => s + t.amount, 0)), color: "#5F27CD", desc: "housing + utilities + SIP" },
          ].map((s, i) => (
            <div key={i} style={{ background: "#1A1D28", borderRadius: 12, padding: 18, textAlign: "center", border: `1px solid ${s.color}33` }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 13, color: "#D0D6E8", fontWeight: 600, margin: "6px 0 2px" }}>{s.label}</div>
              <div style={{ fontSize: 11, color: "#4A5068" }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* AI-Powered Insights */}
      {aiInsights && (
        <div className="card" style={{ background: "#6C63FF0A", border: "1px solid #6C63FF33", marginTop: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
            <span>🤖 AI-Powered Insights</span>
            {loadingInsights && <span style={{ fontSize: 12, color: "#6B7494" }}>(Analyzing...)</span>}
            {aiInsights.aiGenerated && <span style={{ fontSize: 11, color: "#6C63FF", background: "#6C63FF22", padding: "2px 8px", borderRadius: 4 }}>By Gemini AI</span>}
          </div>

          {aiInsights.insights && aiInsights.insights.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#D0D6E8", marginBottom: 12 }}>Key Findings:</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 12 }}>
                {aiInsights.insights.map((insight, i) => {
                  const bgColor = insight.severity === 'warning' ? '#FF6B6B22' : insight.severity === 'positive' ? '#1DD1A122' : '#54A0FF22';
                  const borderColor = insight.severity === 'warning' ? '#FF6B6B' : insight.severity === 'positive' ? '#1DD1A1' : '#54A0FF';

                  return (
                    <div key={i} style={{ background: bgColor, border: `1px solid ${borderColor}`, borderRadius: 10, padding: 14 }}>
                      <div style={{ fontSize: 24, marginBottom: 8 }}>{insight.emoji}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#D0D6E8", marginBottom: 6 }}>{insight.title}</div>
                      <div style={{ fontSize: 12, color: "#6B7494", lineHeight: 1.5 }}>{insight.description}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {aiInsights.recommendations && aiInsights.recommendations.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#D0D6E8", marginBottom: 12 }}>Recommendations:</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {aiInsights.recommendations.map((rec, i) => (
                  <div key={i} style={{ background: "#1A1D28", padding: 12, borderRadius: 8, fontSize: 12, color: "#6B7494", borderLeft: "3px solid #6C63FF" }}>
                    ✓ {rec}
                  </div>
                ))}
              </div>
            </div>
          )}

          {aiInsights.savingsPotential && (
            <div style={{ background: "#1DD1A122", border: "1px solid #1DD1A1", borderRadius: 10, padding: 12, fontSize: 12, color: "#1DD1A1" }}>
              💡 <strong>Savings Potential:</strong> {aiInsights.savingsPotential}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
