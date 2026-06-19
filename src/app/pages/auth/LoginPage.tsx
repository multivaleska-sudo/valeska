import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import { AlertCircle, Loader2, Lock, User, DownloadCloud } from "lucide-react";
import { ConnectionBadge } from "../../components/ConnectionBadge";
import {
  getLoginHistory,
  recordSuccessfulLogin,
  useAuthLogic,
} from "../../logic/auth/useAuthLogic";
import { useAppUpdater } from "../../logic/updates/useAppUpdater";

type LoginLocationState = {
  prefillIdentifier?: string;
};

export function LoginPage() {
  const location = useLocation();
  const { login, error } = useAuthLogic();
  const passwordRef = useRef<HTMLInputElement>(null);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOnline] = useState(true);
  const [history, setHistory] = useState(() => getLoginHistory());

  const { checkAndInstallUpdate, isChecking, isInstalling, progress, latestVersion } = useAppUpdater();

  useEffect(() => {
    const state = location.state as LoginLocationState | null;
    const prefill =
      state?.prefillIdentifier ||
      sessionStorage.getItem("valeska_login_prefill") ||
      "";

    if (!prefill) return;

    setIdentifier(prefill);
    sessionStorage.removeItem("valeska_login_prefill");
    window.setTimeout(() => passwordRef.current?.focus(), 80);
  }, [location.state]);

  const suggestions = useMemo(() => {
    const query = identifier.trim().toLowerCase();
    if (!query) return history.slice(0, 5);

    return history
      .filter(
        (item) =>
          item.identifier.toLowerCase().includes(query) ||
          item.username.toLowerCase().includes(query) ||
          item.nombre?.toLowerCase().includes(query),
      )
      .slice(0, 5);
  }, [history, identifier]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    const cleanIdentifier = identifier.trim();

    if (!cleanIdentifier || !password) return;

    setIsSubmitting(true);
    try {
      const success = await login(cleanIdentifier, password);
      if (success) {
        recordSuccessfulLogin({
          identifier: cleanIdentifier,
          username: cleanIdentifier,
        });
        setHistory(getLoginHistory());
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F7FB] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100">
        <div className="bg-[#111827] p-8 text-white text-center">
          <div className="w-16 h-16 bg-[#2563EB] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight">
            Acceso Valeska
          </h1>
          <p className="text-blue-200 text-sm mt-2 font-medium">
            Inicia sesión con tu usuario o correo.
          </p>
        </div>

        <form onSubmit={handleLogin} className="p-8 space-y-5">
          <ConnectionBadge isOnline={isOnline} />

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-sm font-bold rounded-xl flex items-start gap-2">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">
              Usuario o correo
            </label>
            <div className="relative">
              <User
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                list="valeska-login-history"
                type="text"
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-gray-800 font-bold outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all"
                placeholder="usuario o correo"
                required
              />
              <datalist id="valeska-login-history">
                {suggestions.map((item) => (
                  <option key={`${item.username}-${item.lastLoginAt}`} value={item.identifier}>
                    {item.nombre || item.username}
                  </option>
                ))}
              </datalist>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">
              Contraseña
            </label>
            <div className="relative">
              <Lock
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                ref={passwordRef}
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-gray-800 font-bold outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all"
                placeholder="Contraseña"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !identifier.trim() || !password}
            className="w-full bg-[#2563EB] text-white py-3.5 rounded-xl font-black uppercase tracking-widest text-xs flex justify-center items-center gap-2 hover:bg-[#1D4ED8] disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-200"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Lock size={18} />
            )}
            {isSubmitting ? "Validando..." : "Iniciar sesión"}
          </button>

          <div className="flex items-center justify-between gap-3 pt-2 text-xs font-bold">
            <Link to="/auth/forgot-password" className="text-blue-600 hover:text-blue-800">
              Olvidé mi contraseña
            </Link>
            <Link to="/auth/welcome" className="text-gray-500 hover:text-gray-800">
              Configurar equipo
            </Link>
          </div>

          <div className="pt-4 mt-4 border-t border-gray-100 flex flex-col gap-3">
            <button
              type="button"
              onClick={checkAndInstallUpdate}
              disabled={isChecking || isInstalling}
              className="w-full bg-violet-50 text-violet-600 border border-violet-100 py-3 rounded-xl font-bold text-xs flex justify-center items-center gap-2 hover:bg-violet-100 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {isChecking || isInstalling ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <DownloadCloud size={16} />
              )}
              {isInstalling ? "Instalando actualización..." : isChecking ? "Buscando actualizaciones..." : "Buscar actualizaciones"}
            </button>
            {latestVersion && !isInstalling && (
               <p className="text-center text-[10px] text-violet-500 font-bold">Nueva versión disponible: {latestVersion}</p>
            )}
            {isInstalling && (
              <div className="h-1.5 w-full bg-violet-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet-600 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
