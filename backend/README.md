# Expense Calculator Backend

Node.js/Express backend with JSON-based database for the Expense Calculator app.

## Features

- 📊 RESTful API for expense management
- 💾 JSON file-based database (can be upgraded to MongoDB/PostgreSQL)
- 📈 Budget tracking
- 📥 Data import/export functionality
- 🔄 Works with web, desktop, and mobile apps
- 🏃 Fast and lightweight

## Installation

```bash
cd backend
npm install
```

## Running the Server

### Development Mode
```bash
npm run dev
```
This uses `--watch` flag to auto-reload on changes.

### Production Mode
```bash
npm start
```

Server runs on `http://localhost:5000` by default.

## API Endpoints

### Health Check
- `GET /api/health` - Check server status

### Transactions
- `GET /api/transactions` - Get all transactions
- `GET /api/transactions/range?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` - Get transactions in date range
- `POST /api/transactions` - Create new transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Budgets
- `GET /api/budgets` - Get all budgets
- `GET /api/budgets/:month` - Get budget for specific month (YYYY-MM)
- `POST /api/budgets/:month` - Set budget for month

### Data Management
- `GET /api/export` - Export all data as JSON file
- `POST /api/import` - Import data from JSON
- `DELETE /api/clear?confirm=true` - Clear all data

## Database Structure

### Transactions (transactions.json)
```json
[
  {
    "id": 1234567890,
    "date": "2026-03-07",
    "description": "Grocery shopping",
    "amount": 2500,
    "category": "food",
    "type": "expense",
    "createdAt": "2026-03-07T10:30:00.000Z",
    "updatedAt": "2026-03-07T10:30:00.000Z"
  }
]
```

### Budgets (budgets.json)
```json
{
  "2026-03": {
    "month": "2026-03",
    "amount": 60000,
    "updatedAt": "2026-03-07T10:30:00.000Z"
  }
}
```

## Configuration

Set environment variables in `.env`:

```bash
PORT=5000
```

## Future Enhancements

1. **Database Upgrade**: Switch from JSON to MongoDB or PostgreSQL
2. **Authentication**: Add user authentication and multi-user support
3. **Cloud Sync**: Deploy to cloud (Heroku, AWS, DigitalOcean)
4. **Webhooks**: Real-time notifications
5. **Analytics**: Advanced spending analytics
6. **Mobile App**: React Native/Flutter app
7. **Desktop App**: Electron app with offline support

## File Structure

```
backend/
├── server.js          # Express app and routes
├── db.js              # Database operations
├── package.json       # Dependencies
├── data/              # JSON database files
│   ├── transactions.json
│   ├── budgets.json
│   └── users.json
└── README.md          # This file
```

## License

MIT
