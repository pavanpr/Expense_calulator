import React from 'react';

const NAV_ITEMS = [
  { id: "dashboard",    icon: "◈", label: "Dashboard"    },
  { id: "add",          icon: "＋", label: "Add Entry"    },
  { id: "transactions", icon: "≡", label: "Transactions" },
  { id: "budget",       icon: "◉", label: "Budget"       },
];

export default function Sidebar({ view, setView, budgetUsed, monthlyBudget, formatINR, theme, toggleTheme, themeConfig }) {
  return (
    <div style={{
      width: 220, background: themeConfig.card, borderRight: `1px solid ${themeConfig.border}`,
      display: "flex", flexDirection: "column", padding: "24px 12px", gap: 4,
      position: "sticky", top: 0, height: "100vh",
    }}>
      <div style={{ padding: "8px 12px 24px" }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: themeConfig.text, fontWeight: 700 }}>
          Expenses
        </div>
        <div style={{ fontSize: 12, color: themeConfig.muted, marginTop: 2 }}>Home Finance Tracker</div>
      </div>

      {NAV_ITEMS.map(item => (
        <button
          key={item.id}
          onClick={() => setView(item.id)}
          style={{
            background: view === item.id ? themeConfig.hover : "transparent",
            border: "none", cursor: "pointer",
            padding: "10px 20px", borderRadius: 10,
            fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500,
            transition: "all 0.2s",
            color: view === item.id ? themeConfig.text : themeConfig.muted,
            borderLeft: `3px solid ${view === item.id ? "#7D6C89" : "transparent"}`,
            textAlign: "left", display: "flex", alignItems: "center", gap: 10, width: "100%",
          }}
        >
          <span style={{ fontSize: 16 }}>{item.icon}</span>
          {item.label}
        </button>
      ))}

      <button
        onClick={toggleTheme}
        style={{
          background: "none",
          border: `1px solid ${themeConfig.border}`,
          cursor: "pointer",
          padding: "10px 20px",
          borderRadius: 10,
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 14,
          fontWeight: 500,
          transition: "all 0.2s",
          color: themeConfig.muted,
          textAlign: "left",
          display: "flex",
          alignItems: "center",
          gap: 10,
          width: "100%",
          marginTop: "12px",
        }}
        onMouseEnter={(e) => {
          e.target.style.background = themeConfig.hover;
          e.target.style.color = themeConfig.text;
        }}
        onMouseLeave={(e) => {
          e.target.style.background = "none";
          e.target.style.color = themeConfig.muted;
        }}
      >
        <span style={{ fontSize: 16 }}>{theme === 'dark' ? '☀️' : '🌙'}</span>
        {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
      </button>

      <div style={{
        marginTop: "auto", padding: 12,
        background: themeConfig.hover, borderRadius: 12, border: `1px solid ${themeConfig.border}`,
      }}>
        <div style={{ fontSize: 11, color: themeConfig.muted, marginBottom: 6 }}>Monthly Budget</div>
        <div style={{
          fontSize: 18, fontWeight: 700,
          color: budgetUsed > 90 ? themeConfig.expense : budgetUsed > 70 ? themeConfig.warning : themeConfig.income,
        }}>
          {Math.round(budgetUsed)}%
        </div>
        <div style={{ height: 6, borderRadius: 3, background: themeConfig.border, overflow: "hidden", marginTop: 6 }}>
          <div style={{
            height: "100%", borderRadius: 3, transition: "width 0.6s ease",
            width: `${Math.min(budgetUsed, 100)}%`,
            background: budgetUsed > 90 ? themeConfig.expense : budgetUsed > 70 ? themeConfig.warning : themeConfig.income,
          }} />
        </div>
        <div style={{ fontSize: 11, color: themeConfig.muted, marginTop: 6 }}>of {formatINR(monthlyBudget)}</div>
      </div>
    </div>
  );
}
