import {
  getCoolingOffList,
  addToCoolingOff,
  removeFromCoolingOff,
  getSettings,
  updateSettings,
  getOrCreateSessionId,
} from '../utils/storage'
import { analyzePageContext } from '../services/claudeService'
import {
  saveToBackendCoolingOff,
  fetchBackendCoolingOffList,
  resolveBackendItem,
} from '../services/coolingOffService'
import { computeRiskScore, scoreToLevel } from '../utils/riskCalculator'
import type {
  MessageRequest,
  MessageResponse,
  ManipulationTactic,
  ImpulseAnalysis,
  CoolingOffItem,
  ExtensionSettings,
  TabAnalysis,
} from '../types/index'

// Per-tab analysis lives here in memory.
// MV3 service workers may be killed; this is intentionally ephemeral —
// the content script re-detects on each page visit.
const tabAnalysisMap = new Map<number, TabAnalysis>()

type SendResponse = (response: MessageResponse) => void

export async function handleMessage(
  message: MessageRequest,
  sender: chrome.runtime.MessageSender,
  sendResponse: SendResponse,
): Promise<void> {
  try {
    switch (message.type) {
      // ── Content script sends local detection results ──────────────────────
      case 'TACTICS_DETECTED': {
        const payload = message.payload as {
          tactics: ManipulationTactic[]
          riskScore: number
          url: string
          pageTitle: string
          visitCount: number
        }
        const impulseAnalysis: ImpulseAnalysis = {
          riskScore: payload.riskScore,
          riskLevel: scoreToLevel(payload.riskScore),
          tactics: payload.tactics,
          analyzedAt: Date.now(),
        }
        const tabId = sender.tab?.id
        if (tabId !== undefined) {
          tabAnalysisMap.set(tabId, {
            url: payload.url,
            pageTitle: payload.pageTitle,
            impulseAnalysis,
          })
          // High-risk pages: enrich with AI asynchronously (fire-and-forget)
          if (payload.riskScore >= 61) {
            analyzePageContext(
              payload.url,
              payload.pageTitle,
              payload.tactics,
              payload.riskScore,
              payload.visitCount,
            )
              .then(ai => {
                if (ai) {
                  const entry = tabAnalysisMap.get(tabId)
                  if (entry) tabAnalysisMap.set(tabId, { ...entry, impulseAnalysis: ai })
                }
              })
              .catch(() => {})
          }
        }
        await updateBadge(payload.riskScore)
        sendResponse({ success: true })
        break
      }

      // ── Content script signals high-risk page for badge flash ────────────
      case 'SHOW_INTERVENTION': {
        await chrome.action.setBadgeText({ text: '!' })
        await chrome.action.setBadgeBackgroundColor({ color: '#DC2626' })
        sendResponse({ success: true })
        break
      }

      // ── Popup requests current tab's analysis ─────────────────────────────
      case 'GET_CURRENT_TAB_ANALYSIS': {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
        const tabId = tabs[0]?.id
        const analysis = tabId !== undefined ? (tabAnalysisMap.get(tabId) ?? null) : null
        sendResponse({ success: true, data: analysis })
        break
      }

      // ── Popup manually requests AI enrichment ────────────────────────────
      case 'GET_PAGE_ANALYSIS': {
        const { url, tactics } = message.payload as {
          url: string
          pageText: string
          tactics: ManipulationTactic[]
        }
        const riskScore = computeRiskScore(tactics)
        const analysis = await analyzePageContext(url, url, tactics, riskScore)
        sendResponse({ success: true, data: analysis })
        break
      }

      // ── Cooling-off list: try backend first, fall back to local ───────────
      case 'GET_COOLING_OFF_LIST': {
        const sessionId = await getOrCreateSessionId()
        const backendList = await fetchBackendCoolingOffList(sessionId)
        if (backendList !== null) {
          // Sync backend result to local storage
          for (const item of backendList) {
            await addToCoolingOff(item)
          }
          sendResponse({ success: true, data: backendList })
        } else {
          const list = await getCoolingOffList()
          sendResponse({ success: true, data: list })
        }
        break
      }

      case 'SAVE_TO_COOLING_OFF': {
        const payload = message.payload as Omit<CoolingOffItem, 'id' | 'savedAt'>
        const sessionId = await getOrCreateSessionId()
        const settings = await getSettings()

        // Get the current tab's analysis for richer data to send to backend
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
        const tabId = tabs[0]?.id
        const tabAnalysis = tabId !== undefined ? tabAnalysisMap.get(tabId) : undefined
        const ai = tabAnalysis?.impulseAnalysis

        // Save to backend (fire-and-forget on failure)
        const backendId = await saveToBackendCoolingOff({
          sessionId,
          pageTitle: payload.pageTitle,
          url: payload.url,
          riskScore: payload.riskScore,
          triggerType: ai?.emotionalTrigger,
          claudeAnalysis: ai
            ? {
                reflection_prompt: ai.reflectionPrompt,
                regret_forecast: ai.regretForecast,
                recommendation: ai.recommendation,
              }
            : undefined,
          coolingOffDuration: settings.coolingOffDuration,
        })

        const item: CoolingOffItem = {
          ...payload,
          id: backendId ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          savedAt: Date.now(),
          triggerType: ai?.emotionalTrigger,
          backendId: backendId ?? undefined,
          sessionId,
        }
        const list = await addToCoolingOff(item)
        sendResponse({ success: true, data: list })
        break
      }

      case 'REMOVE_FROM_COOLING_OFF': {
        const { id } = message.payload as { id: string }
        // Resolve on backend as 'remove' (non-blocking)
        resolveBackendItem(id, 'remove').catch(() => {})
        const list = await removeFromCoolingOff(id)
        sendResponse({ success: true, data: list })
        break
      }

      // ── Settings ──────────────────────────────────────────────────────────
      case 'GET_SETTINGS': {
        const settings = await getSettings()
        sendResponse({ success: true, data: settings })
        break
      }

      case 'UPDATE_SETTINGS': {
        const settings = await updateSettings(message.payload as Partial<ExtensionSettings>)
        sendResponse({ success: true, data: settings })
        break
      }

      case 'DISMISS_INTERVENTION': {
        await chrome.action.setBadgeText({ text: '' })
        sendResponse({ success: true })
        break
      }

      default:
        sendResponse({ success: false, error: 'Unknown message type' })
    }
  } catch (err) {
    sendResponse({ success: false, error: (err as Error).message })
  }
}

export function cleanupTab(tabId: number): void {
  tabAnalysisMap.delete(tabId)
}

async function updateBadge(riskScore: number): Promise<void> {
  const settings = await getSettings()
  if (!settings.showBadge || riskScore < settings.riskThreshold) {
    await chrome.action.setBadgeText({ text: '' })
    return
  }
  if (riskScore >= 61) {
    await chrome.action.setBadgeText({ text: '!' })
    await chrome.action.setBadgeBackgroundColor({ color: '#DC2626' }) // red
  } else {
    await chrome.action.setBadgeText({ text: String(riskScore) })
    await chrome.action.setBadgeBackgroundColor({ color: '#F59E0B' }) // amber
  }
}
