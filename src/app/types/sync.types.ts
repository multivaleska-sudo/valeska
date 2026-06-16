export const SYNC_ENTITY_NAMES = [
  "tramite",
  "tramite_detalle",
  "catalogo_tipo_tramite",
  "catalogo_situacion",
  "cliente",
  "vehiculo",
  "empresa_gestora",
  "plantilla_documento",
  "presentante",
  "representante_legal",
  "perfil_gestor",
  "message_template",
  "usuario",
  "dispositivo",
  "sucursal",
  "sync_conflicto",
] as const;

export type SyncEntityName = (typeof SYNC_ENTITY_NAMES)[number];

export type SyncStatus =
  | "SYNCED"
  | "LOCAL_INSERT"
  | "LOCAL_UPDATE"
  | "LOCAL_DELETE"
  | "CONFLICT";

export type SyncOutboxStatus =
  | "PENDING"
  | "QUEUED"
  | "PROCESSING"
  | "COMPLETED"
  | "COMPLETED_WITH_CONFLICTS"
  | "FAILED"
  | "DEAD_LETTER";

export interface BaseSyncDto {
  id: string;
  updatedAt: string;
  syncStatus?: string;
  version?: number;
  baseVersion?: number;
  updatedByUserId?: string | null;
  updatedByDeviceMac?: string | null;
}

export interface PushSyncChunkDto {
  syncSessionId: string;
  entityName: SyncEntityName;
  chunkIndex: number;
  totalChunks: number;
  records: Record<string, unknown>[];
}

export interface PullSyncQueryDto {
  entityName: SyncEntityName;
  cursorTimestamp?: string;
  lastId?: string;
  limit?: number;
}

export interface SyncCursor {
  cursorTimestamp: string;
  lastId: string;
}

export interface PullSyncResponse<TRecord = Record<string, unknown>> {
  entityName: SyncEntityName;
  records: TRecord[];
  nextCursor: SyncCursor | null;
  hasMore: boolean;
  timestamp: string;
}

export interface PushAcceptedResponse {
  accepted: true;
  jobId: string | null;
  outboxId: string;
  syncSessionId: string;
  entityName: SyncEntityName;
  chunkIndex: number;
  status: SyncOutboxStatus;
}

export interface PushStatusResponse {
  outboxId: string;
  jobId: string | null;
  syncSessionId: string;
  entityName: SyncEntityName;
  chunkIndex: number;
  totalChunks: number;
  status: SyncOutboxStatus;
  attempts: number;
  conflictCount?: number;
  queuedAt: string | null;
  processingStartedAt: string | null;
  completedAt: string | null;
  failedAt: string | null;
  lastError: string | null;
}

export interface SucursalSyncDto extends BaseSyncDto {
  nombre: string;
  codigo: string | null;
  direccion?: string | null;
  esCentral?: boolean;
}

export interface DispositivoSyncDto extends BaseSyncDto {
  macAddress: string;
  nombreEquipo: string;
  autorizado?: boolean;
  provisionId?: string | null;
  sucursalId: string;
  usuarioId?: string | null;
}

export interface UsuarioSyncDto extends BaseSyncDto {
  username: string;
  passwordHash: string;
  rol?: string;
  nombreCompleto: string;
  estaActivo?: boolean;
  dispositivoId?: string | null;
}

export interface CatalogoTipoTramiteSyncDto extends BaseSyncDto {
  nombre: string;
  activo?: boolean;
}

export interface CatalogoSituacionSyncDto extends BaseSyncDto {
  nombre: string;
  colorHex?: string;
  activo?: boolean;
}

export interface ClienteSyncDto extends BaseSyncDto {
  tipoDocumento: string;
  numeroDocumento?: string | null;
  razonSocialNombres?: string | null;
  estadoCivil?: string | null;
  domicilio?: string | null;
  telefono?: string | null;
}

export interface VehiculoSyncDto extends BaseSyncDto {
  chasisVin?: string | null;
  placa?: string | null;
  motor?: string | null;
  marca?: string | null;
  modelo?: string | null;
  color?: string | null;
  carroceria?: string | null;
  categoria?: string | null;
  anioFabricacion?: string | null;
  anioModelo?: string | null;
}

export interface EmpresaGestoraSyncDto extends BaseSyncDto {
  ruc?: string | null;
  razonSocial: string;
  direccion?: string | null;
}

export interface PlantillaDocumentoSyncDto extends BaseSyncDto {
  nombreDocumento: string;
  contenidoHtml: string;
  orientacionPapel?: string;
  activo?: boolean;
}

export interface PresentanteSyncDto extends BaseSyncDto {
  dni?: string | null;
  nombres?: string | null;
  primerApellido?: string | null;
  segundoApellido?: string | null;
}

export interface RepresentanteLegalSyncDto extends BaseSyncDto {
  empresaGestoraId: string;
  dni?: string | null;
  nombres?: string | null;
  primerApellido?: string | null;
  segundoApellido?: string | null;
  partidaRegistral?: string | null;
  oficinaRegistral?: string | null;
  domicilio?: string | null;
}

export interface PerfilGestorSyncDto extends BaseSyncDto {
  calidad?: string | null;
  nombre?: string | null;
  concesionario?: string | null;
  importador?: string | null;
}

export interface MessageTemplateSyncDto extends BaseSyncDto {
  name: string;
  content: string;
}

export interface TramiteSyncDto extends BaseSyncDto {
  codigoVerificacion?: string | null;
  tramiteAnio: string;
  clienteId: string;
  vehiculoId: string;
  tipoTramiteId: string;
  situacionId: string;
  usuarioCreadorId: string;
  sucursalId: string;
  nTitulo?: string | null;
  nFormato?: string | null;
  fechaPresentacion: string;
  observacionesGenerales?: string | null;
  tarjetaEnOficina?: boolean;
  fechaTarjetaEnOficina?: string | null;
  placaEnOficina?: boolean;
  fechaPlacaEnOficina?: string | null;
  entregoTarjeta?: boolean;
  fechaEntregaTarjeta?: string | null;
  metodoEntregaTarjeta?: string | null;
  entregoPlaca?: boolean;
  fechaEntregaPlaca?: string | null;
  metodoEntregaPlaca?: string | null;
  observacionPlaca?: string | null;
}

export interface TramiteDetalleSyncDto extends BaseSyncDto {
  tramiteId: string;
  empresaGestoraId?: string | null;
  representanteLegalId?: string | null;
  presentanteId?: string | null;
  tipoBoleta?: string | null;
  numeroBoleta?: string | null;
  fechaBoleta?: string | null;
  dua?: string | null;
  numFormatoInmatriculacion?: string | null;
  numeroReciboTramite?: string | null;
  clausulaMonto?: number | null;
  clausulaFormaPago?: string | null;
  clausulaPagoBancarizado?: string | null;
  aclaracionDice?: string | null;
  aclaracionDebeDecir?: string | null;
}

export interface SyncConflictoSyncDto {
  id: string;
  tablaAfectada: string;
  registroId: string;
  identificadorVisual?: string | null;
  datosLocales: string;
  datosRemotos: string;
  resuelto?: boolean;
  fechaConflicto: string;
}

export interface SyncAuthContext {
  accessToken: string;
  deviceMac: string;
}
