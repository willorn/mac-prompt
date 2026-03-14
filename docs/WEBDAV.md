# WebDAV 同步（复制粘贴规则）

本项目采用「配置快照」的方式，方便在多台设备之间复制粘贴同步配置。

## 配置快照格式

```json
{
  "version": "1.0",
  "webdavConfig": {
    "url": "https://example.com/webdav/",
    "username": "your-username",
    "password": "your-password",
    "directory": "prompt-master-backups"
  }
}
```

## 字段说明

- `url`：WebDAV 服务根地址。
- `username` / `password`：基础认证。
- `directory`：远程目录名（默认 `prompt-master-backups`）。

## 备份规则

- 备份文件会写入：`/<directory>/` 目录
- 文件名格式：`prompt-master-backup-YYYYMMDD_HHMMSS.json`

## 使用方式

1. 在应用中打开 `WebDAV 同步`。
2. 点击 `复制配置`，将快照复制到剪贴板。
3. 在另一台设备粘贴到「配置快照」文本框，点击 `粘贴应用`。
4. 点击 `备份到 WebDAV` 或 `从 WebDAV 恢复`。

## 坚果云快捷规则

- 如果配置 JSON 中的 `url` 为 `/jianguoyun-dav-proxy/`，应用会自动转换为：
  `https://dav.jianguoyun.com/dav/`
- 这是为了兼容旧的 Web 端配置。
