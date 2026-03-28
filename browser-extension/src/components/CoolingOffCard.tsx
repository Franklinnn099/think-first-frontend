import React from 'react'
import type { CoolingOffItem } from '../types/index'
import { riskLevelColor, riskLevelLabel } from '../utils/riskCalculator'
import { ExternalLinkIcon, XIcon } from './icons'

interface CoolingOffCardProps {
  item: CoolingOffItem
  onRemove: (id: string) => void
}

function formatRelativeTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  if (hours >= 24) return `${Math.floor(hours / 24)}d ago`
  if (hours >= 1) return `${hours}h ago`
  return `${minutes}m ago`
}

export function CoolingOffCard({ item, onRemove }: CoolingOffCardProps) {
  const color = riskLevelColor(item.riskLevel)
  const label = riskLevelLabel(item.riskLevel)

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
      {/* Risk dot */}
      <div
        className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
        style={{ backgroundColor: color }}
        aria-label={label}
      />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate leading-snug">{item.pageTitle}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-slate-400">{formatRelativeTime(item.savedAt)}</span>
          <span className="text-xs font-semibold" style={{ color }}>
            {label}
          </span>
        </div>
        {item.aiSummary && (
          <p className="text-xs text-slate-500 mt-1 leading-snug line-clamp-2">{item.aiSummary}</p>
        )}
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium transition-colors duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1 rounded"
          aria-label={`Re-evaluate ${item.pageTitle}`}
        >
          Re-evaluate
          <ExternalLinkIcon size={11} />
        </a>
        <button
          onClick={() => onRemove(item.id)}
          className="text-slate-300 hover:text-red-400 transition-colors duration-150 w-5 h-5 flex items-center justify-center rounded cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-300 active:scale-95"
          aria-label="Remove from cooling-off list"
        >
          <XIcon size={12} />
        </button>
      </div>
    </div>
  )
}
