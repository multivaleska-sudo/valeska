DROP INDEX IF EXISTS `tramite_codigo_idx`;

CREATE INDEX `tramite_codigo_idx` ON `tramites` (`codigo_verificacion`);
