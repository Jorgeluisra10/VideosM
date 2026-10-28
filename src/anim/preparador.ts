/**
 * PREPARADOR DE GUION PARA LA VOZ (puro): deja el texto listo para que el TTS lo lea bien, SIN inventar ni cambiar datos.
 *   1 · diccionario de pronunciación editable (pronunciacion.json): siglas, marcas y dominios → como suenan;
 *   2 · números, precios, porcentajes, años y áreas → palabras habladas (español colombiano: «novecientos cincuenta millones de pesos»);
 *   3 · puntuación para la voz: sin puntos suspensivos, guiones largos ni paréntesis; pausas con comas y puntos;
 *   4 · frases largas partidas en tramos de 8 a 14 palabras (solo se mueve puntuación; no se quita ni se añade ninguna palabra).
 * El mismo código lo usan el generador de voz (Node), el laboratorio y el panel (navegador).
 */

export type Diccionario = Record<string, string>;
export type CambioPreparador = { tipo: "diccionario" | "numero" | "puntuacion" | "pausa"; de: string; a: string };
export type ResultadoPreparador = { texto: string; cambios: CambioPreparador[]; tramos: number[] };
export type OpcionesPreparador = { diccionario?: Diccionario; partir?: boolean; maxPalabras?: number };

/** Entradas por defecto (la fuente editable es pronunciacion.json en la raíz del proyecto; las claves que empiezan por «_» son comentarios). */
export const PRONUNCIACION_BASE: Diccionario = {
  "imnoba.com": "im-no-ba punto com",
  "UPTC": "u pe te ce",
  "VIS": "vivienda de interés social",
  "VIP": "vip",
  "IMN": "i eme ene",
  "Didit": "Dídit",
  "WhatsApp": "guasap",
  "IA": "i a",
  "COP": "pesos colombianos",
  "SINAPSIS": "Sinapsis",
};

