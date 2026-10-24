/**
 * Piezas comunes de las plantillas virales: contexto (tema y ritmo), texto cinético, esferas con icono, paneles de cristal, contadores y confeti.
 * Zona segura de reels: lo importante vive entre y = 220 y y = 1640 y x = 120…960 (la interfaz de Instagram/TikTok tapa los bordes).
 */
import React, { createContext, useContext } from "react";
import { spring, useCurrentFrame } from "remotion";
import { getPointAtLength } from "@remotion/paths";
import { azar } from "../lib/anim";
import { aclarar, oscurecer, mezclar } from "../anim/estudio";
import { ICONOS_PROPIOS, iconoReal, type TemaViral } from "../anim/viral";
import { dibujarIcono } from "../dsl/elementos/dibujo";
import { SpecularHighlight } from "../estudio/efectos";
import { caminoCirculo, useUid } from "../estudio/util";

export const W = 1080;
export const H = 1920;
export const FPS = 60;
/** Titulares y mono vía variables CSS: el estilo documental las redefine (Archivo Black); sin ellas valen Inter y JetBrains Mono. */
export const FUENTE = "var(--f-titulo, Inter, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif)";
export const MONO = "var(--f-mono, 'JetBrains Mono', ui-monospace, Menlo, Consolas, monospace)";
/** Variables CSS del estilo documental (titulares en Archivo Black, ≈ 10 % más ancho que Inter 900). */
export const VARS_DOCUMENTAL = { ["--f-titulo" as string]: "'Archivo Black', Inter, 'Segoe UI', Arial, sans-serif", ["--f-mono" as string]: "'JetBrains Mono', ui-monospace, Menlo, Consolas, monospace" } as React.CSSProperties;
/** Cuánto más ancha es la tipografía de titulares del estilo documental respecto a Inter. */
export const ANCHO_DOC = 1.1;
/** ancho máximo de los bloques de texto (queda ≥ 99 px de cada borde aun con el zoom de cámara) */
export const ANCHO_TEXTO = 840;

export type CtxViral = { T: TemaViral; ritmo: number; dur: number; paleta: string; marca: boolean; doc?: boolean };
export const ViralCtx = createContext<CtxViral | null>(null);
export const useViral = (): CtxViral => {
  const c = useContext(ViralCtx);
  if (!c) throw new Error("ViralCtx sin proveedor");
  return c;
};

export const clamp = (v: number, a = 0, b = 1): number => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, k: number): number => a + (b - a) * k;
export const easeOut = (k: number): number => 1 - Math.pow(1 - clamp(k), 3);
export const easeInOut = (k: number): number => { const x = clamp(k); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };

/** Reloj de la escena: fotograma local, segundos y retraso escalado por el ritmo (`a(0.7)` = 0,7 s a ritmo normal). */
export function useReloj(): { f: number; t: number; a: (x: number) => number; ritmo: number; dur: number } {
  const f = useCurrentFrame();
  const { ritmo, dur } = useViral();
  return { f, t: f / FPS, a: (x) => x * ritmo, ritmo, dur };
}

/** spring 0→1 (con ligero rebote) que arranca a los `delay` segundos. */
export function spr(f: number, delay: number, cfg: { damping?: number; stiffness?: number; mass?: number } = {}): number {
  const fr = f - delay * FPS;
  return fr <= 0 ? 0 : spring({ frame: fr, fps: FPS, config: { damping: 13, stiffness: 150, mass: 0.7, ...cfg } });
}
/** 0→1 lineal con easing suave entre `ini` y `ini + dur` segundos. */
export const prog = (t: number, ini: number, dur: number): number => easeOut((t - ini) / Math.max(0.0001, dur));

