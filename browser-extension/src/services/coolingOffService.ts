import type { CoolingOffItem } from '../types/index'
import { API_BASE_URL } from '../utils/config'

// Backend returns snake_case fields directly from Supabase
export interface BackendCoolingOffItem {
  id: string
  product_title: string
  product_url: string
  risk_score: number
  trigger_type?: string
  source_platform: string
  cooloff_expires_at: string
  created_at: string
  resolved?: boolean
  resolved_action?: string
  session_id: string
}

function toLocalItem(b: BackendCoolingOffItem): CoolingOffItem {
  const score = b.risk_score ?? 0
  return {
    id: b.id,
    url: b.product_url,
    pageTitle: b.product_title,
    savedAt: new Date(b.created_at).getTime(),
    riskScore: score,
    riskLevel: score >= 61 ? 'high' : score >= 31 ? 'medium' : 'low',
    triggerType: b.trigger_type,
    backendId: b.id,
    sessionId: b.session_id,
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
    return (body.data as BackendCoolingOffItem[]).map(item => toLocalItem(item))
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
