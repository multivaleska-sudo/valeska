export async function processPullSync(sqlite: any, pullData: any) {
  for (const suc of pullData.sucursales || []) {
    const esCentral = suc.esCentral ?? suc.es_central ?? false;
    await sqlite.execute(
      "INSERT OR REPLACE INTO sucursales (id, nombre, direccion, es_central, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6)",
      [
        suc.id,
        suc.nombre,
        suc.direccion || "",
        esCentral ? 1 : 0,
        suc.createdAt || suc.created_at,
        suc.updatedAt || suc.updated_at,
      ],
    );
  }

  for (const disp of pullData.dispositivos || []) {
    const autorizado = disp.autorizado ?? true;
    await sqlite.execute(
      "INSERT OR REPLACE INTO dispositivos (id, mac_address, nombre_equipo, autorizado, sucursal_id, provision_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
      [
        disp.id,
        disp.macAddress || disp.mac_address,
        disp.nombreEquipo || disp.nombre_equipo,
        autorizado ? 1 : 0,
        disp.sucursalId || disp.sucursal_id,
        disp.provisionId || disp.provision_id,
        disp.createdAt || disp.created_at,
        disp.updatedAt || disp.updated_at,
      ],
    );
  }

  for (const usr of pullData.usuarios || []) {
    const isActivo = usr.estaActivo ?? usr.esta_activo ?? true;
    const pwdHash = usr.passwordHash ?? usr.password_hash;
    const nombreCompl = usr.nombreCompleto ?? usr.nombre_completo;
    const dispId = usr.dispositivoId ?? usr.dispositivo_id;

    await sqlite.execute(
      "INSERT OR REPLACE INTO usuarios (id, username, password_hash, rol, nombre_completo, esta_activo, dispositivo_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
      [
        usr.id,
        usr.username,
        pwdHash,
        usr.rol,
        nombreCompl,
        isActivo ? 1 : 0,
        dispId,
        usr.createdAt || usr.created_at,
        usr.updatedAt || usr.updated_at,
      ],
    );
  }

  for (const c of pullData.catalogoTiposTramite || []) {
    const isActivo = c.activo ?? true;
    await sqlite.execute(
      "INSERT OR REPLACE INTO catalogo_tipos_tramite (id, nombre, activo, created_at, updated_at, deleted_at, sync_status) VALUES ($1, $2, $3, $4, $5, $6, 'SYNCED')",
      [
        c.id,
        c.nombre,
        isActivo ? 1 : 0,
        c.createdAt || c.created_at,
        c.updatedAt || c.updated_at,
        c.deletedAt || c.deleted_at,
      ],
    );
  }

  for (const s of pullData.catalogoSituaciones || []) {
    const isActivo = s.activo ?? true;
    await sqlite.execute(
      "INSERT OR REPLACE INTO catalogo_situaciones (id, nombre, color_hex, activo, created_at, updated_at, deleted_at, sync_status) VALUES ($1, $2, $3, $4, $5, $6, $7, 'SYNCED')",
      [
        s.id,
        s.nombre,
        s.colorHex || s.color_hex,
        isActivo ? 1 : 0,
        s.createdAt || s.created_at,
        s.updatedAt || s.updated_at,
        s.deletedAt || s.deleted_at,
      ],
    );
  }

  // 3. Maestros
  for (const cli of pullData.clientes || []) {
    await sqlite.execute(
      "INSERT OR REPLACE INTO clientes (id, tipo_documento, numero_documento, razon_social_nombres, estado_civil, domicilio, telefono, created_at, updated_at, deleted_at, sync_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'SYNCED')",
      [
        cli.id,
        cli.tipoDocumento || cli.tipo_documento,
        cli.numeroDocumento || cli.numero_documento,
        cli.razonSocialNombres || cli.razon_social_nombres,
        cli.estadoCivil || cli.estado_civil,
        cli.domicilio,
        cli.telefono,
        cli.createdAt || cli.created_at,
        cli.updatedAt || cli.updated_at,
        cli.deletedAt || cli.deleted_at,
      ],
    );
  }

  for (const v of pullData.vehiculos || []) {
    await sqlite.execute(
      "INSERT OR REPLACE INTO vehiculos (id, chasis_vin, placa, motor, marca, modelo, color, categoria, anio_fabricacion, anio_modelo, created_at, updated_at, deleted_at, sync_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'SYNCED')",
      [
        v.id,
        v.chasisVin || v.chasis_vin,
        v.placa,
        v.motor,
        v.marca,
        v.modelo,
        v.color,
        v.categoria,
        v.anioFabricacion || v.anio_fabricacion,
        v.anioModelo || v.anio_modelo,
        v.createdAt || v.created_at,
        v.updatedAt || v.updated_at,
        v.deletedAt || v.deleted_at,
      ],
    );
  }

  for (const emp of pullData.empresasGestoras || []) {
    await sqlite.execute(
      "INSERT OR REPLACE INTO empresas_gestoras (id, ruc, razon_social, direccion, created_at, updated_at, deleted_at, sync_status) VALUES ($1, $2, $3, $4, $5, $6, $7, 'SYNCED')",
      [
        emp.id,
        emp.ruc,
        emp.razonSocial || emp.razon_social,
        emp.direccion,
        emp.createdAt || emp.created_at,
        emp.updatedAt || emp.updated_at,
        emp.deletedAt || emp.deleted_at,
      ],
    );
  }

  for (const rep of pullData.representantesLegales || []) {
    await sqlite.execute(
      "INSERT OR REPLACE INTO representantes_legales (id, empresa_gestora_id, dni, nombres, primer_apellido, segundo_apellido, partida_registral, oficina_registral, domicilio, created_at, updated_at, deleted_at, sync_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'SYNCED')",
      [
        rep.id,
        rep.empresaGestoraId || rep.empresa_gestora_id,
        rep.dni,
        rep.nombres,
        rep.primerApellido || rep.primer_apellido,
        rep.segundoApellido || rep.segundo_apellido,
        rep.partidaRegistral || rep.partida_registral,
        rep.oficinaRegistral || rep.oficina_registral,
        rep.domicilio,
        rep.createdAt || rep.created_at,
        rep.updatedAt || rep.updated_at,
        rep.deletedAt || rep.deleted_at,
      ],
    );
  }

  for (const pre of pullData.presentantes || []) {
    await sqlite.execute(
      "INSERT OR REPLACE INTO presentantes (id, dni, primer_apellido, segundo_apellido, nombres, created_at, updated_at, deleted_at, sync_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'SYNCED')",
      [
        pre.id,
        pre.dni,
        pre.primerApellido || pre.primer_apellido,
        pre.segundoApellido || pre.segundo_apellido,
        pre.nombres,
        pre.createdAt || pre.created_at,
        pre.updatedAt || pre.updated_at,
        pre.deletedAt || pre.deleted_at,
      ],
    );
  }

  for (const tpl of pullData.plantillasDocumentos || []) {
    const isActivo = tpl.activo ?? true;
    await sqlite.execute(
      "INSERT OR REPLACE INTO plantillas_documentos (id, nombre_documento, contenido_html, orientacion_papel, activo, created_at, updated_at, deleted_at, sync_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'SYNCED')",
      [
        tpl.id,
        tpl.nombreDocumento || tpl.nombre_documento,
        tpl.contenidoHtml || tpl.contenido_html,
        tpl.orientacionPapel || tpl.orientacion_papel,
        isActivo ? 1 : 0,
        tpl.createdAt || tpl.created_at,
        tpl.updatedAt || tpl.updated_at,
        tpl.deletedAt || tpl.deleted_at,
      ],
    );
  }

  for (const msgTpl of pullData.messageTemplates || []) {
    await sqlite.execute(
      "INSERT OR REPLACE INTO message_templates (id, name, content, created_at, updated_at, deleted_at, sync_status) VALUES ($1, $2, $3, $4, $5, $6, 'SYNCED')",
      [
        msgTpl.id,
        msgTpl.name,
        msgTpl.content,
        msgTpl.createdAt || msgTpl.created_at,
        msgTpl.updatedAt || msgTpl.updated_at,
        msgTpl.deletedAt || msgTpl.deleted_at,
      ],
    );
  }

  // 4. Core Trámites
  for (const t of pullData.tramites || []) {
    await sqlite.execute(
      "INSERT OR REPLACE INTO tramites (id, codigo_verificacion, tramite_anio, cliente_id, vehiculo_id, tipo_tramite_id, situacion_id, usuario_creador_id, sucursal_id, n_titulo, n_formato, fecha_presentacion, observaciones_generales, tarjeta_en_oficina, fecha_tarjeta_en_oficina, placa_en_oficina, fecha_placa_en_oficina, entrego_tarjeta, fecha_entrega_tarjeta, metodo_entrega_tarjeta, entrego_placa, fecha_entrega_placa, metodo_entrega_placa, observacion_placa, created_at, updated_at, deleted_at, sync_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, 'SYNCED')",
      [
        t.id,
        t.codigoVerificacion || t.codigo_verificacion,
        t.tramiteAnio || t.tramite_anio,
        t.clienteId || t.cliente_id,
        t.vehiculoId || t.vehiculo_id,
        t.tipoTramiteId || t.tipo_tramite_id,
        t.situacionId || t.situacion_id,
        t.usuarioCreadorId || t.usuario_creador_id,
        t.sucursalId || t.sucursal_id,
        t.nTitulo || t.n_titulo,
        t.nFormato || t.n_formato,
        t.fechaPresentacion || t.fecha_presentacion,
        t.observacionesGenerales || t.observaciones_generales,
        (t.tarjetaEnOficina ?? t.tarjeta_en_oficina) ? 1 : 0,
        t.fechaTarjetaEnOficina || t.fecha_tarjeta_en_oficina,
        (t.placaEnOficina ?? t.placa_en_oficina) ? 1 : 0,
        t.fechaPlacaEnOficina || t.fecha_placa_en_oficina,
        (t.entregoTarjeta ?? t.entrego_tarjeta) ? 1 : 0,
        t.fechaEntregaTarjeta || t.fecha_entrega_tarjeta,
        t.metodoEntregaTarjeta || t.metodo_entrega_tarjeta,
        (t.entregoPlaca ?? t.entrego_placa) ? 1 : 0,
        t.fechaEntregaPlaca || t.fecha_entrega_placa,
        t.metodoEntregaPlaca || t.metodo_entrega_placa,
        t.observacionPlaca || t.observacion_placa,
        t.createdAt || t.created_at,
        t.updatedAt || t.updated_at,
        t.deletedAt || t.deleted_at,
      ],
    );
  }

  for (const td of pullData.tramiteDetalles || []) {
    await sqlite.execute(
      "INSERT OR REPLACE INTO tramite_detalles (id, tramite_id, empresa_gestora_id, representante_legal_id, presentante_id, tipo_boleta, numero_boleta, fecha_boleta, dua, num_formato_inmatriculacion, numero_recibo_tramite, clausula_monto, clausula_forma_pago, clausula_pago_bancarizado, aclaracion_dice, aclaracion_debe_decir, created_at, updated_at, deleted_at, sync_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, 'SYNCED')",
      [
        td.id,
        td.tramiteId || td.tramite_id,
        td.empresaGestoraId || td.empresa_gestora_id,
        td.representanteLegalId || td.representante_legal_id,
        td.presentanteId || td.presentante_id,
        td.tipoBoleta || td.tipo_boleta,
        td.numeroBoleta || td.numero_boleta,
        td.fechaBoleta || td.fecha_boleta,
        td.dua,
        td.numFormatoInmatriculacion || td.num_formato_inmatriculacion,
        td.numeroReciboTramite || td.numero_recibo_tramite,
        td.clausulaMonto ?? td.clausula_monto,
        td.clausulaFormaPago || td.clausula_forma_pago,
        td.clausulaPagoBancarizado || td.clausula_pago_bancarizado,
        td.aclaracionDice || td.aclaracion_dice,
        td.aclaracionDebeDecir || td.aclaracion_debe_decir,
        td.createdAt || td.created_at,
        td.updatedAt || td.updated_at,
        td.deletedAt || td.deleted_at,
      ],
    );
  }

  for (const conf of pullData.conflictos || []) {
    await sqlite.execute(
      "INSERT OR REPLACE INTO sync_conflictos (id, tabla_afectada, registro_id, identificador_visual, datos_locales, datos_remotos, resuelto, fecha_conflicto) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
      [
        conf.id,
        conf.tablaAfectada || conf.tabla_afectada,
        conf.registroId || conf.registro_id,
        conf.identificadorVisual || conf.identificador_visual,
        typeof conf.datosLocales === "string"
          ? conf.datosLocales
          : JSON.stringify(conf.datosLocales),
        typeof conf.datosRemotos === "string"
          ? conf.datosRemotos
          : JSON.stringify(conf.datosRemotos),
        conf.resuelto ? 1 : 0,
        new Date(conf.fechaConflicto || conf.fecha_conflicto).getTime(),
      ],
    );
  }
}

export const executePull = async (
  config: { apiUrl: string },
  userId: string,
  sqlite: any,
) => {
  try {
    const lastSyncIso = localStorage.getItem("valeska_last_sync") || "";

    const response = await fetch(
      `${config.apiUrl}/sync/pull?lastSyncIso=${lastSyncIso}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
          "ngrok-skip-browser-warning": "true",
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.message || `HTTP error! status: ${response.status}`,
      );
    }

    const data = await response.json();

    await processPullSync(sqlite, data);

    if (data.serverTimestamp) {
      localStorage.setItem("valeska_last_sync", data.serverTimestamp);
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error en Pull Sync:", error);
    throw error;
  }
};
