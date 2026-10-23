/**
 * MOTOR DE ESTUDIO (JSON ultraligero). En vez de pedirle a la IA código o geometría, le pedimos una DECISIÓN DE DISEÑO por escena
 * (layout + titular + figura protagonista + figura secundaria + datos de comparación) y un motor prefabricado (src/estudio/) dibuja
 * figuras con halftone, brillo especular, sombra y reflejo de suelo, estela de movimiento y fondo de estudio con bokeh.
 *
 * Aquí vive todo lo PURO (sin Node ni navegador): vocabulario cerrado, saneado de lo que devuelve la IA, traductor determinista de
 * DIRECCION_VISUAL (reglas locales, sin IA), prompt de sistema cacheable, estimación de costo y el parser envoltorio.
 * El parser del guion NO se toca: `parsearEstudio` solo reutiliza `parsearGuion` / `parsearLibre`.
 */
import { detectarFormato } from "./guionEstructurado";
import { parsearLibre } from "./guionLibre";
import { parsearGuion, type Modo } from "./parser";
import { modeloPorId, tokensDeTexto } from "./costos";
import { coloresIA } from "./libre";
import type { EventoSfx } from "./tipos";

/* ───────────── vocabulario cerrado (lo único que la IA puede decir) ───────────── */

export const LAYOUTS = ["HERO_CENTER", "VERSUS_50_50", "DIAGONAL_SPLIT", "SURFACE_STAGE"] as const;
export const FIGURAS = ["SPHERE", "CAPSULE", "CELLULAR_OVAL", "RING_GAUGE", "PILL_TOWER"] as const;
export const FIGURAS_SEC = ["SPHERE", "CAPSULE", "NONE"] as const;
export const ROLES = ["accent", "primary", "danger", "success", "neutral"] as const;
export const ROLES_SEC = ["secondary", "primary", "neutral", "accent"] as const;
export const DETALLES = ["none", "dog_ears", "cat_ears", "inner_voronoi_cells", "speedometer_needle", "bee_stripes", "glowing_core"] as const;
export const DETALLES_SEC = ["none", "cat_ears", "dog_ears"] as const;
export const ANIMACIONES = ["spring_pop", "elastic_crawl", "high_speed_slide", "heartbeat_pulse"] as const;
export const OPERADORES = [">", "<", "="] as const;

export type LayoutEstudio = (typeof LAYOUTS)[number];
export type FormaEstudio = (typeof FIGURAS)[number];
export type FormaSec = (typeof FIGURAS_SEC)[number];
export type RolEstudio = (typeof ROLES)[number] | (typeof ROLES_SEC)[number];
export type DetalleEstudio = (typeof DETALLES)[number];
export type AnimacionEstudio = (typeof ANIMACIONES)[number];
export type OperadorEstudio = (typeof OPERADORES)[number];

export type PrimariaEstudio = { shape: FormaEstudio; colorRole: RolEstudio; detail: DetalleEstudio; motionTrail: boolean; animation: AnimacionEstudio };
export type SecundariaEstudio = { shape: FormaSec; colorRole: RolEstudio; detail: DetalleEstudio; motionTrail: boolean };
export type VersusEstudio = { leftCounter: string; rightCounter: string; leftLabel: string; rightLabel: string; operator: OperadorEstudio };
export type TitularEstudio = { text: string; highlightWord: string };

/** La decisión de diseño de UNA escena (lo que devuelve la IA, ya saneado). */
export type EscenaEstudio = {
  n: number;
  layout: LayoutEstudio;
  headline: TitularEstudio;
  primary: PrimariaEstudio;
  secondary: SecundariaEstudio;
  versus: VersusEstudio | null;
};

/** Escena tal como se guarda en animacion.json (decisión de diseño + lo que se sabe localmente). */
export type EscenaEstudioGuardada = EscenaEstudio & {
  modo: "ESTUDIO";
  /** MODO: 3D del guion → la cámara hace una órbita suave en perspectiva */
  es3D: boolean;
  tema: "oscuro" | "claro";
  sfx?: EventoSfx[];
  fallback?: boolean;
  inicio: number;
  fin: number;
  dur: number;
  texto: string;
};

/** Tiempos (segundos desde el inicio de la escena) que comparten el motor visual y el sonido automático. */
export const T_ESTUDIO = { titulo: 0.15, figura: 0.5, contadores: 0.9, contadorDur: 1.5, operador: 1.7, etiquetas: 1.1 } as const;

/* ───────────── colores de estudio (derivados de la paleta elegida) ───────────── */

export type ColoresEstudio = {
  fondo: string; fondoCentro: string; fondoAbajo: string; texto: string; neon: string;
  roles: Record<RolEstudio, string>;
};

