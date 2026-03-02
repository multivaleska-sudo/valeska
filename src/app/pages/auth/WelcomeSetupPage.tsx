import { useState } from "react";
import { useNavigate } from "react-router";
import { Laptop, User, Building2, ArrowRight } from "lucide-react";

export function WelcomeSetupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    adminName: "",
    adminEmail: "",
    adminPassword: "",
    sucursal: "",
    deviceName: "",
  });

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      // Complete setup
      navigate("/auth/login");
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <div className="min-h-screen bg-[#F6F7FB] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#2563EB] rounded-full flex items-center justify-center mx-auto mb-4">
              <Laptop className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-semibold text-[#111827]">
              Configuración Inicial
            </h1>
            <p className="text-sm text-[#6B7280] mt-2">
              Sistema Valeska - Bienvenida y Setup
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            {[1, 2, 3].map((num) => (
              <div key={num} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                    step >= num
                      ? "bg-[#2563EB] text-white"
                      : "bg-gray-200 text-[#6B7280]"
                  }`}
                >
                  {num}
                </div>
                {num < 3 && (
                  <div
                    className={`w-16 h-1 ${
                      step > num ? "bg-[#2563EB]" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Admin User */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-[#111827] mb-4">
                Crear Admin de Dispositivo
              </h2>
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-2">
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={formData.adminName}
                  onChange={(e) => updateField("adminName", e.target.value)}
                  className="w-full px-4 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  placeholder="Juan Pérez"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.adminEmail}
                  onChange={(e) => updateField("adminEmail", e.target.value)}
                  className="w-full px-4 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  placeholder="admin@valeska.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-2">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={formData.adminPassword}
                  onChange={(e) => updateField("adminPassword", e.target.value)}
                  className="w-full px-4 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  placeholder="••••••••"
                />
              </div>
            </div>
          )}

          {/* Step 2: Sucursal */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-[#111827] mb-4">
                Configurar Sucursal
              </h2>
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-2">
                  Nombre de la sucursal
                </label>
                <input
                  type="text"
                  value={formData.sucursal}
                  onChange={(e) => updateField("sucursal", e.target.value)}
                  className="w-full px-4 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  placeholder="Sucursal Principal"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-2">
                  Nombre del dispositivo
                </label>
                <input
                  type="text"
                  value={formData.deviceName}
                  onChange={(e) => updateField("deviceName", e.target.value)}
                  className="w-full px-4 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  placeholder="PC-OFICINA-01"
                />
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-[#111827] mb-4">
                Confirmación
              </h2>
              <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-md p-4">
                <p className="text-sm text-[#1E40AF] mb-2">
                  <strong>Device ID:</strong> DEV-{Math.random().toString(36).substr(2, 9).toUpperCase()}
                </p>
                <p className="text-sm text-[#1E40AF]">
                  <strong>Security Key:</strong> {Math.random().toString(36).substr(2, 16).toUpperCase()}
                </p>
              </div>
              <div className="bg-[#FEF3C7] border border-[#FDE047] rounded-md p-4">
                <p className="text-sm text-[#92400E]">
                  Guarda estos datos en un lugar seguro. Los necesitarás para recuperar el dispositivo.
                </p>
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-between">
            <button
              onClick={() => step > 1 && setStep(step - 1)}
              className="px-6 py-2 text-[#6B7280] hover:text-[#111827] transition-colors disabled:opacity-50"
              disabled={step === 1}
            >
              Anterior
            </button>
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-[#2563EB] text-white rounded-md hover:bg-[#1D4ED8] transition-colors flex items-center gap-2"
            >
              {step === 3 ? "Finalizar" : "Siguiente"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
