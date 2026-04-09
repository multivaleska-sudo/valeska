import React, { useEffect, useState } from "react";
import { ArrowLeft, Monitor, CheckCircle2, XCircle } from "lucide-react";
import { useNavigate } from "react-router";
import Database from "@tauri-apps/plugin-sql";

interface Dispositivo {
  id: string;
  macAddress: string;
  nombreEquipo: string;
  autorizado: boolean;
  sucursal: string;
  syncStatus: string;
}

export function DevicesPage() {
  const navigate = useNavigate();
  const [devices, setDevices] = useState<Dispositivo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const sqlite = await Database.load("sqlite:valeska.db");
        const result: any[] = await sqlite.select(`
          SELECT 
            d.id, 
            d.mac_address, 
            d.nombre_equipo, 
            d.autorizado, 
            d.sync_status,
            s.nombre as sucursal_nombre
          FROM dispositivos d
          LEFT JOIN sucursales s ON d.sucursal_id = s.id
          WHERE d.deleted_at IS NULL
        `);

        setDevices(
          result.map((row) => ({
            id: row.id,
            macAddress: row.mac_address,
            nombreEquipo: row.nombre_equipo,
            autorizado: row.autorizado === 1 || row.autorizado === true,
            sucursal: row.sucursal_nombre || "Desconocida",
            syncStatus: row.sync_status,
          })),
        );
      } catch (error) {
        console.error("Error fetching devices:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDevices();
  }, []);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/central")}
          className="p-2 hover:bg-white rounded-md transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#6B7280]" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-[#111827]">
            Monitor de Instancias
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Gestión de dispositivos y terminales activas.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-[#6B7280]">
            Cargando dispositivos...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                    Equipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                    MAC Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                    Sucursal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                    Estado Sincronización
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                    Autorización
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#E5E7EB]">
                {devices.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-8 text-center text-sm text-[#6B7280]"
                    >
                      No se encontraron dispositivos vinculados.
                    </td>
                  </tr>
                ) : (
                  devices.map((device) => (
                    <tr
                      key={device.id}
                      className="hover:bg-[#F9FAFB] transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <Monitor className="w-5 h-5 text-[#6B7280]" />
                          <span className="text-sm font-medium text-[#111827]">
                            {device.nombreEquipo}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-[#6B7280]">
                        {device.macAddress}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#111827]">
                        {device.sucursal}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs font-medium bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {device.syncStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${
                            device.autorizado
                              ? "bg-[#DCFCE7] text-[#16A34A]"
                              : "bg-[#FEE2E2] text-[#DC2626]"
                          }`}
                        >
                          {device.autorizado ? (
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 mr-1" />
                          )}
                          {device.autorizado ? "Autorizado" : "Bloqueado"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
