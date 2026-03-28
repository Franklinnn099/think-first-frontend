import type {
  ImpulseAnalysis,
  ManipulationTactic,
  RiskLevel,
  BackendAnalyzeResponse,
} from '../types/index'
import { API_BASE_URL } from '../utils/config'

/**
 * Sends raw page text to the backend for full detection + AI analysis.
 * The backend handles ALL tactic detection — no local regex used.
 * Returns null if the backend is unreachable.
 */
export async function analyzePageContext(
  url: string,
  pageTitle: string,
  pageText: string,
  visitCount = 0,
): Promise<ImpulseAnalysis | null> {
  if (!API_BASE_URL) {
    console.error('[ThinkFirst] Cannot analyze — VITE_API_BASE_URL is not configured')
    return null
  }

  try {
    const endpoint = `${API_BASE_URL}/api/analyze`
    console.log('[ThinkFirst] Sending analysis request to', endpoint)

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productText: pageText,
        url,
        pageContext: pageTitle,
        riskSignals: {
          timeOfDay: new Date().getHours(),
          revisitCount: visitCount,
          cartValueJump: false,
          discountPercent: 0,
          stressLevel: 'low',
        },
      }),
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) {
      console.error('[ThinkFirst] Backend returned', res.status, res.statusText)
      return null
    }

    const body: BackendAnalyzeResponse = await res.json()
    if (!body.success) {
      console.error('[ThinkFirst] Backend returned success:false', body)
      return null
    }

    const { data } = body
    const ai = data.claudeAnalysis

    // Map backend localTactics to ManipulationTactic[]
    const tactics: ManipulationTactic[] = (data.localTactics ?? []).map(lt => ({
      type: (lt.type as ManipulationTactic['type']) ?? 'unknown',
      copy: lt.matchedPhrase,
      severity: 2,
    }))

    // Merge AI manipulation_tactics for richer copy/rewrites
    if (ai?.manipulation_tactics?.length) {
      ai.manipulation_tactics.forEach(at => {
        const existing = tactics.find(t => t.type === at.type)
        if (existing) {
          existing.copy = at.phrase || existing.copy
        } else {
          tactics.push({ type: at.type as ManipulationTactic['type'], copy: at.phrase, severity: 2 })
        }
      })
    }

    const firstRewrite = ai?.manipulation_tactics?.find(t => t.rewrite)?.rewrite

    console.log('[ThinkFirst] Analysis complete — risk:', data.riskScore, 'tactics:', tactics.length)

    return {
      riskScore: data.riskScore,
      riskLevel: (data.riskLevel?.toLowerCase() as RiskLevel) ?? 'low',
      tactics,
      emotionalTrigger: ai?.trigger_type,
      triggerExplanation: ai?.trigger_explanation,
      truthRewrite: firstRewrite,
      reflectionPrompt: ai?.reflection_prompt,
      regretForecast: ai?.regret_forecast,
      recommendation: ai?.recommendation,
      analyzedAt: Date.now(),
    }
  } catch (err) {
    console.error('[ThinkFirst] Analysis failed:', err)
    return null
  }
}
