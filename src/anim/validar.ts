/**
 * Saneado + validación LOCAL de lo que devuelve la IA. Corrige solo lo que se puede corregir sin cambiar el sentido
 * (recortar a la zona segura, envolver textos largos, acotar tiempos) y reporta como ERROR lo que no (escena
 * faltante, modo equivocado, path SVG inválido), para que el agente haga una llamada de reparación acotada.
 * Lógica PURA: la usan el agente (Node), las pruebas y, si hace falta, Remotion.
 */
import { getBoundingBox, parsePath, scalePath, translatePath } from "@remotion/paths";
import { TOKENS } from "./paletas";
import { iconosPermitidos } from "./iconos";
import { AMBIENTES, ENTRADAS_2D, ENTRADAS_3D, FORMAS, GRAFICAS, REMATES, SFX_TIPOS, SUELOS, TEMAS, TIPOS_2D, TIPOS_3D, TIPOS_OVERLAY } from "./esquema";
import { FPS_ANIM, type EscenaBloque } from "./parser";
import type { Animacion, EscenaGuardada, EventoSfx } from "./tipos";

const X0 = 90, X1 = 990, Y0 = 150, Y1 = 1770;

export type Resultado = { anim: Animacion | null; errores: string[]; correcciones: string[] };

const num = (v: unknown, def: number, a = -1e9, b = 1e9): number => {
  const x = typeof v === "number" && Number.isFinite(v) ? v : def;
  return Math.min(b, Math.max(a, x));
};
const entero = (v: unknown, def: number, a: number, b: number): number => Math.round(num(v, def, a, b));
const en = <T extends string>(v: unknown, lista: readonly T[], def: T): T => (lista.includes(v as T) ? (v as T) : def);
const tokenDe = (v: unknown): string => (TOKENS.includes(v as never) ? (v as string) : "tinta");
const cadena = (v: unknown, max = 200): string => (typeof v === "string" ? v : v == null ? "" : String(v)).replace(/\s+/g, " ").trim().slice(0, max);

const FACTOR: Record<number, number> = { 500: 0.5, 700: 0.53, 900: 0.56 };
/** Ancho estimado (px) de una línea de Inter. El QA mide el real en el DOM. */
export const anchoLinea = (txt: string, tam: number, peso = 700): number => txt.length * tam * (FACTOR[peso] ?? 0.58);

/** Envuelve un texto en líneas que quepan en `maxW` (reduce el tamaño si una sola palabra no cabe). */
export function envolver(texto: string, tam: number, peso: number, maxW: number): { lineas: string[]; tam: number } {
  const palabras = texto.split(/\s+/).filter(Boolean);
  const mayor = palabras.reduce((m, p) => Math.max(m, p.length), 0);
  while (tam > 34 && anchoLinea("x".repeat(mayor), tam, peso) > maxW) tam -= 2;
  const envolverEn = (ancho: number): string[] => {
    const salida: string[] = [];
    let actual = "";
    for (const p of palabras) {
      const prueba = actual ? `${actual} ${p}` : p;
      if (actual && anchoLinea(prueba, tam, peso) > ancho) {
        salida.push(actual);
        actual = p;
      } else actual = prueba;
    }
    if (actual) salida.push(actual);
    return salida.length ? salida : [""];
  };
  let lineas = envolverEn(maxW);
  // equilibra las líneas (evita una última línea con una sola palabra suelta)
  if (lineas.length > 1) {
    const total = anchoLinea(palabras.join(" "), tam, peso);
    const objetivo = Math.max(anchoLinea("x".repeat(mayor), tam, peso), (total / lineas.length) * 1.12);
    const equilibradas = envolverEn(Math.min(maxW, objetivo));
    if (equilibradas.length === lineas.length) lineas = equilibradas;
  }
  return { lineas, tam };
}

/** Coloca el centro de una caja de ancho w / alto h dentro de la zona segura. */
const centrar = (x: number, y: number, w: number, h: number) => ({
  x: Math.min(X1 - w / 2, Math.max(X0 + w / 2, x)),
  y: Math.min(Y1 - h / 2, Math.max(Y0 + h / 2, y)),
});

