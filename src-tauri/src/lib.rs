use tauri::{Manager, menu::{Menu, MenuItem}, tray::TrayIconBuilder};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
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