/**
 * Paleta de estudio a partir de la del panel. Para IMNOBA: fondo azul de marca #02224E (con un borde aún más oscuro), acento dorado #FFC500.
 * El símbolo de comparación es verde lima neón #D4FF00 en las paletas que no son de marca; en IMNOBA y las retro usa el acento de marca.
 */
export function coloresEstudio(paleta: string | undefined): ColoresEstudio {
  const c = coloresIA(paleta);
  const marca = paleta === undefined || paleta === "imnoba" || paleta === "retro" || paleta === "retro-imnoba";
  const imnoba = paleta === undefined || paleta === "imnoba";
  const fondo = imnoba ? "#02224E" : c.fondo;
  return {
    fondo: oscurecer(fondo, 0.55),
    fondoCentro: fondo,
    fondoAbajo: imnoba ? "#0A1B44" : oscurecer(c.fondo2, 0.3),
    texto: "#FFFFFF",
    neon: marca ? c.acento : "#D4FF00",
    roles: {
      accent: c.acento,
      primary: c.primario,
      danger: c.coral,
      success: c.esmeralda,
      neutral: "#B8C4DD",
      secondary: imnoba ? "#4C8DFF" : c.azul === c.acento ? "#4C8DFF" : c.azul,
    },
  };
}

/** Mezcla un color #RRGGBB con otro (k=0 → a, k=1 → b). */
export function mezclar(a: string, b: string, k: number): string {
  const p = (h: string, i: number) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  const c = (i: number) => Math.round(p(a, i) + (p(b, i) - p(a, i)) * k).toString(16).padStart(2, "0");
  return `#${c(0)}${c(1)}${c(2)}`;
}
export const aclarar = (hex: string, k: number): string => mezclar(hex, "#FFFFFF", k);
export const oscurecer = (hex: string, k: number): string => mezclar(hex, "#000000", k);

/* ───────────── saneado de lo que devuelve la IA ───────────── */

const sinAcentos = (s: string): string => s.normalize("NFD").replace(/[̀-ͯ]/g, "");
const clave = (s: unknown): string => sinAcentos(String(s ?? "")).trim().toUpperCase().replace(/[\s-]+/g, "_");

/** Elige un valor de una lista cerrada tolerando mayúsculas, acentos, espacios y «a|b» pegados; si no existe → defecto. */
export function elegir<T extends string>(valor: unknown, lista: readonly T[], defecto: T): T {
  const k = clave(valor);
  const exacto = lista.find((x) => clave(x) === k);
  if (exacto) return exacto;
  const primero = k.split("|")[0];
  return lista.find((x) => clave(x) === primero) ?? defecto;
}

const texto = (v: unknown, max: number): string => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
const bool = (v: unknown): boolean => v === true || /^(true|si|sí|1)$/i.test(String(v ?? ""));

/** Contador: solo dígitos (hasta 4) o un texto corto como «12%» / «$5M». */
function contador(v: unknown, defecto: string): string {
  const s = String(v ?? "").replace(/\s+/g, "").slice(0, 6);
  return s || defecto;
}

/** Detalles que tienen sentido en cada figura; el resto se descarta (así nada se dibuja deforme). */
const DETALLE_VALIDO: Record<FormaEstudio, DetalleEstudio[]> = {
  SPHERE: ["none", "dog_ears", "cat_ears", "bee_stripes", "glowing_core", "inner_voronoi_cells"],
  CAPSULE: ["none", "dog_ears", "cat_ears", "glowing_core"],
  CELLULAR_OVAL: ["none", "inner_voronoi_cells", "glowing_core"],
  RING_GAUGE: ["none", "speedometer_needle", "glowing_core"],
  PILL_TOWER: ["none", "glowing_core"],
};

/** Palabras vacías que no sirven como palabra destacada. */
const VACIAS = new Set("el la los las un una unos unas de del al y o u en con por para que es fue se su sus lo le les mas muy como ya no si pero sin sobre entre hay son ser era".split(" "));

/** ¿Está `palabra` dentro del titular (ignorando acentos y mayúsculas)? Devuelve la palabra tal como aparece en el titular. */
function palabraDelTitular(titular: string, candidata: string): string {
  const objetivo = sinAcentos(candidata).toLowerCase().replace(/[^\p{L}\p{N}%$]/gu, "");
  if (!objetivo) return "";
  return titular.split(/\s+/).find((p) => sinAcentos(p).toLowerCase().replace(/[^\p{L}\p{N}%$]/gu, "") === objetivo) ?? "";
}

/** Palabra a destacar cuando la IA no dijo ninguna válida: una cifra, o la palabra más larga que no sea vacía. */
export function palabraDestacada(titular: string): string {
  const ps = titular.split(/\s+/).filter(Boolean);
  const cifra = ps.find((p) => /\d/.test(p));
  if (cifra) return cifra;
  const limpia = (p: string) => p.replace(/[^\p{L}\p{N}]/gu, "");
  const buenas = ps.filter((p) => !VACIAS.has(sinAcentos(limpia(p)).toLowerCase()) && limpia(p).length >= 3);
  return (buenas.length ? buenas : ps).reduce((m, p) => (limpia(p).length > limpia(m).length ? p : m), ps[0] ?? "");
}