type Ctx = { dur: number; n: number; iconos: Set<string>; errores: string[]; correcciones: string[] };
const aviso = (c: Ctx, m: string) => c.correcciones.push(`Escena ${c.n}: ${m}`);
const fallo = (c: Ctx, m: string) => c.errores.push(`Escena ${c.n}: ${m}`);

function base2D(raw: any, c: Ctx): any {
  const t = num(raw.t, 0, 0, Math.max(0, c.dur - 0.4));
  let hasta: number | null = raw.hasta == null ? null : num(raw.hasta, 0, 0, 1e6);
  if (hasta !== null && (hasta <= t + 0.4 || hasta >= c.dur - 0.05)) hasta = null;
  return { tipo: raw.tipo, t: +t.toFixed(2), hasta: hasta === null ? null : +hasta.toFixed(2), entrada: en(raw.entrada, ENTRADAS_2D, "aparecer") };
}

function sanearTexto(raw: any, b: any, c: Ctx) {
  const peso = [500, 700, 900].includes(raw.peso) ? raw.peso : 700;
  const alinear = en(raw.alinear, ["centro", "izquierda", "derecha"] as const, "centro");
  const original = cadena(raw.texto, 140);
  let tam = num(raw.tam, 64, 28, 140);
  const maxW = X1 - X0;
  const e = envolver(original, tam, peso, maxW);
  if (e.tam !== tam || e.lineas.length > 1) aviso(c, `texto «${original.slice(0, 24)}…» ajustado a ${e.lineas.length} línea(s) para respetar el margen`);
  tam = e.tam;
  const w = Math.max(...e.lineas.map((l) => anchoLinea(l, tam, peso)));
  const h = e.lineas.length * tam * 1.2;
  let x = num(raw.x, 540, 0, 1080);
  if (alinear === "centro") x = Math.min(X1 - w / 2, Math.max(X0 + w / 2, x));
  else if (alinear === "izquierda") x = Math.min(X1 - w, Math.max(X0, x));
  else x = Math.min(X1, Math.max(X0 + w, x));
  const y = Math.min(Y1 - h / 2, Math.max(Y0 + h / 2, num(raw.y, 960, 0, 1920)));
  return { ...b, texto: e.lineas.join("\n"), x: Math.round(x), y: Math.round(y), tam, color: tokenDe(raw.color), peso, alinear };
}

