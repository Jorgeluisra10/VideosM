import timestamps from "../data/timestamps.json";

export type Palabra = { word: string; start: number; end: number };

/** Palabras del guion con su instante exacto (generado por scripts/generar-voz.mjs). */
export const PALABRAS: Palabra[] = timestamps as Palabra[];

export const norm = (s: string): string =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const NORM = PALABRAS.map((p) => norm(p.word));

/**
 * Índice de la palabra (o frase de varias palabras) en el guion.
 * `ocurrencia` cuenta desde 1: indiceDe("brazo", 2) es la segunda vez que se dice "brazo".
 * Falla con un mensaje claro si no existe, para no sincronizar mal en silencio.
 */
export function indiceDe(clave: string, ocurrencia = 1): number {
  const partes = clave.split(/\s+/).map(norm).filter(Boolean);
  let visto = 0;
  for (let i = 0; i + partes.length <= NORM.length; i++) {
    if (partes.every((p, k) => NORM[i + k] === p)) {
      visto++;
      if (visto === ocurrencia) return i;
    }
  }
  throw new Error(
    `[VideMed] No encuentro "${clave}" (aparición nº ${ocurrencia}) en el guion actual. ` +
      `Si cambiaste el guion, actualiza las claves del tema en src/scenes/.`,
  );
}

/** Segundo en que EMPIEZA a decirse la palabra/frase. */
export const tiempoDe = (clave: string, ocurrencia = 1): number => PALABRAS[indiceDe(clave, ocurrencia)].start;

/** Segundo en que TERMINA de decirse la palabra/frase. */
export const finDe = (clave: string, ocurrencia = 1): number => {
  const n = clave.split(/\s+/).filter(Boolean).length;
  return PALABRAS[indiceDe(clave, ocurrencia) + n - 1].end;
};

export const FIN_VOZ = PALABRAS[PALABRAS.length - 1].end;

// ---------------------------------------------------------------------------
// Subtítulos: bloques de 2–4 palabras, balanceados y cortados en la puntuación.
// ---------------------------------------------------------------------------
export type BloqueSub = {
  palabras: (Palabra & { i: number })[];
  ini: number;
};

const MAX_PALABRAS = 4;
const MAX_CARACTERES = 26;

export function construirBloques(palabras: Palabra[]): BloqueSub[] {
  const clausulas: (Palabra & { i: number })[][] = [];
  let actual: (Palabra & { i: number })[] = [];
  palabras.forEach((p, i) => {
    actual.push({ ...p, i });
    if (/[.?!:;…,]["')\]]?$/.test(p.word)) {
      clausulas.push(actual);
      actual = [];
    }
  });
  if (actual.length) clausulas.push(actual);

  // Una cláusula de una sola palabra se pega a la siguiente (evita bloques sueltos tipo "Así,").
  const fusionadas: (Palabra & { i: number })[][] = [];
  for (let c = 0; c < clausulas.length; c++) {
    const cl = clausulas[c];
    const siguiente = clausulas[c + 1];
    if (cl.length === 1 && siguiente && !/[.?!]$/.test(cl[0].word) && siguiente.length <= MAX_PALABRAS - 1) {
      clausulas[c + 1] = [...cl, ...siguiente];
      continue;
    }
    fusionadas.push(cl);
  }

  const bloques: BloqueSub[] = [];
  for (const cl of fusionadas) {
    const chars = cl.reduce((s, p) => s + p.word.length + 1, 0);
    const k = Math.max(Math.ceil(cl.length / MAX_PALABRAS), Math.ceil(chars / MAX_CARACTERES));
    const base = Math.floor(cl.length / k);
    const extra = cl.length % k;
    let pos = 0;
    for (let b = 0; b < k; b++) {
      const n = base + (b < extra ? 1 : 0);
      const trozo = cl.slice(pos, pos + n);
      pos += n;
      if (trozo.length) bloques.push({ palabras: trozo, ini: trozo[0].start });
    }
  }
  return bloques;
}

export const BLOQUES = construirBloques(PALABRAS);
