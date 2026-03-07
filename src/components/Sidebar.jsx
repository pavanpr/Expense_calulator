import React from 'react';

const NAV_ITEMS = [
  { id: "dashboard",    icon: "◈", label: "Dashboard"    },
  { id: "add",          icon: "＋", label: "Add Entry"    },
  { id: "transactions", icon: "≡", label: "Transactions" },
  { id: "reports",      icon: "◎", label: "Reports"      },
  { id: "budget",       icon: "◉", label: "Budget"       },
];

export default function Sidebar({ view, setView, budgetUsed, monthlyBudget, formatINR }) {
  return (
    <div style={{
      width: 220, background: "#10121A", borderRight: "1px solid #1A1D26",
      display: "flex", flexDirection: "column", padding: "24px 12px", gap: 4,
      position: "sticky", top: 0, height: "100vh",
    }}>
      <div style={{ padding: "8px 12px 24px" }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: "#E8EAF0", fontWeight: 700 }}>
          Expenses
        </div>
        <div style={{ fontSize: 12, color: "#4A5068", marginTop: 2 }}>Home Finance Tracker</div>
      </div>

      {NAV_ITEMS.map(item => (
        <button
          key={item.id}
          onClick={() => setView(item.id)}
          style={{
            background: view === item.id ? "#1E2130" : "transparent",
            border: "none", cursor: "pointer",
            padding: "10px 20px", borderRadius: 10,
            fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500,
            transition: "all 0.2s",
            color: view === item.id ? "#E8EAF0" : "#6B7494",
            borderLeft: `3px solid ${view === item.id ? "#6C63FF" : "transparent"}`,
            textAlign: "left", display: "flex", alignItems: "center", gap: 10, width: "100%",
          }}
        >
          <span style={{ fontSize: 16 }}>{item.icon}</span>
          {item.label}
        </button>
      ))}

      <div style={{
        marginTop: "auto", padding: 12,
        background: "#161923", borderRadius: 12, border: "1px solid #1E2436",
      }}>
        <div style={{ fontSize: 11, color: "#4A5068", marginBottom: 6 }}>Monthly Budget</div>
        <div style={{
          fontSize: 18, fontWeight: 700,
          color: budgetUsed > 90 ? "#FF6B6B" : budgetUsed > 70 ? "#FF9F43" : "#1DD1A1",
        }}>
          {Math.round(budgetUsed)}%
        </div>
        <div style={{ height: 6, borderRadius: 3, background: "#1E2436", overflow: "hidden", marginTop: 6 }}>
          <div style={{
            height: "100%", borderRadius: 3, transition: "width 0.6s ease",
            width: `${Math.min(budgetUsed, 100)}%`,
            background: budgetUsed > 90 ? "#FF6B6B" : budgetUsed > 70 ? "#FF9F43" : "#1DD1A1",
          }} />
        </div>
        <div style={{ fontSize: 11, color: "#4A5068", marginTop: 6 }}>of {formatINR(monthlyBudget)}</div>
      </div>
    </div>
  );
}
