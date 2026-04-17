use tauri::{Manager, WindowEvent};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            let ctrl_shift_g = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyG);
            
            app.global_shortcut().on_shortcut(ctrl_shift_g, move |app, shortcut, event| {
                if event.state() == ShortcutState::Pressed {
                    if let Some(window) = app.get_webview_window("main") {
                        if window.is_visible().unwrap_or(false) {
                            let _ = window.hide();
                        } else {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                }
            }).expect("error registering global shortcut");

            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::Focused(focused) = event {
                // If it loses focus, we could hide it, but let's keep it for now.
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
