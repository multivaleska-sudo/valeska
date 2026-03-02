import { ArrowLeft, Printer, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router";
import { useState } from "react";

export function CalibrationPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const steps = [
    "Seleccionar Impresora",
    "Imprimir Prueba",
    "Ajustar Offsets",
    "Guardar Perfil",
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/central/templates")}
          className="p-2 hover:bg-white rounded-md transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#6B7280]" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-[#111827]">
            Calibración de Impresora
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Configuración para impresión estricta (R)
          </p>
        </div>
      </div>

      {/* Stepper */}
      <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
        <div className="flex items-center justify-between mb-8">
          {steps.map((label, index) => {
            const stepNum = index + 1;
            const isActive = step === stepNum;

            return (
              <div key={stepNum} className="flex items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                    isActive
                      ? "bg-[#2563EB] text-white"
                      : "bg-gray-200 text-[#6B7280]"
                  }`}
                >
                  {stepNum}
                </div>
                <div className="ml-3">
                  <div className="text-sm font-medium text-[#111827]">
                    {label}
                  </div>
                </div>
                {stepNum < 4 && (
                  <div className="flex-1 h-1 mx-4 bg-gray-200" />
                )}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="min-h-[300px]">
          {step === 1 && (
            <div>
              <h2 className="text-lg font-semibold text-[#111827] mb-4">
                Seleccionar Impresora
              </h2>
              <select className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md">
                <option>HP LaserJet Pro - Oficina Principal</option>
                <option>Canon Pixma - Sucursal 2</option>
              </select>
            </div>
          )}

          {step === 2 && (
            <div className="text-center">
              <Printer className="w-16 h-16 text-[#2563EB] mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-[#111827] mb-2">
                Imprimir Hoja de Prueba
              </h2>
              <p className="text-sm text-[#6B7280] mb-4">
                Imprime la hoja de calibración para medir los offsets
              </p>
              <button className="px-4 py-2 bg-[#2563EB] text-white rounded-md hover:bg-[#1D4ED8]">
                Imprimir Prueba
              </button>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-lg font-semibold text-[#111827] mb-4">
                Ajustar Offsets
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-2">
                    Offset X (mm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="-10"
                    max="10"
                    defaultValue="0"
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-2">
                    Offset Y (mm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="-10"
                    max="10"
                    defaultValue="0"
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-2">
                    Escala (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="98"
                    max="102"
                    defaultValue="100"
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="text-center">
              <h2 className="text-lg font-semibold text-[#111827] mb-4">
                Guardar Perfil de Calibración
              </h2>
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-2">
                  Nombre del perfil
                </label>
                <input
                  type="text"
                  placeholder="HP LaserJet - Oficina"
                  className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md mb-4"
                />
              </div>
              <button className="px-6 py-2 bg-[#16A34A] text-white rounded-md hover:bg-[#15803D]">
                Guardar Perfil
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-6 border-t border-[#E5E7EB]">
          <button
            onClick={() => step > 1 && setStep(step - 1)}
            disabled={step === 1}
            className="px-6 py-2 text-[#6B7280] hover:text-[#111827] disabled:opacity-50"
          >
            Anterior
          </button>
          <button
            onClick={() => step < 4 && setStep(step + 1)}
            disabled={step === 4}
            className="px-6 py-2 bg-[#2563EB] text-white rounded-md hover:bg-[#1D4ED8] flex items-center gap-2 disabled:opacity-50"
          >
            Siguiente
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
