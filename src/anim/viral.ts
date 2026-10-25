/**
 * DIRECTOR VIRAL: de UNA FRASE de idea a un reel completo. La IA actúa de guionista y director de arte en una sola llamada barata (JSON compacto):
 * escribe la locución (VOZ_OFF) de cada escena, decide su duración y elige una de 22 plantillas profesionales de reel (gancho cinético, número gigante,
 * versus, barras, línea de tendencia, pasos, lista, ruta de metro, ciudad que crece, cierre con llamada a la acción y, para ciencia y naturaleza,
 * zoom de escala, vista explotada, mira telescópica, impacto, red, termómetro, pantalla dividida y columna de presión). Un motor prefabricado
 * (src/viral/) dibuja cada plantilla con texto cinético, contadores, gráficas e iconos: la IA nunca escribe código ni coordenadas.
 *
 * Aquí vive todo lo PURO (sin Node ni navegador): leer la idea, vocabulario, prompt cacheable, saneado de lo que devuelve la IA,
 * ritmo y duraciones, fondos alternados, SFX, locución, ensamblado y costo.
 */
import { modeloPorId, tokensDeTexto } from "./costos";
import { coloresEstudio, mezclar, oscurecer, type ColoresEstudio } from "./estudio";
import type { EscenaEstudioGuion } from "./estudio";
import { esRetro, paletaPorId } from "./paletas";
import { IDS_PIEZA, piezaPorId } from "./piezas";
import type { Animacion, EventoSfx } from "./tipos";

/* ───────────── vocabulario cerrado ───────────── */

export const TIPOS_VIRAL = ["HOOK", "NUM", "VS", "BARS", "LINE", "STEPS", "LIST", "ROUTE", "SKYLINE", "DONUT", "PICTO", "TOP", "MITO", "ZOOM", "CAPAS", "MIRA", "IMPACTO", "RED", "TERMO", "SPLIT", "PILA", "PAPEL", "PILARES", "CICLO", "PUNCH", "DUO", "OSCILO", "CUBO", "DIALES", "PIEZA", "CTA"] as const;
export type TipoViral = (typeof TIPOS_VIRAL)[number];
/** Plantillas «documentales» (ciencia, naturaleza, tecnología): banda superior, tipografía mono y escenario ilustrado. */
export const TIPOS_CIENCIA: readonly TipoViral[] = ["ZOOM", "CAPAS", "MIRA", "IMPACTO", "RED", "TERMO", "SPLIT", "PILA"];
/**
 * Plantillas del estilo DOCUMENTAL (videos explicativos de ciencia/curiosidades con estudios citados: ficha de papel, pilares isométricos, ciclo, golpe de palabra,
 * paneles comparados, osciloscopio, cubo de posibilidades y diales). Se pueden usar con cualquier paleta; la paleta Retro-Científica les da su look completo.
 */
export const TIPOS_DOCUMENTAL: readonly TipoViral[] = ["PAPEL", "PILARES", "CICLO", "PUNCH", "DUO", "OSCILO", "CUBO", "DIALES"];
/** Sobre «papel» (fondo claro) en el estilo documental; todo lo demás va sobre el fondo oscuro. */
export const TIPOS_PAPEL: readonly TipoViral[] = ["PAPEL", "CICLO"];
/** ¿La paleta activa pide el estilo documental? (las dos Retro-Científica: fondo plano, tipografía de titulares pesada + mono, cortes secos, papel) */
export const esDocumental = (paleta: string | undefined): boolean => esRetro(paleta);
/** Escenarios ilustrados de fondo (siempre sobre el tema oscuro). */
export const ESCENARIOS_VIRAL = ["espacio", "luna", "bio", "celula"] as const;
export type EscenarioViral = (typeof ESCENARIOS_VIRAL)[number];
/** Cómo entra una escena: barrido diagonal (por defecto) o zoom continuo (la cámara «viaja» hacia dentro). */
export type TransicionViral = "barrido" | "zoom" | "corte" | "papel" | "semitono";
export const FONDOS_VIRAL = ["dark", "gold", "light"] as const;
export type FondoViral = (typeof FONDOS_VIRAL)[number];

/** Iconos que la IA puede pedir (lucide, nombres sin prefijo). */
export const ICONOS_VIRAL = [
  "casa", "edificio", "torre", "pin", "mapa", "auto", "velocimetro", "tendencia-alza", "tendencia-baja", "barras", "linea-grafica", "alcancia", "billete", "monedas",
  "porcentaje", "banco", "acuerdo", "contrato", "reloj", "telefono", "chat", "globo", "estrella", "premio", "verificado", "brillo", "corona", "tren", "bus", "cohete",
  "diana", "idea", "candado", "seguridad", "llave", "dolar", "colegio", "compras", "arboles", "calendario-ok", "etiqueta", "dinero-mano", "wifi", "sol", "tienda", "firma", "check", "alerta", "rayo",
  // ciencia y naturaleza
  "adn", "microscopio", "celula", "termometro", "oxigeno", "tubos-ensayo", "ojo", "gota", "bacteria", "virus", "luna", "atomo", "bicho", "planeta", "concha",
] as const;
const ICONOS_BASICOS = new Set(["check", "alerta", "rayo", "cruz", "gota", "bacteria", "virus"]);
/** Iconos propios del motor viral (se dibujan en src/viral/comun.tsx). */
export const ICONOS_PROPIOS = new Set(["luna", "atomo", "bicho", "planeta", "concha"]);
const ICONOS_HI = new Set(["adn", "microscopio", "celula", "termometro", "oxigeno", "tubos-ensayo", "ojo"]);
/** Nombre real que entiende dibujarIcono(): «lu-casa» para lucide, «hi-adn» para healthicons y el básico para check/alerta/rayo/gota. */
export const iconoReal = (n: string): string => (ICONOS_BASICOS.has(n) || ICONOS_PROPIOS.has(n) ? n : ICONOS_HI.has(n) ? `hi-${n}` : `lu-${n}`);

export type LadoVs = { l: string; n: string; ic: string };
export type DatosViral = {
  /** titular (HOOK/CTA) o encabezado de la escena (el resto) */
  h: string;
  /** palabra destacada del titular */
  w: string;
  sub: string;
  ic: string;
  /** NUM */
  num: { n: string; u: string; pre: string; l: string } | null;
  /** VS */
  vs: { a: LadoVs; b: LadoVs; op: ">" | "<" | "=" } | null;
  /** BARS */
  bars: { l: string; v: number }[];
  barsU: string;
  hi: number;
  /** LINE */
  line: { pts: number[]; l0: string; l1: string; end: string } | null;
  /** STEPS (con icono) y LIST (solo texto) */
  items: { l: string; ic: string }[];
  /** ROUTE */
  stops: string[];
  end: string;
  /** DONUT: reparto de un total (2–4 partes) */
  donut: { l: string; v: number }[];
  /** PICTO: «k de cada n» con iconos */
  picto: { n: number; k: number; ic: string; l: string } | null;
  /** TOP: ranking (se revela de abajo hacia arriba) */
  top: { l: string; v: string }[];
  /** MITO: lo que se cree vs. la realidad */
  myth: string;
  truth: string;
  /** ZOOM: viaje de escala. `a`→`b` = exponente de 10^x metros del ancho del cuadro; cada item tiene su tamaño 10^e m */
  zoom: { a: number; b: number; items: { l: string; e: number; ic: string }[] } | null;
  /** CAPAS: vista explotada de un objeto (de arriba hacia abajo) */
  capas: { ic: string; medida: string; items: { l: string; m: string }[] } | null;
  /** MIRA: mira telescópica que fija un objeto diminuto, lo mide (cota) y se acerca */
  mira: { ic: string; l: string; med: string } | null;
  /** IMPACTO: objeto que cae y se estrella (estela, polvo y fragmentos) */
  impacto: { ic: string; l: string; v: string } | null;
  /** RED: nodo central y los nodos que se conectan a él */
  red: { c: string; nodes: string[] } | null;
  /** TERMO: termómetro que barre de `lo` a `hi` y cuadrícula de `n` seres de los que sobreviven `k` */
  termo: { u: string; lo: number; hi: number; n: number; k: number; ic: string; l: string } | null;
  /** PILA: un solo punto frente a una columna de puntos que crece hasta `n` y aplasta al sujeto */
  pila: { ic: string; l1: string; l2: string; n: string } | null;
  /** Línea de texto mono que se escribe sola (estilo máquina de escribir); las palabras entre *asteriscos* van en color de acento */
  cap: string;
  /** PAPEL: ficha de estudio sobre papel (autor · año, rol, cifra que cuenta, descripción, campo de puntos y sello) */
  papel: { autor: string; anio: string; rol: string; n: string; u: string; desc: string; nota: string; puntos: boolean } | null;
  /** PILARES: columnas isométricas con una fracción rayada («k de n»); `cabeza` es la fracción gigante; `hi` = columna destacada */
  pilares: { cabeza: string; cols: { l: string; k: number; n: number; u: string }[]; hi: number } | null;
  /** CICLO: pasos que se encadenan en círculo con flechas (el último vuelve al primero) */
  ciclo: { ic: string; pasos: string[] } | null;
  /** DUO: dos paneles comparados (uno «se queda», otro «se mueve») y una palabra grande que se llena según `v` (0–1) de cada uno */
  duo: { a: { l: string; v: number }; b: { l: string; v: number }; palabra: string } | null;
  /** OSCILO: pantalla de osciloscopio con una curva que se dibuja (lissajous, onda o espiral) */
  osc: { curva: "lissajous" | "onda" | "espiral"; l: string; a: string } | null;
  /** CUBO: cubo isométrico de posibilidades; `zonas` son los rincones donde hay algo (x,y,z de 0 a 1); el resto «está vacío» */
  cubo: { ejes: string[]; n: number; zonas: { l: string; x: number; y: number; z: number }[] } | null;
  /** DIALES: tres diales que cambian de `a` a `b` y mueven una figura (espiral de concha u onda) */
  diales: { fig: "espiral" | "onda"; titulo: string; items: { l: string; a: number; b: number; min: number; max: number; u: string; dec: number }[] } | null;
  /** PIEZA: escena a medida (carril B) registrada en src/anim/piezas.ts; `props` son parámetros opcionales de esa pieza */
  pieza: { id: string; props: Record<string, string | number | boolean | (string | number)[]> } | null;
  /** Ficha de cita científica (fuente y año): opcional en cualquier escena menos el CTA */
  cita: { t: string; y: string } | null;
  /** Escenario ilustrado de fondo ("" = el fondo normal) */
  sc: "" | EscenarioViral;
};

export type EscenaViral = { n: number; t: TipoViral; voz: string; dur: number } & DatosViral;

/** Escena tal como se guarda en animacion.json. */
export type EscenaViralGuardada = EscenaViral & {
  modo: "VIRAL";
  tema: "oscuro" | "claro";
  bg: FondoViral;
  /** 0…1: cuánto se comprime la animación cuando la escena dura menos de lo ideal */
  ritmo: number;
  /** posición en el video (para la barra de progreso) */
  total: number;
  sfx?: EventoSfx[];
  inicio: number;
  fin: number;
  texto: string;
  /** cómo ENTRA esta escena y cómo SALE (= la entrada de la siguiente); sin valor = barrido */
  tr?: TransicionViral;
  trs?: TransicionViral;
};

/* ───────────── tiempos compartidos entre el motor visual y el sonido ───────────── */