/* ───────────── traductor DETERMINISTA de DIRECCION_VISUAL (reglas locales, $0) ───────────── */

export type EntradaReglas = { n: number; dur?: number; modo?: Modo; voz?: string; direccion?: string };

const norm = (s: string): string => sinAcentos(s).toLowerCase();
const tiene = (t: string, re: RegExp): boolean => re.test(t);

/** Textos entre comillas "…", «…», “…”, '…' */
function entreComillas(s: string): string[] {
  const r: string[] = [];
  for (const m of s.matchAll(/"([^"\n]{1,60})"|«([^»\n]{1,60})»|“([^”\n]{1,60})”/g)) r.push((m[1] ?? m[2] ?? m[3]).trim());
  return r.filter(Boolean);
}

/** Cifras destacadas del texto (140, 12%, 3,5 …), en orden de aparición. */
function cifras(s: string): string[] {
  // «50/50» y las horas/rangos no son datos de comparación
  const limpio = s.replace(/\b\d+\s*\/\s*\d+\b/g, " ");
  return [...limpio.matchAll(/\d[\d.,]*\s?%?/g)].map((m) => m[0].trim().replace(/[.,]$/, ""));
}

/** Primera frase de la voz, en MAYÚSCULAS y recortada a ≤ 30 caracteres sin cortar palabras. */
function titularDeFrase(frase: string): string {
  const limpia = frase.replace(/^[¿¡"«“\s]+/, "").replace(/[?!.…,;:"»”]+$/g, "").replace(/\s+/g, " ").trim().toUpperCase();
  if (limpia.length <= 30) return limpia;
  const palabras = limpia.split(" ");
  let s = "";
  for (const p of palabras) {
    if ((s + " " + p).trim().length > 30) break;
    s = (s + " " + p).trim();
  }
  return s || limpia.slice(0, 30);
}

