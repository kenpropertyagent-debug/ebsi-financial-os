# EBSI Financial Freedom OS — Folder Structure

```
ebsi-financial-freedom-os/
│
├── 📁 docs/
│   ├── DEPLOYMENT_GUIDE.md        # Step-by-step deployment to Vercel + Supabase
│   ├── FOLDER_STRUCTURE.md        # This file
│   └── ERD.svg                    # Entity Relationship Diagram (all 13 tables)
│
├── 📁 supabase/
│   └── migrations/
│       └── 001_initial_schema.sql # Complete PostgreSQL schema + RLS policies
│
├── 📁 src/
│   │
│   ├── 📁 app/                    # Next.js 15 App Router
│   │   │
│   │   ├── 📁 (app)/              # Protected route group (requires auth)
│   │   │   ├── layout.tsx         # App shell: sidebar + topbar + auth guard
│   │   │   └── dashboard/
│   │   │       ├── page.tsx           # Module 1: Personal Dashboard
│   │   │       ├── quick-capture/
│   │   │       │   └── page.tsx       # Module 4: Quick Capture (WhatsApp-style)
│   │   │       ├── expenses/
│   │   │       │   └── page.tsx       # Module 2: Expense Tracker
│   │   │       ├── income/
│   │   │       │   └── page.tsx       # Module 5: Income Tracker
│   │   │       ├── commissions/
│   │   │       │   └── page.tsx       # Module 6: Commission Pipeline
│   │   │       ├── cashflow/
│   │   │       │   └── page.tsx       # Module 7: Cashflow Forecast
│   │   │       ├── liquidity/
│   │   │       │   └── page.tsx       # Module 8: Liquidity Analyzer
│   │   │       ├── net-worth/
│   │   │       │   └── page.tsx       # Module 9: Net Worth Tracker
│   │   │       ├── passive-income/
│   │   │       │   └── page.tsx       # Module 10: Passive Income Tracker
│   │   │       ├── freedom-planner/
│   │   │       │   └── page.tsx       # Module 11: Financial Freedom Planner
│   │   │       ├── receipt-scanner/
│   │   │       │   └── page.tsx       # Module 3: AI Receipt Scanner
│   │   │       ├── ai-coach/
│   │   │       │   └── page.tsx       # Module 12: AI Financial Coach
│   │   │       ├── reports/
│   │   │       │   └── page.tsx       # PDF/HTML Report Generator
│   │   │       └── settings/
│   │   │           └── page.tsx       # User profile & preferences
│   │   │
│   │   ├── 📁 api/                # Secure server-side API routes
│   │   │   ├── assets/route.ts        # CRUD for assets (GET/POST/PATCH/DELETE)
│   │   │   ├── liabilities/route.ts   # CRUD for liabilities
│   │   │   ├── bank-accounts/route.ts # CRUD for bank/cash accounts
│   │   │   ├── expenses/route.ts      # CRUD for expenses
│   │   │   ├── income/route.ts        # CRUD for income records
│   │   │   ├── commissions/route.ts   # CRUD + pipeline updates; auto-income on paid
│   │   │   ├── profiles/route.ts      # Get/update user profile
│   │   │   ├── quick-capture/route.ts # AI NLP parser + save (POST=parse, PUT=save)
│   │   │   ├── receipt-scan/route.ts  # GPT-4o Vision OCR for receipts
│   │   │   ├── ai-coach/route.ts      # AI financial coaching (GPT-4o with context)
│   │   │   ├── net-worth/
│   │   │   │   └── snapshot/route.ts  # Create/get net worth snapshots
│   │   │   ├── dashboard/
│   │   │   │   └── snapshot/route.ts  # Full financial snapshot (all metrics)
│   │   │   └── reports/
│   │   │       └── generate/route.ts  # Generate HTML/PDF financial reports
│   │   │
│   │   ├── 📁 auth/               # Authentication pages (public)
│   │   │   ├── login/page.tsx         # Email + Google sign-in
│   │   │   ├── signup/page.tsx        # New account registration
│   │   │   └── callback/route.ts      # OAuth callback handler
│   │   │
│   │   ├── globals.css            # Tailwind base + custom design tokens
│   │   ├── layout.tsx             # Root HTML layout + Toaster
│   │   └── page.tsx               # Public landing page
│   │
│   ├── 📁 components/             # Reusable UI components
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx            # Navigation sidebar (13 links)
│   │   │   └── TopBar.tsx             # Header with user avatar + sign out
│   │   ├── dashboard/
│   │   │   ├── MetricCard.tsx         # Individual KPI card
│   │   │   ├── FreedomScoreGauge.tsx  # SVG semicircle gauge
│   │   │   └── DashboardCharts.tsx    # Recharts area/bar/pie charts
│   │   ├── expenses/
│   │   │   └── ExpensesClient.tsx     # Expense list + add form + charts
│   │   ├── income/
│   │   │   └── IncomeClient.tsx       # Income list + add form + trend chart
│   │   ├── commissions/
│   │   │   └── CommissionsClient.tsx  # Kanban pipeline + deal table
│   │   ├── cashflow/
│   │   │   └── CashflowClient.tsx     # Forecast chart + projection table
│   │   ├── liquidity/
│   │   │   └── LiquidityClient.tsx    # Runway gauge + risk levels
│   │   ├── net-worth/
│   │   │   └── NetWorthClient.tsx     # Assets/liabilities tabs + history chart
│   │   ├── passive-income/
│   │   │   └── PassiveIncomeClient.tsx # Freedom progress + source breakdown
│   │   ├── freedom-planner/
│   │   │   └── FreedomPlannerClient.tsx # Goals + milestone tracker + projection
│   │   ├── ai-coach/
│   │   │   └── AiCoachClient.tsx      # Chat interface with AI coach
│   │   ├── reports/
│   │   │   └── ReportsClient.tsx      # Report generation UI
│   │   └── settings/
│   │       └── SettingsClient.tsx     # Profile edit form
│   │
│   ├── 📁 lib/
│   │   ├── supabase/
│   │   │   ├── client.ts          # Browser Supabase client (createBrowserClient)
│   │   │   ├── server.ts          # Server Supabase client (createServerClient)
│   │   │   └── middleware.ts      # Auth session refresh for Next.js middleware
│   │   └── utils.ts               # Financial calculations + formatting helpers
│   │
│   ├── 📁 types/
│   │   └── database.ts            # Full TypeScript types matching PostgreSQL schema
│   │
│   └── middleware.ts              # Route protection + session management
│
├── .env.local.example             # Template for environment variables
├── .gitignore                     # Protects secrets + build artifacts
├── next.config.ts                 # Next.js configuration
├── package.json                   # Dependencies
├── postcss.config.mjs             # Tailwind CSS processing
├── tailwind.config.ts             # Design system + custom colors
└── tsconfig.json                  # TypeScript compiler options
```

