import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
// Importaciones de lógica (Asegúrate de que estas rutas existan en tu proyecto real)
import { handlePdfAutofillAction } from "../../logic/tramites/pdfActions";
import { open as openExternalLink } from "@tauri-apps/plugin-shell";
import {
  ArrowLeft,
  RefreshCcw,
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

// --- MOTORES DE GENERACIÓN PDF ---
import { generateLegacyForm } from "../../logic/pdf/formGeneratorPdf";
import { generateClausulaPdf } from "../../logic/pdf/clausulaGeneratorPdf";
import { generateMedinaPdf } from "../../logic/pdf/medinaGeneratorPdf";
import { generatePantigosoPdf } from "../../logic/pdf/pantigosoGeneratorPdf";

// --- MOCK DE DATOS (Simulando base de datos) ---
const MOCK_TRAMITES = [
  {
    id: "1",
    codigo: "TRM-2025-001",
    cliente: "Juan Pérez García",
    documento: "45789632",
    tipo: "Inmatriculación",
    situacion: "En calificación",
    fecha: "2024-05-20",
    empresa: "MULTISERVICIOS VALESKA",
  },
  {
    id: "2",
    codigo: "TRM-2025-002",
    cliente: "Inversiones SAC",
    documento: "20601234567",
    tipo: "Transferencia Notarial",
    situacion: "Inscrito",
    fecha: "2024-05-21",
    empresa: "MULTISERVICIOS VALESKA",
  },
];

export function EditTramitePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);

  // --- ESTADO UNIFICADO (Idéntico a NewTramite) ---
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

  // --- LÓGICA DE CARGA: Buscamos por ID en el Mock ---
  useEffect(() => {
    const tramiteEncontrado = MOCK_TRAMITES.find((t) => t.id === id);
    if (tramiteEncontrado) {
      setFormData((prev) => ({
        ...prev,
        cliente: tramiteEncontrado.cliente,
        dni: tramiteEncontrado.documento,
        tipo_tramite: tramiteEncontrado.tipo,
        n_titulo: tramiteEncontrado.codigo,
        situacion: tramiteEncontrado.situacion,
        empresa: tramiteEncontrado.empresa,
      }));
    }
  }, [id]);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleOpenLink = async (url: string) => {
    try {
      if (openExternalLink) {
        await openExternalLink(url);
      } else {
        window.open(url, "_blank");
      }
    } catch (error) {
      console.error("Error al abrir navegador:", error);
      window.open(url, "_blank");
    }
  };

  const onAutofill = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const data = await handlePdfAutofillAction();
      if (data) {
        setFormData((prev) => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error("Error al procesar PDF:", error);
    } finally {
      setTimeout(() => setLoading(false), 200);
    }
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-500">
      {/* HEADER PRINCIPAL: Limpio y profesional */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/tramites")}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">
              Editar Tramite
            </h2>
            <p className="text-xs text-amber-600 font-semibold uppercase tracking-widest">
              Actualización de Tramite
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/tramites")}
            className="px-4 py-2 text-gray-500 font-medium hover:text-gray-800 transition-colors text-sm"
          >
            Descartar
          </button>
          <button className="bg-amber-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-md hover:bg-amber-600 active:scale-95 text-sm transition-all">
            <RefreshCcw className="w-4 h-4" /> Actualizar Datos
          </button>
        </div>
      </div>

      {/* CUERPO DEL FORMULARIO: Adaptado totalmente al diseño de Nuevo Trámite */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* COLUMNA IZQUIERDA: TRÁMITE, PROPIETARIO Y CHECKLIST */}
        <div className="space-y-6">
          <section className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-amber-50 px-4 py-2.5 border-b border-amber-100 flex items-center gap-2 text-amber-600 font-bold text-[10px] uppercase tracking-widest">
              <User className="w-4 h-4" /> Datos del Trámite y Propietario
            </div>
            <div className="p-5 space-y-4">
              <FormField
                label="Cliente / Razón Social"
                placeholder="Nombre completo del titular"
                value={formData.cliente}
                onChange={(v: string) => handleChange("cliente", v)}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  label="DNI / RUC"
                  placeholder="8 o 11 dígitos"
                  value={formData.dni}
                  onChange={(v: string) => handleChange("dni", v)}
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
                  onChange={(v: string) => handleChange("n_titulo", v)}
                />
                <FormField
                  label="N° Formato Inmatriculación"
                  placeholder="Código de formato"
                  value={formData.n_formato}
                  onChange={(v: string) => handleChange("n_formato", v)}
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
                  className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white shadow-sm"
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
                className="w-full p-3 border border-gray-200 rounded-lg text-sm min-h-[120px] focus:ring-2 focus:ring-blue-500 outline-none bg-white shadow-sm"
                placeholder="Notas adicionales sobre el expediente..."
              />
            </div>
          </section>
        </div>

        {/* COLUMNA DERECHA: VEHÍCULO, EMPRESA Y DOCUMENTOS */}
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
                    onChange={(v: string) => handleChange("dua", v)}
                  />
                </div>
                <button
                  type="button"
                  onClick={onAutofill}
                  disabled={loading}
                  className="h-10 px-4 bg-orange-600 text-white text-xs font-bold rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2 shadow-sm disabled:bg-gray-400 active:scale-95"
                >
                  {loading ? (
                    <Loader2 className="animate-spin w-4 h-4" />
                  ) : (
                    <FileCode className="w-4 h-4" />
                  )}
                  <span>{loading ? "Cargando..." : "Autocompletar PDF"}</span>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  label="VIN / Serie"
                  placeholder="17 carac."
                  value={formData.vin}
                  onChange={(v: string) => handleChange("vin", v)}
                />
                <FormField
                  label="N° Motor"
                  placeholder="Motor"
                  value={formData.motor}
                  onChange={(v: string) => handleChange("motor", v)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  label="Placa"
                  placeholder="ABC-123"
                  value={formData.placa}
                  onChange={(v: string) => handleChange("placa", v)}
                />
                <FormField
                  label="Marca"
                  placeholder="BAJAJ"
                  value={formData.marca}
                  onChange={(v: string) => handleChange("marca", v)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  label="Modelo"
                  placeholder="Modelo"
                  value={formData.modelo}
                  onChange={(v: string) => handleChange("modelo", v)}
                />
                <FormField
                  label="Año"
                  placeholder="2024"
                  value={formData.anio}
                  onChange={(v: string) => handleChange("anio", v)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  label="Color"
                  placeholder="Rojo"
                  value={formData.color}
                  onChange={(v: string) => handleChange("color", v)}
                />
                <FormField
                  label="Carrocería"
                  placeholder="Motocicleta"
                  value={formData.carroceria}
                  onChange={(v: string) => handleChange("carroceria", v)}
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
              <ExternalLink className="w-4 h-4" /> Enlaces de Consulta
            </div>
            <div className="p-5 grid grid-cols-2 gap-3">
              <ActionButton
                icon={<Globe className="w-3.5 h-3.5" />}
                label="Abrir SUNARP"
                onClick={() =>
                  handleOpenLink(
                    "https://enlinea.sunarp.gob.pe/sunarpweb/pages/acceso/frmTitulos.faces",
                  )
                }
              />
              <ActionButton
                icon={<Globe className="w-3.5 h-3.5" />}
                label="Web AAP Placas"
                onClick={() => handleOpenLink("https://placas.pe/#/home")}
              />
            </div>
          </section>

          <section className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center gap-2 text-blue-600 font-bold text-[10px] uppercase tracking-widest">
              <Printer className="w-4 h-4" /> Documentos e Impresión
            </div>
            <div className="p-5 grid grid-cols-2 gap-3">
              <ActionButton
                icon={<Printer className="w-3.5 h-3.5" />}
                label="Formulario"
                onClick={() => generateLegacyForm()}
              />
              <ActionButton
                icon={<FileCheck className="w-3.5 h-3.5" />}
                label="Cláusula Cancelación"
                onClick={() => generateClausulaPdf(formData)}
              />
              <ActionButton
                icon={<FileText className="w-3.5 h-3.5" />}
                label="P. Medina"
                onClick={() => generateMedinaPdf(formData)}
              />
              <ActionButton
                icon={<FileText className="w-3.5 h-3.5" />}
                label="P. Pantigoso"
                onClick={() => generatePantigosoPdf(formData)}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// --- COMPONENTES AUXILIARES TIPADOS ---

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
        className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white shadow-sm transition-all hover:border-gray-300"
      />
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: string[];
}

function SelectField({ label, value, onChange, options }: SelectFieldProps) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block ml-1">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white shadow-sm cursor-pointer hover:border-gray-300"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}

function ActionButton({ icon, label, onClick }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center gap-2 h-10 px-3 border border-gray-200 rounded-lg text-[10px] font-bold text-gray-600 bg-white hover:bg-gray-50 hover:text-blue-600 transition-all shadow-sm uppercase tracking-tighter active:scale-95"
    >
      {icon} {label}
    </button>
  );
}
