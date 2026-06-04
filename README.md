# Sistema Valeska

Aplicacion de escritorio para la gestion operativa, documental y sincronizada de tramites vehiculares. Esta construida con React, TypeScript, Tauri 2, SQLite local y Drizzle ORM bajo una arquitectura offline-first: la oficina puede trabajar localmente y sincronizar con el backend central cuando exista conexion.

Version actual del frontend: `3.0.2`.

## Resumen

Valeska es el frontend de escritorio del ecosistema Valeska. La aplicacion combina una base de datos SQLite embebida, comandos nativos en Rust y una interfaz React para registrar tramites, administrar maestros, generar documentos, resolver conflictos y sincronizar informacion con la API central.

El backend esperado es la API NestJS de Valeska, especialmente sus endpoints de autenticacion, aprovisionamiento de dispositivo y sincronizacion por entidad.

## Funciones Principales

### Tramites vehiculares

- Registro, edicion y consulta de tramites.
- Seguimiento de tarjetas, placas, entregas, fechas, observaciones y estados operativos.
- Asociacion de cliente, vehiculo, tipo de tramite, situacion, usuario creador y sucursal.
- Detalle de tramite con empresa gestora, representante legal, presentante, boletas, recibos y clausulas.
- Lectura de codigos de barras para agilizar busquedas o ingreso de datos.
- Captura de documentos mediante camara web.

### Maestros y directorios

- Clientes.
- Vehiculos.
- Empresas gestoras.
- Presentantes.
- Representantes legales.
- Perfiles de gestor o empadronamiento.
- Plantillas de mensajes.
- Catalogos de tipos de tramite.
- Situaciones con color y estado activo.

### Documentos y plantillas

- Centro de documentos para tramites.
- Editor de plantillas HTML.
- Editor visual de layouts.
- Generacion y previsualizacion de documentos imprimibles.
- Impresion de documentos desde rutas especificas por tramite y plantilla.
- Soporte para variables de plantilla centralizadas en `src/app/constants/templateVariables.ts`.

### XML, PDF y datos externos

- Lector y editor XML para comprobantes electronicos.
- Parser de XML SUNAT/UBL desde comandos Tauri.
- Parser de PDF SUNARP.
- Extraccion de informacion de empresas y facturas.
- Utilidades de conversion de imagen y generacion PDF.

### Sincronizacion offline-first

- Base local SQLite (`valeska.db`) administrada por el plugin SQL de Tauri.
- Esquema TypeScript con Drizzle ORM.
- Migraciones locales embebidas en Tauri.
- Sincronizacion push por chunks hacia `/sync/push`.
- Consulta de estado asincrono por `/sync/push-status/:outboxId`.
- Sincronizacion pull paginada por entidad desde `/sync/pull`.
- Cursores locales por entidad en `sync_cursors`.
- Registro local de chunks en `sync_push_chunks`.
- Resolucion de conflictos mediante la entidad `sync_conflicto`.
- Proteccion de cambios locales usando `sync_status`; los datos remotos no pisan registros locales pendientes.

### Autenticacion, dispositivo y seguridad

- Login local y login/provisioning contra la nube.
- Aprovisionamiento cloud por `/auth/provision-device`.
- Recuperacion de contrasena con `/auth/reset-code` y `/auth/reset-password`.
- Uso de JWT para llamadas cloud.
- Header `x-device-mac` para autorizar sincronizacion.
- Comandos nativos para obtener MAC y nombre del equipo.
- Archivos de aprovisionamiento cifrados con AES-GCM y llave derivada con SHA-256.

### Administracion central

- Panel central.
- Lista de dispositivos.
- Gestion de conflictos.
- Resolucion de conflictos por registro.
- Configuracion general de la aplicacion.
- Indicadores de conexion y sincronizacion.

### WhatsApp y comunicacion

- Modulo `wasap` para flujos de comunicacion.
- Plantillas de mensajes sincronizables.

### Actualizaciones de escritorio

- Integracion con `@tauri-apps/plugin-updater`.
- Integracion con `@tauri-apps/plugin-process`.
- Configuracion de updater en `src-tauri/tauri.conf.json`.
- Endpoint esperado:

```text
https://valeska-api.studios-tkoh.online/api/desktop-updates/{{target}}/{{arch}}/{{current_version}}
```

## Arquitectura

```text
React + TypeScript
  -> Logica de aplicacion en src/app/logic
  -> Servicios HTTP/sync en src/app/services
  -> Tipos compartidos en src/app/types
  -> SQLite local via @tauri-apps/plugin-sql
  -> Drizzle ORM para schema local
  -> Tauri/Rust para funciones nativas
  -> Backend NestJS para auth, sync y updates
```

## Estructura Relevante

