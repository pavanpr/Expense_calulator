import React, { useState, useEffect } from 'react';
import { formatINR } from './utils.js';
import * as apiService from './services/apiService.js';
import Sidebar from './components/Sidebar.jsx';
import Dashboard from './components/Dashboard.jsx';
import AddEntry from './components/AddEntry.jsx';
import Transactions from './components/Transactions.jsx';
import Reports from './components/Reports.jsx';
import Budget from './components/Budget.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

const CURRENT_MONTH = getCurrentMonth();

export default function App() {
  const [transactions, setTransactions]   = useState([]);
  const [view, setView]                   = useState('dashboard');
  const [monthlyBudget, setMonthlyBudget] = useState(60000);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [isOnline, setIsOnline]           = useState(navigator.onLine);
  const [editingId, setEditingId]         = useState(null);
  const [theme, setTheme]                 = useState(() => localStorage.getItem('ec-theme') || 'dark');

  // Apply theme to root element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ec-theme', theme);
  }, [theme]);

  useEffect(() => {
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
      setTransactions(prev => { const u = [...prev, newTx]; apiService.offlineFallback.saveTransactions(u); return u; });
    } catch {
      setTransactions(prev => { const u = [...prev, { ...tx, id: Date.now() }]; apiService.offlineFallback.saveTransactions(u); return u; });
    }
  };

  const deleteTransaction = async (id) => {
    setTransactions(prev => { const u = prev.filter(t => t.id !== id); apiService.offlineFallback.saveTransactions(u); return u; });
    try { await apiService.deleteTransaction(id); } catch (err) { console.error('Delete failed:', err); }
  };

  const updateTransaction = async (id, updatedTx) => {
    try {
      await apiService.updateTransaction(id, updatedTx);
    } catch (err) {
      console.error('Update failed:', err);
    } finally {
      setTransactions(prev => { const u = prev.map(t => t.id === id ? { ...updatedTx, id } : t); apiService.offlineFallback.saveTransactions(u); return u; });
      setEditingId(null);
    }
  };

  const updateBudget = async (newBudget) => {
    setMonthlyBudget(newBudget);
    try { await apiService.setBudget(CURRENT_MONTH, newBudget); } catch (err) { console.error('Budget update failed:', err); }
  };

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  const statusBarVisible = loading || error || !isOnline;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)', fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Status Bar ── */}
      {statusBarVisible && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
          padding: '10px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontSize: 13,
          background: loading ? 'var(--sky-muted)' : error ? 'var(--rose-muted)' : 'var(--amber-muted)',
          borderBottom: `1px solid ${loading ? 'var(--sky)' : error ? 'var(--rose)' : 'var(--amber)'}`,
          color: loading ? 'var(--sky)' : error ? 'var(--rose)' : 'var(--amber)',
        }}>
          <span>
            {loading && '⏳ Loading your data…'}
            {error   && `⚠️ ${error}`}
            {!isOnline && !loading && !error && '📡 Offline — changes sync when online'}
          </span>
          {error && (
            <button onClick={loadData} style={{
              background: 'var(--rose)', color: '#fff', border: 'none',
              padding: '4px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12,
            }}>Retry</button>
          )}
        </div>
      )}

      {/* ── Sidebar ── */}
      <Sidebar
        view={view}
        setView={setView}
        budgetUsed={budgetUsed}
        monthlyBudget={monthlyBudget}
        formatINR={formatINR}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* ── Main Content ── */}
      <div style={{
        flex: 1,
        padding: '28px 32px',
        overflowY: 'auto',
        marginTop: statusBarVisible ? 44 : 0,
      }}>
        <ErrorBoundary>
          {view === 'dashboard' && (
            <Dashboard
              transactions={transactions}
              currentMonthStr={CURRENT_MONTH}
              monthlyBudget={monthlyBudget}
              setView={setView}
            />
          )}
          {view === 'add' && <AddEntry onAdd={addTransaction} />}
          {view === 'transactions' && (
            <Transactions
              transactions={transactions}
              onDelete={deleteTransaction}
              onEdit={updateTransaction}
              editingId={editingId}
              setEditingId={setEditingId}
            />
          )}
          {view === 'reports' && (
            <Reports
              transactions={transactions}
              currentMonthStr={CURRENT_MONTH}
              monthlyBudget={monthlyBudget}
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
  );
}
