mod logic;
use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use dotenvy_macro::dotenv;
use log::LevelFilter;
use mac_address::get_mac_address;
use sha2::{Digest, Sha256};
use std::fs;
use tauri_plugin_sql::{Builder as SqlBuilder, Migration, MigrationKind};

#[tauri::command]
async fn extract_pdf_data(path: String) -> Result<logic::pdf_parser::ExtractedData, String> {
    logic::pdf_parser::parse_sunarp_pdf(&path)
}

#[tauri::command]
async fn extract_xml_data(path: String) -> Result<logic::xml_parser::ExtractedEmpresaData, String> {
    logic::xml_parser::parse_sunat_xml(&path)
}

#[tauri::command]
async fn extract_full_invoice_data(
    path: String,
) -> Result<logic::parse_full_ubl_xml::FullInvoiceData, String> {
    logic::parse_full_ubl_xml::parse_full_ubl_xml(&path)
}

#[tauri::command]
fn get_device_mac() -> Result<String, String> {
    match get_mac_address() {
        Ok(Some(ma)) => Ok(ma.to_string().to_uppercase()),
        Ok(None) => Err("No se encontró tarjeta de red".to_string()),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
fn import_provisioning_profile(file_path: String) -> Result<String, String> {
    let file_bytes =
        fs::read(&file_path).map_err(|_| "No se pudo leer el archivo de provisión.".to_string())?;

    let secret = dotenv!("VALESKA_SECRET");
    let mut hasher = Sha256::new();
    hasher.update(secret.as_bytes());
    let key_bytes = hasher.finalize();

    if file_bytes.len() < 12 {
        return Err("Archivo inválido o corrupto.".to_string());
    }
    let (nonce_bytes, ciphertext) = file_bytes.split_at(12);

    let key = aes_gcm::Key::<Aes256Gcm>::from_slice(&key_bytes);
    let cipher = Aes256Gcm::new(key);
    let nonce = Nonce::from_slice(nonce_bytes);

    let decrypted_bytes = cipher.decrypt(nonce, ciphertext).map_err(|_| {
        "Error de Seguridad: Llave maestra incorrecta o archivo alterado.".to_string()
    })?;

    let json_string = String::from_utf8(decrypted_bytes).map_err(|_| {
        "El archivo desencriptado no contiene un formato de texto válido.".to_string()
    })?;

    Ok(json_string)
}

#[tauri::command]
fn generate_provisioning_file(
    payload: String,
    file_path: String,
    nonce_bytes: Vec<u8>,
) -> Result<(), String> {
    if nonce_bytes.len() != 12 {
        return Err("Error criptográfico: Nonce inválido".to_string());
    }

    let secret = dotenv!("VALESKA_SECRET");
    let mut hasher = Sha256::new();
    hasher.update(secret.as_bytes());
    let key_bytes = hasher.finalize();

    let key = aes_gcm::Key::<Aes256Gcm>::from_slice(&key_bytes);
    let cipher = Aes256Gcm::new(key);
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = cipher
        .encrypt(nonce, payload.as_bytes())
        .map_err(|_| "Error interno al encriptar los datos.".to_string())?;

    let mut final_file_bytes = Vec::new();
    final_file_bytes.extend_from_slice(&nonce_bytes);
    final_file_bytes.extend_from_slice(&ciphertext);

    fs::write(&file_path, final_file_bytes)
        .map_err(|_| "Error al guardar el archivo físico en el disco.".to_string())?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "crear_tablas_iniciales",
            sql: include_str!("../../src/app/db/migrations/0000_flashy_bullseye.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "agregar_sucursales_y_optimizacion",
            sql: include_str!("../../src/app/db/migrations/0001_third_whizzer.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "hacer_seed_de_tipos_de_tramites",
            sql: include_str!("../../src/app/db/migrations/0002_one_punch.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 4,
            description: "agregar_modulo_plantillas_documentos",
            sql: include_str!("../../src/app/db/migrations/0003_tsubasa_champion.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 5,
            description: "agregar_columnas_para_empresas_gestoras",
            sql: include_str!("../../src/app/db/migrations/0004_pastrana_champion.sql"),
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .plugin(
            SqlBuilder::default()
                .add_migrations("sqlite:valeska.db", migrations)
                .build(),
        )
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
            extract_full_invoice_data,
            get_device_mac,
            import_provisioning_profile,
            generate_provisioning_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
