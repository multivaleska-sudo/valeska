import React from "react";
import { useParams } from "react-router";
import { TramiteForm } from "../../components/tramites/TramiteForm";
import { useTramiteDetail } from "../../logic/tramites/useTramiteDetail";

export function EditTramitePage() {
  const { id } = useParams();
  const { data, isLoading, error } = useTramiteDetail(id);

  if (isLoading)
    return (
      <div className="p-10 text-center font-bold text-gray-500 animate-pulse">
        Recuperando expediente...
      </div>
    );

  if (error || !data)
    return (
      <div className="p-10 text-center font-bold text-red-500">
        El trámite no fue encontrado o ha sido eliminado.
      </div>
    );

  return <TramiteForm mode="edit" initialData={data} />;
}
