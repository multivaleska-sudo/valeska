CREATE TABLE `representantes_legales` (
	`id` text PRIMARY KEY NOT NULL,
	`empresa_gestora_id` text NOT NULL,
	`dni` text NOT NULL,
	`nombres` text NOT NULL,
	`primer_apellido` text NOT NULL,
	`segundo_apellido` text,
	`partida_registral` text,
	`oficina_registral` text,
	`domicilio` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`sync_status` text DEFAULT 'LOCAL_INSERT' NOT NULL,
	FOREIGN KEY (`empresa_gestora_id`) REFERENCES `empresas_gestoras`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE UNIQUE INDEX `representante_dni_idx` ON `representantes_legales` (`dni`);
CREATE INDEX `rep_empresa_idx` ON `representantes_legales` (`empresa_gestora_id`);
DROP INDEX `presentante_dni_idx`;
CREATE UNIQUE INDEX `presentante_trabajador_dni_idx` ON `presentantes` (`dni`);
ALTER TABLE `presentantes` DROP COLUMN `partida_registral`;
ALTER TABLE `presentantes` DROP COLUMN `oficina_registral`;
ALTER TABLE `presentantes` DROP COLUMN `domicilio`;
ALTER TABLE `tramite_detalles` ADD `representante_legal_id` text REFERENCES representantes_legales(id);