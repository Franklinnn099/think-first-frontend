// Chrome API mock for Jest (jsdom doesn't have chrome globals)
global.chrome = {
  storage: {
    local: {
      get: jest.fn().mockResolvedValue({}),
      set: jest.fn().mockResolvedValue(undefined),
      remove: jest.fn().mockResolvedValue(undefined),
      clear: jest.fn().mockResolvedValue(undefined),
    },
    sync: {
      get: jest.fn().mockResolvedValue({}),
      set: jest.fn().mockResolvedValue(undefined),
      clear: jest.fn().mockResolvedValue(undefined),
    },
  },
  runtime: {
    sendMessage: jest.fn().mockResolvedValue({ success: true, data: null }),
    onMessage: { addListener: jest.fn() },
    onInstalled: { addListener: jest.fn() },
    onStartup: { addListener: jest.fn() },
  },
  notifications: {
    create: jest.fn(),
  },
  action: {
    setBadgeText: jest.fn().mockResolvedValue(undefined),
    setBadgeBackgroundColor: jest.fn().mockResolvedValue(undefined),
  },
  alarms: {
    create: jest.fn().mockResolvedValue(undefined),
    onAlarm: { addListener: jest.fn() },
  },
  tabs: {
    query: jest.fn().mockResolvedValue([]),
    sendMessage: jest.fn().mockResolvedValue({ success: true, data: null }),
  },
} as unknown as typeof chrome
