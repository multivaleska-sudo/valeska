export const formatDateForNest = (val: any) => {
    if (!val) return null;
    if (typeof val === "number") {
        const ms = val < 10000000000 ? val * 1000 : val;
        return new Date(ms).toISOString();
    }
    return new Date(val).toISOString();
};

const VERSIONED_SYNC_TABLES = new Set([
    "clientes",
    "vehiculos",
    "tramites",
    "tramite_detalles",
]);

export const markRecordsAsSynced = async (sqlite: any, tableName: string, ids: string[]) => {
    if (!ids || ids.length === 0) return;
    const formattedIds = ids.map(id => `'${id}'`).join(',');

    if (VERSIONED_SYNC_TABLES.has(tableName)) {
        await sqlite.execute(`UPDATE ${tableName}
            SET version = CASE
                    WHEN sync_status = 'LOCAL_INSERT' THEN CASE WHEN version < 1 THEN 1 ELSE version END
                    ELSE version + 1
                END,
                base_version = CASE
                    WHEN sync_status = 'LOCAL_INSERT' THEN CASE WHEN version < 1 THEN 1 ELSE version END
                    ELSE version + 1
                END,
                sync_status = 'SYNCED'
            WHERE id IN (${formattedIds})`);
        return;
    }

    await sqlite.execute(`UPDATE ${tableName} SET sync_status = 'SYNCED' WHERE id IN (${formattedIds})`);
};

export const markRecordsAsConflicted = async (sqlite: any, tableName: string, ids: string[]) => {
    if (!ids || ids.length === 0) return;
    const formattedIds = ids.map(id => `'${id}'`).join(',');
    await sqlite.execute(`UPDATE ${tableName} SET sync_status = 'CONFLICT' WHERE id IN (${formattedIds})`);
};

const versionFields = (row: any) => ({
    version: Number(row.version ?? 1),
    baseVersion: Number(row.base_version ?? row.version ?? 0),
    updatedByUserId: row.updated_by_user_id ?? null,
    updatedByDeviceMac: row.updated_by_device_mac ?? null,
});

const PENDING_SYNC_WHERE = "sync_status IN ('LOCAL_INSERT','LOCAL_UPDATE','LOCAL_DELETE')";

