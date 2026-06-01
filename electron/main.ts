/* eslint-disable @typescript-eslint/no-unused-vars */
import { app, BrowserWindow, Tray, Menu, nativeImage, globalShortcut, dialog, shell, ipcMain, Notification, desktopCapturer, nativeTheme } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import settings, { AppSettings } from './settings'
/* eslint-enable @typescript-eslint/no-unused-vars */

// Enforce single instance: if a second instance is started, focus the existing window
// Move this as early as possible so additional launches quit immediately.
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  // Another instance is already running - quit this one
  app.quit()
  // ensure immediate exit
  process.exit(0)
} else {
  app.on('second-instance', () => {
    // Someone tried to run a second instance, focus the main window if available
    const win = mainWindow || BrowserWindow.getAllWindows()[0]
    if (win) {
      if (win.isMinimized()) win.restore()
      win.show()
      win.focus()
    }
  })
}

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

function buildThemeCSS() {
  const compactMode = settings.get('compactMode')

  return `
    /* Compact mode styles */
    ${compactMode ? `
      .two, .three, .four {
        padding: 4px !important;
        margin: 2px !important;
      } 
      
      [data-testid="conversation-panel-header"] {
        padding: 8px !important;
      }
      
      [data-testid="message-out"] {
        margin: 2px 0 !important;
      }
    ` : ''}
  `
}

function applyThemeToWindow(win: BrowserWindow) {
  try {
    win.webContents.insertCSS(buildThemeCSS()).catch((err) => {
      console.warn('Failed to inject theme CSS', err)
    })
  } catch (err) {
    console.warn('Failed to apply theme', err)
  }
}

let tray: Tray | null = null
let mainWindow: BrowserWindow | null = null
let settingsWindow: BrowserWindow | null = null

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
  
  // Configure spell check
  const spellCheckSettings = settings.get('spellCheck')
  if (spellCheckSettings.enabled) {
    // Filter out unsupported languages before setting
    const supportedLanguages = spellCheckSettings.languages.filter(lang => {
      try {
        win.webContents.session.setSpellCheckerLanguages([lang])
        return true
      } catch {
        return false
      }
    })
    
    // Update settings if languages were filtered
    if (supportedLanguages.length !== spellCheckSettings.languages.length) {
      settings.set('spellCheck', { ...spellCheckSettings, languages: supportedLanguages })
    }
    
    if (supportedLanguages.length > 0) {
      win.webContents.session.setSpellCheckerLanguages(supportedLanguages)
    }
  }
  
  win.loadURL('https://web.whatsapp.com', { userAgent: chromeLikeUA }).catch((err) => {
    console.error('Failed to load WhatsApp Web:', err)
  })

  win.webContents.on('did-finish-load', async () => {
    try {
      await win.webContents.insertCSS(buildBengaliTypographyCSS())
      await applyThemeToWindow(win)
    } catch (err) {
      console.warn('Failed to inject CSS', err)
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

function createSettingsWindow(initialView: 'home' | 'settings' | 'about' = 'home') {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.focus()
    return settingsWindow
  }

  const win = new BrowserWindow({
    width: 900,
    height: 700,
    show: false,
    backgroundColor: '#0f172a',
    autoHideMenuBar: true,
    resizable: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
      // Always use preload script for settings window
      preload: path.join(__dirname, '../preload/preload.mjs')
    }
  })

  // Load the React renderer for settings with view parameter
  // In development, load from Vite dev server
  // In production, load from built file
  if (!app.isPackaged) {
    win.loadURL(`http://localhost:5173/?view=${initialView}`)
  } else {
    win.loadFile(path.join(__dirname, '../../dist/src/renderer/index.html'), { search: `view=${initialView}` })
  }

  win.once('ready-to-show', () => {
    if (!win.isDestroyed()) {
      win.show()
      win.focus()
    }
  })

  win.on('closed', () => {
    settingsWindow = null
  })

  settingsWindow = win
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
    { label: 'Toggle Dark Mode', click: () => {
      const current = settings.get('darkMode')
      const next = current === 'dark' ? 'light' : current === 'light' ? 'auto' : 'dark'
      settings.set('darkMode', next)
      BrowserWindow.getAllWindows().forEach(w => applyThemeToWindow(w))
    }},
    { label: 'Toggle Compact Mode', click: () => {
      const current = settings.get('compactMode')
      settings.set('compactMode', !current)
      BrowserWindow.getAllWindows().forEach(w => applyThemeToWindow(w))
    }},
    { type: 'separator' },
    { label: 'New Window (Separate Account)', click: () => createMainWindow(`persist:account-${Date.now()}`) },
    { type: 'separator' },
    { label: 'Settings', click: () => createSettingsWindow('settings') },
    { label: 'About', click: () => createSettingsWindow('about') },
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
  mainWindow = createMainWindow('persist:default')

  // When the main window is closed, clear reference
  mainWindow.on('closed', () => {
    // saveWindowState already runs on 'close' — just clear ref
    mainWindow = null
  })

  // Create tray
  createTray(mainWindow)

  // Register a convenient global shortcut to toggle visibility
  try {
    globalShortcut.register('Control+Alt+W', () => {
      if (!mainWindow) return
      if (mainWindow.isVisible()) mainWindow.hide()
      else mainWindow.show()
    })
  } catch (e) {
    console.warn('Could not register global shortcut', e)
  }

  // Register additional productivity shortcuts
  try {
    // Ctrl+Alt+S: Toggle search
    globalShortcut.register('Control+Alt+S', () => {
      const win = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0]
      if (win) {
        win.webContents.send('toggle-search')
      }
    })

    // Ctrl+Alt+T: Show quick reply templates
    globalShortcut.register('Control+Alt+T', () => {
      const win = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0]
      if (win) {
        win.webContents.send('show-quick-templates')
      }
    })

    // Ctrl+Alt+B: Toggle busy mode (auto-reply)
    globalShortcut.register('Control+Alt+B', () => {
      const advanced = settings.get('advanced')
      settings.set('advanced', { ...advanced, autoReplyEnabled: !advanced.autoReplyEnabled })
      const win = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0]
      if (win) {
        win.webContents.send('auto-reply-toggled', advanced.autoReplyEnabled)
      }
    })
  } catch (e) {
    console.warn('Could not register additional shortcuts', e)
  }

  // Listen for system theme changes
  nativeTheme.on('updated', () => {
    if (settings.get('darkMode') === 'auto') {
      BrowserWindow.getAllWindows().forEach(win => {
        applyThemeToWindow(win)
      })
    }
  })

  // When renderer asks for files or native dialogs, forward via IPC (preload will call main)
})

