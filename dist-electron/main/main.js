import { app, globalShortcut, ipcMain, Notification, shell, BrowserWindow, dialog, nativeImage, Tray, Menu, desktopCapturer } from "electron";
import path from "node:path";
import fs from "node:fs";
import __cjs_mod__ from "node:module";
const __filename = import.meta.filename;
const __dirname = import.meta.dirname;
const require2 = __cjs_mod__.createRequire(import.meta.url);
app.commandLine.appendSwitch("enable-features", "WebRTCPipeWireCapturer");
app.commandLine.appendSwitch("enable-usermedia-screen-capturing");
app.commandLine.appendSwitch("enable-experimental-web-platform-features");
app.commandLine.appendSwitch("disable-blink-features", "AutomationControlled");
const chromeLikeUA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
let tray = null;
function createMainWindow(partition = "persist:default") {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false,
    backgroundColor: "#0f172a",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      // preload is built to dist-electron/preload/index.js when built by electron-vite
      preload: path.join(__dirname, "../preload/index.js"),
      partition
    }
  });
  win.webContents.setUserAgent(chromeLikeUA);
  win.webContents.session.setUserAgent(chromeLikeUA);
  win.loadURL("https://web.whatsapp.com", { userAgent: chromeLikeUA }).catch((err) => {
    console.error("Failed to load WhatsApp Web:", err);
  });
  win.once("ready-to-show", () => {
    if (!win.isDestroyed()) {
      win.show();
      win.focus();
    }
  });
  win.webContents.on("before-input-event", (event, input) => {
    if (input.key === "Escape" && win.isFullScreen()) {
      event.preventDefault();
      win.setFullScreen(false);
    }
  });
  const session = win.webContents.session;
  if (typeof session.setDisplayMediaRequestHandler === "function") {
    session.setDisplayMediaRequestHandler(async (_request, callback) => {
      try {
        const source = await desktopCaptureForDisplayShare();
        callback({ video: source });
      } catch (err) {
        console.warn("Display media request failed", err);
        callback({});
      }
    });
  }
  session.setPermissionRequestHandler((_webContents, permission, callback) => {
    const allow = ["media", "microphone", "camera", "display-capture", "notifications", "fullscreen"];
    if (allow.includes(permission)) {
      callback(true);
    } else {
      callback(false);
    }
  });
  win.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const hostname = new URL(url).hostname;
      const isWhatsAppHost = /(^|\.)whatsapp\.com$/i.test(hostname) || /(^|\.)whatsapp\.net$/i.test(hostname) || /(^|\.)fbcdn\.net$/i.test(hostname);
      if (isWhatsAppHost) {
        return { action: "allow" };
      }
      void shell.openExternal(url);
    } catch {
    }
    return { action: "deny" };
  });
  return win;
}
async function desktopCaptureForDisplayShare() {
  const sources = await desktopCapturer.getSources({ types: ["screen", "window"], thumbnailSize: { width: 1, height: 1 } });
  const preferred = sources.find((s) => /screen|entire|display/i.test(s.name)) || sources[0];
  if (!preferred) {
    throw new Error("No desktop sources available");
  }
  return preferred;
}
function createTray(win) {
  try {
    const candidates = [
      path.join(__dirname, "../../public/tray-icon.png"),
      path.join(__dirname, "../../public/app-icon.png"),
      path.join(__dirname, "../../public/electron-vite.svg"),
      path.join(__dirname, "../../public/vite.svg")
    ];
    for (const p of candidates) {
      if (!fs.existsSync(p)) continue;
      try {
        const img = nativeImage.createFromPath(p);
        const trayImage = !img.isEmpty() ? img : p;
        tray = new Tray(trayImage);
        break;
      } catch (err) {
        console.warn(`Failed to load tray image from ${p}:`, err);
      }
    }
    if (!tray) {
      console.warn("No valid tray icon found, skipping tray creation");
      return;
    }
  } catch (e) {
    console.warn("Failed to create tray", e);
    tray = null;
    return;
  }
  if (!tray) return;
  const contextMenu = Menu.buildFromTemplate([
    { label: "Show/Hide", click: () => win.isVisible() ? win.hide() : win.show() },
    { label: "New Window (Separate Account)", click: () => createMainWindow(`persist:account-${Date.now()}`) },
    { type: "separator" },
    { label: "Quit", click: () => app.quit() }
  ]);
  tray.setToolTip("WhatsApp - Linux Client");
  tray.setContextMenu(contextMenu);
  tray.on("double-click", () => {
    win.isVisible() ? win.hide() : win.show();
  });
}
app.whenReady().then(() => {
  const win = createMainWindow("persist:default");
  createTray(win);
  try {
    globalShortcut.register("Control+Alt+W", () => {
      if (win.isVisible()) win.hide();
      else win.show();
    });
  } catch (e) {
    console.warn("Could not register global shortcut", e);
  }
});
ipcMain.on("native-notification", (_event, { title, body }) => {
  try {
    const n = new Notification({ title, body });
    n.show();
  } catch (e) {
    console.warn("Notification failed", e);
  }
});
ipcMain.handle("open-external", async (_e, url) => {
  try {
    await shell.openExternal(url);
    return true;
  } catch (e) {
    return false;
  }
});
ipcMain.on("create-new-account", () => {
  createMainWindow(`persist:account-${Date.now()}`);
});
ipcMain.handle("dialog:openFiles", async (_e, options) => {
  const win = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
  if (!win) return null;
  return await dialog.showOpenDialog(win, options || { properties: ["openFile", "multiSelections"] });
});
ipcMain.handle("get-app-version", () => ({
  version: app.getVersion(),
  platform: process.platform
}));
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});
app.on("will-quit", () => {
  try {
    globalShortcut.unregisterAll();
  } catch (e) {
    console.warn("Failed to unregister shortcuts", e);
  }
});
