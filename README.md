# 🦖 Waiting Game

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](CODE_OF_CONDUCT.md)

<p align="center">
  <img src="exports/demo_workflow.gif" width="100%" alt="Waiting Game Workflow" />
</p>

A full-screen transparent overlay game that sits on your desktop and responds to keyboard input. Built with Tauri v2 and Rust for minimal resource usage — activates when summoned, stays quiet otherwise.

Current release: **v0.4.2** — Dino Runner, Flappy Bird, Gravity Runner, Cyber Snake, Neon Breakout, and Defender.

## Features

- **Transparent overlay**: Full-screen, no window chrome, doesn't block the desktop.
- **Always-on-top**: Available with a keypress, never lost behind other windows.
- **Six game modes**: Dino Runner, Flappy Bird, Gravity Runner, Cyber Snake, Neon Breakout, and Defender.
- **Global leaderboards**: Submit scores to a live leaderboard and see your rank across all players.
- **Dynamic difficulty**: Easy, Normal, and Hard presets with per-game speed, physics, and spacing.
- **Customizable roster**: Enable, disable, rename, and theme games through the config file.
- **Near-zero idle cost**: No CPU or RAM draw when the game isn't running.

## Interface

<p align="center">
  <img src="exports/1.png" width="48%" />
  <img src="exports/2.png" width="48%" />
</p>

## Installation

Download the latest release from the [Releases Page](https://github.com/ziuus/waiting-game/releases/latest).

### Linux

```bash
curl -L -o waiting-game.AppImage \
  https://github.com/ziuus/waiting-game/releases/download/v0.4.2/waiting-game_0.4.2_amd64.AppImage
chmod +x waiting-game.AppImage
./waiting-game.AppImage
```

On this development system, the AppImage is at `~/Applications/waiting-game-0.4.2.AppImage`.

### Package Managers

Package-manager manifests exist in `packaging/` but are not published to public registries yet.

| OS | Method | Command |
| :--- | :--- | :--- |
| **Linux (Arch)** | **AUR** | Planned: `waiting-game-bin` |
| **Windows** | **WinGet** | Planned: `ziuus.WaitingGame` |
| **Universal** | **npm** | Planned: `npx waiting-game` |

### Other Platforms

- **Windows**: Download the `.exe` / `.msi` installer from Releases.
- **macOS**: Download the `.dmg` from Releases (Intel and Apple Silicon).

## Configuration

The game reads `~/.config/waiting-game/config.json`. It auto-creates one with defaults if missing.

Supported settings:
- `activeGame` / `activeDifficulty` — startup game and difficulty.
- `games` — enable/disable individual games and set display names.
- `themes` — per-game player, obstacle, and score colors.
- `difficultyModes` — fine-tune easy/normal/hard physics per game.

## Usage

Run the binary. The game window appears full-screen and transparent.

- **`SPACE`** — Jump / Initialize
- **`H`** — Hide the game window
- **`Tab`** — Switch between game, difficulty, and leaderboard controls on the game-over screen

On Linux compositors that support custom keybinds (Hyprland, COSMIC), you can bind a hotkey to toggle the game window. See `install.sh` for an example Hyprland config.

## Shortcuts

| Key | Action |
| :--- | :--- |
| **`SPACE`** | Jump / Initialize game |
| **`H`** | Instant hide |

Compositor-side bindings can toggle visibility (e.g., `SUPER + SHIFT + G` on Hyprland).

## Tech Stack

- **Core**: Rust, Tauri v2
- **Frontend**: Vanilla JS / Canvas API
- **Backend (leaderboard)**: Firebase Firestore

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup and contribution guidelines.

## Game Modes

- **Dino Runner** — Classic runner with jump physics.
- **Flappy Bird** — Momentum-based flight with neon pipes.
- **Gravity Runner** — Gravity-flip runner with spikes.
- **Cyber Snake** — Grid-based snake with glowing food and particles.
- **Neon Breakout** — Paddle-and-ball breakout with brick waves.
- **Defender** — Side-scrolling space shooter with shields and enemy fire.

## License

MIT — see [LICENSE](LICENSE).
