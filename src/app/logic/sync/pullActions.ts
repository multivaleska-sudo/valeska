import {
  SYNC_ENTITY_TO_LOCAL_KEY,
  SYNC_PULL_ORDER,
  getStoredCursor,
  pullSyncEntity,
  getSyncState,
  saveStoredCursor,
} from "../../services/syncService";
import type { SyncEntityName } from "../../types/sync.types";
import { ensureSyncConflictosSyncStatusColumn } from "./syncUtils";

export class PullApplyError extends Error {
  constructor(
    message: string,
    public readonly originalError?: unknown,
  ) {
    super(message);
    this.name = "PullApplyError";
  }
}

type PullApplyContext = {
  entityName?: string;
  recordId?: unknown;
  payload?: unknown;
};

const redactPullPayload = (payload: unknown) => {
  if (!payload || typeof payload !== "object") return payload;

  const redacted = { ...(payload as Record<string, unknown>) };
  delete redacted.passwordHash;
  delete redacted.password_hash;
  return redacted;
};

const formatPullContext = (context?: PullApplyContext) => {
  if (!context) return "";

  const parts = [
    context.entityName ? `entidad=${context.entityName}` : null,
    context.recordId ? `id=${String(context.recordId)}` : null,
  ].filter(Boolean);

  return parts.length ? ` (${parts.join(", ")})` : "";
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
};

const executeWithRetry = async (
  db: any,
  query: string,
  params: any[],
  retries = 3,
  context?: PullApplyContext,
) => {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      await db.execute(query, params);
      return;
    } catch (error: any) {
      lastError = error;
      const msg = getErrorMessage(error);

      // Manejo de bloqueos (Deadlocks)
      if (msg.includes("database is locked") || msg.includes("busy")) {
        await new Promise((res) => setTimeout(res, 50 + Math.random() * 100));
      } else {
        console.error("SQLite rechazo una fila durante el PULL", {
          entityName: context?.entityName,
          recordId: context?.recordId,
          payload: redactPullPayload(context?.payload),
          error,
        });
        throw new PullApplyError(
          `SQLite rechazo una fila durante el PULL${formatPullContext(context)}. Cursor conservado para reintento: ${msg}`,
          error,
        );
      }
    }
  }
  throw new PullApplyError(
    `SQLite siguio bloqueada despues de ${retries} reintentos. Cursor conservado para reintento.`,
    lastError,
  );
};

const versionParams = (record: any) => {
  const version = Number(record.version ?? 1);
  return [
    version,
    version,
    record.updatedByUserId ?? record.updated_by_user_id ?? null,
    record.updatedByDeviceMac ?? record.updated_by_device_mac ?? null,
  ];
};

const createLocalPullConflictIfNeeded = async (
  sqlite: any,
  tableName: string,
  remote: any,
  identify: (record: any) => string,
) => {
  const id = remote.id;
  if (!id) return false;

  const localRows: any[] = await sqlite.select(
    `SELECT * FROM ${tableName} WHERE id = $1 LIMIT 1`,
    [id],
  );
  const local = localRows[0];
  if (!local || !["LOCAL_INSERT", "LOCAL_UPDATE"].includes(local.sync_status)) {
    return false;
  }

  const remoteVersion = Number(remote.version ?? 0);
  const localBaseVersion = Number(local.base_version ?? local.version ?? 0);
  if (remoteVersion <= localBaseVersion) {
    return false;
  }

  const existingOpen: any[] = await sqlite.select(
    `SELECT id
     FROM sync_conflictos
     WHERE tabla_afectada = $1
       AND registro_id = $2
       AND resuelto = 0
     LIMIT 1`,
    [tableName, id],
  );

  const conflictId = existingOpen[0]?.id || crypto.randomUUID();

  await sqlite.execute(
    `INSERT INTO sync_conflictos
      (id, tabla_afectada, registro_id, identificador_visual,
       datos_locales, datos_remotos, resuelto, fecha_conflicto, sync_status)
     VALUES ($1, $2, $3, $4, $5, $6, 0, $7, 'LOCAL_INSERT')
     ON CONFLICT(id) DO UPDATE SET
       datos_locales = excluded.datos_locales,
       datos_remotos = excluded.datos_remotos,
       resuelto = 0,
       fecha_conflicto = excluded.fecha_conflicto,
       sync_status = 'SYNCED'
     `,
    [conflictId, tableName, id, identify(remote), JSON.stringify(local), JSON.stringify(remote), Date.now()],
  );
  await sqlite.execute(`UPDATE ${tableName} SET sync_status = 'CONFLICT' WHERE id = $1`, [id]);
  return true;
};

const ensureLocalDependency = async (
  sqlite: any,
  input: {
    entityName: string;
    recordId: unknown;
    tableName: string;
    columnName: string;
    value: unknown;
    payload: unknown;
  },
) => {
  const value = input.value;
  if (!value) {
    throw new PullApplyError(
      `No se puede aplicar ${input.entityName} ${String(input.recordId)}: falta ${input.columnName}`,
      { payload: redactPullPayload(input.payload) },
    );
  }

  const rows: any[] = await sqlite.select(
    `SELECT id FROM ${input.tableName} WHERE id = $1 LIMIT 1`,
    [value],
  );
  if (rows.length === 0) {
    throw new PullApplyError(
      `No se puede aplicar ${input.entityName} ${String(input.recordId)}: falta ${input.columnName} ${String(value)}`,
      { payload: redactPullPayload(input.payload) },
    );
  }
};

