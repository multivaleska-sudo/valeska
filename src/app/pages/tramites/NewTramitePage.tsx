import React, { useState } from "react";
import { useNavigate } from "react-router";
import { handlePdfAutofillAction } from "../../logic/tramites/pdfActions";
import {
  ArrowLeft,
  Save,
  User,
  Car,
  CheckSquare,
  FileText,
  Globe,
  ExternalLink,
  Printer,
  FileCheck,
  FileCode,
  Loader2,
} from "lucide-react";

export function NewTramitePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // --- ESTADO UNIFICADO DEL FORMULARIO ---
  const [formData, setFormData] = useState({
    cliente: "",
    dni: "",
    tipo_tramite: "Inmatriculación",
    n_titulo: "",
    n_formato: "",
    situacion: "En calificación",
    check_recibo: false,
    check_dni: false,
    fecha_entrega: "",
    observaciones: "",
    dua: "",
    vin: "",
    motor: "",
    placa: "",
    marca: "",
    modelo: "",
    anio: "",
    color: "",
    carroceria: "MOTOCICLETA",
    empresa: "MULTISERVICIOS VALESKA",
  });

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // --- LÓGICA DE AUTOCOMPLETADO (MEJORADA) ---
  const onAutofill = async () => {
    console.log("Iniciando autocompletado..."); // Depuración: Verifica si el botón reacciona
    if (loading) return;

    setLoading(true);
    try {
      const data = await handlePdfAutofillAction();
      console.log("Datos recibidos de la lógica:", data);
      if (data) {
        setFormData((prev) => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error("Error crítico al procesar PDF:", error);
    } finally {
      // Pequeño delay para que React termine su ciclo antes de quitar el spinner
      setTimeout(() => setLoading(false), 200);
    }
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-500">
      {/* HEADER PRINCIPAL */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/tramites")}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-50"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">
              Nuevo Expediente
            </h2>
            <p className="text-xs text-blue-600 font-semibold uppercase tracking-widest">
              Ingreso de datos maestros
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/tramites")}
            className="px-4 py-2 text-gray-500 font-medium hover:text-gray-800 transition-colors text-sm"
          >
            Cancelar
          </button>
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-md hover:bg-blue-700 transition-all active:scale-95 text-sm">
            <Save className="w-4 h-4" /> Guardar Trámite
          </button>
        </div>
      </div>

      {/* CUERPO DEL FORMULARIO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* COLUMNA IZQUIERDA: TRÁMITE, PROPIETARIO Y CHECKLIST */}
        <div className="space-y-6">
          <section className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center gap-2 text-blue-600 font-bold text-[10px] uppercase tracking-widest">
              <User className="w-4 h-4" /> Datos del Trámite y Propietario
            </div>
            <div className="p-5 space-y-4">
              <FormField
                label="Cliente / Razón Social"
                placeholder="Nombre completo del titular"
                value={formData.cliente}
                onChange={(v) => handleChange("cliente", v)}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  label="DNI / RUC"
                  placeholder="8 o 11 dígitos"
                  value={formData.dni}
                  onChange={(v) => handleChange("dni", v)}
                />
                <SelectField
                  label="Tipo de Trámite"
                  value={formData.tipo_tramite}
                  onChange={(v: string) => handleChange("tipo_tramite", v)}
                  options={[
                    "Inmatriculación",
                    "Transferencia Notarial",
                    "Duplicado de Placa",
                    "Cambio de Características",
                  ]}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  label="N° Título (SUNARP)"
                  placeholder="2024-XXXXXX"
                  value={formData.n_titulo}
                  onChange={(v) => handleChange("n_titulo", v)}
                />
                <FormField
                  label="N° Formato Inmatriculación"
                  placeholder="Código de formato"
                  value={formData.n_formato}
                  onChange={(v) => handleChange("n_formato", v)}
                />
              </div>
              <SelectField
                label="Situación Actual"
                value={formData.situacion}
                onChange={(v: string) => handleChange("situacion", v)}
                options={[
                  "En calificación",
                  "Inscrito",
                  "Observado",
                  "Tachado",
                  "Concluido",
                ]}
              />
            </div>
          </section>

          <section className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center gap-2 text-blue-600 font-bold text-[10px] uppercase tracking-widest">
              <CheckSquare className="w-4 h-4" /> Checklist de Entregas
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={formData.check_recibo}
                    onChange={(e) =>
                      handleChange("check_recibo", e.target.checked)
                    }
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-blue-600 transition-colors">
                    Se entregó Recibo de Tarjeta
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={formData.check_dni}
                    onChange={(e) =>
                      handleChange("check_dni", e.target.checked)
                    }
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-blue-600 transition-colors">
                    Se entregó DNI para Tarjeta
                  </span>
                </label>
              </div>
              <div className="w-1/2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Fecha de Entrega
                </label>
                <input
                  type="date"
                  value={formData.fecha_entrega}
                  onChange={(e) =>
                    handleChange("fecha_entrega", e.target.value)
                  }
                  className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                />
              </div>
            </div>
          </section>

          <section className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center gap-2 text-blue-600 font-bold text-[10px] uppercase tracking-widest">
              <FileText className="w-4 h-4" /> Observaciones Internas
            </div>
            <div className="p-5">
              <textarea
                value={formData.observaciones}
                onChange={(e) => handleChange("observaciones", e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg text-sm min-h-[120px] focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                placeholder="Notas adicionales sobre el expediente..."
              />
            </div>
          </section>
        </div>

        {/* COLUMNA DERECHA: VEHÍCULO Y EMPRESA */}
        <div className="space-y-6">
          <section className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center gap-2 text-blue-600 font-bold text-[10px] uppercase tracking-widest">
              <Car className="w-4 h-4" /> Datos del Vehículo
            </div>
            <div className="p-5 space-y-4">
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <FormField
                    label="DUA / D.A.M"
                    placeholder="Ej. 118-2024-10-..."
                    value={formData.dua}
                    onChange={(v) => handleChange("dua", v)}
                  />
                </div>
                <button
                  type="button"
                  onClick={onAutofill}
                  disabled={loading}
                  className="h-10 px-4 bg-orange-600 text-white text-xs font-bold rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2 shadow-sm disabled:bg-gray-400 active:scale-95"
                >
                  <span
                    key={loading ? "loading" : "idle"}
                    className="w-4 h-4 flex items-center justify-center"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <FileCode />
                    )}
                  </span>
                  {loading ? "Cargando..." : "Autocompletar con PDF"}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  label="VIN / Serie"
                  placeholder="17 caracteres"
                  value={formData.vin}
                  onChange={(v) => handleChange("vin", v)}
                />
                <FormField
                  label="N° Motor"
                  placeholder="Código de motor"
                  value={formData.motor}
                  onChange={(v) => handleChange("motor", v)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  label="Placa"
                  placeholder="ABC-123"
                  value={formData.placa}
                  onChange={(v) => handleChange("placa", v)}
                />
                <FormField
                  label="Marca"
                  placeholder="Ej. BAJAJ"
                  value={formData.marca}
                  onChange={(v) => handleChange("marca", v)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  label="Modelo"
                  placeholder="Ej. RE 205"
                  value={formData.modelo}
                  onChange={(v) => handleChange("modelo", v)}
                />
                <FormField
                  label="Año"
                  placeholder="2024"
                  value={formData.anio}
                  onChange={(v) => handleChange("anio", v)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  label="Color"
                  placeholder="Rojo, Azul, Negro..."
                  value={formData.color}
                  onChange={(v) => handleChange("color", v)}
                />
                <FormField
                  label="Carrocería"
                  placeholder="Ej. Trimovil Pasajeros"
                  value={formData.carroceria}
                  onChange={(v) => handleChange("carroceria", v)}
                />
              </div>
            </div>
          </section>

          <section className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center gap-2 text-blue-600 font-bold text-[10px] uppercase tracking-widest">
              <Globe className="w-4 h-4" /> Empresa que Gestiona
            </div>
            <div className="p-5">
              <SelectField
                label="Empresa"
                value={formData.empresa}
                onChange={(v: string) => handleChange("empresa", v)}
                options={[
                  "MOTOS DANY",
                  "CROSLAND",
                  "MULTISERVICIOS VALESKA",
                  "SUCURSAL NORTE",
                ]}
              />
            </div>
          </section>

          <section className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center gap-2 text-blue-600 font-bold text-[10px] uppercase tracking-widest">
              <ExternalLink className="w-4 h-4" /> Documentos y Enlaces
            </div>
            <div className="p-5 grid grid-cols-2 gap-3">
              <ActionButton
                icon={<Globe className="w-3.5 h-3.5" />}
                label="Abrir SUNARP"
              />
              <ActionButton
                icon={<Globe className="w-3.5 h-3.5" />}
                label="Web AAP Placas"
              />
              <ActionButton
                icon={<Printer className="w-3.5 h-3.5" />}
                label="Formulario"
              />
              <ActionButton
                icon={<FileCheck className="w-3.5 h-3.5" />}
                label="Cláusula Cancelación"
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// --- COMPONENTES AUXILIARES ---
interface FormFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
}

function FormField({ label, value, onChange, placeholder }: FormFieldProps) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block ml-1">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white shadow-sm transition-all"
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: any) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block ml-1">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white shadow-sm cursor-pointer"
      >
        {options.map((opt: string) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

function ActionButton({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button className="flex items-center justify-center gap-2 h-10 px-3 border border-gray-200 rounded-lg text-[10px] font-bold text-gray-600 bg-white hover:bg-gray-50 transition-all shadow-sm uppercase tracking-tighter">
      {icon} {label}
    </button>
  );
}
