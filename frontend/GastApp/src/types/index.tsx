export type Categoria =
| 'ahorro'
| 'comida'
| 'casa'
| 'gastos'
| 'ocio'
| 'salud'
| 'suscripciones'
| "";

export interface Gastos {
  nombre: string;
  cantidad: number;
  categoria: Categoria;
  id?: string;
  fecha?: number;
};

export const initialGastoState: Gastos = {
  id: '',
  nombre: '',
  cantidad: 0,
  categoria: "",
  fecha: undefined
};
