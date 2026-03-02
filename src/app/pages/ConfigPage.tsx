import { Settings, Save } from "lucide-react";

export function ConfigPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#111827]">Configuración</h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Configuración del sistema y dispositivo
        </p>
      </div>

      <div className="bg-white rounded-lg border border-[#E5E7EB] p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-[#111827] mb-4">
            General
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-2">
                Nombre del dispositivo
              </label>
              <input
                type="text"
                defaultValue="PC-OFICINA-01"
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-2">
                Sucursal
              </label>
              <select className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md">
                <option>Sucursal Principal</option>
                <option>Sucursal 2</option>
              </select>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-[#E5E7EB]">
          <h2 className="text-lg font-semibold text-[#111827] mb-4">
            Sincronización
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-[#111827]">
                  Sincronización automática
                </div>
                <div className="text-xs text-[#6B7280] mt-1">
                  Sincronizar cambios cada 5 minutos
                </div>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button className="px-4 py-2 bg-[#2563EB] text-white rounded-md hover:bg-[#1D4ED8] transition-colors flex items-center gap-2">
            <Save className="w-4 h-4" />
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}
