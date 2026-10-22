import React from "react";
import { C, FUENTE } from "../../lib/colores";
import { pop, prog, useT } from "../../lib/anim";
import { anchoEstimado } from "../../lib/texto";
import { PALABRAS } from "../../lib/voz";
import { Etiqueta, Marcas, Trazo } from "../../components/svg/primitivas";
import { tiempoAncla } from "../anclas";
import { curvaPreset, yEn, type PN } from "../curvas";
import { curvaPx, pu, px, py } from "../medidas";
import { Aparece, El, ElProps, bool, col, lineasDe, num, texto } from "./comun";

// ---------------------------------------------------------------------------
// Texto que se ajusta solo a una caja (ajuste de líneas + reducción de tamaño)
// ---------------------------------------------------------------------------
export function ajustarTexto(txt: string, anchoPx: number, altoPx: number, fsMax = 38, fsMin = 22): { lineas: string[]; fs: number } {
  const explicitas = lineasDe(txt);
  for (let fs = fsMax; fs >= fsMin; fs -= 2) {
    const lineas: string[] = [];
    for (const bloque of explicitas) {
      let actual = "";
      for (const palabra of bloque.split(" ")) {
        const prueba = actual ? `${actual} ${palabra}` : palabra;
        if (anchoEstimado(prueba, fs, 700) <= anchoPx || !actual) actual = prueba;
        else {
          lineas.push(actual);
          actual = palabra;
        }
      }
      if (actual) lineas.push(actual);
    }
    const cabe = lineas.every((l) => anchoEstimado(l, fs, 700) <= anchoPx) && lineas.length * fs * 1.22 <= altoPx;
    if (cabe || fs === fsMin) return { lineas, fs };
  }
  return { lineas: explicitas, fs: fsMin };
}

export const TextoCaja: React.FC<{ lineas: string[]; fs: number; x: number; y: number; color?: string; peso?: number; anchor?: "start" | "middle" | "end" }> = ({ lineas, fs, x, y, color = C.hueso, peso = 700, anchor = "middle" }) => {
  const alto = lineas.length * fs * 1.22;
  return (
    <text textAnchor={anchor} fontFamily={FUENTE} fontWeight={peso} fontSize={fs} fill={color} stroke={C.fondo} strokeWidth={6} paintOrder="stroke" strokeLinejoin="round" data-texto="caja">
      {lineas.map((l, i) => (
        <tspan key={i} x={x} y={y - alto / 2 + (i + 0.5) * fs * 1.22 + fs * 0.35}>
          <Marcas texto={l} tam={fs} />
        </tspan>
      ))}
    </text>
  );
};

