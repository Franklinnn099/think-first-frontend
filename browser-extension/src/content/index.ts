import { getSettings, incrementVisitCount } from '../utils/storage'
import type { ImpulseAnalysis } from '../types/index'

/** Collect visible page text, skipping scripts/styles/nav. Max 3000 chars. */
function extractPageText(): string {
  const texts: string[] = []
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement
      if (!parent) return NodeFilter.FILTER_REJECT
      const tag = parent.tagName.toLowerCase()
      if (['script', 'style', 'noscript', 'nav', 'footer', 'head'].includes(tag)) {
        return NodeFilter.FILTER_REJECT
      }
      const text = node.textContent?.trim()
      return text && text.length > 3 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP
    },
  })
  let node: Node | null
  while ((node = walker.nextNode())) {
    texts.push(node.textContent!.trim())
    if (texts.join(' ').length >= 3000) break
  }
  return texts.join(' ').slice(0, 3000)
}

async function init(): Promise<void> {
  const settings = await getSettings()
  if (!settings.enabled) return

  const visitCount = await incrementVisitCount(window.location.href)
  const pageText = extractPageText()

  // Send page content to background — backend handles all detection
  const response = await chrome.runtime.sendMessage({
    type: 'ANALYZE_PAGE',
    payload: {
      url: window.location.href,
      pageTitle: document.title,
      pageText,
      visitCount,
    },
  })

  if (!response?.success || !response?.data) return

  const analysis: ImpulseAnalysis = response.data

  if (analysis.riskScore < settings.riskThreshold) return

  console.log('[ThinkFirst] risk score:', analysis.riskScore, '| tactics:', analysis.tactics.map(t => t.type))

  injectRiskBadge(analysis.riskScore, analysis.tactics.length)

  if (analysis.riskScore >= 61) {
    chrome.runtime.sendMessage({
      type: 'SHOW_INTERVENTION',
      payload: { riskScore: analysis.riskScore },
    })
  }
}

function injectRiskBadge(riskScore: number, tacticCount: number): void {
  if (document.getElementById('tf-risk-badge')) return

  const isHigh = riskScore >= 61
  const bgColor = isHigh ? '#DC2626' : '#F59E0B'
  const label = isHigh ? 'High Manipulation Risk' : 'Tactics Detected'

  const badge = document.createElement('div')
  badge.id = 'tf-risk-badge'
  badge.innerHTML = `
    <div id="tf-badge-inner" style="
      position: fixed; bottom: 20px; right: 20px; z-index: 2147483647;
      background: ${bgColor}; color: #fff; padding: 9px 14px; border-radius: 10px;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 13px; font-weight: 600; line-height: 1.3;
      box-shadow: 0 4px 16px rgba(0,0,0,0.22); cursor: pointer; user-select: none;
      display: flex; align-items: center; gap: 7px; max-width: 300px;
      transition: opacity 0.2s ease;
    ">
      <span style="font-size:16px; flex-shrink:0">⚠</span>
      <span>
        <strong>ThinkFirst:</strong> ${label}
        <span style="opacity:0.85; font-weight:400"> · ${tacticCount} tactic${tacticCount !== 1 ? 's' : ''} found</span>
      </span>
      <span id="tf-badge-close" style="margin-left:4px; opacity:0.7; font-size:16px; line-height:1; flex-shrink:0;">×</span>
    </div>
  `
  document.body.appendChild(badge)
  badge.querySelector('#tf-badge-close')!.addEventListener('click', e => {
    e.stopPropagation()
    badge.remove()
  })
}

init().catch(err => console.error('[ThinkFirst] init error:', err))