export async function buildPushPayload(sqlite: any) {
    const sucursalesRaw: any[] = await sqlite.select(`SELECT * FROM sucursales WHERE ${PENDING_SYNC_WHERE}`);
    const dispositivosRaw: any[] = await sqlite.select(`SELECT * FROM dispositivos WHERE ${PENDING_SYNC_WHERE}`);
    const usuariosRaw: any[] = await sqlite.select(`SELECT * FROM usuarios WHERE ${PENDING_SYNC_WHERE}`);

    const catTiposRaw: any[] = await sqlite.select(`SELECT * FROM catalogo_tipos_tramite WHERE ${PENDING_SYNC_WHERE}`);
    const catSitRaw: any[] = await sqlite.select(`SELECT * FROM catalogo_situaciones WHERE ${PENDING_SYNC_WHERE}`);
    const clientesRaw: any[] = await sqlite.select(`SELECT * FROM clientes WHERE ${PENDING_SYNC_WHERE}`);
    const vehiculosRaw: any[] = await sqlite.select(`SELECT * FROM vehiculos WHERE ${PENDING_SYNC_WHERE}`);

    const empresasRaw: any[] = await sqlite.select(`SELECT * FROM empresas_gestoras WHERE ${PENDING_SYNC_WHERE}`);
    const representantesRaw: any[] = await sqlite.select(`SELECT * FROM representantes_legales WHERE ${PENDING_SYNC_WHERE}`);

    const presentantesRaw: any[] = await sqlite.select(`SELECT * FROM presentantes WHERE ${PENDING_SYNC_WHERE}`);
    const plantillasRaw: any[] = await sqlite.select(`SELECT * FROM plantillas_documentos WHERE ${PENDING_SYNC_WHERE}`);
    const messageTemplatesRaw: any[] = await sqlite.select(`SELECT * FROM message_templates WHERE ${PENDING_SYNC_WHERE}`);

    const tramitesRaw: any[] = await sqlite.select(`SELECT * FROM tramites WHERE ${PENDING_SYNC_WHERE}`);
    const tramDetallesRaw: any[] = await sqlite.select(`SELECT * FROM tramite_detalles WHERE ${PENDING_SYNC_WHERE}`);

    const perfilesRaw: any[] = await sqlite.select(`SELECT * FROM perfiles_gestor WHERE ${PENDING_SYNC_WHERE}`);

    const conflictosRaw: any[] = await sqlite.select("SELECT * FROM sync_conflictos WHERE resuelto = 1");

    return {
        sucursales: sucursalesRaw.map((s) => ({
            id: s.id,
            nombre: s.nombre,
            codigo: s.codigo ?? null,
            direccion: s.direccion,
            esCentral: s.es_central === 1 || s.es_central === true,
            createdAt: formatDateForNest(s.created_at),
            updatedAt: formatDateForNest(s.updated_at),
            deletedAt: formatDateForNest(s.deleted_at),
            syncStatus: s.sync_status,
        })),
        dispositivos: dispositivosRaw.map((d) => ({
            id: d.id,
            macAddress: d.mac_address,
            nombreEquipo: d.nombre_equipo,
            autorizado: d.autorizado === 1 || d.autorizado === true,
            provisionId: d.provision_id,
            sucursalId: d.sucursal_id,
            usuarioId: d.usuario_id,
            createdAt: formatDateForNest(d.created_at),
            updatedAt: formatDateForNest(d.updated_at),
            deletedAt: formatDateForNest(d.deleted_at),
            syncStatus: d.sync_status,
        })),
        usuarios: usuariosRaw.map((u) => ({
            id: u.id,
            username: u.username,
            passwordHash: u.password_hash,
            rol: u.rol,
            nombreCompleto: u.nombre_completo,
            estaActivo: u.esta_activo === 1 || u.esta_activo === true,
            dispositivoId: u.dispositivo_id,
            createdAt: formatDateForNest(u.created_at),
            updatedAt: formatDateForNest(u.updated_at),
            deletedAt: formatDateForNest(u.deleted_at),
            syncStatus: u.sync_status,
        })),

        catalogoTiposTramite: catTiposRaw.map((c) => ({
            id: c.id,
            nombre: c.nombre,
            activo: c.activo === 1 || c.activo === true,
            createdAt: formatDateForNest(c.created_at),
            updatedAt: formatDateForNest(c.updated_at),
            deletedAt: formatDateForNest(c.deleted_at),
            syncStatus: c.sync_status,
            ...versionFields(c),
        })),
        catalogoSituaciones: catSitRaw.map((c) => ({
            id: c.id,
            nombre: c.nombre,
            colorHex: c.color_hex,
            activo: c.activo === 1 || c.activo === true,
            createdAt: formatDateForNest(c.created_at),
            updatedAt: formatDateForNest(c.updated_at),
            deletedAt: formatDateForNest(c.deleted_at),
            syncStatus: c.sync_status,
        })),
        clientes: clientesRaw.map((c) => ({
            id: c.id,
            tipoDocumento: c.tipo_documento,
            numeroDocumento: c.numero_documento,
            razonSocialNombres: c.razon_social_nombres,
            estadoCivil: c.estado_civil,
            domicilio: c.domicilio,
            telefono: c.telefono,
            createdAt: formatDateForNest(c.created_at),
            updatedAt: formatDateForNest(c.updated_at),
            deletedAt: formatDateForNest(c.deleted_at),
            syncStatus: c.sync_status,
            ...versionFields(c),
        })),
        vehiculos: vehiculosRaw.map((v) => ({
            id: v.id,
            chasisVin: v.chasis_vin,
            placa: v.placa,
            motor: v.motor,
            marca: v.marca,
            modelo: v.modelo,
            color: v.color,
            carroceria: v.carroceria,
            categoria: v.categoria,
            anioFabricacion: v.anio_fabricacion,
            anioModelo: v.anio_modelo,
            createdAt: formatDateForNest(v.created_at),
            updatedAt: formatDateForNest(v.updated_at),
            deletedAt: formatDateForNest(v.deleted_at),
            syncStatus: v.sync_status,
            ...versionFields(v),
        })),
        empresasGestoras: empresasRaw.map((e) => ({
            id: e.id,
            ruc: e.ruc,
            razonSocial: e.razon_social,
            direccion: e.direccion,
            createdAt: formatDateForNest(e.created_at),
            updatedAt: formatDateForNest(e.updated_at),
            deletedAt: formatDateForNest(e.deleted_at),
            syncStatus: e.sync_status,
        })),
        representantesLegales: representantesRaw.map((r) => ({
            id: r.id,
            empresaGestoraId: r.empresa_gestora_id,
            dni: r.dni,
            nombres: r.nombres,
            primerApellido: r.primer_apellido,
            segundoApellido: r.segundo_apellido,
            partidaRegistral: r.partida_registral,
            oficinaRegistral: r.oficina_registral,
            domicilio: r.domicilio,
            createdAt: formatDateForNest(r.created_at),
            updatedAt: formatDateForNest(r.updated_at),
            deletedAt: formatDateForNest(r.deleted_at),
            syncStatus: r.sync_status,
        })),
        presentantes: presentantesRaw.map((p) => ({
            id: p.id,
            dni: p.dni,
            primerApellido: p.primer_apellido,
            segundoApellido: p.segundo_apellido,
            nombres: p.nombres,
            createdAt: formatDateForNest(p.created_at),
            updatedAt: formatDateForNest(p.updated_at),
            deletedAt: formatDateForNest(p.deleted_at),
            syncStatus: p.sync_status,
        })),
        plantillasDocumentos: plantillasRaw.map((p) => ({
            id: p.id,
            nombreDocumento: p.nombre_documento,
            contenidoHtml: p.contenido_html,
            orientacionPapel: p.orientacion_papel,
            activo: p.activo === 1 || p.activo === true,
            createdAt: formatDateForNest(p.created_at),
            updatedAt: formatDateForNest(p.updated_at),
            deletedAt: formatDateForNest(p.deleted_at),
            syncStatus: p.sync_status,
        })),
        messageTemplates: messageTemplatesRaw.map((m) => ({
            id: m.id,
            name: m.name,
            content: m.content,
            createdAt: formatDateForNest(m.created_at),
            updatedAt: formatDateForNest(m.updated_at),
            deletedAt: formatDateForNest(m.deleted_at),
            syncStatus: m.sync_status,
        })),
        tramites: tramitesRaw.map((t) => ({
            id: t.id,
            codigoVerificacion: t.codigo_verificacion,
            tramiteAnio: t.tramite_anio,
            clienteId: t.cliente_id,
            vehiculoId: t.vehiculo_id,
            tipoTramiteId: t.tipo_tramite_id,
            situacionId: t.situacion_id,
            usuarioCreadorId: t.usuario_creador_id,
            sucursalId: t.sucursal_id,
            nTitulo: t.n_titulo,
            nFormato: t.n_formato,
            fechaPresentacion: t.fecha_presentacion,
            observacionesGenerales: t.observaciones_generales,
            tarjetaEnOficina: t.tarjeta_en_oficina === 1 || t.tarjeta_en_oficina === true,
            fechaTarjetaEnOficina: t.fecha_tarjeta_en_oficina,
            placaEnOficina: t.placa_en_oficina === 1 || t.placa_en_oficina === true,
            fechaPlacaEnOficina: t.fecha_placa_en_oficina,
            entregoTarjeta: t.entrego_tarjeta === 1 || t.entrego_tarjeta === true,
            fechaEntregaTarjeta: t.fecha_entrega_tarjeta,
            metodoEntregaTarjeta: t.metodo_entrega_tarjeta,
            entregoPlaca: t.entrego_placa === 1 || t.entrego_placa === true,
            fechaEntregaPlaca: t.fecha_entrega_placa,
            metodoEntregaPlaca: t.metodo_entrega_placa,
            observacionPlaca: t.observacion_placa,
            createdAt: formatDateForNest(t.created_at),
            updatedAt: formatDateForNest(t.updated_at),
            deletedAt: formatDateForNest(t.deleted_at),
            syncStatus: t.sync_status,
            ...versionFields(t),
        })),
        tramiteDetalles: tramDetallesRaw.map((td) => ({
            id: td.id,
            tramiteId: td.tramite_id,
            empresaGestoraId: td.empresa_gestora_id,
            representanteLegalId: td.representante_legal_id,
            presentanteId: td.presentante_id,
            tipoBoleta: td.tipo_boleta,
            numeroBoleta: td.numero_boleta,
            fechaBoleta: td.fecha_boleta,
            dua: td.dua,
            numFormatoInmatriculacion: td.num_formato_inmatriculacion,
            numeroReciboTramite: td.numero_recibo_tramite,
            clausulaMonto: td.clausula_monto,
            clausulaFormaPago: td.clausula_forma_pago,
            clausulaPagoBancarizado: td.clausula_pago_bancarizado,
            aclaracionDice: td.aclaracion_dice,
            aclaracionDebeDecir: td.aclaracion_debe_decir,
            createdAt: formatDateForNest(td.created_at),
            updatedAt: formatDateForNest(td.updated_at),
            deletedAt: formatDateForNest(td.deleted_at),
            syncStatus: td.sync_status,
            ...versionFields(td),
        })),
        perfilesGestor: perfilesRaw.map((p) => ({
            id: p.id,
            calidad: p.calidad,
            nombre: p.nombre,
            concesionario: p.concesionario,
            importador: p.importador,
            createdAt: formatDateForNest(p.created_at),
            updatedAt: formatDateForNest(p.updated_at),
            deletedAt: formatDateForNest(p.deleted_at),
            syncStatus: p.sync_status,
        })),
        conflictosResueltos: conflictosRaw.map((conf) => ({
            id: conf.id,
            tablaAfectada: conf.tabla_afectada,
            registroId: conf.registro_id,
            identificadorVisual: conf.identificador_visual,
            datosLocales:
                typeof conf.datos_locales === "string"
                    ? conf.datos_locales
                    : JSON.stringify(conf.datos_locales || {}),
            datosRemotos:
                typeof conf.datos_remotos === "string"
                    ? conf.datos_remotos
                    : JSON.stringify(conf.datos_remotos || {}),
            resuelto: conf.resuelto === 1 || conf.resuelto === true,
            fechaConflicto: formatDateForNest(conf.fecha_conflicto),
        })),
    };
}
