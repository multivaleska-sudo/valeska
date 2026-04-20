import { useState, useEffect } from "react";
import { UserPlus, ShieldCheck, ShieldAlert, Loader2 } from "lucide-react";
import {
  useUsuariosLogic,
  UserDB,
} from "../../logic/usuarios/useUsuariosLogic";
import { UserForm } from "./UserForm";
import { TransferConfirmModal } from "./TransferConfirmModal";
import { UserCard } from "../../components/shared/UserCard";

export function UsuariosPage() {
  const {
    users,
    isLoading,
    toggleUserStatus,
    deleteUser,
    saveUser,
    transferAdmin,
    resetToTemporaryPassword,
    exportProvisioningFile,
  } = useUsuariosLogic();

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserDB | null>(null);

  // Estados para verificar los permisos del usuario actual
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");

  const [transferData, setTransferData] = useState<{
    currentAdminId: string;
    targetAdminId: string;
    targetName: string;
  } | null>(null);

  useEffect(() => {
    // Verificamos quién es el usuario logueado actualmente
    const sessionStr = localStorage.getItem("valeska_session_user");
    if (sessionStr) {
      const session = JSON.parse(sessionStr);
      setIsCurrentUserAdmin(session.rol === "ADMIN_CENTRAL");
      setCurrentUserId(session.id);
    }
  }, []);

  const handleSaveUser = async (updatedData: any) => {
    const currentAdmin = users.find((u) => u.rol === "ADMIN_CENTRAL");

    if (
      updatedData.role === "ADMIN_CENTRAL" &&
      currentAdmin &&
      currentAdmin.id !== updatedData.id
    ) {
      setTransferData({
        currentAdminId: currentAdmin.id,
        targetAdminId: updatedData.id,
        targetName: updatedData.name || "Nuevo Usuario",
      });
      return;
    }

    const success = await saveUser(updatedData, !!editingUser);
    if (success) {
      setShowModal(false);
      setEditingUser(null);
    }
  };

  const executeTransfer = async () => {
    if (transferData) {
      await transferAdmin(
        transferData.currentAdminId,
        transferData.targetAdminId,
      );
      setTransferData(null);
      setShowModal(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

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
            inmediato e irreversible. Las contraseñas temporales generadas deben
            ser cambiadas por el usuario.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-8">
        <div>
          <h1 className="text-3xl font-black text-[#111827] tracking-tighter flex items-center gap-3 uppercase">
            <ShieldCheck className="text-[#2563EB] w-8 h-8" /> Seguridad Local
          </h1>
          <p className="text-sm text-[#6B7280] mt-1 font-bold">
            Gestión de identidades del sistema Valeska ({users.length}{" "}
            registrados).
          </p>
        </div>

        {/* OCULTAMOS EL BOTÓN DE REGISTRO SI NO ES ADMINISTRADOR */}
        {isCurrentUserAdmin && (
          <button
            onClick={() => {
              setEditingUser(null);
              setShowModal(true);
            }}
            className="bg-[#2563EB] text-white px-8 py-4 rounded-[1.5rem] font-black flex items-center gap-2 shadow-xl shadow-blue-200 hover:bg-[#1D4ED8] transition-all text-[11px] uppercase tracking-widest"
          >
            <UserPlus size={18} /> Registrar Personal
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {users.map((user) => (
          <UserCard
            key={user.id}
            user={user}
            isCurrentUserAdmin={isCurrentUserAdmin}
            currentUserId={currentUserId}
            onToggleStatus={() => toggleUserStatus(user.id, user.esta_activo)}
            onDelete={() => deleteUser(user.id, currentUserId)}
            onEdit={() => {
              setEditingUser(user);
              setShowModal(true);
            }}
            onResetPassword={() => resetToTemporaryPassword(user.id)}
            onExport={() => exportProvisioningFile(user.id)}
          />
        ))}
      </div>

      {showModal && (
        <UserForm
          user={editingUser}
          isCurrentUserAdmin={isCurrentUserAdmin}
          onClose={() => setShowModal(false)}
          onSave={handleSaveUser}
        />
      )}

      {transferData && (
        <TransferConfirmModal
          targetName={transferData.targetName}
          onConfirm={executeTransfer}
          onCancel={() => setTransferData(null)}
        />
      )}
    </div>
  );
}
