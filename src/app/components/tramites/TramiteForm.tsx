import React, { useState } from "react";
import { useNavigate } from "react-router";
import { open as openExternalLink } from "@tauri-apps/plugin-shell";
import {
  Printer,
  XCircle,
  Save,
  FileText,
  User,
  Car,
  Settings,
  FileCheck,
  Globe,
  CheckSquare,
  Edit3,
  FileCode,
  Loader2,
  ScanBarcode,
  Camera,
} from "lucide-react";
import { useTramiteLogic } from "../../logic/tramites/useTramiteLogic";
import {
  SectionCard,
  ModernInput,
  ModernSelect,
  ModernSearchInput,
} from "./ModernFormSections";
import { TramiteFormData } from "../../types/tramites/tramite.types";
import { useBarcodeScanner } from "../../logic/tramites/useBarcodeScanner";
import { WebcamScannerModal } from "./WebcamScannerModal";

interface TramiteFormProps {
  mode: "create" | "edit" | "view";
  initialData?: Partial<TramiteFormData>;
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
  } = useTramiteLogic(initialData);

  const [scanSuccess, setScanSuccess] = useState(false);
  const [showWebcam, setShowWebcam] = useState(false);

  useBarcodeScanner((scannedData) => {
    if (isViewOnly) return;
    procesarCodigoEscaneado(scannedData);
  });

  const procesarCodigoEscaneado = (codigo: string) => {
    console.log("¡Código escaneado!", codigo);
    setFormData((prev) => ({
      ...prev,
      vehiculo_placa: codigo.toUpperCase(),
    }));

    setScanSuccess(true);
    setTimeout(() => setScanSuccess(false), 3000);
  };

  const handleSave = async () => {
    const success = await saveTramite();
    if (success) navigate("/tramites");
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
      {/* RENDERIZAMOS EL MODAL SI showWebcam ES TRUE */}
      {showWebcam && (
        <WebcamScannerModal
          onClose={() => setShowWebcam(false)}
          onScan={(codigo) => {
            setShowWebcam(false);
            procesarCodigoEscaneado(codigo);
          }}
        />
      )}
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Notificación Flotante de Escaneo Exitoso */}
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
              <span className="bg-blue-100 text-blue-700 text-sm py-1 px-3 rounded-full font-bold">
                Cód: {formData.codigo_verificacion}
              </span>
            </h1>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
              Gestión detallada del expediente vehicular.
              {!isViewOnly && (
                <span className="text-indigo-600 font-bold flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded">
                  <ScanBarcode size={14} /> Lector USB Activo
                </span>
              )}
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
                  )}
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
          {/* COLUMNA IZQUIERDA */}
          <div className="xl:col-span-5 space-y-6">
            <SectionCard
              title="Detalles del Trámite"
              icon={<FileText size={18} />}
            >
              <div className="grid grid-cols-2 gap-4">
                <ModernInput
                  label="Año"
                  name="tramite_anio"
                  value={formData.tramite_anio}
                  onChange={handleChange}
                  readOnly={isViewOnly}
                />
                <ModernInput
                  label="DNI / RUC"
                  name="dni"
                  value={formData.dni}
                  onChange={handleChange}
                  readOnly={isViewOnly}
                />
                <ModernInput
                  label="Cliente"
                  name="cliente"
                  value={formData.cliente}
                  onChange={handleChange}
                  className="col-span-2"
                  readOnly={isViewOnly}
                />
                <ModernInput
                  label="Teléfono"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  readOnly={isViewOnly}
                />
                <ModernInput
                  label="N° Título"
                  name="n_titulo"
                  value={formData.n_titulo}
                  onChange={handleChange}
                  readOnly={isViewOnly}
                />

                <ModernSelect
                  label="Tipo de Trámite"
                  name="tipo_tramite"
                  value={formData.tipo_tramite}
                  onChange={handleChange}
                  className="col-span-2"
                  disabled={isViewOnly}
                  options={[
                    "Primera Inscripción Vehicular",
                    "Cambio de Características",
                    "Cambio de Uso",
                    "Duplicado de Tarjeta",
                    "Transferencia Notarial",
                    "Otros",
                  ]}
                />

                <ModernSelect
                  label="Estado del Trámite"
                  name="estado_tramite"
                  value={formData.estado_tramite}
                  onChange={handleChange}
                  className="col-span-2"
                  disabled={isViewOnly}
                  options={[
                    "En calificación",
                    "Inscrito",
                    "Observado",
                    "Concluido",
                    "Reingresado",
                  ]}
                />

                <ModernInput
                  label="Fecha Presentación"
                  type="date"
                  name="fecha_presentacion"
                  value={formData.fecha_presentacion}
                  readOnly
                />
                <ModernInput
                  label="Código Verificación"
                  name="codigo_verificacion"
                  value={formData.codigo_verificacion}
                  readOnly
                />

                <div className="col-span-2 mt-2 space-y-3">
                  <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <input
                      type="checkbox"
                      checked={formData.check_entrega_tarjeta}
                      onChange={() => handleAutoCheck("check_entrega_tarjeta")}
                      disabled={isViewOnly}
                      className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                    />
                    <span className="text-sm font-semibold flex-1">
                      Entrega Tarjeta
                    </span>
                    <input
                      type="date"
                      value={formData.fecha_entrega_tarjeta}
                      readOnly
                      className="border border-gray-200 rounded-md px-2 py-1 text-xs bg-white w-32"
                    />
                  </div>
                  <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <input
                      type="checkbox"
                      checked={formData.check_entrega_placa}
                      onChange={() => handleAutoCheck("check_entrega_placa")}
                      disabled={isViewOnly}
                      className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                    />
                    <span className="text-sm font-semibold flex-1">
                      Entrega Placa
                    </span>
                    <input
                      type="date"
                      value={formData.fecha_entrega_placa}
                      readOnly
                      className="border border-gray-200 rounded-md px-2 py-1 text-xs bg-white w-32"
                    />
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
                    Observaciones
                  </label>
                  <textarea
                    name="observaciones"
                    value={formData.observaciones}
                    onChange={handleChange}
                    readOnly={isViewOnly}
                    className={`w-full h-24 border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-blue-500 resize-none ${isViewOnly ? "bg-gray-50 text-gray-500" : "bg-white"}`}
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
                  <Globe size={16} /> Web AAP (Placas)
                </button>
              </div>
            </SectionCard>
          </div>

          {/* COLUMNA DERECHA */}
          <div className="xl:col-span-7 space-y-6">
            <SectionCard title="Datos del Vehículo" icon={<Car size={18} />}>
              <div className="grid grid-cols-3 gap-4">
                <ModernInput
                  label="Placa"
                  name="vehiculo_placa"
                  value={formData.vehiculo_placa}
                  onChange={handleChange}
                  readOnly={isViewOnly}
                />
                <ModernInput
                  label="Marca"
                  name="vehiculo_marca"
                  value={formData.vehiculo_marca}
                  onChange={handleChange}
                  readOnly={isViewOnly}
                />
                <ModernInput
                  label="Modelo"
                  name="vehiculo_modelo"
                  value={formData.vehiculo_modelo}
                  onChange={handleChange}
                  readOnly={isViewOnly}
                />
                <ModernInput
                  label="Año"
                  name="vehiculo_anio"
                  value={formData.vehiculo_anio}
                  onChange={handleChange}
                  readOnly={isViewOnly}
                />
                <ModernInput
                  label="Color"
                  name="vehiculo_color"
                  value={formData.vehiculo_color}
                  onChange={handleChange}
                  readOnly={isViewOnly}
                />
                <div className="col-span-3 grid grid-cols-2 gap-4">
                  <ModernInput
                    label="Motor"
                    name="vehiculo_motor"
                    value={formData.vehiculo_motor}
                    onChange={handleChange}
                    readOnly={isViewOnly}
                  />
                  <ModernInput
                    label="Chasis"
                    name="vehiculo_chasis"
                    value={formData.vehiculo_chasis}
                    onChange={handleChange}
                    readOnly={isViewOnly}
                  />
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Datos del Presentante"
              icon={<User size={18} />}
            >
              <div className="grid grid-cols-2 gap-4">
                <ModernSearchInput
                  label="Empresa (Buscar por RUC/Razón)"
                  name="presentante_empresa"
                  value={formData.presentante_empresa}
                  onChange={handleChange}
                  readOnly={isViewOnly}
                />
                <ModernInput
                  label="Presentante"
                  name="presentante_persona"
                  value={formData.presentante_persona}
                  onChange={handleChange}
                  readOnly={isViewOnly}
                />

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
                  <ModernInput
                    label="Monto Total"
                    name="clausula_monto"
                    value={formData.clausula_monto}
                    onChange={handleChange}
                    readOnly={isViewOnly}
                  />
                  <ModernInput
                    label="Forma de Pago"
                    name="clausula_forma_pago"
                    value={formData.clausula_forma_pago}
                    onChange={handleChange}
                    readOnly={isViewOnly}
                  />
                  <ModernInput
                    label="Pago Bancarizado Según"
                    name="clausula_pago_bancarizado"
                    value={formData.clausula_pago_bancarizado}
                    onChange={handleChange}
                    readOnly={isViewOnly}
                  />

                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                    <h4 className="text-xs font-bold text-gray-500 uppercase">
                      Aclaración
                    </h4>
                    <ModernInput
                      label="Dice"
                      name="aclaracion_dice"
                      value={formData.aclaracion_dice}
                      onChange={handleChange}
                      readOnly={isViewOnly}
                    />
                    <ModernInput
                      label="Debe Decir"
                      name="aclaracion_debe_decir"
                      value={formData.aclaracion_debe_decir}
                      onChange={handleChange}
                      readOnly={isViewOnly}
                    />
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                title="Solo Para Impresión"
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
                    <button className="w-full py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition-all flex items-center justify-center gap-2">
                      <FileText size={16} className="text-blue-500" /> Imprimir
                      Cláusula Cancelación
                    </button>
                    <button className="w-full py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition-all flex items-center justify-center gap-2">
                      <FileText size={16} className="text-green-600" /> Imprimir
                      P. MEDINA
                    </button>
                    <button className="w-full py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition-all flex items-center justify-center gap-2">
                      <FileText size={16} className="text-purple-600" />{" "}
                      Imprimir P. PANTIGOSO
                    </button>
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
