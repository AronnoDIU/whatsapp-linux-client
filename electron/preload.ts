import { ipcRenderer, contextBridge } from 'electron'

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
  showNotification: (title: string, body?: string) => ipcRenderer.send('native-notification', { title, body }),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  createNewAccountWindow: () => ipcRenderer.send('create-new-account'),
  pickFiles: (options?: Electron.OpenDialogOptions) => ipcRenderer.invoke('dialog:openFiles', options),
  getAppVersion: () => ipcRenderer.invoke('get-app-version')
})
