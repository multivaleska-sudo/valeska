DROP INDEX IF EXISTS `empresa_ruc_idx`;

CREATE INDEX `empresa_ruc_idx` ON `empresas_gestoras` (`ruc`);