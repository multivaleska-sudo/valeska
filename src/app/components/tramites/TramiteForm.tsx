import React, { useState } from "react";
import { useNavigate } from "react-router";
import { open as openExternalLink } from "@tauri-apps/plugin-shell";
import {
  Camera,
  Printer,
  XCircle,
  Save,
  FileText,
  User,
  Car,
  FileCheck,
  Globe,
  Edit3,
  FileCode,
  Loader2,
  ScanBarcode,
} from "lucide-react";
import { useTramiteLogic } from "../../logic/tramites/useTramiteLogic";
import {
  SectionCard,
  ModernInput,
  ModernSelect,
  ModernSearchInput,
  ModernTextarea,
} from "./ModernFormSections";
import { CopiableField } from "../../components/shared/CopiableField";
import { TramiteFormData } from "../../types/tramites/tramite.types";
import { useBarcodeScanner } from "../../logic/tramites/useBarcodeScanner";
import { CatalogoModal } from "../catalogos/CatalogoModal";
import { EmpresaModal } from "../empresa/EmpresaModal";
import { WebcamScannerModal } from "./WebcamScannerModal";

interface TramiteFormProps {
  mode: "create" | "edit" | "view";
  initialData?: Partial<TramiteFormData> & { creador?: string };
}

export function TramiteForm({ mode, initialData }: TramiteFormProps) {
  const navigate = useNavigate();
  const isViewOnly = mode === "view";
  const {
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
  } = useTramiteLogic(initialData);

  const [scanSuccess, setScanSuccess] = useState(false);
  const [showWebcam, setShowWebcam] = useState(false);
  const [modalCatalogo, setModalCatalogo] = useState<
    "tipo_tramite" | "situacion" | null
  >(null);

  const [empresaModalRuc, setEmpresaModalRuc] = useState<string | null>(null);

  useBarcodeScanner((scannedData) => {
    if (isViewOnly) return;
    procesarCodigoEscaneado(scannedData);
  });

  const procesarCodigoEscaneado = (codigo: string) => {
    setFormData((prev) => ({ ...prev, vehiculo_placa: codigo.toUpperCase() }));
    setScanSuccess(true);
    setTimeout(() => setScanSuccess(false), 3000);
  };

  const handleSave = async () => {
    const savedId = await saveTramite();
    if (savedId) navigate("/tramites");
  };

  const handleOpenLink = async (url: string) => {
    try {
      await openExternalLink(url);
    } catch (e) {
      console.error("No se pudo abrir", e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans text-gray-800">
      {showWebcam && (
        <WebcamScannerModal
          onClose={() => setShowWebcam(false)}
          onScan={(codigo) => {
            setShowWebcam(false);
            procesarCodigoEscaneado(codigo);
          }}
        />
      )}
      {modalCatalogo && (
        <CatalogoModal
          tipo={modalCatalogo}
          onClose={() => setModalCatalogo(null)}
          onSuccess={(nuevoNombre) => {
            setModalCatalogo(null);
            loadCatalogos();
            setFormData((prev) => ({
              ...prev,
              [modalCatalogo === "tipo_tramite"
                ? "tipo_tramite"
                : "estado_tramite"]: nuevoNombre,
            }));
          }}
        />
      )}

      {empresaModalRuc !== null && (
        <EmpresaModal
          initialRuc={empresaModalRuc}
          onClose={() => setEmpresaModalRuc(null)}
          onSuccess={(empresaStr, firstRepName) => {
            setEmpresaModalRuc(null);
            const rS = empresaStr.split(" - ")[0].trim();
            const comboName = firstRepName ? `${rS} - ${firstRepName}` : rS;
            setFormData((prev) => ({
              ...prev,
              presentante_empresa: comboName,
            }));
          }}
        />
      )}

      <div className="max-w-[1400px] mx-auto space-y-6">
        {scanSuccess && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-full shadow-lg font-bold flex items-center gap-2 z-50 animate-bounce">
            <ScanBarcode size={20} /> ¡Placa Escaneada y Auto-completada!
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-black text-gray-800 flex items-center gap-3">
              {mode === "create"
                ? "NUEVO TRÁMITE"
                : mode === "edit"
                  ? "EDICIÓN DE TRÁMITE"
                  : "DETALLE DE TRÁMITE"}
              {formData.codigo_verificacion && (
                <span className="bg-blue-100 text-blue-700 text-sm py-1 px-3 rounded-full font-bold">
                  Cód: {formData.codigo_verificacion}
                </span>
              )}
              {formData.creador && (
                <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 text-sm py-1 px-3 rounded-full font-bold flex items-center gap-2">
                  <User size={14} /> Creado por: {formData.creador}
                </span>
              )}
            </h1>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
              Gestión detallada del expediente vehicular.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!isViewOnly && (
              <>
                <button
                  onClick={() => procesarCodigoEscaneado("ABC-987")}
                  className="px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-sm font-bold text-emerald-700 flex items-center gap-2 hover:bg-emerald-100 transition-all shadow-sm"
                >
                  <ScanBarcode size={16} /> Simular Pistola USB
                </button>
                <button
                  onClick={() => setShowWebcam(true)}
                  className="px-4 py-2 bg-teal-50 border border-teal-200 rounded-lg text-sm font-bold text-teal-700 flex items-center gap-2 hover:bg-teal-100 transition-all shadow-sm"
                >
                  <Camera size={16} /> Usar Webcam
                </button>
                <button
                  onClick={autofillFromPdf}
                  disabled={isFilling}
                  className="px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-lg text-sm font-bold text-indigo-700 flex items-center gap-2 hover:bg-indigo-100 transition-all shadow-sm"
                >
                  {isFilling ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <FileCode size={16} />
                  )}{" "}
                  Autocompletar PDF
                </button>
              </>
            )}
            <button
              onClick={() => navigate("/tramites")}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 flex items-center gap-2"
            >
              <XCircle size={16} /> Cerrar
            </button>
            {isViewOnly ? (
              <button
                onClick={() => navigate(`/tramites/${formData.id}/edit`)}
                className="px-6 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm font-bold text-amber-700 hover:bg-amber-100 flex items-center gap-2 shadow-sm"
              >
                <Edit3 size={16} /> Editar Registro
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2 bg-blue-600 rounded-lg text-sm font-bold text-white flex items-center gap-2 hover:bg-blue-700 shadow-sm disabled:opacity-50"
              >
                <Save size={16} />{" "}
                {isSaving ? "Guardando..." : "Grabar Registro"}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-5 space-y-6">
            <SectionCard
              title="Detalles del Trámite"
              icon={<FileText size={18} />}
            >
              <div className="grid grid-cols-2 gap-4">
                <CopiableField
                  label="Año"
                  value={formData.tramite_anio}
                  onChange={(val) =>
                    setFormData((prev) => ({
                      ...prev,
                      tramite_anio: val.replace(/\D/g, "").slice(0, 4),
                    }))
                  }
                  readOnly={isViewOnly}
                  mono={true}
                />
                <CopiableField
                  label="DNI / RUC"
                  value={formData.dni}
                  onChange={(val) =>
                    setFormData((prev) => ({
                      ...prev,
                      dni: val.replace(/\D/g, "").slice(0, 11),
                    }))
                  }
                  readOnly={isViewOnly}
                  mono={true}
                />
                <div className="col-span-2">
                  <CopiableField
                    label="Cliente"
                    value={formData.cliente}
                    onChange={(val) =>
                      setFormData((prev) => ({
                        ...prev,
                        cliente: val.toUpperCase(),
                      }))
                    }
                    readOnly={isViewOnly}
                  />
                </div>
                <CopiableField
                  label="Teléfono"
                  value={formData.telefono}
                  onChange={(val) =>
                    setFormData((prev) => ({
                      ...prev,
                      telefono: val.replace(/\D/g, "").slice(0, 15),
                    }))
                  }
                  readOnly={isViewOnly}
                />
                <CopiableField
                  label="N° Título"
                  value={formData.n_titulo}
                  onChange={(val) =>
                    setFormData((prev) => ({
                      ...prev,
                      n_titulo: val.toUpperCase(),
                    }))
                  }
                  readOnly={isViewOnly}
                />

                <ModernSelect
                  label="Tipo de Trámite"
                  name="tipo_tramite"
                  value={formData.tipo_tramite}
                  onChange={handleChange}
                  className="col-span-2"
                  disabled={isViewOnly}
                  options={opcionesTipos}
                  onAddClick={() => setModalCatalogo("tipo_tramite")}
                />
                <ModernSelect
                  label="Estado del Trámite"
                  name="estado_tramite"
                  value={formData.estado_tramite}
                  onChange={handleChange}
                  className="col-span-2"
                  disabled={isViewOnly}
                  options={opcionesSituacion}
                  onAddClick={() => setModalCatalogo("situacion")}
                />

                <ModernInput
                  label="Fecha Presentación"
                  type="date"
                  name="fecha_presentacion"
                  value={formData.fecha_presentacion}
                  onChange={handleChange}
                  readOnly={isViewOnly}
                />
                <CopiableField
                  label="Código Verificación"
                  value={formData.codigo_verificacion}
                  onChange={(val) =>
                    setFormData((prev) => ({
                      ...prev,
                      codigo_verificacion: val.toUpperCase(),
                    }))
                  }
                  readOnly={isViewOnly}
                  mono={true}
                />

                <div className="col-span-2 mt-4 mb-2">
                  <h3 className="text-gray-700 font-medium mb-3 border-b pb-1 text-xs uppercase tracking-wider">
                    1. Recepción en Oficina (Gestora)
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-md border border-gray-100 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.check_tarjeta_oficina || false}
                          onChange={() =>
                            handleAutoCheck("check_tarjeta_oficina")
                          }
                          disabled={isViewOnly}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-gray-700 font-medium text-sm">
                          Tarjeta en Oficina
                        </span>
                      </label>
                      <input
                        type="date"
                        value={formData.fecha_tarjeta_oficina || ""}
                        readOnly
                        className="border border-gray-300 rounded-md px-3 py-1.5 text-xs text-gray-600 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
                        disabled={!formData.check_tarjeta_oficina}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.check_placa_oficina || false}
                          onChange={() =>
                            handleAutoCheck("check_placa_oficina")
                          }
                          disabled={isViewOnly}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-gray-700 font-medium text-sm">
                          Placa en Oficina
                        </span>
                      </label>
                      <input
                        type="date"
                        value={formData.fecha_placa_oficina || ""}
                        readOnly
                        className="border border-gray-300 rounded-md px-3 py-1.5 text-xs text-gray-600 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
                        disabled={!formData.check_placa_oficina}
                      />
                    </div>
                  </div>
                </div>

                <div className="col-span-2 mb-2">
                  <h3 className="text-gray-700 font-medium mb-3 border-b pb-1 text-xs uppercase tracking-wider">
                    2. Entrega al Cliente Final
                  </h3>
                  <div className="bg-blue-50/30 p-4 rounded-md border border-blue-100 flex flex-col gap-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 w-1/3">
                        <input
                          type="checkbox"
                          checked={formData.check_entrega_tarjeta || false}
                          onChange={() =>
                            handleAutoCheck("check_entrega_tarjeta")
                          }
                          disabled={isViewOnly}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-gray-700 font-medium text-sm">
                          Entregó Tarjeta
                        </span>
                      </div>
                      <div
                        className={`flex items-center gap-4 transition-opacity ${formData.check_entrega_tarjeta ? "opacity-100" : "opacity-40 pointer-events-none"}`}
                      >
                        <span className="text-xs text-gray-500">
                          ¿Cómo recogió?
                        </span>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name="metodo_entrega_tarjeta"
                            value="RECIBO"
                            checked={
                              formData.metodo_entrega_tarjeta === "RECIBO"
                            }
                            onChange={handleChange}
                            disabled={isViewOnly}
                            className="w-3.5 h-3.5 text-blue-600"
                          />
                          <span className="text-xs text-gray-600 font-medium">
                            Recibo
                          </span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name="metodo_entrega_tarjeta"
                            value="DNI"
                            checked={formData.metodo_entrega_tarjeta === "DNI"}
                            onChange={handleChange}
                            disabled={isViewOnly}
                            className="w-3.5 h-3.5 text-blue-600"
                          />
                          <span className="text-xs text-gray-600 font-medium">
                            DNI
                          </span>
                        </label>
                      </div>
                      <input
                        type="date"
                        value={formData.fecha_entrega_tarjeta || ""}
                        readOnly
                        className="border border-gray-300 rounded-md px-3 py-1.5 text-xs text-gray-600 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
                        disabled={!formData.check_entrega_tarjeta}
                      />
                    </div>

                    <div className="h-px bg-gray-200 w-full"></div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 w-1/3">
                        <input
                          type="checkbox"
                          checked={formData.check_entrega_placa || false}
                          onChange={() =>
                            handleAutoCheck("check_entrega_placa")
                          }
                          disabled={isViewOnly}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-gray-700 font-medium text-sm">
                          Entregó Placa
                        </span>
                      </div>
                      <div
                        className={`flex items-center gap-4 transition-opacity ${formData.check_entrega_placa ? "opacity-100" : "opacity-40 pointer-events-none"}`}
                      >
                        <span className="text-xs text-gray-500">
                          ¿Cómo recogió?
                        </span>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name="metodo_entrega_placa"
                            value="RECIBO"
                            checked={formData.metodo_entrega_placa === "RECIBO"}
                            onChange={handleChange}
                            disabled={isViewOnly}
                            className="w-3.5 h-3.5 text-blue-600"
                          />
                          <span className="text-xs text-gray-600 font-medium">
                            Recibo
                          </span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name="metodo_entrega_placa"
                            value="DNI"
                            checked={formData.metodo_entrega_placa === "DNI"}
                            onChange={handleChange}
                            disabled={isViewOnly}
                            className="w-3.5 h-3.5 text-blue-600"
                          />
                          <span className="text-xs text-gray-600 font-medium">
                            DNI
                          </span>
                        </label>
                      </div>
                      <input
                        type="date"
                        value={formData.fecha_entrega_placa || ""}
                        readOnly
                        className="border border-gray-300 rounded-md px-3 py-1.5 text-xs text-gray-600 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
                        disabled={!formData.check_entrega_placa}
                      />
                    </div>
                  </div>
                </div>

                <div className="col-span-2">
                  <ModernTextarea
                    label="Observaciones"
                    name="observaciones"
                    value={formData.observaciones}
                    onChange={handleChange}
                    readOnly={isViewOnly}
                    rows={3}
                    placeholder="Escriba aquí solo si hubo alguna eventualidad."
                  />
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Enlaces Externos" icon={<Globe size={18} />}>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleOpenLink("https://www.sunarp.gob.pe")}
                  className="py-2.5 bg-red-50 text-red-700 font-bold rounded-lg border border-red-100 hover:bg-red-100 flex items-center justify-center gap-2"
                >
                  <Globe size={16} /> Web SUNARP
                </button>
                <button
                  onClick={() => handleOpenLink("https://placas.pe/#/home")}
                  className="py-2.5 bg-blue-50 text-blue-700 font-bold rounded-lg border border-blue-100 hover:bg-blue-100 flex items-center justify-center gap-2"
                >
                  <Globe size={16} /> Web AAP
                </button>
              </div>
            </SectionCard>
          </div>

          <div className="xl:col-span-7 space-y-6">
            <SectionCard title="Datos del Vehículo" icon={<Car size={18} />}>
              <div className="grid grid-cols-3 gap-4">
                <CopiableField
                  label="Placa"
                  value={formData.vehiculo_placa}
                  onChange={(val) =>
                    setFormData((prev) => ({
                      ...prev,
                      vehiculo_placa: val.toUpperCase(),
                    }))
                  }
                  readOnly={isViewOnly}
                  mono={true}
                />
                <CopiableField
                  label="Marca"
                  value={formData.vehiculo_marca}
                  onChange={(val) =>
                    setFormData((prev) => ({
                      ...prev,
                      vehiculo_marca: val.toUpperCase(),
                    }))
                  }
                  readOnly={isViewOnly}
                />
                <CopiableField
                  label="Modelo"
                  value={formData.vehiculo_modelo}
                  onChange={(val) =>
                    setFormData((prev) => ({
                      ...prev,
                      vehiculo_modelo: val.toUpperCase(),
                    }))
                  }
                  readOnly={isViewOnly}
                />
                <CopiableField
                  label="Año"
                  value={formData.vehiculo_anio}
                  onChange={(val) =>
                    setFormData((prev) => ({
                      ...prev,
                      vehiculo_anio: val.replace(/\D/g, "").slice(0, 4),
                    }))
                  }
                  readOnly={isViewOnly}
                  mono={true}
                />
                <CopiableField
                  label="Color"
                  value={formData.vehiculo_color}
                  onChange={(val) =>
                    setFormData((prev) => ({
                      ...prev,
                      vehiculo_color: val.toUpperCase(),
                    }))
                  }
                  readOnly={isViewOnly}
                />
                <CopiableField
                  label="Carrocería"
                  value={formData.vehiculo_carroceria}
                  onChange={(val) =>
                    setFormData((prev) => ({
                      ...prev,
                      vehiculo_carroceria: val.toUpperCase(),
                    }))
                  }
                  readOnly={isViewOnly}
                />
                <div className="col-span-3 grid grid-cols-2 gap-4">
                  <CopiableField
                    label="Motor"
                    value={formData.vehiculo_motor}
                    onChange={(val) =>
                      setFormData((prev) => ({
                        ...prev,
                        vehiculo_motor: val.toUpperCase(),
                      }))
                    }
                    readOnly={isViewOnly}
                    mono={true}
                  />
                  <CopiableField
                    label="Chasis / VIN"
                    value={formData.vehiculo_chasis}
                    onChange={(val) =>
                      setFormData((prev) => ({
                        ...prev,
                        vehiculo_chasis: val.toUpperCase(),
                      }))
                    }
                    readOnly={isViewOnly}
                    mono={true}
                  />
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Identificación del Origen"
              icon={<User size={18} />}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
                <div className="col-span-1 md:col-span-2 relative">
                  <ModernSearchInput
                    label="Empresa y Representante Legal (Gerente)"
                    name="presentante_empresa"
                    value={formData.presentante_empresa}
                    onChange={(e: any) => {
                      handleChange(e);
                      setShowEmpresaDropdown(true);
                    }}
                    readOnly={isViewOnly}
                    placeholder="Ej. MULTISERVICIOS ABC - JUAN PEREZ..."
                    onAddClick={() => setEmpresaModalRuc("")}
                  />

                  {showEmpresaDropdown &&
                    !isViewOnly &&
                    empresaResultados.length > 0 && (
                      <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-blue-200 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-gray-100 max-h-60 overflow-y-auto">
                        {empresaResultados.map((emp, idx) => {
                          const repName = emp.rep_id
                            ? `${emp.primer_apellido} ${emp.segundo_apellido || ""} ${emp.nombres}`
                                .replace(/\s+/g, " ")
                                .trim()
                            : "Sin representante asignado";
                          const comboName = emp.rep_id
                            ? `${emp.razon_social} - ${repName}`
                            : emp.razon_social;

                          return (
                            <div
                              key={idx}
                              onClick={() => seleccionarEmpresa(emp)}
                              className="p-3 hover:bg-blue-50 cursor-pointer transition-colors"
                            >
                              <div className="text-sm font-black text-gray-800">
                                {comboName}
                              </div>
                              <div className="flex justify-between items-center mt-1">
                                <div className="text-xs font-mono font-bold text-blue-600">
                                  RUC: {emp.ruc || "S/N"}
                                </div>
                                {emp.rep_id ? (
                                  <div className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded uppercase">
                                    DNI REP: {emp.rep_dni || "S/N"}
                                  </div>
                                ) : (
                                  <div className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded uppercase">
                                    Solo Empresa
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                </div>

                <div className="col-span-1 md:col-span-2 relative">
                  <ModernSearchInput
                    label="Presentante Físico (Trabajador / Tramitador Asignado)"
                    name="presentante_persona"
                    value={formData.presentante_persona}
                    onChange={(e: any) => {
                      handleChange(e);
                      setShowPresentanteDropdown(true);
                    }}
                    readOnly={isViewOnly}
                    placeholder="Ej. MARIO GOMEZ..."
                  />

                  {showPresentanteDropdown &&
                    !isViewOnly &&
                    presentanteResultados.length > 0 && (
                      <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-emerald-200 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-gray-100 max-h-60 overflow-y-auto">
                        {presentanteResultados.map((p, idx) => {
                          const nombreComp =
                            `${p.primer_apellido} ${p.segundo_apellido || ""} ${p.nombres}`
                              .replace(/\s+/g, " ")
                              .trim();
                          return (
                            <div
                              key={idx}
                              onClick={() => seleccionarPresentante(p)}
                              className="p-3 hover:bg-emerald-50 cursor-pointer transition-colors"
                            >
                              <div className="text-sm font-black text-gray-800">
                                {nombreComp}
                              </div>
                              <div className="flex justify-between items-center mt-1">
                                <div className="text-xs font-mono font-bold text-emerald-600">
                                  DNI: {p.dni || "S/N"}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                </div>

                <ModernSelect
                  label="Tipo de Boleta"
                  name="tipo_boleta"
                  value={formData.tipo_boleta}
                  onChange={handleChange}
                  disabled={isViewOnly}
                  options={["Manual", "Electrónica"]}
                />
                <div className="grid grid-cols-2 gap-2">
                  <ModernInput
                    label="Número Boleta"
                    name="numero_boleta"
                    value={formData.numero_boleta}
                    onChange={handleChange}
                    readOnly={isViewOnly}
                  />
                  <ModernInput
                    label="Fecha Boleta"
                    type="date"
                    name="fecha_boleta"
                    value={formData.fecha_boleta}
                    onChange={handleChange}
                    readOnly={isViewOnly}
                  />
                </div>
                <ModernInput
                  label="DUA"
                  name="dua"
                  value={formData.dua}
                  onChange={handleChange}
                  readOnly={isViewOnly}
                />
                <ModernInput
                  label="N° Formato Inmatriculación"
                  name="num_formato_inmatriculacion"
                  value={formData.num_formato_inmatriculacion}
                  onChange={handleChange}
                  readOnly={isViewOnly}
                />
              </div>
            </SectionCard>

            <div className="grid grid-cols-2 gap-6">
              <SectionCard
                title="Cláusula de Cancelación"
                icon={<FileCheck size={18} />}
              >
                <div className="space-y-4">
                  <CopiableField
                    label="Monto Total"
                    value={formData.clausula_monto}
                    onChange={(val) =>
                      setFormData((prev) => ({
                        ...prev,
                        clausula_monto: val.toUpperCase(),
                      }))
                    }
                    readOnly={isViewOnly}
                    placeholder="Ej. 15000.00"
                  />
                  <CopiableField
                    label="Forma de Pago"
                    value={formData.clausula_forma_pago}
                    onChange={(val) =>
                      setFormData((prev) => ({
                        ...prev,
                        clausula_forma_pago: val.toUpperCase(),
                      }))
                    }
                    readOnly={isViewOnly}
                  />
                  <CopiableField
                    label="Pago Bancarizado Según"
                    value={formData.clausula_pago_bancarizado}
                    onChange={(val) =>
                      setFormData((prev) => ({
                        ...prev,
                        clausula_pago_bancarizado: val.toUpperCase(),
                      }))
                    }
                    readOnly={isViewOnly}
                  />
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                    <h4 className="text-xs font-bold text-gray-500 uppercase">
                      Aclaración
                    </h4>
                    <CopiableField
                      label="Dice"
                      value={formData.aclaracion_dice}
                      onChange={(val) =>
                        setFormData((prev) => ({
                          ...prev,
                          aclaracion_dice: val.toUpperCase(),
                        }))
                      }
                      readOnly={isViewOnly}
                    />
                    <CopiableField
                      label="Debe Decir"
                      value={formData.aclaracion_debe_decir}
                      onChange={(val) =>
                        setFormData((prev) => ({
                          ...prev,
                          aclaracion_debe_decir: val.toUpperCase(),
                        }))
                      }
                      readOnly={isViewOnly}
                    />
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                title="Emisión de Documentos"
                icon={<Printer size={18} />}
              >
                <div className="flex flex-col gap-4">
                  <ModernInput
                    label="Fecha para Impresión"
                    type="date"
                    name="fecha_impresion"
                    value={formData.fecha_impresion}
                    onChange={handleChange}
                    readOnly={isViewOnly}
                  />
                  <div className="space-y-2 mt-2">
                    {plantillas.length === 0 ? (
                      <p className="text-xs text-gray-500 text-center bg-gray-50 py-3 rounded-lg border border-dashed border-gray-200">
                        No hay plantillas activas en el sistema.
                      </p>
                    ) : (
                      plantillas.map((tpl) => (
                        <button
                          key={tpl.id}
                          onClick={async () => {
                            if (!formData.id) {
                              alert(
                                "Debe grabar el registro primero antes de poder imprimir.",
                              );
                              return;
                            }
                            const guardadoExitoso = await saveTramite();
                            if (guardadoExitoso) {
                              navigate(
                                `/tramites/${formData.id}/print/${tpl.id}`,
                              );
                            }
                          }}
                          className="w-full py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-white hover:border-blue-300 hover:text-blue-600 transition-all flex items-center justify-center gap-2 shadow-sm"
                        >
                          <FileText size={16} /> Imprimir {tpl.nombre_documento}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </SectionCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