// ---------------------------------------------------------------------------
// Gráfica
// ---------------------------------------------------------------------------
export const GraficaEl: React.FC<ElProps> = ({ el, t0, t1 }) => {
  const W = pu(el.ancho, 80);
  const H = pu(el.alto, 42);
  const ox = px(el.x) - W / 2;
  const oy = py(el.y) + H / 2;
  const { pts, suave } = curvaPreset(texto(el.grafica), el.puntos);
  const P = pts.map(([fx, fy]) => [ox + 16 + fx * (W - 32), oy - 12 - fy * (H - 36)] as [number, number]);
  const d = suave ? curvaPx(P) : P.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const color = col(el.color, "amarillo");
  const dur = num(el.duracion, 2.4, 0.8, 8);
  const marcadores: El[] = Array.isArray(el.marcadores) ? el.marcadores.slice(0, 5) : [];
  const lineas: El[] = Array.isArray(el.lineasH) ? el.lineasH.slice(0, 4) : [];
  return (
    <>
      <Aparece t0={t0} t1={t1}>
        <path d={`M ${ox},${oy - H} L ${ox},${oy} L ${ox + W},${oy}`} fill="none" stroke={C.hueso} strokeOpacity={0.55} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
        <path d={`M ${ox - 10},${oy - H + 16} L ${ox},${oy - H} L ${ox + 10},${oy - H + 16} M ${ox + W - 16},${oy - 10} L ${ox + W},${oy} L ${ox + W - 16},${oy + 10}`} fill="none" stroke={C.hueso} strokeOpacity={0.55} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
        {texto(el.ejeX) && (
          <text data-texto="eje" x={ox + W} y={oy + 38} textAnchor="end" fontFamily={FUENTE} fontWeight={700} fontSize={28} fill={C.hueso} fillOpacity={0.8} stroke={C.fondo} strokeWidth={5} paintOrder="stroke">
            {texto(el.ejeX)}
          </text>
        )}
        {texto(el.ejeY) && (
          <text data-texto="eje" transform={`translate(${ox - 22} ${oy - H / 2}) rotate(-90)`} textAnchor="middle" fontFamily={FUENTE} fontWeight={700} fontSize={28} fill={C.hueso} fillOpacity={0.8} stroke={C.fondo} strokeWidth={5} paintOrder="stroke">
            {texto(el.ejeY)}
          </text>
        )}
        {lineas.map((l, i) => {
          const y = oy - 12 - num(l.y, 0.5, 0, 1) * (H - 36);
          return (
            <g key={i}>
              <line x1={ox} y1={y} x2={ox + W} y2={y} stroke={col(l.color, "hueso")} strokeOpacity={0.55} strokeWidth={3} strokeDasharray="12 10" />
              <text data-texto="linea-ref" x={ox + W - 6} y={y - 10} textAnchor="end" fontFamily={FUENTE} fontWeight={700} fontSize={27} fill={col(l.color, "hueso")} stroke={C.fondo} strokeWidth={5} paintOrder="stroke">
                {texto(l.texto)}
              </text>
            </g>
          );
        })}
      </Aparece>
      <Trazo d={d} color={color} ancho={8} t0={t0 + 0.5} dur={dur} brillo={0.7} fin={t1 < 9000 ? t1 : undefined} curva={(n) => n} />
      <Marcadores marcadores={marcadores} pts={pts} P0={[ox + 16, oy - 12]} W={W - 32} H={H - 36} tCurva={t0 + 0.5} dur={dur} t0={t0 + 0.5 + dur * 0.5} t1={t1} color={color} />
    </>
  );
};

const Marcadores: React.FC<{ marcadores: El[]; pts: PN[]; P0: [number, number]; W: number; H: number; tCurva: number; dur: number; t0: number; t1: number; color: string }> = ({ marcadores, pts, P0, W, H, tCurva, dur, t0, t1, color }) => {
  const t = useT();
  return (
    <>
      {marcadores.map((m, i) => {
        const fx = num(m.x, 0.5, 0, 1);
        const X = P0[0] + fx * W;
        const Y = P0[1] - yEn(pts, fx) * H;
        const ancla = tiempoAncla(PALABRAS, typeof m.cuando === "string" ? m.cuando : null, null, t0 + 0.7 * i);
        const ti = Math.max(ancla, tCurva + dur * fx * 0.95); // nunca antes de que la curva llegue hasta ahí
        const k = Math.min(1.2, pop(t, ti));
        const arriba = Y - 90 > 420;
        return (
          <g key={i}>
            {k > 0.02 && (
              <g opacity={Math.min(1, k)}>
                <circle cx={X} cy={Y} r={11 * (0.6 + 0.4 * k)} fill={color} stroke={C.fondo} strokeWidth={4} />
              </g>
            )}
            <Etiqueta x={X} y={arriba ? Y - 84 : Y + 84} texto={lineasDe(m.texto)} t0={ti} t1={t1} color={color} tam={30} guia={{ x: X, y: Y }} />
          </g>
        );
      })}
    </>
  );
};

