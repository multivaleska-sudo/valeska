CREATE TABLE `sucursales` (
	`id` text PRIMARY KEY NOT NULL,
	`nombre` text NOT NULL,
	`direccion` text,
	`es_central` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`sync_status` text DEFAULT 'LOCAL_INSERT' NOT NULL
);

DROP INDEX `catalogo_situaciones_nombre_unique`;
CREATE UNIQUE INDEX `situacion_nombre_idx` ON `catalogo_situaciones` (`nombre`);
DROP INDEX `catalogo_tipos_tramite_nombre_unique`;
CREATE UNIQUE INDEX `tipo_tramite_nombre_idx` ON `catalogo_tipos_tramite` (`nombre`);
DROP INDEX `clientes_numero_documento_unique`;
CREATE UNIQUE INDEX `cliente_documento_idx` ON `clientes` (`numero_documento`);
CREATE INDEX `cliente_nombre_idx` ON `clientes` (`razon_social_nombres`);
DROP INDEX `dispositivos_mac_address_unique`;
ALTER TABLE `dispositivos` ADD `sucursal_id` text NOT NULL REFERENCES sucursales(id);
ALTER TABLE `dispositivos` ADD `provision_id` text;
CREATE UNIQUE INDEX `mac_address_idx` ON `dispositivos` (`mac_address`);
CREATE UNIQUE INDEX `provision_id_idx` ON `dispositivos` (`provision_id`);
CREATE INDEX `disp_sucursal_idx` ON `dispositivos` (`sucursal_id`);
DROP INDEX `empresas_gestoras_ruc_unique`;
CREATE UNIQUE INDEX `empresa_ruc_idx` ON `empresas_gestoras` (`ruc`);
DROP INDEX `tramite_detalles_tramite_id_unique`;
CREATE UNIQUE INDEX `detalle_tramite_idx` ON `tramite_detalles` (`tramite_id`);
DROP INDEX `tramites_codigo_verificacion_unique`;
ALTER TABLE `tramites` ADD `sucursal_id` text NOT NULL REFERENCES sucursales(id);
CREATE UNIQUE INDEX `tramite_codigo_idx` ON `tramites` (`codigo_verificacion`);
CREATE INDEX `trm_cliente_idx` ON `tramites` (`cliente_id`);
CREATE INDEX `trm_vehiculo_idx` ON `tramites` (`vehiculo_id`);
CREATE INDEX `trm_sucursal_idx` ON `tramites` (`sucursal_id`);
CREATE INDEX `trm_fecha_idx` ON `tramites` (`fecha_presentacion`);
DROP INDEX `usuarios_username_unique`;
CREATE UNIQUE INDEX `username_idx` ON `usuarios` (`username`);
CREATE INDEX `usr_dispositivo_idx` ON `usuarios` (`dispositivo_id`);
DROP INDEX `vehiculos_chasis_vin_unique`;
CREATE UNIQUE INDEX `vehiculo_vin_idx` ON `vehiculos` (`chasis_vin`);
CREATE INDEX `vehiculo_placa_idx` ON `vehiculos` (`placa`);