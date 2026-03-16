import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { TramiteFormData } from "../../types/tramites/tramite.types";
import { handlePdfAutofillAction } from "./pdfActions";

export function useTramiteLogic(initialData?: Partial<TramiteFormData>) {
    const [isSaving, setIsSaving] = useState(false);
    const [isFilling, setIsFilling] = useState(false);

    const [formData, setFormData] = useState<TramiteFormData>(() => {
        const today = new Date().toISOString().split('T')[0];
        const randomCode = Math.random().toString(36).substring(2, 10).toUpperCase();

        return {
            // Valores por defecto
            tramite_anio: new Date().getFullYear().toString(),
            cliente: "",
            telefono: "",
            dni: "",
            n_titulo: "",
            tipo_tramite: "Primera Inscripción Vehicular",
            estado_tramite: "En calificación",
            observaciones: "",
            fecha_presentacion: today,
            check_entrega_tarjeta: false,
            fecha_entrega_tarjeta: "",
            check_entrega_placa: false,
            fecha_entrega_placa: "",
            codigo_verificacion: randomCode,

            // Vehículo
            vehiculo_marca: "",
            vehiculo_motor: "",
            vehiculo_chasis: "",
            vehiculo_anio: "",
            vehiculo_color: "",
            vehiculo_placa: "",
            vehiculo_modelo: "",

            // Presentante
            presentante_empresa: "",
            presentante_persona: "",
            tipo_boleta: "Electrónica",
            numero_boleta: "",
            fecha_boleta: today,
            dua: "",
            num_formato_inmatriculacion: "",

            // Clausula
            clausula_monto: "",
            clausula_forma_pago: "",
            clausula_pago_bancarizado: "",
            aclaracion_dice: "",
            aclaracion_debe_decir: "",

            // Impresión
            fecha_impresion: today,

            // Si hay initialData, sobreescribe los valores (ej. al editar)
            ...(initialData || {})
        } as TramiteFormData;
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleAutoCheck = (field: 'check_entrega_tarjeta' | 'check_entrega_placa') => {
        const todayStr = new Date().toISOString().split('T')[0];

        setFormData(prev => {
            const isChecked = !prev[field];
            let newData = { ...prev, [field]: isChecked };

            if (field === 'check_entrega_tarjeta') {
                newData.fecha_entrega_tarjeta = isChecked ? todayStr : "";
            }
            if (field === 'check_entrega_placa') {
                newData.fecha_entrega_placa = isChecked ? todayStr : "";
            }

            return newData;
        });
    };

    // Función para autocompletar con el PDF
    const autofillFromPdf = async () => {
        setIsFilling(true);
        const pdfData = await handlePdfAutofillAction();
        if (pdfData) {
            setFormData(prev => ({ ...prev, ...pdfData }));
        }
        setIsFilling(false);
    };

    const saveTramite = async () => {
        setIsSaving(true);
        try {
            const command = formData.id ? "update_tramite" : "create_tramite";
            await invoke(command, { payload: formData });
            return true;
        } catch (error) {
            console.error("Error al guardar en DB:", error);
            alert("Error al guardar el trámite: " + error);
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    return { formData, setFormData, handleChange, handleAutoCheck, saveTramite, isSaving, autofillFromPdf, isFilling };
}