/** Retrasos (s) de cada plantilla a ritmo normal; el motor y los SFX los multiplican por `ritmo`. */
export const TV = {
  titulo: 0.15,
  /** n-ésimo elemento de una lista/pasos */
  item: (i: number): number => 0.75 + 0.62 * i,
  barra: (i: number): number => 0.7 + 0.2 * i,
  barraDur: 0.9,
  contar: 0.6,
  contarDur: 1.5,
  linea: 0.7,
  lineaDur: 2.1,
  ruta: 0.6,
  rutaDur: 2.8,
  ciudad: 0.5,
  etiqueta: 1.9,
  donut: 0.6,
  donutDur: 1.5,
  picto: (i: number): number => 0.55 + 0.085 * i,
  mito: 0.35,
  tacha: 1.35,
  verdad: 2.05,
  /** ZOOM: la cámara viaja de 0,3 s a (duración − 0,45 s) */
  zoomIni: 0.3,
  zoomCola: 0.45,
  /** CAPAS: inclinación a perspectiva, separación y etiquetas */
  capasTilt: 0.2,
  capasTiltDur: 0.8,
  capasSepara: 1.0,
  capasSeparaDur: 0.9,
  capasEtiqueta: (i: number): number => 1.75 + 0.27 * i,
  /** MIRA: búsqueda, fijado, cota y zoom hacia el objetivo */
  miraFija: 1.35,
  miraCota: 1.75,
  miraZoom: 2.55,
  miraZoomDur: 1.0,
  /** IMPACTO: instante del choque */
  impacto: 1.55,
  /** RED: n-ésimo nodo; después se cruzan los enlaces */
  redNodo: (i: number): number => 0.6 + 0.34 * i,
  /** TERMO: barrido del termómetro */
  termo: 0.75,
  termoDur: 2.7,
  /** PILA: la columna crece */
  pila: 0.7,
  pilaDur: 2.4,
  /** SPLIT */
  splitContar: 0.8,
  splitGana: 2.1,
  /** ficha de cita */
  cita: 1.0,
  /** DOCUMENTAL: PAPEL (cifra que cuenta, campo de puntos, sello) */
  papelContar: 0.8,
  papelContarDur: 1.6,
  papelCampo: 2.6,
  papelCampoDur: 1.7,
  papelSello: 4.5,
  /** PILARES */
  pilaresSuben: 0.35,
  pilaresSubenDur: 0.9,
  pilaresCabeza: 1.4,
  pilaresRayas: 1.8,
  pilaresRayasDur: 1.3,
  /** CICLO: n-ésimo paso/flecha */
  cicloPaso: (i: number): number => 0.7 + 0.75 * i,
  /** PUNCH: instante del golpe */
  punchGolpe: 0.4,
  /** DUO */
  duoA: 0.3,
  duoB: 0.9,
  duoPalabra: 1.7,
  duoPalabraDur: 1.2,
  /** OSCILO */
  oscCurva: 0.4,
  oscDur: 3.2,
  /** CUBO */
  cuboPuntos: 0.4,
  cuboPuntosDur: 1.5,
  cuboFiltra: 2.4,
  cuboFiltraDur: 0.9,
  cuboZonas: 3.3,
  /** DIALES */
  dialesIni: 0.5,
  dialesDur: 3.0,
} as const;

/* ───────────── ZOOM: la cámara de «lienzo infinito» (compartida por el dibujo y los SFX) ───────────── */

const suave = (u: number): number => { const x = Math.min(1, Math.max(0, u)); return x * x * (3 - 2 * x); };

type ZoomCam = { a: number; b: number; items?: { e: number }[] };
const PERFIL_N = 240;
/**
 * Perfil de la cámara: el tiempo que se «gasta» en cada tramo de exponentes es proporcional a una densidad que sube cerca de cada elemento
 * (la cámara se frena donde hay algo que ver y cruza rápido los tramos vacíos) y en los extremos (arranque y frenada suaves).
 * Devuelve el tiempo normalizado (0…1) acumulado en cada muestra de exponente entre `a` y `b`.
 */
function perfilZoom(z: ZoomCam): Float64Array {
  const centros = (z.items ?? []).map((it) => it.e + 0.155); // exponente de cámara en que el elemento ocupa ≈ el 70 % del cuadro
  const acum = new Float64Array(PERFIL_N + 1);
  for (let i = 1; i <= PERFIL_N; i++) {
    const c = z.a + ((z.b - z.a) * (i - 0.5)) / PERFIL_N;
    let d = 1 + 3 * Math.exp(-(((c - z.a) / 0.45) ** 2)) + 3 * Math.exp(-(((c - z.b) / 0.45) ** 2));
    for (const ck of centros) d += 5 * Math.exp(-(((c - ck) / 0.5) ** 2));
    acum[i] = acum[i - 1] + d;
  }
  for (let i = 1; i <= PERFIL_N; i++) acum[i] /= acum[PERFIL_N];
  return acum;
}

/** Exponente de 10 (metros) del ancho del cuadro en el instante `t` de una escena ZOOM de `dur` segundos. */
export function exponenteZoom(z: ZoomCam, t: number, dur: number): number {
  const u = Math.min(1, Math.max(0, (t - TV.zoomIni) / Math.max(0.5, dur - TV.zoomIni - TV.zoomCola)));
  const acum = perfilZoom(z);
  let i = 1;
  while (i < PERFIL_N && acum[i] < u) i++;
  const k = acum[i] > acum[i - 1] ? (u - acum[i - 1]) / (acum[i] - acum[i - 1]) : 0;
  return z.a + ((z.b - z.a) * (i - 1 + Math.min(1, Math.max(0, k)))) / PERFIL_N;
}
/** Instante en que la cámara alcanza el exponente `c` (se ajusta a los extremos si queda fuera del recorrido). */
export function tiempoZoom(z: ZoomCam, dur: number, c: number): number {
  const acum = perfilZoom(z);
  const x = Math.min(1, Math.max(0, (c - z.a) / (z.b - z.a))) * PERFIL_N;
  const i = Math.min(PERFIL_N - 1, Math.floor(x));
  const u = acum[i] + (acum[i + 1] - acum[i]) * (x - i);
  return TV.zoomIni + u * Math.max(0.5, dur - TV.zoomIni - TV.zoomCola);
}
/** Opacidad (0…1) de un elemento de tamaño 10^e m cuando el cuadro mide 10^c m: aparece cuando ocupa un 6–14 % del cuadro y se va al pasarlo (110–170 %). */
export function opacidadZoom(e: number, c: number): number {
  const r = Math.pow(10, e - c);
  return suave((r - 0.06) / 0.08) * (1 - suave((r - 1.1) / 0.6));
}
/** Unidad legible para una potencia de diez (metros): «1 KM», «10 CM», «100 µM»… */
export function longitudLegible(k: number): string {
  const tabla: [number, number, string][] = [[3, 3, "KM"], [0, 0, "M"], [-2, -2, "CM"], [-3, -3, "MM"], [-6, -6, "µM"], [-9, -9, "NM"], [-12, -12, "PM"]];
  const [, base, u] = tabla.find(([min]) => k >= min) ?? tabla[tabla.length - 1];
  return `${Math.pow(10, k - base) >= 1 ? Math.round(Math.pow(10, k - base)) : Math.pow(10, k - base)} ${u}`;
}

/** Segundos que necesita cada plantilla para mostrar todo con calma (a ritmo 1). */
export function duracionIdeal(e: Pick<EscenaViral, "t" | "items" | "bars" | "stops" | "top" | "picto"> & Partial<Pick<EscenaViral, "capas" | "red" | "ciclo" | "papel" | "pieza">>): number {
  switch (e.t) {
    case "HOOK": return 2.6;
    case "NUM": return TV.contar + TV.contarDur + 0.9;
    case "VS": return 3.6;
    case "BARS": return TV.barra(Math.max(0, e.bars.length - 1)) + TV.barraDur + 0.9;
    case "LINE": return TV.linea + TV.lineaDur + 0.9;
    case "STEPS": case "LIST": return TV.item(Math.max(0, e.items.length - 1)) + 1.1;
    case "ROUTE": return TV.ruta + TV.rutaDur + 0.7;
    case "SKYLINE": return TV.etiqueta + 1.1;
    case "DONUT": return TV.donut + TV.donutDur + 1.0;
    case "PICTO": return TV.picto(Math.max(0, (e.picto?.n ?? 10) - 1)) + 2.0;
    case "TOP": return TV.item(Math.max(0, e.top.length - 1)) + 1.2;
    case "MITO": return TV.verdad + 1.5;
    case "ZOOM": return 5.2;
    case "CAPAS": return TV.capasEtiqueta(Math.max(0, (e.capas?.items.length ?? 3) - 1)) + 1.5;
    case "MIRA": return TV.miraZoom + TV.miraZoomDur + 0.9;
    case "IMPACTO": return TV.impacto + 2.4;
    case "RED": return TV.redNodo(e.red?.nodes.length ?? 4) + 1.7;
    case "TERMO": return TV.termo + TV.termoDur + 1.1;
    case "SPLIT": return 3.6;
    case "PILA": return TV.pila + TV.pilaDur + 1.2;
    case "PAPEL": return e.papel?.puntos === false ? TV.papelContar + TV.papelContarDur + 1.8 : TV.papelCampo + TV.papelCampoDur + 1.3;
    case "PILARES": return TV.pilaresRayas + TV.pilaresRayasDur + 1.2;
    case "CICLO": return TV.cicloPaso(e.ciclo?.pasos.length ?? 4) + 1.2;
    case "PUNCH": return 3.0;
    case "DUO": return TV.duoPalabra + TV.duoPalabraDur + 1.2;
    case "OSCILO": return TV.oscCurva + TV.oscDur + 0.9;
    case "CUBO": return TV.cuboZonas + 1.8;
    case "DIALES": return TV.dialesIni + TV.dialesDur + 1.0;
    case "PIEZA": return piezaPorId(e.pieza?.id)?.ideal ?? 5;
    default: return 3.2;
  }
}

/* ───────────── la idea ───────────── */

export type ResultadoIdea = { formato: "idea"; idea: string; duracion: number; escenasObjetivo: number; errores: string[]; avisos: string[]; caracteres: number };

