import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import { TramiteForm } from "../../components/tramites/TramiteForm";
import Database from "@tauri-apps/plugin-sql";

export function TramiteDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sqlite = await Database.load("sqlite:valeska.db");

        const query = `
          SELECT 
            t.id, t.codigo_verificacion, t.tramite_anio, t.n_titulo, t.fecha_presentacion, t.observaciones_generales as observaciones,
            t.entrego_tarjeta as check_entrega_tarjeta, t.fecha_entrega_tarjeta, t.entrego_placa as check_entrega_placa, t.fecha_entrega_placa,
            c.razon_social_nombres as cliente, c.numero_documento as dni, c.telefono,
            v.marca as vehiculo_marca, v.motor as vehiculo_motor, v.chasis_vin as vehiculo_chasis, v.anio_fabricacion as vehiculo_anio, v.color as vehiculo_color, v.placa as vehiculo_placa, v.modelo as vehiculo_modelo,
            ctt.nombre as tipo_tramite,
            cs.nombre as estado_tramite,
            td.presentante_persona, td.tipo_boleta, td.numero_boleta, td.fecha_boleta, td.dua, td.num_formato_inmatriculacion, td.clausula_monto, td.clausula_forma_pago, td.clausula_pago_bancarizado, td.aclaracion_dice, td.aclaracion_debe_decir
          FROM tramites t
          JOIN clientes c ON t.cliente_id = c.id
          JOIN vehiculos v ON t.vehiculo_id = v.id
          JOIN catalogo_tipos_tramite ctt ON t.tipo_tramite_id = ctt.id
          JOIN catalogo_situaciones cs ON t.situacion_id = cs.id
          LEFT JOIN tramite_detalles td ON t.id = td.tramite_id
          WHERE t.id = $1
        `;
        const result: any[] = await sqlite.select(query, [id]);

        if (result.length > 0) {
          const row = result[0];
          row.check_entrega_tarjeta = row.check_entrega_tarjeta === 1;
          row.check_entrega_placa = row.check_entrega_placa === 1;
          setData(row);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchData();
  }, [id]);

  if (isLoading)
    return (
      <div className="p-10 text-center font-bold text-gray-500 animate-pulse">
        Abriendo expediente...
      </div>
    );
  if (!data)
    return (
      <div className="p-10 text-center font-bold text-red-500">
        Trámite no encontrado.
      </div>
    );

  return <TramiteForm mode="view" initialData={data} />;
}
