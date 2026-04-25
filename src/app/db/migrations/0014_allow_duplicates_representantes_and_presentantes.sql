DROP INDEX IF EXISTS `representante_dni_idx`;

CREATE INDEX `representante_dni_idx` ON `representantes_legales` (`dni`);

DROP INDEX IF EXISTS `presentante_trabajador_dni_idx`;

CREATE INDEX `presentante_trabajador_dni_idx` ON `presentantes` (`dni`);
