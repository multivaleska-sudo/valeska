use regex::Regex;
use serde::Serialize;
use std::fs;

#[derive(Serialize)]
pub struct ExtractedEmpresaData {
    pub ruc: String,
    pub razon_social: String,
    pub direccion: String,
}

pub fn parse_sunat_xml(path: &str) -> Result<ExtractedEmpresaData, String> {
    let content =
        fs::read_to_string(path).map_err(|e| format!("Error al leer el archivo XML: {}", e))?;
    let re_ruc = Regex::new(r#"(?i)<cbc:ID[^>]*schemeID="6"[^>]*>(\d{11})</cbc:ID>"#).unwrap();
    let re_razon =
        Regex::new(r#"(?i)<cbc:RegistrationName[^>]*>([^<]+)</cbc:RegistrationName>"#).unwrap();
    let re_direccion =
        Regex::new(r#"(?i)<cac:RegistrationAddress>[\s\S]*?<cbc:Line>([^<]+)</cbc:Line>"#).unwrap();
    let ruc = re_ruc
        .captures(&content)
        .and_then(|cap| cap.get(1))
        .map(|m| m.as_str().to_string())
        .unwrap_or_default();
    let razon_social = re_razon
        .captures(&content)
        .and_then(|cap| cap.get(1))
        .map(|m| m.as_str().trim().to_string())
        .unwrap_or_default();
    let direccion = re_direccion
        .captures(&content)
        .and_then(|cap| cap.get(1))
        .map(|m| m.as_str().trim().to_string())
        .unwrap_or_default();
    if ruc.is_empty() && razon_social.is_empty() {
        return Err("No se detectó un RUC o Razón Social válido en este archivo XML.".to_string());
    }
    Ok(ExtractedEmpresaData {
        ruc,
        razon_social,
        direccion,
    })
}
