import { createClient } from '@/lib/supabase/server'
import ExpensesClient from '@/components/expenses/ExpensesClient'
export const metadata = { title: 'Expense Tracker' }

export default async function ExpensesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const thisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

  const [{ data: expenses }, { data: categories }, { data: budgets }] = await Promise.all([
    supabase.from('expenses').select('*').eq('user_id', user.id)
      .order('expense_date', { ascending: false }).limit(100),
    supabase.from('expense_categories').select('*'),
    supabase.from('budgets').select('*').eq('user_id', user.id)
      .gte('budget_month', thisMonth),
  ])

  return <ExpensesClient expenses={expenses || []} categories={categories || []} budgets={budgets || []} userId={user.id} />
}
