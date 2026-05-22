import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  calcNetWorth,
  calcDebtRatio,
  calcRunway,
  calcLiquidityScore,
  calcFinancialFreedomScore,
  calcMonthlyCashflow,
  getLiquidityRisk,
} from '@/lib/utils'

/**
 * GET /api/dashboard/snapshot
 * Returns the complete financial snapshot for the authenticated user.
 * Used by dashboard, AI coach, and PDF reports.
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString().split('T')[0]

  const [
    { data: profile },
    { data: assets },
    { data: liabilities },
    { data: bankAccounts },
    { data: monthlyIncome },
    { data: monthlyExpenses },
    { data: commissions },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('assets').select('*').eq('user_id', user.id),
    supabase.from('liabilities').select('*').eq('user_id', user.id),
    supabase.from('bank_accounts').select('*').eq('user_id', user.id),
    supabase.from('income').select('*').eq('user_id', user.id).gte('income_date', thisMonthStart),
    supabase.from('expenses').select('*').eq('user_id', user.id).gte('expense_date', thisMonthStart),
    supabase.from('commission_deals').select('*').eq('user_id', user.id).neq('status', 'paid'),
  ])

  // --- Core calculations ---
  const totalAssets = (assets || []).reduce((s, a) => s + a.current_value, 0)
  const totalLiabilities = (liabilities || []).reduce((s, l) => s + l.outstanding_balance, 0)
  const liquidCash = (bankAccounts || []).filter(b => b.is_liquid).reduce((s, b) => s + b.balance, 0)
  const monthlyCommitments = (liabilities || []).reduce((s, l) => s + l.monthly_payment, 0)
  const totalMonthlyIncome = (monthlyIncome || []).reduce((s, i) => s + i.amount, 0)
  const totalMonthlyExpenses = (monthlyExpenses || []).reduce((s, e) => s + e.amount, 0)
  const passiveIncomeMonthly = (monthlyIncome || []).filter(i => i.is_passive).reduce((s, i) => s + i.amount, 0)
  const pendingCommissions = (commissions || []).reduce((s, c) => s + c.commission_amount, 0)

  const netWorth = calcNetWorth(totalAssets, totalLiabilities)
  const debtRatio = calcDebtRatio(totalAssets, totalLiabilities)
  const runway = calcRunway(liquidCash, monthlyCommitments)
  const liquidityScore = calcLiquidityScore(runway)
  const liquidityRisk = getLiquidityRisk(runway)
  const ffScore = calcFinancialFreedomScore(
    passiveIncomeMonthly,
    monthlyCommitments || profile?.monthly_commitment_target || 1
  )
  const monthlyCashflow = calcMonthlyCashflow(totalMonthlyIncome, totalMonthlyExpenses)
  const ffTarget = profile?.financial_freedom_target || 20000
  const ffGap = Math.max(0, ffTarget - passiveIncomeMonthly)

  return NextResponse.json({
    // Profile
    currency: profile?.currency || 'MYR',
    name: profile?.full_name,
    ffTarget,
    emergencyFundMonthsTarget: profile?.emergency_fund_months_target || 6,

    // Wealth
    netWorth,
    totalAssets,
    totalLiabilities,
    debtRatio,

    // Liquidity
    liquidCash,
    runway,
    liquidityScore,
    liquidityRisk,

    // Cashflow
    monthlyCommitments,
    totalMonthlyIncome,
    totalMonthlyExpenses,
    monthlyCashflow,

    // Freedom
    passiveIncomeMonthly,
    ffScore,
    ffGap,

    // Pipeline
    pendingCommissions,

    // Breakdown
    assets: assets || [],
    liabilities: liabilities || [],
    bankAccounts: bankAccounts || [],
  })
}