function sanearElemento(raw: any, c: Ctx, permitidos: readonly string[]): any | null {
  if (!raw || typeof raw !== "object" || !permitidos.includes(raw.tipo)) {
    aviso(c, `elemento «${raw?.tipo}» no permitido aquí: se descartó`);
    return null;
  }
  const b = base2D(raw, c);
  switch (raw.tipo) {
    case "texto":
      return sanearTexto(raw, b, c);
    case "trazo": {
      let d = cadena(raw.d, 4000);
      try {
        parsePath(d);
        let bb = getBoundingBox(d);
        const zw = X1 - X0, zh = Y1 - Y0;
        if (bb.width > zw || bb.height > zh) {
          const k = Math.min(zw / bb.width, zh / bb.height);
          d = scalePath(d, k, k);
          bb = getBoundingBox(d);
          aviso(c, "trazo más grande que el lienzo: se escaló");
        }
        const dx = bb.x1 < X0 ? X0 - bb.x1 : bb.x2 > X1 ? X1 - bb.x2 : 0;
        const dy = bb.y1 < Y0 ? Y0 - bb.y1 : bb.y2 > Y1 ? Y1 - bb.y2 : 0;
        if (dx || dy) {
          d = translatePath(d, dx, dy);
          aviso(c, "trazo fuera de la zona segura: se movió");
        }
      } catch {
        fallo(c, `el trazo tiene un path SVG inválido («${d.slice(0, 40)}…»)`);
        return null;
      }
      return { ...b, d, color: tokenDe(raw.color), grosor: num(raw.grosor, 6, 1, 24), relleno: raw.relleno ? tokenDe(raw.relleno) : null, dur: num(raw.dur, 1.2, 0.2, 6), brillo: !!raw.brillo };
    }
    case "linea": {
      const pts = (Array.isArray(raw.puntos) ? raw.puntos : []).slice(0, 40).map((p: any) => ({ x: Math.round(num(p?.x, 540, X0, X1)), y: Math.round(num(p?.y, 960, Y0, Y1)) }));
      if (pts.length < 2) {
        fallo(c, "una línea tiene menos de 2 puntos");
        return null;
      }
      return { ...b, puntos: pts, color: tokenDe(raw.color), grosor: num(raw.grosor, 6, 1, 24), flecha: !!raw.flecha, curva: !!raw.curva, dur: num(raw.dur, 1, 0.2, 6) };
    }
    case "forma": {
      const w = num(raw.w, 200, 10, 900), h = num(raw.h, 200, 10, 1500);
      const p = centrar(num(raw.x, 540), num(raw.y, 960), w, h);
      return { ...b, forma: en(raw.forma, FORMAS, "redondeado"), x: Math.round(p.x), y: Math.round(p.y), w: Math.round(w), h: Math.round(h), color: tokenDe(raw.color), relleno: !!raw.relleno, borde: num(raw.borde, 4, 0, 20) };
    }
    case "icono": {
      const tam = num(raw.tam, 140, 50, 360);
      let nombre = cadena(raw.nombre, 40);
      if (!c.iconos.has(nombre)) {
        aviso(c, `icono «${nombre}» no existe: se usó «estrella»`);
        nombre = "estrella";
      }
      const p = centrar(num(raw.x, 540), num(raw.y, 960), tam, tam);
      return { ...b, nombre, x: Math.round(p.x), y: Math.round(p.y), tam: Math.round(tam), color: tokenDe(raw.color), fondo: !!raw.fondo };
    }
    case "plano": {
      const w = num(raw.w, 760, 200, 900), h = num(raw.h, 760, 200, 1400);
      const p = centrar(num(raw.x, 540), num(raw.y, 960), w, h);
      const hab = (Array.isArray(raw.habitaciones) ? raw.habitaciones : []).slice(0, 12).map((r: any) => {
        const x = num(r?.x, 0, 0, 95), y = num(r?.y, 0, 0, 95);
        return { nombre: cadena(r?.nombre, 18), x, y, w: num(r?.w, 30, 5, 100 - x), h: num(r?.h, 30, 5, 100 - y), m2: r?.m2 == null ? null : num(r.m2, 0, 0, 100000) };
      });
      if (!hab.length) {
        fallo(c, "un plano no tiene habitaciones");
        return null;
      }
      return { ...b, x: Math.round(p.x), y: Math.round(p.y), w: Math.round(w), h: Math.round(h), color: tokenDe(raw.color), cotas: !!raw.cotas, dur: num(raw.dur, 2.5, 0.5, 8), habitaciones: hab };
    }
    case "grafica": {
      const w = num(raw.w, 760, 250, 900), h = num(raw.h, 700, 250, 1300);
      const p = centrar(num(raw.x, 540), num(raw.y, 960), w, h);
      const datos = (Array.isArray(raw.datos) ? raw.datos : []).slice(0, 8).map((d: any) => ({ etiqueta: cadena(d?.etiqueta, 14), valor: Math.max(0, num(d?.valor, 0)) }));
      if (!datos.length) {
        fallo(c, "una gráfica no tiene datos");
        return null;
      }
      return { ...b, grafica: en(raw.grafica, GRAFICAS, "barras"), x: Math.round(p.x), y: Math.round(p.y), w: Math.round(w), h: Math.round(h), color: tokenDe(raw.color), dur: num(raw.dur, 1.6, 0.4, 6), datos };
    }
    case "contador": {
      const tam = num(raw.tam, 120, 40, 220);
      const prefijo = cadena(raw.prefijo, 6), sufijo = cadena(raw.sufijo, 14);
      const decimales = entero(raw.decimales, 0, 0, 3);
      const valor = num(raw.valor, 100), desde = num(raw.desde, 0);
      const largo = prefijo.length + sufijo.length + Math.max(String(Math.round(valor)).length, String(Math.round(desde)).length) + (decimales ? decimales + 1 : 0) + Math.floor(String(Math.round(Math.abs(valor))).length / 3);
      let t2 = tam;
      while (t2 > 40 && anchoLinea("x".repeat(largo), t2, 900) > X1 - X0) t2 -= 4;
      const w = anchoLinea("x".repeat(largo), t2, 900);
      const x = Math.min(X1 - w / 2, Math.max(X0 + w / 2, num(raw.x, 540)));
      const y = Math.min(Y1 - t2 / 2, Math.max(Y0 + t2 / 2, num(raw.y, 960)));
      return { ...b, desde, valor, prefijo, sufijo, decimales, x: Math.round(x), y: Math.round(y), tam: t2, color: tokenDe(raw.color), dur: num(raw.dur, 1.6, 0.3, 6) };
    }
    case "anillo": {
      const r = num(raw.radio, 160, 50, 420);
      const p = centrar(num(raw.x, 540), num(raw.y, 960), r * 2 + 20, r * 2 + 20);
      return { ...b, x: Math.round(p.x), y: Math.round(p.y), radio: Math.round(r), valor: num(raw.valor, 75, 0, 100), etiqueta: cadena(raw.etiqueta, 24), color: tokenDe(raw.color) };
    }
    case "ondas":
      return { ...b, x: Math.round(num(raw.x, 540, 0, 1080)), y: Math.round(num(raw.y, 960, 0, 1920)), radio: num(raw.radio, 260, 60, 520), color: tokenDe(raw.color) };
    case "lista": {
      const items: string[] = (Array.isArray(raw.items) ? raw.items : []).slice(0, 8).map((s: unknown) => cadena(s, 60)).filter(Boolean);
      if (!items.length) {
        fallo(c, "una lista no tiene elementos");
        return null;
      }
      let tam = num(raw.tam, 56, 30, 90);
      const largo = Math.max(...items.map((s) => s.length));
      let x = Math.max(X0, num(raw.x, X0, 0, 1080));
      while (tam > 30 && x + tam * 1.4 + anchoLinea("x".repeat(largo), tam, 700) > X1) {
        if (x > X0) x = Math.max(X0, x - 20);
        else tam -= 2;
      }
      const alto = items.length * tam * 1.7;
      const y = Math.min(Y1 - alto, Math.max(Y0, num(raw.y, 600)));
      return { ...b, items, x: Math.round(x), y: Math.round(y), tam, color: tokenDe(raw.color) };
    }
    case "tarjeta": {
      const w = num(raw.w, 560, 280, 900), h = num(raw.h, 220, 140, 600);
      const p = centrar(num(raw.x, 540), num(raw.y, 960), w, h);
      const icono = raw.icono && c.iconos.has(raw.icono) ? raw.icono : null;
      return { ...b, x: Math.round(p.x), y: Math.round(p.y), w: Math.round(w), h: Math.round(h), titulo: cadena(raw.titulo, 28), valor: cadena(raw.valor, 18), icono, color: tokenDe(raw.color) };
    }
  }
  return null;
}

