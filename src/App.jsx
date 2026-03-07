import React, { useState } from 'react';
import { SAMPLE_TRANSACTIONS } from './constants.js';
import { formatINR } from './utils.js';
import Sidebar from './components/Sidebar.jsx';
import Dashboard from './components/Dashboard.jsx';
import AddEntry from './components/AddEntry.jsx';
import Transactions from './components/Transactions.jsx';
import Reports from './components/Reports.jsx';
import Budget from './components/Budget.jsx';

const CURRENT_MONTH = "2026-03";

export default function App() {
  const [transactions, setTransactions]   = useState(SAMPLE_TRANSACTIONS);
  const [view, setView]                   = useState("dashboard");
  const [monthlyBudget, setMonthlyBudget] = useState(60000);

  const currentMonthTx  = transactions.filter(t => t.date.startsWith(CURRENT_MONTH));
  const currentExpenses = currentMonthTx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const budgetUsed      = (currentExpenses / monthlyBudget) * 100;

  const addTransaction    = (tx) => setTransactions(prev => [...prev, tx]);
  const deleteTransaction = (id) => setTransactions(prev => prev.filter(t => t.id !== id));

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
        <Sidebar
          view={view}
          setView={setView}
          budgetUsed={budgetUsed}
          monthlyBudget={monthlyBudget}
          formatINR={formatINR}
        />

        <div style={{ flex: 1, padding: "28px 32px", overflowY: "auto" }}>
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
            <Transactions transactions={transactions} onDelete={deleteTransaction} />
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
              setMonthlyBudget={setMonthlyBudget}
            />
          )}
        </div>
      </div>
    </>
  );
}
