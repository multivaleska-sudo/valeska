import { useState, useCallback, useEffect } from "react";
import Database from "@tauri-apps/plugin-sql";
import { sileo } from "sileo";

export interface DashboardStats {
  activos: number;
  clientes: number;
  pendientes: number;
  completadosMes: number;
}

export interface RecentTramite {
  id: string;
  codigo: string;
  cliente: string;
  situacion: string;
  fecha: string;
  status: "normal" | "success" | "conflict";
}

export interface SyncStats {
  pendientes: number;
  conflictos: number;
  lastSync: string;
}

export function useDashboardLogic() {
  const [stats, setStats] = useState<DashboardStats>({
    activos: 0,
    clientes: 0,
    pendientes: 0,
    completadosMes: 0,
  });
  const [recentTramites, setRecentTramites] = useState<RecentTramite[]>([]);
  const [syncStats, setSyncStats] = useState<SyncStats>({
    pendientes: 0,
    conflictos: 0,
    lastSync: "Hace un momento",
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const sqlite = await Database.load("sqlite:valeska.db");

      // 1. Total de Clientes (que no hayan sido borrados)
      const clientesRes: any[] = await sqlite.select(
        "SELECT COUNT(id) as count FROM clientes WHERE deleted_at IS NULL",
      );
      const totalClientes = clientesRes[0]?.count || 0;

      // 2. Trámites Activos (Asumimos activos los que NO están en estado Finalizado/Entregado)
      const activosRes: any[] = await sqlite.select(`
        SELECT COUNT(t.id) as count 
        FROM tramites t
        LEFT JOIN catalogo_situaciones s ON t.situacion_id = s.id
        WHERE t.deleted_at IS NULL 
        AND (s.nombre NOT IN ('Entregado', 'Finalizado') OR s.nombre IS NULL)
      `);
      const totalActivos = activosRes[0]?.count || 0;

      // 3. Trámites Pendientes o con Problemas
      const pendientesRes: any[] = await sqlite.select(`
        SELECT COUNT(t.id) as count 
        FROM tramites t
        LEFT JOIN catalogo_situaciones s ON t.situacion_id = s.id
        WHERE t.deleted_at IS NULL 
        AND s.nombre IN ('Pendiente', 'Observado', 'Conflicto')
      `);
      const totalPendientes = pendientesRes[0]?.count || 0;

      // 4. Completados en el mes (Calculamos el timestamp del día 1 del mes actual)
      const date = new Date();
      const firstDayOfMonthMs = new Date(
        date.getFullYear(),
        date.getMonth(),
        1,
      ).getTime();

      const completadosRes: any[] = await sqlite.select(
        `
        SELECT COUNT(t.id) as count 
        FROM tramites t
        LEFT JOIN catalogo_situaciones s ON t.situacion_id = s.id
        WHERE t.deleted_at IS NULL 
        AND s.nombre IN ('Entregado', 'Finalizado')
        AND t.updated_at >= $1
      `,
        [firstDayOfMonthMs],
      );
      const completadosMes = completadosRes[0]?.count || 0;

      setStats({
        activos: totalActivos,
        clientes: totalClientes,
        pendientes: totalPendientes,
        completadosMes: completadosMes,
      });

      // 5. Trámites Recientes (Últimos 5)
      const recientesRes: any[] = await sqlite.select(`
        SELECT 
          t.id as real_id,
          t.codigo_verificacion as codigo, 
          c.razon_social_nombres as cliente, 
          s.nombre as situacion, 
          t.fecha_presentacion as fecha
        FROM tramites t
        LEFT JOIN clientes c ON t.cliente_id = c.id
        LEFT JOIN catalogo_situaciones s ON t.situacion_id = s.id
        WHERE t.deleted_at IS NULL
        ORDER BY t.created_at DESC
        LIMIT 5
      `);

      const mappedRecientes: RecentTramite[] = recientesRes.map((r) => {
        const sitName = (r.situacion || "").toLowerCase();
        let status: "normal" | "success" | "conflict" = "normal";

        if (sitName.includes("entregado") || sitName.includes("finalizado")) {
          status = "success";
        } else if (
          sitName.includes("conflicto") ||
          sitName.includes("observado")
        ) {
          status = "conflict";
        }

        return {
          id: r.real_id || "",
          codigo: r.codigo || "S/N",
          cliente: r.cliente || "Cliente Desconocido",
          situacion: r.situacion || "Sin Estado",
          fecha: r.fecha || "",
          status,
        };
      });

      setRecentTramites(mappedRecientes);

      // 6. Estado de Sincronización (Contar cuántos trámites faltan subir y CONFLICTOS REALES)
      const syncRes: any[] = await sqlite.select(`
        SELECT COUNT(id) as count FROM tramites WHERE sync_status != 'SYNCED'
      `);

      // NUEVA CONSULTA: Contamos los conflictos reales desde la nueva tabla
      const conflictosRes: any[] = await sqlite.select(`
        SELECT COUNT(id) as count FROM sync_conflictos WHERE resuelto = 0
      `);

      setSyncStats({
        pendientes: syncRes[0]?.count || 0,
        conflictos: conflictosRes[0]?.count || 0, // Actualizado con datos reales
        lastSync: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
    } catch (error: any) {
      console.error("Error al cargar datos del dashboard:", error);
      sileo.error({
        title: "Error",
        description: "No se pudieron cargar los datos del dashboard.",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();

    // Escuchar el evento que disparas cuando creas un trámite para refrescar automáticamente
    const handleReload = () => loadDashboardData();
    window.addEventListener("valeska_reload_tramites", handleReload);
    return () =>
      window.removeEventListener("valeska_reload_tramites", handleReload);
  }, [loadDashboardData]);

  return {
    stats,
    recentTramites,
    syncStats,
    isLoading,
    refreshData: loadDashboardData,
  };
}
