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
import type {
  MessageRequest,
  MessageResponse,
  CoolingOffItem,
  ExtensionSettings,
  TabAnalysis,
} from '../types/index'

const tabAnalysisMap = new Map<number, TabAnalysis>()

type SendResponse = (response: MessageResponse) => void

export async function handleMessage(
  message: MessageRequest,
  sender: chrome.runtime.MessageSender,
  sendResponse: SendResponse,
): Promise<void> {
  try {
    switch (message.type) {
      // ── Content script sends page text → backend handles all detection ────
      case 'ANALYZE_PAGE': {
        const { url, pageTitle, pageText, visitCount } = message.payload as {
          url: string
          pageTitle: string
          pageText: string
          visitCount: number
        }

        const analysis = await analyzePageContext(url, pageTitle, pageText, visitCount)

        if (analysis) {
          const tabId = sender.tab?.id
          if (tabId !== undefined) {
            tabAnalysisMap.set(tabId, { url, pageTitle, impulseAnalysis: analysis })
          }
          await updateBadge(analysis.riskScore)
        }

        sendResponse({ success: true, data: analysis })
        break
      }

      // ── High-risk badge flash ─────────────────────────────────────────────
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

      // ── Cooling-off list: try backend first, fall back to local ───────────
      case 'GET_COOLING_OFF_LIST': {
        const sessionId = await getOrCreateSessionId()
        const backendList = await fetchBackendCoolingOffList(sessionId)
        if (backendList !== null) {
          for (const item of backendList) await addToCoolingOff(item)
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

        const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
        const tabId = tabs[0]?.id
        const ai = tabId !== undefined ? tabAnalysisMap.get(tabId)?.impulseAnalysis : undefined

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
        resolveBackendItem(id, 'remove').catch(() => {})
        const list = await removeFromCoolingOff(id)
        sendResponse({ success: true, data: list })
        break
      }

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
    await chrome.action.setBadgeBackgroundColor({ color: '#DC2626' })
  } else {
    await chrome.action.setBadgeText({ text: String(riskScore) })
    await chrome.action.setBadgeBackgroundColor({ color: '#F59E0B' })
  }
}
