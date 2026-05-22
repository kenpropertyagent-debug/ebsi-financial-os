import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  let query = supabase
    .from('commission_deals')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Compute pipeline summary
  const pending = (data || []).filter(d => d.status !== 'paid').reduce((s, d) => s + d.commission_amount, 0)
  const collected = (data || []).filter(d => d.status === 'paid').reduce((s, d) => s + d.commission_amount, 0)
  const upcomingClaim = (data || []).filter(d => d.status === 'pending_claim').reduce((s, d) => s + d.commission_amount, 0)

  return NextResponse.json({ deals: data, summary: { pending, collected, upcomingClaim } })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  if (!body.project_name || body.commission_amount === undefined) {
    return NextResponse.json({ error: 'Missing required fields: project_name, commission_amount' }, { status: 400 })
  }

  const commissionAmount = parseFloat(body.commission_amount)
  const coAgentSplit = body.co_agent_split ? parseFloat(body.co_agent_split) / 100 : null
  const netCommission = coAgentSplit ? commissionAmount * (1 - coAgentSplit) : commissionAmount

  const { data, error } = await supabase
    .from('commission_deals')
    .insert({
      user_id: user.id,
      project_name: body.project_name,
      customer_name: body.customer_name || null,
      property_address: body.property_address || null,
      property_value: body.property_value ? parseFloat(body.property_value) : null,
      commission_rate: body.commission_rate ? parseFloat(body.commission_rate) / 100 : null,
      commission_amount: commissionAmount,
      status: body.status || 'prospect',
      expected_payment_date: body.expected_payment_date || null,
      actual_payment_date: body.actual_payment_date || null,
      co_agent: body.co_agent || null,
      co_agent_split: coAgentSplit,
      net_commission: netCommission,
      notes: body.notes || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const body = await request.json()

  // Auto-set actual_payment_date when status becomes 'paid'
  if (body.status === 'paid' && !body.actual_payment_date) {
    body.actual_payment_date = new Date().toISOString().split('T')[0]
  }

  const { data, error } = await supabase
    .from('commission_deals')
    .update(body)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // When status is 'paid', also create an income record
  if (body.status === 'paid' && data) {
    await supabase.from('income').insert({
      user_id: user.id,
      category_name: 'Property Commission',
      amount: data.net_commission || data.commission_amount,
      source: data.project_name,
      description: `Commission from ${data.customer_name || data.project_name}`,
      income_date: data.actual_payment_date || new Date().toISOString().split('T')[0],
      is_passive: false,
    })
  }

  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { error } = await supabase
    .from('commission_deals')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
