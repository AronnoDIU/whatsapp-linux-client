/* eslint-disable @typescript-eslint/no-unused-vars */
import { app, BrowserWindow, Tray, Menu, nativeImage, globalShortcut, dialog, shell, ipcMain, Notification, desktopCapturer } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
/* eslint-enable @typescript-eslint/no-unused-vars */

// Improve WebRTC / screen capture support on Linux (PipeWire)
app.commandLine.appendSwitch('enable-features', 'WebRTCPipeWireCapturer')
app.commandLine.appendSwitch('enable-usermedia-screen-capturing')
app.commandLine.appendSwitch('enable-experimental-web-platform-features')
app.commandLine.appendSwitch('disable-blink-features', 'AutomationControlled')
app.commandLine.appendSwitch('disable-dev-shm-usage')

const chromeLikeUA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
const DEFAULT_WINDOW_BOUNDS = { width: 1400, height: 900 }
const ZOOM_STEP = 0.1

type WindowState = {
  bounds?: { x?: number; y?: number; width: number; height: number }
  isMaximized?: boolean
  isFullScreen?: boolean
  zoomFactor?: number
}

function getWindowStatePath() {
  return path.join(app.getPath('userData'), 'window-state.json')
}

function loadWindowState(): WindowState {
  try {
    const raw = fs.readFileSync(getWindowStatePath(), 'utf8')
    return JSON.parse(raw) as WindowState
  } catch {
    return {}
  }
}

function saveWindowState(win: BrowserWindow) {
  try {
    const payload: WindowState = {
      bounds: win.getBounds(),
      isMaximized: win.isMaximized(),
      isFullScreen: win.isFullScreen(),
      zoomFactor: win.webContents.getZoomFactor()
    }
    fs.writeFileSync(getWindowStatePath(), JSON.stringify(payload, null, 2))
  } catch (err) {
    console.warn('Failed to persist window state', err)
  }
}

function adjustZoom(win: BrowserWindow, delta: number) {
  const current = win.webContents.getZoomFactor()
  const next = Math.min(3, Math.max(0.5, Math.round((current + delta) * 10) / 10))
  win.webContents.setZoomFactor(next)
}

function buildBengaliTypographyCSS() {
  return `
    :root,
    html,
    body,
    button,
    input,
    textarea,
    select,
    option,
    [contenteditable="true"],
    [lang="bn"],
    :lang(bn) {
      font-family:
        "Noto Sans Bengali",
        "Noto Serif Bengali",
        "Noto Sans",
        "Noto Serif",
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif !important;
      font-kerning: normal !important;
      font-feature-settings: "kern" 1, "liga" 1, "calt" 1 !important;
      text-rendering: optimizeLegibility !important;
      -webkit-font-smoothing: antialiased !important;
      -moz-osx-font-smoothing: grayscale !important;
    }

    .emoji,
    [aria-label*="emoji" i] {
      font-family: "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif !important;
    }
  `
}

let tray: Tray | null = null

function createMainWindow(partition = 'persist:default') {
  const state = loadWindowState()
  const win = new BrowserWindow({
    ...(state.bounds ?? DEFAULT_WINDOW_BOUNDS),
    show: false,
    backgroundColor: '#0f172a',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
      spellcheck: true,
        // electron-vite builds the preload bundle to dist-electron/preload/preload.mjs
        preload: path.join(__dirname, '../preload/preload.mjs'),
      partition
    }
  })

  if (typeof state.zoomFactor === 'number' && state.zoomFactor > 0) {
    win.webContents.setZoomFactor(state.zoomFactor)
  }

  // Load WhatsApp Web with a Chrome-like user agent for better compatibility (calls / media)
  win.webContents.setUserAgent(chromeLikeUA)
  win.webContents.session.setUserAgent(chromeLikeUA)
  win.loadURL('https://web.whatsapp.com', { userAgent: chromeLikeUA }).catch((err) => {
    console.error('Failed to load WhatsApp Web:', err)
  })

  win.webContents.on('did-finish-load', async () => {
    try {
      await win.webContents.insertCSS(buildBengaliTypographyCSS())
    } catch (err) {
      console.warn('Failed to inject Bengali typography CSS', err)
    }
  })

  win.once('ready-to-show', () => {
    if (!win.isDestroyed()) {
      win.show()
      win.focus()
      if (state.isMaximized) win.maximize()
      if (state.isFullScreen) win.setFullScreen(true)
    }
  })

  win.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'Escape' && win.isFullScreen()) {
      event.preventDefault()
      win.setFullScreen(false)
      return
    }

    const key = input.key.toLowerCase()
    const isAccel = input.control || input.meta

    if (!isAccel) return

    if (key === '=' || key === '+' || key === 'add') {
      event.preventDefault()
      adjustZoom(win, ZOOM_STEP)
      return
    }

    if (key === '-' || key === 'subtract') {
      event.preventDefault()
      adjustZoom(win, -ZOOM_STEP)
      return
    }

    if (key === '0') {
      event.preventDefault()
      win.webContents.setZoomFactor(1)
      return
    }

    if (key === 'r' && input.shift) {
      event.preventDefault()
      win.webContents.reloadIgnoringCache()
      return
    }

    if (key === 'r') {
      event.preventDefault()
      win.webContents.reload()
    }
  })

  // Native display-capture handler for WhatsApp screen sharing (and call flows that probe capture support)
  const session = win.webContents.session
  if (typeof session.setDisplayMediaRequestHandler === 'function') {
    session.setDisplayMediaRequestHandler(async (_request, callback) => {
      try {
        const source = await desktopCaptureForDisplayShare()
        callback({ video: source })
      } catch (err) {
        console.warn('Display media request failed', err)
        callback({})
      }
    })
  }

  // Handle permission requests for camera / microphone / notifications / display-capture
  session.setPermissionRequestHandler((_webContents, permission: string, callback: (grant: boolean) => void) => {
    // Allow common permissions used by WhatsApp Web
    const allow = ['media', 'microphone', 'camera', 'display-capture', 'notifications', 'fullscreen']
    if (allow.includes(permission)) {
      callback(true)
    } else {
      callback(false)
    }
  })

  // Optionally handle new-window / external links to open in default browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const hostname = new URL(url).hostname
      const isWhatsAppHost = /(^|\.)whatsapp\.com$/i.test(hostname) || /(^|\.)whatsapp\.net$/i.test(hostname) || /(^|\.)fbcdn\.net$/i.test(hostname)

      if (isWhatsAppHost) {
        return { action: 'allow' }
      }

      void shell.openExternal(url)
    } catch {
      // ignore malformed URLs
    }
    return { action: 'deny' }
  })

  win.on('close', () => {
    saveWindowState(win)
  })

  return win
}

