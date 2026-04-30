#!/bin/bash
# Waiting Game - Hyprland Module Installer & Controller
# This script handles building, installing, and managing the game's state.

BIN_NAME="waiting-game"
BIN_DEST="$HOME/.local/bin"
CONF_DEST="$HOME/.config/hypr"
ICON_DEST="$HOME/.local/share/icons"
DESKTOP_DEST="$HOME/.local/share/applications"

# Default paths
BINARY_PATH="$BIN_DEST/waiting-game"
TAURI_BIN="./src-tauri/target/release/waiting-game"

case "$1" in
    run)
        if pgrep -f "\.local/bin/waiting-game-bin" > /dev/null; then
            echo "✅ Waiting Game daemon is already running"
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
                # Use jq for reliable state detection
                ADDR=$(hyprctl clients -j | jq -r '.[] | select(.class == "waiting-game-bin") | .address' | head -n1)
                
                if [ -n "$ADDR" ]; then
                    # Get state for THIS specific address
                    CLIENT_INFO=$(hyprctl clients -j | jq -r ".[] | select(.address == \"$ADDR\")")
                    IS_SPECIAL=$(echo "$CLIENT_INFO" | jq -r '.workspace.name' | grep -c "special:" || true)
                    IS_PINNED=$(echo "$CLIENT_INFO" | jq -r '.pinned')
                    CUR_WS=$(hyprctl activeworkspace -j | jq -r '.name')
                    
                    if [ "$IS_SPECIAL" -eq 1 ]; then
                        # State: Hidden -> Sticky
                        hyprctl dispatch movetoworkspacesilent "$CUR_WS",address:"$ADDR"
                        hyprctl dispatch focuswindow address:"$ADDR"
                        sleep 0.1
                        hyprctl dispatch pin address:"$ADDR"
                        hyprctl dispatch fullscreen 2 address:"$ADDR"
                        echo "📌 Sticky Mode ON (Following user)."
                    elif [ "$IS_PINNED" = "true" ]; then
                        # State: Sticky -> Local
                        hyprctl dispatch focuswindow address:"$ADDR"
                        sleep 0.1
                        hyprctl dispatch pin address:"$ADDR"
                        hyprctl dispatch fullscreen 2 address:"$ADDR"
                        echo "📍 Local Mode ON (Fixed to $CUR_WS)."
                    else
                        # State: Local -> Hidden
                        hyprctl dispatch movetoworkspacesilent special:waiting,address:"$ADDR"
                        echo "🌑 Hidden Mode ON (Back to scratchpad)."
                    fi
                else
                    touch /tmp/waiting-game-pin
                fi
            fi
        fi
        ;;
    -y|--yes|--default)
        echo "⚙️ Waiting Game - Initial Configuration"
        echo "⏩ Using default configuration (--default passed)"
        echo "💾 Saving configuration..."
        
        # Build binary
        echo "🔨 Building production binary with new configuration (this may take a minute)..."
        pnpm tauri build --no-bundle
        
        # Install binary
        mkdir -p "$BIN_DEST"
        killall -9 waiting-game-bin 2>/dev/null || true
        sleep 1
        cp "$TAURI_BIN" "$BIN_DEST/waiting-game-bin"
        
        # Create wrapper
        cat << EOF > "$BIN_DEST/waiting-game"
#!/bin/bash
"$(realpath "$0")" "\$@"
EOF
        chmod +x "$BIN_DEST/waiting-game"
        
        # Install Assets
        mkdir -p "$ICON_DEST"
        cp ./src-tauri/icons/icon.png "$ICON_DEST/waiting-game.png"
        
        # Desktop Entry
        mkdir -p "$DESKTOP_DEST"
        cat << EOF > "$DESKTOP_DEST/waiting-game.desktop"
[Desktop Entry]
Name=Waiting Game
Comment=Dino game overlay for long waits
Exec=$BIN_DEST/waiting-game run
Icon=waiting-game
Terminal=false
Type=Application
Categories=Game;Utility;
EOF

        # Hyprland Integration
        if command -v hyprctl >/dev/null 2>&1; then
            echo "💙 Hyprland detected! Applying native integration..."
            mkdir -p "$CONF_DEST"
            
            # Clean up old source lines
            sed -i '/waiting-game.conf/d' "$CONF_DEST/hyprland.conf" 2>/dev/null
            sed -i '/waiting-game.conf/d' "$CONF_DEST/userprefs.conf" 2>/dev/null
            
            # Use current path in config
            sed "s|__BIN_PATH__|$BIN_DEST/waiting-game|g" ./waiting-game.conf > "$CONF_DEST/waiting-game.conf"
            
            # Sourcing the config
            if [ -f "$CONF_DEST/userprefs.conf" ]; then
                echo "source = $CONF_DEST/waiting-game.conf" >> "$CONF_DEST/userprefs.conf"
                echo "✅ Integrated as a Hyprland module! Sourced in userprefs.conf"
            else
                echo "source = $CONF_DEST/waiting-game.conf" >> "$CONF_DEST/hyprland.conf"
                echo "✅ Integrated as a Hyprland module! Sourced in hyprland.conf"
            fi
        fi

        echo "🚀 Installation Complete!"
        echo "✅ Binary and command wrapper installed to $BIN_DEST/waiting-game"
        if [[ ":$PATH:" != *":$BIN_DEST:"* ]]; then
            echo "⚠️  Note: $BIN_DEST is not in your PATH."
        fi
        
        echo "🎮 Starting Waiting Game in background..."
        "$BIN_DEST/waiting-game" run >/dev/null 2>&1 &
        
        echo "✨ All set! The app will automatically register to autostart."
        echo "Commands: 'waiting-game run' to start, 'waiting-game stop' to quit."
        echo "Press Super+Shift+G anywhere to summon the Dino."
        ;;
    *)
        echo "Usage: waiting-game {run|stop|status|toggle|pin}"
        exit 1
        ;;
esac
