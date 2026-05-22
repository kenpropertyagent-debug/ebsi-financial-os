'use client'
import { useState, useRef } from 'react'
import toast from 'react-hot-toast'
import { formatCurrency } from '@/lib/utils'

interface ParsedReceipt {
  merchant: string
  amount: number
  date: string
  category: string
  description: string
}

export default function ReceiptScannerPage() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [parsed, setParsed] = useState<ParsedReceipt | null>(null)
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const EXPENSE_CATEGORIES = ['Food','Fuel','Utilities','Mortgage','Car Loan','Insurance','Family','Education','Entertainment','Medical','Business','Others']

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setSaved(false)
    setParsed(null)
    const reader = new FileReader()
    reader.onload = ev => setPreview(ev.target?.result as string)
    reader.readAsDataURL(f)
  }

  async function handleScan() {
    if (!file) return
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/receipt-scan', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setParsed(data)
      setEditing(true)
      toast.success('Receipt scanned! Review details below.')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Scan failed')
    }
    setLoading(false)
  }

  async function handleSave() {
    if (!parsed) return
    setLoading(true)
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parsed.amount,
          category_name: parsed.category,
          merchant: parsed.merchant,
          description: parsed.description,
          expense_date: parsed.date,
          ai_categorized: true,
        }),
      })
      if (!res.ok) throw new Error('Failed to save')
      toast.success('✅ Expense saved from receipt!')
      setSaved(true)
      setEditing(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Save failed')
    }
    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">🧾 AI Receipt Scanner</h1>
        <p className="text-slate-400 text-sm mt-1">Upload a photo — AI extracts details automatically</p>
      </div>

      {/* Upload Zone */}
      <div
        className={`glass-card p-8 text-center cursor-pointer border-2 border-dashed transition-all ${preview ? 'border-indigo-500/40' : 'border-white/10 hover:border-indigo-500/30'}`}
        onClick={() => fileRef.current?.click()}
      >
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden"/>
        {preview ? (
          <div className="space-y-4">
            <img src={preview} alt="Receipt" className="max-h-72 mx-auto rounded-xl object-contain border border-white/10"/>
            <p className="text-sm text-slate-400">{file?.name}</p>
            <button type="button" onClick={e => { e.stopPropagation(); setFile(null); setPreview(null); setParsed(null) }}
              className="text-xs text-red-400 hover:text-red-300">Remove</button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-5xl">📸</div>
            <div className="text-sm font-semibold text-white">Click to upload receipt photo</div>
            <div className="text-xs text-slate-500">JPG, PNG, WebP — up to 10MB</div>
          </div>
        )}
      </div>

      {preview && !saved && (
        <button
          onClick={handleScan}
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3.5 rounded-xl font-semibold transition-all disabled:opacity-50"
        >
          {loading ? '🔍 Scanning with AI...' : '🔍 Scan Receipt'}
        </button>
      )}

      {/* Parsed Result */}
      {parsed && editing && (
        <div className="glass-card p-5 border-indigo-500/30 space-y-4">
          <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">AI Extracted — Edit Before Saving</div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs text-slate-400 mb-1 block">Merchant</label>
              <input type="text" value={parsed.merchant} onChange={e => setParsed({...parsed, merchant: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-indigo-500 focus:outline-none"/>
            </div>
            <div><label className="text-xs text-slate-400 mb-1 block">Amount (MYR)</label>
              <input type="number" step="0.01" value={parsed.amount} onChange={e => setParsed({...parsed, amount: parseFloat(e.target.value)})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-indigo-500 focus:outline-none"/>
            </div>
            <div><label className="text-xs text-slate-400 mb-1 block">Date</label>
              <input type="date" value={parsed.date} onChange={e => setParsed({...parsed, date: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-indigo-500 focus:outline-none"/>
            </div>
            <div><label className="text-xs text-slate-400 mb-1 block">Category</label>
              <select value={parsed.category} onChange={e => setParsed({...parsed, category: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-indigo-500 focus:outline-none">
                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c} className="bg-slate-800">{c}</option>)}
              </select>
            </div>
            <div className="col-span-2"><label className="text-xs text-slate-400 mb-1 block">Description</label>
              <input type="text" value={parsed.description} onChange={e => setParsed({...parsed, description: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-indigo-500 focus:outline-none"/>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setEditing(false)} className="flex-1 py-2.5 border border-white/10 text-slate-400 hover:text-white rounded-xl text-sm transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={loading} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50">
              {loading ? 'Saving...' : `✓ Save ${formatCurrency(parsed.amount)} Expense`}
            </button>
          </div>
        </div>
      )}

      {saved && (
        <div className="glass-card p-5 border-emerald-500/30 text-center">
          <div className="text-4xl mb-2">✅</div>
          <div className="text-sm font-semibold text-white">Receipt saved successfully!</div>
          <button onClick={() => { setFile(null); setPreview(null); setParsed(null); setSaved(false) }}
            className="mt-4 text-sm text-indigo-400 hover:text-indigo-300">Scan another receipt</button>
        </div>
      )}

      {/* Tips */}
      <div className="glass-card p-5">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Tips for best results</h3>
        <ul className="space-y-2 text-sm text-slate-400">
          <li className="flex gap-2"><span className="text-emerald-400">✓</span> Ensure receipt is well-lit and in focus</li>
          <li className="flex gap-2"><span className="text-emerald-400">✓</span> Capture full receipt from top to bottom</li>
          <li className="flex gap-2"><span className="text-emerald-400">✓</span> AI extracts merchant, amount, date, and category</li>
          <li className="flex gap-2"><span className="text-emerald-400">✓</span> Always review and edit before saving</li>
        </ul>
      </div>
    </div>
  )
}
