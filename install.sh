#!/bin/bash
# Waiting Game - Hyprland Module Installer & Controller

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
        killall -9 waiting-game-bin 2>/dev/null || true
        echo "🛑 Waiting Game stopped."
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
            ADDR=$(hyprctl clients -j | jq -r '.[] | select(.class == "waiting-game-bin") | .address' | head -n1)
            if [ -n "$ADDR" ]; then
                CLIENT_INFO=$(hyprctl clients -j | jq -r ".[] | select(.address == \"$ADDR\")")
                IS_SPECIAL=$(echo "$CLIENT_INFO" | jq -r '.workspace.name' | grep -c "special:" || true)
                CUR_WS=$(hyprctl activeworkspace -j | jq -r '.name')
                
                if [ "$IS_SPECIAL" -eq 1 ]; then
                    # Hidden -> Show on Current Workspace
                    hyprctl dispatch movetoworkspace "$CUR_WS",address:"$ADDR"
                    hyprctl dispatch focuswindow address:"$ADDR"
                    echo "🔄 Summoned Waiting Game to $CUR_WS."
                else
                    # Visible -> Hide to Scratchpad
                    hyprctl dispatch movetoworkspacesilent special:waiting,address:"$ADDR"
                    echo "🌑 Sent Waiting Game to Scratchpad."
                fi
            fi
        fi
        ;;
    pin)
        if pgrep -f "\.local/bin/waiting-game-bin" > /dev/null; then
            if command -v hyprctl >/dev/null 2>&1; then
                ADDR=$(hyprctl clients -j | jq -r '.[] | select(.class == "waiting-game-bin") | .address' | head -n1)
                if [ -n "$ADDR" ]; then
                    CLIENT_INFO=$(hyprctl clients -j | jq -r ".[] | select(.address == \"$ADDR\")")
                    IS_SPECIAL=$(echo "$CLIENT_INFO" | jq -r '.workspace.name' | grep -c "special:" || true)
                    IS_PINNED=$(echo "$CLIENT_INFO" | jq -r '.pinned')
                    CUR_WS=$(hyprctl activeworkspace -j | jq -r '.name')
                    
                    if [ "$IS_SPECIAL" -eq 1 ]; then
                        # Hidden -> Sticky (Teleport + Pin)
                        hyprctl dispatch movetoworkspace "$CUR_WS",address:"$ADDR"
                        hyprctl dispatch focuswindow address:"$ADDR"
                        sleep 0.1
                        hyprctl dispatch pin address:"$ADDR"
                        echo "📌 Sticky Mode ON (Teleported & Pinned)."
                    elif [ "$IS_PINNED" = "true" ]; then
                        # Sticky -> Local (Unpin)
                        hyprctl dispatch pin address:"$ADDR"
                        echo "📍 Local Mode ON (Fixed to $CUR_WS)."
                    else
                        # Local -> Hidden (Teleport to Scratchpad)
                        hyprctl dispatch movetoworkspacesilent special:waiting,address:"$ADDR"
                        echo "🌑 Hidden Mode ON (Returned to Scratchpad)."
                    fi
                fi
            fi
        fi
        ;;
    -y|--yes|--default)
        echo "⚙️ Waiting Game - Initial Configuration"
        pnpm tauri build --no-bundle
        mkdir -p "$BIN_DEST"
        killall -9 waiting-game-bin 2>/dev/null || true
        sleep 1
        cp "$TAURI_BIN" "$BIN_DEST/waiting-game-bin"
        cat << EOF > "$BIN_DEST/waiting-game"
#!/bin/bash
"$(realpath "$0")" "\$@"
EOF
        chmod +x "$BIN_DEST/waiting-game"
        mkdir -p "$ICON_DEST"
        cp ./src-tauri/icons/icon.png "$ICON_DEST/waiting-game.png"
        mkdir -p "$DESKTOP_DEST"
        cat << EOF > "$DESKTOP_DEST/waiting-game.desktop"
[Desktop Entry]
Name=Waiting Game
Comment=Dino game overlay
Exec=$BIN_DEST/waiting-game run
Icon=waiting-game
Terminal=false
Type=Application
Categories=Game;Utility;
EOF
        if command -v hyprctl >/dev/null 2>&1; then
            echo "💙 Hyprland detected! Applying native integration..."
            mkdir -p "$CONF_DEST"
            sed -i '/waiting-game.conf/d' "$CONF_DEST/hyprland.conf" 2>/dev/null
            sed -i '/waiting-game.conf/d' "$CONF_DEST/userprefs.conf" 2>/dev/null
            sed "s|__BIN_PATH__|$BIN_DEST/waiting-game|g" ./waiting-game.conf > "$CONF_DEST/waiting-game.conf"
            if [ -f "$CONF_DEST/userprefs.conf" ]; then
                echo "source = $CONF_DEST/waiting-game.conf" >> "$CONF_DEST/userprefs.conf"
            else
                echo "source = $CONF_DEST/waiting-game.conf" >> "$CONF_DEST/hyprland.conf"
            fi
        fi
        echo "🚀 Installation Complete!"
        "$BIN_DEST/waiting-game" run >/dev/null 2>&1 &
        ;;
    *)
        echo "Usage: waiting-game {run|stop|status|toggle|pin}"
        exit 1
        ;;
esac
