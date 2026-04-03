import { sqliteTable, text, integer, real, uniqueIndex, index } from 'drizzle-orm/sqlite-core';

// ============================================================================
// 0. CAMPOS BASE DE SINCRONIZACIÓN
// ============================================================================
const syncColumns = {
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
    deletedAt: integer('deleted_at', { mode: 'timestamp' }),
    syncStatus: text('sync_status').notNull().default('LOCAL_INSERT'),
};

// ============================================================================
// 1. ORGANIZACIÓN Y SUCURSALES
// ============================================================================
export const sucursales = sqliteTable('sucursales', {
    id: text('id').primaryKey(),
    nombre: text('nombre').notNull(),
    direccion: text('direccion'),
    esCentral: integer('es_central', { mode: 'boolean' }).notNull().default(false),
    ...syncColumns
});

// ============================================================================
// 2. SEGURIDAD, DISPOSITIVOS Y USUARIOS
// ============================================================================
export const dispositivos = sqliteTable('dispositivos', {
    id: text('id').primaryKey(),
    macAddress: text('mac_address').notNull(),
    nombreEquipo: text('nombre_equipo').notNull(),
    autorizado: integer('autorizado', { mode: 'boolean' }).notNull().default(false),
    sucursalId: text('sucursal_id').references(() => sucursales.id).notNull(),
    provisionId: text('provision_id'),
    ...syncColumns
}, (table) => ({
    macIdx: uniqueIndex('mac_address_idx').on(table.macAddress),
    provisionIdx: uniqueIndex('provision_id_idx').on(table.provisionId),
    sucursalIdx: index('disp_sucursal_idx').on(table.sucursalId),
}));

export const usuarios = sqliteTable('usuarios', {
    id: text('id').primaryKey(),
    username: text('username').notNull(),
    passwordHash: text('password_hash').notNull(),
    rol: text('rol').notNull().default('OPERADOR'),
    nombreCompleto: text('nombre_completo').notNull(),
    dispositivoId: text('dispositivo_id').references(() => dispositivos.id),
    estaActivo: integer('esta_activo', { mode: 'boolean' }).notNull().default(true),
    ...syncColumns
}, (table) => ({
    usernameIdx: uniqueIndex('username_idx').on(table.username),
    dispositivoIdx: index('usr_dispositivo_idx').on(table.dispositivoId),
}));

// ============================================================================
// 3. CATÁLOGOS DINÁMICOS
// ============================================================================
export const catalogoTiposTramite = sqliteTable('catalogo_tipos_tramite', {
    id: text('id').primaryKey(),
    nombre: text('nombre').notNull(),
    activo: integer('activo', { mode: 'boolean' }).notNull().default(true),
    ...syncColumns
}, (table) => ({
    nombreTipoIdx: uniqueIndex('tipo_tramite_nombre_idx').on(table.nombre),
}));

export const catalogoSituaciones = sqliteTable('catalogo_situaciones', {
    id: text('id').primaryKey(),
    nombre: text('nombre').notNull(),
    colorHex: text('color_hex').default('#CCCCCC'),
    activo: integer('activo', { mode: 'boolean' }).notNull().default(true),
    ...syncColumns
}, (table) => ({
    nombreSitIdx: uniqueIndex('situacion_nombre_idx').on(table.nombre),
}));

// ============================================================================
// 4. ENTIDADES MAESTRAS
// ============================================================================
export const clientes = sqliteTable('clientes', {
    id: text('id').primaryKey(),
    tipoDocumento: text('tipo_documento').notNull(),
    numeroDocumento: text('numero_documento').notNull(),
    razonSocialNombres: text('razon_social_nombres').notNull(),
    estadoCivil: text('estado_civil').default('SOLTERO(A)'),
    domicilio: text('domicilio'),
    telefono: text('telefono'),
    ...syncColumns
}, (table) => ({
    documentoIdx: uniqueIndex('cliente_documento_idx').on(table.numeroDocumento),
    nombreIdx: index('cliente_nombre_idx').on(table.razonSocialNombres),
}));

export const vehiculos = sqliteTable('vehiculos', {
    id: text('id').primaryKey(),
    chasisVin: text('chasis_vin').notNull(),
    placa: text('placa'),
    motor: text('motor'),
    marca: text('marca').notNull(),
    modelo: text('modelo'),
    color: text('color'),
    categoria: text('categoria').default('L3 - B'),
    anioFabricacion: text('anio_fabricacion'),
    anioModelo: text('anio_modelo'),
    ...syncColumns
}, (table) => ({
    vinIdx: uniqueIndex('vehiculo_vin_idx').on(table.chasisVin),
    placaIdx: index('vehiculo_placa_idx').on(table.placa),
}));

export const empresasGestoras = sqliteTable('empresas_gestoras', {
    id: text('id').primaryKey(),
    ruc: text('ruc'),
    razonSocial: text('razon_social').notNull(),
    direccion: text('direccion'),
    ...syncColumns
}, (table) => ({
    rucIdx: uniqueIndex('empresa_ruc_idx').on(table.ruc),
}));

export const presentantes = sqliteTable('presentantes', {
    id: text('id').primaryKey(),
    partidaRegistral: text('partida_registral'),
    oficinaRegistral: text('oficina_registral'),
    domicilio: text('domicilio'),
    dni: text('dni').notNull(),
    primerApellido: text('primer_apellido').notNull(),
    segundoApellido: text('segundo_apellido'),
    nombres: text('nombres').notNull(),
    ...syncColumns
}, (table) => ({
    dniIdx: uniqueIndex('presentante_dni_idx').on(table.dni),
}));


