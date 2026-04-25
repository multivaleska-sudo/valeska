import { useEffect, useState } from "react";
import Database from "@tauri-apps/plugin-sql";
import { TramiteFormData } from "../../types/tramites/tramite.types";
import { sileo } from "sileo";

export function useTramiteDetail(id: string | undefined) {
  const [tramiteData, setTramiteData] = useState<Partial<TramiteFormData> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadTramite = async () => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    try {
      const sqlite = await Database.load("sqlite:valeska.db");

      const query = `
        SELECT 
          t.id, t.codigo_verificacion, t.tramite_anio, t.n_titulo, t.fecha_presentacion, t.observaciones_generales as observaciones,
          
          t.entrego_tarjeta as check_entrega_tarjeta, t.fecha_entrega_tarjeta, t.metodo_entrega_tarjeta,
          t.entrego_placa as check_entrega_placa, t.fecha_entrega_placa, t.metodo_entrega_placa,
          
          t.tarjeta_en_oficina as check_tarjeta_oficina, t.fecha_tarjeta_en_oficina as fecha_tarjeta_oficina,
          t.placa_en_oficina as check_placa_oficina, t.fecha_placa_en_oficina as fecha_placa_oficina,
          
          c.razon_social_nombres as cliente, c.numero_documento as dni, c.telefono,
          v.marca as vehiculo_marca, v.motor as vehiculo_motor, v.chasis_vin as vehiculo_chasis, v.anio_fabricacion as vehiculo_anio, v.color as vehiculo_color, v.placa as vehiculo_placa, v.modelo as vehiculo_modelo,
          ctt.nombre as tipo_tramite,
          cs.nombre as estado_tramite,
          
          td.tipo_boleta, td.numero_boleta, td.fecha_boleta, td.dua, td.num_formato_inmatriculacion, 
          td.numero_recibo_tramite, td.clausula_monto, td.clausula_forma_pago, td.clausula_pago_bancarizado, td.aclaracion_dice, td.aclaracion_debe_decir,
          
          td.empresa_gestora_id, td.presentante_id, td.representante_legal_id,
          eg.razon_social as empresa_razon_social,
          
          rl.nombres as rl_nombres, rl.primer_apellido as rl_ape1, rl.segundo_apellido as rl_ape2,
          p.nombres as pres_nombres, p.primer_apellido as pres_ape1, p.segundo_apellido as pres_ape2
        FROM tramites t
        JOIN clientes c ON t.cliente_id = c.id
        JOIN vehiculos v ON t.vehiculo_id = v.id
        JOIN catalogo_tipos_tramite ctt ON t.tipo_tramite_id = ctt.id
        JOIN catalogo_situaciones cs ON t.situacion_id = cs.id
        LEFT JOIN tramite_detalles td ON t.id = td.tramite_id
        LEFT JOIN empresas_gestoras eg ON td.empresa_gestora_id = eg.id
        LEFT JOIN representantes_legales rl ON td.representante_legal_id = rl.id
        LEFT JOIN presentantes p ON td.presentante_id = p.id
        WHERE t.id = $1
      `;

      const result: any[] = await sqlite.select(query, [id]);

      if (result.length > 0) {
        const row = result[0];

        let comboEmpresa = row.empresa_razon_social || "";
        if (row.rl_nombres) {
          const rlName = `${row.rl_ape1} ${row.rl_ape2 || ""} ${row.rl_nombres}`.replace(/\s+/g, " ").trim();
          comboEmpresa = `${comboEmpresa} - ${rlName}`;
        }

        const presName = row.pres_nombres
          ? `${row.pres_ape1} ${row.pres_ape2 || ""} ${row.pres_nombres}`.replace(/\s+/g, " ").trim()
          : "";

        const dataFormateada: any = {
          id: row.id,
          tramite_anio: row.tramite_anio,
          cliente: row.cliente || "",
          telefono: row.telefono || "",
          dni: row.dni || "",
          n_titulo: row.n_titulo || "",
          tipo_tramite: row.tipo_tramite || "",
          estado_tramite: row.estado_tramite || "",
          observaciones: row.observaciones || "",
          fecha_presentacion: row.fecha_presentacion || "",

          check_tarjeta_oficina: row.check_tarjeta_oficina === 1,
          fecha_tarjeta_oficina: row.fecha_tarjeta_oficina || "",
          check_placa_oficina: row.check_placa_oficina === 1,
          fecha_placa_oficina: row.fecha_placa_oficina || "",

          check_entrega_tarjeta: row.check_entrega_tarjeta === 1,
          fecha_entrega_tarjeta: row.fecha_entrega_tarjeta || "",
          metodo_entrega_tarjeta: row.metodo_entrega_tarjeta || "",

          check_entrega_placa: row.check_entrega_placa === 1,
          fecha_entrega_placa: row.fecha_entrega_placa || "",
          metodo_entrega_placa: row.metodo_entrega_placa || "",

          codigo_verificacion: row.codigo_verificacion || "",
          vehiculo_marca: row.vehiculo_marca || "",
          vehiculo_motor: row.vehiculo_motor || "",
          vehiculo_chasis: row.vehiculo_chasis || "",
          vehiculo_anio: row.vehiculo_anio || "",
          vehiculo_color: row.vehiculo_color || "",
          vehiculo_placa: row.vehiculo_placa || "",
          vehiculo_modelo: row.vehiculo_modelo || "",

          presentante_empresa: comboEmpresa,
          presentante_persona: presName,

          empresa_gestora_id: row.empresa_gestora_id,
          representante_legal_id: row.representante_legal_id,
          presentante_id: row.presentante_id,

          tipo_boleta: row.tipo_boleta || "Electrónica",
          numero_boleta: row.numero_boleta || "",
          fecha_boleta: row.fecha_boleta || new Date().toISOString().split("T")[0],
          dua: row.dua || "",
          num_formato_inmatriculacion: row.num_formato_inmatriculacion || "",
          numero_recibo_tramite: row.numero_recibo_tramite || "",
          clausula_monto: row.clausula_monto?.toString() || "",
          clausula_forma_pago: row.clausula_forma_pago || "",
          clausula_pago_bancarizado: row.clausula_pago_bancarizado || "",
          aclaracion_dice: row.aclaracion_dice || "",
          aclaracion_debe_decir: row.aclaracion_debe_decir || "",
          fecha_impresion: new Date().toISOString().split("T")[0],
        };

        setTramiteData(dataFormateada);
      } else {
        sileo.error({ title: "No encontrado", description: "Trámite no encontrado." });
      }
    } catch (e: any) {
      console.error("Error cargando trámite:", e);
      sileo.error({ title: "Error de lectura", description: "Ocurrió un error al cargar la base de datos." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadTramite(); }, [id]);

  return { tramiteData, isLoading, loadTramite };
}