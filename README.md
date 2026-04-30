# 🦖 Waiting Game

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](CODE_OF_CONDUCT.md)

<p align="center">
  <img src="exports/demo_workflow.gif" width="100%" alt="Waiting Game Workflow" />
</p>

> **Kinetic Overlay Intelligence — An ultra-lightweight, full-screen transparent overlay game powered by a high-performance Rust core.**

Waiting Game is a minimalist, cinematic overlay built with **Tauri and Rust**. It sits invisibly in the background of your Linux environment and only appears when summoned, providing a frictionless kinetic experience during idle time without impacting system resources.

## ⚡ Core Features

- **Invisible Protocol**: Starts completely hidden; zero UI footprint until triggered.
- **Pure Transparency**: Advanced compositing ensures only the kinetic Dino and obstacles are visible.
- **Deep System Integration**: Native Hyprland support with automatic window rules.
- **Rust-Engineered Performance**: Near-zero CPU/RAM overhead when inactive, leveraging Rust's memory safety and speed.

## 📸 Interface

<p align="center">
  <img src="exports/1.png" width="48%" />
  <img src="exports/2.png" width="48%" />
</p>

## 🚀 Quick Install (Hyprland)

```bash
curl -sSL https://raw.githubusercontent.com/ziuus/waiting-game/master/install.sh | bash
```

## 🧩 Hyprland Plugin Mode

Waiting Game is designed to act as a native Hyprland module. The installer automatically creates a dedicated configuration file at `~/.config/hypr/waiting-game.conf` and sources it in your `userprefs.conf`.

To manually integrate it, add this to your `hyprland.conf`:
```hyprlang
source = ~/.config/hypr/waiting-game.conf
```

## 🕹️ CLI Commands

- **`waiting-game run`**: Start the game in the background.
- **`waiting-game stop`**: Terminate the game process.

## 🕹️ Tech Stack

- **Core Logic**: [Rust](https://www.rust-lang.org/)
- **Framework**: [Tauri v2](https://v2.tauri.app/)
- **Frontend**: Vanilla JS / Canvas
- **Environment**: Linux (Optimized for Wayland/Hyprland)

## 🕹️ Shortcuts

- **`SUPER` + `SHIFT` + `G`**: **Toggle Visibility**
- **`SUPER` + `SHIFT` + `P`**: **Toggle Sticky Mode**
- **`SPACE`**: Jump / Initialize
- **`H`**: Instant Hide

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---
*Built for the Autonomous Desktop Era.*
