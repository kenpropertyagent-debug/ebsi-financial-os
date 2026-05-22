import { createClient } from '@/lib/supabase/server'
import NetWorthClient from '@/components/net-worth/NetWorthClient'
export const metadata = { title: 'Net Worth Tracker' }

export default async function NetWorthPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: assets }, { data: liabilities }, { data: history }] = await Promise.all([
    supabase.from('assets').select('*').eq('user_id', user.id).order('current_value', { ascending: false }),
    supabase.from('liabilities').select('*').eq('user_id', user.id).order('outstanding_balance', { ascending: false }),
    supabase.from('net_worth_snapshots').select('*').eq('user_id', user.id).order('snapshot_date', { ascending: true }).limit(24),
  ])

  return <NetWorthClient assets={assets || []} liabilities={liabilities || []} history={history || []} userId={user.id} />
}
