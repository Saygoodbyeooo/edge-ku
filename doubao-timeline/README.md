# 豆包时间轴 (Doubao Timeline)

🌐 Language: **中文** | [English](#english)

一个专为 **豆包（doubao.com）** 设计的 Chrome / Edge 浏览器扩展，在对话页面右侧提供可交互的时间轴导航。

---

## 功能介绍

### 对话时间轴

- 在豆包对话页面右侧显示固定的垂直时间轴。
- 每条用户消息对应一个**圆点**，圆点的位置与消息在对话中的位置一致。
- **悬停**圆点可查看该消息的文字摘要（最多 50 个字符）。
- **点击**圆点可平滑滚动到对应消息。
- 当前可见消息的圆点会**高亮显示**（紫色激活状态）。
- 时间轴随页面滚动实时同步。
- 顶部的小按钮可**折叠/展开**时间轴。
- 当消息数量超过 20 条时，自动切换为**紧凑横线模式**。

---

## 安装方法（开发者/未打包模式）

1. 克隆或下载本仓库。
2. 打开浏览器，访问 `chrome://extensions`（Chrome）或 `edge://extensions`（Edge）。
3. 开启右上角的**开发者模式**。
4. 点击**加载已解压的扩展程序**，选择 `doubao-timeline/` 文件夹。
5. 访问 [doubao.com](https://www.doubao.com) 并打开任意对话，即可在页面右侧看到时间轴。

---

## 使用说明

| 操作 | 效果 |
|------|------|
| 悬停圆点 | 显示该条消息的摘要 tooltip |
| 点击圆点 | 平滑滚动到对应消息 |
| 点击顶部按钮 | 折叠 / 展开时间轴 |
| 切换对话 | 时间轴自动清理并重新初始化 |

---

## 文件结构

```
doubao-timeline/
├── manifest.json                      # Chrome / Edge Manifest V3
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── js/
│   ├── global/
│   │   └── tooltip-manager/
│   │       └── index.js               # GlobalTooltipManager 组件
│   └── timeline/
│       ├── index.js                   # 主入口
│       ├── timeline-manager.js        # 时间轴管理器
│       └── adapters/
│           └── doubao.js              # 豆包适配器
└── styles/
    ├── variables.css                  # CSS 变量
    ├── timeline.css                   # 时间轴样式
    └── tooltip.css                    # Tooltip 样式
```

---

## 技术栈

- 原生 JavaScript（ES6+），无框架依赖
- Chrome Extension Manifest V3
- CSS 自定义属性（变量）
- MutationObserver（响应动态消息）
- IntersectionObserver / rAF（高性能滚动同步）
- 适配器模式（Adapter Pattern）

---

## 支持站点

| 站点 | URL |
|------|-----|
| 豆包 | `https://www.doubao.com/*` |
| 豆包（无 www） | `https://doubao.com/*` |

仅在 `/chat/` 路由页面激活。

---

## 致谢

本项目的视觉设计和代码架构参考了 [houyanchao/AITimeline](https://github.com/houyanchao/AITimeline)，感谢原项目提供的优秀时间轴交互设计。

---

## English

A Chrome / Edge browser extension for **doubao.com** that adds a vertical conversation timeline on the right side of chat pages.

### Features

- Fixed vertical timeline shows one dot per user message.
- **Hover** a dot to see a tooltip summary (up to 50 characters).
- **Click** a dot to smooth-scroll to the message.
- Active dot highlights as you scroll.
- Collapse / expand button at the top.
- Compact line mode when message count exceeds 20.

### Installation

1. Clone or download this repository.
2. Go to `chrome://extensions` and enable **Developer mode**.
3. Click **Load unpacked** and select the `doubao-timeline/` folder.
4. Open any chat on [doubao.com](https://www.doubao.com).

### Credits

Visual design and architecture inspired by [houyanchao/AITimeline](https://github.com/houyanchao/AITimeline).
