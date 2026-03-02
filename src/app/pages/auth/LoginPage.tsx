import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { Lock, User } from "lucide-react";
import { ConnectionBadge } from "../../components/ConnectionBadge";

export function LoginPage() {
  const navigate = useNavigate();
  const [isOnline] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#F6F7FB] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#2563EB] rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-semibold text-[#111827]">Sistema Valeska</h1>
            <p className="text-sm text-[#6B7280] mt-2">Iniciar sesión en el sistema</p>
          </div>

          <div className="flex justify-center mb-6">
            <ConnectionBadge isOnline={isOnline} />
          </div>

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
                  className="w-full pl-10 pr-4 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
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
                  className="w-full pl-10 pr-4 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#2563EB] text-white py-2.5 rounded-md hover:bg-[#1D4ED8] transition-colors font-medium"
            >
              Iniciar Sesión
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/auth/activate-admin"
              className="text-sm text-[#2563EB] hover:underline"
            >
              Activar Admin Central
            </Link>
          </div>

          <div className="mt-4 text-center">
            <Link
              to="/auth/welcome"
              className="text-xs text-[#6B7280] hover:underline"
            >
              ¿Primera vez? Configurar dispositivo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
