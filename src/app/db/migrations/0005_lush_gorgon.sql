CREATE TABLE `presentantes` (
	`id` text PRIMARY KEY NOT NULL,
	`partida_registral` text,
	`oficina_registral` text,
	`domicilio` text,
	`dni` text NOT NULL,
	`primer_apellido` text NOT NULL,
	`segundo_apellido` text,
	`nombres` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`sync_status` text DEFAULT 'LOCAL_INSERT' NOT NULL
);
CREATE UNIQUE INDEX `presentante_dni_idx` ON `presentantes` (`dni`);

ALTER TABLE `tramite_detalles` ADD `presentante_id` text REFERENCES presentantes(id);
ALTER TABLE `tramite_detalles` DROP COLUMN `presentante_persona`;
ALTER TABLE `tramite_detalles` DROP COLUMN `es_representante`;

ALTER TABLE `empresas_gestoras` DROP COLUMN `representantes`;