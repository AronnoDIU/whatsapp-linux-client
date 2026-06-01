/// <reference types="vite/client" />

interface AppSettings {
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

interface Window {
  whatsappNative: {
    getAppVersion: () => Promise<{ version: string; platform: string }>
    openExternal: (url: string) => Promise<boolean>
    getSettings: () => Promise<AppSettings>
    setSetting: (key: string, value: unknown) => Promise<boolean>
    resetSettings: () => Promise<boolean>
  }
}
