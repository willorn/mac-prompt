import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  minimizeWindow: () => ipcRenderer.invoke("minimize-window"),
  exportPrompts: (content) => ipcRenderer.invoke("export-prompts", content),
  importPrompts: () => ipcRenderer.invoke("import-prompts"),
  getPrompts: () => ipcRenderer.invoke("get-prompts"),
  setPrompts: (prompts) => ipcRenderer.invoke("set-prompts", prompts),
  onFocusSearch: (handler) => ipcRenderer.on("focus-search", handler),
});
