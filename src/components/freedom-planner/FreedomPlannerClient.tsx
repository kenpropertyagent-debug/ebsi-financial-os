'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, projectAchievementDate } from '@/lib/utils'
import type { FinancialGoal, Profile } from '@/types/database'
import toast from 'react-hot-toast'

const GOAL_TYPES = [
  { value: 'passive_income_target', label: 'Passive Income Target', icon: '🌱' },
  { value: 'net_worth_target', label: 'Net Worth Target', icon: '📈' },
  { value: 'debt_free', label: 'Become Debt Free', icon: '🔓' },
  { value: 'emergency_fund', label: 'Emergency Fund', icon: '🛡️' },
  { value: 'savings_target', label: 'Savings Target', icon: '💰' },
  { value: 'custom', label: 'Custom Goal', icon: '🎯' },
]

interface Props {
  goals: FinancialGoal[]
  profile: Profile | null
  currentPassive: number
  userId: string
}

function GoalCard({
  goal: g,
  pct,
  typeInfo,
  onUpdateProgress,
}: {
  goal: FinancialGoal
  pct: number
  typeInfo: { value: string; label: string; icon: string } | undefined
  onUpdateProgress: (id: string, amount: number) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(g.current_amount.toString())

  async function handleSave() {
    const parsed = parseFloat(value)
    if (!isNaN(parsed) && parsed >= 0) {
      await onUpdateProgress(g.id, parsed)
      setEditing(false)
    }
  }

  return (
    <div className={`glass-card p-5 ${g.is_primary ? 'border-indigo-500/20' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-xs text-slate-500">{typeInfo?.icon} {typeInfo?.label}</div>
          <div className="text-sm font-bold text-white mt-0.5">{g.goal_name}</div>
        </div>
        {g.is_primary && <span className="text-[10px] bg-indigo-500/15 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/20">Primary</span>}
      </div>
      <div className="w-full bg-white/5 rounded-full h-2 mb-2">
        <div className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all" style={{ width: `${pct}%` }}/>
      </div>
      <div className="flex justify-between text-xs mb-3">
        <span className="text-slate-400">{formatCurrency(g.current_amount, 'MYR', true)}</span>
        <span className="text-indigo-400 font-semibold">{pct.toFixed(0)}%</span>
        <span className="text-slate-400">{formatCurrency(g.target_amount, 'MYR', true)}</span>
      </div>

      {/* Update progress inline */}
      {editing ? (
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-slate-400">RM</span>
          <input
            type="number"
            value={value}
            onChange={e => setValue(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:border-indigo-500"
            autoFocus
          />
          <button onClick={handleSave} className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded-lg transition-all">Save</button>
          <button onClick={() => setEditing(false)} className="text-xs text-slate-500 hover:text-white px-2 py-1 transition-all">✕</button>
        </div>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="text-xs text-slate-500 hover:text-indigo-400 transition-colors mt-1"
        >
          ✏️ Update progress
        </button>
      )}

      {g.target_date && (
        <div className="text-xs text-slate-500 mt-2">
          Target: {new Date(g.target_date).toLocaleDateString('en-MY', { month: 'long', year: 'numeric' })}
        </div>
      )}
    </div>
  )
}

export default function FreedomPlannerClient({ goals: initGoals, profile, currentPassive, userId }: Props) {
  const [goals, setGoals] = useState(initGoals)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    goal_name: 'Financial Freedom', goal_type: 'passive_income_target',
    target_amount: profile?.financial_freedom_target?.toString() || '20000',
    current_amount: currentPassive.toString(),
    target_date: '', is_primary: true,
  })
  const [monthlyGrowthRate, setMonthlyGrowthRate] = useState('500')
  const supabase = createClient()

  // primaryGoal reserved for future use in header
  const _primaryGoal = goals.find(g => g.is_primary) || goals[0]
  void _primaryGoal
  const ffTarget = profile?.financial_freedom_target || 20000
  const ffProgress = Math.min((currentPassive / ffTarget) * 100, 100)
  const gap = Math.max(0, ffTarget - currentPassive)
  const achievementDate = projectAchievementDate(currentPassive, ffTarget, parseFloat(monthlyGrowthRate) || 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { data, error } = await supabase.from('financial_goals').insert({
      user_id: userId,
      goal_name: form.goal_name,
      goal_type: form.goal_type as FinancialGoal['goal_type'],
      target_amount: parseFloat(form.target_amount),
      current_amount: parseFloat(form.current_amount),
      target_date: form.target_date || null,
      is_primary: form.is_primary,
    }).select().single()
    if (error) toast.error(error.message)
    else { toast.success('Goal created!'); setGoals([data, ...goals]); setShowForm(false) }
    setLoading(false)
  }

  async function updateProgress(id: string, current_amount: number) {
    const { error } = await supabase.from('financial_goals').update({ current_amount }).eq('id', id)
    if (!error) {
      setGoals(goals.map(g => g.id === id ? { ...g, current_amount } : g))
      toast.success('Progress updated!')
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">🎯 Financial Freedom Planner</h1>
          <p className="text-slate-400 text-sm mt-1">Set targets. Track progress. Achieve freedom.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all">
          + New Goal
        </button>
      </div>

      {/* Main Freedom Target */}
      <div className="glass-card p-6 border-indigo-500/30">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Primary Goal — Financial Freedom</div>
            <div className="text-3xl font-bold text-white">{ffProgress.toFixed(1)}%</div>
            <div className="text-sm text-slate-400 mt-1">
              {formatCurrency(currentPassive, 'MYR', true)}/mo of {formatCurrency(ffTarget, 'MYR', true)}/mo target
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500 mb-1">Gap Remaining</div>
            <div className="text-2xl font-bold text-amber-400">{formatCurrency(gap, 'MYR', true)}/mo</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-white/5 rounded-full h-5 overflow-hidden mb-4">
          <div className="h-5 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-[10px] font-bold text-white transition-all"
            style={{ width: `${Math.max(ffProgress, 3)}%` }}>
            {ffProgress >= 10 && `${ffProgress.toFixed(0)}%`}
          </div>
        </div>

        {/* Projection */}
        <div className="bg-white/5 rounded-xl p-4 mt-4">
          <div className="text-xs text-slate-500 mb-3 font-medium">PROJECTED ACHIEVEMENT</div>
          <div className="flex items-center gap-4">
            <div>
              <label className="text-xs text-slate-500">Monthly passive income growth</label>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-slate-300">RM</span>
                <input type="number" value={monthlyGrowthRate} onChange={e => setMonthlyGrowthRate(e.target.value)}
                  className="w-24 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white text-sm focus:outline-none focus:border-indigo-500"/>
                <span className="text-xs text-slate-500">/month</span>
              </div>
            </div>
            <div className="border-l border-white/10 pl-4">
              <div className="text-xs text-slate-500">Projected Freedom Date</div>
              <div className="text-lg font-bold text-indigo-400 mt-0.5">
                {achievementDate
                  ? achievementDate <= new Date() ? '🎉 Already Free!' : achievementDate.toLocaleDateString('en-MY', { month: 'long', year: 'numeric' })
                  : 'Set growth rate above'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Freedom Milestones */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Freedom Milestones</h3>
        <div className="space-y-3">
          {[
            { label: 'Foundation (25%)', target: ffTarget * 0.25, desc: 'Passive income covers basic needs' },
            { label: 'Stability (50%)', target: ffTarget * 0.5, desc: 'Half your commitments covered passively' },
            { label: 'Almost There (75%)', target: ffTarget * 0.75, desc: 'Three-quarters of commitments covered' },
            { label: '🎉 Financial Freedom (100%)', target: ffTarget, desc: 'Full passive income coverage' },
          ].map(m => {
            const reached = currentPassive >= m.target
            const pct = Math.min((currentPassive / m.target) * 100, 100)
            return (
              <div key={m.label} className={`flex items-center gap-4 p-3 rounded-xl transition-all ${reached ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-white/3'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${reached ? 'bg-emerald-500 text-white' : 'bg-white/10 text-slate-400'}`}>
                  {reached ? '✓' : '○'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white">{m.label}</div>
                  <div className="text-xs text-slate-500">{m.desc}</div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-bold ${reached ? 'text-emerald-400' : 'text-slate-400'}`}>{formatCurrency(m.target, 'MYR', true)}/mo</div>
                  <div className="text-xs text-slate-500">{pct.toFixed(0)}% reached</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="glass-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">Create New Goal</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="text-xs text-slate-400 mb-1 block">Goal Name *</label>
              <input type="text" required value={form.goal_name} onChange={e => setForm({...form, goal_name: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-indigo-500 focus:outline-none"/>
            </div>
            <div><label className="text-xs text-slate-400 mb-1 block">Goal Type</label>
              <select value={form.goal_type} onChange={e => setForm({...form, goal_type: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-indigo-500 focus:outline-none">
                {GOAL_TYPES.map(t => <option key={t.value} value={t.value} className="bg-slate-800">{t.icon} {t.label}</option>)}
              </select>
            </div>
            <div><label className="text-xs text-slate-400 mb-1 block">Target Amount (MYR)</label>
              <input type="number" value={form.target_amount} onChange={e => setForm({...form, target_amount: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-indigo-500 focus:outline-none"/>
            </div>
            <div><label className="text-xs text-slate-400 mb-1 block">Current Amount (MYR)</label>
              <input type="number" value={form.current_amount} onChange={e => setForm({...form, current_amount: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-indigo-500 focus:outline-none"/>
            </div>
            <div><label className="text-xs text-slate-400 mb-1 block">Target Date</label>
              <input type="date" value={form.target_date} onChange={e => setForm({...form, target_date: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-indigo-500 focus:outline-none"/>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input type="checkbox" checked={form.is_primary} onChange={e => setForm({...form, is_primary: e.target.checked})} className="rounded"/>
            Set as primary goal
          </label>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-400">Cancel</button>
            <button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-sm font-medium disabled:opacity-50">
              {loading ? 'Saving...' : 'Create Goal'}
            </button>
          </div>
        </form>
      )}

      {/* Goals List */}
      {goals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map(g => {
            const pct = Math.min((g.current_amount / g.target_amount) * 100, 100)
            const typeInfo = GOAL_TYPES.find(t => t.value === g.goal_type)
            return (
              <GoalCard key={g.id} goal={g} pct={pct} typeInfo={typeInfo} onUpdateProgress={updateProgress} />
            )
          })}
        </div>
      )}
    </div>
  )
}