/** Decide TODO lo que se puede decidir sin IA a partir de DIRECCION_VISUAL y VOZ_OFF. También es la base que completa lo que la IA omita. */
export function escenaPorReglas(e: EntradaReglas): EscenaEstudio {
  const dir = e.direccion ?? "";
  const voz = e.voz ?? "";
  const t = norm(`${dir} ${voz}`);

  // 1) layout
  let layout: LayoutEstudio = "HERO_CENTER";
  if (tiene(t, /pantalla dividida|division diagonal|diagonal|split|dos mitades|antes y despues|antes\/despues/)) layout = "DIAGONAL_SPLIT";
  else if (tiene(t, /comparacion|comparar|\bvs\.?\b|versus|50\s?\/\s?50|frente a frente|marcador|contra\b/)) layout = "VERSUS_50_50";
  else if (tiene(t, /superficie|plataforma|barra metalica|oruga|se arrastra|reptar|avanza sobre|tren elastico|se estira/)) layout = "SURFACE_STAGE";

  // 2) titular: «Titular "…"» manda; si no, lo que va entre comillas (en una comparación las dos primeras comillas son las etiquetas); si no, la primera frase de la VOZ
  const comillas = [...entreComillas(dir), ...entreComillas(voz)];
  const marcado = `${dir} ${voz}`.match(/(?:titular|t[ií]tulo|headline)\s*[:=]?\s*(?:"([^"\n]{3,60})"|«([^»\n]{3,60})»|“([^”\n]{3,60})”)/i);
  const quoteTitular = (marcado?.[1] ?? marcado?.[2] ?? marcado?.[3])?.trim();
  const frase = (voz.split(/(?<=[?!.…])\s+/)[0] || dir.split(/(?<=[?!.…])\s+/)[0] || "").trim();
  const candidatas = comillas.filter((q) => q.length >= 3 && !/^[\d\s.,%$]+$/.test(q) && q !== quoteTitular);
  const text = titularDeFrase(quoteTitular ?? (layout === "VERSUS_50_50" ? candidatas[2] : candidatas[0]) ?? frase) || "IMNOBA";
  const highlightWord = palabraDestacada(text);

  // 3) figura protagonista
  const quien = (re: RegExp): number => t.search(re);
  const iPerro = quien(/\bperr[oa]s?\b|canin/), iGato = quien(/\bgat[oa]s?\b|felin/);
  let shape: FormaEstudio = "SPHERE";
  let detail: DetalleEstudio = "none";
  let animation: AnimacionEstudio = "spring_pop";
  if (tiene(t, /huevo|celula|embrion|cellular|ovulo|nucleo/)) { shape = "CELLULAR_OVAL"; detail = "inner_voronoi_cells"; }
  else if (tiene(t, /velocimetro|velocidad|km\/h|medidor|acelera|rapido|gauge|rpm/)) { shape = "RING_GAUGE"; detail = "speedometer_needle"; }
  else if (tiene(t, /torre|cohete|rascacielos|edificio|crece hacia|sube hacia|pilar|columna/)) shape = "PILL_TOWER";
  else if (tiene(t, /oruga|gusano|tren|capsula|pildora|pastilla/) || layout === "SURFACE_STAGE") shape = "CAPSULE";
  if (shape === "SPHERE" || shape === "CAPSULE") {
    if (tiene(t, /abeja|miel|rayas/)) { shape = "SPHERE"; detail = "bee_stripes"; }
    else if (iPerro >= 0 && (iGato < 0 || iPerro < iGato)) detail = "dog_ears";
    else if (iGato >= 0) detail = "cat_ears";
    else if (tiene(t, /brill|luz|energia|nucleo|chispa|encend/)) detail = "glowing_core";
  }
  if (tiene(t, /latido|corazon|pulso|late\b/)) animation = "heartbeat_pulse";
  else if (tiene(t, /velocidad|rapido|veloz|deslizar|zoom|acelera|embiste|corre/)) animation = "high_speed_slide";
  else if (tiene(t, /oruga|arrastra|se estira|elastic|gusano/) || layout === "SURFACE_STAGE") animation = "elastic_crawl";
  const colorRole: RolEstudio = tiene(t, /riesgo|peligro|error|pierde|perdida|caida|atrapad|alerta|problema|rojo|dolor/) ? "danger" : tiene(t, /gana|ahorro|exito|rentab|crece|verde|solucion|bien\b|positiv/) ? "success" : "accent";
  const primary: PrimariaEstudio = { shape, colorRole, detail, motionTrail: animation === "high_speed_slide" || layout === "DIAGONAL_SPLIT", animation };

  // 4) figura secundaria (comparaciones y escenas divididas)
  const dosFiguras = layout === "VERSUS_50_50" || layout === "DIAGONAL_SPLIT";
  let secShape: FormaSec = dosFiguras ? (shape === "CAPSULE" ? "CAPSULE" : "SPHERE") : "NONE";
  let secDetail: DetalleEstudio = "none";
  if (dosFiguras && iPerro >= 0 && iGato >= 0) {
    primary.detail = iPerro < iGato ? "dog_ears" : "cat_ears";
    secDetail = iPerro < iGato ? "cat_ears" : "dog_ears";
  }
  const secondary: SecundariaEstudio = { shape: secShape, colorRole: "secondary", detail: elegir(secDetail, DETALLES_SEC, "none"), motionTrail: layout === "DIAGONAL_SPLIT" };

  // 5) datos de comparación
  let versus: VersusEstudio | null = null;
  if (layout === "VERSUS_50_50") {
    const nums = cifras(`${dir} ${voz}`);
    const lado = comillas.filter((q) => q !== quoteTitular && q.toUpperCase() !== text && !/^[\d\s.,%$]+$/.test(q));
    const vs = `${dir} ${voz}`.match(/([\p{L}][\p{L}\s]{1,16}?)\s+(?:vs\.?|versus|contra|frente a)\s+([\p{L}][\p{L}\s]{1,16}?)(?=[\s,.;:)!?]|$)/iu);
    const izq = (lado[0] ?? vs?.[1]?.trim().split(/\s+/).pop() ?? (iPerro >= 0 && iGato >= 0 ? (iPerro < iGato ? "PERRO" : "GATO") : "ANTES")).toUpperCase().slice(0, 14);
    const der = (lado[1] ?? vs?.[2]?.trim().split(/\s+/)[0] ?? (iPerro >= 0 && iGato >= 0 ? (iPerro < iGato ? "GATO" : "PERRO") : "AHORA")).toUpperCase().slice(0, 14);
    const a = nums[0] ?? "000", b = nums[1] ?? nums[0] ?? "000";
    const na = parseFloat(a.replace(/[^\d.]/g, "")), nb = parseFloat(b.replace(/[^\d.]/g, ""));
    const operator: OperadorEstudio = nums.length < 2 ? "=" : na > nb ? ">" : na < nb ? "<" : "=";
    versus = { leftCounter: contador(a, "000"), rightCounter: contador(nums.length < 2 ? "000" : b, "000"), leftLabel: izq, rightLabel: der, operator };
    if (nums.length === 1) versus.rightCounter = "000";
  }
  return { n: e.n, layout, headline: { text, highlightWord }, primary, secondary, versus };
}

