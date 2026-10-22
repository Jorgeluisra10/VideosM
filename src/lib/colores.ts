import { MARCA } from "./marca";

/**
 * Paleta del video activo. Por defecto es la paleta médica de GEMINI.md (Código de Colores Anatómico:
 * rojo = arterias/dolor, azul = venas/membranas, amarillo = nervios/señal, hueso = estructura); otros perfiles
 * (inmobiliaria, genérico…) la sustituyen desde src/data/marca.json sin tocar el código.
 */
export const C = MARCA.colores;

export const FUENTE = "Inter, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif";

/** Medidas del formato vertical y zonas de diseño. */
export const W = 1080;
export const H = 1920;
export const FPS = 60;
export const MARGEN = 80; // padding horizontal mínimo para cualquier texto
export const ESCENARIO = { y0: 350, y1: 1350, alto: 1000 } as const;
export const SUBS = { y0: 1450, y1: 1650 } as const;
