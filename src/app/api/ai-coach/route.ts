import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { formatCurrency, calcNetWorth, calcDebtRatio, calcRunway, calcFinancialFreedomScore } from '@/lib/utils'

const SYSTEM_PROMPT = (ctx: Record<string, number | string>) => `You are an expert AI Financial Coach specializing in helping Malaysian property agents and commission-based earners achieve financial freedom.

CURRENT FINANCIAL SNAPSHOT (Real data from user's account):
- Net Worth: ${formatCurrency(calcNetWorth(ctx.totalAssets as number, ctx.totalLiabilities as number), ctx.currency as string)}
- Total Assets: ${formatCurrency(ctx.totalAssets as number, ctx.currency as string)}
- Total Liabilities: ${formatCurrency(ctx.totalLiabilities as number, ctx.currency as string)}
- Liquid Cash: ${formatCurrency(ctx.liquidCash as number, ctx.currency as string)}
- Monthly Income (this month): ${formatCurrency(ctx.monthlyIncome as number, ctx.currency as string)}
- Monthly Expenses: ${formatCurrency(ctx.monthlyExpenses as number, ctx.currency as string)}
- Monthly Commitments (fixed): ${formatCurrency(ctx.monthlyCommitments as number, ctx.currency as string)}
- Passive Income: ${formatCurrency(ctx.passiveIncome as number, ctx.currency as string)}/month
- Financial Freedom Target: ${formatCurrency(ctx.ffTarget as number, ctx.currency as string)}/month
- Debt Ratio: ${calcDebtRatio(ctx.totalAssets as number, ctx.totalLiabilities as number).toFixed(1)}%
- Liquidity Runway: ${calcRunway(ctx.liquidCash as number, ctx.monthlyCommitments as number).toFixed(1)} months
- Freedom Score: ${calcFinancialFreedomScore(ctx.passiveIncome as number, ctx.monthlyCommitments as number || ctx.ffTarget as number).toFixed(1)}%

YOUR ROLE:
- Analyze their ACTUAL financial data to give personalized, specific advice
- Be direct, honest, and actionable — not generic
- Focus on: cashflow optimization, debt strategy, passive income growth, financial freedom journey
- Use Malaysian context (ringgit, local market conditions)
- Use simple language — the user may not have a finance background
- Maximum 3-4 paragraphs per response
- Always end with 1-2 specific actionable recommendations
- Encourage them toward financial freedom — be their coach, not just an advisor`

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({
      response: `I notice your OpenAI API key hasn't been configured yet. To enable AI coaching:\n\n1. Get an API key from platform.openai.com\n2. Add it to your .env.local as OPENAI_API_KEY=sk-...\n3. Restart the server\n\nIn the meantime, here's a quick analysis based on your data:\n\n**Key Insight:** Focus on growing your passive income to reach financial freedom. Keep tracking every ringgit — consistency is key! 💪`
    })
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const { message, context, history } = await request.json()

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: SYSTEM_PROMPT(context) },
    ...(history || []).slice(-8).map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: message },
  ]

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages,
      max_tokens: 800,
      temperature: 0.7,
    })

    const response = completion.choices[0].message.content || 'Unable to generate response'

    // Save conversation to DB
    await supabase.from('ai_conversations').insert({
      user_id: user.id,
      title: message.slice(0, 50),
      messages: [{ role: 'user', content: message }, { role: 'assistant', content: response }],
      context_snapshot: context,
    })

    return NextResponse.json({ response })
  } catch (err: unknown) {
    console.error('AI Coach error:', err)
    return NextResponse.json({ error: 'AI service unavailable' }, { status: 503 })
  }
}
