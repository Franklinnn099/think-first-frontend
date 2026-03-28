import React, { useEffect, useState } from 'react'
import { sendToBackground } from '../utils/messaging'
import { InterventionPanel } from '../components/InterventionPanel'
import { RiskMeter } from '../components/RiskMeter'
import { ManipulationTag } from '../components/ManipulationTag'
import { CoolingOffCard } from '../components/CoolingOffCard'
import { CheckIcon, AlertTriangleIcon, SettingsIcon } from '../components/icons'
import type { TabAnalysis, CoolingOffItem, RiskLevel } from '../types/index'

// ─── Sub-views ────────────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="px-4 py-6 space-y-3 animate-pulse">
      <div className="h-3 bg-slate-100 rounded-full w-3/4" />
      <div className="h-2 bg-slate-100 rounded-full w-full" />
      <div className="h-2 bg-slate-100 rounded-full w-2/3" />
    </div>
  )
}

function SafeView({
  coolingOffList,
  onRemove,
}: {
  coolingOffList: CoolingOffItem[]
  onRemove: (id: string) => void
}) {
  return (
    <div className="px-4 py-4">
      <div className="flex flex-col items-center text-center py-4">
        <div className="w-12 h-12 rounded-2xl bg-teal-100 flex items-center justify-center mb-3">
          <CheckIcon size={24} className="text-teal-600" />
        </div>
        <h2 className="text-sm font-bold text-slate-800">You're browsing safely</h2>
        <p className="text-xs text-slate-400 mt-1 leading-snug max-w-[220px]">
          No manipulation tactics detected on this page.
        </p>
      </div>

      {coolingOffList.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Cooling-off list
          </p>
          <div className="space-y-2">
            {coolingOffList.slice(0, 3).map(item => (
              <CoolingOffCard key={item.id} item={item} onRemove={onRemove} />
            ))}
            {coolingOffList.length > 3 && (
              <p className="text-xs text-slate-400 text-center">
                +{coolingOffList.length - 3} more in settings
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function RiskDetectedView({
  tabAnalysis,
  onSave,
  onDismiss,
  saving,
}: {
  tabAnalysis: TabAnalysis
  onSave: () => void
  onDismiss: () => void
  saving: boolean
}) {
  const { impulseAnalysis } = tabAnalysis
  return (
    <div className="px-4 py-4 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0" aria-hidden="true">
          <AlertTriangleIcon size={18} className="text-amber-600" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-900">Tactics detected</h2>
          <p className="text-xs text-slate-500 mt-0.5">{tabAnalysis.pageTitle}</p>
        </div>
      </div>

      <RiskMeter score={impulseAnalysis.riskScore} />

      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          What we found
        </p>
        <div className="flex flex-wrap gap-1.5">
          {impulseAnalysis.tactics.map((t, i) => (
            <ManipulationTag key={i} tactic={t} expandable />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
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
          className="w-full py-2 text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors duration-150
            cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-1
            active:scale-[0.98] rounded-xl"
        >
          Continue Anyway
        </button>
      </div>
    </div>
  )
}

// ─── Main Popup ───────────────────────────────────────────────────────────────

export default function Popup() {
  const [tabAnalysis, setTabAnalysis] = useState<TabAnalysis | null>(null)
  const [coolingOffList, setCoolingOffList] = useState<CoolingOffItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [currentTab, setCurrentTab] = useState<chrome.tabs.Tab | null>(null)

  useEffect(() => {
    async function load() {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
      setCurrentTab(tabs[0] ?? null)

      const [analysisRes, listRes] = await Promise.all([
        sendToBackground<TabAnalysis | null>({ type: 'GET_CURRENT_TAB_ANALYSIS' }),
        sendToBackground<CoolingOffItem[]>({ type: 'GET_COOLING_OFF_LIST' }),
      ])

      if (analysisRes.success) setTabAnalysis(analysisRes.data ?? null)
      if (listRes.success) setCoolingOffList(listRes.data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const handleSaveForLater = async () => {
    if (!currentTab || saving) return
    setSaving(true)
    const res = await sendToBackground<CoolingOffItem[]>({
      type: 'SAVE_TO_COOLING_OFF',
      payload: {
        url: currentTab.url ?? '',
        pageTitle: currentTab.title ?? 'Unknown page',
        riskScore: tabAnalysis?.impulseAnalysis.riskScore ?? 0,
        riskLevel: (tabAnalysis?.impulseAnalysis.riskLevel ?? 'low') as RiskLevel,
      },
    })
    if (res.success) setCoolingOffList(res.data ?? [])
    setSaving(false)
    setDismissed(true) // collapse risk view after saving
  }

  const handleDismiss = async () => {
    setDismissed(true)
    await sendToBackground({ type: 'DISMISS_INTERVENTION' })
  }

  const handleRemove = async (id: string) => {
    const res = await sendToBackground<CoolingOffItem[]>({
      type: 'REMOVE_FROM_COOLING_OFF',
      payload: { id },
    })
    if (res.success) setCoolingOffList(res.data ?? [])
  }

  const riskScore = tabAnalysis?.impulseAnalysis.riskScore ?? 0
  const isHighRisk = !dismissed && riskScore >= 61
  const isMediumRisk = !dismissed && riskScore >= 20 && riskScore < 60

  return (
    <div className="w-[380px] bg-white flex flex-col min-h-[220px]">
      {/* ── Header ── */}
      <header className="flex items-center justify-between px-4 py-3 bg-navy-900">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-black tracking-tight">TF</span>
          </div>
          <span className="font-bold text-white text-sm tracking-wide">ThinkFirst</span>
        </div>
        <a
          href="src/options/options.html"
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-400 hover:text-white transition-colors duration-150 flex items-center justify-center w-7 h-7 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/40"
          aria-label="Settings"
        >
          <SettingsIcon size={16} />
        </a>
      </header>

      {/* ── Body ── */}
      <main className="flex-1">
        {loading ? (
          <LoadingSkeleton />
        ) : isHighRisk ? (
          <InterventionPanel
            analysis={tabAnalysis!.impulseAnalysis}
            onSave={handleSaveForLater}
            onDismiss={handleDismiss}
            saving={saving}
          />
        ) : isMediumRisk ? (
          <RiskDetectedView
            tabAnalysis={tabAnalysis!}
            onSave={handleSaveForLater}
            onDismiss={handleDismiss}
            saving={saving}
          />
        ) : (
          <SafeView coolingOffList={coolingOffList} onRemove={handleRemove} />
        )}
      </main>
    </div>
  )
}
