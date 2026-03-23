use regex::Regex;
use serde::Serialize;
use std::fs;

#[derive(Serialize)]
#[allow(dead_code)]
pub struct InvoiceItem {
    pub id: String,
    pub unidad: String,
    pub cantidad: String,
    pub codigo: String,
    pub descripcion: String,
    pub precio_total: String,
}

#[derive(Serialize)]
#[allow(dead_code)]
pub struct FullInvoiceData {
    pub emisor_ruc: String,
    pub emisor_razon: String,
    pub receptor_ruc: String,
    pub receptor_razon: String,
    pub fecha_emision: String,
    pub moneda: String,
    pub importe_total: String,
    pub items: Vec<InvoiceItem>,
}

#[allow(dead_code)]
pub fn parse_full_ubl_xml(path: &str) -> Result<FullInvoiceData, String> {
    let content =
        fs::read_to_string(path).map_err(|e| format!("No se pudo abrir el XML: {}", e))?;

    let re_fecha = Regex::new(r#"(?i)<cbc:IssueDate[^>]*>([^<]+)</cbc:IssueDate>"#).unwrap();
    let re_moneda =
        Regex::new(r#"(?i)<cbc:DocumentCurrencyCode[^>]*>([^<]+)</cbc:DocumentCurrencyCode>"#)
            .unwrap();
    let re_total = Regex::new(r#"(?i)<cac:LegalMonetaryTotal>[\s\S]*?<cbc:PayableAmount[^>]*>([^<]+)</cbc:PayableAmount>"#).unwrap();

    let re_supplier =
        Regex::new(r#"(?i)<cac:AccountingSupplierParty>([\s\S]*?)</cac:AccountingSupplierParty>"#)
            .unwrap();
    let re_customer =
        Regex::new(r#"(?i)<cac:AccountingCustomerParty>([\s\S]*?)</cac:AccountingCustomerParty>"#)
            .unwrap();
    let re_id = Regex::new(r#"(?i)<cbc:ID[^>]*>([^<]+)</cbc:ID>"#).unwrap();
    let re_name =
        Regex::new(r#"(?i)<cbc:RegistrationName[^>]*>([^<]+)</cbc:RegistrationName>"#).unwrap();

    let re_line = Regex::new(r#"(?i)<cac:InvoiceLine>([\s\S]*?)</cac:InvoiceLine>"#).unwrap();
    let re_qty = Regex::new(
        r#"(?i)<cbc:InvoicedQuantity[^>]*unitCode="([^"]*)"[^>]*>([^<]+)</cbc:InvoicedQuantity>"#,
    )
    .unwrap();
    let re_qty_alt =
        Regex::new(r#"(?i)<cbc:InvoicedQuantity[^>]*>([^<]+)</cbc:InvoicedQuantity>"#).unwrap();
    let re_desc = Regex::new(r#"(?i)<cbc:Description[^>]*>([\s\S]*?)</cbc:Description>"#).unwrap();
    let re_item_id =
        Regex::new(r#"(?i)<cac:SellersItemIdentification>[\s\S]*?<cbc:ID[^>]*>([^<]+)</cbc:ID>"#)
            .unwrap();
    let re_line_total =
        Regex::new(r#"(?i)<cbc:LineExtensionAmount[^>]*>([^<]+)</cbc:LineExtensionAmount>"#)
            .unwrap();

    let fecha = re_fecha
        .captures(&content)
        .and_then(|c| c.get(1))
        .map(|m| m.as_str())
        .unwrap_or("---")
        .to_string();
    let moneda_code = re_moneda
        .captures(&content)
        .and_then(|c| c.get(1))
        .map(|m| m.as_str())
        .unwrap_or("PEN");
    let moneda = if moneda_code == "PEN" { "S/" } else { "$" }.to_string();
    let total = re_total
        .captures(&content)
        .and_then(|c| c.get(1))
        .map(|m| m.as_str())
        .unwrap_or("0.00")
        .to_string();

    let mut em_ruc = "---".to_string();
    let mut em_razon = "---".to_string();
    if let Some(cap) = re_supplier.captures(&content) {
        let block = cap.get(1).unwrap().as_str();
        em_ruc = re_id
            .captures(block)
            .and_then(|c| c.get(1))
            .map(|m| m.as_str())
            .unwrap_or("---")
            .to_string();
        em_razon = re_name
            .captures(block)
            .and_then(|c| c.get(1))
            .map(|m| m.as_str())
            .unwrap_or("---")
            .to_string();
    }

    let mut rec_ruc = "---".to_string();
    let mut rec_razon = "---".to_string();
    if let Some(cap) = re_customer.captures(&content) {
        let block = cap.get(1).unwrap().as_str();
        rec_ruc = re_id
            .captures(block)
            .and_then(|c| c.get(1))
            .map(|m| m.as_str())
            .unwrap_or("---")
            .to_string();
        rec_razon = re_name
            .captures(block)
            .and_then(|c| c.get(1))
            .map(|m| m.as_str())
            .unwrap_or("---")
            .to_string();
    }

    let mut items = Vec::new();
    for (idx, cap) in re_line.captures_iter(&content).enumerate() {
        let block = cap.get(1).unwrap().as_str();

        // Manejo de Cantidad y Unidad
        let (unidad, cantidad) = match re_qty.captures(block) {
            Some(c) => (
                c.get(1).map(|m| m.as_str()).unwrap_or("NIU").to_string(),
                c.get(2).map(|m| m.as_str()).unwrap_or("1").to_string(),
            ),
            None => {
                let cant = re_qty_alt
                    .captures(block)
                    .and_then(|c| c.get(1))
                    .map(|m| m.as_str())
                    .unwrap_or("1")
                    .to_string();
                ("NIU".to_string(), cant)
            }
        };

        let descripcion = re_desc
            .captures(block)
            .and_then(|c| c.get(1))
            .map(|m| {
                m.as_str()
                    .replace("<![CDATA[", "")
                    .replace("]]>", "")
                    .trim()
                    .to_string()
            })
            .unwrap_or_else(|| "Sin descripción".to_string());

        let codigo = re_item_id
            .captures(block)
            .and_then(|c| c.get(1))
            .map(|m| m.as_str())
            .unwrap_or("-")
            .to_string();
        let precio = re_line_total
            .captures(block)
            .and_then(|c| c.get(1))
            .map(|m| m.as_str())
            .unwrap_or("0.00")
            .to_string();

        items.push(InvoiceItem {
            id: (idx + 1).to_string(),
            unidad,
            cantidad,
            codigo,
            descripcion,
            precio_total: precio,
        });
    }

    Ok(FullInvoiceData {
        emisor_ruc: em_ruc,
        emisor_razon: em_razon,
        receptor_ruc: rec_ruc,
        receptor_razon: rec_razon,
        fecha_emision: fecha,
        moneda,
        importe_total: total,
        items,
    })
}
