# 🧾 Sistema Valeska

Repositorio oficial del Sistema Valeska (v0.1.0). Una aplicación de escritorio nativa diseñada bajo una arquitectura **Offline-First**, orientada a optimizar la gestión logística, operativa y documental de trámites vehiculares y empresariales.

---

## 📌 Estado de Implementación (v0.1.0)

El sistema ha superado su fase inicial y actualmente cuenta con un ecosistema de motores y módulos **100% funcionales**, diseñados para ofrecer una experiencia operativa fluida y segura:

### ✅ Módulos Operativos y de Interfaz (UI)

- 📊 **Dashboard Operativo:** Un panel principal e intuitivo que ofrece acceso rápido a las métricas clave y un resumen en tiempo real del estado general del sistema.
- 📝 **Gestión de Trámites:** El núcleo operativo de la aplicación. Permite el registro completo, edición y seguimiento logístico. Incluye soporte para **escaneo de códigos de barras**, captura de documentos mediante **cámara web**, y un control físico exhaustivo de tarjetas, placas y observaciones.
- 📄 **Centro de Documentos y Plantillas:** Un potente motor integrado que cuenta con un **Editor Visual de Layouts**. Permite crear, personalizar y previsualizar documentos dinámicos y generar formatos directamente en PDF para su impresión.
- 🧾 **Visor y Editor XML (Facturación):** Módulo especializado para la carga, lectura interactiva y vista previa de facturas electrónicas (estructuras UBL/SUNAT), facilitando la revisión ágil de comprobantes.
- 🏢 **Directorio de Clientes y Empresas:** Administrador centralizado para mantener, buscar y gestionar toda la información vital de contactos, presentantes y empresas gestoras recurrentes.
- 🔄 **Panel Central y Sincronización:** Infraestructura preparada para el trabajo "Offline-First". Incluye gestión de dispositivos autorizados, monitoreo de estado de red, y un sistema inteligente para identificar y resolver conflictos de datos.
- 🔐 **Seguridad y Control de Usuarios:** Autenticación segura de personal, configuración inicial del sistema (Setup), y un panel de administración para crear operadores, asignar roles y proteger la información.
- ⚙️ **Configuración de Catálogos:** Herramientas para administrar tipos de trámites y "Situaciones" (estados con indicadores de color personalizados), permitiendo adaptar el sistema a cualquier cambio en la oficina.

### ✅ Infraestructura de Escritorio (Tauri + Rust)

- **Entorno Nativo:** Compilación optimizada para Windows (formato `.exe` utilizando el motor WebView2), garantizando un bajo consumo de recursos y un rendimiento ágil.
- **Seguridad Perimetral:** Implementación de lectura directa de hardware físico (validación por MAC Address) para asegurar que el sistema solo se ejecute en los equipos de oficina previamente autorizados.
- **Criptografía Avanzada:** Uso de librerías criptográficas de alto nivel en Rust (`aes-gcm`, `sha2`) para la encriptación y desencriptación de perfiles de aprovisionamiento, protegiendo así toda la información sensible.

### ✅ Capa de Datos Local y Seguridad (Offline-First)

- **Base de Datos Embebida:** Motor SQLite integrado de forma nativa a través de Tauri y sincronizado con la interfaz mediante Drizzle ORM. Garantiza una persistencia de datos rápida, robusta y **operatividad total sin depender de una conexión a internet**.
- **Autenticación y Control de Accesos:** Sistema de validación de operadores locales, control estricto de roles de usuario y un flujo de configuración inicial (Setup) completamente implementados.
- **Centro de Resolución de Conflictos:** Infraestructura pre-configurada para el paradigma "Offline-First", equipada con un panel inteligente diseñado para auditar, identificar y permitir la resolución visual de colisiones de datos locales de manera intuitiva.

---

_Desarrollado con React, TypeScript, Tailwind CSS, ShadcnUI y Tauri._
