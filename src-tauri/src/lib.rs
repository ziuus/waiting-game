use tauri::{Manager, menu::{Menu, MenuItem}, tray::TrayIconBuilder};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};
use tauri_plugin_autostart::{MacosLauncher, ManagerExt};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let ctrl_shift_g = Shortcut::new(Some(Modifiers::SUPER | Modifiers::SHIFT), Code::KeyG);
    let ctrl_shift_p = Shortcut::new(Some(Modifiers::SUPER | Modifiers::SHIFT), Code::KeyP);

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_autostart::init(MacosLauncher::LaunchAgent, Some(vec!["--minimized"])))
        .plugin(tauri_plugin_global_shortcut::Builder::new()
            .with_handler(move |app, shortcut, event| {
                if event.state() == ShortcutState::Pressed {
                    if let Some(window) = app.get_webview_window("main") {
                        if shortcut == &ctrl_shift_g {
                            let is_visible = window.is_visible().unwrap_or(false);
                            if is_visible {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        } else if shortcut == &ctrl_shift_p {
                            let is_on_top = window.is_always_on_top().unwrap_or(false);
                            let _ = window.set_always_on_top(!is_on_top);
                        }
                    }
                }
            })
            .build()
        )
        .setup(|app| {
            // Register shortcuts
            app.global_shortcut().register(ctrl_shift_g)?;
            app.global_shortcut().register(ctrl_shift_p)?;

            // Enable autostart by default (using AppHandle and the correct method name 'autolaunch')
            let _ = app.handle().autolaunch().enable();

            // Create Tray Menu
            let quit_i = MenuItem::with_id(app, "quit", "Quit Waiting Game", true, None::<&str>)?;
            let settings_i = MenuItem::with_id(app, "settings", "Settings Hub", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&settings_i, &quit_i])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(true)
                .on_menu_event(|app_handle: &tauri::AppHandle, event| {
                    match event.id.as_ref() {
                        "quit" => {
                            app_handle.exit(0);
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
