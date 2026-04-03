CREATE TABLE `sync_conflictos` (
	`id` text PRIMARY KEY NOT NULL,
	`tabla_afectada` text NOT NULL,
	`registro_id` text NOT NULL,
	`identificador_visual` text,
	`datos_locales` text NOT NULL,
	`datos_remotos` text NOT NULL,
	`resuelto` integer DEFAULT false NOT NULL,
	`fecha_conflicto` integer NOT NULL
);

CREATE INDEX `conflicto_resuelto_idx` ON `sync_conflictos` (`resuelto`);
CREATE INDEX `conflicto_registro_idx` ON `sync_conflictos` (`registro_id`);