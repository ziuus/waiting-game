#include <hyprland/src/plugins/PluginAPI.hpp>
#include <hyprland/src/Compositor.hpp>
#include <hyprland/src/desktop/Window.hpp>
#include <hyprland/src/config/ConfigManager.hpp>
#include <hyprland/src/render/Renderer.hpp>

#include <iostream>
#include <string>
#include <vector>

HANDLE PHANDLE = nullptr;

// Find the Waiting Game window
PHLWINDOW findDinoWindow() {
    for (auto& w : g_pCompositor->m_vWindows) {
        if (w->m_szClass == "waiting-game-bin") {
            return w;
        }
    }
    return nullptr;
}

// Universal Toggle Dispatcher
void toggleDino(std::string args) {
    auto pWindow = findDinoWindow();
    if (!pWindow) {
        // Try to start it if not running
        system("waiting-game run &");
        return;
    }

    const auto PWORKSPACE = pWindow->m_pWorkspace;
    if (!PWORKSPACE) return;

    if (PWORKSPACE->m_szName.find("special:") != std::string::npos) {
        // Hidden -> Summon to current
        const auto PACTIVEWS = g_pCompositor->m_pLastMonitor->activeWorkspace;
        if (PACTIVEWS) {
            g_pCompositor->moveWindowToWorkspace(pWindow, PACTIVEWS);
            g_pCompositor->focusWindow(pWindow);
        }
    } else {
        // Visible -> Hide to scratchpad
        const auto PSPECIAL = g_pCompositor->getWorkspaceByName("special:waiting");
        if (PSPECIAL) {
            g_pCompositor->moveWindowToWorkspace(pWindow, PSPECIAL);
        }
    }
}

// Universal Pin Dispatcher
void pinDino(std::string args) {
    auto pWindow = findDinoWindow();
    if (!pWindow) return;

    const auto PWORKSPACE = pWindow->m_pWorkspace;
    if (!PWORKSPACE) return;

    if (PWORKSPACE->m_szName.find("special:") != std::string::npos) {
        // Hidden -> Sticky
        const auto PACTIVEWS = g_pCompositor->m_pLastMonitor->activeWorkspace;
        if (PACTIVEWS) {
            g_pCompositor->moveWindowToWorkspace(pWindow, PACTIVEWS);
            pWindow->m_bPinned = true;
            g_pCompositor->focusWindow(pWindow);
        }
    } else if (pWindow->m_bPinned) {
        // Sticky -> Local
        pWindow->m_bPinned = false;
    } else {
        // Local -> Hidden
        const auto PSPECIAL = g_pCompositor->getWorkspaceByName("special:waiting");
        if (PSPECIAL) {
            g_pCompositor->moveWindowToWorkspace(pWindow, PSPECIAL);
        }
    }
}

APICALL EXPORT PLUGIN_DESCRIPTION_INFO pluginInfo() {
    return {"Waiting Game", "Native cinematic Dino overlay integration", "ziuus", "0.4.0"};
}

APICALL EXPORT PLUGIN_API_VERSION() {
    return HYPRLAND_API_VERSION;
}

APICALL EXPORT PLUGIN_INIT(HANDLE handle) {
    PHANDLE = handle;

    HyprlandAPI::addDispatcher(PHANDLE, "waiting-game:toggle", toggleDino);
    HyprlandAPI::addDispatcher(PHANDLE, "waiting-game:pin", pinDino);

    HyprlandAPI::addConfigValue(PHANDLE, "plugin:waiting-game:autostart", Hyprlang::INT{1});

    // Notify user
    HyprlandAPI::addNotification(PHANDLE, "Waiting Game Plugin Loaded!", CColor(0.2f, 0.8f, 0.2f, 1.0f), 5000);

    return {.name = "Waiting Game"};
}

APICALL EXPORT PLUGIN_EXIT() {
    // Cleanup if needed
}
