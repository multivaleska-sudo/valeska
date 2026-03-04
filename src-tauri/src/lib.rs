mod logic;

// Aseguramos que los tipos de log estén disponibles
use log::LevelFilter;

#[tauri::command]
async fn extract_pdf_data(path: String) -> Result<logic::pdf_parser::ExtractedData, String> {
    logic::pdf_parser::parse_sunarp_pdf(&path)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // 🟢 REGISTRO OBLIGATORIO DE PLUGINS
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_dialog::init()) // 👈 Esto es lo que "despierta" al botón
        .plugin(
            tauri_plugin_log::Builder::default()
                .level(LevelFilter::Info)
                .build(),
        )
        // Registro de comandos para React
        .invoke_handler(tauri::generate_handler![extract_pdf_data])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}