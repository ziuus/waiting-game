use tauri::{Manager, menu::{Menu, MenuItem}, tray::TrayIconBuilder};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};
use tauri_plugin_autostart::{MacosLauncher, ManagerExt};
use std::time::Duration;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // We use the official shortcuts: Super+Shift+G and Super+Shift+P
    let s_g = Shortcut::new(Some(Modifiers::SUPER | Modifiers::SHIFT), Code::KeyG);
    let s_p = Shortcut::new(Some(Modifiers::SUPER | Modifiers::SHIFT), Code::KeyP);

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_autostart::init(MacosLauncher::LaunchAgent, Some(vec!["--minimized"])))
        .plugin(tauri_plugin_global_shortcut::Builder::new()
            .with_handler(move |app, shortcut, event| {
                if event.state() == ShortcutState::Pressed {
                    // Match by comparing the internal key and modifiers directly
                    let is_g = shortcut.key() == Code::KeyG;
                    let is_p = shortcut.key() == Code::KeyP;

                    if let Some(window) = app.get_webview_window("main") {
                        if is_g {
                            let is_visible = window.is_visible().unwrap_or(false);
                            if is_visible { 
                                let _ = window.hide(); 
                            } else { 
                                let _ = window.show(); 
                                let _ = window.set_focus(); 
                            }
                        } else if is_p {
                            let is_on_top = window.is_always_on_top().unwrap_or(false);
                            let _ = window.set_always_on_top(!is_on_top);
                        }
                    }
                }
            })
            .build()
        )
        .setup(move |app| {
            let handle = app.handle().clone();
            
            // Fix GTK Assertion & Register: Wait for system to settle
            tauri::async_runtime::spawn(async move {
                tokio::time::sleep(Duration::from_millis(1500)).await;
                
                let shortcut_manager = handle.global_shortcut();
                
                // Re-register to ensure the OS sees the app as "Active"
                let _ = shortcut_manager.register(Shortcut::new(Some(Modifiers::SUPER | Modifiers::SHIFT), Code::KeyG));
                let _ = shortcut_manager.register(Shortcut::new(Some(Modifiers::SUPER | Modifiers::SHIFT), Code::KeyP));
                
                println!("🚀 Official Shortcuts (Super+Shift+G/P) Active.");

                if let Some(window) = handle.get_webview_window("main") {
                    // Initial visibility state
                    let _ = window.set_always_on_top(true);
                    let _ = window.show();
                    let _ = window.set_focus();
                    // Brief hide to sit in tray
                    tokio::time::sleep(Duration::from_millis(200)).await;
                    let _ = window.hide();
                }
            });

            let _ = app.handle().autolaunch().enable();

            // Tray Menu
            let toggle_i = MenuItem::with_id(app, "toggle", "Toggle Visibility (Super+Shift+G)", true, None::<&str>)?;
            let sticky_i = MenuItem::with_id(app, "sticky", "Toggle Sticky Mode (Super+Shift+P)", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(app, "quit", "Quit Waiting Game", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&toggle_i, &sticky_i, &MenuItem::with_id(app, "sep", "---", false, None::<&str>)?, &quit_i])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(true)
                .on_menu_event(|app_handle, event| {
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
                        _ => {}
                    }
                })
                .build(app)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
