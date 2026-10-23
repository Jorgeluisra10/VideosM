/**
 * Saneado + validación LOCAL de lo que devuelve la IA. Corrige solo lo que se puede corregir sin cambiar el sentido
 * (recortar a la zona segura, envolver textos largos, acotar tiempos) y reporta como ERROR lo que no (escena
 * faltante, modo equivocado, path SVG inválido), para que el agente haga una llamada de reparación acotada.
 * Lógica PURA: la usan el agente (Node), las pruebas y, si hace falta, Remotion.
 */
import { getBoundingBox, parsePath, scalePath, translatePath } from "@remotion/paths";
import { TOKENS, esRetro, paletaPorId, type TemaEscena } from "./paletas";
import { iconosPermitidos } from "./iconos";
import { AMBIENTES, ENTRADAS_2D, ENTRADAS_3D, FORMAS, GRAFICAS, REMATES, SFX_TIPOS, SUELOS, TEMAS, TIPOS_2D, TIPOS_2D_RETRO, TIPOS_3D, TIPOS_3D_RETRO, TIPOS_OVERLAY, TIPOS_OVERLAY_RETRO, TIPOS_2D_GEO, TIPOS_OVERLAY_GEO, FORMAS_MODELO } from "./esquema";
import { FPS_ANIM, type EscenaBloque } from "./parser";
import type { Animacion, EscenaGuardada, EventoSfx, Medidor } from "./tipos";
import type { ConfigEstructurada, EscenaEstructurada } from "./guionEstructurado";

// Zona segura de los elementos. En el estilo retro el escenario es la franja central (y 350–1450): arriba va el título y abajo el HUD.
// Son variables de módulo que ensamblar() fija al empezar y restaura al terminar (todo es síncrono, no hay carreras).
let X0 = 90, X1 = 990, Y0 = 150, Y1 = 1770;
let retroActivo = false;
const ZONA_CLASICA = { y0: 150, y1: 1770 }, ZONA_RETRO = { y0: 350, y1: 1450 };
/** Avance de JetBrains Mono: 0,6 em por carácter. */
export const anchoMono = (n: number, tam: number): number => n * tam * 0.6;

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

/** Envuelve un texto monoespaciado en líneas de `maxCh` caracteres como máximo. */
function envolverMono(texto: string, maxCh: number): string[] {
  const out: string[] = [];
  let actual = "";
  for (const p of texto.split(/\s+/).filter(Boolean)) {
    const palabra = p.length > maxCh ? p.slice(0, maxCh) : p;
    const prueba = actual ? `${actual} ${palabra}` : palabra;
    if (actual && prueba.length > maxCh) {
      out.push(actual);
      actual = palabra;
    } else actual = prueba;
  }
  if (actual) out.push(actual);
  return out.length ? out : [""];
}

/** Título H1 retro: MAYÚSCULAS, Inter Black, tracking -0.03em (≈ 0,66 em por letra), centrado, máx. 2 líneas dentro de 900 px. */
const FACTOR_TITULO = 0.66;
function ajustarTitulo(texto: string, c: Ctx): { texto: string; tam: number } {
  const palabras = cadena(texto, 70).toUpperCase().replace(/[.]+$/, "").split(/\s+/).filter(Boolean);
  const ancho = X1 - X0;
  for (let tam = 96; tam >= 44; tam -= 4) {
    const maxCh = Math.floor(ancho / (tam * FACTOR_TITULO));
    const lineas = envolverMono(palabras.join(" "), maxCh);
    const limite = lineas.length === 1 ? 96 : 76;
    if (lineas.length <= 2 && tam <= limite && Math.max(...lineas.map((l) => l.length)) <= maxCh) {
      if (tam < 96) aviso(c, `título reducido a ${tam}px para que quepa en ${lineas.length} línea(s)`);
      return { texto: lineas.join("\n"), tam };
    }
  }
  aviso(c, "título demasiado largo: se recortó");
  const t = palabras.join(" ").slice(0, 2 * Math.floor(ancho / (44 * FACTOR_TITULO)));
  return { texto: envolverMono(t, Math.floor(ancho / (44 * FACTOR_TITULO))).slice(0, 2).join("\n"), tam: 44 };
}

