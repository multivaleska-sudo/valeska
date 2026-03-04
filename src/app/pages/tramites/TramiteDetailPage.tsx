import React, { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Copy, Check, User, Car, Edit } from "lucide-react";

export function TramiteDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

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
    <div className="p-6 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
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
              Expediente {data.codigo}
            </h2>
            <p className="text-xs text-gray-500 font-medium">
              Consulta de información
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate(`/tramites/${id}/edit`)}
          className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-sm hover:bg-gray-50 transition-all"
        >
          <Edit className="w-4 h-4 text-amber-500" /> Editar
        </button>
      </div>

      <div className="space-y-6">
        <section className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex items-center gap-2 text-blue-600 font-bold text-[10px] uppercase">
            <User className="w-4 h-4" /> Información del Cliente
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <ReadOnlyField label="Nombre / Razón Social" value={data.cliente} />
            <ReadOnlyField label="DNI / RUC" value={data.documento} />
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex items-center gap-2 text-blue-600 font-bold text-[10px] uppercase">
            <Car className="w-4 h-4" /> Especificaciones del Vehículo
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <ReadOnlyField label="VIN / Serie" value={data.vin} mono />
            <ReadOnlyField label="Número de Motor" value={data.motor} mono />
            <ReadOnlyField label="Placa" value={data.placa} mono />
          </div>
        </section>
      </div>
    </div>
  );
}

function ReadOnlyField({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-tight">
        {label}
      </label>
      <div className="flex items-center h-11 px-3 bg-white border border-gray-100 rounded-lg group relative transition-all hover:border-blue-200">
        <span
          className={`text-sm font-semibold text-gray-700 flex-1 truncate ${mono ? "font-mono" : ""}`}
        >
          {value}
        </span>
        <button
          onClick={copy}
          className="p-1.5 hover:bg-blue-100 text-blue-600 rounded-md transition-all opacity-0 group-hover:opacity-100"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}
