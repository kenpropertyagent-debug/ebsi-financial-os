import { createClient } from '@/lib/supabase/server'
import PassiveIncomeClient from '@/components/passive-income/PassiveIncomeClient'
export const metadata = { title: 'Passive Income Tracker' }

export default async function PassiveIncomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: income }, { data: profile }, { data: liabilities }] = await Promise.all([
    supabase.from('income').select('*').eq('user_id', user.id).eq('is_passive', true).order('income_date', { ascending: false }),
    supabase.from('profiles').select('financial_freedom_target, currency').eq('id', user.id).single(),
    supabase.from('liabilities').select('monthly_payment').eq('user_id', user.id),
  ])

  const monthlyCommitments = (liabilities || []).reduce((s, l) => s + l.monthly_payment, 0)
  return <PassiveIncomeClient income={income || []} profile={profile} monthlyCommitments={monthlyCommitments} userId={user.id} />
}
