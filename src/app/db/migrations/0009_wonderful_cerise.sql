CREATE TABLE `message_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`content` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`sync_status` text DEFAULT 'LOCAL_INSERT' NOT NULL
);
