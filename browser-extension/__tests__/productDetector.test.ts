/**
 * Tests for claudeService.ts — backend-only analysis integration.
 * Local regex detection has been removed; the backend handles all detection.
 */

// Mock config before importing claudeService
jest.mock('../src/utils/config', () => ({
  API_BASE_URL: 'https://test-backend.example.com',
}))

jest.mock('../src/utils/riskCalculator', () => ({
  scoreToLevel: (score: number) => (score >= 61 ? 'high' : score >= 31 ? 'medium' : 'low'),
}))

import { analyzePageContext } from '../src/services/claudeService'

// Mock fetch globally
global.fetch = jest.fn()
const mockFetch = global.fetch as jest.Mock

const BACKEND_RESPONSE = {
  success: true,
  data: {
    localTactics: [
      { type: 'urgency', matchedPhrase: 'Limited time offer' },
      { type: 'scarcity', matchedPhrase: 'Only 2 left' },
    ],
    riskScore: 72,
    riskLevel: 'High',
    claudeAnalysis: {
      manipulation_tactics: [
        { type: 'urgency', phrase: 'Limited time offer', rewrite: 'This item is always available' },
      ],
      trigger_type: 'fomo',
      trigger_explanation: 'Artificial urgency to prevent comparison shopping',
      risk_level: 'High',
      regret_forecast: 'High likelihood of regret without reflection',
      reflection_prompt: 'Would you still want this without the countdown?',
      recommendation: 'wait',
    },
  },
}

beforeEach(() => {
  mockFetch.mockReset()
})

describe('analyzePageContext', () => {
  it('calls backend with productText, url, pageContext and riskSignals', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => BACKEND_RESPONSE,
    })

    await analyzePageContext('https://shop.example.com/item', 'Great Widget', 'Only 2 left! Limited time offer', 1)

    expect(mockFetch).toHaveBeenCalledTimes(1)
    const [url, options] = mockFetch.mock.calls[0]
    expect(url).toBe('https://test-backend.example.com/api/analyze')
    const body = JSON.parse(options.body)
    expect(body.productText).toBe('Only 2 left! Limited time offer')
    expect(body.url).toBe('https://shop.example.com/item')
    expect(body.pageContext).toBe('Great Widget')
    expect(body.riskSignals).toHaveProperty('revisitCount', 1)
    expect(body.riskSignals).toHaveProperty('timeOfDay')
  })

  it('maps backend localTactics to ManipulationTactic[]', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => BACKEND_RESPONSE })

    const result = await analyzePageContext('https://example.com', 'Widget', 'Only 2 left', 0)

    expect(result).not.toBeNull()
    expect(result!.tactics.length).toBeGreaterThan(0)
    expect(result!.tactics.some(t => t.type === 'urgency')).toBe(true)
    expect(result!.tactics.some(t => t.type === 'scarcity')).toBe(true)
  })

  it('uses backend riskScore directly', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => BACKEND_RESPONSE })

    const result = await analyzePageContext('https://example.com', 'Widget', 'text', 0)

    expect(result!.riskScore).toBe(72)
  })

  it('maps claudeAnalysis fields to ImpulseAnalysis', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => BACKEND_RESPONSE })

    const result = await analyzePageContext('https://example.com', 'Widget', 'text', 0)

    expect(result!.reflectionPrompt).toBe('Would you still want this without the countdown?')
    expect(result!.emotionalTrigger).toBe('fomo')
    expect(result!.recommendation).toBe('wait')
    expect(result!.truthRewrite).toBe('This item is always available')
  })

  it('returns null when backend is unreachable', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const result = await analyzePageContext('https://example.com', 'Widget', 'text', 0)

    expect(result).toBeNull()
  })

  it('returns null on non-ok HTTP response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 })

    const result = await analyzePageContext('https://example.com', 'Widget', 'text', 0)

    expect(result).toBeNull()
  })

  it('handles null claudeAnalysis gracefully (no tactics detected)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { localTactics: [], riskScore: 5, riskLevel: 'Low', claudeAnalysis: null },
      }),
    })

    const result = await analyzePageContext('https://example.com', 'Widget', 'normal page', 0)

    expect(result).not.toBeNull()
    expect(result!.riskScore).toBe(5)
    expect(result!.tactics).toHaveLength(0)
    expect(result!.reflectionPrompt).toBeUndefined()
  })
})
