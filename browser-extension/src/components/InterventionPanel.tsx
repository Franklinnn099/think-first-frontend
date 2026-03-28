import React from 'react'
import type { ImpulseAnalysis } from '../types/index'
import { RiskMeter } from './RiskMeter'
import { ManipulationTag } from './ManipulationTag'
import { TruthRewrite } from './TruthRewrite'
import { AlertOctagonIcon } from './icons'

interface InterventionPanelProps {
  analysis: ImpulseAnalysis
  onSave: () => void
  onDismiss: () => void
  saving?: boolean
}

export function InterventionPanel({ analysis, onSave, onDismiss, saving }: InterventionPanelProps) {
  const firstTactic = analysis.tactics.find(t => t.copy)

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Warning header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0" aria-hidden="true">
          <AlertOctagonIcon size={20} className="text-red-600" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-900 leading-snug">
            Manipulation detected
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            This page is using pressure tactics to rush your decision.
          </p>
        </div>
      </div>

      {/* Risk meter */}
      <RiskMeter score={analysis.riskScore} />

      {/* Detected tactics */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          What we detected
        </p>
        <div className="flex flex-wrap gap-1.5">
          {analysis.tactics.map((t, i) => (
            <ManipulationTag key={i} tactic={t} expandable />
          ))}
        </div>
      </div>

      {/* Truth rewrite (if available) */}
      {analysis.truthRewrite && firstTactic?.copy && (
        <TruthRewrite original={firstTactic.copy} rewritten={analysis.truthRewrite} />
      )}

      {/* Reflection prompt */}
      {analysis.reflectionPrompt && (
        <div className="rounded-xl bg-indigo-50 border border-indigo-100 px-3.5 py-3">
          <p className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wide mb-1">
            Pause and consider
          </p>
          <p className="text-sm text-indigo-900 leading-snug font-medium">
            {analysis.reflectionPrompt}
          </p>
        </div>
      )}

      {/* Emotional trigger label */}
      {analysis.emotionalTrigger && (
        <p className="text-xs text-slate-400 text-center">
          Trigger detected:{' '}
          <span className="font-semibold text-slate-600">{analysis.emotionalTrigger}</span>
        </p>
      )}

      {/* CTAs */}
      <div className="flex flex-col gap-2 pt-1">
        <button
          onClick={onSave}
          disabled={saving}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl
            transition-colors duration-150 cursor-pointer
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
            active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {saving ? 'Saving…' : 'Save for Later (24h pause)'}
        </button>
        <button
          onClick={onDismiss}
          className="w-full py-2.5 bg-transparent border border-slate-200 text-slate-500
            hover:text-slate-700 hover:border-slate-300 text-sm font-medium rounded-xl
            transition-colors duration-150 cursor-pointer
            focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-1
            active:scale-[0.98]"
        >
          Continue Anyway
        </button>
      </div>
    </div>
  )
}
