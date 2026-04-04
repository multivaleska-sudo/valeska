import { useEffect, useState } from "react";
import Database from "@tauri-apps/plugin-sql";
import { TramiteFormData } from "../../types/tramites/tramite.types";
import { sileo } from "sileo";

export function useTramiteDetail(id: string | undefined) {
  const [data, setData] = useState<Partial<TramiteFormData> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
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
            
            -- FORMATO CORREGIDO: PRIMER_APELLIDO SEGUNDO_APELLIDO NOMBRES - DNI
            CASE 
              WHEN p.id IS NOT NULL THEN 
                 REPLACE(TRIM(COALESCE(p.primer_apellido, '') || ' ' || COALESCE(p.segundo_apellido, '') || ' ' || COALESCE(p.nombres, '')), '  ', ' ') || CASE WHEN p.dni IS NOT NULL AND p.dni != 'S/N' AND p.dni != '' THEN ' - ' || p.dni ELSE '' END
              ELSE ''
            END as presentante_persona,
            
            td.tipo_boleta, td.numero_boleta, td.fecha_boleta, td.dua, td.num_formato_inmatriculacion, 
            td.numero_recibo_tramite,
            td.clausula_monto, td.clausula_forma_pago, td.clausula_pago_bancarizado, td.aclaracion_dice, td.aclaracion_debe_decir,
            eg.ruc as empresa_ruc, eg.razon_social as empresa_razon_social
          FROM tramites t
          JOIN clientes c ON t.cliente_id = c.id
          JOIN vehiculos v ON t.vehiculo_id = v.id
          JOIN catalogo_tipos_tramite ctt ON t.tipo_tramite_id = ctt.id
          JOIN catalogo_situaciones cs ON t.situacion_id = cs.id
          LEFT JOIN tramite_detalles td ON t.id = td.tramite_id
          LEFT JOIN empresas_gestoras eg ON td.empresa_gestora_id = eg.id
          LEFT JOIN presentantes p ON td.presentante_id = p.id
          WHERE t.id = $1
        `;

        const result: any[] = await sqlite.select(query, [id]);

        if (result.length > 0) {
          const row = result[0];

          row.check_entrega_tarjeta = row.check_entrega_tarjeta === 1;
          row.check_entrega_placa = row.check_entrega_placa === 1;
          row.check_tarjeta_oficina = row.check_tarjeta_oficina === 1;
          row.check_placa_oficina = row.check_placa_oficina === 1;

          if (row.empresa_ruc && row.empresa_razon_social) {
            row.presentante_empresa = `${row.empresa_razon_social} - ${row.empresa_ruc}`;
          } else {
            row.presentante_empresa = "";
          }

          // Limpieza final de espacios para evitar errores visuales
          if (row.presentante_persona) {
            row.presentante_persona = row.presentante_persona
              .replace(/\s+/g, " ")
              .trim();
          }

          setData(row);
        } else {
          setError("Trámite no encontrado.");
          sileo.error({
            title: "No encontrado",
            description: "Trámite no encontrado.",
          });
        }
      } catch (e: any) {
        console.error("Error cargando trámite:", e);
        setError("Ocurrió un error al cargar la base de datos.");
        sileo.error({
          title: "Error de lectura",
          description: "Ocurrió un error al cargar la base de datos.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  return { data, isLoading, error };
}
