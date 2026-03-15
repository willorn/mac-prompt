import {
  app,
  BrowserWindow,
  dialog,
  globalShortcut,
  ipcMain,
  Menu,
  screen,
  Tray,
} from "electron";
import Store from "electron-store";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { createClient } from "webdav";

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
const webdavStore = new Store({
  name: "prompt-master-webdav",
  defaults: {
    url: "",
    username: "",
    password: "",
    directory: "prompt-master-backups",
    autoBackupEnabled: true,
    intervalDays: 3,
    lastAutoBackupAt: 0,
  },
});

let mainWindow = null;
let tray = null;
let isHiddenOffscreen = false;

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
      preload: path.join(__dirname, "preload.cjs"),
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
    hideMainWindow();
  });

  mainWindow.on("resize", saveWindowState);
  mainWindow.on("move", saveWindowState);
  mainWindow.on("maximize", saveWindowState);
  mainWindow.on("unmaximize", saveWindowState);
}

function saveWindowState() {
  if (!mainWindow || isHiddenOffscreen) return;
  const bounds = mainWindow.getBounds();
  store.set("bounds", bounds);
  store.set("isMaximized", mainWindow.isMaximized());
}

function showMainWindow() {
  if (!mainWindow) return;
  const saved = store.get("bounds");
  const isMaximized = store.get("isMaximized");

  if (saved && !isMaximized) {
    mainWindow.setBounds(saved);
  }

  mainWindow.setOpacity(1);
  mainWindow.setSkipTaskbar(false);
  mainWindow.show();
  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }
  if (isMaximized) {
    mainWindow.maximize();
  }
  isHiddenOffscreen = false;
  mainWindow.focus();
  mainWindow.webContents.send("focus-search");
}

function hideMainWindow() {
  if (!mainWindow) return;
  saveWindowState();

  const bounds = mainWindow.getBounds();
  const displays = screen.getAllDisplays();
  const rightMost = Math.max(
    ...displays.map((d) => d.bounds.x + d.bounds.width),
  );
  const offscreenX = rightMost + bounds.width + 1000;
  const offscreenY = bounds.y;

  isHiddenOffscreen = true;
  
  // 先隐藏窗口，让焦点回到之前的应用
  mainWindow.blur();
  
  // macOS 上使用 app.hide() 可以更好地恢复焦点
  if (process.platform === 'darwin') {
    app.hide();
  }
  
  mainWindow.setOpacity(0);
  mainWindow.setSkipTaskbar(true);
  mainWindow.setBounds(
    {
      x: offscreenX,
      y: offscreenY,
      width: bounds.width,
      height: bounds.height,
    },
    false,
  );
}

