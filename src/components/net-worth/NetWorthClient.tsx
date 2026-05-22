'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, calcNetWorth, calcDebtRatio, ASSET_TYPE_LABELS, LIABILITY_TYPE_LABELS } from '@/lib/utils'
import type { Asset, Liability, NetWorthSnapshot } from '@/types/database'
import toast from 'react-hot-toast'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const ASSET_TYPES = ['property','shares','reits','cash','fixed_deposit','crypto','business','vehicle','other'] as const
const LIABILITY_TYPES = ['mortgage','car_loan','personal_loan','credit_card','business_loan','student_loan','other'] as const

interface Props { assets: Asset[]; liabilities: Liability[]; history: NetWorthSnapshot[]; userId: string }

export default function NetWorthClient({ assets: initA, liabilities: initL, history, userId }: Props) {
  const [assets, setAssets] = useState(initA)
  const [liabilities, setLiabilities] = useState(initL)
  const [tab, setTab] = useState<'assets' | 'liabilities'>('assets')
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [aForm, setAForm] = useState({ name: '', asset_type: 'property' as typeof ASSET_TYPES[number], current_value: '', is_liquid: false, monthly_income: '' })
  const [lForm, setLForm] = useState({ name: '', liability_type: 'mortgage' as typeof LIABILITY_TYPES[number], outstanding_balance: '', monthly_payment: '', interest_rate: '' })
  const supabase = createClient()

  const totalAssets = assets.reduce((s, a) => s + a.current_value, 0)
  const totalLiabilities = liabilities.reduce((s, l) => s + l.outstanding_balance, 0)
  const netWorth = calcNetWorth(totalAssets, totalLiabilities)
  const debtRatio = calcDebtRatio(totalAssets, totalLiabilities)

  async function addAsset(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { data, error } = await supabase.from('assets').insert({
      user_id: userId, name: aForm.name, asset_type: aForm.asset_type,
      current_value: parseFloat(aForm.current_value), is_liquid: aForm.is_liquid,
      monthly_income: aForm.monthly_income ? parseFloat(aForm.monthly_income) : 0,
    }).select().single()
    if (error) toast.error(error.message)
    else { toast.success('Asset added!'); setAssets([...assets, data]); setShowForm(false) }
    setLoading(false)
  }

  async function addLiability(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { data, error } = await supabase.from('liabilities').insert({
      user_id: userId, name: lForm.name, liability_type: lForm.liability_type,
      outstanding_balance: parseFloat(lForm.outstanding_balance),
      monthly_payment: parseFloat(lForm.monthly_payment),
      interest_rate: lForm.interest_rate ? parseFloat(lForm.interest_rate) / 100 : null,
    }).select().single()
    if (error) toast.error(error.message)
    else { toast.success('Liability added!'); setLiabilities([...liabilities, data]); setShowForm(false) }
    setLoading(false)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Net Worth Tracker</h1>
          <p className="text-slate-400 text-sm mt-1">Your total wealth picture</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all">
          + Add {tab === 'assets' ? 'Asset' : 'Liability'}
        </button>
      </div>

      {/* Net Worth Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card p-5 border-indigo-500/20">
          <div className="text-xs text-slate-500 mb-1">Net Worth</div>
          <div className={`text-2xl font-bold ${netWorth >= 0 ? 'text-white' : 'text-red-400'}`}>{formatCurrency(netWorth, 'MYR', true)}</div>
          <div className="text-xs text-slate-500 mt-1">Assets − Liabilities</div>
        </div>
        <div className="glass-card p-5 border-emerald-500/20">
          <div className="text-xs text-slate-500 mb-1">Total Assets</div>
          <div className="text-2xl font-bold text-emerald-400">{formatCurrency(totalAssets, 'MYR', true)}</div>
          <div className="text-xs text-slate-500 mt-1">{assets.length} items</div>
        </div>
        <div className="glass-card p-5 border-red-500/20">
          <div className="text-xs text-slate-500 mb-1">Total Liabilities</div>
          <div className="text-2xl font-bold text-red-400">{formatCurrency(totalLiabilities, 'MYR', true)}</div>
          <div className="text-xs text-slate-500 mt-1">Debt ratio: {debtRatio.toFixed(0)}%</div>
        </div>
      </div>

      {/* Net Worth History */}
      {history.length > 1 && (
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Net Worth History</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={history}>
              <defs>
                <linearGradient id="nwGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
              <XAxis dataKey="snapshot_date" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false}/>
              <YAxis tickFormatter={v => formatCurrency(v,'MYR',true)} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} width={70}/>
              <Tooltip formatter={(v: number) => [formatCurrency(v),'Net Worth']} contentStyle={{ background: 'hsl(222,47%,10%)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', fontSize: '12px', color: '#fff' }}/>
              <Area type="monotone" dataKey="net_worth" stroke="#6366F1" fill="url(#nwGrad2)" strokeWidth={2.5}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {(['assets', 'liabilities'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${tab === t ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white bg-white/5'}`}>
            {t} ({t === 'assets' ? assets.length : liabilities.length})
          </button>
        ))}
      </div>

      {/* Add Form */}
      {showForm && tab === 'assets' && (
        <form onSubmit={addAsset} className="glass-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">Add Asset</h3>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs text-slate-400 mb-1 block">Name *</label>
              <input type="text" required value={aForm.name} onChange={e => setAForm({...aForm, name: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-indigo-500 focus:outline-none" placeholder="Condo @ KL City"/>
            </div>
            <div><label className="text-xs text-slate-400 mb-1 block">Type *</label>
              <select value={aForm.asset_type} onChange={e => setAForm({...aForm, asset_type: e.target.value as typeof ASSET_TYPES[number]})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-indigo-500 focus:outline-none">
                {ASSET_TYPES.map(t => <option key={t} value={t} className="bg-slate-800">{ASSET_TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <div><label className="text-xs text-slate-400 mb-1 block">Current Value (MYR) *</label>
              <input type="number" step="0.01" required value={aForm.current_value} onChange={e => setAForm({...aForm, current_value: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-indigo-500 focus:outline-none" placeholder="650000"/>
            </div>
            <div><label className="text-xs text-slate-400 mb-1 block">Monthly Income (MYR)</label>
              <input type="number" step="0.01" value={aForm.monthly_income} onChange={e => setAForm({...aForm, monthly_income: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-indigo-500 focus:outline-none" placeholder="Rental, dividend..."/>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input type="checkbox" checked={aForm.is_liquid} onChange={e => setAForm({...aForm, is_liquid: e.target.checked})} className="rounded"/>
            Is Liquid (can access cash quickly)
          </label>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-400">Cancel</button>
            <button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl text-sm font-medium disabled:opacity-50">
              {loading ? 'Adding...' : 'Add Asset'}
            </button>
          </div>
        </form>
      )}

      {showForm && tab === 'liabilities' && (
        <form onSubmit={addLiability} className="glass-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">Add Liability</h3>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs text-slate-400 mb-1 block">Name *</label>
              <input type="text" required value={lForm.name} onChange={e => setLForm({...lForm, name: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-red-500 focus:outline-none" placeholder="Maybank Housing Loan"/>
            </div>
            <div><label className="text-xs text-slate-400 mb-1 block">Type *</label>
              <select value={lForm.liability_type} onChange={e => setLForm({...lForm, liability_type: e.target.value as typeof LIABILITY_TYPES[number]})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-red-500 focus:outline-none">
                {LIABILITY_TYPES.map(t => <option key={t} value={t} className="bg-slate-800">{LIABILITY_TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <div><label className="text-xs text-slate-400 mb-1 block">Outstanding Balance (MYR) *</label>
              <input type="number" step="0.01" required value={lForm.outstanding_balance} onChange={e => setLForm({...lForm, outstanding_balance: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-red-500 focus:outline-none" placeholder="450000"/>
            </div>
            <div><label className="text-xs text-slate-400 mb-1 block">Monthly Payment (MYR) *</label>
              <input type="number" step="0.01" required value={lForm.monthly_payment} onChange={e => setLForm({...lForm, monthly_payment: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-red-500 focus:outline-none" placeholder="2200"/>
            </div>
            <div><label className="text-xs text-slate-400 mb-1 block">Interest Rate (%)</label>
              <input type="number" step="0.01" value={lForm.interest_rate} onChange={e => setLForm({...lForm, interest_rate: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-red-500 focus:outline-none" placeholder="3.5"/>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-400">Cancel</button>
            <button type="submit" disabled={loading} className="bg-red-600 hover:bg-red-500 text-white px-5 py-2 rounded-xl text-sm font-medium disabled:opacity-50">
              {loading ? 'Adding...' : 'Add Liability'}
            </button>
          </div>
        </form>
      )}

      {/* List */}
      <div className="glass-card">
        <div className="divide-y divide-white/5">
          {tab === 'assets' && (
            <>
              {assets.length === 0 && <div className="px-5 py-10 text-center text-slate-500 text-sm">No assets added yet</div>}
              {assets.map(a => (
                <div key={a.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-base shrink-0">
                    {a.asset_type === 'property' ? '🏠' : a.asset_type === 'shares' ? '📈' : a.asset_type === 'reits' ? '🏦' : a.asset_type === 'crypto' ? '₿' : '💰'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white">{a.name}</div>
                    <div className="text-xs text-slate-500">{ASSET_TYPE_LABELS[a.asset_type]}{a.is_liquid ? ' · Liquid' : ''}{a.monthly_income > 0 ? ` · RM${a.monthly_income}/mo` : ''}</div>
                  </div>
                  <div className="text-base font-bold text-emerald-400">{formatCurrency(a.current_value, 'MYR', true)}</div>
                </div>
              ))}
            </>
          )}
          {tab === 'liabilities' && (
            <>
              {liabilities.length === 0 && <div className="px-5 py-10 text-center text-slate-500 text-sm">No liabilities added yet</div>}
              {liabilities.map(l => (
                <div key={l.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center text-base shrink-0">
                    {l.liability_type === 'mortgage' ? '🏠' : l.liability_type === 'car_loan' ? '🚗' : '💳'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white">{l.name}</div>
                    <div className="text-xs text-slate-500">
                      {LIABILITY_TYPE_LABELS[l.liability_type]} · {formatCurrency(l.monthly_payment)}/mo
                      {l.interest_rate ? ` · ${(l.interest_rate * 100).toFixed(2)}% p.a.` : ''}
                    </div>
                  </div>
                  <div className="text-base font-bold text-red-400">{formatCurrency(l.outstanding_balance, 'MYR', true)}</div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
