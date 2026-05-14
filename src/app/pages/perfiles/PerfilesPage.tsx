import { useState } from "react";
import { Contact, Plus, Search, Edit2, Trash2 } from "lucide-react";
import { usePerfilesLogic } from "../../logic/perfiles/usePerfilesLogic";
import { PerfilFormModal } from "../../components/perfiles/PerfilFormModal";

export function PerfilesPage() {
  const {
    perfiles,
    isLoading,
    isModalOpen,
    editingPerfil,
    openNewModal,
    openEditModal,
    closeModal,
    handleSave,
    perfilToDelete,
    requestDelete,
    confirmDelete,
    cancelDelete,
  } = usePerfilesLogic();

  const [searchTerm, setSearchTerm] = useState("");

  const filteredPerfiles = perfiles.filter(
    (p) =>
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.importador &&
        p.importador.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  return (
    <div className="p-8 space-y-6 bg-[#F6F7FB] min-h-screen font-sans animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#111827] flex items-center gap-2">
            <Contact className="text-blue-600" size={28} />
            Perfiles de Gestor
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Gestión y empadronamiento de perfiles y calidades operativas.
          </p>
        </div>
        <button
          onClick={openNewModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 shadow-sm shadow-blue-600/20 transition-all"
        >
          <Plus size={18} /> Nuevo Perfil
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-2">
          <div className="relative w-full max-w-md">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Buscar por Nombre o Importador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/80 text-gray-500 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Calidad</th>
                <th className="px-6 py-4">Nombre (Razón Social)</th>
                <th className="px-6 py-4">Concesionario</th>
                <th className="px-6 py-4">Importador</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-gray-400 font-medium"
                  >
                    Cargando perfiles...
                  </td>
                </tr>
              ) : filteredPerfiles.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-gray-400 font-medium"
                  >
                    No se encontraron resultados.
                  </td>
                </tr>
              ) : (
                filteredPerfiles.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-md">
                        {p.calidad}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-800">
                      {p.nombre}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {p.concesionario || "-"}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {p.importador || "-"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => requestDelete(p.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PerfilFormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSave}
        editingPerfil={editingPerfil}
      />

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      {perfilToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="text-red-500" size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              ¿Eliminar Perfil?
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Esta acción no se puede deshacer. El perfil será eliminado y los
              cambios se sincronizarán con la nube central.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={cancelDelete}
                className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm shadow-red-600/20 transition-all"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
