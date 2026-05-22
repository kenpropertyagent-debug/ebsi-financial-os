'use client'
import { useState, useRef, useEffect } from 'react'
import { formatCurrency } from '@/lib/utils'
import type { AiConversation } from '@/types/database'
import toast from 'react-hot-toast'

interface Message { role: 'user' | 'assistant'; content: string; timestamp: string }

interface FinancialContext {
  totalAssets: number; totalLiabilities: number; monthlyCommitments: number
  liquidCash: number; monthlyIncome: number; passiveIncome: number
  monthlyExpenses: number; currency: string; ffTarget: number
}

interface Props { financialContext: FinancialContext; conversations: AiConversation[]; userId: string }

const SAMPLE_QUESTIONS = [
  'Can I afford to buy a RM 1.5 million bungalow?',
  'Should I pay off my car loan or invest?',
  'Am I overleveraged?',
  'How can I reach financial freedom faster?',
  'What is my biggest financial risk right now?',
  'Is my emergency fund adequate?',
  'How much passive income do I need to retire?',
]

export default function AiCoachClient({ financialContext }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hello! I'm your AI Financial Coach. I have access to your complete financial picture:\n\n• **Net Worth:** ${formatCurrency(financialContext.totalAssets - financialContext.totalLiabilities, financialContext.currency, true)}\n• **Liquid Cash:** ${formatCurrency(financialContext.liquidCash, financialContext.currency, true)}\n• **Monthly Income:** ${formatCurrency(financialContext.monthlyIncome, financialContext.currency, true)}\n• **Monthly Commitments:** ${formatCurrency(financialContext.monthlyCommitments, financialContext.currency, true)}\n• **Passive Income:** ${formatCurrency(financialContext.passiveIncome, financialContext.currency, true)}\n\nAsk me anything about your financial situation. I'll give you honest, personalized advice. 💪`,
      timestamp: new Date().toISOString(),
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(question?: string) {
    const q = question || input
    if (!q.trim() || loading) return
    setInput('')
    setLoading(true)

    const userMsg: Message = { role: 'user', content: q, timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, userMsg])

    try {
      const res = await fetch('/api/ai-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q, context: financialContext, history: messages.slice(-10) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const assistantMsg: Message = { role: 'assistant', content: data.response, timestamp: new Date().toISOString() }
      setMessages(prev => [...prev, assistantMsg])
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'AI response failed')
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I apologize, I had trouble processing that. Please check your OpenAI API key in settings and try again.',
        timestamp: new Date().toISOString(),
      }])
    }
    setLoading(false)
  }

  function renderMessage(content: string) {
    // Simple markdown-like rendering
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '</p><p class="mt-2">')
      .replace(/\n/g, '<br/>')
      .replace(/•/g, '•')
  }

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col gap-4">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white">🤖 AI Financial Coach</h1>
          <p className="text-slate-400 text-sm mt-1">Personalized advice based on your real financial data</p>
        </div>
        {/* Quick stats */}
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <div className="bg-white/5 rounded-lg px-3 py-1.5 border border-white/8">
            Net Worth: <span className="text-white font-medium">{formatCurrency(financialContext.totalAssets - financialContext.totalLiabilities, financialContext.currency, true)}</span>
          </div>
        </div>
      </div>

      {/* Chat Window */}
      <div className="glass-card flex-1 flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm mr-3 shrink-0 mt-0.5">🤖</div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-sm'
                  : 'bg-white/8 text-slate-300 rounded-tl-sm border border-white/8'
              }`}>
                <p dangerouslySetInnerHTML={{ __html: renderMessage(m.content) }}/>
                <div className="text-[10px] opacity-40 mt-1.5">
                  {new Date(m.timestamp).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm mr-3 shrink-0">🤖</div>
              <div className="bg-white/8 border border-white/8 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1.5 items-center">
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}/>
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}/>
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}/>
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef}/>
        </div>

        {/* Sample Questions */}
        {messages.length <= 1 && (
          <div className="px-5 pb-4">
            <div className="text-xs text-slate-600 mb-2 font-medium">Try asking:</div>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_QUESTIONS.slice(0, 4).map(q => (
                <button key={q} onClick={() => handleSend(q)}
                  className="text-xs bg-white/5 hover:bg-white/10 border border-white/8 text-slate-400 hover:text-white px-3 py-1.5 rounded-lg transition-colors">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-white/5 p-4 flex gap-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask about your finances... (e.g. Can I afford a new property?)"
            disabled={loading}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:border-indigo-500 focus:outline-none transition-colors disabled:opacity-50"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-xl font-medium transition-all disabled:opacity-40 text-sm"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
