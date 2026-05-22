import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

const PARSE_PROMPT = `You are a financial data parser for Malaysian users. Parse the user's natural language input and extract:
- type: "expense" or "income"
- amount: number (MYR)
- category: one of [Food, Fuel, Utilities, Mortgage, Car Loan, Insurance, Family, Education, Entertainment, Medical, Business, Others] for expenses; or [Property Commission, Rental Income, Dividend Income, Salary, Business Income, Referral Income, REIT Distribution, Interest Income, Business Profit Sharing, Other Income] for income
- description: short description

Respond ONLY with valid JSON: {"type":"expense"|"income","amount":0,"category":"string","description":"string"}
If you cannot parse, return {"error":"Cannot parse"}`

export async function POST(request: NextRequest) {
  // Parse: AI extracts data from natural language
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { text } = await request.json()
  if (!text) return NextResponse.json({ error: 'Missing text' }, { status: 400 })

  if (!process.env.OPENAI_API_KEY) {
    // Fallback parser without AI
    return NextResponse.json(simpleParse(text))
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: PARSE_PROMPT },
        { role: 'user', content: text }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    })
    const parsed = JSON.parse(completion.choices[0].message.content || '{}')
    if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 422 })
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json(simpleParse(text))
  }
}

export async function PUT(request: NextRequest) {
  // Confirm: save the parsed result to DB
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { text, type, amount, category, description } = await request.json()

  // Log the capture
  await supabase.from('quick_captures').insert({
    user_id: user.id,
    raw_text: text,
    parsed_type: type,
    parsed_amount: amount,
    parsed_category: category,
    parsed_description: description,
    status: 'processed',
  })

  if (type === 'expense') {
    const { data, error } = await supabase.from('expenses').insert({
      user_id: user.id,
      amount,
      category_name: category,
      description,
      expense_date: new Date().toISOString().split('T')[0],
      ai_categorized: true,
    }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true, data })
  } else {
    const PASSIVE_CATEGORIES = ['Rental Income','Dividend Income','REIT Distribution','Interest Income','Business Profit Sharing','Referral Income']
    const { data, error } = await supabase.from('income').insert({
      user_id: user.id,
      amount,
      category_name: category,
      description,
      income_date: new Date().toISOString().split('T')[0],
      is_passive: PASSIVE_CATEGORIES.includes(category),
    }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true, data })
  }
}

function simpleParse(text: string) {
  const lower = text.toLowerCase()
  const amountMatch = text.match(/RM\s*(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)\s*ringgit/i) || text.match(/(\d+(?:\.\d+)?)/);
  const amount = amountMatch ? parseFloat(amountMatch[1] || amountMatch[2]) : 0

  const isIncome = /received|collect|got|earned|commission|rental|dividend|salary|income|paid.*me/i.test(lower)
  const type = isIncome ? 'income' : 'expense'

  let category = type === 'expense' ? 'Others' : 'Other Income'
  if (/petrol|fuel|shell|petronas|grab.*car/i.test(lower)) category = 'Fuel'
  else if (/food|lunch|dinner|breakfast|makan|restaurant|kopitiam/i.test(lower)) category = 'Food'
  else if (/commission/i.test(lower)) category = 'Property Commission'
  else if (/rental|rent/i.test(lower)) category = type === 'income' ? 'Rental Income' : 'Others'
  else if (/dividend/i.test(lower)) category = 'Dividend Income'
  else if (/insurance/i.test(lower)) category = 'Insurance'
  else if (/medical|doctor|clinic|hospital/i.test(lower)) category = 'Medical'

  return { type, amount, category, description: text.slice(0, 80) }
}
