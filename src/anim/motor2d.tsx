import React from "react";
import { Easing } from "remotion";
import { evolvePath } from "@remotion/paths";
import { FUENTE, H, W } from "../lib/colores";
import { azar, easeRetro, onda, pop, prog, resorte, useT } from "../lib/anim";
import { dibujarIcono } from "../dsl/elementos/dibujo";
import { useColor, useTema } from "./contexto";
import { luminancia } from "./paletas";
import { medidorActivo, valorMedidor, normMedidor } from "./retro";
import type { Ambiente, Elemento2D, Medidor } from "./tipos";

/* ───────────────────────── estilo retro: título, terminal y HUD ───────────────────────── */

const MONO = "'JetBrains Mono', ui-monospace, Menlo, Consolas, monospace";
/** Velocidad del efecto terminal: 30 ms por carácter. Parpadeo del cursor al terminar la frase: 250 ms. */
const S_CARACTER = 0.03;
const S_PARPADEO = 0.25;

/**
 * Texto de terminal: aparece carácter por carácter precedido por un bloque sólido (0,6 em × 1,1 em) que, al terminar la frase, parpadea cada 250 ms.
 * Las medidas son exactas porque JetBrains Mono avanza 0,6 em por carácter.
 */
export const TerminalTexto: React.FC<{ texto: string; x: number; y: number; tam: number; color: string; alinear: "centro" | "izquierda"; t0: number; franja?: string | null; cursor: string }> = ({ texto, x, y, tam, color, alinear, t0, franja, cursor }) => {
  const t = useT();
  if (t < t0) return null;
  const total = texto.length;
  const escritos = Math.min(total, Math.floor((t - t0) / S_CARACTER));
  const lineas = texto.split("\n");
  const w = Math.max(...lineas.map((l) => l.length), 1) * tam * 0.6;
  const lh = tam * 1.4;
  const x0 = alinear === "centro" ? x - w / 2 : x;
  const arriba = y - (lineas.length * lh) / 2;
  const vistos = texto.slice(0, escritos).split("\n");
  const li = vistos.length - 1;
  const col = vistos[li].length;
  const terminado = escritos >= total;
  // al escribir, el bloque está fijo; al terminar parpadea (250 ms encendido / 250 ms apagado)
  const visible = !terminado || Math.floor((t - t0 - total * S_CARACTER) / S_PARPADEO) % 2 === 0;
  return (
    <g>
      {franja && <rect x={x0 - 18} y={arriba - 8} width={w + 40} height={lineas.length * lh + 16} rx={6} fill={franja} />}
      <text data-texto="terminal" fontFamily={MONO} fontWeight={700} fontSize={tam} fill={color} xmlSpace="preserve">
        {vistos.map((l, i) => (
          <tspan key={i} x={x0} y={arriba + (i + 0.5) * lh} dominantBaseline="central">
            {l}
          </tspan>
        ))}
      </text>
      {visible && <rect x={x0 + col * tam * 0.6} y={arriba + (li + 0.5) * lh - tam * 0.55} width={tam * 0.6} height={tam * 1.1} fill={cursor} />}
    </g>
  );
};

/** H1 retro: Inter Black, MAYÚSCULAS, tracking -0.03em, centrado, bloque centrado en Y = 180. */
const TituloRetro: React.FC<{ texto: string; tam: number }> = ({ texto, tam }) => {
  const t = useT();
  const c = useColor();
  const { paleta } = useTema();
  const p = prog(t, 0.05, 0.7, easeRetro);
  if (p <= 0.001) return null;
  const lineas = texto.split("\n");
  const alto = lineas.length * tam;
  return (
    <g opacity={Math.min(1, p * 1.5)} transform={`translate(0 ${(1 - p) * -36})`}>
      <text data-texto="titulo" x={W / 2} textAnchor="middle" fontFamily={FUENTE} fontWeight={900} fontSize={tam} fill={c("tinta")} style={{ letterSpacing: "-0.03em" }}>
        {lineas.map((l, i) => (
          <tspan key={i} x={W / 2} y={180 - alto / 2 + (i + 0.5) * tam} dominantBaseline="central">
            {l}
          </tspan>
        ))}
      </text>
      <rect x={W / 2 - 48} y={180 + alto / 2 + 10} width={96} height={4} fill={c("acento") === c("tinta") ? paleta.oscuro.acento : c("acento")} />
    </g>
  );
};

const ARCO_INI = -120, ARCO_FIN = 120; // grados desde la vertical: 240° de recorrido

