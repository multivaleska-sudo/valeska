import { useState } from "react";
import { X, ShieldCheck, UserCircle, Mail, Key } from "lucide-react";

interface UserFormProps {
  user: any | null;
  onClose: () => void;
  onSave: (u: any) => void;
}

export function UserForm({ user, onClose, onSave }: UserFormProps) {
  const [localData, setLocalData] = useState({
    id: user?.id || "",
    name: user?.nombre_completo || "",
    email: user?.username || "",
    role: user?.rol || "OPERADOR",
    password: "",
  });

  return (
    <div className="fixed inset-0 bg-[#111827]/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden border border-gray-200">
        <div className="bg-[#2563EB] p-10 text-white relative overflow-hidden">
          <div className="absolute -right-10 -top-10 opacity-10 rotate-12">
            <ShieldCheck size={200} />
          </div>
          <button
            onClick={onClose}
            className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors z-10"
          >
            <X size={28} />
          </button>
          <ShieldCheck size={48} className="mb-6 text-white/30" />
          <h2 className="text-3xl font-black tracking-tighter uppercase leading-none">
            {user ? "Editar Perfil" : "Alta de Personal"}
          </h2>
          <p className="text-sm text-blue-100 font-bold mt-3 opacity-80 uppercase tracking-widest">
            Credenciales Local Valeska
          </p>
        </div>

        <div className="p-10 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">
              Nombre y Apellidos
            </label>
            <div className="relative">
              <UserCircle
                className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300"
                size={20}
              />
              <input
                type="text"
                className="w-full pl-14 pr-6 h-14 bg-gray-50 border-2 border-gray-100 rounded-3xl font-bold text-gray-700 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all shadow-inner"
                placeholder="Nombre completo"
                value={localData.name}
                onChange={(e) =>
                  setLocalData({ ...localData, name: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">
              Email / Usuario
            </label>
            <div className="relative">
              <Mail
                className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300"
                size={20}
              />
              <input
                type="email"
                className="w-full pl-14 pr-6 h-14 bg-gray-50 border-2 border-gray-100 rounded-3xl font-bold text-gray-700 outline-none focus:ring-4 focus:ring-blue-100 transition-all shadow-inner"
                placeholder="usuario@valeska.com"
                value={localData.email}
                onChange={(e) =>
                  setLocalData({ ...localData, email: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">
                Rol
              </label>
              <select
                className="w-full h-14 px-6 bg-gray-100/50 border-2 border-gray-100 rounded-3xl font-black text-blue-900 outline-none focus:ring-4 focus:ring-blue-100 cursor-pointer"
                value={localData.role}
                onChange={(e) =>
                  setLocalData({ ...localData, role: e.target.value })
                }
              >
                <option value="OPERADOR">📋 Tramitador</option>
                <option value="ADMIN_CENTRAL">👑 Administrador</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">
                Password {user && "(Opcional)"}
              </label>
              <div className="relative">
                <Key
                  className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300"
                  size={20}
                />
                <input
                  type="password"
                  className="w-full pl-14 pr-6 h-14 bg-gray-50 border-2 border-gray-100 rounded-3xl font-bold outline-none focus:ring-4 focus:ring-blue-100 transition-all shadow-inner"
                  placeholder={user ? "Dejar en blanco" : "••••••"}
                  value={localData.password}
                  onChange={(e) =>
                    setLocalData({ ...localData, password: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <div className="pt-6 flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 px-8 py-4 rounded-3xl font-black text-gray-400 uppercase text-[11px] tracking-widest hover:bg-gray-50"
            >
              Descartar
            </button>
            <button
              onClick={() => onSave(localData)}
              className="flex-2 bg-[#2563EB] text-white px-10 py-4 rounded-3xl font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-blue-100 hover:bg-[#1D4ED8] active:scale-95 transition-all"
            >
              {user ? "Guardar Cambios" : "Registrar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
