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
        [Yy]*) PIN_RULE="windowrulev2 = pin, class:^(waiting-game)$" ;;
        *)     PIN_RULE=""            ;;
    esac
fi

echo "💾 Saving configuration..."
if command -v jq >/dev/null; then
    mkdir -p src
    jq ".activeGame = \"$CONF_GAME\" | .difficulty.initialSpeed = $CONF_SPEED | .showScore = $SCORE_BOOL | .background.opacity = 0 | .background.color = \"0, 0, 0\"" src/config.json > src/config.tmp.json && mv src/config.tmp.json src/config.json
else
    echo "⚠️ jq not installed. Default config.json will be used."
fi

echo "🔨 Building production binary with new configuration (this may take a minute)..."
BUILD_CMD="pnpm tauri build --no-bundle"
if ! command -v pnpm >/dev/null; then
    BUILD_CMD="npm run tauri build --no-bundle"
fi

if ! $BUILD_CMD; then
    echo "❌ Build failed. Please check the logs above."
    exit 1
fi

echo "🦖 Initializing Waiting Game - Universal Installation Protocol..."

    echo "✅ Universal setup: No compositor-specific rules applied."

echo "🚀 Installation Complete!"

# --- 2. System Integration ---
BIN_DEST="$HOME/.local/bin"
mkdir -p "$BIN_DEST"
SOURCE_BIN="./src-tauri/target/release/waiting-game"

if [ -f "$SOURCE_BIN" ]; then
    # Kill existing process and strictly unlink the old file to prevent "Text file busy"
    pkill -9 -f "\.local/bin/waiting-game-bin" 2>/dev/null || true
    rm -f "$BIN_DEST/waiting-game-bin"
    
    # Install the actual binary as waiting-game-bin
    cp "$SOURCE_BIN" "$BIN_DEST/waiting-game-bin"
    chmod +x "$BIN_DEST/waiting-game-bin"
    
    # Create the wrapper script
    cat > "$BIN_DEST/waiting-game" <<EOF
#!/bin/bash
case "\$1" in
    run)
        if pgrep -f "\.local/bin/waiting-game-bin" > /dev/null; then
            echo "✅ Waiting Game daemon is already running."
        else
            echo "🎮 Starting Waiting Game in background..."
            nohup "$BIN_DEST/waiting-game-bin" >/dev/null 2>&1 &
            disown
        fi
        ;;
    stop)
        if pkill -9 -f "\.local/bin/waiting-game-bin"; then
            echo "🛑 Waiting Game stopped."
        else
            echo "💡 Waiting Game is not running."
        fi
        ;;
    status)
        if pgrep -f "\.local/bin/waiting-game-bin" > /dev/null; then
            echo "🟢 Waiting Game is running."
        else
            echo "🔴 Waiting Game is NOT running."
        fi
        ;;
    toggle)
        if pgrep -f "\.local/bin/waiting-game-bin" > /dev/null; then
            touch /tmp/waiting-game-toggle
            echo "🔄 Toggled Waiting Game visibility."
        else
            echo "💡 Daemon not running. Starting it now..."
            nohup "$BIN_DEST/waiting-game-bin" >/dev/null 2>&1 &
            disown
            (sleep 1 && touch /tmp/waiting-game-toggle) &
        fi
        ;;
    pin)
        if pgrep -f "\.local/bin/waiting-game-bin" > /dev/null; then
            if command -v hyprctl >/dev/null 2>&1; then
                # 3-State Cycle: Hidden (Special) -> Sticky (Pinned) -> Local (Individual) -> Hidden
                DATA=$(hyprctl clients -j | python3 -c "import sys,json;ws=[(c['address'], c.get('pinned', False), c.get('workspace', {}).get('name', '')) for c in json.load(sys.stdin) if 'waiting' in c.get('class','')]; print(f'{ws[0][0]}|{ws[0][1]}|{ws[0][2]}' if ws else '')" 2>/dev/null)
                ADDR=$(echo "$DATA" | cut -d'|' -f1)
                PINNED=$(echo "$DATA" | cut -d'|' -f2)
                WS_NAME=$(echo "$DATA" | cut -d'|' -f3)
                
                if [ -n "$ADDR" ]; then
                    CUR_WS=$(hyprctl activeworkspace -j | python3 -c "import sys,json; print(json.load(sys.stdin)['name'])" 2>/dev/null)
                    
                    if [[ "$WS_NAME" == special:* ]]; then
                        # State: Hidden -> Sticky
                        hyprctl dispatch movetoworkspacesilent "$CUR_WS",class:waiting-game-bin
                        hyprctl dispatch focuswindow class:waiting-game-bin
                        hyprctl dispatch pin
                        echo "📌 Sticky Mode ON (Following user)."
                    elif [ "$PINNED" = "True" ]; then
                        # State: Sticky -> Local
                        hyprctl dispatch focuswindow class:waiting-game-bin
                        hyprctl dispatch pin
                        echo "📍 Local Mode ON (Fixed to $WS_NAME)."
                    else
                        # State: Local -> Hidden
                        hyprctl dispatch movetoworkspacesilent special:waiting,class:waiting-game-bin
                        echo "🌑 Hidden Mode ON (Back to scratchpad)."
                    fi
                else
                    touch /tmp/waiting-game-pin
                fi
            else
                touch /tmp/waiting-game-pin
                echo "📌 Toggled pin status (IPC)."
            fi
        fi
        ;;
    *)
        echo "Usage: waiting-game {run|stop|status|toggle|pin}"
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

    # Hyprland Integration
    if command -v hyprctl >/dev/null 2>&1; then
        echo "💙 Hyprland detected! Applying native integration..."
        HYPR_CONF="$HOME/.config/hypr/userprefs.conf"
        if [ -f "$HYPR_CONF" ]; then
            # Copy dedicated config for plugin-style integration
            mkdir -p "$HOME/.config/hypr"
            sed "s|__BIN_PATH__|$BIN_DEST/waiting-game|g" "waiting-game.conf" > "$HOME/.config/hypr/waiting-game.conf"
            
            # Remove direct entries if they exist and suggest sourcing
            sed -i '/Waiting Game Native Integration/,/EOF/d' "$HYPR_CONF"
            if ! grep -q "source = ~/.config/hypr/waiting-game.conf" "$HYPR_CONF"; then
                echo "" >> "$HYPR_CONF"
                echo "# Waiting Game Hyprland Module" >> "$HYPR_CONF"
                echo "source = ~/.config/hypr/waiting-game.conf" >> "$HYPR_CONF"
            fi
            
            hyprctl reload >/dev/null 2>&1 || true
            echo "✅ Integrated as a Hyprland module! Sourced in userprefs.conf"
        fi
    fi
else
    echo "⚠️  Could not find release binary for installation."
fi

# --- 3. Immediate Launch ---
echo "🎮 Starting Waiting Game..."
"$BIN_DEST/waiting-game" run

echo "✨ All set! The app will automatically register to autostart."
echo "Commands: 'waiting-game run' to start, 'waiting-game stop' to quit."
echo "Press Super+Shift+G anywhere to summon the Dino."
