import { createClient } from '@/lib/supabase/server'
import FreedomPlannerClient from '@/components/freedom-planner/FreedomPlannerClient'
export const metadata = { title: 'Financial Freedom Planner' }

export default async function FreedomPlannerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: goals }, { data: profile }, { data: income }] = await Promise.all([
    supabase.from('financial_goals').select('*').eq('user_id', user.id).order('is_primary', { ascending: false }),
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('income').select('amount, is_passive, income_date').eq('user_id', user.id)
      .gte('income_date', new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1).toISOString().split('T')[0]),
  ])

  const thisMonth = new Date().toISOString().slice(0, 7)
  const currentPassive = (income || []).filter(i => i.is_passive && i.income_date.startsWith(thisMonth)).reduce((s, i) => s + i.amount, 0)

  return <FreedomPlannerClient goals={goals || []} profile={profile} currentPassive={currentPassive} userId={user.id} />
}
