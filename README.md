# 🌌 DeepSeek Orbit — Smart Workspace & RTL Flow (v2.0.0)

<p align="center">
  <img src="assets/banner.png" alt="DeepSeek Orbit Preview Banner" width="100%" style="border-radius: 12px; box-shadow: 0 16px 48px rgba(0,0,0,0.6);" />
</p>

<p align="center">
  <a href="https://github.com/EhsanShahbazii"><img src="https://img.shields.io/badge/Author-Ehsan%20Shahbazi-4d6bfe?style=for-the-badge&logo=github&logoColor=white" alt="Author" /></a>
  <a href="https://github.com/EhsanShahbazii/DeepSeek-Orbit/releases"><img src="https://img.shields.io/badge/Version-2.0.0%20Pro-4d6bfe?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Version" /></a>
  <img src="https://img.shields.io/badge/Platform-DeepSeek%20AI%20%7C%20Manifest%20V3-00d26a?style=for-the-badge" alt="Platform" />
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-1e2025?style=for-the-badge" alt="License" /></a>
</p>

---

## 📖 Overview

**DeepSeek Orbit** is a modern, developer-first open-source browser extension engineered exclusively for **[chat.deepseek.com](https://chat.deepseek.com)**. Designed and developed by **[Ehsan Shahbazi](https://github.com/EhsanShahbazii)**, it elevates DeepSeek AI into a full-fledged intelligent workspace with bi-directional Right-to-Left (RTL) Persian & Arabic typography, codebase & repository context ingestion, multi-persona memory studio, interactive tables, multi-file ZIP scaffolding, live front-end sandbox preview, developer code tools, and chat productivity workflows.

Crafted with DeepSeek's authentic **Royal Blue & Dark Obsidian** aesthetic, the extension integrates seamlessly without breaking native chat mechanics or streaming responses.

---

## ⚡ Key Highlights (v2.0.0)

- **🔄 Smart Bi-directional RTL Engine**: Evaluates text paragraph-by-paragraph to apply natural Right-to-Left alignment for Persian, Arabic, Hebrew, and Urdu text while strictly keeping code & LaTeX LTR.
- **🧠 Persistent Instructions & Persona Memory Studio**: Create, edit, and switch developer personas and instruction presets (English & Persian) with a 1-click toggle in the prompt bar.
- **📥 Context Ingest Studio**: Ingest local folders, entire GitHub repositories (with subfolder & branch selection), or web documentation with real-time token estimation.
- **📊 Interactive Dynamic Markdown Tables**: Instant 1-click Excel (`.xls`) download, CSV copying, and ascending/descending column sorting on any table DeepSeek generates.
- **📦 Multi-File 1-Click ZIP Scaffolder**: Automatically detects multi-file code blocks generated in conversation and downloads a ready-to-run `.zip` archive.
- **🚀 Live Sandbox HTML/CSS/JS Preview**: Preview generated web applications directly inside DeepSeek with interactive **Desktop**, **Tablet**, and **Mobile** responsive viewport toggles.
- **🖥️ Wide Chat Mode**: Smoothly expand message bubbles, response cards, and the prompt input box to a spacious `1200px` widescreen layout.
- **📐 Smooth Textarea Expander**: Expand prompt textarea up to `60vh` with smooth animation while keeping the bottom action bar docked and accessible.
- **🖼️ Custom Wallpaper Compositor**: Personalize chat background with custom images, opacity (5%–60%), and blur controls.
- **💻 Developer Code Suite**: Sticky unselectable line numbers on all code snippets, one-click word wrap toggle, and fullscreen syntax viewer modal with smooth GPU animations.
- **🔍 In-Chat Keyword Search**: Instant <kbd>Ctrl + F</kbd> search across active conversations with real-time match counters (`1 / 18`), keyword highlighting, and viewport auto-scrolling.
- **📌 Stable Message Bookmarks (Pins)**: Save vital assistant responses or prompts with native pushpin buttons and browse them in a slide-out drawer.
- **⬆️ Scroll to Top of Message**: 1-click button on each message toolbar to jump instantly to the beginning of long responses.
- **✍️ Slash Command Templates (`/`)**: Type `/` to open an instant prompt template menu (`/fix`, `/explain`, `/refactor`, `/summarize`, `/translate`, `/test`).
- **📜 Prompt History Cycling**: Navigate past prompts directly in the input box using <kbd>↑</kbd> and <kbd>↓</kbd> keyboard arrows.
- **🧠 Auto-Collapse DeepSeek-R1 Thoughts**: Keeps long "Thinking Process" accordions compact by default for clean and focused reading.
- **📤 Multi-Format Chat Exporter**: Download or copy conversation history in structured **Markdown**, **HTML / Print**, or **JSON**.

---

## 📂 Modular Project Structure

```
deepseek-orbit/
├── manifest.json              # Chrome Extension Manifest (V3)
├── src/
│   ├── core/
│   │   ├── constants.js       # SVG icon library, font maps, slash templates & default state
│   │   ├── detector.js        # Unicode bi-directional RTL detection algorithm
│   │   └── storage.js         # Settings persistence & chrome.storage.local sync
│   ├── ui/
│   │   ├── custom-instructions.js # Persona & Persistent Instructions Memory Studio
│   │   ├── context-importer.js    # Local folder, GitHub repository & web context ingestion
│   │   ├── dynamic-tables.js      # Dynamic table sorting, CSV export & Excel download
│   │   ├── zip-bundler.js         # Multi-file code project detector & ZIP scaffolder
│   │   ├── sandbox-preview.js     # Live iframe sandbox preview with responsive viewports
│   │   ├── textarea-expander.js   # Smooth prompt box expander & action bar docking
│   │   ├── code-enhancer.js       # Sticky line numbers, word wrap & fullscreen syntax modal
│   │   ├── search.js              # In-chat keyword search, match counter & auto-scroller
│   │   ├── pins.js                # Message bookmarking system & slide-out pinned drawer
│   │   ├── wallpaper.js           # Background wallpaper compositor & glassmorphism
│   │   ├── slash-commands.js      # Slash templates (/) & prompt history cycling (↑/↓)
│   │   └── toolbar.js             # Floating suite toolbar & multi-format export dropdown
│   ├── popup/
│   │   ├── popup.html             # Extension popup dashboard
│   │   ├── popup.css              # Glassmorphic dark theme styles
│   │   └── popup.js               # Real-time state persistence & cross-tab sync
│   ├── content.js                 # Content script runtime coordinator
│   └── content.css                # DeepSeek native design system styles & animations
├── icons/
│   ├── icon16.png                 # 16x16 HD Extension Icon
│   ├── icon48.png                 # 48x48 HD Extension Icon
│   └── icon128.png                # 128x128 HD Extension Icon
├── assets/
│   ├── banner.png                 # Official 16:9 glowing orbital hero banner
│   ├── icon.png                   # Official 3D glassmorphic logo
│   └── screenshots/               # Extension interface preview screenshots
├── docs/
│   └── ARCHITECTURE.md            # Technical architecture reference
├── CHANGELOG.md                   # Version release notes (v1.0.0 → v2.0.0)
├── CONTRIBUTING.md                # Open-source contribution guide
├── LICENSE                        # MIT License (Copyright 2026 Ehsan Shahbazi)
└── package.json                   # Development metadata & bundling scripts
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action | Description |
| :--- | :--- | :--- |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>X</kbd> / <kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>X</kbd> | **Toggle Direction** | Instantly switches the prompt input box between RTL and LTR |
| <kbd>Ctrl</kbd> + <kbd>F</kbd> | **In-Chat Search** | Opens the keyword search bar with real-time match highlighting |
| <kbd>Enter</kbd> / <kbd>Shift</kbd> + <kbd>Enter</kbd> | **Next / Prev Match** | Jumps to the next or previous keyword match |
| <kbd>↑</kbd> / <kbd>↓</kbd> | **Prompt History** | Cycles through previously sent prompts in the input field |
| <kbd>/</kbd> | **Slash Templates** | Opens the instant prompt templates dropdown |
| <kbd>Esc</kbd> | **Close Overlays** | Closes search bar, fullscreen code modal, or pinned messages drawer |

---

## 🚀 Installation Guide

### Chrome / Brave / Edge / Chromium

1. Clone or download this repository:
   ```bash
   git clone https://github.com/EhsanShahbazii/DeepSeek-Orbit.git
   cd DeepSeek-Orbit
   ```
2. Open your browser and navigate to **`chrome://extensions/`**.
3. Enable **Developer mode** in the top-right corner.
4. Click **Load unpacked** in the top-left corner.
5. Select the `DeepSeek-Orbit` root directory.
6. Open **[chat.deepseek.com](https://chat.deepseek.com)** and enjoy a supercharged DeepSeek experience!

---

## 🛡️ Privacy & Security

> [!NOTE]
> **DeepSeek Orbit** is 100% client-side and open-source.
>
> - **Zero Analytics / Tracking**: No tracking pixels, remote telemetries, or data collection.
> - **Local Storage Only**: All settings, custom wallpapers, and pins stay strictly inside your browser's `chrome.storage.local`.
> - **No Remote Dependencies**: Loads zero external scripts at runtime.

---

## 👨‍💻 Author & Credits

- **Architect & Lead Developer**: **Ehsan Shahbazi**
- **GitHub**: [@EhsanShahbazii](https://github.com/EhsanShahbazii)
- **Email**: [ehsan.shahbazipc@gmail.com](mailto:ehsan.shahbazipc@gmail.com)

---

## 🤝 Contributing

Contributions are warmly welcomed! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and pull request process.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

Copyright (c) 2026 **Ehsan Shahbazi**.
