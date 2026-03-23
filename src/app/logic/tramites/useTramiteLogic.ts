import { useState, useEffect, useCallback } from "react";
import Database from "@tauri-apps/plugin-sql";
import { TramiteFormData } from "../../types/tramites/tramite.types";
import { handlePdfAutofillAction } from "./pdfActions";

export function useTramiteLogic(initialData?: Partial<TramiteFormData>) {
    const [isSaving, setIsSaving] = useState(false);
    const [isFilling, setIsFilling] = useState(false);

    const [opcionesTipos, setOpcionesTipos] = useState<string[]>([]);
    const [opcionesSituacion, setOpcionesSituacion] = useState<string[]>([]);
    const [plantillas, setPlantillas] = useState<{ id: string, nombre_documento: string }[]>([]);

    const [empresaResultados, setEmpresaResultados] = useState<any[]>([]);
    const [showEmpresaDropdown, setShowEmpresaDropdown] = useState(false);

    const [formData, setFormData] = useState<TramiteFormData>(() => {
        const today = new Date().toISOString().split('T')[0];
        const randomCode = `VAL${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;

        return {
            tramite_anio: new Date().getFullYear().toString(),
            cliente: "", telefono: "", dni: "", n_titulo: "",
            tipo_tramite: "", estado_tramite: "", observaciones: "",
            fecha_presentacion: today, check_entrega_tarjeta: false, fecha_entrega_tarjeta: "",
            check_entrega_placa: false, fecha_entrega_placa: "", codigo_verificacion: randomCode,
            vehiculo_marca: "", vehiculo_motor: "", vehiculo_chasis: "", vehiculo_anio: "",
            vehiculo_color: "", vehiculo_placa: "", vehiculo_modelo: "",
            presentante_empresa: "", presentante_persona: "", tipo_boleta: "Electrónica",
            numero_boleta: "", fecha_boleta: today, dua: "", num_formato_inmatriculacion: "",
            clausula_monto: "", clausula_forma_pago: "", clausula_pago_bancarizado: "",
            aclaracion_dice: "", aclaracion_debe_decir: "", fecha_impresion: today,
            ...(initialData || {})
        } as TramiteFormData;
    });

    // =========================================================================
    // ✨ AUTOFORMATEADOR INTELIGENTE DE APODERADOS
    // =========================================================================
    const formatearRepresentantes = (texto: string) => {
        if (!texto) return "";
        // Detecta números de 8-9 dígitos y auto-inyecta "IDENTIFICADO CON DNI/CE N°"
        // Evita duplicar si el usuario ya escribió "identificado con..."
        return texto.replace(
            /(?:\s*,\s*|\s+)?(?:identificados?\s+con\s+(?:d\.?n\.?i\.?|c\.?e\.?)\s*(?:n[°º]?)?\s*)?(\d{8,9})/gi,
            (match, numero) => {
                const tipoDoc = numero.length === 9 ? "C.E." : "D.N.I.";
                return `, IDENTIFICADO CON ${tipoDoc} N° ${numero}`;
            }
        ).trim().toUpperCase();
    };

    const loadCatalogos = useCallback(async () => {
        try {
            const sqlite = await Database.load("sqlite:valeska.db");
            const resTipos: any[] = await sqlite.select("SELECT nombre FROM catalogo_tipos_tramite WHERE activo = 1 ORDER BY nombre ASC");
            const resSits: any[] = await sqlite.select("SELECT nombre FROM catalogo_situaciones WHERE activo = 1 ORDER BY nombre ASC");
            const resTpl: any[] = await sqlite.select("SELECT id, nombre_documento FROM plantillas_documentos WHERE activo = 1 AND deleted_at IS NULL ORDER BY nombre_documento ASC");

            const tipos = resTipos.map(t => t.nombre);
            const sits = resSits.map(s => s.nombre);

            setOpcionesTipos(tipos);
            setOpcionesSituacion(sits);
            setPlantillas(resTpl);

            setFormData(prev => {
                if (!prev.id) {
                    return {
                        ...prev,
                        tipo_tramite: prev.tipo_tramite || (tipos.length > 0 ? tipos[0] : ""),
                        estado_tramite: prev.estado_tramite || (sits.length > 0 ? sits[0] : ""),
                    }
                }
                return prev;
            });
        } catch (error) {
            console.error("Error al cargar catálogos y plantillas:", error);
        }
    }, []);

    useEffect(() => { loadCatalogos(); }, [loadCatalogos]);

    useEffect(() => {
        const buscarEmpresa = async () => {
            const val = formData.presentante_empresa;

            if (!val || val.trim().length < 2) {
                setEmpresaResultados([]);
                setShowEmpresaDropdown(false);
                return;
            }

            if (/^\d{11}\s*-/.test(val)) {
                setEmpresaResultados([]);
                setShowEmpresaDropdown(false);
                return;
            }

            try {
                const sqlite = await Database.load("sqlite:valeska.db");
                const searchTerm = `%${val.toUpperCase().trim()}%`;

                const res: any[] = await sqlite.select(
                    "SELECT ruc, razon_social, representantes FROM empresas_gestoras WHERE ruc LIKE $1 OR razon_social LIKE $2 LIMIT 6",
                    [searchTerm, searchTerm]
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
        setFormData(prev => ({
            ...prev,
            presentante_empresa: `${emp.ruc} - ${emp.razon_social}`,
            presentante_persona: formatearRepresentantes(emp.representantes || "")
        }));
        setEmpresaResultados([]);
        setShowEmpresaDropdown(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const isSelect = e.target.tagName === 'SELECT';
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : (isSelect ? value : value.toUpperCase()) }));
    };

    const handleAutoCheck = (field: 'check_entrega_tarjeta' | 'check_entrega_placa') => {
        const todayStr = new Date().toISOString().split('T')[0];
        setFormData(prev => {
            const isChecked = !prev[field];
            let newData = { ...prev, [field]: isChecked };
            if (field === 'check_entrega_tarjeta') newData.fecha_entrega_tarjeta = isChecked ? todayStr : "";
            if (field === 'check_entrega_placa') newData.fecha_entrega_placa = isChecked ? todayStr : "";
            return newData;
        });
    };

    const autofillFromPdf = async () => {
        setIsFilling(true);
        const pdfData = await handlePdfAutofillAction();
        if (pdfData) {
            if (pdfData.presentante_empresa) {
                pdfData.presentante_empresa = formatearRepresentantes(pdfData.presentante_empresa);
            }
            setFormData(prev => ({ ...prev, ...pdfData }));
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

            const tipoRes: any[] = await sqlite.select("SELECT id FROM catalogo_tipos_tramite WHERE nombre = $1", [formData.tipo_tramite]);
            const tipoTramiteId = tipoRes.length > 0 ? tipoRes[0].id : "TIPO_001";

            const sitRes: any[] = await sqlite.select("SELECT id FROM catalogo_situaciones WHERE nombre = $1", [formData.estado_tramite]);
            const situacionId = sitRes.length > 0 ? sitRes[0].id : "SIT_001";

            const dispRes: any[] = await sqlite.select("SELECT sucursal_id FROM dispositivos LIMIT 1");
            const sucursalId = dispRes.length > 0 ? dispRes[0].sucursal_id : null;

            // =========================================================================
            // 🛠️ GUARDADO SEGURO DE APODERADOS Y EMPRESA GESTORA
            // =========================================================================
            const presentanteFormateado = formatearRepresentantes(formData.presentante_persona);

            let empresaGestoraId = null;
            if (formData.presentante_empresa) {
                const match = formData.presentante_empresa.match(/^(\d{11})/);
                if (match) {
                    const ruc = match[1];
                    const empRes: any[] = await sqlite.select("SELECT id FROM empresas_gestoras WHERE ruc = $1", [ruc]);
                    if (empRes.length > 0) {
                        empresaGestoraId = empRes[0].id;

                        // La empresa "Aprende" a sus nuevos apoderados
                        if (presentanteFormateado.length > 0) {
                            await sqlite.execute(
                                "UPDATE empresas_gestoras SET representantes = $1, updated_at = $2 WHERE id = $3",
                                [presentanteFormateado, now, empresaGestoraId]
                            );
                        }
                    }
                }
            }

            let tramiteFinalId = formData.id;

            if (formData.id) {
                const tramRes: any[] = await sqlite.select("SELECT cliente_id, vehiculo_id FROM tramites WHERE id = $1", [formData.id]);
                const { cliente_id, vehiculo_id } = tramRes[0];

                await sqlite.execute(`UPDATE clientes SET tipo_documento = $1, numero_documento = $2, razon_social_nombres = $3, telefono = $4, updated_at = $5 WHERE id = $6`,
                    [formData.dni.length === 11 ? "RUC" : "DNI", formData.dni, formData.cliente, formData.telefono, now, cliente_id]);
                await sqlite.execute(`UPDATE vehiculos SET chasis_vin = $1, placa = $2, motor = $3, marca = $4, modelo = $5, color = $6, anio_fabricacion = $7, updated_at = $8 WHERE id = $9`,
                    [formData.vehiculo_chasis, formData.vehiculo_placa, formData.vehiculo_motor, formData.vehiculo_marca, formData.vehiculo_modelo, formData.vehiculo_color, formData.vehiculo_anio, now, vehiculo_id]);
                await sqlite.execute(`UPDATE tramites SET n_titulo = $1, fecha_presentacion = $2, observaciones_generales = $3, entrego_tarjeta = $4, fecha_entrega_tarjeta = $5, entrego_placa = $6, fecha_entrega_placa = $7, tipo_tramite_id = $8, situacion_id = $9, updated_at = $10 WHERE id = $11`,
                    [formData.n_titulo, formData.fecha_presentacion, formData.observaciones, formData.check_entrega_tarjeta ? 1 : 0, formData.fecha_entrega_tarjeta, formData.check_entrega_placa ? 1 : 0, formData.fecha_entrega_placa, tipoTramiteId, situacionId, now, formData.id]);

                await sqlite.execute(`UPDATE tramite_detalles SET empresa_gestora_id = $1, presentante_persona = $2, tipo_boleta = $3, numero_boleta = $4, fecha_boleta = $5, dua = $6, num_formato_inmatriculacion = $7, clausula_monto = $8, clausula_forma_pago = $9, clausula_pago_bancarizado = $10, aclaracion_dice = $11, aclaracion_debe_decir = $12, updated_at = $13 WHERE tramite_id = $14`,
                    [empresaGestoraId, presentanteFormateado, formData.tipo_boleta, formData.numero_boleta, formData.fecha_boleta, formData.dua, formData.num_formato_inmatriculacion, parseFloat(formData.clausula_monto) || 0, formData.clausula_forma_pago, formData.clausula_pago_bancarizado, formData.aclaracion_dice, formData.aclaracion_debe_decir, now, formData.id]);
            } else {
                const clienteId = crypto.randomUUID();
                const vehiculoId = crypto.randomUUID();
                tramiteFinalId = crypto.randomUUID();
                const tramiteDetalleId = crypto.randomUUID();

                await sqlite.execute(`INSERT INTO clientes (id, tipo_documento, numero_documento, razon_social_nombres, telefono, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [clienteId, formData.dni.length === 11 ? "RUC" : "DNI", formData.dni, formData.cliente, formData.telefono, now, now]);
                await sqlite.execute(`INSERT INTO vehiculos (id, chasis_vin, placa, motor, marca, modelo, color, anio_fabricacion, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                    [vehiculoId, formData.vehiculo_chasis, formData.vehiculo_placa, formData.vehiculo_motor, formData.vehiculo_marca, formData.vehiculo_modelo, formData.vehiculo_color, formData.vehiculo_anio, now, now]);
                await sqlite.execute(`INSERT INTO tramites (id, codigo_verificacion, tramite_anio, cliente_id, vehiculo_id, tipo_tramite_id, situacion_id, usuario_creador_id, sucursal_id, n_titulo, fecha_presentacion, observaciones_generales, entrego_tarjeta, fecha_entrega_tarjeta, entrego_placa, fecha_entrega_placa, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
                    [tramiteFinalId, formData.codigo_verificacion, formData.tramite_anio, clienteId, vehiculoId, tipoTramiteId, situacionId, session.id, sucursalId, formData.n_titulo, formData.fecha_presentacion, formData.observaciones, formData.check_entrega_tarjeta ? 1 : 0, formData.fecha_entrega_tarjeta, formData.check_entrega_placa ? 1 : 0, formData.fecha_entrega_placa, now, now]);

                await sqlite.execute(`INSERT INTO tramite_detalles (id, tramite_id, empresa_gestora_id, presentante_persona, tipo_boleta, numero_boleta, fecha_boleta, dua, num_formato_inmatriculacion, clausula_monto, clausula_forma_pago, clausula_pago_bancarizado, aclaracion_dice, aclaracion_debe_decir, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
                    [tramiteDetalleId, tramiteFinalId, empresaGestoraId, presentanteFormateado, formData.tipo_boleta, formData.numero_boleta, formData.fecha_boleta, formData.dua, formData.num_formato_inmatriculacion, parseFloat(formData.clausula_monto) || 0, formData.clausula_forma_pago, formData.clausula_pago_bancarizado, formData.aclaracion_dice, formData.aclaracion_debe_decir, now, now]);
            }

            setFormData(prev => ({
                ...prev,
                id: tramiteFinalId,
                presentante_persona: presentanteFormateado
            }));

            window.dispatchEvent(new Event("valeska_reload_tramites"));
            window.dispatchEvent(new CustomEvent("valeska_request_sync", {
                detail: { title: formData.id ? "Trámite Actualizado" : "Nuevo Trámite Registrado", details: `Trámite ${formData.codigo_verificacion} - ${formData.cliente}` }
            }));

            return true;
        } catch (error: any) {
            console.error("Error al guardar en DB:", error);
            alert("Error interno al procesar el trámite: " + error.message);
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    return {
        formData, setFormData, handleChange, handleAutoCheck, saveTramite,
        isSaving, autofillFromPdf, isFilling,
        opcionesTipos, opcionesSituacion, plantillas, loadCatalogos,
        empresaResultados, showEmpresaDropdown, setShowEmpresaDropdown, seleccionarEmpresa
    };
}