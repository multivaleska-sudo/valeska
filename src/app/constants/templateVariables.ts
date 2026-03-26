export const TEMPLATE_VARIABLES = [
  {
    category: "Datos del Cliente",
    items: [
      { tag: "{{CLIENTE_NOMBRE}}", label: "Nombre / Razón Social" },
      { tag: "{{CLIENTE_DOCUMENTO}}", label: "DNI / RUC" },
      { tag: "{{CLIENTE_TELEFONO}}", label: "Teléfono" },
      { tag: "{{CLIENTE_DIRECCION}}", label: "Dirección" },
    ],
  },
  {
    category: "Datos del Vehículo",
    items: [
      { tag: "{{VEHICULO_PLACA}}", label: "N° Placa" },
      { tag: "{{VEHICULO_MARCA}}", label: "Marca" },
      { tag: "{{VEHICULO_MODELO}}", label: "Modelo" },
      { tag: "{{VEHICULO_COLOR}}", label: "Color" },
      { tag: "{{VEHICULO_CHASIS}}", label: "Chasis / VIN" },
      { tag: "{{VEHICULO_MOTOR}}", label: "N° Motor" },
      { tag: "{{VEHICULO_ANIO}}", label: "Año Fabricación" },
    ],
  },
  {
    category: "Datos del Trámite",
    items: [
      { tag: "{{TRAMITE_CODIGO}}", label: "Código Interno" },
      { tag: "{{TRAMITE_TITULO}}", label: "N° Título" },
      { tag: "{{TRAMITE_FECHA}}", label: "Fecha Presentación" },
      { tag: "{{TRAMITE_TIPO}}", label: "Tipo de Trámite" },
      { tag: "{{TRAMITE_DIA}}", label: "Día Trámite" },
      { tag: "{{TRAMITE_MES_LETRAS}}", label: "Mes Trámite (Letras)" },
      { tag: "{{TRAMITE_ANIO}}", label: "Año Trámite" },
    ],
  },
  {
    category: "Presentante y Gestora",
    items: [
      { tag: "{{EMPRESA_NOMBRE}}", label: "Empresa Gestora (Razón Social)" },
      { tag: "{{EMPRESA_RUC}}", label: "RUC Empresa" },
      { tag: "{{EMPRESA_DIRECCION}}", label: "Dirección Empresa" },
      { tag: "{{EMPRESA_REPRESENTANTES}}", label: "Representante(s)" },
      {
        tag: "{{PRESENTANTE_PERSONA}}",
        label: "Presentante Completo (Con DNI)",
      },
      { tag: "{{PRESENTANTE_NOMBRES}}", label: "Nombres del Presentante" },
      { tag: "{{PRESENTANTE_PATERNO}}", label: "A. Paterno del Presentante" },
      { tag: "{{PRESENTANTE_MATERNO}}", label: "A. Materno del Presentante" },
      { tag: "{{PRESENTANTE_DNI}}", label: "DNI del Presentante" },
    ],
  },
  {
    category: "Cláusulas y Extras",
    items: [
      { tag: "{{CLAUSULA_MONTO}}", label: "Monto de Cancelación" },
      { tag: "{{CLAUSULA_FORMA_PAGO}}", label: "Forma de Pago" },
      { tag: "{{CLAUSULA_BANCARIZADO}}", label: "Pago Bancarizado" },
      { tag: "{{ACLARACION_DICE}}", label: "Aclaración (Dice)" },
      { tag: "{{ACLARACION_DEBE_DECIR}}", label: "Aclaración (Debe Decir)" },
    ],
  },
  {
    category: "Formulario SUNARP (Físico)",
    items: [
      { tag: "{{NUMERO_BOLETA}}", label: "Número Boleta" },
      { tag: "{{FECHA_BOLETA}}", label: "Fecha Boleta" },
      { tag: "{{DUA}}", label: "DUA N°" },
      { tag: "{{FORMATO_INMATRICULACION}}", label: "N° Formato Inma." },
    ],
  },
  {
    category: "Sistema",
    items: [{ tag: "{{FECHA_IMPRESION}}", label: "Fecha de Impresión" }],
  },
];
