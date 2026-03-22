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
        if (pdfData) setFormData(prev => ({ ...prev, ...pdfData }));
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

            if (formData.id) {
                const tramRes: any[] = await sqlite.select("SELECT cliente_id, vehiculo_id FROM tramites WHERE id = $1", [formData.id]);
                const { cliente_id, vehiculo_id } = tramRes[0];

                await sqlite.execute(`UPDATE clientes SET tipo_documento = $1, numero_documento = $2, razon_social_nombres = $3, telefono = $4, updated_at = $5 WHERE id = $6`,
                    [formData.dni.length === 11 ? "RUC" : "DNI", formData.dni, formData.cliente, formData.telefono, now, cliente_id]);
                await sqlite.execute(`UPDATE vehiculos SET chasis_vin = $1, placa = $2, motor = $3, marca = $4, modelo = $5, color = $6, anio_fabricacion = $7, updated_at = $8 WHERE id = $9`,
                    [formData.vehiculo_chasis, formData.vehiculo_placa, formData.vehiculo_motor, formData.vehiculo_marca, formData.vehiculo_modelo, formData.vehiculo_color, formData.vehiculo_anio, now, vehiculo_id]);
                await sqlite.execute(`UPDATE tramites SET n_titulo = $1, fecha_presentacion = $2, observaciones_generales = $3, entrego_tarjeta = $4, fecha_entrega_tarjeta = $5, entrego_placa = $6, fecha_entrega_placa = $7, tipo_tramite_id = $8, situacion_id = $9, updated_at = $10 WHERE id = $11`,
                    [formData.n_titulo, formData.fecha_presentacion, formData.observaciones, formData.check_entrega_tarjeta ? 1 : 0, formData.fecha_entrega_tarjeta, formData.check_entrega_placa ? 1 : 0, formData.fecha_entrega_placa, tipoTramiteId, situacionId, now, formData.id]);
                await sqlite.execute(`UPDATE tramite_detalles SET presentante_persona = $1, tipo_boleta = $2, numero_boleta = $3, fecha_boleta = $4, dua = $5, num_formato_inmatriculacion = $6, clausula_monto = $7, clausula_forma_pago = $8, clausula_pago_bancarizado = $9, aclaracion_dice = $10, aclaracion_debe_decir = $11, updated_at = $12 WHERE tramite_id = $13`,
                    [formData.presentante_persona, formData.tipo_boleta, formData.numero_boleta, formData.fecha_boleta, formData.dua, formData.num_formato_inmatriculacion, parseFloat(formData.clausula_monto) || 0, formData.clausula_forma_pago, formData.clausula_pago_bancarizado, formData.aclaracion_dice, formData.aclaracion_debe_decir, now, formData.id]);
            } else {
                const clienteId = crypto.randomUUID();
                const vehiculoId = crypto.randomUUID();
                const tramiteId = crypto.randomUUID();
                const tramiteDetalleId = crypto.randomUUID();

                await sqlite.execute(`INSERT INTO clientes (id, tipo_documento, numero_documento, razon_social_nombres, telefono, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [clienteId, formData.dni.length === 11 ? "RUC" : "DNI", formData.dni, formData.cliente, formData.telefono, now, now]);
                await sqlite.execute(`INSERT INTO vehiculos (id, chasis_vin, placa, motor, marca, modelo, color, anio_fabricacion, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                    [vehiculoId, formData.vehiculo_chasis, formData.vehiculo_placa, formData.vehiculo_motor, formData.vehiculo_marca, formData.vehiculo_modelo, formData.vehiculo_color, formData.vehiculo_anio, now, now]);
                await sqlite.execute(`INSERT INTO tramites (id, codigo_verificacion, tramite_anio, cliente_id, vehiculo_id, tipo_tramite_id, situacion_id, usuario_creador_id, sucursal_id, n_titulo, fecha_presentacion, observaciones_generales, entrego_tarjeta, fecha_entrega_tarjeta, entrego_placa, fecha_entrega_placa, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
                    [tramiteId, formData.codigo_verificacion, formData.tramite_anio, clienteId, vehiculoId, tipoTramiteId, situacionId, session.id, sucursalId, formData.n_titulo, formData.fecha_presentacion, formData.observaciones, formData.check_entrega_tarjeta ? 1 : 0, formData.fecha_entrega_tarjeta, formData.check_entrega_placa ? 1 : 0, formData.fecha_entrega_placa, now, now]);
                await sqlite.execute(`INSERT INTO tramite_detalles (id, tramite_id, presentante_persona, tipo_boleta, numero_boleta, fecha_boleta, dua, num_formato_inmatriculacion, clausula_monto, clausula_forma_pago, clausula_pago_bancarizado, aclaracion_dice, aclaracion_debe_decir, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
                    [tramiteDetalleId, tramiteId, formData.presentante_persona, formData.tipo_boleta, formData.numero_boleta, formData.fecha_boleta, formData.dua, formData.num_formato_inmatriculacion, parseFloat(formData.clausula_monto) || 0, formData.clausula_forma_pago, formData.clausula_pago_bancarizado, formData.aclaracion_dice, formData.aclaracion_debe_decir, now, now]);

                // Si es creación, asignamos el ID recién creado al estado para que la impresión funcione sin recargar
                setFormData(prev => ({ ...prev, id: tramiteId }));
            }

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
        opcionesTipos, opcionesSituacion, plantillas, loadCatalogos
    };
}