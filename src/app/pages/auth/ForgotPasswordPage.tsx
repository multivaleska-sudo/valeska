import { Link } from "react-router";
import {
  Lock,
  Mail,
  KeyRound,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useForgotPasswordLogic } from "../../logic/auth/useForgotPasswordLogic";

export function ForgotPasswordPage() {
  const {
    step,
    isLoading,
    error,
    email,
    setEmail,
    code,
    setCode,
    newPassword,
    setNewPassword,
    handleRequestCode,
    handleVerifyCode,
    handleResetPassword,
  } = useForgotPasswordLogic();

  return (
    <div className="min-h-screen bg-[#F6F7FB] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-[#2563EB] rounded-full flex items-center justify-center mx-auto mb-4">
            {step === 1 && <Mail className="w-8 h-8 text-white" />}
            {step === 2 && <KeyRound className="w-8 h-8 text-white" />}
            {step === 3 && <Lock className="w-8 h-8 text-white" />}
          </div>
          <h1 className="text-2xl font-semibold text-[#111827]">
            Recuperar Acceso
          </h1>
          <p className="text-sm text-[#6B7280] mt-2">
            {step === 1 &&
              "Ingresa tu correo para recibir un código de seguridad."}
            {step === 2 &&
              "Revisa tu bandeja y escribe el código de 6 dígitos."}
            {step === 3 && "Crea una nueva contraseña para tu cuenta local."}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-700 text-sm font-semibold rounded-lg flex items-center gap-2">
            <AlertCircle size={18} className="shrink-0" /> {error}
          </div>
        )}

        {step === 1 && (
          <form
            onSubmit={handleRequestCode}
            className="space-y-4 animate-in fade-in slide-in-from-right-4"
          >
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-2">
                Correo Electrónico / Usuario
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-[#E5E7EB] rounded-md focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                  placeholder="admin@valeska.com"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#2563EB] text-white py-2.5 rounded-md hover:bg-[#1D4ED8] transition-colors font-medium flex justify-center items-center gap-2"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                "Enviar Código"
              )}
            </button>
          </form>
        )}

        {step === 2 && (
          <form
            onSubmit={handleVerifyCode}
            className="space-y-4 animate-in fade-in slide-in-from-right-4"
          >
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-2">
                Código de Verificación
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
                <input
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} // Solo números
                  className="w-full pl-10 pr-4 py-2 border border-[#E5E7EB] rounded-md text-center tracking-widest text-lg focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                  placeholder="000000"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#2563EB] text-white py-2.5 rounded-md hover:bg-[#1D4ED8] transition-colors font-medium flex justify-center items-center gap-2"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  Validar Código <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        )}

        {step === 3 && (
          <form
            onSubmit={handleResetPassword}
            className="space-y-4 animate-in fade-in slide-in-from-right-4"
          >
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-2">
                Nueva Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-[#E5E7EB] rounded-md focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-600 text-white py-2.5 rounded-md hover:bg-green-700 transition-colors font-medium flex justify-center items-center gap-2"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  Guardar Contraseña <CheckCircle2 size={18} />
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-8 text-center pt-6 border-t border-gray-100">
          <Link
            to="/auth/login"
            className="text-sm text-[#6B7280] hover:text-[#2563EB] hover:underline transition-colors"
          >
            Volver al Inicio de Sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
