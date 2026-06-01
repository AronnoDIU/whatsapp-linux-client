/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * The built directory structure
     *
     * ```tree
     * ├─┬─┬ dist
     * │ │ └── index.html
     * │ │
     * │ ├─┬ dist-electron
     * │ │ ├── main.js
     * │ │ └── preload.js
     * │
     * ```
     */
    APP_ROOT: string
    /** /dist/ or /public/ */
    VITE_PUBLIC: string
  }
}

import type { AppSettings } from './settings'

// Used in Renderer process, expose in `preload.ts`
interface Window {
  ipcRenderer: import('electron').IpcRenderer
  whatsappNative: {
    openExternal: (url: string) => Promise<boolean>
    getAppVersion: () => Promise<{ version: string; platform: string }>
    getSettings: () => Promise<AppSettings>
    setSetting: (key: string, value: unknown) => Promise<boolean>
    resetSettings: () => Promise<boolean>
  }
}
