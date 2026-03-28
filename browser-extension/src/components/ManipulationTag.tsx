import React, { useState } from 'react'
import type { ManipulationTactic, TacticType } from '../types/index'
import {
  ClockIcon,
  PackageIcon,
  TimerIcon,
  UsersIcon,
  FlameIcon,
  TagIcon,
  HelpCircleIcon,
} from './icons'

interface TagStyle {
  bg: string
  text: string
  border: string
  label: string
  Icon: React.ComponentType<{ className?: string; size?: number }>
}

const TACTIC_STYLES: Record<TacticType, TagStyle> = {
  urgency: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    label: 'Urgency',
    Icon: ClockIcon,
  },
  scarcity: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    label: 'Scarcity',
    Icon: PackageIcon,
  },
  countdown: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    label: 'Countdown',
    Icon: TimerIcon,
  },
  social_proof: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    label: 'Social Proof',
    Icon: UsersIcon,
  },
  fomo: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    label: 'FOMO',
    Icon: FlameIcon,
  },
  discount_pressure: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    label: 'Discount Pressure',
    Icon: TagIcon,
  },
  unknown: {
    bg: 'bg-gray-50',
    text: 'text-gray-600',
    border: 'border-gray-200',
    label: 'Unknown',
    Icon: HelpCircleIcon,
  },
}

interface ManipulationTagProps {
  tactic: ManipulationTactic
  expandable?: boolean
}

export function ManipulationTag({ tactic, expandable = true }: ManipulationTagProps) {
  const [expanded, setExpanded] = useState(false)
  const style = TACTIC_STYLES[tactic.type] ?? TACTIC_STYLES.unknown
  const { Icon } = style

  return (
    <div className="space-y-1">
      <button
        onClick={() => expandable && setExpanded(e => !e)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
          border transition-opacity duration-150
          ${style.bg} ${style.text} ${style.border}
          ${expandable
            ? 'cursor-pointer hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-current active:scale-95'
            : 'cursor-default'
          }`}
        aria-expanded={expandable ? expanded : undefined}
      >
        <Icon size={12} className="flex-shrink-0" />
        <span>{style.label}</span>
        {tactic.severity === 3 && (
          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70 flex-shrink-0" />
        )}
      </button>
      {expanded && tactic.copy && (
        <p className={`text-xs italic ${style.text} opacity-75 pl-1 leading-snug max-w-[280px]`}>
          "{tactic.copy}"
        </p>
      )}
    </div>
  )
}
