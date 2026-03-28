import React from 'react'
import type { RiskLevel } from '../types/index'
import { scoreToLevel, riskLevelLabel, riskLevelColor } from '../utils/riskCalculator'
import { CheckIcon, AlertTriangleIcon, AlertOctagonIcon } from './icons'

interface RiskMeterProps {
  score: number
  showLabel?: boolean
  className?: string
}

const LEVEL_CLASSES: Record<
  RiskLevel,
  { track: string; fill: string; text: string; Icon: React.ComponentType<{ size?: number; className?: string }> }
> = {
  low: {
    track: 'bg-teal-100',
    fill: 'bg-teal-500',
    text: 'text-teal-700',
    Icon: CheckIcon,
  },
  medium: {
    track: 'bg-amber-100',
    fill: 'bg-amber-500',
    text: 'text-amber-700',
    Icon: AlertTriangleIcon,
  },
  high: {
    track: 'bg-red-100',
    fill: 'bg-red-500',
    text: 'text-red-700',
    Icon: AlertOctagonIcon,
  },
}

export function RiskMeter({ score, showLabel = true, className = '' }: RiskMeterProps) {
  const level = scoreToLevel(score)
  const cls = LEVEL_CLASSES[level]
  const pct = Math.min(100, Math.max(0, score))

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Bar track */}
      <div className={`h-2 rounded-full ${cls.track} overflow-hidden`} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${cls.fill}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Label row */}
      {showLabel && (
        <div className="flex items-center justify-between">
          <div className={`inline-flex items-center gap-1.5 text-xs font-semibold ${cls.text}`}>
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-white ${cls.fill}`}>
              <cls.Icon size={10} />
            </span>
            {riskLevelLabel(level)}
          </div>
          <span className={`text-xs font-bold tabular-nums ${cls.text}`}>{score}/100</span>
        </div>
      )}
    </div>
  )
}
