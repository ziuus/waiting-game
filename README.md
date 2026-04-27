# 🦖 Waiting Game

> **Kinetic Overlay Intelligence — An ultra-lightweight, full-screen transparent overlay game designed for high-performance focus.**

Waiting Game is a minimalist, cinematic overlay built with **Tauri**. It sits invisibly in the background of your Linux environment and only appears when summoned, providing a frictionless kinetic experience during idle time without impacting system resources.

## ⚡ Core Features

- **Invisible Protocol**: Starts completely hidden; zero UI footprint until triggered.
- **Pure Transparency**: Advanced compositing ensures only the kinetic Dino and obstacles are visible—zero blur, borders, or backgrounds.
- **Deep System Integration**: Native Hyprland support with automatic window rules and autostart configuration.
- **Zero Impact Architecture**: Near-zero CPU/RAM overhead when inactive, optimized for background persistence.

## 🚀 Quick Install (Hyprland)

The most efficient way to set up the Waiting Game with perfect transparency and autostart:

```bash
curl -sSL https://raw.githubusercontent.com/ziuus/waiting-game/master/install.sh | bash
```

*Note: This will download the installer and configure your `hyprland.conf` automatically.*

## 📦 Manual Installation

1.  **Download**: Grab the latest `.AppImage` or `.deb` from the [Releases](https://github.com/ziuus/waiting-game/releases) page.
2.  **Configure**: Run `./install.sh` from the project root to apply the transparency rules.

## 🕹️ Controls & Shortcuts

- **`SUPER` + `SHIFT` + `G`**: **Toggle Visibility** (Summon to current workspace).
- **`SUPER` + `SHIFT` + `P`**: **Toggle Sticky Mode** (Follow across all workspaces).
- **`SPACE`**: Jump / Initialize Protocol.
- **`H`**: Instant Hide (Focus mode).

## 🛠 Tech Stack

- **Backend**: Tauri (Rust)
- **Frontend**: Vanilla JS / Canvas
- **Platform**: Linux (Optimized for Wayland/Hyprland)

---
*Built for the Autonomous Desktop Era.*
