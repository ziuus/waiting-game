# Contributing to Waiting Game 🦖

First off, thank you for considering contributing to Waiting Game! It's people like you that make Waiting Game such a great tool for the community.

## How Can I Contribute?

### Reporting Bugs
* Check the GitHub Issues for existing reports.
* If you find a new bug, please open a new issue with a clear description, steps to reproduce, and your system environment (OS, Desktop Environment/Compositor, and version).

### Suggesting Enhancements
* Open an issue to discuss your idea.
* Describe the current behavior and what you would like to see instead.

### Pull Requests
1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Make your changes.
4. Ensure your code follows the existing style.
5. Submit a pull request.

### 💻 Cross-Platform Contributions

When submitting a pull request or reporting an issue related to a specific operating system, please ensure you include your full environment specs. Tauri handles transparent webviews, input events, and window managers differently depending on the OS.

**When reporting a bug, please include:**
* **OS & Version:** (e.g., Windows 11, macOS Sonoma 14.2, Arch Linux)
* **Architecture:** (x86_64, ARM64)
* **Display Server / WM (Linux only):** (e.g., Wayland, X11, GNOME, Hyprland)

**Key areas to test:**
* **Path Resolution:** Ensure file paths correctly use OS-agnostic logic.
* **Keybindings:** Verify that keyboard inputs for the game do not conflict with native OS shortcuts.
* **Rendering:** Ensure the game canvas scales correctly on High-DPI (Retina) displays and different scaling fractional settings.
* **Window Transparency:** Ensure the overlay appears completely transparent without ghosting or rendering artifacts.

## Development Setup

The project is built with [Tauri v2](https://v2.tauri.app/).

### Prerequisites
- [Rust](https://www.rust-lang.org/tools/install)
- [Node.js](https://nodejs.org/)
- System dependencies for Tauri (on Linux, you'll need `libwebkit2gtk-4.1-dev`, `build-essential`, `curl`, `wget`, `file`, `libssl-dev`, `libgtk-3-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev`).

### Running in Development
1. Install Node dependencies:
   ```bash
   pnpm install
   ```
2. Run the application:
   ```bash
   pnpm tauri dev
   ```

### Project Structure
- `src/`: Frontend code (HTML, CSS, JS).
- `src-tauri/`: Backend Rust code and Tauri configuration.
- `install.sh`: Setup script for Linux/Hyprland.

## Style Guide
- Use clean, minimalist design for any UI additions.
- Keep the performance impact as low as possible.
- Adhere to the "Invisible Protocol" philosophy: the game should only be active when visible.

## Code of Conduct
Please be respectful and helpful to others in the community.

---
*Stay kinetic.*
