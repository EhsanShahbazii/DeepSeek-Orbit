# Changelog 📜

All notable changes to **DeepSeek Orbit** will be documented in this file.
The project adheres to [Semantic Versioning](https://semver.org/).

---

## [1.5.0] - 2026-08-31

### 🌟 Branding & Visual Identity
- **New Name & Visuals:** Officially launched as **DeepSeek Orbit — Smart Workspace & RTL Flow**.
- **Custom 3D Glassmorphic Icon:** Designed and rendered custom high-contrast DeepSeek royal blue whale and cyan neural waveform app icons (`16x16`, `48x48`, `128x128`).
- **Hero Banner:** Added high-resolution repository hero banner with glowing orbital theme.

### 🎨 Custom Wallpaper Studio & Theming
- **Custom Wallpaper Engine:** Support for uploading custom high-resolution background wallpapers with persistent `chrome.storage.local`.
- **Wallpaper Controls:** Real-time opacity slider (5%–60%) and background blur slider (0px–20px) with smooth CSS transitions.
- **DeepSeek Native Transparency:** Full glassmorphism for message bubbles, thinking accordions, user action bars, and bottom masks while preserving native sidebar colors.
- **Centered Wallpaper Studio:** Dedicated centered dialog on DeepSeek for seamless drag & drop file uploads and live adjustments.

### 📌 Navigation & Pin System
- **Unified Pushpin Icon:** Refreshed modern diagonal pushpin SVG with synchronized shape across pinned and unpinned states.
- **Active State:** Pinned state smoothly lights up in DeepSeek Royal Blue (`#4d6bfe`).
- **Mini-Nav Scrollbar Containment:** Fixed premature scrollbar popups on the right-side prompt history mini-nav by strictly binding to DeepSeek's `._7a8ea4` hover state.

### ⚡ Developer & Modal Improvements
- **Smooth Code Modal Animations:** GPU-accelerated enter and exit transitions for fullscreen code view (`scale(0.95) translateY(10px)` with ease).
- **Code Block Border Radius:** Preserved crisp rounded borders on all `.md-code-block` elements when custom wallpapers are active.
- **Smooth Export Menu:** Added cubic-bezier ease transitions to the floating export menu dropdown.

---

## [1.4.0] - 2026-08-25

### ✍️ Prompting & Typing Productivity
- **Slash Commands (`/`):** Instant prompt template picker (`/fix`, `/explain`, `/refactor`, `/summarize`, `/translate`, `/test`).
- **Prompt History Cycling:** <kbd>↑</kbd> and <kbd>↓</kbd> keyboard arrow cycling through past prompts.
- **Auto-Collapse Thoughts:** Automatically keeps DeepSeek-R1 "Thinking Process" blocks compact.

---

## [1.3.0] - 2026-08-15

### 🔍 Search & Bookmarking
- **In-Chat Keyword Search:** Real-time search with keyword highlight, match counter, and <kbd>Enter</kbd> jumping.
- **Message Bookmarks (Pins):** Pin assistant responses and browse them from a slide-out drawer.

---

## [1.2.0] - 2026-08-05

### 💻 Developer Tools
- **Line Numbers:** Automatic unselectable line numbers on all code blocks.
- **Word Wrap Toggle:** Instant toggle between horizontal scrolling and word wrapping.
- **Fullscreen Syntax Viewer:** Expanded view with syntax highlighting.

---

## [1.1.0] - 2026-07-20

### 🔄 Multi-Font Persian Typography
- Added typography presets: **Vazirmatn**, **Sahel**, **Shabnam**, **Estedad**, **Samim**, **Dana**, **Tahoma**, and custom font inputs.
- Configurable line height and Persian text rendering polish.

---

## [1.0.0] - 2026-07-01

### 🚀 Initial Release
- **Smart Bi-directional RTL Alignment Engine**: Automatic paragraph-by-paragraph Unicode text direction detection.
- **Strict Code & Formula Isolation**: Keeps code blocks and LaTeX math formulas strictly LTR.
- **Auto-RTL Input Box**: Automatic text direction on typing Persian/Arabic.
- **Keyboard Shortcut**: <kbd>Ctrl + Shift + X</kbd> / <kbd>Cmd + Shift + X</kbd> quick toggle.
