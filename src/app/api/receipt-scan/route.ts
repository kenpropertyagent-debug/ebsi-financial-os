import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your environment.' }, { status: 503 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })

  const buffer = await file.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')
  const mimeType = file.type || 'image/jpeg'

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64}`, detail: 'high' },
            },
            {
              type: 'text',
              text: `Extract data from this receipt. Return ONLY valid JSON:
{
  "merchant": "merchant/store name",
  "amount": total amount as number,
  "date": "YYYY-MM-DD",
  "category": one of [Food, Fuel, Utilities, Medical, Entertainment, Business, Others],
  "description": "brief description"
}
If date unclear, use today's date. If amount unclear, use 0. Always return valid JSON.`,
            },
          ],
        },
      ],
      max_tokens: 300,
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0].message.content
    const parsed = JSON.parse(content || '{}')

    // Validate and sanitize
    return NextResponse.json({
      merchant: String(parsed.merchant || 'Unknown'),
      amount: Math.abs(parseFloat(parsed.amount) || 0),
      date: parsed.date || new Date().toISOString().split('T')[0],
      category: parsed.category || 'Others',
      description: String(parsed.description || ''),
    })
  } catch (err: unknown) {
    console.error('Receipt scan error:', err)
    return NextResponse.json({ error: 'Failed to scan receipt. Please try a clearer image.' }, { status: 422 })
  }
}
