import type { MessageRequest } from '../src/types/index'

// Must mock modules with inline values — jest.mock is hoisted above const declarations
jest.mock('../src/utils/config', () => ({
  API_BASE_URL: 'https://test-backend.example.com',
}))

jest.mock('../src/utils/storage', () => ({
  getCoolingOffList: jest.fn().mockResolvedValue([]),
  addToCoolingOff: jest.fn().mockImplementation(async (item: unknown) => [item]),
  removeFromCoolingOff: jest.fn().mockResolvedValue([]),
  getSettings: jest.fn().mockResolvedValue({
    enabled: true, riskThreshold: 20, coolingOffDuration: 24, showBadge: true,
  }),
  updateSettings: jest.fn().mockResolvedValue({
    enabled: true, riskThreshold: 20, coolingOffDuration: 24, showBadge: true,
  }),
  getOrCreateSessionId: jest.fn().mockResolvedValue('test-session-id'),
}))

jest.mock('../src/services/claudeService', () => ({
  analyzePageContext: jest.fn().mockResolvedValue({
    riskScore: 45, riskLevel: 'medium', tactics: [{ type: 'urgency', copy: 'Only 1 left!', severity: 2 }], analyzedAt: Date.now(),
  }),
}))

jest.mock('../src/services/coolingOffService', () => ({
  saveToBackendCoolingOff: jest.fn().mockResolvedValue(null),
  fetchBackendCoolingOffList: jest.fn().mockResolvedValue(null),
  resolveBackendItem: jest.fn().mockResolvedValue(true),
}))

import { handleMessage } from '../src/background/messageHandler'

const mockSender = { tab: { id: 1 } } as chrome.runtime.MessageSender

describe('handleMessage', () => {
  it('ANALYZE_PAGE calls backend and returns analysis', async () => {
    const sendResponse = jest.fn()
    await handleMessage({
      type: 'ANALYZE_PAGE',
      payload: { url: 'https://shop.example.com/item', pageTitle: 'Widget', pageText: 'Only 1 left!', visitCount: 1 },
    }, mockSender, sendResponse)
    expect(sendResponse).toHaveBeenCalledWith(expect.objectContaining({ success: true }))
    expect(sendResponse.mock.calls[0][0].data).toHaveProperty('riskScore', 45)
    expect(chrome.action.setBadgeText).toHaveBeenCalled()
  })

  it('ANALYZE_PAGE returns null when backend unavailable', async () => {
    const { analyzePageContext } = require('../src/services/claudeService')
    analyzePageContext.mockResolvedValueOnce(null)
    const sendResponse = jest.fn()
    await handleMessage({
      type: 'ANALYZE_PAGE',
      payload: { url: 'https://example.com', pageTitle: 'Test', pageText: 'text', visitCount: 0 },
    }, mockSender, sendResponse)
    expect(sendResponse).toHaveBeenCalledWith({ success: true, data: null })
  })

  it('GET_COOLING_OFF_LIST returns local list when backend unavailable', async () => {
    const sendResponse = jest.fn()
    await handleMessage({ type: 'GET_COOLING_OFF_LIST' }, mockSender, sendResponse)
    expect(sendResponse).toHaveBeenCalledWith({ success: true, data: [] })
  })

  it('GET_SETTINGS returns settings', async () => {
    const sendResponse = jest.fn()
    await handleMessage({ type: 'GET_SETTINGS' }, mockSender, sendResponse)
    expect(sendResponse).toHaveBeenCalledWith({
      success: true,
      data: { enabled: true, riskThreshold: 20, coolingOffDuration: 24, showBadge: true },
    })
  })

  it('GET_CURRENT_TAB_ANALYSIS returns null when no analysis stored', async () => {
    const sendResponse = jest.fn()
    await handleMessage({ type: 'GET_CURRENT_TAB_ANALYSIS' }, mockSender, sendResponse)
    expect(sendResponse).toHaveBeenCalledWith({ success: true, data: null })
  })

  it('SAVE_TO_COOLING_OFF creates item and returns list', async () => {
    const sendResponse = jest.fn()
    await handleMessage({
      type: 'SAVE_TO_COOLING_OFF',
      payload: { url: 'https://shop.example.com', pageTitle: 'Widget', riskScore: 45, riskLevel: 'medium' },
    }, mockSender, sendResponse)
    const call = sendResponse.mock.calls[0][0]
    expect(call.success).toBe(true)
    expect(Array.isArray(call.data)).toBe(true)
  })

  it('REMOVE_FROM_COOLING_OFF returns updated list', async () => {
    const sendResponse = jest.fn()
    await handleMessage({ type: 'REMOVE_FROM_COOLING_OFF', payload: { id: 'abc-123' } }, mockSender, sendResponse)
    expect(sendResponse).toHaveBeenCalledWith({ success: true, data: [] })
  })

  it('DISMISS_INTERVENTION clears badge', async () => {
    const sendResponse = jest.fn()
    await handleMessage({ type: 'DISMISS_INTERVENTION' }, mockSender, sendResponse)
    expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: '' })
    expect(sendResponse).toHaveBeenCalledWith({ success: true })
  })

  it('unknown message type returns error', async () => {
    const sendResponse = jest.fn()
    await handleMessage({ type: 'UNKNOWN_TYPE' } as unknown as MessageRequest, mockSender, sendResponse)
    expect(sendResponse).toHaveBeenCalledWith({ success: false, error: 'Unknown message type' })
  })
})
