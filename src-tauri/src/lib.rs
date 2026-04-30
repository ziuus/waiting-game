use tauri::{Manager, menu::{Menu, MenuItem}, tray::TrayIconBuilder};
use tauri_plugin_autostart::{MacosLauncher, ManagerExt};

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
        .setup(move |app| {
            let app_handle = app.handle().clone();
            
            // Background control loop
            let app_handle_loop = app_handle.clone();
            std::thread::spawn(move || {
                let temp_dir = std::env::temp_dir();
                let toggle_path = temp_dir.join("waiting-game-toggle");
                let pin_path = temp_dir.join("waiting-game-pin");

                loop {
                    if toggle_path.exists() {
                        let _ = std::fs::remove_file(&toggle_path);
                        if let Some(window) = app_handle_loop.get_webview_window("main") {
                            let is_visible = window.is_visible().unwrap_or(false);
                            if is_visible {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                                let _ = window.set_focus();
                                // Force fullscreen internally for maximum immersion
                                let _ = window.set_fullscreen(true);
                            }
                        }
                    }
                    
                    if pin_path.exists() {
                        let _ = std::fs::remove_file(&pin_path);
                    }
                    
                    std::thread::sleep(std::time::Duration::from_millis(50));
                }
            });

            // Enable autostart
            let _ = app.handle().autolaunch().enable();

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
