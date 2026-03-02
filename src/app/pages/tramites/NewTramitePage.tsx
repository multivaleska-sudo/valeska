import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

export function NewTramitePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const totalSteps = 5;

  const steps = [
    "Cliente",
    "Vehículo",
    "DUA/Pagos",
    "Situación/Notas",
    "Confirmar",
  ];

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      navigate("/tramites");
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/tramites")}
          className="p-2 hover:bg-white rounded-md transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#6B7280]" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-[#111827]">Nuevo Trámite</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Wizard de creación de trámite
          </p>
        </div>
      </div>

      {/* Stepper */}
      <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
        <div className="flex items-center justify-between mb-8">
          {steps.map((label, index) => {
            const stepNum = index + 1;
            const isActive = step === stepNum;
            const isCompleted = step > stepNum;

            return (
              <div key={stepNum} className="flex items-center flex-1">
                <div className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-colors ${
                      isCompleted
                        ? "bg-[#16A34A] text-white"
                        : isActive
                        ? "bg-[#2563EB] text-white"
                        : "bg-gray-200 text-[#6B7280]"
                    }`}
                  >
                    {isCompleted ? <Check className="w-5 h-5" /> : stepNum}
                  </div>
                  <div className="ml-3">
                    <div
                      className={`text-sm font-medium ${
                        isActive || isCompleted ? "text-[#111827]" : "text-[#6B7280]"
                      }`}
                    >
                      {label}
                    </div>
                  </div>
                </div>
                {stepNum < totalSteps && (
                  <div
                    className={`flex-1 h-1 mx-4 ${
                      isCompleted ? "bg-[#16A34A]" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-[#111827] mb-4">
                Información del Cliente
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-2">
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    placeholder="Juan Pérez García"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-2">
                    DNI
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    placeholder="12345678"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    placeholder="cliente@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    placeholder="987654321"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-[#111827] mb-4">
                Información del Vehículo
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-2">
                    Placa
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] font-mono"
                    placeholder="ABC-123"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-2">
                    Marca
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    placeholder="Toyota"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-2">
                    Modelo
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    placeholder="Corolla"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-2">
                    Año
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    placeholder="2020"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-[#111827] mb-2">
                    VIN
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] font-mono"
                    placeholder="1HGBH41JXMN109186"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-[#111827] mb-2">
                    Número de Motor
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] font-mono"
                    placeholder="4T1BF1FK2CU123456"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-[#111827] mb-4">
                DUA y Pagos
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-2">
                    Número DUA
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    placeholder="DUA-123456"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-2">
                    Fecha DUA
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-[#111827] mb-4">
                Situación y Notas
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-2">
                    Situación
                  </label>
                  <select className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB]">
                    <option>En proceso</option>
                    <option>Documentación</option>
                    <option>Pendiente</option>
                    <option>Entregado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-2">
                    Notas
                  </label>
                  <textarea
                    rows={4}
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    placeholder="Observaciones adicionales..."
                  />
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-[#111827] mb-4">
                Confirmación
              </h2>
              <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg p-6">
                <p className="text-sm text-[#1E40AF] mb-4">
                  Revisa los datos antes de crear el trámite:
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#1E40AF]">Cliente:</span>
                    <span className="font-medium text-[#1E3A8A]">Juan Pérez García</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#1E40AF]">Vehículo:</span>
                    <span className="font-medium text-[#1E3A8A]">Toyota Corolla 2020</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#1E40AF]">Placa:</span>
                    <span className="font-medium text-[#1E3A8A] font-mono">ABC-123</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#E5E7EB]">
          <button
            onClick={handlePrev}
            disabled={step === 1}
            className="px-6 py-2 text-[#6B7280] hover:text-[#111827] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          <div className="text-sm text-[#6B7280]">
            Paso {step} de {totalSteps}
          </div>
          <button
            onClick={handleNext}
            className="px-6 py-2 bg-[#2563EB] text-white rounded-md hover:bg-[#1D4ED8] transition-colors flex items-center gap-2"
          >
            {step === totalSteps ? "Crear Trámite" : "Siguiente"}
            {step !== totalSteps && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