function sanearMedidores(raw: unknown, c: Ctx): Medidor[] {
  const lista = (Array.isArray(raw) ? raw : []).slice(0, 3).map((m: any): Medidor => {
    let min = num(m?.min, 0), max = num(m?.max, 100);
    if (max <= min) max = min + 1;
    const dur = num(m?.dur, 1.4, 0.4, Math.max(0.4, c.dur - 0.5));
    const t = num(m?.t, 0.6, 0, Math.max(0, c.dur - dur - 0.3));
    return {
      etiqueta: cadena(m?.etiqueta, 14).toUpperCase(), unidad: cadena(m?.unidad, 6),
      min, max, inicio: num(m?.inicio, min, min, max), fin: num(m?.fin, max, min, max),
      t: +t.toFixed(2), dur: +dur.toFixed(2), decimales: entero(m?.decimales, 0, 0, 2),
    };
  });
  if (!lista.length) fallo(c, "el estilo retro necesita al menos 1 medidor para el HUD");
  return lista;
}

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
      return { ...b, d, color: tokenDe(raw.color), grosor: retroActivo ? 3 : num(raw.grosor, 6, 1, 24), relleno: raw.relleno ? tokenDe(raw.relleno) : null, dur: num(raw.dur, 1.2, 0.2, 6), brillo: retroActivo ? false : !!raw.brillo, ...(retroActivo ? { punteado: !!raw.punteado } : {}) };
    }
    case "linea": {
      const pts = (Array.isArray(raw.puntos) ? raw.puntos : []).slice(0, 40).map((p: any) => ({ x: Math.round(num(p?.x, 540, X0, X1)), y: Math.round(num(p?.y, 960, Y0, Y1)) }));
      if (pts.length < 2) {
        fallo(c, "una línea tiene menos de 2 puntos");
        return null;
      }
      return { ...b, puntos: pts, color: tokenDe(raw.color), grosor: retroActivo ? 3 : num(raw.grosor, 6, 1, 24), flecha: !!raw.flecha, curva: !!raw.curva, dur: num(raw.dur, 1, 0.2, 6), ...(retroActivo ? { punteado: !!raw.punteado } : {}) };
    }
    case "forma": {
      const w = num(raw.w, 200, 10, 900), h = num(raw.h, 200, 10, 1500);
      const p = centrar(num(raw.x, 540), num(raw.y, 960), w, h);
      return { ...b, forma: en(raw.forma, FORMAS, "redondeado"), x: Math.round(p.x), y: Math.round(p.y), w: Math.round(w), h: Math.round(h), color: tokenDe(raw.color), relleno: !!raw.relleno, borde: num(raw.borde, 4, 0, 20) };
    }
    case "terminal": {
      const tam = num(raw.tam, 34, 22, 56);
      const maxCh = Math.max(8, Math.floor((X1 - X0) / anchoMono(1, tam)));
      const lineas = envolverMono(cadena(raw.texto, 240), maxCh).slice(0, 6);
      const w = anchoMono(Math.max(...lineas.map((l) => l.length), 1), tam);
      const alinear = raw.alinear === "izquierda" ? "izquierda" : "centro";
      const x = alinear === "centro" ? Math.min(X1 - w / 2, Math.max(X0 + w / 2, num(raw.x, 540))) : Math.min(X1 - w, Math.max(X0, num(raw.x, X0)));
      const h = lineas.length * tam * 1.4;
      const y = Math.min(Y1 - h / 2, Math.max(Y0 + h / 2, num(raw.y, 700)));
      return { ...b, texto: lineas.join("\n"), x: Math.round(x), y: Math.round(y), tam, color: tokenDe(raw.color), alinear };
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
  if (!raw || !(retroActivo ? TIPOS_3D_RETRO : TIPOS_3D).includes(raw.tipo)) {
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
    case "modelo": {
      const v = (x: unknown) => (x == null ? null : entero(x, 0, 0, 2));
      return { ...o, forma: en(raw.forma, FORMAS_MODELO, "toroide"), x: P(raw.x), z: P(raw.z), escala: S(raw.escala, 1.2, 0.3, 3), v1: v(raw.v1), v2: v(raw.v2), v3: v(raw.v3), b1: +num(raw.b1, 0.5, 0, 1).toFixed(3), b2: +num(raw.b2, 0.5, 0, 1).toFixed(3), b3: +num(raw.b3, 0.3, 0, 1).toFixed(3) };
    }
  }
  return null;
}

/** Datos que en el formato estructurado resuelve el código local (la IA solo aporta la geometría). */
type Local = { tema: TemaEscena; retro: Record<string, unknown>; sfx: EventoSfx[] | null; mixto: boolean };

