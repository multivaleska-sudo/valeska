export type CatalogoBase = {
    id: string;
    nombre: string;
    activo: boolean;
};

export type TipoTramite = CatalogoBase;

export type Situacion = CatalogoBase & {
    colorHex: string;
};