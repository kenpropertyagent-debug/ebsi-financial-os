import { createClient } from '@/lib/supabase/server'
import {
  formatCurrency, calcNetWorth, calcDebtRatio, calcRunway,
  calcLiquidityScore, calcFinancialFreedomScore, getLiquidityRisk
} from '@/lib/utils'
import DashboardCharts from '@/components/dashboard/DashboardCharts'
import MetricCard from '@/components/dashboard/MetricCard'
import FreedomScoreGauge from '@/components/dashboard/FreedomScoreGauge'

export const metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Parallel data fetch
  const [
    { data: profile },
    { data: assets },
    { data: liabilities },
    { data: bankAccounts },
    { data: recentExpenses },
    { data: recentIncome },
    { data: netWorthHistory },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('assets').select('*').eq('user_id', user.id),
    supabase.from('liabilities').select('*').eq('user_id', user.id),
    supabase.from('bank_accounts').select('*').eq('user_id', user.id),
    supabase.from('expenses').select('*').eq('user_id', user.id)
      .gte('expense_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0])
      .order('expense_date', { ascending: false }),
    supabase.from('income').select('*').eq('user_id', user.id)
      .gte('income_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]),
    supabase.from('net_worth_snapshots').select('*').eq('user_id', user.id)
      .order('snapshot_date', { ascending: false }).limit(12),
  ])

  // Core calculations
  const totalAssets = (assets || []).reduce((s, a) => s + a.current_value, 0)
  const totalLiabilities = (liabilities || []).reduce((s, l) => s + l.outstanding_balance, 0)
  const liquidCash = (bankAccounts || []).filter(b => b.is_liquid).reduce((s, b) => s + b.balance, 0)
  const monthlyCommitments = (liabilities || []).reduce((s, l) => s + l.monthly_payment, 0)
  const monthlyIncome = (recentIncome || []).reduce((s, i) => s + i.amount, 0)
  const monthlyExpenses = (recentExpenses || []).reduce((s, e) => s + e.amount, 0)
  const passiveIncomeMonthly = (recentIncome || []).filter(i => i.is_passive).reduce((s, i) => s + i.amount, 0)

  const netWorth = calcNetWorth(totalAssets, totalLiabilities)
  const debtRatio = calcDebtRatio(totalAssets, totalLiabilities)
  const runway = calcRunway(liquidCash, monthlyCommitments)
  const liquidityScore = calcLiquidityScore(runway)
  const ffScore = calcFinancialFreedomScore(passiveIncomeMonthly, monthlyCommitments || profile?.monthly_commitment_target || 1)
  const monthlyCashflow = monthlyIncome - monthlyExpenses
  const liquidityRisk = getLiquidityRisk(runway)
  const ffTarget = profile?.financial_freedom_target || 20000
  const currency = profile?.currency || 'MYR'

  const metrics = [
    {
      label: 'Net Worth',
      value: formatCurrency(netWorth, currency, true),
      icon: '📈',
      color: 'indigo',
      change: '+2.4% this month',
      positive: true,
    },
    {
      label: 'Liquid Cash',
      value: formatCurrency(liquidCash, currency, true),
      icon: '💧',
      color: 'teal',
      change: `${runway.toFixed(1)} months runway`,
      positive: runway >= 3,
    },
    {
      label: 'Monthly Cashflow',
      value: formatCurrency(monthlyCashflow, currency, true),
      icon: '💸',
      color: monthlyCashflow >= 0 ? 'green' : 'red',
      change: `Income: ${formatCurrency(monthlyIncome, currency, true)}`,
      positive: monthlyCashflow >= 0,
    },
    {
      label: 'Monthly Commitments',
      value: formatCurrency(monthlyCommitments, currency, true),
      icon: '📋',
      color: 'amber',
      change: `Debt ratio: ${debtRatio.toFixed(0)}%`,
      positive: debtRatio < 50,
    },
    {
      label: 'Passive Income',
      value: formatCurrency(passiveIncomeMonthly, currency, true),
      icon: '🌱',
      color: 'green',
      change: `${ffScore.toFixed(0)}% of freedom target`,
      positive: true,
    },
    {
      label: 'Emergency Fund',
      value: `${runway.toFixed(1)} months`,
      icon: '🛡️',
      color: liquidityRisk,
      change: liquidityRisk === 'green' ? 'Healthy ✓' : liquidityRisk === 'yellow' ? 'Build up savings' : '⚠️ Critical — top up now',
      positive: liquidityRisk === 'green',
    },
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},{' '}
            <span className="gradient-text">{profile?.full_name?.split(' ')[0] || 'there'}</span> 👋
          </h1>
          <p className="text-slate-400 text-sm mt-1">Your financial snapshot — {new Date().toLocaleDateString('en-MY', { month: 'long', year: 'numeric' })}</p>
        </div>
        <a href="/dashboard/quick-capture" className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2">
          <span>⚡</span> Quick Capture
        </a>
      </div>

      {/* Freedom Score Banner */}
      <div className="glass-card p-6 border-indigo-500/20">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <FreedomScoreGauge score={ffScore} />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg font-bold text-white">Financial Freedom Score</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                ffScore >= 100 ? 'bg-green-400/15 text-green-400 border border-green-400/20' :
                ffScore >= 50 ? 'bg-amber-400/15 text-amber-400 border border-amber-400/20' :
                'bg-red-400/15 text-red-400 border border-red-400/20'
              }`}>
                {ffScore >= 100 ? '🎉 FINANCIALLY FREE' : ffScore >= 75 ? 'Getting Close' : ffScore >= 50 ? 'On Track' : 'Building Foundation'}
              </span>
            </div>
            <p className="text-slate-400 text-sm">
              Your passive income covers <strong className="text-white">{ffScore.toFixed(1)}%</strong> of your monthly commitments.
              {ffScore < 100 && ` You need ${formatCurrency(Math.max(0, monthlyCommitments - passiveIncomeMonthly), currency)}/month more in passive income to reach financial freedom.`}
            </p>
            <div className="mt-3">
              <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                <span>Current: {formatCurrency(passiveIncomeMonthly, currency)}/mo passive</span>
                <span>Target: {formatCurrency(ffTarget, currency)}/mo</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000"
                  style={{ width: `${Math.min(ffScore, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((m) => (
          <MetricCard key={m.label} {...m} />
        ))}
      </div>

      {/* Charts Row */}
      <DashboardCharts
        netWorthHistory={(netWorthHistory || []).reverse()}
        monthlyExpenses={monthlyExpenses}
        monthlyIncome={monthlyIncome}
        passiveIncome={passiveIncomeMonthly}
        ffTarget={ffTarget}
        currency={currency}
        recentExpenses={recentExpenses || []}
      />
    </div>
  )
}
