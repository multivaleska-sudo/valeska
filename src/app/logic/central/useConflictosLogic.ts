import { useState, useCallback } from "react";
import Database from "@tauri-apps/plugin-sql";
import { sileo } from "sileo";

export interface Conflicto {
  id: string;
  tablaAfectada: string;
  registroId: string;
  identificadorVisual: string;
  datosLocales: Record<string, any>;
  datosRemotos: Record<string, any>;
  fechaConflicto: number;
}

export function useConflictosLogic() {
  const [conflictos, setConflictos] = useState<Conflicto[]>([]);
  const [conflictCount, setConflictCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const loadConflictCount = useCallback(async () => {
    try {
      const sqlite = await Database.load("sqlite:valeska.db");
      const res: any[] = await sqlite.select(
        "SELECT COUNT(id) as count FROM sync_conflictos WHERE resuelto = 0",
      );
      setConflictCount(res[0]?.count || 0);
    } catch (error) {
      console.error("Error obteniendo conteo de conflictos:", error);
    }
  }, []);

  // 2. OBTENER LISTA DE CONFLICTOS (Para ConflictListPage)
  const loadConflictos = useCallback(async () => {
    setIsLoading(true);
    try {
      const sqlite = await Database.load("sqlite:valeska.db");
      const res: any[] = await sqlite.select(
        "SELECT * FROM sync_conflictos WHERE resuelto = 0 ORDER BY fecha_conflicto DESC",
      );

      const mapeados: Conflicto[] = res.map((row) => ({
        id: row.id,
        tablaAfectada: row.tabla_afectada,
        registroId: row.registro_id,
        identificadorVisual: row.identificador_visual || "Registro Desconocido",
        datosLocales: JSON.parse(row.datos_locales || "{}"),
        datosRemotos: JSON.parse(row.datos_remotos || "{}"),
        fechaConflicto: row.fecha_conflicto,
      }));

      setConflictos(mapeados);
    } catch (error) {
      console.error("Error cargando conflictos:", error);
      sileo.error({ title: "Error al cargar la lista de conflictos" });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 3. OBTENER UN CONFLICTO ESPECÍFICO (Para ResolveConflictPage)
  const getConflictoById = async (id: string): Promise<Conflicto | null> => {
    try {
      const sqlite = await Database.load("sqlite:valeska.db");
      const res: any[] = await sqlite.select(
        "SELECT * FROM sync_conflictos WHERE id = $1 LIMIT 1",
        [id],
      );

      if (res.length === 0) return null;

      const row = res[0];
      return {
        id: row.id,
        tablaAfectada: row.tabla_afectada,
        registroId: row.registro_id,
        identificadorVisual: row.identificador_visual,
        datosLocales: JSON.parse(row.datos_locales || "{}"),
        datosRemotos: JSON.parse(row.datos_remotos || "{}"),
        fechaConflicto: row.fecha_conflicto,
      };
    } catch (error) {
      console.error("Error cargando el conflicto:", error);
      return null;
    }
  };

  // 4. RESOLVER CONFLICTO DINÁMICAMENTE
  const resolveConflicto = async (
    conflictoId: string,
    tablaAfectada: string,
    registroId: string,
    resolvedData: Record<string, any>,
  ) => {
    const promise = async () => {
      const sqlite = await Database.load("sqlite:valeska.db");
      const now = Date.now();

      // Construir la consulta UPDATE dinámicamente basándonos en los campos resueltos
      // Excluimos campos de control de la actualización de datos crudos
      const keysToUpdate = Object.keys(resolvedData).filter(
        (k) =>
          ![
            "id",
            "created_at",
            "updated_at",
            "deleted_at",
            "sync_status",
          ].includes(k),
      );

      if (keysToUpdate.length > 0) {
        const setClauses = keysToUpdate
          .map((key, index) => `${key} = $${index + 1}`)
          .join(", ");
        const values = keysToUpdate.map((key) => resolvedData[key]);

        // Añadimos los campos de sincronización obligatorios al final
        const finalQuery = `UPDATE ${tablaAfectada} SET ${setClauses}, updated_at = $${values.length + 1}, sync_status = 'LOCAL_UPDATE' WHERE id = $${values.length + 2}`;

        await sqlite.execute(finalQuery, [...values, now, registroId]);
      }

      // Marcar el conflicto como resuelto
      await sqlite.execute(
        "UPDATE sync_conflictos SET resuelto = 1 WHERE id = $1",
        [conflictoId],
      );
    };

    return sileo.promise(promise(), {
      loading: { title: "Resolviendo conflicto..." },
      success: { title: "Conflicto resuelto y registro actualizado" },
      error: { title: "No se pudo resolver el conflicto" },
    });
  };

  return {
    conflictos,
    conflictCount,
    isLoading,
    loadConflictos,
    loadConflictCount,
    getConflictoById,
    resolveConflicto,
  };
}
