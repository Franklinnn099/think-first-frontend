/**
 * Offline-first manipulation tactic detector.
 * Runs entirely in the content script — no network calls, target <200ms.
 * Returns ManipulationTactic[] with severity as 1 (low) / 2 (medium) / 3 (high).
 */
import type { ManipulationTactic, TacticType } from '../types/index'

interface TacticRule {
  type: TacticType
  severity: 1 | 2 | 3
  patterns: RegExp[]
}

const TACTIC_RULES: TacticRule[] = [
  // ── Urgency ────────────────────────────────────────────────────────────────
  {
    type: 'urgency',
    severity: 3,
    patterns: [
      /only\s+\d+\s+(left|remaining|in\s+stock)/i,
      /ends?\s+in\s+\d+\s*(hour|hr|min|second|day)/i,
      /limited\s+time\s+(offer|deal|only)/i,
      /offer\s+ends\s+(today|soon|tonight)/i,
      /expires?\s+(today|tonight|soon|in\s+\d+)/i,
      /hurry[\s!,]/i,
      /order\s+in\s+the\s+next/i,
    ],
  },
  // ── Scarcity ──────────────────────────────────────────────────────────────
  {
    type: 'scarcity',
    severity: 3,
    patterns: [
      /only\s+[1-3]\s+(left|remaining)/i,
      /last\s+(one|item|chance|few)/i,
      /selling\s+fast/i,
      /almost\s+gone/i,
      /low\s+stock/i,
      /\d+\s+sold\s+(today|in\s+the\s+last)/i,
      /\d+\s+people\s+(just\s+)?bought/i,
      /running\s+out/i,
    ],
  },
  // ── Countdown timers (DOM-based) ──────────────────────────────────────────
  {
    type: 'countdown',
    severity: 3,
    patterns: [
      /\d{1,2}:\d{2}:\d{2}/,  // HH:MM:SS countdown format
    ],
  },
  // ── Social proof abuse ────────────────────────────────────────────────────
  {
    type: 'social_proof',
    severity: 2,
    patterns: [
      /\d+\s+people\s+(are\s+)?(viewing|looking|watching)/i,
      /\d+\s+(other\s+)?shoppers?\s+(have\s+this|viewing)/i,
      /#?1\s+best\s*seller/i,
      /\d+\s+bought\s+(today|this\s+week|recently)/i,
      /trending\s+(now|today)/i,
      /most\s+popular/i,
    ],
  },
  // ── FOMO deals ────────────────────────────────────────────────────────────
  {
    type: 'fomo',
    severity: 2,
    patterns: [
      /today\s+only/i,
      /flash\s+sale/i,
      /deal\s+of\s+the\s+day/i,
      /\d+%\s+off\s+(today|now|for\s+limited)/i,
      /exclusive\s+(offer|deal|discount)/i,
      /don'?t\s+miss\s+(out|this)/i,
      /price\s+drop/i,
    ],
  },
  // ── Discount pressure ────────────────────────────────────────────────────
  {
    type: 'discount_pressure',
    severity: 2,
    patterns: [
      /was\s+\$[\d,]+/i,
      /save\s+(up\s+to\s+)?\d+%/i,
      /\d{2,}%\s+off/i,
      /regular\s+price/i,
      /compare\s+at/i,
    ],
  },
]

/** Collect all visible text nodes from an element, avoiding script/style. */
function collectTextNodes(root: Element): string[] {
  const texts: string[] = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement
      if (!parent) return NodeFilter.FILTER_REJECT
      const tag = parent.tagName.toLowerCase()
      if (tag === 'script' || tag === 'style' || tag === 'noscript') {
        return NodeFilter.FILTER_REJECT
      }
      const text = node.textContent?.trim()
      return text && text.length > 2 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP
    },
  })
  let node: Node | null
  while ((node = walker.nextNode())) {
    texts.push(node.textContent!.trim())
  }
  return texts
}

export function detectManipulationTactics(): ManipulationTactic[] {
  const texts = collectTextNodes(document.body)
  const tactics: ManipulationTactic[] = []
  const seenTypes = new Set<TacticType>()

  for (const rule of TACTIC_RULES) {
    if (seenTypes.has(rule.type)) continue // one tactic entry per type max

    for (const pattern of rule.patterns) {
      // Find the shortest text node that matches
      const matchingText = texts.find(t => pattern.test(t))
      if (matchingText) {
        tactics.push({
          type: rule.type,
          copy: matchingText.trim().slice(0, 140),
          severity: rule.severity,
        })
        seenTypes.add(rule.type)
        break
      }
    }
  }

  return tactics
}
