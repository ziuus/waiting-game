use tauri::{Manager, menu::{Menu, MenuItem}, tray::TrayIconBuilder};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};
use tauri_plugin_autostart::{MacosLauncher, ManagerExt};
use std::time::Duration;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Define shortcuts
    let s_g = Shortcut::new(Some(Modifiers::SUPER | Modifiers::SHIFT), Code::KeyG);
    let s_p = Shortcut::new(Some(Modifiers::SUPER | Modifiers::SHIFT), Code::KeyP);
    let a_g = Shortcut::new(Some(Modifiers::ALT | Modifiers::SHIFT), Code::KeyG);
    let a_p = Shortcut::new(Some(Modifiers::ALT | Modifiers::SHIFT), Code::KeyP);
    let c_g = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyG);
    let c_p = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyP);

    // Clones for handler comparison
    let h_s_g = s_g.clone(); let h_a_g = a_g.clone(); let h_c_g = c_g.clone();
    let h_s_p = s_p.clone(); let h_a_p = a_p.clone(); let h_c_p = c_p.clone();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_autostart::init(MacosLauncher::LaunchAgent, Some(vec!["--minimized"])))
        .plugin(tauri_plugin_global_shortcut::Builder::new()
            .with_handler(move |app, shortcut, event| {
                if event.state() == ShortcutState::Pressed {
                    println!("🔔 Global Shortcut Triggered: {:?}", shortcut);
                    if let Some(window) = app.get_webview_window("main") {
                        if shortcut == &h_s_g || shortcut == &h_a_g || shortcut == &h_c_g {
                            let is_visible = window.is_visible().unwrap_or(false);
                            if is_visible { let _ = window.hide(); } else { let _ = window.show(); let _ = window.set_focus(); }
                        } else if shortcut == &h_s_p || shortcut == &h_a_p || shortcut == &h_c_p {
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
            
            // Fix GTK Assertion Error: Wait for window to map before setting always-on-top
            tauri::async_runtime::spawn(async move {
                tokio::time::sleep(Duration::from_millis(500)).await;
                if let Some(window) = handle.get_webview_window("main") {
                    let _ = window.set_always_on_top(true);
                    println!("✨ Window mapped and pinned to top successfully.");
                }
            });

            // Register shortcuts
            let shortcut_manager = app.global_shortcut();
            let _ = shortcut_manager.register(s_g);
            let _ = shortcut_manager.register(s_p);
            let _ = shortcut_manager.register(a_g);
            let _ = shortcut_manager.register(a_p);
            let _ = shortcut_manager.register(c_g);
            let _ = shortcut_manager.register(c_p);

            if std::env::var("WAYLAND_DISPLAY").is_ok() {
                println!("🌐 Wayland Detected: If shortcuts fail, use the Tray Menu or bind Super+Shift+G/P in your Compositor settings.");
            }

            let _ = app.handle().autolaunch().enable();

            // Create Tray Menu
            let toggle_i = MenuItem::with_id(app, "toggle", "Toggle Visibility (Super/Alt/Ctrl+Shift+G)", true, None::<&str>)?;
            let sticky_i = MenuItem::with_id(app, "sticky", "Toggle Sticky Mode (Super/Alt/Ctrl+Shift+P)", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(app, "quit", "Quit Waiting Game", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&toggle_i, &sticky_i, &MenuItem::with_id(app, "sep", "---", false, None::<&str>)?, &quit_i])?;

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
                        _ => {}
                    }
                })
                .build(app)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
