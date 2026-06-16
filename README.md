# Sistema Valeska

Aplicación de escritorio para la gestión operativa, documental y sincronizada de trámites vehiculares. Está construida con React, TypeScript, Tauri 2, SQLite local y Drizzle ORM bajo una arquitectura offline-first: la oficina puede trabajar localmente y sincronizar con el backend central cuando exista conexión.

Versión actual del frontend: `5.3.0`.

## Resumen

Valeska es el frontend de escritorio del ecosistema Valeska. La aplicación combina una base de datos SQLite embebida, comandos nativos en Rust y una interfaz React para registrar trámites, administrar maestros, generar documentos, resolver conflictos, exportar reportes gerenciales en Excel y sincronizar información con la API central.

El backend esperado es la API NestJS de Valeska, especialmente sus endpoints de autenticación, aprovisionamiento de dispositivo y sincronización por entidad.

## Funciones Principales

### Trámites Vehiculares
- Registro, edición y consulta de trámites.
- Seguimiento de tarjetas, placas, entregas, fechas, observaciones y estados operativos.
- Asociación de cliente, vehículo, tipo de trámite, situación, usuario creador y sucursal.
- Detalle de trámite con empresa gestora, representante legal, presentante, boletas, recibos y cláusulas.
- Panel avanzado de filtros dinámicos (búsqueda rápida, filtros frecuentes, filtrado por Motor, Chasis, VIN, situación, etc.) sincronizados en tiempo real.
- Lectura de códigos de barras para agilizar búsquedas o ingreso de datos.
- Captura de documentos mediante cámara web.

### Exportación y Reportes
- Motor de exportación Excel avanzado en el panel de trámites.
- Volcado multi-hoja (`Reporte_General`, `BD_Tramites`, `BD_Clientes`, `BD_Vehiculos`, etc.).
- Formateo estricto de 36 columnas (incluyendo campos de tracto sucesivo y facturación) para compatibilidad con sistemas externos y auditoría, respetando la estructura relacional.

### Maestros y Directorios
- Clientes y Vehículos.
- Empresas gestoras, Presentantes y Representantes legales.
- Sistema de lectura/escritura basado en roles (ej. solo `ADMIN_CENTRAL` puede modificar o eliminar información crítica de Empresas y Representantes).
- Perfiles de gestor o empadronamiento.
- Plantillas de mensajes y Catálogos de tipos de trámite.
- Situaciones con color y estado activo.

### Documentos y Plantillas
- Centro de documentos para trámites.
- Editor visual de plantillas HTML y layouts.
- Generación y previsualización de documentos imprimibles.
- Impresión de documentos desde rutas específicas por trámite y plantilla.
- Soporte para variables de plantilla centralizadas en `src/app/constants/templateVariables.ts`.

### XML, PDF y Datos Externos
- Lector y editor XML para comprobantes electrónicos.
- Parser de XML SUNAT/UBL desde comandos Tauri.
- Parser de PDF SUNARP.
- Extracción de información de empresas y facturas.
- Utilidades de conversión de imagen y generación PDF.

### Sincronización offline-first
- Base local SQLite (`valeska.db`) administrada por el plugin SQL de Tauri.
- Esquema TypeScript con Drizzle ORM.
- Migraciones locales embebidas en Tauri.
- Sincronización push por chunks hacia `/sync/push`.
- Consulta de estado asíncrono por `/sync/push-status/:outboxId`.
- Sincronización pull paginada por entidad desde `/sync/pull`.
- Cursores locales por entidad en `sync_cursors`.
- Registro local de chunks en `sync_push_chunks`.
- Resolución de conflictos mediante la entidad `sync_conflicto`.
- Protección de cambios locales usando `sync_status`; los datos remotos no pisan registros locales pendientes.

### Autenticación, Dispositivo y Seguridad
- Login local y login/provisioning contra la nube.
- Aprovisionamiento cloud por `/auth/provision-device`.
- Recuperación de contraseña con `/auth/reset-code` y `/auth/reset-password`.
- Uso de JWT para llamadas cloud.
- Header `x-device-mac` para autorizar sincronización.
- Comandos nativos para obtener MAC y nombre del equipo.
- Archivos de aprovisionamiento cifrados con AES-GCM y llave derivada con SHA-256.
- Control de roles estricto en el frontend limitando visualizaciones y acciones a nivel de componente.

### Administración Central
- Panel central.
- Lista de dispositivos.
- Gestión de conflictos.
- Resolución de conflictos por registro.
- Configuración general de la aplicación.
- Indicadores de conexión y sincronización.

