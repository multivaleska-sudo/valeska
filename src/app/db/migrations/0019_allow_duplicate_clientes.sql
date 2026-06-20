DROP INDEX IF EXISTS `cliente_documento_idx`;
CREATE INDEX `cliente_documento_idx` ON `clientes` (`numero_documento`);
