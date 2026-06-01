import { ipcRenderer, contextBridge, desktopCapturer, webFrame } from 'electron'

const chromeLikeUA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

// --------- Expose a small, safe API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  }
})

// Expose higher-level helpers under window.whatsappNative
contextBridge.exposeInMainWorld('whatsappNative', {
  showNotification: (title: string, body?: string, replyId?: string) => ipcRenderer.send('native-notification', { title, body, replyId }),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  createNewAccountWindow: () => ipcRenderer.send('create-new-account'),
  pickFiles: (options?: Electron.OpenDialogOptions) => ipcRenderer.invoke('dialog:openFiles', options),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  // Settings API
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSetting: (key: string, value: unknown) => ipcRenderer.invoke('settings:set', key, value),
  resetSettings: () => ipcRenderer.invoke('settings:reset'),
  // Provide a desktop-capture fallback for getDisplayMedia (used for screen sharing)
  getDisplayMedia: async (constraints?: MediaStreamConstraints) => {
    // Try to pick a screen source, fall back to the first available source
    const sources = await desktopCapturer.getSources({ types: ['screen', 'window'], thumbnailSize: { width: 0, height: 0 } })
    if (!sources || sources.length === 0) throw new Error('No desktop sources available')

    // Prefer a whole-screen source
    const screenSource = sources.find(s => /screen|entire/i.test(s.name)) || sources[0]
    const sourceId = screenSource.id

    // Build constraints compatible with Electron/Chromium. Respect commonly requested values if provided.
    const requested = constraints as unknown as { video?: { width?: number; height?: number; frameRate?: number } }
    const maxWidth = requested?.video?.width ?? 1920
    const maxHeight = requested?.video?.height ?? 1080
    const maxFrameRate = requested?.video?.frameRate ?? 30

    const videoConstraints = {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: sourceId,
        maxWidth,
        maxHeight,
        maxFrameRate
      }
    } as unknown as MediaTrackConstraints

    // Use navigator.mediaDevices.getUserMedia to get the stream for the chosen source
    // Note: audio capture for system audio is platform-dependent; we request video only here
    return await navigator.mediaDevices.getUserMedia({ audio: false, video: videoConstraints })
  }
})

const buildCompatScript = () => `(() => {
  try {
    const nav = window.navigator
    const ua = ${JSON.stringify(chromeLikeUA)}

    try { Object.defineProperty(nav, 'userAgent', { get: () => ua }) } catch (e) {}
    try { Object.defineProperty(nav, 'platform', { get: () => 'Linux x86_64' }) } catch (e) {}
    try { Object.defineProperty(nav, 'vendor', { get: () => 'Google Inc.' }) } catch (e) {}
    try { Object.defineProperty(nav, 'webdriver', { get: () => false }) } catch (e) {}

    try {
      if (!window.chrome) {
        Object.defineProperty(window, 'chrome', { value: { runtime: {} }, configurable: true })
      } else if (!window.chrome.runtime) {
        window.chrome.runtime = {}
      }
    } catch (e) {}

    try {
      if (!nav.userAgentData) {
        nav.userAgentData = {
          brands: [{ brand: 'Chromium', version: '120' }, { brand: 'Google Chrome', version: '120' }],
          mobile: false,
          getHighEntropyValues: () => Promise.resolve({
            architecture: 'x86',
            model: '',
            platform: 'Linux',
            platformVersion: '5.15.0',
            uaFullVersion: '120.0.0.0'
          })
        }
      }
    } catch (e) {}

    try {
      const permissions = navigator.permissions
      const origQuery = permissions && permissions.query ? permissions.query.bind(permissions) : null
      if (origQuery) {
        permissions.query = (param) => {
          try {
            const name = param && param.name ? param.name : param
            if (['camera', 'microphone', 'display-capture', 'notifications'].includes(name)) {
              return Promise.resolve({ state: 'granted', onchange: null })
            }
          } catch (e) {}
          return origQuery(param)
        }
      }
    } catch (e) {}

    try {
      const mediaDevices = navigator.mediaDevices
      if (mediaDevices) {
        const originalGetDisplayMedia = mediaDevices.getDisplayMedia ? mediaDevices.getDisplayMedia.bind(mediaDevices) : null
        mediaDevices.getDisplayMedia = function (constraints) {
          return window.whatsappNative.getDisplayMedia(constraints).catch((err) => {
            if (originalGetDisplayMedia) return originalGetDisplayMedia(constraints)
            throw err
          })
        }
      }
    } catch (e) {}

    try {
      window.process = undefined
      window.require = undefined
      window.module = undefined
      window.exports = undefined
    } catch (e) {}
  } catch (e) {
    console.warn('Page compat bootstrap error', e)
  }
})()`

try {
  void webFrame.executeJavaScript(buildCompatScript(), false)
} catch (err) {
  console.warn('executeJavaScript bootstrap failed, using DOM fallback', err)
  const script = document.createElement('script')
  script.textContent = buildCompatScript()
  ;(document.documentElement || document.head || document.body || document).appendChild(script)
  script.remove()
}
