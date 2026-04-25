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

      const query = `
        SELECT 
          eg.id as empresa_id, 
          eg.ruc,
          eg.razon_social,
          eg.direccion,
          rl.id as rep_id,
          rl.dni, 
          rl.primer_apellido, 
          rl.segundo_apellido, 
          rl.nombres, 
          rl.partida_registral, 
          rl.oficina_registral, 
          rl.domicilio 
        FROM empresas_gestoras eg
        LEFT JOIN representantes_legales rl ON rl.empresa_gestora_id = eg.id AND rl.deleted_at IS NULL
        WHERE eg.deleted_at IS NULL
        ORDER BY eg.razon_social ASC, rl.primer_apellido ASC
      `;
      const repRes = await db.select<any[]>(query);

      const formattedReps: RepresentanteCombined[] = [];

      repRes.forEach((row) => {
        if (row.rep_id) {
          formattedReps.push({
            id: row.rep_id,
            empresa_id: row.empresa_id,
            ruc: row.ruc || "",
            razon_social: row.razon_social || "",
            direccion: row.direccion || "",
            dni: row.dni || "",
            primer_apellido: row.primer_apellido || "",
            segundo_apellido: row.segundo_apellido || "",
            nombres: row.nombres || "",
            partida_registral: row.partida_registral || "",
            oficina_registral: row.oficina_registral || "",
            domicilio: row.domicilio || "",
          });
        } else {
          formattedReps.push({
            id: `empty_emp_${row.empresa_id}`,
            empresa_id: row.empresa_id,
            ruc: row.ruc || "",
            razon_social: row.razon_social || "",
            direccion: row.direccion || "",
            dni: "SIN REPRESENTANTES",
            primer_apellido: "",
            segundo_apellido: "",
            nombres: "",
            partida_registral: "",
            oficina_registral: "",
            domicilio: "",
          });
        }
      });

      const presRes = await db.select<Presentante[]>(
        "SELECT id, dni, primer_apellido, segundo_apellido, nombres FROM presentantes WHERE deleted_at IS NULL ORDER BY primer_apellido ASC, nombres ASC",
      );

      setRepresentantes(formattedReps);
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

  const savePresentante = async () => {
    if (isSaving) return;

    // Validación Relajada: Al menos que ponga un nombre, apellido o DNI.
    if (
      !formPresentante.dni &&
      !formPresentante.nombres &&
      !formPresentante.primer_apellido
    ) {
      sileo.warning({
        title: "Campos incompletos",
        description: "Debe ingresar al menos un Nombre, Apellido o DNI.",
      });
      return;
    }

    setIsSaving(true);
    try {
      const db = await Database.load("sqlite:valeska.db");
      const now = Date.now();

      const existing: any[] = await db.select(
        "SELECT id FROM presentantes WHERE dni = $1 AND dni != '' AND dni != 'S/N'",
        [formPresentante.dni],
      );

      if (existing.length > 0 && formPresentante.dni) {
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

  const saveRepresentante = async () => {
    if (isSaving) return;

    // Validación Relajada: SOLO la Razón Social es estricta.
    if (!formRepresentante.razon_social) {
      sileo.warning({
        title: "Campos incompletos",
        description: "La Razón Social de la Empresa es obligatoria.",
      });
      return;
    }

    setIsSaving(true);
    try {
      const db = await Database.load("sqlite:valeska.db");
      const now = Date.now();

      const finalRuc = formRepresentante.ruc.trim() === "" ? null : formRepresentante.ruc.trim();

      // 1. UPSERT DE LA EMPRESA GESTORA
      let empresaIdToUse = formRepresentante.empresa_id;

      let queryEmp = "SELECT id FROM empresas_gestoras WHERE razon_social = $1";
      let paramsEmp: any[] = [formRepresentante.razon_social];
      if (finalRuc) { queryEmp += " AND ruc = $2"; paramsEmp.push(finalRuc); }

      const empCheck: any[] = await db.select(queryEmp, paramsEmp);

      if (empCheck.length > 0) {
        empresaIdToUse = empCheck[0].id;
        await db.execute(
          "UPDATE empresas_gestoras SET direccion=$1, deleted_at=NULL, updated_at=$2, sync_status='LOCAL_UPDATE' WHERE id=$3",
          [formRepresentante.direccion, now, empresaIdToUse],
        );
      } else {
        empresaIdToUse = empresaIdToUse || crypto.randomUUID();
        await db.execute(
          "INSERT INTO empresas_gestoras (id, ruc, razon_social, direccion, created_at, updated_at, sync_status) VALUES ($1, $2, $3, $4, $5, $6, 'LOCAL_INSERT')",
          [empresaIdToUse, finalRuc, formRepresentante.razon_social, formRepresentante.direccion, now, now],
        );
      }

      // 2. UPSERT DEL REPRESENTANTE LEGAL (Solo si escribieron algún dato del representante)
      const hasRepData = formRepresentante.dni?.trim() || formRepresentante.nombres?.trim() || formRepresentante.primer_apellido?.trim();

      if (hasRepData) {
        const repCheck: any[] = await db.select(
          "SELECT id FROM representantes_legales WHERE dni = $1 AND empresa_gestora_id = $2",
          [formRepresentante.dni || 'S/N', empresaIdToUse],
        );

        const isFakeId = formRepresentante.id && (formRepresentante.id.includes('empty'));

        if (repCheck.length > 0 && !isFakeId) {
          const repIdToUse = repCheck[0].id;
          await db.execute(
            "UPDATE representantes_legales SET primer_apellido=$1, segundo_apellido=$2, nombres=$3, partida_registral=$4, oficina_registral=$5, domicilio=$6, deleted_at=NULL, updated_at=$7, sync_status='LOCAL_UPDATE' WHERE id=$8",
            [
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
          const newRepId = (!isFakeId && formRepresentante.id) ? formRepresentante.id : crypto.randomUUID();
          await db.execute(
            "INSERT INTO representantes_legales (id, empresa_gestora_id, dni, primer_apellido, segundo_apellido, nombres, partida_registral, oficina_registral, domicilio, created_at, updated_at, sync_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'LOCAL_INSERT')",
            [
              newRepId,
              empresaIdToUse,
              formRepresentante.dni || 'S/N',
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
      }

      sileo.success({
        title: "Guardado exitoso",
        description: "El registro de la Empresa ha sido guardado correctamente.",
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
  // ELIMINAR REGISTROS (Lógico) - MEJORADO PARA ELIMINAR EMPRESAS Y REPS
  // ============================================================================
  const deleteRecord = async (table: "presentantes" | "representantes_legales" | "empresas_gestoras", id: string) => {

    // Si intentan borrar el representante de un slot vacío, les avisamos amablemente.
    if (table === "representantes_legales" && id.includes('empty')) {
      sileo.warning({ title: "Atención", description: "No hay representante que eliminar aquí. Utilice el botón 'Eliminar Empresa' si desea borrar la empresa entera." });
      return;
    }

    const confirmMsg = table === 'empresas_gestoras'
      ? "¿Seguro que deseas eliminar esta EMPRESA por completo (incluyendo a todos sus representantes)?"
      : "¿Seguro que deseas eliminar este registro?";

    if (!window.confirm(confirmMsg)) return;

    try {
      const db = await Database.load("sqlite:valeska.db");
      const now = Date.now();

      await db.execute(
        `UPDATE ${table} SET deleted_at=$1, sync_status='LOCAL_UPDATE' WHERE id=$2`,
        [now, id],
      );

      // Si se eliminó la Empresa, eliminamos en cascada sus representantes lógicamente
      if (table === "empresas_gestoras") {
        await db.execute(
          `UPDATE representantes_legales SET deleted_at=$1, sync_status='LOCAL_UPDATE' WHERE empresa_gestora_id=$2`,
          [now, id]
        );
      }

      if (table === "presentantes") setFormPresentante(initialPresentante);
      if (table === "representantes_legales" || table === "empresas_gestoras") setFormRepresentante(initialRepresentante);

      sileo.success({
        title: "Eliminado",
        description: table === "empresas_gestoras" ? "Empresa eliminada del sistema." : "El registro ha sido eliminado del sistema.",
      });
      window.dispatchEvent(new Event("valeska_request_sync"));
      loadData();
    } catch (error: any) {
      console.error("Error al eliminar", error);
      sileo.error({ title: "Error al eliminar", description: error.message });
    }
  };

  return {
    representantes, presentantes, isLoading, isSaving,
    formPresentante, setFormPresentante, initialPresentante, savePresentante,
    formRepresentante, setFormRepresentante, initialRepresentante, saveRepresentante,
    buscarEmpresaPorRuc, deleteRecord,
  };
}