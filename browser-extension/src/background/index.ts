import { handleMessage, cleanupTab } from './messageHandler'
import { setupAlarms, handleAlarm } from './alarms'

chrome.runtime.onInstalled.addListener(async () => {
  await setupAlarms()
  // Default badge color: indigo
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
