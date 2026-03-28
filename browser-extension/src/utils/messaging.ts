import type { MessageRequest, MessageResponse } from '../types/index'

/**
 * Send a typed message to the ThinkFirst background service worker.
 * Rejects if the runtime returns an error.
 */
export async function sendToBackground<T = unknown>(
  request: MessageRequest,
): Promise<MessageResponse<T>> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(request, (response: MessageResponse<T>) => {
      if (chrome.runtime.lastError) {
        resolve({ success: false, error: chrome.runtime.lastError.message })
        return
      }
      resolve(response ?? { success: false, error: 'No response' })
    })
  })
}