/** ¿El texto es una idea suelta (sin bloques [ESCENA …] ni [CONFIG])? Los guiones en bloques siguen funcionando igual. */
export const esIdea = (texto: string): boolean => !/^\s*\[\s*(ESCENA|CONFIG)\b/im.test(texto);

export const DURACION_DEFECTO = 32;
/** Duración mínima y máxima (s) que se puede pedir; sin pedirla, una idea detallada alarga el video hasta DURACION_AUTO_MAX. */
export const DURACION_MIN = 15;
export const DURACION_MAX = 180;
export const DURACION_AUTO_MAX = 90;
/** Estilo documental: sin pedir duración un video explicativo dura ≈ 60 s y, con mucho detalle, hasta 120 s (los de referencia duran ≈ 2 min). */
export const DURACION_DOCUMENTAL = 60;
export const DURACION_DOCUMENTAL_MAX = 120;
/** Hasta cuántos caracteres la idea cabe en el video de duración por defecto; cada ≈ 55 más suman 1 s. */
export const IDEA_CORTA = 400;
/** Escenas objetivo para una duración: ≈ una cada 3,6 s (ritmo de reel). */
export const escenasParaDuracion = (s: number, documental = false): number => (documental ? Math.min(44, Math.max(6, Math.round(s / 4.4))) : Math.min(48, Math.max(5, Math.round(s / 3.6))));
/** A partir de cuántos caracteres la idea se considera «detallada» y se le pide a la IA cubrir TODOS sus puntos. */
export const IDEA_DETALLADA = 350;

/**
 * Lee la idea: una frase o todo el detalle que quieras (sin límite de caracteres; se conservan los saltos de línea, viñetas y cifras).
 * Duración: si dice «de 30 segundos» / «1 minuto» (o «el video dura 2 minutos») se respeta (15–120 s). Si no la dice, ≈ 32 s para una idea corta
 * y más larga cuanto más detalle tenga (hasta 90 s), para que quepan todos sus puntos. Con una paleta Retro-Científica (estilo documental): ≈ 60 s y hasta 120 s, con una escena cada ≈ 4,4 s.
 */
export function parsearIdea(texto: string, opciones: { paleta?: string } = {}): ResultadoIdea {
  const doc = esDocumental(opciones.paleta);
  const idea = texto.replace(/\r/g, "").replace(/[ \t\f\v]+/g, " ").replace(/ ?\n ?/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  const errores: string[] = [];
  const avisos: string[] = [];
  if (idea.length < 8) errores.push("Escribe tu idea: qué quieres que cuente el video (una frase basta, por ejemplo «Por qué el metro de Bogotá valoriza las propiedades cerca de las estaciones»; también puedes dar todo el detalle que quieras).");
  const plano = idea.replace(/\s+/g, " ");
  // en una idea larga, «5 minutos» suele ser un dato del tema (no la duración del video): solo cuenta si va junto a «video/reel/dura…»
  const atado = plano.match(/(?:v[ií]deo|reel|clip|duraci[oó]n|dura|durar[aá]|de unos|de)\s*(?:de\s+|unos\s+|aprox(?:imadamente)?\s+)?(\d+(?:[.,]\d+)?)\s*(s\b|seg\b|segundos?|min\b|minutos?)/i);
  const suelta = plano.length <= IDEA_CORTA ? plano.match(/(\d+(?:[.,]\d+)?)\s*(s\b|seg\b|segundos?|min\b|minutos?)/i) : null;
  const m = atado ?? suelta;
  const base = doc ? DURACION_DOCUMENTAL : DURACION_DEFECTO;
  let duracion = Math.min(doc ? DURACION_DOCUMENTAL_MAX : DURACION_AUTO_MAX, base + Math.max(0, plano.length - IDEA_CORTA) / 55);
  let pedida = false;
  if (m) {
    pedida = true;
    const v = Number(m[1].replace(",", "."));
    duracion = /^m/i.test(m[2]) ? v * 60 : v;
  }
  if (pedida && (duracion < DURACION_MIN || duracion > DURACION_MAX)) {
    avisos.push(`La duración pedida (${Math.round(duracion)} s) se ajusta al rango de un reel: ${DURACION_MIN}–${DURACION_MAX} s.`);
    duracion = Math.min(DURACION_MAX, Math.max(DURACION_MIN, duracion));
  }
  if (!pedida && duracion > base + 0.5) avisos.push(`Idea detallada: el video durará ≈ ${Math.round(duracion)} s para que quepan todos sus puntos (di «de N segundos» si prefieres otra duración).`);
  return { formato: "idea", idea, duracion: Math.round(duracion), escenasObjetivo: escenasParaDuracion(duracion, doc), errores, avisos, caracteres: idea.length };
}

/* ───────────── saneado ───────────── */

const sinAcentos = (s: string): string => s.normalize("NFD").replace(/[̀-ͯ]/g, "");
const clave = (s: unknown): string => sinAcentos(String(s ?? "")).trim().toUpperCase().replace(/[\s-]+/g, "_");
/** Recorta a `max` caracteres SIN partir una palabra por la mitad. */
function recortar(s: string, max: number): string {
  if (s.length <= max) return s;
  const corte = s.lastIndexOf(" ", max);
  return (corte > max * 0.45 ? s.slice(0, corte) : s.slice(0, max)).replace(/[\s,;:–-]+$/, "");
}
const limpio = (v: unknown, max: number): string => recortar(String(v ?? "").replace(/\s+/g, " ").trim(), max);
const mayus = (v: unknown, max: number): string => limpio(v, max).toUpperCase();
const palabras = (s: string): number => s.split(/\s+/).filter(Boolean).length;

function elegirTipo(v: unknown): TipoViral | null {
  const k = clave(v);
  return (TIPOS_VIRAL as readonly string[]).includes(k) ? (k as TipoViral) : null;
}

/** Texto que parece un número: «35», «1.200», «0,5» → sin símbolos raros (máx. 7 caracteres). */
const numero = (v: unknown, defecto = ""): string => {
  const s = String(v ?? "").replace(/[^\d.,]/g, "").slice(0, 7);
  return s || defecto;
};
/** «1.200» → 1200 · «0,5» → 0.5 · «3.5» → 3.5 (el punto con 3 decimales exactos se lee como millar). */
const aNumero = (s: string): number => {
  let t = s;
  if (t.includes(".") && t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, "");
  else t = t.replace(",", ".");
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : 0;
};

const ICONO_POR_TEXTO: [RegExp, string][] = [
  [/metro|tren|estaci|ferro|riel/, "tren"], [/bus\b|transmilenio|buses|ruta/, "bus"], [/edificio|torre|rascacielo/, "edificio"], [/casa|vivienda|apartament|inmueble|hogar|propiedad/, "casa"],
  [/carro|auto|veh[ií]culo|moto|camioneta/, "auto"], [/velocidad|r[aá]pid|veloz|tr[aá]fico|trancon|colapso/, "velocimetro"], [/ahorr|alcanc/, "alcancia"], [/valoriz|plusval|crece|crecimiento|sube|aument|inversi|rentab/, "tendencia-alza"],
  [/cae|baja|pierde|p[eé]rdida|desvaloriz/, "tendencia-baja"], [/precio|d[oó]lar|usd/, "dolar"], [/dinero|plata|pesos|millones|costo|cuesta|pago|comisi/, "billete"], [/gratis|oferta|descuento|promo/, "etiqueta"],
  [/mapa|ciudad|zona|barrio|localidad/, "mapa"], [/ubicaci|direcci|cerca|lugar/, "pin"], [/tiempo|hora|minuto|rapid|ya\b|r[aá]pido/, "reloj"], [/segur|protec/, "seguridad"],
  [/contrato|escritura|legal|notar/, "contrato"], [/acuerdo|negocio|trato|cierre/, "acuerdo"], [/banco|cr[eé]dito|hipoteca|financi/, "banco"], [/colegio|universidad|educaci/, "colegio"],
  [/comercio|tienda|local|compras|centro comercial/, "tienda"], [/verde|parque|arbol|[aá]rbol|naturaleza/, "arboles"], [/whatsapp|chat|mensaje|contacto|escr[ií]b/, "chat"], [/llamar|tel[eé]fono|llama/, "telefono"],
  [/llave|entrega|estren/, "llave"], [/meta|objetivo|logro|exito|éxito/, "diana"], [/idea|plan|estrategia/, "idea"], [/premio|mejor|calidad/, "premio"], [/confianza|verificad|garant/, "verificado"],
  [/alerta|riesgo|peligro|cuidado/, "alerta"], [/cohete|despega|impulso|lanz/, "cohete"],
];
/** Icono que mejor encaja con un texto (para cuando la IA omite el icono o pide uno que no existe). */
export function iconoPorTexto(texto: string, defecto = "brillo"): string {
  const t = sinAcentos(texto).toLowerCase();
  return ICONO_POR_TEXTO.find(([re]) => re.test(t))?.[1] ?? defecto;
}
const icono = (v: unknown, contexto: string, defecto = "brillo"): string => {
  const k = String(v ?? "").trim().toLowerCase().replace(/^lu-/, "").replace(/[\s_]+/g, "-");
  return (ICONOS_VIRAL as readonly string[]).includes(k) ? k : iconoPorTexto(contexto, defecto);
};

/** Palabra a destacar: la pedida si está en el titular; si no, una cifra o la palabra más larga que no sea vacía. */
const VACIAS = new Set("el la los las un una unos unas de del al y o u en con por para que es fue se su sus lo le les mas muy como ya no si pero sin sobre entre hay son ser era tu te tus".split(" "));
function destacar(h: string, pedida: string): string {
  const ps = h.split(/\s+/).filter(Boolean);
  const n = (p: string) => sinAcentos(p).toLowerCase().replace(/[^\p{L}\p{N}%$+]/gu, "");
  const dada = ps.find((p) => n(p) === n(pedida));
  if (dada && n(pedida)) return dada;
  const cifra = ps.find((p) => /\d/.test(p));
  if (cifra) return cifra;
  const buenas = ps.filter((p) => !VACIAS.has(n(p)) && n(p).length >= 3);
  return (buenas.length ? buenas : ps).reduce((m, p) => (n(p).length > n(m).length ? p : m), ps[0] ?? "");
}

const VACIO: DatosViral = { h: "", w: "", sub: "", ic: "brillo", num: null, vs: null, bars: [], barsU: "", hi: -1, line: null, items: [], stops: [], end: "", donut: [], picto: null, top: [], myth: "", truth: "", zoom: null, capas: null, mira: null, impacto: null, red: null, termo: null, pila: null, cap: "", papel: null, pilares: null, ciclo: null, duo: null, osc: null, cubo: null, diales: null, pieza: null, cita: null, sc: "" };

/** Entero (acepta «−6», «6,0»…) acotado a [min, max]; si no es un número, `def`. */
const entero = (v: unknown, def: number, min = -12, max = 12): number => {
  const n = Math.round(Number(String(v ?? "").replace("−", "-").replace(",", ".")));
  return Number.isFinite(n) && String(v ?? "").trim() !== "" ? Math.min(max, Math.max(min, n)) : def;
};
/** Decimal acotado (acepta coma decimal y «−»). */
const decimal = (v: unknown, def: number, min = -1e6, max = 1e6): number => {
  const n = Number(String(v ?? "").replace("−", "-").replace(",", "."));
  return Number.isFinite(n) && String(v ?? "").trim() !== "" ? Math.min(max, Math.max(min, n)) : def;
};

/** Ficha de cita: acepta {t, y} o un texto «NASA, 2019». Sin fuente → null. */
function normalizarCita(v: unknown): { t: string; y: string } | null {
  if (v === null || v === undefined || v === "") return null;
  let t = "", y = "";
  if (typeof v === "string") {
    const m = v.match(/^(.*?)[\s,·|–-]*((?:19|20)\d{2})?\s*$/);
    t = m?.[1] ?? v; y = m?.[2] ?? "";
  } else if (typeof v === "object") {
    t = String((v as any).t ?? (v as any).fuente ?? (v as any).src ?? ""); y = String((v as any).y ?? (v as any).año ?? (v as any).anio ?? "");
  }
  t = limpio(t, 34);
  y = y.replace(/[^\d]/g, "").slice(0, 4);
  return t.length >= 2 ? { t, y } : null;
}

/** Cifra más llamativa que aparece en un texto (para completar un NUM al que la IA no puso número). */
function primeraCifra(s: string): { n: string; u: string } | null {
  const m = s.match(/(\d[\d.,]*)\s*(%|veces|x|años|anos|km|m²|m2|millones|mil|minutos|horas|días|dias)?/i);
  return m ? { n: numero(m[1]), u: /%/.test(m[2] ?? "") ? "%" : m[2] && /millones/i.test(m[2]) ? "M" : m[2] && /m2|m²/i.test(m[2]) ? "m²" : (m[2] ?? "").slice(0, 4) } : null;
}

/**
 * Sanea UNA escena que devolvió la IA: tipo y valores dentro del vocabulario, textos recortados y en mayúsculas, iconos válidos,
 * datos completos para su plantilla (lo que falte se deduce de la locución). Nunca falla: devuelve también las correcciones hechas.
 */
export function normalizarEscenaViral(raw: any, n: number, vozDada?: string): { escena: EscenaViral; correcciones: string[] } {
  const corr: string[] = [];
  const r = raw && typeof raw === "object" ? raw : {};
  let t = elegirTipo(r.t ?? r.tipo ?? r.type ?? r.layout);
  if (!t) {
    corr.push(`Escena ${n}: el tipo «${limpio(r.t ?? r.tipo, 16)}» no existe; se usa HOOK`);
    t = "HOOK";
  }
  const voz = limpio(vozDada ?? r.voz ?? r.narracion ?? "", 260);
  const ctx = `${r.h ?? ""} ${voz}`;
  const d: DatosViral = { ...VACIO };
  d.h = mayus(r.h ?? r.headline?.text ?? r.headline, t === "HOOK" || t === "CTA" ? 40 : 34);
  if (!d.h) d.h = titularDeVoz(voz, t === "HOOK" || t === "CTA" ? 34 : 28);
  d.w = destacar(d.h, limpio(r.w ?? r.headline?.highlightWord, 24));
  d.sub = limpio(r.sub, 44);
  d.ic = icono(r.ic, ctx, t === "CTA" ? "cohete" : "brillo");

  switch (t) {
    case "NUM": {
      const num = r.num && typeof r.num === "object" ? r.num : r;
      let nn = numero(num.n);
      let u = limpio(num.u, 5);
      if (!nn) {
        const c = primeraCifra(ctx);
        if (c) { nn = c.n; u = u || c.u; corr.push(`Escena ${n}: NUM sin número; se toma «${c.n}» de la locución`); }
        else { nn = "100"; corr.push(`Escena ${n}: NUM sin número; se usa 100`); }
      }
      d.num = { n: nn, u, pre: limpio(num.pre, 2).replace(/[^+\-$~]/g, ""), l: mayus(num.l ?? r.l, 30) || d.h };
      if (d.num.l === d.h) d.h = "";
      break;
    }
    case "VS":
    case "SPLIT": {
      const lado = (o: any, defL: string): LadoVs => ({ l: mayus(o?.l ?? o?.label, 14) || defL, n: numero(o?.n ?? o?.counter, "0"), ic: icono(o?.ic, `${o?.l ?? ""}`, "estrella") });
      const a = lado(r.a ?? r.vs?.a, "ANTES"), b = lado(r.b ?? r.vs?.b, "AHORA");
      const opK = String(r.op ?? r.operator ?? "").replace(/&gt;/g, ">").replace(/&lt;/g, "<").trim();
      const na = aNumero(a.n), nb = aNumero(b.n);
      const op = opK === ">" || opK === "<" || opK === "=" ? (opK as ">" | "<" | "=") : na > nb ? ">" : na < nb ? "<" : "=";
      d.vs = { a, b, op };
      break;
    }
    case "BARS": {
      const lista: any[] = Array.isArray(r.bars) ? r.bars : [];
      d.bars = lista.slice(0, 6).map((b, i) => ({ l: mayus(b?.l ?? b?.label ?? `${i + 1}`, 10), v: Math.max(0, Number(String(b?.v ?? b?.value ?? 0).replace(",", ".")) || 0) })).filter((b) => b.l);
      if (d.bars.length < 2) { d.bars = [{ l: "ANTES", v: 30 }, { l: "AHORA", v: 70 }]; corr.push(`Escena ${n}: BARS sin datos suficientes; se usan dos barras de ejemplo`); }
      if (d.bars.every((b) => b.v === 0)) d.bars = d.bars.map((b, i) => ({ ...b, v: 20 + i * 20 }));
      d.barsU = limpio(r.u ?? r.barsU, 4);
      const hi = Number.isInteger(Number(r.hi)) ? Number(r.hi) : -1;
      d.hi = hi >= 0 && hi < d.bars.length ? hi : d.bars.reduce((m, b, i, a) => (b.v > a[m].v ? i : m), 0);
      break;
    }
    case "LINE": {
      const l = r.line && typeof r.line === "object" ? r.line : r;
      let pts: number[] = (Array.isArray(l.pts) ? l.pts : []).map((v: unknown) => Number(String(v).replace(",", "."))).filter((v: number) => Number.isFinite(v)).slice(0, 12);
      if (pts.length < 3) { pts = [20, 26, 24, 38, 52, 74]; corr.push(`Escena ${n}: LINE sin puntos suficientes; se usa una tendencia de ejemplo`); }
      d.line = { pts, l0: mayus(l.l0, 9), l1: mayus(l.l1, 9), end: limpio(l.end, 14) };
      break;
    }
    case "STEPS": {
      const lista: any[] = Array.isArray(r.items) ? r.items : [];
      d.items = lista.slice(0, 4).map((it) => ({ l: mayus(typeof it === "string" ? it : it?.l, 18), ic: icono(it?.ic, typeof it === "string" ? it : String(it?.l ?? ""), "brillo") })).filter((it) => it.l);
      if (d.items.length < 2) { d.items = [{ l: "PASO 1", ic: "idea" }, { l: "PASO 2", ic: "cohete" }, { l: "RESULTADO", ic: "premio" }]; corr.push(`Escena ${n}: STEPS sin pasos; se usan pasos de ejemplo`); }
      break;
    }
    case "LIST": {
      const lista: any[] = Array.isArray(r.items) ? r.items : [];
      d.items = lista.slice(0, 4).map((it) => ({ l: limpio(typeof it === "string" ? it : it?.l, 34), ic: "check" })).filter((it) => it.l);
      if (d.items.length < 2) { d.items = [{ l: "Sin complicaciones", ic: "check" }, { l: "Rápido y seguro", ic: "check" }, { l: "Resultados reales", ic: "check" }]; corr.push(`Escena ${n}: LIST sin elementos; se usan elementos de ejemplo`); }
      break;
    }
    case "ROUTE": {
      const lista: any[] = Array.isArray(r.stops) ? r.stops : [];
      d.stops = lista.slice(0, 5).map((s) => mayus(typeof s === "string" ? s : s?.l, 18)).filter(Boolean);
      if (d.stops.length < 3) { d.stops = ["ORIGEN", "CENTRO", "DESTINO"]; corr.push(`Escena ${n}: ROUTE sin estaciones suficientes; se usan tres de ejemplo`); }
      d.end = mayus(r.end, 22);
      break;
    }
    case "SKYLINE": {
      d.end = limpio(r.l ?? r.end, 14);
      if (!d.end) { const c = primeraCifra(ctx); d.end = c ? `+${c.n}${c.u}` : "+"; }
      break;
    }
    case "DONUT": {
      const lista: any[] = Array.isArray(r.donut) ? r.donut : Array.isArray(r.parts) ? r.parts : [];
      d.donut = lista.slice(0, 4).map((p, i) => ({ l: mayus(p?.l ?? p?.label ?? `PARTE ${i + 1}`, 16), v: Math.max(0, Number(String(p?.v ?? p?.value ?? 0).replace(",", ".")) || 0) })).filter((p) => p.l);
      if (d.donut.length < 2 || d.donut.every((p) => p.v === 0)) {
        const c = primeraCifra(ctx);
        const v = c ? Math.min(99, Math.max(1, aNumero(c.n))) : 60;
        d.donut = [{ l: "SÍ", v }, { l: "NO", v: 100 - v }];
        corr.push(`Escena ${n}: DONUT sin partes suficientes; se usa ${v} % / ${100 - v} %`);
      }
      break;
    }
    case "PICTO": {
      const p = r.picto && typeof r.picto === "object" ? r.picto : r;
      let total = Math.round(Number(p.n ?? p.total ?? 10));
      if (!Number.isFinite(total) || total < 4 || total > 20) total = 10;
      let k = Math.round(Number(p.k ?? p.de ?? 3));
      if (!Number.isFinite(k) || k < 1) k = Math.max(1, Math.round(total * 0.3));
      k = Math.min(total - 1, k);
      d.picto = { n: total, k, ic: icono(p.ic ?? r.ic, ctx, "casa"), l: limpio(p.l ?? r.l ?? r.sub, 44) };
      break;
    }
    case "TOP": {
      const lista: any[] = Array.isArray(r.top) ? r.top : Array.isArray(r.items) ? r.items : [];
      d.top = lista.slice(0, 5).map((it) => ({ l: mayus(typeof it === "string" ? it : it?.l, 22), v: limpio(typeof it === "string" ? "" : it?.v, 10) })).filter((it) => it.l);
      if (d.top.length < 3) { d.top = [{ l: "OPCIÓN A", v: "" }, { l: "OPCIÓN B", v: "" }, { l: "OPCIÓN C", v: "" }]; corr.push(`Escena ${n}: TOP con menos de 3 elementos; se usan elementos de ejemplo`); }
      break;
    }
    case "MITO": {
      d.myth = limpio(r.myth ?? r.mito, 70) || limpio(r.sub, 70) || "Eso es lo que todos creen";
      d.truth = limpio(r.truth ?? r.verdad ?? r.realidad, 80) || (d.h ? d.h.charAt(0) + d.h.slice(1).toLowerCase() : "La realidad es otra");
      if (!r.myth && !r.mito) corr.push(`Escena ${n}: MITO sin «myth»; se completa con el texto disponible`);
      break;
    }
    case "ZOOM": {
      const z = r.zoom && typeof r.zoom === "object" ? r.zoom : r;
      let a = entero(z.a ?? z.from, 6), b = entero(z.b ?? z.to, -6);
      if (Math.abs(a - b) < 3) { b = a - 4 >= -12 ? a - 4 : a + 4; corr.push(`Escena ${n}: ZOOM con un recorrido demasiado corto; se amplía a 4 potencias de diez`); }
      const lo = Math.min(a, b), hi = Math.max(a, b);
      const crudos: any[] = Array.isArray(z.items) ? z.items : [];
      let items = crudos.slice(0, 5).map((it, i) => ({ l: mayus(typeof it === "string" ? it : it?.l, 18), e: decimal(it?.e ?? it?.exp, lo + ((hi - lo) * (i + 0.5)) / Math.max(1, crudos.length), lo, hi), ic: icono(it?.ic, String(it?.l ?? it ?? ""), "globo") })).filter((it) => it.l);
      // sin dos elementos casi del mismo tamaño (se pisarían) y de menor a mayor según hacia dónde viaja la cámara
      items.sort((p, q) => (b < a ? q.e - p.e : p.e - q.e));
      items = items.filter((it, i) => i === 0 || Math.abs(it.e - items[i - 1].e) >= 0.9).slice(0, 4);
      if (items.length < 2) {
        const nombres = ["ESCALA GRANDE", "ESCALA MEDIA", "ESCALA PEQUEÑA"];
        items = nombres.map((l, i) => ({ l, e: Math.round(a + ((b - a) * (i + 0.5)) / 3), ic: i === 0 ? "globo" : i === 1 ? "casa" : "atomo" }));
        corr.push(`Escena ${n}: ZOOM sin elementos suficientes; se usan tres escalas de ejemplo`);
      }
      d.zoom = { a, b, items };
      break;
    }
    case "CAPAS": {
      const c = r.capas && typeof r.capas === "object" ? r.capas : r;
      const lista: any[] = Array.isArray(c.items) ? c.items : Array.isArray(c.layers) ? c.layers : [];
      let items = lista.slice(0, 4).map((it, i) => ({ l: mayus(typeof it === "string" ? it : it?.l, 12) || `CAPA ${i + 1}`, m: mayus(typeof it === "string" ? "" : it?.m, 14) }));
      if (items.length < 2) { items = [{ l: "CAPA 1", m: "" }, { l: "CAPA 2", m: "" }, { l: "CAPA 3", m: "" }]; corr.push(`Escena ${n}: CAPAS sin capas suficientes; se usan tres de ejemplo`); }
      d.capas = { ic: icono(c.ic ?? r.ic, ctx, "brillo"), medida: mayus(c.medida ?? c.med, 10), items };
      break;
    }
    case "MIRA": {
      const m = r.mira && typeof r.mira === "object" ? r.mira : r;
      d.mira = { ic: icono(m.ic ?? r.ic, ctx, "bicho"), l: mayus(m.l ?? m.target, 22) || d.h.slice(0, 22), med: mayus(m.med ?? m.medida, 10) };
      break;
    }
    case "IMPACTO": {
      const m = r.impacto && typeof r.impacto === "object" ? r.impacto : r;
      d.impacto = { ic: icono(m.ic ?? r.ic, ctx, "cohete"), l: mayus(m.l ?? m.target, 26) || d.h.slice(0, 26), v: mayus(m.v ?? m.vel, 14) };
      break;
    }
    case "RED": {
      const m = r.red && typeof r.red === "object" ? r.red : r;
      const lista: any[] = Array.isArray(m.nodes) ? m.nodes : Array.isArray(m.items) ? m.items : [];
      let nodes = lista.slice(0, 6).map((x) => mayus(typeof x === "string" ? x : x?.l, 14)).filter(Boolean);
      if (nodes.length < 3) { nodes = ["NODO A", "NODO B", "NODO C", "NODO D"]; corr.push(`Escena ${n}: RED sin nodos suficientes; se usan cuatro de ejemplo`); }
      d.red = { c: mayus(m.c ?? m.center, 14) || d.h.split(" ")[0].slice(0, 14), nodes };
      break;
    }
    case "TERMO": {
      const m = r.termo && typeof r.termo === "object" ? r.termo : r;
      let lo = decimal(m.lo, -200, -1000, 1000), hi = decimal(m.hi, 150, -1000, 1000);
      if (hi <= lo) { const t0 = lo; lo = Math.min(lo, hi); hi = Math.max(t0, hi) === lo ? lo + 100 : Math.max(t0, hi); }
      const total = entero(m.n, 10, 6, 12);
      d.termo = { u: limpio(m.u, 4) || "°C", lo, hi, n: total, k: entero(m.k, Math.max(1, Math.round(total * 0.2)), 1, total - 1), ic: icono(m.ic ?? r.ic, ctx, "bicho"), l: limpio(m.l, 40) };
      break;
    }
    case "SPLIT":
      break;
    case "PAPEL": {
      const m = r.papel && typeof r.papel === "object" ? r.papel : r;
      d.papel = { autor: limpio(m.autor ?? m.fuente, 26) || "Estudio", anio: String(m.anio ?? m.año ?? m.y ?? "").replace(/[^\d]/g, "").slice(0, 4), rol: limpio(m.rol, 38), n: numero(m.n, "100"), u: limpio(m.u, 20) || "casos", desc: limpio(m.desc, 52), nota: limpio(m.nota, 64), puntos: !(m.puntos === false || String(m.puntos).toLowerCase() === "false" || String(m.puntos) === "0") };
      break;
    }
    case "PILARES": {
      const m = r.pilares && typeof r.pilares === "object" ? r.pilares : r;
      const lista: any[] = Array.isArray(m.cols) ? m.cols : [];
      let cols = lista.slice(0, 4).map((c, i) => {
        const nn = Math.max(1, aNumero(numero(c?.n, "10")) || 10);
        return { l: limpio(c?.l, 12), k: Math.min(nn, Math.max(0, Math.round(aNumero(numero(c?.k, "0"))))), n: nn, u: limpio(c?.u, 16) };
      });
      if (cols.length < 2) { cols = [{ l: "", k: 3, n: 10, u: "" }, { l: "", k: 6, n: 10, u: "" }, { l: "", k: 2, n: 10, u: "" }]; corr.push(`Escena ${n}: PILARES sin columnas suficientes; se usan tres de ejemplo`); }
      const minimo = cols.reduce((mi, c, i, a) => (c.n < a[mi].n ? i : mi), 0);
      const hi = Number.isInteger(Number(m.hi)) && Number(m.hi) >= 0 && Number(m.hi) < cols.length ? Number(m.hi) : minimo;
      d.pilares = { cabeza: limpio(m.cabeza ?? m.head, 14), cols, hi };
      break;
    }
    case "CICLO": {
      const m = r.ciclo && typeof r.ciclo === "object" ? r.ciclo : r;
      const lista: any[] = Array.isArray(m.pasos) ? m.pasos : Array.isArray(m.items) ? m.items : [];
      let pasos = lista.slice(0, 4).map((x) => limpio(typeof x === "string" ? x : x?.l, 30)).filter(Boolean);
      if (pasos.length < 3) { pasos = ["paso uno", "paso dos", "vuelta al inicio"]; corr.push(`Escena ${n}: CICLO sin pasos suficientes; se usan tres de ejemplo`); }
      d.ciclo = { ic: icono(m.ic ?? r.ic, ctx, "brillo"), pasos };
      break;
    }
    case "PUNCH":
      break;
    case "DUO": {
      const m = r.duo && typeof r.duo === "object" ? r.duo : r;
      const lado = (o: any, defL: string, defV: number): { l: string; v: number } => {
        let v = Number(String(o?.v ?? defV).replace(",", "."));
        if (!Number.isFinite(v)) v = defV;
        if (v > 1) v /= 100;
        return { l: limpio(o?.l, 28) || defL, v: Math.min(1, Math.max(0, v)) };
      };
      d.duo = { a: lado(m.a, "se queda", 1), b: lado(m.b, "se mueve", 0.15), palabra: mayus(m.palabra ?? m.w, 14) || (d.w ? d.w.toUpperCase().slice(0, 14) : "CLAVE") };
      break;
    }
    case "OSCILO": {
      const m = r.osc && typeof r.osc === "object" ? r.osc : r;
      const c = String(m.curva ?? "").toLowerCase();
      d.osc = { curva: c === "onda" || c === "espiral" ? c : "lissajous", l: limpio(m.l, 30) || "CH1 · X-Y", a: String(m.a ?? m.anio ?? "").replace(/[^\d]/g, "").slice(0, 4) };
      break;
    }
    case "CUBO": {
      const m = r.cubo && typeof r.cubo === "object" ? r.cubo : r;
      const ejes = (Array.isArray(m.ejes) ? m.ejes : []).slice(0, 3).map((x: unknown) => limpio(x, 24));
      while (ejes.length < 3) ejes.push(`eje ${ejes.length + 1}`);
      const c01 = (v: unknown, def: number): number => { const x = Number(String(v ?? def).replace(",", ".")); return Number.isFinite(x) ? Math.min(1, Math.max(0, x)) : def; };
      let zonas = (Array.isArray(m.zonas) ? m.zonas : []).slice(0, 3).map((z: any, i: number) => ({ l: limpio(z?.l, 16), x: c01(z?.x, [0.2, 0.75, 0.5][i]), y: c01(z?.y, [0.8, 0.7, 0.3][i]), z: c01(z?.z, [0.3, 0.8, 0.5][i]) }));
      if (!zonas.length) { zonas = [{ l: "", x: 0.2, y: 0.8, z: 0.3 }, { l: "", x: 0.75, y: 0.7, z: 0.8 }]; corr.push(`Escena ${n}: CUBO sin zonas; se usan dos de ejemplo`); }
      d.cubo = { ejes, n: entero(m.n, 220, 60, 400), zonas };
      break;
    }
    case "DIALES": {
      const m = r.diales && typeof r.diales === "object" ? r.diales : r;
      const lista: any[] = Array.isArray(m.items) ? m.items : [];
      let items = lista.slice(0, 3).map((it, i) => {
        const a = decimal(it?.a, 1), b = decimal(it?.b, a);
        const max = decimal(it?.max, Math.max(Math.abs(a), Math.abs(b), 1) * 1.3), min = decimal(it?.min, 0);
        return { l: limpio(it?.l, 24) || `número ${i + 1}`, a, b, min: Math.min(min, max - 1e-6), max, u: limpio(it?.u, 3), dec: entero(it?.dec, Number.isInteger(a) && Number.isInteger(b) ? 0 : 1, 0, 2) };
      });
      if (items.length < 3) { items = [{ l: "número 1", a: 1, b: 3, min: 0, max: 4, u: "×", dec: 1 }, { l: "número 2", a: 0.1, b: 0.4, min: 0, max: 0.6, u: "", dec: 2 }, { l: "número 3", a: 0, b: 1, min: 0, max: 1.5, u: "", dec: 1 }].map((x, i) => items[i] ?? x); corr.push(`Escena ${n}: DIALES completa los diales que faltaban con valores de ejemplo`); }
      d.diales = { fig: String(m.fig ?? "").toLowerCase() === "onda" ? "onda" : "espiral", titulo: limpio(m.titulo, 18) || "3 números", items };
      break;
    }
    case "PIEZA": {
      const m = r.pieza && typeof r.pieza === "object" ? r.pieza : { id: r.pieza };
      const def = piezaPorId(m.id);
      if (!def) {
        corr.push(`Escena ${n}: la pieza a medida «${limpio(m.id, 30)}» no existe (disponibles: ${IDS_PIEZA.join(", ")}); se usa un gancho con su titular`);
        t = "HOOK";
        break;
      }
      const props: Record<string, string | number | boolean | (string | number)[]> = {};
      const crudo = m.props && typeof m.props === "object" ? m.props : {};
      for (const k of Object.keys(crudo).slice(0, 12)) {
        const v = (crudo as any)[k];
        const clave = k.replace(/[^\w-]/g, "").slice(0, 20);
        if (!clave) continue;
        if (typeof v === "number" && Number.isFinite(v)) props[clave] = v;
        else if (typeof v === "boolean") props[clave] = v;
        else if (typeof v === "string") props[clave] = v.slice(0, 120);
        else if (Array.isArray(v)) props[clave] = v.slice(0, 24).filter((x) => typeof x === "number" || typeof x === "string").map((x) => (typeof x === "string" ? x.slice(0, 60) : x));
      }
      d.pieza = { id: def.id, props };
      break;
    }
    case "PILA": {
      const m = r.pila && typeof r.pila === "object" ? r.pila : r;
      const nn = numero(m.n, "100");
      d.pila = { ic: icono(m.ic ?? r.ic, ctx, "bicho"), l1: mayus(m.l1, 18) || "REFERENCIA", l2: mayus(m.l2, 24) || `× ${nn}`, n: nn };
      break;
    }
    case "CTA": {
      if (!d.sub) d.sub = "";
      break;
    }
    default:
      break;
  }
  // extras opcionales de cualquier escena: ficha de cita (no en el CTA) y escenario ilustrado
  d.cap = t === "HOOK" || t === "PIEZA" || TIPOS_DOCUMENTAL.includes(t) ? limpio(r.cap ?? r.linea, 120) : "";
  d.cita = t === "CTA" ? null : normalizarCita(r.cita ?? r.src ?? r.fuente);
  const scPedido = String(r.sc ?? r.escenario ?? "").trim().toLowerCase();
  const scPorTipo: Partial<Record<TipoViral, EscenarioViral>> = { ZOOM: "espacio", IMPACTO: "luna", RED: "celula" };
  d.sc = (ESCENARIOS_VIRAL as readonly string[]).includes(scPedido) ? (scPedido as EscenarioViral) : (scPorTipo[t] ?? "");
  if (t === "IMPACTO") d.sc = "luna"; // el suelo de la plantilla es el de la superficie lunar
  const dur = Math.min(12, Math.max(2, Number(String(r.dur ?? "").replace(",", ".")) || 3.5));
  return { escena: { n, t, voz, dur, ...d }, correcciones: corr };
}

/** Titular de emergencia a partir de la locución: primeras palabras en mayúsculas. */
function titularDeVoz(voz: string, max: number): string {
  const f = voz.replace(/^[¿¡"«“\s]+/, "").replace(/[?!.…,;:"»”]+$/g, "").toUpperCase();
  if (f.length <= max) return f || "IMNOBA";
  let s = "";
  for (const p of f.split(" ")) { if ((s + " " + p).trim().length > max) break; s = (s + " " + p).trim(); }
  return s || f.slice(0, max);
}

/* ───────────── fondos alternados, ritmo y SFX ───────────── */

const FONDO_PREFERIDO: Record<TipoViral, FondoViral> = {
  HOOK: "dark", NUM: "gold", VS: "dark", BARS: "light", LINE: "dark", STEPS: "light", LIST: "dark", ROUTE: "dark", SKYLINE: "light", DONUT: "dark", PICTO: "light", TOP: "dark", MITO: "light",
  ZOOM: "dark", CAPAS: "light", MIRA: "dark", IMPACTO: "dark", RED: "dark", TERMO: "light", SPLIT: "dark", PILA: "light",
  PAPEL: "light", PILARES: "dark", CICLO: "light", PUNCH: "dark", DUO: "dark", OSCILO: "dark", CUBO: "dark", DIALES: "dark", PIEZA: "dark", CTA: "gold",
};

/**
 * Asigna un fondo a cada escena: el que prefiere su plantilla, cambiando el de las vecinas iguales para que el ritmo visual nunca se repita.
 * Las escenas con escenario ilustrado (`escenarios[i]` no vacío) van SIEMPRE sobre el tema oscuro: se mueven las vecinas, no ellas.
 */
export function asignarFondos(tipos: TipoViral[], escenarios: string[] = [], documental = false, piezas: (string | undefined)[] = []): FondoViral[] {
  const fondoPieza = (i: number): FondoViral => piezaPorId(piezas[i])?.fondo ?? "dark";
  // estilo documental: fondo oscuro siempre, y «papel» claro solo para las fichas, los ciclos y las piezas a medida que lo piden (varias oscuras seguidas son normales)
  if (documental) return tipos.map((t, i) => (TIPOS_PAPEL.includes(t) || (t === "PIEZA" && fondoPieza(i) === "light") ? "light" : "dark"));
  const f: FondoViral[] = tipos.map((t, i) => (t === "PIEZA" ? fondoPieza(i) : FONDO_PREFERIDO[t]));
  const fijo = (i: number): boolean => !!escenarios[i];
  tipos.forEach((_, i) => { if (fijo(i)) f[i] = "dark"; });
  const ciclo: FondoViral[] = ["dark", "light", "gold"];
  for (let i = 1; i < f.length; i++) {
    if (f[i] !== f[i - 1]) continue;
    if (fijo(i) && fijo(i - 1)) continue; // dos escenarios seguidos: se distinguen por su dibujo
    // CTA siempre dorado y los escenarios siempre oscuros: se cambia la anterior; el resto toma el siguiente fondo del ciclo que no choque con vecinas
    if ((tipos[i] === "CTA" && tipos[i - 1] !== "HOOK") || fijo(i)) { if (!fijo(i - 1)) f[i - 1] = ciclo.find((c) => c !== f[i] && c !== f[i - 2]) ?? "dark"; continue; }
    f[i] = ciclo.find((c) => c !== f[i - 1] && c !== f[i + 1] && !(tipos[i] === "CTA" && c !== "gold")) ?? ciclo[(ciclo.indexOf(f[i]) + 1) % 3];
  }
  if (f.length && !fijo(0)) f[0] = "dark";
  return f;
}

/** Cuántas escenas de cada tipo de evento caben: los SFX no deben saturar. */
const maximo = <T,>(xs: T[], n: number): T[] => xs.slice(0, n);

/** Efectos de sonido automáticos sincronizados con lo que hace cada plantilla (tiempos escalados por el ritmo de la escena). */
export function sfxViral(e: Pick<EscenaViral, "t" | "items" | "bars" | "stops" | "top" | "picto" | "dur"> & Partial<Pick<EscenaViral, "zoom" | "capas" | "red" | "termo" | "pila" | "cita" | "sc" | "num" | "pilares" | "ciclo" | "cubo" | "papel" | "duo" | "pieza">>, ritmo: number): EventoSfx[] {
  const s = (x: number): number => x * ritmo;
  const L: EventoSfx[] = [{ t: 0.04, tipo: "whoosh", vol: 0.16 }];
  const A = (t: number, tipo: EventoSfx["tipo"], vol = 0.15): void => { L.push({ t, tipo, vol }); };
  /** clics mecánicos mientras un contador cuenta (cada ≈0,13 s) */
  const clics = (t0: number, dur: number, vol = 0.07): void => { for (let k = 0; k * 0.13 < dur - 0.05; k++) A(t0 + k * 0.13, "clic", vol); };
  switch (e.t) {
    case "HOOK": A(s(0.32), "thud", 0.2); break;
    case "NUM": A(s(TV.contar), "tick", 0.12); clics(s(TV.contar), s(TV.contarDur)); A(s(TV.contar + TV.contarDur), "ding", 0.18); break;
    case "VS": A(s(0.9), "tick", 0.12); clics(s(TV.contar), s(TV.contarDur), 0.05); A(s(2.0), "ding", 0.18); break;
    case "BARS": e.bars.forEach((_, i) => A(s(TV.barra(i) + 0.25), "pop", 0.13)); A(s(TV.barra(e.bars.length - 1) + TV.barraDur), "ding", 0.16); break;
    case "LINE": A(s(TV.linea), "zap", 0.1); A(s(TV.linea + TV.lineaDur), "ding", 0.18); break;
    case "STEPS": case "LIST": e.items.forEach((_, i) => A(s(TV.item(i)), "pop", 0.14)); break;
    case "ROUTE": e.stops.forEach((_, i) => A(s(TV.ruta + (TV.rutaDur * (i + 0.5)) / e.stops.length), "tick", 0.12)); A(s(TV.ruta + TV.rutaDur), "ding", 0.18); break;
    case "SKYLINE": A(s(TV.ciudad + 0.2), "thud", 0.14); A(s(TV.etiqueta), "ding", 0.18); break;
    case "DONUT": A(s(TV.donut), "zap", 0.1); A(s(TV.donut + TV.donutDur), "ding", 0.18); break;
    case "PICTO": for (let i = 0; i < (e.picto?.k ?? 3); i++) A(s(TV.picto(i)), "pop", 0.11); A(s(TV.picto(e.picto?.n ?? 10) + 0.4), "ding", 0.17); break;
    case "TOP": e.top.forEach((_, i) => A(s(TV.item(i)), i === e.top.length - 1 ? "ding" : "pop", 0.14)); break;
    case "MITO": A(s(TV.mito), "thud", 0.14); A(s(TV.tacha), "zap", 0.12); A(s(TV.verdad), "ding", 0.18); break;
    case "ZOOM": {
      // la cámara viaja a tiempo real (no se comprime con el ritmo): un clic al cruzar cada potencia de diez y un ping al aparecer cada elemento
      const z = e.zoom;
      if (z) {
        const lo = Math.min(z.a, z.b), hi = Math.max(z.a, z.b);
        const cruces: number[] = [];
        for (let k = Math.ceil(lo); k <= Math.floor(hi); k++) cruces.push(tiempoZoom(z, e.dur, k));
        maximo(cruces.sort((p, q) => p - q), 14).forEach((t) => A(t, "clic", 0.05));
        z.items.forEach((it) => A(tiempoZoom(z, e.dur, it.e + (z.b < z.a ? 1 : 0)), "radar", 0.11));
      }
      A(0.12, "estatica", 0.06);
      A(Math.max(0.6, e.dur - TV.zoomCola), "ding", 0.16);
      break;
    }
    case "CAPAS": A(s(TV.capasTilt), "whoosh", 0.1); A(s(TV.capasSepara), "thud", 0.16); (e.capas?.items ?? []).forEach((_, i) => A(s(TV.capasEtiqueta(i)), "pop", 0.12)); A(s(TV.capasEtiqueta(e.capas?.items.length ?? 3)), "ding", 0.16); break;
    case "MIRA": A(0.1, "radar", 0.12); A(s(TV.miraFija), "zap", 0.13); A(s(TV.miraFija) + 0.1, "clic", 0.1); A(s(TV.miraCota), "clic", 0.09); A(s(TV.miraZoom), "whoosh", 0.16); A(s(TV.miraZoom + TV.miraZoomDur), "ding", 0.16); break;
    case "IMPACTO": A(0.1, "whoosh", 0.13); A(s(TV.impacto), "golpe", 0.24); A(s(TV.impacto), "thud", 0.16); A(s(TV.impacto) + 0.06, "polvo", 0.14); A(s(TV.impacto) + 0.5, "ding", 0.1); break;
    case "RED": (e.red?.nodes ?? []).forEach((_, i) => A(s(TV.redNodo(i)), "pop", 0.12)); A(s(TV.redNodo(e.red?.nodes.length ?? 4)), "zap", 0.1); A(s(TV.redNodo(e.red?.nodes.length ?? 4)) + 0.5, "ding", 0.16); break;
    case "TERMO": clics(s(TV.termo), s(TV.termoDur), 0.06); A(s(TV.termo + TV.termoDur), "ding", 0.17); break;
    case "PILA": clics(s(TV.pila), s(TV.pilaDur), 0.06); A(s(TV.pila + TV.pilaDur), "golpe", 0.2); A(s(TV.pila + TV.pilaDur), "thud", 0.14); A(s(TV.pila + TV.pilaDur) + 0.4, "ding", 0.14); break;
    case "PAPEL": {
      clics(s(TV.papelContar), s(TV.papelContarDur), 0.07);
      if (e.papel?.puntos !== false) { for (let k = 0; k < 8; k++) A(s(TV.papelCampo + (TV.papelCampoDur * k) / 8), "tick", 0.07); A(s(TV.papelSello), "golpe", 0.2); }
      else A(s(TV.papelContar + TV.papelContarDur), "ding", 0.14);
      break;
    }
    case "PILARES": (e.pilares?.cols ?? []).forEach((_, i) => A(s(TV.pilaresSuben + 0.12 * i), "pop", 0.12)); A(s(TV.pilaresCabeza), "golpe", 0.18); clics(s(TV.pilaresRayas), s(TV.pilaresRayasDur), 0.05); A(s(TV.pilaresRayas + TV.pilaresRayasDur), "ding", 0.15); break;
    case "CICLO": for (let i = 0; i < (e.ciclo?.pasos.length ?? 4); i++) { A(s(TV.cicloPaso(i)), "pop", 0.12); A(s(TV.cicloPaso(i)) + 0.25, "whoosh", 0.07); } break;
    case "PUNCH": A(s(TV.punchGolpe), "golpe", 0.26); A(s(TV.punchGolpe), "thud", 0.18); A(s(TV.punchGolpe) + 0.05, "polvo", 0.1); break;
    case "DUO": A(s(TV.duoA), "pop", 0.12); A(s(TV.duoB), "pop", 0.12); A(s(TV.duoPalabra), "whoosh", 0.1); A(s(TV.duoPalabra + TV.duoPalabraDur), "golpe", 0.16); break;
    case "OSCILO": A(0.1, "estatica", 0.08); A(s(TV.oscCurva), "zap", 0.1); A(s(TV.oscCurva + TV.oscDur), "ding", 0.12); break;
    case "CUBO": for (let k = 0; k < 6; k++) A(s(TV.cuboPuntos + (TV.cuboPuntosDur * k) / 6), "tick", 0.06); A(s(TV.cuboFiltra), "whoosh", 0.1); A(s(TV.cuboZonas), "radar", 0.12); A(s(TV.cuboZonas) + 0.4, "ding", 0.12); break;
    case "DIALES": clics(s(TV.dialesIni), s(TV.dialesDur), 0.05); A(s(TV.dialesIni + TV.dialesDur), "ding", 0.14); break;
    case "PIEZA": { const def = piezaPorId(e.pieza?.id); if (def) L.push(...def.sfx(e.dur, ritmo)); break; }
    case "SPLIT": A(0.2, "whoosh", 0.14); A(s(0.45), "golpe", 0.14); clics(s(TV.splitContar), s(1.2), 0.05); A(s(TV.splitGana), "ding", 0.18); break;
    case "CTA": A(s(0.5), "ding", 0.2); A(s(1.1), "pop", 0.15); break;
  }
  if (e.cita) A(s(TV.cita), "clic", 0.1);
  if (e.sc === "espacio" && e.t !== "ZOOM") A(0.1, "estatica", 0.06);
  if (e.sc === "bio") { A(s(0.5), "gota", 0.1); A(s(1.7), "gota", 0.08); }
  return L.filter((x) => x.t < e.dur - 0.08).sort((a, b) => a.t - b.t);
}

/* ───────────── ensamblado ───────────── */

export type ContextoViral =
  | { modo: "idea"; paleta?: string; sfx?: boolean; marca?: string; musica?: boolean }
  | { modo: "bloques"; escenas: EscenaEstudioGuion[]; paleta?: string; sfx?: boolean; musica?: boolean };

const reloj = (s: number): string => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/** Texto para que el usuario grabe la locución: una línea por escena con su tiempo. */
export function locucionViral(escenas: { n: number; inicio: number; fin: number; voz: string }[], titulo = ""): string {
  const cuerpo = escenas.map((e) => `[ESCENA ${e.n} | ${reloj(e.inicio)}-${reloj(e.fin)}]\n${e.voz || "(sin locución)"}`).join("\n\n");
  return `${titulo ? `${titulo}\n${"=".repeat(Math.min(60, titulo.length))}\n\n` : ""}${cuerpo}\n\n⚠️ Verifica las cifras y los datos antes de publicar: son ilustrativos salvo los que tú diste en la idea.\n`;
}

/**
 * Une lo que devolvió la IA ({"titulo":…, "scenes":[…]}) con lo local. En modo IDEA la IA decide locución, duración y tipo de cada escena;
 * en modo BLOQUES los tiempos y la locución son los del guion y la IA solo elige la plantilla y sus datos.
 */
export function ensamblarViral(raw: any, ctx: ContextoViral): { anim: Animacion; correcciones: string[]; titulo: string; locucion: string; sinRespuesta: number[] } {
  const crudas: any[] = Array.isArray(raw?.scenes) ? raw.scenes : Array.isArray(raw?.escenas) ? raw.escenas : [];
  const correcciones: string[] = [];
  const sinRespuesta: number[] = [];
  const lista: (EscenaViral & { inicioFijo?: number; finFijo?: number; dirTxt: string })[] = [];

  if (ctx.modo === "idea") {
    crudas.slice(0, 40).forEach((c, i) => {
      const { escena, correcciones: cc } = normalizarEscenaViral(c, i + 1);
      correcciones.push(...cc);
      lista.push({ ...escena, dirTxt: escena.voz });
    });
  } else {
    ctx.escenas.forEach((e, k) => {
      const c = crudas.find((x) => Number(x?.id ?? x?.n) === e.n) ?? (crudas.length === ctx.escenas.length ? crudas[k] : undefined);
      if (!c) { sinRespuesta.push(e.n); correcciones.push(`Escena ${e.n}: la IA no la devolvió; se usa un gancho con su locución`); }
      const { escena, correcciones: cc } = normalizarEscenaViral(c ?? { t: k === 0 ? "HOOK" : k === ctx.escenas.length - 1 ? "CTA" : "HOOK" }, e.n, e.voz || e.direccion);
      correcciones.push(...cc);
      lista.push({ ...escena, dur: e.dur, inicioFijo: e.inicio, finFijo: e.fin, dirTxt: e.direccion || e.voz });
    });
  }

  // duraciones (idea): lo que dice la IA, pero nunca menos de lo que se tarda en decir la locución ni de lo mínimo de la plantilla
  let t = 0;
  const salida: EscenaViralGuardada[] = [];
  const documental = esDocumental(ctx.paleta);
  const fondos = asignarFondos(lista.map((e) => e.t), lista.map((e) => e.sc), documental, lista.map((e) => e.pieza?.id));
  lista.forEach((e, i) => {
    const ideal = duracionIdeal(e);
    let dur = e.dur;
    if (ctx.modo === "idea") {
      const habla = palabras(e.voz) / 2.9 + 0.5;
      dur = Math.round(Math.min(documental ? 12 : 9, Math.max(dur, habla, Math.min(ideal, documental ? 7 : 5.2), 2.2)) * 10) / 10;
    }
    const inicio = e.inicioFijo ?? Math.round(t * 100) / 100;
    const fin = e.finFijo ?? Math.round((inicio + dur) * 100) / 100;
    t = fin;
    const ritmo = Math.min(1, Math.max(0.55, (dur - 0.45) / ideal));
    const { inicioFijo: _a, finFijo: _b, dirTxt, ...resto } = e;
    const gu: EscenaViralGuardada = { ...resto, dur: Math.round((fin - inicio) * 100) / 100, modo: "VIRAL", tema: fondos[i] === "light" ? "claro" : "oscuro", bg: fondos[i], ritmo, total: 0, inicio, fin, texto: dirTxt };
    salida.push(gu);
  });
  // transición: zoom continuo al entrar o salir de un viaje de escala (o tras una mira que se acerca); el resto, barrido diagonal
  salida.forEach((e, i) => {
    const prev = salida[i - 1];
    const zoom = i > 0 && (e.t === "ZOOM" || prev.t === "ZOOM" || prev.t === "MIRA");
    // documental: corte seco (la ficha de papel entra deslizándose); resto: barrido diagonal
    // una pieza a medida puede pedir su propia entrada (cortinilla de semitono, zoom en Z o match-cut seco)
    const pedida = e.t === "PIEZA" ? piezaPorId(e.pieza?.id)?.entra : undefined;
    e.tr = i === 0 ? "barrido" : pedida ?? (zoom ? "zoom" : documental ? (e.tema === "claro" && prev.tema !== "claro" ? "papel" : "corte") : "barrido");
  });
  salida.forEach((e, i) => { e.trs = salida[i + 1]?.tr ?? "barrido"; });
  const duracion = salida.length ? salida[salida.length - 1].fin : 0;
  const sfx = ctx.sfx !== false;
  for (const e of salida) {
    e.total = duracion;
    if (sfx) e.sfx = sfxViral(e, e.ritmo);
  }
  const titulo = limpio(raw?.titulo ?? raw?.title ?? "", 70) || salida[0]?.h || "Video";
  const anim: Animacion = { version: 1, titulo, paleta: ctx.paleta ?? "imnoba", sfx, fps: 60, duracion, escenas: salida, uso: null, hud: false, formato: "viral", musica: sfx && ctx.musica !== false };
  return { anim, correcciones, titulo, locucion: locucionViral(salida, titulo), sinRespuesta };
}

/* ───────────── colores y fondos por plantilla ───────────── */

export type TemaViral = {
  /** color de los datos/ejes/telemetría en mono (por defecto, el acento); en el estilo documental es el lima neón */
  neon?: string;
  bg0: string; bg1: string;
  texto: string; suave: string; acento: string; acento2: string; peligro: string; exito: string;
  /** relleno de tarjetas y paneles */
  panel: string; borde: string;
  /** texto sobre el color de acento */
  sobreAcento: string;
  oscuro: boolean;
};

/** Colores de cada fondo (dark / gold / light) derivados de la paleta elegida. IMNOBA: azul #02224E, dorado #FFC500, blanco. */
export function temaViral(paleta: string | undefined, bg: FondoViral): TemaViral {
  if (esDocumental(paleta)) return temaDocumental(paleta, bg);
  const C: ColoresEstudio = coloresEstudio(paleta);
  const navy = C.fondoCentro;
  const acento = C.roles.accent;
  if (bg === "gold") {
    return { bg0: mezclar(acento, "#FFFFFF", 0.12), bg1: mezclar(acento, "#000000", 0.1), texto: navy, suave: mezclar(navy, acento, 0.45), acento: navy, acento2: "#FFFFFF", peligro: C.roles.danger, exito: C.roles.success, panel: "rgba(2,34,78,0.10)", borde: "rgba(2,34,78,0.28)", sobreAcento: acento, oscuro: false };
  }
  if (bg === "light") {
    return { bg0: "#FFFFFF", bg1: "#E6ECF7", texto: navy, suave: mezclar(navy, "#FFFFFF", 0.55), acento: mezclar(acento, "#000000", 0.04), acento2: C.roles.secondary, peligro: C.roles.danger, exito: C.roles.success, panel: "#FFFFFF", borde: "rgba(2,34,78,0.14)", sobreAcento: navy, oscuro: false };
  }
  return { bg0: mezclar(navy, "#FFFFFF", 0.06), bg1: oscurecer(navy, 0.6), texto: "#FFFFFF", suave: mezclar("#FFFFFF", navy, 0.4), acento, acento2: C.roles.secondary, peligro: C.roles.danger, exito: C.roles.success, panel: "rgba(255,255,255,0.07)", borde: "rgba(255,255,255,0.16)", sobreAcento: navy, oscuro: true };
}

/**
 * Estilo DOCUMENTAL (paletas Retro-Científica): fondo plano negro mate o papel, el objeto de estudio en el color primario (rojo bermellón / amarillo IMNOBA),
 * lo que cambia en el de contraste (cobalto) y los datos en mono en el lima neón. El fondo «gold» no existe aquí (se trata como oscuro).
 */
function temaDocumental(paleta: string | undefined, bg: FondoViral): TemaViral {
  const P = paletaPorId(paleta);
  if (bg === "light") {
    const k = P.claro;
    return { neon: k.alerta, bg0: k.fondoCentro, bg1: k.fondoBorde, texto: k.tinta, suave: k.suave, acento: k.primario, acento2: k.alerta, peligro: k.primario, exito: k.tinta, panel: "rgba(11,12,16,0.05)", borde: "rgba(11,12,16,0.22)", sobreAcento: "#FFFFFF", oscuro: false };
  }
  const k = P.oscuro;
  return { neon: k.acento, bg0: k.fondoCentro, bg1: k.fondoBorde, texto: "#FFFFFF", suave: k.suave, acento: k.primario, acento2: k.alerta === k.primario ? "#2B44FF" : k.alerta, peligro: k.primario, exito: k.acento, panel: "rgba(255,255,255,0.06)", borde: "rgba(255,255,255,0.16)", sobreAcento: k.fondoCentro, oscuro: true };
}

/* ───────────── prompt de sistema (estático y cacheable) y mensaje de usuario ───────────── */

export const MARCA_VIRAL = "DIRECTOR_VIRAL";

/**
 * Reglas, vocabulario y formato idénticos en cada llamada (van PRIMERO: prefijo cacheable). Lo variable (idea, duración, marca) va en el mensaje de usuario.
 */
export function sistemaViral(estilo: "general" | "documental" = "general"): string {
  if (estilo === "documental") return sistemaDocumental();
  return `Eres guionista y director de arte de reels virales de 9:16 en español de Colombia (tuteo, frases cortas, directo, sin relleno). Conviertes una idea en un video completo: escribes la locución y eliges, escena por escena, una plantilla; un motor prefabricado la dibuja (tú no dibujas). [${MARCA_VIRAL}]
Responde SOLO un objeto JSON: {"titulo":"…","scenes":[…]} (sin texto extra). Ritmo de reel: "dur" = palabras de la voz ÷ 2,9 + 0,5 s (mín. 2,8; HOOK y CTA ≈ 3,5). En modo bloques cada escena lleva "id" y NO "voz" ni "dur"; en modo idea lleva "voz" y "dur".
Cada escena: {"t":TIPO,"voz":"narración exacta a grabar (6–12 palabras)","dur":3.5,"h":"TITULAR EN MAYÚSCULAS ≤ 30 car.","w":"palabra del titular a resaltar","ic":"icono", …campos del tipo}
TIPOS y sus campos:
HOOK gancho cinético gigante (h ≤ 34 car., 2–3 líneas; "sub" opcional ≤ 40 car.). SIEMPRE la escena 1.
NUM número gigante que cuenta: "num":{"n":"35","u":"%","pre":"+","l":"VALORIZACIÓN ANUAL"} (n solo dígitos).
VS comparación: "a":{"l":"BOGOTÁ","n":"1","ic":"tren"},"b":{"l":"SANTIAGO","n":"7","ic":"tren"},"op":"<" (n números; op > < =).
BARS barras que crecen: "bars":[{"l":"2020","v":30},…] (3–6), "u":"%","hi":índice destacado.
LINE tendencia: "line":{"pts":[10,14,13,25,40,70],"l0":"2020","l1":"2030","end":"+180 %"} (5–10 puntos).
DONUT reparto de un total: "donut":[{"l":"PROPIETARIOS","v":62},{"l":"ARRIENDAN","v":38}] (2–4 partes).
PICTO «k de cada n» con iconos: "picto":{"n":10,"k":3,"ic":"casa","l":"no logra comprar vivienda"} (n 4–20).
TOP ranking que se revela del último al primero: "top":[{"l":"CHAPINERO","v":"+12 %"},…] (3–5, v opcional).
MITO mito vs realidad: "myth":"Lo que todos creen","truth":"Lo que realmente pasa" (≤ 60 car. cada uno).
ZOOM viaje de escala sin cortes (ciencia, naturaleza, tecnología, tamaños): "zoom":{"a":6,"b":-6,"items":[{"l":"LA TIERRA","e":7,"ic":"globo"},{"l":"UNA CÉLULA","e":-5,"ic":"celula"}]} (a→b = exponente de 10^x metros del ancho del cuadro; a>b acerca, a<b aleja; 2–4 items con su tamaño 10^e m, separados ≥ 1).
CAPAS vista explotada de un objeto: "capas":{"ic":"brillo","medida":"12 CM","items":[{"l":"TAPA","m":"NÍQUEL"},{"l":"NÚCLEO","m":"RESINA"}]} (2–4 capas de arriba abajo, l ≤ 12 car.).
MIRA mira telescópica que fija un objeto diminuto, lo mide y se acerca: "mira":{"ic":"bicho","l":"TARDÍGRADO","med":"0,5 MM"}.
IMPACTO objeto que cae y se estrella con polvo y fragmentos: "impacto":{"ic":"cohete","l":"SONDA","v":"500 KM/H"}.
RED red de nodos que se conecta (moléculas, ecosistemas, conexiones): "red":{"c":"PROTEÍNA","nodes":["ADN","AGUA","AZÚCAR"]} (3–6 nodos).
TERMO termómetro que barre un rango mientras seres u objetos de una cuadrícula caen y otros sobreviven: "termo":{"u":"°C","lo":-200,"hi":150,"n":10,"k":2,"ic":"bicho","l":"SOBREVIVEN"} (de n sobreviven k).
SPLIT pantalla dividida rojo vs azul, dos posturas con el sujeto al centro: mismos campos que VS ("a","b","op","ic").
PILA presión o cantidad enorme: un punto frente a una columna altísima de puntos que aplasta al sujeto: "pila":{"ic":"bicho","l1":"1 ATMÓSFERA","l2":"6.000 ATMÓSFERAS","n":"6000"} (n solo dígitos).
STEPS causa→efecto/pasos: "items":[{"l":"METRO","ic":"tren"},{"l":"OBRAS","ic":"edificio"},{"l":"VALOR","ic":"tendencia-alza"}] (3–4).
LIST beneficios con check: "items":["Sin comisión","Más alcance","Gratis"] (3–4, ≤ 30 car.).
ROUTE recorrido/etapas en secuencia: "stops":["PORTAL","CENTRO","CALLE 72"] (3–5), "end":"VALORIZACIÓN".
SKYLINE ciudad que crece (inmuebles, plusvalía): "l":"+35 %","sub":"caption ≤ 28 car.".
CTA cierre con llamada a la acción: h ≤ 26 car. imperativo, "sub" (web, marca o «Guárdalo y compártelo»). SIEMPRE la última escena.
ICONOS: ${ICONOS_VIRAL.join(", ")}.
EXTRAS (opcionales, en cualquier escena menos CTA): "cita":"NASA, 2019" pone una ficha de fuente científica (solo fuentes reales y conocidas o dadas en la idea; nunca inventes una); "sc":"espacio|luna|bio|celula" pone un escenario ilustrado de fondo (ZOOM=espacio, IMPACTO=luna y RED=celula ya lo traen).
VIRALIDAD: el gancho (escena 1) debe frenar el scroll en 2 s con una pregunta que duele, un dato que sorprende o un error común («Nadie te cuenta…»), y abrir una promesa que el final cumple. Cambia de plantilla en cada escena (nunca la misma dos veces seguidas), una idea por escena, 2,8–4 s cada una. Titulares cortos y contundentes; la voz completa el titular, no lo repite. Termina con una acción concreta (guardar, compartir, publicar, escribir).
ESTRUCTURA: HOOK → problema/contexto (NUM, VS, LINE, PICTO, DONUT, MITO) → mecanismo (STEPS, ROUTE) → prueba (BARS, TOP, SKYLINE) → beneficios (LIST) → CTA. ROUTE solo para recorridos o etapas en secuencia y SKYLINE solo para ciudad, inmuebles o crecimiento; si el tema es otro usa STEPS, BARS, LINE, TOP o NUM.
CIENCIA Y NATURALEZA (animales, espacio, cuerpo, materiales, tecnología): usa ZOOM/MIRA para mostrar tamaños, CAPAS para explicar de qué está hecho algo, IMPACTO/TERMO para límites y resistencia, RED para cómo se conecta y SPLIT para dos posturas; añade "cita" cuando una cifra venga de una fuente real. No uses estas plantillas en temas de inmuebles, vehículos o negocios salvo que la idea lo pida.
DATOS: usa solo las cifras que da la idea; si necesitas una, usa un número redondo ilustrativo (nunca un dato oficial inventado). Nada de comillas ni emojis dentro de los textos.`;
}

/**
 * Variante DOCUMENTAL del prompt (paletas Retro-Científica): el estilo y la estructura de los explicativos de referencia — afirmación que choca con la intuición,
 * prueba visual, ficha del estudio con su muestra exacta, el patrón y su giro, el concepto con nombre, la causa, segunda fuente o postura, analogías y pregunta final.
 */
function sistemaDocumental(): string {
  return `Eres guionista y director de arte de videos explicativos 9:16 de ciencia y curiosidades, en español neutro (tuteo, frases cortas, tono de documental: curioso, riguroso, sin exagerar). Conviertes una idea en un video completo: escribes la locución y eliges, escena por escena, una plantilla; un motor prefabricado la dibuja con un estilo editorial fijo (negro mate, papel crema para las fichas de estudio, ROJO = el sujeto o lo que se queda, AZUL = lo que cambia o se mueve, lima = datos y ejes en monoespaciada, titulares en tipografía pesada). Tú no dibujas. [${MARCA_VIRAL}] [DOCUMENTAL]
Responde SOLO un objeto JSON: {"titulo":"…","scenes":[…]} (sin texto extra). Ritmo calmado: "dur" = palabras de la voz ÷ 2,7 + 0,8 s (mín. 3,5; las fichas de estudio y los gráficos 6–9 s). En modo bloques cada escena lleva "id" y NO "voz" ni "dur"; en modo idea lleva "voz" y "dur".
Cada escena: {"t":TIPO,"voz":"narración exacta a grabar (10–22 palabras, enlaza con la escena anterior)","dur":5,"h":"TITULAR ≤ 28 car.","w":"palabra del titular a resaltar","cap":"línea mono que se escribe sola, con *énfasis*","ic":"icono", …campos del tipo}. "cap" es opcional (≤ 70 car.): úsala para el dato o la fuente («según Bar-Eli y su equipo · 2007»).
PLANTILLAS DOCUMENTALES:
PAPEL ficha de estudio sobre papel crema: "papel":{"autor":"Bar-Eli","anio":"2007","rol":"psicólogo","n":"286","u":"penales","desc":"de ligas de primer nivel","nota":"cada punto = un penal","puntos":true} (n solo dígitos: la cifra cuenta y se llena un campo de puntos).
PILARES columnas isométricas con una parte rayada: "pilares":{"cabeza":"1 de 3","cols":[{"l":"1 de 7","k":15,"n":127,"u":"se lanzó"},{"l":"","k":6,"n":18,"u":"se quedó"},{"l":"1 de 7","k":15,"n":141,"u":"se lanzó"}],"hi":1} (2–4 columnas de n elementos de los que k van rayados; hi = la columna destacada).
CICLO pasos que se encadenan en círculo y el último vuelve al primero: "ciclo":{"ic":"brillo","pasos":["se queda","patean a las esquinas","el centro deja de atajar","vuelve a lanzarse"]} (3–4 pasos ≤ 28 car.).
PUNCH una palabra o una pregunta gigante que golpea la pantalla: h ≤ 40 car. (una palabra = golpe con partículas; una frase = letras que caen); "w" = palabra en rojo. Úsala para el concepto con nombre y para la pregunta final.
DUO dos paneles comparados y una palabra grande que se llena según cada caso: "duo":{"a":{"l":"se queda","v":1},"b":{"l":"se lanza","v":0.15},"palabra":"CULPA"} (v 0–1).
OSCILO pantalla de osciloscopio con una curva que se dibuja: "osc":{"curva":"lissajous","l":"CH1 0,5 V/div · X-Y","a":"1962"} (curva: lissajous, onda o espiral).
CUBO cubo isométrico de posibilidades donde cada punto es una opción y casi todo está vacío: "cubo":{"ejes":["se ensancha","se aleja del centro","baja"],"n":220,"zonas":[{"l":"caracoles","x":0.2,"y":0.8,"z":0.3},{"l":"","x":0.75,"y":0.7,"z":0.8}]} (zonas = dónde existe algo, x,y,z de 0 a 1).
DIALES tres diales que cambian y mueven una figura: "diales":{"fig":"espiral","titulo":"3 números","items":[{"l":"se ensancha","a":3,"b":3,"min":0,"max":6,"u":"×"},{"l":"se aleja del centro","a":0.04,"b":0.4,"min":0,"max":0.6},{"l":"baja","a":0,"b":1,"min":0,"max":1.5}]} (fig: espiral de concha u onda; si encadenas escenas con los mismos diales, la figura cambia de forma sin cortes).
OTRAS (mismos campos que siempre): HOOK ("sub" opcional) · NUM "num":{"n":"33","u":"%","pre":"","l":"SE LANZA A UN LADO"} · VS "a":{"l":"…","n":"1","ic":"…"},"b":{…},"op":">" · BARS "bars":[{"l":"…","v":30}],"u":"%","hi":0 · LINE "line":{"pts":[…],"l0":"…","l1":"…","end":"…"} · DONUT "donut":[{"l":"…","v":62}] · PICTO "picto":{"n":10,"k":3,"ic":"…","l":"…"} · TOP "top":[{"l":"…","v":"…"}] · MITO "myth","truth" · STEPS/LIST "items" · ZOOM "zoom":{"a":6,"b":-6,"items":[{"l":"…","e":7,"ic":"…"}]} · CAPAS "capas":{"ic":"…","medida":"…","items":[{"l":"…","m":"…"}]} · MIRA "mira":{"ic":"…","l":"…","med":"…"} · IMPACTO "impacto":{"ic":"…","l":"…","v":"…"} · RED "red":{"c":"…","nodes":[…]} · TERMO "termo":{"u":"°C","lo":-200,"hi":150,"n":10,"k":2,"ic":"…","l":"…"} · SPLIT (como VS) · PILA "pila":{"ic":"…","l1":"…","l2":"…","n":"6000"} · CTA h ≤ 26 car. (última escena, solo si la idea pide llamada a la acción; si no, cierra con una PUNCH con la pregunta final).
ICONOS: ${ICONOS_VIRAL.join(", ")}.
EXTRAS en cualquier escena menos CTA: "cita":"Bar-Eli, 2007" (ficha de fuente abajo a la izquierda; solo fuentes REALES) y "sc":"espacio|luna|bio|celula" (escenario ilustrado).
ARCO NARRATIVO (sigue este orden; no hace falta usar todos los pasos, sí un solo asunto por escena y plantillas distintas seguidas):
1 AFIRMACIÓN que choca con la intuición (HOOK o PUNCH) y, en "cap", la fuente («según X y su equipo · año»).
2 PRUEBA VISUAL simple con un porcentaje o una comparación (NUM, DONUT, PICTO, DUO, SPLIT, DIALES).
3 EL ESTUDIO: ficha PAPEL con autor, año, rol y la muestra exacta que cuenta.
4 EL PATRÓN: cómo se reparten los datos (CUBO, PILARES, BARS, LINE, OSCILO) y el GIRO («pero…»: lo que nadie elige, lo que falta).
5 EL CONCEPTO con nombre propio (PUNCH o HOOK con el nombre) y un caso concreto con cifras («24 de 32»).
6 POR QUÉ ocurre: causa emocional o mecanismo (DUO, CICLO, STEPS, RED).
7 SEGUNDA FUENTE o segunda postura, cada una con su autor y año (PAPEL, SPLIT).
8 ANALOGÍAS de la vida diaria («y no solo pasa en…») (LIST, STEPS, HOOK con icono).
9 CIERRE: una pregunta abierta que invite a comentar (PUNCH con la pregunta).
DATOS: autores, años y cifras solo si vienen de la idea o son estudios reales y muy conocidos; nunca inventes un autor, un año o una cifra: si no la conoces, habla en general y no uses PAPEL ni "cita". Nada de comillas ni emojis dentro de los textos.`;
}

const APROX_MARCA = (paleta?: string): string => (paleta === undefined || paleta === "imnoba" || paleta === "retro-imnoba" ? "MARCA: IMNOBA (plataforma colombiana para publicar y encontrar inmuebles y vehículos; web imnoba.com). El CTA es de IMNOBA." : "");

/** Mensaje de usuario en modo IDEA: la frase, la duración objetivo y el número de escenas. */
export function promptUsuarioIdea(i: { idea: string; duracion: number; escenasObjetivo: number; paleta?: string }): string {
  const detalle = i.idea.length > IDEA_DETALLADA ? "\nDETALLE: la idea es detallada; cubre TODOS sus puntos (una escena por punto principal, en el orden dado), usa sus cifras y nombres tal cual y no inventes datos nuevos." : "";
  return `MODO: idea\nIDEA: ${i.idea}\nDURACIÓN TOTAL: ${i.duracion} s (suma de las "dur")\nESCENAS: ${i.escenasObjetivo} (±1)${detalle}${APROX_MARCA(i.paleta) ? `\n${APROX_MARCA(i.paleta)}` : ""}`;
}

/** Mensaje de usuario en modo BLOQUES: cada bloque con su duración, su locución y su dirección visual. */
export function promptUsuarioBloques(escenas: { n: number; dur: number; voz: string; direccion: string }[], paleta?: string): string {
  const m = APROX_MARCA(paleta);
  return `MODO: bloques (devuelve cada "id"; sin "voz" ni "dur")${m ? `\n${m}` : ""}\n` + escenas.map((e) => `ESC ${e.n} | ${Math.round(e.dur * 10) / 10}s\nDIR: ${e.direccion || "(libre)"}${e.voz ? `\nVOZ: ${e.voz}` : ""}`).join("\n\n");
}

export function tokensFijosViral(estilo: "general" | "documental" = "general"): { sistema: number; esquema: number } {
  return { sistema: tokensDeTexto(sistemaViral(estilo).length, 3.4), esquema: 0 };
}

/* ───────────── costo ───────────── */

/** Tokens de salida por escena: con locución y duración (idea) ≈ 165; sin ellas (bloques) ≈ 120. */
export const SALIDA_POR_ESCENA_VIRAL = 165;
export const SALIDA_POR_ESCENA_VIRAL_BLOQUES = 120;
export type EntradaViral = { modelo: string; caracteres: number; escenas: number; tokensSistema: number; conVoz?: boolean };

/** Costo del flujo «una frase → video»: entrada = prompt fijo + idea; salida = ~165 tokens por escena (+ título). */
export function estimarViral(e: EntradaViral): { tokensEntrada: number; tokensSalida: number; costo: number } {
  const m = modeloPorId(e.modelo);
  const tokensEntrada = e.tokensSistema + tokensDeTexto(e.caracteres) + 30;
  let tokensSalida = (e.conVoz === false ? SALIDA_POR_ESCENA_VIRAL_BLOQUES : SALIDA_POR_ESCENA_VIRAL) * e.escenas + 30;
  if (m.razonador && e.escenas > 0) tokensSalida += 600 + 120 * e.escenas;
  return { tokensEntrada, tokensSalida, costo: (tokensEntrada * m.entrada + tokensSalida * m.salida) / 1_000_000 };
}

/* ───────────── plantilla del «Prompt Formateador» ───────────── */

export const PROMPT_FORMATEADOR_IDEA = `Ayúdame a escribir la IDEA de un reel en UNA sola frase (máximo dos). Una buena idea dice: de qué trata, para quién es y qué quiero que la gente haga al final. Puedes incluir la duración («de 30 segundos»).

Ejemplos:
· Un video de 30 segundos para IMNOBA: por qué el metro de Bogotá valoriza las propiedades cerca de las estaciones, y que publiquen gratis su inmueble.
· Reel de 25 segundos: 3 errores al vender tu carro usado y cómo evitarlos publicando en IMNOBA.

Devuélveme SOLO la frase final (sin comillas ni explicaciones), con los datos reales que yo te dé y sin inventar cifras. Mis notas:
`;
