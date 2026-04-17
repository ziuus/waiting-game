use tauri::{Manager};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};
use std::process::Command;
use std::sync::Mutex;

struct AppState {
    is_pinned: Mutex<bool>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState { is_pinned: Mutex::new(false) })
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            // Get window and hide it immediately so it maps but doesn't show
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.hide();
            }

            let super_shift_g = Shortcut::new(Some(Modifiers::SUPER | Modifiers::SHIFT), Code::KeyG);
            let super_shift_p = Shortcut::new(Some(Modifiers::SUPER | Modifiers::SHIFT), Code::KeyP);
            
            app.global_shortcut().on_shortcut(super_shift_g, move |app, _shortcut, event| {
                if event.state() == ShortcutState::Pressed {
                    if let Some(window) = app.get_webview_window("main") {
                        let is_visible = window.is_visible().unwrap_or(false);
                        
                        if is_visible {
                            let _ = window.hide();
                        } else {
                            // Summoning Logic: Use class for more reliability in Hyprland
                            let _ = Command::new("hyprctl")
                                .args(["dispatch", "movetoworkspace", "current,class:^(waiting-game)$"])
                                .spawn();
                            
                            let _ = window.show();
                            let _ = window.set_focus();
                            let _ = window.set_always_on_top(true);
                        }
                    }
                }
            }).expect("error registering toggle shortcut");

            app.global_shortcut().on_shortcut(super_shift_p, move |app, _shortcut, event| {
                if event.state() == ShortcutState::Pressed {
                    let state = app.state::<AppState>();
                    let mut is_pinned = state.is_pinned.lock().unwrap();
                    *is_pinned = !*is_pinned;
                    
                    let action = if *is_pinned { "pin" } else { "unpin" };
                    let _ = Command::new("hyprctl")
                        .args(["dispatch", action, "class:^(waiting-game)$"])
                        .spawn();
                }
            }).expect("error registering pin shortcut");

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
