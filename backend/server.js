import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import db from './db.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==================== TRANSACTIONS ====================

// Get all transactions
app.get('/api/transactions', (req, res) => {
  try {
    const transactions = db.getTransactions();
    res.json({ success: true, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get transactions by date range
app.get('/api/transactions/range', (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, error: 'startDate and endDate are required' });
    }
    const transactions = db.getTransactionsByDateRange(startDate, endDate);
    res.json({ success: true, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add transaction
app.post('/api/transactions', (req, res) => {
  try {
    const { description, amount, category, type, date } = req.body;

    if (!description || !amount || !category || !type || !date) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: description, amount, category, type, date' 
      });
    }

    const transaction = db.addTransaction({
      description,
      amount: parseFloat(amount),
      category,
      type,
      date,
    });

    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update transaction
app.put('/api/transactions/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updated = db.updateTransaction(parseInt(id), updates);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete transaction
app.delete('/api/transactions/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.deleteTransaction(parseInt(id));
    res.json({ success: true, message: 'Transaction deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== BUDGETS ====================

// Get all budgets
app.get('/api/budgets', (req, res) => {
  try {
    const budgets = db.getBudgets();
    res.json({ success: true, data: budgets });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get budget for specific month
app.get('/api/budgets/:month', (req, res) => {
  try {
    const { month } = req.params;
    const budget = db.getBudget(month);
    res.json({ success: true, data: budget });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Set budget for month
app.post('/api/budgets/:month', (req, res) => {
  try {
    const { month } = req.params;
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({ success: false, error: 'Amount is required' });
    }

    const budget = db.setBudget(month, parseFloat(amount));
    res.status(201).json({ success: true, data: budget });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== DATA IMPORT/EXPORT ====================

// Export all data
app.get('/api/export', (req, res) => {
  try {
    const data = db.exportData();
    res.setHeader('Content-Disposition', 'attachment; filename=expense-data.json');
    res.setHeader('Content-Type', 'application/json');
    res.send(data);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Import data
app.post('/api/import', (req, res) => {
  try {
    const data = req.body;
    const result = db.importData(data);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Clear all data
app.delete('/api/clear', (req, res) => {
  try {
    const confirmed = req.query.confirm === 'true';
    if (!confirmed) {
      return res.status(400).json({ success: false, error: 'Pass confirm=true to clear all data' });
    }
    db.clearAll();
    res.json({ success: true, message: 'All data cleared' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Expense Calculator Backend running on http://localhost:${PORT}`);
  console.log(`📊 API Documentation:`);
  console.log(`   GET    /api/health                    - Check server status`);
  console.log(`   GET    /api/transactions              - Get all transactions`);
  console.log(`   POST   /api/transactions              - Add new transaction`);
  console.log(`   PUT    /api/transactions/:id          - Update transaction`);
  console.log(`   DELETE /api/transactions/:id          - Delete transaction`);
  console.log(`   GET    /api/budgets                   - Get all budgets`);
  console.log(`   POST   /api/budgets/:month            - Set budget for month`);
  console.log(`   GET    /api/export                    - Export data as JSON`);
  console.log(`   POST   /api/import                    - Import data from JSON`);
  console.log(`\n`);
});
