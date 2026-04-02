import React, { useState, useEffect } from 'react';
import { formatINR } from './utils.js';
import * as apiService from './services/apiService.js';
import Sidebar from './components/Sidebar.jsx';
import Dashboard from './components/Dashboard.jsx';
import AddEntry from './components/AddEntry.jsx';
import Transactions from './components/Transactions.jsx';
import Budget from './components/Budget.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

function getCurrentMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

const CURRENT_MONTH = getCurrentMonth();

export default function App() {
  // Theme state: 'dark' (default) or 'light'
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));
  const [transactions, setTransactions]     = useState([]);
  const [view, setView]                     = useState('dashboard');
  const [monthlyBudget, setMonthlyBudget]   = useState(60000);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);
  const [isOnline, setIsOnline]             = useState(navigator.onLine);
  const [editingId, setEditingId]           = useState(null);
  // Category pre-filter — set by pie chart click, consumed by Transactions
  const [categoryFilter, setCategoryFilter] = useState(null);

  React.useEffect(() => {
    loadData();
    apiService.checkServerHealth().then(healthy => setIsOnline(healthy));

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
      setMonthlyBudget(budgets[CURRENT_MONTH]?.amount || 60000);
      setError(null);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load data. Using offline mode.');
      setTransactions(apiService.offlineFallback.getTransactions());
    } finally {
      setLoading(false);
    }
  };

  const currentMonthTx  = transactions.filter(t => t.date.startsWith(CURRENT_MONTH));
  const currentExpenses = currentMonthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const budgetUsed      = (currentExpenses / monthlyBudget) * 100;

  const addTransaction = async (tx) => {
    try {
      const newTx = await apiService.addTransaction(tx);
      setTransactions(prev => {
        const updated = [...prev, newTx];
        apiService.offlineFallback.saveTransactions(updated);
        return updated;
      });
    } catch {
      setTransactions(prev => {
        const updated = [...prev, { ...tx, id: Date.now() }];
        apiService.offlineFallback.saveTransactions(updated);
        return updated;
      });
    }
  };

  const deleteTransaction = async (id) => {
    setTransactions(prev => {
      const updated = prev.filter(t => t.id !== id);
      apiService.offlineFallback.saveTransactions(updated);
      return updated;
    });
    try { await apiService.deleteTransaction(id); } catch { /* local already updated */ }
  };

  const updateTransaction = async (id, updatedTx) => {
    try { await apiService.updateTransaction(id, updatedTx); } catch { /* continue */ }
    setTransactions(prev => {
      const updated = prev.map(t => t.id === id ? { ...updatedTx, id } : t);
      apiService.offlineFallback.saveTransactions(updated);
      return updated;
    });
    setEditingId(null);
  };

  const updateBudget = async (newBudget) => {
    try { await apiService.setBudget(CURRENT_MONTH, newBudget); } catch { /* continue */ }
    setMonthlyBudget(newBudget);
  };

  // Called by pie chart: set category filter then navigate to transactions
  const handleCategoryFilter = (categoryId) => {
    setCategoryFilter(categoryId);
    // Don't auto-navigate — pie click just highlights;
    // the "Go to Transactions →" link inside Dashboard does the nav.
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=Playfair+Display:wght@700&display=swap');
        .card { background: #161923; border: 1px solid #1E2436; border-radius: 16px; padding: 20px; }
        .btn-primary { background: linear-gradient(135deg,#6C63FF,#9B59B6); border: none; color: white; padding: 10px 20px; border-radius: 10px; cursor: pointer; font-family: 'DM Sans',sans-serif; font-weight: 600; font-size: 14px; transition: all 0.2s; }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 20px rgba(108,99,255,0.4); }
        .input-field { background: #1A1D28; border: 1px solid #252A3A; border-radius: 10px; padding: 10px 14px; color: #E8EAF0; font-family: 'DM Sans',sans-serif; font-size: 14px; width: 100%; transition: border 0.2s; }
        .input-field:focus { border-color: #6C63FF; outline: none; }
        select.input-field option { background: #1A1D28; }
        .tx-row:hover { background: #1A1D28; }
        .tx-row { border-radius: 10px; transition: background 0.15s; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .fade-in { animation: fadeIn 0.3s ease; }
      `}</style>

  <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", background: 'var(--bg-base)', color: 'var(--text-primary)', position: 'relative' }}>
        {/* Theme toggle button */}
        <button
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          style={{
            position: 'fixed',
            top: 18,
            right: 28,
            zIndex: 2000,
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            borderRadius: 24,
            width: 44,
            height: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            boxShadow: theme === 'light' ? '0 2px 12px #C8BFB044' : '0 2px 12px #15182044',
            cursor: 'pointer',
            transition: 'background 0.2s, color 0.2s, box-shadow 0.2s',
          }}
        >
          {theme === 'dark' ? '🌞' : '🌙'}
        </button>

        {(loading || error || !isOnline) && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0,
            padding: '12px 16px',
            background: loading ? '#54A0FF22' : error ? '#FF6B6B22' : '#F9CA2422',
            borderBottom: `1px solid ${loading ? '#54A0FF' : error ? '#FF6B6B' : '#F9CA24'}`,
            fontSize: 13,
            color: loading ? '#54A0FF' : error ? '#FF6B6B' : '#F9CA24',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1000,
          }}>
            <span>
              {loading && '⏳ Loading your data…'}
              {error && `⚠️ ${error}`}
              {!isOnline && !loading && !error && '📡 Offline Mode — Changes will sync when online'}
            </span>
            {error && (
              <button onClick={loadData} style={{ background: '#FF6B6B', color: 'white', border: 'none', padding: '4px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>
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
        />

        <div style={{ flex: 1, padding: '28px 32px', overflowY: 'auto', marginTop: (loading || error || !isOnline) ? 50 : 0 }}>
          <ErrorBoundary>
            {view === 'dashboard' && (
              <Dashboard
                transactions={transactions}
                currentMonthStr={CURRENT_MONTH}
                monthlyBudget={monthlyBudget}
                setView={(v) => {
                  setView(v);
                }}
                onCategoryFilter={handleCategoryFilter}
              />
            )}
            {view === 'add' && (
              <AddEntry onAdd={addTransaction} />
            )}
            {view === 'transactions' && (
              <Transactions
                transactions={transactions}
                onDelete={deleteTransaction}
                onEdit={updateTransaction}
                editingId={editingId}
                setEditingId={setEditingId}
                initialCategoryFilter={categoryFilter}
                onClearCategoryFilter={() => setCategoryFilter(null)}
              />
            )}
            {view === 'budget' && (
              <Budget
                transactions={transactions}
                currentMonthStr={CURRENT_MONTH}
                monthlyBudget={monthlyBudget}
                setMonthlyBudget={updateBudget}
              />
            )}
          </ErrorBoundary>
        </div>
      </div>
    </>
  );
}
