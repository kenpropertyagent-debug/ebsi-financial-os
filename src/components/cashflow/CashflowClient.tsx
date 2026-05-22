'use client'
import { useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'

interface IncomeRow { amount: number; income_date: string; is_passive: boolean; is_recurring: boolean }
interface ExpenseRow { amount: number; expense_date: string; is_recurring: boolean }
interface Forecast { forecast_month: string; expected_income: number; expected_expenses: number; expected_balance: number; actual_income: number | null; actual_expenses: number | null }

interface Props {
  forecasts?: Forecast[]
  income: IncomeRow[]
  expenses: ExpenseRow[]
  monthlyCommitments: number
  userId?: string
}

export default function CashflowClient({ income, expenses, monthlyCommitments }: Props) {
  const [horizon, setHorizon] = useState<1|3|6|12>(12)

  // Build forecast data from actual history + projections
  const avgMonthlyIncome = income.length > 0
    ? income.reduce((s, i) => s + i.amount, 0) / 6
    : 0
  const avgMonthlyExpenses = expenses.length > 0
    ? expenses.reduce((s, e) => s + e.amount, 0) / 6
    : monthlyCommitments

  const chartData = Array.from({ length: horizon }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() + i)
    const key = d.toISOString().slice(0, 7)
    const isPast = i === 0

    const actualIncome = isPast ? income.filter(inc => inc.income_date.startsWith(key)).reduce((s, inc) => s + inc.amount, 0) : null
    const actualExpenses = isPast ? expenses.filter(exp => exp.expense_date.startsWith(key)).reduce((s, exp) => s + exp.amount, 0) : null

    const projectedIncome = avgMonthlyIncome
    const projectedExpenses = avgMonthlyExpenses

    return {
      month: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
      Income: actualIncome ?? projectedIncome,
      Expenses: actualExpenses ?? projectedExpenses,
      Cashflow: (actualIncome ?? projectedIncome) - (actualExpenses ?? projectedExpenses),
      projected: actualIncome === null,
    }
  })

  const negativeMonths = chartData.filter(d => d.Cashflow < 0).length
  const bestMonth = chartData.reduce((max, d) => d.Cashflow > max.Cashflow ? d : max, chartData[0])
  const worstMonth = chartData.reduce((min, d) => d.Cashflow < min.Cashflow ? d : min, chartData[0])

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">📊 Cashflow Forecast</h1>
        <p className="text-slate-400 text-sm mt-1">Project your financial future</p>
      </div>

      {/* Alert */}
      {negativeMonths > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-start gap-3">
          <span className="text-xl mt-0.5">⚠️</span>
          <div>
            <div className="text-sm font-semibold text-red-400">Potential Negative Cashflow Detected</div>
            <div className="text-xs text-slate-400 mt-1">
              {negativeMonths} out of {horizon} months show negative cashflow. Consider reducing expenses or increasing income.
            </div>
          </div>
        </div>
      )}

      {/* Horizon selector */}
      <div className="flex items-center gap-2">
        {([1,3,6,12] as const).map(h => (
          <button key={h} onClick={() => setHorizon(h)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${horizon === h ? 'bg-indigo-600 text-white' : 'text-slate-400 bg-white/5 hover:text-white'}`}>
            {h} {h === 1 ? 'Month' : 'Months'}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-white mb-4">{horizon}-Month Cashflow Projection</h3>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
            <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false}/>
            <YAxis tickFormatter={v => `RM${(v/1000).toFixed(0)}k`} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} width={55}/>
            <Tooltip formatter={(v: number) => [formatCurrency(v)]} contentStyle={{ background: 'hsl(222,47%,10%)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', fontSize: '12px', color: '#fff' }}/>
            <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }}/>
            <Bar dataKey="Income" fill="#10B981" radius={[4,4,0,0]} opacity={0.8}/>
            <Bar dataKey="Expenses" fill="#EF4444" radius={[4,4,0,0]} opacity={0.8}/>
            <Line type="monotone" dataKey="Cashflow" stroke="#6366F1" strokeWidth={2.5} dot={{ fill: '#6366F1', r: 4 }}/>
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="text-xs text-slate-500 mb-1">Avg Monthly Income</div>
          <div className="text-lg font-bold text-emerald-400">{formatCurrency(avgMonthlyIncome, 'MYR', true)}</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-xs text-slate-500 mb-1">Avg Monthly Expenses</div>
          <div className="text-lg font-bold text-red-400">{formatCurrency(avgMonthlyExpenses, 'MYR', true)}</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-xs text-slate-500 mb-1">Best Month</div>
          <div className="text-lg font-bold text-white">{bestMonth?.month}</div>
          <div className="text-xs text-emerald-400">{formatCurrency(bestMonth?.Cashflow || 0, 'MYR', true)}</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-xs text-slate-500 mb-1">⚠️ Negative Months</div>
          <div className={`text-lg font-bold ${negativeMonths > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{negativeMonths}</div>
          <div className="text-xs text-slate-500">of {horizon} projected</div>
        </div>
      </div>

      {/* Monthly table */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5">
          <h3 className="text-sm font-semibold text-white">Month-by-Month Projection</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-5 py-3 text-xs text-slate-500">Month</th>
                <th className="text-right px-4 py-3 text-xs text-slate-500">Expected Income</th>
                <th className="text-right px-4 py-3 text-xs text-slate-500">Expected Expenses</th>
                <th className="text-right px-5 py-3 text-xs text-slate-500">Cashflow</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {chartData.map((d, i) => (
                <tr key={i} className={`${d.Cashflow < 0 ? 'bg-red-500/5' : ''} hover:bg-white/2`}>
                  <td className="px-5 py-3 text-slate-300">{d.month} {d.projected && <span className="text-[10px] text-slate-600 ml-1">projected</span>}</td>
                  <td className="px-4 py-3 text-right text-emerald-400 font-medium">{formatCurrency(d.Income)}</td>
                  <td className="px-4 py-3 text-right text-red-400 font-medium">{formatCurrency(d.Expenses)}</td>
                  <td className={`px-5 py-3 text-right font-bold ${d.Cashflow >= 0 ? 'text-white' : 'text-red-400'}`}>
                    {d.Cashflow >= 0 ? '+' : ''}{formatCurrency(d.Cashflow)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