// ---------------------------------------------------------------------------
// Pasos: cadena de nodos con flechas (cascadas, vías, mecanismos)
// ---------------------------------------------------------------------------
export const PasosEl: React.FC<ElProps> = ({ el, t0, t1 }) => {
  const t = useT();
  const nodos: El[] = Array.isArray(el.nodos) ? el.nodos.slice(0, 7) : [];
  const N = nodos.length;
  if (!N) return null;
  const vertical = el.orientacion !== "horizontal";
  const W = pu(el.ancho, vertical ? 58 : 88);
  const H = pu(el.alto, vertical ? 76 : 24);
  const cx = px(el.x);
  const cy = py(el.y);
  const gap = vertical ? 46 : 58;
  const bw = vertical ? W : Math.max(150, (W - gap * (N - 1)) / N);
  const bh = vertical ? Math.min(124, Math.max(74, (H - gap * (N - 1)) / N)) : H;
  const total = vertical ? N * bh + (N - 1) * gap : N * bw + (N - 1) * gap;
  const cajas = nodos.map((n, i) => {
    const x = vertical ? cx - bw / 2 : cx - total / 2 + i * (bw + gap);
    const y = vertical ? cy - total / 2 + i * (bh + gap) : cy - bh / 2;
    const ti = tiempoAncla(PALABRAS, typeof n.cuando === "string" ? n.cuando : null, null, t0 + 0.7 * i);
    return { x, y, ti, n };
  });
  return (
    <Aparece t0={t0} t1={t1} fade={0.2}>
      {cajas.map(({ x, y, ti, n }, i) => {
        const k = Math.min(1.1, pop(t, ti));
        if (k <= 0.01) return null;
        const color = col(n.color, "hueso");
        const { lineas, fs } = ajustarTexto(texto(n.texto), bw - 40, bh - 16);
        const sig = cajas[i + 1];
        const kf = i < N - 1 ? prog(t, (sig?.ti ?? ti + 0.7) - 0.35, 0.3) : 0;
        const ax = vertical ? x + bw / 2 : x + bw;
        const ay = vertical ? y + bh : y + bh / 2;
        const bx = vertical ? ax : ax + gap;
        const by = vertical ? ay + gap : ay;
        return (
          <g key={i}>
            <g transform={`translate(${x + bw / 2} ${y + bh / 2}) scale(${0.85 + 0.15 * k}) translate(${-(x + bw / 2)} ${-(y + bh / 2)})`} opacity={Math.min(1, k)}>
              <rect x={x} y={y} width={bw} height={bh} rx={24} fill={C.fondo} fillOpacity={0.92} stroke={color} strokeWidth={5} />
              <rect x={x} y={y} width={bw} height={bh} rx={24} fill={color} fillOpacity={0.1} />
              <TextoCaja lineas={lineas} fs={fs} x={x + bw / 2} y={y + bh / 2} />
            </g>
            {kf > 0.02 && (
              <g opacity={kf}>
                <path d={`M ${ax},${ay + (vertical ? 6 : 0)} L ${bx},${by - (vertical ? 6 : 0)}`} stroke={C.hueso} strokeOpacity={0.85} strokeWidth={6} strokeLinecap="round" />
                <path d={vertical ? `M ${bx - 14},${by - 22} L ${bx},${by - 6} L ${bx + 14},${by - 22}` : `M ${bx - 22},${by - 14} L ${bx - 6},${by} L ${bx - 22},${by + 14}`} fill="none" stroke={C.hueso} strokeOpacity={0.85} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
              </g>
            )}
          </g>
        );
      })}
    </Aparece>
  );
};

