use regex::Regex;
use serde::Serialize;

#[derive(Serialize)]
pub struct ExtractedData {
    pub cliente: String,
    pub dni: String,
    pub dua: String,
    pub vin: String,
    pub motor: String,
    pub marca: String,
    pub modelo: String,
    pub color: String,
    pub carroceria: String,
    pub anio: String,
    pub form_inma: String,
}

pub fn parse_sunarp_pdf(path: &str) -> Result<ExtractedData, String> {
    // 1. Extraer texto bruto
    let raw_text = pdf_extract::extract_text(path)
        .map_err(|e| format!("Error al leer PDF: {}", e))?;

    // 2. LIMPIEZA TOTAL Y NORMALIZACIÓN
    // Eliminamos basura visual (comillas y comas) que fragmentan el texto
    let clean_text = raw_text.replace('"', "").replace(',', "");
    
    // Normalizamos espacios y saltos de línea a un solo espacio
    let re_spaces = Regex::new(r"[\s\t\r\n]+").unwrap();
    let mut t_norm = re_spaces.replace_all(&clean_text, " ").to_string();

    // --- TRUCO MAESTRO: SUSTITUCIÓN DE ETIQUETAS (Mantiene el modelo funcionando) ---
    t_norm = t_norm.replace("Año del Modelo", "ETIQUETA_ANIO");

    // --- LÓGICA DE AÑO ---
    let re_anio = Regex::new(r"(?i)ETIQUETA_ANIO\s*[:\s]+(\d{4})").unwrap();
    let anio = re_anio.captures(&t_norm)
        .and_then(|c| c.get(1))
        .map(|m| m.as_str().to_string())
        .unwrap_or_default();

    // --- LÓGICA DE MODELO (VERSIÓN 11 - ESTABLE) ---
    // Captura hasta encontrar etiquetas de corte comunes en SUNARP
    let re_modelo = Regex::new(r"(?i)Modelo\s*[:\s]+(.*?)(?:\s+(?:Versión|PERU|CATEGORIA|CATEGORÍA|Color|MOTOR|Potencia)|$)").unwrap();
    let modelo = re_modelo.captures(&t_norm)
        .and_then(|c| c.get(1))
        .map(|m| m.as_str().trim().to_string())
        .unwrap_or_default();

    // --- LÓGICA DE DNI (CORREGIDA v11) ---
    // Busca el N° o Nro después de Identidad, saltando el ruido de "DOCUMENTO NACIONAL DE..."
    let re_dni = Regex::new(r"(?i)(?:Doc\. de Identidad|N[°ºo]|DNI)\s*(?:[A-Z\s]+)?\s*(\d{8,11})").unwrap();
    let dni = re_dni.captures(&t_norm)
        .and_then(|c| c.get(1))
        .map(|m| m.as_str().to_string())
        .unwrap_or_default();

    // --- LÓGICA DE DUA (CORREGIDA v11) ---
    // Captura estrictamente solo la secuencia de números larga del DUA (10 a 20 dígitos)
    let re_dua = Regex::new(r"(?i)NUMERO DUA\s*[:\s]+(\d{10,20})").unwrap();
    let dua = re_dua.captures(&t_norm)
        .and_then(|c| c.get(1))
        .map(|m| m.as_str().to_string())
        .unwrap_or_default();

    // --- FORMATO DE INMATRICULACIÓN (Número largo al final) ---
    let mut form_inma = "".to_string();
    let re_f = Regex::new(r"\b(\d{9,11})\b").unwrap();
    let matches: Vec<_> = re_f.find_iter(&t_norm).map(|m| m.as_str()).collect();
    if let Some(last) = matches.last() {
        form_inma = last.to_string();
    }

    // --- OTROS DATOS ---
    let extract_field = |pat: &str, stop_words: &str| {
        let full_pat = format!(r"(?i){}\s*[:\s]+(.*?)(?:\s+(?:{})|$)", pat, stop_words);
        Regex::new(&full_pat).unwrap()
            .captures(&t_norm)
            .and_then(|c| c.get(1))
            .map(|m| m.as_str().trim().to_string())
            .unwrap_or_default()
    };

    Ok(ExtractedData {
        cliente: extract_field("Nombre\\(s\\) y Apellidos", "Domicilio|Estado Civil|Doc\\."),
        dni,
        dua,
        vin: extract_field("(?:NUMERO VIN|Número de Serie|Chasis)", "Marca|Modelo|MD2"),
        motor: extract_field("MOTOR Nº", "Potencia|Combustible|Cilindros"),
        marca: extract_field("Marca", "Año|ETIQUETA_ANIO|Modelo"),
        modelo,
        color: extract_field("Color", "MOTOR|Longitud|Potencia|Combustible"),
        carroceria: extract_field("Carrocería", "Color|Potencia|CATEGORÍA|Categoría"),
        anio,
        form_inma,
    })
}