// ============================================================================
// 5. TRÁMITES (NÚCLEO Y DETALLES)
// ============================================================================
export const tramites = sqliteTable('tramites', {
    id: text('id').primaryKey(),

    codigoVerificacion: text('codigo_verificacion').notNull(),
    tramiteAnio: text('tramite_anio').notNull(),
    clienteId: text('cliente_id').references(() => clientes.id).notNull(),
    vehiculoId: text('vehiculo_id').references(() => vehiculos.id).notNull(),
    tipoTramiteId: text('tipo_tramite_id').references(() => catalogoTiposTramite.id).notNull(),
    situacionId: text('situacion_id').references(() => catalogoSituaciones.id).notNull(),
    usuarioCreadorId: text('usuario_creador_id').references(() => usuarios.id).notNull(),
    sucursalId: text('sucursal_id').references(() => sucursales.id).notNull(),

    nTitulo: text('n_titulo'),
    nFormato: text('n_formato'),
    fechaPresentacion: text('fecha_presentacion').notNull(),
    observacionesGenerales: text('observaciones_generales'),

    tarjetaEnOficina: integer('tarjeta_en_oficina', { mode: 'boolean' }).default(false),
    fechaTarjetaEnOficina: text('fecha_tarjeta_en_oficina'),
    placaEnOficina: integer('placa_en_oficina', { mode: 'boolean' }).default(false),
    fechaPlacaEnOficina: text('fecha_placa_en_oficina'),

    entregoTarjeta: integer('entrego_tarjeta', { mode: 'boolean' }).default(false),
    fechaEntregaTarjeta: text('fecha_entrega_tarjeta'),
    metodoEntregaTarjeta: text('metodo_entrega_tarjeta'),

    entregoPlaca: integer('entrego_placa', { mode: 'boolean' }).default(false),
    fechaEntregaPlaca: text('fecha_entrega_placa'),
    metodoEntregaPlaca: text('metodo_entrega_placa'),

    observacionPlaca: text('observacion_placa'),

    ...syncColumns
}, (table) => ({
    codigoVerifIdx: uniqueIndex('tramite_codigo_idx').on(table.codigoVerificacion),

    clienteTrmIdx: index('trm_cliente_idx').on(table.clienteId),
    vehiculoTrmIdx: index('trm_vehiculo_idx').on(table.vehiculoId),
    sucursalTrmIdx: index('trm_sucursal_idx').on(table.sucursalId),
    fechaPresentacionIdx: index('trm_fecha_idx').on(table.fechaPresentacion),
}));

export const tramiteDetalles = sqliteTable('tramite_detalles', {
    id: text('id').primaryKey(),
    tramiteId: text('tramite_id').references(() => tramites.id).notNull(),

    empresaGestoraId: text('empresa_gestora_id').references(() => empresasGestoras.id),

    presentanteId: text('presentante_id').references(() => presentantes.id),

    tipoBoleta: text('tipo_boleta'),
    numeroBoleta: text('numero_boleta'),
    fechaBoleta: text('fecha_boleta'),
    dua: text('dua'),
    numFormatoInmatriculacion: text('num_formato_inmatriculacion'),
    numeroReciboTramite: text('numero_recibo_tramite'),

    clausulaMonto: real('clausula_monto'),
    clausulaFormaPago: text('clausula_forma_pago'),
    clausulaPagoBancarizado: text('clausula_pago_bancarizado'),
    aclaracionDice: text('aclaracion_dice'),
    aclaracionDebeDecir: text('aclaracion_debe_decir'),

    ...syncColumns
}, (table) => ({
    tramiteDetalleUniqIdx: uniqueIndex('detalle_tramite_idx').on(table.tramiteId),
}));

// ============================================================================
// 6. MOTOR DE PLANTILLAS Y DOCUMENTOS
// ============================================================================
export const plantillasDocumentos = sqliteTable('plantillas_documentos', {
    id: text('id').primaryKey(),
    nombreDocumento: text('nombre_documento').notNull(),
    contenidoHtml: text('contenido_html').notNull(),
    orientacionPapel: text('orientacion_papel').default('PORTRAIT'), // PORTRAIT o LANDSCAPE
    activo: integer('activo', { mode: 'boolean' }).notNull().default(true),
    ...syncColumns
}, (table) => ({
    nombreDocIdx: uniqueIndex('plantilla_nombre_idx').on(table.nombreDocumento),
}));

// ============================================================================
// 7. GESTIÓN DE CONFLICTOS DE SINCRONIZACIÓN
// ============================================================================
export const syncConflictos = sqliteTable('sync_conflictos', {
    id: text('id').primaryKey(),
    tablaAfectada: text('tabla_afectada').notNull(), // ej: 'tramites', 'clientes'
    registroId: text('registro_id').notNull(),       // El ID original del trámite o cliente
    identificadorVisual: text('identificador_visual'), // ej: 'Trámite T-2024-0348'
    datosLocales: text('datos_locales').notNull(),   // JSON con la versión de SQLite
    datosRemotos: text('datos_remotos').notNull(),   // JSON con la versión de la nube
    resuelto: integer('resuelto', { mode: 'boolean' }).notNull().default(false),
    fechaConflicto: integer('fecha_conflicto', { mode: 'timestamp' }).notNull(),
}, (table) => ({
    resueltoIdx: index('conflicto_resuelto_idx').on(table.resuelto),
    registroIdx: index('conflicto_registro_idx').on(table.registroId),
}));