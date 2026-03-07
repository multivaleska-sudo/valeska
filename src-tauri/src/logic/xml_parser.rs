// ⚡ Protocolo V11: Motor de Extracción XML (Empresas)
// Socio, este archivo contiene la lógica nativa para procesar facturas electrónicas 
// y boletas en formato UBL 2.1 (Estándar SUNAT).

use regex::Regex;
use serde::Serialize;
use std::fs;

/// Estructura de salida mapeada para el formulario de Empresas
/// Se usa #[derive(Serialize)] para que Tauri pueda enviarlo a React como JSON.
#[derive(Serialize)]
pub struct ExtractedEmpresaData {
    pub ruc: String,
    pub razon_social: String,
    pub direccion: String,
}

/// 📄 Función: parse_sunat_xml
/// Procesa el contenido de un archivo XML y extrae datos fiscales usando Regex.
/// Se prefiere Regex sobre un parser XML tradicional para ignorar namespaces 
/// complejos (cbc, cac, ext) y asegurar velocidad de ejecución.
pub fn parse_sunat_xml(path: &str) -> Result<ExtractedEmpresaData, String> {
    // 1. Lectura del archivo como String plano
    let content = fs::read_to_string(path)
        .map_err(|e| format!("Error al leer el archivo XML: {}", e))?;

    // 2. Definición de Patrones (Regex)
    
    // RUC: Busca el ID con schemeID="6" (Standard de SUNAT para RUC)
    let re_ruc = Regex::new(r#"(?i)<cbc:ID[^>]*schemeID="6"[^>]*>(\d{11})</cbc:ID>"#).unwrap();
    
    // Razón Social: Captura el nombre de registro legal
    let re_razon = Regex::new(r#"(?i)<cbc:RegistrationName[^>]*>([^<]+)</cbc:RegistrationName>"#).unwrap();
    
    // Dirección: Captura la línea de dirección dentro del bloque AddressLine
    let re_direccion = Regex::new(r#"(?i)<cac:RegistrationAddress>[\s\S]*?<cbc:Line>([^<]+)</cbc:Line>"#).unwrap();

    // 3. Extracción de Datos con Fallbacks
    
    let ruc = re_ruc.captures(&content)
        .and_then(|cap| cap.get(1))
        .map(|m| m.as_str().to_string())
        .unwrap_or_default();

    let razon_social = re_razon.captures(&content)
        .and_then(|cap| cap.get(1))
        .map(|m| m.as_str().trim().to_string())
        .unwrap_or_default();

    let direccion = re_direccion.captures(&content)
        .and_then(|cap| cap.get(1))
        .map(|m| m.as_str().trim().to_string())
        .unwrap_or_default();

    // 4. Validación de Integridad
    if ruc.is_empty() && razon_social.is_empty() {
        return Err("No se detectó un RUC o Razón Social válido en este archivo XML.".to_string());
    }

    // 5. Retorno de estructura serializada para el Frontend
    Ok(ExtractedEmpresaData {
        ruc,
        razon_social,
        direccion,
    })
}