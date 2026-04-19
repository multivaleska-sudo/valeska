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

      // Aislamiento de consultas: Si una falla, las demás sobreviven.
      try {
        resTipos = await sqlite.select(
          "SELECT nombre FROM catalogo_tipos_tramite ORDER BY nombre ASC",
        );
      } catch (e) {
        console.error("Error cargando tipos:", e);
      }

      try {
        resSits = await sqlite.select(
          "SELECT nombre FROM catalogo_situaciones ORDER BY nombre ASC",
        );
      } catch (e) {
        console.error("Error cargando situaciones:", e);
      }

      try {
        resTpl = await sqlite.select(
          "SELECT id, nombre_documento FROM plantillas_documentos WHERE deleted_at IS NULL AND activo = 1 ORDER BY nombre_documento ASC",
        );
      } catch (e) {
        console.error("Error cargando plantillas:", e);
      }

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
      sileo.error({
        title: "Error",
        description: "No se pudieron cargar los catálogos.",
      });
    }
  }, []);

  useEffect(() => {
    loadCatalogos();
  }, [loadCatalogos]);

  useEffect(() => {
    const buscarEmpresa = async () => {
      const val = formData.presentante_empresa;
      if (!val || val.trim().length < 2 || /-\s*\d{11}$/.test(val)) {
        setEmpresaResultados([]);
        setShowEmpresaDropdown(false);
        return;
      }
      try {
        const sqlite = await Database.load("sqlite:valeska.db");
        const searchTerm = `%${val.toUpperCase().trim()}%`;
        const res: any[] = await sqlite.select(
          "SELECT ruc, razon_social FROM empresas_gestoras WHERE ruc LIKE $1 OR razon_social LIKE $2 LIMIT 6",
          [searchTerm, searchTerm],
        );
        setEmpresaResultados(res);
        setShowEmpresaDropdown(res.length > 0);
      } catch (error) {
        console.error("Error buscando empresas:", error);
      }
    };
    const debounceTimer = setTimeout(buscarEmpresa, 250);
    return () => clearTimeout(debounceTimer);
  }, [formData.presentante_empresa]);

  const seleccionarEmpresa = (emp: any) => {
    setFormData((prev) => ({
      ...prev,
      presentante_empresa: `${emp.razon_social} - ${emp.ruc}`,
    }));
    setEmpresaResultados([]);
    setShowEmpresaDropdown(false);
  };

  useEffect(() => {
    const buscarPresentante = async () => {
      const val = formData.presentante_persona;
      if (!val || val.trim().length < 2 || val.includes(" - ")) {
        setPresentanteResultados([]);
        setShowPresentanteDropdown(false);
        return;
      }
      try {
        const sqlite = await Database.load("sqlite:valeska.db");
        const searchTerm = `%${val.toUpperCase().trim()}%`;
        const res: any[] = await sqlite.select(
          "SELECT dni, primer_apellido, segundo_apellido, nombres FROM presentantes WHERE dni LIKE $1 OR nombres LIKE $2 OR primer_apellido LIKE $3 OR segundo_apellido LIKE $4 LIMIT 6",
          [searchTerm, searchTerm, searchTerm, searchTerm],
        );
        setPresentanteResultados(res);
        setShowPresentanteDropdown(res.length > 0);
      } catch (error) {
        console.error("Error buscando presentantes:", error);
      }
    };
    const debounceTimer = setTimeout(buscarPresentante, 250);
    return () => clearTimeout(debounceTimer);
  }, [formData.presentante_persona]);

  const seleccionarPresentante = (p: any) => {
    setFormData((prev) => ({
      ...prev,
      // AHORA: Se autocompleta en orden: PATERNO MATERNO NOMBRES - DNI
      presentante_persona:
        `${p.primer_apellido} ${p.segundo_apellido || ""} ${p.nombres}`
          .replace(/\s+/g, " ")
          .trim() + ` - ${p.dni}`,
    }));
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
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? checked : isSelect ? value : value.toUpperCase(),
    }));
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
        description: "Datos extraídos del PDF correctamente.",
      });
    }
    setIsFilling(false);
  };

  const saveTramite = async () => {
    setIsSaving(true);
    try {
      const sessionStr = localStorage.getItem("valeska_session_user");
      if (!sessionStr) throw new Error("No hay sesión activa.");
      const session = JSON.parse(sessionStr);

      const sqlite = await Database.load("sqlite:valeska.db");
      const now = new Date().toISOString();

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

      let empresaGestoraId = null;
      if (formData.presentante_empresa) {
        const match = formData.presentante_empresa.match(/(\d{11})$/);
        if (match) {
          const ruc = match[1];
          try {
            const empRes: any[] = await sqlite.select(
              "SELECT id FROM empresas_gestoras WHERE ruc = $1",
              [ruc],
            );
            if (empRes.length > 0) empresaGestoraId = empRes[0].id;
          } catch (e) {}
        }
      }

      let presentanteId = null;
      let presentanteFormateado = formData.presentante_persona;

      if (
        formData.presentante_persona &&
        formData.presentante_persona.trim() !== ""
      ) {
        const match = formData.presentante_persona.match(
          /^(.*?)\s*-\s*(\d{8,9})$/i,
        );
        const fullNombre = match
          ? match[1].trim()
          : formData.presentante_persona.trim();
        const dni = match ? match[2] : "";

        let nombres = "";
        let primerApellido = "";
        let segundoApellido = "";

        // LÓGICA DE PARSEO: ORDEN -> PATERNO MATERNO NOMBRES
        if (fullNombre.includes(",")) {
          // Si el usuario usa coma: APELLIDOS, NOMBRES
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
          // Si escribe sin coma (PEREZ GOMEZ JUAN)
          // Asumimos: Palabra 1 = Paterno, Palabra 2 = Materno, El resto = Nombres
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

        try {
          let presRes: any[] = [];
          if (dni) {
            presRes = await sqlite.select(
              "SELECT id FROM presentantes WHERE dni = $1",
              [dni],
            );
          } else {
            presRes = await sqlite.select(
              "SELECT id FROM presentantes WHERE nombres = $1 AND primer_apellido = $2",
              [nombres, primerApellido],
            );
          }

          if (presRes.length > 0) {
            presentanteId = presRes[0].id;
            await sqlite.execute(
              "UPDATE presentantes SET nombres = $1, primer_apellido = $2, segundo_apellido = $3, dni = $4, updated_at = $5 WHERE id = $6",
              [
                nombres,
                primerApellido,
                segundoApellido,
                dni || "S/N",
                now,
                presentanteId,
              ],
            );
          } else {
            presentanteId = crypto.randomUUID();
            await sqlite.execute(
              "INSERT INTO presentantes (id, dni, primer_apellido, segundo_apellido, nombres, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
              [
                presentanteId,
                dni || "S/N",
                primerApellido,
                segundoApellido,
                nombres,
                now,
                now,
              ],
            );
          }
        } catch (e) {
          console.error("Error guardando presentante", e);
        }

        presentanteFormateado = dni ? `${fullNombre} - ${dni}` : fullNombre;
      }

      let tramiteFinalId = formData.id;

      if (formData.id) {
        const tramRes: any[] = await sqlite.select(
          "SELECT cliente_id, vehiculo_id FROM tramites WHERE id = $1",
          [formData.id],
        );
        const { cliente_id, vehiculo_id } = tramRes[0];

        await sqlite.execute(
          `UPDATE clientes SET tipo_documento = $1, numero_documento = $2, razon_social_nombres = $3, telefono = $4, updated_at = $5 WHERE id = $6`,
          [
            formData.dni.length === 11 ? "RUC" : "DNI",
            formData.dni,
            formData.cliente,
            formData.telefono,
            now,
            cliente_id,
          ],
        );

        await sqlite.execute(
          `UPDATE vehiculos SET chasis_vin = $1, placa = $2, motor = $3, marca = $4, modelo = $5, color = $6, anio_fabricacion = $7, updated_at = $8 WHERE id = $9`,
          [
            formData.vehiculo_chasis,
            formData.vehiculo_placa,
            formData.vehiculo_motor,
            formData.vehiculo_marca,
            formData.vehiculo_modelo,
            formData.vehiculo_color,
            formData.vehiculo_anio,
            now,
            vehiculo_id,
          ],
        );

        await sqlite.execute(
          `UPDATE tramites SET codigo_verificacion = $1, n_titulo = $2, fecha_presentacion = $3, observaciones_generales = $4, entrego_tarjeta = $5, fecha_entrega_tarjeta = $6, entrego_placa = $7, fecha_entrega_placa = $8, tipo_tramite_id = $9, situacion_id = $10, tarjeta_en_oficina = $11, fecha_tarjeta_en_oficina = $12, placa_en_oficina = $13, fecha_placa_en_oficina = $14, metodo_entrega_tarjeta = $15, metodo_entrega_placa = $16, updated_at = $17 WHERE id = $18`,
          [
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
          `UPDATE tramite_detalles SET empresa_gestora_id = $1, presentante_id = $2, tipo_boleta = $3, numero_boleta = $4, fecha_boleta = $5, dua = $6, num_formato_inmatriculacion = $7, numero_recibo_tramite = $8, clausula_monto = $9, clausula_forma_pago = $10, clausula_pago_bancarizado = $11, aclaracion_dice = $12, aclaracion_debe_decir = $13, updated_at = $14 WHERE tramite_id = $15`,
          [
            empresaGestoraId,
            presentanteId,
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
        const clienteId = crypto.randomUUID();
        const vehiculoId = crypto.randomUUID();
        tramiteFinalId = crypto.randomUUID();
        const tramiteDetalleId = crypto.randomUUID();

        await sqlite.execute(
          `INSERT INTO clientes (id, tipo_documento, numero_documento, razon_social_nombres, telefono, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            clienteId,
            formData.dni.length === 11 ? "RUC" : "DNI",
            formData.dni,
            formData.cliente,
            formData.telefono,
            now,
            now,
          ],
        );

        await sqlite.execute(
          `INSERT INTO vehiculos (id, chasis_vin, placa, motor, marca, modelo, color, anio_fabricacion, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            vehiculoId,
            formData.vehiculo_chasis,
            formData.vehiculo_placa,
            formData.vehiculo_motor,
            formData.vehiculo_marca,
            formData.vehiculo_modelo,
            formData.vehiculo_color,
            formData.vehiculo_anio,
            now,
            now,
          ],
        );

        await sqlite.execute(
          `INSERT INTO tramites (id, codigo_verificacion, tramite_anio, cliente_id, vehiculo_id, tipo_tramite_id, situacion_id, usuario_creador_id, sucursal_id, n_titulo, fecha_presentacion, observaciones_generales, entrego_tarjeta, fecha_entrega_tarjeta, entrego_placa, fecha_entrega_placa, tarjeta_en_oficina, fecha_tarjeta_en_oficina, placa_en_oficina, fecha_placa_en_oficina, metodo_entrega_tarjeta, metodo_entrega_placa, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)`,
          [
            tramiteFinalId,
            formData.codigo_verificacion,
            formData.tramite_anio,
            clienteId,
            vehiculoId,
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
          `INSERT INTO tramite_detalles (id, tramite_id, empresa_gestora_id, presentante_id, tipo_boleta, numero_boleta, fecha_boleta, dua, num_formato_inmatriculacion, numero_recibo_tramite, clausula_monto, clausula_forma_pago, clausula_pago_bancarizado, aclaracion_dice, aclaracion_debe_decir, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
          [
            tramiteDetalleId,
            tramiteFinalId,
            empresaGestoraId,
            presentanteId,
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
        presentante_persona: presentanteFormateado,
      }));

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
        description: "Error interno al procesar el trámite: " + error.message,
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
    empresaResultados,
    showEmpresaDropdown,
    setShowEmpresaDropdown,
    seleccionarEmpresa,
    presentanteResultados,
    showPresentanteDropdown,
    setShowPresentanteDropdown,
    seleccionarPresentante,
  };
}