function toggleMainWindow() {
  if (!mainWindow) return;
  if (!mainWindow.isVisible() || isHiddenOffscreen) {
    showMainWindow();
  } else {
    hideMainWindow();
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
  const ok = globalShortcut.register("Alt+E", () => {
    toggleMainWindow();
  });
  if (!ok) {
    dialog.showErrorBox(
      "快捷键注册失败",
      "Alt+E 已被其他应用占用，请修改 main.js 中的快捷键组合。",
    );
  }
}

app.whenReady().then(() => {
  createMainWindow();
  setupTray();
  setupGlobalShortcut();
  scheduleAutoBackup();

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

function getWebdavConfig() {
  const config = webdavStore.store || {};
  return {
    url: config.url || "",
    username: config.username || "",
    password: config.password || "",
    directory: config.directory || "prompt-master-backups",
  };
}

function getWebdavSettings() {
  const config = webdavStore.store || {};
  return {
    autoBackupEnabled: config.autoBackupEnabled !== false,
    intervalDays: Number(config.intervalDays || 3),
    lastAutoBackupAt: Number(config.lastAutoBackupAt || 0),
  };
}

function ensureWebdavConfig() {
  const config = getWebdavConfig();
  if (config.url && config.url.includes("jianguoyun-dav-proxy")) {
    config.url = "https://dav.jianguoyun.com/dav/";
  }
  if (!config.url || !config.username || !config.password) {
    throw new Error("请先配置 WebDAV");
  }
  if (config.url.startsWith("/")) {
    throw new Error("WebDAV 地址需要完整 URL（如 https://dav.jianguoyun.com/dav/）");
  }
  return config;
}

function createWebdavClient() {
  const config = ensureWebdavConfig();
  return createClient(config.url, {
    username: config.username,
    password: config.password,
  });
}

function buildBackupFilename() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(
    now.getDate(),
  )}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `prompt-master-backup-${stamp}.json`;
}

function normalizeDir(dir) {
  const safe = (dir || "prompt-master-backups").trim().replace(/\\+/g, "/");
  if (!safe) return "/prompt-master-backups";
  return safe.startsWith("/") ? safe : `/${safe}`;
}

let autoBackupTimer = null;

function scheduleAutoBackup() {
  if (autoBackupTimer) clearInterval(autoBackupTimer);
  autoBackupTimer = setInterval(async () => {
    try {
      const settings = getWebdavSettings();
      if (!settings.autoBackupEnabled) return;
      const intervalMs = settings.intervalDays * 24 * 60 * 60 * 1000;
      const last = settings.lastAutoBackupAt || 0;
      if (Date.now() - last < intervalMs) return;
      const result = await backupWebdavInternal();
      webdavStore.set({ lastAutoBackupAt: Date.now() });
      if (mainWindow) {
        mainWindow.webContents.send("auto-backup", result?.fileName || "");
      }
    } catch (err) {
      console.error("Auto backup failed", err);
    }
  }, 60 * 60 * 1000);
}

async function backupWebdavInternal() {
  const config = ensureWebdavConfig();
  const client = createWebdavClient();
  const dir = normalizeDir(config.directory);
  const fileName = buildBackupFilename();
  const remotePath = `${dir}/${fileName}`;

  try {
    await client.createDirectory(dir);
  } catch (error) {
    // ignore if exists
  }

  const prompts = dataStore.get("prompts") || [];
  const payload = {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    prompts,
  };
  const content = JSON.stringify(payload, null, 2);
  await client.putFileContents(remotePath, content, { overwrite: true });
  return { remotePath, fileName };
}

ipcMain.handle("minimize-window", () => {
  if (!mainWindow) return false;
  hideMainWindow();
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

ipcMain.handle("webdav-get-config", () => {
  return getWebdavConfig();
});

ipcMain.handle("webdav-set-config", (_event, config) => {
  if (!config || typeof config !== "object") {
    throw new Error("invalid config");
  }
  webdavStore.set({
    url: String(config.url || "").trim(),
    username: String(config.username || "").trim(),
    password: String(config.password || "").trim(),
    directory: String(config.directory || "prompt-master-backups").trim(),
  });
  return true;
});

ipcMain.handle("webdav-get-settings", () => {
  return getWebdavSettings();
});

ipcMain.handle("webdav-set-settings", (_event, settings) => {
  if (!settings || typeof settings !== "object") {
    throw new Error("invalid settings");
  }
  const enabled = settings.autoBackupEnabled !== false;
  const intervalDays = Math.max(1, Math.min(Number(settings.intervalDays || 3), 30));
  webdavStore.set({
    autoBackupEnabled: enabled,
    intervalDays,
  });
  return true;
});

ipcMain.handle("webdav-test", async () => {
  const client = createWebdavClient();
  await client.exists("/");
  return true;
});

ipcMain.handle("webdav-backup", async () => {
  const result = await backupWebdavInternal();
  webdavStore.set({ lastAutoBackupAt: Date.now() });
  return result;
});

ipcMain.handle("webdav-restore-latest", async () => {
  const config = ensureWebdavConfig();
  const client = createWebdavClient();
  const dir = normalizeDir(config.directory);

  const exists = await client.exists(dir);
  if (!exists) {
    throw new Error("未找到远程备份目录");
  }

  const contents = await client.getDirectoryContents(dir);
  const files = (contents || [])
    .filter((item) => item.type === "file" && item.basename.endsWith(".json"))
    .sort((a, b) => new Date(b.lastmod).getTime() - new Date(a.lastmod).getTime());

  if (!files.length) {
    throw new Error("未找到可用备份");
  }

  const latest = files[0];
  const remotePath = `${dir}/${latest.basename}`;
  const raw = await client.getFileContents(remotePath, { format: "text" });
  const parsed = JSON.parse(raw);
  const prompts = Array.isArray(parsed?.prompts) ? parsed.prompts : [];
  dataStore.set("prompts", prompts);
  return { remotePath, promptsCount: prompts.length };
});

ipcMain.handle("webdav-restore-path", async (_event, remotePath) => {
  const client = createWebdavClient();
  if (!remotePath || typeof remotePath !== "string") {
    throw new Error("remotePath required");
  }
  const raw = await client.getFileContents(remotePath, { format: "text" });
  const parsed = JSON.parse(raw);
  const prompts = Array.isArray(parsed?.prompts) ? parsed.prompts : [];
  dataStore.set("prompts", prompts);
  return { remotePath, promptsCount: prompts.length };
});

ipcMain.handle("webdav-list-backups", async () => {
  const config = ensureWebdavConfig();
  const client = createWebdavClient();
  const dir = normalizeDir(config.directory);
  const exists = await client.exists(dir);
  if (!exists) return [];
  const contents = await client.getDirectoryContents(dir);
  return (contents || [])
    .filter((item) => item.type === "file" && item.basename.endsWith(".json"))
    .map((item) => ({
      name: item.basename,
      path: `${dir}/${item.basename}`,
      lastMod: item.lastmod,
      size: item.size,
    }))
    .sort((a, b) => new Date(b.lastMod).getTime() - new Date(a.lastMod).getTime());
});