const Medidor2D: React.FC<{ m: Medidor; cx: number; activo: boolean; t: number }> = ({ m, cx, activo, t }) => {
  const { paleta } = useTema();
  const k = paleta.oscuro; // el HUD siempre va sobre panel oscuro
  const w = 280, x0 = cx - w / 2, y0 = 1500, h = 360, cy = 1672, R = 98;
  const norm = normMedidor(m, t);
  const v = valorMedidor(m, t);
  const ang = ARCO_INI + (ARCO_FIN - ARCO_INI) * norm;
  const pt = (deg: number, r: number) => ({ x: cx + Math.sin((deg * Math.PI) / 180) * r, y: cy - Math.cos((deg * Math.PI) / 180) * r });
  const arco = (a0: number, a1: number, r: number) => {
    const A = pt(a0, r), B = pt(a1, r);
    return `M ${A.x} ${A.y} A ${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${B.x} ${B.y}`;
  };
  const punta = pt(ang, R * 0.88);
  const cola = pt(ang + 180, R * 0.14);
  const fmt = miles(v, m.decimales);
  return (
    // activo: borde lima 6 px; inactivo: borde 2 px y todo el medidor a opacidad 0,4 (cambia en el mismo fotograma que la aguja)
    <g opacity={activo ? 1 : 0.4}>
      <rect x={x0} y={y0} width={w} height={h} rx={14} fill={k.fondoBorde} stroke={activo ? k.acento : k.suave} strokeWidth={activo ? 6 : 2} />
      <text data-texto="medidor" x={cx} y={y0 + 40} textAnchor="middle" dominantBaseline="central" fontFamily={MONO} fontWeight={700} fontSize={22} fill={k.tinta}>
        {m.etiqueta}
      </text>
      <path d={arco(ARCO_INI, ARCO_FIN, R)} fill="none" stroke={k.suave} strokeWidth={3} strokeDasharray="6 6" />
      {norm > 0.002 && <path d={arco(ARCO_INI, ang, R)} fill="none" stroke={k.acento} strokeWidth={5} />}
      {Array.from({ length: 11 }, (_, i) => {
        const a = ARCO_INI + ((ARCO_FIN - ARCO_INI) * i) / 10;
        const A = pt(a, R + 6), B = pt(a, R + (i % 5 === 0 ? 20 : 13));
        return <line key={i} x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={k.tinta} strokeWidth={i % 5 === 0 ? 3 : 2} />;
      })}
      <line x1={cola.x} y1={cola.y} x2={punta.x} y2={punta.y} stroke={k.primario} strokeWidth={5} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={9} fill={k.tinta} stroke={k.fondoBorde} strokeWidth={3} />
      <text data-texto="medidor" x={cx} y={y0 + 314} textAnchor="middle" dominantBaseline="central" fontFamily={MONO} fontWeight={700} fontSize={fmt.length > 7 ? 38 : 46} fill={k.acento} style={{ fontVariantNumeric: "tabular-nums" }}>
        {fmt}
        {m.unidad ? <tspan fontSize={22} fill={k.tinta}> {m.unidad}</tspan> : null}
      </text>
      <text data-texto="medidor" x={x0 + 26} y={cy + R * 0.82 + 22} textAnchor="start" dominantBaseline="central" fontFamily={MONO} fontSize={16} fill={k.suave}>
        {miles(m.min, m.decimales)}
      </text>
      <text data-texto="medidor" x={x0 + w - 26} y={cy + R * 0.82 + 22} textAnchor="end" dominantBaseline="central" fontFamily={MONO} fontSize={16} fill={k.suave}>
        {miles(m.max, m.decimales)}
      </text>
    </g>
  );
};

/** Panel HUD fijo (y 1450–1920) con hasta 3 medidores alineados horizontalmente. */
const HudRetro: React.FC<{ medidores: Medidor[] }> = ({ medidores }) => {
  const t = useT();
  const { paleta } = useTema();
  const k = paleta.oscuro;
  const p = prog(t, 0.1, 0.7, easeRetro);
  const n = medidores.length;
  const total = n * 280 + (n - 1) * 30;
  const ini = 540 - total / 2;
  return (
    <g opacity={Math.min(1, p * 1.6)} transform={`translate(0 ${(1 - p) * 70})`}>
      <rect x={0} y={1450} width={W} height={H - 1450} fill={k.fondoBorde} />
      <line x1={0} x2={W} y1={1450} y2={1450} stroke={k.suave} strokeWidth={3} strokeDasharray="6 6" />
      {medidores.map((m, i) => (
        <Medidor2D key={i} m={m} cx={ini + 140 + i * 310} activo={medidorActivo(m, t)} t={t} />
      ))}
    </g>
  );
};

/** Capa retro de una escena: título, subtítulo de terminal y HUD. Va encima de todo. */
export const CapaRetro: React.FC<{ titulo?: string; tituloTam?: number; subtitulo?: string | null; medidores?: Medidor[] }> = ({ titulo, tituloTam = 80, subtitulo, medidores = [] }) => {
  const { paleta, tema } = useTema();
  const c = useColor();
  const claro = tema === "claro";
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
      {titulo ? <TituloRetro texto={titulo} tam={tituloTam} /> : null}
      {subtitulo ? (
        <TerminalTexto texto={subtitulo} x={W / 2} y={300} tam={30} color={claro ? paleta.oscuro.acento : c("acento")} alinear="centro" t0={0.7} franja={claro ? paleta.oscuro.fondoBorde : null} cursor={paleta.oscuro.acento} />
      ) : null}
      {medidores.length ? <HudRetro medidores={medidores} /> : null}
    </svg>
  );
};

/* ───────────────────────── fondo ───────────────────────── */