```text
src/app/pages                  Pantallas principales
src/app/components             Componentes de interfaz
src/app/logic                  Hooks y logica por modulo
src/app/services/syncService.ts Cliente HTTP de sincronizacion
src/app/types/sync.types.ts    Contratos de sync con backend
src/app/db/schema.ts           Esquema local Drizzle
src/app/db/migrations          Migraciones SQLite locales
src-tauri/src/lib.rs           Comandos nativos y registro de plugins
src-tauri/tauri.conf.json      Configuracion Tauri, bundle y updater
```

## Requisitos

- Node.js compatible con Vite 6.
- npm.
- Rust toolchain.
- Tauri CLI v2.
- WebView2 en Windows.
- Backend Valeska disponible para funciones cloud.

## Variables de Entorno

El frontend necesita la URL de la API:

```env
VITE_API_URL=https://valeska-api.studios-tkoh.online
```

Para desarrollo local puede apuntar a:

```env
VITE_API_URL=http://localhost:3001
```

El backend debe exponer:

- `POST /auth/provision-device`
- `POST /auth/login`
- `POST /auth/reset-code`
- `POST /auth/reset-password`
- `POST /sync/push`
- `GET /sync/push-status/:outboxId`
- `GET /sync/pull`

## Instalacion

```bash
npm install
```

## Desarrollo Web

```bash
npm run dev
```

## Desarrollo Tauri

```bash
npm run tauri dev
```

## Build Frontend

```bash
npm run build
```

## Build Aplicacion de Escritorio

```bash
npm run tauri build
```

El build genera artefactos de escritorio y, segun la configuracion actual, tambien artefactos para updater.

## Base de Datos Local

La base local es `sqlite:valeska.db`. Las migraciones se registran en `src-tauri/src/lib.rs` y se aplican mediante `@tauri-apps/plugin-sql`.

Tablas importantes para sync:

- `sync_cursors`
- `sync_push_chunks`
- `sync_conflictos`
- `usuarios`
- `dispositivos`
- `sucursales`
- `tramites`
- `tramite_detalles`
- `clientes`
- `vehiculos`

El frontend conserva `sync_status` como fuente local de cambios pendientes. Operativamente, cualquier valor distinto de `SYNCED` se considera pendiente de push.

## Flujo de Sincronizacion

1. El usuario inicia sesion o se aprovisiona contra la nube.
2. El frontend guarda JWT, MAC autorizada y datos base locales.
3. El push agrupa registros locales con `sync_status != 'SYNCED'`.
4. Cada entidad se envia por chunks a `/sync/push`.
5. El frontend consulta `/sync/push-status/:outboxId`.
6. Solo si el estado termina en `COMPLETED`, los registros locales se marcan como `SYNCED`.
7. El pull descarga por entidad usando cursor `cursorTimestamp + lastId`.
8. Los datos remotos solo se aplican si el registro local esta `SYNCED`.
9. Los conflictos se descargan y resuelven mediante `sync_conflicto`.

## Modulos Principales

- Dashboard: resumen operativo y accesos rapidos.
- Tramites: alta, edicion, detalle, documentos y seguimiento.
- Empresas: directorio de empresas gestoras y datos relacionados.
- Catalogos: tipos de tramite y configuraciones base.
- Situaciones: estados operativos con color.
- Perfiles: perfiles de gestor/empadronamiento.
- XML: lectura y edicion de comprobantes.
- Documentos: plantillas, generacion e impresion.
- Sync: sincronizacion manual y estado de sincronizacion.
- Central: dispositivos, conflictos y administracion central.
- Usuarios: operadores, roles y transferencias.
- Configuracion: diagnostico de dispositivo, datos de sesion y actualizaciones.
- Wasap: comunicacion y plantillas de mensajes.

## Notas de Despliegue

- El backend publicado debe reconstruirse cuando cambien contratos de sync, auth o updater.
- El frontend debe apuntar al backend correcto mediante `VITE_API_URL`.
- Para Tauri Updater, la llave privada de firma no debe guardarse en el repositorio.
- Los artefactos firmados deben ser servidos por el backend con el formato requerido por Tauri.
- En Windows, el instalador se configura en modo pasivo.

## Validacion Recomendada

```bash
npm run build
```

```bash
npm run tauri build
```

Tambien se recomienda probar manualmente:

- Login cloud.
- Provisioning de MAC nueva.
- Pull desde cero.
- Push de cliente, vehiculo, tramite y tramite_detalle.
- Resolucion de conflicto.
- Generacion de documento.
- Parser XML/PDF.
- Verificacion de updater cuando existan artefactos firmados.

## Stack

- React
- TypeScript
- Vite
- Tauri 2
- Rust
- SQLite
- Drizzle ORM
- Tailwind CSS
- Radix UI
- Lucide React
- Tauri SQL, FS, Dialog, Shell, Log, Process y Updater plugins

## Estado Actual

El frontend esta orientado a operacion real offline-first, con sincronizacion bidireccional contra el backend central, gestion documental y soporte nativo para Windows.
