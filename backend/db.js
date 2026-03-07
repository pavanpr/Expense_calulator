import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_DIR = path.join(__dirname, 'data');
const TRANSACTIONS_FILE = path.join(DB_DIR, 'transactions.json');
const BUDGETS_FILE = path.join(DB_DIR, 'budgets.json');
const USERS_FILE = path.join(DB_DIR, 'users.json');

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Initialize files if they don't exist
function initializeFiles() {
  if (!fs.existsSync(TRANSACTIONS_FILE)) {
    fs.writeFileSync(TRANSACTIONS_FILE, JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(BUDGETS_FILE)) {
    fs.writeFileSync(BUDGETS_FILE, JSON.stringify({}, null, 2));
  }
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify({}, null, 2));
  }
}

// Read data from file
function readFile(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return filePath === TRANSACTIONS_FILE ? [] : {};
  }
}

// Write data to file
function writeFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing to file ${filePath}:`, error);
    return false;
  }
}

// Transaction operations
export const db = {
  // Transactions
  getTransactions() {
    initializeFiles();
    return readFile(TRANSACTIONS_FILE);
  },

  addTransaction(transaction) {
    const transactions = this.getTransactions();
    const newTransaction = {
      id: transaction.id || Date.now(),
      ...transaction,
      createdAt: new Date().toISOString(),
    };
    transactions.push(newTransaction);
    writeFile(TRANSACTIONS_FILE, transactions);
    return newTransaction;
  },

  updateTransaction(id, updates) {
    const transactions = this.getTransactions();
    const index = transactions.findIndex(t => t.id === id);
    if (index === -1) return null;
    
    const updated = { ...transactions[index], ...updates, updatedAt: new Date().toISOString() };
    transactions[index] = updated;
    writeFile(TRANSACTIONS_FILE, transactions);
    return updated;
  },

  deleteTransaction(id) {
    const transactions = this.getTransactions();
    const filtered = transactions.filter(t => t.id !== id);
    writeFile(TRANSACTIONS_FILE, filtered);
    return true;
  },

  getTransactionsByDateRange(startDate, endDate) {
    const transactions = this.getTransactions();
    return transactions.filter(t => t.date >= startDate && t.date <= endDate);
  },

  // Budget operations
  getBudgets() {
    initializeFiles();
    return readFile(BUDGETS_FILE);
  },

  setBudget(month, amount) {
    const budgets = this.getBudgets();
    budgets[month] = {
      month,
      amount,
      updatedAt: new Date().toISOString(),
    };
    writeFile(BUDGETS_FILE, budgets);
    return budgets[month];
  },

  getBudget(month) {
    const budgets = this.getBudgets();
    return budgets[month] || null;
  },

  // Export data
  exportData() {
    return {
      transactions: this.getTransactions(),
      budgets: this.getBudgets(),
      exportedAt: new Date().toISOString(),
    };
  },

  // Import data
  importData(data) {
    try {
      if (data.transactions && Array.isArray(data.transactions)) {
        writeFile(TRANSACTIONS_FILE, data.transactions);
      }
      if (data.budgets && typeof data.budgets === 'object') {
        writeFile(BUDGETS_FILE, data.budgets);
      }
      return { success: true, message: 'Data imported successfully' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  // Clear all data
  clearAll() {
    writeFile(TRANSACTIONS_FILE, []);
    writeFile(BUDGETS_FILE, {});
    return true;
  },
};

export default db;
