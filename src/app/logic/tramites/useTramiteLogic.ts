import { useState, useEffect, useCallback, useRef } from "react";
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

  const skipEmpresaSearch = useRef(false);
  const skipPresentanteSearch = useRef(false);

  const [selectedEmpresaId, setSelectedEmpresaId] = useState<string | null>(
    (initialData as any)?.empresa_gestora_id || null,
  );
  const [selectedRepresentanteLegalId, setSelectedRepresentanteLegalId] =
    useState<string | null>(
      (initialData as any)?.representante_legal_id || null,
    );
  const [selectedPresentanteId, setSelectedPresentanteId] = useState<
    string | null
  >((initialData as any)?.presentante_id || null);

  const [formData, setFormData] = useState<
    TramiteFormData & { creador?: string }
  >(() => {
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
      vehiculo_carroceria: "",
      vehiculo_placa: "",
      vehiculo_modelo: "",
      presentante_empresa: "",
      presentante_persona: "",
      tipo_boleta: "Electrónica",
      numero_boleta: "",
      fecha_boleta: "",
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
    } as TramiteFormData & { creador?: string };
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
        if (!prev.id)
          return {
            ...prev,
            tipo_tramite:
              prev.tipo_tramite ||
              (resTipos.length > 0 ? resTipos[0].nombre : ""),
            estado_tramite:
              prev.estado_tramite ||
              (resSits.length > 0 ? resSits[0].nombre : ""),
          };
        return prev;
      });
    } catch (error) {}
  }, []);

  useEffect(() => {
    loadCatalogos();
  }, [loadCatalogos]);

  // ============================================================================
  // BUSCADOR 1: EMPRESA Y SU GERENTE
  // ============================================================================
  useEffect(() => {
    if (skipEmpresaSearch.current) {
      skipEmpresaSearch.current = false;
      return;
    }

    const buscarEmpresaYRepresentante = async () => {
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
          `SELECT eg.id, eg.ruc, eg.razon_social, rl.id as rep_id, rl.nombres, rl.primer_apellido, rl.segundo_apellido, rl.dni as rep_dni
           FROM empresas_gestoras eg
           LEFT JOIN representantes_legales rl ON eg.id = rl.empresa_gestora_id AND rl.deleted_at IS NULL
           WHERE eg.ruc LIKE $1 OR eg.razon_social LIKE $2 OR rl.nombres LIKE $3 OR rl.primer_apellido LIKE $4 OR rl.segundo_apellido LIKE $5 OR rl.dni LIKE $6 LIMIT 15`,
          [
            searchTerm,
            searchTerm,
            searchTerm,
            searchTerm,
            searchTerm,
            searchTerm,
          ],
        );
        setEmpresaResultados(res);
        setShowEmpresaDropdown(res.length > 0);
      } catch (error) {}
    };
    const debounceTimer = setTimeout(buscarEmpresaYRepresentante, 250);
    return () => clearTimeout(debounceTimer);
  }, [formData.presentante_empresa]);

  const seleccionarEmpresa = (emp: any) => {
    skipEmpresaSearch.current = true;
    let nombreRep = "";
    let comboName = emp.razon_social || "";
    if (emp.rep_id) {
      nombreRep =
        `${emp.primer_apellido || ""} ${emp.segundo_apellido || ""} ${emp.nombres || ""}`
          .replace(/\s+/g, " ")
          .trim();
      comboName = `${emp.razon_social || ""} - ${nombreRep}`;
    }
    setFormData((prev) => ({ ...prev, presentante_empresa: comboName }));
    setSelectedEmpresaId(emp.id);
    setSelectedRepresentanteLegalId(emp.rep_id || null);
    setEmpresaResultados([]);
    setShowEmpresaDropdown(false);
  };

  // ============================================================================
  // BUSCADOR 2: TRAMITADOR (Presentante Físico)
  // ============================================================================
  useEffect(() => {
    if (skipPresentanteSearch.current) {
      skipPresentanteSearch.current = false;
      return;
    }
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
        const resPres: any[] = await sqlite.select(
          `SELECT id, dni, primer_apellido, segundo_apellido, nombres FROM presentantes WHERE dni LIKE $1 OR nombres LIKE $2 OR primer_apellido LIKE $3 OR segundo_apellido LIKE $4 LIMIT 8`,
          [searchTerm, searchTerm, searchTerm, searchTerm],
        );
        setPresentanteResultados(resPres);
        setShowPresentanteDropdown(resPres.length > 0);
      } catch (error) {}
    };
    const debounceTimer = setTimeout(buscarPresentante, 250);
    return () => clearTimeout(debounceTimer);
  }, [formData.presentante_persona]);

  const seleccionarPresentante = (p: any) => {
    skipPresentanteSearch.current = true;
    const nombreCompleto =
      `${p.primer_apellido || ""} ${p.segundo_apellido || ""} ${p.nombres || ""}`
        .replace(/\s+/g, " ")
        .trim();
    setFormData((prev) => ({ ...prev, presentante_persona: nombreCompleto }));
    setSelectedPresentanteId(p.id);
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
              : (value || "").toUpperCase(),
      };
      if (name === "presentante_empresa") {
        setSelectedEmpresaId(null);
        setSelectedRepresentanteLegalId(null);
      }
      if (name === "presentante_persona") {
        setSelectedPresentanteId(null);
      }
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

  const parseNames = (fullNombre: string) => {
    let nombres = "",
      primerApellido = "",
      segundoApellido = "";
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

  const getSafeDni = () =>
    `SN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const autofillFromPdf = async () => {
    setIsFilling(true);
    try {
      const pdfData: any = await handlePdfAutofillAction();

      if (pdfData) {
        const chasis = (pdfData.vehiculo_chasis || "").trim();
        const motor = (pdfData.vehiculo_motor || "").trim();
        const empresaRaw = (pdfData.presentante_empresa || "")
          .trim()
          .toUpperCase();
        const gerenteRaw = (pdfData.presentante_persona || "")
          .trim()
          .toUpperCase();

        const pdfDomicilio = (
          pdfData.pdf_empresa_domicilio || ""
        ).toUpperCase();
        const pdfPartida = (pdfData.pdf_partida || "").toUpperCase();
        const pdfOficina = (pdfData.pdf_oficina || "").toUpperCase();
        const pdfDniGerente =
          (pdfData.pdf_rep_dni || "").trim() || getSafeDni();

        const cleanedFormData = { ...pdfData };
        cleanedFormData.presentante_persona = formData.presentante_persona;

        let finalEmpresaId = null;
        let finalRepLegalId = null;
        let finalComboEmpresa = empresaRaw || "";

        const sqlite = await Database.load("sqlite:valeska.db");
        const now = Date.now();

        if (empresaRaw) {
          const empCheck: any[] = await sqlite.select(
            "SELECT id FROM empresas_gestoras WHERE razon_social = $1 LIMIT 1",
            [empresaRaw],
          );
          if (empCheck.length > 0) {
            finalEmpresaId = empCheck[0].id;
            await sqlite.execute(
              "UPDATE empresas_gestoras SET direccion = $1 WHERE id = $2 AND (direccion IS NULL OR direccion = '')",
              [pdfDomicilio, finalEmpresaId],
            );
          } else {
            finalEmpresaId = crypto.randomUUID();
            await sqlite.execute(
              "INSERT INTO empresas_gestoras (id, ruc, razon_social, direccion, created_at, updated_at, sync_status) VALUES ($1, $2, $3, $4, $5, $6, 'LOCAL_INSERT')",
              [finalEmpresaId, null, empresaRaw, pdfDomicilio, now, now],
            );
          }
        }

        if (gerenteRaw && finalEmpresaId) {
          const { nombres, primerApellido, segundoApellido } =
            parseNames(gerenteRaw);
          const nombreGerenteFormateado =
            `${primerApellido} ${segundoApellido} ${nombres}`
              .replace(/\s+/g, " ")
              .trim();

          const repCheck: any[] = await sqlite.select(
            "SELECT id FROM representantes_legales WHERE nombres = $1 AND primer_apellido = $2 AND empresa_gestora_id = $3 LIMIT 1",
            [nombres, primerApellido, finalEmpresaId],
          );

          if (repCheck.length > 0) {
            finalRepLegalId = repCheck[0].id;
            await sqlite.execute(
              "UPDATE representantes_legales SET dni = $1, partida_registral = $2, oficina_registral = $3, domicilio = $4 WHERE id = $5 AND (dni LIKE 'SN-%' OR dni IS NULL)",
              [
                pdfDniGerente,
                pdfPartida,
                pdfOficina,
                pdfDomicilio,
                finalRepLegalId,
              ],
            );
          } else {
            finalRepLegalId = crypto.randomUUID();
            await sqlite.execute(
              "INSERT INTO representantes_legales (id, empresa_gestora_id, dni, primer_apellido, segundo_apellido, nombres, partida_registral, oficina_registral, domicilio, created_at, updated_at, sync_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'LOCAL_INSERT')",
              [
                finalRepLegalId,
                finalEmpresaId,
                pdfDniGerente,
                primerApellido,
                segundoApellido,
                nombres,
                pdfPartida,
                pdfOficina,
                pdfDomicilio,
                now,
                now,
              ],
            );
          }
          finalComboEmpresa = `${empresaRaw} - ${nombreGerenteFormateado}`;
        }

        setFormData((prev) => ({
          ...prev,
          ...cleanedFormData,
          presentante_empresa: finalComboEmpresa || prev.presentante_empresa,
        }));

        setSelectedEmpresaId(finalEmpresaId);
        setSelectedRepresentanteLegalId(finalRepLegalId);
        skipEmpresaSearch.current = true;

        sileo.success({
          title: "Completado",
          description:
            "Todos los datos extraídos exitosamente. Verifique el Motor y Chasis.",
        });
      }
    } catch (error) {
      console.error("Error validando PDF:", error);
    } finally {
      setIsFilling(false);
    }
  };

  const saveTramite = async () => {
    setIsSaving(true);
    try {
      const sqlite = await Database.load("sqlite:valeska.db");

      const chasisToCheck = (formData.vehiculo_chasis || "")
        .trim()
        .toUpperCase();
      const motorToCheck = (formData.vehiculo_motor || "").trim().toUpperCase();

      const tieneChasis = chasisToCheck && chasisToCheck !== "S/N";
      const tieneMotor = motorToCheck && motorToCheck !== "S/N";

      if (tieneChasis || tieneMotor) {
        let dupQuery =
          "SELECT t.id, t.n_titulo FROM tramites t JOIN vehiculos v ON t.vehiculo_id = v.id WHERE t.deleted_at IS NULL AND (";
        const dupConditions = [];
        const dupParams: any[] = [];

        if (tieneChasis) {
          dupConditions.push(`v.chasis_vin = $${dupParams.length + 1}`);
          dupParams.push(chasisToCheck);
        }
        if (tieneMotor) {
          dupConditions.push(`v.motor = $${dupParams.length + 1}`);
          dupParams.push(motorToCheck);
        }

        dupQuery += dupConditions.join(" OR ") + ")";

        if (formData.id) {
          dupQuery += ` AND t.id != $${dupParams.length + 1}`;
          dupParams.push(formData.id);
        }

        const duplicados: any[] = await sqlite.select(dupQuery, dupParams);

        if (duplicados.length > 0) {
          sileo.error({
            title: "Trámite Duplicado Bloqueado",
            description: `Ya existe un trámite activo en el sistema utilizando este mismo Motor o Chasis.`,
          });
          setIsSaving(false);
          return null;
        }
      }

      const sessionStr = localStorage.getItem("valeska_session_user");
      if (!sessionStr) throw new Error("No hay sesión activa.");
      const session = JSON.parse(sessionStr);
      const now = Date.now();

      let tipoTramiteId = "TIPO_001",
        situacionId = "SIT_001",
        sucursalId = null;
      try {
        const tipoRes: any[] = await sqlite.select(
          "SELECT id FROM catalogo_tipos_tramite WHERE nombre = $1",
          [formData.tipo_tramite || ""],
        );
        if (tipoRes.length > 0) tipoTramiteId = tipoRes[0].id;
      } catch (e) {}
      try {
        const sitRes: any[] = await sqlite.select(
          "SELECT id FROM catalogo_situaciones WHERE nombre = $1",
          [formData.estado_tramite || ""],
        );
        if (sitRes.length > 0) situacionId = sitRes[0].id;
      } catch (e) {}
      try {
        const dispRes: any[] = await sqlite.select(
          "SELECT sucursal_id FROM dispositivos LIMIT 1",
        );
        if (dispRes.length > 0) sucursalId = dispRes[0].sucursal_id;
      } catch (e) {}

      let finalClienteId = null;
      const docCliente = (formData.dni || "").trim() || getSafeDni();
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
              (formData.cliente || "").toUpperCase(),
              formData.telefono || "",
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
              (formData.cliente || "").toUpperCase(),
              formData.telefono || "",
              now,
              now,
            ],
          );
        }
      } catch (e) {
        throw new Error("No se pudo registrar el Cliente. Revise el DNI/RUC.");
      }

      let finalVehiculoId = null;
      const vinVehiculo =
        (formData.vehiculo_chasis || "").trim() || getSafeDni();
      try {
        const vehRes: any[] = await sqlite.select(
          "SELECT id FROM vehiculos WHERE chasis_vin = $1",
          [vinVehiculo],
        );
        if (vehRes.length > 0) {
          finalVehiculoId = vehRes[0].id;
          await sqlite.execute(
            "UPDATE vehiculos SET placa=$1, motor=$2, marca=$3, modelo=$4, color=$5, carroceria=$6, anio_fabricacion=$7, updated_at=$8, sync_status='LOCAL_UPDATE' WHERE id=$9",
            [
              (formData.vehiculo_placa || "").toUpperCase(),
              (formData.vehiculo_motor || "").toUpperCase(),
              (formData.vehiculo_marca || "").toUpperCase(),
              (formData.vehiculo_modelo || "").toUpperCase(),
              (formData.vehiculo_color || "").toUpperCase(),
              (formData.vehiculo_carroceria || "").toUpperCase(),
              formData.vehiculo_anio || "",
              now,
              finalVehiculoId,
            ],
          );
        } else {
          finalVehiculoId = crypto.randomUUID();
          await sqlite.execute(
            "INSERT INTO vehiculos (id, chasis_vin, placa, motor, marca, modelo, color, carroceria, anio_fabricacion, created_at, updated_at, sync_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'LOCAL_INSERT')",
            [
              finalVehiculoId,
              vinVehiculo,
              (formData.vehiculo_placa || "").toUpperCase(),
              (formData.vehiculo_motor || "").toUpperCase(),
              (formData.vehiculo_marca || "").toUpperCase(),
              (formData.vehiculo_modelo || "").toUpperCase(),
              (formData.vehiculo_color || "").toUpperCase(),
              (formData.vehiculo_carroceria || "").toUpperCase(),
              formData.vehiculo_anio || "",
              now,
              now,
            ],
          );
        }
      } catch (e) {
        throw new Error(
          "No se pudo registrar el Vehículo. Revise el Chasis/VIN.",
        );
      }

      let finalEmpresaId = selectedEmpresaId;
      let finalRepLegalId = selectedRepresentanteLegalId;

      const empRawStr = formData.presentante_empresa || "";
      if (empRawStr.trim() !== "") {
        const parts = empRawStr.split(" - ");
        const rs = parts[0].trim().toUpperCase();
        const repName = parts.length > 1 ? parts[1].trim().toUpperCase() : null;

        if (!finalEmpresaId) {
          const empRes: any[] = await sqlite.select(
            "SELECT id FROM empresas_gestoras WHERE razon_social = $1",
            [rs],
          );
          if (empRes.length > 0) finalEmpresaId = empRes[0].id;
          else {
            finalEmpresaId = crypto.randomUUID();
            await sqlite.execute(
              "INSERT INTO empresas_gestoras (id, ruc, razon_social, created_at, updated_at, sync_status) VALUES ($1, $2, $3, $4, $5, 'LOCAL_INSERT')",
              [finalEmpresaId, null, rs, now, now],
            );
          }
        }

        if (repName && !finalRepLegalId && finalEmpresaId) {
          const { nombres, primerApellido, segundoApellido } =
            parseNames(repName);
          const repRes: any[] = await sqlite.select(
            "SELECT id FROM representantes_legales WHERE nombres = $1 AND primer_apellido = $2 AND empresa_gestora_id = $3",
            [nombres, primerApellido, finalEmpresaId],
          );
          if (repRes.length > 0) finalRepLegalId = repRes[0].id;
          else {
            finalRepLegalId = crypto.randomUUID();
            await sqlite.execute(
              "INSERT INTO representantes_legales (id, empresa_gestora_id, dni, primer_apellido, segundo_apellido, nombres, created_at, updated_at, sync_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'LOCAL_INSERT')",
              [
                finalRepLegalId,
                finalEmpresaId,
                getSafeDni(),
                primerApellido,
                segundoApellido,
                nombres,
                now,
                now,
              ],
            );
          }
        }
      }

      let finalPresId = selectedPresentanteId;
      const presRawStr = formData.presentante_persona || "";
      if (!finalPresId && presRawStr.trim() !== "") {
        const fullNombre = presRawStr.trim().toUpperCase();
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
                getSafeDni(),
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
        await sqlite.execute(
          `UPDATE tramites SET cliente_id = $1, vehiculo_id = $2, codigo_verificacion = $3, n_titulo = $4, fecha_presentacion = $5, observaciones_generales = $6, entrego_tarjeta = $7, fecha_entrega_tarjeta = $8, entrego_placa = $9, fecha_entrega_placa = $10, tipo_tramite_id = $11, situacion_id = $12, tarjeta_en_oficina = $13, fecha_tarjeta_en_oficina = $14, placa_en_oficina = $15, fecha_placa_en_oficina = $16, metodo_entrega_tarjeta = $17, metodo_entrega_placa = $18, updated_at = $19, sync_status = 'LOCAL_UPDATE' WHERE id = $20`,
          [
            finalClienteId,
            finalVehiculoId,
            (formData.codigo_verificacion || "").toUpperCase(),
            (formData.n_titulo || "").toUpperCase(),
            formData.fecha_presentacion,
            formData.observaciones || "",
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
            formData.metodo_entrega_tarjeta || "",
            formData.metodo_entrega_placa || "",
            now,
            formData.id,
          ],
        );
        await sqlite.execute(
          `UPDATE tramite_detalles SET empresa_gestora_id = $1, presentante_id = $2, representante_legal_id = $3, tipo_boleta = $4, numero_boleta = $5, fecha_boleta = $6, dua = $7, num_formato_inmatriculacion = $8, numero_recibo_tramite = $9, clausula_monto = $10, clausula_forma_pago = $11, clausula_pago_bancarizado = $12, aclaracion_dice = $13, aclaracion_debe_decir = $14, updated_at = $15, sync_status = 'LOCAL_UPDATE' WHERE tramite_id = $16`,
          [
            finalEmpresaId,
            finalPresId,
            finalRepLegalId,
            formData.tipo_boleta || "",
            (formData.numero_boleta || "").toUpperCase(),
            formData.fecha_boleta || "",
            (formData.dua || "").toUpperCase(),
            (formData.num_formato_inmatriculacion || "").toUpperCase(),
            (formData.numero_recibo_tramite || "").toUpperCase(),
            parseFloat(formData.clausula_monto) || 0,
            (formData.clausula_forma_pago || "").toUpperCase(),
            (formData.clausula_pago_bancarizado || "").toUpperCase(),
            (formData.aclaracion_dice || "").toUpperCase(),
            (formData.aclaracion_debe_decir || "").toUpperCase(),
            now,
            formData.id,
          ],
        );
      } else {
        tramiteFinalId = crypto.randomUUID();
        const tramiteDetalleId = crypto.randomUUID();
        await sqlite.execute(
          `INSERT INTO tramites (id, codigo_verificacion, tramite_anio, cliente_id, vehiculo_id, tipo_tramite_id, situacion_id, usuario_creador_id, sucursal_id, n_titulo, fecha_presentacion, observaciones_generales, entrego_tarjeta, fecha_entrega_tarjeta, entrego_placa, fecha_entrega_placa, tarjeta_en_oficina, fecha_tarjeta_en_oficina, placa_en_oficina, fecha_placa_en_oficina, metodo_entrega_tarjeta, metodo_entrega_placa, created_at, updated_at, sync_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, 'LOCAL_INSERT')`,
          [
            tramiteFinalId,
            (formData.codigo_verificacion || "").toUpperCase(),
            formData.tramite_anio,
            finalClienteId,
            finalVehiculoId,
            tipoTramiteId,
            situacionId,
            session.id,
            sucursalId,
            (formData.n_titulo || "").toUpperCase(),
            formData.fecha_presentacion,
            formData.observaciones || "",
            formData.check_entrega_tarjeta ? 1 : 0,
            formData.fecha_entrega_tarjeta,
            formData.check_entrega_placa ? 1 : 0,
            formData.fecha_entrega_placa,
            formData.check_tarjeta_oficina ? 1 : 0,
            formData.fecha_tarjeta_oficina,
            formData.check_placa_oficina ? 1 : 0,
            formData.fecha_placa_oficina,
            formData.metodo_entrega_tarjeta || "",
            formData.metodo_entrega_placa || "",
            now,
            now,
          ],
        );
        await sqlite.execute(
          `INSERT INTO tramite_detalles (id, tramite_id, empresa_gestora_id, presentante_id, representante_legal_id, tipo_boleta, numero_boleta, fecha_boleta, dua, num_formato_inmatriculacion, numero_recibo_tramite, clausula_monto, clausula_forma_pago, clausula_pago_bancarizado, aclaracion_dice, aclaracion_debe_decir, created_at, updated_at, sync_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, 'LOCAL_INSERT')`,
          [
            tramiteDetalleId,
            tramiteFinalId,
            finalEmpresaId,
            finalPresId,
            finalRepLegalId,
            formData.tipo_boleta || "",
            (formData.numero_boleta || "").toUpperCase(),
            formData.fecha_boleta || "",
            (formData.dua || "").toUpperCase(),
            (formData.num_formato_inmatriculacion || "").toUpperCase(),
            (formData.numero_recibo_tramite || "").toUpperCase(),
            parseFloat(formData.clausula_monto) || 0,
            (formData.clausula_forma_pago || "").toUpperCase(),
            (formData.clausula_pago_bancarizado || "").toUpperCase(),
            (formData.aclaracion_dice || "").toUpperCase(),
            (formData.aclaracion_debe_decir || "").toUpperCase(),
            now,
            now,
          ],
        );
      }

      setFormData((prev) => ({ ...prev, id: tramiteFinalId }));
      setSelectedEmpresaId(finalEmpresaId);
      setSelectedPresentanteId(finalPresId);
      setSelectedRepresentanteLegalId(finalRepLegalId);

      window.dispatchEvent(new Event("valeska_reload_tramites"));
      sileo.success({
        title: "Éxito",
        description: formData.id
          ? "Trámite actualizado correctamente"
          : "Trámite registrado correctamente",
      });
      return tramiteFinalId;
    } catch (error: any) {
      const errorMsg =
        typeof error === "string"
          ? error
          : error.message || "SQLite rechazó la inserción.";
      sileo.error({ title: "Error al Guardar", description: errorMsg });
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