/** 1234.5 → «1.234,5» (formato es-CO sin depender de la configuración regional del navegador). */
export function fmtNum(n: number, dec = 0): string {
  const s = Math.abs(n).toFixed(dec);
  const [e, d] = s.split(".");
  const miles = e.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return (n < 0 ? "-" : "") + miles + (d ? "," + d : "");
}
/** ¿El texto es un año (1900–2099)? Se muestra tal cual, sin separador de miles ni cuenta. */
export const esAnio = (s: string): boolean => /^(19|20)\d{2}$/.test(s.trim());
/** «1.200» / «3,5» → número y cantidad de decimales. */
export function leerNumero(s: string): { v: number; dec: number } {
  let t = s;
  if (t.includes(".") && t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, "");
  else t = t.replace(",", ".");
  const v = parseFloat(t) || 0;
  return { v, dec: (t.split(".")[1] ?? "").length };
}

/* ───────────── texto ───────────── */

const norm = (s: string): string => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^\p{L}\p{N}%$+]/gu, "");

/** Envuelve las palabras en líneas de a lo sumo `maxCar` caracteres (voraz). Devuelve null si alguna palabra sola no cabe. */
function envolver(ps: string[], maxCar: number): string[][] | null {
  const lineas: string[][] = [];
  let actual: string[] = [];
  let largo = 0;
  for (const p of ps) {
    if (p.length > maxCar) return null;
    if (actual.length && largo + 1 + p.length > maxCar) { lineas.push(actual); actual = []; largo = 0; }
    largo += (actual.length ? 1 : 0) + p.length;
    actual.push(p);
  }
  lineas.push(actual);
  return lineas;
}

/** Reparte las palabras en `n` líneas lo más parejas posible sin pasar de `maxCar` caracteres por línea (si no se puede, null). */
function equilibrar(ps: string[], n: number, maxCar: number): string[][] | null {
  const total = ps.join(" ").length;
  const meta = total / n;
  const lineas: string[][] = [];
  let actual: string[] = [];
  let largo = 0;
  for (const p of ps) {
    if (actual.length && largo + p.length + 1 > meta * 1.12 && lineas.length < n - 1) { lineas.push(actual); actual = []; largo = 0; }
    actual.push(p);
    largo += p.length + 1;
  }
  lineas.push(actual);
  return lineas.every((l) => l.join(" ").length <= maxCar) ? lineas : null;
}

/**
 * Busca el MAYOR tamaño de letra (de `maxPx` a `minPx`) con el que el texto cabe en `ancho` px y en `maxLineas` líneas (Inter 900 en mayúsculas ≈ 0,68 em por carácter).
 * Las líneas salen equilibradas. Si ni al tamaño mínimo cabe, se usa el mínimo con las líneas necesarias (nunca se recorta ni se sale del margen).
 */
export function ajustarTexto(texto: string, ancho: number, maxPx: number, minPx: number, maxLineas: number, k = 0.68): { lineas: string[][]; px: number } {
  const ps = texto.split(/\s+/).filter(Boolean);
  if (!ps.length) return { lineas: [[]], px: minPx };
  for (let px = maxPx; px >= minPx; px -= 2) {
    const maxCar = Math.floor(ancho / (px * k));
    const v = envolver(ps, maxCar);
    if (v && v.length <= maxLineas) return { lineas: equilibrar(ps, v.length, maxCar) ?? v, px };
  }
  const maxCar = Math.max(6, Math.floor(ancho / (minPx * k)));
  const v = envolver(ps, maxCar) ?? ps.map((p) => [p]);
  return { lineas: v, px: minPx };
}

type PropsTexto = {
  texto: string;
  destacada?: string;
  /** centro vertical del bloque (px) */
  y: number;
  maxPx: number;
  minPx?: number;
  maxLineas?: number;
  delay?: number;
  ancho?: number;
  color?: string;
  /** palabra destacada: caja de color (true) o solo color de acento (false) */
  caja?: boolean;
  alinear?: "center" | "left";
  x?: number;
  peso?: number;
  /** entrada con golpe: la palabra llega grande y se asienta */
  golpe?: boolean;
  id?: string;
  /** color de la palabra destacada cuando `caja` es false (por defecto, el acento del tema) */
  colorDestacada?: string;
};

/**
 * Texto cinético: cada palabra entra con spring (y escala / rebote) escalonada; la palabra destacada va en una caja de color ligeramente girada
 * (el recurso típico de los reels) o en color de acento. Se mide el ancho para que nunca toque los márgenes.
 */
