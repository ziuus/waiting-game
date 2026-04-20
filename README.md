# 🦖 Waiting Game

> **Kinetic Overlay Intelligence — An ultra-lightweight, full-screen transparent overlay game designed for high-performance focus.**

Waiting Game is a minimalist, cinematic overlay built with **Tauri** and **React**. It sits invisibly in the background of your Linux environment and only appears when summoned, providing a frictionless kinetic experience during idle time without impacting system resources.

## ⚡ Core Features

- **Invisible Protocol**: Starts completely hidden; zero UI footprint until triggered.
- **Pure Transparency**: Advanced compositing ensures only the kinetic Dino and obstacles are visible—no window borders or backgrounds.
- **Workspace Intelligence**: Dynamically tracks your active Hyprland/Window Manager workspace to appear exactly where you are.
- **Zero Impact Architecture**: Near-zero CPU/RAM overhead when inactive, optimized for background persistence.

## 🛠 Tech Stack

- **Framework**: Tauri (Rust Backend + Vite/React Frontend)
- **Language**: Rust, TypeScript
- **Styling**: Minimalist CSS (Transparency-first)
- **Platform**: Linux (Optimized for Wayland/Hyprland)

## 🚀 Getting Started

1. **Environment Setup**:
   Ensure you have the Rust toolchain and Tauri dependencies installed.

2. **Install & Run**:
   ```bash
   npm install
   npm run tauri dev
   ```

## 🕹️ Controls & Shortcuts

- **`SUPER` + `SHIFT` + `G`**: **Toggle Visibility** (Summon to current workspace).
- **`SUPER` + `SHIFT` + `P`**: **Toggle Sticky Mode** (Follow across all workspaces).
- **`SPACE`**: Jump / Initialize Protocol.
- **`H`**: Instant Hide (Focus mode).

---
*Built for the Autonomous Desktop Era.*
