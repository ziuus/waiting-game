#!/bin/bash
set -e

echo "⚙️ Waiting Game - Initial Configuration"

# Check if we are in the project root; if not, try to find it
if [ ! -f "package.json" ] || [ ! -d "src-tauri" ]; then
    PROJECT_DIR="$HOME/Projects/waiting-game"
    if [ -d "$PROJECT_DIR" ]; then
        cd "$PROJECT_DIR"
    else
        echo "📂 Searching for project root..."
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
    mkdir -p src
    jq ".activeGame = \"$CONF_GAME\" | .difficulty.initialSpeed = $CONF_SPEED | .showScore = $SCORE_BOOL" src/config.json > src/config.tmp.json && mv src/config.tmp.json src/config.json
else
    echo "⚠️ jq not installed. Default config.json will be used."
fi

echo "🔨 Building production binary with new configuration (this may take a minute)..."
BUILD_CMD="pnpm tauri build"
if ! command -v pnpm >/dev/null; then
    BUILD_CMD="npm run tauri build"
fi

$BUILD_CMD > /dev/null 2>&1 || echo "⚠️ Build failed. You might need to run 'pnpm install' first."

echo "🦖 Initializing Waiting Game - Universal Installation Protocol..."

# --- 1. Check for Hyprland ---
if [ -d "$HOME/.config/hypr" ]; then
    echo "🌊 Hyprland detected. Applying compositor rules for perfect transparency..."
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
    sed -i '/# Waiting Game Overlay Rules/,+19d' "$HYPR_CONF" 2>/dev/null
    echo "$RULES" >> "$HYPR_CONF"
    echo "✅ Applied Hyprland window rules to $HYPR_CONF"
else
    echo "🖥️ Standard Desktop Environment detected (GNOME/KDE/XFCE)."
    echo "✅ No special compositor rules needed. Transparency will be handled natively."
fi

echo "🚀 Installation Complete!"

# --- 2. System Integration ---
BIN_DEST="$HOME/.local/bin"
mkdir -p "$BIN_DEST"
SOURCE_BIN="./src-tauri/target/release/waiting-game"

if [ -f "$SOURCE_BIN" ]; then
    # Install the actual binary as waiting-game-bin
    cp "$SOURCE_BIN" "$BIN_DEST/waiting-game-bin"
    chmod +x "$BIN_DEST/waiting-game-bin"
    
    # Create the wrapper script
    cat > "$BIN_DEST/waiting-game" <<EOF
#!/bin/bash
case "\$1" in
    run)
        if pgrep -x "waiting-game-bin" > /dev/null; then
            echo "🔄 Waiting Game is already running."
        else
            echo "🎮 Starting Waiting Game in background..."
            # nohup and redirection to /dev/null ensures it detaches and stays quiet
            nohup waiting-game-bin >/dev/null 2>&1 &
            disown
        fi
        ;;
    stop)
        if pkill -x "waiting-game-bin"; then
            echo "🛑 Waiting Game stopped."
        else
            echo "💡 Waiting Game is not running."
        fi
        ;;
    *)
        # Default behavior: run if no args
        if [ -z "\$1" ]; then
            if pgrep -x "waiting-game-bin" > /dev/null; then
                echo "🔄 Waiting Game is already running."
            else
                echo "🎮 Starting Waiting Game..."
                nohup waiting-game-bin >/dev/null 2>&1 &
                disown
            fi
        else
            echo "Usage: waiting-game {run|stop}"
        fi
        ;;
esac
EOF
    chmod +x "$BIN_DEST/waiting-game"
    echo "✅ Binary and command wrapper installed to $BIN_DEST/waiting-game"
    
    if [[ ":$PATH:" != *":$BIN_DEST:"* ]]; then
        echo "⚠️  Note: $BIN_DEST is not in your PATH."
    fi

    # Desktop Integration
    echo "🖥️  Integrating with desktop environment..."
    DESKTOP_DIR="$HOME/.local/share/applications"
    ICON_DIR="$HOME/.local/share/icons"
    mkdir -p "$DESKTOP_DIR" "$ICON_DIR"
    
    # Update desktop file to use 'run' command
    sed 's/Exec=waiting-game/Exec=waiting-game run/' "./src-tauri/main.desktop" > "$DESKTOP_DIR/waiting-game.desktop"
    cp "./src-tauri/icons/icon.png" "$ICON_DIR/waiting-game.png"
    echo "✅ Desktop entry and icon installed."
else
    echo "⚠️  Could not find release binary for installation."
fi

# --- 3. Immediate Launch ---
echo "🎮 Starting Waiting Game..."
"$BIN_DEST/waiting-game" run

echo "✨ All set! The app will automatically register to autostart."
echo "Commands: 'waiting-game run' to start, 'waiting-game stop' to quit."
echo "Press Super+Shift+G anywhere to summon the Dino."
