import { useState, useEffect, useMemo, useCallback } from "react";
import Database from "@tauri-apps/plugin-sql";
import { sileo } from "sileo";

export interface SituacionStat {
  id: string | number;
  nombre: string;
  color: string;
  count: number;
}

export function useSituacionesLogic() {
  const [situaciones, setSituaciones] = useState<SituacionStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const sqlite = await Database.load("sqlite:valeska.db");
      const query = `
                SELECT 
                    cs.id,
                    cs.nombre, 
                    cs.color_hex as color, 
                    COUNT(t.id) as count 
                FROM catalogo_situaciones cs
                LEFT JOIN tramites t ON cs.id = t.situacion_id AND t.deleted_at IS NULL
                WHERE cs.activo = 1
                GROUP BY cs.id, cs.nombre, cs.color_hex
                ORDER BY count DESC
            `;

      const dbResult: any[] = await sqlite.select(query);

      const formatted = dbResult.map((r, idx) => ({
        id: r.id || idx,
        nombre: r.nombre || "Desconocido",
        count: Number(r.count) || 0,
        color: r.color || "#cccccc",
      }));

      setSituaciones(formatted);
    } catch (error: any) {
      console.error("Error cargando estadísticas de situaciones:", error);
      sileo.error({
        title: "Error",
        description: "No se pudieron cargar las estadísticas de situaciones.",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    window.addEventListener("valeska_reload_tramites", loadData);
    return () =>
      window.removeEventListener("valeska_reload_tramites", loadData);
  }, [loadData]);

  const total = useMemo(
    () => situaciones.reduce((acc, curr) => acc + curr.count, 0),
    [situaciones],
  );

  const pieSlices = useMemo(() => {
    if (total === 0) return [];
    let cumulativePercent = 0;

    return situaciones.map((sit) => {
      if (sit.count === 0) return { ...sit, pathData: "", percentage: "0.0" };

      const percent = sit.count / total;

      if (percent === 1) {
        return {
          ...sit,
          pathData: "M 1 0 A 1 1 0 1 1 1 -0.001 Z",
          percentage: "100.0",
        };
      }

      const startX = Math.cos(2 * Math.PI * cumulativePercent);
      const startY = Math.sin(2 * Math.PI * cumulativePercent);
      cumulativePercent += percent;
      const endX = Math.cos(2 * Math.PI * cumulativePercent);
      const endY = Math.sin(2 * Math.PI * cumulativePercent);
      const largeArcFlag = percent > 0.5 ? 1 : 0;

      const pathData = [
        `M ${startX} ${startY}`,
        `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
        `L 0 0`,
      ].join(" ");

      return { ...sit, pathData, percentage: (percent * 100).toFixed(1) };
    });
  }, [situaciones, total]);

  return {
    situaciones,
    total,
    pieSlices,
    isLoading,
    refreshData: loadData,
  };
}
