import { useState, useEffect, useCallback } from "react";
import Database from "@tauri-apps/plugin-sql";
import { sileo } from "sileo";

export interface Presentante {
  id: string;
  partida_registral: string;
  oficina_registral: string;
  domicilio: string;
  dni: string;
  primer_apellido: string;
  segundo_apellido: string;
  nombres: string;
}

export interface Empresa {
  id: string;
  ruc: string;
  razon_social: string;
  direccion: string;
}

export function useDirectorioLogic() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [presentantes, setPresentantes] = useState<Presentante[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const initialPresentante: Presentante = {
    id: "",
    partida_registral: "",
    oficina_registral: "",
    domicilio: "",
    dni: "",
    primer_apellido: "",
    segundo_apellido: "",
    nombres: "",
  };
  const initialEmpresa: Empresa = {
    id: "",
    ruc: "",
    razon_social: "",
    direccion: "",
  };

  const [formPresentante, setFormPresentante] =
    useState<Presentante>(initialPresentante);
  const [formEmpresa, setFormEmpresa] = useState<Empresa>(initialEmpresa);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const db = await Database.load("sqlite:valeska.db");
      const empRes = await db.select<Empresa[]>(
        "SELECT id, ruc, razon_social, direccion FROM empresas_gestoras WHERE deleted_at IS NULL ORDER BY razon_social ASC",
      );
      const presRes = await db.select<Presentante[]>(
        "SELECT id, partida_registral, oficina_registral, domicilio, dni, primer_apellido, segundo_apellido, nombres FROM presentantes WHERE deleted_at IS NULL ORDER BY primer_apellido ASC, nombres ASC",
      );

      setEmpresas(empRes || []);
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
  // GUARDAR PRESENTANTE
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
          "UPDATE presentantes SET partida_registral=$1, oficina_registral=$2, domicilio=$3, dni=$4, primer_apellido=$5, segundo_apellido=$6, nombres=$7, updated_at=$8 WHERE id=$9",
          [
            formPresentante.partida_registral,
            formPresentante.oficina_registral,
            formPresentante.domicilio,
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
          "INSERT INTO presentantes (id, partida_registral, oficina_registral, domicilio, dni, primer_apellido, segundo_apellido, nombres, created_at, updated_at, sync_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'LOCAL_INSERT')",
          [
            newId,
            formPresentante.partida_registral,
            formPresentante.oficina_registral,
            formPresentante.domicilio,
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
        description: "El presentante ha sido guardado correctamente.",
      });
      setFormPresentante(initialPresentante);
      loadData();
    } catch (error: any) {
      sileo.error({ title: "Error al guardar", description: error.message });
    }
  };

  // ============================================================================
  // GUARDAR EMPRESA
  // ============================================================================
  const saveEmpresa = async () => {
    if (!formEmpresa.ruc || !formEmpresa.razon_social) {
      sileo.warning({
        title: "Campos incompletos",
        description: "El RUC y la Razón Social son obligatorios.",
      });
      return;
    }

    try {
      const db = await Database.load("sqlite:valeska.db");
      const now = Date.now();

      if (formEmpresa.id) {
        await db.execute(
          "UPDATE empresas_gestoras SET ruc=$1, razon_social=$2, direccion=$3, updated_at=$4 WHERE id=$5",
          [
            formEmpresa.ruc,
            formEmpresa.razon_social,
            formEmpresa.direccion,
            now,
            formEmpresa.id,
          ],
        );
      } else {
        const newId = crypto.randomUUID();
        await db.execute(
          "INSERT INTO empresas_gestoras (id, ruc, razon_social, direccion, created_at, updated_at, sync_status) VALUES ($1, $2, $3, $4, $5, $6, 'LOCAL_INSERT')",
          [
            newId,
            formEmpresa.ruc,
            formEmpresa.razon_social,
            formEmpresa.direccion,
            now,
            now,
          ],
        );
      }

      sileo.success({
        title: "Guardado exitoso",
        description: "La empresa ha sido guardada correctamente.",
      });
      setFormEmpresa(initialEmpresa);
      loadData();
    } catch (error: any) {
      sileo.error({ title: "Error al guardar", description: error.message });
    }
  };

  // ============================================================================
  // ELIMINAR REGISTROS (Lógico)
  // ============================================================================
  const deleteRecord = async (
    table: "presentantes" | "empresas_gestoras",
    id: string,
  ) => {
    if (!window.confirm("¿Seguro que deseas eliminar este registro?")) return;
    try {
      const db = await Database.load("sqlite:valeska.db");
      await db.execute(`UPDATE ${table} SET deleted_at=$1 WHERE id=$2`, [
        Date.now(),
        id,
      ]);

      if (table === "presentantes") setFormPresentante(initialPresentante);
      if (table === "empresas_gestoras") setFormEmpresa(initialEmpresa);

      sileo.success({
        title: "Eliminado",
        description: "El registro ha sido eliminado del sistema.",
      });
      loadData();
    } catch (error: any) {
      console.error("Error al eliminar", error);
      sileo.error({ title: "Error al eliminar", description: error.message });
    }
  };

  return {
    empresas,
    presentantes,
    isLoading,
    formPresentante,
    setFormPresentante,
    initialPresentante,
    savePresentante,
    formEmpresa,
    setFormEmpresa,
    initialEmpresa,
    saveEmpresa,
    deleteRecord,
  };
}
