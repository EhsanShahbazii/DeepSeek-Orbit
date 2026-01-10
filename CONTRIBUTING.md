# Contributing to DeepSeek Orbit 🚀

Thank you for your interest in making **DeepSeek Orbit** even better! We welcome contributions from developers, designers, translators, and users worldwide.

---

## 🛠️ Getting Started

1. **Fork the repository** on GitHub.
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/deepseek-orbit.git
   cd deepseek-orbit
   ```
3. **Load into Google Chrome / Chromium**:
   - Open `chrome://extensions`.
   - Enable **Developer mode** (toggle in the top-right corner).
   - Click **Load unpacked** and select the `deepseek-orbit` repository folder.
   - Navigate to [chat.deepseek.com](https://chat.deepseek.com).

---

## 📐 Project Architecture

```
deepseek-orbit/
├── manifest.json         # Chrome Extension Manifest V3 configuration
├── content.js            # Core engine: RTL auto-detector, UI injections, Slash commands, Search, Pins, Wallpapers
├── content.css           # DeepSeek design-matched styling, modal animations, glassmorphism, typography
├── popup.html            # Extension popup dashboard & settings UI
├── popup.css             # Popup styling & Dark theme controls
├── popup.js              # Settings persistence & runtime cross-tab broadcasting
├── icons/                # Extension icon assets (16x16, 48x48, 128x128)
├── assets/               # README banner, badges, and documentation assets
├── CHANGELOG.md          # Release notes and version history
├── CONTRIBUTING.md       # Contribution guidelines
├── LICENSE               # MIT License
└── package.json          # Development metadata and packaging scripts
```

---

## 🎨 Code Style Guidelines

- **Zero dependencies**: Keep the core lightweight, fast, and secure.
- **Native DeepSeek aesthetic**: Ensure all buttons, popups, and typography match DeepSeek's design language (`#4d6bfe` royal blue, glassmorphic dark surfaces, clean SVG icons).
- **Non-destructive DOM updates**: Never break native DeepSeek functionality or interfere with WebSocket/streaming responses.
- **Syntax validation**: Always run `npm test` (`node -c content.js && node -c popup.js`) before submitting pull requests.

---

## 📬 Submitting a Pull Request

1. Create a new branch: `git checkout -b feat/your-feature-name`
2. Commit your changes using [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat: add new font preset`
   - `fix: resolve scrollbar containment in mobile view`
   - `style: refine modal backdrop blur`
3. Push to your branch: `git push origin feat/your-feature-name`
4. Open a **Pull Request** with a detailed description and screenshots/GIFs demonstrating your improvements.

---

## 📄 License

By contributing to DeepSeek Orbit, you agree that your contributions will be licensed under the [MIT License](LICENSE).
