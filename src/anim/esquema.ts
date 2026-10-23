/**
 * JSON Schema ESTRICTO (structured outputs de OpenAI) de la animación. La IA devuelve instrucciones geométricas
 * declarativas —nunca código ni colores hexadecimales— y el motor de Remotion las dibuja.
 * Todas las propiedades son obligatorias; lo opcional se declara como "tipo | null".
 */
import { TOKENS, esRetro } from "./paletas";
import { iconosPermitidos } from "./iconos";

export const ENTRADAS_2D = ["aparecer", "pop", "deslizar-arriba", "deslizar-abajo", "deslizar-izq", "deslizar-der", "crecer"] as const;
export const ENTRADAS_3D = ["crecer", "caer", "aparecer", "ninguna"] as const;
export const FORMAS = ["rect", "redondeado", "circulo", "elipse", "estrella", "hexagono", "triangulo"] as const;
export const GRAFICAS = ["barras", "lineas", "pastel", "dona"] as const;
export const AMBIENTES = ["cuadricula", "particulas", "aros", "lineas", "ninguno"] as const;
export const TEMAS = ["oscuro", "claro"] as const;
export const SFX_TIPOS = ["pop", "whoosh", "heartbeat", "cash", "tick", "thud", "zap", "ding"] as const;
export const REMATES = ["plana", "antena", "piramide"] as const;
export const SUELOS = ["ninguno", "plano", "cuadricula"] as const;
export const TIPOS_2D = ["trazo", "linea", "forma", "texto", "icono", "plano", "grafica", "contador", "anillo", "ondas", "lista", "tarjeta"] as const;
export const TIPOS_3D = ["edificio", "caja", "cilindro", "esfera", "piramide", "extrusion", "barras3d", "ciudad", "casa", "anillo"] as const;
export const TIPOS_OVERLAY = ["texto", "contador", "icono", "tarjeta", "lista", "anillo"] as const;
/** Estilo retro: añade la línea de terminal (texto que se escribe carácter a carácter) y el modelo paramétrico central. */
export const TIPOS_2D_RETRO = [...TIPOS_2D, "terminal"] as const;
export const TIPOS_OVERLAY_RETRO = [...TIPOS_OVERLAY, "terminal"] as const;
/** Formato estructurado: el escenario solo necesita estas piezas (sin iconos, tarjetas ni listas) → el esquema, que OpenAI cuenta como entrada, es mucho más corto. */
export const TIPOS_2D_GEO = ["trazo", "linea", "forma", "texto", "plano", "grafica", "contador", "anillo", "ondas", "terminal"] as const;
export const TIPOS_OVERLAY_GEO = ["texto", "contador", "anillo", "terminal"] as const;
export const TIPOS_3D_RETRO = [...TIPOS_3D, "modelo"] as const;
export const FORMAS_MODELO = ["toroide", "esfera", "columna", "superficie"] as const;

type Sch = Record<string, unknown>;
const n = (): Sch => ({ type: "number" });
const i = (): Sch => ({ type: "integer" });
const s = (): Sch => ({ type: "string" });
const b = (): Sch => ({ type: "boolean" });
const e = (vals: readonly (string | number)[]): Sch => ({ type: typeof vals[0] === "number" ? "number" : "string", enum: [...vals] });
const nul = (sch: Sch): Sch => {
  if (Array.isArray(sch.enum)) return { type: [sch.type as string, "null"], enum: [...(sch.enum as unknown[]), null] };
  return { type: [sch.type as string, "null"] };
};
const arr = (items: Sch): Sch => ({ type: "array", items });
const obj = (props: Record<string, Sch>): Sch => ({ type: "object", properties: props, required: Object.keys(props), additionalProperties: false });
const tipo = (v: string): Sch => ({ type: "string", enum: [v] });
const tok = (): Sch => e(TOKENS);
const tokN = (): Sch => nul(e(TOKENS));

const base2D = (): Record<string, Sch> => ({ t: n(), hasta: nul(n()), entrada: e(ENTRADAS_2D) });
const el = (nombre: string, props: Record<string, Sch>): Sch => obj({ tipo: tipo(nombre), ...base2D(), ...props });

