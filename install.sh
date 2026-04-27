#!/bin/bash

# Waiting Game - Ultimate Installer for Hyprland
# This script configures transparency, no-blur rules, and native keybindings.

echo "🦖 Initializing Waiting Game - System Integration Protocol..."

# 1. Paths
HYPR_PREFS="$HOME/.config/hypr/userprefs.conf"
HYPR_KEYS="$HOME/.config/hypr/keybindings.conf"

# 2. Window Rules (Fix transparency, blur, borders, and positioning)
RULES="
# Waiting Game Overlay Rules
windowrule = float, ^(waiting-game)$
windowrule = workspace special:waiting-game silent, ^(waiting-game)$
windowrule = size 100% 100%, ^(waiting-game)$
windowrule = move 0 0, ^(waiting-game)$
windowrule = noblur, ^(waiting-game)$
windowrule = noborder, ^(waiting-game)$
windowrule = noshadow, ^(waiting-game)$
windowrule = nodim, ^(waiting-game)$
windowrule = opacity 1.0 override 1.0 override, ^(waiting-game)$
windowrule = pin, ^(waiting-game)$
windowrule = keepaspectratio, ^(waiting-game)$
"

# 3. Keybindings
BINDINGS="
# Waiting Game Smart Toggles
bindd = \$mainMod SHIFT, G, toggle waiting game, exec, ~/.config/hypr/scripts/toggle-waiting-game.sh
bindd = \$mainMod SHIFT, P, toggle pinning waiting game, exec, ~/.config/hypr/scripts/toggle-pin-waiting-game.sh
"

# 4. Apply Configuration
echo "🛠️ Applying System Rules..."
if ! grep -q "Waiting Game Overlay Rules" "$HYPR_PREFS" 2>/dev/null; then
    echo "$RULES" >> "$HYPR_PREFS"
    echo "✅ Applied window rules to $HYPR_PREFS"
fi

if ! grep -q "toggle waiting game" "$HYPR_KEYS" 2>/dev/null; then
    echo "$BINDINGS" >> "$HYPR_KEYS"
    echo "✅ Added keybindings to $HYPR_KEYS"
fi

# 5. Enable Autostart
if ! grep -q "exec-once = waiting-game" "$HYPR_PREFS" 2>/dev/null; then
    echo "exec-once = waiting-game" >> "$HYPR_PREFS"
    echo "✅ Enabled autostart in $HYPR_PREFS"
fi

echo "🚀 Installation Complete! The game will now be perfectly transparent and borderless."

# 6. Immediate Launch
if ! pgrep -x "waiting-game" > /dev/null; then
    echo "🎮 Starting Waiting Game in background..."
    # Try to launch from PATH, then common AppImage locations
    if command -v waiting-game >/dev/null 2>&1; then
        waiting-game &
    elif [ -f "$HOME/AppImages/waitinggame.appimage" ]; then
        "$HOME/AppImages/waitinggame.appimage" &
    elif [ -f "./src-tauri/target/release/waiting-game" ]; then
        "./src-tauri/target/release/waiting-game" &
    else
        echo "💡 Game process not found in common paths. Please launch it manually once to activate the tray icon."
    fi
else
    echo "🔄 Waiting Game is already running. Shortcuts are now active."
fi

echo "✨ All set! Press Super+Shift+G to summon the Dino."
