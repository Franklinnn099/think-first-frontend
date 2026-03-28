// ThinkFirst Browser Extension — Type Definitions

export type TacticType =
  | 'urgency'
  | 'scarcity'
  | 'social_proof'
  | 'fomo'
  | 'countdown'
  | 'discount_pressure'
  | 'unknown'

export type RiskLevel = 'low' | 'medium' | 'high'

export type TriggerType =
  | 'stress_relief'
  | 'fomo'
  | 'status_repair'
  | 'boredom'
  | 'self_reward'

export type Recommendation = 'buy' | 'save' | 'wait'

export interface ManipulationTactic {
  type: TacticType
  copy: string       // the exact detected text/element content
  severity: number   // 1–3: 1=low, 2=medium, 3=high
}

export interface ImpulseAnalysis {
  riskScore: number                  // 0–100
  riskLevel: RiskLevel
  tactics: ManipulationTactic[]
  emotionalTrigger?: string          // trigger_type from Claude
  triggerExplanation?: string        // short explanation (under 30 words)
  truthRewrite?: string              // rewritten honest copy (first tactic)
  reflectionPrompt?: string          // Claude's reflection question
  regretForecast?: string            // Claude's regret likelihood summary
  recommendation?: Recommendation    // buy | save | wait
  analyzedAt: number
}

export interface CoolingOffItem {
  id: string
  url: string
  pageTitle: string
  savedAt: number
  riskScore: number
  riskLevel: RiskLevel
  triggerType?: string
  aiSummary?: string
  backendId?: string     // id returned by backend after POST /api/coolingoff
  sessionId?: string
}

// ─── Backend API response shapes ─────────────────────────────────────────────

export interface BackendLocalTactic {
  type: string
  matchedPhrase: string
}

export interface BackendClaudeAnalysis {
  manipulation_tactics: Array<{ type: string; phrase: string; rewrite: string }>
  trigger_type: TriggerType
  trigger_explanation: string
  risk_level: string
  regret_forecast: string
  reflection_prompt: string
  recommendation: Recommendation
}

export interface BackendAnalyzeResponse {
  success: boolean
  data: {
    localTactics: BackendLocalTactic[]
    riskScore: number
    riskLevel: string
    claudeAnalysis: BackendClaudeAnalysis | null
    cached?: boolean
  }
}

export interface ExtensionSettings {
  enabled: boolean
  riskThreshold: number              // 0–100, default 30
  coolingOffDuration: 12 | 24 | 48   // hours
  showBadge: boolean
}

export interface PageContext {
  url: string
  title: string
  bodyText: string
  detectedTactics: ManipulationTactic[]
  riskScore: number
}

/** Per-tab analysis stored in background service worker memory */
export interface TabAnalysis {
  url: string
  pageTitle: string
  impulseAnalysis: ImpulseAnalysis
}

// Message types for chrome runtime messaging
export type MessageType =
  | 'ANALYZE_PAGE'
  | 'SHOW_INTERVENTION'
  | 'GET_CURRENT_TAB_ANALYSIS'
  | 'SAVE_TO_COOLING_OFF'
  | 'GET_COOLING_OFF_LIST'
  | 'REMOVE_FROM_COOLING_OFF'
  | 'GET_SETTINGS'
  | 'UPDATE_SETTINGS'
  | 'DISMISS_INTERVENTION'

export interface MessageRequest<T = unknown> {
  type: MessageType
  payload?: T
}

export interface MessageResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}
