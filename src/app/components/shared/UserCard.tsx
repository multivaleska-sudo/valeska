import {
  UserCircle,
  Lock,
  Unlock,
  Edit3,
  Trash2,
  Mail,
  ShieldCheck,
  KeyRound,
  DownloadCloud,
} from "lucide-react";
import { User } from "../../types/usuarios/user.types";

interface UserCardProps {
  user: User;
  isCurrentUserAdmin: boolean;
  currentUserId: string;
  onToggleStatus: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onResetPassword: () => void;
  onExport: () => void;
}

export function UserCard({
  user,
  isCurrentUserAdmin,
  currentUserId,
  onToggleStatus,
  onDelete,
  onEdit,
  onResetPassword,
  onExport,
}: UserCardProps) {
  const isActive = user.esta_activo === 1 || user.esta_activo === true;
  const isThisUserAdmin = user.rol === "ADMIN_CENTRAL";

  const lastActivity = user.updated_at
    ? new Date(user.updated_at).toLocaleDateString("es-PE", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Recientemente";

  return (
    <div
      className={`bg-white rounded-[2.5rem] border-2 transition-all group relative overflow-hidden p-8 shadow-sm hover:shadow-xl
      ${isActive ? (isThisUserAdmin ? "border-blue-500 shadow-blue-50" : "border-gray-100") : "border-red-100 bg-red-50/10"}`}
    >
      {isThisUserAdmin && (
        <div className="absolute top-0 left-0 bg-blue-500 text-white px-4 py-1.5 rounded-br-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 z-10">
          <ShieldCheck size={12} /> Propietario de Instancia
        </div>
      )}

      {!isActive && (
        <div className="absolute top-0 right-0 p-6 opacity-10 rotate-12 pointer-events-none">
          <Lock size={100} className="text-red-500" />
        </div>
      )}

      <div className="flex justify-between items-start mt-4 mb-6 relative z-10">
        <div
          className={`p-4 rounded-3xl ${isActive ? (isThisUserAdmin ? "bg-blue-600 text-white shadow-lg" : "bg-blue-50 text-blue-600") : "bg-red-100 text-red-600"}`}
        >
          <UserCircle size={32} />
        </div>

        {/* OCULTAMOS LAS ACCIONES SI NO ES ADMIN */}
        {isCurrentUserAdmin && (
          <div className="flex gap-1.5 bg-white/80 backdrop-blur-sm p-1 rounded-2xl shadow-sm border border-gray-50">
            <button
              onClick={onExport}
              title="Exportar Licencia Fìsica (.valeska)"
              className="p-2.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
            >
              <DownloadCloud size={18} />
            </button>

            <button
              onClick={onEdit}
              title="Editar Usuario"
              className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
            >
              <Edit3 size={18} />
            </button>

            <button
              onClick={onResetPassword}
              title="Generar Contraseña Temporal"
              className="p-2.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
            >
              <KeyRound size={18} />
            </button>

            {!isThisUserAdmin && (
              <button
                onClick={onDelete}
                title="Eliminar Permanente"
                className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2 relative z-10">
        <h3 className="font-black text-xl text-[#111827] tracking-tight truncate capitalize">
          {user.nombre_completo.toLowerCase()}
        </h3>
        <p className="text-xs text-[#6B7280] flex items-center gap-2 font-bold opacity-70">
          <Mail size={14} className="text-blue-400" /> {user.username}
        </p>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between relative z-10">
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">
            Última Actividad
          </span>
          <span className="text-xs font-black text-gray-600 uppercase">
            {lastActivity}
          </span>
        </div>

        {/* OCULTAMOS EL BOTON DE BLOQUEO SI NO ES ADMIN */}
        {isCurrentUserAdmin && !isThisUserAdmin && (
          <button
            onClick={onToggleStatus}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase transition-all shadow-md
              ${isActive ? "bg-red-50 text-red-600 hover:bg-red-600 hover:text-white" : "bg-green-50 text-green-600 hover:bg-green-600 hover:text-white"}`}
          >
            {isActive ? <Lock size={14} /> : <Unlock size={14} />}
            {isActive ? "Bloquear" : "Desbloquear"}
          </button>
        )}
      </div>
    </div>
  );
}
