import React from "react";
import { ArrowLeft, Monitor } from "lucide-react";
import { useNavigate } from "react-router";

export function DevicesPage() {
  const navigate = useNavigate();

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

      <div className="bg-white rounded-lg border border-[#E5E7EB] p-12 text-center flex flex-col items-center min-h-[400px] justify-center">
        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
          <Monitor className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Módulo en Construcción
        </h2>
        <p className="text-gray-500 max-w-md">
          Próximamente podrás ver aquí todas las computadoras (mac address)
          autorizadas que están conectadas a tu sistema de sincronización.
        </p>
      </div>
    </div>
  );
}
