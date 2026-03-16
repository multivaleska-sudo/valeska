import { useParams } from "react-router";
import { TramiteForm } from "../../components/tramites/TramiteForm";
import { MOCK_TRAMITES } from "../../mocks/tramites.mock"; // Esto cambiará por un fetch a SQLite luego

export function TramiteDetailPage() {
  const { id } = useParams();

  // Buscamos el dato en los mocks
  const data = MOCK_TRAMITES.find((t) => t.id === Number(id));

  if (!data)
    return (
      <div className="p-10 text-center text-gray-500 font-bold">
        Cargando datos o trámite no encontrado...
      </div>
    );

  return <TramiteForm mode="view" initialData={data as any} />;
}
