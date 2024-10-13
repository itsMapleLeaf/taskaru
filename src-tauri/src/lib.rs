use serde::{Deserialize, Serialize};
use serde_json::json;
use std::{fs::File, io::Write, path::PathBuf, time::SystemTime};
use tauri::{plugin::TauriPlugin, AppHandle, Manager, Runtime};
use tauri_plugin_fs::FsExt;

#[derive(Debug, Default, Deserialize, Serialize)]
struct SavedScope {
    allowed_paths: Vec<String>,
    forbidden_paths: Vec<String>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            app.handle().plugin(create_logger())?;
            init_fs_scope_persistence(app.handle())?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn create_logger<R: Runtime>() -> TauriPlugin<R> {
    let timestamp = {
        let now = SystemTime::now();
        let datetime = chrono::DateTime::<chrono::Utc>::from(now);
        datetime.format("%Y-%m-%d_%H-%M-%S").to_string()
    };

    tauri_plugin_log::Builder::new()
        .level(log::LevelFilter::Debug)
        .target(tauri_plugin_log::Target::new(
            tauri_plugin_log::TargetKind::Stdout,
        ))
        .target(tauri_plugin_log::Target::new(
            tauri_plugin_log::TargetKind::LogDir {
                file_name: Some(format!("taskaru.{}.log", timestamp)),
            },
        ))
        .build()
}

fn init_fs_scope_persistence(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let app_dir = app.path().app_data_dir()?;
    std::fs::create_dir_all(&app_dir)?;

    let scope_file_path = app_dir.join("asset-scope.json");

    if std::path::Path::new(&scope_file_path).exists() {
        let loaded_scope: SavedScope = serde_json::from_slice(&std::fs::read(&scope_file_path)?)
            .map_err(|err| {
                println!("{:?}", err);
                err
            })
            .unwrap_or_else(|_| SavedScope {
                allowed_paths: vec![],
                forbidden_paths: vec![],
            });
        println!("loaded scopes: {:?}", loaded_scope);

        for path in loaded_scope.allowed_paths {
            app.fs_scope().allow_file(path);
        }
        for path in loaded_scope.forbidden_paths {
            app.fs_scope().forbid_file(path);
        }
        println!("allowed = {:?}", app.fs_scope().allowed());
        println!("forbidden = {:?}", app.fs_scope().forbidden());
    } else {
        println!("Scopes file does not exist");
    }

    let owned_app = app.clone();
    app.fs_scope().listen(move |event| {
        println!("Scope updated {:?}", event);
        let _ = save_fs_scope(&owned_app.fs_scope(), &scope_file_path)
            .map_err(|the| {
                println!("failed to save asset scopes {:?}", the);
            })
            .and_then(|_| {
                println!("asset scopes saved successfully");
                Ok(())
            });
    });

    Ok(())
}

fn save_fs_scope(
    scope: &tauri_plugin_fs::Scope,
    scope_file_path: &PathBuf,
) -> Result<(), Box<dyn std::error::Error>> {
    let allowed = scope
        .allowed()
        .into_iter()
        .collect::<std::collections::HashSet<_>>();

    let forbidden = scope
        .forbidden()
        .into_iter()
        .collect::<std::collections::HashSet<_>>();

    let json = json!({
        "allowed_paths": allowed,
        "forbidden_paths": forbidden,
    });
    println!("new scopes {:?}", json);

    let _ = File::create(&scope_file_path)?.write_all(serde_json::to_string(&json)?.as_bytes());

    Ok(())
}
