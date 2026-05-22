'use client'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import { formatCurrency, getMonthLabel } from '@/lib/utils'
import type { NetWorthSnapshot, Expense } from '@/types/database'

interface Props {
  netWorthHistory: NetWorthSnapshot[]
  monthlyExpenses: number
  monthlyIncome: number
  passiveIncome: number
  ffTarget: number
  currency: string
  recentExpenses: Expense[]
}

const TOOLTIP_STYLE = {
  backgroundColor: 'hsl(222,47%,10%)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
  color: '#fff',
  fontSize: '12px',
}

const EXPENSE_COLORS = [
  '#6366F1','#8B5CF6','#EC4899','#EF4444','#F97316',
  '#F59E0B','#10B981','#14B8A6','#06B6D4','#3B82F6'
]

export default function DashboardCharts({ netWorthHistory, monthlyExpenses, monthlyIncome, passiveIncome, ffTarget, currency, recentExpenses }: Props) {
  // Category breakdown
  const categoryMap: Record<string, number> = {}
  recentExpenses.forEach(e => {
    const cat = e.category_name || 'Others'
    categoryMap[cat] = (categoryMap[cat] || 0) + e.amount
  })
  const categoryData = Object.entries(categoryMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  // Income vs Expense bar
  const cashflowData = [
    { name: 'Income', value: monthlyIncome, fill: '#10B981' },
    { name: 'Expenses', value: monthlyExpenses, fill: '#EF4444' },
    { name: 'Passive', value: passiveIncome, fill: '#6366F1' },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Net Worth Trend */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Net Worth History</h3>
        {netWorthHistory.length > 1 ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={netWorthHistory} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <defs>
                <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
              <XAxis dataKey="snapshot_date" tickFormatter={getMonthLabel} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false}/>
              <YAxis tickFormatter={(v) => formatCurrency(v, currency, true)} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} width={70}/>
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [formatCurrency(v, currency), 'Net Worth']}/>
              <Area type="monotone" dataKey="net_worth" stroke="#6366F1" fill="url(#nwGrad)" strokeWidth={2.5}/>
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-48 flex items-center justify-center text-slate-500 text-sm">
            Add assets and liabilities to see your net worth trend
          </div>
        )}
      </div>

      {/* Monthly Cashflow Bar */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-white mb-4">This Month&apos;s Cashflow</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={cashflowData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false}/>
            <YAxis tickFormatter={(v) => formatCurrency(v, currency, true)} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} width={70}/>
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [formatCurrency(v, currency)]}/>
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {cashflowData.map((entry, index) => (
                <Cell key={index} fill={entry.fill}/>
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Expense Breakdown */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Expense Breakdown</h3>
        {categoryData.length > 0 ? (
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                  {categoryData.map((_, index) => (
                    <Cell key={index} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]}/>
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [formatCurrency(v, currency)]}/>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {categoryData.slice(0, 6).map((c, i) => (
                <div key={c.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: EXPENSE_COLORS[i % EXPENSE_COLORS.length] }}/>
                    <span className="text-xs text-slate-400 truncate max-w-24">{c.name}</span>
                  </div>
                  <span className="text-xs text-white font-medium">{formatCurrency(c.value, currency, true)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-40 flex items-center justify-center text-slate-500 text-sm">
            No expenses recorded this month
          </div>
        )}
      </div>

      {/* Freedom Progress */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Financial Freedom Progress</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs mb-2">
              <span className="text-slate-400">Passive Income</span>
              <span className="text-white font-semibold">{formatCurrency(passiveIncome, currency)}/mo</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-3">
              <div className="h-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                style={{ width: `${Math.min((passiveIncome / ffTarget) * 100, 100)}%` }}/>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/4 rounded-xl p-3">
              <div className="text-xs text-slate-500 mb-1">Target / month</div>
              <div className="text-base font-bold text-white">{formatCurrency(ffTarget, currency, true)}</div>
            </div>
            <div className="bg-white/4 rounded-xl p-3">
              <div className="text-xs text-slate-500 mb-1">Gap to freedom</div>
              <div className="text-base font-bold text-amber-400">{formatCurrency(Math.max(0, ffTarget - passiveIncome), currency, true)}</div>
            </div>
          </div>
          <p className="text-xs text-slate-500 text-center">
            {passiveIncome >= ffTarget
              ? '🎉 Congratulations! You are financially free!'
              : `${((passiveIncome / ffTarget) * 100).toFixed(1)}% of the way to financial freedom`}
          </p>
        </div>
      </div>
    </div>
  )
}
