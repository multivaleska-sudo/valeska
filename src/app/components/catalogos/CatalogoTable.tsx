import React from "react";
import { Pencil, Trash2, CheckCircle2, XCircle } from "lucide-react";

interface CatalogoTableProps {
  data: any[];
  type: "tramites" | "situaciones";
  onEdit: (item: any) => void;
  onToggleStatus: (id: string, currentStatus: boolean) => void;
  onDeleteRequest: (item: any) => void; // Cambiado para solicitar borrado
}

export const CatalogoTable: React.FC<CatalogoTableProps> = ({
  data,
  type,
  onEdit,
  onToggleStatus,
  onDeleteRequest,
}) => {
  if (data.length === 0) {
    return (
      <div className="p-8 text-center border border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
        <p className="text-slate-500 dark:text-slate-400">
          No se encontraron registros.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-slate-200 dark:border-slate-800 overflow-hidden">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800">
          <tr>
            <th className="px-4 py-3">Nombre</th>
            {type === "situaciones" && (
              <th className="px-4 py-3 w-32">Color</th>
            )}
            <th className="px-4 py-3 w-32">Estado</th>
            <th className="px-4 py-3 w-24 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950">
          {data.map((row) => (
            <tr
              key={row.id}
              className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group"
            >
              <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                {row.nombre}
              </td>
              {type === "situaciones" && (
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-5 h-5 rounded-full shadow-sm border border-slate-200 dark:border-slate-700"
                      style={{ backgroundColor: row.colorHex }}
                    />
                    <span className="text-xs text-slate-500 font-mono uppercase">
                      {row.colorHex}
                    </span>
                  </div>
                </td>
              )}
              <td className="px-4 py-3">
                <button
                  onClick={() => onToggleStatus(row.id, row.activo)}
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                    row.activo
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 hover:bg-emerald-200"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200"
                  }`}
                >
                  {row.activo ? (
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                  ) : (
                    <XCircle className="w-3 h-3 mr-1" />
                  )}
                  {row.activo ? "Activo" : "Inactivo"}
                </button>
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onEdit(row)}
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteRequest(row)} // Llama al modal
                    className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
