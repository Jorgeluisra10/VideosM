/** Tipos del plan de escenas que genera la IA (ver src/dsl/catalogo.json para el detalle de cada elemento). */
export type ColorNombre = "rojo" | "azul" | "amarillo" | "hueso";

export type Elemento = {
  tipo: string;
  /** frase del guion a la que se ata la aparición del elemento */
  cuando: string;
  /** nº de aparición de esa frase si se repite (1 = primera) */
  n?: number | null;
  /** segundos de ajuste sobre el ancla (puede ser negativo) */
  desfase?: number | null;
  /** frase del guion a la que desaparece (null = dura toda la escena) */
  hasta?: string | null;
  [clave: string]: unknown;
};

/** Foto a pantalla completa detrás de una escena. */
export type FondoPlan = {
  /** nombre de archivo en public/media (ver src/data/media.json) */
  foto: string;
  /** "cubrir" rellena toda la pantalla (recorta); "marco" muestra la foto entera sobre un fondo desenfocado */
  modo?: "cubrir" | "marco" | null;
  /** movimiento de cámara */
  mov?: "zoom-in" | "zoom-out" | "izquierda" | "derecha" | "arriba" | "abajo" | "fijo" | null;
  /** 0–0.8: cuánto se oscurece la foto para que se lea el texto */
  oscurecer?: number | null;
};

export type EscenaPlan = {
  id: string;
  /** título del capítulo (arriba) */
  titulo: string;
  acento: ColorNombre;
  /** frase del guion donde empieza la escena */
  desde: string;
  elementos: Elemento[];
  /** foto de fondo opcional */
  fondo?: FondoPlan | null;
};

export type PlanPortada = {
  /** líneas del gancho en mayúsculas (3–4 líneas cortas) */
  lineas: string[];
  /** índice (desde 0) de la línea que se resalta en amarillo */
  resaltar: number;
  /** id de la escena cuya ilustración se muestra congelada */
  escena: string;
  /** segundo (absoluto del video) en que se congela esa escena */
  segundo: number;
  /** foto de fondo de la portada (nombre en public/media); si falta se usa la de la escena elegida */
  foto?: string | null;
};

export type Plan = {
  proyecto: { id: string; etiqueta: string; titulo: string };
  escenas: EscenaPlan[];
  portada: PlanPortada;
};
