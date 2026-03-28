import type { RiskLevel } from '../types/index'

// All risk scoring logic lives on the backend.
// This file contains only display/presentation helpers.

/**
 * Converts a numeric score to a risk level label.
 * Used only for UI display when the backend doesn't provide a pre-computed level.
 */
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
