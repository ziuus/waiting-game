use tauri::{Manager, menu::{Menu, MenuItem}, tray::TrayIconBuilder};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};
use tauri_plugin_autostart::{MacosLauncher, ManagerExt};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Primary: Super+Shift+G
    let super_g = Shortcut::new(Some(Modifiers::SUPER | Modifiers::SHIFT), Code::KeyG);
    let super_p = Shortcut::new(Some(Modifiers::SUPER | Modifiers::SHIFT), Code::KeyP);
    
    // Fallback: Alt+Shift+G (More reliable on some Linux distros)
    let alt_g = Shortcut::new(Some(Modifiers::ALT | Modifiers::SHIFT), Code::KeyG);
    let alt_p = Shortcut::new(Some(Modifiers::ALT | Modifiers::SHIFT), Code::KeyP);

    let g_handler = super_g.clone();
    let p_handler = super_p.clone();
    let g_alt_handler = alt_g.clone();
    let p_alt_handler = alt_p.clone();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_autostart::init(MacosLauncher::LaunchAgent, Some(vec!["--minimized"])))
        .plugin(tauri_plugin_global_shortcut::Builder::new()
            .with_handler(move |app, shortcut, event| {
                if event.state() == ShortcutState::Pressed {
                    if let Some(window) = app.get_webview_window("main") {
                        if shortcut == &g_handler || shortcut == &g_alt_handler {
                            let is_visible = window.is_visible().unwrap_or(false);
                            if is_visible {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        } else if shortcut == &p_handler || shortcut == &p_alt_handler {
                            let is_on_top = window.is_always_on_top().unwrap_or(false);
                            let _ = window.set_always_on_top(!is_on_top);
                        }
                    }
                }
            })
            .build()
        )
        .setup(move |app| {
            let shortcut_manager = app.global_shortcut();
            
            // Try to register Super shortcuts
            let _ = shortcut_manager.register(super_g);
            let _ = shortcut_manager.register(super_p);
            
            // Try to register Alt fallbacks
            let _ = shortcut_manager.register(alt_g);
            let _ = shortcut_manager.register(alt_p);

            // Enable autostart
            let _ = app.handle().autolaunch().enable();

            // Create Tray Menu with visible hints
            let toggle_i = MenuItem::with_id(app, "toggle", "Toggle Visibility (Super/Alt+Shift+G)", true, None::<&str>)?;
            let sticky_i = MenuItem::with_id(app, "sticky", "Toggle Sticky Mode (Super/Alt+Shift+P)", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(app, "quit", "Quit Waiting Game", true, None::<&str>)?;
            let settings_i = MenuItem::with_id(app, "settings", "Settings Hub", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&toggle_i, &sticky_i, &MenuItem::with_id(app, "sep", "---", false, None::<&str>)?, &settings_i, &quit_i])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(true)
                .on_menu_event(|app_handle: &tauri::AppHandle, event| {
                    match event.id.as_ref() {
                        "quit" => { app_handle.exit(0); }
                        "toggle" => {
                            if let Some(window) = app_handle.get_webview_window("main") {
                                let is_visible = window.is_visible().unwrap_or(false);
                                if is_visible { let _ = window.hide(); } else { let _ = window.show(); let _ = window.set_focus(); }
                            }
                        }
                        "sticky" => {
                            if let Some(window) = app_handle.get_webview_window("main") {
                                let is_on_top = window.is_always_on_top().unwrap_or(false);
                                let _ = window.set_always_on_top(!is_on_top);
                            }
                        }
                        "settings" => {
                            if let Some(settings_window) = app_handle.get_webview_window("settings") {
                                let _ = settings_window.show();
                                let _ = settings_window.set_focus();
                            }
                        }
                        _ => {}
                    }
                })
                .build(app)?;

            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_always_on_top(true);
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
