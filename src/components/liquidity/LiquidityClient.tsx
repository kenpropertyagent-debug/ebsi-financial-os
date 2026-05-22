'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, calcRunway, calcLiquidityScore, getLiquidityRisk } from '@/lib/utils'
import type { BankAccount, Liability } from '@/types/database'
import toast from 'react-hot-toast'

interface Props { bankAccounts: BankAccount[]; liabilities: Liability[]; userId: string }

export default function LiquidityClient({ bankAccounts: initBA, liabilities, userId }: Props) {
  const [bankAccounts, setBankAccounts] = useState(initBA)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ bank_name: '', account_type: 'savings' as BankAccount['account_type'], balance: '', is_liquid: true })
  const supabase = createClient()

  const liquidCash = bankAccounts.filter(b => b.is_liquid).reduce((s, b) => s + b.balance, 0)
  const totalCash = bankAccounts.reduce((s, b) => s + b.balance, 0)
  const monthlyCommitments = liabilities.reduce((s, l) => s + l.monthly_payment, 0)
  const runway = calcRunway(liquidCash, monthlyCommitments)
  const liquidityScore = calcLiquidityScore(runway)
  const risk = getLiquidityRisk(runway)

  const RISK_CONFIG = {
    green: { color: 'text-emerald-400', bg: 'bg-emerald-400', border: 'border-emerald-500/30', label: 'Healthy', desc: 'You have a strong safety net. Keep it up!' },
    yellow: { color: 'text-amber-400', bg: 'bg-amber-400', border: 'border-amber-500/30', label: 'Caution', desc: 'Build up to 6 months of runway for security.' },
    red: { color: 'text-red-400', bg: 'bg-red-400', border: 'border-red-500/30', label: 'Critical', desc: '⚠️ Less than 3 months runway. Increase liquid savings urgently.' },
  }
  const rc = RISK_CONFIG[risk]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { data, error } = await supabase.from('bank_accounts').insert({
      user_id: userId, bank_name: form.bank_name,
      account_type: form.account_type, balance: parseFloat(form.balance), is_liquid: form.is_liquid,
    }).select().single()
    if (error) toast.error(error.message)
    else { toast.success('Account added!'); setBankAccounts([...bankAccounts, data]); setShowForm(false) }
    setLoading(false)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">💧 Liquidity Analyzer</h1>
          <p className="text-slate-400 text-sm mt-1">How long can you survive without income?</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all">
          + Add Account
        </button>
      </div>

      {/* Runway Score */}
      <div className={`glass-card p-6 border-2 ${rc.border}`}>
        <div className="flex items-center gap-6">
          <div className="relative w-32 h-32 shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10"/>
              <circle cx="50" cy="50" r="40" fill="none" stroke={risk === 'green' ? '#10B981' : risk === 'yellow' ? '#F59E0B' : '#EF4444'}
                strokeWidth="10" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - liquidityScore / 100)}`}
                style={{ transition: 'stroke-dashoffset 1s ease' }}/>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className={`text-2xl font-bold ${rc.color}`}>{liquidityScore}</div>
              <div className="text-[9px] text-slate-500 mt-0.5">Score</div>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl font-bold text-white">{runway.toFixed(1)} months</span>
              <span className={`text-sm font-semibold px-3 py-1 rounded-full ${rc.color} bg-white/5 border ${rc.border}`}>{rc.label}</span>
            </div>
            <p className="text-slate-400 text-sm mb-3">{rc.desc}</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/5 rounded-xl p-3">
                <div className="text-xs text-slate-500">Liquid Assets</div>
                <div className="text-base font-bold text-white mt-0.5">{formatCurrency(liquidCash, 'MYR', true)}</div>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <div className="text-xs text-slate-500">Monthly Commitments</div>
                <div className="text-base font-bold text-white mt-0.5">{formatCurrency(monthlyCommitments, 'MYR', true)}</div>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <div className="text-xs text-slate-500">6-Month Target</div>
                <div className={`text-base font-bold mt-0.5 ${liquidCash >= monthlyCommitments * 6 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {formatCurrency(monthlyCommitments * 6, 'MYR', true)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Levels */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Liquidity Risk Levels</h3>
        <div className="space-y-3">
          {[
            { range: '≥ 6 months', level: 'green', label: '🟢 Healthy', desc: 'Comfortable safety net — focus on investing' },
            { range: '3–6 months', level: 'yellow', label: '🟡 Caution', desc: 'Adequate — work towards 6 months target' },
            { range: '< 3 months', level: 'red', label: '🔴 Critical', desc: 'Vulnerable — prioritize building emergency fund' },
          ].map(r => (
            <div key={r.level} className={`flex items-center gap-4 p-3 rounded-xl ${risk === r.level ? 'bg-white/8 border border-white/10' : 'opacity-50'}`}>
              <span className="text-sm font-semibold w-28">{r.label}</span>
              <span className="text-xs text-slate-500 w-24">{r.range}</span>
              <span className="text-xs text-slate-400">{r.desc}</span>
              {risk === r.level && <span className="ml-auto text-xs text-indigo-400 font-semibold">← You are here</span>}
            </div>
          ))}
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="glass-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">Add Bank Account / Cash</h3>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs text-slate-400 mb-1 block">Bank / Institution *</label>
              <input type="text" required value={form.bank_name} onChange={e => setForm({...form, bank_name: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-teal-500 focus:outline-none" placeholder="Maybank, CIMB, Cash..."/>
            </div>
            <div><label className="text-xs text-slate-400 mb-1 block">Account Type</label>
              <select value={form.account_type} onChange={e => setForm({...form, account_type: e.target.value as BankAccount['account_type']})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-teal-500 focus:outline-none">
                {['current','savings','fixed_deposit','cash','e_wallet'].map(t => <option key={t} value={t} className="bg-slate-800 capitalize">{t.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div><label className="text-xs text-slate-400 mb-1 block">Balance (MYR) *</label>
              <input type="number" step="0.01" required value={form.balance} onChange={e => setForm({...form, balance: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-teal-500 focus:outline-none" placeholder="25000"/>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input type="checkbox" checked={form.is_liquid} onChange={e => setForm({...form, is_liquid: e.target.checked})} className="rounded"/>
            Count as liquid (accessible within days)
          </label>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-400">Cancel</button>
            <button type="submit" disabled={loading} className="bg-teal-600 hover:bg-teal-500 text-white px-5 py-2 rounded-xl text-sm font-medium disabled:opacity-50">
              {loading ? 'Saving...' : 'Add Account'}
            </button>
          </div>
        </form>
      )}

      {/* Accounts List */}
      <div className="glass-card">
        <div className="px-5 py-4 border-b border-white/5">
          <h3 className="text-sm font-semibold text-white">Accounts ({bankAccounts.length}) — Total: {formatCurrency(totalCash)}</h3>
        </div>
        <div className="divide-y divide-white/5">
          {bankAccounts.length === 0 && <div className="px-5 py-10 text-center text-slate-500 text-sm">Add your bank accounts to calculate liquidity</div>}
          {bankAccounts.map(b => (
            <div key={b.id} className="flex items-center gap-4 px-5 py-3.5">
              <div className="w-9 h-9 rounded-xl bg-teal-500/15 flex items-center justify-center text-base shrink-0">🏦</div>
              <div className="flex-1">
                <div className="text-sm font-medium text-white">{b.bank_name}</div>
                <div className="text-xs text-slate-500 capitalize">{b.account_type.replace('_',' ')}</div>
              </div>
              {b.is_liquid && <span className="text-[10px] bg-teal-500/15 text-teal-400 px-2 py-0.5 rounded-full border border-teal-500/20">Liquid</span>}
              <div className="text-sm font-bold text-white">{formatCurrency(b.balance)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
