import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("ipcRenderer", {
  on(...args) {
    const [channel, listener] = args;
    return ipcRenderer.on(channel, (event, ...args2) => listener(event, ...args2));
  },
  off(...args) {
    const [channel, ...omit] = args;
    return ipcRenderer.off(channel, ...omit);
  },
  send(...args) {
    const [channel, ...omit] = args;
    return ipcRenderer.send(channel, ...omit);
  },
  invoke(...args) {
    const [channel, ...omit] = args;
    return ipcRenderer.invoke(channel, ...omit);
  }
});
contextBridge.exposeInMainWorld("whatsappNative", {
  showNotification: (title, body) => ipcRenderer.send("native-notification", { title, body }),
  openExternal: (url) => ipcRenderer.invoke("open-external", url),
  createNewAccountWindow: () => ipcRenderer.send("create-new-account"),
  pickFiles: (options) => ipcRenderer.invoke("dialog:openFiles", options),
  getAppVersion: () => ipcRenderer.invoke("get-app-version")
});
