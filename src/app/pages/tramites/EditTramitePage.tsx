import React from "react";
import { useParams } from "react-router";
import { TramiteForm } from "../../components/tramites/TramiteForm";
import { useTramiteDetail } from "../../logic/tramites/useTramiteDetail";

export function EditTramitePage() {
  const { id } = useParams();
  const { tramiteData, isLoading } = useTramiteDetail(id);

  if (isLoading)
    return (
      <div className="p-10 text-center font-bold text-gray-500 animate-pulse">
        Cargando datos para edición...
      </div>
    );

  if (!tramiteData)
    return (
      <div className="p-10 text-center font-bold text-red-500">
        Trámite no encontrado.
      </div>
    );

  return <TramiteForm mode="edit" initialData={tramiteData} />;
}