function elementos2D(iconos: string[], solo: readonly string[], retro = false): Sch[] {
  const pun: Record<string, Sch> = retro ? { punteado: b() } : {};
  const todos: Record<string, Sch> = {
    trazo: el("trazo", { d: s(), color: tok(), grosor: n(), relleno: tokN(), dur: n(), brillo: b(), ...pun }),
    linea: el("linea", { puntos: arr(obj({ x: n(), y: n() })), color: tok(), grosor: n(), flecha: b(), curva: b(), dur: n(), ...pun }),
    terminal: el("terminal", { texto: s(), x: n(), y: n(), tam: n(), color: tok(), alinear: e(["centro", "izquierda"]) }),
    forma: el("forma", { forma: e(FORMAS), x: n(), y: n(), w: n(), h: n(), color: tok(), relleno: b(), borde: n() }),
    texto: el("texto", { texto: s(), x: n(), y: n(), tam: n(), color: tok(), peso: e([500, 700, 900]), alinear: e(["centro", "izquierda", "derecha"]) }),
    icono: el("icono", { nombre: e(iconos.length ? iconos : ["estrella"]), x: n(), y: n(), tam: n(), color: tok(), fondo: b() }),
    plano: el("plano", {
      x: n(), y: n(), w: n(), h: n(), color: tok(), cotas: b(), dur: n(),
      habitaciones: arr(obj({ nombre: s(), x: n(), y: n(), w: n(), h: n(), m2: nul(n()) })),
    }),
    grafica: el("grafica", { grafica: e(GRAFICAS), x: n(), y: n(), w: n(), h: n(), color: tok(), dur: n(), datos: arr(obj({ etiqueta: s(), valor: n() })) }),
    contador: el("contador", { desde: n(), valor: n(), prefijo: s(), sufijo: s(), decimales: i(), x: n(), y: n(), tam: n(), color: tok(), dur: n() }),
    anillo: el("anillo", { x: n(), y: n(), radio: n(), valor: n(), etiqueta: s(), color: tok() }),
    ondas: el("ondas", { x: n(), y: n(), radio: n(), color: tok() }),
    lista: el("lista", { items: arr(s()), x: n(), y: n(), tam: n(), color: tok() }),
    tarjeta: el("tarjeta", { x: n(), y: n(), w: n(), h: n(), titulo: s(), valor: s(), icono: nul(e(iconos.length ? iconos : ["estrella"])), color: tok() }),
  };
  return solo.map((k) => todos[k]);
}

/** Medidor del HUD: su valor se mueve de `inicio` a `fin` y arrastra aguja, número, borde y modelo en el mismo fotograma. */
const medidorEsq = (): Sch => obj({ etiqueta: s(), unidad: s(), min: n(), max: n(), inicio: n(), fin: n(), t: n(), dur: n(), decimales: i() });

function objetos3D(retro = false): Sch[] {
  const base = (): Record<string, Sch> => ({ t: n(), dur: n(), entrada: e(ENTRADAS_3D), giro: n(), color: tok(), emisivo: b() });
  const o = (nombre: string, props: Record<string, Sch>): Sch => obj({ tipo: tipo(nombre), ...base(), ...props });
  return [
    o("edificio", { x: n(), z: n(), w: n(), d: n(), pisos: i(), remate: e(REMATES), ventanas: b() }),
    o("caja", { x: n(), y: n(), z: n(), w: n(), h: n(), d: n() }),
    o("cilindro", { x: n(), y: n(), z: n(), radio: n(), h: n() }),
    o("esfera", { x: n(), y: n(), z: n(), radio: n() }),
    o("piramide", { x: n(), y: n(), z: n(), radio: n(), h: n() }),
    o("extrusion", { x: n(), y: n(), z: n(), h: n(), puntos: arr(obj({ x: n(), z: n() })) }),
    o("barras3d", { x: n(), z: n(), w: n(), sep: n(), hmax: n(), datos: arr(n()) }),
    o("ciudad", { semilla: i(), filas: i(), columnas: i(), resaltar: nul(i()) }),
    o("casa", { x: n(), z: n(), w: n(), d: n(), h: n() }),
    o("anillo", { x: n(), y: n(), z: n(), radio: n(), grosor: n() }),
    ...(retro ? [o("modelo", { forma: e(FORMAS_MODELO), x: n(), z: n(), escala: n(), v1: nul(i()), v2: nul(i()), v3: nul(i()), b1: n(), b2: n(), b3: n() })] : []),
  ];
}

