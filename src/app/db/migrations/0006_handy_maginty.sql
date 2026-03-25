ALTER TABLE `tramites` ADD `tarjeta_en_oficina` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `tramites` ADD `fecha_tarjeta_en_oficina` text;--> statement-breakpoint
ALTER TABLE `tramites` ADD `placa_en_oficina` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `tramites` ADD `fecha_placa_en_oficina` text;--> statement-breakpoint
ALTER TABLE `tramites` ADD `metodo_entrega_tarjeta` text;--> statement-breakpoint
ALTER TABLE `tramites` ADD `metodo_entrega_placa` text;