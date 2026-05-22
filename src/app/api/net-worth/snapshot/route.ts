import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST: Create a new net worth snapshot (call monthly)
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [{ data: assets }, { data: liabilities }, { data: bankAccounts }, { data: income }] = await Promise.all([
    supabase.from('assets').select('current_value, is_liquid').eq('user_id', user.id),
    supabase.from('liabilities').select('outstanding_balance').eq('user_id', user.id),
    supabase.from('bank_accounts').select('balance, is_liquid').eq('user_id', user.id),
    supabase.from('income').select('amount, is_passive, income_date').eq('user_id', user.id)
      .gte('income_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]),
  ])

  const totalAssets = (assets || []).reduce((s, a) => s + a.current_value, 0)
  const totalLiabilities = (liabilities || []).reduce((s, l) => s + l.outstanding_balance, 0)
  const liquidAssets = [
    ...(assets || []).filter(a => a.is_liquid).map(a => a.current_value),
    ...(bankAccounts || []).filter(b => b.is_liquid).map(b => b.balance),
  ].reduce((s, v) => s + v, 0)
  const passiveIncomeMonthly = (income || []).filter(i => i.is_passive).reduce((s, i) => s + i.amount, 0)

  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase.from('net_worth_snapshots').upsert({
    user_id: user.id,
    snapshot_date: today,
    total_assets: totalAssets,
    total_liabilities: totalLiabilities,
    liquid_assets: liquidAssets,
    passive_income_monthly: passiveIncomeMonthly,
  }, { onConflict: 'user_id,snapshot_date' }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase.from('net_worth_snapshots').select('*')
    .eq('user_id', user.id).order('snapshot_date', { ascending: true }).limit(24)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
