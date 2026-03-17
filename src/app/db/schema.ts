import { sqliteTable, text, integer, real, uniqueIndex } from 'drizzle-orm/sqlite-core';

// ============================================================================
// 0. CAMPOS BASE DE SINCRONIZACIÓN (Aplica a casi todas las tablas)
// Para offline-first, NUNCA borramos registros (Soft Delete).
// ============================================================================
const syncColumns = {
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
    deletedAt: integer('deleted_at', { mode: 'timestamp' }), // Null si está activo, Timestamp si se "borró"
    syncStatus: text('sync_status').notNull().default('LOCAL_INSERT'), // LOCAL_INSERT, LOCAL_UPDATE, SYNCED, CONFLICT
};

// ============================================================================
// 1. SEGURIDAD, DISPOSITIVOS Y USUARIOS
// ============================================================================
// Registra cada computadora/laptop física. El Admin puede bloquear una PC entera.
export const dispositivos = sqliteTable('dispositivos', {
    id: text('id').primaryKey(), // UUID
    macAddress: text('mac_address').unique().notNull(),
    nombreEquipo: text('nombre_equipo').notNull(), // Ej. "LAPTOP-RECEPCION-1"
    autorizado: integer('autorizado', { mode: 'boolean' }).notNull().default(false),
    ...syncColumns
});

export const usuarios = sqliteTable('usuarios', {
    id: text('id').primaryKey(), // UUID
    username: text('username').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    rol: text('rol').notNull().default('OPERADOR'), // ADMIN_CENTRAL, ADMIN_LOCAL, OPERADOR
    nombreCompleto: text('nombre_completo').notNull(),
    dispositivoId: text('dispositivo_id').references(() => dispositivos.id), // Anclado a una PC
    estaActivo: integer('esta_activo', { mode: 'boolean' }).notNull().default(true),
    ...syncColumns
});

// ============================================================================
// 2. CATÁLOGOS DINÁMICOS (Combo Boxes)
// ============================================================================
export const catalogoTiposTramite = sqliteTable('catalogo_tipos_tramite', {
    id: text('id').primaryKey(), // UUID
    nombre: text('nombre').notNull().unique(), // Ej. 'Primera Inscripción Vehicular'
    activo: integer('activo', { mode: 'boolean' }).notNull().default(true),
    ...syncColumns
});

export const catalogoSituaciones = sqliteTable('catalogo_situaciones', {
    id: text('id').primaryKey(), // UUID
    nombre: text('nombre').notNull().unique(), // Ej. 'En calificación', 'Inscrito'
    colorHex: text('color_hex').default('#CCCCCC'), // Para pintar los "Status Pills"
    activo: integer('activo', { mode: 'boolean' }).notNull().default(true),
    ...syncColumns
});

// ============================================================================
// 3. ENTIDADES MAESTRAS (Clientes, Vehículos, Empresas Gestoras)
// ============================================================================
export const clientes = sqliteTable('clientes', {
    id: text('id').primaryKey(), // UUID
    tipoDocumento: text('tipo_documento').notNull(), // 'DNI', 'RUC', 'CE'
    numeroDocumento: text('numero_documento').notNull().unique(),
    razonSocialNombres: text('razon_social_nombres').notNull(),
    estadoCivil: text('estado_civil').default('SOLTERO(A)'),
    domicilio: text('domicilio'),
    telefono: text('telefono'),
    ...syncColumns
});

export const vehiculos = sqliteTable('vehiculos', {
    id: text('id').primaryKey(), // UUID
    chasisVin: text('chasis_vin').notNull().unique(),
    placa: text('placa'), // Puede ser nulo si recién se inmatricula
    motor: text('motor'),
    marca: text('marca').notNull(),
    modelo: text('modelo'),
    color: text('color'),
    categoria: text('categoria').default('L3 - B'),
    anioFabricacion: text('anio_fabricacion'),
    anioModelo: text('anio_modelo'),
    ...syncColumns
});

export const empresasGestoras = sqliteTable('empresas_gestoras', {
    id: text('id').primaryKey(), // UUID
    ruc: text('ruc').notNull().unique(),
    razonSocial: text('razon_social').notNull(),
    ...syncColumns
});

// ============================================================================
// 4. EL NÚCLEO: TRÁMITES (NORMALIZADO Y SINTETIZADO)
// ============================================================================
export const tramites = sqliteTable('tramites', {
    id: text('id').primaryKey(), // UUID

    // Identificadores y Relaciones
    codigoVerificacion: text('codigo_verificacion').notNull().unique(),
    tramiteAnio: text('tramite_anio').notNull(),
    clienteId: text('cliente_id').references(() => clientes.id).notNull(),
    vehiculoId: text('vehiculo_id').references(() => vehiculos.id).notNull(),
    tipoTramiteId: text('tipo_tramite_id').references(() => catalogoTiposTramite.id).notNull(),
    situacionId: text('situacion_id').references(() => catalogoSituaciones.id).notNull(),
    usuarioCreadorId: text('usuario_creador_id').references(() => usuarios.id).notNull(),

    // Fechas y Controles Core del Trámite
    nTitulo: text('n_titulo'),
    nFormato: text('n_formato'),
    fechaPresentacion: text('fecha_presentacion').notNull(), // YYYY-MM-DD
    observacionesGenerales: text('observaciones_generales'),

    // Control de Entregas
    entregoTarjeta: integer('entrego_tarjeta', { mode: 'boolean' }).default(false),
    fechaEntregaTarjeta: text('fecha_entrega_tarjeta'),
    entregoPlaca: integer('entrego_placa', { mode: 'boolean' }).default(false),
    fechaEntregaPlaca: text('fecha_entrega_placa'),
    observacionPlaca: text('observacion_placa'),

    ...syncColumns
});

// ============================================================================
// 5. DETALLES DEL TRÁMITE (FINANZAS Y NOTARÍA)
// Separado para no sobrecargar la tabla principal con datos muy específicos.
// Relación 1 a 1 con tramites.
// ============================================================================
export const tramiteDetalles = sqliteTable('tramite_detalles', {
    id: text('id').primaryKey(), // UUID
    tramiteId: text('tramite_id').references(() => tramites.id).notNull().unique(), // Relación 1:1

    // Datos del Presentante
    empresaGestoraId: text('empresa_gestora_id').references(() => empresasGestoras.id),
    presentantePersona: text('presentante_persona'),
    esRepresentante: integer('es_representante', { mode: 'boolean' }).default(false),

    // Boleta y Documentación Aduanera
    tipoBoleta: text('tipo_boleta'), // Manual, Electrónica
    numeroBoleta: text('numero_boleta'),
    fechaBoleta: text('fecha_boleta'),
    dua: text('dua'),
    numFormatoInmatriculacion: text('num_formato_inmatriculacion'),

    // Cláusula de Cancelación
    clausulaMonto: real('clausula_monto'), // Numérico para sumatorias si es necesario
    clausulaFormaPago: text('clausula_forma_pago'),
    clausulaPagoBancarizado: text('clausula_pago_bancarizado'),
    aclaracionDice: text('aclaracion_dice'),
    aclaracionDebeDecir: text('aclaracion_debe_decir'),

    ...syncColumns
});