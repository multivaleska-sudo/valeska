import { useState, useCallback } from 'react';
import Database from "@tauri-apps/plugin-sql";
import { sileo } from 'sileo';
import { TipoTramite, Situacion } from '../../types/catalogos/catalogo.types';

export function useCatalogosLogic() {
    const [tramites, setTramites] = useState<TipoTramite[]>([]);
    const [situaciones, setSituaciones] = useState<Situacion[]>([]);

    const loadCatalogos = useCallback(async () => {
        try {
            const sqlite = await Database.load("sqlite:valeska.db");

            const resTipos: any[] = await sqlite.select(
                "SELECT id, nombre, activo FROM catalogo_tipos_tramite WHERE deleted_at IS NULL ORDER BY nombre ASC"
            );

            const resSits: any[] = await sqlite.select(
                "SELECT id, nombre, color_hex, activo FROM catalogo_situaciones WHERE deleted_at IS NULL ORDER BY nombre ASC"
            );

            setTramites(
                resTipos.map(t => ({
                    id: t.id,
                    nombre: t.nombre,
                    activo: t.activo === 1
                }))
            );

            setSituaciones(
                resSits.map(s => ({
                    id: s.id,
                    nombre: s.nombre,
                    colorHex: s.color_hex,
                    activo: s.activo === 1
                }))
            );
        } catch (error) {
            console.error("Error cargando catálogos:", error);
            sileo.error({ title: 'Error al cargar los catálogos de la base de datos' });
        }
    }, []);

    const saveTramite = (tramite: TipoTramite) => {
        const promise = async () => {
            const sqlite = await Database.load("sqlite:valeska.db");
            const now = Date.now();
            const isActivo = tramite.activo ? 1 : 0;

            if (tramite.id) {
                await sqlite.execute(
                    "UPDATE catalogo_tipos_tramite SET nombre = $1, activo = $2, updated_at = $3, sync_status = 'LOCAL_UPDATE' WHERE id = $4",
                    [tramite.nombre, isActivo, now, tramite.id]
                );
            } else {
                const newId = crypto.randomUUID();
                await sqlite.execute(
                    "INSERT INTO catalogo_tipos_tramite (id, nombre, activo, created_at, updated_at, sync_status) VALUES ($1, $2, $3, $4, $5, 'LOCAL_INSERT')",
                    [newId, tramite.nombre, isActivo, now, now]
                );
            }
            await loadCatalogos();
        };

        sileo.promise(promise(), {
            loading: { title: 'Guardando trámite...' },
            success: { title: 'Trámite guardado correctamente' },
            error: { title: 'Error al guardar el trámite' }
        });
    };

    const saveSituacion = (situacion: Situacion) => {
        const promise = async () => {
            const sqlite = await Database.load("sqlite:valeska.db");
            const now = Date.now();
            const isActivo = situacion.activo ? 1 : 0;

            if (situacion.id) {
                await sqlite.execute(
                    "UPDATE catalogo_situaciones SET nombre = $1, color_hex = $2, activo = $3, updated_at = $4, sync_status = 'LOCAL_UPDATE' WHERE id = $5",
                    [situacion.nombre, situacion.colorHex, isActivo, now, situacion.id]
                );
            } else {
                const newId = crypto.randomUUID();
                await sqlite.execute(
                    "INSERT INTO catalogo_situaciones (id, nombre, color_hex, activo, created_at, updated_at, sync_status) VALUES ($1, $2, $3, $4, $5, $6, $7, 'LOCAL_INSERT')",
                    [newId, situacion.nombre, situacion.colorHex, isActivo, now, now]
                );
            }
            await loadCatalogos();
        };

        sileo.promise(promise(), {
            loading: { title: 'Guardando situación...' },
            success: { title: 'Situación guardada correctamente' },
            error: { title: 'Error al guardar la situación' }
        });
    };

    const toggleStatus = (id: string, tab: 'tramites' | 'situaciones', currentStatus: boolean) => {
        const promise = async () => {
            const sqlite = await Database.load("sqlite:valeska.db");
            const now = Date.now();
            const nuevoEstado = !currentStatus ? 1 : 0;

            if (tab === 'tramites') {
                await sqlite.execute(
                    "UPDATE catalogo_tipos_tramite SET activo = $1, updated_at = $2, sync_status = 'LOCAL_UPDATE' WHERE id = $3",
                    [nuevoEstado, now, id]
                );
            } else {
                await sqlite.execute(
                    "UPDATE catalogo_situaciones SET activo = $1, updated_at = $2, sync_status = 'LOCAL_UPDATE' WHERE id = $3",
                    [nuevoEstado, now, id]
                );
            }
            await loadCatalogos();
        };

        sileo.promise(promise(), {
            loading: { title: 'Actualizando estado...' },
            success: { title: 'Estado actualizado correctamente' },
            error: { title: 'Error al cambiar de estado' }
        });
    };

    const deleteItem = (id: string, tab: 'tramites' | 'situaciones') => {
        const promise = async () => {
            const sqlite = await Database.load("sqlite:valeska.db");
            const now = Date.now();

            if (tab === 'tramites') {
                await sqlite.execute(
                    "UPDATE catalogo_tipos_tramite SET deleted_at = $1, sync_status = 'LOCAL_UPDATE' WHERE id = $2",
                    [now, id]
                );
            } else {
                await sqlite.execute(
                    "UPDATE catalogo_situaciones SET deleted_at = $1, sync_status = 'LOCAL_UPDATE' WHERE id = $2",
                    [now, id]
                );
            }
            await loadCatalogos();
        };

        sileo.promise(promise(), {
            loading: { title: 'Eliminando registro...' },
            success: { title: 'Registro eliminado correctamente' },
            error: { title: 'Error al intentar eliminar' }
        });
    };

    return {
        tramites,
        situaciones,
        loadCatalogos,
        saveTramite,
        saveSituacion,
        toggleStatus,
        deleteItem
    };
}