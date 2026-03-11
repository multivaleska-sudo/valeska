import {
  UserCircle,
  Lock,
  Unlock,
  Edit3,
  Trash2,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { User } from "../../types/usuarios/user.types";

interface UserCardProps {
  user: User;
  onToggleStatus: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (user: User) => void;
}

export function UserCard({
  user,
  onToggleStatus,
  onDelete,
  onEdit,
}: UserCardProps) {
  const isActive = user.status === "active";
  const isAdmin = user.role === "ADMIN";

  return (
    <div
      className={`bg-white rounded-[2.5rem] border-2 transition-all group relative overflow-hidden p-8 shadow-sm hover:shadow-xl
      ${isActive ? (isAdmin ? "border-blue-500 shadow-blue-50" : "border-gray-100") : "border-red-100 bg-red-50/10"}`}
    >
      {isAdmin && (
        <div className="absolute top-0 left-0 bg-blue-500 text-white px-4 py-1.5 rounded-br-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
          <ShieldCheck size={12} /> Propietario de Instancia
        </div>
      )}

      {!isActive && (
        <div className="absolute top-0 right-0 p-6 opacity-10 rotate-12">
          <Lock size={100} className="text-red-500" />
        </div>
      )}

      <div className="flex justify-between items-start mt-4 mb-6">
        <div
          className={`p-4 rounded-3xl ${isActive ? (isAdmin ? "bg-blue-600 text-white shadow-lg" : "bg-blue-50 text-blue-600") : "bg-red-100 text-red-600"}`}
        >
          <UserCircle size={32} />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(user)}
            className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"
          >
            <Edit3 size={18} />
          </button>
          {!isAdmin && (
            <button
              onClick={() => onDelete(user.id)}
              className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-black text-xl text-[#111827] tracking-tight truncate">
          {user.name}
        </h3>
        <p className="text-xs text-[#6B7280] flex items-center gap-2 font-bold opacity-70">
          <Mail size={14} className="text-blue-400" /> {user.email}
        </p>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">
            Última Actividad
          </span>
          <span className="text-xs font-black text-gray-600">
            {user.lastLogin}
          </span>
        </div>

        {!isAdmin && (
          <button
            onClick={() => onToggleStatus(user.id)}
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
