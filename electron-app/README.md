# Prompt Master Desktop（Electron 版）

这是基于你现有 Chrome 扩展迁移出的桌面版（Electron + Bun）。

## 已实现

- 提示词：新增 / 编辑 / 删除 / 置顶 / 搜索 / 标签筛选
- 点击卡片复制后自动最小化
- 本地存储（`localStorage`）
- JSON 导入 / 导出（系统文件选择器）
- 全局快捷键：`Alt+E`（显示/隐藏主窗口）
- 系统托盘：显示窗口 / 隐藏窗口 / 退出，左键托盘图标切换窗口
- 窗口状态自动记忆（位置、尺寸、最大化状态）

## 目录

- `electron-app/index.html`：桌面端 UI
- `electron-app/renderer.js`：前端逻辑
- `electron-app/main.js`：Electron 主进程
- `electron-app/preload.js`：安全桥接 API

## 前置依赖

- Bun
- macOS 上建议安装 Xcode Command Line Tools（用于原生依赖）

## 开发

```bash
cd electron-app
bun install
bun run dev
```

## 说明

- 关闭窗口默认隐藏到托盘，可通过托盘菜单退出。
- 如果想改快捷键：修改 `electron-app/main.js` 的 `globalShortcut.register("Alt+E", ...)`。

## 打包

```bash
cd electron-app
bun install
bun run build
```

输出目录：`electron-app/dist`。
