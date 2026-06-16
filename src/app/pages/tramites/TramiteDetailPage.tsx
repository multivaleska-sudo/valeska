import React from "react";
import { useParams } from "react-router";
import { AlertTriangle } from "lucide-react";
import { TramiteForm } from "../../components/tramites/TramiteForm";
import { useTramiteDetail } from "../../logic/tramites/useTramiteDetail";

export function TramiteDetailPage() {
  const { id } = useParams();
  const { tramiteData, isLoading, syncIntegrityWarning } = useTramiteDetail(id);

  if (isLoading)
    return (
      <div className="p-10 text-center font-bold text-gray-500 animate-pulse">
        Abriendo expediente...
      </div>
    );

  if (!tramiteData)
    return (
      <div className="p-10 text-center font-bold text-red-500">
        Trámite no encontrado.
      </div>
    );

  return (
    <div className="space-y-4">
      {syncIntegrityWarning && (
        <div className="mx-6 mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-800 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 shrink-0" size={20} />
            <div>
              <p className="text-sm font-black uppercase tracking-wide">
                Registro incompleto por sincronizacion
              </p>
              <p className="mt-1 text-sm font-semibold">
                {syncIntegrityWarning} Ejecuta la resincronizacion de tramites desde Configuracion.
              </p>
            </div>
          </div>
        </div>
      )}
      <TramiteForm mode="view" initialData={tramiteData} />
    </div>
  );
}
