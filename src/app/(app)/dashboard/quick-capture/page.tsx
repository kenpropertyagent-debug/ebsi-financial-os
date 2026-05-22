'use client'
import { useState } from 'react'
import toast from 'react-hot-toast'

const EXAMPLES = [
  'Spent RM80 petrol at Shell',
  'Received RM15000 commission from Ahmad',
  'Collected rental RM2500 from KL unit',
  'Paid RM450 insurance premium',
  'Got RM800 dividend from KLCI ETF',
  'Lunch with client RM65',
]

export default function QuickCapturePage() {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<{type:string; amount:number; category:string; description:string} | null>(null)
  const [recentCaptures, setRecentCaptures] = useState<{raw_text:string; parsed_type:string; parsed_amount:number}[]>([])

  async function handleCapture(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/quick-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPreview(data)
      toast.success('Parsed successfully! Review and confirm.')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to parse')
    }
    setLoading(false)
  }

  async function handleConfirm() {
    if (!preview) return
    setLoading(true)
    try {
      const res = await fetch('/api/quick-capture', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, ...preview }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`✅ ${preview.type === 'expense' ? 'Expense' : 'Income'} recorded!`)
      setRecentCaptures(prev => [{ raw_text: text, parsed_type: preview.type, parsed_amount: preview.amount }, ...prev.slice(0, 9)])
      setText('')
      setPreview(null)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    }
    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">⚡ Quick Capture</h1>
        <p className="text-slate-400 text-sm mt-1">Type naturally — AI parses it instantly</p>
      </div>

      {/* Main Input */}
      <form onSubmit={handleCapture} className="glass-card p-6">
        <div className="flex gap-3">
          <input
            type="text"
            value={text}
            onChange={e => { setText(e.target.value); setPreview(null) }}
            placeholder="e.g. Spent RM80 petrol or Received RM15000 commission..."
            className="flex-1 bg-white/5 border border-white/15 rounded-2xl px-5 py-4 text-white text-base placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={loading || !text.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-4 rounded-2xl font-semibold transition-all disabled:opacity-40 shrink-0"
          >
            {loading ? '...' : '→'}
          </button>
        </div>
        <p className="text-xs text-slate-600 mt-3">AI understands natural language in English or Malay</p>
      </form>

      {/* Preview */}
      {preview && (
        <div className={`glass-card p-5 border-2 ${preview.type === 'income' ? 'border-emerald-500/40' : 'border-orange-500/40'}`}>
          <div className="text-xs text-slate-500 mb-3 font-medium">PARSED RESULT — Review before saving</div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white/5 rounded-xl p-3">
              <div className="text-xs text-slate-500">Type</div>
              <div className={`text-sm font-bold capitalize mt-0.5 ${preview.type === 'income' ? 'text-emerald-400' : 'text-orange-400'}`}>{preview.type}</div>
            </div>
            <div className="bg-white/5 rounded-xl p-3">
              <div className="text-xs text-slate-500">Amount</div>
              <div className="text-sm font-bold text-white mt-0.5">RM {preview.amount.toFixed(2)}</div>
            </div>
            <div className="bg-white/5 rounded-xl p-3">
              <div className="text-xs text-slate-500">Category</div>
              <div className="text-sm font-semibold text-white mt-0.5">{preview.category}</div>
            </div>
            <div className="bg-white/5 rounded-xl p-3">
              <div className="text-xs text-slate-500">Description</div>
              <div className="text-sm font-semibold text-white mt-0.5">{preview.description}</div>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setPreview(null)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white text-sm transition-colors">
              Edit
            </button>
            <button onClick={handleConfirm} disabled={loading} className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all disabled:opacity-50">
              {loading ? 'Saving...' : '✓ Confirm & Save'}
            </button>
          </div>
        </div>
      )}

      {/* Examples */}
      <div className="glass-card p-5">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Try these examples</h3>
        <div className="space-y-2">
          {EXAMPLES.map(ex => (
            <button key={ex} onClick={() => setText(ex)}
              className="w-full text-left text-sm text-slate-400 hover:text-white bg-white/3 hover:bg-white/8 px-4 py-2.5 rounded-xl transition-colors border border-white/5">
              "{ex}"
            </button>
          ))}
        </div>
      </div>

      {/* Recent */}
      {recentCaptures.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Recent Captures</h3>
          <div className="space-y-2">
            {recentCaptures.map((c, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 bg-white/3 rounded-xl">
                <span className="text-sm text-slate-300 truncate">{c.raw_text}</span>
                <span className={`text-xs font-medium ml-3 shrink-0 ${c.parsed_type === 'income' ? 'text-emerald-400' : 'text-orange-400'}`}>
                  {c.parsed_type === 'income' ? '+' : '-'} RM{c.parsed_amount.toFixed(0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
