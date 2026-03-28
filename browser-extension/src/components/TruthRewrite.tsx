import React from 'react'

interface TruthRewriteProps {
  original: string
  rewritten: string
}

export function TruthRewrite({ original, rewritten }: TruthRewriteProps) {
  return (
    <div className="rounded-xl overflow-hidden border border-slate-200 shadow-card">
      {/* Header */}
      <div className="px-3 py-2 bg-slate-50 border-b border-slate-200">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          What the page says vs. the truth
        </p>
      </div>

      <div className="grid grid-cols-2 divide-x divide-slate-200">
        {/* Left: manipulative copy */}
        <div className="p-3 bg-red-50">
          <p className="text-[10px] font-semibold text-red-500 uppercase tracking-wide mb-1.5">
            They say
          </p>
          <p className="text-xs text-red-800 leading-snug italic">"{original}"</p>
        </div>

        {/* Right: AI truth rewrite */}
        <div className="p-3 bg-teal-50">
          <p className="text-[10px] font-semibold text-teal-600 uppercase tracking-wide mb-1.5">
            The truth
          </p>
          <p className="text-xs text-teal-800 leading-snug">{rewritten}</p>
        </div>
      </div>
    </div>
  )
}