// ───────────────────────────── números ─────────────────────────────
const UNIDADES = ["cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve", "veinte", "veintiuno", "veintidós", "veintitrés", "veinticuatro", "veinticinco", "veintiséis", "veintisiete", "veintiocho", "veintinueve"];
const DECENAS = ["", "", "", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
const CENTENAS = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"];

type Forma = { fem?: boolean; apocope?: boolean };

/** 1..999 */
function menorDeMil(n: number, f: Forma): string {
  if (n === 100) return "cien";
  const c = Math.floor(n / 100), r = n % 100;
  const partes: string[] = [];
  if (c) partes.push(f.fem && c >= 2 ? CENTENAS[c].replace(/ientos$/, "ientas") : CENTENAS[c]);
  if (r) {
    if (r === 1) partes.push(f.fem ? "una" : f.apocope ? "un" : "uno");
    else if (r === 21) partes.push(f.fem ? "veintiuna" : f.apocope ? "veintiún" : "veintiuno");
    else if (r < 30) partes.push(UNIDADES[r]);
    else {
      const d = Math.floor(r / 10), u = r % 10;
      partes.push(u === 0 ? DECENAS[d] : `${DECENAS[d]} y ${menorDeMil(u, f)}`);
    }
  }
  return partes.join(" ");
}

/** 1..999.999 (con «mil») */
function menorDeMillon(n: number, f: Forma): string {
  const k = Math.floor(n / 1000), u = n % 1000;
  const partes: string[] = [];
  if (k) partes.push(k === 1 ? "mil" : `${menorDeMil(k, { fem: f.fem, apocope: true })} mil`);
  if (u) partes.push(menorDeMil(u, f));
  return partes.join(" ");
}

/** Número entero → palabras en español (hasta 9·10¹⁵). `fem`: «doscientas propiedades»; `apocope`: «un vehículo», «veintiún». */
export function numeroALetras(n: number, f: Forma = {}): string {
  if (!Number.isInteger(n) || n < 0 || n > 9e15) return String(n);
  if (n === 0) return "cero";
  const b = Math.floor(n / 1e12), m = Math.floor((n % 1e12) / 1e6), resto = n % 1e6;
  const partes: string[] = [];
  if (b) partes.push(b === 1 ? "un billón" : `${menorDeMillon(b, { apocope: true })} billones`);
  if (m) partes.push(m === 1 ? "un millón" : `${menorDeMillon(m, { apocope: true })} millones`);
  if (resto) partes.push(menorDeMillon(resto, f));
  return partes.join(" ");
}

const digitos = (s: string): string => [...s].map((d) => UNIDADES[Number(d)]).join(" ");
/** Teléfonos: grupos con pausa («300, 123, 4567» → «tres cero cero, uno dos tres, cuatro cinco seis siete»). */
const gruposDeDigitos = (s: string): string => (s.length === 10 ? [s.slice(0, 3), s.slice(3, 6), s.slice(6)] : s.match(/\d{1,3}/g) ?? [s]).map(digitos).join(", ");

/** Parte decimal: «05» → «cero cinco»; «5» → «cinco»; «75» → «setenta y cinco»; más de 3 cifras, una por una. */
function decimalesALetras(d: string): string {
  if (d.length > 3) return digitos(d);
  const ceros = d.match(/^0+/)?.[0].length ?? 0;
  const resto = d.slice(ceros);
  return [...Array(ceros).fill("cero"), resto ? numeroALetras(Number(resto)) : ""].filter(Boolean).join(" ");
}

// palabras que terminan en «a» pero son masculinas (o al revés): lo justo para no equivocarse con los sustantivos de uso diario
const MASC = new Set(["día", "días", "mapa", "mapas", "planeta", "planetas", "problema", "problemas", "sistema", "sistemas", "programa", "programas", "tema", "temas", "idioma", "idiomas", "clima", "dilema", "diploma", "poema", "trauma", "esquema", "cinema", "panorama", "diagrama", "telegrama", "gramo", "pesos", "metros"]);
const PREPOS = new Set(["de", "del", "y", "o", "a", "al", "en", "por", "con", "para", "sin", "que", "se", "es", "son", "no", "ni", "u", "e"]);

function formaSiguiente(resto: string): Forma {
  const m = /^\s*([A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)/.exec(resto);
  if (!m) return {};
  const w = m[1].toLowerCase();
  if (PREPOS.has(w)) return {};
  if (!MASC.has(w) && /(a|as|ión|iones|dad|dades|tud|tudes|umbre|umbres)$/.test(w)) return { fem: true };
  return { apocope: true };
}

const UNIDADES_MEDIDA: { re: RegExp; uno: string; varios: string }[] = [
  { re: /^\s*(?:km²|km2|km\^2|kilómetros cuadrados)(?![\p{L}\p{N}])/iu, uno: "kilómetro cuadrado", varios: "kilómetros cuadrados" },
  { re: /^\s*(?:m²|m2|m\^2|mts²|mts2|mts\.?\s*2|mt2|metros cuadrados|mts\.? cuadrados)(?![\p{L}\p{N}])/iu, uno: "metro cuadrado", varios: "metros cuadrados" },
  { re: /^\s*(?:km|kilómetros?)(?![\p{L}\p{N}²])/iu, uno: "kilómetro", varios: "kilómetros" },
  { re: /^\s*(?:cm|centímetros?)(?![\p{L}\p{N}²])/iu, uno: "centímetro", varios: "centímetros" },
  { re: /^\s*(?:kg|kilos?|kilogramos?)(?![\p{L}\p{N}])/iu, uno: "kilogramo", varios: "kilogramos" },
  { re: /^\s*(?:ha|hectáreas?)(?![\p{L}\p{N}])/iu, uno: "hectárea", varios: "hectáreas" },
  { re: /^\s*(?:mts?\.?|metros?)(?![\p{L}\p{N}²])/iu, uno: "metro", varios: "metros" },
  { re: /^\s*°\s?C(?![\p{L}\p{N}])/u, uno: "grado centígrado", varios: "grados centígrados" },
];

const ESCALA = /^\s*(mil millones|millones|millón|billones|billón|mil)(?![\p{L}\p{N}])/iu;
const PORCIENTO = /^\s*(?:%|por ciento)/i;

/**
 * Pasa a palabras cada número del texto. Reglas (español de Colombia): el punto separa miles («950.000.000») y la coma los decimales («3,5»);
 * `$` / `COP` = pesos, `US$` / `USD` = dólares; «950 millones» conserva la palabra («novecientos cincuenta millones») y con `$` añade «de pesos»;
 * «85 m²» = «ochenta y cinco metros cuadrados»; «37 %» = «treinta y siete por ciento»; teléfonos y códigos se leen cifra por cifra.
 */
export function numerosAPalabras(texto: string, cambios: CambioPreparador[] = []): string {
  const NUM = /(US\$\s?|USD\s?|COP\s?|\$\s?)?(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d+)|\.(\d{1,2})(?![\d.]))?/g;
  let out = "", i = 0, m: RegExpExecArray | null;
  while ((m = NUM.exec(texto))) {
    const antes = texto.slice(0, m.index);
    let fin = m.index + m[0].length;
    const original = m[0];
    const prefijo = (m[1] ?? "").trim().toUpperCase();
    const entero = m[2].replace(/\./g, "");
    const dec = m[3] ?? m[4];
    const valor = Number(entero);
    let rest = texto.slice(fin);
    let dicho: string;
    // códigos (IMN-123, A12) y teléfonos (≥ 8 cifras seguidas): cifra por cifra
    const esCodigo = /[A-Za-zÁÉÍÓÚÑáéíóúñ]-?$/.test(antes) && !prefijo;
    const telefono = !prefijo && !dec && /^\d+$/.test(m[2]) && m[2].length >= 8;
    if (telefono) dicho = gruposDeDigitos(entero);
    else if (esCodigo) dicho = digitos(entero) + (dec ? ` coma ${digitos(dec)}` : "");
    else if (valor > 9e15) dicho = digitos(entero);
    else {
      const escala = ESCALA.exec(rest);
      const pct = PORCIENTO.exec(rest);
      const medida = escala || pct ? null : UNIDADES_MEDIDA.find((u) => u.re.test(rest));
      const moneda = prefijo === "US$" || prefijo === "USD" ? "dólares" : prefijo ? "pesos" : "";
      const base = dec ? `${numeroALetras(valor, { apocope: true })} coma ${decimalesALetras(dec)}` : "";
      if (escala) {
        const e = escala[1].toLowerCase();
        const uno = valor === 1 && !dec;
        const cuerpo = dec ? base : numeroALetras(valor, { apocope: true });
        dicho = uno && (e === "millones" || e === "millón") ? "un millón" : uno && (e === "billones" || e === "billón") ? "un billón" : uno && e === "mil" ? "mil" : `${cuerpo} ${e}`;
        if (moneda) dicho += e === "mil" ? ` ${moneda}` : ` de ${moneda}`;
        fin += escala[0].length;
      } else if (pct) {
        dicho = `${dec ? base : numeroALetras(valor, { apocope: true })} por ciento`;
        fin += pct[0].length;
      } else if (medida) {
        dicho = `${dec ? base : numeroALetras(valor, { apocope: true })} ${valor === 1 && !dec ? medida.uno : medida.varios}`;
        fin += medida.re.exec(rest)![0].length;
      } else if (moneda) {
        const cuerpo = dec ? base : numeroALetras(valor, { apocope: true });
        const exactoMillon = !dec && valor >= 1e6 && valor % 1e6 === 0;
        dicho = `${cuerpo} ${exactoMillon ? "de " : ""}${moneda === "pesos" && valor === 1 && !dec ? "peso" : moneda === "dólares" && valor === 1 && !dec ? "dólar" : moneda}`;
      } else dicho = dec ? base : numeroALetras(valor, formaSiguiente(rest));
    }
    out += texto.slice(i, m.index).replace(/-$/, esCodigo ? " " : "-") + dicho;
    i = fin;
    NUM.lastIndex = fin;
    cambios.push({ tipo: "numero", de: texto.slice(m.index, fin).trim() || original, a: dicho });
  }
  return out + texto.slice(i);
}

// ───────────────────────────── diccionario ─────────────────────────────
const escaparRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Aplica el diccionario (más largas primero; palabra completa; sin distinguir mayúsculas salvo en siglas de ≤ 4 letras en mayúsculas). */
export function aplicarDiccionario(texto: string, dic: Diccionario, cambios: CambioPreparador[] = []): string {
  const claves = Object.keys(dic).filter((k) => k && !k.startsWith("_") && typeof dic[k] === "string").sort((a, b) => b.length - a.length);
  let t = texto;
  for (const k of claves) {
    const sigla = /^[A-ZÁÉÍÓÚÑ0-9]{1,4}$/.test(k);
    const re = new RegExp(`(?<![\\p{L}\\p{N}])${escaparRe(k)}(?![\\p{L}\\p{N}])`, sigla ? "gu" : "giu");
    t = t.replace(re, (x) => { cambios.push({ tipo: "diccionario", de: x, a: dic[k] }); return dic[k]; });
  }
  return t;
}

// ───────────────────────────── puntuación y pausas ─────────────────────────────
const contar = (s: string): number => (s.match(/[\p{L}\p{N}]+/gu) ?? []).length;
const mayuscula = (s: string): string => s.replace(/^([¿¡"«]*)(\p{L})/u, (_, a: string, b: string) => a + b.toUpperCase());

/** Sin puntos suspensivos, guiones largos, paréntesis, flechas, emojis ni marcas de énfasis; espacios y comas limpios; la frase termina en punto. */
export function limpiarPuntuacion(texto: string, cambios: CambioPreparador[] = []): string {
  let t = texto.replace(/[*_`#~]/g, "");
  const nota = (de: string, a: string): void => { cambios.push({ tipo: "puntuacion", de, a }); };
  t = t.replace(/(?:\.{3,}|…)\s*/g, (x, off: number, s: string) => { const sig = s.slice(off + x.length); const a = !sig || /^[\p{Lu}¿¡]/u.test(sig) ? ". " : ", "; nota("…", a.trim()); return a; });
  t = t.replace(/\s*[—–]\s*/g, () => { nota("—", ","); return ", "; });
  t = t.replace(/\s*(?:→|=>|->|⇒)\s*/g, () => { nota("→", ","); return ", "; });
  t = t.replace(/\s*\(([^)]*)\)\s*/g, (_, x: string) => { nota(`(${x})`, `, ${x},`); return `, ${x.trim()}, `; });
  t = t.replace(/[«»"“”]/g, "");
  t = t.replace(/\p{Extended_Pictographic}️?/gu, "");
  t = t.replace(/\s*[;:]\s*/g, ", ").replace(/\s+/g, " ");
  t = t.replace(/,(\s*,)+/g, ",").replace(/\s+([,.!?])/g, "$1").replace(/([.!?])\s*,/g, "$1").replace(/^[\s,]+/, "");
  t = t.replace(/,\s*([.!?])/g, "$1").replace(/,\s*$/, "").trim();
  t = t.replace(/([.!?]\s+)([¡¿]?)(\p{Ll})/gu, (_, a: string, b: string, c: string) => a + b + c.toUpperCase());
  if (t && !/[.!?]$/.test(t)) t += ".";
  return t;
}

const PALABRAS_NUMERO = new Set([...UNIDADES, "un", "una", "veintiún", ...DECENAS.filter(Boolean), ...CENTENAS.filter(Boolean), "mil", "millón", "millones", "billón", "billones", "ciento", "cien", "coma"]);
const SUBORDINANTES = new Set(["que", "porque", "donde", "cuando", "mientras", "aunque", "como", "si", "pues", "cuyo", "cuya"]);
const COORDINANTES = new Set(["y", "pero", "sino", "entonces", "además", "así", "luego", "o"]);
const PREPOSICIONES = new Set(["de", "en", "con", "para", "por", "sin", "sobre", "desde", "hasta", "entre"]);

/**
 * Parte un tramo (palabras entre dos pausas) de más de `max` palabras: prefiere ponerle punto en una coma ya existente o antes de una conjunción
 * coordinante, y coma antes de una subordinante o una preposición. Solo toca puntuación y la mayúscula de la palabra que abre frase.
 */
function partirTramo(palabras: string[], max: number, cambios: CambioPreparador[]): string[] {
  // palabras = tokens con su puntuación pegada; devuelve los tokens ya con comas/puntos nuevos
  const n = palabras.length;
  if (n <= max) return palabras;
  const min = 5;
  const limpio = (w: string): string => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
  type Cand = { i: number; tipo: "punto" | "coma"; pref: number };
  const cands: Cand[] = [];
  for (let i = min; i <= n - min; i++) {
    const prev = palabras[i - 1], w = limpio(palabras[i]);
    if (/[.!?]$/.test(prev)) continue;
    if (PALABRAS_NUMERO.has(limpio(prev))) continue; // nunca se parte «ochenta | y cinco» ni «por ciento | de»
    if (/,$/.test(prev)) cands.push({ i, tipo: "punto", pref: 3 });
    else if (COORDINANTES.has(w)) cands.push({ i, tipo: "punto", pref: 2 });
    else if (SUBORDINANTES.has(w)) cands.push({ i, tipo: "coma", pref: 2 });
    else if (PREPOSICIONES.has(w)) cands.push({ i, tipo: "coma", pref: 1 });
  }
  if (!cands.length) return palabras;
  const meta = n / 2;
  cands.sort((a, b) => b.pref * 4 - Math.abs(b.i - meta) - (a.pref * 4 - Math.abs(a.i - meta)));
  const c = cands[0];
  const sal = palabras.slice();
  if (c.tipo === "punto") {
    sal[c.i - 1] = sal[c.i - 1].replace(/,$/, "") + ".";
    sal[c.i] = mayuscula(sal[c.i]);
    cambios.push({ tipo: "pausa", de: `${palabras[c.i - 1]} ${palabras[c.i]}`, a: `${sal[c.i - 1]} ${sal[c.i]}` });
  } else {
    sal[c.i - 1] = sal[c.i - 1] + ",";
    cambios.push({ tipo: "pausa", de: `${palabras[c.i - 1]} ${palabras[c.i]}`, a: `${sal[c.i - 1]} ${sal[c.i]}` });
  }
  const izq = partirTramo(sal.slice(0, c.i), max, cambios), der = partirTramo(sal.slice(c.i), max, cambios);
  return [...izq, ...der];
}

/** Tramos (palabras entre pausas: , . ; : ! ?) de un texto ya preparado. */
export const tramosDe = (texto: string): number[] => texto.split(/[,.;:!?]+/).map(contar).filter((n) => n > 0);

/**
 * Todo el preparador: diccionario → números → puntuación → pausas. No cambia ningún dato: el resultado tiene las mismas palabras (los números
 * pasan a su forma hablada y las siglas a como suenan según el diccionario).
 */
export function prepararParaVoz(texto: string, o: OpcionesPreparador = {}): ResultadoPreparador {
  const cambios: CambioPreparador[] = [];
  let t = String(texto ?? "").replace(/\s+/g, " ").trim();
  t = aplicarDiccionario(t, o.diccionario ?? PRONUNCIACION_BASE, cambios);
  t = numerosAPalabras(t, cambios);
  t = limpiarPuntuacion(t, cambios);
  if (o.partir !== false) {
    const max = Math.max(8, Math.min(24, Math.round(o.maxPalabras ?? 14)));
    const oraciones = t.split(/(?<=[.!?])\s+/).filter(Boolean);
    t = oraciones.map((oracion) => {
      const toks = oracion.split(" ");
      // se parte por tramos entre pausas existentes (comas); cada tramo largo se subdivide
      return partirTramo(toks, max, cambios).join(" ");
    }).join(" ");
    // un segundo pase por si un tramo sin pausa previa quedó largo tras el primero
    t = t.split(/(?<=[.!?])\s+/).map((oracion) => {
      const seg = oracion.split(/(?<=,)\s+/);
      return seg.map((s) => (contar(s) > max ? partirTramo(s.split(" "), max, cambios).join(" ") : s)).join(" ");
    }).join(" ");
    t = t.replace(/,\./g, ".").replace(/\s+/g, " ").trim();
  }
  return { texto: t, cambios, tramos: tramosDe(t) };
}