function sanearSfx(raw: unknown, dur: number): EventoSfx[] {
  return (Array.isArray(raw) ? raw : [])
    .slice(0, 10)
    .map((e: any) => ({ t: +num(e?.t, 0, 0, Math.max(0, dur - 0.1)).toFixed(2), tipo: en(e?.tipo, SFX_TIPOS, "pop"), vol: +num(e?.vol, 0.15, 0.02, 0.4).toFixed(2) }));
}

function sanearObjeto3D(raw: any, c: Ctx): any | null {
  if (!raw || !TIPOS_3D.includes(raw.tipo)) {
    aviso(c, `objeto 3D «${raw?.tipo}» no permitido: se descartó`);
    return null;
  }
  const P = (v: unknown, def = 0) => +num(v, def, -14, 14).toFixed(2);
  const S = (v: unknown, def: number, a = 0.05, b = 20) => +num(v, def, a, b).toFixed(2);
  const o: any = {
    tipo: raw.tipo,
    t: +num(raw.t, 0, 0, Math.max(0, c.dur - 0.3)).toFixed(2),
    dur: +num(raw.dur, 1, 0.1, 5).toFixed(2),
    entrada: en(raw.entrada, ENTRADAS_3D, "crecer"),
    giro: num(raw.giro, 0, -180, 180),
    color: tokenDe(raw.color),
    emisivo: !!raw.emisivo,
  };
  switch (raw.tipo) {
    case "edificio":
      return { ...o, x: P(raw.x), z: P(raw.z), w: S(raw.w, 2, 0.4, 8), d: S(raw.d, 2, 0.4, 8), pisos: entero(raw.pisos, 8, 1, 60), remate: en(raw.remate, REMATES, "plana"), ventanas: raw.ventanas !== false };
    case "caja":
      return { ...o, x: P(raw.x), y: P(raw.y), z: P(raw.z), w: S(raw.w, 2), h: S(raw.h, 2), d: S(raw.d, 2) };
    case "cilindro":
      return { ...o, x: P(raw.x), y: P(raw.y), z: P(raw.z), radio: S(raw.radio, 1, 0.1, 8), h: S(raw.h, 2) };
    case "esfera":
      return { ...o, x: P(raw.x), y: P(raw.y, 1), z: P(raw.z), radio: S(raw.radio, 1, 0.1, 8) };
    case "piramide":
      return { ...o, x: P(raw.x), y: P(raw.y), z: P(raw.z), radio: S(raw.radio, 1.5, 0.1, 8), h: S(raw.h, 2) };
    case "extrusion": {
      const pts = (Array.isArray(raw.puntos) ? raw.puntos : []).slice(0, 24).map((p: any) => ({ x: P(p?.x), z: P(p?.z) }));
      if (pts.length < 3) {
        fallo(c, "una extrusión necesita al menos 3 puntos");
        return null;
      }
      return { ...o, x: P(raw.x), y: P(raw.y), z: P(raw.z), h: S(raw.h, 1, 0.05, 20), puntos: pts };
    }
    case "barras3d": {
      const datos = (Array.isArray(raw.datos) ? raw.datos : []).slice(0, 12).map((v: unknown) => Math.max(0, num(v, 0)));
      if (!datos.length) {
        fallo(c, "barras3d sin datos");
        return null;
      }
      return { ...o, x: P(raw.x), z: P(raw.z), w: S(raw.w, 0.9, 0.2, 3), sep: S(raw.sep, 0.4, 0.05, 2), hmax: S(raw.hmax, 6, 0.5, 14), datos };
    }
    case "ciudad":
      return { ...o, semilla: entero(raw.semilla, 7, 0, 9999), filas: entero(raw.filas, 4, 1, 7), columnas: entero(raw.columnas, 4, 1, 7), resaltar: raw.resaltar == null ? null : entero(raw.resaltar, 0, 0, 49) };
    case "casa":
      return { ...o, x: P(raw.x), z: P(raw.z), w: S(raw.w, 3, 0.5, 10), d: S(raw.d, 3, 0.5, 10), h: S(raw.h, 2, 0.5, 8) };
    case "anillo":
      return { ...o, x: P(raw.x), y: P(raw.y, 1), z: P(raw.z), radio: S(raw.radio, 2, 0.2, 10), grosor: S(raw.grosor, 0.12, 0.02, 1) };
  }
  return null;
}

