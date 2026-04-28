#!/bin/bash
set -e

echo "⚙️ Waiting Game - Initial Configuration"

USE_DEFAULTS=false
for arg in "$@"; do
    if [ "$arg" = "--default" ] || [ "$arg" = "-y" ] || [ "$arg" = "-d" ]; then
        USE_DEFAULTS=true
        break
    fi
done

if [ "$USE_DEFAULTS" = true ]; then
    echo "⏩ Using default configuration (--default passed)"
    CONF_GAME="dino"
    CONF_SPEED=8
    SCORE_BOOL="true"
    PIN_RULE=""
else
    # --- Default Game ---
    printf "🎮 Default Game [dino/flappy] (default: dino): "
    read -r CONF_GAME
    CONF_GAME=${CONF_GAME:-dino}

    # --- Initial Speed ---
    printf "⚡ Initial Speed (default: 8): "
    read -r CONF_SPEED
    CONF_SPEED=${CONF_SPEED:-8}

    # --- Scoreboard ---
    printf "📊 Show Scoreboard? [Y/n] (default: Y): "
    read -r CONF_SCORE
    CONF_SCORE=${CONF_SCORE:-Y}
    case "$CONF_SCORE" in
        [Nn]*) SCORE_BOOL="false" ;;
        *)     SCORE_BOOL="true"  ;;
    esac

    # --- Sticky Mode ---
    printf "📌 Enable Sticky Mode by default? [y/N] (default: N): "
    read -r CONF_STICKY
    CONF_STICKY=${CONF_STICKY:-N}
    case "$CONF_STICKY" in
        [Yy]*) PIN_RULE="    pin = on" ;;
        *)     PIN_RULE=""            ;;
    esac
fi

echo "💾 Saving configuration..."
if command -v jq >/dev/null; then
    jq ".activeGame = \"$CONF_GAME\" | .difficulty.initialSpeed = $CONF_SPEED | .showScore = $SCORE_BOOL" src/config.json > src/config.tmp.json && mv src/config.tmp.json src/config.json
else
    echo "⚠️ jq not installed. Default config.json will be used."
fi

echo "🔨 Building production binary with new configuration (this may take a minute)..."
pnpm tauri build > /dev/null 2>&1

echo "🦖 Initializing Waiting Game - Universal Installation Protocol..."

# Native capabilities (Autostart & Global Shortcuts) are now handled entirely by the Tauri backend!
# This script only needs to configure specific compositor rules (like Hyprland window rules) if necessary.

# --- 1. Check for Hyprland ---
if [ -d "$HOME/.config/hypr" ]; then
    echo "🌊 Hyprland detected. Applying compositor rules for perfect transparency..."
    
    # Try to find the right config file to append rules to
    HYPR_CONF="$HOME/.config/hypr/hyprland.conf"
    if [ -f "$HOME/.config/hypr/userprefs.conf" ]; then
        HYPR_CONF="$HOME/.config/hypr/userprefs.conf"
    fi

    RULES="
# Waiting Game Overlay Rules
windowrule {
    name = waiting-game-overlay
    match:class = ^(waiting-game)$
    float = on
    workspace = special:waiting-game silent
    size = 100% 100%
    move = 0 0
    no_blur = on
    border_size = 0
    no_shadow = on
    no_dim = on
$PIN_RULE
}
"
    
    # Clean up old rules
    sed -i '/# Waiting Game Overlay Rules/,+19d' "$HYPR_CONF" 2>/dev/null

    echo "$RULES" >> "$HYPR_CONF"
    echo "✅ Applied Hyprland window rules to $HYPR_CONF"
else
    echo "🖥️ Standard Desktop Environment detected (GNOME/KDE/XFCE)."
    echo "✅ No special compositor rules needed. Transparency will be handled natively."
fi

echo "🚀 Installation Complete!"

# --- 2. Immediate Launch ---
if ! pgrep -x "waiting-game" > /dev/null; then
    echo "🎮 Starting Waiting Game in background..."
    if [ -f "./src-tauri/target/release/waiting-game" ]; then
        ./src-tauri/target/release/waiting-game &
    elif [ -f "./src-tauri/target/debug/waiting-game" ]; then
        ./src-tauri/target/debug/waiting-game &
    elif command -v waiting-game >/dev/null 2>&1; then
        waiting-game &
    else
        echo "💡 Game binary not found. Please build the project or run 'pnpm tauri dev'."
    fi
else
    echo "🔄 Waiting Game is already running."
fi

echo "✨ All set! The app will automatically register to autostart."
echo "Press Super+Shift+G anywhere to summon the Dino."
