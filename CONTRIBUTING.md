# Contributing to Waiting Game 🦖

Thanks for considering contributing to Waiting Game.

## How to Contribute

### Reporting Bugs
- Check the GitHub Issues for existing reports.
- Open a new issue with a clear description, steps to reproduce, and your system (OS, compositor/DE, version).

### Suggesting Enhancements
- Open an issue to discuss your idea.
- Describe the current behavior and what you'd like to see instead.

### Pull Requests
1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Make your changes.
4. Ensure your code follows the existing style.
5. Submit a pull request.

### Cross-Platform Contributions

When reporting an issue related to a specific OS, include your full environment specs. Tauri handles transparent webviews, input events, and window managers differently depending on the OS.

**When reporting a bug, include:**
- **OS & version** (e.g., Windows 11, macOS Sonoma, Arch Linux)
- **Architecture** (x86_64, ARM64)
- **Display server / WM** (e.g., Wayland + Hyprland, X11 + i3, COSMIC)

**Key areas to test:**
- **Path resolution** — ensure file paths use OS-agnostic logic.
- **Keybindings** — verify keyboard inputs don't conflict with native OS shortcuts.
- **Rendering** — ensure the canvas scales correctly on HiDPI displays.
- **Window transparency** — ensure the overlay appears fully transparent without artifacts.

## Development Setup

Built with [Tauri v2](https://v2.tauri.app/).

### Prerequisites
- [Rust](https://www.rust-lang.org/tools/install)
- [Node.js](https://nodejs.org/)
- Linux: `libwebkit2gtk-4.1-dev`, `build-essential`, `libssl-dev`, `libgtk-3-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev`

### Running in Development
```bash
pnpm install
pnpm tauri dev
```

### Project Structure
- `src/` — Frontend (HTML, CSS, JS)
- `src-tauri/` — Rust backend + Tauri config
- `install.sh` — Setup script for Linux compositors

## Style Guide
- Clean, minimalist design for UI additions.
- Keep performance impact low.
- The game should only be active when visible.

## Code of Conduct
Please be respectful and helpful.

## License
MIT