function sanearEscena(raw: any, b: EscenaBloque, c: Ctx, sfx: boolean): EscenaGuardada | null {
  const comunes = { n: b.n, inicio: b.inicio, fin: b.fin, dur: b.dur, texto: b.texto, tema: en(raw.tema, TEMAS, "oscuro") };
  const sonido = sfx ? { sfx: sanearSfx(raw.sfx, b.dur) } : {};
  if (b.modo === "SVG") {
    const elementos = (Array.isArray(raw.elementos) ? raw.elementos : []).slice(0, 26).map((e: any) => sanearElemento(e, c, TIPOS_2D)).filter(Boolean);
    if (elementos.length < 2) fallo(c, `la escena SVG tiene ${elementos.length} elemento(s) válidos; necesita al menos 2`);
    return { ...comunes, modo: "SVG", ambiente: en(raw.ambiente, AMBIENTES, "cuadricula"), elementos, ...sonido } as EscenaGuardada;
  }
  const cam = raw.camara ?? {};
  const lu = raw.luces ?? {};
  const objetos = (Array.isArray(raw.objetos) ? raw.objetos : []).slice(0, 30).map((o: any) => sanearObjeto3D(o, c)).filter(Boolean);
  if (!objetos.length) fallo(c, "la escena 3D no tiene objetos válidos");
  const overlay = (Array.isArray(raw.overlay) ? raw.overlay : []).slice(0, 8).map((e: any) => sanearElemento(e, c, TIPOS_OVERLAY)).filter(Boolean);
  return {
    ...comunes,
    modo: "3D",
    camara: {
      radio: num(cam.radio, 18, 4, 60), radioFin: num(cam.radioFin, 15, 4, 60), altura: num(cam.altura, 7, -2, 30), alturaFin: num(cam.alturaFin, 6, -2, 30),
      anguloInicio: num(cam.anguloInicio, 20, -720, 720), anguloFin: num(cam.anguloFin, 70, -720, 720),
      mirarX: num(cam.mirarX, 0, -10, 10), mirarY: num(cam.mirarY, 1.5, -2, 12), mirarZ: num(cam.mirarZ, 0, -10, 10), fov: num(cam.fov, 42, 25, 70),
    },
    luces: { ambiente: num(lu.ambiente, 0.55, 0, 1.5), direccional: num(lu.direccional, 1.6, 0, 3.5), dirX: num(lu.dirX, 6, -30, 30), dirY: num(lu.dirY, 12, 1, 40), dirZ: num(lu.dirZ, 8, -30, 30), puntoAcento: num(lu.puntoAcento, 0.6, 0, 3) },
    suelo: en(raw.suelo, SUELOS, "cuadricula"),
    niebla: !!raw.niebla,
    objetos,
    overlay,
    ...sonido,
  } as EscenaGuardada;
}

