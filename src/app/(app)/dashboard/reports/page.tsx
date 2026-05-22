import { createClient } from '@/lib/supabase/server'
import ReportsClient from '@/components/reports/ReportsClient'
export const metadata = { title: 'Reports' }

export default async function ReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: profile }, { data: assets }, { data: liabilities }, { data: income }, { data: expenses }, { data: bankAccounts }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('assets').select('*').eq('user_id', user.id),
    supabase.from('liabilities').select('*').eq('user_id', user.id),
    supabase.from('income').select('*').eq('user_id', user.id)
      .gte('income_date', new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]),
    supabase.from('expenses').select('*').eq('user_id', user.id)
      .gte('expense_date', new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]),
    supabase.from('bank_accounts').select('*').eq('user_id', user.id),
  ])

  const reportData = { profile, assets: assets || [], liabilities: liabilities || [], income: income || [], expenses: expenses || [], bankAccounts: bankAccounts || [] }

  return <ReportsClient reportData={reportData} />
}
