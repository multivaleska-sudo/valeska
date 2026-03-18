import React, { useState } from "react";
import { useNavigate } from "react-router";
import { open } from "@tauri-apps/plugin-dialog";
import {
  Laptop,
  CheckCircle,
  AlertCircle,
  Loader2,
  UploadCloud,
  FileKey,
} from "lucide-react";
import { useAuthLogic } from "../../logic/auth/useAuthLogic";

export function WelcomeSetupPage() {
  const navigate = useNavigate();
  const { processProvisioningFile, error: authError } = useAuthLogic();

  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const handleSelectFile = async () => {
    try {
      const selectedPath = await open({
        multiple: false,
        filters: [{ name: "Configuración Valeska", extensions: ["valeska"] }],
      });

      if (selectedPath && typeof selectedPath === "string") {
        const fileName =
          selectedPath.split("\\").pop()?.split("/").pop() ||
          "Archivo seleccionado";
        setSelectedFileName(fileName);

        setIsProcessing(true);

        const isOk = await processProvisioningFile(selectedPath);

        setIsProcessing(false);

        if (isOk) {
          setSuccess(true);
          setTimeout(() => navigate("/auth/login"), 3000);
        } else {
          setSelectedFileName(null);
        }
      }
    } catch (err) {
      console.error("Error al abrir diálogo:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F7FB] flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-slate-900 p-8 text-center relative overflow-hidden">
            <div className="absolute top-[-50%] left-[-10%] w-[50%] h-[200%] bg-blue-600/20 rotate-12 blur-2xl pointer-events-none"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
                <Laptop className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-black text-white">
                Sistema Valeska V2
              </h1>
              <p className="text-blue-200 mt-2 font-medium">
                Inicialización Segura de Sucursal
              </p>
            </div>
          </div>

          <div className="p-8">
            {authError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 text-sm font-bold rounded-xl flex items-start gap-3">
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                <p>{authError}</p>
              </div>
            )}

            {success ? (
              <div className="text-center py-8 animate-in zoom-in duration-300">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">
                  ¡Configuración Exitosa!
                </h2>
                <p className="text-gray-500 font-medium">
                  La base de datos ha sido anclada a este dispositivo.
                </p>
                <p className="text-sm text-blue-600 font-bold mt-4 animate-pulse">
                  Redirigiendo al inicio de sesión...
                </p>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <h3 className="text-lg font-bold text-gray-800">
                    Archivo de Provisión
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Haga clic abajo para seleccionar el archivo{" "}
                    <span className="font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                      .valeska
                    </span>{" "}
                    proporcionado por la Central.
                  </p>
                </div>

                <div
                  onClick={() => !isProcessing && handleSelectFile()}
                  className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer bg-gray-50 hover:bg-gray-100 hover:border-blue-400 border-gray-300
                    ${isProcessing ? "pointer-events-none opacity-80" : ""}
                  `}
                >
                  {isProcessing ? (
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                      <div className="space-y-1">
                        <p className="font-bold text-blue-900">
                          Desencriptando: {selectedFileName}
                        </p>
                        <p className="text-xs text-blue-600/80">
                          Configurando base de datos local...
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="p-4 rounded-full bg-white text-blue-600 shadow-sm">
                        <UploadCloud size={32} />
                      </div>
                      <div>
                        <p className="font-bold text-gray-700 text-lg">
                          Seleccionar Archivo
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Explorar carpetas locales
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-8 flex items-center gap-3 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                  <FileKey size={24} className="text-blue-600 shrink-0" />
                  <p className="text-xs text-blue-800 font-medium leading-relaxed">
                    Esta acción configurará los catálogos y enlazará su Tarjeta
                    de Red (MAC) al sistema. Solo se realiza una vez por
                    computadora.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
