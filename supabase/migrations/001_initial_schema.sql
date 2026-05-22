-- ============================================================
-- EBSI Financial Freedom OS
-- Supabase PostgreSQL Migration 001 - Complete Schema
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  currency TEXT NOT NULL DEFAULT 'MYR',
  timezone TEXT NOT NULL DEFAULT 'Asia/Kuala_Lumpur',
  monthly_commitment_target NUMERIC(15,2) DEFAULT 0,
  financial_freedom_target NUMERIC(15,2) DEFAULT 20000,
  emergency_fund_months_target INTEGER DEFAULT 6,
  onboarded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- EXPENSE CATEGORIES (reference)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.expense_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  icon TEXT,
  color TEXT,
  is_system BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.expense_categories (name, icon, color) VALUES
  ('Food', '🍜', '#F59E0B'),
  ('Fuel', '⛽', '#EF4444'),
  ('Utilities', '💡', '#8B5CF6'),
  ('Mortgage', '🏠', '#3B82F6'),
  ('Car Loan', '🚗', '#EC4899'),
  ('Insurance', '🛡️', '#14B8A6'),
  ('Family', '👨‍👩‍👧', '#F97316'),
  ('Education', '📚', '#6366F1'),
  ('Entertainment', '🎬', '#84CC16'),
  ('Medical', '🏥', '#06B6D4'),
  ('Business', '💼', '#A855F7'),
  ('Others', '📦', '#6B7280')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- INCOME CATEGORIES (reference)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.income_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  icon TEXT,
  color TEXT,
  is_passive BOOLEAN DEFAULT FALSE,
  is_system BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.income_categories (name, icon, color, is_passive) VALUES
  ('Property Commission', '🏡', '#10B981', FALSE),
  ('Rental Income', '🏢', '#3B82F6', TRUE),
  ('Dividend Income', '📈', '#8B5CF6', TRUE),
  ('Salary', '💰', '#F59E0B', FALSE),
  ('Business Income', '💼', '#EC4899', FALSE),
  ('Referral Income', '🤝', '#14B8A6', TRUE),
  ('REIT Distribution', '🏦', '#6366F1', TRUE),
  ('Interest Income', '💹', '#84CC16', TRUE),
  ('Business Profit Sharing', '🤑', '#F97316', TRUE),
  ('Other Income', '📦', '#6B7280', FALSE)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- EXPENSES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.expense_categories(id),
  category_name TEXT, -- denormalized for speed
  amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  description TEXT,
  merchant TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_url TEXT,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_interval TEXT CHECK (recurrence_interval IN ('daily','weekly','monthly','yearly')),
  ai_categorized BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX idx_expenses_date ON public.expenses(expense_date DESC);
CREATE INDEX idx_expenses_category ON public.expenses(category_name);

