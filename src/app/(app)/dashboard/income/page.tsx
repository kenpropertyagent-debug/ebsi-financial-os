import { createClient } from '@/lib/supabase/server'
import IncomeClient from '@/components/income/IncomeClient'
export const metadata = { title: 'Income Tracker' }

export default async function IncomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: income } = await supabase.from('income').select('*')
    .eq('user_id', user.id).order('income_date', { ascending: false }).limit(100)

  return <IncomeClient income={income || []} userId={user.id} />
}
