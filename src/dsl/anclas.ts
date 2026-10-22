/**
 * Anclas: frases del guion a las que se atan las animaciones ("cuando" = la voz dice eso).
 * Lógica pura, sin React: la usa el renderizado (con timestamps.json) y el validador de Node.
 * Es TOLERANTE: si la IA escribe una frase que no existe literalmente, prueba recortes y palabras
 * sueltas antes de rendirse, para que un detalle nunca rompa el render (el validador lo marca igual).
 */
export type PalabraT = { word: string; start: number; end: number };

export const norm = (s: string): string =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

export type ResultadoAncla = { indice: number; exacto: boolean; usada: string };

function buscarSecuencia(normas: string[], partes: string[], ocurrencia: number): number {
  let visto = 0;
  for (let i = 0; i + partes.length <= normas.length; i++) {
    let ok = true;
    for (let k = 0; k < partes.length; k++) {
      if (normas[i + k] !== partes[k]) {
        ok = false;
        break;
      }
    }
    if (ok && ++visto === ocurrencia) return i;
  }
  return -1;
}

export function resolverAncla(palabras: PalabraT[], clave: string, ocurrencia = 1): ResultadoAncla | null {
  const normas = palabras.map((p) => norm(p.word));
  const partes = String(clave ?? "")
    .split(/\s+/)
    .map(norm)
    .filter(Boolean);
  if (!partes.length) return null;
  const oc = Math.max(1, Math.round(ocurrencia || 1));

  let i = buscarSecuencia(normas, partes, oc);
  if (i >= 0) return { indice: i, exacto: true, usada: partes.join(" ") };

  // sin las últimas palabras
  for (let k = partes.length - 1; k >= 1; k--) {
    i = buscarSecuencia(normas, partes.slice(0, k), oc);
    if (i >= 0) return { indice: i, exacto: false, usada: partes.slice(0, k).join(" ") };
  }
  // sin las primeras palabras
  for (let k = 1; k < partes.length; k++) {
    i = buscarSecuencia(normas, partes.slice(k), oc);
    if (i >= 0) return { indice: i, exacto: false, usada: partes.slice(k).join(" ") };
  }
  // palabras sueltas, de la más larga a la más corta (evita "el", "de"...)
  const sueltas = [...new Set(partes)].sort((a, b) => b.length - a.length);
  for (const w of sueltas) {
    if (w.length < 3) continue;
    i = buscarSecuencia(normas, [w], oc);
    if (i < 0) i = buscarSecuencia(normas, [w], 1);
    if (i >= 0) return { indice: i, exacto: false, usada: w };
  }
  return null;
}

/** Segundo en que se dice el ancla; `defecto` si no se encuentra. */
export function tiempoAncla(palabras: PalabraT[], clave: string | null | undefined, ocurrencia: number | null | undefined, defecto: number): number {
  if (!clave) return defecto;
  const r = resolverAncla(palabras, clave, ocurrencia ?? 1);
  return r ? palabras[r.indice].start : defecto;
}

/** Segundo en que TERMINA de decirse el ancla. */
export function finAncla(palabras: PalabraT[], clave: string | null | undefined, ocurrencia: number | null | undefined, defecto: number): number {
  if (!clave) return defecto;
  const r = resolverAncla(palabras, clave, ocurrencia ?? 1);
  if (!r) return defecto;
  const n = r.usada.split(" ").length;
  return palabras[Math.min(palabras.length - 1, r.indice + n - 1)].end;
}
