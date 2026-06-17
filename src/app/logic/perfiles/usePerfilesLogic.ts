import { useState, useEffect, useCallback } from "react";
import { getDb } from "../../db/localDb";
import { sileo } from "sileo";

export interface PerfilGestor {
    id: string;
    calidad: string;
    nombre: string;
    concesionario: string | null;
    importador: string | null;
}

export function usePerfilesLogic() {
    const [perfiles, setPerfiles] = useState<PerfilGestor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPerfil, setEditingPerfil] = useState<PerfilGestor | null>(null);

    const [perfilToDelete, setPerfilToDelete] = useState<string | null>(null);

    const loadPerfiles = useCallback(async () => {
        try {
            setIsLoading(true);
            const db = await getDb();
            const result = await db.select<PerfilGestor[]>(
                "SELECT id, calidad, nombre, concesionario, importador FROM perfiles_gestor WHERE deleted_at IS NULL ORDER BY nombre ASC"
            );
            setPerfiles(result || []);
        } catch (error) {
            console.error("Error al cargar perfiles:", error);
            sileo.error({ title: "Error", description: "No se pudieron cargar los perfiles." });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadPerfiles();
    }, [loadPerfiles]);

    const handleSave = async (data: Partial<PerfilGestor>) => {
        try {
            const db = await getDb();
            const now = Date.now();

            if (editingPerfil) {
                await db.execute(
                    "UPDATE perfiles_gestor SET calidad = $1, nombre = $2, concesionario = $3, importador = $4, updated_at = $5, sync_status = 'LOCAL_UPDATE' WHERE id = $6",
                    [data.calidad, data.nombre, data.concesionario || null, data.importador || null, now, editingPerfil.id]
                );
                sileo.success({ title: "Actualizado", description: "Perfil actualizado correctamente." });
            } else {
                const newId = crypto.randomUUID();
                await db.execute(
                    "INSERT INTO perfiles_gestor (id, calidad, nombre, concesionario, importador, created_at, updated_at, sync_status) VALUES ($1, $2, $3, $4, $5, $6, $7, 'LOCAL_INSERT')",
                    [newId, data.calidad, data.nombre, data.concesionario || null, data.importador || null, now, now]
                );
                sileo.success({ title: "Creado", description: "Perfil creado correctamente." });
            }
            setIsModalOpen(false);
            setEditingPerfil(null);
            loadPerfiles();
        } catch (error) {
            console.error("Error al guardar:", error);
            sileo.error({ title: "Error", description: "No se pudo guardar el perfil." });
        }
    };

    // Lógica actualizada para eliminar en 3 pasos: solicitar, cancelar, confirmar
    const requestDelete = (id: string) => setPerfilToDelete(id);

    const cancelDelete = () => setPerfilToDelete(null);

    const confirmDelete = async () => {
        if (!perfilToDelete) return;
        try {
            const db = await getDb();
            const now = Date.now();
            await db.execute(
                "UPDATE perfiles_gestor SET deleted_at = $1, sync_status = 'LOCAL_UPDATE' WHERE id = $2",
                [now, perfilToDelete]
            );
            sileo.success({ title: "Eliminado", description: "Perfil eliminado de la base de datos." });
            setPerfilToDelete(null);
            loadPerfiles();
        } catch (error) {
            console.error("Error al eliminar:", error);
            sileo.error({ title: "Error", description: "No se pudo eliminar el perfil." });
        }
    };

    const openNewModal = () => {
        setEditingPerfil(null);
        setIsModalOpen(true);
    };

    const openEditModal = (perfil: PerfilGestor) => {
        setEditingPerfil(perfil);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingPerfil(null);
    };

    return {
        perfiles,
        isLoading,
        isModalOpen,
        editingPerfil,
        openNewModal,
        openEditModal,
        closeModal,
        handleSave,
        // Exportamos las nuevas funciones de eliminación
        perfilToDelete,
        requestDelete,
        cancelDelete,
        confirmDelete
    };
}