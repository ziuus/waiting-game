#!/bin/bash

# Waiting Game - Ultimate Installer for Hyprland
# This script configures transparency, no-blur rules, and native keybindings.

echo "🦖 Initializing Waiting Game - System Integration Protocol..."

# 1. Paths
HYPR_PREFS="$HOME/.config/hypr/userprefs.conf"
HYPR_KEYS="$HOME/.config/hypr/keybindings.conf"

# 2. Window Rules (Modern windowrulev2 syntax)
RULES="
# Waiting Game Overlay Rules
windowrulev2 = float, class:^(waiting-game)$
windowrulev2 = workspace special:waiting-game silent, class:^(waiting-game)$
windowrulev2 = size 100% 100%, class:^(waiting-game)$
windowrulev2 = move 0 0, class:^(waiting-game)$
windowrulev2 = noblur, class:^(waiting-game)$
windowrulev2 = noborder, class:^(waiting-game)$
windowrulev2 = noshadow, class:^(waiting-game)$
windowrulev2 = nodim, class:^(waiting-game)$
windowrulev2 = opacity 1.0 override 1.0 override, class:^(waiting-game)$
windowrulev2 = pin, class:^(waiting-game)$
windowrulev2 = keepaspectratio, class:^(waiting-game)$
"

# 3. Keybindings
BINDINGS="
# Waiting Game Smart Toggles
bindd = \$mainMod SHIFT, G, toggle waiting game, exec, ~/.config/hypr/scripts/toggle-waiting-game.sh
bindd = \$mainMod SHIFT, P, toggle pinning waiting game, exec, ~/.config/hypr/scripts/toggle-pin-waiting-game.sh
"

# 4. Apply Configuration
echo "🛠️ Applying System Rules..."
# Clean up old rules if they exist to avoid duplicates
sed -i '/# Waiting Game Overlay Rules/,+12d' "$HYPR_PREFS" 2>/dev/null

echo "$RULES" >> "$HYPR_PREFS"
echo "✅ Applied modern window rules to $HYPR_PREFS"

if ! grep -q "toggle waiting game" "$HYPR_KEYS" 2>/dev/null; then
    echo "$BINDINGS" >> "$HYPR_KEYS"
    echo "✅ Added keybindings to $HYPR_KEYS"
fi

# 5. Enable Autostart
if ! grep -q "exec-once = waiting-game" "$HYPR_PREFS" 2>/dev/null; then
    echo "exec-once = waiting-game" >> "$HYPR_PREFS"
    echo "✅ Enabled autostart in $HYPR_PREFS"
fi

echo "🚀 Installation Complete!"

# 6. Immediate Launch (Only if not running)
if ! pgrep -x "waiting-game" > /dev/null; then
    echo "🎮 Starting Waiting Game in background..."
    # Try common paths
    if [ -f "./src-tauri/target/debug/waiting-game" ]; then
        ./src-tauri/target/debug/waiting-game &
    elif command -v waiting-game >/dev/null 2>&1; then
        waiting-game &
    else
        echo "💡 Game binary not found. Run 'pnpm tauri dev' to start."
    fi
else
    echo "🔄 Waiting Game is already running."
fi

echo "✨ All set! Press Super+Shift+G to summon the Dino."
