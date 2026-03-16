import React, { useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { X, Camera } from "lucide-react";

interface WebcamScannerModalProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export function WebcamScannerModal({
  onScan,
  onClose,
}: WebcamScannerModalProps) {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 150 },
        rememberLastUsedCamera: true,
      },
      false,
    );

    scanner.render(
      (decodedText) => {
        scanner.clear();
        onScan(decodedText);
      },
      (errorMessage) => {
        // Se ignoran los errores continuos (ocurren mientras intenta enfocar/buscar)
      },
    );

    return () => {
      scanner
        .clear()
        .catch((e) => console.error("Error al limpiar el escáner", e));
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Cabecera del Modal */}
        <div className="bg-slate-50 px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Camera size={18} className="text-teal-600" />
            Escáner Web
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Contenedor de la Cámara */}
        <div className="p-5">
          <p className="text-sm text-gray-500 mb-4 text-center">
            Apunta el código de barras o QR hacia la cámara.
          </p>

          {/* Aquí es donde la librería inyecta el video mágicamente */}
          <div
            id="reader"
            className="w-full rounded-xl overflow-hidden border-2 border-dashed border-teal-200 bg-black"
          ></div>
        </div>
      </div>
    </div>
  );
}
