import type { CoolingOffItem, ExtensionSettings } from '../types/index'

const KEYS = {
  COOLING_OFF: 'tf_cooling_off_list',
  SETTINGS: 'tf_settings',
  HISTORY: 'tf_analysis_history',
  VISIT_COUNTS: 'tf_visit_counts',
  SESSION_ID: 'tf_session_id',
} as const

const DEFAULT_SETTINGS: ExtensionSettings = {
  enabled: true,
  riskThreshold: 20,
  coolingOffDuration: 24,
  showBadge: true,
}

// ─── Cooling-Off List ───────────────────────────────────────────────────

export async function getCoolingOffList(): Promise<CoolingOffItem[]> {
  const { [KEYS.COOLING_OFF]: list = [] } = await chrome.storage.local.get(KEYS.COOLING_OFF)
  return list as CoolingOffItem[]
}

export async function addToCoolingOff(item: CoolingOffItem): Promise<CoolingOffItem[]> {
  const list = await getCoolingOffList()
  const deduped = list.filter((i) => i.id !== item.id)
  const updated = [item, ...deduped].slice(0, 50) // keep most recent 50
  await chrome.storage.local.set({ [KEYS.COOLING_OFF]: updated })
  return updated
}

export async function removeFromCoolingOff(id: string): Promise<CoolingOffItem[]> {
  const list = await getCoolingOffList()
  const updated = list.filter((i) => i.id !== id)
  await chrome.storage.local.set({ [KEYS.COOLING_OFF]: updated })
  return updated
}

// ─── Settings ───────────────────────────────────────────────────────────

export async function getSettings(): Promise<ExtensionSettings> {
  const { [KEYS.SETTINGS]: settings } = await chrome.storage.local.get(KEYS.SETTINGS)
  return { ...DEFAULT_SETTINGS, ...(settings as Partial<ExtensionSettings> | undefined) }
}

export async function updateSettings(partial: Partial<ExtensionSettings>): Promise<ExtensionSettings> {
  const current = await getSettings()
  const updated = { ...current, ...partial }
  await chrome.storage.local.set({ [KEYS.SETTINGS]: updated })
  return updated
}

// ─── Visit Count Tracking ───────────────────────────────────────────────
// Used to calculate revisit bonus in risk scoring

export async function incrementVisitCount(url: string): Promise<number> {
  const { [KEYS.VISIT_COUNTS]: counts = {} } = await chrome.storage.local.get(KEYS.VISIT_COUNTS)
  const typedCounts = counts as Record<string, number>
  const key = normalizeUrl(url)
  typedCounts[key] = (typedCounts[key] ?? 0) + 1
  await chrome.storage.local.set({ [KEYS.VISIT_COUNTS]: typedCounts })
  return typedCounts[key]
}

export async function getVisitCount(url: string): Promise<number> {
  const { [KEYS.VISIT_COUNTS]: counts = {} } = await chrome.storage.local.get(KEYS.VISIT_COUNTS)
  const typedCounts = counts as Record<string, number>
  return typedCounts[normalizeUrl(url)] ?? 0
}

// ─── Session ID ─────────────────────────────────────────────────────────
// Persisted UUID that identifies this user across extension + mobile.
// Generated once on first use and stored permanently.

export async function getOrCreateSessionId(): Promise<string> {
  const { [KEYS.SESSION_ID]: existing } = await chrome.storage.local.get(KEYS.SESSION_ID)
  if (existing) return existing as string
  // Generate a UUID v4-like identifier
  const id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
  await chrome.storage.local.set({ [KEYS.SESSION_ID]: id })
  return id
}

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url)
    return (u.hostname + u.pathname).toLowerCase().replace(/\/$/, '')
  } catch {
    return url.toLowerCase()
  }
}
