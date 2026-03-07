import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { open as openExternalLink } from "@tauri-apps/plugin-shell";
import {
  ArrowLeft,
  Copy,
  Check,
  User,
  Car,
  Edit,
  CheckSquare,
  FileText,
  Globe,
  Printer,
  FileCheck,
  ExternalLink,
} from "lucide-react";

// --- IMPORTACIÓN DE MOTORES PDF ---
import { generateLegacyForm } from "../../logic/pdf/formGeneratorPdf";
import { generateClausulaPdf } from "../../logic/pdf/clausulaGeneratorPdf";
import { generateMedinaPdf } from "../../logic/pdf/medinaGeneratorPdf";
import { generatePantigosoPdf } from "../../logic/pdf/pantigosoGeneratorPdf";

// --- MOCK DE DATOS (Simulando base de datos) ---
const MOCK_TRAMITES = [
  {
    id: "1",
    codigo: "TRM-2025-001",
    cliente: "JUAN PEREZ GARCIA",
    documento: "45789632",
    tipo: "Inmatriculación",
    situacion: "En calificación",
    n_formato: "6689693",
    dua: "118-2024-10-445872",
    vin: "LAACEKNE4R5890125",
    motor: "JP164FML24K110",
    placa: "3517-NX",
    marca: "BAJAJ",
    modelo: "PULSAR NS 200",
    anio: "2025",
    color: "NEGRO-GRIS",
    carroceria: "MOTOCICLETA",
    empresa: "MULTISERVICIOS VALESKA",
    check_recibo: true,
    check_dni: false,
    fecha_entrega: "2024-05-30",
    observaciones: "El cliente solicitó entrega urgente.",
  },
];