/**
 * Une la respuesta de la IA con los datos locales (tiempos y texto del guion) y la sanea.
 * `errores` vacío = listo para renderizar; `correcciones` = ajustes menores ya aplicados (informativos).
 */
export function ensamblar(raw: any, bloques: EscenaBloque[], o: { paleta: string; sfx: boolean; usoDe?: Animacion["uso"] }): Resultado {
  const errores: string[] = [];
  const correcciones: string[] = [];
  const crudas: any[] = Array.isArray(raw?.escenas) ? raw.escenas : [];
  const iconos = new Set(iconosPermitidos(o.paleta));
  const escenas: EscenaGuardada[] = [];
  for (const b of bloques) {
    const c: Ctx = { dur: b.dur, n: b.n, iconos, errores, correcciones };
    const r = crudas.find((x) => Number(x?.n) === b.n) ?? (crudas.length === bloques.length ? crudas[bloques.indexOf(b)] : undefined);
    if (!r) {
      fallo(c, "la IA no devolvió esta escena");
      continue;
    }
    if (r.modo !== b.modo) {
      fallo(c, `se pidió modo ${b.modo} y la IA devolvió ${r.modo}`);
      continue;
    }
    const esc = sanearEscena(r, b, c, o.sfx);
    if (esc) escenas.push(esc);
  }
  const fin = bloques.length ? bloques[bloques.length - 1].fin : 0;
  const anim: Animacion = {
    version: 1,
    titulo: cadena(raw?.titulo, 80) || "Video sin título",
    paleta: o.paleta,
    sfx: o.sfx,
    fps: FPS_ANIM,
    duracion: fin,
    escenas,
    uso: o.usoDe ?? null,
  };
  return { anim: errores.length ? null : anim, errores, correcciones };
}

/** Comprobación estructural de una animación ya guardada (animacion.json) antes de renderizar. */
export function validar(a: Animacion): string[] {
  const p: string[] = [];
  if (!a || a.version !== 1) return ["animacion.json no es de la versión 1"];
  if (!a.escenas?.length) p.push("no hay escenas");
  let t = 0;
  for (const e of a.escenas ?? []) {
    if (Math.abs(e.inicio - t) > 0.01) p.push(`Escena ${e.n}: empieza en ${e.inicio} s pero la anterior terminó en ${t} s`);
    t = e.fin;
    if (e.modo === "SVG" && (e.elementos?.length ?? 0) < 1) p.push(`Escena ${e.n}: sin elementos`);
    if (e.modo === "3D" && (e.objetos?.length ?? 0) < 1) p.push(`Escena ${e.n}: sin objetos 3D`);
  }
  if (a.escenas?.length && Math.abs(t - a.duracion) > 0.01) p.push(`la duración (${a.duracion} s) no coincide con la última escena (${t} s)`);
  return p;
}

export const framesDeAnimacion = (a: Pick<Animacion, "duracion">): number => Math.max(1, Math.round(a.duracion * FPS_ANIM));
