import { useState, useCallback, useEffect } from "react";
import Database from "@tauri-apps/plugin-sql";
import { sileo } from "sileo";

export interface DashboardStats {
  activos: number;
  clientes: number;
  observados: number;
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
    observados: 0,
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

      const clientesRes: any[] = await sqlite.select(
        "SELECT COUNT(id) as count FROM clientes WHERE deleted_at IS NULL",
      );
      const totalClientes = clientesRes[0]?.count || 0;

      const activosRes: any[] = await sqlite.select(`
        SELECT COUNT(t.id) as count 
        FROM tramites t
        LEFT JOIN catalogo_situaciones s ON t.situacion_id = s.id
        WHERE t.deleted_at IS NULL 
        AND UPPER(IFNULL(s.nombre, '')) NOT IN ('INSCRITO', 'CONCLUIDO', 'ENTREGADO', 'FINALIZADO')
      `);
      const totalActivos = activosRes[0]?.count || 0;

      const observadosRes: any[] = await sqlite.select(`
        SELECT COUNT(t.id) as count 
        FROM tramites t
        LEFT JOIN catalogo_situaciones s ON t.situacion_id = s.id
        WHERE t.deleted_at IS NULL 
        AND UPPER(IFNULL(s.nombre, '')) IN ('OBSERVADO', 'REINGRESADO', 'TACHA', 'TACHADO')
      `);
      const totalObservados = observadosRes[0]?.count || 0;

      const date = new Date();
      const firstDayOfMonthMs = new Date(
        date.getFullYear(),
        date.getMonth(),
        1,
      ).getTime();

      const completadosRes: any[] = await sqlite.select(`
        SELECT COUNT(t.id) as count 
        FROM tramites t
        LEFT JOIN catalogo_situaciones s ON t.situacion_id = s.id
        WHERE t.deleted_at IS NULL 
        AND UPPER(IFNULL(s.nombre, '')) IN ('INSCRITO', 'CONCLUIDO', 'ENTREGADO', 'FINALIZADO')
        AND t.updated_at >= $1
      `, [firstDayOfMonthMs]);
      const completadosMes = completadosRes[0]?.count || 0;

      setStats({
        activos: totalActivos,
        clientes: totalClientes,
        observados: totalObservados,
        completadosMes: completadosMes,
      });

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
        ORDER BY t.updated_at DESC
        LIMIT 5
      `);

      const mappedRecientes: RecentTramite[] = recientesRes.map((r) => {
        const sitName = (r.situacion || "").toUpperCase();
        let status: "normal" | "success" | "conflict" = "normal";

        if (['INSCRITO', 'CONCLUIDO', 'ENTREGADO', 'FINALIZADO'].includes(sitName)) {
          status = "success";
        } else if (['OBSERVADO', 'REINGRESADO', 'TACHA', 'TACHADO'].includes(sitName)) {
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

      const syncRes: any[] = await sqlite.select(`
        SELECT 
          (SELECT COUNT(id) FROM tramites WHERE sync_status != 'SYNCED') +
          (SELECT COUNT(id) FROM clientes WHERE sync_status != 'SYNCED') +
          (SELECT COUNT(id) FROM vehiculos WHERE sync_status != 'SYNCED') +
          (SELECT COUNT(id) FROM empresas_gestoras WHERE sync_status != 'SYNCED') +
          (SELECT COUNT(id) FROM representantes_legales WHERE sync_status != 'SYNCED') 
        as count
      `);

      const conflictosRes: any[] = await sqlite.select(`
        SELECT COUNT(id) as count FROM sync_conflictos WHERE resuelto = 0
      `);

      const lastSyncLocal = localStorage.getItem("valeska_last_sync_display");

      setSyncStats({
        pendientes: syncRes[0]?.count || 0,
        conflictos: conflictosRes[0]?.count || 0,
        lastSync: lastSyncLocal || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
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

    const handleReload = () => loadDashboardData();
    window.addEventListener("valeska_reload_tramites", handleReload);
    window.addEventListener("valeska_sync_completed", handleReload);

    return () => {
      window.removeEventListener("valeska_reload_tramites", handleReload);
      window.removeEventListener("valeska_sync_completed", handleReload);
    };
  }, [loadDashboardData]);

  return {
    stats,
    recentTramites,
    syncStats,
    isLoading,
    refreshData: loadDashboardData,
  };
}