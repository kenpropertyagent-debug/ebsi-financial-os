import { createClient } from '@/lib/supabase/server'
import AiCoachClient from '@/components/ai-coach/AiCoachClient'
export const metadata = { title: 'AI Financial Coach' }

export default async function AiCoachPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: profile }, { data: assets }, { data: liabilities }, { data: bankAccounts }, { data: income }, { data: expenses }, { data: conversations }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('assets').select('current_value, asset_type').eq('user_id', user.id),
    supabase.from('liabilities').select('outstanding_balance, monthly_payment, liability_type').eq('user_id', user.id),
    supabase.from('bank_accounts').select('balance, is_liquid').eq('user_id', user.id),
    supabase.from('income').select('amount, is_passive, income_date').eq('user_id', user.id)
      .gte('income_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]),
    supabase.from('expenses').select('amount, expense_date').eq('user_id', user.id)
      .gte('expense_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]),
    supabase.from('ai_conversations').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(10),
  ])

  const financialContext = {
    totalAssets: (assets || []).reduce((s, a) => s + a.current_value, 0),
    totalLiabilities: (liabilities || []).reduce((s, l) => s + l.outstanding_balance, 0),
    monthlyCommitments: (liabilities || []).reduce((s, l) => s + l.monthly_payment, 0),
    liquidCash: (bankAccounts || []).filter(b => b.is_liquid).reduce((s, b) => s + b.balance, 0),
    monthlyIncome: (income || []).reduce((s, i) => s + i.amount, 0),
    passiveIncome: (income || []).filter(i => i.is_passive).reduce((s, i) => s + i.amount, 0),
    monthlyExpenses: (expenses || []).reduce((s, e) => s + e.amount, 0),
    currency: profile?.currency || 'MYR',
    ffTarget: profile?.financial_freedom_target || 20000,
  }

  return <AiCoachClient financialContext={financialContext} conversations={conversations || []} userId={user.id} />
}
