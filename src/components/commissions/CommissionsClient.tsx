'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, COMMISSION_STATUS_LABELS, COMMISSION_STATUS_COLORS } from '@/lib/utils'
import type { CommissionDeal } from '@/types/database'
import toast from 'react-hot-toast'

const STATUSES = ['prospect','booking','spa_signed','loan_approved','pending_claim','claimed','paid'] as const
type Status = typeof STATUSES[number]

interface Props { deals: CommissionDeal[]; userId: string }

export default function CommissionsClient({ deals: initial, userId }: Props) {
  const [deals, setDeals] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    project_name: '', customer_name: '', commission_amount: '',
    property_value: '', commission_rate: '', status: 'prospect' as Status,
    expected_payment_date: '', notes: '',
  })
  const supabase = createClient()

  const pending = deals.filter(d => !['paid'].includes(d.status)).reduce((s, d) => s + d.commission_amount, 0)
  const paid = deals.filter(d => d.status === 'paid').reduce((s, d) => s + d.commission_amount, 0)
  const upcoming = deals.filter(d => d.status === 'pending_claim').reduce((s, d) => s + d.commission_amount, 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { data, error } = await supabase.from('commission_deals').insert({
      user_id: userId,
      project_name: form.project_name,
      customer_name: form.customer_name || null,
      commission_amount: parseFloat(form.commission_amount),
      property_value: form.property_value ? parseFloat(form.property_value) : null,
      commission_rate: form.commission_rate ? parseFloat(form.commission_rate) / 100 : null,
      status: form.status,
      expected_payment_date: form.expected_payment_date || null,
      notes: form.notes || null,
    }).select().single()
    if (error) toast.error(error.message)
    else { toast.success('Deal added!'); setDeals([data, ...deals]); setShowForm(false) }
    setLoading(false)
  }

  async function updateStatus(id: string, status: Status) {
    const update: Partial<CommissionDeal> = { status }
    if (status === 'paid') update.actual_payment_date = new Date().toISOString().split('T')[0]
    const { error } = await supabase.from('commission_deals').update(update).eq('id', id)
    if (!error) {
      setDeals(deals.map(d => d.id === id ? { ...d, ...update } : d))
      toast.success(`Status → ${COMMISSION_STATUS_LABELS[status]}`)
    }
  }

  // Group by status for kanban view
  const byStatus = STATUSES.map(s => ({
    status: s,
    label: COMMISSION_STATUS_LABELS[s],
    deals: deals.filter(d => d.status === s),
  }))

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Commission Pipeline</h1>
          <p className="text-slate-400 text-sm mt-1">Track every deal from prospect to paid</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all">
          + New Deal
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card p-4 border-pink-500/20">
          <div className="text-xs text-slate-500 mb-1">Pending Pipeline</div>
          <div className="text-xl font-bold text-pink-400">{formatCurrency(pending, 'MYR', true)}</div>
          <div className="text-xs text-slate-500">{deals.filter(d => d.status !== 'paid').length} deals</div>
        </div>
        <div className="glass-card p-4 border-amber-500/20">
          <div className="text-xs text-slate-500 mb-1">Upcoming (Pending Claim)</div>
          <div className="text-xl font-bold text-amber-400">{formatCurrency(upcoming, 'MYR', true)}</div>
        </div>
        <div className="glass-card p-4 border-emerald-500/20">
          <div className="text-xs text-slate-500 mb-1">Total Collected</div>
          <div className="text-xl font-bold text-emerald-400">{formatCurrency(paid, 'MYR', true)}</div>
          <div className="text-xs text-slate-500">{deals.filter(d => d.status === 'paid').length} paid deals</div>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="glass-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">New Commission Deal</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Project Name *</label>
              <input type="text" required value={form.project_name} onChange={e => setForm({...form, project_name: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-pink-500 focus:outline-none" placeholder="The Residences @ KL..."/>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Customer Name</label>
              <input type="text" value={form.customer_name} onChange={e => setForm({...form, customer_name: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-pink-500 focus:outline-none" placeholder="Ahmad bin Ali"/>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Commission Amount (MYR) *</label>
              <input type="number" step="0.01" min="0" required value={form.commission_amount}
                onChange={e => setForm({...form, commission_amount: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-pink-500 focus:outline-none" placeholder="15000"/>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Property Value (MYR)</label>
              <input type="number" step="0.01" value={form.property_value} onChange={e => setForm({...form, property_value: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-pink-500 focus:outline-none" placeholder="750000"/>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Status</label>
              <select value={form.status} onChange={e => setForm({...form, status: e.target.value as Status})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-pink-500 focus:outline-none">
                {STATUSES.map(s => <option key={s} value={s} className="bg-slate-800">{COMMISSION_STATUS_LABELS[s]}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Expected Payment Date</label>
              <input type="date" value={form.expected_payment_date} onChange={e => setForm({...form, expected_payment_date: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-pink-500 focus:outline-none"/>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
            <button type="submit" disabled={loading} className="bg-pink-600 hover:bg-pink-500 text-white px-5 py-2 rounded-xl text-sm font-medium disabled:opacity-50">
              {loading ? 'Saving...' : 'Add Deal'}
            </button>
          </div>
        </form>
      )}

      {/* Pipeline Table */}
      <div className="glass-card">
        <div className="px-5 py-4 border-b border-white/5">
          <h3 className="text-sm font-semibold text-white">All Deals ({deals.length})</h3>
        </div>
        {deals.length === 0 ? (
          <div className="px-5 py-12 text-center text-slate-500 text-sm">
            No deals yet — add your first commission deal above 🏡
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-5 py-3 text-xs text-slate-500 font-medium">Project</th>
                  <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">Customer</th>
                  <th className="text-right px-4 py-3 text-xs text-slate-500 font-medium">Commission</th>
                  <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">Expected</th>
                  <th className="text-right px-5 py-3 text-xs text-slate-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {deals.map(d => (
                  <tr key={d.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-white">{d.project_name}</div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-400">{d.customer_name || '—'}</td>
                    <td className="px-4 py-3.5 text-right font-semibold text-pink-400">{formatCurrency(d.commission_amount, 'MYR', true)}</td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs px-2 py-1 rounded-lg font-medium ${COMMISSION_STATUS_COLORS[d.status]}`}>
                        {COMMISSION_STATUS_LABELS[d.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-400 text-xs">
                      {d.expected_payment_date ? new Date(d.expected_payment_date).toLocaleDateString('en-MY') : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {d.status !== 'paid' && (
                        <select
                          value={d.status}
                          onChange={e => updateStatus(d.id, e.target.value as Status)}
                          className="text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-slate-300 focus:outline-none"
                        >
                          {STATUSES.map(s => <option key={s} value={s} className="bg-slate-800">{COMMISSION_STATUS_LABELS[s]}</option>)}
                        </select>
                      )}
                      {d.status === 'paid' && <span className="text-xs text-emerald-400">✓ Paid</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
