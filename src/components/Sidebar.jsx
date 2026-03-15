import React from 'react';

const NAV_ITEMS = [
  { id: 'dashboard',    icon: '◈', label: 'Dashboard'    },
  { id: 'add',          icon: '＋', label: 'Add Entry'    },
  { id: 'transactions', icon: '≡', label: 'Transactions' },
  { id: 'reports',      icon: '◎', label: 'Reports'      },
  { id: 'budget',       icon: '◉', label: 'Budget'       },
];

export default function Sidebar({ view, setView, budgetUsed, monthlyBudget, formatINR, theme, toggleTheme }) {
  const barColor =
    budgetUsed > 90 ? 'var(--rose)' :
    budgetUsed > 70 ? 'var(--amber)' :
    'var(--teal)';

  return (
    <div style={{
      width: 220,
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '22px 12px',
      gap: 2,
      position: 'sticky',
      top: 0,
      height: '100vh',
    }}>

      {/* Brand + theme toggle */}
      <div style={{ padding: '6px 10px 20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 19, color: 'var(--text-primary)', fontWeight: 700, lineHeight: 1.2 }}>
            Expenses
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>Home Finance</div>
        </div>
        <button className="theme-toggle" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
          {theme === 'dark' ? '☀' : '☽'}
        </button>
      </div>

      {/* Nav items */}
      {NAV_ITEMS.map(item => {
        const active = view === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            style={{
              background: active ? 'var(--bg-elevated)' : 'transparent',
              border: 'none',
              borderLeft: `3px solid ${active ? 'var(--violet)' : 'transparent'}`,
              borderRadius: '0 8px 8px 0',
              cursor: 'pointer',
              padding: '10px 16px',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              fontWeight: active ? 600 : 400,
              color: active ? 'var(--text-primary)' : 'var(--text-muted)',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              width: '100%',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'var(--text-secondary)'; }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <span style={{ fontSize: 15, opacity: active ? 1 : 0.7 }}>{item.icon}</span>
            {item.label}
          </button>
        );
      })}

      {/* Budget mini-widget */}
      <div style={{
        marginTop: 'auto',
        padding: 14,
        background: 'var(--bg-elevated)',
        borderRadius: 12,
        border: '1px solid var(--border-subtle)',
      }}>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.6px', marginBottom: 8 }}>
          MONTHLY BUDGET
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: barColor, lineHeight: 1 }}>
          {Math.round(budgetUsed)}%
        </div>
        <div className="progress-track" style={{ marginTop: 10, marginBottom: 8 }}>
          <div className="progress-fill" style={{ width: `${Math.min(budgetUsed, 100)}%`, background: barColor }} />
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>of {formatINR(monthlyBudget)}</div>
      </div>
    </div>
  );
}
