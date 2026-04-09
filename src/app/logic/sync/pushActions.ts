export const formatDateForNest = (val: any) => {
    if (!val) return null;
    if (typeof val === "number") {
        // Si SQLite devolvió el timestamp numérico
        const ms = val < 10000000000 ? val * 1000 : val;
        return new Date(ms).toISOString();
    }
    return new Date(val).toISOString();
};

export async function buildPushPayload(sqlite: any) {
    const sucursalesRaw: any[] = await sqlite.select("SELECT * FROM sucursales");
    const dispositivosRaw: any[] = await sqlite.select("SELECT * FROM dispositivos");
    const usuariosRaw: any[] = await sqlite.select("SELECT * FROM usuarios");

    // Filtramos por registros que requieren sincronización para optimizar ancho de banda
    const catTiposRaw: any[] = await sqlite.select("SELECT * FROM catalogo_tipos_tramite WHERE sync_status != 'SYNCED'");
    const catSitRaw: any[] = await sqlite.select("SELECT * FROM catalogo_situaciones WHERE sync_status != 'SYNCED'");
    const clientesRaw: any[] = await sqlite.select("SELECT * FROM clientes WHERE sync_status != 'SYNCED'");
    const vehiculosRaw: any[] = await sqlite.select("SELECT * FROM vehiculos WHERE sync_status != 'SYNCED'");
    const empresasRaw: any[] = await sqlite.select("SELECT * FROM empresas_gestoras WHERE sync_status != 'SYNCED'");
    const presentantesRaw: any[] = await sqlite.select("SELECT * FROM presentantes WHERE sync_status != 'SYNCED'");
    const plantillasRaw: any[] = await sqlite.select("SELECT * FROM plantillas_documentos WHERE sync_status != 'SYNCED'");
    const tramitesRaw: any[] = await sqlite.select("SELECT * FROM tramites WHERE sync_status != 'SYNCED'");
    const tramDetallesRaw: any[] = await sqlite.select("SELECT * FROM tramite_detalles WHERE sync_status != 'SYNCED'");

    // Novedad: Enviamos a la nube los conflictos (especialmente los que el usuario ya marcó como resueltos)
    const conflictosRaw: any[] = await sqlite.select("SELECT * FROM sync_conflictos");

    return {
        sucursales: sucursalesRaw.map((s) => ({
            id: s.id,
            nombre: s.nombre,
            direccion: s.direccion,
            esCentral: s.es_central === 1 || s.es_central === true,
            createdAt: formatDateForNest(s.created_at),
            updatedAt: formatDateForNest(s.updated_at),
            deletedAt: formatDateForNest(s.deleted_at),
        })),
        dispositivos: dispositivosRaw.map((d) => ({
            id: d.id,
            macAddress: d.mac_address,
            nombreEquipo: d.nombre_equipo,
            autorizado: d.autorizado === 1 || d.autorizado === true,
            provisionId: d.provision_id,
            sucursalId: d.sucursal_id,
            createdAt: formatDateForNest(d.created_at),
            updatedAt: formatDateForNest(d.updated_at),
            deletedAt: formatDateForNest(d.deleted_at),
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
        })),

        catalogoTiposTramite: catTiposRaw.map((c) => ({
            id: c.id,
            nombre: c.nombre,
            activo: c.activo === 1 || c.activo === true,
            createdAt: formatDateForNest(c.created_at),
            updatedAt: formatDateForNest(c.updated_at),
            deletedAt: formatDateForNest(c.deleted_at),
            syncStatus: c.sync_status,
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
        })),
        vehiculos: vehiculosRaw.map((v) => ({
            id: v.id,
            chasisVin: v.chasis_vin,
            placa: v.placa,
            motor: v.motor,
            marca: v.marca,
            modelo: v.modelo,
            color: v.color,
            categoria: v.categoria,
            anioFabricacion: v.anio_fabricacion,
            anioModelo: v.anio_modelo,
            createdAt: formatDateForNest(v.created_at),
            updatedAt: formatDateForNest(v.updated_at),
            deletedAt: formatDateForNest(v.deleted_at),
            syncStatus: v.sync_status,
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
        presentantes: presentantesRaw.map((p) => ({
            id: p.id,
            partidaRegistral: p.partida_registral,
            oficinaRegistral: p.oficina_registral,
            domicilio: p.domicilio,
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
        })),
        tramiteDetalles: tramDetallesRaw.map((td) => ({
            id: td.id,
            tramiteId: td.tramite_id,
            empresaGestoraId: td.empresa_gestora_id,
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
        })),
        conflictos: conflictosRaw.map((conf) => ({
            id: conf.id,
            tablaAfectada: conf.tabla_afectada,
            registroId: conf.registro_id,
            identificadorVisual: conf.identificador_visual,
            datosLocales: typeof conf.datos_locales === 'string' ? JSON.parse(conf.datos_locales || '{}') : conf.datos_locales,
            datosRemotos: typeof conf.datos_remotos === 'string' ? JSON.parse(conf.datos_remotos || '{}') : conf.datos_remotos,
            resuelto: conf.resuelto === 1 || conf.resuelto === true,
            fechaConflicto: formatDateForNest(conf.fecha_conflicto),
        }))
    };
}