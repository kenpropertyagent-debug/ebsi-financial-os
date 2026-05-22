import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { reportType, data } = await request.json()
  const { computedMetrics, profile, assets, liabilities, income, expenses } = data
  const currency = profile?.currency || 'MYR'
  const now = new Date().toLocaleDateString('en-MY', { year: 'numeric', month: 'long', day: 'numeric' })

  // Generate HTML report (returned as HTML for download)
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>EBSI Financial Freedom OS — ${reportType} Report</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fff; color: #1a1a2e; padding: 40px; max-width: 900px; margin: 0 auto; }
  .logo { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
  .logo-icon { width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, #6366F1, #8B5CF6); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 18px; }
  .logo-text h1 { font-size: 18px; font-weight: 700; color: #1a1a2e; }
  .logo-text p { font-size: 12px; color: #64748b; }
  .report-header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
  .report-title { font-size: 26px; font-weight: 800; color: #1a1a2e; }
  .report-meta { font-size: 13px; color: #64748b; margin-top: 6px; }
  .section { margin-bottom: 28px; }
  .section-title { font-size: 14px; font-weight: 700; color: #6366F1; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 14px; border-left: 3px solid #6366F1; padding-left: 10px; }
  .metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
  .metric-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; }
  .metric-label { font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
  .metric-value { font-size: 20px; font-weight: 700; margin-top: 4px; }
  .positive { color: #10B981; }
  .negative { color: #EF4444; }
  .neutral { color: #6366F1; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  thead tr { background: #f1f5f9; }
  th { text-align: left; padding: 10px 12px; font-weight: 600; font-size: 11px; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; }
  td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; }
  tr:hover td { background: #fafbff; }
  .amount { text-align: right; font-weight: 600; }
  .freedom-bar { background: #e2e8f0; border-radius: 999px; height: 10px; overflow: hidden; }
  .freedom-fill { height: 10px; border-radius: 999px; background: linear-gradient(90deg, #6366F1, #8B5CF6); }
  .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; display: flex; justify-content: space-between; }
  @media print { body { padding: 20px; } .metric-card { break-inside: avoid; } }
</style>
</head>
<body>
<div class="logo">
  <div class="logo-icon">E</div>
  <div class="logo-text">
    <h1>EBSI Financial Freedom OS</h1>
    <p>Personal Financial Operating System</p>
  </div>
</div>

<div class="report-header">
  <div class="report-title">Financial Report — ${new Date().toLocaleDateString('en-MY', { month: 'long', year: 'numeric' })}</div>
  <div class="report-meta">Prepared for: ${profile?.full_name || 'User'} · Generated: ${now} · Confidential</div>
</div>

<div class="section">
  <div class="section-title">Financial Overview</div>
  <div class="metrics-grid">
    <div class="metric-card"><div class="metric-label">Net Worth</div><div class="metric-value neutral">${formatCurrency(computedMetrics.netWorth, currency)}</div></div>
    <div class="metric-card"><div class="metric-label">Total Assets</div><div class="metric-value positive">${formatCurrency(computedMetrics.totalAssets, currency)}</div></div>
    <div class="metric-card"><div class="metric-label">Total Liabilities</div><div class="metric-value negative">${formatCurrency(computedMetrics.totalLiabilities, currency)}</div></div>
    <div class="metric-card"><div class="metric-label">Liquid Cash</div><div class="metric-value">${formatCurrency(computedMetrics.liquidCash, currency)}</div></div>
    <div class="metric-card"><div class="metric-label">Monthly Income</div><div class="metric-value positive">${formatCurrency(computedMetrics.monthlyIncome, currency)}</div></div>
    <div class="metric-card"><div class="metric-label">Monthly Expenses</div><div class="metric-value negative">${formatCurrency(computedMetrics.monthlyExpenses, currency)}</div></div>
    <div class="metric-card"><div class="metric-label">Passive Income</div><div class="metric-value positive">${formatCurrency(computedMetrics.passiveIncome, currency)}/mo</div></div>
    <div class="metric-card"><div class="metric-label">Emergency Runway</div><div class="metric-value">${computedMetrics.runway.toFixed(1)} months</div></div>
    <div class="metric-card"><div class="metric-label">Freedom Score</div><div class="metric-value neutral">${computedMetrics.ffScore.toFixed(1)}%</div></div>
  </div>
</div>

<div class="section">
  <div class="section-title">Financial Freedom Progress</div>
  <p style="font-size:13px;color:#64748b;margin-bottom:10px">Passive income as % of monthly commitments target</p>
  <div class="freedom-bar"><div class="freedom-fill" style="width:${Math.min(computedMetrics.ffScore, 100)}%"></div></div>
  <p style="font-size:12px;color:#94a3b8;margin-top:6px">${computedMetrics.ffScore.toFixed(1)}% — ${computedMetrics.ffScore >= 100 ? 'FINANCIALLY FREE 🎉' : `${formatCurrency(Math.max(0, computedMetrics.monthlyCommitments - computedMetrics.passiveIncome), currency)}/mo gap remaining`}</p>
</div>

${assets.length > 0 ? `
<div class="section">
  <div class="section-title">Assets (${assets.length} items)</div>
  <table>
    <thead><tr><th>Asset</th><th>Type</th><th class="amount">Value</th></tr></thead>
    <tbody>
      ${assets.map((a: { name: string; asset_type: string; current_value: number }) => `<tr><td>${a.name}</td><td style="text-transform:capitalize;color:#64748b">${a.asset_type.replace('_',' ')}</td><td class="amount positive">${formatCurrency(a.current_value, currency)}</td></tr>`).join('')}
      <tr style="font-weight:700"><td colspan="2">Total Assets</td><td class="amount positive">${formatCurrency(computedMetrics.totalAssets, currency)}</td></tr>
    </tbody>
  </table>
</div>` : ''}

${liabilities.length > 0 ? `
<div class="section">
  <div class="section-title">Liabilities (${liabilities.length} items)</div>
  <table>
    <thead><tr><th>Liability</th><th>Type</th><th class="amount">Balance</th><th class="amount">Monthly</th></tr></thead>
    <tbody>
      ${liabilities.map((l: { name: string; liability_type: string; outstanding_balance: number; monthly_payment: number }) => `<tr><td>${l.name}</td><td style="text-transform:capitalize;color:#64748b">${l.liability_type.replace('_',' ')}</td><td class="amount negative">${formatCurrency(l.outstanding_balance, currency)}</td><td class="amount">${formatCurrency(l.monthly_payment, currency)}</td></tr>`).join('')}
      <tr style="font-weight:700"><td colspan="2">Total Liabilities</td><td class="amount negative">${formatCurrency(computedMetrics.totalLiabilities, currency)}</td><td class="amount">${formatCurrency(computedMetrics.monthlyCommitments, currency)}/mo</td></tr>
    </tbody>
  </table>
</div>` : ''}

<div class="footer">
  <span>EBSI Financial Freedom OS · ${now}</span>
  <span>This report is for personal use only. Confidential.</span>
</div>
</body>
</html>`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `attachment; filename="EBSI_${reportType}_${new Date().toISOString().split('T')[0]}.html"`,
    },
  })
}
