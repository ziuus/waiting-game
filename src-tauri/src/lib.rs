use tauri::{Manager, menu::{Menu, MenuItem}, tray::TrayIconBuilder};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};
use tauri_plugin_autostart::{MacosLauncher, ManagerExt};
use std::time::Duration;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Define the official shortcuts
    let s_g = Shortcut::new(Some(Modifiers::SUPER | Modifiers::SHIFT), Code::KeyG);
    let s_p = Shortcut::new(Some(Modifiers::SUPER | Modifiers::SHIFT), Code::KeyP);

    // Clones for comparison in the handler
    let h_g = s_g.clone();
    let h_p = s_p.clone();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_autostart::init(MacosLauncher::LaunchAgent, Some(vec!["--minimized"])))
        .plugin(tauri_plugin_global_shortcut::Builder::new()
            .with_handler(move |app, shortcut, event| {
                if event.state() == ShortcutState::Pressed {
                    println!("🎯 APP RECEIVED SHORTCUT: {:?}", shortcut);
                    
                    if let Some(window) = app.get_webview_window("main") {
                        if shortcut == &h_g {
                            let is_visible = window.is_visible().unwrap_or(false);
                            if is_visible { let _ = window.hide(); } else { let _ = window.show(); let _ = window.set_focus(); }
                        } else if shortcut == &h_p {
                            let is_on_top = window.is_always_on_top().unwrap_or(false);
                            let _ = window.set_always_on_top(!is_on_top);
                            println!("📍 Sticky Mode Toggled: {}", !is_on_top);
                        }
                    }
                }
            })
            .build()
        )
        .setup(move |app| {
            let handle = app.handle().clone();
            
            // Register shortcuts after a Safe-Start delay
            tauri::async_runtime::spawn(async move {
                tokio::time::sleep(Duration::from_millis(1500)).await;
                
                let _ = handle.global_shortcut().register(s_g);
                let _ = handle.global_shortcut().register(s_p);
                
                println!("✅ Shortcuts registered after Safe-Start delay.");
                
                if let Some(window) = handle.get_webview_window("main") {
                    let _ = window.set_always_on_top(true);
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
