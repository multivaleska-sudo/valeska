import { useState } from "react";
import { UserPlus, ShieldCheck, ShieldAlert } from "lucide-react";
import { User, UserRole } from "../../types/usuarios/user.types";
import { UserCard } from "../../components/shared/UserCard";
import { UserForm } from "./UserForm";
import { TransferConfirmModal } from "./TransferConfirmModal";

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
  const [transferData, setTransferData] = useState<{
    targetName: string;
    onConfirm: () => void;
  } | null>(null);

  const toggleStatus = (id: number) => {
    setUsers(
      users.map((u) =>
        u.id === id
          ? { ...u, status: u.status === "active" ? "blocked" : "active" }
          : u,
      ),
    );
  };

  const deleteUser = (id: number) => {
    if (users.find((u) => u.id === id)?.role === "ADMIN") return;
    if (window.confirm("¿Seguro que deseas eliminar este usuario?")) {
      setUsers(users.filter((u) => u.id !== id));
    }
  };

  const handleSaveUser = (updatedUser: any) => {
    const currentAdmin = users.find((u) => u.role === "ADMIN");
    if (
      updatedUser.role === "ADMIN" &&
      currentAdmin &&
      currentAdmin.id !== updatedUser.id
    ) {
      setTransferData({
        targetName: updatedUser.name || "Nuevo Usuario",
        onConfirm: () => {
          setUsers((prev) =>
            prev.map((u) => {
              if (u.id === currentAdmin.id)
                return { ...u, role: "USER" as UserRole };
              if (u.id === updatedUser.id)
                return { ...u, ...updatedUser } as User;
              return u;
            }),
          );
          setTransferData(null);
          setShowModal(false);
        },
      });
      return;
    }
    if (editingUser) {
      setUsers(
        users.map((u) =>
          u.id === editingUser.id ? { ...u, ...updatedUser } : u,
        ),
      );
    } else {
      const newUser: User = {
        ...updatedUser,
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
      <div className="bg-amber-50 border-l-4 border-amber-400 p-5 rounded-r-3xl flex items-start gap-5 shadow-sm border border-amber-100">
        <ShieldAlert className="text-amber-600 shrink-0" size={32} />
        <div>
          <p className="text-xs font-black text-amber-800 uppercase tracking-[0.2em] mb-1">
            Seguridad Operativa
          </p>
          <p className="text-xs text-amber-700 font-bold leading-relaxed max-w-3xl">
            Solo un Administrador por dispositivo. El cambio de mando es
            inmediato e irreversible.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-8">
        <div>
          <h1 className="text-3xl font-black text-[#111827] tracking-tighter flex items-center gap-3 uppercase">
            <ShieldCheck className="text-[#2563EB] w-8 h-8" /> Seguridad Local
          </h1>
          <p className="text-sm text-[#6B7280] mt-1 font-bold">
            Gestión de identidades del sistema Valeska.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingUser(null);
            setShowModal(true);
          }}
          className="bg-[#2563EB] text-white px-8 py-4 rounded-[1.5rem] font-black flex items-center gap-2 shadow-xl shadow-blue-200 hover:bg-[#1D4ED8] transition-all text-[11px] uppercase tracking-widest"
        >
          <UserPlus size={18} /> Registrar Personal
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {users.map((user) => (
          <UserCard
            key={user.id}
            user={user}
            onToggleStatus={toggleStatus}
            onDelete={deleteUser}
            onEdit={(u) => {
              setEditingUser(u);
              setShowModal(true);
            }}
          />
        ))}
      </div>

      {showModal && (
        <UserForm
          user={editingUser}
          onClose={() => setShowModal(false)}
          onSave={handleSaveUser}
        />
      )}
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
