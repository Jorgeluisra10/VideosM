/**
 * Parser LOCAL (sin IA, sin coste) de los bloques de guion:
 *
 *   [ESCENA 1 | 0s-4s | MODO: SVG]
 *   Texto de la locución y los requerimientos visuales de esa escena…
 *
 * Los tiempos de cada bloque definen la duración exacta de la escena (segundos × 60 = fotogramas).
 * Lógica PURA: la usan el panel (en el navegador, para el costo en vivo), los scripts de Node y Remotion.
 */
export type Modo = "SVG" | "3D";

export type EscenaBloque = {
  n: number;
  inicio: number;
  fin: number;
  dur: number;
  modo: Modo;
  /** locución + requerimientos visuales de la escena (lo que se le manda a la IA) */
  texto: string;
};

export type ResultadoParser = {
  escenas: EscenaBloque[];
  errores: string[];
  avisos: string[];
  /** segundos totales (fin de la última escena) */
  duracion: number;
  caracteres: number;
};

export const FPS_ANIM = 60;
export const aFrames = (segundos: number): number => Math.round(segundos * FPS_ANIM);

/** Cabecera de bloque. Tolera espacios, mayúsculas/minúsculas, «–», «—», «a», «→» y «:» en los tiempos. */
const CABECERA = /^\s*\[\s*ESCENA\s*(\d+)\s*\|\s*([^|\]]+?)\s*\|\s*MODO\s*:\s*([A-Za-z0-9]+)\s*\]\s*(.*)$/i;

/** «4», «4s», «1,5s», «00:04», «1:02.5» → segundos (o null si no es un tiempo). */
export function parsearTiempo(txt: string): number | null {
  const s = txt.trim().toLowerCase().replace(/\s+/g, "").replace(",", ".");
  let m = s.match(/^(\d+):(\d{1,2}(?:\.\d+)?)$/);
  if (m) return Number(m[1]) * 60 + Number(m[2]);
  m = s.match(/^(\d+(?:\.\d+)?)s?$/);
  return m ? Number(m[1]) : null;
}

/** «0s-4s» → [0, 4]. */
export function parsearRango(txt: string): [number, number] | null {
  const partes = txt.split(/\s*(?:-|–|—|→|\ba\b)\s*/i).filter((p) => p.trim());
  if (partes.length !== 2) return null;
  const a = parsearTiempo(partes[0]);
  const b = parsearTiempo(partes[1]);
  return a === null || b === null ? null : [a, b];
}

type Tramo = { n: number; inicio: number; fin: number; dur: number };

/**
 * Orden, solapes, huecos y normalización de una lista de escenas (la comparten el formato simple y el estructurado).
 * Las escenas tienen que ser consecutivas para que el video no tenga cortes en negro: la primera arranca en 0 y cada una termina donde empieza la siguiente.
 */
export function normalizarEscenas<T extends Tramo>(entrada: T[], errores: string[], avisos: string[], sinTexto: (e: T) => boolean = () => false): T[] {
  const escenas = [...entrada];
  escenas.sort((a, b) => a.inicio - b.inicio);
  const vistos = new Set<number>();
  for (const e of escenas) {
    if (vistos.has(e.n)) errores.push(`El número de escena ${e.n} está repetido.`);
    vistos.add(e.n);
  }
  for (let i = 0; i < escenas.length; i++) {
    const e = escenas[i];
    const prev = escenas[i - 1];
    if (prev && e.inicio < prev.fin - 0.01) errores.push(`Escena ${e.n} (${e.inicio}s) empieza antes de que termine la escena ${prev.n} (${prev.fin}s): se solapan.`);
    else if (prev && e.inicio > prev.fin + 0.01) avisos.push(`Hay un hueco de ${(e.inicio - prev.fin).toFixed(1)} s entre las escenas ${prev.n} y ${e.n}: la escena ${prev.n} se alarga hasta ${e.inicio}s.`);
    if (e.dur < 1.2) avisos.push(`La escena ${e.n} dura solo ${e.dur.toFixed(1)} s: poco tiempo para animar algo legible.`);
    if (e.dur > 14) avisos.push(`La escena ${e.n} dura ${e.dur.toFixed(0)} s: considera partirla en dos para mantener el ritmo.`);
    if (sinTexto(e)) avisos.push(`La escena ${e.n} no tiene texto: la IA inventará el contenido visual solo con el modo y la duración.`);
  }
  if (escenas.length && escenas[0].inicio > 0.01) avisos.push(`La primera escena empieza en ${escenas[0].inicio}s: se adelanta a 0s.`);
  if (escenas.length > 30) errores.push(`Hay ${escenas.length} escenas; el máximo es 30 por video.`);

  // normalización: la primera arranca en 0 y cada escena termina donde empieza la siguiente
  const norm = escenas.map((e) => ({ ...e }));
  if (norm.length) norm[0].inicio = 0;
  for (let i = 0; i < norm.length - 1; i++) norm[i].fin = norm[i + 1].inicio;
  for (const e of norm) e.dur = Math.round((e.fin - e.inicio) * 1000) / 1000;
  return norm;
}