// IPC handlers for the preload exposed API
ipcMain.on('native-notification', (_event, { title, body, replyId }) => {
  try {
    const notificationSettings = settings.get('notifications')
    
    // Check if notifications are enabled
    if (!notificationSettings.enabled) {
      return
    }
    
    // Check Do Not Disturb mode
    if (notificationSettings.dndEnabled) {
      const now = new Date()
      const currentHour = now.getHours()
      const startHour = notificationSettings.dndStartHour
      const endHour = notificationSettings.dndEndHour
      
      // Check if current time is within DND period
      let inDndPeriod = false
      if (startHour < endHour) {
        // Same day period (e.g., 22:00 to 08:00 next day)
        inDndPeriod = currentHour >= startHour || currentHour < endHour
      } else {
        // Same day period (e.g., 22:00 to 02:00)
        inDndPeriod = currentHour >= startHour && currentHour < endHour
      }
      
      if (inDndPeriod) {
        console.log('Notification suppressed due to DND mode')
        return
      }
    }
    
    const notificationOptions: Electron.NotificationConstructorOptions = {
      title,
      body: notificationSettings.showPreview ? body : 'New message',
      silent: notificationSettings.customSound !== ''
    }
    
    // Add notification actions if enabled
    if (notificationSettings.enableActions && replyId) {
      notificationOptions.actions = [
        { type: 'button', text: 'Reply' },
        { type: 'button', text: 'Mark as Read' }
      ]
    }
    
    const n = new Notification(notificationOptions)
    
    // Handle notification actions
    if (notificationSettings.enableActions) {
      n.on('action', (_event, actionIndex) => {
        if (actionIndex === 0) {
          // Reply button clicked
          console.log('Reply action triggered for:', replyId)
          // Send IPC event to renderer to focus the chat
          BrowserWindow.getAllWindows().forEach(win => {
            win.webContents.send('notification-reply', replyId)
          })
        } else if (actionIndex === 1) {
          // Mark as Read button clicked
          console.log('Mark as read action triggered')
        }
      })
    }
    
    // Play custom sound if configured
    if (notificationSettings.customSound) {
      // Note: Custom sound playback would require additional implementation
      // For now, we'll log it
      console.log('Custom sound would play:', notificationSettings.customSound)
    }
    
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

// Settings IPC handlers
ipcMain.handle('settings:get', () => settings.getAll())

ipcMain.handle('settings:set', (_event, key: string, value: unknown) => {
  if (key in settings.getAll()) {
    settings.set(key as keyof AppSettings, value as never)
    // Apply theme changes to all windows
    BrowserWindow.getAllWindows().forEach(win => {
      applyThemeToWindow(win)
    })
    return true
  }
  return false
})

ipcMain.handle('settings:reset', () => {
  settings.reset()
  BrowserWindow.getAllWindows().forEach(win => {
    applyThemeToWindow(win)
  })
  return true
})

// Advanced features IPC handlers
ipcMain.handle('search-messages', async (_event, query: string) => {
  const advancedSettings = settings.get('advanced')
  if (!advancedSettings.messageSearchEnabled) {
    return []
  }
  
  // Send search request to all windows
  BrowserWindow.getAllWindows().forEach(win => {
    try {
      win.webContents.send('search-messages', query)
    } catch (err) {
      console.warn('Failed to send search request:', err)
    }
  })
  
  return []
})

ipcMain.handle('get-quick-reply-templates', () => {
  return settings.get('advanced').quickReplyTemplates
})

ipcMain.handle('add-quick-reply-template', (_event, template: string) => {
  const advanced = settings.get('advanced')
  const updated = [...advanced.quickReplyTemplates, template]
  settings.set('advanced', { ...advanced, quickReplyTemplates: updated })
  return true
})

ipcMain.handle('remove-quick-reply-template', (_event, index: number) => {
  const advanced = settings.get('advanced')
  const updated = advanced.quickReplyTemplates.filter((_, i) => i !== index)
  settings.set('advanced', { ...advanced, quickReplyTemplates: updated })
  return true
})

ipcMain.handle('send-auto-reply', (_event, message: string) => {
  const advanced = settings.get('advanced')
  if (!advanced.autoReplyEnabled) {
    return false
  }
  
  // Check if message contains any auto-reply keywords
  const hasKeyword = advanced.autoReplyKeywords.some(keyword => 
    message.toLowerCase().includes(keyword.toLowerCase())
  )
  
  if (hasKeyword) {
    return advanced.autoReplyMessage
  }
  
  return null
})

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