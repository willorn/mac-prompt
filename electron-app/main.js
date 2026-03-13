import { app, BrowserWindow, dialog, globalShortcut, ipcMain, Menu, Tray } from "electron";
import Store from "electron-store";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const store = new Store({
  name: "window-state",
  defaults: {
    bounds: { width: 1200, height: 800 },
    isMaximized: false,
  },
});
const dataStore = new Store({
  name: "prompt-master-data",
});

let mainWindow = null;
let tray = null;

function createMainWindow() {
  const saved = store.get("bounds");
  const isMaximized = store.get("isMaximized");

  mainWindow = new BrowserWindow({
    width: saved?.width || 1200,
    height: saved?.height || 800,
    x: saved?.x,
    y: saved?.y,
    minWidth: 980,
    minHeight: 650,
    show: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "index.html"));

  if (isMaximized) {
    mainWindow.maximize();
  }

  mainWindow.on("close", (event) => {
    event.preventDefault();
    mainWindow.hide();
  });

  mainWindow.on("resize", saveWindowState);
  mainWindow.on("move", saveWindowState);
  mainWindow.on("maximize", saveWindowState);
  mainWindow.on("unmaximize", saveWindowState);
}

function saveWindowState() {
  if (!mainWindow) return;
  const bounds = mainWindow.getBounds();
  store.set("bounds", bounds);
  store.set("isMaximized", mainWindow.isMaximized());
}

function showMainWindow() {
  if (!mainWindow) return;
  mainWindow.show();
  mainWindow.focus();
  mainWindow.webContents.send("focus-search");
}

function hideMainWindow() {
  if (!mainWindow) return;
  mainWindow.hide();
}

function toggleMainWindow() {
  if (!mainWindow) return;
  if (mainWindow.isVisible()) {
    hideMainWindow();
  } else {
    showMainWindow();
  }
}

function setupTray() {
  const iconPath = path.join(__dirname, "assets", "trayTemplate.png");
  tray = new Tray(iconPath);

  const menu = Menu.buildFromTemplate([
    { label: "显示窗口", click: showMainWindow },
    { label: "隐藏窗口", click: hideMainWindow },
    { type: "separator" },
    { label: "退出", click: () => app.exit(0) },
  ]);

  tray.setToolTip("Prompt Master");
  tray.setContextMenu(menu);
  tray.on("click", toggleMainWindow);
}

function setupGlobalShortcut() {
  globalShortcut.register("Alt+E", () => {
    toggleMainWindow();
  });
}

app.whenReady().then(() => {
  createMainWindow();
  setupTray();
  setupGlobalShortcut();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    } else {
      showMainWindow();
    }
  });
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

ipcMain.handle("minimize-window", () => {
  if (!mainWindow) return false;
  mainWindow.minimize();
  return true;
});

ipcMain.handle("export-prompts", async (_event, content) => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: "导出提示词",
    defaultPath: "prompts_backup.json",
    filters: [{ name: "JSON", extensions: ["json"] }],
  });

  if (canceled || !filePath) {
    return { canceled: true };
  }

  await fs.promises.writeFile(filePath, content, "utf-8");
  return { canceled: false, filePath };
});

ipcMain.handle("import-prompts", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: "导入提示词",
    properties: ["openFile"],
    filters: [{ name: "JSON", extensions: ["json"] }],
  });

  if (canceled || !filePaths?.length) {
    return { canceled: true };
  }

  const raw = await fs.promises.readFile(filePaths[0], "utf-8");
  return { canceled: false, raw };
});

ipcMain.handle("get-prompts", () => {
  const prompts = dataStore.get("prompts");
  return Array.isArray(prompts) ? prompts : null;
});

ipcMain.handle("set-prompts", (_event, prompts) => {
  if (!Array.isArray(prompts)) {
    throw new Error("prompts must be an array");
  }
  dataStore.set("prompts", prompts);
  return true;
});
