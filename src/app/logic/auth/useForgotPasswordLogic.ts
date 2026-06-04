import { useState } from "react";
import { useNavigate } from "react-router";
import { sileo } from "sileo";

export function useForgotPasswordLogic() {
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const API_URL = (import.meta as any).env.VITE_API_URL;

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/auth/reset-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({ username: email }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data.message ||
            "Error al enviar el codigo. Verifique su conexion o el usuario.",
        );
      }

      setStep(2);
      sileo.success({
        title: "Codigo Enviado",
        description: "Revisa tu bandeja de entrada.",
      });
    } catch (err: any) {
      setError(err.message);
      sileo.error({ title: "Error", description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (!/^\d{6}$/.test(code)) {
        throw new Error("El codigo debe tener 6 digitos.");
      }

      setStep(3);
      sileo.success({
        title: "Codigo Listo",
        description: "Puedes ingresar tu nueva contrasena.",
      });
    } catch (err: any) {
      setError(err.message);
      sileo.error({ title: "Error de Verificacion", description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError("La contrasena debe tener al menos 6 caracteres.");
      sileo.warning({
        title: "Contrasena Invalida",
        description: "La contrasena debe tener al menos 6 caracteres.",
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({
          username: email,
          code,
          newPassword,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Codigo invalido o expirado.");
      }

      localStorage.removeItem("valeska_session_user");
      localStorage.removeItem("valeska_access_token");

      sileo.success({
        title: "Contrasena Actualizada",
        description: "Contrasena actualizada con exito.",
      });
      navigate("/auth/login");
    } catch (err: any) {
      setError(err.message || "No se pudo actualizar la contrasena.");
      sileo.error({
        title: "Error",
        description: err.message || "No se pudo actualizar la contrasena.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
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
  };
}
