# EBSI Financial Freedom OS 🎯

> **Your personal financial operating system — built for property agents, commission earners, and self-employed professionals who want to achieve Financial Freedom.**

---

## What is this?

EBSI Financial Freedom OS is not a bookkeeping app. It's a **Financial Freedom Engine** that helps you answer the 10 questions that matter most:

1. How much cash do I **really** have?
2. How many months can I **survive** without income?
3. Am I **asset-rich but cash-poor**?
4. How close am I to **Financial Freedom**?
5. What is my **true net worth**?
6. Which commitments are **hurting my cashflow**?
7. How can I **increase passive income**?
8. Can I **afford a new property** purchase?
9. What is my **future cashflow** projection?
10. What **financial risks** should I watch?

---

## 12 Powerful Modules

| # | Module | What it does |
|---|--------|-------------|
| 1 | **Personal Dashboard** | Net worth, liquid cash, freedom score, debt ratio, cashflow — at a glance |
| 2 | **Expense Tracker** | Manual entry, categories, budget vs actual, monthly trends |
| 3 | **AI Receipt Scanner** | Upload a photo — GPT-4o Vision extracts merchant, amount, date, category |
| 4 | **Quick Capture** | Type naturally: *"Spent RM80 petrol"* → auto-saved |
| 5 | **Income Tracker** | All income types: commission, rental, dividends, salary, referrals |
| 6 | **Commission Pipeline** | 7-stage deal tracker from Prospect → Paid with pipeline summary |
| 7 | **Cashflow Forecast** | 1/3/6/12-month projections with negative cashflow alerts |
| 8 | **Liquidity Analyzer** | Emergency runway calculator with Green/Yellow/Red risk levels |
| 9 | **Net Worth Tracker** | Full balance sheet: 9 asset types, 7 liability types, historical chart |
| 10 | **Passive Income Tracker** | Freedom progress bar: Passive Income ÷ Monthly Commitment × 100 |
| 11 | **Freedom Planner** | Set your RM20,000/month target — see projected achievement date |
| 12 | **AI Financial Coach** | Ask anything: *"Can I afford a RM1.5M bungalow?"* — gets real answers |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, TailwindCSS, Recharts |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| AI | OpenAI GPT-4o (chat, OCR, NLP) |
| Deployment | Vercel |
| Security | Row Level Security (RLS) — total user isolation |

---

## Quick Start (5 minutes)

### 1. Install
```bash
cd ebsi-financial-freedom-os
npm install
cp .env.local.example .env.local
```

### 2. Set up Supabase
1. Create project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → paste contents of `supabase/migrations/001_initial_schema.sql` → Run
3. Copy your **Project URL** and **anon key** to `.env.local`

### 3. Set up OpenAI (for AI features)
1. Get API key from [platform.openai.com](https://platform.openai.com)
2. Add `OPENAI_API_KEY=sk-...` to `.env.local`

### 4. Run
```bash
npm run dev
# → http://localhost:3000
```

### 5. Deploy to Vercel
```bash
vercel --prod
```

See [`docs/DEPLOYMENT_GUIDE.md`](docs/DEPLOYMENT_GUIDE.md) for the full step-by-step guide.

---

## Environment Variables

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# For AI features
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4o

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Database Schema

13 tables, all protected by Row Level Security:

- `profiles` — user settings and targets
- `expenses` — all expense transactions
- `income` — all income (active + passive)
- `assets` — properties, shares, REITs, cash, FD, crypto, business
- `liabilities` — mortgage, car loan, personal loan, credit card
- `bank_accounts` — cash and liquid asset tracking
- `commission_deals` — property commission pipeline
- `cashflow_forecasts` — monthly projections
- `net_worth_snapshots` — historical wealth tracking
- `financial_goals` — freedom targets
- `budgets` — budget vs actual
- `ai_conversations` — AI coach history
- `quick_captures` — raw quick-entry log

---

## Security

- ✅ Row Level Security on every table (`auth.uid() = user_id`)
- ✅ No user can ever read another user's data
- ✅ Service role key only in server-side API routes
- ✅ All API routes validate session before any DB query
- ✅ Input validation on all POST/PATCH endpoints
- ✅ Environment secrets never exposed to client

---

## Financial Calculations

| Metric | Formula |
|--------|---------|
| Net Worth | Total Assets − Total Liabilities |
| Debt Ratio | Liabilities / Assets × 100 |
| Liquidity Runway | Liquid Cash / Monthly Commitments |
| Financial Freedom Score | Passive Income / Monthly Commitment × 100 |
| Monthly Cashflow | Total Income − Total Expenses |

---

## Folder Structure

See [`docs/FOLDER_STRUCTURE.md`](docs/FOLDER_STRUCTURE.md) for the complete annotated tree.

---

## License

Built for personal use. Inspire someone toward financial freedom today. 🌱

---

*"Financial freedom is not about being rich. It's about having enough passive income to cover your expenses — so you can choose how you spend your time."*