// ---------------------------------------------------------------------------
// Comparación: dos paneles (A frente a B)
// ---------------------------------------------------------------------------
export const ComparacionEl: React.FC<ElProps> = ({ el, t0, t1 }) => {
  const t = useT();
  const W = pu(el.ancho, 86);
  const H = pu(el.alto, 56);
  const gap = 34;
  const pw = (W - gap) / 2;
  const x0 = px(el.x) - W / 2;
  const y0 = py(el.y) - H / 2;
  const lados: [El, number][] = [
    [(el.izquierda ?? {}) as El, 0],
    [(el.derecha ?? {}) as El, 1],
  ];
  return (
    <Aparece t0={t0} t1={t1} fade={0.25}>
      {lados.map(([p, j]) => {
        const x = x0 + j * (pw + gap);
        const color = col(p.color, j === 0 ? "azul" : "rojo");
        const items: string[] = Array.isArray(p.items) ? p.items.slice(0, 5).map((s: unknown) => texto(s)) : [];
        const tituloAlto = 78;
        const disponible = H - tituloAlto - 24;
        const ih = items.length ? Math.min(110, disponible / items.length) : 0;
        const tit = ajustarTexto(texto(p.titulo), pw - 30, tituloAlto - 14, 40, 26);
        const kp = Math.min(1.1, pop(t, t0 + 0.1 + j * 0.2));
        return (
          <g key={j} opacity={Math.min(1, kp)}>
            <rect x={x} y={y0} width={pw} height={H} rx={26} fill={C.fondo} fillOpacity={0.9} stroke={color} strokeWidth={5} />
            <path d={`M ${x},${y0 + 26} A 26 26 0 0 1 ${x + 26},${y0} L ${x + pw - 26},${y0} A 26 26 0 0 1 ${x + pw},${y0 + 26} L ${x + pw},${y0 + tituloAlto} L ${x},${y0 + tituloAlto} Z`} fill={color} fillOpacity={0.28} />
            <TextoCaja lineas={tit.lineas} fs={tit.fs} x={x + pw / 2} y={y0 + tituloAlto / 2} color={C.hueso} peso={800} />
            {items.map((it, i) => {
              const ki = Math.min(1.1, pop(t, t0 + 0.7 + 0.55 * i + j * 0.15));
              if (ki <= 0.01) return null;
              const yc = y0 + tituloAlto + 14 + i * ih + ih / 2;
              const aj = ajustarTexto(it, pw - 86, ih - 10, 34, 22);
              return (
                <g key={i} opacity={Math.min(1, ki)}>
                  <circle cx={x + 34} cy={yc} r={9} fill={color} />
                  <TextoCaja lineas={aj.lineas} fs={aj.fs} x={x + 56} y={yc} anchor="start" />
                </g>
              );
            })}
          </g>
        );
      })}
    </Aparece>
  );
};

// ---------------------------------------------------------------------------
// Dato: cifra grande con unidad y etiqueta
// ---------------------------------------------------------------------------
export const DatoEl: React.FC<ElProps> = ({ el, t0, t1 }) => {
  const t = useT();
  const fs = Math.min(190, Math.max(60, pu(el.tam, 14)));
  const color = col(el.color, "amarillo");
  const k = Math.min(1.15, pop(t, t0));
  const valor = texto(el.valor, "—");
  const unidad = texto(el.unidad);
  const ancho = anchoEstimado(valor, fs, 900) + (unidad ? anchoEstimado(unidad, fs * 0.42, 800) + 16 : 0);
  const cx = px(el.x);
  const cy = py(el.y);
  return (
    <Aparece t0={t0} t1={t1} fade={0.2}>
      <g transform={`translate(${cx} ${cy}) scale(${0.7 + 0.3 * k})`} data-texto="dato">
        <text x={-ancho / 2} y={fs * 0.35} fontFamily={FUENTE} fontWeight={900} fontSize={fs} fill={color} stroke={C.fondo} strokeWidth={fs * 0.1} paintOrder="stroke" strokeLinejoin="round">
          <Marcas texto={valor} tam={fs} />
          {unidad && (
            <tspan dx={16} fontSize={fs * 0.42} fontWeight={800}>
              {unidad}
            </tspan>
          )}
        </text>
        {texto(el.etiqueta) && (
          <text x={0} y={fs * 0.35 + 52} textAnchor="middle" fontFamily={FUENTE} fontWeight={700} fontSize={36} fill={C.hueso} stroke={C.fondo} strokeWidth={7} paintOrder="stroke">
            {texto(el.etiqueta)}
          </text>
        )}
      </g>
    </Aparece>
  );
};
