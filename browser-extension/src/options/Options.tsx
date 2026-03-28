import React, { useEffect, useState } from 'react'
import { getSettings, updateSettings, getCoolingOffList, removeFromCoolingOff } from '../utils/storage'
import type { ExtensionSettings, CoolingOffItem } from '../types/index'
import { CoolingOffCard } from '../components/CoolingOffCard'
import { CheckIcon } from '../components/icons'

const DEFAULT: ExtensionSettings = {
  enabled: true,
  riskThreshold: 20,
  coolingOffDuration: 24,
  showBadge: true,
}

export default function Options() {
  const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT)
  const [coolingOffList, setCoolingOffList] = useState<CoolingOffItem[]>([])
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function load() {
      const [s, list] = await Promise.all([getSettings(), getCoolingOffList()])
      setSettings(s)
      setCoolingOffList(list)
    }
    load()
  }, [])

  const handleSave = async () => {
    await updateSettings(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleRemoveCoolingOff = async (id: string) => {
    const updated = await removeFromCoolingOff(id)
    setCoolingOffList(updated)
  }

  const handleClearData = async () => {
    if (!confirm('Clear all ThinkFirst data? This will remove your cooling-off list and settings.')) return
    await chrome.storage.local.clear()
    setSettings(DEFAULT)
    setCoolingOffList([])
  }

  return (
    <div className="max-w-xl mx-auto py-10 px-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
          <span className="text-white font-black text-sm tracking-tight">TF</span>
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">ThinkFirst Settings</h1>
          <p className="text-sm text-slate-500">Protect your decisions from manipulation</p>
        </div>
      </div>

      {/* Extension toggle */}
      <section className="mb-6">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
          General
        </h2>
        <div className="bg-white rounded-xl border border-slate-200">
          <label className="flex items-center justify-between px-4 py-3.5 cursor-pointer">
            <div>
              <span className="text-sm font-medium text-slate-800">Enable ThinkFirst</span>
              <p className="text-xs text-slate-400 mt-0.5">
                Detect and flag manipulation tactics while you browse
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={e => setSettings(s => ({ ...s, enabled: e.target.checked }))}
              className="w-4 h-4 accent-indigo-600"
            />
          </label>
        </div>
      </section>

      {/* Risk threshold */}
      <section className="mb-6">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
          Detection sensitivity
        </h2>
        <div className="bg-white rounded-xl border border-slate-200 px-4 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-800">Risk threshold</span>
            <span className="text-sm font-bold text-indigo-600 tabular-nums">
              {settings.riskThreshold}
            </span>
          </div>
          <input
            type="range"
            min={10}
            max={60}
            step={5}
            value={settings.riskThreshold}
            onChange={e => setSettings(s => ({ ...s, riskThreshold: Number(e.target.value) }))}
            className="w-full accent-indigo-600"
          />
          <div className="flex justify-between text-xs text-slate-400">
            <span>Sensitive (10)</span>
            <span>Permissive (60)</span>
          </div>
          <p className="text-xs text-slate-400 leading-snug">
            Pages scoring above this threshold will show the risk badge. Lower = flag more.
          </p>
        </div>
      </section>

      {/* Cooling-off duration */}
      <section className="mb-6">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
          Cooling-off period
        </h2>
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {([12, 24, 48] as const).map(hours => (
            <label key={hours} className="flex items-center justify-between px-4 py-3 cursor-pointer">
              <span className="text-sm text-slate-700">{hours} hours</span>
              <input
                type="radio"
                name="coolingOffDuration"
                value={hours}
                checked={settings.coolingOffDuration === hours}
                onChange={() => setSettings(s => ({ ...s, coolingOffDuration: hours }))}
                className="accent-indigo-600"
              />
            </label>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-2 px-1">
          How long to hold items before sending a reminder to reflect.
        </p>
      </section>

      {/* Badge toggle */}
      <section className="mb-6">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
          Badge
        </h2>
        <div className="bg-white rounded-xl border border-slate-200">
          <label className="flex items-center justify-between px-4 py-3.5 cursor-pointer">
            <div>
              <span className="text-sm font-medium text-slate-800">Show risk badge</span>
              <p className="text-xs text-slate-400 mt-0.5">
                Display risk score on the extension icon
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.showBadge}
              onChange={e => setSettings(s => ({ ...s, showBadge: e.target.checked }))}
              className="w-4 h-4 accent-indigo-600"
            />
          </label>
        </div>
      </section>

      {/* Cooling-off list */}
      {coolingOffList.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
            Cooling-off list ({coolingOffList.length})
          </h2>
          <div className="space-y-2">
            {coolingOffList.map(item => (
              <CoolingOffCard key={item.id} item={item} onRemove={handleRemoveCoolingOff} />
            ))}
          </div>
        </section>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleSave}
          className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 active:scale-[0.98]"
        >
          {saved ? (
            <span className="inline-flex items-center gap-1.5">
              <CheckIcon size={14} />
              Saved
            </span>
          ) : 'Save Settings'}
        </button>
        <button
          onClick={handleClearData}
          className="text-sm text-red-400 hover:text-red-500 font-medium transition-colors duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-1 rounded"
        >
          Clear all data
        </button>
      </div>
    </div>
  )
}
