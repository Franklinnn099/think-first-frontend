import type {
  ImpulseAnalysis,
  ManipulationTactic,
  BackendAnalyzeResponse,
} from '../types/index'
import { scoreToLevel } from '../utils/riskCalculator'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'https://clearcart-ug-backend.onrender.com'

/**
 * Extracts a discount percentage from detected tactic copy text.
 * Looks for patterns like "save 40%" or "40% off".
 */
function extractDiscountPercent(tactics: ManipulationTactic[]): number {
  for (const t of tactics) {
    if (t.type === 'discount_pressure') {
      const match = t.copy.match(/(\d+)\s*%/)
      if (match) return parseInt(match[1], 10)
    }
  }
  return 0
}

/**
 * Calls the backend to enrich local detection with Claude AI analysis.
 * Returns null on network failure — local detection result is still shown.
 */
export async function analyzePageContext(
  url: string,
  pageTitle: string,
  tactics: ManipulationTactic[],
  riskScore: number,
  visitCount = 0,
): Promise<ImpulseAnalysis | null> {
  // productText: join tactic copy snippets as a representative page excerpt
  const productText = tactics.map(t => t.copy).join(' | ') || pageTitle

  try {
    const res = await fetch(`${API_BASE}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productText,
        url,
        pageContext: pageTitle,
        riskSignals: {
          timeOfDay: new Date().getHours(),
          revisitCount: visitCount,
          cartValueJump: false,
          discountPercent: extractDiscountPercent(tactics),
          stressLevel: 'low', // default; could be set via user check-in UI
        },
      }),
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) throw new Error(`API error ${res.status}`)

    const body: BackendAnalyzeResponse = await res.json()
    if (!body.success) throw new Error('Backend returned success:false')

    const { data } = body
    const ai = data.claudeAnalysis

    // Backend risk score takes precedence when available
    const finalScore = data.riskScore ?? riskScore

    // Map backend manipulation_tactics back to our ManipulationTactic[] format,
    // merging with locally-detected tactics (local takes precedence for type/severity).
    const mergedTactics: ManipulationTactic[] = tactics.length > 0
      ? tactics
      : (data.localTactics ?? []).map(lt => ({
          type: lt.type as ManipulationTactic['type'],
          copy: lt.matchedPhrase,
          severity: 2,
        }))

    // Extract the truth rewrite from the first AI tactic that has one
    const firstRewrite = ai?.manipulation_tactics?.find(t => t.rewrite)?.rewrite

    return {
      riskScore: finalScore,
      riskLevel: scoreToLevel(finalScore),
      tactics: mergedTactics,
      emotionalTrigger: ai?.trigger_type,
      triggerExplanation: ai?.trigger_explanation,
      truthRewrite: firstRewrite,
      reflectionPrompt: ai?.reflection_prompt,
      regretForecast: ai?.regret_forecast,
      recommendation: ai?.recommendation,
      analyzedAt: Date.now(),
    }
  } catch {
    // Graceful offline fallback — UI still works with local detection
    return {
      riskScore,
      riskLevel: scoreToLevel(riskScore),
      tactics,
      analyzedAt: Date.now(),
    }
  }
}
