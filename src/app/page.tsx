import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[hsl(222,47%,5%)] text-white flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold">E</div>
          <span className="font-semibold text-lg tracking-tight">EBSI Financial Freedom OS</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="text-sm text-muted-foreground hover:text-white transition-colors px-4 py-2">
            Sign In
          </Link>
          <Link href="/auth/signup" className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors font-medium">
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 text-xs text-indigo-400 bg-indigo-400/10 border border-indigo-400/20 rounded-full px-3 py-1.5 mb-8 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
          Built for Property Agents & Commission Earners
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight max-w-4xl leading-[1.1] mb-6">
          Your Path to{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Financial Freedom
          </span>
        </h1>

        <p className="text-xl text-slate-400 max-w-2xl mb-12 leading-relaxed">
          Stop guessing about your finances. Track cashflow, liquidity, passive income, and net worth —
          all in one intelligent operating system designed for commission-based earners.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-16">
          <Link href="/auth/signup" className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/25">
            Start Your Journey — Free
          </Link>
          <Link href="/auth/login" className="border border-white/10 hover:border-white/20 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all bg-white/5 hover:bg-white/10">
            Sign In
          </Link>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl w-full">
          {[
            { icon: '💰', label: 'Net Worth', desc: 'Track real wealth' },
            { icon: '📊', label: 'Cashflow', desc: '12-month forecasts' },
            { icon: '🏡', label: 'Commission Pipeline', desc: '7-stage tracking' },
            { icon: '🤖', label: 'AI Coach', desc: 'Smart decisions' },
            { icon: '💧', label: 'Liquidity Score', desc: 'Runway calculator' },
            { icon: '📈', label: 'Passive Income', desc: 'Freedom progress' },
            { icon: '🧾', label: 'Receipt Scanner', desc: 'AI-powered OCR' },
            { icon: '⚡', label: 'Quick Capture', desc: 'WhatsApp-style' },
          ].map((f) => (
            <div key={f.label} className="bg-white/5 border border-white/8 rounded-xl p-4 text-left hover:bg-white/8 transition-colors">
              <div className="text-2xl mb-2">{f.icon}</div>
              <div className="text-sm font-semibold text-white">{f.label}</div>
              <div className="text-xs text-slate-500 mt-0.5">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/5 px-8 py-5 text-center text-sm text-slate-600">
        © {new Date().getFullYear()} EBSI Financial Freedom OS. Built to inspire financial independence.
      </footer>
    </main>
  )
}