/** Estilo de un texto: el amarillo (acento) sobre fondo claro se contorna con el navy de la marca para que se lea y conserve el hex oficial. */
const useEstiloTexto = () => {
  const c = useColor();
  const { tema } = useTema();
  return (token: string, tam: number): React.SVGAttributes<SVGTextElement> => {
    const fill = c(token);
    if (tema === "claro" && token === "acento" && luminancia(fill) > 0.6) return { fill, stroke: c("primario"), strokeWidth: Math.max(2, tam * 0.07), paintOrder: "stroke", strokeLinejoin: "round" };
    return { fill };
  };
};

export const Fondo2D: React.FC<{ ambiente: Ambiente; id: string; solido?: boolean }> = ({ ambiente, id, solido }) => {
  const t = useT();
  const c = useColor();
  const { paleta, tema } = useTema();
  const col = tema === "claro" ? paleta.claro : paleta.oscuro;
  const desp = (t * 9) % 80;
  const retro = paleta.estilo === "retro";
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
      <defs>
        {/* retro: trama de puntos de semitono a 45° (en vez de la cuadrícula de líneas) */}
        <pattern id={`pt-${id}`} width="54" height="54" patternUnits="userSpaceOnUse" patternTransform={`rotate(45) translate(${desp * 0.5} 0)`}>
          <circle cx="27" cy="27" r="2.6" fill={c("suave")} />
        </pattern>
        <radialGradient id={`fg-${id}`} cx="50%" cy="42%" r="75%">
          <stop offset="0" stopColor={solido ? col.fondoBorde : col.fondoCentro} />
          <stop offset="1" stopColor={col.fondoBorde} />
        </radialGradient>
        <pattern id={`rej-${id}`} width="80" height="80" patternUnits="userSpaceOnUse" patternTransform={`translate(${desp} ${desp})`}>
          <path d="M 80 0 L 0 0 L 0 80" fill="none" stroke={c("suave")} strokeWidth="2" />
        </pattern>
      </defs>
      <rect width={W} height={H} fill={retro ? col.fondoBorde : `url(#fg-${id})`} />
      {ambiente === "cuadricula" && !retro && <rect width={W} height={H} fill={`url(#rej-${id})`} opacity={tema === "claro" ? 0.22 : 0.16} />}
      {ambiente === "cuadricula" && retro && <rect width={W} height={H} fill={`url(#pt-${id})`} opacity={tema === "claro" ? 0.35 : 0.3} />}
      {ambiente === "particulas" &&
        Array.from({ length: 34 }, (_, i) => {
          const vel = 14 + azar(i + 9) * 30;
          const y = (((azar(i + 40) * H - t * vel) % H) + H) % H;
          const x = azar(i + 1) * W + Math.sin(t * 0.7 + i) * 18;
          return <circle key={i} cx={x} cy={y} r={2 + azar(i + 70) * 4.5} fill={i % 7 === 0 ? c("acento") : c("suave")} opacity={0.18 + 0.3 * azar(i + 5)} />;
        })}
      {ambiente === "aros" &&
        Array.from({ length: 5 }, (_, i) => {
          const k = (t * 0.16 + i / 5) % 1;
          return <circle key={i} cx={W / 2} cy={H * 0.5} r={120 + k * 900} fill="none" stroke={c("suave")} strokeWidth={3} opacity={(1 - k) * 0.35} />;
        })}
      {ambiente === "lineas" &&
        Array.from({ length: 14 }, (_, i) => {
          const x = (((i * 140 + t * 30) % (W + 600)) - 300);
          return <line key={i} x1={x} y1={0} x2={x - 520} y2={H} stroke={c("suave")} strokeWidth={2} opacity={0.14} />;
        })}
    </svg>
  );
};

/* ───────────────────────── envoltorio de entrada ───────────────────────── */

const Entrada: React.FC<{ el: Elemento2D; children: React.ReactNode }> = ({ el, children }) => {
  const t = useT();
  if (t < el.t) return null;
  const fuera = el.hasta != null ? 1 - prog(t, el.hasta, 0.3) : 1;
  if (fuera <= 0.001) return null;
  const { paleta } = useTema();
  const retro = paleta.estilo === "retro";
  // retro: movimiento mecánico y preciso con cubic-bezier(0.22,1,0.36,1); nada de rebotes ni elásticos
  const entra = retro ? prog(t, el.t, 0.7, easeRetro) : prog(t, el.t, 0.4);
  const k = el.entrada as string;
  const r = retro ? entra : k === "pop" || k === "crecer" ? (k === "pop" ? pop(t, el.t) : resorte(t, el.t, { damping: 15, stiffness: 120 })) : entra;
  let transform: string | undefined;
  if (k === "pop") transform = `scale(${retro ? 0.8 + 0.2 * r : 0.55 + 0.45 * r})`;
  else if (k === "crecer") transform = `scale(${r})`;
  else if (k === "deslizar-arriba") transform = `translate(0px, ${(1 - entra) * 90}px)`;
  else if (k === "deslizar-abajo") transform = `translate(0px, ${-(1 - entra) * 90}px)`;
  else if (k === "deslizar-izq") transform = `translate(${(1 - entra) * 120}px, 0px)`;
  else if (k === "deslizar-der") transform = `translate(${-(1 - entra) * 120}px, 0px)`;
  return (
    <g opacity={Math.min(entra * 1.4, 1) * fuera} style={{ transformBox: "fill-box", transformOrigin: "center", transform }}>
      {children}
    </g>
  );
};

