# 贡献指南

感谢你对 PromptBox 的兴趣！我们欢迎各种形式的贡献，包括但不限于：

- 提交 Bug 报告
- 提出新功能建议
- 改进文档
- 提交代码修复
- 分享使用经验

## 🐛 提交 Bug

如果你发现了 Bug，请通过 [GitHub Issues](https://github.com/willorn/prompt-box-electron/issues) 提交，并包含以下信息：

1. **问题描述** - 清晰描述发生了什么
2. **复现步骤** - 详细步骤说明如何复现
3. **期望行为** - 描述你期望的正确行为
4. **环境信息**
   - 操作系统版本
   - 应用版本
   - 相关配置
5. **截图/录屏** - 如果可能，提供视觉辅助

## 💡 功能建议

有新功能想法？欢迎提交 Issue 讨论：

1. 描述功能的使用场景
2. 说明功能的具体行为
3. 如果可能，提供界面设计参考

## 🔧 开发环境

### 前置要求

- [Bun](https://bun.sh/) >= 1.3.4
- [Node.js](https://nodejs.org/) >= 18
- Git

### 本地开发

```bash
# 1. Fork 并克隆项目
git clone https://github.com/willorn/prompt-box-electron.git
cd prompt-box-electron

# 2. 安装依赖
bun install

# 3. 启动开发模式
bun run dev
```

### 项目结构

```text
prompt-box-electron/
├── assets/           # 静态资源
├── docs/             # 项目文档
├── index.html        # 主界面
├── main.js           # Electron 主进程
├── package.json      # 项目配置
├── preload.cjs       # 预加载脚本
├── README.md         # 总览文档
└── renderer.js       # 渲染进程逻辑
```

### 代码规范

- 使用 ES6+ 语法
- 变量命名使用 camelCase
- 函数添加适当注释
- 保持代码简洁可读

## 📤 提交 Pull Request

1. **Fork 项目** 到你的 GitHub 账号
2. **创建分支**

   ```bash
   git checkout -b feature/your-feature-name
   # 或
   git checkout -b fix/bug-description
   ```

3. **提交更改**

   ```bash
   git add .
   git commit -m "feat: 添加新功能描述"
   # 或
   git commit -m "fix: 修复问题描述"
   ```

4. **推送分支**

   ```bash
   git push origin feature/your-feature-name
   ```

5. **创建 Pull Request**
   - 在 GitHub 上创建 PR
   - 描述更改内容和原因
   - 关联相关 Issue（如果有）

### Commit 规范

使用清晰的 commit 信息：

- `feat:` - 新功能
- `fix:` - 修复 Bug
- `docs:` - 文档更新
- `style:` - 代码格式调整
- `refactor:` - 代码重构
- `test:` - 测试相关
- `chore:` - 构建/工具相关

示例：

```text
feat: 添加暗黑模式支持
fix: 修复搜索框失焦问题
docs: 更新 WebDAV 配置说明
```

## 📝 文档贡献

文档改进同样重要：

- 修复拼写错误
- 改进表述清晰度
- 添加使用示例
- 翻译（计划支持多语言）

## 🎯 开发计划

查看 [Projects](https://github.com/willorn/prompt-box-electron/projects) 了解当前开发计划和优先级。

## ❓ 需要帮助？

- 阅读总览文档 [README.md](../README.md)
- 阅读 [WebDAV 配置指南](./WEBDAV.md)
- 在 Discussions 中提问

## 🙏 行为准则

- 保持友善和尊重
- 接受建设性批评
- 关注对社区最有利的事情

再次感谢你的贡献！
