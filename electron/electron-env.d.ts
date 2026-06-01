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

// Used in Renderer process, expose in `preload.ts`
declare global {
  interface Window {
    ipcRenderer: {
      on: (channel: string, listener: (event: Electron.IpcRendererEvent, ...args: unknown[]) => void) => Electron.IpcRenderer
      off: (channel: string, ...args: unknown[]) => Electron.IpcRenderer
      send: (channel: string, ...args: unknown[]) => void
      invoke: (channel: string, ...args: unknown[]) => Promise<unknown>
    }
    whatsappNative: {
      openExternal: (url: string) => Promise<boolean>
      getAppVersion: () => Promise<{ version: string; platform: string }>
      getSettings: () => Promise<import('./settings').AppSettings>
      setSetting: (key: string, value: unknown) => Promise<boolean>
      resetSettings: () => Promise<boolean>
    }
  }
}
