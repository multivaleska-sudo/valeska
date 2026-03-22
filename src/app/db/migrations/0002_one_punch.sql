-- 4. INSERCIÓN DE DATOS INICIALES (SEED) PARA LOS CATÁLOGOS
INSERT INTO `catalogo_tipos_tramite` (`id`, `nombre`, `activo`, `created_at`, `updated_at`, `sync_status`) VALUES
('TIPO_001', 'Primera Inscripción Vehicular', 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000, 'SYNCED'),
('TIPO_002', 'Cambio de Características', 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000, 'SYNCED'),
('TIPO_003', 'Cambio de Uso', 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000, 'SYNCED'),
('TIPO_004', 'Duplicado de Tarjeta', 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000, 'SYNCED'),
('TIPO_005', 'Transferencia Notarial', 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000, 'SYNCED'),
('TIPO_006', 'Otros', 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000, 'SYNCED');

INSERT INTO `catalogo_situaciones` (`id`, `nombre`, `color_hex`, `activo`, `created_at`, `updated_at`, `sync_status`) VALUES
('SIT_001', 'En calificación', '#FEF3C7', 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000, 'SYNCED'),
('SIT_002', 'Inscrito', '#DCFCE7', 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000, 'SYNCED'),
('SIT_003', 'Observado', '#FEE2E2', 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000, 'SYNCED'),
('SIT_004', 'Concluido', '#DCFCE7', 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000, 'SYNCED'),
('SIT_005', 'Reingresado', '#F3E8FF', 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000, 'SYNCED');