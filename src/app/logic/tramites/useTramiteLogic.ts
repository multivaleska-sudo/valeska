import { useState, useEffect, useCallback } from "react";
import Database from "@tauri-apps/plugin-sql";
import { TramiteFormData } from "../../types/tramites/tramite.types";
import { handlePdfAutofillAction } from "./pdfActions";
import { sileo } from "sileo";

export function useTramiteLogic(initialData?: Partial<TramiteFormData>) {
  const [isSaving, setIsSaving] = useState(false);
  const [isFilling, setIsFilling] = useState(false);

  const [opcionesTipos, setOpcionesTipos] = useState<string[]>([]);
  const [opcionesSituacion, setOpcionesSituacion] = useState<string[]>([]);
  const [plantillas, setPlantillas] = useState<
    { id: string; nombre_documento: string }[]
  >([]);

  const [empresaResultados, setEmpresaResultados] = useState<any[]>([]);
  const [showEmpresaDropdown, setShowEmpresaDropdown] = useState(false);

  const [presentanteResultados, setPresentanteResultados] = useState<any[]>([]);
  const [showPresentanteDropdown, setShowPresentanteDropdown] = useState(false);

  // IDS OCULTOS PARA CONSERVAR LA RELACIÓN DE BASE DE DATOS
  const [selectedEmpresaId, setSelectedEmpresaId] = useState<string | null>(
    (initialData as any)?.empresa_gestora_id || null,
  );
  const [selectedPresentanteId, setSelectedPresentanteId] = useState<
    string | null
  >((initialData as any)?.presentante_id || null);

  const [formData, setFormData] = useState<TramiteFormData>(() => {
    const today = new Date().toISOString().split("T")[0];
    const randomCode = ``;

    return {
      tramite_anio: new Date().getFullYear().toString(),
      cliente: "",
      telefono: "",
      dni: "",
      n_titulo: "",
      tipo_tramite: "",
      estado_tramite: "",
      observaciones: "",
      fecha_presentacion: today,

      check_tarjeta_oficina: false,
      fecha_tarjeta_oficina: "",
      check_placa_oficina: false,
      fecha_placa_oficina: "",

      check_entrega_tarjeta: false,
      fecha_entrega_tarjeta: "",
      metodo_entrega_tarjeta: "",
      check_entrega_placa: false,
      fecha_entrega_placa: "",
      metodo_entrega_placa: "",

      codigo_verificacion: randomCode,
      vehiculo_marca: "",
      vehiculo_motor: "",
      vehiculo_chasis: "",
      vehiculo_anio: "",
      vehiculo_color: "",
      vehiculo_placa: "",
      vehiculo_modelo: "",

      presentante_empresa: "",
      presentante_persona: "",

      tipo_boleta: "Electrónica",
      numero_boleta: "",
      fecha_boleta: today,
      dua: "",
      num_formato_inmatriculacion: "",
      numero_recibo_tramite: "",
      clausula_monto: "",
      clausula_forma_pago: "",
      clausula_pago_bancarizado: "",
      aclaracion_dice: "",
      aclaracion_debe_decir: "",
      fecha_impresion: today,
      ...(initialData || {}),
    } as TramiteFormData;
  });

  const loadCatalogos = useCallback(async () => {
    try {
      const sqlite = await Database.load("sqlite:valeska.db");
      let resTipos: any[] = [];
      let resSits: any[] = [];
      let resTpl: any[] = [];

      try {
        resTipos = await sqlite.select(
          "SELECT nombre FROM catalogo_tipos_tramite ORDER BY nombre ASC",
        );
      } catch (e) {}
      try {
        resSits = await sqlite.select(
          "SELECT nombre FROM catalogo_situaciones ORDER BY nombre ASC",
        );
      } catch (e) {}
      try {
        resTpl = await sqlite.select(
          "SELECT id, nombre_documento FROM plantillas_documentos WHERE deleted_at IS NULL AND activo = 1 ORDER BY nombre_documento ASC",
        );
      } catch (e) {}

      setOpcionesTipos(resTipos.map((t) => t.nombre));
      setOpcionesSituacion(resSits.map((s) => s.nombre));
      setPlantillas(resTpl);

      setFormData((prev) => {
        if (!prev.id) {
          return {
            ...prev,
            tipo_tramite:
              prev.tipo_tramite ||
              (resTipos.length > 0 ? resTipos[0].nombre : ""),
            estado_tramite:
              prev.estado_tramite ||
              (resSits.length > 0 ? resSits[0].nombre : ""),
          };
        }
        return prev;
      });
    } catch (error) {
      console.error("Error general de catálogos:", error);
    }
  }, []);

  useEffect(() => {
    loadCatalogos();
  }, [loadCatalogos]);

  // BUSCADOR 1: EMPRESA
  useEffect(() => {
    const buscarEmpresa = async () => {
      const val = formData.presentante_empresa;
      if (!val || val.trim().length < 2) {
        setEmpresaResultados([]);
        setShowEmpresaDropdown(false);
        return;
      }
      try {
        const sqlite = await Database.load("sqlite:valeska.db");
        const searchTerm = `%${val.toUpperCase().trim()}%`;
        const res: any[] = await sqlite.select(
          "SELECT id, ruc, razon_social FROM empresas_gestoras WHERE ruc LIKE $1 OR razon_social LIKE $2 LIMIT 6",
          [searchTerm, searchTerm],
        );
        setEmpresaResultados(res);
        setShowEmpresaDropdown(res.length > 0);
      } catch (error) {}
    };
    const debounceTimer = setTimeout(buscarEmpresa, 250);
    return () => clearTimeout(debounceTimer);
  }, [formData.presentante_empresa]);

  const seleccionarEmpresa = (emp: any) => {
    setFormData((prev) => ({
      ...prev,
      presentante_empresa: emp.razon_social, // SÓLO EL NOMBRE
    }));
    setSelectedEmpresaId(emp.id); // GUARDAMOS EL ID OCULTO
    setEmpresaResultados([]);
    setShowEmpresaDropdown(false);
  };

  // BUSCADOR 2: PRESENTANTE LEGAL
  useEffect(() => {
    const buscarPresentante = async () => {
      const val = formData.presentante_persona;
      if (!val || val.trim().length < 2) {
        setPresentanteResultados([]);
        setShowPresentanteDropdown(false);
        return;
      }
      try {
        const sqlite = await Database.load("sqlite:valeska.db");
        const searchTerm = `%${val.toUpperCase().trim()}%`;
        const res: any[] = await sqlite.select(
          "SELECT id, dni, primer_apellido, segundo_apellido, nombres FROM presentantes WHERE dni LIKE $1 OR nombres LIKE $2 OR primer_apellido LIKE $3 OR segundo_apellido LIKE $4 LIMIT 6",
          [searchTerm, searchTerm, searchTerm, searchTerm],
        );
        setPresentanteResultados(res);
        setShowPresentanteDropdown(res.length > 0);
      } catch (error) {}
    };
    const debounceTimer = setTimeout(buscarPresentante, 250);
    return () => clearTimeout(debounceTimer);
  }, [formData.presentante_persona]);

  const seleccionarPresentante = (p: any) => {
    setFormData((prev) => ({
      ...prev,
      // SÓLO EL NOMBRE
      presentante_persona:
        `${p.primer_apellido} ${p.segundo_apellido || ""} ${p.nombres}`
          .replace(/\s+/g, " ")
          .trim(),
    }));
    setSelectedPresentanteId(p.id); // GUARDAMOS EL ID OCULTO
    setPresentanteResultados([]);
    setShowPresentanteDropdown(false);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value, type } = e.target;
    const isSelect = e.target.tagName === "SELECT";
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => {
      let newState = {
        ...prev,
        [name]:
          type === "checkbox"
            ? checked
            : isSelect
              ? value
              : value.toUpperCase(),
      };

      // Si el usuario edita a mano, se borra el ID oculto y se creará uno nuevo
      if (name === "presentante_empresa") setSelectedEmpresaId(null);
      if (name === "presentante_persona") setSelectedPresentanteId(null);

      return newState;
    });
  };

  const handleAutoCheck = (
    field:
      | "check_entrega_tarjeta"
      | "check_entrega_placa"
      | "check_tarjeta_oficina"
      | "check_placa_oficina",
  ) => {
    const todayStr = new Date().toISOString().split("T")[0];
    setFormData((prev) => {
      const isChecked = !prev[field as keyof TramiteFormData];
      let newData = { ...prev, [field]: isChecked };

      if (field === "check_entrega_tarjeta") {
        newData.fecha_entrega_tarjeta = isChecked ? todayStr : "";
        if (!isChecked) newData.metodo_entrega_tarjeta = "";
      }
      if (field === "check_entrega_placa") {
        newData.fecha_entrega_placa = isChecked ? todayStr : "";
        if (!isChecked) newData.metodo_entrega_placa = "";
      }
      if (field === "check_tarjeta_oficina")
        newData.fecha_tarjeta_oficina = isChecked ? todayStr : "";
      if (field === "check_placa_oficina")
        newData.fecha_placa_oficina = isChecked ? todayStr : "";

      return newData;
    });
  };

  const autofillFromPdf = async () => {
    setIsFilling(true);
    const pdfData = await handlePdfAutofillAction();
    if (pdfData) {
      setFormData((prev) => ({ ...prev, ...pdfData }));
      sileo.success({
        title: "Completado",
        description: "Datos extraídos del PDF.",
      });
    }
    setIsFilling(false);
  };

  const parseNames = (fullNombre: string) => {
    let nombres = "";
    let primerApellido = "";
    let segundoApellido = "";
    if (fullNombre.includes(",")) {
      const [apellidosPart, nombresPart] = fullNombre.split(",");
      nombres = (nombresPart || "").trim();
      const apeParts = apellidosPart.trim().split(/\s+/);
      if (apeParts.length >= 2) {
        segundoApellido = apeParts.pop() || "";
        primerApellido = apeParts.join(" ");
      } else {
        primerApellido = apeParts[0] || "";
      }
    } else {
      const parts = fullNombre.split(/\s+/);
      if (parts.length >= 3) {
        primerApellido = parts[0] || "";
        segundoApellido = parts[1] || "";
        nombres = parts.slice(2).join(" ");
      } else if (parts.length === 2) {
        primerApellido = parts[0] || "";
        nombres = parts[1] || "";
      } else {
        nombres = fullNombre;
      }
    }
    return { nombres, primerApellido, segundoApellido };
  };

  const saveTramite = async () => {
    setIsSaving(true);
    try {
      const sessionStr = localStorage.getItem("valeska_session_user");
      if (!sessionStr) throw new Error("No hay sesión activa.");
      const session = JSON.parse(sessionStr);

      const sqlite = await Database.load("sqlite:valeska.db");
      const now = Date.now();

      let tipoTramiteId = "TIPO_001";
      try {
        const tipoRes: any[] = await sqlite.select(
          "SELECT id FROM catalogo_tipos_tramite WHERE nombre = $1",
          [formData.tipo_tramite],
        );
        if (tipoRes.length > 0) tipoTramiteId = tipoRes[0].id;
      } catch (e) {}

      let situacionId = "SIT_001";
      try {
        const sitRes: any[] = await sqlite.select(
          "SELECT id FROM catalogo_situaciones WHERE nombre = $1",
          [formData.estado_tramite],
        );
        if (sitRes.length > 0) situacionId = sitRes[0].id;
      } catch (e) {}

      let sucursalId = null;
      try {
        const dispRes: any[] = await sqlite.select(
          "SELECT sucursal_id FROM dispositivos LIMIT 1",
        );
        if (dispRes.length > 0) sucursalId = dispRes[0].sucursal_id;
      } catch (e) {}

      // ==========================================
      // 1. RESOLUCIÓN DE CLIENTE (Evita Error de Unique)
      // ==========================================
      let finalClienteId = null;
      const docCliente = formData.dni.trim() || `SN-${Date.now()}`; // Fallback si no pone DNI
      try {
        const cliRes: any[] = await sqlite.select(
          "SELECT id FROM clientes WHERE numero_documento = $1",
          [docCliente],
        );
        if (cliRes.length > 0) {
          finalClienteId = cliRes[0].id;
          await sqlite.execute(
            "UPDATE clientes SET tipo_documento=$1, razon_social_nombres=$2, telefono=$3, updated_at=$4, sync_status='LOCAL_UPDATE' WHERE id=$5",
            [
              docCliente.length === 11 ? "RUC" : "DNI",
              formData.cliente.toUpperCase(),
              formData.telefono,
              now,
              finalClienteId,
            ],
          );
        } else {
          finalClienteId = crypto.randomUUID();
          await sqlite.execute(
            "INSERT INTO clientes (id, tipo_documento, numero_documento, razon_social_nombres, telefono, created_at, updated_at, sync_status) VALUES ($1, $2, $3, $4, $5, $6, $7, 'LOCAL_INSERT')",
            [
              finalClienteId,
              docCliente.length === 11 ? "RUC" : "DNI",
              docCliente,
              formData.cliente.toUpperCase(),
              formData.telefono,
              now,
              now,
            ],
          );
        }
      } catch (e) {
        console.error("Error Cliente", e);
        throw new Error("No se pudo registrar el Cliente. Revise el DNI/RUC.");
      }

      // ==========================================
      // 2. RESOLUCIÓN DE VEHÍCULO (Evita Error de Unique)
      // ==========================================
      let finalVehiculoId = null;
      const vinVehiculo = formData.vehiculo_chasis.trim() || `SN-${Date.now()}`; // Fallback si no pone VIN
      try {
        const vehRes: any[] = await sqlite.select(
          "SELECT id FROM vehiculos WHERE chasis_vin = $1",
          [vinVehiculo],
        );
        if (vehRes.length > 0) {
          finalVehiculoId = vehRes[0].id;
          await sqlite.execute(
            "UPDATE vehiculos SET placa=$1, motor=$2, marca=$3, modelo=$4, color=$5, anio_fabricacion=$6, updated_at=$7, sync_status='LOCAL_UPDATE' WHERE id=$8",
            [
              formData.vehiculo_placa.toUpperCase(),
              formData.vehiculo_motor.toUpperCase(),
              formData.vehiculo_marca.toUpperCase(),
              formData.vehiculo_modelo.toUpperCase(),
              formData.vehiculo_color.toUpperCase(),
              formData.vehiculo_anio,
              now,
              finalVehiculoId,
            ],
          );
        } else {
          finalVehiculoId = crypto.randomUUID();
          await sqlite.execute(
            "INSERT INTO vehiculos (id, chasis_vin, placa, motor, marca, modelo, color, anio_fabricacion, created_at, updated_at, sync_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'LOCAL_INSERT')",
            [
              finalVehiculoId,
              vinVehiculo,
              formData.vehiculo_placa.toUpperCase(),
              formData.vehiculo_motor.toUpperCase(),
              formData.vehiculo_marca.toUpperCase(),
              formData.vehiculo_modelo.toUpperCase(),
              formData.vehiculo_color.toUpperCase(),
              formData.vehiculo_anio,
              now,
              now,
            ],
          );
        }
      } catch (e) {
        console.error("Error Vehículo", e);
        throw new Error(
          "No se pudo registrar el Vehículo. Revise el Chasis/VIN.",
        );
      }

      // ==========================================
      // 3. RESOLUCIÓN DE EMPRESA GESTORA
      // ==========================================
      let finalEmpresaId = selectedEmpresaId;
      if (
        !finalEmpresaId &&
        formData.presentante_empresa &&
        formData.presentante_empresa.trim() !== ""
      ) {
        const rs = formData.presentante_empresa.trim().toUpperCase();
        try {
          const empRes: any[] = await sqlite.select(
            "SELECT id FROM empresas_gestoras WHERE razon_social = $1",
            [rs],
          );
          if (empRes.length > 0) {
            finalEmpresaId = empRes[0].id;
          } else {
            finalEmpresaId = crypto.randomUUID();
            await sqlite.execute(
              "INSERT INTO empresas_gestoras (id, ruc, razon_social, created_at, updated_at, sync_status) VALUES ($1, $2, $3, $4, $5, 'LOCAL_INSERT')",
              [finalEmpresaId, "S/N", rs, now, now],
            );
          }
        } catch (e) {}
      }

      // ==========================================
      // 4. RESOLUCIÓN DE PRESENTANTE
      // ==========================================
      let finalPresId = selectedPresentanteId;
      if (
        !finalPresId &&
        formData.presentante_persona &&
        formData.presentante_persona.trim() !== ""
      ) {
        const fullNombre = formData.presentante_persona.trim().toUpperCase();
        const { nombres, primerApellido, segundoApellido } =
          parseNames(fullNombre);
        try {
          const presRes: any[] = await sqlite.select(
            "SELECT id FROM presentantes WHERE nombres = $1 AND primer_apellido = $2",
            [nombres, primerApellido],
          );
          if (presRes.length > 0) {
            finalPresId = presRes[0].id;
          } else {
            finalPresId = crypto.randomUUID();
            await sqlite.execute(
              "INSERT INTO presentantes (id, dni, primer_apellido, segundo_apellido, nombres, created_at, updated_at, sync_status) VALUES ($1, $2, $3, $4, $5, $6, $7, 'LOCAL_INSERT')",
              [
                finalPresId,
                "S/N",
                primerApellido,
                segundoApellido,
                nombres,
                now,
                now,
              ],
            );
          }
        } catch (e) {}
      }

      let tramiteFinalId = formData.id;

      if (formData.id) {
        // ACTUALIZAR TRAMITE
        await sqlite.execute(
          `UPDATE tramites SET cliente_id = $1, vehiculo_id = $2, codigo_verificacion = $3, n_titulo = $4, fecha_presentacion = $5, observaciones_generales = $6, entrego_tarjeta = $7, fecha_entrega_tarjeta = $8, entrego_placa = $9, fecha_entrega_placa = $10, tipo_tramite_id = $11, situacion_id = $12, tarjeta_en_oficina = $13, fecha_tarjeta_en_oficina = $14, placa_en_oficina = $15, fecha_placa_en_oficina = $16, metodo_entrega_tarjeta = $17, metodo_entrega_placa = $18, updated_at = $19, sync_status = 'LOCAL_UPDATE' WHERE id = $20`,
          [
            finalClienteId,
            finalVehiculoId,
            formData.codigo_verificacion,
            formData.n_titulo,
            formData.fecha_presentacion,
            formData.observaciones,
            formData.check_entrega_tarjeta ? 1 : 0,
            formData.fecha_entrega_tarjeta,
            formData.check_entrega_placa ? 1 : 0,
            formData.fecha_entrega_placa,
            tipoTramiteId,
            situacionId,
            formData.check_tarjeta_oficina ? 1 : 0,
            formData.fecha_tarjeta_oficina,
            formData.check_placa_oficina ? 1 : 0,
            formData.fecha_placa_oficina,
            formData.metodo_entrega_tarjeta,
            formData.metodo_entrega_placa,
            now,
            formData.id,
          ],
        );

        await sqlite.execute(
          `UPDATE tramite_detalles SET empresa_gestora_id = $1, presentante_id = $2, tipo_boleta = $3, numero_boleta = $4, fecha_boleta = $5, dua = $6, num_formato_inmatriculacion = $7, numero_recibo_tramite = $8, clausula_monto = $9, clausula_forma_pago = $10, clausula_pago_bancarizado = $11, aclaracion_dice = $12, aclaracion_debe_decir = $13, updated_at = $14, sync_status = 'LOCAL_UPDATE' WHERE tramite_id = $15`,
          [
            finalEmpresaId,
            finalPresId,
            formData.tipo_boleta,
            formData.numero_boleta,
            formData.fecha_boleta,
            formData.dua,
            formData.num_formato_inmatriculacion,
            formData.numero_recibo_tramite,
            parseFloat(formData.clausula_monto) || 0,
            formData.clausula_forma_pago,
            formData.clausula_pago_bancarizado,
            formData.aclaracion_dice,
            formData.aclaracion_debe_decir,
            now,
            formData.id,
          ],
        );
      } else {
        // CREAR TRAMITE NUEVO
        tramiteFinalId = crypto.randomUUID();
        const tramiteDetalleId = crypto.randomUUID();

        await sqlite.execute(
          `INSERT INTO tramites (id, codigo_verificacion, tramite_anio, cliente_id, vehiculo_id, tipo_tramite_id, situacion_id, usuario_creador_id, sucursal_id, n_titulo, fecha_presentacion, observaciones_generales, entrego_tarjeta, fecha_entrega_tarjeta, entrego_placa, fecha_entrega_placa, tarjeta_en_oficina, fecha_tarjeta_en_oficina, placa_en_oficina, fecha_placa_en_oficina, metodo_entrega_tarjeta, metodo_entrega_placa, created_at, updated_at, sync_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, 'LOCAL_INSERT')`,
          [
            tramiteFinalId,
            formData.codigo_verificacion,
            formData.tramite_anio,
            finalClienteId,
            finalVehiculoId,
            tipoTramiteId,
            situacionId,
            session.id,
            sucursalId,
            formData.n_titulo,
            formData.fecha_presentacion,
            formData.observaciones,
            formData.check_entrega_tarjeta ? 1 : 0,
            formData.fecha_entrega_tarjeta,
            formData.check_entrega_placa ? 1 : 0,
            formData.fecha_entrega_placa,
            formData.check_tarjeta_oficina ? 1 : 0,
            formData.fecha_tarjeta_oficina,
            formData.check_placa_oficina ? 1 : 0,
            formData.fecha_placa_oficina,
            formData.metodo_entrega_tarjeta,
            formData.metodo_entrega_placa,
            now,
            now,
          ],
        );

        await sqlite.execute(
          `INSERT INTO tramite_detalles (id, tramite_id, empresa_gestora_id, presentante_id, tipo_boleta, numero_boleta, fecha_boleta, dua, num_formato_inmatriculacion, numero_recibo_tramite, clausula_monto, clausula_forma_pago, clausula_pago_bancarizado, aclaracion_dice, aclaracion_debe_decir, created_at, updated_at, sync_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 'LOCAL_INSERT')`,
          [
            tramiteDetalleId,
            tramiteFinalId,
            finalEmpresaId,
            finalPresId,
            formData.tipo_boleta,
            formData.numero_boleta,
            formData.fecha_boleta,
            formData.dua,
            formData.num_formato_inmatriculacion,
            formData.numero_recibo_tramite,
            parseFloat(formData.clausula_monto) || 0,
            formData.clausula_forma_pago,
            formData.clausula_pago_bancarizado,
            formData.aclaracion_dice,
            formData.aclaracion_debe_decir,
            now,
            now,
          ],
        );
      }

      setFormData((prev) => ({
        ...prev,
        id: tramiteFinalId,
      }));

      setSelectedEmpresaId(finalEmpresaId);
      setSelectedPresentanteId(finalPresId);

      window.dispatchEvent(new Event("valeska_reload_tramites"));
      window.dispatchEvent(
        new CustomEvent("valeska_request_sync", {
          detail: {
            title: formData.id
              ? "Trámite Actualizado"
              : "Nuevo Trámite Registrado",
            details: `Trámite ${formData.codigo_verificacion} - ${formData.cliente}`,
          },
        }),
      );

      sileo.success({
        title: "Éxito",
        description: formData.id
          ? "Trámite actualizado correctamente"
          : "Trámite registrado correctamente",
      });

      return tramiteFinalId;
    } catch (error: any) {
      console.error("Error al guardar en DB:", error);
      sileo.error({
        title: "Error",
        description: "Error al procesar: " + error.message,
      });
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    formData,
    setFormData,
    handleChange,
    handleAutoCheck,
    saveTramite,
    isSaving,
    autofillFromPdf,
    isFilling,
    opcionesTipos,
    opcionesSituacion,
    plantillas,
    loadCatalogos,
    // Empresa
    empresaResultados,
    showEmpresaDropdown,
    setShowEmpresaDropdown,
    seleccionarEmpresa,
    // Presentante
    presentanteResultados,
    showPresentanteDropdown,
    setShowPresentanteDropdown,
    seleccionarPresentante,
  };
}
