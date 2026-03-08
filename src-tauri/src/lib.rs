// ⚡ Protocolo V11: Punto de Entrada de la Aplicación
// Socio, aquí unificamos los nombres para que coincidan con React.

mod logic;
use log::LevelFilter;

// 1. Comando para PDFs (Trámites)
#[tauri::command]
async fn extract_pdf_data(path: String) -> Result<logic::pdf_parser::ExtractedData, String> {
    logic::pdf_parser::parse_sunarp_pdf(&path)
}

// 2. Comando para XML Simple (Formulario de Empresa)
#[tauri::command]
async fn extract_xml_data(path: String) -> Result<logic::xml_parser::ExtractedEmpresaData, String> {
    logic::xml_parser::parse_sunat_xml(&path)
}

// 3. 🟢 CORRECCIÓN: Renombramos 'ubl' a 'invoice' para que coincida con el invoke de React
#[tauri::command]
async fn extract_full_invoice_data(path: String) -> Result<logic::parse_full_ubl_xml::FullInvoiceData, String> {
    logic::parse_full_ubl_xml::parse_full_ubl_xml(&path)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init()) 
        .plugin(
            tauri_plugin_log::Builder::default()
                .level(LevelFilter::Info)
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            extract_pdf_data, 
            extract_xml_data,
            extract_full_invoice_data 
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}