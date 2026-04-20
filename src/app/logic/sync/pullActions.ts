export async function processPullSync(sqlite: any, pullData: any) {
  // 1. Entidades Base y Seguridad
  for (const suc of pullData.sucursales || []) {
    await sqlite.execute(
      "INSERT OR REPLACE INTO sucursales (id, nombre, direccion, es_central, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6)",
      [
        suc.id,
        suc.nombre,
        suc.direccion || "",
        suc.esCentral ? 1 : 0,
        suc.createdAt,
        suc.updatedAt,
      ],
    );
  }

  for (const disp of pullData.dispositivos || []) {
    await sqlite.execute(
      "INSERT OR REPLACE INTO dispositivos (id, mac_address, nombre_equipo, autorizado, sucursal_id, provision_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
      [
        disp.id,
        disp.macAddress,
        disp.nombreEquipo,
        disp.autorizado ? 1 : 0,
        disp.sucursalId,
        disp.provisionId,
        disp.createdAt,
        disp.updatedAt,
      ],
    );
  }

  for (const usr of pullData.usuarios || []) {
    await sqlite.execute(
      "INSERT OR REPLACE INTO usuarios (id, username, password_hash, rol, nombre_completo, esta_activo, dispositivo_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
      [
        usr.id,
        usr.username,
        usr.passwordHash,
        usr.rol,
        usr.nombreCompleto,
        usr.estaActivo ? 1 : 0,
        usr.dispositivoId,
        usr.createdAt,
        usr.updatedAt,
      ],
    );
  }

  // 2. Catálogos Dinámicos
  for (const c of pullData.catalogoTiposTramite || []) {
    await sqlite.execute(
      "INSERT OR REPLACE INTO catalogo_tipos_tramite (id, nombre, activo, created_at, updated_at, deleted_at, sync_status) VALUES ($1, $2, $3, $4, $5, $6, 'SYNCED')",
      [c.id, c.nombre, c.activo ? 1 : 0, c.createdAt, c.updatedAt, c.deletedAt],
    );
  }

  for (const s of pullData.catalogoSituaciones || []) {
    await sqlite.execute(
      "INSERT OR REPLACE INTO catalogo_situaciones (id, nombre, color_hex, activo, created_at, updated_at, deleted_at, sync_status) VALUES ($1, $2, $3, $4, $5, $6, $7, 'SYNCED')",
      [
        s.id,
        s.nombre,
        s.colorHex,
        s.activo ? 1 : 0,
        s.createdAt,
        s.updatedAt,
        s.deletedAt,
      ],
    );
  }

  // 3. Maestros
  for (const cli of pullData.clientes || []) {
    await sqlite.execute(
      "INSERT OR REPLACE INTO clientes (id, tipo_documento, numero_documento, razon_social_nombres, estado_civil, domicilio, telefono, created_at, updated_at, deleted_at, sync_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'SYNCED')",
      [
        cli.id,
        cli.tipoDocumento,
        cli.numeroDocumento,
        cli.razonSocialNombres,
        cli.estadoCivil,
        cli.domicilio,
        cli.telefono,
        cli.createdAt,
        cli.updatedAt,
        cli.deletedAt,
      ],
    );
  }

  for (const v of pullData.vehiculos || []) {
    await sqlite.execute(
      "INSERT OR REPLACE INTO vehiculos (id, chasis_vin, placa, motor, marca, modelo, color, categoria, anio_fabricacion, anio_modelo, created_at, updated_at, deleted_at, sync_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'SYNCED')",
      [
        v.id,
        v.chasisVin,
        v.placa,
        v.motor,
        v.marca,
        v.modelo,
        v.color,
        v.categoria,
        v.anioFabricacion,
        v.anioModelo,
        v.createdAt,
        v.updatedAt,
        v.deletedAt,
      ],
    );
  }

  for (const emp of pullData.empresasGestoras || []) {
    await sqlite.execute(
      "INSERT OR REPLACE INTO empresas_gestoras (id, ruc, razon_social, direccion, created_at, updated_at, deleted_at, sync_status) VALUES ($1, $2, $3, $4, $5, $6, $7, 'SYNCED')",
      [
        emp.id,
        emp.ruc,
        emp.razonSocial,
        emp.direccion,
        emp.createdAt,
        emp.updatedAt,
        emp.deletedAt,
      ],
    );
  }

  for (const pre of pullData.presentantes || []) {
    await sqlite.execute(
      "INSERT OR REPLACE INTO presentantes (id, partida_registral, oficina_registral, domicilio, dni, primer_apellido, segundo_apellido, nombres, created_at, updated_at, deleted_at, sync_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'SYNCED')",
      [
        pre.id,
        pre.partidaRegistral,
        pre.oficinaRegistral,
        pre.domicilio,
        pre.dni,
        pre.primerApellido,
        pre.segundoApellido,
        pre.nombres,
        pre.createdAt,
        pre.updatedAt,
        pre.deletedAt,
      ],
    );
  }

  for (const tpl of pullData.plantillasDocumentos || []) {
    await sqlite.execute(
      "INSERT OR REPLACE INTO plantillas_documentos (id, nombre_documento, contenido_html, orientacion_papel, activo, created_at, updated_at, deleted_at, sync_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'SYNCED')",
      [
        tpl.id,
        tpl.nombreDocumento,
        tpl.contenidoHtml,
        tpl.orientacionPapel,
        tpl.activo ? 1 : 0,
        tpl.createdAt,
        tpl.updatedAt,
        tpl.deletedAt,
      ],
    );
  }

  // AÑADIDO: Plantillas de WhatsApp
  for (const msgTpl of pullData.messageTemplates || []) {
    await sqlite.execute(
      "INSERT OR REPLACE INTO message_templates (id, name, content, created_at, updated_at, deleted_at, sync_status) VALUES ($1, $2, $3, $4, $5, $6, 'SYNCED')",
      [
        msgTpl.id,
        msgTpl.name,
        msgTpl.content,
        msgTpl.createdAt,
        msgTpl.updatedAt,
        msgTpl.deletedAt,
      ],
    );
  }

  // 4. Core Trámites
  for (const t of pullData.tramites || []) {
    await sqlite.execute(
      "INSERT OR REPLACE INTO tramites (id, codigo_verificacion, tramite_anio, cliente_id, vehiculo_id, tipo_tramite_id, situacion_id, usuario_creador_id, sucursal_id, n_titulo, n_formato, fecha_presentacion, observaciones_generales, tarjeta_en_oficina, fecha_tarjeta_en_oficina, placa_en_oficina, fecha_placa_en_oficina, entrego_tarjeta, fecha_entrega_tarjeta, metodo_entrega_tarjeta, entrego_placa, fecha_entrega_placa, metodo_entrega_placa, observacion_placa, created_at, updated_at, deleted_at, sync_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, 'SYNCED')",
      [
        t.id,
        t.codigoVerificacion,
        t.tramiteAnio,
        t.clienteId,
        t.vehiculoId,
        t.tipoTramiteId,
        t.situacionId,
        t.usuarioCreadorId,
        t.sucursalId,
        t.nTitulo,
        t.nFormato,
        t.fechaPresentacion,
        t.observacionesGenerales,
        t.tarjetaEnOficina ? 1 : 0,
        t.fechaTarjetaEnOficina,
        t.placaEnOficina ? 1 : 0,
        t.fechaPlacaEnOficina,
        t.entregoTarjeta ? 1 : 0,
        t.fechaEntregaTarjeta,
        t.metodoEntregaTarjeta,
        t.entregoPlaca ? 1 : 0,
        t.fechaEntregaPlaca,
        t.metodoEntregaPlaca,
        t.observacionPlaca,
        t.createdAt,
        t.updatedAt,
        t.deletedAt,
      ],
    );
  }

  for (const td of pullData.tramiteDetalles || []) {
    await sqlite.execute(
      "INSERT OR REPLACE INTO tramite_detalles (id, tramite_id, empresa_gestora_id, presentante_id, tipo_boleta, numero_boleta, fecha_boleta, dua, num_formato_inmatriculacion, numero_recibo_tramite, clausula_monto, clausula_forma_pago, clausula_pago_bancarizado, aclaracion_dice, aclaracion_debe_decir, created_at, updated_at, deleted_at, sync_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, 'SYNCED')",
      [
        td.id,
        td.tramiteId,
        td.empresaGestoraId,
        td.presentanteId,
        td.tipoBoleta,
        td.numeroBoleta,
        td.fechaBoleta,
        td.dua,
        td.numFormatoInmatriculacion,
        td.numeroReciboTramite,
        td.clausulaMonto,
        td.clausulaFormaPago,
        td.clausulaPagoBancarizado,
        td.aclaracionDice,
        td.aclaracionDebeDecir,
        td.createdAt,
        td.updatedAt,
        td.deletedAt,
      ],
    );
  }

  // 5. Conflictos de Sincronización
  for (const conf of pullData.conflictos || []) {
    await sqlite.execute(
      "INSERT OR REPLACE INTO sync_conflictos (id, tabla_afectada, registro_id, identificador_visual, datos_locales, datos_remotos, resuelto, fecha_conflicto) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
      [
        conf.id,
        conf.tablaAfectada,
        conf.registroId,
        conf.identificadorVisual,
        typeof conf.datosLocales === "string"
          ? conf.datosLocales
          : JSON.stringify(conf.datosLocales),
        typeof conf.datosRemotos === "string"
          ? conf.datosRemotos
          : JSON.stringify(conf.datosRemotos),
        conf.resuelto ? 1 : 0,
        new Date(conf.fechaConflicto).getTime(),
      ],
    );
  }
}
