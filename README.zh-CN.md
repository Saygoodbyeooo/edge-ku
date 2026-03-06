# edge-ku

🌐 语言： [English](./README.md) | **中文**

这是一个 Edge / Chrome 浏览器扩展集合仓库，每个扩展对应一个独立文件夹。

## 仓库结构

```
edge-ku/
├── ai-chat-switcher/   # AI Chat Switcher – 在 Gemini、豆包和 Copilot 间切换
│   ├── manifest.json
│   ├── content.js
│   ├── styles.css
│   ├── popup.html
│   └── README.md       # 扩展说明文档
└── README.md           # 英文说明
```

每个子文件夹都是一个自包含扩展，拥有自己的源码文件和 `README.md`。

## 扩展列表

| 文件夹 | 说明 |
|--------|------|
| [`ai-chat-switcher`](./ai-chat-switcher/) | 为 Google Gemini、豆包和 Microsoft Copilot 提供悬浮切换器和工具栏弹窗 |

## 添加新扩展

1. 在仓库根目录创建一个新子文件夹（例如 `my-new-extension/`）。
2. 将扩展源码放入该文件夹（`manifest.json`、脚本、样式等）。
3. 在该文件夹内添加 `README.md`，说明扩展用途、功能、安装步骤和支持站点。
4. 更新上方 **扩展列表** 表格，添加新文件夹名和简要描述。

请保持每个扩展完全自包含（不要跨文件夹依赖），以便每个扩展都能独立加载、开发与发布。

## 贡献

欢迎提交 Pull Request。涉及较大改动时请先创建 issue 讨论，并确保每个扩展目录文档完整。
