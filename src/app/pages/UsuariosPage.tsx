import React, { useState } from "react";
import {
  UserPlus,
  ShieldCheck,
  UserCircle,
  Lock,
  Unlock,
  Edit3,
  Trash2,
  Mail,
  Key,
  X,
  Check,
  ShieldAlert,
  ShieldQuestion,
  ArrowRightLeft,
  AlertTriangle,
} from "lucide-react";

// --- DEFINICIÓN DE TIPOS (Protocolo V11) ---

type UserRole = "ADMIN" | "USER";
type UserStatus = "active" | "blocked";

interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  lastLogin: string;
}

// --- MOCK DE DATOS INICIAL ---
const INITIAL_USERS: User[] = [
  {
    id: 1,
    name: "Admin Principal (Tú)",
    email: "admin@valeska.com",
    role: "ADMIN",
    status: "active",
    lastLogin: "En línea ahora",
  },
  {
    id: 2,
    name: "Juan Tramitador",
    email: "juan.t@valeska.com",
    role: "USER",
    status: "active",
    lastLogin: "Hoy, 08:30 AM",
  },
  {
    id: 3,
    name: "Maria Archivos",
    email: "m.archivos@valeska.com",
    role: "USER",
    status: "blocked",
    lastLogin: "Ayer",
  },
];

