import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// TABLA DE CLIENTES (Personas Naturales o Jurídicas)
export const clientes = sqliteTable('clientes', {
    id: text('id').primaryKey(), // Usaremos un UUID
    tipoDocumento: text('tipo_documento').notNull(), // 'DNI' o 'RUC'
    numeroDocumento: text('numero_documento').notNull().unique(),
    nombreCompleto: text('nombre_completo').notNull(), // Nombres o Razón Social
    estadoCivil: text('estado_civil'), // Ej. 'SOLTERO'
    domicilio: text('domicilio'), // Dirección extraída del XML/PDF
    correo: text('correo'), // Ej. multivaleska@gmail.com
    telefono: text('telefono'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// TABLA DE VEHÍCULOS
export const vehiculos = sqliteTable('vehiculos', {
    id: text('id').primaryKey(), // UUID
    vin: text('vin').notNull().unique(), // Ej. MD2A92CX...
    dua: text('dua').notNull(), // Declaración Única de Aduanas
    marca: text('marca').notNull(), // Ej. BAJAJ, LIFAN
    modelo: text('modelo'),
    anioModelo: integer('anio_modelo'), // Ej. 2025
    motor: text('motor'), // Número de motor
    color: text('color'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// TABLA DE TRÁMITES (El centro del negocio)
export const tramites = sqliteTable('tramites', {
    id: text('id').primaryKey(), // UUID
    codigo: text('codigo').notNull().unique(), // Ej. TRM-2025-001
    clienteId: text('cliente_id').references(() => clientes.id).notNull(),
    vehiculoId: text('vehiculo_id').references(() => vehiculos.id).notNull(),

    // Datos Financieros (Del XML y Recibos)
    precioSoles: real('precio_soles').notNull(), // Ej. 10450.00
    formaPago: text('forma_pago').notNull(), // Ej. 'AL CRÉDITO', 'CONTADO'
    montoPagado: real('monto_pagado').default(0),
    saldoPendiente: real('saldo_pendiente').default(0),

    // Estado del Trámite
    estado: text('estado').notNull().default('PENDIENTE'), // PENDIENTE, EN_PROCESO, FINALIZADO
    tieneConflicto: integer('tiene_conflicto', { mode: 'boolean' }).default(false), // Para la fase 4 de sincronización

    // Sincronización
    syncStatus: text('sync_status').notNull().default('LOCAL'), // LOCAL, SYNCED

    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});