#!/bin/bash
set -e

echo "⚙️ Waiting Game - Initial Configuration"

# Check if we are in the project root; if not, try to find it
if [ ! -f "package.json" ] || [ ! -d "src-tauri" ]; then
    # If the user is running this from their home dir after a curl | bash,
    # and we assume they've cloned it to ~/Projects/waiting-game
    PROJECT_DIR="$HOME/Projects/waiting-game"
    if [ -d "$PROJECT_DIR" ]; then
        cd "$PROJECT_DIR"
    else
        # If we can't find it, we might be in the middle of a first-time setup
        # but for now, we expect the user to have the source.
        # However, for a 'curl | bash' installer, we should probably clone if missing.
        echo "📂 Searching for project root..."
        # Just check current dir for the expected subfolder
        if [ -d "waiting-game" ]; then
            cd "waiting-game"
        fi
    fi
fi

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
    # We use /dev/tty for input to allow curl | bash interaction
    # --- Default Game ---
    printf "🎮 Default Game [dino/flappy] (default: dino): "
    read -r CONF_GAME < /dev/tty
    CONF_GAME=${CONF_GAME:-dino}

    # --- Initial Speed ---
    printf "⚡ Initial Speed (default: 8): "
    read -r CONF_SPEED < /dev/tty
    CONF_SPEED=${CONF_SPEED:-8}

    # --- Scoreboard ---
    printf "📊 Show Scoreboard? [Y/n] (default: Y): "
    read -r CONF_SCORE < /dev/tty
    CONF_SCORE=${CONF_SCORE:-Y}
    case "$CONF_SCORE" in
        [Nn]*) SCORE_BOOL="false" ;;
        *)     SCORE_BOOL="true"  ;;
    esac

    # --- Sticky Mode ---
    printf "📌 Enable Sticky Mode by default? [y/N] (default: N): "
    read -r CONF_STICKY < /dev/tty
    CONF_STICKY=${CONF_STICKY:-N}
    case "$CONF_STICKY" in
        [Yy]*) PIN_RULE="    pin = on" ;;
        *)     PIN_RULE=""            ;;
    esac
fi

echo "💾 Saving configuration..."
if command -v jq >/dev/null; then
    # Ensure src directory exists before writing
    mkdir -p src
    jq ".activeGame = \"$CONF_GAME\" | .difficulty.initialSpeed = $CONF_SPEED | .showScore = $SCORE_BOOL" src/config.json > src/config.tmp.json && mv src/config.tmp.json src/config.json
else
    echo "⚠️ jq not installed. Default config.json will be used."
fi

echo "🔨 Building production binary with new configuration (this may take a minute)..."
# Check if pnpm is installed, otherwise use npm
BUILD_CMD="pnpm tauri build"
if ! command -v pnpm >/dev/null; then
    BUILD_CMD="npm run tauri build"
fi

$BUILD_CMD > /dev/null 2>&1 || echo "⚠️ Build failed. You might need to run 'pnpm install' first."

echo "🦖 Initializing Waiting Game - Universal Installation Protocol..."

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

# --- 2. System Path Integration ---
BIN_DEST="$HOME/.local/bin"
mkdir -p "$BIN_DEST"
SOURCE_BIN="./src-tauri/target/release/waiting-game"

if [ -f "$SOURCE_BIN" ]; then
    cp "$SOURCE_BIN" "$BIN_DEST/waiting-game"
    chmod +x "$BIN_DEST/waiting-game"
    echo "✅ Binary installed to $BIN_DEST/waiting-game"
    
    # Check if ~/.local/bin is in PATH
    if [[ ":$PATH:" != *":$BIN_DEST:"* ]]; then
        echo "⚠️  Note: $BIN_DEST is not in your PATH. You might need to add it to your .bashrc or .zshrc:"
        echo "   export PATH=\$PATH:\$HOME/.local/bin"
    fi

    # --- 2b. Desktop Integration ---
    echo "🖥️  Integrating with desktop environment..."
    DESKTOP_DIR="$HOME/.local/share/applications"
    ICON_DIR="$HOME/.local/share/icons"
    mkdir -p "$DESKTOP_DIR" "$ICON_DIR"
    
    cp "./src-tauri/main.desktop" "$DESKTOP_DIR/waiting-game.desktop"
    cp "./src-tauri/icons/icon.png" "$ICON_DIR/waiting-game.png"
    echo "✅ Desktop entry and icon installed."
else
    echo "⚠️  Could not find release binary for installation to PATH."
fi

# --- 3. Immediate Launch ---
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
