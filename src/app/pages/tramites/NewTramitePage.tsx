import React from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  Save,
  User,
  Car,
  ClipboardList,
  CheckSquare,
  FileText,
  Globe,
  ExternalLink,
  Printer,
  FileCheck,
  FileCode,
  Search,
} from "lucide-react";

export function NewTramitePage() {
  const navigate = useNavigate();

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-500">
      {/* HEADER PRINCIPAL */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/tramites")}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
          >
            <ArrowLeft className="w-5 h-5" />
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

      {/* CUERPO DEL FORMULARIO - DOS COLUMNAS ESTILO PYTHON */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* COLUMNA IZQUIERDA: TRÁMITE, PROPIETARIO Y CHECKLIST */}
        <div className="space-y-6">
          {/* DATOS DEL TRÁMITE Y PROPIETARIO */}
          <section className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center gap-2 text-blue-600 font-bold text-[10px] uppercase tracking-widest">
              <User className="w-4 h-4" /> Datos del Trámite y Propietario
            </div>
            <div className="p-5 space-y-4">
              <FormField
                label="Cliente / Razón Social"
                placeholder="Nombre completo del titular"
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField label="DNI / RUC" placeholder="8 o 11 dígitos" />
                <SelectField
                  label="Tipo de Trámite"
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
                />
                <FormField
                  label="N° Formato Inmatriculación"
                  placeholder="Código de formato"
                />
              </div>
              <SelectField
                label="Situación Actual"
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

          {/* CHECKLIST DE ENTREGAS */}
          <section className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center gap-2 text-blue-600 font-bold text-[10px] uppercase tracking-widest">
              <CheckSquare className="w-4 h-4" /> Checklist de Entregas
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-blue-600 transition-colors">
                    Se entregó Recibo de Tarjeta
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
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
                  className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                />
              </div>
            </div>
          </section>

          {/* OBSERVACIONES INTERNAS */}
          <section className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center gap-2 text-blue-600 font-bold text-[10px] uppercase tracking-widest">
              <FileText className="w-4 h-4" /> Observaciones Internas
            </div>
            <div className="p-5">
              <textarea
                className="w-full p-3 border border-gray-200 rounded-lg text-sm min-h-[120px] focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                placeholder="Notas adicionales sobre el expediente..."
              />
            </div>
          </section>
        </div>

        {/* COLUMNA DERECHA: VEHÍCULO Y EMPRESA */}
        <div className="space-y-6">
          {/* DATOS DEL VEHÍCULO */}
          <section className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center gap-2 text-blue-600 font-bold text-[10px] uppercase tracking-widest">
              <Car className="w-4 h-4" /> Datos del Vehículo
            </div>
            <div className="p-5 space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <FormField
                    label="DUA / D.A.M"
                    placeholder="Ej. 118-2024-10-..."
                  />
                </div>
                <div className="flex items-end">
                  <button className="h-10 px-4 bg-orange-600 text-white text-xs font-bold rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2 shadow-sm">
                    <FileCode className="w-4 h-4" /> Autocompletar con PDF
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="VIN / Serie" placeholder="17 caracteres" />
                <FormField label="N° Motor" placeholder="Código de motor" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  label="Placa Actual"
                  placeholder="ABC-123 o EN TRAMITE"
                />
                <FormField label="Marca" placeholder="Ej. BAJAJ" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Modelo" placeholder="Ej. RE 205" />
                <FormField
                  label="Año Fabricación/Modelo"
                  placeholder="2024 / 2025"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Color" placeholder="Rojo, Azul, Negro..." />
                <FormField
                  label="Carrocería"
                  placeholder="Ej. Trimovil Pasajeros"
                />
              </div>
            </div>
          </section>

          {/* EMPRESA QUE GESTIONA */}
          <section className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center gap-2 text-blue-600 font-bold text-[10px] uppercase tracking-widest">
              <Globe className="w-4 h-4" /> Empresa que Gestiona
            </div>
            <div className="p-5">
              <SelectField
                label="Empresa"
                options={[
                  "MOTOS DANY",
                  "CROSLAND",
                  "MULTISERVICIOS VALESKA",
                  "SUCURSAL NORTE",
                ]}
              />
            </div>
          </section>

          {/* DOCUMENTOS Y ENLACES (ACCIONES RÁPIDAS) */}
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
              <ActionButton
                icon={<FileText className="w-3.5 h-3.5" />}
                label="P. Medina"
              />
              <ActionButton
                icon={<FileText className="w-3.5 h-3.5" />}
                label="P. Pantigoso"
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// --- COMPONENTES AUXILIARES LOCALES ---

function FormField({
  label,
  placeholder,
}: {
  label: string;
  placeholder: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block ml-1">
        {label}
      </label>
      <input
        type="text"
        placeholder={placeholder}
        className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white shadow-sm hover:border-gray-300 transition-all placeholder:text-gray-300"
      />
    </div>
  );
}

function SelectField({ label, options }: { label: string; options: string[] }) {
  return (
    <div className="space-y-1 text-left">
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block ml-1">
        {label}
      </label>
      <select className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white shadow-sm cursor-pointer hover:border-gray-300 transition-all">
        {options.map((opt) => (
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
    <button className="flex items-center justify-center gap-2 h-10 px-3 border border-gray-200 rounded-lg text-[11px] font-bold text-gray-600 bg-white hover:bg-gray-50 hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm">
      {icon}
      {label}
    </button>
  );
}