/* ───────────────────────── utilidades ───────────────────────── */

const miles = (v: number, dec: number): string => {
  const [ent, frac] = Math.abs(v).toFixed(dec).split(".");
  const g = ent.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${v < 0 ? "-" : ""}${g}${frac ? "," + frac : ""}`;
};

const suave = (t: number, ini: number, dur: number) => prog(t, ini, dur, Easing.inOut(Easing.cubic));

/** Polilínea → path (recta o curva Catmull-Rom). */
function rutaDePuntos(p: { x: number; y: number }[], curva: boolean): string {
  if (!curva || p.length < 3) return p.map((q, i) => `${i ? "L" : "M"} ${q.x} ${q.y}`).join(" ");
  let d = `M ${p[0].x} ${p[0].y}`;
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[i - 1] ?? p[i], b = p[i], cc = p[i + 1], e = p[i + 2] ?? cc;
    d += ` C ${b.x + (cc.x - a.x) / 6} ${b.y + (cc.y - a.y) / 6}, ${cc.x - (e.x - b.x) / 6} ${cc.y - (e.y - b.y) / 6}, ${cc.x} ${cc.y}`;
  }
  return d;
}

const TrazoDibujado: React.FC<{ d: string; color: string; grosor: number; ini: number; dur: number; brillo?: boolean; relleno?: string | null; punteado?: boolean }> = ({ d, color, grosor, ini, dur, brillo, relleno, punteado }) => {
  const t = useT();
  const retro = useTema().paleta.estilo === "retro";
  const p = retro ? prog(t, ini, dur, easeRetro) : suave(t, ini, dur);
  if (p <= 0.001) return null;
  // punteado retro: trazo discontinuo 6,6 que se «recorre» con el avance (se revela con una máscara de dash largo)
  const evo = punteado ? { strokeDasharray: "6 6" } : evolvePath(p, d);
  return (
    <g>
      {relleno && <path d={d} fill={relleno} fillOpacity={0.28 * prog(t, ini + dur * 0.7, 0.5)} stroke="none" />}
      {brillo && <path d={d} fill="none" stroke={color} strokeWidth={grosor * 2.6} opacity={0.16} strokeLinecap="round" strokeLinejoin="round" {...evo} />}
      <path d={d} fill="none" stroke={color} strokeWidth={grosor} strokeLinecap="round" strokeLinejoin="round" {...evo} />
    </g>
  );
};

/* ───────────────────────── elementos ───────────────────────── */

type P = { el: Elemento2D };

const Texto: React.FC<P> = ({ el }) => {
  const estilo = useEstiloTexto();
  const lineas = String(el.texto).split("\n");
  const alto = lineas.length * el.tam * 1.2;
  const anchor = el.alinear === "izquierda" ? "start" : el.alinear === "derecha" ? "end" : "middle";
  return (
    <text data-texto={`texto`} x={el.x} textAnchor={anchor} fontFamily={FUENTE} fontWeight={el.peso} fontSize={el.tam} {...estilo(el.color, el.tam)} style={{ letterSpacing: el.tam > 90 ? -1.5 : 0 }}>
      {lineas.map((l, i) => (
        <tspan key={i} x={el.x} y={el.y - alto / 2 + (i + 0.5) * el.tam * 1.2} dominantBaseline="central">
          {l}
        </tspan>
      ))}
    </text>
  );
};

const Forma: React.FC<P> = ({ el }) => {
  const c = useColor();
  const col = c(el.color);
  const { x, y, w, h } = el;
  const comun = { fill: el.relleno ? col : "none", fillOpacity: el.relleno ? 0.88 : 0, stroke: el.borde > 0 ? col : "none", strokeWidth: el.borde, strokeLinejoin: "round" as const };
  const poli = (n: number, rot: number, inner = 1) =>
    Array.from({ length: n * (inner < 1 ? 2 : 1) }, (_, i) => {
      const paso = inner < 1 ? Math.PI / n : (Math.PI * 2) / n;
      const a = rot + i * paso;
      const k = inner < 1 && i % 2 ? inner : 1;
      return `${x + Math.cos(a) * (w / 2) * k},${y + Math.sin(a) * (h / 2) * k}`;
    }).join(" ");
  switch (el.forma) {
    case "circulo":
      return <circle cx={x} cy={y} r={Math.min(w, h) / 2} {...comun} />;
    case "elipse":
      return <ellipse cx={x} cy={y} rx={w / 2} ry={h / 2} {...comun} />;
    case "redondeado":
      return <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={Math.min(w, h) * 0.2} {...comun} />;
    case "estrella":
      return <polygon points={poli(5, -Math.PI / 2, 0.45)} {...comun} />;
    case "hexagono":
      return <polygon points={poli(6, 0)} {...comun} />;
    case "triangulo":
      return <polygon points={poli(3, -Math.PI / 2)} {...comun} />;
    default:
      return <rect x={x - w / 2} y={y - h / 2} width={w} height={h} {...comun} />;
  }
};

const Icono: React.FC<P> = ({ el }) => {
  const c = useColor();
  const col = c(el.color);
  const r = el.tam * 0.72;
  return (
    <g transform={`translate(${el.x} ${el.y})`}>
      {el.fondo && <circle r={r} fill={col} fillOpacity={0.14} stroke={col} strokeWidth={4} strokeOpacity={0.6} />}
      <g transform={`scale(${el.tam / 100})`}>{dibujarIcono(el.nombre, col)}</g>
    </g>
  );
};

const Linea: React.FC<P> = ({ el }) => {
  const c = useColor();
  const t = useT();
  const d = rutaDePuntos(el.puntos, el.curva);
  const col = c(el.color);
  const n = el.puntos.length;
  const a = el.puntos[n - 2], b = el.puntos[n - 1];
  const ang = Math.atan2(b.y - a.y, b.x - a.x);
  const L = 22 + el.grosor * 2;
  const pf = suave(t, el.t + el.dur * 0.85, 0.3);
  return (
    <g>
      <TrazoDibujado d={d} color={col} grosor={el.grosor} ini={el.t} dur={el.dur} brillo={!el.punteado} punteado={el.punteado} />
      {el.flecha && pf > 0.01 && (
        <path
          d={`M ${b.x - Math.cos(ang - 0.5) * L} ${b.y - Math.sin(ang - 0.5) * L} L ${b.x} ${b.y} L ${b.x - Math.cos(ang + 0.5) * L} ${b.y - Math.sin(ang + 0.5) * L}`}
          fill="none" stroke={col} strokeWidth={el.grosor} strokeLinecap="round" strokeLinejoin="round" opacity={pf}
        />
      )}
    </g>
  );
};

const Trazo2D: React.FC<P> = ({ el }) => {
  const c = useColor();
  return <TrazoDibujado d={el.d} color={c(el.color)} grosor={el.grosor} ini={el.t} dur={el.dur} brillo={el.brillo} relleno={el.relleno ? c(el.relleno) : null} punteado={el.punteado} />;
};

const Plano: React.FC<P> = ({ el }) => {
  const c = useColor();
  const estilo = useEstiloTexto();
  const t = useT();
  const col = c(el.color);
  const x0 = el.x - el.w / 2, y0 = el.y - el.h / 2;
  const hab = el.habitaciones as { nombre: string; x: number; y: number; w: number; h: number; m2: number | null }[];
  const rr = (r: { x: number; y: number; w: number; h: number }) => {
    const a = x0 + (r.x / 100) * el.w, b = y0 + (r.y / 100) * el.h, w = (r.w / 100) * el.w, h = (r.h / 100) * el.h;
    return { a, b, w, h, d: `M ${a} ${b} h ${w} v ${h} h ${-w} Z` };
  };
  const contorno = `M ${x0} ${y0} h ${el.w} v ${el.h} h ${-el.w} Z`;
  const total = hab.every((r) => r.m2 != null) ? hab.reduce((s, r) => s + (r.m2 ?? 0), 0) : null;
  const paso = el.dur * 0.7 / Math.max(1, hab.length);
  const tCotas = el.t + el.dur;
  return (
    <g>
      <rect x={x0} y={y0} width={el.w} height={el.h} fill={col} fillOpacity={0.08 * prog(t, el.t + el.dur * 0.5, 0.8)} />
      <TrazoDibujado d={contorno} color={col} grosor={10} ini={el.t} dur={el.dur * 0.35} brillo />
      {hab.map((r, i) => {
        const g = rr(r);
        const ini = el.t + el.dur * 0.25 + i * paso;
        const op = prog(t, ini + paso * 0.8, 0.4);
        const fs = Math.max(22, Math.min(40, Math.min(g.w, g.h) * 0.17));
        return (
          <g key={i}>
            <TrazoDibujado d={g.d} color={col} grosor={5} ini={ini} dur={paso * 1.1} />
            <g opacity={op}>
              <text data-texto="plano" x={g.a + g.w / 2} y={g.b + g.h / 2 - (r.m2 != null ? fs * 0.4 : 0)} textAnchor="middle" dominantBaseline="central" fontFamily={FUENTE} fontWeight={700} fontSize={fs} fill={c("tinta")}>
                {r.nombre}
              </text>
              {r.m2 != null && (
                <text data-texto="plano" x={g.a + g.w / 2} y={g.b + g.h / 2 + fs * 0.75} textAnchor="middle" dominantBaseline="central" fontFamily={FUENTE} fontWeight={800} fontSize={fs * 0.9} {...estilo("acento", fs * 0.9)}>
                  {miles(r.m2, r.m2 % 1 ? 1 : 0)} m²
                </text>
              )}
            </g>
          </g>
        );
      })}
      {el.cotas && (
        <g opacity={prog(t, tCotas, 0.5)}>
          <path d={`M ${x0} ${y0 - 30} H ${x0 + el.w} M ${x0} ${y0 - 42} V ${y0 - 18} M ${x0 + el.w} ${y0 - 42} V ${y0 - 18}`} stroke={c("acento")} strokeWidth={4} fill="none" strokeLinecap="round" />
          {total != null && (
            <text data-texto="plano" x={x0 + el.w / 2} y={y0 - 62} textAnchor="middle" fontFamily={FUENTE} fontWeight={800} fontSize={34} {...estilo("acento", 34)}>
              Total {miles(total, total % 1 ? 1 : 0)} m²
            </text>
          )}
        </g>
      )}
    </g>
  );
};

const CICLO = ["primario", "acento", "ok", "alerta", "suave", "blanco"];

const Grafica: React.FC<P> = ({ el }) => {
  const c = useColor();
  const t = useT();
  const retro = useTema().paleta.estilo === "retro";
  const datos = el.datos as { etiqueta: string; valor: number }[];
  const x0 = el.x - el.w / 2, y0 = el.y - el.h / 2;
  const max = Math.max(...datos.map((d) => d.valor), 1e-9);
  const total = datos.reduce((s, d) => s + d.valor, 0) || 1;
  const col = c(el.color);
  const n = datos.length;
  const etiqueta = (txt: string, x: number, y: number, tam: number, fill: string, peso = 700, anchor: "middle" | "start" = "middle") => (
    <text data-texto="grafica" x={x} y={y} textAnchor={anchor} dominantBaseline="central" fontFamily={FUENTE} fontWeight={peso} fontSize={tam} fill={fill}>
      {txt}
    </text>
  );
  const alto = el.h - 110;
  if (el.grafica === "barras") {
    const slot = el.w / n;
    const bw = Math.min(150, slot * 0.62);
    return (
      <g>
        <line x1={x0} x2={x0 + el.w} y1={y0 + alto} y2={y0 + alto} stroke={c("suave")} strokeWidth={4} strokeLinecap="round" opacity={prog(t, el.t, 0.4)} />
        {datos.map((d, i) => {
          const ini = el.t + 0.2 + (i * el.dur) / (n + 1);
          const r = retro ? prog(t, ini, 1.0, easeRetro) : resorte(t, ini, { damping: 16, stiffness: 90 });
          const h = (d.valor / max) * (alto - 50) * r;
          const cx = x0 + slot * (i + 0.5);
          const resalta = d.valor === max;
          const fill = resalta ? c("acento") : col;
          return (
            <g key={i}>
              <rect x={cx - bw / 2} y={y0 + alto - h} width={bw} height={Math.max(0, h)} rx={12} fill={fill} />
              {r > 0.55 && <g opacity={prog(t, el.t + 0.2 + (i * el.dur) / (n + 1) + 0.35, 0.3)}>{etiqueta(miles(d.valor, d.valor % 1 ? 1 : 0), cx, y0 + alto - h - 28, 32, c("tinta"), 800)}</g>}
              {etiqueta(d.etiqueta, cx, y0 + alto + 42, Math.min(30, (slot * 0.9) / Math.max(4, d.etiqueta.length * 0.58)), c("tinta"), 600)}
            </g>
          );
        })}
      </g>
    );
  }
  if (el.grafica === "lineas") {
    const pts = datos.map((d, i) => ({ x: x0 + (n === 1 ? el.w / 2 : (el.w * i) / (n - 1)), y: y0 + alto - (d.valor / max) * (alto - 40) }));
    const dPath = rutaDePuntos(pts, true);
    const p = suave(t, el.t + 0.2, el.dur);
    return (
      <g>
        <line x1={x0} x2={x0 + el.w} y1={y0 + alto} y2={y0 + alto} stroke={c("suave")} strokeWidth={4} strokeLinecap="round" opacity={prog(t, el.t, 0.4)} />
        <TrazoDibujado d={dPath} color={col} grosor={9} ini={el.t + 0.2} dur={el.dur} brillo />
        {pts.map((q, i) => {
          const ap = prog(p, i / Math.max(1, n - 1) - 0.04, 0.08);
          return (
            <g key={i} opacity={ap}>
              <circle cx={q.x} cy={q.y} r={14} fill={c("acento")} stroke={c("tinta")} strokeWidth={3} />
              {etiqueta(miles(datos[i].valor, datos[i].valor % 1 ? 1 : 0), q.x, q.y - 40, 28, c("tinta"), 800)}
              {etiqueta(datos[i].etiqueta, q.x, y0 + alto + 42, 26, c("tinta"), 600)}
            </g>
          );
        })}
      </g>
    );
  }
  // pastel / dona
  const R = Math.min(el.w, el.h - 160) / 2;
  const cx = el.x, cy = y0 + R + 10;
  const barrido = suave(t, el.t, el.dur);
  let acum = 0;
  const arco = (a0: number, a1: number, r0: number, r1: number) => {
    const grande = a1 - a0 > Math.PI ? 1 : 0;
    const P = (a: number, r: number) => `${cx + Math.cos(a) * r} ${cy + Math.sin(a) * r}`;
    return r0 > 0 ? `M ${P(a0, r1)} A ${r1} ${r1} 0 ${grande} 1 ${P(a1, r1)} L ${P(a1, r0)} A ${r0} ${r0} 0 ${grande} 0 ${P(a0, r0)} Z` : `M ${cx} ${cy} L ${P(a0, r1)} A ${r1} ${r1} 0 ${grande} 1 ${P(a1, r1)} Z`;
  };
  const inicio = CICLO.indexOf(el.color) < 0 ? 0 : CICLO.indexOf(el.color);
  return (
    <g>
      {datos.map((d, i) => {
        const a0 = -Math.PI / 2 + (acum / total) * Math.PI * 2 * barrido;
        acum += d.valor;
        const a1 = -Math.PI / 2 + (acum / total) * Math.PI * 2 * barrido;
        if (a1 - a0 < 0.001) return null;
        const token = CICLO[(inicio + i) % CICLO.length];
        return <path key={i} d={arco(a0, Math.min(a1, a0 + Math.PI * 2 - 0.002), el.grafica === "dona" ? R * 0.58 : 0, R)} fill={c(token)} stroke={c("tinta")} strokeOpacity={0.15} strokeWidth={2} />;
      })}
      {datos.map((d, i) => {
        const token = CICLO[(inicio + i) % CICLO.length];
        const fila = Math.floor(i / 2), colm = i % 2;
        const lx = x0 + colm * (el.w / 2) + 20, ly = cy + R + 60 + fila * 46;
        return (
          <g key={`l${i}`} opacity={prog(t, el.t + el.dur * 0.6 + i * 0.1, 0.3)}>
            <rect x={lx} y={ly - 13} width={26} height={26} rx={6} fill={c(token)} />
            {etiqueta(`${d.etiqueta} · ${miles((d.valor / total) * 100, 0)} %`, lx + 40, ly, 28, c("tinta"), 600, "start")}
          </g>
        );
      })}
    </g>
  );
};

const Contador: React.FC<P> = ({ el }) => {
  const estilo = useEstiloTexto();
  const t = useT();
  const v = el.desde + (el.valor - el.desde) * suave(t, el.t, el.dur);
  return (
    <text data-texto="contador" x={el.x} y={el.y} textAnchor="middle" dominantBaseline="central" fontFamily={FUENTE} fontWeight={900} fontSize={el.tam} {...estilo(el.color, el.tam)} style={{ fontVariantNumeric: "tabular-nums", letterSpacing: -1.5 }}>
      {el.prefijo}
      {miles(v, el.decimales)}
      {el.sufijo}
    </text>
  );
};

const Anillo: React.FC<P> = ({ el }) => {
  const c = useColor();
  const t = useT();
  const L = 2 * Math.PI * el.radio;
  const p = suave(t, el.t, 1.6) * (el.valor / 100);
  return (
    <g>
      <circle cx={el.x} cy={el.y} r={el.radio} fill="none" stroke={c("suave")} strokeOpacity={0.3} strokeWidth={Math.max(14, el.radio * 0.12)} />
      <circle cx={el.x} cy={el.y} r={el.radio} fill="none" stroke={c(el.color)} strokeWidth={Math.max(14, el.radio * 0.12)} strokeLinecap="round" strokeDasharray={L} strokeDashoffset={L * (1 - p)} transform={`rotate(-90 ${el.x} ${el.y})`} />
      <text data-texto="anillo" x={el.x} y={el.y - (el.etiqueta ? el.radio * 0.1 : 0)} textAnchor="middle" dominantBaseline="central" fontFamily={FUENTE} fontWeight={900} fontSize={el.radio * 0.52} fill={c("tinta")} style={{ fontVariantNumeric: "tabular-nums" }}>
        {Math.round(p * 100)}%
      </text>
      {el.etiqueta && (
        <text data-texto="anillo" x={el.x} y={el.y + el.radio * 0.42} textAnchor="middle" dominantBaseline="central" fontFamily={FUENTE} fontWeight={600} fontSize={Math.max(24, el.radio * 0.2)} fill={c("suave")}>
          {el.etiqueta}
        </text>
      )}
    </g>
  );
};

const Ondas: React.FC<P> = ({ el }) => {
  const c = useColor();
  const t = useT();
  return (
    <g>
      {[0, 1, 2].map((i) => {
        const k = ((t - el.t) * 0.45 + i / 3) % 1;
        return <circle key={i} cx={el.x} cy={el.y} r={el.radio * (0.15 + 0.85 * k)} fill="none" stroke={c(el.color)} strokeWidth={5} opacity={(1 - k) * 0.7} />;
      })}
      <circle cx={el.x} cy={el.y} r={10 + 3 * onda(t, 1.2)} fill={c(el.color)} />
    </g>
  );
};

const Lista: React.FC<P> = ({ el }) => {
  const c = useColor();
  const estilo = useEstiloTexto();
  const t = useT();
  const items = el.items as string[];
  return (
    <g>
      {items.map((txt, i) => {
        const ini = el.t + i * 0.4;
        const k = prog(t, ini, 0.4);
        const yc = el.y + i * el.tam * 1.7 + el.tam * 0.85;
        return (
          <g key={i} opacity={k} transform={`translate(${(1 - k) * 50} 0)`}>
            <circle cx={el.x + el.tam * 0.45} cy={yc} r={el.tam * 0.42} fill={c("acento")} />
            <path d={`M ${el.x + el.tam * 0.27} ${yc} l ${el.tam * 0.13} ${el.tam * 0.14} l ${el.tam * 0.24} ${-el.tam * 0.27}`} fill="none" stroke={c("blanco") === "#FFFFFF" ? "#02224E" : "#0B0F19"} strokeWidth={el.tam * 0.09} strokeLinecap="round" strokeLinejoin="round" />
            <text data-texto="lista" x={el.x + el.tam * 1.15} y={yc} dominantBaseline="central" fontFamily={FUENTE} fontWeight={700} fontSize={el.tam} {...estilo(el.color, el.tam)}>
              {txt}
            </text>
          </g>
        );
      })}
    </g>
  );
};

const Tarjeta: React.FC<P> = ({ el }) => {
  const { paleta, tema } = useTema();
  const claro = tema === "claro";
  // sobre fondo claro la tarjeta es navy sólido (colores oficiales: texto blanco, cifra amarilla); sobre oscuro, cristal
  const k = paleta.oscuro;
  const col = (t: string) => (claro ? (t === "primario" ? k.blanco : (k as Record<string, string>)[t] ?? k.acento) : (tema === "oscuro" ? (paleta.oscuro as Record<string, string>)[t] : ""));
  const x0 = el.x - el.w / 2, y0 = el.y - el.h / 2;
  const conIcono = !!el.icono;
  const tx = conIcono ? x0 + el.h * 0.95 : x0 + 44;
  const disp = el.w - (tx - x0) - 36;
  const tamValor = Math.max(30, Math.min(el.h * 0.36, disp / Math.max(3, String(el.valor).length * 0.58)));
  const tamTitulo = Math.max(22, Math.min(el.h * 0.17, disp / Math.max(4, String(el.titulo).length * 0.54)));
  const acento = col(el.color);
  const valorColor = !claro && el.color === "primario" ? k.tinta : acento;
  return (
    <g>
      <rect x={x0} y={y0} width={el.w} height={el.h} rx={28} fill={claro ? paleta.claro.primario : k.blanco} fillOpacity={claro ? 0.97 : 0.1} stroke={claro ? paleta.claro.primario : k.tinta} strokeOpacity={claro ? 1 : 0.28} strokeWidth={2.5} />
      <rect x={x0} y={y0 + 24} width={9} height={el.h - 48} rx={4.5} fill={acento} />
      {conIcono && (
        <g transform={`translate(${x0 + el.h * 0.5} ${el.y}) scale(${(el.h * 0.5) / 100})`}>
          <circle r={74} fill={acento} fillOpacity={0.18} />
          {dibujarIcono(el.icono, acento)}
        </g>
      )}
      <text data-texto="tarjeta" x={tx} y={el.y - el.h * 0.2} dominantBaseline="central" fontFamily={FUENTE} fontWeight={600} fontSize={tamTitulo} fill={k.suave}>
        {el.titulo}
      </text>
      <text data-texto="tarjeta" x={tx} y={el.y + el.h * 0.14} dominantBaseline="central" fontFamily={FUENTE} fontWeight={900} fontSize={tamValor} fill={valorColor} style={{ letterSpacing: -1 }}>
        {el.valor}
      </text>
    </g>
  );
};

const TerminalEl: React.FC<P> = ({ el }) => {
  const { paleta, tema } = useTema();
  const c = useColor();
  const claro = tema === "claro";
  // sobre papel el lima no se lee: la línea de terminal lleva su propia franja oscura
  const color = claro ? (paleta.oscuro as Record<string, string>)[el.color] ?? paleta.oscuro.acento : c(el.color);
  return <TerminalTexto texto={el.texto} x={el.x} y={el.y} tam={el.tam} color={color} alinear={el.alinear} t0={el.t} franja={claro ? paleta.oscuro.fondoBorde : null} cursor={paleta.oscuro.acento} />;
};

const POR_TIPO: Record<string, React.FC<P>> = { terminal: TerminalEl, texto: Texto, forma: Forma, icono: Icono, linea: Linea, trazo: Trazo2D, plano: Plano, grafica: Grafica, contador: Contador, anillo: Anillo, ondas: Ondas, lista: Lista, tarjeta: Tarjeta };

/** Capa SVG con todos los elementos 2D de una escena (o el overlay de una escena 3D). */
export const Elementos2D: React.FC<{ elementos: Elemento2D[] }> = ({ elementos }) => (
  <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
    {elementos.map((el, i) => {
      const Comp = POR_TIPO[el.tipo];
      return Comp ? (
        <Entrada key={i} el={el}>
          <Comp el={el} />
        </Entrada>
      ) : null;
    })}
  </svg>
);

