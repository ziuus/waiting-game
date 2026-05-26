use tauri::{Manager, menu::{Menu, MenuItem}, tray::TrayIconBuilder};
use tauri_plugin_autostart::{MacosLauncher, ManagerExt};
use std::io::Write;
use std::path::PathBuf;

fn default_config() -> serde_json::Value {
    serde_json::json!({
        "showScore": true,
        "activeGame": "dino",
        "activeDifficulty": "normal",
        "background": { "opacity": 0, "color": "0, 0, 0" },
        "themes": {
            "dino": {
                "player": "#68BA7F",
                "obstacle": "#ff4b2b",
                "score": "rgba(104, 186, 127, 0.8)"
            },
            "flappy": {
                "player": "#FFC107",
                "obstacle": "#4CAF50",
                "score": "rgba(255, 193, 7, 0.8)"
            },
            "gravity": {
                "player": "#00E5FF",
                "obstacle": "#FF00FF",
                "score": "rgba(0, 229, 255, 0.8)"
            },
            "snake": {
                "player": "#39FF14",
                "obstacle": "#FF2D55",
                "score": "rgba(57, 255, 20, 0.8)"
            }
        },
        "difficulty": {
            "dino": { "initialSpeed": 8, "gravity": 0.7, "jumpForce": 15, "obstacleGap": 160 },
            "flappy": { "initialSpeed": 4, "gravity": 0.3, "jumpForce": 10, "obstacleGap": 250 },
            "gravity": { "initialSpeed": 10, "gravity": 1.2, "jumpForce": 0, "obstacleGap": 300 },
            "snake": { "initialSpeed": 7, "gravity": 0.1, "jumpForce": 1, "obstacleGap": 260 }
        },
        "difficultyModes": {
            "easy": {
                "dino": { "initialSpeed": 5, "gravity": 0.5, "jumpForce": 12, "obstacleGap": 200 },
                "flappy": { "initialSpeed": 3, "gravity": 0.2, "jumpForce": 8, "obstacleGap": 300 },
                "gravity": { "initialSpeed": 7, "gravity": 0.8, "jumpForce": 0, "obstacleGap": 400 },
                "snake": { "initialSpeed": 5, "gravity": 0.1, "jumpForce": 1, "obstacleGap": 320 }
            },
            "normal": {
                "dino": { "initialSpeed": 8, "gravity": 0.7, "jumpForce": 15, "obstacleGap": 160 },
                "flappy": { "initialSpeed": 4, "gravity": 0.3, "jumpForce": 10, "obstacleGap": 250 },
                "gravity": { "initialSpeed": 10, "gravity": 1.2, "jumpForce": 0, "obstacleGap": 300 },
                "snake": { "initialSpeed": 7, "gravity": 0.1, "jumpForce": 1, "obstacleGap": 260 }
            },
            "hard": {
                "dino": { "initialSpeed": 12, "gravity": 1.0, "jumpForce": 18, "obstacleGap": 120 },
                "flappy": { "initialSpeed": 6, "gravity": 0.5, "jumpForce": 12, "obstacleGap": 180 },
                "gravity": { "initialSpeed": 15, "gravity": 1.8, "jumpForce": 0, "obstacleGap": 200 },
                "snake": { "initialSpeed": 10, "gravity": 0.1, "jumpForce": 1, "obstacleGap": 210 }
            }
        },
        "games": [
            { "id": "dino", "name": "Dino Runner", "enabled": true },
            { "id": "flappy", "name": "Flappy Bird", "enabled": true },
            { "id": "gravity", "name": "Gravity Runner", "enabled": true },
            { "id": "snake", "name": "Cyber Snake", "enabled": true }
        ]
    })
}

// Strict validation to prevent crashes
fn validate_config(config: &mut serde_json::Value) {
    if let Some(diff) = config.get_mut("difficulty").and_then(|v| v.as_object_mut()) {
        for game in ["dino", "flappy", "gravity", "snake"] {
            if let Some(game_diff) = diff.get_mut(game).and_then(|v| v.as_object_mut()) {
                if let Some(speed) = game_diff.get("initialSpeed").and_then(|v| v.as_f64()) {
                    game_diff.insert("initialSpeed".to_string(), serde_json::json!(speed.clamp(1.0, 50.0)));
                }
                if let Some(gravity) = game_diff.get("gravity").and_then(|v| v.as_f64()) {
                    game_diff.insert("gravity".to_string(), serde_json::json!(gravity.clamp(0.1, 5.0)));
                }
                if let Some(jump) = game_diff.get("jumpForce").and_then(|v| v.as_f64()) {
                    let min_jump = if game == "gravity" { 0.0 } else { 1.0 };
                    game_diff.insert("jumpForce".to_string(), serde_json::json!(jump.clamp(min_jump, 50.0)));
                }
                if let Some(gap) = game_diff.get("obstacleGap").and_then(|v| v.as_f64()) {
                    game_diff.insert("obstacleGap".to_string(), serde_json::json!(gap.clamp(50.0, 500.0)));
                }
            }
        }
    }

    let allowed_games = ["dino", "flappy", "gravity", "snake"];
    if !config
        .get("activeGame")
        .and_then(|v| v.as_str())
        .map(|game| allowed_games.contains(&game))
        .unwrap_or(false)
    {
        config["activeGame"] = serde_json::json!("dino");
    }

    let allowed_difficulties = ["easy", "normal", "hard"];
    if !config
        .get("activeDifficulty")
        .and_then(|v| v.as_str())
        .map(|difficulty| allowed_difficulties.contains(&difficulty))
        .unwrap_or(false)
    {
        config["activeDifficulty"] = serde_json::json!("normal");
    }

    let builtin_games = [
        serde_json::json!({ "id": "dino", "name": "Dino Runner", "enabled": true }),
        serde_json::json!({ "id": "flappy", "name": "Flappy Bird", "enabled": true }),
        serde_json::json!({ "id": "gravity", "name": "Gravity Runner", "enabled": true }),
        serde_json::json!({ "id": "snake", "name": "Cyber Snake", "enabled": true }),
    ];

    if !config.get("games").map(|v| v.is_array()).unwrap_or(false) {
        config["games"] = serde_json::json!([]);
    }

    if let Some(games) = config.get_mut("games").and_then(|v| v.as_array_mut()) {
        for game in builtin_games {
            let id = game.get("id").and_then(|v| v.as_str()).unwrap_or_default();
            let exists = games
                .iter()
                .any(|existing| existing.get("id").and_then(|v| v.as_str()) == Some(id));
            if !exists {
                games.push(game);
            }
        }
    }
}

