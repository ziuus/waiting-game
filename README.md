# 🦖 Waiting Game

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](CODE_OF_CONDUCT.md)

<p align="center">
  <img src="exports/demo_workflow.gif" width="100%" alt="Waiting Game Workflow" />
</p>

> **Kinetic Overlay Intelligence — An ultra-lightweight, full-screen transparent overlay game powered by a high-performance Rust core.**

Waiting Game is a minimalist, cinematic overlay built with **Tauri and Rust**. It sits invisibly in the background of your desktop environment and only appears when summoned, providing a frictionless kinetic experience during idle time without impacting system resources.

Current release: **v0.3.11** — includes Dino Runner, Flappy Bird, Gravity Runner, Cyber Snake, Neon Breakout, and Defender.

## ⚡ Core Features

- **Invisible Protocol**: Starts completely hidden; zero UI footprint until triggered.
- **Pure Transparency**: Advanced compositing keeps the overlay lightweight and visually clean.
- **Cross-Platform Performance**: Near-zero CPU/RAM overhead when inactive, leveraging Rust's memory safety and speed.
- **Multiple Game Modes**: Dino Runner, Flappy Bird, Gravity Runner, Cyber Snake, Neon Breakout, and Defender.
- **Dynamic Difficulty**: Easy, Normal, and Hard presets with per-game speed, physics, and spacing parameters.
- **Customizable Roster**: Enable, disable, rename, and theme games through the config file.

## 📸 Interface

<p align="center">
  <img src="exports/1.png" width="48%" />
  <img src="exports/2.png" width="48%" />
</p>

## 🚀 Installation

Waiting Game is cross-platform and provides multiple ways to install.

### ✅ Recommended Install

Download the latest native build from the [Releases Page](https://github.com/ziuus/waiting-game/releases/latest).

#### Linux AppImage

```bash
curl -L -o waiting-game.AppImage \
  https://github.com/ziuus/waiting-game/releases/download/v0.3.11/waiting-game_0.3.11_amd64.AppImage
chmod +x waiting-game.AppImage
./waiting-game.AppImage
```

On this development system, the latest AppImage is installed at:

```bash
~/Applications/waiting-game-0.3.11.AppImage
```

and symlinked as:

```bash
~/bin/waiting-game
```

### 📦 Package Managers

Package-manager manifests exist in `packaging/`, but they are **not published to public registries yet**. Until publishing is complete, use the GitHub Releases install method above.

| OS | Method | Command |
| :--- | :--- | :--- |
| **Linux (Arch)** | **AUR** | Planned: `waiting-game-bin` |
| **Windows** | **WinGet** | Planned: `ziuus.WaitingGame` |
| **Universal** | **npm** | Planned: `npx waiting-game` |

### ⬇️ Native Downloads

Download the latest release in your preferred format from the [Releases Page](https://github.com/ziuus/waiting-game/releases/latest).

#### Linux
- **AppImage**: Universal Linux binary.
- **.deb**: For Debian/Ubuntu-based distros.
- **.rpm**: For Fedora/RHEL-based distros.

#### Windows
- **.exe / .msi**: Native installers for Windows 10/11.

#### macOS
- **.dmg**: Apple Disk Image for Intel and Apple Silicon.

---

## 🌍 Environment Compatibility

We are actively testing across multiple environments. Want to help? Check out our [Contribution Guidelines](CONTRIBUTING.md).

| OS / Environment | Status | Notes |
| :--- | :---: | :--- |
| **Windows 11** | ⏳ Needs Testing | Testing window transparency |
| **Windows 10 / WSL2** | ⏳ Needs Testing | |
| **macOS (Apple Silicon)** | ⏳ Needs Testing | Checking input latency |
| **macOS (Intel)** | ⏳ Needs Testing | |
| **Ubuntu / Debian** | ⏳ Needs Testing | |
| **Arch Linux** | ✅ Working | Wayland + Hyprland tested |
| **Tiling WMs (River, i3)** | ⏳ Needs Testing | Window focus handling |

---

### 🧩 Premium Hyprland Integration (Linux Only)
Waiting Game offers specialized integration for the Hyprland compositor. You can use the automated installer:
```bash
curl -sSL https://raw.githubusercontent.com/ziuus/waiting-game/master/install.sh | bash
```
This sets up dedicated window rules and autostart configuration at `~/.config/hypr/waiting-game.conf`.

## 🕹️ Configuration & Difficulty

### Game Modes

- **Dino Runner**: Classic kinetic runner.
- **Flappy Bird**: Polished bird, neon pipes, and momentum-based flight.
- **Gravity Runner**: Cyber gravity-flip runner with neon spikes.
- **Cyber Snake**: Grid-based snake with glowing food, obstacles, and particle effects.
- **Neon Breakout**: Paddle, glowing ball, brick waves, and trail effects.
- **Defender**: Side-scrolling neon space defense with movement, shooting, shields, enemies, and enemy fire.

### Difficulty Modes
You can switch between difficulty modes via the in-game UI:
- **Easy**: Relaxed speed and higher jump force.
- **Normal**: The standard balanced experience.
- **Hard**: Faster obstacles and increased gravity for a real challenge.

### Manual Configuration
Advanced users can modify the game parameters directly at:
`~/.config/waiting-game/config.json`

Supported parameters include:
- `initialSpeed`: Movement speed of obstacles.
- `gravity`: Game-specific vertical physics where applicable.
- `jumpForce`: Vertical thrust or action intensity where applicable.
- `obstacleGap`: Game-specific spacing, rows, or density tuning.
- `themes`: Per-game player, obstacle, and score colors.
- `games`: Enable/disable games and customize display names.

## 🕹️ CLI Commands

- **`waiting-game run`**: Start the game in the background.
- **`waiting-game stop`**: Terminate the game process.

## 🕹️ Tech Stack

- **Core Logic**: [Rust](https://www.rust-lang.org/)
- **Framework**: [Tauri v2](https://v2.tauri.app/)
- **Frontend**: Vanilla JS / Canvas

## 🕹️ Shortcuts

- **`SUPER` + `SHIFT` + `G`**: **Toggle Visibility** (Linux/Hyprland)
- **`SUPER` + `SHIFT` + `P`**: **Toggle Sticky Mode** (Linux/Hyprland)
- **`SPACE`**: Jump / Initialize
- **`H`**: Instant Hide

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---
*Built for the Autonomous Desktop Era.*
