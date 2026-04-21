import Database from "@tauri-apps/plugin-sql";

type TableInfo = {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: any;
  pk: number;
};

function isColumnNotNull(tableInfo: TableInfo[], columnName: string) {
  const col = tableInfo.find((c) => c.name === columnName);
  return col?.notnull === 1;
}

async function tableExists(db: any, table: string) {
  const res = await db.select(
    "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
    [table],
  );
  return (res as any[]).length > 0;
}

async function countRows(db: any, table: string) {
  const res = await db.select(`SELECT COUNT(*) as c FROM ${table}`);
  return (res as any[])[0]?.c ?? 0;
}

export async function runSchemaUpdate() {
  const db = await Database.load("sqlite:valeska.db");

  let tx = false;

  try {
    console.log("🔍 Verificando migración...");
    // =============================
    // EXISTENCIA
    // =============================
    const clientesExists = await tableExists(db, "clientes");
    const vehiculosExists = await tableExists(db, "vehiculos");
    const tramitesExists = await tableExists(db, "tramites");
    const repLegalesExists = await tableExists(db, "representantes_legales");
    const presentantesExists = await tableExists(db, "presentantes");

    const clientesInfo = clientesExists
      ? ((await db.select("PRAGMA table_info(clientes)")) as TableInfo[])
      : [];

    const vehiculosInfo = vehiculosExists
      ? ((await db.select("PRAGMA table_info(vehiculos)")) as TableInfo[])
      : [];

    const tramitesInfo = tramitesExists
      ? ((await db.select("PRAGMA table_info(tramites)")) as TableInfo[])
      : [];

    const repLegalesInfo = repLegalesExists
      ? ((await db.select(
          "PRAGMA table_info(representantes_legales)",
        )) as TableInfo[])
      : [];

    const presentantesInfo = presentantesExists
      ? ((await db.select("PRAGMA table_info(presentantes)")) as TableInfo[])
      : [];

    // =============================
    // VALIDACIÓN
    // =============================
    const needsClientes =
      clientesExists &&
      (isColumnNotNull(clientesInfo, "numero_documento") ||
        isColumnNotNull(clientesInfo, "razon_social_nombres"));

    const needsVehiculos =
      vehiculosExists &&
      (isColumnNotNull(vehiculosInfo, "chasis_vin") ||
        isColumnNotNull(vehiculosInfo, "marca"));

    const needsRepLegales =
      repLegalesExists &&
      (isColumnNotNull(repLegalesInfo, "dni") ||
        isColumnNotNull(repLegalesInfo, "nombres") ||
        isColumnNotNull(repLegalesInfo, "primer_apellido"));

    const needsPresentantes =
      presentantesExists &&
      (isColumnNotNull(presentantesInfo, "dni") ||
        isColumnNotNull(presentantesInfo, "nombres") ||
        isColumnNotNull(presentantesInfo, "primer_apellido"));

    const needsTramites =
      tramitesExists && isColumnNotNull(tramitesInfo, "codigo_verificacion");

    if (
      !(
        needsClientes ||
        needsVehiculos ||
        needsRepLegales ||
        needsPresentantes ||
        needsTramites
      )
    ) {
      console.log("✅ DB ya actualizada");
      return;
    }

    console.log("⚙️ Migrando...");

    await db.execute("PRAGMA foreign_keys = OFF;");
    await db.execute("BEGIN TRANSACTION;");
    tx = true;

    // =============================
    // CLIENTES
    // =============================
    if (needsClientes) {
      await db.execute(`
        CREATE TABLE clientes_new (
          id TEXT PRIMARY KEY NOT NULL,
          tipo_documento TEXT NOT NULL,
          numero_documento TEXT,
          razon_social_nombres TEXT,
          estado_civil TEXT DEFAULT 'SOLTERO(A)',
          domicilio TEXT,
          telefono TEXT,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          deleted_at INTEGER,
          sync_status TEXT NOT NULL DEFAULT 'LOCAL_INSERT'
        );
      `);

      await db.execute(`
        INSERT INTO clientes_new (
          id, tipo_documento, numero_documento, razon_social_nombres,
          estado_civil, domicilio, telefono,
          created_at, updated_at, deleted_at, sync_status
        )
        SELECT
          id, tipo_documento, numero_documento, razon_social_nombres,
          estado_civil, domicilio, telefono,
          created_at, updated_at, deleted_at, sync_status
        FROM clientes;
      `);

      // VALIDACIÓN
      if (
        (await countRows(db, "clientes")) !==
        (await countRows(db, "clientes_new"))
      ) {
        throw new Error("clientes: mismatch de filas");
      }

      await db.execute("DROP TABLE clientes;");
      await db.execute("ALTER TABLE clientes_new RENAME TO clientes;");

      await db.execute(`
        CREATE UNIQUE INDEX IF NOT EXISTS cliente_documento_idx
        ON clientes(numero_documento)
        WHERE numero_documento IS NOT NULL;
      `);
    }

    // =============================
    // VEHICULOS
    // =============================
    if (needsVehiculos) {
      await db.execute(`
        CREATE TABLE vehiculos_new (
          id TEXT PRIMARY KEY NOT NULL,
          chasis_vin TEXT,
          placa TEXT,
          motor TEXT,
          marca TEXT,
          modelo TEXT,
          color TEXT,
          categoria TEXT DEFAULT 'L3 - B',
          anio_fabricacion TEXT,
          anio_modelo TEXT,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          deleted_at INTEGER,
          sync_status TEXT NOT NULL DEFAULT 'LOCAL_INSERT'
        );
      `);

      await db.execute(`
        INSERT INTO vehiculos_new (
          id, chasis_vin, placa, motor, marca, modelo, color,
          categoria, anio_fabricacion, anio_modelo,
          created_at, updated_at, deleted_at, sync_status
        )
        SELECT
          id, chasis_vin, placa, motor, marca, modelo, color,
          categoria, anio_fabricacion, anio_modelo,
          created_at, updated_at, deleted_at, sync_status
        FROM vehiculos;
      `);

      if (
        (await countRows(db, "vehiculos")) !==
        (await countRows(db, "vehiculos_new"))
      ) {
        throw new Error("vehiculos: mismatch");
      }

      await db.execute("DROP TABLE vehiculos;");
      await db.execute("ALTER TABLE vehiculos_new RENAME TO vehiculos;");
    }

    // =============================
    // REPRESENTANTES LEGALES
    // =============================
    if (needsRepLegales) {
      await db.execute(`
    CREATE TABLE representantes_legales_new (
      id TEXT PRIMARY KEY NOT NULL,
      empresa_gestora_id TEXT NOT NULL,
      dni TEXT,
      nombres TEXT,
      primer_apellido TEXT,
      segundo_apellido TEXT,
      partida_registral TEXT,
      oficina_registral TEXT,
      domicilio TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      deleted_at INTEGER,
      sync_status TEXT NOT NULL DEFAULT 'LOCAL_INSERT',
      FOREIGN KEY (empresa_gestora_id) REFERENCES empresas_gestoras(id)
    );
  `);

      await db.execute(`
    INSERT INTO representantes_legales_new (
      id, empresa_gestora_id, dni, nombres, primer_apellido,
      segundo_apellido, partida_registral, oficina_registral, domicilio,
      created_at, updated_at, deleted_at, sync_status
    )
    SELECT
      id, empresa_gestora_id, dni, nombres, primer_apellido,
      segundo_apellido, partida_registral, oficina_registral, domicilio,
      created_at, updated_at, deleted_at, sync_status
    FROM representantes_legales;
  `);

      if (
        (await countRows(db, "representantes_legales")) !==
        (await countRows(db, "representantes_legales_new"))
      ) {
        throw new Error("representantes_legales: mismatch");
      }

      await db.execute("DROP TABLE representantes_legales;");
      await db.execute(
        "ALTER TABLE representantes_legales_new RENAME TO representantes_legales;",
      );

      await db.execute(`
    CREATE UNIQUE INDEX IF NOT EXISTS representante_dni_idx
    ON representantes_legales(dni)
    WHERE dni IS NOT NULL;
  `);

      await db.execute(`
    CREATE INDEX IF NOT EXISTS rep_empresa_idx
    ON representantes_legales(empresa_gestora_id);
  `);
    }

    // =============================
    // PRESENTANTES
    // =============================
    if (needsPresentantes) {
      await db.execute(`
    CREATE TABLE presentantes_new (
      id TEXT PRIMARY KEY NOT NULL,
      dni TEXT,
      nombres TEXT,
      primer_apellido TEXT,
      segundo_apellido TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      deleted_at INTEGER,
      sync_status TEXT NOT NULL DEFAULT 'LOCAL_INSERT'
    );
  `);

      if (presentantesExists) {
        await db.execute(`
      INSERT INTO presentantes_new (
        id, dni, nombres, primer_apellido, segundo_apellido,
        created_at, updated_at, deleted_at, sync_status
      )
      SELECT
        id, dni, nombres, primer_apellido, segundo_apellido,
        created_at, updated_at, deleted_at, sync_status
      FROM presentantes;
    `);

        if (
          (await countRows(db, "presentantes")) !==
          (await countRows(db, "presentantes_new"))
        ) {
          throw new Error("presentantes: mismatch");
        }
      }

      await db.execute("DROP TABLE IF EXISTS presentantes;");
      await db.execute("ALTER TABLE presentantes_new RENAME TO presentantes;");

      await db.execute(`
    CREATE UNIQUE INDEX IF NOT EXISTS presentante_dni_idx
    ON presentantes(dni)
    WHERE dni IS NOT NULL;
  `);
    }
    // =============================
    // TRAMITES
    // =============================
    if (needsTramites) {
      await db.execute(`
        CREATE TABLE tramites_new (
          id TEXT PRIMARY KEY NOT NULL,
          codigo_verificacion TEXT,
          tramite_anio TEXT NOT NULL,
          cliente_id TEXT NOT NULL,
          vehiculo_id TEXT NOT NULL,
          tipo_tramite_id TEXT NOT NULL,
          situacion_id TEXT NOT NULL,
          usuario_creador_id TEXT NOT NULL,
          sucursal_id TEXT NOT NULL,
          n_titulo TEXT,
          n_formato TEXT,
          fecha_presentacion TEXT NOT NULL,
          observaciones_generales TEXT,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          deleted_at INTEGER,
          sync_status TEXT NOT NULL DEFAULT 'LOCAL_INSERT',
          FOREIGN KEY (cliente_id) REFERENCES clientes(id),
          FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id)
        );
      `);

      await db.execute(`
        INSERT INTO tramites_new (
          id, codigo_verificacion, tramite_anio, cliente_id, vehiculo_id,
          tipo_tramite_id, situacion_id, usuario_creador_id, sucursal_id,
          n_titulo, n_formato, fecha_presentacion,
          observaciones_generales,
          created_at, updated_at, deleted_at, sync_status
        )
        SELECT
          id, codigo_verificacion, tramite_anio, cliente_id, vehiculo_id,
          tipo_tramite_id, situacion_id, usuario_creador_id, sucursal_id,
          n_titulo, n_formato, fecha_presentacion,
          observaciones_generales,
          created_at, updated_at, deleted_at, sync_status
        FROM tramites;
      `);

      if (
        (await countRows(db, "tramites")) !==
        (await countRows(db, "tramites_new"))
      ) {
        throw new Error("tramites: mismatch");
      }

      await db.execute("DROP TABLE tramites;");
      await db.execute("ALTER TABLE tramites_new RENAME TO tramites;");
    }

    await db.execute("COMMIT;");
    await db.execute("PRAGMA foreign_keys = ON;");

    console.log("🔥 MIGRACIÓN SEGURA COMPLETA");
  } catch (error) {
    if (tx) await db.execute("ROLLBACK;");
    await db.execute("PRAGMA foreign_keys = ON;");
    console.error("❌ ERROR MIGRACIÓN:", error);
    throw error;
  }
}