fn merge_json(defaults: &mut serde_json::Value, user: &serde_json::Value) {
    match (defaults, user) {
        (serde_json::Value::Object(default_obj), serde_json::Value::Object(user_obj)) => {
            for (k, v) in user_obj {
                if let Some(existing) = default_obj.get_mut(k) {
                    merge_json(existing, v);
                } else {
                    default_obj.insert(k.clone(), v.clone());
                }
            }
        }
        (default_slot, user_value) => {
            *default_slot = user_value.clone();
        }
    }
}

fn config_file_path() -> Option<PathBuf> {
    dirs::config_dir().map(|p| p.join("waiting-game/config.json"))
}

#[tauri::command]
fn hide_window(window: tauri::Window) {
    let _ = window.hide();
}

#[tauri::command]
fn get_config() -> serde_json::Value {
    let config_path = config_file_path();

    let mut merged = default_config();

    if let Some(path) = config_path {
        if path.exists() {
            if let Ok(content) = std::fs::read_to_string(path) {
                if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
                    merge_json(&mut merged, &json);
                }
            }
        }
    }

    validate_config(&mut merged);
    merged
}

#[tauri::command]
fn save_preferences(active_game: String, active_difficulty: String) -> Result<(), String> {
    const ALLOWED_GAMES: [&str; 4] = ["dino", "flappy", "gravity", "snake"];
    const ALLOWED_DIFFICULTIES: [&str; 3] = ["easy", "normal", "hard"];

    if !ALLOWED_GAMES.contains(&active_game.as_str()) {
        return Err(format!("Unsupported game: {}", active_game));
    }

    if !ALLOWED_DIFFICULTIES.contains(&active_difficulty.as_str()) {
        return Err(format!("Unsupported difficulty: {}", active_difficulty));
    }

    let mut merged = default_config();

    if let Some(path) = config_file_path() {
        if path.exists() {
            if let Ok(content) = std::fs::read_to_string(&path) {
                if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
                    merge_json(&mut merged, &json);
                }
            }
        }

        merged["activeGame"] = serde_json::json!(active_game);
        merged["activeDifficulty"] = serde_json::json!(active_difficulty);
        validate_config(&mut merged);

        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }

        let content = serde_json::to_string_pretty(&merged).map_err(|e| e.to_string())?;
        std::fs::write(path, content).map_err(|e| e.to_string())?;
    }

    Ok(())
}

// OS-Aware Teleportation Logic
fn teleport_window(app: &tauri::AppHandle, action: &str) {
    let window = match app.get_webview_window("main") {
        Some(w) => w,
        None => return,
    };

    let is_visible = window.is_visible().unwrap_or(false);
    match action {
        "toggle" => {
            if is_visible {
                let _ = window.hide();
            } else {
                let _ = window.show();
                let _ = window.set_focus();
            }
        },
        "pin" => {
            // Pin functionality can just ensure it's visible for now
            if !is_visible {
                let _ = window.show();
                let _ = window.set_focus();
            }
        },
        _ => {}
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
        .invoke_handler(tauri::generate_handler![hide_window, get_config, save_preferences])
        .setup(move |app| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_always_on_top(true);
                let _ = window.maximize();
                if let Ok(Some(monitor)) = window.current_monitor() {
                    let size = monitor.size();
                    let pos = monitor.position();
                    let _ = window.set_position(tauri::Position::Physical(tauri::PhysicalPosition::new(pos.x, pos.y)));
                    let _ = window.set_size(tauri::Size::Physical(tauri::PhysicalSize::new(size.width, size.height)));
                }
            }

            // Ensure config directory exists
            if let Some(config_dir) = dirs::config_dir().map(|p| p.join("waiting-game")) {
                let _ = std::fs::create_dir_all(&config_dir);
                let config_file = config_dir.join("config.json");
                if !config_file.exists() {
                    let default_config = default_config();
                    if let Ok(content) = serde_json::to_string_pretty(&default_config) {
                        let _ = std::fs::write(config_file, content);
                    }
                }
            }

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