/**
 * Sanea UNA escena que devolvió la IA: valores fuera del vocabulario → el de las reglas locales (no el azar), detalles imposibles se descartan,
 * y cada layout recibe lo que necesita (VERSUS siempre trae contadores y segunda figura; DIAGONAL_SPLIT siempre dos estados).
 * Devuelve también las correcciones hechas (para el registro).
 */
export function normalizarEscenaEstudio(raw: any, base: EscenaEstudio): { escena: EscenaEstudio; correcciones: string[] } {
  const corr: string[] = [];
  const r = raw && typeof raw === "object" ? raw : {};
  const pr = r.primary ?? r.primaryObject ?? {};
  const se = r.secondary ?? r.secondaryObject ?? {};
  const ve = r.versus ?? r.versusData ?? null;
  const dato = (v: unknown, lista: readonly string[], nombre: string): void => {
    if (v === undefined || v === null || String(v) === "") return;
    if (!lista.some((x) => clave(x) === clave(v) || clave(x) === clave(String(v).split("|")[0]))) corr.push(`Escena ${base.n}: ${nombre} «${String(v).slice(0, 24)}» no existe; se reemplaza por una opción válida`);
  };
  dato(r.layout, LAYOUTS, "layout");
  dato(pr.shape ?? pr.primitive, FIGURAS, "primary.shape");

  const layout = elegir(r.layout, LAYOUTS, base.layout);
  const shape = elegir(pr.shape ?? pr.primitive, FIGURAS, layout === "SURFACE_STAGE" && base.layout !== "SURFACE_STAGE" ? "CAPSULE" : base.primary.shape);
  let detail = elegir(pr.detail ?? pr.accessory, DETALLES, shape === base.primary.shape ? base.primary.detail : "none");
  if (!DETALLE_VALIDO[shape].includes(detail)) { corr.push(`Escena ${base.n}: el detalle «${detail}» no cabe en ${shape}; se quita`); detail = "none"; }
  const animation = elegir(pr.animation, ANIMACIONES, base.primary.animation);
  const primary: PrimariaEstudio = {
    shape,
    colorRole: elegir(pr.colorRole, [...ROLES, ...ROLES_SEC] as readonly RolEstudio[], base.primary.colorRole),
    detail,
    motionTrail: pr.motionTrail === undefined ? base.primary.motionTrail : bool(pr.motionTrail),
    animation,
  };

  const dosFiguras = layout === "VERSUS_50_50" || layout === "DIAGONAL_SPLIT";
  let secShape = elegir(se.shape ?? se.primitive, FIGURAS_SEC, dosFiguras ? (base.secondary.shape === "NONE" ? "SPHERE" : base.secondary.shape) : "NONE");
  if (dosFiguras && secShape === "NONE") secShape = "SPHERE";
  const secondary: SecundariaEstudio = {
    shape: secShape,
    colorRole: elegir(se.colorRole, [...ROLES_SEC, ...ROLES] as readonly RolEstudio[], "secondary"),
    detail: elegir(se.detail ?? se.accessory, DETALLES_SEC, base.secondary.detail),
    motionTrail: se.motionTrail === undefined ? base.secondary.motionTrail : bool(se.motionTrail),
  };
  if (secondary.colorRole === primary.colorRole && secShape !== "NONE") secondary.colorRole = "secondary";

  const textoTitular = texto(r.headline?.text ?? r.headline, 40).toUpperCase() || base.headline.text;
  const pedida = texto(r.headline?.highlightWord, 24);
  const highlightWord = palabraDelTitular(textoTitular, pedida) || palabraDelTitular(textoTitular, base.headline.highlightWord) || palabraDestacada(textoTitular);
  if (pedida && !palabraDelTitular(textoTitular, pedida)) corr.push(`Escena ${base.n}: la palabra destacada «${pedida}» no está en el titular; se usa «${highlightWord}»`);

  let versus: VersusEstudio | null = null;
  if (layout === "VERSUS_50_50") {
    const b = base.versus ?? { leftCounter: "000", rightCounter: "000", leftLabel: "ANTES", rightLabel: "AHORA", operator: "=" as OperadorEstudio };
    versus = {
      leftCounter: contador(ve?.leftCounter, b.leftCounter),
      rightCounter: contador(ve?.rightCounter, b.rightCounter),
      leftLabel: texto(ve?.leftLabel, 14).toUpperCase() || b.leftLabel,
      rightLabel: texto(ve?.rightLabel, 14).toUpperCase() || b.rightLabel,
      operator: elegir(String(ve?.operator ?? ve?.symbol ?? "").replace(/&gt;/g, ">").replace(/&lt;/g, "<"), OPERADORES, b.operator),
    };
    if (!ve) corr.push(`Escena ${base.n}: VERSUS_50_50 sin datos de comparación; se completan con las reglas locales`);
  }
  return { escena: { n: base.n, layout, headline: { text: textoTitular, highlightWord }, primary, secondary, versus }, correcciones: corr };
}

