-- CREACIÓN DE LA TABLA DE PLANTILLAS DINÁMICAS
CREATE TABLE `plantillas_documentos` (
    `id` text PRIMARY KEY NOT NULL,
    `nombre_documento` text NOT NULL,
    `contenido_html` text NOT NULL,
    `orientacion_papel` text DEFAULT 'PORTRAIT',
    `activo` integer DEFAULT true NOT NULL,
    `created_at` integer NOT NULL,
    `updated_at` integer NOT NULL,
    `deleted_at` integer,
    `sync_status` text DEFAULT 'LOCAL_INSERT' NOT NULL
);

CREATE UNIQUE INDEX `plantilla_nombre_idx` ON `plantillas_documentos` (`nombre_documento`);

-- INYECCIÓN DE LAS 4 PLANTILLAS BASE CON UN ESQUELETO MÍNIMO Y ALGUNAS VARIABLES DE PRUEBA
INSERT INTO `plantillas_documentos` (`id`, `nombre_documento`, `contenido_html`, `orientacion_papel`, `activo`, `created_at`, `updated_at`, `sync_status`) VALUES
('TPL_001', 'Formulario', '<div style="padding: 40px; font-family: sans-serif;"><h1 style="text-align: center; text-decoration: underline;">FORMULARIO DE INSCRIPCIÓN</h1><br><p><strong>Cliente:</strong> {{CLIENTE_NOMBRE}}</p><p><strong>DNI/RUC:</strong> {{CLIENTE_DOCUMENTO}}</p><p><strong>Placa Asignada:</strong> {{VEHICULO_PLACA}}</p><p><strong>Marca / Modelo:</strong> {{VEHICULO_MARCA}} / {{VEHICULO_MODELO}}</p><br><p style="margin-top: 50px; text-align: center;">___________________________<br>Firma del Solicitante</p></div>', 'PORTRAIT', 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000, 'SYNCED'),

('TPL_002', 'Cláusula Cancelación', '<div style="padding: 40px; font-family: sans-serif;"><h1 style="text-align: center;">CLÁUSULA DE CANCELACIÓN</h1><br><p>Por el presente documento, dejamos constancia de la cancelación del trámite vehicular con Título N° <strong>{{TRAMITE_TITULO}}</strong>.</p><p><strong>Monto Pagado:</strong> S/ {{CLAUSULA_MONTO}}</p><p><strong>Forma de Pago:</strong> {{CLAUSULA_FORMA_PAGO}}</p></div>', 'PORTRAIT', 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000, 'SYNCED'),

('TPL_003', 'P. Medina', '<div style="padding: 40px; font-family: sans-serif;"><h1 style="text-align: center;">FORMATO P. MEDINA</h1><br><p>Expediente asociado a: <strong>{{CLIENTE_NOMBRE}}</strong></p><p>Vehículo: {{VEHICULO_CHASIS}}</p></div>', 'PORTRAIT', 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000, 'SYNCED'),

('TPL_004', 'P. Pantigoso', '<div style="padding: 40px; font-family: sans-serif;"><h1 style="text-align: center;">FORMATO P. PANTIGOSO</h1><br><p>Expediente asociado a: <strong>{{CLIENTE_NOMBRE}}</strong></p><p>Motor: {{VEHICULO_MOTOR}}</p></div>', 'PORTRAIT', 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000, 'SYNCED');