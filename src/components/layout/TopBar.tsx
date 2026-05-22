'use client'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'
import type { Profile } from '@/types/database'
import type { User } from '@supabase/supabase-js'
import toast from 'react-hot-toast'

interface TopBarProps {
  user: User
  profile: Profile | null
}

export default function TopBar({ user, profile }: TopBarProps) {
  const router = useRouter()
  const supabase = createClient()
  const name = profile?.full_name || user.email?.split('@')[0] || 'User'

  async function handleSignOut() {
    await supabase.auth.signOut()
    toast.success('Signed out')
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <header className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-[hsl(222,47%,6%)] shrink-0">
      <div className="flex items-center gap-2">
        <div className="text-xs text-slate-500 font-medium">
          {new Date().toLocaleDateString('en-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Currency badge */}
        <div className="text-xs text-slate-500 bg-white/5 px-2.5 py-1 rounded-lg border border-white/8">
          {profile?.currency || 'MYR'}
        </div>

        {/* Avatar dropdown */}
        <div className="relative group">
          <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-3 py-1.5 transition-colors">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
              {getInitials(name)}
            </div>
            <span className="text-sm text-white font-medium max-w-32 truncate">{name}</span>
            <span className="text-slate-500 text-xs">▾</span>
          </button>

          <div className="absolute right-0 top-full mt-1.5 w-48 bg-[hsl(222,47%,10%)] border border-white/10 rounded-xl p-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-xl">
            <div className="px-3 py-2 border-b border-white/5 mb-1">
              <div className="text-xs font-medium text-white truncate">{name}</div>
              <div className="text-[11px] text-slate-500 truncate">{user.email}</div>
            </div>
            <a href="/dashboard/settings" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
              ⚙️ Settings
            </a>
            <button onClick={handleSignOut} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-400/5 rounded-lg transition-colors">
              → Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