const ensureTramiteDependencies = async (sqlite: any, record: any) => {
  const tramiteId = record.id;
  const dependencies = [
    {
      tableName: "clientes",
      columnName: "cliente_id",
      value: record.clienteId ?? record.cliente_id,
    },
    {
      tableName: "vehiculos",
      columnName: "vehiculo_id",
      value: record.vehiculoId ?? record.vehiculo_id,
    },
    {
      tableName: "catalogo_tipos_tramite",
      columnName: "tipo_tramite_id",
      value: record.tipoTramiteId ?? record.tipo_tramite_id,
    },
    {
      tableName: "catalogo_situaciones",
      columnName: "situacion_id",
      value: record.situacionId ?? record.situacion_id,
    },
    {
      tableName: "usuarios",
      columnName: "usuario_creador_id",
      value: record.usuarioCreadorId ?? record.usuario_creador_id,
    },
    {
      tableName: "sucursales",
      columnName: "sucursal_id",
      value: record.sucursalId ?? record.sucursal_id,
    },
  ];

  for (const dependency of dependencies) {
    await ensureLocalDependency(sqlite, {
      entityName: "tramite",
      recordId: tramiteId,
      payload: record,
      ...dependency,
    });
  }
};

export async function processPullSync(sqlite: any, pullData: any) {
  const fk = (val: any) => (!val || val === "" ? null : val);
  const str = (val: any) => (val === undefined ? null : val);

  await ensureSyncConflictosSyncStatusColumn(sqlite);

  // Las foreign keys permanecen activas; las referencias circulares se difieren.
  try {
    // 1. Entidades Base y Seguridad
    // NOTA MAESTRA: Todo tiene "WHERE <tabla>.sync_status = 'SYNCED'"
    // Esto es el ESCUDO para que la nube NO aplaste tus ediciones locales.

    for (const suc of pullData.sucursales || []) {
      const esCentral = suc.esCentral ?? suc.es_central ?? false;
      await executeWithRetry(
        sqlite,
        `INSERT INTO sucursales (id, nombre, codigo, direccion, es_central, created_at, updated_at, deleted_at, sync_status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'SYNCED')
         ON CONFLICT(id) DO UPDATE SET 
         nombre=excluded.nombre, codigo=excluded.codigo, direccion=excluded.direccion, es_central=excluded.es_central, 
         created_at=excluded.created_at, updated_at=excluded.updated_at, deleted_at=excluded.deleted_at, sync_status=excluded.sync_status
         WHERE sucursales.sync_status = 'SYNCED'`,
        [
          str(suc.id),
          str(suc.nombre),
          str(suc.codigo),
          str(suc.direccion) || "",
          esCentral ? 1 : 0,
          str(suc.createdAt ?? suc.created_at),
          str(suc.updatedAt ?? suc.updated_at),
          str(suc.deletedAt ?? suc.deleted_at),
        ],
      );
    }

    const usuarioDispositivoLinks: Array<{
      usuarioId: string;
      dispositivoId: string;
      payload: unknown;
    }> = [];
    const dispositivoUsuarioLinks: Array<{
      dispositivoId: string;
      usuarioId: string;
      payload: unknown;
    }> = [];

    for (const disp of pullData.dispositivos || []) {
      const autorizado = disp.autorizado ?? true;
      const dispId = str(disp.id);
      const usuarioId = fk(disp.usuarioId ?? disp.usuario_id);
      if (dispId && usuarioId) {
        dispositivoUsuarioLinks.push({
          dispositivoId: String(dispId),
          usuarioId: String(usuarioId),
          payload: disp,
        });
      }

      await executeWithRetry(
        sqlite,
        `INSERT INTO dispositivos (id, mac_address, nombre_equipo, autorizado, sucursal_id, provision_id, usuario_id, created_at, updated_at, deleted_at, sync_status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'SYNCED')
         ON CONFLICT(id) DO UPDATE SET 
         mac_address=excluded.mac_address, nombre_equipo=excluded.nombre_equipo, autorizado=excluded.autorizado, 
         sucursal_id=excluded.sucursal_id, provision_id=excluded.provision_id, usuario_id=excluded.usuario_id,
         created_at=excluded.created_at, updated_at=excluded.updated_at, deleted_at=excluded.deleted_at, sync_status=excluded.sync_status
         WHERE dispositivos.sync_status = 'SYNCED'`,
        [
          dispId,
          str(disp.macAddress ?? disp.mac_address),
          str(disp.nombreEquipo ?? disp.nombre_equipo),
          autorizado ? 1 : 0,
          fk(disp.sucursalId ?? disp.sucursal_id),
          fk(disp.provisionId ?? disp.provision_id),
          null,
          str(disp.createdAt ?? disp.created_at),
          str(disp.updatedAt ?? disp.updated_at),
          str(disp.deletedAt ?? disp.deleted_at),
        ],
        3,
        { entityName: "dispositivo", recordId: dispId, payload: disp },
      );
    }

    for (const usr of pullData.usuarios || []) {
      const isActivo = usr.estaActivo ?? usr.esta_activo ?? true;
      const pwdHash = usr.passwordHash ?? usr.password_hash;
      const nombreCompl = usr.nombreCompleto ?? usr.nombre_completo;
      const dispId = usr.dispositivoId ?? usr.dispositivo_id;
      const usuarioId = str(usr.id);
      const dispositivoId = fk(dispId);
      if (usuarioId && dispositivoId) {
        usuarioDispositivoLinks.push({
          usuarioId: String(usuarioId),
          dispositivoId: String(dispositivoId),
          payload: usr,
        });
      }

      await executeWithRetry(
        sqlite,
        `INSERT INTO usuarios (id, username, password_hash, rol, nombre_completo, esta_activo, dispositivo_id, created_at, updated_at, deleted_at, sync_status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'SYNCED')
         ON CONFLICT(id) DO UPDATE SET 
         username=excluded.username, password_hash=excluded.password_hash, rol=excluded.rol, nombre_completo=excluded.nombre_completo, 
         esta_activo=excluded.esta_activo, dispositivo_id=excluded.dispositivo_id, created_at=excluded.created_at, updated_at=excluded.updated_at,
         deleted_at=excluded.deleted_at, sync_status=excluded.sync_status
         WHERE usuarios.sync_status = 'SYNCED'`,
        [
          usuarioId,
          str(usr.username),
          str(pwdHash),
          str(usr.rol),
          str(nombreCompl),
          isActivo ? 1 : 0,
          null,
          str(usr.createdAt ?? usr.created_at),
          str(usr.updatedAt ?? usr.updated_at),
          str(usr.deletedAt ?? usr.deleted_at),
        ],
        3,
        { entityName: "usuario", recordId: usuarioId, payload: usr },
      );
    }

    // 2. Catálogos Dinámicos
    for (const link of dispositivoUsuarioLinks) {
      await executeWithRetry(
        sqlite,
        `UPDATE dispositivos
         SET usuario_id = $1
         WHERE id = $2
           AND sync_status = 'SYNCED'
           AND EXISTS (SELECT 1 FROM usuarios WHERE id = $1)`,
        [link.usuarioId, link.dispositivoId],
        3,
        { entityName: "dispositivo", recordId: link.dispositivoId, payload: link.payload },
      );
      await executeWithRetry(
        sqlite,
        `UPDATE usuarios
         SET dispositivo_id = $1
         WHERE id = $2
           AND sync_status = 'SYNCED'
           AND EXISTS (SELECT 1 FROM dispositivos WHERE id = $1)`,
        [link.dispositivoId, link.usuarioId],
        3,
        { entityName: "usuario", recordId: link.usuarioId, payload: link.payload },
      );
    }

    for (const link of usuarioDispositivoLinks) {
      await executeWithRetry(
        sqlite,
        `UPDATE usuarios
         SET dispositivo_id = $1
         WHERE id = $2
           AND sync_status = 'SYNCED'
           AND EXISTS (SELECT 1 FROM dispositivos WHERE id = $1)`,
        [link.dispositivoId, link.usuarioId],
        3,
        { entityName: "usuario", recordId: link.usuarioId, payload: link.payload },
      );
      await executeWithRetry(
        sqlite,
        `UPDATE dispositivos
         SET usuario_id = $1
         WHERE id = $2
           AND sync_status = 'SYNCED'
           AND EXISTS (SELECT 1 FROM usuarios WHERE id = $1)`,
        [link.usuarioId, link.dispositivoId],
        3,
        { entityName: "dispositivo", recordId: link.dispositivoId, payload: link.payload },
      );
    }

    for (const c of pullData.catalogoTiposTramite || []) {
      const isActivo = c.activo ?? true;
      await executeWithRetry(
        sqlite,
        `INSERT INTO catalogo_tipos_tramite (id, nombre, activo, created_at, updated_at, deleted_at, sync_status) 
         VALUES ($1, $2, $3, $4, $5, $6, 'SYNCED')
         ON CONFLICT(id) DO UPDATE SET 
         nombre=excluded.nombre, activo=excluded.activo, created_at=excluded.created_at, 
         updated_at=excluded.updated_at, deleted_at=excluded.deleted_at, sync_status=excluded.sync_status
         WHERE catalogo_tipos_tramite.sync_status = 'SYNCED'`,
        [
          str(c.id),
          str(c.nombre),
          isActivo ? 1 : 0,
          str(c.createdAt ?? c.created_at),
          str(c.updatedAt ?? c.updated_at),
          str(c.deletedAt ?? c.deleted_at),
        ],
      );
    }

    for (const s of pullData.catalogoSituaciones || []) {
      const isActivo = s.activo ?? true;
      await executeWithRetry(
        sqlite,
        `INSERT INTO catalogo_situaciones (id, nombre, color_hex, activo, created_at, updated_at, deleted_at, sync_status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'SYNCED')
         ON CONFLICT(id) DO UPDATE SET 
         nombre=excluded.nombre, color_hex=excluded.color_hex, activo=excluded.activo, created_at=excluded.created_at, 
         updated_at=excluded.updated_at, deleted_at=excluded.deleted_at, sync_status=excluded.sync_status
         WHERE catalogo_situaciones.sync_status = 'SYNCED'`,
        [
          str(s.id),
          str(s.nombre),
          str(s.colorHex ?? s.color_hex),
          isActivo ? 1 : 0,
          str(s.createdAt ?? s.created_at),
          str(s.updatedAt ?? s.updated_at),
          str(s.deletedAt ?? s.deleted_at),
        ],
      );
    }

    // 3. Maestros
    for (const cli of pullData.clientes || []) {
      if (await createLocalPullConflictIfNeeded(sqlite, "clientes", cli, (record) => record.numeroDocumento ?? record.numero_documento ?? record.id)) {
        continue;
      }
      await executeWithRetry(
        sqlite,
        `INSERT INTO clientes (id, tipo_documento, numero_documento, razon_social_nombres, estado_civil, domicilio, telefono, created_at, updated_at, deleted_at, sync_status, version, base_version, updated_by_user_id, updated_by_device_mac) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'SYNCED', $11, $12, $13, $14)
         ON CONFLICT(id) DO UPDATE SET 
         tipo_documento=excluded.tipo_documento, numero_documento=excluded.numero_documento, razon_social_nombres=excluded.razon_social_nombres, 
         estado_civil=excluded.estado_civil, domicilio=excluded.domicilio, telefono=excluded.telefono, created_at=excluded.created_at, 
         updated_at=excluded.updated_at, deleted_at=excluded.deleted_at, sync_status=excluded.sync_status,
         version=excluded.version, base_version=excluded.base_version, updated_by_user_id=excluded.updated_by_user_id, updated_by_device_mac=excluded.updated_by_device_mac
         WHERE clientes.sync_status = 'SYNCED'`,
        [
          str(cli.id),
          str(cli.tipoDocumento ?? cli.tipo_documento),
          str(cli.numeroDocumento ?? cli.numero_documento),
          str(cli.razonSocialNombres ?? cli.razon_social_nombres),
          str(cli.estadoCivil ?? cli.estado_civil),
          str(cli.domicilio),
          str(cli.telefono),
          str(cli.createdAt ?? cli.created_at),
          str(cli.updatedAt ?? cli.updated_at),
          str(cli.deletedAt ?? cli.deleted_at),
          ...versionParams(cli),
        ],
      );
    }

    for (const v of pullData.vehiculos || []) {
      if (await createLocalPullConflictIfNeeded(sqlite, "vehiculos", v, (record) => record.placa ?? record.chasisVin ?? record.chasis_vin ?? record.id)) {
        continue;
      }
      await executeWithRetry(
        sqlite,
        `INSERT INTO vehiculos (id, chasis_vin, placa, motor, marca, modelo, color, carroceria, categoria, anio_fabricacion, anio_modelo, created_at, updated_at, deleted_at, sync_status, version, base_version, updated_by_user_id, updated_by_device_mac) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'SYNCED', $15, $16, $17, $18)
         ON CONFLICT(id) DO UPDATE SET 
         chasis_vin=excluded.chasis_vin, placa=excluded.placa, motor=excluded.motor, marca=excluded.marca, modelo=excluded.modelo, 
         color=excluded.color, carroceria=excluded.carroceria, categoria=excluded.categoria, anio_fabricacion=excluded.anio_fabricacion, anio_modelo=excluded.anio_modelo, 
         created_at=excluded.created_at, updated_at=excluded.updated_at, deleted_at=excluded.deleted_at, sync_status=excluded.sync_status,
         version=excluded.version, base_version=excluded.base_version, updated_by_user_id=excluded.updated_by_user_id, updated_by_device_mac=excluded.updated_by_device_mac
         WHERE vehiculos.sync_status = 'SYNCED'`,
        [
          str(v.id),
          str(v.chasisVin ?? v.chasis_vin),
          str(v.placa),
          str(v.motor),
          str(v.marca),
          str(v.modelo),
          str(v.color),
          str(v.carroceria),
          str(v.categoria),
          str(v.anioFabricacion ?? v.anio_fabricacion),
          str(v.anioModelo ?? v.anio_modelo),
          str(v.createdAt ?? v.created_at),
          str(v.updatedAt ?? v.updated_at),
          str(v.deletedAt ?? v.deleted_at),
          ...versionParams(v),
        ],
      );
    }

    for (const emp of pullData.empresasGestoras || []) {
      await executeWithRetry(
        sqlite,
        `INSERT INTO empresas_gestoras (id, ruc, razon_social, direccion, created_at, updated_at, deleted_at, sync_status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'SYNCED')
         ON CONFLICT(id) DO UPDATE SET 
         ruc=excluded.ruc, razon_social=excluded.razon_social, direccion=excluded.direccion, 
         created_at=excluded.created_at, updated_at=excluded.updated_at, deleted_at=excluded.deleted_at, sync_status=excluded.sync_status
         WHERE empresas_gestoras.sync_status = 'SYNCED'`,
        [
          str(emp.id),
          str(emp.ruc),
          str(emp.razonSocial ?? emp.razon_social),
          str(emp.direccion),
          str(emp.createdAt ?? emp.created_at),
          str(emp.updatedAt ?? emp.updated_at),
          str(emp.deletedAt ?? emp.deleted_at),
        ],
      );
    }

    for (const rep of pullData.representantesLegales || []) {
      await executeWithRetry(
        sqlite,
        `INSERT INTO representantes_legales (id, empresa_gestora_id, dni, nombres, primer_apellido, segundo_apellido, partida_registral, oficina_registral, domicilio, created_at, updated_at, deleted_at, sync_status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'SYNCED')
         ON CONFLICT(id) DO UPDATE SET 
         empresa_gestora_id=excluded.empresa_gestora_id, dni=excluded.dni, nombres=excluded.nombres, primer_apellido=excluded.primer_apellido, 
         segundo_apellido=excluded.segundo_apellido, partida_registral=excluded.partida_registral, oficina_registral=excluded.oficina_registral, 
         domicilio=excluded.domicilio, created_at=excluded.created_at, updated_at=excluded.updated_at, deleted_at=excluded.deleted_at, sync_status=excluded.sync_status
         WHERE representantes_legales.sync_status = 'SYNCED'`,
        [
          str(rep.id),
          fk(rep.empresaGestoraId ?? rep.empresa_gestora_id),
          str(rep.dni) || "S/N",
          str(rep.nombres) || "S/N",
          str(rep.primerApellido ?? rep.primer_apellido) || "S/N",
          str(rep.segundoApellido ?? rep.segundo_apellido),
          str(rep.partidaRegistral ?? rep.partida_registral),
          str(rep.oficinaRegistral ?? rep.oficina_registral),
          str(rep.domicilio),
          str(rep.createdAt ?? rep.created_at),
          str(rep.updatedAt ?? rep.updated_at),
          str(rep.deletedAt ?? rep.deleted_at),
        ],
      );
    }

    for (const pre of pullData.presentantes || []) {
      await executeWithRetry(
        sqlite,
        `INSERT INTO presentantes (id, dni, primer_apellido, segundo_apellido, nombres, created_at, updated_at, deleted_at, sync_status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'SYNCED')
         ON CONFLICT(id) DO UPDATE SET 
         dni=excluded.dni, primer_apellido=excluded.primer_apellido, segundo_apellido=excluded.segundo_apellido, nombres=excluded.nombres, 
         created_at=excluded.created_at, updated_at=excluded.updated_at, deleted_at=excluded.deleted_at, sync_status=excluded.sync_status
         WHERE presentantes.sync_status = 'SYNCED'`,
        [
          str(pre.id),
          str(pre.dni) || "S/N",
          str(pre.primerApellido ?? pre.primer_apellido) || "S/N",
          str(pre.segundoApellido ?? pre.segundo_apellido),
          str(pre.nombres) || "S/N",
          str(pre.createdAt ?? pre.created_at),
          str(pre.updatedAt ?? pre.updated_at),
          str(pre.deletedAt ?? pre.deleted_at),
        ],
      );
    }

    for (const tpl of pullData.plantillasDocumentos || []) {
      const isActivo = tpl.activo ?? true;
      await executeWithRetry(
        sqlite,
        `INSERT INTO plantillas_documentos (id, nombre_documento, contenido_html, orientacion_papel, activo, created_at, updated_at, deleted_at, sync_status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'SYNCED')
         ON CONFLICT(id) DO UPDATE SET 
         nombre_documento=excluded.nombre_documento, contenido_html=excluded.contenido_html, orientacion_papel=excluded.orientacion_papel, 
         activo=excluded.activo, created_at=excluded.created_at, updated_at=excluded.updated_at, deleted_at=excluded.deleted_at, sync_status=excluded.sync_status
         WHERE plantillas_documentos.sync_status = 'SYNCED'`,
        [
          str(tpl.id),
          str(tpl.nombreDocumento ?? tpl.nombre_documento),
          str(tpl.contenidoHtml ?? tpl.contenido_html),
          str(tpl.orientacionPapel ?? tpl.orientacion_papel),
          isActivo ? 1 : 0,
          str(tpl.createdAt ?? tpl.created_at),
          str(tpl.updatedAt ?? tpl.updated_at),
          str(tpl.deletedAt ?? tpl.deleted_at),
        ],
      );
    }

    for (const msgTpl of pullData.messageTemplates || []) {
      await executeWithRetry(
        sqlite,
        `INSERT INTO message_templates (id, name, content, created_at, updated_at, deleted_at, sync_status) 
         VALUES ($1, $2, $3, $4, $5, $6, 'SYNCED')
         ON CONFLICT(id) DO UPDATE SET 
         name=excluded.name, content=excluded.content, created_at=excluded.created_at, 
         updated_at=excluded.updated_at, deleted_at=excluded.deleted_at, sync_status=excluded.sync_status
         WHERE message_templates.sync_status = 'SYNCED'`,
        [
          str(msgTpl.id),
          str(msgTpl.name),
          str(msgTpl.content),
          str(msgTpl.createdAt ?? msgTpl.created_at),
          str(msgTpl.updatedAt ?? msgTpl.updated_at),
          str(msgTpl.deletedAt ?? msgTpl.deleted_at),
        ],
      );
    }

    // 4. Core Trámites (Si alguno falla, lo omitimos, el resto pasa)
    for (const t of pullData.tramites || []) {
      if (await createLocalPullConflictIfNeeded(sqlite, "tramites", t, (record) => record.nTitulo ?? record.n_titulo ?? record.codigoVerificacion ?? record.codigo_verificacion ?? record.id)) {
        continue;
      }
      await ensureTramiteDependencies(sqlite, t);
      await executeWithRetry(
        sqlite,
        `INSERT INTO tramites (id, codigo_verificacion, tramite_anio, cliente_id, vehiculo_id, tipo_tramite_id, situacion_id, usuario_creador_id, sucursal_id, n_titulo, n_formato, fecha_presentacion, observaciones_generales, tarjeta_en_oficina, fecha_tarjeta_en_oficina, placa_en_oficina, fecha_placa_en_oficina, entrego_tarjeta, fecha_entrega_tarjeta, metodo_entrega_tarjeta, entrego_placa, fecha_entrega_placa, metodo_entrega_placa, observacion_placa, created_at, updated_at, deleted_at, sync_status, version, base_version, updated_by_user_id, updated_by_device_mac) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, 'SYNCED', $28, $29, $30, $31)
         ON CONFLICT(id) DO UPDATE SET 
         codigo_verificacion=excluded.codigo_verificacion, tramite_anio=excluded.tramite_anio, cliente_id=excluded.cliente_id, vehiculo_id=excluded.vehiculo_id, 
         tipo_tramite_id=excluded.tipo_tramite_id, situacion_id=excluded.situacion_id, usuario_creador_id=excluded.usuario_creador_id, sucursal_id=excluded.sucursal_id, 
         n_titulo=excluded.n_titulo, n_formato=excluded.n_formato, fecha_presentacion=excluded.fecha_presentacion, observaciones_generales=excluded.observaciones_generales, 
         tarjeta_en_oficina=excluded.tarjeta_en_oficina, fecha_tarjeta_en_oficina=excluded.fecha_tarjeta_en_oficina, placa_en_oficina=excluded.placa_en_oficina, 
         fecha_placa_en_oficina=excluded.fecha_placa_en_oficina, entrego_tarjeta=excluded.entrego_tarjeta, fecha_entrega_tarjeta=excluded.fecha_entrega_tarjeta, 
         metodo_entrega_tarjeta=excluded.metodo_entrega_tarjeta, entrego_placa=excluded.entrego_placa, fecha_entrega_placa=excluded.fecha_entrega_placa, 
         metodo_entrega_placa=excluded.metodo_entrega_placa, observacion_placa=excluded.observacion_placa, created_at=excluded.created_at, 
         updated_at=excluded.updated_at, deleted_at=excluded.deleted_at, sync_status=excluded.sync_status,
         version=excluded.version, base_version=excluded.base_version, updated_by_user_id=excluded.updated_by_user_id, updated_by_device_mac=excluded.updated_by_device_mac
         WHERE tramites.sync_status = 'SYNCED'`,
        [
          str(t.id),
          str(t.codigoVerificacion ?? t.codigo_verificacion),
          str(t.tramiteAnio ?? t.tramite_anio),
          fk(t.clienteId ?? t.cliente_id),
          fk(t.vehiculoId ?? t.vehiculo_id),
          fk(t.tipoTramiteId ?? t.tipo_tramite_id),
          fk(t.situacionId ?? t.situacion_id),
          fk(t.usuarioCreadorId ?? t.usuario_creador_id),
          fk(t.sucursalId ?? t.sucursal_id),
          str(t.nTitulo ?? t.n_titulo),
          str(t.nFormato ?? t.n_formato),
          str(t.fechaPresentacion ?? t.fecha_presentacion),
          str(t.observacionesGenerales ?? t.observaciones_generales),
          (t.tarjetaEnOficina ?? t.tarjeta_en_oficina) ? 1 : 0,
          str(t.fechaTarjetaEnOficina ?? t.fecha_tarjeta_en_oficina),
          (t.placaEnOficina ?? t.placa_en_oficina) ? 1 : 0,
          str(t.fechaPlacaEnOficina ?? t.fecha_placa_en_oficina),
          (t.entregoTarjeta ?? t.entrego_tarjeta) ? 1 : 0,
          str(t.fechaEntregaTarjeta ?? t.fecha_entrega_tarjeta),
          str(t.metodoEntregaTarjeta ?? t.metodo_entrega_tarjeta),
          (t.entregoPlaca ?? t.entrego_placa) ? 1 : 0,
          str(t.fechaEntregaPlaca ?? t.fecha_entrega_placa),
          str(t.metodoEntregaPlaca ?? t.metodo_entrega_placa),
          str(t.observacionPlaca ?? t.observacion_placa),
          str(t.createdAt ?? t.created_at),
          str(t.updatedAt ?? t.updated_at),
          str(t.deletedAt ?? t.deleted_at),
          ...versionParams(t),
        ],
        3,
        { entityName: "tramite", recordId: t.id, payload: t },
      );
    }

    for (const td of pullData.tramiteDetalles || []) {
      if (await createLocalPullConflictIfNeeded(sqlite, "tramite_detalles", td, (record) => record.tramiteId ?? record.tramite_id ?? record.id)) {
        continue;
      }
      await executeWithRetry(
        sqlite,
        `INSERT INTO tramite_detalles (id, tramite_id, empresa_gestora_id, representante_legal_id, presentante_id, tipo_boleta, numero_boleta, fecha_boleta, dua, num_formato_inmatriculacion, numero_recibo_tramite, clausula_monto, clausula_forma_pago, clausula_pago_bancarizado, aclaracion_dice, aclaracion_debe_decir, created_at, updated_at, deleted_at, sync_status, version, base_version, updated_by_user_id, updated_by_device_mac) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, 'SYNCED', $20, $21, $22, $23)
         ON CONFLICT(id) DO UPDATE SET 
         tramite_id=excluded.tramite_id, empresa_gestora_id=excluded.empresa_gestora_id, representante_legal_id=excluded.representante_legal_id, 
         presentante_id=excluded.presentante_id, tipo_boleta=excluded.tipo_boleta, numero_boleta=excluded.numero_boleta, fecha_boleta=excluded.fecha_boleta, 
         dua=excluded.dua, num_formato_inmatriculacion=excluded.num_formato_inmatriculacion, numero_recibo_tramite=excluded.numero_recibo_tramite, 
         clausula_monto=excluded.clausula_monto, clausula_forma_pago=excluded.clausula_forma_pago, clausula_pago_bancarizado=excluded.clausula_pago_bancarizado, 
         aclaracion_dice=excluded.aclaracion_dice, aclaracion_debe_decir=excluded.aclaracion_debe_decir, created_at=excluded.created_at, 
         updated_at=excluded.updated_at, deleted_at=excluded.deleted_at, sync_status=excluded.sync_status,
         version=excluded.version, base_version=excluded.base_version, updated_by_user_id=excluded.updated_by_user_id, updated_by_device_mac=excluded.updated_by_device_mac
         WHERE tramite_detalles.sync_status = 'SYNCED'`,
        [
          str(td.id),
          fk(td.tramiteId ?? td.tramite_id),
          fk(td.empresaGestoraId ?? td.empresa_gestora_id),
          fk(td.representanteLegalId ?? td.representante_legal_id),
          fk(td.presentanteId ?? td.presentante_id),
          str(td.tipoBoleta ?? td.tipo_boleta),
          str(td.numeroBoleta ?? td.numero_boleta),
          str(td.fechaBoleta ?? td.fecha_boleta),
          str(td.dua),
          str(td.numFormatoInmatriculacion ?? td.num_formato_inmatriculacion),
          str(td.numeroReciboTramite ?? td.numero_recibo_tramite),
          td.clausulaMonto ?? td.clausula_monto ?? null,
          str(td.clausulaFormaPago ?? td.clausula_forma_pago),
          str(td.clausulaPagoBancarizado ?? td.clausula_pago_bancarizado),
          str(td.aclaracionDice ?? td.aclaracion_dice),
          str(td.aclaracionDebeDecir ?? td.aclaracion_debe_decir),
          str(td.createdAt ?? td.created_at),
          str(td.updatedAt ?? td.updated_at),
          str(td.deletedAt ?? td.deleted_at),
          ...versionParams(td),
        ],
        3,
        { entityName: "tramite_detalle", recordId: td.id, payload: td },
      );
    }

    // 5. Perfiles de Padron
    if (pullData.perfilesGestor && pullData.perfilesGestor.length > 0) {
      for (const p of pullData.perfilesGestor) {
        await executeWithRetry(
          sqlite,
          `INSERT INTO perfiles_gestor (id, calidad, nombre, concesionario, importador, created_at, updated_at, deleted_at, sync_status) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'SYNCED')
           ON CONFLICT(id) DO UPDATE SET 
           calidad=excluded.calidad, nombre=excluded.nombre, concesionario=excluded.concesionario, importador=excluded.importador, 
           updated_at=excluded.updated_at, deleted_at=excluded.deleted_at, sync_status='SYNCED'`,
          [p.id, str(p.calidad), str(p.nombre), str(p.concesionario), str(p.importador), str(p.createdAt), str(p.updatedAt), str(p.deletedAt)],
        );
      }
    }

    // 6. Conflictos de Sincronización
    for (const conf of pullData.conflictos || []) {
      await executeWithRetry(
        sqlite,
        `INSERT INTO sync_conflictos (id, tabla_afectada, registro_id, identificador_visual, datos_locales, datos_remotos, resuelto, fecha_conflicto, sync_status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'SYNCED')
         ON CONFLICT(id) DO UPDATE SET 
         tabla_afectada=excluded.tabla_afectada, registro_id=excluded.registro_id, identificador_visual=excluded.identificador_visual, 
         datos_locales=excluded.datos_locales, datos_remotos=excluded.datos_remotos, resuelto=excluded.resuelto, fecha_conflicto=excluded.fecha_conflicto,
         sync_status='SYNCED'`,
        [
          str(conf.id),
          str(conf.tablaAfectada ?? conf.tabla_afectada),
          str(conf.registroId ?? conf.registro_id),
          str(conf.identificadorVisual ?? conf.identificador_visual),
          typeof conf.datosLocales === "string"
            ? conf.datosLocales
            : JSON.stringify(conf.datosLocales),
          typeof conf.datosRemotos === "string"
            ? conf.datosRemotos
            : JSON.stringify(conf.datosRemotos),
          conf.resuelto ? 1 : 0,
          new Date(conf.fechaConflicto ?? conf.fecha_conflicto).getTime(),
        ],
      );
    }
  } finally {
    // Las foreign keys quedan activas; las referencias circulares se reparan en dos fases.
  }
}

