import { detectManipulationTactics } from './detector'
import { computeRiskScore } from '../utils/riskCalculator'
import { getSettings, incrementVisitCount } from '../utils/storage'
import type { ManipulationTactic } from '../types/index'

async function init(): Promise<void> {
  const settings = await getSettings()
  if (!settings.enabled) return

  // Track revisits for this URL (used in risk scoring)
  const visitCount = await incrementVisitCount(window.location.href)

  // Offline-first detection — no network needed
  const tactics = detectManipulationTactics()
  const riskScore = computeRiskScore(tactics, visitCount)

  if (tactics.length > 0) {
    console.log('[ThinkFirst] tactics detected:', tactics.map(t => `${t.type}(${t.severity})`))
  }

  if (riskScore < settings.riskThreshold) return

  // Notify background to update badge and store analysis
  chrome.runtime.sendMessage({
    type: 'TACTICS_DETECTED',
    payload: {
      tactics,
      riskScore,
      url: window.location.href,
      pageTitle: document.title,
      visitCount,
    },
  })

  // Inject a subtle in-page risk badge
  injectRiskBadge(riskScore, tactics)

  // High-risk: also trigger intervention badge flash
  if (riskScore >= 61) {
    chrome.runtime.sendMessage({
      type: 'SHOW_INTERVENTION',
      payload: { riskScore, url: window.location.href, pageTitle: document.title, tactics },
    })
  }
}

function injectRiskBadge(riskScore: number, tactics: ManipulationTactic[]): void {
  if (document.getElementById('tf-risk-badge')) return

  const isHigh = riskScore >= 61
  const bgColor = isHigh ? '#DC2626' : '#F59E0B'
  const label = isHigh ? 'High Manipulation Risk' : 'Tactics Detected'
  const count = tactics.length

  const badge = document.createElement('div')
  badge.id = 'tf-risk-badge'

  // Inline styles — no external CSS so it works on any page
  badge.innerHTML = `
    <div id="tf-badge-inner" style="
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 2147483647;
      background: ${bgColor};
      color: #fff;
      padding: 9px 14px;
      border-radius: 10px;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 13px;
      font-weight: 600;
      line-height: 1.3;
      box-shadow: 0 4px 16px rgba(0,0,0,0.22);
      cursor: pointer;
      user-select: none;
      display: flex;
      align-items: center;
      gap: 7px;
      max-width: 300px;
      transition: opacity 0.2s ease;
    ">
      <span style="font-size:16px; flex-shrink:0">⚠️</span>
      <span>
        <strong>ThinkFirst:</strong> ${label}
        <span style="opacity:0.85; font-weight:400"> · ${count} tactic${count !== 1 ? 's' : ''} found</span>
      </span>
      <span id="tf-badge-close" style="
        margin-left: 4px;
        opacity: 0.7;
        font-size: 16px;
        line-height: 1;
        flex-shrink: 0;
      ">×</span>
    </div>
  `

  document.body.appendChild(badge)

  badge.querySelector('#tf-badge-close')!.addEventListener('click', e => {
    e.stopPropagation()
    badge.remove()
  })
  badge.querySelector('#tf-badge-inner')!.addEventListener('click', () => {
    // Clicking the badge (not close) opens the extension popup
    badge.remove()
  })
}

init().catch(err => console.error('[ThinkFirst] init error:', err))