async function desktopCaptureForDisplayShare() {
  const sources = await desktopCapturer.getSources({ types: ['screen', 'window'], thumbnailSize: { width: 1, height: 1 } })

  const preferred = sources.find((s) => /screen|entire|display/i.test(s.name)) || sources[0]
  if (!preferred) {
    throw new Error('No desktop sources available')
  }

  return preferred
}

function createTray(win: BrowserWindow) {
  // create a tray icon with a context menu
  try {
    const candidates = [
      path.join(__dirname, '../../public/tray-icon.png'),
      path.join(__dirname, '../../public/app-icon.png'),
      path.join(__dirname, '../../public/electron-vite.svg'),
      path.join(__dirname, '../../public/vite.svg')
    ]

    for (const p of candidates) {
      if (!fs.existsSync(p)) continue
      try {
        const img = nativeImage.createFromPath(p)
        const trayImage: string | Electron.NativeImage = !img.isEmpty() ? img : p
        tray = new Tray(trayImage)
        break
      } catch (err) {
        // try next candidate
        console.warn(`Failed to load tray image from ${p}:`, err)

      }
    }

    if (!tray) {
      // No icon loaded, or all attempts failed — skip creating the tray to avoid crashing
      console.warn('No valid tray icon found, skipping tray creation')
      return
    }
  } catch (e) {
    console.warn('Failed to create tray', e)
    tray = null
    return
  }

  if (!tray) return

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show/Hide', click: () => (win.isVisible() ? win.hide() : win.show()) },
    { label: 'Reload', click: () => win.webContents.reload() },
    { label: 'Hard Reload', click: () => win.webContents.reloadIgnoringCache() },
    { type: 'separator' },
    { label: 'Zoom In', accelerator: 'Ctrl+=', click: () => adjustZoom(win, ZOOM_STEP) },
    { label: 'Zoom Out', accelerator: 'Ctrl+-', click: () => adjustZoom(win, -ZOOM_STEP) },
    { label: 'Reset Zoom', accelerator: 'Ctrl+0', click: () => win.webContents.setZoomFactor(1) },
    { type: 'separator' },
    { label: 'New Window (Separate Account)', click: () => createMainWindow(`persist:account-${Date.now()}`) },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ])

  tray.setToolTip('WhatsApp - Linux Client')
  tray.setContextMenu(contextMenu)

  tray.on('double-click', () => {
    win.isVisible() ? win.hide() : win.show()
  })
}

app.whenReady().then(() => {
  // Create primary window using default persistent partition (stores cookies)
  const win = createMainWindow('persist:default')

  // Create tray
  createTray(win)

  // Register a convenient global shortcut to toggle visibility
  try {
    globalShortcut.register('Control+Alt+W', () => {
      if (win.isVisible()) win.hide()
      else win.show()
    })
  } catch (e) {
    console.warn('Could not register global shortcut', e)
  }

  // When renderer asks for files or native dialogs, forward via IPC (preload will call main)
})

// IPC handlers for the preload exposed API
ipcMain.on('native-notification', (_event, { title, body }) => {
  try {
    const n = new Notification({ title, body })
    n.show()
  } catch (e) {
    console.warn('Notification failed', e)
  }
})

ipcMain.handle('open-external', async (_e, url: string) => {
  try {
    await shell.openExternal(url)
    return true
  } catch (e) {
    return false
  }
})

ipcMain.on('create-new-account', () => {
  createMainWindow(`persist:account-${Date.now()}`)
})

ipcMain.handle('dialog:openFiles', async (_e, options) => {
  const win = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0]
  if (!win) return null
  return await dialog.showOpenDialog(win, options || { properties: ['openFile', 'multiSelections'] })
})

ipcMain.handle('get-app-version', () => ({
  version: app.getVersion(),
  platform: process.platform
}))

app.on('window-all-closed', () => {
  // On Linux we usually quit when windows are closed
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow()
  }
})

// Clean up shortcuts on quit
app.on('will-quit', () => {
  try {
    globalShortcut.unregisterAll()
  } catch (e) {
    console.warn('Failed to unregister shortcuts', e)
  }
})