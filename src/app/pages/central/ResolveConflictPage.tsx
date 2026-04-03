import React, { useEffect, useState, useMemo } from "react";
import { ArrowLeft, Lock, CheckCircle2 } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import {
  useConflictosLogic,
  Conflicto,
} from "../../logic/central/useConflictosLogic";

export function ResolveConflictPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { getConflictoById, resolveConflicto } = useConflictosLogic();

  const [conflicto, setConflicto] = useState<Conflicto | null>(null);
  const [selectedValues, setSelectedValues] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Cargar datos
  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      const data = await getConflictoById(id);
      if (data) {
        setConflicto(data);
        // Pre-seleccionamos los valores locales por defecto
        setSelectedValues(data.datosLocales);
      }
      setIsLoading(false);
    };
    loadData();
  }, [id]);

  // Identificar qué campos son diferentes entre local y remoto
  const differingKeys = useMemo(() => {
    if (!conflicto) return [];
    const keys = Array.from(
      new Set([
        ...Object.keys(conflicto.datosLocales),
        ...Object.keys(conflicto.datosRemotos),
      ]),
    );

    return keys.filter((key) => {
      // Ignoramos metadata de la comprobación
      if (
        ["updated_at", "created_at", "sync_status", "deleted_at"].includes(key)
      )
        return false;

      const localVal = JSON.stringify(conflicto.datosLocales[key]);
      const remoteVal = JSON.stringify(conflicto.datosRemotos[key]);
      return localVal !== remoteVal;
    });
  }, [conflicto]);

  const handleSelectValue = (key: string, value: any) => {
    setSelectedValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleResolve = async () => {
    if (!conflicto) return;

    // Ejecutamos la lógica de actualización en SQL
    await resolveConflicto(
      conflicto.id,
      conflicto.tablaAfectada,
      conflicto.registroId,
      selectedValues,
    );

    // Regresamos a la lista
    navigate("/central/conflictos");
  };

  if (isLoading) {
    return <div className="p-8 text-center">Cargando detalles...</div>;
  }

  if (!conflicto) {
    return (
      <div className="p-8 text-center text-red-500">
        Conflicto no encontrado.
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/central/conflictos")}
          className="p-2 hover:bg-white rounded-md transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#6B7280]" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-[#111827]">
            Resolver: {conflicto.identificadorVisual}
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Compara y selecciona los datos correctos para{" "}
            <strong>{conflicto.tablaAfectada}</strong>
          </p>
        </div>
      </div>

      <div className="bg-[#FEF3C7] border border-[#FDE047] rounded-lg p-4 flex items-start gap-3">
        <Lock className="w-5 h-5 text-[#92400E] shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-[#92400E]">
            Atención: Discrepancia detectada
          </h3>
          <p className="text-sm text-[#B45309] mt-1">
            Este registro fue modificado localmente y en la nube al mismo
            tiempo. Selecciona el valor que debe prevalecer.
          </p>
        </div>
      </div>

      {differingKeys.length === 0 ? (
        <div className="bg-white rounded-lg border border-[#E5E7EB] p-8 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold">
            No hay diferencias significativas
          </h2>
          <p className="text-gray-500 text-sm mt-2 mb-6">
            Los datos principales coinciden.
          </p>
          <button
            onClick={handleResolve}
            className="px-4 py-2 bg-[#2563EB] text-white rounded-md hover:bg-[#1D4ED8]"
          >
            Marcar como Resuelto
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-[#E5E7EB] p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#111827] mb-6">
            Selección de Valores Campo por Campo
          </h2>

          <div className="space-y-6">
            {differingKeys.map((key) => {
              const localVal = conflicto.datosLocales[key];
              const remoteVal = conflicto.datosRemotos[key];
              const isLocalSelected =
                JSON.stringify(selectedValues[key]) ===
                JSON.stringify(localVal);

              return (
                <div
                  key={key}
                  className="border border-[#E5E7EB] rounded-lg p-4 bg-gray-50/50"
                >
                  <h3 className="text-sm font-bold text-[#111827] mb-3 uppercase tracking-wide">
                    Campo: {key.replace(/_/g, " ")}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Botón Valor Local */}
                    <button
                      onClick={() => handleSelectValue(key, localVal)}
                      className={`p-4 border-2 rounded-md text-left transition-all relative overflow-hidden ${
                        isLocalSelected
                          ? "border-[#2563EB] bg-[#EFF6FF] shadow-sm"
                          : "border-[#E5E7EB] bg-white hover:border-[#93C5FD]"
                      }`}
                    >
                      {isLocalSelected && (
                        <div className="absolute top-2 right-2 text-[#2563EB]">
                          <CheckCircle2 size={16} />
                        </div>
                      )}
                      <div className="text-xs font-semibold text-[#6B7280] mb-2 uppercase">
                        Tu versión local
                      </div>
                      <div className="text-sm text-[#111827] font-mono break-all bg-white/50 p-2 rounded border border-transparent">
                        {String(localVal || "Nulo/Vacío")}
                      </div>
                    </button>

                    {/* Botón Valor Remoto */}
                    <button
                      onClick={() => handleSelectValue(key, remoteVal)}
                      className={`p-4 border-2 rounded-md text-left transition-all relative overflow-hidden ${
                        !isLocalSelected
                          ? "border-[#2563EB] bg-[#EFF6FF] shadow-sm"
                          : "border-[#E5E7EB] bg-white hover:border-[#93C5FD]"
                      }`}
                    >
                      {!isLocalSelected && (
                        <div className="absolute top-2 right-2 text-[#2563EB]">
                          <CheckCircle2 size={16} />
                        </div>
                      )}
                      <div className="text-xs font-semibold text-[#6B7280] mb-2 uppercase">
                        Versión en Nube
                      </div>
                      <div className="text-sm text-[#111827] font-mono break-all bg-white/50 p-2 rounded border border-transparent">
                        {String(remoteVal || "Nulo/Vacío")}
                      </div>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 pt-6 border-t border-[#E5E7EB] flex justify-end gap-3">
            <button
              onClick={() => navigate("/central/conflictos")}
              className="px-4 py-2 border border-[#E5E7EB] text-[#374151] rounded-md hover:bg-gray-50 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleResolve}
              className="px-6 py-2 bg-[#2563EB] text-white rounded-md hover:bg-[#1D4ED8] transition-colors shadow-sm font-medium flex items-center gap-2"
            >
              <CheckCircle2 size={18} />
              Resolver y Guardar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