export function parsearGuion(texto: string): ResultadoParser {
  const errores: string[] = [];
  const avisos: string[] = [];
  const bloques: { n: number; rango: [number, number] | null; rangoTxt: string; modo: Modo | null; modoTxt: string; lineas: string[]; linea: number }[] = [];
  let actual: (typeof bloques)[number] | null = null;
  let suelto = 0;
  texto
    .replace(/\r/g, "")
    .split("\n")
    .forEach((linea, i) => {
      const m = linea.match(CABECERA);
      if (m) {
        const modoTxt = m[3].toUpperCase();
        actual = { n: Number(m[1]), rango: parsearRango(m[2]), rangoTxt: m[2].trim(), modo: modoTxt === "SVG" ? "SVG" : modoTxt === "3D" ? "3D" : null, modoTxt: m[3], lineas: m[4].trim() ? [m[4].trim()] : [], linea: i + 1 };
        bloques.push(actual);
      } else if (actual) {
        if (linea.trim()) actual.lineas.push(linea.trim());
      } else if (linea.trim()) suelto++;
    });

  if (!bloques.length) {
    errores.push("No encuentro ningún bloque. Cada escena empieza con una línea como  [ESCENA 1 | 00:00-00:05]  (formato libre) o  [ESCENA 1 | 0s-4s | MODO: SVG]  (formato simple).");
    return { escenas: [], errores, avisos, duracion: 0, caracteres: texto.length };
  }
  if (suelto) avisos.push(`Hay ${suelto} línea(s) de texto antes del primer bloque [ESCENA …]: se ignoran.`);

  const escenas: EscenaBloque[] = [];
  for (const b of bloques) {
    const nombre = `Escena ${b.n} (línea ${b.linea})`;
    if (!b.rango) {
      errores.push(`${nombre}: no entiendo el tiempo «${b.rangoTxt}». Usa por ejemplo 0s-4s, 4-9 o 00:09-00:15.`);
      continue;
    }
    if (!b.modo) {
      errores.push(`${nombre}: el modo «${b.modoTxt}» no existe. Usa MODO: SVG o MODO: 3D.`);
      continue;
    }
    const [inicio, fin] = b.rango;
    if (fin <= inicio) {
      errores.push(`${nombre}: el fin (${fin}s) debe ser mayor que el inicio (${inicio}s).`);
      continue;
    }
    escenas.push({ n: b.n, inicio, fin, dur: fin - inicio, modo: b.modo, texto: b.lineas.join("\n") });
  }

  const norm = normalizarEscenas(escenas, errores, avisos, (e) => !e.texto.trim());
  const duracion = norm.length ? norm[norm.length - 1].fin : 0;
  if (duracion > 120) avisos.push(`El video dura ${duracion.toFixed(0)} s; los reels suelen ir de 15 a 60 s.`);
  return { escenas: norm, errores, avisos, duracion, caracteres: texto.length };
}
