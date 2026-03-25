export const parseXMLToInvoiceData = (xmlString: string) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");

    const getVal = (parent: any, tag: string) => parent?.getElementsByTagNameNS("*", tag)[0]?.textContent || "";

    const rootNodeName = xmlDoc.documentElement.localName || "Desconocido";

    const supplier = xmlDoc.getElementsByTagNameNS("*", "AccountingSupplierParty")[0];
    const customer = xmlDoc.getElementsByTagNameNS("*", "AccountingCustomerParty")[0];

    const getAddress = (party: any) => {
        if (!party) return "---";
        const line = party.getElementsByTagNameNS("*", "Line")[0]?.textContent || "";
        const district = party.getElementsByTagNameNS("*", "District")[0]?.textContent || "";
        const city = party.getElementsByTagNameNS("*", "CityName")[0]?.textContent || "";
        return [line, district, city].filter(Boolean).join(" - ") || "---";
    };

    const docTypeCode = getVal(xmlDoc, "InvoiceTypeCode");
    let docTypeName = "DOCUMENTO ELECTRÓNICO";

    if (rootNodeName === "Invoice") {
        docTypeName = docTypeCode === "03" ? "BOLETA DE VENTA ELECTRÓNICA" : "FACTURA ELECTRÓNICA";
    } else if (rootNodeName === "CreditNote") {
        docTypeName = "NOTA DE CRÉDITO ELECTRÓNICA";
    } else if (rootNodeName === "DebitNote") {
        docTypeName = "NOTA DE DÉBITO ELECTRÓNICA";
    } else if (rootNodeName === "DespatchAdvice") {
        docTypeName = "GUÍA DE REMISIÓN";
    }

    let rawLines = Array.from(xmlDoc.getElementsByTagNameNS("*", "InvoiceLine"));
    if (rawLines.length === 0) rawLines = Array.from(xmlDoc.getElementsByTagNameNS("*", "CreditNoteLine"));
    if (rawLines.length === 0) rawLines = Array.from(xmlDoc.getElementsByTagNameNS("*", "DebitNoteLine"));
    if (rawLines.length === 0) rawLines = Array.from(xmlDoc.getElementsByTagNameNS("*", "DespatchLine")); // Guías

    const items = rawLines.map((line, idx) => {
        const sellersItem = line.getElementsByTagNameNS("*", "SellersItemIdentification")[0];
        const qtyNode = line.getElementsByTagNameNS("*", "InvoicedQuantity")[0] ||
            line.getElementsByTagNameNS("*", "CreditedQuantity")[0] ||
            line.getElementsByTagNameNS("*", "DebitedQuantity")[0] ||
            line.getElementsByTagNameNS("*", "DeliveredQuantity")[0];

        return {
            id: getVal(line, "ID") || (idx + 1).toString(),
            cantidad: qtyNode?.textContent || "0",
            unidad: qtyNode?.getAttribute("unitCode") || "NIU",
            descripcion: getVal(line, "Description") || "Sin descripción",
            codigo: sellersItem ? getVal(sellersItem, "ID") : "-",
            precio_total: getVal(line, "PriceAmount") || getVal(line, "LineExtensionAmount") || "0.00",
        };
    });

    return {
        emisor_ruc: getVal(supplier, "ID") || "---",
        emisor_razon: getVal(supplier, "RegistrationName") || getVal(supplier, "Name") || "---",
        emisor_direccion: getAddress(supplier),

        receptor_ruc: getVal(customer, "ID") || "---",
        receptor_razon: getVal(customer, "RegistrationName") || getVal(customer, "Name") || "---",
        receptor_direccion: getAddress(customer),

        fecha_emision: getVal(xmlDoc, "IssueDate") || "---",
        moneda: getVal(xmlDoc, "DocumentCurrencyCode") || "PEN",
        documento_id: getVal(xmlDoc, "ID") || "---",
        tipo_documento: docTypeName,
        importe_total: getVal(xmlDoc, "PayableAmount") || "0.00",
        exonerada: "0.00",
        items: items
    };
};