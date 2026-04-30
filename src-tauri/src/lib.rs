use tauri::{Manager, menu::{Menu, MenuItem}, tray::TrayIconBuilder};
use tauri_plugin_autostart::{MacosLauncher, ManagerExt};
use std::io::{Write, Read};
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
    
    match action {
        "toggle" => {
            if is_hyprland {
                // Use teleportation logic for Hyprland
                let addr = Command::new("hyprctl")
                    .args(["clients", "-j"])
                    .output()
                    .ok()
                    .and_then(|o| {
                        let json: serde_json::Value = serde_json::from_slice(&o.stdout).ok()?;
                        json.as_array()?.iter().find(|c| c["class"] == "waiting-game-bin")?["address"].as_str().map(|s| s.to_string())
                    });

                if let Some(a) = addr {
                    let info = Command::new("hyprctl").args(["clients", "-j"]).output().ok();
                    let is_special = info.and_then(|o| {
                        let json: serde_json::Value = serde_json::from_slice(&o.stdout).ok()?;
                        let client = json.as_array()?.iter().find(|c| c["address"] == a)?;
                        Some(client["workspace"]["name"].as_str()?.contains("special:"))
                    }).unwrap_or(false);

                    if is_special {
                        let cur_ws = Command::new("hyprctl").args(["activeworkspace", "-j"]).output().ok()
                            .and_then(|o| {
                                let json: serde_json::Value = serde_json::from_slice(&o.stdout).ok()?;
                                json["name"].as_str().map(|s| s.to_string())
                            }).unwrap_or_else(|| "1".to_string());
                        let _ = Command::new("hyprctl").args(["dispatch", "movetoworkspace", &format!("{},address:{}", cur_ws, a)]).status();
                        let _ = window.show();
                        let _ = window.set_focus();
                    } else {
                        let _ = Command::new("hyprctl").args(["dispatch", "movetoworkspacesilent", &format!("special:waiting,address:{}", a)]).status();
                        let _ = window.hide();
                    }
                }
            } else {
                // Fallback for other OS/DE
                let is_visible = window.is_visible().unwrap_or(false);
                if is_visible { let _ = window.hide(); } else { let _ = window.show(); let _ = window.set_focus(); }
            }
        },
        "pin" => {
            if is_hyprland {
                // Implement native pinning logic here
                let _ = Command::new("waiting-game").arg("pin").status(); // Fallback to shell for now
            } else {
                let is_pinned = window.is_resizable().unwrap_or(false); // Hacky state check
                let _ = window.set_always_on_top(!is_pinned);
            }
        },
        _ => {}
    }
}

pub fn run() {
    let args: Vec<String> = std::env::args().collect();
    
    // Simple IPC using a local file-based lock/socket for robustness
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
            
            // Refined Background control loop
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
