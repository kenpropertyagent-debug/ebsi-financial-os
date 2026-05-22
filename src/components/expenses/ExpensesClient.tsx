'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import type { Expense } from '@/types/database'
import toast from 'react-hot-toast'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

interface Props {
  expenses: Expense[]
  categories: { id: string; name: string; icon: string }[]
  budgets: { category_name: string; budgeted_amount: number }[]
  userId: string
}

const EXPENSE_CATEGORIES = [
  'Food','Fuel','Utilities','Mortgage','Car Loan','Insurance',
  'Family','Education','Entertainment','Medical','Business','Others'
]

export default function ExpensesClient({ expenses: initial, categories, budgets, userId }: Props) {
  const [expenses, setExpenses] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    amount: '',
    category_name: 'Food',
    merchant: '',
    description: '',
    expense_date: new Date().toISOString().split('T')[0],
    is_recurring: false,
  })
  const supabase = createClient()

  const totalThisMonth = expenses.reduce((s, e) => s + e.amount, 0)
  const byCategory = EXPENSE_CATEGORIES.map(cat => ({
    name: cat,
    amount: expenses.filter(e => e.category_name === cat).reduce((s, e) => s + e.amount, 0),
  })).filter(c => c.amount > 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { data, error } = await supabase.from('expenses').insert({
      user_id: userId,
      amount: parseFloat(form.amount),
      category_name: form.category_name,
      merchant: form.merchant || null,
      description: form.description || null,
      expense_date: form.expense_date,
      is_recurring: form.is_recurring,
    }).select().single()

    if (error) toast.error(error.message)
    else {
      toast.success('Expense added!')
      setExpenses([data, ...expenses])
      setShowForm(false)
      setForm({ amount: '', category_name: 'Food', merchant: '', description: '', expense_date: new Date().toISOString().split('T')[0], is_recurring: false })
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (!error) {
      setExpenses(expenses.filter(e => e.id !== id))
      toast.success('Deleted')
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Expense Tracker</h1>
          <p className="text-slate-400 text-sm mt-1">Total this month: <span className="text-white font-semibold">{formatCurrency(totalThisMonth)}</span></p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all">
          + Add Expense
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="glass-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">New Expense</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Amount (MYR) *</label>
              <input type="number" step="0.01" min="0.01" required value={form.amount}
                onChange={e => setForm({...form, amount: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-indigo-500 focus:outline-none" placeholder="0.00"/>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Category *</label>
              <select value={form.category_name} onChange={e => setForm({...form, category_name: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-indigo-500 focus:outline-none">
                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c} className="bg-slate-800">{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Merchant</label>
              <input type="text" value={form.merchant} onChange={e => setForm({...form, merchant: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-indigo-500 focus:outline-none" placeholder="Shell, Tesco..."/>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Date *</label>
              <input type="date" required value={form.expense_date} onChange={e => setForm({...form, expense_date: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-indigo-500 focus:outline-none"/>
            </div>
            <div className="col-span-2">
              <label className="text-xs text-slate-400 mb-1 block">Description</label>
              <input type="text" value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-indigo-500 focus:outline-none" placeholder="Optional notes"/>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input type="checkbox" checked={form.is_recurring} onChange={e => setForm({...form, is_recurring: e.target.checked})}
                className="rounded border-white/20"/>
              Recurring monthly
            </label>
            <div className="flex-1"/>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50">
              {loading ? 'Saving...' : 'Save Expense'}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">By Category</h3>
          {byCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byCategory} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false}/>
                <XAxis type="number" tickFormatter={v => `RM${(v/1000).toFixed(0)}k`} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false}/>
                <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={80}/>
                <Tooltip formatter={(v: number) => [formatCurrency(v), 'Amount']} contentStyle={{ background: 'hsl(222,47%,10%)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', fontSize: '12px', color: '#fff' }}/>
                <Bar dataKey="amount" fill="#6366F1" radius={[0, 6, 6, 0]}/>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-500 text-sm">No expenses yet</div>
          )}
        </div>

        {/* Category Summary */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Category Summary</h3>
          <div className="space-y-2 max-h-52 overflow-y-auto">
            {byCategory.length === 0 && <p className="text-slate-500 text-sm">No expenses this month</p>}
            {byCategory.map(c => {
              const budget = budgets.find(b => b.category_name === c.name)?.budgeted_amount || 0
              const pct = budget > 0 ? Math.min((c.amount / budget) * 100, 100) : 0
              return (
                <div key={c.name} className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 w-20 shrink-0">{c.name}</span>
                  <div className="flex-1 bg-white/5 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: budget > 0 ? `${pct}%` : '30%' }}/>
                  </div>
                  <span className="text-xs text-white font-medium w-20 text-right">{formatCurrency(c.amount, 'MYR', true)}</span>
                  {budget > 0 && <span className={`text-xs w-12 text-right ${pct >= 90 ? 'text-red-400' : 'text-slate-500'}`}>{pct.toFixed(0)}%</span>}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="glass-card">
        <div className="px-5 py-4 border-b border-white/5">
          <h3 className="text-sm font-semibold text-white">Recent Transactions</h3>
        </div>
        <div className="divide-y divide-white/5">
          {expenses.length === 0 && (
            <div className="px-5 py-10 text-center text-slate-500 text-sm">No expenses yet — add your first one above</div>
          )}
          {expenses.map(e => (
            <div key={e.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/2 transition-colors group">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center text-sm shrink-0">
                {e.category_name === 'Food' ? '🍜' : e.category_name === 'Fuel' ? '⛽' : e.category_name === 'Mortgage' ? '🏠' : e.category_name === 'Car Loan' ? '🚗' : '💳'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{e.merchant || e.description || e.category_name}</div>
                <div className="text-xs text-slate-500">{new Date(e.expense_date).toLocaleDateString('en-MY')} · {e.category_name}</div>
              </div>
              {e.is_recurring && <span className="text-[10px] bg-indigo-500/15 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/20">Monthly</span>}
              <div className="text-sm font-bold text-red-400">- {formatCurrency(e.amount)}</div>
              <button onClick={() => handleDelete(e.id)} className="text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 text-xs px-2">✕</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
