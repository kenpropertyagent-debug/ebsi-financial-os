import { createClient } from '@/lib/supabase/server'
import LiquidityClient from '@/components/liquidity/LiquidityClient'
export const metadata = { title: 'Liquidity Analyzer' }

export default async function LiquidityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: bankAccounts }, { data: liabilities }] = await Promise.all([
    supabase.from('bank_accounts').select('*').eq('user_id', user.id),
    supabase.from('liabilities').select('*').eq('user_id', user.id),
  ])

  return <LiquidityClient bankAccounts={bankAccounts || []} liabilities={liabilities || []} userId={user.id} />
}
