import { AlertTriangle, ArrowRightLeft, ShieldAlert } from "lucide-react";

interface TransferConfirmModalProps {
  targetName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function TransferConfirmModal({
  targetName,
  onConfirm,
  onCancel,
}: TransferConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-[#7c2d12]/60 backdrop-blur-lg z-[100] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-[3.5rem] shadow-2xl animate-in zoom-in-90 duration-300 border-4 border-orange-500 overflow-hidden">
        <div className="bg-orange-500 p-10 text-white text-center">
          <AlertTriangle size={64} className="mx-auto mb-6 animate-bounce" />
          <h2 className="text-3xl font-black tracking-tighter uppercase leading-tight">
            Transferencia de Mando
          </h2>
        </div>

        <div className="p-10 space-y-6 text-center">
          <div className="bg-orange-50 p-6 rounded-[2rem] border border-orange-100">
            <p className="text-sm font-bold text-orange-800 leading-relaxed">
              Estás a punto de designar a{" "}
              <span className="font-black underline italic">
                "{targetName}"
              </span>{" "}
              como el único Administrador del dispositivo.
            </p>
          </div>

          <div className="flex flex-col gap-4 text-xs font-black text-gray-400 uppercase tracking-widest">
            <p className="flex items-center justify-center gap-2">
              <ArrowRightLeft size={16} className="text-orange-500" /> Perderás
              tus privilegios de Admin
            </p>
            <p className="flex items-center justify-center gap-2">
              <ShieldAlert size={16} className="text-orange-500" /> Esta acción
              es irreversible
            </p>
          </div>

          <div className="pt-4 space-y-3">
            <button
              onClick={onConfirm}
              className="w-full bg-[#111827] text-white py-5 rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] shadow-2xl hover:bg-black transition-all active:scale-95"
            >
              Sí, traspasar mando
            </button>
            <button
              onClick={onCancel}
              className="w-full bg-gray-100 text-gray-500 py-4 rounded-[2rem] font-black uppercase text-[10px] tracking-widest hover:bg-gray-200 transition-all"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
