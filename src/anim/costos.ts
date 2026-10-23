/**
 * Modelos de OpenAI disponibles y su costo. Precios en USD por 1 millón de tokens (los indicados por el usuario).
 * El costo REAL se calcula con response.usage.prompt_tokens / completion_tokens; el de antes de generar es una estimación.
 */
export type ModeloIA = {
  id: string;
  etiqueta: string;
  entrada: number;
  salida: number;
  nota: string;
  /** los modelos «o» razonan: gastan tokens de salida extra que no se ven */
  razonador: boolean;
  /** tope de tokens de salida que pedimos */
  maxSalida: number;
};

export const MODELOS: ModeloIA[] = [
  { id: "gpt-4.1-mini", etiqueta: "gpt-4.1-mini — Entrada $0.40/1M · Salida $1.60/1M — Recomendado Calidad/Precio", entrada: 0.4, salida: 1.6, nota: "Recomendado Calidad/Precio", razonador: false, maxSalida: 32000 },
  { id: "o4-mini", etiqueta: "o4-mini — Entrada $1.10/1M · Salida $4.40/1M — Máxima precisión 3D y geometría", entrada: 1.1, salida: 4.4, nota: "Máxima precisión 3D y geometría", razonador: true, maxSalida: 40000 },
  { id: "gpt-4o-mini", etiqueta: "gpt-4o-mini — Entrada $0.15/1M · Salida $0.60/1M — Ultra económico SVG", entrada: 0.15, salida: 0.6, nota: "Ultra económico SVG", razonador: false, maxSalida: 16000 },
  { id: "gpt-4.1", etiqueta: "gpt-4.1 — Entrada $2.00/1M · Salida $8.00/1M — Estudio Pro", entrada: 2.0, salida: 8.0, nota: "Estudio Pro", razonador: false, maxSalida: 32000 },
];

export const modeloPorId = (id: string): ModeloIA => MODELOS.find((m) => m.id === id) ?? MODELOS[0];

/** Costo exacto en USD a partir de los tokens que devolvió la API. */
export const costoUSD = (modelo: string, promptTokens: number, completionTokens: number): number => {
  const m = modeloPorId(modelo);
  return (promptTokens * m.entrada + completionTokens * m.salida) / 1_000_000;
};

/** «$0.0123 USD» con los decimales que se pidan (4 para la estimación, 5 para el costo real). */
export const formatoUSD = (x: number, decimales = 4): string => `$${x.toFixed(decimales)} USD`;

/** Caracteres por token (promedio observado): español ≈ 3.6, JSON/esquemas ≈ 3.0. */
export const tokensDeTexto = (chars: number, cpt = 3.6): number => Math.ceil(chars / cpt);

// Tokens de SALIDA por escena (JSON de animación, con esquema estricto). Calibrados a ojo con las escenas del ejemplo:
// una escena SVG completa ≈ 1.300 tokens; una 3D ≈ 1.000; los efectos de sonido suman ≈ 70.
const SALIDA_SVG = 1300;
const SALIDA_3D = 1000;
const SALIDA_SFX = 70;
/** Tokens de razonamiento que añaden los modelos «o»: base + por escena. */
const SALIDA_RETRO = 230;
const RAZONAMIENTO_BASE = 3500;
const RAZONAMIENTO_ESCENA = 900;

export type EntradaEstimacion = {
  modelo: string;
  /** caracteres del campo de texto */
  caracteres: number;
  escenasSVG: number;
  escenas3D: number;
  sfx: boolean;
  /** tokens fijos del prompt de sistema + esquema para esta configuración (los da prompt.ts) */
  tokensFijos: number;
  /** estilo retro: cada escena añade título, subtítulo terminal y hasta 3 medidores */
  retro?: boolean;
};

export type Estimacion = { tokensEntrada: number; tokensSalida: number; costo: number };

export function estimar(e: EntradaEstimacion): Estimacion {
  const m = modeloPorId(e.modelo);
  const n = e.escenasSVG + e.escenas3D;
  const tokensEntrada = e.tokensFijos + tokensDeTexto(e.caracteres) + 14 * n;
  let tokensSalida = e.escenasSVG * SALIDA_SVG + e.escenas3D * SALIDA_3D + (e.sfx ? n * SALIDA_SFX : 0) + (e.retro ? n * SALIDA_RETRO : 0);
  if (m.razonador && n > 0) tokensSalida += RAZONAMIENTO_BASE + RAZONAMIENTO_ESCENA * n;
  return { tokensEntrada, tokensSalida, costo: (tokensEntrada * m.entrada + tokensSalida * m.salida) / 1_000_000 };
}

export type EntradaGeo = {
  modelo: string;
  /** caracteres de las líneas GEO (lo único que se envía como entrada) */
  caracteresGeo: number;
  lineasGeo: number;
  escenas: number;
  /** tokens del prompt de sistema compacto (≈ 350–700) y del esquema estricto, que OpenAI también cuenta como entrada */
  tokensSistema: number;
  tokensEsquema: number;
};

/** Tokens de salida por cada línea GEO (3–7 elementos compactos del escenario central). */
export const SALIDA_POR_GEO = 450;

/**
 * Estimación del FORMATO ESTRUCTURADO: entrada = caracteres GEO / 4 + prompt de sistema compacto (+ esquema estricto);
 * salida = 450 tokens por línea GEO (+ el razonamiento oculto de los modelos «o»).
 */
export function estimarGeo(e: EntradaGeo): Estimacion {
  const m = modeloPorId(e.modelo);
  const tokensEntrada = Math.ceil(e.caracteresGeo / 4) + e.tokensSistema + e.tokensEsquema + 14 * e.escenas;
  let tokensSalida = SALIDA_POR_GEO * e.lineasGeo;
  if (m.razonador && e.lineasGeo > 0) tokensSalida += RAZONAMIENTO_BASE + RAZONAMIENTO_ESCENA * e.escenas;
  return { tokensEntrada, tokensSalida, costo: (tokensEntrada * m.entrada + tokensSalida * m.salida) / 1_000_000 };
}
