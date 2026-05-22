import { cn } from '@/lib/utils'

interface MetricCardProps {
  label: string
  value: string
  icon: string
  color: string
  change: string
  positive: boolean
}

const COLOR_MAP: Record<string, string> = {
  indigo: 'border-indigo-500/20 bg-indigo-500/5',
  teal: 'border-teal-500/20 bg-teal-500/5',
  green: 'border-emerald-500/20 bg-emerald-500/5',
  red: 'border-red-500/20 bg-red-500/5',
  amber: 'border-amber-500/20 bg-amber-500/5',
  yellow: 'border-amber-400/20 bg-amber-400/5',
}

export default function MetricCard({ label, value, icon, color, change, positive }: MetricCardProps) {
  return (
    <div className={cn('metric-card border', COLOR_MAP[color] || 'border-white/8')}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',
          positive ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'
        )}>
          {change}
        </span>
      </div>
      <div className="text-xl font-bold text-white tracking-tight">{value}</div>
      <div className="text-xs text-slate-500 mt-0.5 font-medium">{label}</div>
    </div>
  )
}
