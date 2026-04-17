# Waiting Game (Tauri Overlay)

An ultra-lightweight, full-screen transparent overlay game designed for your idle time. It sits invisibly in your background and only appears when you summon it.

## Features
- **Invisible Startup**: Starts hidden in the background.
- **Pure Transparency**: No boxes, blurs, or UI elements—only the kinetic Dino and Cacti.
- **Workspace Aware**: Dynamically moves to your active workspace when summoned.
- **Zero Impact**: Near-zero CPU/RAM usage when hidden.

## Installation & Running

```bash
cd ~/Projects/waiting-game
npm install
npm run tauri dev
```

## 🕹️ Controls & Shortcuts

*   **`SUPER`** + **`SHIFT`** + **`G`**: **Toggle Visibility** (Summons the game to your current workspace).
*   **`SUPER`** + **`SHIFT`** + **`P`**: **Toggle Sticky Mode** (Pins the Dino so it follows you across all workspaces).
*   **`SPACE`**: Jump / Initialize Protocol.
*   **`H`**: Hide (when window is focused).

## Persistence
High scores are automatically saved to your local machine.