-- ============================================================
-- INCOME
-- ============================================================
CREATE TABLE IF NOT EXISTS public.income (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.income_categories(id),
  category_name TEXT,
  amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  description TEXT,
  source TEXT,
  income_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_passive BOOLEAN DEFAULT FALSE,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_interval TEXT CHECK (recurrence_interval IN ('daily','weekly','monthly','yearly')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_income_user_id ON public.income(user_id);
CREATE INDEX idx_income_date ON public.income(income_date DESC);
CREATE INDEX idx_income_passive ON public.income(user_id, is_passive);

-- ============================================================
-- ASSETS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN (
    'property','shares','reits','cash','fixed_deposit',
    'crypto','business','vehicle','other'
  )),
  current_value NUMERIC(15,2) NOT NULL DEFAULT 0,
  purchase_price NUMERIC(15,2),
  purchase_date DATE,
  is_liquid BOOLEAN DEFAULT FALSE,
  monthly_income NUMERIC(15,2) DEFAULT 0, -- rental, dividend etc
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_assets_user_id ON public.assets(user_id);
CREATE INDEX idx_assets_type ON public.assets(user_id, asset_type);

-- ============================================================
-- LIABILITIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.liabilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  liability_type TEXT NOT NULL CHECK (liability_type IN (
    'mortgage','car_loan','personal_loan','credit_card',
    'business_loan','student_loan','other'
  )),
  outstanding_balance NUMERIC(15,2) NOT NULL DEFAULT 0,
  original_amount NUMERIC(15,2),
  monthly_payment NUMERIC(15,2) NOT NULL DEFAULT 0,
  interest_rate NUMERIC(6,4),
  start_date DATE,
  end_date DATE,
  lender TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_liabilities_user_id ON public.liabilities(user_id);

-- ============================================================
-- BANK ACCOUNTS (for liquidity tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN (
    'current','savings','fixed_deposit','cash','e_wallet'
  )),
  balance NUMERIC(15,2) NOT NULL DEFAULT 0,
  is_liquid BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bank_accounts_user_id ON public.bank_accounts(user_id);

-- ============================================================
-- PROPERTY COMMISSION PIPELINE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.commission_deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  customer_name TEXT,
  property_address TEXT,
  property_value NUMERIC(15,2),
  commission_rate NUMERIC(6,4),
  commission_amount NUMERIC(15,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'prospect' CHECK (status IN (
    'prospect','booking','spa_signed','loan_approved',
    'pending_claim','claimed','paid'
  )),
  expected_payment_date DATE,
  actual_payment_date DATE,
  co_agent TEXT,
  co_agent_split NUMERIC(6,4),
  net_commission NUMERIC(15,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_commission_deals_user_id ON public.commission_deals(user_id);
CREATE INDEX idx_commission_deals_status ON public.commission_deals(user_id, status);

-- ============================================================
-- CASHFLOW FORECAST
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cashflow_forecasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  forecast_month DATE NOT NULL, -- first day of month
  expected_income NUMERIC(15,2) DEFAULT 0,
  expected_expenses NUMERIC(15,2) DEFAULT 0,
  expected_balance NUMERIC(15,2) GENERATED ALWAYS AS (expected_income - expected_expenses) STORED,
  actual_income NUMERIC(15,2),
  actual_expenses NUMERIC(15,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, forecast_month)
);

CREATE INDEX idx_cashflow_user_id ON public.cashflow_forecasts(user_id);
CREATE INDEX idx_cashflow_month ON public.cashflow_forecasts(user_id, forecast_month DESC);

-- ============================================================
-- NET WORTH SNAPSHOTS (monthly history)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.net_worth_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_assets NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_liabilities NUMERIC(15,2) NOT NULL DEFAULT 0,
  net_worth NUMERIC(15,2) GENERATED ALWAYS AS (total_assets - total_liabilities) STORED,
  liquid_assets NUMERIC(15,2) DEFAULT 0,
  passive_income_monthly NUMERIC(15,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, snapshot_date)
);

CREATE INDEX idx_net_worth_user_id ON public.net_worth_snapshots(user_id);
CREATE INDEX idx_net_worth_date ON public.net_worth_snapshots(user_id, snapshot_date DESC);

-- ============================================================
-- FINANCIAL FREEDOM GOALS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.financial_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_name TEXT NOT NULL,
  goal_type TEXT NOT NULL CHECK (goal_type IN (
    'passive_income_target','net_worth_target','debt_free',
    'emergency_fund','savings_target','custom'
  )),
  target_amount NUMERIC(15,2) NOT NULL,
  current_amount NUMERIC(15,2) DEFAULT 0,
  target_date DATE,
  is_primary BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_goals_user_id ON public.financial_goals(user_id);

-- ============================================================
-- BUDGETS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_name TEXT NOT NULL,
  budget_month DATE NOT NULL, -- first day of month
  budgeted_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category_name, budget_month)
);

CREATE INDEX idx_budgets_user_id ON public.budgets(user_id);

-- ============================================================
-- AI COACH CONVERSATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  messages JSONB NOT NULL DEFAULT '[]',
  context_snapshot JSONB, -- financial snapshot at time of conversation
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_conversations_user_id ON public.ai_conversations(user_id);

