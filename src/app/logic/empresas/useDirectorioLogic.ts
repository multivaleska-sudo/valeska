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

// NUEVA INTERFAZ FUSIONADA (Empresa + Representante)
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

      // 1. CARGAMOS LA LISTA FUSIONADA DE REPRESENTANTES CON SUS EMPRESAS
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

      // 2. CARGAMOS LOS TRABAJADORES INDEPENDIENTES (Presentantes)
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
        // Si no existe, limpiamos el ID para que la cree como nueva
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
  // GUARDAR PRESENTANTE (Trabajador Independiente)
  // ============================================================================
  const savePresentante = async () => {
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

    try {
      const db = await Database.load("sqlite:valeska.db");
      const now = Date.now();

      if (formPresentante.id) {
        await db.execute(
          "UPDATE presentantes SET dni=$1, primer_apellido=$2, segundo_apellido=$3, nombres=$4, updated_at=$5, sync_status='LOCAL_UPDATE' WHERE id=$6",
          [
            formPresentante.dni,
            formPresentante.primer_apellido,
            formPresentante.segundo_apellido,
            formPresentante.nombres,
            now,
            formPresentante.id,
          ],
        );
      } else {
        const newId = crypto.randomUUID();
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
    }
  };

  // ============================================================================
  // GUARDAR REPRESENTANTE LEGAL + EMPRESA
  // ============================================================================
  const saveRepresentante = async () => {
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

    try {
      const db = await Database.load("sqlite:valeska.db");
      const now = Date.now();

      // 1. UPSERT DE LA EMPRESA GESTORA
      let empresaIdToUse = formRepresentante.empresa_id;
      const empCheck: any[] = await db.select(
        "SELECT id FROM empresas_gestoras WHERE ruc = $1",
        [formRepresentante.ruc],
      );

      if (empCheck.length > 0) {
        empresaIdToUse = empCheck[0].id;
        await db.execute(
          "UPDATE empresas_gestoras SET razon_social=$1, direccion=$2, updated_at=$3, sync_status='LOCAL_UPDATE' WHERE id=$4",
          [
            formRepresentante.razon_social,
            formRepresentante.direccion,
            now,
            empresaIdToUse,
          ],
        );
      } else {
        empresaIdToUse = crypto.randomUUID();
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

      // 2. UPSERT DEL REPRESENTANTE LEGAL
      if (formRepresentante.id) {
        await db.execute(
          "UPDATE representantes_legales SET empresa_gestora_id=$1, dni=$2, primer_apellido=$3, segundo_apellido=$4, nombres=$5, partida_registral=$6, oficina_registral=$7, domicilio=$8, updated_at=$9, sync_status='LOCAL_UPDATE' WHERE id=$10",
          [
            empresaIdToUse,
            formRepresentante.dni,
            formRepresentante.primer_apellido,
            formRepresentante.segundo_apellido,
            formRepresentante.nombres,
            formRepresentante.partida_registral,
            formRepresentante.oficina_registral,
            formRepresentante.domicilio,
            now,
            formRepresentante.id,
          ],
        );
      } else {
        const newRepId = crypto.randomUUID();
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
    formPresentante,
    setFormPresentante,
    initialPresentante,
    savePresentante,
    formRepresentante,
    setFormRepresentante,
    initialRepresentante,
    saveRepresentante,
    buscarEmpresaPorRuc, // Exponemos nuestra nueva magia
    deleteRecord,
  };
}
