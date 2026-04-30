use tauri::{Manager, menu::{Menu, MenuItem}, tray::TrayIconBuilder};
use tauri_plugin_autostart::{MacosLauncher, ManagerExt};
use std::io::Write;

#[tauri::command]
fn hide_window(window: tauri::Window) {
    let _ = window.hide();
}

pub fn run() {
    let args: Vec<String> = std::env::args().collect();
    
    // Pure CLI Signal (Communicates with running instance via temp files for simplicity)
    if args.len() > 1 {
        let action = &args[1];
        if action == "toggle" || action == "pin" {
            let temp_dir = std::env::temp_dir();
            let mut file = std::fs::File::create(temp_dir.join(format!("waiting-game-{}", action))).unwrap();
            let _ = file.write_all(b"1");
            return;
        }
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_autostart::init(MacosLauncher::LaunchAgent, Some(vec!["--minimized"])))
        .invoke_handler(tauri::generate_handler![hide_window])
        .setup(move |app| {
            let app_handle = app.handle().clone();
            
            // Listen for signals from the CLI binary
            std::thread::spawn(move || {
                let temp_dir = std::env::temp_dir();
                loop {
                    // We only handle the INTERNAL toggle here. 
                    // The WORKSPACE movement is handled by the shell/plugin.
                    let path = temp_dir.join("waiting-game-toggle");
                    if path.exists() {
                        let _ = std::fs::remove_file(&path);
                        if let Some(window) = app_handle.get_webview_window("main") {
                            let is_visible = window.is_visible().unwrap_or(false);
                            if is_visible {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                    std::thread::sleep(std::time::Duration::from_millis(50));
                }
            });

            let _ = app.handle().autolaunch().enable();
            let quit_i = MenuItem::with_id(app, "quit", "Quit Waiting Game", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&quit_i])?;
            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(true)
                .on_menu_event(|app_handle, event| {
                    if event.id.as_ref() == "quit" { app_handle.exit(0); }
                })
                .build(app)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