const sfxEsq = (): Sch => arr(obj({ t: n(), tipo: e(SFX_TIPOS), vol: n() }));

export type OpcionesEsquema = { paleta: string; sfx: boolean; svg: boolean; tres: boolean };

/** Esquema de la respuesta completa. Solo incluye las variantes que el guion necesita (esquema más corto = menos tokens). */
export function esquemaAnimacion(o: OpcionesEsquema): { name: string; strict: true; schema: Sch } {
  const iconos = iconosPermitidos(o.paleta);
  const retro = esRetro(o.paleta);
  const extraRetro: Record<string, Sch> = retro ? { titulo: s(), subtitulo: nul(s()), medidores: arr(medidorEsq()) } : {};
  const variantes: Sch[] = [];
  if (o.svg) {
    const props: Record<string, Sch> = {
      modo: tipo("SVG"), n: i(), tema: e(TEMAS), ambiente: e(AMBIENTES),
      ...extraRetro,
      elementos: arr({ anyOf: elementos2D(iconos, retro ? TIPOS_2D_RETRO : TIPOS_2D, retro) }),
    };
    if (o.sfx) props.sfx = sfxEsq();
    variantes.push(obj(props));
  }
  if (o.tres) {
    const props: Record<string, Sch> = {
      modo: tipo("3D"), n: i(), tema: e(TEMAS),
      ...extraRetro,
      camara: obj({ radio: n(), radioFin: n(), altura: n(), alturaFin: n(), anguloInicio: n(), anguloFin: n(), mirarX: n(), mirarY: n(), mirarZ: n(), fov: n() }),
      luces: obj({ ambiente: n(), direccional: n(), dirX: n(), dirY: n(), dirZ: n(), puntoAcento: n() }),
      suelo: e(SUELOS), niebla: b(),
      objetos: arr({ anyOf: objetos3D(retro) }),
      overlay: arr({ anyOf: elementos2D(iconos, retro ? TIPOS_OVERLAY_RETRO : TIPOS_OVERLAY, retro) }),
    };
    if (o.sfx) props.sfx = sfxEsq();
    variantes.push(obj(props));
  }
  return {
    name: "animacion_imnoba",
    strict: true,
    schema: obj({ titulo: s(), escenas: arr(variantes.length === 1 ? variantes[0] : { anyOf: variantes }) }),
  };
}

export type OpcionesGeometria = { paleta: string; svg: boolean; tres: boolean; mixto: boolean };

/**
 * Esquema del FORMATO ESTRUCTURADO: la IA solo devuelve la geometría del escenario central de cada escena.
 * No hay título, subtítulo, medidores, tema ni sonido: todo eso lo resuelve el código local (cuesta $0 de API).
 */
export function esquemaGeometria(o: OpcionesGeometria): { name: string; strict: true; schema: Sch } {
  const iconos: string[] = []; // sin iconos en el escenario estructurado
  const variantes: Sch[] = [];
  if (o.svg) variantes.push(obj({ modo: tipo("SVG"), n: i(), ambiente: e(AMBIENTES), elementos: arr({ anyOf: elementos2D(iconos, TIPOS_2D_GEO, true) }) }));
  if (o.tres) {
    variantes.push(
      obj({
        modo: tipo("3D"), n: i(),
        camara: obj({ radio: n(), radioFin: n(), altura: n(), alturaFin: n(), anguloInicio: n(), anguloFin: n(), mirarX: n(), mirarY: n(), mirarZ: n(), fov: n() }),
        luces: obj({ ambiente: n(), direccional: n(), dirX: n(), dirY: n(), dirZ: n(), puntoAcento: n() }),
        suelo: e(SUELOS), niebla: b(),
        objetos: arr({ anyOf: objetos3D(true) }),
        // 3D+SVG: la capa vectorial puede llevar cualquier elemento 2D; en 3D normal, solo anotaciones
        overlay: arr({ anyOf: elementos2D(iconos, o.mixto ? TIPOS_2D_GEO : TIPOS_OVERLAY_GEO, true) }),
      }),
    );
  }
  return { name: "geometria_central", strict: true, schema: obj({ escenas: arr(variantes.length === 1 ? variantes[0] : { anyOf: variantes }) }) };
}