---

## Key Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| Next.js App Router | Server Components for fast data fetching; Client Components only where interactivity needed |
| Supabase RLS | All queries auto-scoped to `auth.uid()` — no user can ever access another user's data |
| Server-side data fetching | Dashboard loads all data in parallel on the server, zero waterfalls |
| API routes for mutations | Client components call `/api/*` routes; no direct Supabase calls from client for writes |
| Denormalized `category_name` | Stored alongside `category_id` for fast filtering without joins |
| Generated columns | `net_worth` and `expected_balance` computed by PostgreSQL — always consistent |
| Passive income flag | `is_passive` on income records enables instant Freedom Score calculation |

---

## Data Flow

```
User Action
    │
    ▼
Client Component (React)
    │ fetch()
    ▼
API Route (/api/*)
    │ createClient() — server-side Supabase
    ▼
Supabase PostgreSQL (RLS enforced)
    │
    ▼
Response → UI Update
```

## Financial Calculation Engine (lib/utils.ts)

| Function | Formula |
|----------|---------|
| `calcNetWorth` | Total Assets − Total Liabilities |
| `calcDebtRatio` | Total Liabilities / Total Assets × 100 |
| `calcRunway` | Liquid Assets / Monthly Commitments |
| `calcLiquidityScore` | 0–100 based on runway months |
| `calcFinancialFreedomScore` | Passive Income / Monthly Commitment × 100 |
| `calcMonthlyCashflow` | Total Income − Total Expenses |
| `projectAchievementDate` | Compound growth to target |
