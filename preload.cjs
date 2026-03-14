const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  minimizeWindow: () => ipcRenderer.invoke("minimize-window"),
  exportPrompts: (content) => ipcRenderer.invoke("export-prompts", content),
  importPrompts: () => ipcRenderer.invoke("import-prompts"),
  getPrompts: () => ipcRenderer.invoke("get-prompts"),
  setPrompts: (prompts) => ipcRenderer.invoke("set-prompts", prompts),
  getWebdavConfig: () => ipcRenderer.invoke("webdav-get-config"),
  setWebdavConfig: (config) => ipcRenderer.invoke("webdav-set-config", config),
  testWebdav: () => ipcRenderer.invoke("webdav-test"),
  backupWebdav: () => ipcRenderer.invoke("webdav-backup"),
  restoreWebdavLatest: () => ipcRenderer.invoke("webdav-restore-latest"),
  restoreWebdavPath: (path) => ipcRenderer.invoke("webdav-restore-path", path),
  listWebdavBackups: () => ipcRenderer.invoke("webdav-list-backups"),
  getWebdavSettings: () => ipcRenderer.invoke("webdav-get-settings"),
  setWebdavSettings: (settings) => ipcRenderer.invoke("webdav-set-settings", settings),
  onFocusSearch: (handler) => ipcRenderer.on("focus-search", handler),
  onAutoBackup: (handler) => ipcRenderer.on("auto-backup", (_e, fileName) => handler(fileName)),
});
