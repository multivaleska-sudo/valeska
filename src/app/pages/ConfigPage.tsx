import React from "react";
import {
  UserCircle,
  KeyRound,
  ShieldCheck,
  Mail,
  Save,
  Loader2,
  Monitor,
  Building2,
  RefreshCw,
  HardDrive,
} from "lucide-react";
import { useConfigLogic } from "../logic/usuarios/useConfigLogic";

export function ConfigPage() {
  const {
    isLoading,
    isSavingProfile,
    isSavingSecurity,
    isSavingSystem,
    username,
    rol,
    nombre,
    setNombre,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    dispositivoNombre,
    setDispositivoNombre,
    sucursalId,
    setSucursalId,
    sucursalesList,
    autoSync,
    setAutoSync,
    handleUpdateProfile,
    handleChangePassword,
    handleUpdateSystem,
  } = useConfigLogic();

  if (isLoading)
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="animate-spin text-blue-600 w-10 h-10" />
      </div>
    );

  const isAdmin = rol === "ADMIN_CENTRAL";

  return (
    <div className="min-h-screen bg-[#F6F7FB] p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Cabecera Principal */}
        <div className="flex items-center gap-4 border-b border-gray-200 pb-6">
          <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg shadow-blue-200">
            <SettingsIcon size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-800 tracking-tight">
              Configuración
            </h1>
            <p className="text-sm font-bold text-gray-500 mt-1">
              Ajustes del perfil, seguridad y sistema (
              {isAdmin ? "Administrador" : "Operador"})
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ================= COLUMNA IZQUIERDA (Usuario) ================= */}
          <div className="space-y-8">
            {/* Tarjeta 1: Datos de Perfil */}
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-4">
              <h2 className="text-lg font-black text-gray-800 flex items-center gap-2 mb-6 uppercase">
                <UserCircle className="text-blue-500" /> Mi Perfil
              </h2>

              <form onSubmit={handleUpdateProfile} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">
                    Correo / Usuario (Solo Lectura)
                  </label>
                  <div className="relative">
                    <Mail
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      type="email"
                      value={username}
                      readOnly
                      className="w-full pl-12 pr-4 py-3 bg-gray-100 border border-gray-200 rounded-2xl text-gray-500 font-bold outline-none cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">
                    Nombre Completo
                  </label>
                  <div className="relative">
                    <UserCircle
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400"
                      size={18}
                    />
                    <input
                      type="text"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value.toUpperCase())}
                      required
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl text-gray-800 font-bold outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all uppercase"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="w-full mt-4 bg-[#2563EB] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex justify-center items-center gap-2 hover:bg-[#1D4ED8] transition-colors shadow-lg shadow-blue-200"
                >
                  {isSavingProfile ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Save size={18} />
                  )}
                  Actualizar Perfil
                </button>
              </form>
            </div>

            {/* Tarjeta 2: Seguridad (Contraseñas) */}
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-6">
              <h2 className="text-lg font-black text-gray-800 flex items-center gap-2 mb-6 uppercase">
                <KeyRound className="text-amber-500" /> Seguridad
              </h2>

              <form onSubmit={handleChangePassword} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">
                    Contraseña Actual
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full px-5 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl text-gray-800 font-bold outline-none focus:ring-4 focus:ring-amber-100 focus:border-amber-400 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">
                      Nueva
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      placeholder="••••••••"
                      className="w-full px-5 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl text-gray-800 font-bold outline-none focus:ring-4 focus:ring-amber-100 focus:border-amber-400 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">
                      Confirmar
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      placeholder="••••••••"
                      className="w-full px-5 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl text-gray-800 font-bold outline-none focus:ring-4 focus:ring-amber-100 focus:border-amber-400 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSavingSecurity}
                  className="w-full mt-4 bg-gray-800 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex justify-center items-center gap-2 hover:bg-black transition-colors shadow-lg shadow-gray-200"
                >
                  {isSavingSecurity ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <KeyRound size={18} />
                  )}
                  Cambiar Contraseña
                </button>
              </form>
            </div>
          </div>

          {/* ================= COLUMNA DERECHA (Sistema) ================= */}
          <div className="space-y-8">
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 h-full animate-in fade-in slide-in-from-bottom-8">
              <h2 className="text-lg font-black text-gray-800 flex items-center gap-2 mb-6 uppercase">
                <HardDrive className="text-emerald-500" /> Sistema y Dispositivo
              </h2>

              <form onSubmit={handleUpdateSystem} className="space-y-8">
                {/* Sección: Dispositivo y Sucursal */}
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">
                      Nombre del Dispositivo
                    </label>
                    <div className="relative">
                      <Monitor
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500"
                        size={18}
                      />
                      <input
                        type="text"
                        value={dispositivoNombre}
                        onChange={(e) =>
                          setDispositivoNombre(e.target.value.toUpperCase())
                        }
                        required
                        disabled={!isAdmin} // Solo el admin puede renombrar equipos
                        className={`w-full pl-12 pr-4 py-3 border-2 rounded-2xl text-gray-800 font-bold outline-none transition-all uppercase
                          ${isAdmin ? "bg-gray-50 border-gray-100 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400" : "bg-gray-100 border-gray-200 cursor-not-allowed"}
                        `}
                      />
                    </div>
                    {!isAdmin && (
                      <p className="text-xs text-gray-400 ml-2 mt-1">
                        Solo el administrador puede renombrar este equipo.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">
                      Sucursal Operativa
                    </label>
                    <div className="relative">
                      <Building2
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500"
                        size={18}
                      />
                      <select
                        value={sucursalId}
                        onChange={(e) => setSucursalId(e.target.value)}
                        required
                        disabled={!isAdmin}
                        className={`w-full pl-12 pr-4 py-3 border-2 rounded-2xl text-gray-800 font-bold outline-none transition-all cursor-pointer appearance-none
                          ${isAdmin ? "bg-gray-50 border-gray-100 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400" : "bg-gray-100 border-gray-200 cursor-not-allowed"}
                        `}
                      >
                        {sucursalesList.map((sucursal) => (
                          <option key={sucursal.id} value={sucursal.id}>
                            {sucursal.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <hr className="border-gray-100" />

                {/* Sección: Sincronización (Inspirado en tu mock) */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                        <RefreshCw
                          size={16}
                          className={`text-blue-500 ${autoSync ? "animate-spin-slow" : ""}`}
                        />
                        Sincronización a la Nube
                      </h3>
                      <p className="text-xs text-gray-500 font-medium mt-1">
                        Sincronizar cambios locales en segundo plano
                        automáticamente.
                      </p>
                    </div>

                    {/* Toggle Switch moderno con CSS puro */}
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={autoSync}
                        onChange={(e) => setAutoSync(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSavingSystem}
                    className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex justify-center items-center gap-2 hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
                  >
                    {isSavingSystem ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <Save size={18} />
                    )}
                    Guardar Configuración de Sistema
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsIcon(props: any) {
  return <ShieldCheck {...props} />;
}
