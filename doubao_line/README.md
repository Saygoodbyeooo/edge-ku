# Doubao Timeline & Performance Optimizer

🌐 Language: **English** | [中文](#中文说明)

A Chrome / Edge browser extension exclusively for **doubao.com** that adds a vertical conversation timeline and a DOM recycling performance optimiser.

---

## Features

### 1. Conversation Timeline

- A fixed vertical timeline appears on the right side of every Doubao chat page.
- Each user message is represented by a **dot** whose vertical position mirrors the message's position in the conversation.
- **Hover** a dot to see a tooltip with the first 30 characters of that message.
- **Click** a dot to smooth-scroll to the corresponding message.
- The dot for the currently visible message is **highlighted** (active state, bright purple).
- The timeline stays in sync as you scroll.
- A small **toggle button** at the top lets you collapse or expand the timeline.

### 2. Performance Optimiser

- Activates automatically when a conversation exceeds **30 messages**.
- Off-screen messages (outside a 2-viewport buffer) have their DOM content temporarily recycled — their `innerHTML` is saved and cleared, while the original height is preserved via `minHeight` so layout is not disrupted.
- Recycled nodes are restored instantly as they scroll back into view.
- **Paused during AI generation** — recycling is suspended whenever the AI is streaming a response (`break-btn` element present), preventing any interference with the live output.
- CSS animations and transitions are frozen on recycled nodes via `performance.css`.

---

## Supported Site

| Site | URL |
|------|-----|
| Doubao | `https://www.doubao.com/*` |
| Doubao (non-www) | `https://doubao.com/*` |

Only active on `/chat/` route pages.

---

## File Structure

```
doubao_line/
├── manifest.json            # Chrome / Edge Manifest V3
├── js/
│   ├── timeline.js          # Timeline logic (dots, tooltip, scroll sync, SPA nav)
│   └── performance.js       # DOM recycling & AI-state detection
├── styles/
│   ├── timeline.css         # Timeline, dots, tooltip, toggle button styles
│   └── performance.css      # Recycled-node animation freeze styles
└── README.md                # This file
```

---

## Installation (Developer / Unpacked Mode)

1. Clone or download this repository.
2. Open your browser and go to `chrome://extensions` (Chrome) or `edge://extensions` (Edge).
3. Enable **Developer mode** (toggle in the top-right corner).
4. Click **Load unpacked** and select the `doubao_line/` folder.
5. Navigate to [doubao.com](https://www.doubao.com) and open any chat — the timeline will appear on the right side.

---

---

## 中文说明

一个专为 **豆包（doubao.com）** 设计的 Chrome / Edge 浏览器扩展，提供对话时间线导航与 DOM 回收性能优化。

### 功能介绍

#### 功能 1：对话时间线

- 在豆包聊天页面右侧显示一条固定的垂直时间线。
- 每条用户消息对应一个**圆点**，圆点的垂直位置与消息在对话中的位置比例一致。
- **悬停**圆点可查看 tooltip，显示该消息前 30 个字符的摘要。
- **点击**圆点可平滑滚动到对应消息。
- 当前可见消息对应的圆点会**高亮**（亮紫色 active 状态）。
- 时间线随滚动自动同步。
- 顶部有**收起/展开**切换按钮。

#### 功能 2：性能优化

- 对话超过 **30 轮**时自动激活。
- 屏幕外（可视区域上下各 2 屏缓冲区之外）的消息节点会被临时回收：保存 innerHTML 后清空内容，用 minHeight 保持高度，滚动回来时自动恢复。
- **AI 生成中暂停**：检测到 `break-btn` 元素存在时，停止所有回收操作，避免干扰流式渲染。
- 通过 `performance.css` 冻结被回收节点的 CSS 动画与过渡。

### 安装方法（开发者/未打包模式）

1. 克隆或下载本仓库。
2. 打开浏览器，访问 `chrome://extensions`（Chrome）或 `edge://extensions`（Edge）。
3. 开启右上角的**开发者模式**。
4. 点击**加载已解压的扩展程序**，选择 `doubao_line/` 文件夹。
5. 访问 [doubao.com](https://www.doubao.com) 并打开任意对话，即可在页面右侧看到时间线。

### 文件结构说明

| 文件 | 说明 |
|------|------|
| `manifest.json` | Chrome/Edge Manifest V3 扩展配置 |
| `js/timeline.js` | 时间线核心逻辑（圆点渲染、tooltip、滚动同步、SPA 导航） |
| `js/performance.js` | DOM 回收与 AI 状态检测 |
| `styles/timeline.css` | 时间线、圆点、tooltip、切换按钮样式 |
| `styles/performance.css` | 被回收节点的动画冻结样式 |
