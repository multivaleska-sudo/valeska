import React, { useState, useMemo, useEffect } from "react";
import { Search, Plus } from "lucide-react";
import { useCatalogosLogic } from "../../logic/catalogos/useCatalogosLogic";
import { CatalogoTable } from "../../components/catalogos/CatalogoTable";
import { CatalogoFormModal } from "../../components/catalogos/CatalogoFormModal";
import { DeleteConfirmModal } from "../../components/catalogos/DeleteConfirmModal";

export default function CatalogosPage() {
  const [activeTab, setActiveTab] = useState<"tramites" | "situaciones">(
    "tramites",
  );
  const [searchQuery, setSearchQuery] = useState("");

  // States para Formularios
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  // States para Borrado
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any | null>(null);

  // Hook Logic con Drizzle
  const {
    tramites,
    situaciones,
    loadCatalogos,
    saveTramite,
    saveSituacion,
    toggleStatus,
    deleteItem,
  } = useCatalogosLogic();

  // Cargar datos al montar
  useEffect(() => {
    loadCatalogos();
  }, []);

  // Filtros de búsqueda
  const filteredTramites = useMemo(
    () =>
      tramites.filter((t) =>
        t.nombre.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [tramites, searchQuery],
  );

  const filteredSituaciones = useMemo(
    () =>
      situaciones.filter((s) =>
        s.nombre.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [situaciones, searchQuery],
  );

  // Manejadores del Formulario
  const handleOpenModal = (item: any = null) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSaveModal = (data: any) => {
    if (activeTab === "tramites") saveTramite(data);
    else saveSituacion(data);
  };

  // Manejadores de Borrado
  const handleDeleteRequest = (item: any) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      deleteItem(itemToDelete.id, activeTab);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-slate-100 p-6 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Catálogos Dinámicos
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Administra los tipos de trámite y los estados de situación para la
            aplicación.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-950 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 sm:p-6">
          <div className="flex space-x-1 bg-slate-100 dark:bg-slate-900/50 p-1 rounded-lg w-fit mb-6">
            <button
              onClick={() => setActiveTab("tramites")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === "tramites"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              Tipos de Trámite
            </button>
            <button
              onClick={() => setActiveTab("situaciones")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === "situaciones"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              Situaciones (Estados)
            </button>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="relative w-full sm:max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar por nombre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-800 rounded-md bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={() => handleOpenModal()}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors w-full sm:w-auto justify-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Registro
            </button>
          </div>

          <div className="mt-4">
            <CatalogoTable
              type={activeTab}
              data={
                activeTab === "tramites"
                  ? filteredTramites
                  : filteredSituaciones
              }
              onEdit={handleOpenModal}
              onToggleStatus={(id, status) =>
                toggleStatus(id, activeTab, status)
              }
              onDeleteRequest={handleDeleteRequest} // <- Enviamos al manejador del Modal
            />
          </div>
        </div>
      </div>

      {/* Modales */}
      <CatalogoFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveModal}
        type={activeTab}
        initialData={editingItem}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        itemName={itemToDelete?.nombre || ""}
      />
    </div>
  );
}
