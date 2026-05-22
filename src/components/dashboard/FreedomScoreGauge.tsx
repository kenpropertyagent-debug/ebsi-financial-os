'use client'
interface Props { score: number }

export default function FreedomScoreGauge({ score }: Props) {
  const clampedScore = Math.min(Math.max(score, 0), 100)
  // Semicircle gauge: 180deg arc
  const radius = 45
  const circumference = Math.PI * radius // semicircle
  const offset = circumference - (clampedScore / 100) * circumference
  const color = clampedScore >= 100 ? '#10B981' : clampedScore >= 50 ? '#6366F1' : '#F59E0B'

  return (
    <div className="relative shrink-0 w-32 h-20 flex flex-col items-center justify-end">
      <svg viewBox="0 0 100 55" className="w-32 h-20">
        {/* Track */}
        <path
          d="M 5 50 A 45 45 0 0 1 95 50"
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* Fill */}
        <path
          d="M 5 50 A 45 45 0 0 1 95 50"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="absolute bottom-0 text-center">
        <div className="text-2xl font-bold text-white leading-none" style={{ color }}>
          {clampedScore.toFixed(0)}%
        </div>
        <div className="text-[9px] text-slate-500 mt-0.5">Freedom Score</div>
      </div>
    </div>
  )
}
