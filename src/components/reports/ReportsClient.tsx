'use client'
import { useState } from 'react'
import { formatCurrency, calcNetWorth, calcDebtRatio, calcRunway, calcFinancialFreedomScore } from '@/lib/utils'
import toast from 'react-hot-toast'

interface ReportData {
  profile: { full_name: string | null; currency: string; financial_freedom_target: number } | null
  assets: { name: string; asset_type: string; current_value: number }[]
  liabilities: { name: string; liability_type: string; outstanding_balance: number; monthly_payment: number }[]
  income: { amount: number; category_name: string | null; income_date: string; is_passive: boolean }[]
  expenses: { amount: number; category_name: string | null; expense_date: string }[]
  bankAccounts: { bank_name: string; balance: number; is_liquid: boolean }[]
}

interface Props { reportData: ReportData }

const REPORT_TYPES = [
  { id: 'financial_statement', label: 'Monthly Financial Statement', icon: '📊', desc: 'Income, expenses, and cashflow summary' },
  { id: 'net_worth', label: 'Net Worth Report', icon: '📈', desc: 'Assets, liabilities, and wealth snapshot' },
  { id: 'cashflow', label: 'Cashflow Statement', icon: '💸', desc: 'Money in vs money out analysis' },
  { id: 'liquidity', label: 'Liquidity Report', icon: '💧', desc: 'Emergency fund and runway analysis' },
  { id: 'freedom', label: 'Financial Freedom Report', icon: '🎯', desc: 'Progress toward financial independence' },
]

