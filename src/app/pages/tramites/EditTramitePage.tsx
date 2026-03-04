import React from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, RefreshCcw, User, Car } from "lucide-react";

export function EditTramitePage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const data = {
    codigo: "TRM-2025-001",
    cliente: "Juan Pérez García",
    documento: "45789632",
    vin: "1HGBH41JXMN109186",
    motor: "4T1BF1FK2CU123456",
    placa: "ABC-123",
    marca: "BAJAJ",
    modelo: "RE 205",
    dua: "118-2024-10-002341",
    situacion: "PENDIENTE",
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/tramites")}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
              Editar Expediente
            </h2>
            <p className="text-xs text-blue-600 font-semibold uppercase tracking-tighter">
              ID: {id} | Título: {data.codigo}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/tramites")}
            className="px-4 py-2 text-gray-500 font-medium"
          >
            Descartar
          </button>
          <button className="bg-amber-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-md hover:bg-amber-600 transition-all">
            <RefreshCcw className="w-4 h-4" /> Actualizar Datos
          </button>
        </div>
      </div>

      <div className="space-y-6 pb-20">
        <section className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex items-center gap-2 text-amber-600 font-bold text-[10px] uppercase">
            <User className="w-4 h-4" /> Información del Titular
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <EditField label="Nombre / Razón Social" value={data.cliente} />
            <EditField label="DNI / RUC" value={data.documento} />
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex items-center gap-2 text-amber-600 font-bold text-[10px] uppercase">
            <Car className="w-4 h-4" /> Especificaciones Técnicas
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <EditField label="VIN / Serie" value={data.vin} />
            <EditField label="Número de Motor" value={data.motor} />
            <EditField label="Placa" value={data.placa} />
          </div>
        </section>
      </div>
    </div>
  );
}

function EditField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block ml-1">
        {label}
      </label>
      <input
        type="text"
        defaultValue={value}
        className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none font-medium text-gray-700 bg-white shadow-inner"
      />
    </div>
  );
}
