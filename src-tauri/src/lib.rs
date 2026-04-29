use tauri::{Manager, menu::{Menu, MenuItem}, tray::TrayIconBuilder};
use tauri_plugin_autostart::{MacosLauncher, ManagerExt};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState, Code, Modifiers};

#[tauri::command]
fn hide_window(window: tauri::Window) {
    let _ = window.hide();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_autostart::init(MacosLauncher::LaunchAgent, Some(vec!["--minimized"])))
        .invoke_handler(tauri::generate_handler![hide_window])
        .plugin(tauri_plugin_global_shortcut::Builder::new().with_handler(|app, shortcut, event| {
            if event.state() == ShortcutState::Pressed {
                if shortcut.matches(Modifiers::SUPER | Modifiers::SHIFT, Code::KeyG) {
                    println!("Shortcut triggered: SUPER+SHIFT+G");
                    if let Some(window) = app.get_webview_window("main") {
                        let is_visible = window.is_visible().unwrap_or(false);
                        if is_visible {
                            let _ = window.hide();
                        } else {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                } else if shortcut.matches(Modifiers::SUPER | Modifiers::SHIFT, Code::KeyP) {
                    println!("Shortcut triggered: SUPER+SHIFT+P");
                    if let Some(window) = app.get_webview_window("main") {
                        let is_top = window.is_always_on_top().unwrap_or(false);
                        let _ = window.set_always_on_top(!is_top);
                    }
                }
            }
        }).build())
        .setup(move |app| {
            let app_handle = app.handle().clone();
            
            // Smart Compositor Detection
            let is_hyprland = std::env::var("HYPRLAND_INSTANCE_SIGNATURE").is_ok();
            
            if !is_hyprland {
                // Universal Wayland/X11/Mac/Windows background handling
                let hide_handle = app_handle.clone();
                std::thread::spawn(move || {
                    std::thread::sleep(std::time::Duration::from_millis(150));
                    if let Some(window) = hide_handle.get_webview_window("main") {
                        let _ = window.hide();
                    }
                });
            } else {
                // Hyprland: window maps into special:waiting via windowrule.
                // Then force fullscreen so the compositor disables blur on transparent areas.
                let fs_handle = app_handle.clone();
                std::thread::spawn(move || {
                    std::thread::sleep(std::time::Duration::from_millis(600));
                    if let Some(window) = fs_handle.get_webview_window("main") {
                        let _ = window.set_fullscreen(true);
                    }
                });
            }
            
            let app_handle_1 = app_handle.clone();
            std::thread::spawn(move || {
                loop {
                    if std::path::Path::new("/tmp/waiting-game-toggle").exists() {
                        let _ = std::fs::remove_file("/tmp/waiting-game-toggle");
                        if let Some(window) = app_handle_1.get_webview_window("main") {
                            // On Hyprland, the toggle IPC is bypassed in favor of native scratchpads
                            if !is_hyprland {
                                let is_visible = window.is_visible().unwrap_or(false);
                                if is_visible {
                                    let _ = window.hide();
                                } else {
                                    let _ = window.show();
                                    std::thread::sleep(std::time::Duration::from_millis(100));
                                    let _ = window.set_fullscreen(true);
                                    let _ = window.set_focus();
                                }
                            }
                        }
                    }
                    
                    if std::path::Path::new("/tmp/waiting-game-pin").exists() {
                        let _ = std::fs::remove_file("/tmp/waiting-game-pin");
                            if let Some(window) = app_handle_1.get_webview_window("main") {
                                let is_top = window.is_always_on_top().unwrap_or(false);
                                let _ = window.set_always_on_top(!is_top);
                            }
                        }
                        
                        std::thread::sleep(std::time::Duration::from_millis(50));
                    }
                });

            // Enable autostart
            let _ = app.handle().autolaunch().enable();

            // Register shortcuts explicitly with error handling check
            let toggle_shortcut = tauri_plugin_global_shortcut::Shortcut::new(Some(Modifiers::SUPER | Modifiers::SHIFT), Code::KeyG);
            let sticky_shortcut = tauri_plugin_global_shortcut::Shortcut::new(Some(Modifiers::SUPER | Modifiers::SHIFT), Code::KeyP);
            
            if let Err(e) = app.global_shortcut().register(toggle_shortcut) {
                println!("Failed to register toggle shortcut: {}", e);
            }
            if let Err(e) = app.global_shortcut().register(sticky_shortcut) {
                println!("Failed to register sticky shortcut: {}", e);
            }

            // Create Tray Menu
            let quit_i = MenuItem::with_id(app, "quit", "Quit Waiting Game", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&quit_i])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(true)
                .on_menu_event(|app_handle, event| {
                    if event.id.as_ref() == "quit" {
                        app_handle.exit(0);
                    }
                })
                .build(app)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