export default function ReportsClient({ reportData }: Props) {
  const [generating, setGenerating] = useState<string | null>(null)
  const { profile, assets, liabilities, income, expenses, bankAccounts } = reportData
  const currency = profile?.currency || 'MYR'

  const totalAssets = assets.reduce((s, a) => s + a.current_value, 0)
  const totalLiabilities = liabilities.reduce((s, l) => s + l.outstanding_balance, 0)
  const monthlyCommitments = liabilities.reduce((s, l) => s + l.monthly_payment, 0)
  const liquidCash = bankAccounts.filter(b => b.is_liquid).reduce((s, b) => s + b.balance, 0)

  const thisMonth = new Date().toISOString().slice(0, 7)
  const monthlyIncome = income.filter(i => i.income_date.startsWith(thisMonth)).reduce((s, i) => s + i.amount, 0)
  const monthlyExpenses = expenses.filter(e => e.expense_date.startsWith(thisMonth)).reduce((s, e) => s + e.amount, 0)
  const passiveIncome = income.filter(i => i.is_passive && i.income_date.startsWith(thisMonth)).reduce((s, i) => s + i.amount, 0)
  const ffTarget = profile?.financial_freedom_target || 20000

  const netWorth = calcNetWorth(totalAssets, totalLiabilities)
  const debtRatio = calcDebtRatio(totalAssets, totalLiabilities)
  const runway = calcRunway(liquidCash, monthlyCommitments)
  const ffScore = calcFinancialFreedomScore(passiveIncome, monthlyCommitments || ffTarget)

  async function generatePDF(reportType: string) {
    setGenerating(reportType)
    try {
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportType, data: { ...reportData, computedMetrics: { netWorth, totalAssets, totalLiabilities, monthlyIncome, monthlyExpenses, passiveIncome, liquidCash, monthlyCommitments, runway, ffScore, debtRatio } } }),
      })
      if (!res.ok) throw new Error('Generation failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `EBSI_${reportType}_${new Date().toISOString().split('T')[0]}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Report downloaded!')
    } catch {
      toast.error('PDF generation requires API setup. Download as HTML instead.')
      // Fallback: generate HTML report
      generateHTML(reportType)
    }
    setGenerating(null)
  }

  function generateHTML(reportType: string) {
    const reportName = REPORT_TYPES.find(r => r.id === reportType)?.label || 'Financial Report'
    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${reportName} — EBSI Financial Freedom OS</title>
<style>
  body { font-family: -apple-system, sans-serif; background: #0F0F1A; color: #E2E8F0; margin: 0; padding: 40px; }
  .header { border-bottom: 1px solid #2D3748; pb: 20px; margin-bottom: 30px; }
  h1 { color: #818CF8; margin: 0 0 5px; font-size: 24px; }
  .meta { color: #64748b; font-size: 13px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
  .card { background: #1E2235; border: 1px solid #2D3748; border-radius: 12px; padding: 16px; }
  .label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
  .value { font-size: 22px; font-weight: bold; margin-top: 4px; }
  .green { color: #10B981; } .red { color: #EF4444; } .indigo { color: #818CF8; }
  table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  th { text-align: left; padding: 8px 12px; background: #1E2235; font-size: 11px; color: #64748b; text-transform: uppercase; }
  td { padding: 8px 12px; border-bottom: 1px solid #2D3748; font-size: 13px; }
  .footer { margin-top: 40px; color: #2D3748; font-size: 11px; text-align: center; }
</style></head><body>
<div class="header">
  <h1>EBSI Financial Freedom OS</h1>
  <div class="meta">${reportName} · Generated ${new Date().toLocaleDateString('en-MY', { year: 'numeric', month: 'long', day: 'numeric' })} · ${profile?.full_name || 'User'}</div>
</div>
<div class="grid">
  <div class="card"><div class="label">Net Worth</div><div class="value indigo">${formatCurrency(netWorth, currency)}</div></div>
  <div class="card"><div class="label">Liquid Cash</div><div class="value">${formatCurrency(liquidCash, currency)}</div></div>
  <div class="card"><div class="label">Monthly Income</div><div class="value green">${formatCurrency(monthlyIncome, currency)}</div></div>
  <div class="card"><div class="label">Monthly Expenses</div><div class="value red">${formatCurrency(monthlyExpenses, currency)}</div></div>
  <div class="card"><div class="label">Passive Income</div><div class="value green">${formatCurrency(passiveIncome, currency)}</div></div>
  <div class="card"><div class="label">Financial Freedom Score</div><div class="value indigo">${ffScore.toFixed(1)}%</div></div>
  <div class="card"><div class="label">Emergency Runway</div><div class="value">${runway.toFixed(1)} months</div></div>
  <div class="card"><div class="label">Debt Ratio</div><div class="value ${debtRatio > 60 ? 'red' : debtRatio > 40 ? '' : 'green'}">${debtRatio.toFixed(0)}%</div></div>
</div>
<h3 style="color:#818CF8">Assets (${assets.length})</h3>
<table>
  <thead><tr><th>Asset</th><th>Type</th><th>Value</th></tr></thead>
  <tbody>${assets.map(a => `<tr><td>${a.name}</td><td>${a.asset_type}</td><td class="green">${formatCurrency(a.current_value, currency)}</td></tr>`).join('')}</tbody>
</table>
<h3 style="color:#EF4444">Liabilities (${liabilities.length})</h3>
<table>
  <thead><tr><th>Liability</th><th>Type</th><th>Balance</th><th>Monthly</th></tr></thead>
  <tbody>${liabilities.map(l => `<tr><td>${l.name}</td><td>${l.liability_type}</td><td class="red">${formatCurrency(l.outstanding_balance, currency)}</td><td>${formatCurrency(l.monthly_payment, currency)}</td></tr>`).join('')}</tbody>
</table>
<div class="footer">EBSI Financial Freedom OS · Generated ${new Date().toISOString()} · Confidential</div>
</body></html>`
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `EBSI_${reportType}_${new Date().toISOString().split('T')[0]}.html`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('HTML report downloaded!')
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">📄 Financial Reports</h1>
        <p className="text-slate-400 text-sm mt-1">Generate comprehensive PDF reports of your financial data</p>
      </div>

      {/* Current Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="text-xs text-slate-500">Net Worth</div>
          <div className="text-lg font-bold text-indigo-400 mt-1">{formatCurrency(netWorth, currency, true)}</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-xs text-slate-500">Monthly Cashflow</div>
          <div className={`text-lg font-bold mt-1 ${monthlyIncome - monthlyExpenses >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {formatCurrency(monthlyIncome - monthlyExpenses, currency, true)}
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="text-xs text-slate-500">Freedom Score</div>
          <div className="text-lg font-bold text-purple-400 mt-1">{ffScore.toFixed(0)}%</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-xs text-slate-500">Runway</div>
          <div className="text-lg font-bold text-teal-400 mt-1">{runway.toFixed(1)} months</div>
        </div>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {REPORT_TYPES.map(report => (
          <div key={report.id} className="glass-card p-5 hover:border-indigo-500/20 transition-all">
            <div className="text-3xl mb-3">{report.icon}</div>
            <h3 className="text-sm font-bold text-white mb-1">{report.label}</h3>
            <p className="text-xs text-slate-500 mb-4">{report.desc}</p>
            <div className="flex gap-2">
              <button
                onClick={() => generateHTML(report.id)}
                className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-medium transition-all"
              >
                HTML
              </button>
              <button
                onClick={() => generatePDF(report.id)}
                disabled={generating === report.id}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium transition-all disabled:opacity-50"
              >
                {generating === report.id ? '...' : 'PDF'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Report Period Info */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-white mb-3">Report Data Coverage</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-xs text-slate-500 mb-1">Income Records</div>
            <div className="text-white font-medium">{income.length} entries (YTD)</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1">Expense Records</div>
            <div className="text-white font-medium">{expenses.length} entries (YTD)</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1">Balance Sheet Items</div>
            <div className="text-white font-medium">{assets.length + liabilities.length} items</div>
          </div>
        </div>
      </div>
    </div>
  )
}
