import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuthLogic } from "./useAuthLogic";
import { sileo } from "sileo";

export function useForgotPasswordLogic() {
  const navigate = useNavigate();
  const { updatePasswordLocal } = useAuthLogic();

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
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        throw new Error(
          "Error al enviar el correo. Verifique su conexión o el usuario.",
        );
      }
      setStep(2);
      sileo.success({
        title: "Código Enviado",
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
      const res = await fetch(`${API_URL}/auth/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Código inválido o expirado.");
      }

      setStep(3);
      sileo.success({
        title: "Código Verificado",
        description: "Puedes ingresar tu nueva contraseña.",
      });
    } catch (err: any) {
      setError(err.message);
      sileo.error({ title: "Error de Verificación", description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      sileo.warning({
        title: "Contraseña Inválida",
        description: "La contraseña debe tener al menos 6 caracteres.",
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    const success = await updatePasswordLocal(email, newPassword);

    setIsLoading(false);

    if (success) {
      sileo.success({
        title: "Contraseña Actualizada",
        description: "¡Contraseña actualizada con éxito!",
      });
      navigate("/auth/login");
    } else {
      setError(
        "Error interno al guardar la contraseña en la base de datos local.",
      );
      sileo.error({
        title: "Error Interno",
        description:
          "No se pudo guardar la contraseña en la base de datos local.",
      });
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
