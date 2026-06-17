UPDATE `clientes`
SET `base_version` = `version`
WHERE `sync_status` = 'SYNCED';

UPDATE `vehiculos`
SET `base_version` = `version`
WHERE `sync_status` = 'SYNCED';

UPDATE `tramites`
SET `base_version` = `version`
WHERE `sync_status` = 'SYNCED';

UPDATE `tramite_detalles`
SET `base_version` = `version`
WHERE `sync_status` = 'SYNCED';