export const executePull = async (
  config: { apiUrl: string },
  _userId: string,
  sqlite: any,
  isRetry: boolean = false,
): Promise<{
  success: boolean;
  data: any;
  pulledByEntity: Partial<Record<SyncEntityName, number>>;
  totalPulled: number;
}> => {
  try {
    try {
      await sqlite.execute("PRAGMA journal_mode = WAL;", []);
      await sqlite.execute("PRAGMA busy_timeout = 10000;", []);
      await sqlite.execute("PRAGMA synchronous = NORMAL;", []);
    } catch (e) {
      console.warn("No se pudo fijar PRAGMAS en Sincronizacion", e);
    }

    const aggregateData: Record<string, any[]> = {};
    const pulledByEntity: Partial<Record<SyncEntityName, number>> = {};
    let lastServerTimestamp = new Date().toISOString();

    let remoteState: any = null;
    if (!isRetry) {
      try {
        remoteState = await getSyncState(config.apiUrl, SYNC_PULL_ORDER);
      } catch (err) {
        console.warn("No se pudo obtener el estado remoto de sync, se hara pull completo:", err);
      }
    }

    for (const entityName of SYNC_PULL_ORDER) {
      const localKey = SYNC_ENTITY_TO_LOCAL_KEY[entityName];
      aggregateData[localKey] = [];

      let cursor = isRetry ? null : await getStoredCursor(sqlite, entityName);
      let hasMore = true;

      if (!isRetry && remoteState && cursor && cursor.cursorTimestamp) {
        const entityState = remoteState.entities?.find((e: any) => e.entityName === entityName);
        if (entityState && entityState.maxTimestamp) {
          const localTime = new Date(cursor.cursorTimestamp).getTime();
          const remoteTime = new Date(entityState.maxTimestamp).getTime();
          // Consideramos que el remoteTime de "1970" es igual o menor a todo,
          // o si el localTime es mayor o igual al último modificado en remoto.
          if (localTime >= remoteTime) {
            console.log(`[PULL] Omitiendo ${entityName}: maxTimestamp=${entityState.maxTimestamp} <= localCursor=${cursor.cursorTimestamp}`);
            continue;
          }
        }
      }

      while (hasMore) {
        const response = await pullSyncEntity(config.apiUrl, {
          entityName,
          cursorTimestamp: cursor?.cursorTimestamp,
          lastId: cursor?.lastId,
          limit: 100,
        });

        const records = response.records || [];
        pulledByEntity[entityName] =
          (pulledByEntity[entityName] || 0) + records.length;

        try {
          if (records.length > 0) {
            await processPullSync(sqlite, buildEntityPullData(entityName, records));
            aggregateData[localKey].push(...records);
          }

          if (response.nextCursor) {
            await saveStoredCursor(sqlite, entityName, response.nextCursor);
            cursor = response.nextCursor;
          }
        } catch (pageError: any) {
          const msg = pageError?.message || String(pageError);
          throw new PullApplyError(
            `No se pudo aplicar la pagina de ${entityName}. No se avanzo el cursor local. Detalle: ${msg}`,
            pageError,
          );
        }

        hasMore = response.hasMore && Boolean(response.nextCursor);
        lastServerTimestamp = response.timestamp || lastServerTimestamp;
      }
    }

    localStorage.setItem("valeska_last_sync", lastServerTimestamp);

    return {
      success: true,
      pulledByEntity,
      totalPulled: Object.values(pulledByEntity).reduce(
        (sum, count) => sum + (count || 0),
        0,
      ),
      data: {
        ...aggregateData,
        conflictos: aggregateData.conflictosResueltos || [],
        serverTimestamp: lastServerTimestamp,
      },
    };
  } catch (error: any) {
    console.error("Error critico en Pull Sync:", error);
    throw error;
  }
};

const buildEntityPullData = (
  entityName: SyncEntityName,
  records: Record<string, unknown>[],
) => {
  if (entityName === "sync_conflicto") {
    return { conflictos: records };
  }

  return { [SYNC_ENTITY_TO_LOCAL_KEY[entityName]]: records };
};
