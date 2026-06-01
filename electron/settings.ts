import Store from 'electron-store'

export interface AppSettings {
  darkMode: 'auto' | 'light' | 'dark'
  customTheme: {
    primaryColor: string
    accentColor: string
    backgroundColor: string
    textColor: string
  }
  compactMode: boolean
  spellCheck: {
    enabled: boolean
    languages: string[]
  }
  zoomLevel: number
  notifications: {
    enabled: boolean
    showPreview: boolean
    enableActions: boolean
    customSound: string
    dndEnabled: boolean
    dndStartHour: number
    dndEndHour: number
  }
  advanced: {
    messageSearchEnabled: boolean
    quickReplyTemplates: string[]
    autoReplyEnabled: boolean
    autoReplyMessage: string
    autoReplyKeywords: string[]
  }
}

const defaultSettings: AppSettings = {
  darkMode: 'auto',
  customTheme: {
    primaryColor: '#22c55e',
    accentColor: '#16a34a',
    backgroundColor: '#0f172a',
    textColor: '#f8fafc'
  },
  compactMode: false,
  spellCheck: {
    enabled: true,
    languages: ['en-US']
  },
  zoomLevel: 1.0,
  notifications: {
    enabled: true,
    showPreview: true,
    enableActions: true,
    customSound: '',
    dndEnabled: false,
    dndStartHour: 22,
    dndEndHour: 8
  },
  advanced: {
    messageSearchEnabled: true,
    quickReplyTemplates: [
      'I\'ll get back to you soon',
      'Thanks for the message',
      'Can we talk later?',
      'On it!'
    ],
    autoReplyEnabled: false,
    autoReplyMessage: 'I\'m currently busy. I\'ll get back to you as soon as possible.',
    autoReplyKeywords: ['busy', 'meeting', 'driving']
  }
}

const store = new Store<AppSettings>({
  defaults: defaultSettings,
  name: 'whatsapp-linux-client-settings'
})

export const settings = {
  get: <K extends keyof AppSettings>(key: K): AppSettings[K] => store.get(key),
  set: <K extends keyof AppSettings>(key: K, value: AppSettings[K]): void => store.set(key, value),
  getAll: (): AppSettings => store.store,
  reset: (): void => store.clear()
}

export default settings
