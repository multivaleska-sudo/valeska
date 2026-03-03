## 🧾 Sistema Valeska – Estado del Repositorio

Actualmente, este repositorio contiene la base estructural del proyecto, enfocándose en la capa de interfaz de usuario (UI) y la configuración inicial del entorno de escritorio.

---

## 📌 Estado de Implementación

### ✅ Interfaz de Usuario (Frontend)

- Vistas principales implementadas:
  - Dashboard
  - Trámites
  - Clientes
  - XML
  - Recibos

- Sistema de rutas configurado.
- Componentes base maquetados e integrados.
- Stack utilizado:
  - React
  - TypeScript
  - Tailwind CSS
  - ShadcnUI

---

### ✅ Infraestructura de Escritorio

- Entorno nativo inicializado mediante **Tauri** (`src-tauri`).
- Preparado para la compilación de la aplicación en Windows.

---

### ⚠️ Capa de Datos Local (Offline-First)

- Definición inicial de esquemas en:

  ```
  src/app/db/schema.ts
  ```

- **Pendiente:**
  - Integración final del ORM local.
  - Configuración de SQLite vía Tauri.
  - Persistencia sin conexión completamente funcional.

---

### ❌ Motor de Documentos y XML

**Pendiente de implementación:**

- Lógica de extracción de datos desde facturas XML (SUNAT).
- Generación "pixel-perfect" de:
  - Formatos A
  - Formatos B
  - Formatos R

- Exportación en:
  - PDF
  - Excel

---

### ❌ Motor de Sincronización

**Pendiente de implementación:**

- Cola de envíos (Outbox pattern).
- Sistema de locking.
- Gestión de conflictos contra servidor central.
- Estrategia completa de sincronización bidireccional.

---

### ❌ Autenticación y Sesiones

- Interfaces creadas.
- **Pendiente:**
  - Validación de usuarios locales.
  - Gestión de roles.
  - Integración con base de datos local.

---

## 🔄 Próximos Pasos

Este documento se actualizará conforme se integren los módulos funcionales y de infraestructura requeridos para el funcionamiento **Offline-First** completo del sistema.
