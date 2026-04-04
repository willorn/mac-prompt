#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP_NAME="PromptBox.app"
APP_PATH="$ROOT_DIR/dist/mac-arm64/$APP_NAME"
APP_BINARY="$APP_PATH/Contents/MacOS/PromptBox"

echo "==> 进入项目目录"
cd "$ROOT_DIR"

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "此脚本当前仅支持 macOS。"
  exit 1
fi

echo "==> 关闭旧的 PromptBox 实例"
pkill -f "$APP_BINARY" 2>/dev/null || true
pkill -f "$ROOT_DIR/node_modules/electron/dist/Electron.app/Contents/MacOS/Electron" 2>/dev/null || true

echo "==> 清理旧的目录打包产物"
rm -rf "$ROOT_DIR/dist/mac-arm64"

echo "==> 重新打包目录版应用"
bun run build:dir

if [[ ! -d "$APP_PATH" ]]; then
  echo "未找到打包产物：$APP_PATH"
  exit 1
fi

echo "==> 打开最新打包版"
open "$APP_PATH"

echo ""
echo "完成：$APP_PATH"
