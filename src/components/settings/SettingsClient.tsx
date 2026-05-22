'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/database'
import toast from 'react-hot-toast'

interface Props { profile: Profile | null; userId: string; userEmail: string }

export default function SettingsClient({ profile, userId, userEmail }: Props) {
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    currency: profile?.currency || 'MYR',
    financial_freedom_target: profile?.financial_freedom_target?.toString() || '20000',
    emergency_fund_months_target: profile?.emergency_fund_months_target?.toString() || '6',
    monthly_commitment_target: profile?.monthly_commitment_target?.toString() || '0',
  })
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.from('profiles').update({
      full_name: form.full_name,
      currency: form.currency,
      financial_freedom_target: parseFloat(form.financial_freedom_target),
      emergency_fund_months_target: parseInt(form.emergency_fund_months_target),
      monthly_commitment_target: parseFloat(form.monthly_commitment_target),
    }).eq('id', userId)
    if (error) toast.error(error.message)
    else toast.success('Settings saved!')
    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">⚙️ Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Configure your financial profile and preferences</p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Profile */}
        <div className="glass-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">Profile</h3>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Email (read-only)</label>
            <input type="email" value={userEmail} disabled
              className="w-full bg-white/3 border border-white/5 rounded-xl px-3 py-2.5 text-slate-500 text-sm cursor-not-allowed"/>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Full Name</label>
            <input type="text" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-indigo-500 focus:outline-none"/>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Currency</label>
            <select value={form.currency} onChange={e => setForm({...form, currency: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-indigo-500 focus:outline-none">
              <option value="MYR" className="bg-slate-800">MYR — Malaysian Ringgit</option>
              <option value="SGD" className="bg-slate-800">SGD — Singapore Dollar</option>
              <option value="USD" className="bg-slate-800">USD — US Dollar</option>
              <option value="GBP" className="bg-slate-800">GBP — British Pound</option>
            </select>
          </div>
        </div>

        {/* Financial Goals */}
        <div className="glass-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">Financial Freedom Targets</h3>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">
              Monthly Passive Income Target ({form.currency})
              <span className="text-slate-600 ml-1">— &ldquo;What is financial freedom to you?&rdquo;</span>
            </label>
            <input type="number" step="100" value={form.financial_freedom_target}
              onChange={e => setForm({...form, financial_freedom_target: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-indigo-500 focus:outline-none" placeholder="20000"/>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Emergency Fund Target (months)</label>
            <input type="number" min="1" max="24" value={form.emergency_fund_months_target}
              onChange={e => setForm({...form, emergency_fund_months_target: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-indigo-500 focus:outline-none" placeholder="6"/>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Monthly Commitment Budget ({form.currency})</label>
            <input type="number" step="100" value={form.monthly_commitment_target}
              onChange={e => setForm({...form, monthly_commitment_target: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-indigo-500 focus:outline-none" placeholder="5000"/>
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-50">
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  )
}
