# Edge AI Chat Switcher

A lightweight Edge / Chrome browser extension that lets you jump between **Google Gemini**, **Doubao**, and **Microsoft Copilot** with a single click — without opening a new tab or typing any URL.

---

## Features

- **Floating switcher widget** — a compact, icon-only panel injected at the right edge of each supported AI chat page, always accessible without scrolling.
- **Toolbar popup** — click the extension icon in the browser toolbar to see all three sites at a glance and navigate instantly.
- **Active-site highlight** — the button for the site you are currently on is visually distinguished.
- **Shadow DOM isolation** — the widget's styles are fully encapsulated; they never conflict with the host page's CSS.
- **Graceful image fallback** — if a remote logo fails to load, a bold text initial is displayed instead, so the UI always looks clean.
- **Performance-friendly** — passive event listeners, double `requestAnimationFrame` for smooth transitions, and zero repeated DOM queries after initial build.

---

## Supported Sites

| Site | URL |
|------|-----|
| Google Gemini | <https://gemini.google.com/*> |
| Doubao | <https://www.doubao.com/*> |
| Microsoft Copilot | <https://copilot.microsoft.com/*> |

The content script and styles are injected **only** on these three origins (defined in `manifest.json`).

---

## File Structure

```
ai-chat-switcher/
├── manifest.json   # Extension manifest (Manifest V3)
├── content.js      # Content script – builds the floating switcher widget
├── styles.css      # Document-level styles for the shadow-host element
├── popup.html      # Toolbar popup – three clickable site icons
└── README.md       # This file
```

---

## Installation (Developer / Unpacked Mode)

1. Clone or download this repository.
2. Open your browser and go to `edge://extensions` (Edge) or `chrome://extensions` (Chrome).
3. Enable **Developer mode** (toggle in the top-right corner).
4. Click **Load unpacked** and select the `ai-chat-switcher/` folder.
5. The extension icon will appear in your toolbar. Visit any supported AI chat site to see the floating switcher.

---

## Usage

- **From a supported site** — a vertical stack of circular icons appears on the right side of the page. Click any icon to navigate to that AI chat.
- **From the toolbar popup** — click the extension icon, then click the logo of the site you want to open.

---

# Edge AI Chat Switcher（中文说明）

这是一个轻量级的 Edge / Chrome 浏览器扩展，让你只需点击一下，就能在 **Google Gemini**、**豆包（Doubao）** 和 **Microsoft Copilot** 之间自由切换，无需新开标签页或手动输入网址。

## 功能特性

- **悬浮切换器** — 在每个受支持的 AI 聊天页面右侧注入一组圆形图标按钮，随时可见、随时点击。
- **工具栏弹出窗口** — 点击浏览器工具栏中的扩展图标，即可一览三个站点并立即跳转。
- **当前站点高亮** — 你正在浏览的站点对应按钮会有视觉区分，方便定位。
- **Shadow DOM 样式隔离** — 扩展的样式与宿主页面完全隔离，互不干扰。
- **图片加载失败兜底** — 若远程 Logo 加载失败，将显示粗体首字母，保持界面整洁。
- **性能友好** — 使用被动事件监听器、双重 `requestAnimationFrame` 实现平滑动画，初始化后不重复查询 DOM。

## 支持的站点

| 站点 | 网址 |
|------|------|
| Google Gemini | <https://gemini.google.com/*> |
| 豆包 (Doubao) | <https://www.doubao.com/*> |
| Microsoft Copilot | <https://copilot.microsoft.com/*> |

内容脚本和样式**仅**在上述三个域名下注入（在 `manifest.json` 的 `content_scripts.matches` 中定义）。

## 安装（开发者/未打包模式）

1. 克隆或下载本仓库。
2. 打开浏览器，访问 `edge://extensions`（Edge）或 `chrome://extensions`（Chrome）。
3. 开启右上角的**开发者模式**。
4. 点击**加载已解压的扩展程序**，选择 `ai-chat-switcher/` 文件夹。
5. 工具栏会出现扩展图标。访问任意受支持的 AI 聊天站点即可看到悬浮切换器。

## 使用方法

- **在受支持的站点上** — 页面右侧会出现一列圆形图标，点击任意图标即可跳转到对应的 AI 聊天站点。
- **通过工具栏弹窗** — 点击工具栏中的扩展图标，再点击目标站点的 Logo 即可打开。
