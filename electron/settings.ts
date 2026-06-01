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
  zoomLevel: 1.0
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
