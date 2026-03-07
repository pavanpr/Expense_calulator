import React, { useState } from 'react';
import { SAMPLE_TRANSACTIONS } from './constants.js';
import { formatINR } from './utils.js';
import * as apiService from './services/apiService.js';
import Sidebar from './components/Sidebar.jsx';
import Dashboard from './components/Dashboard.jsx';
import AddEntry from './components/AddEntry.jsx';
import Transactions from './components/Transactions.jsx';
import Reports from './components/Reports.jsx';
import Budget from './components/Budget.jsx';

const CURRENT_MONTH = "2026-03";

export default function App() {
  const [transactions, setTransactions]   = useState([]);
  const [view, setView]                   = useState("dashboard");
  const [monthlyBudget, setMonthlyBudget] = useState(60000);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [editingId, setEditingId] = useState(null);

  // Load data from API on mount
  React.useEffect(() => {
    loadData();
    
    // Check server health
    apiService.checkServerHealth().then(healthy => {
      setIsOnline(healthy);
    });

    // Listen for online/offline changes
    window.addEventListener('online', () => setIsOnline(true));
    window.addEventListener('offline', () => setIsOnline(false));

    return () => {
      window.removeEventListener('online', () => setIsOnline(true));
      window.removeEventListener('offline', () => setIsOnline(false));
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
      
      // Fallback to offline data
      const offlineTransactions = apiService.offlineFallback.getTransactions();
      setTransactions(offlineTransactions);
    } finally {
      setLoading(false);
    }
  };

  const currentMonthTx  = transactions.filter(t => t.date.startsWith(CURRENT_MONTH));
  const currentExpenses = currentMonthTx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const budgetUsed      = (currentExpenses / monthlyBudget) * 100;

  const addTransaction    = async (tx) => {
    try {
      const newTx = await apiService.addTransaction(tx);
      setTransactions(prev => [...prev, newTx]);
      apiService.offlineFallback.saveTransactions([...transactions, newTx]);
    } catch (err) {
      console.error('Failed to add transaction:', err);
      // Fallback: save to offline storage
      const updated = [...transactions, { ...tx, id: Date.now() }];
      setTransactions(updated);
      apiService.offlineFallback.saveTransactions(updated);
    }
  };

  const deleteTransaction = async (id) => {
    try {
      await apiService.deleteTransaction(id);
      const updated = transactions.filter(t => t.id !== id);
      setTransactions(updated);
      apiService.offlineFallback.saveTransactions(updated);
    } catch (err) {
      console.error('Failed to delete transaction:', err);
      // Still delete locally
      const updated = transactions.filter(t => t.id !== id);
      setTransactions(updated);
      apiService.offlineFallback.saveTransactions(updated);
    }
  };

  const updateTransaction = async (id, updatedTx) => {
    try {
      await apiService.updateTransaction(id, updatedTx);
      const updated = transactions.map(t => t.id === id ? { ...updatedTx, id } : t);
      setTransactions(updated);
      apiService.offlineFallback.saveTransactions(updated);
      setEditingId(null);
    } catch (err) {
      console.error('Failed to update transaction:', err);
      // Fallback: update locally
      const updated = transactions.map(t => t.id === id ? { ...updatedTx, id } : t);
      setTransactions(updated);
      apiService.offlineFallback.saveTransactions(updated);
      setEditingId(null);
    }
  };

  const updateBudget = async (newBudget) => {
    try {
      await apiService.setBudget(CURRENT_MONTH, newBudget);
      setMonthlyBudget(newBudget);
    } catch (err) {
      console.error('Failed to update budget:', err);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:wght@700&display=swap');
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

      <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", background: "#0D0F14", color: "#E8EAF0" }}>
        {/* Status Bar */}
        {(loading || error || !isOnline) && (
          <div style={{ 
            position: "fixed", 
            top: 0, 
            left: 0, 
            right: 0, 
            padding: "12px 16px", 
            background: loading ? "#54A0FF22" : error ? "#FF6B6B22" : "#F9CA2422",
            borderBottom: `1px solid ${loading ? "#54A0FF" : error ? "#FF6B6B" : "#F9CA24"}`,
            fontSize: 13,
            color: loading ? "#54A0FF" : error ? "#FF6B6B" : "#F9CA24",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            zIndex: 1000,
          }}>
            <span>
              {loading && "⏳ Loading your data..."}
              {error && `⚠️ ${error}`}
              {!isOnline && "📡 Offline Mode - Changes will sync when online"}
            </span>
            {error && <button onClick={loadData} style={{ background: "#FF6B6B", color: "white", border: "none", padding: "4px 12px", borderRadius: 4, cursor: "pointer", fontSize: 12 }}>Retry</button>}
          </div>
        )}

        <Sidebar
          view={view}
          setView={setView}
          budgetUsed={budgetUsed}
          monthlyBudget={monthlyBudget}
          formatINR={formatINR}
        />

        <div style={{ flex: 1, padding: "28px 32px", overflowY: "auto", marginTop: (loading || error || !isOnline) ? 50 : 0 }}>
          {view === "dashboard" && (
            <Dashboard
              transactions={transactions}
              currentMonthStr={CURRENT_MONTH}
              monthlyBudget={monthlyBudget}
              setView={setView}
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
            />
          )}
          {view === "reports" && (
            <Reports
              transactions={transactions}
              currentMonthStr={CURRENT_MONTH}
              monthlyBudget={monthlyBudget}
            />
          )}
          {view === "budget" && (
            <Budget
              transactions={transactions}
              currentMonthStr={CURRENT_MONTH}
              monthlyBudget={monthlyBudget}
              setMonthlyBudget={updateBudget}
            />
          )}
        </div>
      </div>
    </>
  );
}
