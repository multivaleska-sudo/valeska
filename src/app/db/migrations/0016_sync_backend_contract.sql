ALTER TABLE `sucursales` ADD COLUMN `codigo` text;
ALTER TABLE `dispositivos` ADD COLUMN `usuario_id` text;

CREATE TABLE IF NOT EXISTS `sync_cursors` (
  `entity_name` text PRIMARY KEY NOT NULL,
  `cursor_timestamp` text NOT NULL,
  `last_id` text DEFAULT '' NOT NULL,
  `updated_at` integer NOT NULL
);

CREATE TABLE IF NOT EXISTS `sync_push_chunks` (
  `id` text PRIMARY KEY NOT NULL,
  `sync_session_id` text NOT NULL,
  `entity_name` text NOT NULL,
  `chunk_index` integer NOT NULL,
  `total_chunks` integer NOT NULL,
  `outbox_id` text,
  `status` text DEFAULT 'PENDING' NOT NULL,
  `record_ids_json` text NOT NULL,
  `last_error` text,
  `updated_at` integer NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS `sync_push_chunks_natural_idx`
  ON `sync_push_chunks` (`sync_session_id`, `entity_name`, `chunk_index`);

CREATE INDEX IF NOT EXISTS `sync_push_chunks_outbox_idx`
  ON `sync_push_chunks` (`outbox_id`);

CREATE INDEX IF NOT EXISTS `sync_push_chunks_status_idx`
  ON `sync_push_chunks` (`status`);
