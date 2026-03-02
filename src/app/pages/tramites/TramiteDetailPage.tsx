import { useParams, useNavigate } from "react-router";
import { ArrowLeft, AlertTriangle, FileText, History, RefreshCw, Calendar, Check } from "lucide-react";
import * as Tabs from "@radix-ui/react-tabs";
import { StatusPill } from "../../components/StatusPill";
import { SyncChip } from "../../components/SyncChip";
import { ConflictChip } from "../../components/ConflictChip";
import { DeliveryCard } from "../../components/DeliveryCard";
import { useState } from "react";

export function TramiteDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hasConflict] = useState(id === "T-2024-0348");
  const [delivered, setDelivered] = useState(false);

  const tramiteData = {
    codigo: id || "T-2024-0345",
    cliente: "Juan Pérez García",
    dni: "12345678",
    vehiculo: "ABC-123",
    marca: "Toyota",
    modelo: "Corolla",
    año: "2020",
    vin: "1HGBH41JXMN109186",
    motor: "4T1BF1FK2CU123456",
    situacion: "En proceso",
    sucursal: "Principal",
    fechaCreacion: "2024-03-01",
    ultimaModificacion: "2024-03-01 14:30",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/tramites")}
          className="p-2 hover:bg-white rounded-md transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#6B7280]" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-[#111827]">
            Trámite {tramiteData.codigo}
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Cliente: {tramiteData.cliente}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusPill status={tramiteData.situacion} />
          <SyncChip synced={true} />
          {hasConflict && <ConflictChip />}
        </div>
      </div>

      {/* Conflict Banner */}
      {hasConflict && (
        <div className="bg-[#FEE2E2] border border-[#FCA5A5] rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-[#DC2626]">
              Conflicto de sincronización detectado
            </h3>
            <p className="text-sm text-[#991B1B] mt-1">
              Este trámite está en modo solo lectura hasta que se resuelva el conflicto.
            </p>
          </div>
          <button
            onClick={() => navigate(`/central/conflictos/${id}`)}
            className="px-4 py-2 bg-[#DC2626] text-white rounded-md hover:bg-[#B91C1C] transition-colors text-sm shrink-0"
          >
            Ver conflicto
          </button>
        </div>
      )}

      {/* Tabs */}
      <Tabs.Root defaultValue="resumen">
        <Tabs.List className="flex gap-1 border-b border-[#E5E7EB]">
          <Tabs.Trigger
            value="resumen"
            className="px-4 py-2 text-sm font-medium text-[#6B7280] border-b-2 border-transparent data-[state=active]:text-[#2563EB] data-[state=active]:border-[#2563EB] transition-colors"
          >
            Resumen
          </Tabs.Trigger>
          <Tabs.Trigger
            value="documentos"
            className="px-4 py-2 text-sm font-medium text-[#6B7280] border-b-2 border-transparent data-[state=active]:text-[#2563EB] data-[state=active]:border-[#2563EB] transition-colors"
          >
            Documentos
          </Tabs.Trigger>
          <Tabs.Trigger
            value="historial"
            className="px-4 py-2 text-sm font-medium text-[#6B7280] border-b-2 border-transparent data-[state=active]:text-[#2563EB] data-[state=active]:border-[#2563EB] transition-colors"
          >
            Historial
          </Tabs.Trigger>
          <Tabs.Trigger
            value="sync"
            className="px-4 py-2 text-sm font-medium text-[#6B7280] border-b-2 border-transparent data-[state=active]:text-[#2563EB] data-[state=active]:border-[#2563EB] transition-colors"
          >
            Sincronización
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="resumen" className="mt-6 space-y-6">
          {/* Cliente Info */}
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
            <h2 className="text-lg font-semibold text-[#111827] mb-4">
              Información del Cliente
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-[#6B7280]">Nombre completo</label>
                <p className="text-sm font-medium text-[#111827] mt-1">
                  {tramiteData.cliente}
                </p>
              </div>
              <div>
                <label className="text-sm text-[#6B7280]">DNI</label>
                <p className="text-sm font-medium text-[#111827] mt-1">
                  {tramiteData.dni}
                </p>
              </div>
            </div>
          </div>

          {/* Vehicle Info */}
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
            <h2 className="text-lg font-semibold text-[#111827] mb-4">
              Información del Vehículo
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-[#6B7280]">Placa</label>
                <p className="text-sm font-medium text-[#111827] mt-1 font-mono">
                  {tramiteData.vehiculo}
                </p>
              </div>
              <div>
                <label className="text-sm text-[#6B7280]">Marca/Modelo</label>
                <p className="text-sm font-medium text-[#111827] mt-1">
                  {tramiteData.marca} {tramiteData.modelo}
                </p>
              </div>
              <div>
                <label className="text-sm text-[#6B7280]">Año</label>
                <p className="text-sm font-medium text-[#111827] mt-1">
                  {tramiteData.año}
                </p>
              </div>
              <div>
                <label className="text-sm text-[#6B7280]">VIN</label>
                <p className="text-sm font-medium text-[#111827] mt-1 font-mono">
                  {tramiteData.vin}
                </p>
              </div>
              <div className="col-span-2">
                <label className="text-sm text-[#6B7280]">Número de Motor</label>
                <p className="text-sm font-medium text-[#111827] mt-1 font-mono">
                  {tramiteData.motor}
                </p>
              </div>
            </div>
          </div>

          {/* Delivery Card */}
          <DeliveryCard 
            delivered={delivered}
            onToggleDelivery={setDelivered}
            onGenerateReceipt={() => navigate("/recibos/new")}
          />
        </Tabs.Content>

        <Tabs.Content value="documentos" className="mt-6">
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-6 text-center">
            <FileText className="w-12 h-12 text-[#6B7280] mx-auto mb-3" />
            <p className="text-sm text-[#6B7280]">
              <button
                onClick={() => navigate(`/tramites/${id}/documents`)}
                className="text-[#2563EB] hover:underline"
              >
                Ir al Centro de Documentos
              </button>
            </p>
          </div>
        </Tabs.Content>

        <Tabs.Content value="historial" className="mt-6">
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
            <div className="space-y-4">
              <AuditTimelineItem
                date="2024-03-01 14:30"
                user="Admin Usuario"
                action="Modificó información del vehículo"
              />
              <AuditTimelineItem
                date="2024-03-01 10:15"
                user="Admin Usuario"
                action="Creó el trámite"
              />
            </div>
          </div>
        </Tabs.Content>

        <Tabs.Content value="sync" className="mt-6">
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-[#16A34A] rounded-full"></div>
                <span className="text-[#6B7280]">2024-03-01 14:35</span>
                <span className="text-[#111827]">Sincronizado correctamente</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-[#2563EB] rounded-full"></div>
                <span className="text-[#6B7280]">2024-03-01 10:20</span>
                <span className="text-[#111827]">Creado localmente</span>
              </div>
            </div>
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}

function AuditTimelineItem({ date, user, action }: { date: string; user: string; action: string }) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="w-2 h-2 bg-[#2563EB] rounded-full mt-2"></div>
        <div className="w-px h-full bg-[#E5E7EB] mt-2"></div>
      </div>
      <div className="flex-1 pb-4">
        <p className="text-sm text-[#6B7280]">{date}</p>
        <p className="text-sm text-[#111827] font-medium mt-1">{action}</p>
        <p className="text-sm text-[#6B7280] mt-1">Por: {user}</p>
      </div>
    </div>
  );
}
