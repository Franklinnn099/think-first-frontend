import { handleMessage } from '../src/background/messageHandler'
import type { MessageRequest } from '../src/types/index'

// jest.mock is hoisted — cannot reference file-scope consts here; use inline values.
jest.mock('../src/utils/storage', () => ({
  getCoolingOffList: jest.fn().mockResolvedValue([]),
  addToCoolingOff: jest.fn().mockImplementation(async (item: unknown) => [item]),
  removeFromCoolingOff: jest.fn().mockResolvedValue([]),
  getSettings: jest.fn().mockResolvedValue({
    enabled: true,
    riskThreshold: 20,
    coolingOffDuration: 24,
    showBadge: true,
  }),
  updateSettings: jest.fn().mockResolvedValue({
    enabled: true,
    riskThreshold: 20,
    coolingOffDuration: 24,
    showBadge: true,
  }),
  getOrCreateSessionId: jest.fn().mockResolvedValue('test-session-id'),
}))

jest.mock('../src/services/claudeService', () => ({
  analyzePageContext: jest.fn().mockResolvedValue(null),
}))

jest.mock('../src/services/coolingOffService', () => ({
  saveToBackendCoolingOff: jest.fn().mockResolvedValue(null),
  fetchBackendCoolingOffList: jest.fn().mockResolvedValue(null), // null → fall back to local
  resolveBackendItem: jest.fn().mockResolvedValue(true),
}))

jest.mock('../src/utils/riskCalculator', () => ({
  computeRiskScore: jest.fn().mockReturnValue(25),
  scoreToLevel: jest.fn().mockReturnValue('low'),
}))

const MOCK_SETTINGS = {
  enabled: true,
  riskThreshold: 20,
  coolingOffDuration: 24 as const,
  showBadge: true,
}

const mockSender = { tab: { id: 1 } } as chrome.runtime.MessageSender

describe('handleMessage', () => {
  it('GET_COOLING_OFF_LIST returns local list when backend unavailable', async () => {
    const sendResponse = jest.fn()
    await handleMessage({ type: 'GET_COOLING_OFF_LIST' }, mockSender, sendResponse)
    expect(sendResponse).toHaveBeenCalledWith({ success: true, data: [] })
  })

  it('GET_SETTINGS returns settings', async () => {
    const sendResponse = jest.fn()
    await handleMessage({ type: 'GET_SETTINGS' }, mockSender, sendResponse)
    expect(sendResponse).toHaveBeenCalledWith({ success: true, data: MOCK_SETTINGS })
  })

  it('GET_CURRENT_TAB_ANALYSIS returns null when no analysis stored', async () => {
    const sendResponse = jest.fn()
    await handleMessage({ type: 'GET_CURRENT_TAB_ANALYSIS' }, mockSender, sendResponse)
    // tabs.query returns [] → tabId undefined → null
    expect(sendResponse).toHaveBeenCalledWith({ success: true, data: null })
  })

  it('TACTICS_DETECTED stores analysis and updates badge', async () => {
    const sendResponse = jest.fn()
    const payload = {
      tactics: [{ type: 'urgency' as const, copy: 'Only 1 left!', severity: 3 }],
      riskScore: 45,
      url: 'https://shop.example.com/item',
      pageTitle: 'Awesome Widget',
      visitCount: 1,
    }
    await handleMessage({ type: 'TACTICS_DETECTED', payload }, mockSender, sendResponse)
    expect(sendResponse).toHaveBeenCalledWith({ success: true })
    expect(chrome.action.setBadgeText).toHaveBeenCalled()
  })

  it('SAVE_TO_COOLING_OFF creates item and returns updated list', async () => {
    const sendResponse = jest.fn()
    const payload = {
      url: 'https://shop.example.com/item',
      pageTitle: 'Awesome Widget',
      riskScore: 45,
      riskLevel: 'medium' as const,
    }
    await handleMessage({ type: 'SAVE_TO_COOLING_OFF', payload }, mockSender, sendResponse)
    const call = sendResponse.mock.calls[0][0]
    expect(call.success).toBe(true)
    expect(Array.isArray(call.data)).toBe(true)
  })

  it('REMOVE_FROM_COOLING_OFF returns updated list', async () => {
    const sendResponse = jest.fn()
    await handleMessage(
      { type: 'REMOVE_FROM_COOLING_OFF', payload: { id: 'abc-123' } },
      mockSender,
      sendResponse,
    )
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
    await handleMessage(
      { type: 'UNKNOWN_TYPE' } as unknown as MessageRequest,
      mockSender,
      sendResponse,
    )
    expect(sendResponse).toHaveBeenCalledWith({
      success: false,
      error: 'Unknown message type',
    })
  })
})
