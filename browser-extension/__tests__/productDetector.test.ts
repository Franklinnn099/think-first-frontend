/**
 * Tests for content/detector.ts — ThinkFirst manipulation tactic detector.
 * Renamed from productDetector.test.ts.
 */
import { detectManipulationTactics } from '../src/content/detector'

// Minimal NodeFilter stub for jsdom
if (!global.NodeFilter) {
  // @ts-expect-error jsdom may expose this differently
  global.NodeFilter = { SHOW_TEXT: 0x4, FILTER_ACCEPT: 1, FILTER_SKIP: 3, FILTER_REJECT: 2 }
}

describe('detectManipulationTactics', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('returns empty array on a clean page', () => {
    document.body.innerHTML = '<h1>Welcome to our store</h1><p>Great products at great prices.</p>'
    expect(detectManipulationTactics()).toHaveLength(0)
  })

  it('detects urgency — "limited time offer"', () => {
    document.body.innerHTML = '<p>Limited time offer — save big today!</p>'
    const tactics = detectManipulationTactics()
    expect(tactics.some(t => t.type === 'urgency')).toBe(true)
  })

  it('detects scarcity — "only 2 left"', () => {
    document.body.innerHTML = '<span>Only 2 left in stock</span>'
    const tactics = detectManipulationTactics()
    expect(tactics.some(t => t.type === 'scarcity')).toBe(true)
  })

  it('detects social_proof — "X people viewing"', () => {
    document.body.innerHTML = '<div>47 people are viewing this item right now</div>'
    const tactics = detectManipulationTactics()
    expect(tactics.some(t => t.type === 'social_proof')).toBe(true)
  })

  it('detects fomo — "today only"', () => {
    document.body.innerHTML = '<strong>Today only — 40% off!</strong>'
    const tactics = detectManipulationTactics()
    expect(tactics.some(t => t.type === 'fomo')).toBe(true)
  })

  it('detects discount_pressure — "was $X"', () => {
    document.body.innerHTML = '<p>Was $199.99 — now just $99!</p>'
    const tactics = detectManipulationTactics()
    expect(tactics.some(t => t.type === 'discount_pressure')).toBe(true)
  })

  it('returns at most one tactic entry per type', () => {
    document.body.innerHTML = `
      <p>Only 1 left! Hurry, limited time offer!</p>
      <p>Only 2 items remaining, selling fast!</p>
    `
    const tactics = detectManipulationTactics()
    const types = tactics.map(t => t.type)
    const unique = new Set(types)
    expect(types.length).toBe(unique.size)
  })

  it('includes the matching copy text', () => {
    document.body.innerHTML = '<p>Flash sale — today only, 50% off!</p>'
    const tactics = detectManipulationTactics()
    const fomo = tactics.find(t => t.type === 'fomo')
    expect(fomo?.copy).toBeTruthy()
    expect(typeof fomo?.copy).toBe('string')
  })

  it('assigns high severity (3) to urgency and scarcity', () => {
    document.body.innerHTML = '<p>Only 1 left! Offer ends in 2 hours!</p>'
    const tactics = detectManipulationTactics()
    const highSeverity = tactics.filter(t => t.severity === 3)
    expect(highSeverity.length).toBeGreaterThan(0)
  })

  it('ignores script and style content', () => {
    document.body.innerHTML = `
      <script>var x = "only 1 left";</script>
      <style>.urgency { content: "limited time"; }</style>
      <p>Normal product description.</p>
    `
    expect(detectManipulationTactics()).toHaveLength(0)
  })
})