/* ───────────── SFX automáticos (locales, sin IA) ───────────── */

/** Efectos sincronizados con lo que el motor hace aparecer: entrada, figura, contadores, símbolo de comparación. */
export function sfxAutomatico(e: EscenaEstudio, dur: number): EventoSfx[] {
  const L: EventoSfx[] = [{ t: 0.05, tipo: "whoosh", vol: 0.15 }, { t: T_ESTUDIO.figura + 0.05, tipo: e.primary.animation === "heartbeat_pulse" ? "heartbeat" : "pop", vol: 0.16 }];
  if (e.layout === "VERSUS_50_50") L.push({ t: T_ESTUDIO.contadores, tipo: "tick", vol: 0.12 }, { t: T_ESTUDIO.operador, tipo: "ding", vol: 0.18 });
  else if (e.layout === "DIAGONAL_SPLIT") L.push({ t: 0.6, tipo: "zap", vol: 0.12 }, { t: 1.4, tipo: "pop", vol: 0.14 });
  else if (e.primary.shape === "PILL_TOWER") L.push({ t: 1.0, tipo: "thud", vol: 0.16 });
  else if (e.primary.animation === "high_speed_slide") L.push({ t: 0.35, tipo: "whoosh", vol: 0.14 });
  return L.filter((x) => x.t < dur - 0.1);
}

/* ───────────── parser envoltorio (no toca el parser existente) ───────────── */

export type EscenaEstudioGuion = { n: number; inicio: number; fin: number; dur: number; modo: Modo; voz: string; direccion: string; sfx: { t: number; tipo: string }[] };
export type ResultadoEstudio = { formato: "estudio"; escenas: EscenaEstudioGuion[]; errores: string[]; avisos: string[]; duracion: number; caracteres: number; caracteresIA: number };

/** Formatos que usan el motor de estudio: el simple ([ESCENA n | 0s-7s | MODO: SVG]) y el libre ([ESCENA n | 00:00-00:05]). */
export const usaEstudio = (guion: string): boolean => detectarFormato(guion) !== "estructurado";

/**
 * Lee el guion con los parsers de siempre (sin modificarlos): `parsearLibre` entiende VOZ_OFF / DIRECCION_VISUAL / SFX y `parsearGuion` valida el
 * MODO del formato simple. Lo que viaja a la IA (`caracteresIA`) es solo la dirección visual y la voz de cada escena.
 */
export function parsearEstudio(guion: string): ResultadoEstudio {
  const libre = parsearLibre(guion);
  let errores = [...libre.errores];
  const avisos = [...libre.avisos];
  const modos = new Map<number, Modo>();
  if (detectarFormato(guion) === "simple") {
    const s = parsearGuion(guion);
    // sin ninguna escena legible los dos parsers dicen lo mismo: se deja un solo mensaje (el del formato simple, que explica ambos formatos)
    if (!libre.escenas.length) errores = [...s.errores];
    else for (const e of s.errores) if (!errores.includes(e)) errores.push(e);
    for (const e of s.escenas) modos.set(e.n, e.modo);
  }
  const escenas: EscenaEstudioGuion[] = libre.escenas.map((e) => ({ n: e.n, inicio: e.inicio, fin: e.fin, dur: e.dur, modo: modos.get(e.n) ?? "SVG", voz: e.voz, direccion: e.direccion, sfx: e.sfx }));
  const caracteresIA = escenas.reduce((n, e) => n + promptEscena(e).length, 0);
  return { formato: "estudio", escenas, errores, avisos, duracion: libre.duracion, caracteres: libre.caracteres, caracteresIA };
}

/* ───────────── prompt de sistema (estático y cacheable) y mensaje de usuario ───────────── */

/** Marca que identifica este prompt (también la usa el servidor simulado de pruebas). */
export const MARCA_ESTUDIO = "ESTUDIO_JSON";

/**
 * Todo lo estático (reglas, vocabulario, esquema) va PRIMERO y no depende de la paleta ni del guion: OpenAI reutiliza solo el prefijo idéntico
 * (prompt caching automático desde 1.024 tokens de prefijo, con descuento en los tokens de entrada). La paleta la resuelve el motor local.
 */
