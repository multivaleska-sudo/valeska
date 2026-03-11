import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  Save,
  FileCode,
  Building2,
  UserCheck,
  ClipboardCopy,
  Loader2,
  Briefcase,
  MapPin,
  Fingerprint,
  FileText,
  Hash,
} from "lucide-react";
import { CopiableField } from "../../components/shared/CopiableField";
import { handleXmlAutofillAction } from "../../logic/empresas/xmlActions";

const MOCK_EMPRESAS = [
  {
    id: "1",
    razon_social: "MOTOS DANY E.I.R.L.",
    ruc: "20490878298",
    representante: "DANY ARANZABAL",
    dni_rep: "04963540",
    partida: "11004552",
    direccion: "JR. TACTA 335",
    rol: "Concesionario",
  },
];

export function EmpresaForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    ruc: "",
    razon_social: "",
    direccion: "",
    representante: "",
    dni_rep: "",
    partida: "",
    rol: "Concesionario",
  });

  useEffect(() => {
    if (id) {
      const data = MOCK_EMPRESAS.find((e) => e.id === id);
      if (data) setFormData(data);
    }
  }, [id]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const onAutofillXML = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const data = await handleXmlAutofillAction();
      if (data) {
        setFormData((prev) => ({
          ...prev,
          ruc: data.ruc || prev.ruc,
          razon_social: data.razon_social || prev.razon_social,
          direccion: data.direccion || prev.direccion,
        }));
      }
    } catch (error) {
      console.error("Error al procesar XML:", error);
    } finally {
      setLoading(false);
    }
  };

  const onCopyAll = () => {
    const text = `
RAZÓN SOCIAL: ${formData.razon_social}
RUC: ${formData.ruc}
DIRECCIÓN: ${formData.direccion}
REPRESENTANTE: ${formData.representante} (DNI: ${formData.dni_rep})
PARTIDA: ${formData.partida}
ROL: ${formData.rol}
    `.trim();
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6 animate-in fade-in duration-500">
      {/* HEADER DE COMANDOS */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/empresas")}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">
              {isEdit ? "Editar Empresa / Entidad" : "Nueva Empresa / Entidad"}
            </h2>
            <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest">
              Gestión de Directorio Fiscal
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onAutofillXML}
            disabled={loading}
            className="bg-[#d35400] text-white px-4 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-md hover:bg-[#e67e22] active:scale-95 text-xs transition-all disabled:bg-gray-400"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileCode className="w-4 h-4" />
            )}
            Importar XML SUNAT
          </button>
          <button
            onClick={onCopyAll}
            className="bg-[#8e44ad] text-white px-4 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-md hover:bg-[#9b59b6] active:scale-95 text-xs transition-all"
          >
            <ClipboardCopy className="w-4 h-4" /> Copiar Ficha Total
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* COLUMNA 1: IDENTIDAD FISCAL */}
        <section className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm h-fit">
          <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex items-center gap-2 text-[#1E3A8A] font-bold text-[11px] uppercase tracking-wider">
            <Building2 className="w-4 h-4" /> Datos de la Entidad
          </div>
          <div className="p-6 space-y-5">
            <CopiableField
              label="RUC / DNI de la Entidad"
              value={formData.ruc}
              onChange={(v) => handleChange("ruc", v)}
              placeholder="Ej: 2060..."
              icon={<Fingerprint className="w-4 h-4" />}
              mono
            />
            <CopiableField
              label="Razón Social / Nombre"
              value={formData.razon_social}
              onChange={(v) => handleChange("razon_social", v)}
              placeholder="Nombre legal completo"
              icon={<FileText className="w-4 h-4" />}
            />
            <CopiableField
              label="Dirección Fiscal"
              value={formData.direccion}
              onChange={(v) => handleChange("direccion", v)}
              placeholder="Domicilio legal"
              icon={<MapPin className="w-4 h-4" />}
            />
          </div>
        </section>

        {/* COLUMNA 2: LEGAL Y ROLES */}
        <section className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm h-fit">
          <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex items-center gap-2 text-[#1E3A8A] font-bold text-[11px] uppercase tracking-wider">
            <UserCheck className="w-4 h-4" /> Representación y Sistema
          </div>
          <div className="p-6 space-y-5">
            <CopiableField
              label="Representante Legal"
              value={formData.representante}
              onChange={(v) => handleChange("representante", v)}
              placeholder="Nombres del apoderado"
              icon={<UserCheck className="w-4 h-4" />}
            />
            <div className="grid grid-cols-2 gap-4">
              <CopiableField
                label="DNI Apoderado"
                value={formData.dni_rep}
                onChange={(v) => handleChange("dni_rep", v)}
                placeholder="DNI"
                icon={<Hash className="w-3.5 h-3.5" />}
                mono
              />
              <CopiableField
                label="Partida Registral"
                value={formData.partida}
                onChange={(v) => handleChange("partida", v)}
                placeholder="N° Partida"
                icon={<FileCode className="w-3.5 h-3.5" />}
                mono
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-1 tracking-tight">
                Rol en el Sistema
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={formData.rol}
                  onChange={(e) => handleChange("rol", e.target.value)}
                  className="w-full h-11 pl-10 pr-4 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none bg-white shadow-sm cursor-pointer transition-all"
                >
                  <option value="Concesionario">Concesionario</option>
                  <option value="Proveedor">Proveedor</option>
                  <option value="Cliente Final">Cliente Final</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* FOOTER DE ACCIONES */}
      <div className="flex justify-end items-center gap-4 pt-4 border-t border-gray-100">
        <button
          onClick={() => navigate("/empresas")}
          className="px-6 py-2.5 text-gray-500 font-bold hover:bg-gray-100 rounded-lg transition-all text-sm"
        >
          Cancelar
        </button>
        <button
          onClick={() => navigate("/empresas")}
          className="bg-[#27ae60] text-white px-10 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-[#2ecc71] active:scale-95 transition-all text-sm"
        >
          <Save className="w-5 h-5" /> Guardar Empresa
        </button>
      </div>
    </div>
  );
}
