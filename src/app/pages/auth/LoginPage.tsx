import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { Lock, User, AlertCircle, Loader2 } from "lucide-react";
import { ConnectionBadge } from "../../components/ConnectionBadge";
import { useAuthLogic } from "../../logic/auth/useAuthLogic";

export function LoginPage() {
  const navigate = useNavigate();
  const { login, checkInitialSetup, isLoading, error } = useAuthLogic();

  const [isOnline] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    checkInitialSetup();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const success = await login(email, password);
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F6F7FB] flex flex-col items-center justify-center text-gray-500 font-bold gap-3">
        <Loader2 size={32} className="animate-spin text-[#2563EB]" />
        Verificando integridad del sistema...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F7FB] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#2563EB] rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-semibold text-[#111827]">
              Sistema Valeska
            </h1>
            <p className="text-sm text-[#6B7280] mt-2">
              Iniciar sesión en el sistema
            </p>
          </div>

          <ConnectionBadge isOnline={isOnline} />

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-700 text-sm font-semibold rounded-lg flex items-center gap-2 animate-in fade-in">
              <AlertCircle size={18} className="shrink-0" /> {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-2">
                Usuario o Email
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all"
                  placeholder="admin@valeska.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111827] mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#2563EB] text-white py-2.5 rounded-md hover:bg-[#1D4ED8] transition-colors font-medium flex justify-center items-center gap-2 disabled:opacity-70"
            >
              {isSubmitting && <Loader2 size={18} className="animate-spin" />}
              {isSubmitting ? "Verificando credenciales..." : "Iniciar Sesión"}
            </button>
          </form>

          <div className="mt-8 text-center pt-6 border-t border-gray-100">
            <Link
              to="/auth/welcome"
              className="text-xs text-[#6B7280] hover:text-[#2563EB] hover:underline transition-colors"
            >
              ¿Equipo nuevo? Configurar licencia de sucursal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