export function sistemaEstudio(): string {
  return `Eres director de arte de un estudio de motion graphics (estilo Kurzgesagt/Vox). Por cada escena devuelves una DECISIÓN DE DISEÑO en JSON mínimo; un motor prefabricado dibuja las figuras, tú no dibujas nada. [${MARCA_ESTUDIO}]
Responde SOLO un objeto JSON {"scenes":[…]}: una entrada por escena (id = número de escena). Omite "secondary" y "versus" cuando no se usen.
Escena: {"id":1,"layout":L,"headline":{"text":"MAYÚSCULAS, ≤30 car., 2 líneas","highlightWord":"palabra del texto"},"primary":{"shape":S,"colorRole":R,"detail":D,"motionTrail":false,"animation":A},"secondary":{"shape":S2,"colorRole":R2,"detail":D2,"motionTrail":false},"versus":{"leftCounter":"000","rightCounter":"140","leftLabel":"PERRO","rightLabel":"GATO","operator":">"}}
L: HERO_CENTER (un protagonista) | VERSUS_50_50 (comparación; exige secondary y versus) | DIAGONAL_SPLIT (dos estados/antes-después; usa primary y secondary) | SURFACE_STAGE (algo avanza o se estira sobre una superficie; CAPSULE)
S: SPHERE | CAPSULE | CELLULAR_OVAL (huevo/célula) | RING_GAUGE (velocidad/medidor) | PILL_TOWER (torre/crecimiento). S2: SPHERE | CAPSULE | NONE
R: accent (destacado) | primary | danger (riesgo) | success (positivo) | neutral. R2: secondary | primary | neutral | accent
D: none | dog_ears | cat_ears | inner_voronoi_cells (CELLULAR_OVAL) | speedometer_needle (RING_GAUGE) | bee_stripes (SPHERE) | glowing_core. D2: none | cat_ears | dog_ears
A: spring_pop | elastic_crawl | high_speed_slide (con motionTrail) | heartbeat_pulse. operator: > | < | =
TRADUCE la DIRECCION_VISUAL (detallada, abstracta o ya estructurada) a la combinación más estética: "composición central"→HERO_CENTER; "comparación 50/50", "vs", marcadores→VERSUS_50_50; "pantalla dividida", "diagonal", antes/después→DIAGONAL_SPLIT; superficie, barra, oruga→SURFACE_STAGE. Toma el headline y los datos de lo que va entre comillas "…" o de las cifras y nombres clave de VOZ; no inventes cifras. Cada escena distinta de la anterior.
Entrada por escena: "ESC n | duración | MODO", "DIR: …", "VOZ: …".`;
}

/** Texto que se envía por escena (solo dirección visual y voz; sin SFX ni tiempos). */
export function promptEscena(e: { n: number; dur: number; modo: Modo; voz: string; direccion: string }): string {
  return `ESC ${e.n} | ${Math.round(e.dur * 10) / 10}s | ${e.modo}\nDIR: ${e.direccion || "(libre)"}${e.voz ? `\nVOZ: ${e.voz}` : ""}`;
}
export const promptUsuarioEstudio = (escenas: { n: number; dur: number; modo: Modo; voz: string; direccion: string }[]): string => escenas.map(promptEscena).join("\n\n");

/** Tokens fijos de entrada (prompt de sistema; en modo json_object el esquema ya va dentro). */
export function tokensFijosEstudio(): { sistema: number; esquema: number } {
  return { sistema: tokensDeTexto(sistemaEstudio().length, 3.4), esquema: 0 };
}

/* ───────────── costo ───────────── */

/** Tokens de salida por escena: el JSON compacto de una escena ronda 100–140 tokens. */
export const SALIDA_POR_ESCENA_ESTUDIO = 120;
/** Tokens de entrada por escena para los separadores («ESC 1 | 7s | SVG», «DIR:», «VOZ:»). */
export const ENTRADA_POR_ESCENA_ESTUDIO = 14;

export type EntradaEstudio = { modelo: string; caracteres: number; escenas: number; tokensSistema: number };

/**
 * Costo del flujo JSON: entrada = prompt de sistema (fijo) + texto de dirección/voz + separadores; salida = 120 tokens por escena
 * (los SFX son locales, no cuestan nada). Los modelos «o» razonan en esfuerzo bajo: se añade un margen pequeño.
 */
export function estimarEstudio(e: EntradaEstudio): { tokensEntrada: number; tokensSalida: number; costo: number } {
  const m = modeloPorId(e.modelo);
  const tokensEntrada = e.tokensSistema + tokensDeTexto(e.caracteres) + ENTRADA_POR_ESCENA_ESTUDIO * e.escenas;
  let tokensSalida = SALIDA_POR_ESCENA_ESTUDIO * e.escenas;
  if (m.razonador && e.escenas > 0) tokensSalida += 500 + 100 * e.escenas;
  return { tokensEntrada, tokensSalida, costo: (tokensEntrada * m.entrada + tokensSalida * m.salida) / 1_000_000 };
}

/* ───────────── ensamblado: decisión de la IA + lo local → animación guardable ───────────── */

/**
 * Une lo que devolvió la IA ({"scenes":[…]}) con lo que se sabe localmente (tiempos, modo, SFX del guion). Nunca falla por contenido:
 * lo que falte o esté fuera del vocabulario se completa con `escenaPorReglas` (el traductor local) y queda anotado en `correcciones`.
 */
