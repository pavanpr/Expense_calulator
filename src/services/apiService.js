// API Configuration — default port matches server.js (3001)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `API Error: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

// ==================== TRANSACTIONS ====================

export async function getTransactions() {
  const response = await apiCall('/transactions');
  return response.data || [];
}

export async function getTransactionsByDateRange(startDate, endDate) {
  const response = await apiCall(`/transactions/range?startDate=${startDate}&endDate=${endDate}`);
  return response.data || [];
}

export async function addTransaction(transaction) {
  const response = await apiCall('/transactions', {
    method: 'POST',
    body: JSON.stringify(transaction),
  });
  return response.data;
}

export async function updateTransaction(id, updates) {
  const response = await apiCall(`/transactions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
  return response.data;
}

export async function deleteTransaction(id) {
  await apiCall(`/transactions/${id}`, {
    method: 'DELETE',
  });
  return true;
}

// ==================== BUDGETS ====================

export async function getBudgets() {
  const response = await apiCall('/budgets');
  return response.data || {};
}

export async function getBudget(month) {
  const response = await apiCall(`/budgets/${month}`);
  return response.data;
}

export async function setBudget(month, amount) {
  const response = await apiCall(`/budgets/${month}`, {
    method: 'POST',
    body: JSON.stringify({ amount }),
  });
  return response.data;
}

// ==================== DATA IMPORT/EXPORT ====================

export async function exportData() {
  const response = await fetch(`${API_BASE_URL}/export`);
  return response.json();
}

export async function importData(data) {
  const response = await apiCall('/import', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response;
}

export async function clearAllData(confirm = false) {
  const response = await apiCall(`/clear?confirm=${confirm}`, {
    method: 'DELETE',
  });
  return response;
}

// ==================== UTILITIES ====================

export async function checkServerHealth() {
  try {
    const response = await apiCall('/health');
    return response.status === 'ok';
  } catch {
    return false;
  }
}

// Offline fallback — use localStorage when server is unreachable.
// In Electron, localStorage is available in the renderer process;
// guard against environments where it may not be.
const hasLocalStorage = (() => {
  try {
    localStorage.setItem('__test__', '1');
    localStorage.removeItem('__test__');
    return true;
  } catch {
    return false;
  }
})();

export const offlineFallback = {
  getTransactions() {
    if (!hasLocalStorage) return [];
    const data = localStorage.getItem('expense_transactions');
    return data ? JSON.parse(data) : [];
  },

  saveTransactions(transactions) {
    if (!hasLocalStorage) return;
    localStorage.setItem('expense_transactions', JSON.stringify(transactions));
  },

  getBudgets() {
    if (!hasLocalStorage) return {};
    const data = localStorage.getItem('expense_budgets');
    return data ? JSON.parse(data) : {};
  },

  saveBudgets(budgets) {
    if (!hasLocalStorage) return;
    localStorage.setItem('expense_budgets', JSON.stringify(budgets));
  },
};

export default {
  getTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  getBudgets,
  setBudget,
  exportData,
  importData,
  clearAllData,
  checkServerHealth,
  offlineFallback,
};
