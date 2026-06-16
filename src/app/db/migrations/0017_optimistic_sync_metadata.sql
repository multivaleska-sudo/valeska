ALTER TABLE `clientes` ADD COLUMN `version` integer DEFAULT 1 NOT NULL;
ALTER TABLE `clientes` ADD COLUMN `base_version` integer DEFAULT 0 NOT NULL;
ALTER TABLE `clientes` ADD COLUMN `updated_by_user_id` text;
ALTER TABLE `clientes` ADD COLUMN `updated_by_device_mac` text;

ALTER TABLE `vehiculos` ADD COLUMN `version` integer DEFAULT 1 NOT NULL;
ALTER TABLE `vehiculos` ADD COLUMN `base_version` integer DEFAULT 0 NOT NULL;
ALTER TABLE `vehiculos` ADD COLUMN `updated_by_user_id` text;
ALTER TABLE `vehiculos` ADD COLUMN `updated_by_device_mac` text;

ALTER TABLE `tramites` ADD COLUMN `version` integer DEFAULT 1 NOT NULL;
ALTER TABLE `tramites` ADD COLUMN `base_version` integer DEFAULT 0 NOT NULL;
ALTER TABLE `tramites` ADD COLUMN `updated_by_user_id` text;
ALTER TABLE `tramites` ADD COLUMN `updated_by_device_mac` text;

ALTER TABLE `tramite_detalles` ADD COLUMN `version` integer DEFAULT 1 NOT NULL;
ALTER TABLE `tramite_detalles` ADD COLUMN `base_version` integer DEFAULT 0 NOT NULL;
ALTER TABLE `tramite_detalles` ADD COLUMN `updated_by_user_id` text;
ALTER TABLE `tramite_detalles` ADD COLUMN `updated_by_device_mac` text;
