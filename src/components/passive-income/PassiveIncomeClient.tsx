'use client'
import { formatCurrency, calcFinancialFreedomScore } from '@/lib/utils'
import type { Income } from '@/types/database'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const PASSIVE_SOURCES = ['Rental Income','Dividend Income','REIT Distribution','Interest Income','Business Profit Sharing','Referral Income']

interface Props {
  income: Income[]
  profile: { financial_freedom_target: number; currency: string } | null
  monthlyCommitments: number
  userId?: string // reserved for future server actions
}

export default function PassiveIncomeClient({ income, profile, monthlyCommitments }: Props) {
  const currency = profile?.currency || 'MYR'
  const ffTarget = profile?.financial_freedom_target || 20000

  const thisMonth = new Date().toISOString().slice(0, 7)
  const thisMonthPassive = income.filter(i => i.income_date.startsWith(thisMonth)).reduce((s, i) => s + i.amount, 0)
  const ffScore = calcFinancialFreedomScore(thisMonthPassive, monthlyCommitments || ffTarget)

  // By source
  const bySource = PASSIVE_SOURCES.map(src => ({
    name: src.replace(' Income','').replace(' Distribution',''),
    amount: income.filter(i => i.category_name === src && i.income_date.startsWith(thisMonth)).reduce((s, i) => s + i.amount, 0),
  })).filter(s => s.amount > 0)

  // 6-month trend
  const trendData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - (5 - i))
    const key = d.toISOString().slice(0, 7)
    return {
      month: d.toLocaleString('default', { month: 'short' }),
      amount: income.filter(inc => inc.income_date.startsWith(key)).reduce((s, inc) => s + inc.amount, 0),
    }
  })

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">🌱 Passive Income Tracker</h1>
        <p className="text-slate-400 text-sm mt-1">Money that works for you while you sleep</p>
      </div>

      {/* Freedom Progress Banner */}
      <div className="glass-card p-6 border-emerald-500/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs text-slate-500 mb-1">Financial Freedom Progress</div>
            <div className="text-3xl font-bold text-white">{ffScore.toFixed(1)}%</div>
            <div className="text-sm text-slate-400 mt-1">
              {formatCurrency(thisMonthPassive, currency)}/mo passive covers {ffScore.toFixed(1)}% of commitments
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500 mb-1">Gap to Freedom</div>
            <div className="text-xl font-bold text-amber-400">{formatCurrency(Math.max(0, ffTarget - thisMonthPassive), currency, true)}/mo</div>
          </div>
        </div>
        <div className="w-full bg-white/5 rounded-full h-4 overflow-hidden">
          <div
            className="h-4 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-1000 flex items-center justify-end pr-2"
            style={{ width: `${Math.min(ffScore, 100)}%` }}
          >
            {ffScore >= 15 && <span className="text-[9px] text-white font-bold">{ffScore.toFixed(0)}%</span>}
          </div>
        </div>
        <div className="flex justify-between text-xs text-slate-500 mt-2">
          <span>RM 0</span>
          <span>Target: {formatCurrency(ffTarget, currency, true)}/mo</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Trend */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">6-Month Passive Income Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false}/>
              <YAxis tickFormatter={v => `RM${(v/1000).toFixed(0)}k`} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} width={50}/>
              <Tooltip formatter={(v: number) => [formatCurrency(v), 'Passive Income']} contentStyle={{ background: 'hsl(222,47%,10%)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', fontSize: '12px', color: '#fff' }}/>
              <Bar dataKey="amount" fill="#10B981" radius={[6,6,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* By Source */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">By Source (This Month)</h3>
          {bySource.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-500 text-sm text-center">
              No passive income this month.<br/>Record rental, dividends, or REIT income.
            </div>
          ) : (
            <div className="space-y-3">
              {bySource.map(s => (
                <div key={s.name}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-slate-400">{s.name}</span>
                    <span className="text-emerald-400 font-semibold">{formatCurrency(s.amount, currency)}</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${(s.amount / thisMonthPassive) * 100}%` }}/>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Transactions */}
      <div className="glass-card">
        <div className="px-5 py-4 border-b border-white/5">
          <h3 className="text-sm font-semibold text-white">Passive Income History</h3>
        </div>
        <div className="divide-y divide-white/5">
          {income.length === 0 && <div className="px-5 py-10 text-center text-slate-500 text-sm">Record income via the Income Tracker — mark as passive 🌱</div>}
          {income.slice(0, 20).map(i => (
            <div key={i.id} className="flex items-center gap-4 px-5 py-3.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center text-sm">🌱</div>
              <div className="flex-1">
                <div className="text-sm font-medium text-white">{i.source || i.category_name}</div>
                <div className="text-xs text-slate-500">{new Date(i.income_date).toLocaleDateString('en-MY')} · {i.category_name}</div>
              </div>
              <div className="text-sm font-bold text-emerald-400">+ {formatCurrency(i.amount, currency)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
