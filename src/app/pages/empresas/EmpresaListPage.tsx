import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Search,
  Plus,
  MoreVertical,
  Eye,
  Edit3,
  Trash2,
  Building2,
  UserCheck,
  MapPin,
  FileText,
  X,
  Inbox,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

// --- MOCK DE DATOS BASADO EN EL SISTEMA ORIGINAL ---
const MOCK_EMPRESAS = [
  {
    id: "1",
    razon_social: "MOTOS DANY E.I.R.L.",
    ruc: "20490878298",
    representante: "DANY ARANZABAL",
    rol: "Concesionario",
    direccion: "JR. TACTA 335 Distrito y Provincia de Tambopata",
    partida: "11004552",
  },
  {
    id: "2",
    razon_social: "MAZA CORPORACION IMPORTADORA E.I.R.L.",
    ruc: "20601234567",
    representante: "HUGO ALLENDE HUILLCA",
    rol: "Proveedor",
    direccion: "AV. LEÓN VELARDE N° 520",
    partida: "11124578",
  },
  {
    id: "3",
    razon_social: "JUAN PEREZ GARCIA",
    ruc: "45789632",
    representante: "EL MISMO",
    rol: "Cliente Final",
    direccion: "JR. PUNO N° 744 - MADRE DE DIOS",
    partida: "---",
  },
];

export function EmpresaListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  // --- LÓGICA DE FILTRADO GLOBAL (Python Style) ---
  const filteredEmpresas = useMemo(() => {
    return MOCK_EMPRESAS.filter((e) => {
      const term = search.toLowerCase();
      return (
        e.razon_social.toLowerCase().includes(term) ||
        e.ruc.includes(term) ||
        e.representante.toLowerCase().includes(term)
      );
    });
  }, [search]);

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      {/* HEADER: BOTÓN DE REGISTRO ENCIMA DE LA LISTA */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Building2 className="text-blue-600 w-7 h-7" /> Directorio de
            Empresas y Entidades
          </h1>
          <p className="text-sm text-gray-500">
            Administración centralizada de clientes, proveedores y apoderados
          </p>
        </div>
        <button
          onClick={() => navigate("/empresas/form")}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-bold hover:bg-blue-700 shadow-md active:scale-95 transition-all text-sm"
        >
          <Plus className="w-5 h-5" /> Nueva Empresa / Entidad
        </button>
      </div>

      {/* BUSCADOR ÚNICO GLOBAL */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-gray-50/30 font-medium"
            placeholder="Buscar por Razón Social, RUC, DNI o Representante Legal..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full text-gray-400"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* TABLA DE ALTA DENSIDAD (Columnas Python Mapped) */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm overflow-x-auto">
        {filteredEmpresas.length > 0 ? (
          <table className="w-full text-left text-sm min-w-[1000px]">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold text-[10px] uppercase tracking-widest">
              <tr>
                <th className="px-5 py-4">Razón Social / Nombre</th>
                <th className="px-5 py-4">RUC / DNI</th>
                <th className="px-5 py-4">Representante Legal</th>
                <th className="px-5 py-4">Rol</th>
                <th className="px-5 py-4">Dirección Fiscal</th>
                <th className="px-5 py-4">Partida</th>
                <th className="px-5 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredEmpresas.map((emp) => (
                <tr
                  key={emp.id}
                  className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                  onDoubleClick={() => navigate(`/empresas/form/${emp.id}`)}
                >
                  <td className="px-5 py-4">
                    <div className="font-bold text-gray-900 leading-tight">
                      {emp.razon_social}
                    </div>
                  </td>
                  <td className="px-5 py-4 font-mono text-blue-600 font-semibold text-xs">
                    {emp.ruc}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 text-gray-700 font-medium">
                      <UserCheck className="w-3.5 h-3.5 text-gray-400" />
                      {emp.representante}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-gray-100 text-gray-600 border border-gray-200">
                      {emp.rol}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-start gap-2 text-gray-500 text-xs max-w-[200px] leading-snug">
                      <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                      <span className="truncate hover:text-clip hover:whitespace-normal transition-all">
                        {emp.direccion}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-mono text-gray-400 text-xs">
                    {emp.partida}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger className="p-2 hover:bg-gray-100 rounded-lg outline-none transition-colors">
                        <MoreVertical className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Portal>
                        <DropdownMenu.Content className="bg-white p-1.5 rounded-xl shadow-2xl border border-gray-100 min-w-[170px] z-50 animate-in fade-in zoom-in duration-150">
                          <DropdownMenu.Item
                            onClick={() => navigate(`/empresas/form/${emp.id}`)}
                            className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 outline-none cursor-pointer rounded-lg text-gray-700 font-medium"
                          >
                            <Eye className="w-4 h-4 text-blue-500" /> Ver Ficha
                            (Detalle)
                          </DropdownMenu.Item>
                          <DropdownMenu.Item
                            onClick={() => navigate(`/empresas/form/${emp.id}`)}
                            className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 outline-none cursor-pointer rounded-lg text-gray-700 font-medium"
                          >
                            <Edit3 className="w-4 h-4 text-amber-500" /> Editar
                            Registro
                          </DropdownMenu.Item>
                          <DropdownMenu.Separator className="h-px bg-gray-100 my-1.5" />
                          <DropdownMenu.Item className="flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 outline-none cursor-pointer font-bold rounded-lg">
                            <Trash2 className="w-4 h-4" /> Eliminar
                          </DropdownMenu.Item>
                        </DropdownMenu.Content>
                      </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400 space-y-3">
            <Inbox className="w-12 h-12 stroke-[1.5px]" />
            <div className="text-center">
              <p className="text-sm font-bold text-gray-500">
                No se encontraron empresas
              </p>
              <p className="text-xs">
                Intenta con otro término o registra una nueva
              </p>
            </div>
          </div>
        )}
      </div>

      {/* CONTADOR DE RESULTADOS */}
      <div className="flex justify-end pr-2">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          Total registros: {filteredEmpresas.length}
        </span>
      </div>
    </div>
  );
}
