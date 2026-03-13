// 定义插件页面的完整 URL（替换为你自己的文件名）
const CHROME_EXTENSION_URL = chrome.runtime.getURL("index.html");
const BACKUP_FILENAME_REGEX =
  "prompt-master/backups/prompts_backup_.*\\.json$";
const BACKUP_MAX_COUNT = 5;
const BACKUP_KEYS = ["myPrompts", "lastBackupHash"];
const BACKUP_DEBOUNCE_MS = 1500;

let pendingBackupTimer = null;

// 辅助：根据当前窗口位置保存下次打开的坐标
function persistWindowBounds(win) {
  if (win?.state === "normal") {
    chrome.storage.local.set({
      lastWindowPos: {
        left: win.left,
        top: win.top,
        width: win.width,
        height: win.height,
      },
    });
  }
}

// 辅助：尽量静默关闭扩展窗口，避免唤醒浏览器主窗口
async function closeWindowSilently(windowId) {
  try {
    const win = await chrome.windows.get(windowId);
    persistWindowBounds(win);

    // macOS 上关闭窗口会唤醒浏览器，改为只最小化不关闭
    // 用户可以稍后手动关闭，或让它保持最小化状态
    await chrome.windows.update(windowId, {
      state: "minimized",
      focused: false
    });

    return true;
  } catch (error) {
    console.error("closeWindowSilently failed", error);
    return false;
  }
}

// 辅助：创建扩展窗口，带有记忆位置
function createPromptWindow() {
  chrome.storage.local.get(["lastWindowPos"], (res) => {
    const pos = res.lastWindowPos || {};

    chrome.system.display.getInfo((displays) => {
      const primary = displays[0].workArea;
      const width = pos.width || 1200;
      const height = pos.height || 800;

      const left =
        pos.left ?? Math.round((primary.width - width) / 2 + primary.left);
      const top =
        pos.top ?? Math.round((primary.height - height) / 2 + primary.top);

      chrome.windows.create({
        url: "index.html",
        type: "popup",
        width,
        height,
        left,
        top,
        focused: true,
      });
    });
  });
}

// 辅助：生成备份文件名
function buildBackupFilename() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(
    now.getDate(),
  )}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `prompt-master/backups/prompts_backup_${stamp}.json`;
}

// 计算提示词数据的哈希，用于判断是否有变化
async function hashPrompts(dataStr) {
  const enc = new TextEncoder().encode(dataStr);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// 清理旧备份，最多保留 BACKUP_MAX_COUNT 个
async function pruneBackups() {
  try {
    const backups = await chrome.downloads.search({
      filenameRegex: BACKUP_FILENAME_REGEX,
    });

    backups.sort(
      (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
    );

    if (backups.length <= BACKUP_MAX_COUNT) return;

    const stale = backups.slice(BACKUP_MAX_COUNT); // 只删多余的
    await Promise.all(
      stale.map(async (item) => {
        try {
          await chrome.downloads.removeFile(item.id);
        } catch (e) {
          // 文件可能已不存在，忽略
        }
        await chrome.downloads.erase({ id: item.id });
      }),
    );
  } catch (err) {
    console.error("pruneBackups failed", err);
  }
}

// 开机自动备份：写入 Downloads/prompt-master/backups 下，并清理旧文件
async function autoBackupPrompts() {
  try {
    const { myPrompts = [], lastBackupHash = null } =
      await chrome.storage.local.get(BACKUP_KEYS);
    const data = JSON.stringify(myPrompts, null, 2);

    // 数据未变化则跳过，避免频繁下载提示
    const currentHash = await hashPrompts(data);
    if (currentHash === lastBackupHash) return;

    const filename = buildBackupFilename();

    await chrome.downloads.download({
      url: "data:application/json," + encodeURIComponent(data),
      filename,
      conflictAction: "uniquify",
      saveAs: false,
    });

    await chrome.storage.local.set({
      lastBackupHash: currentHash,
      lastBackupTime: Date.now(),
    });
    await pruneBackups();
  } catch (err) {
    console.error("autoBackupPrompts failed", err);
  }
}

// 找到已存在的扩展标签页（如果有）
async function findExistingTab() {
  const tabs = await chrome.tabs.query({});
  return tabs.find((tab) => tab.url === CHROME_EXTENSION_URL);
}

// 鼠标点击扩展图标：只负责打开或聚焦，不做关闭
async function openOrFocusWindow() {
  const existingTab = await findExistingTab();

  if (existingTab) {
    chrome.windows.update(existingTab.windowId, { focused: true });
    chrome.tabs.update(existingTab.id, { active: true });
    chrome.tabs.sendMessage(existingTab.id, { action: "FOCUS_SEARCH" });
    return;
  }

  createPromptWindow();
}

// 快捷键触发：切换显示/隐藏窗口（最小化/恢复），不关闭
async function toggleWindowWithShortcut() {
  const existingTab = await findExistingTab();

  if (existingTab) {
    try {
      const win = await chrome.windows.get(existingTab.windowId);

      // 如果窗口已最小化，则恢复并聚焦
      if (win.state === "minimized") {
        await chrome.windows.update(win.id, {
          state: "normal",
          focused: true
        });
        chrome.tabs.sendMessage(existingTab.id, { action: "FOCUS_SEARCH" });
      } else {
        // 如果窗口正常显示，则最小化隐藏
        persistWindowBounds(win);
        await chrome.windows.update(win.id, {
          state: "minimized",
          focused: false
        });
      }
      return;
    } catch (error) {
      // 兜底：如果窗口信息获取失败，重新创建
      createPromptWindow();
      return;
    }
  }

  // 未打开：直接创建
  createPromptWindow();
}

// 确保 chrome.action 存在后再监听
if (chrome.action) {
  chrome.action.onClicked.addListener(openOrFocusWindow);
}

// 快捷键监听
chrome.commands.onCommand.addListener((command) => {
  if (command === "open-prompt-master") {
    toggleWindowWithShortcut();
  }
});

// 接收前端请求：静默关闭当前扩展窗口
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.action !== "CLOSE_WINDOW_SILENT") return;

  (async () => {
    const targetWindowId =
      typeof message.windowId === "number"
        ? message.windowId
        : sender?.tab?.windowId;

    if (typeof targetWindowId !== "number") {
      sendResponse({ ok: false, reason: "missing_window_id" });
      return;
    }

    const ok = await closeWindowSilently(targetWindowId);
    sendResponse({ ok });
  })();

  return true;
});

// 自动备份已禁用，避免唤起下载提示
// chrome.runtime.onStartup.addListener(autoBackupPrompts);

// 监听本地存储变化：提示词有改动就自动备份（防抖）
// chrome.storage.onChanged.addListener((changes, areaName) => {
//   if (areaName !== "local") return;
//   if (!changes.myPrompts) return;

//   if (pendingBackupTimer) {
//     clearTimeout(pendingBackupTimer);
//   }

//   pendingBackupTimer = setTimeout(() => {
//     autoBackupPrompts();
//     pendingBackupTimer = null;
//   }, BACKUP_DEBOUNCE_MS);
// });
