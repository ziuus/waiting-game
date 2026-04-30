use tauri::{Manager, menu::{Menu, MenuItem}, tray::TrayIconBuilder};
use tauri_plugin_autostart::{MacosLauncher, ManagerExt};
use std::io::Write;
use std::process::Command;

#[tauri::command]
fn hide_window(window: tauri::Window) {
    let _ = window.hide();
}

// OS-Aware Teleportation Logic
fn teleport_window(app: &tauri::AppHandle, action: &str) {
    let window = match app.get_webview_window("main") {
        Some(w) => w,
        None => return,
    };

    // Detect Environment
    let is_hyprland = std::env::var("HYPRLAND_INSTANCE_SIGNATURE").is_ok();
    
    if is_hyprland {
        // High-Speed Native Hyprland Controller
        let output = Command::new("hyprctl").args(["clients", "-j"]).output().ok();
        if let Some(o) = output {
            let json: serde_json::Value = serde_json::from_slice(&o.stdout).unwrap_or(serde_json::json!([]));
            let client = json.as_array().and_then(|arr| {
                arr.iter().find(|c| c["class"] == "waiting-game-bin")
            });

            if let Some(c) = client {
                let addr = c["address"].as_str().unwrap_or("");
                let is_special = c["workspace"]["name"].as_str().map(|n| n.contains("special:")).unwrap_or(false);
                let is_pinned = c["pinned"].as_bool().unwrap_or(false);
                let cur_ws = Command::new("hyprctl").args(["activeworkspace", "-j"]).output().ok()
                    .and_then(|o| serde_json::from_slice::<serde_json::Value>(&o.stdout).ok())
                    .and_then(|j| j["name"].as_str().map(|s| s.to_string()))
                    .unwrap_or_else(|| "1".to_string());

                match action {
                    "toggle" => {
                        if is_special {
                            let _ = Command::new("hyprctl").args(["dispatch", "movetoworkspace", &format!("{},address:{}", cur_ws, addr)]).status();
                            let _ = window.show();
                            let _ = window.set_focus();
                        } else {
                            let _ = Command::new("hyprctl").args(["dispatch", "movetoworkspacesilent", &format!("special:waiting,address:{}", addr)]).status();
                            let _ = window.hide();
                        }
                    },
                    "pin" => {
                        if is_special {
                            let _ = Command::new("hyprctl").args(["dispatch", "movetoworkspace", &format!("{},address:{}", cur_ws, addr)]).status();
                            let _ = window.show();
                            let _ = window.set_focus();
                            std::thread::sleep(std::time::Duration::from_millis(50));
                            let _ = Command::new("hyprctl").args(["dispatch", "pin", &format!("address:{}", addr)]).status();
                        } else if is_pinned {
                            let _ = Command::new("hyprctl").args(["dispatch", "pin", &format!("address:{}", addr)]).status();
                        } else {
                            let _ = Command::new("hyprctl").args(["dispatch", "movetoworkspacesilent", &format!("special:waiting,address:{}", addr)]).status();
                            let _ = window.hide();
                        }
                    },
                    _ => {}
                }
            }
        }
    } else {
        // Fallback for KDE/GNOME/macOS/Windows
        let is_visible = window.is_visible().unwrap_or(false);
        if is_visible { let _ = window.hide(); } else { let _ = window.show(); let _ = window.set_focus(); }
    }
}

pub fn run() {
    let args: Vec<String> = std::env::args().collect();
    
    // Command-line signal handling
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
            
            // Background control loop
            std::thread::spawn(move || {
                let temp_dir = std::env::temp_dir();
                loop {
                    for action in &["toggle", "pin"] {
                        let path = temp_dir.join(format!("waiting-game-{}", action));
                        if path.exists() {
                            let _ = std::fs::remove_file(&path);
                            teleport_window(&app_handle, action);
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
