import React, { useState } from 'react';
import { formatINR } from './utils.js';
import * as apiService from './services/apiService.js';
import Sidebar from './components/Sidebar.jsx';
import Dashboard from './components/Dashboard.jsx';
import AddEntry from './components/AddEntry.jsx';
import Transactions from './components/Transactions.jsx';
import Reports from './components/Reports.jsx';
import Budget from './components/Budget.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

// Theme configurations
const themes = {
  dark: {
    bg: '#0D0F14',
    text: '#E8EAF0',
    card: '#161923',
    border: '#1E2436',
    input: '#1A1D28',
    inputBorder: '#252A3A',
    hover: '#1A1D28',
    muted: '#4A5068',
    expense: '#C85A54',
    income: '#6BA69D',
    neutral: '#6B8CAE',
    warning: '#A89968',
  },
  light: {
    bg: '#FAFAF8',
    text: '#1A1A1A',
    card: '#FFFFFF',
    border: '#E8E6E1',
    input: '#F5F3F0',
    inputBorder: '#D4D0C8',
    hover: '#F0EEEB',
    muted: '#7A7A7A',
    expense: '#C85A54',
    income: '#6BA69D',
    neutral: '#6B8CAE',
    warning: '#A89968',
  },
};

// Derive current month dynamically so the app stays accurate over time
function getCurrentMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

const CURRENT_MONTH = getCurrentMonth();