### WhatsApp y Comunicación
- Módulo `wasap` para flujos de comunicación.
- Plantillas de mensajes sincronizables.

### Actualizaciones de Escritorio
- Integración con `@tauri-apps/plugin-updater`.
- Integración con `@tauri-apps/plugin-process`.
- Configuración de updater en `src-tauri/tauri.conf.json`.
- Endpoint esperado:
```text
https://valeska-api.studios-tkoh.online/api/desktop-updates/{{target}}/{{arch}}/{{current_version}}
```

## Arquitectura

```text
React + TypeScript
  -> Lógica de aplicación en src/app/logic
  -> Servicios HTTP/sync en src/app/services
  -> Tipos compartidos en src/app/types
  -> SQLite local vía @tauri-apps/plugin-sql
  -> Drizzle ORM para schema local
  -> Tauri/Rust para funciones nativas
  -> Backend NestJS para auth, sync y updates
```

## Estructura Relevante

```text
src/app/pages                  Pantallas principales
src/app/components             Componentes de interfaz
src/app/logic                  Hooks y lógica por módulo
src/app/services/syncService.ts Cliente HTTP de sincronización
src/app/types/sync.types.ts    Contratos de sync con backend
src/app/db/schema.ts           Esquema local Drizzle
src/app/db/migrations          Migraciones SQLite locales
src-tauri/src/lib.rs           Comandos nativos y registro de plugins
src-tauri/tauri.conf.json      Configuración Tauri, bundle y updater
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

## Instalación

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

## Build Aplicación de Escritorio

```bash
npm run tauri build
```

El build genera artefactos de escritorio y, según la configuración actual, también artefactos para updater.

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

## Flujo de Sincronización

1. El usuario inicia sesión o se aprovisiona contra la nube.
2. El frontend guarda JWT, MAC autorizada y datos base locales.
3. El push agrupa registros locales con `sync_status != 'SYNCED'`.
4. Cada entidad se envía por chunks a `/sync/push`.
5. El frontend consulta `/sync/push-status/:outboxId`.
6. Solo si el estado termina en `COMPLETED`, los registros locales se marcan como `SYNCED`.
7. El pull descarga por entidad usando cursor `cursorTimestamp + lastId`.
8. Los datos remotos solo se aplican si el registro local está `SYNCED`.
9. Los conflictos se descargan y resuelven mediante `sync_conflicto`.

## Módulos Principales

- **Dashboard:** resumen operativo y accesos rápidos.
- **Trámites:** alta, edición, detalle, documentos, seguimiento y exportación avanzada a Excel.
- **Empresas:** directorio de empresas gestoras y representantes legales (con permisos basados en roles).
- **Catálogos:** tipos de trámite y configuraciones base.
- **Situaciones:** estados operativos con color.
- **Perfiles:** perfiles de gestor/empadronamiento.
- **XML:** lectura y edición de comprobantes.
- **Documentos:** plantillas, generación e impresión.
- **Sync:** sincronización manual y estado de sincronización.
- **Central:** dispositivos, conflictos y administración central.
- **Usuarios:** operadores, roles y transferencias.
- **Configuración:** diagnóstico de dispositivo, datos de sesión y actualizaciones.
- **Wasap:** comunicación y plantillas de mensajes.

## Notas de Despliegue

- El backend publicado debe reconstruirse cuando cambien contratos de sync, auth o updater.
- El frontend debe apuntar al backend correcto mediante `VITE_API_URL`.
- Para Tauri Updater, la llave privada de firma no debe guardarse en el repositorio.
- Los artefactos firmados deben ser servidos por el backend con el formato requerido por Tauri.
- En Windows, el instalador se configura en modo pasivo.

## Validación Recomendada

```bash
npm run build
npm run tauri build
```

También se recomienda probar manualmente:
- Login cloud.
- Provisioning de MAC nueva.
- Pull desde cero.
- Push de cliente, vehículo, trámite y tramite_detalle.
- Resolución de conflicto.
- Generación de documento.
- Parser XML/PDF.
- Verificación de updater cuando existan artefactos firmados.
- Funcionalidades de exportación Excel de 36 columnas.

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
- XLSX SheetJS (Exportación Excel multi-hoja)
- Tauri SQL, FS, Dialog, Shell, Log, Process y Updater plugins

## Estado Actual

El frontend está orientado a operación real offline-first, con sincronización bidireccional contra el backend central, gestión documental, reportes gerenciales en Excel y soporte nativo para Windows.