-- ============================================================
-- QUICK CAPTURE LOG (raw input history)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.quick_captures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  raw_text TEXT NOT NULL,
  parsed_type TEXT CHECK (parsed_type IN ('expense','income','note')),
  parsed_amount NUMERIC(15,2),
  parsed_category TEXT,
  parsed_description TEXT,
  linked_expense_id UUID REFERENCES public.expenses(id) ON DELETE SET NULL,
  linked_income_id UUID REFERENCES public.income(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'processed' CHECK (status IN ('pending','processed','failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quick_captures_user_id ON public.quick_captures(user_id);

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER trg_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER trg_income_updated_at BEFORE UPDATE ON public.income FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER trg_assets_updated_at BEFORE UPDATE ON public.assets FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER trg_liabilities_updated_at BEFORE UPDATE ON public.liabilities FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER trg_bank_accounts_updated_at BEFORE UPDATE ON public.bank_accounts FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER trg_commission_deals_updated_at BEFORE UPDATE ON public.commission_deals FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER trg_goals_updated_at BEFORE UPDATE ON public.financial_goals FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER trg_budgets_updated_at BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER trg_ai_conversations_updated_at BEFORE UPDATE ON public.ai_conversations FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashflow_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.net_worth_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quick_captures ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only see/edit their own
CREATE POLICY "profiles_self" ON public.profiles FOR ALL USING (auth.uid() = id);

-- Helper macro for user-owned tables
CREATE POLICY "expenses_own" ON public.expenses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "income_own" ON public.income FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "assets_own" ON public.assets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "liabilities_own" ON public.liabilities FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "bank_accounts_own" ON public.bank_accounts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "commission_deals_own" ON public.commission_deals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "cashflow_forecasts_own" ON public.cashflow_forecasts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "net_worth_snapshots_own" ON public.net_worth_snapshots FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "financial_goals_own" ON public.financial_goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "budgets_own" ON public.budgets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "ai_conversations_own" ON public.ai_conversations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "quick_captures_own" ON public.quick_captures FOR ALL USING (auth.uid() = user_id);

-- Reference tables: readable by everyone
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expense_categories_read" ON public.expense_categories FOR SELECT USING (TRUE);
CREATE POLICY "income_categories_read" ON public.income_categories FOR SELECT USING (TRUE);

-- ============================================================
-- USEFUL VIEWS
-- ============================================================

-- Monthly expense summary per user
CREATE OR REPLACE VIEW public.v_monthly_expenses AS
SELECT
  user_id,
  DATE_TRUNC('month', expense_date) AS month,
  category_name,
  SUM(amount) AS total_amount,
  COUNT(*) AS transaction_count
FROM public.expenses
GROUP BY user_id, DATE_TRUNC('month', expense_date), category_name;

-- Monthly income summary per user
CREATE OR REPLACE VIEW public.v_monthly_income AS
SELECT
  user_id,
  DATE_TRUNC('month', income_date) AS month,
  category_name,
  is_passive,
  SUM(amount) AS total_amount,
  COUNT(*) AS transaction_count
FROM public.income
GROUP BY user_id, DATE_TRUNC('month', income_date), category_name, is_passive;

-- Current financial snapshot per user
CREATE OR REPLACE VIEW public.v_financial_snapshot AS
SELECT
  p.id AS user_id,
  p.full_name,
  p.currency,
  COALESCE((SELECT SUM(balance) FROM bank_accounts ba WHERE ba.user_id = p.id AND ba.is_liquid = TRUE), 0) AS liquid_cash,
  COALESCE((SELECT SUM(current_value) FROM assets a WHERE a.user_id = p.id), 0) AS total_assets,
  COALESCE((SELECT SUM(outstanding_balance) FROM liabilities l WHERE l.user_id = p.id), 0) AS total_liabilities,
  COALESCE((SELECT SUM(monthly_payment) FROM liabilities l WHERE l.user_id = p.id), 0) AS monthly_commitments,
  COALESCE((SELECT SUM(amount) FROM income i WHERE i.user_id = p.id AND i.is_passive = TRUE AND i.income_date >= DATE_TRUNC('month', CURRENT_DATE)), 0) AS passive_income_this_month,
  p.financial_freedom_target
FROM public.profiles p;
