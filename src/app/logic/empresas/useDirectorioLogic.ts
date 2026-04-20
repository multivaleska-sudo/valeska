import { useState, useEffect, useCallback } from "react";
import Database from "@tauri-apps/plugin-sql";
import { sileo } from "sileo";

export interface Presentante {
  id: string;
  dni: string;
  primer_apellido: string;
  segundo_apellido: string;
  nombres: string;
}

export interface RepresentanteCombined {
  id: string;
  empresa_id: string;
  ruc: string;
  razon_social: string;
  direccion: string;
  dni: string;
  primer_apellido: string;
  segundo_apellido: string;
  nombres: string;
  partida_registral: string;
  oficina_registral: string;
  domicilio: string;
}

export function useDirectorioLogic() {
  const [representantes, setRepresentantes] = useState<RepresentanteCombined[]>(
    [],
  );
  const [presentantes, setPresentantes] = useState<Presentante[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const initialPresentante: Presentante = {
    id: "",
    dni: "",
    primer_apellido: "",
    segundo_apellido: "",
    nombres: "",
  };

  const initialRepresentante: RepresentanteCombined = {
    id: "",
    empresa_id: "",
    ruc: "",
    razon_social: "",
    direccion: "",
    dni: "",
    primer_apellido: "",
    segundo_apellido: "",
    nombres: "",
    partida_registral: "",
    oficina_registral: "",
    domicilio: "",
  };

  const [formPresentante, setFormPresentante] =
    useState<Presentante>(initialPresentante);
  const [formRepresentante, setFormRepresentante] =
    useState<RepresentanteCombined>(initialRepresentante);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const db = await Database.load("sqlite:valeska.db");

      // 1. CARGAMOS LA LISTA FUSIONADA (Solo los NO eliminados)
      const repRes = await db.select<RepresentanteCombined[]>(
        `SELECT 
          rl.id, 
          rl.empresa_gestora_id as empresa_id, 
          eg.ruc,
          eg.razon_social,
          eg.direccion,
          rl.dni, 
          rl.primer_apellido, 
          rl.segundo_apellido, 
          rl.nombres, 
          rl.partida_registral, 
          rl.oficina_registral, 
          rl.domicilio 
        FROM representantes_legales rl 
        JOIN empresas_gestoras eg ON rl.empresa_gestora_id = eg.id 
        WHERE rl.deleted_at IS NULL 
        ORDER BY eg.razon_social ASC, rl.primer_apellido ASC`,
      );

      // 2. CARGAMOS LOS TRABAJADORES INDEPENDIENTES (Solo los NO eliminados)
      const presRes = await db.select<Presentante[]>(
        "SELECT id, dni, primer_apellido, segundo_apellido, nombres FROM presentantes WHERE deleted_at IS NULL ORDER BY primer_apellido ASC, nombres ASC",
      );

      setRepresentantes(repRes || []);
      setPresentantes(presRes || []);
    } catch (error) {
      console.error("Error al cargar directorio:", error);
      sileo.error({
        title: "Error de carga",
        description: "No se pudieron cargar los datos del directorio.",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ============================================================================
  // AUTOCOMPLETADO MAGICO DE RUC
  // ============================================================================
  const buscarEmpresaPorRuc = async (ruc: string) => {
    if (ruc.length !== 11) return;
    try {
      const db = await Database.load("sqlite:valeska.db");
      const res: any[] = await db.select(
        "SELECT id, razon_social, direccion FROM empresas_gestoras WHERE ruc = $1",
        [ruc],
      );
      if (res.length > 0) {
        setFormRepresentante((prev) => ({
          ...prev,
          empresa_id: res[0].id,
          razon_social: res[0].razon_social,
          direccion: res[0].direccion || "",
        }));
      } else {
        setFormRepresentante((prev) => ({
          ...prev,
          empresa_id: "",
          razon_social: "",
          direccion: "",
        }));
      }
    } catch (e) {
      console.error("Error buscando RUC:", e);
    }
  };

  // ============================================================================
  // GUARDAR PRESENTANTE (Aplica tu idea de "Revivir" si ya existe oculto)
  // ============================================================================
  const savePresentante = async () => {
    if (isSaving) return;

    if (
      !formPresentante.dni ||
      !formPresentante.nombres ||
      !formPresentante.primer_apellido
    ) {
      sileo.warning({
        title: "Campos incompletos",
        description: "DNI, Nombres y Primer Apellido son obligatorios.",
      });
      return;
    }

    setIsSaving(true);
    try {
      const db = await Database.load("sqlite:valeska.db");
      const now = Date.now();

      // TU IDEA AQUÍ: Buscar si el DNI ya existe (incluso si está oculto)
      const existing: any[] = await db.select(
        "SELECT id FROM presentantes WHERE dni = $1",
        [formPresentante.dni],
      );

      if (existing.length > 0) {
        // Si existe, lo revivimos (deleted_at = NULL) y actualizamos sus datos
        const targetId = existing[0].id;
        await db.execute(
          "UPDATE presentantes SET primer_apellido=$1, segundo_apellido=$2, nombres=$3, deleted_at=NULL, updated_at=$4, sync_status='LOCAL_UPDATE' WHERE id=$5",
          [
            formPresentante.primer_apellido,
            formPresentante.segundo_apellido,
            formPresentante.nombres,
            now,
            targetId,
          ],
        );
      } else {
        // Si no existe para nada, lo insertamos como nuevo
        const newId = formPresentante.id || crypto.randomUUID();
        await db.execute(
          "INSERT INTO presentantes (id, dni, primer_apellido, segundo_apellido, nombres, created_at, updated_at, sync_status) VALUES ($1, $2, $3, $4, $5, $6, $7, 'LOCAL_INSERT')",
          [
            newId,
            formPresentante.dni,
            formPresentante.primer_apellido,
            formPresentante.segundo_apellido,
            formPresentante.nombres,
            now,
            now,
          ],
        );
      }

      sileo.success({
        title: "Guardado exitoso",
        description: "El trabajador independiente ha sido guardado.",
      });
      setFormPresentante(initialPresentante);
      window.dispatchEvent(new Event("valeska_request_sync"));
      loadData();
    } catch (error: any) {
      sileo.error({ title: "Error al guardar", description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================================================
  // GUARDAR REPRESENTANTE LEGAL + EMPRESA (Aplica tu idea a ambos)
  // ============================================================================
  const saveRepresentante = async () => {
    if (isSaving) return;

    if (
      !formRepresentante.ruc ||
      !formRepresentante.razon_social ||
      !formRepresentante.dni ||
      !formRepresentante.nombres ||
      !formRepresentante.primer_apellido
    ) {
      sileo.warning({
        title: "Campos incompletos",
        description:
          "RUC, Razón Social, DNI, Nombres y Apellido son obligatorios.",
      });
      return;
    }

    setIsSaving(true);
    try {
      const db = await Database.load("sqlite:valeska.db");
      const now = Date.now();

      // 1. UPSERT DE LA EMPRESA GESTORA (Revivimos si el RUC ya existía)
      let empresaIdToUse = formRepresentante.empresa_id;
      const empCheck: any[] = await db.select(
        "SELECT id FROM empresas_gestoras WHERE ruc = $1",
        [formRepresentante.ruc],
      );

      if (empCheck.length > 0) {
        empresaIdToUse = empCheck[0].id;
        await db.execute(
          "UPDATE empresas_gestoras SET razon_social=$1, direccion=$2, deleted_at=NULL, updated_at=$3, sync_status='LOCAL_UPDATE' WHERE id=$4",
          [
            formRepresentante.razon_social,
            formRepresentante.direccion,
            now,
            empresaIdToUse,
          ],
        );
      } else {
        empresaIdToUse = empresaIdToUse || crypto.randomUUID();
        await db.execute(
          "INSERT INTO empresas_gestoras (id, ruc, razon_social, direccion, created_at, updated_at, sync_status) VALUES ($1, $2, $3, $4, $5, $6, 'LOCAL_INSERT')",
          [
            empresaIdToUse,
            formRepresentante.ruc,
            formRepresentante.razon_social,
            formRepresentante.direccion,
            now,
            now,
          ],
        );
      }

      // 2. UPSERT DEL REPRESENTANTE LEGAL (Revivimos si el DNI ya existía)
      const repCheck: any[] = await db.select(
        "SELECT id FROM representantes_legales WHERE dni = $1",
        [formRepresentante.dni],
      );

      if (repCheck.length > 0) {
        const repIdToUse = repCheck[0].id;
        await db.execute(
          "UPDATE representantes_legales SET empresa_gestora_id=$1, primer_apellido=$2, segundo_apellido=$3, nombres=$4, partida_registral=$5, oficina_registral=$6, domicilio=$7, deleted_at=NULL, updated_at=$8, sync_status='LOCAL_UPDATE' WHERE id=$9",
          [
            empresaIdToUse,
            formRepresentante.primer_apellido,
            formRepresentante.segundo_apellido,
            formRepresentante.nombres,
            formRepresentante.partida_registral,
            formRepresentante.oficina_registral,
            formRepresentante.domicilio,
            now,
            repIdToUse,
          ],
        );
      } else {
        const newRepId = formRepresentante.id || crypto.randomUUID();
        await db.execute(
          "INSERT INTO representantes_legales (id, empresa_gestora_id, dni, primer_apellido, segundo_apellido, nombres, partida_registral, oficina_registral, domicilio, created_at, updated_at, sync_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'LOCAL_INSERT')",
          [
            newRepId,
            empresaIdToUse,
            formRepresentante.dni,
            formRepresentante.primer_apellido,
            formRepresentante.segundo_apellido,
            formRepresentante.nombres,
            formRepresentante.partida_registral,
            formRepresentante.oficina_registral,
            formRepresentante.domicilio,
            now,
            now,
          ],
        );
      }

      sileo.success({
        title: "Guardado exitoso",
        description:
          "El Representante de la Empresa ha sido guardado correctamente.",
      });
      setFormRepresentante(initialRepresentante);
      window.dispatchEvent(new Event("valeska_request_sync"));
      loadData();
    } catch (error: any) {
      sileo.error({ title: "Error al guardar", description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================================================
  // ELIMINAR REGISTROS (Lógico)
  // ============================================================================
  const deleteRecord = async (
    table: "presentantes" | "representantes_legales",
    id: string,
  ) => {
    if (!window.confirm("¿Seguro que deseas eliminar este registro?")) return;
    try {
      const db = await Database.load("sqlite:valeska.db");
      const now = Date.now();
      await db.execute(
        `UPDATE ${table} SET deleted_at=$1, sync_status='LOCAL_UPDATE' WHERE id=$2`,
        [now, id],
      );

      if (table === "presentantes") setFormPresentante(initialPresentante);
      if (table === "representantes_legales")
        setFormRepresentante(initialRepresentante);

      sileo.success({
        title: "Eliminado",
        description: "El registro ha sido eliminado del sistema.",
      });
      window.dispatchEvent(new Event("valeska_request_sync"));
      loadData();
    } catch (error: any) {
      console.error("Error al eliminar", error);
      sileo.error({ title: "Error al eliminar", description: error.message });
    }
  };

  return {
    representantes,
    presentantes,
    isLoading,
    isSaving,
    formPresentante,
    setFormPresentante,
    initialPresentante,
    savePresentante,
    formRepresentante,
    setFormRepresentante,
    initialRepresentante,
    saveRepresentante,
    buscarEmpresaPorRuc,
    deleteRecord,
  };
}
