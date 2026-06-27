mod utils;
use utils::systemd::{list_units, SystemdUnit};

use crate::utils::systemd::{get_unit_full_info, SystemdUnitShow};
// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn getUnits() -> Result<Vec<SystemdUnit>, String> {
    let units = list_units();
    units
}

#[tauri::command]
fn getUnitDetailedInfo(unit: String) -> Result<SystemdUnitShow, String> {
    let unit = get_unit_full_info(unit);
    unit
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            getUnits,
            getUnitDetailedInfo
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
