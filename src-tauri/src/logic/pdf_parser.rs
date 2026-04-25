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
    pub empresa: String,
    pub empresa_domicilio: String,
    pub representante: String,
    pub representante_dni: String,
    pub partida_registral: String,
    pub oficina_registral: String,
    pub importe: String,
    pub forma_pago: String,
    pub comprobante: String,
}

pub fn parse_sunarp_pdf(path: &str) -> Result<ExtractedData, String> {
    let raw_text =
        pdf_extract::extract_text(path).map_err(|e| format!("Error al leer PDF: {}", e))?;
    let clean_text = raw_text.replace('"', "").replace(',', "");
    let re_spaces = Regex::new(r"[\s\t\r\n]+").unwrap();
    let mut t_norm = re_spaces.replace_all(&clean_text, " ").to_string();

    t_norm = t_norm.replace("Año del Modelo", "K_ANIO_MODELO");
    t_norm = t_norm.replace("Doc. de Identidad", "K_DOC_IDENTIDAD");
    t_norm = t_norm.replace("Denominación Social", "K_DENOMINACION_SOCIAL");
    t_norm = t_norm.replace("Oficina Registral", "K_OFICINA_REGISTRAL");
    t_norm = t_norm.replace("Partida Registral", "K_PARTIDA_REGISTRAL");
    t_norm = t_norm.replace("PERSONA(S) JURÍDICA(S)", "K_PERSONA_JURIDICA");
    t_norm = t_norm.replace("PERSONA(S) NATURAL(ES)", "K_PERSONA_NATURAL");
    t_norm = t_norm.replace("Representante", "K_REPRESENTANTE");
    t_norm = t_norm.replace("Nombre(s) y Apellidos", "K_NOMBRES_APELLIDOS");
    t_norm = t_norm.replace("NUMERO VIN", "K_VIN");
    t_norm = t_norm.replace("Número de Serie", "K_SERIE");
    t_norm = t_norm.replace("Chasis", "K_CHASIS");
    t_norm = t_norm.replace("MOTOR Nº", "K_MOTOR");
    t_norm = t_norm.replace("MOTOR N°", "K_MOTOR");
    t_norm = t_norm.replace("Número de Motor", "K_MOTOR");
    t_norm = t_norm.replace("NUMERO DUA", "K_DUA");
    t_norm = t_norm.replace("Modelo", "K_MODELO");
    t_norm = t_norm.replace("Marca", "K_MARCA");
    t_norm = t_norm.replace("Color", "K_COLOR");
    t_norm = t_norm.replace("Carrocería", "K_CARROCERIA");
    t_norm = t_norm.replace("IMPORTE", "K_IMPORTE");
    t_norm = t_norm.replace("FORMA DE PAGO", "K_FORMA_PAGO");
    t_norm = t_norm.replace("BOLETA", "K_BOLETA");
    t_norm = t_norm.replace("FACTURA", "K_FACTURA");

    let extract = |pat: &str| -> String {
        if let Ok(re) = Regex::new(pat) {
            if let Some(caps) = re.captures(&t_norm) {
                if let Some(m) = caps.get(1) {
                    let text = m.as_str().trim().to_string();
                    if text.len() < 200 {
                        return text;
                    }
                }
            }
        }
        "".to_string()
    };

    let cliente = extract(
        r"(?i)K_NOMBRES_APELLIDOS\s*[:]?\s*(.*?)\s+(?:Domicilio|Estado Civil|K_DOC_IDENTIDAD)",
    );
    let dni = extract(r"(?i)K_NOMBRES_APELLIDOS.*?K_DOC_IDENTIDAD.*?N[°ºo]\s*(\d{8,11})");

    let mut empresa =
        extract(r"(?i)K_PERSONA_JURIDICA\s*([A-Z0-9\.\s\-\&]{3,80}?)\s*K_DENOMINACION_SOCIAL");
    if empresa.is_empty() {
        empresa = extract(
            r"(?i)Vendedor(?:es)?.*?K_PERSONA_JURIDICA\s*([A-Z0-9\.\s\-\&]{3,80}?)\s*K_DENOMINACION_SOCIAL",
        );
    }

    let empresa_domicilio = extract(
        r"(?i)K_DENOMINACION_SOCIAL.*?Domicilio\s*[:]?\s*(.{5,120}?)\s*(?:Inscrita en|K_DOC_IDENTIDAD|K_REPRESENTANTE)",
    );

    let mut representante =
        extract(r"(?i)K_REPRESENTANTE\s*[:]?\s*([A-ZÑñ\s]{5,60}?)\s*K_DOC_IDENTIDAD");
    if representante.is_empty() {
        representante = extract(
            r"(?i)K_REPRESENTANTE.*?N[°ºo]\s*\d{8,11}\s+([A-ZÑñ\s]{5,60}?)(?:Oficina|3\s*Caracter|NUMERO|DE IDENTIDAD)",
        );
    }

    let mut representante_dni =
        extract(r"(?i)K_REPRESENTANTE.*?K_DOC_IDENTIDAD.*?N[°ºo]\s*(\d{8,11})\s*DE IDENTIDAD");
    if representante_dni.is_empty() {
        representante_dni = extract(r"(?i)K_REPRESENTANTE.*?N[°ºo]\s*(\d{8,11})");
    }

    let partida_registral = extract(r"(?i)K_PARTIDA_REGISTRAL\s*(\d{4,15})");
    let oficina_registral = extract(
        r"(?i)K_OFICINA_REGISTRAL\s*[:]?\s*([A-Za-zÑñ\s]+?)\s*(?:N[°ºo]|3\s*Caracter|K_DUA|DE IDENTIDAD)",
    );

    let dua = extract(r"(?i)K_DUA\s*[:]?\s*(\d+)");
    let vin = extract(r"(?i)(?:K_VIN|K_SERIE|K_CHASIS)\s*[:]?\s*([A-Z0-9]+)");
    let motor = extract(r"(?i)K_MOTOR.*?[:]?\s*([A-Z0-9\-]+)");

    let marca = extract(r"(?i)K_MARCA\s*[:]?\s*(.*?)\s+(?:K_ANIO_MODELO|K_MODELO|Clase)");
    // Como Año del Modelo ahora es K_ANIO_MODELO, K_MODELO jamás se confundirá.
    let modelo = extract(
        r"(?i)K_MODELO\s*[:]?\s*(.*?)\s+(?:Versi[óo]n|PERU|CATEGOR[ÍI]A|K_COLOR|K_MOTOR|Potencia|$)",
    );
    let color = extract(
        r"(?i)K_COLOR\s*[:]?\s*(.*?)\s+(?:K_MOTOR|Longitud|Potencia|Combustible|K_CARROCERIA)",
    );
    let carroceria = extract(
        r"(?i)K_CARROCERIA\s*[:]?\s*(.*?)\s+(?:K_COLOR|Potencia|CATEGOR[ÍI]A|Ejes|Cilindros)",
    );
    let anio = extract(r"(?i)K_ANIO_MODELO\s*[:]?\s*(\d{4})");

    let mut form_inma = "".to_string();
    let re_f = Regex::new(r"\b(\d{9,11})\b").unwrap();
    let matches: Vec<_> = re_f.find_iter(&t_norm).map(|m| m.as_str()).collect();
    if let Some(last) = matches.last() {
        form_inma = last.to_string();
    }

    let importe = extract(r"(?i)K_IMPORTE\s*([\d\.]+)");
    let forma_pago = extract(r"(?i)K_FORMA_PAGO\s*[:]?\s*(.*?)\s+MONTO PAGADO");
    let comprobante = extract(r"(?i)(?:K_BOLETA|K_FACTURA)\s*([A-Z0-9\-\.\s\(\)]+)\.XML");

    Ok(ExtractedData {
        cliente,
        dni,
        dua,
        vin,
        motor,
        marca,
        modelo,
        color,
        carroceria,
        anio,
        form_inma,
        empresa,
        empresa_domicilio,
        representante,
        representante_dni,
        partida_registral,
        oficina_registral,
        importe,
        forma_pago,
        comprobante,
    })
}
