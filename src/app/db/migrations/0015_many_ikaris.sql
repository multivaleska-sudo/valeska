CREATE TABLE `perfiles_gestor` (
	`id` text PRIMARY KEY NOT NULL,
	`calidad` text NOT NULL,
	`nombre` text NOT NULL,
	`concesionario` text,
	`importador` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`sync_status` text DEFAULT 'LOCAL_INSERT' NOT NULL
);