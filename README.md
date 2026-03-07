# 💰 Expense Calculator

A full-stack home finance tracker with browser and Electron desktop versions.

## Features

- **Dashboard** — KPI cards, spending breakdown, monthly trend chart
- **Add Entry** — Log income or expenses across 10 categories with AI categorization
- **Transactions** — Filter, sort, search, and delete entries
- **Reports** — Category analysis, month-over-month trends, AI-powered insights
- **Budget Planner** — Set monthly budget and track spending against it
- **AI Integration** — Google Gemini API for smart expense categorization
- **Offline Support** — Works offline with automatic sync when online

## Quick Start

### Browser Version

```bash
# Terminal 1: Start backend
cd backend
node server.js
# Runs on http://localhost:3001

# Terminal 2: Start frontend
npm install
npm run dev
# Opens on http://localhost:5173
```

### Electron Desktop Version

```bash
# Terminal 1: Start backend (if not already running)
cd backend
node server.js

# Terminal 2: Launch Electron app
npm install
npx electron .
```

Or use the automated starter:
```bash
bash start.sh
```

## Project Structure

```
expense-calculator/
├── src/                          # Frontend (React + Vite)
│   ├── components/
│   │   ├── Sidebar.jsx           # Main navigation
│   │   ├── Dashboard.jsx         # Overview & KPIs
│   │   ├── AddEntry.jsx          # Add transactions (AI-powered)
│   │   ├── Transactions.jsx      # View all transactions
│   │   ├── Reports.jsx           # Analytics & insights
│   │   └── Budget.jsx            # Budget planning
│   ├── services/
│   │   ├── apiService.js         # Backend API client with offline support
│   │   ├── aiService.js          # Gemini AI integration
│   │   └── insightsService.js    # Spending analysis
│   ├── App.jsx                   # Main app component
│   ├── constants.js              # Categories & defaults
│   └── index.css                 # Styling
├── backend/                      # Backend (Express.js)
│   ├── server.js                 # API server
│   ├── db.js                     # JSON database operations
│   └── data/                     # JSON storage
│       ├── users.json
│       ├── transactions.json
│       └── budgets.json
├── electron/                     # Electron main process
│   ├── main.js                   # App entry point
│   └── preload.js                # Security bridge
├── public/                       # Static assets
├── index.html                    # Entry HTML
├── vite.config.js               # Vite config
└── package.json                 # Dependencies
```

## Setup

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..

# Create .env file (optional for AI features)
echo "VITE_GEMINI_API_KEY=your_key_here" > .env
```

## Configuration

Create a `.env` file in the root directory:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_API_URL=http://localhost:3001/api
```

**Optional:** If you don't have a Gemini API key, the app works without it (manual categorization only).

## Scripts

- `npm run dev` — Start Vite dev server (browser)
- `npm run dev:electron` — Start with hot reload for Electron
- `npx electron .` — Run Electron app directly
- `npm run build` — Build for production
- `npm run preview` — Preview production build

## Backend API

The Express backend provides REST endpoints for:
- `GET /api/transactions` — Get all transactions
- `POST /api/transactions` — Add transaction
- `DELETE /api/transactions/:id` — Delete transaction
- `GET /api/budgets` — Get budget data
- `POST /api/budgets` — Save budget
- Import/export functionality

## Troubleshooting

**Q: Backend won't start?**
- Make sure port 3001 is available: `lsof -i :3001`
- Check Node.js version: `node --version` (requires 16+)

**Q: Electron app won't load?**
- Clear cache: `rm -rf dist/`
- Rebuild frontend: `npm run build`
- Make sure backend is running on port 3001

**Q: AI categorization not working?**
- Add your Gemini API key to `.env`
- Restart the app

## Tech Stack

**Frontend:** React 18, Vite, CSS Grid
**Backend:** Express.js, Node.js, JSON file database
**Desktop:** Electron 27
**AI:** Google Gemini API

---

**Ready to use!** Choose browser or desktop version and start tracking expenses. 🚀
