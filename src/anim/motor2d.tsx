import React from "react";
import { Easing } from "remotion";
import { evolvePath } from "@remotion/paths";
import { FUENTE, H, W } from "../lib/colores";
import { azar, onda, pop, prog, resorte, useT } from "../lib/anim";
import { dibujarIcono } from "../dsl/elementos/dibujo";
import { useColor, useTema } from "./contexto";
import type { Ambiente, Elemento2D } from "./tipos";

/* ───────────────────────── fondo ───────────────────────── */

/** Estilo de un texto: el amarillo (acento) sobre fondo claro se contorna con el navy de la marca para que se lea y conserve el hex oficial. */
const useEstiloTexto = () => {
  const c = useColor();
  const { tema } = useTema();
  return (token: string, tam: number): React.SVGAttributes<SVGTextElement> => {
    const fill = c(token);
    if (tema === "claro" && token === "acento") return { fill, stroke: c("primario"), strokeWidth: Math.max(2, tam * 0.07), paintOrder: "stroke", strokeLinejoin: "round" };
    return { fill };
  };
};

export const Fondo2D: React.FC<{ ambiente: Ambiente; id: string; solido?: boolean }> = ({ ambiente, id, solido }) => {
  const t = useT();
  const c = useColor();
  const { paleta, tema } = useTema();
  const col = tema === "claro" ? paleta.claro : paleta.oscuro;
  const desp = (t * 9) % 80;
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
      <defs>
        <radialGradient id={`fg-${id}`} cx="50%" cy="42%" r="75%">
          <stop offset="0" stopColor={solido ? col.fondoBorde : col.fondoCentro} />
          <stop offset="1" stopColor={col.fondoBorde} />
        </radialGradient>
        <pattern id={`rej-${id}`} width="80" height="80" patternUnits="userSpaceOnUse" patternTransform={`translate(${desp} ${desp})`}>
          <path d="M 80 0 L 0 0 L 0 80" fill="none" stroke={c("suave")} strokeWidth="2" />
        </pattern>
      </defs>
      <rect width={W} height={H} fill={`url(#fg-${id})`} />
      {ambiente === "cuadricula" && <rect width={W} height={H} fill={`url(#rej-${id})`} opacity={tema === "claro" ? 0.22 : 0.16} />}
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
  const entra = prog(t, el.t, 0.4);
  const k = el.entrada as string;
  const r = k === "pop" || k === "crecer" ? (k === "pop" ? pop(t, el.t) : resorte(t, el.t, { damping: 15, stiffness: 120 })) : entra;
  let transform: string | undefined;
  if (k === "pop") transform = `scale(${0.55 + 0.45 * r})`;
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

const TrazoDibujado: React.FC<{ d: string; color: string; grosor: number; ini: number; dur: number; brillo?: boolean; relleno?: string | null }> = ({ d, color, grosor, ini, dur, brillo, relleno }) => {
  const t = useT();
  const p = suave(t, ini, dur);
  if (p <= 0.001) return null;
  const evo = evolvePath(p, d);
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
      <TrazoDibujado d={d} color={col} grosor={el.grosor} ini={el.t} dur={el.dur} brillo />
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
  return <TrazoDibujado d={el.d} color={c(el.color)} grosor={el.grosor} ini={el.t} dur={el.dur} brillo={el.brillo} relleno={el.relleno ? c(el.relleno) : null} />;
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
          const r = resorte(t, el.t + 0.2 + (i * el.dur) / (n + 1), { damping: 16, stiffness: 90 });
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

const POR_TIPO: Record<string, React.FC<P>> = { texto: Texto, forma: Forma, icono: Icono, linea: Linea, trazo: Trazo2D, plano: Plano, grafica: Grafica, contador: Contador, anillo: Anillo, ondas: Ondas, lista: Lista, tarjeta: Tarjeta };

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

