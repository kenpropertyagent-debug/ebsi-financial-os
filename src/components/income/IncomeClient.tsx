'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import type { Income } from '@/types/database'
import toast from 'react-hot-toast'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'

const INCOME_CATEGORIES = [
  { name: 'Property Commission', passive: false },
  { name: 'Rental Income', passive: true },
  { name: 'Dividend Income', passive: true },
  { name: 'Salary', passive: false },
  { name: 'Business Income', passive: false },
  { name: 'Referral Income', passive: true },
  { name: 'REIT Distribution', passive: true },
  { name: 'Interest Income', passive: true },
  { name: 'Business Profit Sharing', passive: true },
  { name: 'Other Income', passive: false },
]

interface Props { income: Income[]; userId: string }

export default function IncomeClient({ income: initial, userId }: Props) {
  const [income, setIncome] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    amount: '', category_name: 'Property Commission',
    source: '', description: '', income_date: new Date().toISOString().split('T')[0],
    is_recurring: false,
  })
  const supabase = createClient()

  const thisMonth = new Date().toISOString().slice(0, 7)
  const thisMonthIncome = income.filter(i => i.income_date.startsWith(thisMonth))
  const totalActive = thisMonthIncome.filter(i => !i.is_passive).reduce((s, i) => s + i.amount, 0)
  const totalPassive = thisMonthIncome.filter(i => i.is_passive).reduce((s, i) => s + i.amount, 0)

  // Monthly trend (last 6 months)
  const trendData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - (5 - i))
    const key = d.toISOString().slice(0, 7)
    const monthIncome = income.filter(inc => inc.income_date.startsWith(key))
    return {
      month: d.toLocaleString('default', { month: 'short' }),
      Active: monthIncome.filter(i => !i.is_passive).reduce((s, i) => s + i.amount, 0),
      Passive: monthIncome.filter(i => i.is_passive).reduce((s, i) => s + i.amount, 0),
    }
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const cat = INCOME_CATEGORIES.find(c => c.name === form.category_name)
    const { data, error } = await supabase.from('income').insert({
      user_id: userId,
      amount: parseFloat(form.amount),
      category_name: form.category_name,
      source: form.source || null,
      description: form.description || null,
      income_date: form.income_date,
      is_passive: cat?.passive || false,
      is_recurring: form.is_recurring,
    }).select().single()
    if (error) toast.error(error.message)
    else { toast.success('Income recorded!'); setIncome([data, ...income]); setShowForm(false) }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('income').delete().eq('id', id)
    if (!error) { setIncome(income.filter(i => i.id !== id)); toast.success('Deleted') }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Income Tracker</h1>
          <p className="text-slate-400 text-sm mt-1">
            This month: Active <span className="text-white font-semibold">{formatCurrency(totalActive)}</span> · Passive <span className="text-green-400 font-semibold">{formatCurrency(totalPassive)}</span>
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all">
          + Record Income
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card p-4">
          <div className="text-xs text-slate-500 mb-1">Total Income (Month)</div>
          <div className="text-xl font-bold text-white">{formatCurrency(totalActive + totalPassive, 'MYR', true)}</div>
        </div>
        <div className="glass-card p-4 border-emerald-500/20">
          <div className="text-xs text-slate-500 mb-1">🌱 Passive Income</div>
          <div className="text-xl font-bold text-emerald-400">{formatCurrency(totalPassive, 'MYR', true)}</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-xs text-slate-500 mb-1">Active Income</div>
          <div className="text-xl font-bold text-indigo-400">{formatCurrency(totalActive, 'MYR', true)}</div>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="glass-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">Record Income</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Amount (MYR) *</label>
              <input type="number" step="0.01" min="0.01" required value={form.amount}
                onChange={e => setForm({...form, amount: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-emerald-500 focus:outline-none" placeholder="0.00"/>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Category *</label>
              <select value={form.category_name} onChange={e => setForm({...form, category_name: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-emerald-500 focus:outline-none">
                {INCOME_CATEGORIES.map(c => (
                  <option key={c.name} value={c.name} className="bg-slate-800">
                    {c.passive ? '🌱 ' : ''}{c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Source / Payer</label>
              <input type="text" value={form.source} onChange={e => setForm({...form, source: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-emerald-500 focus:outline-none" placeholder="Client, tenant, company..."/>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Date *</label>
              <input type="date" required value={form.income_date} onChange={e => setForm({...form, income_date: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-emerald-500 focus:outline-none"/>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input type="checkbox" checked={form.is_recurring} onChange={e => setForm({...form, is_recurring: e.target.checked})} className="rounded border-white/20"/>
              Recurring monthly
            </label>
            <div className="flex-1"/>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
            <button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl text-sm font-medium disabled:opacity-50">
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      )}

      {/* Trend Chart */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-white mb-4">6-Month Income Trend</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={trendData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
            <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false}/>
            <YAxis tickFormatter={v => `RM${(v/1000).toFixed(0)}k`} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} width={55}/>
            <Tooltip formatter={(v: number) => [formatCurrency(v)]} contentStyle={{ background: 'hsl(222,47%,10%)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', fontSize: '12px', color: '#fff' }}/>
            <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }}/>
            <Bar dataKey="Active" fill="#6366F1" radius={[4,4,0,0]} stackId="a"/>
            <Bar dataKey="Passive" fill="#10B981" radius={[4,4,0,0]} stackId="a"/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Transactions */}
      <div className="glass-card">
        <div className="px-5 py-4 border-b border-white/5">
          <h3 className="text-sm font-semibold text-white">Income History</h3>
        </div>
        <div className="divide-y divide-white/5">
          {income.length === 0 && <div className="px-5 py-10 text-center text-slate-500 text-sm">No income recorded yet</div>}
          {income.map(i => (
            <div key={i.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/2 transition-colors group">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center text-sm shrink-0">
                {i.is_passive ? '🌱' : '💰'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{i.source || i.category_name}</div>
                <div className="text-xs text-slate-500">{new Date(i.income_date).toLocaleDateString('en-MY')} · {i.category_name}</div>
              </div>
              {i.is_passive && <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">Passive</span>}
              <div className="text-sm font-bold text-emerald-400">+ {formatCurrency(i.amount)}</div>
              <button onClick={() => handleDelete(i.id)} className="text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 text-xs px-2">✕</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
