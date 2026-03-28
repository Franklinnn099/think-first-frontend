import { handleMessage, cleanupTab } from './messageHandler'
import { setupAlarms, handleAlarm } from './alarms'

chrome.runtime.onInstalled.addListener(async () => {
  await setupAlarms()
  await chrome.action.setBadgeBackgroundColor({ color: '#4338CA' })
})

chrome.runtime.onStartup.addListener(async () => {
  await setupAlarms()
})

// Route all messages through the handler; return true keeps the async channel open
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender, sendResponse)
  return true
})

chrome.alarms.onAlarm.addListener(handleAlarm)

// Clean up per-tab analysis when a tab closes
chrome.tabs.onRemoved.addListener(cleanupTab)

// Programmatically inject content script on every page navigation.
// This bypasses CRXJS's dynamic import loader which fails silently on many pages.
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete') return
  if (!tab.url) return

  // Skip non-http pages (chrome://, about:, etc.)
  if (!tab.url.startsWith('http://') && !tab.url.startsWith('https://')) return

  chrome.scripting.executeScript({
    target: { tabId },
    files: ['content.js'],
  }).catch(err => {
    // Expected to fail on restricted pages (chrome web store, etc.)
    console.log('[ThinkFirst] Could not inject content script into', tab.url, err.message)
  })
})
