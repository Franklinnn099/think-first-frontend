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

// Persist analysis in chrome.storage.local so it survives MV3 service worker restarts.
const ANALYSIS_STORAGE_KEY = 'tf_tab_analyses'

async function getTabAnalysis(tabId: number): Promise<TabAnalysis | null> {
  const { [ANALYSIS_STORAGE_KEY]: map = {} } = await chrome.storage.local.get(ANALYSIS_STORAGE_KEY)
  const result = (map as Record<string, TabAnalysis>)[String(tabId)] ?? null
  console.log('[ThinkFirst] getTabAnalysis', tabId, result ? `score=${result.impulseAnalysis.riskScore}` : 'null')
  return result
}

async function setTabAnalysis(tabId: number, analysis: TabAnalysis): Promise<void> {
  const { [ANALYSIS_STORAGE_KEY]: map = {} } = await chrome.storage.local.get(ANALYSIS_STORAGE_KEY)
  const typedMap = map as Record<string, TabAnalysis>
  typedMap[String(tabId)] = analysis
  await chrome.storage.local.set({ [ANALYSIS_STORAGE_KEY]: typedMap })
  console.log('[ThinkFirst] setTabAnalysis', tabId, 'score=', analysis.impulseAnalysis.riskScore)
}

async function deleteTabAnalysis(tabId: number): Promise<void> {
  const { [ANALYSIS_STORAGE_KEY]: map = {} } = await chrome.storage.local.get(ANALYSIS_STORAGE_KEY)
  const typedMap = map as Record<string, TabAnalysis>
  delete typedMap[String(tabId)]
  await chrome.storage.local.set({ [ANALYSIS_STORAGE_KEY]: typedMap })
}

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

        if (!analysis) {
          console.warn('[ThinkFirst] analyzePageContext returned null for', url)
        }

        const senderTabId = sender.tab?.id
        console.log('[ThinkFirst] ANALYZE_PAGE result:', { senderTabId, hasAnalysis: !!analysis, riskScore: analysis?.riskScore })

        if (analysis) {
          if (senderTabId !== undefined) {
            await setTabAnalysis(senderTabId, { url, pageTitle, impulseAnalysis: analysis })
          } else {
            console.error('[ThinkFirst] sender.tab.id is undefined — cannot store analysis')
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
        const analysis = tabId !== undefined ? await getTabAnalysis(tabId) : null
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
        const tabData = tabId !== undefined ? await getTabAnalysis(tabId) : null
        const ai = tabData?.impulseAnalysis

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
  deleteTabAnalysis(tabId).catch(() => {})
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
