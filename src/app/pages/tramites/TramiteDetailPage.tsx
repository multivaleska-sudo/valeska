import React from "react";
import { useParams } from "react-router";
import { TramiteForm } from "../../components/tramites/TramiteForm";
import { useTramiteDetail } from "../../logic/tramites/useTramiteDetail";

export function TramiteDetailPage() {
  const { id } = useParams();
  const { data, isLoading, error } = useTramiteDetail(id);

  if (isLoading)
    return (
      <div className="p-10 text-center font-bold text-gray-500 animate-pulse">
        Abriendo expediente...
      </div>
    );

  if (error || !data)
    return (
      <div className="p-10 text-center font-bold text-red-500">
        {error || "Trámite no encontrado."}
      </div>
    );

  return <TramiteForm mode="view" initialData={data} />;
}
