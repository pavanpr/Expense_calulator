# 🏠 Home Expense Calculator

A clean, dark-themed home finance tracker built with React + Vite.

## Features
- **Dashboard** — KPI cards, spending breakdown, monthly trend chart
- **Add Entry** — Log income or expenses across 10 categories
- **Transactions** — Filter, sort, and delete all entries
- **Reports** — Category analysis, month-over-month trends, insights
- **Budget Planner** — Set monthly budget and track against spending

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

## Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
expense-calculator/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── Sidebar.jsx
│   │   ├── Dashboard.jsx
│   │   ├── AddEntry.jsx
│   │   ├── Transactions.jsx
│   │   ├── Reports.jsx
│   │   └── Budget.jsx
│   ├── App.jsx
│   ├── constants.js      # Categories & sample data
│   ├── utils.js          # INR formatting helpers
│   ├── main.jsx
│   └── index.css
├── index.html
├── vite.config.js
└── package.json
```
