import { getCoolingOffList, getSettings } from '../utils/storage'

const COOLING_OFF_ALARM = 'tf_cooling_off_check'

export async function setupAlarms(): Promise<void> {
  // Re-create idempotently — clears any stale alarm first
  await chrome.alarms.clear(COOLING_OFF_ALARM)
  await chrome.alarms.create(COOLING_OFF_ALARM, { periodInMinutes: 30 })
}

/**
 * Fires a notification once, in the 30-min window after a cooling-off
 * item's configured duration has elapsed.
 */
export async function handleAlarm(alarm: chrome.alarms.Alarm): Promise<void> {
  if (alarm.name !== COOLING_OFF_ALARM) return

  const settings = await getSettings()
  const list = await getCoolingOffList()
  if (list.length === 0) return

  const durationMs = settings.coolingOffDuration * 60 * 60 * 1000
  const windowMs = 30 * 60 * 1000
  const now = Date.now()

  for (const item of list) {
    const elapsed = now - item.savedAt
    if (elapsed >= durationMs && elapsed < durationMs + windowMs) {
      chrome.notifications.create(`tf_reminder_${item.id}`, {
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'ThinkFirst: Time to reflect',
        message: `Your ${settings.coolingOffDuration}h pause for "${item.pageTitle}" just ended. Still want it?`,
        priority: 1,
      })
    }
  }
}
