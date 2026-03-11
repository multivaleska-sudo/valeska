import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { open as openExternalLink } from "@tauri-apps/plugin-shell";
import {
  ArrowLeft,
  User,
  Car,
  Edit,
  CheckSquare,
  FileText,
  Globe,
  Printer,
  FileCheck,
  ExternalLink,
  Building2,
  Hash,
  Fingerprint,
  Calendar,
  Check,
  FileCode,
} from "lucide-react";
import { CopiableField } from "../../components/shared/CopiableField";
import { ActionButton } from "../../components/shared/ActionButton";
import { TramiteData } from "../../types/tramites/tramite.types";
import { generateLegacyForm } from "../../logic/pdf/formGeneratorPdf";
import { generateClausulaPdf } from "../../logic/pdf/clausulaGeneratorPdf";
import { generateMedinaPdf } from "../../logic/pdf/medinaGeneratorPdf";
import { generatePantigosoPdf } from "../../logic/pdf/pantigosoGeneratorPdf";

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
  const [formData, setFormData] = useState<TramiteData | null>(null);

  useEffect(() => {
    const tramite = MOCK_TRAMITES.find((t) => t.id === id);
    if (tramite) {
      setFormData({
        ...tramite,
        dni: tramite.documento,
        tipo_tramite: tramite.tipo,
        n_titulo: tramite.codigo,
        carroceria: tramite.carroceria || "MOTOCICLETA",
      } as TramiteData);
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
      <div className="p-20 text-center text-gray-500 font-black uppercase tracking-widest animate-pulse">
        Consultando Expediente...
      </div>
    );

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-500">
      {/* HEADER DE CONSULTA */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/tramites")}
            className="p-2 hover:bg-gray-100 rounded-full transition-all text-gray-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-black text-gray-900 tracking-tighter uppercase leading-none">
              Expediente {formData.n_titulo}
            </h2>
            <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mt-1">
              Visualización de Seguridad / Solo Lectura
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate(`/tramites/${id}/edit`)}
          className="bg-amber-50 text-amber-700 border border-amber-200 px-6 py-2.5 rounded-xl font-black flex items-center gap-2 shadow-sm hover:bg-amber-500 hover:text-white active:scale-95 transition-all text-[11px] uppercase tracking-widest"
        >
          <Edit size={14} /> Modificar Datos
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* COLUMNA IZQUIERDA: TRÁMITE Y PROPIETARIO */}
        <div className="space-y-6">
          <section className="bg-white border border-gray-200 rounded-[2rem] overflow-hidden shadow-sm">
            <div className="bg-blue-50/50 px-5 py-3 border-b border-blue-100 flex items-center gap-2 text-blue-800 font-black text-[10px] uppercase tracking-[0.2em]">
              <User size={14} /> Información del Titular
            </div>
            <div className="p-6 space-y-5">
              <CopiableField
                label="Cliente / Razón Social"
                value={formData.cliente}
                readOnly
                icon={<User size={16} />}
              />
              <div className="grid grid-cols-2 gap-4">
                <CopiableField
                  label="Identificación (DNI/RUC)"
                  value={formData.dni}
                  readOnly
                  mono
                  icon={<Fingerprint size={16} />}
                />
                <CopiableField
                  label="Tipo de Proceso"
                  value={formData.tipo_tramite}
                  readOnly
                  icon={<FileText size={16} />}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <CopiableField
                  label="Código Título (SUNARP)"
                  value={formData.n_titulo}
                  readOnly
                  mono
                  icon={<Hash size={16} />}
                />
                <CopiableField
                  label="Situación del Trámite"
                  value={formData.situacion}
                  readOnly
                  icon={<div className="w-2 h-2 rounded-full bg-blue-500" />}
                />
              </div>
            </div>
          </section>

          <section className="bg-white border border-gray-200 rounded-[2rem] overflow-hidden shadow-sm">
            <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex items-center gap-2 text-gray-500 font-black text-[10px] uppercase tracking-[0.2em]">
              <CheckSquare size={14} /> Estado de Entrega
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-10">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${formData.check_recibo ? "bg-green-600 text-white shadow-lg shadow-green-100" : "bg-gray-100 text-gray-300"}`}
                  >
                    <Check size={14} strokeWidth={4} />
                  </div>
                  <span
                    className={`text-xs font-black uppercase tracking-tight ${formData.check_recibo ? "text-gray-800" : "text-gray-400"}`}
                  >
                    Recibo de Tarjeta
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${formData.check_dni ? "bg-green-600 text-white shadow-lg shadow-green-100" : "bg-gray-100 text-gray-300"}`}
                  >
                    <Check size={14} strokeWidth={4} />
                  </div>
                  <span
                    className={`text-xs font-black uppercase tracking-tight ${formData.check_dni ? "text-gray-800" : "text-gray-400"}`}
                  >
                    DNI para Tarjeta
                  </span>
                </div>
              </div>
              <div className="w-1/2">
                <CopiableField
                  label="Fecha Programada"
                  value={formData.fecha_entrega || "PENDIENTE"}
                  readOnly
                  icon={<Calendar size={16} />}
                />
              </div>
            </div>
          </section>

          <section className="bg-white border border-gray-200 rounded-[2rem] overflow-hidden shadow-sm">
            <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex items-center gap-2 text-gray-400 font-black text-[10px] uppercase tracking-[0.2em]">
              <FileText size={14} /> Glosa de Observaciones
            </div>
            <div className="p-6 min-h-[100px] bg-gray-50/30">
              <p className="text-sm font-medium text-gray-600 italic leading-relaxed">
                {formData.observaciones ||
                  "No se han registrado notas adicionales para este expediente."}
              </p>
            </div>
          </section>
        </div>

        {/* COLUMNA DERECHA: VEHÍCULO Y ACCIONES */}
        <div className="space-y-6">
          <section className="bg-white border border-gray-200 rounded-[2rem] overflow-hidden shadow-sm">
            <div className="bg-emerald-50/50 px-5 py-3 border-b border-emerald-100 flex items-center gap-2 text-emerald-800 font-black text-[10px] uppercase tracking-[0.2em]">
              <Car size={14} /> Ficha Técnica del Vehículo
            </div>
            <div className="p-6 space-y-5">
              <CopiableField
                label="D.U.A. / D.A.M."
                value={formData.dua}
                readOnly
                mono
                icon={<FileCode size={16} />}
              />
              <div className="grid grid-cols-2 gap-4">
                <CopiableField
                  label="VIN / Serie"
                  value={formData.vin}
                  readOnly
                  mono
                />
                <CopiableField
                  label="Número de Motor"
                  value={formData.motor}
                  readOnly
                  mono
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <CopiableField
                  label="Placa Asignada"
                  value={formData.placa}
                  readOnly
                  mono
                />
                <CopiableField
                  label="Marca / Fabricante"
                  value={formData.marca}
                  readOnly
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <CopiableField
                  label="Modelo"
                  value={formData.modelo}
                  readOnly
                />
                <CopiableField
                  label="Año Fab."
                  value={formData.anio}
                  readOnly
                />
              </div>
              <CopiableField
                label="Empresa Gestora"
                value={formData.empresa}
                readOnly
                icon={<Building2 size={16} />}
              />
            </div>
          </section>

          <section className="bg-white border border-gray-200 rounded-[2rem] p-8 shadow-sm">
            <div className="flex items-center gap-2 text-indigo-800 font-black text-[10px] uppercase tracking-[0.2em] mb-6">
              <Globe size={16} /> Enlaces de Verificación Externa
            </div>
            <div className="grid grid-cols-2 gap-4">
              <ActionButton
                icon={<Globe size={14} />}
                label="Títulos SUNARP"
                onClick={() =>
                  handleOpenLink(
                    "https://enlinea.sunarp.gob.pe/sunarpweb/pages/acceso/frmTitulos.faces",
                  )
                }
              />
              <ActionButton
                icon={<ExternalLink size={14} />}
                label="Placas AAP"
                onClick={() => handleOpenLink("https://placas.pe/#/home")}
              />
            </div>
          </section>

          <section className="bg-white border border-gray-200 rounded-[2rem] p-8 shadow-sm border-r-8 border-r-blue-600">
            <div className="flex items-center gap-2 text-blue-800 font-black text-[10px] uppercase tracking-[0.2em] mb-6">
              <Printer size={16} /> Emisión de Documentos
            </div>
            <div className="grid grid-cols-2 gap-4">
              <ActionButton
                icon={<Printer size={14} />}
                label="Formulario A"
                variant="blue"
                onClick={() => generateLegacyForm()}
              />
              <ActionButton
                icon={<FileCheck size={14} />}
                label="Cláusula"
                variant="blue"
                onClick={() => generateClausulaPdf(formData)}
              />
              <ActionButton
                icon={<FileText size={14} />}
                label="P. Medina"
                onClick={() => generateMedinaPdf(formData)}
              />
              <ActionButton
                icon={<FileText size={14} />}
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