export const TextoCinetico: React.FC<PropsTexto> = ({ texto, destacada = "", y, maxPx, minPx = 40, maxLineas = 3, delay = 0.15, ancho = ANCHO_TEXTO, color, caja = true, alinear = "center", x = W / 2, peso = 900, golpe = false, id = "titular", colorDestacada }) => {
  const { f, a } = useReloj();
  const { T, doc } = useViral();
  const { lineas, px } = ajustarTexto(texto, ancho, maxPx, minPx, maxLineas, 0.68 * (doc ? ANCHO_DOC : 1));
  let k = 0;
  const txt = color ?? T.texto;
  return (
    <div data-texto={id} style={{ position: "absolute", left: alinear === "center" ? x - ancho / 2 : x, top: y, width: ancho, transform: "translateY(-50%)", display: "flex", flexDirection: "column", alignItems: alinear === "center" ? "center" : "flex-start", gap: px * 0.06, fontFamily: FUENTE, fontWeight: peso, fontSize: px, lineHeight: 1.02, letterSpacing: "-0.025em", textTransform: "uppercase", color: txt, textAlign: alinear }}>
      {lineas.map((linea, i) => (
        <div key={i} style={{ display: "flex", justifyContent: alinear === "center" ? "center" : "flex-start", gap: px * 0.24, whiteSpace: "nowrap" }}>
          {linea.map((p, j) => {
            const dest = destacada && norm(p) === norm(destacada);
            const n = k++;
            const s = spr(f, a(delay + n * (golpe ? 0.1 : 0.08)), golpe ? { damping: 10, stiffness: 190, mass: 0.6 } : { damping: 13, stiffness: 150, mass: 0.7 });
            const escala = golpe ? 1.7 - 0.7 * s : 0.84 + 0.16 * s;
            return (
              <span key={j} style={{ position: "relative", display: "inline-block", padding: dest && caja ? `${px * 0.02}px ${px * 0.2}px` : 0, margin: dest && caja ? `0 ${-px * 0.04}px` : 0, color: dest ? (caja ? T.sobreAcento : (colorDestacada ?? T.acento)) : txt, opacity: clamp(s * 2), transform: `translateY(${(1 - s) * px * 0.55}px) scale(${escala}) rotate(${dest && caja ? -2.2 * s : 0}deg)`, textShadow: T.oscuro && !(dest && caja) ? "0 8px 30px rgba(0,0,0,0.45)" : "none", transformOrigin: "50% 60%" }}>
                {dest && caja && <span style={{ position: "absolute", inset: 0, background: T.oscuro ? T.acento : T.texto, borderRadius: px * 0.2, zIndex: -1, boxShadow: `0 ${px * 0.12}px ${px * 0.4}px rgba(0,0,0,0.3)` }} />}
                <span style={{ position: "relative", color: dest && caja ? (T.oscuro ? T.sobreAcento : T.bg0) : undefined }}>{p}</span>
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

/** Texto suelto (etiquetas, subtítulos) con entrada suave. Mide para no pasarse de `ancho`. */
export const Etiqueta: React.FC<{ texto: string; x: number; y: number; px: number; ancho?: number; color?: string; delay?: number; peso?: number; alinear?: "center" | "left" | "right"; mayus?: boolean; mono?: boolean; id?: string; opacidad?: number; fondo?: string; relleno?: number }> = ({ texto, x, y, px, ancho = ANCHO_TEXTO, color, delay = 0, peso = 800, alinear = "center", mayus = true, mono = false, id = "etiqueta", opacidad = 1, fondo, relleno = 0 }) => {
  const { f, a } = useReloj();
  const { T, doc } = useViral();
  const s = spr(f, a(delay), { damping: 14, stiffness: 130, mass: 0.7 });
  const kLetra = (mayus ? 0.7 : 0.58) * (doc && !mono ? ANCHO_DOC : 1);
  const tam = Math.min(px, Math.max(24, Math.floor(ancho / (Math.max(1, texto.length) * kLetra))));
  const dy = (1 - s) * 26;
  // el contenedor mide lo que mide el texto (así los márgenes se cumplen de verdad y el QA mide texto real)
  const pos: React.CSSProperties = alinear === "center" ? { left: x, transform: `translate(-50%, calc(-50% + ${dy}px))` } : alinear === "left" ? { left: x, transform: `translateY(calc(-50% + ${dy}px))` } : { left: x, transform: `translate(-100%, calc(-50% + ${dy}px))` };
  return (
    <div data-texto={id} style={{ position: "absolute", top: y, width: "max-content", maxWidth: ancho, ...pos, textAlign: alinear, opacity: clamp(s * 1.8) * opacidad, pointerEvents: "none" }}>
      <span style={{ display: "inline-block", fontFamily: mono ? MONO : FUENTE, fontWeight: peso, fontSize: tam, letterSpacing: mayus ? "0.02em" : "-0.01em", textTransform: mayus ? "uppercase" : "none", color: color ?? T.texto, whiteSpace: "nowrap", lineHeight: 1.1, background: fondo, padding: fondo ? `${relleno * 0.45}px ${relleno}px` : 0, borderRadius: 999 }}>{texto}</span>
    </div>
  );
};

/** Línea mono que se escribe sola (máquina de escribir); las palabras entre *asteriscos* van en el color de datos. El texto completo ocupa su sitio desde el inicio (sin saltos de línea). */
export const LineaCap: React.FC<{ texto: string; y: number; x?: number; ancho?: number; px?: number; alinear?: "center" | "left"; delay?: number; cps?: number; id?: string; color?: string }> = ({ texto, y, x = W / 2, ancho = ANCHO_TEXTO, px = 34, alinear = "center", delay = 0.2, cps = 34, id = "cap", color }) => {
  const { t, a } = useReloj();
  const { T } = useViral();
  const partes = texto.split("*").map((s, i) => ({ s, res: i % 2 === 1 })).filter((p) => p.s);
  const total = partes.reduce((n, p) => n + p.s.length, 0);
  const visibles = Math.max(0, Math.floor((t - a(delay)) * cps));
  const resalte = T.neon ?? T.acento;
  let idx = 0;
  const left = alinear === "center" ? x - ancho / 2 : x;
  return (
    <div data-texto={id} style={{ position: "absolute", left, top: y, width: ancho, transform: "translateY(-50%)", fontFamily: MONO, fontWeight: 400, fontSize: px, lineHeight: 1.42, textAlign: alinear, color: color ?? T.texto, whiteSpace: "pre-wrap", pointerEvents: "none" }}>
      {partes.map((p, i) => (
        <span key={i} style={{ color: p.res ? resalte : undefined, fontWeight: p.res ? 700 : 400 }}>
          {p.s.split("").map((ch) => { const k = idx++; return <span key={k} style={{ opacity: k < visibles ? 1 : 0 }}>{ch}</span>; })}
        </span>
      ))}
      {visibles < total && visibles > 0 && <span style={{ position: "absolute", marginLeft: 2, opacity: Math.floor(t * 4) % 2 ? 1 : 0.2, color: resalte }}>▍</span>}
    </div>
  );
};

/* ───────────── iconos y esferas ───────────── */

/** Icono lucide centrado en (x, y), dentro de un <svg>. */
export const IconoSvg: React.FC<{ nombre: string; x: number; y: number; tam: number; color: string }> = ({ nombre, x, y, tam, color }) => {
  const f = useCurrentFrame();
  return <g transform={`translate(${x} ${y}) scale(${tam / 100})`}>{ICONOS_PROPIOS.has(nombre) ? iconoPropio(nombre, color, f) : dibujarIcono(iconoReal(nombre), color)}</g>;
};

/** Iconos propios del motor viral (caja de 100×100 centrada en el origen): luna, átomo, bicho (tipo tardígrado) y planeta con anillo. */
function iconoPropio(nombre: string, color: string, f = 0): React.ReactNode {
  const trazo = { fill: "none", stroke: color, strokeWidth: 6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (nombre) {
    case "luna":
      return (
        <g>
          <path d="M 8,-42 A 42 42 0 1 0 40,20 A 34 34 0 0 1 8,-42 Z" {...trazo} fill={color} fillOpacity={0.3} />
          <circle cx={-10} cy={10} r={5} fill={color} fillOpacity={0.6} />
          <circle cx={6} cy={26} r={3.4} fill={color} fillOpacity={0.6} />
          <circle cx={-22} cy={-12} r={3} fill={color} fillOpacity={0.6} />
        </g>
      );
    case "atomo":
      return (
        <g>
          {[0, 60, 120].map((g) => <ellipse key={g} rx={44} ry={16} transform={`rotate(${g})`} {...trazo} strokeWidth={5} />)}
          <circle r={8} fill={color} />
        </g>
      );
    case "bicho":
      return (
        <g>
          {/* las ocho patas caminan: cada una oscila con su propia fase */}
          {[-1, 1].map((lado) => [-24, -8, 8, 24].map((x, i) => { const w = Math.sin(f / 5 + i * 1.6 + (lado > 0 ? Math.PI : 0)) * 7; return <path key={`${lado}${i}`} d={`M ${x * 0.9} ${lado * 16} q ${(i - 1.5) * 3 + w * 0.5} ${lado * 14} ${(i - 1.5) * 6 + w} ${lado * 22}`} {...trazo} strokeWidth={7} />; }))}
          <ellipse rx={38} ry={24} {...trazo} fill={color} fillOpacity={0.3} />
          <circle cx={30} cy={-4} r={4.4} fill={color} />
          <path d="M 36,6 q 6,2 10,0" {...trazo} strokeWidth={4} />
        </g>
      );
    case "concha": {
      // espiral logarítmica (concha de caracol) con su abertura
      const pts = Array.from({ length: 90 }, (_, i) => { const th = (i / 89) * Math.PI * 5.2; const r = 3 + 40 * Math.exp((th - Math.PI * 5.2) * 0.34); return `${(r * Math.cos(th - 1.2) + 6).toFixed(1)},${(r * Math.sin(th - 1.2) * 0.92).toFixed(1)}`; }).join(" ");
      return (
        <g>
          <polyline points={pts} {...trazo} strokeWidth={9} />
          <polyline points={pts} fill="none" stroke={color} strokeOpacity={0.35} strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      );
    }
    case "planeta":
      return (
        <g>
          <circle r={25} {...trazo} fill={color} fillOpacity={0.3} />
          <ellipse rx={48} ry={13} transform="rotate(-22)" {...trazo} strokeWidth={5} />
        </g>
      );
    default:
      return <circle r={30} {...trazo} />;
  }
}

/** Esfera de cristal (degradado de volumen + semitono + brillo especular) con un icono blanco dentro. Va dentro de un <svg> con <StudioSvgDefs/>. */
export const EsferaIcono: React.FC<{ nombre: string; x: number; y: number; d: number; color: string; delay?: number; flota?: number; colorIcono?: string }> = ({ nombre, x, y, d, color, delay = 0, flota = 0, colorIcono = "#FFFFFF" }) => {
  const { f, a } = useReloj();
  const uid = useUid();
  const s = spr(f, a(delay), { damping: 9, stiffness: 150, mass: 0.7 });
  const R = d / 2;
  const dy = flota ? Math.sin(f / 38 + x) * flota : 0;
  const forma = caminoCirculo(0, 0, R);
  return (
    <g transform={`translate(${x} ${y + dy}) scale(${Math.max(0.0001, s)})`} opacity={clamp(s * 2)}>
      <defs>
        <radialGradient id={`${uid}g`} cx="34%" cy="28%" r="82%">
          <stop offset="0" stopColor={aclarar(color, 0.42)} />
          <stop offset="0.5" stopColor={color} />
          <stop offset="1" stopColor={oscurecer(color, 0.45)} />
        </radialGradient>
      </defs>
      <circle r={R} fill={`url(#${uid}g)`} />
      <path d={forma} fill="url(#halftone-dots-m)" mask="url(#halftone-shadow)" />
      <SpecularHighlight cx={0} cy={0} rx={R * 0.8} ry={R * 0.8} />
      <IconoSvg nombre={nombre} x={0} y={0} tam={d * 0.46} color={colorIcono} />
    </g>
  );
};

/* ───────────── paneles y decoración ───────────── */

/** Tarjeta de cristal: relleno translúcido, borde fino y brillo superior. Dentro de un <svg>. */
export const Panel: React.FC<{ x: number; y: number; w: number; h: number; r?: number; relleno?: string; borde?: string; sombra?: boolean; brillo?: boolean }> = ({ x, y, w, h, r = 44, relleno, borde, sombra = true, brillo = true }) => {
  const { T } = useViral();
  const uid = useUid();
  return (
    <g>
      {sombra && [0, 1, 2, 3, 4].map((k) => <rect key={k} x={x - k * 6 + 4} y={y + 10 + k * 4} width={w + k * 12} height={h + k * 8} rx={r + k * 6} fill="#000" opacity={(T.oscuro ? 0.075 : 0.03)} />)}
      <rect x={x} y={y} width={w} height={h} rx={r} fill={relleno ?? T.panel} stroke={borde ?? T.borde} strokeWidth={2.5} />
      {brillo && (
        <>
          <defs><linearGradient id={`${uid}b`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity={T.oscuro ? 0.16 : 0.5} /><stop offset="0.5" stopColor="#fff" stopOpacity={0} /></linearGradient></defs>
          <rect x={x + 2} y={y + 2} width={w - 4} height={h * 0.5} rx={r - 2} fill={`url(#${uid}b)`} />
        </>
      )}
    </g>
  );
};

/** Chispas: `n` puntos que salen disparados desde (x, y) a partir de `t0` y se desvanecen. */
export const Confeti: React.FC<{ x: number; y: number; t0: number; n?: number; radio?: number; colores?: string[]; semilla?: number }> = ({ x, y, t0, n = 22, radio = 360, colores, semilla = 1 }) => {
  const { f, a } = useReloj();
  const { T } = useViral();
  const k = (f / FPS - a(t0)) / 1.3;
  if (k <= 0 || k >= 1) return null;
  const paleta = colores ?? [T.acento, T.texto, T.acento2];
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const ang = azar(i * 3.7 + semilla) * Math.PI * 2;
        const v = 0.45 + azar(i * 5.1 + semilla) * 0.55;
        const e = easeOut(k);
        const px = x + Math.cos(ang) * radio * v * e;
        const py = y + Math.sin(ang) * radio * v * e + 160 * k * k;
        const w = 9 + azar(i * 7.3 + semilla) * 14;
        return <rect key={i} x={px - w / 2} y={py - w / 4} width={w} height={w / 2} rx={w / 5} fill={paleta[i % paleta.length]} opacity={(1 - k) * 0.95} transform={`rotate(${(azar(i + semilla) * 360 + k * 380) % 360} ${px} ${py})`} />;
      })}
    </g>
  );
};

/** Línea de acento que se dibuja de izquierda a derecha. */
export const Subrayado: React.FC<{ x: number; y: number; w: number; delay?: number; grosor?: number; color?: string }> = ({ x, y, w, delay = 0, grosor = 12, color }) => {
  const { t, a } = useReloj();
  const { T } = useViral();
  const p = prog(t, a(delay), 0.5);
  return <rect x={x - w / 2} y={y} width={w * p} height={grosor} rx={grosor / 2} fill={color ?? T.acento} />;
};

export { aclarar, oscurecer, mezclar };

/** Punto de un camino SVG a `largo` px de su inicio (nunca nulo). */
export const puntoEn = (d: string, largo: number): { x: number; y: number } => getPointAtLength(d, Math.max(0, largo)) ?? { x: 0, y: 0 };

/** Punto de una circunferencia: centro (cx, cy), radio r, ángulo en grados (0° = derecha, sentido horario en pantalla). */
export const polarXY = (cx: number, cy: number, r: number, grados: number): [number, number] => [cx + r * Math.cos((grados * Math.PI) / 180), cy + r * Math.sin((grados * Math.PI) / 180)];
