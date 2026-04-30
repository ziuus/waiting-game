#include <hyprland/src/plugins/PluginAPI.hpp>
#include <hyprland/src/Compositor.hpp>
#include <hyprland/src/desktop/view/Window.hpp>
#include <hyprland/src/config/ConfigManager.hpp>
#include <hyprland/src/render/Renderer.hpp>
#include <hyprland/src/helpers/Color.hpp>
#include <hyprgraphics/color/Color.hpp>

#include <iostream>
#include <string>
#include <vector>

HANDLE PHANDLE = nullptr;

// Find the Waiting Game window
PHLWINDOW findDinoWindow() {
    for (auto& w : g_pCompositor->m_windows) {
        if (w && w->m_class == "waiting-game-bin") {
            return w;
        }
    }
    return nullptr;
}

// Universal Toggle Dispatcher
void toggleDino(std::string args) {
    auto pWindow = findDinoWindow();
    if (!pWindow) {
        system("waiting-game run &");
        return;
    }

    const auto PWORKSPACE = pWindow->m_workspace;
    if (!PWORKSPACE) return;

    if (PWORKSPACE->m_name.find("special:") != std::string::npos) {
        // Hidden -> Summon to current monitor's active workspace
        const auto PMONITOR = g_pCompositor->getMonitorFromCursor();
        if (PMONITOR && PMONITOR->m_activeWorkspace) {
            pWindow->moveToWorkspace(PMONITOR->m_activeWorkspace);
        }
    } else {
        // Visible -> Hide to scratchpad
        const auto PSPECIAL = g_pCompositor->getWorkspaceByName("special:waiting");
        if (PSPECIAL) {
            pWindow->moveToWorkspace(PSPECIAL);
        }
    }
}

// Universal Pin Dispatcher
void pinDino(std::string args) {
    auto pWindow = findDinoWindow();
    if (!pWindow) return;

    const auto PWORKSPACE = pWindow->m_workspace;
    if (!PWORKSPACE) return;

    if (PWORKSPACE->m_name.find("special:") != std::string::npos) {
        // Hidden -> Sticky
        const auto PMONITOR = g_pCompositor->getMonitorFromCursor();
        if (PMONITOR && PMONITOR->m_activeWorkspace) {
            pWindow->moveToWorkspace(PMONITOR->m_activeWorkspace);
            pWindow->m_pinned = true;
        }
    } else if (pWindow->m_pinned) {
        // Sticky -> Local
        pWindow->m_pinned = false;
    } else {
        // Local -> Hidden
        const auto PSPECIAL = g_pCompositor->getWorkspaceByName("special:waiting");
        if (PSPECIAL) {
            pWindow->moveToWorkspace(PSPECIAL);
        }
    }
}

APICALL EXPORT PLUGIN_DESCRIPTION_INFO pluginInfo() {
    return {"Waiting Game", "Native cinematic Dino overlay integration", "ziuus", "0.4.6"};
}

APICALL EXPORT const char* pluginAPIVersion() {
    return HYPRLAND_API_VERSION;
}

APICALL EXPORT PLUGIN_DESCRIPTION_INFO pluginInit(HANDLE handle) {
    PHANDLE = handle;

    HyprlandAPI::addDispatcher(PHANDLE, "waiting-game:toggle", toggleDino);
    HyprlandAPI::addDispatcher(PHANDLE, "waiting-game:pin", pinDino);

    // Notify user safely
    HyprlandAPI::addNotification(PHANDLE, "Waiting Game Plugin Loaded!", CHyprColor(0.2f, 0.8f, 0.2f, 1.0f), 5000);

    return pluginInfo();
}

APICALL EXPORT void pluginExit() {
    // Cleanup
}
