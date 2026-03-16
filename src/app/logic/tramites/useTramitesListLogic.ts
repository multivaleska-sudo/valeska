import { useState, useMemo, useEffect } from 'react';
import { MOCK_TRAMITES } from '../../mocks/tramites.mock';

export function useTramitesListLogic() {
    // Estados para los Filtros de Búsqueda
    const [searchCliente, setSearchCliente] = useState("");
    const [searchTitulo, setSearchTitulo] = useState("");
    const [searchDNI, setSearchDNI] = useState("");
    const [filterSituacion, setFilterSituacion] = useState("");

    // Nuevos Estados para Rango de Fechas
    const [fechaInicio, setFechaInicio] = useState("");
    const [fechaFin, setFechaFin] = useState("");

    // Estados para Paginación
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Lógica de Filtrado Dinámico
    const filteredTramites = useMemo(() => {
        return MOCK_TRAMITES.filter((tramite) => {
            const matchCliente = tramite.cliente.toLowerCase().includes(searchCliente.toLowerCase());
            const matchTitulo = tramite.n_titulo.toLowerCase().includes(searchTitulo.toLowerCase());
            const matchDNI = tramite.dni.includes(searchDNI);
            const matchSituacion = filterSituacion ? tramite.situacion === filterSituacion : true;

            // Filtrado por Fechas (Matemático de strings YYYY-MM-DD)
            let matchFecha = true;
            if (fechaInicio) {
                matchFecha = matchFecha && tramite.fecha_presentacion >= fechaInicio;
            }
            if (fechaFin) {
                matchFecha = matchFecha && tramite.fecha_presentacion <= fechaFin;
            }

            return matchCliente && matchTitulo && matchDNI && matchSituacion && matchFecha;
        });
    }, [searchCliente, searchTitulo, searchDNI, filterSituacion, fechaInicio, fechaFin]);

    // Lógica de Paginación Matemática
    const totalPages = Math.ceil(filteredTramites.length / itemsPerPage);
    const paginatedTramites = filteredTramites.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Resetear siempre a la página 1 si el usuario manipula CUALQUIER filtro
    useEffect(() => {
        setCurrentPage(1);
    }, [searchCliente, searchTitulo, searchDNI, filterSituacion, fechaInicio, fechaFin]);

    return {
        filtros: {
            searchCliente, setSearchCliente,
            searchTitulo, setSearchTitulo,
            searchDNI, setSearchDNI,
            filterSituacion, setFilterSituacion,
            fechaInicio, setFechaInicio,
            fechaFin, setFechaFin
        },
        paginacion: {
            currentPage, setCurrentPage,
            totalPages,
            itemsPerPage,
            totalItems: filteredTramites.length
        },
        data: paginatedTramites
    };
}