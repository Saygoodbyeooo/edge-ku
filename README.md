# edge-ku

A collection of Edge / Chrome browser extensions, one folder per extension.

## Repository Structure

```
edge-ku/
├── ai-chat-switcher/   # AI Chat Switcher – jump between Gemini, Doubao & Copilot
│   ├── manifest.json
│   ├── content.js
│   ├── styles.css
│   ├── popup.html
│   └── README.md       # Extension-specific documentation
└── README.md           # This file
```

Each subfolder is a self-contained extension with its own source files and `README.md`.

## Extensions

| Folder | Description |
|--------|-------------|
| [`ai-chat-switcher`](./ai-chat-switcher/) | Floating switcher & toolbar popup for Google Gemini, Doubao, and Microsoft Copilot |

## Adding a New Extension

1. Create a new subfolder at the repository root (e.g. `my-new-extension/`).
2. Place all extension source files inside that folder (`manifest.json`, scripts, styles, etc.).
3. Add a `README.md` inside the folder describing the extension's purpose, features, installation steps, and supported sites.
4. Update the **Extensions** table above with the new folder name and a short description.

Keep each extension fully self-contained — no cross-folder dependencies — so that each one can be loaded, developed, and published independently.

## Contributing

Pull requests are welcome. Please open an issue first to discuss significant changes, and ensure each extension folder remains well-documented.