function sanearEscena(raw: any, b: EscenaBloque, c: Ctx, sfx: boolean, local?: Local): EscenaGuardada | null {
  const comunes = { n: b.n, inicio: b.inicio, fin: b.fin, dur: b.dur, texto: b.texto, tema: local ? local.tema : en(raw.tema, TEMAS, "oscuro") };
  const sonido = local ? (local.sfx ? { sfx: local.sfx } : {}) : sfx ? { sfx: sanearSfx(raw.sfx, b.dur) } : {};
  // estilo retro: título, subtítulo de terminal y medidores del HUD (los tres van en la escena, no como elementos)
  let retro: Record<string, unknown> = {};
  if (local) retro = local.retro;
  else if (retroActivo) {
    const t = ajustarTitulo(String(raw.titulo ?? ""), c);
    const sub = raw.subtitulo == null || !String(raw.subtitulo).trim() ? null : envolverMono(cadena(raw.subtitulo, 110), Math.floor((X1 - X0) / anchoMono(1, 30))).slice(0, 2).join("\n");
    retro = { titulo: t.texto, tituloTam: t.tam, subtitulo: sub, medidores: sanearMedidores(raw.medidores, c) };
    if (!t.texto.trim()) fallo(c, "el estilo retro necesita un título (H1) en cada escena");
  }
  if (b.modo === "SVG") {
    const elementos = (Array.isArray(raw.elementos) ? raw.elementos : []).slice(0, 26).map((e: any) => sanearElemento(e, c, local ? TIPOS_2D_GEO : retroActivo ? TIPOS_2D_RETRO : TIPOS_2D)).filter(Boolean);
    if (elementos.length < 2) fallo(c, `la escena SVG tiene ${elementos.length} elemento(s) válidos; necesita al menos 2`);
    return { ...comunes, modo: "SVG", ambiente: en(raw.ambiente, AMBIENTES, "cuadricula"), ...retro, elementos, ...sonido } as EscenaGuardada;
  }
  const cam = raw.camara ?? {};
  const lu = raw.luces ?? {};
  const objetos = (Array.isArray(raw.objetos) ? raw.objetos : []).slice(0, 30).map((o: any) => sanearObjeto3D(o, c)).filter(Boolean);
  if (!objetos.length) fallo(c, "la escena 3D no tiene objetos válidos");
  const overlay = (Array.isArray(raw.overlay) ? raw.overlay : []).slice(0, local?.mixto ? 16 : 8).map((e: any) => sanearElemento(e, c, local ? (local.mixto ? TIPOS_2D_GEO : TIPOS_OVERLAY_GEO) : retroActivo ? TIPOS_OVERLAY_RETRO : TIPOS_OVERLAY)).filter(Boolean);
  return {
    ...comunes,
    ...retro,
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
  retroActivo = esRetro(o.paleta);
  Y0 = (retroActivo ? ZONA_RETRO : ZONA_CLASICA).y0;
  Y1 = (retroActivo ? ZONA_RETRO : ZONA_CLASICA).y1;
  try {
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
  } finally {
    retroActivo = false;
    Y0 = ZONA_CLASICA.y0;
    Y1 = ZONA_CLASICA.y1;
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
    if (e.modo === "LIBRE" && !e.js) p.push(`Escena ${e.n}: sin código compilado`);
    if (e.modo === "ESTUDIO" && !(e.layout && e.primary?.shape && e.headline?.text)) p.push(`Escena ${e.n}: le falta el layout, la figura o el titular`);
    if (e.modo === "SVG" && (e.elementos?.length ?? 0) < 1) p.push(`Escena ${e.n}: sin elementos`);
    if (e.modo === "3D" && (e.objetos?.length ?? 0) < 1) p.push(`Escena ${e.n}: sin objetos 3D`);
  }
  if (a.escenas?.length && Math.abs(t - a.duracion) > 0.01) p.push(`la duración (${a.duracion} s) no coincide con la última escena (${t} s)`);
  return p;
}

export const framesDeAnimacion = (a: Pick<Animacion, "duracion">): number => Math.max(1, Math.round(a.duracion * FPS_ANIM));

/* ───────────── FORMATO ESTRUCTURADO ───────────── */

/** Título H1 y subtítulo de terminal ya medidos para la zona superior (los dos vienen del guion, no de la IA). */
export function cabeceraRetro(h1: string, sub: string | null, c: Ctx): { titulo: string; tituloTam: number; subtitulo: string | null } {
  const t = ajustarTitulo(h1, c);
  const subtitulo = sub && sub.trim() ? envolverMono(cadena(sub, 110), Math.floor((X1 - X0) / anchoMono(1, 30))).slice(0, 2).join("\n") : null;
  return { titulo: t.texto, tituloTam: t.tam, subtitulo };
}

/** Medidores de la escena k: cada línea HUD es un tramo; el valor de partida es el final de la escena anterior (o el mínimo del rango). */
export function medidoresDe(config: ConfigEstructurada, escenas: EscenaEstructurada[], k: number): Medidor[] {
  if (!config.hud) return [];
  return config.gauges.map((g, i) => {
    let inicio = g.min;
    for (let j = 0; j < k; j++) for (const h of escenas[j].hud) if (h.valores[i] != null) inicio = h.valores[i] as number;
    const claves = escenas[k].hud
      .filter((h) => h.valores[i] != null)
      .map((h) => ({ t: +h.t.toFixed(2), dur: +h.dur.toFixed(2), valor: h.valores[i] as number }))
      .sort((a, b) => a.t - b.t);
    return { etiqueta: g.etiqueta, unidad: g.unidad, min: g.min, max: g.max, inicio, fin: claves.length ? claves[claves.length - 1].valor : inicio, t: claves[0]?.t ?? 0, dur: claves[0]?.dur ?? 1, decimales: g.decimales, claves };
  });
}

/** El formato estructurado siempre usa el layout retro: IMNOBA → retro-imnoba, Medicina → retro. */
export const paletaRetroDe = (id: string): string => (esRetro(id) ? id : id === "medicina" ? "retro" : "retro-imnoba");

/**
 * Une la geometría que devolvió la IA con TODO lo que se resolvió localmente (fondo, título, subtítulo, HUD, sonido).
 * El escenario es y 350–1450 con HUD y 350–1800 con «HUD: OFF».
 */
export function ensamblarGeo(raw: any, escenas: EscenaEstructurada[], config: ConfigEstructurada, o: { paleta: string; sfx: boolean; usoDe?: Animacion["uso"] }): Resultado {
  const errores: string[] = [];
  const correcciones: string[] = [];
  const paleta = paletaRetroDe(o.paleta);
  if (paleta !== o.paleta) correcciones.push(`El formato estructurado usa el diseño Retro-Científico: la paleta «${paletaPorId(o.paleta).nombre}» se cambió a «${paletaPorId(paleta).nombre}».`);
  const crudas: any[] = Array.isArray(raw?.escenas) ? raw.escenas : [];
  const iconos = new Set(iconosPermitidos(paleta));
  const salida: EscenaGuardada[] = [];
  retroActivo = true;
  Y0 = ZONA_RETRO.y0;
  Y1 = config.hud ? ZONA_RETRO.y1 : 1800;
  try {
    escenas.forEach((e, k) => {
      const c: Ctx = { dur: e.dur, n: e.n, iconos, errores, correcciones };
      const r = crudas.find((x) => Number(x?.n) === e.n) ?? (crudas.length === escenas.length ? crudas[k] : undefined);
      if (!r) return fallo(c, "la IA no devolvió esta escena");
      if (r.modo !== e.modo) return fallo(c, `se pidió modo ${e.modo} y la IA devolvió ${r.modo}`);
      const cab = cabeceraRetro(e.h1, e.sub, c);
      const bloque: EscenaBloque = { n: e.n, inicio: e.inicio, fin: e.fin, dur: e.dur, modo: e.modo, texto: e.geo.map((g) => g.texto).join("\n") };
      const esc = sanearEscena(r, bloque, c, o.sfx, {
        tema: e.fondo === "paper" ? "claro" : "oscuro",
        retro: { ...cab, medidores: medidoresDe(config, escenas, k) },
        sfx: o.sfx ? e.sfx.map((s) => ({ t: +s.t.toFixed(2), tipo: s.tipo as EventoSfx["tipo"], vol: 0.15 })) : null,
        mixto: e.mixto,
      });
      if (esc) salida.push(esc);
    });
  } finally {
    retroActivo = false;
    Y0 = ZONA_CLASICA.y0;
    Y1 = ZONA_CLASICA.y1;
  }
  const fin = escenas.length ? escenas[escenas.length - 1].fin : 0;
  const anim: Animacion = {
    version: 1,
    titulo: cadena(escenas[0]?.h1, 80) || "Video sin título",
    paleta,
    sfx: o.sfx,
    fps: FPS_ANIM,
    duracion: fin,
    escenas: salida,
    uso: o.usoDe ?? null,
    hud: config.hud,
    formato: "estructurado",
  };
  return { anim: errores.length ? null : anim, errores, correcciones };
}