export function UsuariosPage() {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Estado para la confirmación de transferencia de mando
  const [transferData, setTransferData] = useState<{
    targetName: string;
    onConfirm: () => void;
  } | null>(null);

  const toggleStatus = (id: number) => {
    setUsers(
      users.map((u: User) =>
        u.id === id
          ? { ...u, status: u.status === "active" ? "blocked" : "active" }
          : u,
      ),
    );
  };

  const deleteUser = (id: number) => {
    const userToDelete = users.find((u) => u.id === id);
    if (userToDelete?.role === "ADMIN") return; // Protegido por UI

    if (window.confirm("¿Seguro que deseas eliminar este usuario?")) {
      setUsers(users.filter((u: User) => u.id !== id));
    }
  };

  // --- LÓGICA DE GUARDADO CON PROTOCOLO DE TRANSFERENCIA ---
  const handleSaveUser = (updatedUser: Partial<User>) => {
    const currentAdmin = users.find((u) => u.role === "ADMIN");

    // Caso: Estamos asignando ADMIN a alguien que no lo es
    if (
      updatedUser.role === "ADMIN" &&
      currentAdmin &&
      currentAdmin.id !== updatedUser.id
    ) {
      setTransferData({
        targetName: updatedUser.name || "Nuevo Usuario",
        onConfirm: () => {
          // Ejecutar el intercambio de roles
          setUsers((prev) =>
            prev.map((u) => {
              if (u.id === currentAdmin.id)
                return { ...u, role: "USER" as UserRole }; // Degradamos al actual
              if (u.id === updatedUser.id)
                return { ...u, ...updatedUser } as User; // Elevamos al nuevo
              return u;
            }),
          );
          setTransferData(null);
          setShowModal(false);
        },
      });
      return;
    }

    // Caso: Guardado normal (edición de nombre/email o creación de tramitador)
    if (editingUser) {
      setUsers(
        users.map((u) =>
          u.id === editingUser.id ? ({ ...u, ...updatedUser } as User) : u,
        ),
      );
    } else {
      const newUser: User = {
        ...(updatedUser as User),
        id: Date.now(),
        status: "active",
        lastLogin: "Nunca",
      };
      setUsers([...users, newUser]);
    }
    setShowModal(false);
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 bg-[#F6F7FB] min-h-screen">
      {/* NOTA DE ACCESO RESTRINGIDO */}
      <div className="bg-amber-50 border-l-4 border-amber-400 p-5 rounded-r-3xl flex items-start gap-5 shadow-sm border border-amber-100">
        <ShieldAlert className="text-amber-600 shrink-0" size={32} />
        <div>
          <p className="text-xs font-black text-amber-800 uppercase tracking-[0.2em] mb-1">
            Restricción de Seguridad Operativa
          </p>
          <p className="text-xs text-amber-700 font-bold leading-relaxed max-w-3xl">
            Este panel es de visibilidad exclusiva para el Administrador. Solo
            puede existir un Administrador por dispositivo. Cualquier
            designación de un nuevo administrador implicará la pérdida inmediata
            de sus privilegios actuales sobre esta instancia.
          </p>
        </div>
      </div>

      {/* HEADER DE MÓDULO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-8">
        <div>
          <h1 className="text-3xl font-black text-[#111827] tracking-tighter flex items-center gap-3">
            <ShieldCheck className="text-[#2563EB] w-8 h-8" /> SEGURIDAD LOCAL
          </h1>
          <p className="text-sm text-[#6B7280] mt-1 font-bold">
            Gestión de identidades y privilegios de acceso al sistema Valeska.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingUser(null);
            setShowModal(true);
          }}
          className="bg-[#2563EB] text-white px-8 py-4 rounded-[1.5rem] font-black flex items-center gap-2 shadow-xl shadow-blue-200 hover:bg-[#1D4ED8] active:scale-95 transition-all text-[11px] uppercase tracking-widest"
        >
          <UserPlus size={18} /> Registrar Nuevo Usuario
        </button>
      </div>

      {/* GRID DE USUARIOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {users.map((user) => (
          <UserCard
            key={user.id}
            user={user}
            onToggleStatus={toggleStatus}
            onDelete={deleteUser}
            onEdit={(u: User) => {
              setEditingUser(u);
              setShowModal(true);
            }}
          />
        ))}
      </div>

      {/* MODAL DE CREACIÓN/EDICIÓN */}
      {showModal && (
        <UserModal
          user={editingUser}
          onClose={() => setShowModal(false)}
          onSave={handleSaveUser}
        />
      )}

      {/* MODAL DE CONFIRMACIÓN DE TRANSFERENCIA (ADVERTENCIA) */}
      {transferData && (
        <TransferConfirmModal
          targetName={transferData.targetName}
          onConfirm={transferData.onConfirm}
          onCancel={() => setTransferData(null)}
        />
      )}
    </div>
  );
}

// --- SUB-COMPONENTE: TARJETA DE USUARIO ---

interface UserCardProps {
  user: User;
  onToggleStatus: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (user: User) => void;
}

function UserCard({ user, onToggleStatus, onDelete, onEdit }: UserCardProps) {
  const isActive = user.status === "active";
  const isAdmin = user.role === "ADMIN";

  return (
    <div
      className={`bg-white rounded-[2.5rem] border-2 ${isActive ? (isAdmin ? "border-blue-500 shadow-blue-50" : "border-gray-100") : "border-red-100 bg-red-50/10"} p-8 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden`}
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
          className={`p-4 rounded-3xl ${isActive ? (isAdmin ? "bg-blue-600 text-white shadow-lg shadow-blue-100" : "bg-blue-50 text-blue-600") : "bg-red-100 text-red-600"}`}
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
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase transition-all shadow-md ${
              isActive
                ? "bg-red-50 text-red-600 hover:bg-red-600 hover:text-white"
                : "bg-green-50 text-green-600 hover:bg-green-600 hover:text-white"
            }`}
          >
            {isActive ? <Lock size={14} /> : <Unlock size={14} />}
            {isActive ? "Bloquear" : "Desbloquear"}
          </button>
        )}
      </div>
    </div>
  );
}

// --- SUB-COMPONENTE: MODAL DE EDICIÓN ---

interface UserModalProps {
  user: User | null;
  onClose: () => void;
  onSave: (u: Partial<User>) => void;
}

function UserModal({ user, onClose, onSave }: UserModalProps) {
  const [localData, setLocalData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    role: user?.role || ("USER" as UserRole),
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
            {user ? "Configurar Perfil" : "Alta de Personal"}
          </h2>
          <p className="text-sm text-blue-100 font-bold mt-3 opacity-80 uppercase tracking-widest">
            Credenciales de Acceso Local
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
                className="w-full pl-14 pr-6 h-14 bg-gray-50 border-2 border-gray-100 rounded-3xl font-bold text-gray-700 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition-all shadow-inner"
                placeholder="Nombre del operador"
                value={localData.name}
                onChange={(e) =>
                  setLocalData({ ...localData, name: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">
              Email Corporativo
            </label>
            <div className="relative">
              <Mail
                className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300"
                size={20}
              />
              <input
                type="email"
                className="w-full pl-14 pr-6 h-14 bg-gray-50 border-2 border-gray-100 rounded-3xl font-bold text-gray-700 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition-all shadow-inner"
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
                Rol Asignado
              </label>
              <select
                className="w-full h-14 px-6 bg-gray-100/50 border-2 border-gray-100 rounded-3xl font-black text-blue-900 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition-all shadow-inner cursor-pointer"
                value={localData.role}
                onChange={(e) =>
                  setLocalData({
                    ...localData,
                    role: e.target.value as UserRole,
                  })
                }
              >
                <option value="USER">📋 Tramitador</option>
                <option value="ADMIN">👑 Administrador</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">
                Contraseña
              </label>
              <div className="relative">
                <Key
                  className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300"
                  size={20}
                />
                <input
                  type="password"
                  name="pass"
                  className="w-full pl-14 pr-6 h-14 bg-gray-50 border-2 border-gray-100 rounded-3xl font-bold outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all shadow-inner"
                  placeholder="••••••"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 px-8 py-4 rounded-3xl font-black text-gray-400 uppercase text-[11px] tracking-widest hover:bg-gray-50 transition-colors"
            >
              Descartar
            </button>
            <button
              onClick={() => onSave({ ...localData, id: user?.id })}
              className="flex-2 bg-[#2563EB] text-white px-10 py-4 rounded-3xl font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-blue-100 hover:bg-[#1D4ED8] active:scale-95 transition-all"
            >
              {user ? "Guardar Cambios" : "Confirmar Registro"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTE: MODAL DE CONFIRMACIÓN DE TRANSFERENCIA ---

function TransferConfirmModal({
  targetName,
  onConfirm,
  onCancel,
}: {
  targetName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
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
              <ArrowRightLeft size={16} className="text-orange-500" /> Tú
              perderás los privilegios de Admin
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
              Sí, acepto y traspaso mando
            </button>
            <button
              onClick={onCancel}
              className="w-full bg-gray-100 text-gray-500 py-4 rounded-[2rem] font-black uppercase text-[10px] tracking-widest hover:bg-gray-200 transition-all"
            >
              Cancelar Operación
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
