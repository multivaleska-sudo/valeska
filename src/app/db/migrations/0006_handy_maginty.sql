ALTER TABLE `tramites` ADD `tarjeta_en_oficina` integer DEFAULT false;
ALTER TABLE `tramites` ADD `fecha_tarjeta_en_oficina` text;
ALTER TABLE `tramites` ADD `placa_en_oficina` integer DEFAULT false;
ALTER TABLE `tramites` ADD `fecha_placa_en_oficina` text;
ALTER TABLE `tramites` ADD `metodo_entrega_tarjeta` text;
ALTER TABLE `tramites` ADD `metodo_entrega_placa` text;