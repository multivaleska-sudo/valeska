import { useState } from "react";
import { useNavigate } from "react-router";
import { Key, CheckCircle } from "lucide-react";

export function ActivateAdminPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [activated, setActivated] = useState(false);

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    setActivated(true);
    setTimeout(() => navigate("/auth/login"), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F6F7FB] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#2563EB] rounded-full flex items-center justify-center mx-auto mb-4">
              <Key className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-semibold text-[#111827]">
              Activar Admin Central
            </h1>
            <p className="text-sm text-[#6B7280] mt-2">
              Ingresa el código de activación
            </p>
          </div>

          {!activated ? (
            <form onSubmit={handleActivate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-2">
                  Código de activación
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] font-mono text-center text-lg"
                  placeholder="VALE-XXXX-XXXX-XXXX"
                  pattern="VALE-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}"
                  required
                />
                <p className="text-xs text-[#6B7280] mt-2">
                  El código debe tener el formato: VALE-XXXX-XXXX-XXXX
                </p>
              </div>

              <button
                type="submit"
                className="w-full bg-[#2563EB] text-white py-2.5 rounded-md hover:bg-[#1D4ED8] transition-colors font-medium"
              >
                Activar
              </button>
            </form>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-[#16A34A] mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-[#111827] mb-2">
                ¡Activación exitosa!
              </h2>
              <p className="text-sm text-[#6B7280]">
                Redirigiendo al inicio de sesión...
              </p>
            </div>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate("/auth/login")}
              className="text-sm text-[#2563EB] hover:underline"
            >
              Volver al inicio de sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
