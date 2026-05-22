import { createClient } from '@/lib/supabase/server'
import CashflowClient from '@/components/cashflow/CashflowClient'
export const metadata = { title: 'Cashflow Forecast' }

export default async function CashflowPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const [{ data: forecasts }, { data: income }, { data: expenses }, { data: liabilities }] = await Promise.all([
    supabase.from('cashflow_forecasts').select('*').eq('user_id', user.id)
      .gte('forecast_month', sixMonthsAgo.toISOString().split('T')[0]).order('forecast_month'),
    supabase.from('income').select('amount, income_date, is_passive, is_recurring').eq('user_id', user.id)
      .gte('income_date', sixMonthsAgo.toISOString().split('T')[0]),
    supabase.from('expenses').select('amount, expense_date, is_recurring').eq('user_id', user.id)
      .gte('expense_date', sixMonthsAgo.toISOString().split('T')[0]),
    supabase.from('liabilities').select('monthly_payment').eq('user_id', user.id),
  ])

  const monthlyCommitments = (liabilities || []).reduce((s, l) => s + l.monthly_payment, 0)
  return <CashflowClient forecasts={forecasts || []} income={income || []} expenses={expenses || []} monthlyCommitments={monthlyCommitments} userId={user.id} />
}
