export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          currency: string
          timezone: string
          monthly_commitment_target: number
          financial_freedom_target: number
          emergency_fund_months_target: number
          onboarded: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      expenses: {
        Row: {
          id: string
          user_id: string
          category_id: string | null
          category_name: string | null
          amount: number
          description: string | null
          merchant: string | null
          expense_date: string
          receipt_url: string | null
          is_recurring: boolean
          recurrence_interval: string | null
          ai_categorized: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['expenses']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['expenses']['Insert']>
      }
      income: {
        Row: {
          id: string
          user_id: string
          category_id: string | null
          category_name: string | null
          amount: number
          description: string | null
          source: string | null
          income_date: string
          is_passive: boolean
          is_recurring: boolean
          recurrence_interval: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['income']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['income']['Insert']>
      }
      assets: {
        Row: {
          id: string
          user_id: string
          name: string
          asset_type: 'property' | 'shares' | 'reits' | 'cash' | 'fixed_deposit' | 'crypto' | 'business' | 'vehicle' | 'other'
          current_value: number
          purchase_price: number | null
          purchase_date: string | null
          is_liquid: boolean
          monthly_income: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['assets']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['assets']['Insert']>
      }
      liabilities: {
        Row: {
          id: string
          user_id: string
          name: string
          liability_type: 'mortgage' | 'car_loan' | 'personal_loan' | 'credit_card' | 'business_loan' | 'student_loan' | 'other'
          outstanding_balance: number
          original_amount: number | null
          monthly_payment: number
          interest_rate: number | null
          start_date: string | null
          end_date: string | null
          lender: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['liabilities']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['liabilities']['Insert']>
      }
      bank_accounts: {
        Row: {
          id: string
          user_id: string
          bank_name: string
          account_type: 'current' | 'savings' | 'fixed_deposit' | 'cash' | 'e_wallet'
          balance: number
          is_liquid: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['bank_accounts']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['bank_accounts']['Insert']>
      }
      commission_deals: {
        Row: {
          id: string
          user_id: string
          project_name: string
          customer_name: string | null
          property_address: string | null
          property_value: number | null
          commission_rate: number | null
          commission_amount: number
          status: 'prospect' | 'booking' | 'spa_signed' | 'loan_approved' | 'pending_claim' | 'claimed' | 'paid'
          expected_payment_date: string | null
          actual_payment_date: string | null
          co_agent: string | null
          co_agent_split: number | null
          net_commission: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['commission_deals']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['commission_deals']['Insert']>
      }
      cashflow_forecasts: {
        Row: {
          id: string
          user_id: string
          forecast_month: string
          expected_income: number
          expected_expenses: number
          expected_balance: number
          actual_income: number | null
          actual_expenses: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['cashflow_forecasts']['Row'], 'id' | 'created_at' | 'updated_at' | 'expected_balance'>
        Update: Partial<Database['public']['Tables']['cashflow_forecasts']['Insert']>
      }
      net_worth_snapshots: {
        Row: {
          id: string
          user_id: string
          snapshot_date: string
          total_assets: number
          total_liabilities: number
          net_worth: number
          liquid_assets: number
          passive_income_monthly: number
          notes: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['net_worth_snapshots']['Row'], 'id' | 'created_at' | 'net_worth'>
        Update: Partial<Database['public']['Tables']['net_worth_snapshots']['Insert']>
      }
      financial_goals: {
        Row: {
          id: string
          user_id: string
          goal_name: string
          goal_type: 'passive_income_target' | 'net_worth_target' | 'debt_free' | 'emergency_fund' | 'savings_target' | 'custom'
          target_amount: number
          current_amount: number
          target_date: string | null
          is_primary: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['financial_goals']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['financial_goals']['Insert']>
      }
      budgets: {
        Row: {
          id: string
          user_id: string
          category_name: string
          budget_month: string
          budgeted_amount: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['budgets']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['budgets']['Insert']>
      }
      ai_conversations: {
        Row: {
          id: string
          user_id: string
          title: string | null
          messages: Json
          context_snapshot: Json | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['ai_conversations']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['ai_conversations']['Insert']>
      }
      quick_captures: {
        Row: {
          id: string
          user_id: string
          raw_text: string
          parsed_type: 'expense' | 'income' | 'note' | null
          parsed_amount: number | null
          parsed_category: string | null
          parsed_description: string | null
          linked_expense_id: string | null
          linked_income_id: string | null
          status: 'pending' | 'processed' | 'failed'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['quick_captures']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['quick_captures']['Insert']>
      }
    }
    Views: {
      v_financial_snapshot: {
        Row: {
          user_id: string
          full_name: string | null
          currency: string
          liquid_cash: number
          total_assets: number
          total_liabilities: number
          monthly_commitments: number
          passive_income_this_month: number
          financial_freedom_target: number
        }
      }
    }
  }
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Expense = Database['public']['Tables']['expenses']['Row']
export type Income = Database['public']['Tables']['income']['Row']
export type Asset = Database['public']['Tables']['assets']['Row']
export type Liability = Database['public']['Tables']['liabilities']['Row']
export type BankAccount = Database['public']['Tables']['bank_accounts']['Row']
export type CommissionDeal = Database['public']['Tables']['commission_deals']['Row']
export type CashflowForecast = Database['public']['Tables']['cashflow_forecasts']['Row']
export type NetWorthSnapshot = Database['public']['Tables']['net_worth_snapshots']['Row']
export type FinancialGoal = Database['public']['Tables']['financial_goals']['Row']
export type Budget = Database['public']['Tables']['budgets']['Row']
export type AiConversation = Database['public']['Tables']['ai_conversations']['Row']
export type QuickCapture = Database['public']['Tables']['quick_captures']['Row']
export type FinancialSnapshot = Database['public']['Views']['v_financial_snapshot']['Row']
