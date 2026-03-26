import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import Database from "@tauri-apps/plugin-sql";

export function usePrintDocumentLogic() {
  const { tramiteId, templateId } = useParams();
  const navigate = useNavigate();

  const [renderedHtml, setRenderedHtml] = useState<string>("");
  const [orientacion, setOrientacion] = useState<"PORTRAIT" | "LANDSCAPE">(
    "PORTRAIT",
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const generateDocument = async () => {
      try {
        const sqlite = await Database.load("sqlite:valeska.db");

        const tplRes: any[] = await sqlite.select(
          "SELECT * FROM plantillas_documentos WHERE id = $1",
          [templateId],
        );

        if (tplRes.length === 0) throw new Error("La plantilla no existe.");

        const templateRow = tplRes[0];
        const htmlTemplate =
          templateRow.contenido_html ||
          templateRow.contenidoHtml ||
          templateRow.CONTENIDO_HTML ||
          "";
        setOrientacion(
          templateRow.orientacion_papel ||
            templateRow.orientacionPapel ||
            "PORTRAIT",
        );

        if (!htmlTemplate || htmlTemplate.trim() === "") {
          throw new Error(
            "La plantilla está registrada, pero su contenido HTML no se pudo leer.",
          );
        }

        let data: any = {};
        let map: Record<string, string> = {};
        const fechaActualImpresion = new Date()
          .toLocaleDateString("es-PE", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
          .replace(".", "");

        if (tramiteId && tramiteId !== "undefined") {
          try {
            const query = `
              SELECT 
                t.codigo_verificacion, t.n_titulo, t.fecha_presentacion,
                c.razon_social_nombres as cliente, c.numero_documento as dni, c.telefono, c.domicilio,
                v.placa as vehiculo_placa, v.marca as vehiculo_marca, v.modelo as vehiculo_modelo,
                v.color as vehiculo_color, v.chasis_vin as vehiculo_chasis, v.motor as vehiculo_motor, v.anio_fabricacion as vehiculo_anio,
                ctt.nombre as tipo_tramite,
                td.clausula_monto, td.clausula_forma_pago, td.clausula_pago_bancarizado,
                td.numero_boleta, td.tipo_boleta, td.aclaracion_dice, td.aclaracion_debe_decir,
                td.dua, td.num_formato_inmatriculacion, td.numero_recibo_tramite, td.fecha_boleta,
                p.nombres as p_nombres, p.primer_apellido as p_apellido1, p.segundo_apellido as p_apellido2, p.dni as p_dni,
                eg.razon_social as empresa_razon_social, eg.ruc as empresa_ruc, eg.direccion as empresa_direccion
              FROM tramites t
              LEFT JOIN clientes c ON t.cliente_id = c.id
              LEFT JOIN vehiculos v ON t.vehiculo_id = v.id
              LEFT JOIN catalogo_tipos_tramite ctt ON t.tipo_tramite_id = ctt.id
              LEFT JOIN tramite_detalles td ON t.id = td.tramite_id
              LEFT JOIN empresas_gestoras eg ON td.empresa_gestora_id = eg.id
              LEFT JOIN presentantes p ON td.presentante_id = p.id
              WHERE t.id = $1
            `;

            const tramRes: any[] = await sqlite.select(query, [tramiteId]);
            if (tramRes.length === 0)
              throw new Error("El trámite no tiene datos válidos.");
            data = tramRes[0];
          } catch (dbError: any) {
            throw new Error(
              "Fallo en la BD al cruzar datos (posible columna faltante): " +
                dbError.message,
            );
          }

          const meses = [
            "Enero",
            "Febrero",
            "Marzo",
            "Abril",
            "Mayo",
            "Junio",
            "Julio",
            "Agosto",
            "Septiembre",
            "Octubre",
            "Noviembre",
            "Diciembre",
          ];
          let dia = "",
            mesLetras = "",
            anio = "";

          if (data.fecha_presentacion) {
            const partes = data.fecha_presentacion.split("-");
            if (partes.length === 3) {
              anio = partes[0];
              mesLetras = meses[parseInt(partes[1], 10) - 1] || "";
              dia = partes[2];
            }
          }

          // AQUI EL ARREGLO CRÍTICO: PATERNO MATERNO NOMBRES
          let presentantePersona = "";
          if (data.p_nombres || data.p_dni) {
            presentantePersona =
              `${data.p_apellido1 || ""} ${data.p_apellido2 || ""} ${data.p_nombres || ""}`
                .replace(/\s+/g, " ")
                .trim();
            if (data.p_dni && data.p_dni !== "S/N")
              presentantePersona += ` - ${data.p_dni}`;
          }

          map = {
            "{{CLIENTE_NOMBRE}}": data.cliente || "",
            "{{CLIENTE_DOCUMENTO}}": data.dni || "",
            "{{CLIENTE_TELEFONO}}": data.telefono || "",
            "{{CLIENTE_DIRECCION}}": data.domicilio || "",
            "{{VEHICULO_PLACA}}": data.vehiculo_placa || "",
            "{{VEHICULO_MARCA}}": data.vehiculo_marca || "",
            "{{VEHICULO_MODELO}}": data.vehiculo_modelo || "",
            "{{VEHICULO_COLOR}}": data.vehiculo_color || "",
            "{{VEHICULO_CHASIS}}": data.vehiculo_chasis || "",
            "{{VEHICULO_MOTOR}}": data.vehiculo_motor || "",
            "{{VEHICULO_ANIO}}": data.vehiculo_anio || "",
            "{{TRAMITE_CODIGO}}": data.codigo_verificacion || "",
            "{{TRAMITE_TITULO}}": data.n_titulo || "",
            "{{TRAMITE_FECHA}}": data.fecha_presentacion || "",
            "{{CLAUSULA_MONTO}}": data.clausula_monto
              ? parseFloat(data.clausula_monto).toFixed(2)
              : "",
            "{{CLAUSULA_FORMA_PAGO}}": data.clausula_forma_pago || "",
            "{{CLAUSULA_BANCARIZADO}}": data.clausula_pago_bancarizado || "",
            "{{ACLARACION_DICE}}": data.aclaracion_dice || "",
            "{{ACLARACION_DEBE_DECIR}}": data.aclaracion_debe_decir || "",
            "{{FECHA_IMPRESION}}": fechaActualImpresion,
            "{{EMPRESA_NOMBRE}}": data.empresa_razon_social || "",
            "{{EMPRESA_RUC}}": data.empresa_ruc || "",
            "{{EMPRESA_DIRECCION}}": data.empresa_direccion || "",
            "{{EMPRESA_REPRESENTANTES}}": "",
            "{{NUMERO_BOLETA}}": data.numero_boleta
              ? `${data.tipo_boleta === "Electrónica" ? "EB" : "B"}01-${data.numero_boleta}`
              : "",
            "{{FECHA_BOLETA}}": data.fecha_boleta
              ? data.fecha_boleta.split("-").reverse().join("/")
              : "",

            "{{PRESENTANTE_PERSONA}}": presentantePersona,
            "{{PRESENTANTE_NOMBRES}}": data.p_nombres || "",
            "{{PRESENTANTE_PATERNO}}": data.p_apellido1 || "",
            "{{PRESENTANTE_MATERNO}}": data.p_apellido2 || "",
            "{{PRESENTANTE_DNI}}": data.p_dni === "S/N" ? "" : data.p_dni || "",

            "{{DUA}}": data.dua || "",
            "{{FORMATO_INMATRICULACION}}":
              data.num_formato_inmatriculacion || "",
            "{{TRAMITE_TIPO}}": data.tipo_tramite || "",
            "{{TRAMITE_DIA}}": dia,
            "{{TRAMITE_MES_LETRAS}}": mesLetras,
            "{{TRAMITE_ANIO}}": anio,
          };
        } else {
          map = {
            "{{CLIENTE_NOMBRE}}": "[Nombre del Cliente]",
            "{{CLIENTE_DOCUMENTO}}": "[DNI/RUC]",
            "{{CLIENTE_TELEFONO}}": "[Teléfono]",
            "{{CLIENTE_DIRECCION}}": "[Dirección]",
            "{{VEHICULO_PLACA}}": "[Placa]",
            "{{VEHICULO_MARCA}}": "[Marca]",
            "{{VEHICULO_MODELO}}": "[Modelo]",
            "{{VEHICULO_COLOR}}": "[Color]",
            "{{VEHICULO_CHASIS}}": "[Chasis]",
            "{{VEHICULO_MOTOR}}": "[Motor]",
            "{{VEHICULO_ANIO}}": "[Año]",
            "{{TRAMITE_CODIGO}}": "[Código]",
            "{{TRAMITE_TITULO}}": "[N° Título]",
            "{{TRAMITE_FECHA}}": "[Fecha Trámite]",
            "{{CLAUSULA_MONTO}}": "[Monto]",
            "{{CLAUSULA_FORMA_PAGO}}": "[Forma Pago]",
            "{{CLAUSULA_BANCARIZADO}}": "[Bancarizado]",
            "{{ACLARACION_DICE}}": "[Dice]",
            "{{ACLARACION_DEBE_DECIR}}": "[Debe Decir]",
            "{{FECHA_IMPRESION}}": fechaActualImpresion,
            "{{EMPRESA_NOMBRE}}": "[Nombre Empresa]",
            "{{EMPRESA_RUC}}": "[RUC Empresa]",
            "{{EMPRESA_DIRECCION}}": "[Dirección Empresa]",
            "{{EMPRESA_REPRESENTANTES}}": "[Representantes]",
            "{{NUMERO_BOLETA}}": "[N° Boleta]",
            "{{FECHA_BOLETA}}": "[Fecha Boleta]",

            "{{PRESENTANTE_PERSONA}}": "[Presentante Completo]",
            "{{PRESENTANTE_NOMBRES}}": "[Nombres]",
            "{{PRESENTANTE_PATERNO}}": "[A. Paterno]",
            "{{PRESENTANTE_MATERNO}}": "[A. Materno]",
            "{{PRESENTANTE_DNI}}": "[DNI]",

            "{{DUA}}": "[DUA]",
            "{{FORMATO_INMATRICULACION}}": "[Formato]",
            "{{TRAMITE_TIPO}}": "[Tipo Trámite]",
            "{{TRAMITE_DIA}}": "[Día]",
            "{{TRAMITE_MES_LETRAS}}": "[Mes]",
            "{{TRAMITE_ANIO}}": "[Año]",
          };
        }

        let finalHtml = htmlTemplate;
        Object.keys(map).forEach((key) => {
          finalHtml = finalHtml.split(key).join(map[key] || "");
        });

        setRenderedHtml(finalHtml);
      } catch (err: any) {
        setError(err.message || "Error inesperado al procesar documento.");
      } finally {
        setIsLoading(false);
      }
    };

    generateDocument();
  }, [tramiteId, templateId]);

  const handlePrint = () => window.print();

  return { renderedHtml, orientacion, isLoading, error, navigate, handlePrint };
}