export function ensamblarEstudio(raw: any, escenas: EscenaEstudioGuion[], o: { paleta?: string; sfx?: boolean; titulo?: string } = {}): { anim: import("./tipos").Animacion; correcciones: string[]; sinRespuesta: number[] } {
  const crudas: any[] = Array.isArray(raw?.scenes) ? raw.scenes : Array.isArray(raw?.escenas) ? raw.escenas : [];
  const correcciones: string[] = [];
  const sinRespuesta: number[] = [];
  const sfx = o.sfx !== false;
  const salida: EscenaEstudioGuardada[] = escenas.map((e, k) => {
    const r = crudas.find((x) => Number(x?.id ?? x?.n) === e.n) ?? (crudas.length === escenas.length ? crudas[k] : undefined);
    const base = escenaPorReglas(e);
    if (!r) { sinRespuesta.push(e.n); correcciones.push(`Escena ${e.n}: la IA no la devolvió; se diseña con las reglas locales`); }
    const { escena, correcciones: c } = normalizarEscenaEstudio(r, base);
    correcciones.push(...c);
    const propios: EventoSfx[] = e.sfx.map((s) => ({ t: s.t, tipo: s.tipo as EventoSfx["tipo"], vol: 0.15 }));
    const eventos = sfx ? (propios.length ? propios : sfxAutomatico(escena, e.dur)) : undefined;
    return { ...escena, modo: "ESTUDIO", es3D: e.modo === "3D", tema: "oscuro", ...(eventos ? { sfx: eventos } : {}), inicio: e.inicio, fin: e.fin, dur: e.dur, texto: e.direccion || e.voz };
  });
  const fin = escenas.length ? escenas[escenas.length - 1].fin : 0;
  const anim: import("./tipos").Animacion = {
    version: 1, titulo: o.titulo || salida[0]?.headline.text || "Video de estudio", paleta: o.paleta ?? "imnoba", sfx, fps: 60, duracion: fin,
    escenas: salida, uso: null, hud: false, formato: "estudio",
  };
  return { anim, correcciones, sinRespuesta };
}

/* ───────────── plantilla del «Prompt Formateador» ───────────── */

export const PROMPT_FORMATEADOR_ESTUDIO = `Actúa como editor de guiones y director de arte para videos verticales cortos (1080×1920, 60 fps) de estilo estudio geométrico minimalista (tipo Kurzgesagt / Vox). Voy a pegarte mi guion e ideas. Devuélvelo con EXACTAMENTE este formato, sin nada más:

[ESCENA 1 | 0s-7s | MODO: SVG]
VOZ_OFF: lo que se dice en esta escena (solo para que yo lo grabe; no se dibuja).
DIRECCION_VISUAL: COMPOSICIÓN CENTRAL: una esfera roja que late como un corazón. Titular "BOGOTÁ ESTÁ ATRAPADA".
SFX: whoosh, pop

[ESCENA 2 | 7s-14s | MODO: SVG]
VOZ_OFF: …
DIRECCION_VISUAL: COMPARACIÓN 50/50: a la izquierda "PERRO" con 000, a la derecha "GATO" con 140. Gana el gato.
SFX: tick, ding

Reglas:
1. Los tiempos son consecutivos (el fin de una escena es el inicio de la siguiente; la primera empieza en 0s) y cada escena dura entre 3 y 10 segundos. MODO es SVG (diseño plano con volumen y puntos de semitono) o 3D (igual, con cámara orbital suave).
2. En DIRECCION_VISUAL elige UNA de estas composiciones y nómbrala al empezar:
   · COMPOSICIÓN CENTRAL → un solo protagonista grande con un titular arriba.
   · COMPARACIÓN 50/50 → dos columnas con marcador numérico, figura y etiqueta; indica las dos etiquetas y los dos números (000 si es cero) entre comillas o cifras, y quién gana (> < =).
   · PANTALLA DIVIDIDA DIAGONAL → dos estados (antes/después, problema/solución) separados por una diagonal; di qué figura va arriba y cuál abajo.
   · SUPERFICIE → algo que avanza o se estira sobre una barra (oruga, tren, progreso).
3. Describe la figura con estas palabras: esfera, cápsula, huevo/célula, velocímetro (anillo con aguja), torre de píldora; y detalles opcionales: orejas de perro, orejas de gato, abeja con rayas, células, núcleo luminoso, estela de velocidad. Indica el rol del color: destacado (dorado), riesgo (rojo), positivo (verde), azul, neutro.
4. Pon el TITULAR entre comillas (máx. 30 caracteres, en mayúsculas; la palabra importante se resalta sola). No inventes cifras que yo no haya dado.
5. SFX es opcional (pop, whoosh, heartbeat, cash, tick, thud, zap, ding). Sin subtítulos. Máximo 30 escenas. Cada escena distinta de la anterior.

Mi guion e ideas:
`;
