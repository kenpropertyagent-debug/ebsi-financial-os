'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard', icon: '◈', label: 'Dashboard' },
  { href: '/dashboard/quick-capture', icon: '⚡', label: 'Quick Capture' },
  { href: '/dashboard/expenses', icon: '💳', label: 'Expenses' },
  { href: '/dashboard/income', icon: '💰', label: 'Income' },
  { href: '/dashboard/commissions', icon: '🏡', label: 'Commission Pipeline' },
  { href: '/dashboard/cashflow', icon: '📊', label: 'Cashflow Forecast' },
  { href: '/dashboard/liquidity', icon: '💧', label: 'Liquidity Analyzer' },
  { href: '/dashboard/net-worth', icon: '📈', label: 'Net Worth' },
  { href: '/dashboard/passive-income', icon: '🌱', label: 'Passive Income' },
  { href: '/dashboard/freedom-planner', icon: '🎯', label: 'Freedom Planner' },
  { href: '/dashboard/receipt-scanner', icon: '🧾', label: 'Receipt Scanner' },
  { href: '/dashboard/ai-coach', icon: '🤖', label: 'AI Coach' },
  { href: '/dashboard/reports', icon: '📄', label: 'Reports' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 shrink-0 h-screen flex flex-col border-r border-white/5 bg-[hsl(222,47%,7%)]">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-base font-bold shadow-lg shadow-indigo-500/25 shrink-0">E</div>
        <div>
          <div className="text-sm font-bold text-white leading-tight">EBSI Freedom OS</div>
          <div className="text-[10px] text-slate-500 leading-tight">Financial Operating System</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'sidebar-link',
                isActive && 'active'
              )}
            >
              <span className="text-base w-6 text-center shrink-0">{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-white/5 p-3">
        <Link href="/dashboard/settings" className={cn('sidebar-link', pathname === '/dashboard/settings' && 'active')}>
          <span className="text-base w-6 text-center">⚙️</span>
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  )
}
