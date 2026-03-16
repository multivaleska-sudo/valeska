export const MOCK_TRAMITES = Array.from({ length: 45 }, (_, i) => ({
    id: i + 1,
    n_titulo: `2026-${(1000 + i).toString().padStart(5, '0')}`,
    cliente: i % 3 === 0 ? "JUAN PEREZ GARCIA" : i % 2 === 0 ? "MARIO ALVAREZ ORDOÑEZ" : "INVERSIONES SELVA S.A.C.",
    dni: i % 3 === 0 ? "46654053" : i % 2 === 0 ? "04809127" : "20601234567",
    tramite: i % 2 === 0 ? "Primera Inscripción Vehicular" : "Transferencia Notarial",
    situacion: i % 4 === 0 ? "Observado" : i % 5 === 0 ? "Concluido" : "En calificación",
    fecha_presentacion: `2026-03-${(10 + (i % 20)).toString().padStart(2, '0')}`,
    empresa_gestiona: i % 2 === 0 ? "VALESKA CENTRAL" : "SUCURSAL NORTE",
}));