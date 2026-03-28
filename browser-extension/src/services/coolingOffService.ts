import type { CoolingOffItem, RiskLevel } from '../types/index'
import { API_BASE_URL } from '../utils/config'

export interface BackendCoolingOffItem {
  id: string
  productTitle: string
  productUrl: string
  riskScore: number
  riskLevel?: RiskLevel
  triggerType?: string
  sourcePlatform: string
  delayHours: number
  createdAt: string
  resolvedAt?: string
  action?: 'keep' | 'remove' | 'extend'
}

function toLocalItem(b: BackendCoolingOffItem, sessionId: string): CoolingOffItem {
  return {
    id: b.id,
    url: b.productUrl,
    pageTitle: b.productTitle,
    savedAt: new Date(b.createdAt).getTime(),
    riskScore: b.riskScore,
    riskLevel: b.riskLevel ?? 'low',
    triggerType: b.triggerType,
    backendId: b.id,
    sessionId,
  }
}

/**
 * Saves a cooling-off item to the backend.
 * Returns the created backend id, or null on failure.
 */
export async function saveToBackendCoolingOff(params: {
  sessionId: string
  pageTitle: string
  url: string
  riskScore: number
  triggerType?: string
  claudeAnalysis?: object
  coolingOffDuration?: number
}): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/coolingoff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: params.sessionId,
        productTitle: params.pageTitle,
        productUrl: params.url,
        riskScore: params.riskScore,
        triggerType: params.triggerType,
        claudeAnalysis: params.claudeAnalysis ?? null,
        sourcePlatform: 'extension',
        delayHours: params.coolingOffDuration ?? 24,
      }),
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) return null
    const body = await res.json()
    return body?.data?.id ?? null
  } catch {
    return null
  }
}

/**
 * Fetches all cooling-off items for a session from the backend.
 * Returns null on failure — caller should fall back to local storage.
 */
export async function fetchBackendCoolingOffList(
  sessionId: string,
): Promise<CoolingOffItem[] | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/coolingoff/${encodeURIComponent(sessionId)}`, {
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) return null
    const body = await res.json()
    if (!body.success || !Array.isArray(body.data)) return null
    return (body.data as BackendCoolingOffItem[]).map(item => toLocalItem(item, sessionId))
  } catch {
    return null
  }
}

/**
 * Resolves a cooling-off item on the backend.
 */
export async function resolveBackendItem(
  id: string,
  action: 'keep' | 'remove' | 'extend',
): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/coolingoff/${encodeURIComponent(id)}/resolve`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
      signal: AbortSignal.timeout(6000),
    })
    return res.ok
  } catch {
    return false
  }
}

/**
 * Gets the AI re-evaluation prompt for an item (only works after timer expires).
 */
export async function reevaluateItem(id: string): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/coolingoff/${encodeURIComponent(id)}/reevaluate`, {
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    const body = await res.json()
    return body?.data?.prompt ?? null
  } catch {
    return null
  }
}
