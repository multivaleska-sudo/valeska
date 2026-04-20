CREATE TABLE `catalogo_situaciones` (
	`id` text PRIMARY KEY NOT NULL,
	`nombre` text NOT NULL,
	`color_hex` text DEFAULT '#CCCCCC',
	`activo` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`sync_status` text DEFAULT 'LOCAL_INSERT' NOT NULL
);

CREATE UNIQUE INDEX `catalogo_situaciones_nombre_unique` ON `catalogo_situaciones` (`nombre`);
CREATE TABLE `catalogo_tipos_tramite` (
	`id` text PRIMARY KEY NOT NULL,
	`nombre` text NOT NULL,
	`activo` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`sync_status` text DEFAULT 'LOCAL_INSERT' NOT NULL
);

CREATE UNIQUE INDEX `catalogo_tipos_tramite_nombre_unique` ON `catalogo_tipos_tramite` (`nombre`);
CREATE TABLE `clientes` (
	`id` text PRIMARY KEY NOT NULL,
	`tipo_documento` text NOT NULL,
	`numero_documento` text NOT NULL,
	`razon_social_nombres` text NOT NULL,
	`estado_civil` text DEFAULT 'SOLTERO(A)',
	`domicilio` text,
	`telefono` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`sync_status` text DEFAULT 'LOCAL_INSERT' NOT NULL
);

CREATE UNIQUE INDEX `clientes_numero_documento_unique` ON `clientes` (`numero_documento`);
CREATE TABLE `dispositivos` (
	`id` text PRIMARY KEY NOT NULL,
	`mac_address` text NOT NULL,
	`nombre_equipo` text NOT NULL,
	`autorizado` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`sync_status` text DEFAULT 'LOCAL_INSERT' NOT NULL
);

CREATE UNIQUE INDEX `dispositivos_mac_address_unique` ON `dispositivos` (`mac_address`);
CREATE TABLE `empresas_gestoras` (
	`id` text PRIMARY KEY NOT NULL,
	`ruc` text,
	`razon_social` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`sync_status` text DEFAULT 'LOCAL_INSERT' NOT NULL
);

CREATE UNIQUE INDEX `empresas_gestoras_ruc_unique` ON `empresas_gestoras` (`ruc`);
CREATE TABLE `tramite_detalles` (
	`id` text PRIMARY KEY NOT NULL,
	`tramite_id` text NOT NULL,
	`empresa_gestora_id` text,
	`presentante_persona` text,
	`es_representante` integer DEFAULT false,
	`tipo_boleta` text,
	`numero_boleta` text,
	`fecha_boleta` text,
	`dua` text,
	`num_formato_inmatriculacion` text,
	`clausula_monto` real,
	`clausula_forma_pago` text,
	`clausula_pago_bancarizado` text,
	`aclaracion_dice` text,
	`aclaracion_debe_decir` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`sync_status` text DEFAULT 'LOCAL_INSERT' NOT NULL,
	FOREIGN KEY (`tramite_id`) REFERENCES `tramites`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`empresa_gestora_id`) REFERENCES `empresas_gestoras`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE UNIQUE INDEX `tramite_detalles_tramite_id_unique` ON `tramite_detalles` (`tramite_id`);
CREATE TABLE `tramites` (
	`id` text PRIMARY KEY NOT NULL,
	`codigo_verificacion` text NOT NULL,
	`tramite_anio` text NOT NULL,
	`cliente_id` text NOT NULL,
	`vehiculo_id` text NOT NULL,
	`tipo_tramite_id` text NOT NULL,
	`situacion_id` text NOT NULL,
	`usuario_creador_id` text NOT NULL,
	`n_titulo` text,
	`n_formato` text,
	`fecha_presentacion` text NOT NULL,
	`observaciones_generales` text,
	`entrego_tarjeta` integer DEFAULT false,
	`fecha_entrega_tarjeta` text,
	`entrego_placa` integer DEFAULT false,
	`fecha_entrega_placa` text,
	`observacion_placa` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`sync_status` text DEFAULT 'LOCAL_INSERT' NOT NULL,
	FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`vehiculo_id`) REFERENCES `vehiculos`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tipo_tramite_id`) REFERENCES `catalogo_tipos_tramite`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`situacion_id`) REFERENCES `catalogo_situaciones`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`usuario_creador_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE UNIQUE INDEX `tramites_codigo_verificacion_unique` ON `tramites` (`codigo_verificacion`);
CREATE TABLE `usuarios` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`rol` text DEFAULT 'OPERADOR' NOT NULL,
	`nombre_completo` text NOT NULL,
	`dispositivo_id` text,
	`esta_activo` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`sync_status` text DEFAULT 'LOCAL_INSERT' NOT NULL,
	FOREIGN KEY (`dispositivo_id`) REFERENCES `dispositivos`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE UNIQUE INDEX `usuarios_username_unique` ON `usuarios` (`username`);
CREATE TABLE `vehiculos` (
	`id` text PRIMARY KEY NOT NULL,
	`chasis_vin` text NOT NULL,
	`placa` text,
	`motor` text,
	`marca` text NOT NULL,
	`modelo` text,
	`color` text,
	`categoria` text DEFAULT 'L3 - B',
	`anio_fabricacion` text,
	`anio_modelo` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`sync_status` text DEFAULT 'LOCAL_INSERT' NOT NULL
);

CREATE UNIQUE INDEX `vehiculos_chasis_vin_unique` ON `vehiculos` (`chasis_vin`);