export function TramiteDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // --- ESTADO PARA LOS MOTORES DE PDF ---
  const [formData, setFormData] = useState<any>(null);

  // --- CARGA DE DATOS ---
  useEffect(() => {
    const tramite = MOCK_TRAMITES.find((t) => t.id === id);
    if (tramite) {
      setFormData({
        ...tramite,
        dni: tramite.documento, // Mapeo de nombre de campo
        tipo_tramite: tramite.tipo,
        n_titulo: tramite.codigo,
      });
    }
  }, [id]);

  const handleOpenLink = async (url: string) => {
    try {
      if (openExternalLink) await openExternalLink(url);
      else window.open(url, "_blank");
    } catch (error) {
      window.open(url, "_blank");
    }
  };

  if (!formData)
    return (
      <div className="p-20 text-center text-gray-500 font-bold">
        Cargando expediente...
      </div>
    );

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-500">
      {/* HEADER DE CONSULTA */}
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
              Expediente {formData.codigo}
            </h2>
            <p className="text-xs text-blue-600 font-semibold uppercase tracking-widest">
              Vista de Consulta / Solo Lectura
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate(`/tramites/${id}/edit`)}
          className="bg-white border border-gray-200 text-gray-700 px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-sm hover:bg-gray-50 active:scale-95 transition-all text-sm"
        >
          <Edit className="w-4 h-4 text-amber-500" /> Ir a Editar
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* COLUMNA IZQUIERDA */}
        <div className="space-y-6">
          <section className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center gap-2 text-blue-600 font-bold text-[10px] uppercase tracking-widest">
              <User className="w-4 h-4" /> Datos del Trámite y Propietario
            </div>
            <div className="p-5 space-y-4">
              <ReadOnlyField
                label="Cliente / Razón Social"
                value={formData.cliente}
              />
              <div className="grid grid-cols-2 gap-4">
                <ReadOnlyField label="DNI / RUC" value={formData.documento} />
                <ReadOnlyField label="Tipo de Trámite" value={formData.tipo} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <ReadOnlyField
                  label="N° Título (SUNARP)"
                  value={formData.codigo}
                />
                <ReadOnlyField
                  label="N° Formato Inmatriculación"
                  value={formData.n_formato}
                />
              </div>
              <ReadOnlyField
                label="Situación Actual"
                value={formData.situacion}
                isStatus
              />
            </div>
          </section>

          <section className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center gap-2 text-blue-600 font-bold text-[10px] uppercase tracking-widest">
              <CheckSquare className="w-4 h-4" /> Checklist de Entregas
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center ${formData.check_recibo ? "bg-green-500 border-green-600 text-white" : "bg-gray-100 border-gray-300"}`}
                  >
                    {formData.check_recibo && <Check className="w-3 h-3" />}
                  </div>
                  <span className="text-sm text-gray-700">
                    Recibo de Tarjeta
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center ${formData.check_dni ? "bg-green-500 border-green-600 text-white" : "bg-gray-100 border-gray-300"}`}
                  >
                    {formData.check_dni && <Check className="w-3 h-3" />}
                  </div>
                  <span className="text-sm text-gray-700">
                    DNI para Tarjeta
                  </span>
                </div>
              </div>
              <div className="w-1/2">
                <ReadOnlyField
                  label="Fecha de Entrega"
                  value={formData.fecha_entrega || "No definida"}
                />
              </div>
            </div>
          </section>

          <section className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center gap-2 text-blue-600 font-bold text-[10px] uppercase tracking-widest">
              <FileText className="w-4 h-4" /> Observaciones Internas
            </div>
            <div className="p-5 bg-gray-50/30 rounded-b-xl italic text-sm text-gray-600 min-h-[80px]">
              {formData.observaciones || "Sin observaciones registradas."}
            </div>
          </section>
        </div>

        {/* COLUMNA DERECHA */}
        <div className="space-y-6">
          <section className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center gap-2 text-blue-600 font-bold text-[10px] uppercase tracking-widest">
              <Car className="w-4 h-4" /> Datos del Vehículo
            </div>
            <div className="p-5 space-y-4">
              <ReadOnlyField label="DUA / D.A.M" value={formData.dua} mono />
              <div className="grid grid-cols-2 gap-4">
                <ReadOnlyField label="VIN / Serie" value={formData.vin} mono />
                <ReadOnlyField label="N° Motor" value={formData.motor} mono />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <ReadOnlyField label="Placa" value={formData.placa} mono />
                <ReadOnlyField label="Marca" value={formData.marca} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <ReadOnlyField label="Modelo" value={formData.modelo} />
                <ReadOnlyField label="Año" value={formData.anio} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <ReadOnlyField label="Color" value={formData.color} />
                <ReadOnlyField label="Carrocería" value={formData.carroceria} />
              </div>
            </div>
          </section>

          <section className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center gap-2 text-blue-600 font-bold text-[10px] uppercase tracking-widest">
              <Globe className="w-4 h-4" /> Empresa que Gestiona
            </div>
            <div className="p-5">
              <ReadOnlyField label="Empresa" value={formData.empresa} />
            </div>
          </section>

          {/* BOTONERA DE ACCIÓN Y EMISIÓN */}

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
            <div className="p-5 grid grid-cols-2 gap-3 bg-blue-50/20">
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

// --- COMPONENTES AUXILIARES ---

function ReadOnlyField({
  label,
  value,
  mono,
  isStatus,
}: {
  label: string;
  value: string;
  mono?: boolean;
  isStatus?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-tight">
        {label}
      </label>
      <div className="flex items-center h-10 px-3 bg-gray-50/50 border border-gray-100 rounded-lg group relative transition-all hover:border-blue-200">
        <span
          className={`text-sm font-bold text-gray-700 flex-1 truncate ${mono ? "font-mono" : ""} ${isStatus ? "text-blue-600" : ""}`}
        >
          {value || "---"}
        </span>
        <button
          onClick={copy}
          title="Copiar al portapapeles"
          className="p-1.5 hover:bg-blue-100 text-blue-600 rounded-md transition-all opacity-0 group-hover:opacity-100 active:scale-90"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-green-600" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center gap-2 h-10 px-3 border border-gray-200 rounded-lg text-[10px] font-bold text-gray-600 bg-white hover:bg-gray-50 hover:text-blue-600 transition-all shadow-sm uppercase tracking-tighter active:scale-95 overflow-hidden"
    >
      {icon} <span className="truncate">{label}</span>
    </button>
  );
}