export default function App() {
  const [transactions, setTransactions]   = useState([]);
  const [view, setView]                   = useState("dashboard");
  const [monthlyBudget, setMonthlyBudget] = useState(60000);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [isOnline, setIsOnline]           = useState(navigator.onLine);
  const [editingId, setEditingId]         = useState(null);
  const [theme, setTheme]                 = useState(() => localStorage.getItem('theme') || 'dark');

  // Load data from API on mount
  React.useEffect(() => {
    loadData();

    apiService.checkServerHealth().then(healthy => {
      setIsOnline(healthy);
    });

    // Use named handlers so removeEventListener correctly cleans them up
    const handleOnline  = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const txns = await apiService.getTransactions();
      setTransactions(txns);

      const budgets = await apiService.getBudgets();
      const currentBudget = budgets[CURRENT_MONTH]?.amount || 60000;
      setMonthlyBudget(currentBudget);

      setError(null);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load data. Using offline mode.');

      const offlineTransactions = apiService.offlineFallback.getTransactions();
      setTransactions(offlineTransactions);
    } finally {
      setLoading(false);
    }
  };

  const currentMonthTx  = transactions.filter(t => t.date.startsWith(CURRENT_MONTH));
  const currentExpenses = currentMonthTx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const budgetUsed      = (currentExpenses / monthlyBudget) * 100;

  const addTransaction = async (tx) => {
    try {
      const newTx = await apiService.addTransaction(tx);
      setTransactions(prev => {
        const updated = [...prev, newTx];
        apiService.offlineFallback.saveTransactions(updated);
        return updated;
      });
    } catch (err) {
      console.error('Failed to add transaction:', err);
      setTransactions(prev => {
        const updated = [...prev, { ...tx, id: Date.now() }];
        apiService.offlineFallback.saveTransactions(updated);
        return updated;
      });
    }
  };

  const deleteTransaction = async (id) => {
    // Optimistic update — remove locally first for snappy UX
    setTransactions(prev => {
      const updated = prev.filter(t => t.id !== id);
      apiService.offlineFallback.saveTransactions(updated);
      return updated;
    });
    try {
      await apiService.deleteTransaction(id);
    } catch (err) {
      console.error('Failed to delete transaction from server:', err);
      // Already removed locally; will sync on next reload
    }
  };

  const updateTransaction = async (id, updatedTx) => {
    try {
      await apiService.updateTransaction(id, updatedTx);
      setTransactions(prev => {
        const updated = prev.map(t => t.id === id ? { ...updatedTx, id } : t);
        apiService.offlineFallback.saveTransactions(updated);
        return updated;
      });
      setEditingId(null);
    } catch (err) {
      console.error('Failed to update transaction:', err);
      setTransactions(prev => {
        const updated = prev.map(t => t.id === id ? { ...updatedTx, id } : t);
        apiService.offlineFallback.saveTransactions(updated);
        return updated;
      });
      setEditingId(null);
    }
  };

  const updateBudget = async (newBudget) => {
    try {
      await apiService.setBudget(CURRENT_MONTH, newBudget);
      setMonthlyBudget(newBudget);
    } catch (err) {
      console.error('Failed to update budget:', err);
      // Still update locally so the UI reflects the change
      setMonthlyBudget(newBudget);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:wght@700&display=swap');
        .card { background: ${themes[theme].card}; border: 1px solid ${themes[theme].border}; border-radius: 16px; padding: 20px; }
        .btn-primary { background: linear-gradient(135deg,#7D6C89,#8B7B97); border: none; color: white; padding: 10px 20px; border-radius: 10px; cursor: pointer; font-family: 'DM Sans',sans-serif; font-weight: 600; font-size: 14px; transition: all 0.2s; }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 20px rgba(125,108,137,0.4); }
        .input-field { background: ${themes[theme].input}; border: 1px solid ${themes[theme].inputBorder}; border-radius: 10px; padding: 10px 14px; color: ${themes[theme].text}; font-family: 'DM Sans',sans-serif; font-size: 14px; width: 100%; transition: border 0.2s; }
        .input-field:focus { border-color: #7D6C89; outline: none; }
        select.input-field option { background: ${themes[theme].input}; color: ${themes[theme].text}; }
        .tx-row:hover { background: ${themes[theme].hover}; }
        .tx-row { border-radius: 10px; transition: background 0.15s; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .fade-in { animation: fadeIn 0.3s ease; }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", background: themes[theme].bg, color: themes[theme].text }}>
        {/* Status Bar */}
        {(loading || error || !isOnline) && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            padding: "12px 16px",
            background: loading ? "#6B8CAE22" : error ? "#C85A5422" : "#A8996822",
            borderBottom: `1px solid ${loading ? "#6B8CAE" : error ? "#C85A54" : "#A89968"}`,
            fontSize: 13,
            color: loading ? "#6B8CAE" : error ? "#C85A54" : "#A89968",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            zIndex: 1000,
          }}>
            <span>
              {loading && "⏳ Loading your data..."}
              {error && `⚠️ ${error}`}
              {!isOnline && !loading && !error && "📡 Offline Mode — Changes will sync when online"}
            </span>
            {error && (
              <button
                onClick={loadData}
                style={{ background: "#C85A54", color: "white", border: "none", padding: "4px 12px", borderRadius: 4, cursor: "pointer", fontSize: 12 }}
              >
                Retry
              </button>
            )}
          </div>
        )}

        <Sidebar
          view={view}
          setView={setView}
          budgetUsed={budgetUsed}
          monthlyBudget={monthlyBudget}
          formatINR={formatINR}
          theme={theme}
          toggleTheme={toggleTheme}
          themeConfig={themes[theme]}
        />

        <div style={{ flex: 1, padding: "28px 32px", overflowY: "auto", marginTop: (loading || error || !isOnline) ? 50 : 0 }}>
          <ErrorBoundary>
            {view === "dashboard" && (
              <Dashboard
                transactions={transactions}
                currentMonthStr={CURRENT_MONTH}
                monthlyBudget={monthlyBudget}
                setView={setView}
                themeConfig={themes[theme]}
              />
            )}
            {view === "add" && (
              <AddEntry onAdd={addTransaction} />
            )}
            {view === "transactions" && (
              <Transactions
                transactions={transactions}
                onDelete={deleteTransaction}
                onEdit={updateTransaction}
                editingId={editingId}
                setEditingId={setEditingId}
                themeConfig={themes[theme]}
              />
            )}
            {view === "reports" && (
              <Reports
                transactions={transactions}
                currentMonthStr={CURRENT_MONTH}
                monthlyBudget={monthlyBudget}
                themeConfig={themes[theme]}
              />
            )}
            {view === "budget" && (
              <Budget
                transactions={transactions}
                currentMonthStr={CURRENT_MONTH}
                monthlyBudget={monthlyBudget}
                setMonthlyBudget={updateBudget}
                themeConfig={themes[theme]}
              />
            )}
          </ErrorBoundary>
        </div>
      </div>
    </>
  );
}
