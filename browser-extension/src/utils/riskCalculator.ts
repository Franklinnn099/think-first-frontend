import type { ManipulationTactic, RiskLevel } from '../types/index'

// Tactic severity weights that contribute to the raw risk score
const SEVERITY_WEIGHTS: Record<number, number> = {
  1: 8,   // low severity tactic
  2: 15,  // medium severity tactic
  3: 25,  // high severity tactic
}

/**
 * Returns a +0 to +15 bonus for late-night shopping (10pm – 2am local time)
 * when stress and impulsivity are statistically higher.
 */
function timeBonusScore(): number {
  const hour = new Date().getHours()
  if (hour >= 22 || hour <= 2) return 15
  if (hour >= 20 || hour <= 4) return 7
  return 0
}

/**
 * Returns a revisit bonus based on how many times the user has been to
 * the same URL recently (stored via chrome.storage).
 */
function revisitBonus(visitCount: number): number {
  if (visitCount >= 5) return 12
  if (visitCount >= 3) return 7
  if (visitCount >= 2) return 3
  return 0
}

/**
 * Returns a discount intensity bonus if an original price was detected.
 * Large percentage discounts amplify impulse pressure.
 */
function discountBonus(discountPercent: number): number {
  if (discountPercent >= 50) return 10
  if (discountPercent >= 30) return 6
  if (discountPercent >= 15) return 3
  return 0
}

/**
 * Computes the composite Impulse Risk Score (0–100).
 *
 * Inputs:
 * - tactics: detected manipulation tactics with severity
 * - visitCount: how many times user has visited this URL recently
 * - discountPercent: detected discount (0 if no discount detected)
 *
 * Score components:
 * 1. Tactic severity sum (capped at 60)
 * 2. Time-of-day bonus (0–15)
 * 3. Revisit bonus (0–12)
 * 4. Discount intensity bonus (0–10)
 * 5. Multiple tactics compound bonus (5 if >2 tactics)
 */
export function computeRiskScore(
  tactics: ManipulationTactic[],
  visitCount = 0,
  discountPercent = 0,
): number {
  // 1. Base: sum severity weights, cap at 60
  let tacticScore = tactics.reduce(
    (acc, t) => acc + (SEVERITY_WEIGHTS[t.severity] ?? 8),
    0,
  )
  tacticScore = Math.min(tacticScore, 60)

  // 2. Time bonus
  const timeBonus = timeBonusScore()

  // 3. Revisit bonus
  const revBonus = revisitBonus(visitCount)

  // 4. Discount bonus
  const discBonus = discountBonus(discountPercent)

  // 5. Compound: multiple distinct tactics compound risk
  const compoundBonus = tactics.length > 2 ? 5 : 0

  const total = tacticScore + timeBonus + revBonus + discBonus + compoundBonus
  return Math.min(100, Math.max(0, Math.round(total)))
}

/**
 * Converts a numeric score to a risk level label.
 */
// Thresholds aligned with backend: Low (0-30), Medium (31-60), High (61-100)
export function scoreToLevel(score: number): RiskLevel {
  if (score >= 61) return 'high'
  if (score >= 31) return 'medium'
  return 'low'
}

/**
 * Returns a human-readable label for the risk level.
 */
export function riskLevelLabel(level: RiskLevel): string {
  return { low: 'Low Risk', medium: 'Medium Risk', high: 'High Risk' }[level]
}

/**
 * Returns the Tailwind color class for a given risk level.
 */
export function riskLevelColor(level: RiskLevel): string {
  return {
    low: '#10B981',
    medium: '#F59E0B',
    high: '#DC2626',
  }[level]
}
