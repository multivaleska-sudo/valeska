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
}

pub fn parse_sunarp_pdf(path: &str) -> Result<ExtractedData, String> {
    let content = pdf_extract::extract_text(path)
        .map_err(|e| format!("Error al leer PDF: {}", e))?;

    // Expresiones optimizadas para el formato SUNARP real
    let re_dua = Regex::new(r"NUMERO DUA:\s*(\d+)").unwrap();
    let re_vin = Regex::new(r"NUMERO VIN:\s*([A-Z0-9]+)").unwrap();
    let re_motor = Regex::new(r"MOTOR Nº:\s*([A-Z0-9]+)").unwrap();
    let re_cliente = Regex::new(r"Nombre\(s\) y Apellidos:\s*([^\n\r]+)").unwrap();
    let re_dni = Regex::new(r"N°\s*(\d{8,12})").unwrap();
    let re_marca = Regex::new(r"Marca:\s*([^\n\r]+)").unwrap();
    let re_modelo = Regex::new(r"Modelo:\s*([^\n\r]+)").unwrap();
    let re_color = Regex::new(r"Color:\s*([^\n\r]+)").unwrap();
    let re_anio = Regex::new(r"Año del Modelo:\s*(\d{4})").unwrap();

    Ok(ExtractedData {
        dua: extract(&re_dua, &content),
        vin: extract(&re_vin, &content),
        motor: extract(&re_motor, &content),
        cliente: extract(&re_cliente, &content).replace("\"", "").trim().to_string(),
        dni: extract(&re_dni, &content),
        marca: extract(&re_marca, &content).replace("\"", "").trim().to_string(),
        modelo: extract(&re_modelo, &content).replace("\"", "").trim().to_string(),
        color: extract(&re_color, &content).replace("\"", "").trim().to_string(),
        carroceria: "MOTOCICLETA".to_string(),
        anio: extract(&re_anio, &content),
    })
}

fn extract(re: &Regex, text: &str) -> String {
    re.captures(text)
        .and_then(|cap| cap.get(1))
        .map(|m| m.as_str().trim().to_string())
        .unwrap_or_default()
}
