import React from "react";
import { Easing } from "remotion";
import { evolvePath } from "@remotion/paths";
import { C, FUENTE, MARGEN, W } from "../../lib/colores";

/** Margen local = 80 px + holgura por el acercamiento de cámara (×1.035) => en pantalla queda ≥ 80 px. */
const MARGEN_LOCAL = MARGEN + 22;
import { azar, lerp, onda, pop, prog, useT, ventana } from "../../lib/anim";
import { enRuta } from "../../lib/ruta";
import { analizar, anchoEstimado } from "../../lib/texto";

export type ColorNombre = "rojo" | "azul" | "amarillo" | "hueso";

// ---------------------------------------------------------------------------
// Defs: halos radiales reutilizables (una sola vez por <svg>)
// ---------------------------------------------------------------------------
export const Defs: React.FC = () => (
  <defs>
    {(
      [
        ["rojo", C.rojo],
        ["azul", C.azul],
        ["amarillo", C.amarillo],
        ["hueso", C.hueso],
      ] as const
    ).map(([nombre, color]) => (
      <radialGradient id={`rg-${nombre}`} key={nombre}>
        <stop offset="0" stopColor={color} stopOpacity={0.6} />
        <stop offset="0.5" stopColor={color} stopOpacity={0.2} />
        <stop offset="1" stopColor={color} stopOpacity={0} />
      </radialGradient>
    ))}
  </defs>
);

/** Resplandor circular suave (sin filtros SVG: es barato y se ve igual en cada render). */
export const Halo: React.FC<{ x: number; y: number; r: number; color?: ColorNombre; opacidad?: number }> = ({
  x,
  y,
  r,
  color = "rojo",
  opacidad = 1,
}) => <circle cx={x} cy={y} r={r} fill={`url(#rg-${color})`} opacity={opacidad} />;

// ---------------------------------------------------------------------------
// Trazo: línea que se "dibuja sola" (stroke-dashoffset) con brillo opcional
// ---------------------------------------------------------------------------
type TrazoProps = {
  d: string;
  color: string;
  ancho?: number;
  t0: number;
  dur?: number;
  /** 0 = sin brillo, 1 = brillo completo */
  brillo?: number;
  opacidad?: number;
  /** Segundo en que se desvanece (opcional) */
  fin?: number;
  curva?: (n: number) => number;
  /** Línea punteada fija en vez de dibujarse: "14 12". Marcha sola. */
  punteado?: string;
  /** Velocidad de marcha de los puntos (px/s) */
  marcha?: number;
  relleno?: string;
};

export const Trazo: React.FC<TrazoProps> = ({
  d,
  color,
  ancho = 8,
  t0,
  dur = 0.8,
  brillo = 0,
  opacidad = 1,
  fin,
  curva = Easing.inOut(Easing.cubic),
  punteado,
  marcha = 60,
  relleno = "none",
}) => {
  const t = useT();
  const p = prog(t, t0, dur, curva);
  const salida = fin === undefined ? 1 : 1 - prog(t, fin, 0.3);
  if (p <= 0.002 || salida <= 0.002) return null;

  if (punteado) {
    const comun = {
      d,
      fill: relleno,
      strokeLinecap: "round" as const,
      strokeLinejoin: "round" as const,
      strokeDasharray: punteado,
      strokeDashoffset: -t * marcha,
    };
    return (
      <g opacity={opacidad * p * salida}>
        {brillo > 0 && <path {...comun} stroke={color} strokeWidth={ancho * 2.4} opacity={0.14 * brillo} />}
        <path {...comun} stroke={color} strokeWidth={ancho} />
      </g>
    );
  }

  const comun = {
    d,
    fill: relleno,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    // evolvePath (@remotion/paths): dasharray/dashoffset exactos para que el trazo "crezca" de 0 a 100 %
    ...evolvePath(p, d),
  };
  return (
    <g opacity={opacidad * salida}>
      {brillo > 0 && <path {...comun} stroke={color} strokeWidth={ancho * 3.4} opacity={0.09 * brillo} />}
      {brillo > 0 && <path {...comun} stroke={color} strokeWidth={ancho * 1.9} opacity={0.18 * brillo} />}
      <path {...comun} stroke={color} strokeWidth={ancho} />
    </g>
  );
};

/** Pieza rellena que aparece con fundido + leve crecimiento (órganos, tejidos). */
export const Pieza: React.FC<{
  d: string;
  relleno: string;
  borde?: string;
  anchoBorde?: number;
  t0: number;
  dur?: number;
  opacidad?: number;
  fin?: number;
}> = ({ d, relleno, borde, anchoBorde = 4, t0, dur = 0.6, opacidad = 1, fin }) => {
  const t = useT();
  const k = prog(t, t0, dur);
  const salida = fin === undefined ? 1 : 1 - prog(t, fin, 0.3);
  if (k <= 0.002 || salida <= 0.002) return null;
  return (
    <path
      d={d}
      fill={relleno}
      stroke={borde ?? "none"}
      strokeWidth={anchoBorde}
      strokeLinejoin="round"
      opacity={opacidad * k * salida}
    />
  );
};

/** Tubo con borde (vasos, extremidades): dos trazos sincronizados. */
export const Tubo: React.FC<{
  d: string;
  ancho: number;
  borde: string;
  relleno?: string;
  grosorBorde?: number;
  t0: number;
  dur?: number;
  brillo?: number;
  opacidad?: number;
  fin?: number;
}> = ({ d, ancho, borde, relleno = C.panel, grosorBorde = 5, t0, dur = 0.9, brillo = 0, opacidad = 1, fin }) => (
  <g>
    <Trazo d={d} color={borde} ancho={ancho} t0={t0} dur={dur} brillo={brillo} opacidad={opacidad} fin={fin} />
    <Trazo d={d} color={relleno} ancho={Math.max(2, ancho - grosorBorde * 2)} t0={t0} dur={dur} opacidad={opacidad} fin={fin} />
  </g>
);

// ---------------------------------------------------------------------------
// Flujo de partículas sobre un path (sangre, moléculas...). Admite bloqueo.
// ---------------------------------------------------------------------------
type FlujoProps = {
  d: string;
  color: string;
  /** partículas visibles a la vez */
  n?: number;
  /** vueltas del recorrido completo por segundo */
  velocidad?: number;
  radio?: number;
  t0?: number;
  t1?: number;
  /** Si existe, desde `t` las partículas se atascan en `tope` (0-1) formando cola. */
  bloqueo?: { t: number; tope: number; hueco?: number };
  celula?: boolean;
};

export const Flujo: React.FC<FlujoProps> = ({
  d,
  color,
  n = 7,
  velocidad = 0.22,
  radio = 8,
  t0 = 0,
  t1 = 9999,
  bloqueo,
  celula = true,
}) => {
  const t = useT();
  const vis = ventana(t, t0, t1, 0.3);
  if (vis <= 0.01) return null;
  const per = 1 / (n * velocidad); // segundos entre partículas
  const v = velocidad; // fracción de ruta por segundo
  // Partículas j = ..., con nacimiento s_j = t0 + j*per
  const jMax = Math.floor((t - t0) / per);
  // primera partícula que NO había pasado el tope cuando se cerró el vaso
  let jAtascada = Infinity;
  if (bloqueo && t >= bloqueo.t) {
    const tb = bloqueo.t;
    const ultimaLibre = Math.floor((tb - t0) / per);
    let j0 = ultimaLibre;
    while (j0 >= 0 && v * (tb - (t0 + j0 * per)) < bloqueo.tope) j0--;
    jAtascada = j0 + 1; // desde aquí todas se detendrán
  }
  const jMin = Math.max(0, Math.min(jMax - n, jAtascada));
  const hueco = bloqueo?.hueco ?? Math.min(0.045, v * per * 0.8);
  const nodos: React.ReactNode[] = [];
  for (let j = jMin; j <= jMax; j++) {
    const s = t0 + j * per;
    let u = v * (t - s);
    if (bloqueo && j >= jAtascada) {
      const parada = bloqueo.tope - hueco * (j - jAtascada);
      if (parada < 0.02) continue;
      u = Math.min(u, parada);
    }
    if (u < 0 || u > 1) continue;
    const alfa = Math.min(1, u * 12) * (bloqueo && j >= jAtascada ? 1 : Math.min(1, (1 - u) * 12));
    const p = enRuta(d, u);
    nodos.push(
      <g key={j} transform={`translate(${p.x} ${p.y})`} opacity={alfa}>
        <circle r={radio * 2.2} fill={color} opacity={0.14} />
        <circle r={radio} fill={color} />
        {celula && <circle r={radio * 0.42} fill={C.fondo} opacity={0.35} />}
      </g>,
    );
  }
  return <g opacity={vis}>{nodos}</g>;
};

// ---------------------------------------------------------------------------
// Impulso nervioso: segmento brillante que viaja por un path
// ---------------------------------------------------------------------------
export const Impulso: React.FC<{
  d: string;
  t0: number;
  dur: number;
  color?: string;
  periodo?: number;
  largo?: number;
  ancho?: number;
  t1?: number;
  /** cuántas veces se repite (por defecto infinitas dentro de t0–t1) */
  repeticiones?: number;
}> = ({ d, t0, dur, color = C.amarillo, periodo, largo = 0.09, ancho = 9, t1 = 9999, repeticiones }) => {
  const t = useT();
  if (t < t0) return null;
  const vis = ventana(t, t0, t1, 0.15);
  if (vis <= 0.01) return null;
  const ciclo = periodo ?? dur;
  const n = Math.floor((t - t0) / ciclo);
  if (repeticiones !== undefined && n >= repeticiones) return null;
  const local = ((t - t0) % ciclo) / dur;
  if (local > 1) return null;
  const cabeza = local * (1 + largo);
  const p = enRuta(d, Math.min(1, cabeza));
  const comun = {
    d,
    fill: "none",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    pathLength: 1,
    strokeDasharray: `${largo} 3`,
    strokeDashoffset: largo - cabeza,
  };
  return (
    <g opacity={vis}>
      <path {...comun} stroke={color} strokeWidth={ancho * 3.6} opacity={0.12} />
      <path {...comun} stroke={color} strokeWidth={ancho * 1.9} opacity={0.3} />
      <path {...comun} stroke={C.hueso} strokeWidth={ancho * 0.7} />
      {cabeza <= 1 && <circle cx={p.x} cy={p.y} r={ancho * 1.25} fill={C.hueso} />}
    </g>
  );
};

/** Anillos que se expanden (latido, alarma, dolor). */
export const Aros: React.FC<{
  x: number;
  y: number;
  color?: string;
  r0?: number;
  r1?: number;
  n?: number;
  periodo?: number;
  t0: number;
  t1?: number;
  ancho?: number;
}> = ({ x, y, color = C.rojo, r0 = 24, r1 = 130, n = 3, periodo = 1.3, t0, t1 = 9999, ancho = 4 }) => {
  const t = useT();
  const vis = ventana(t, t0, t1, 0.2);
  if (vis <= 0.01) return null;
  return (
    <g opacity={vis}>
      {Array.from({ length: n }, (_, k) => {
        const f = ((((t - t0) / periodo + k / n) % 1) + 1) % 1;
        return (
          <circle
            key={k}
            cx={x}
            cy={y}
            r={lerp(r0, r1, Easing.out(Easing.quad)(f))}
            fill="none"
            stroke={color}
            strokeWidth={ancho * (1 - f * 0.6)}
            opacity={(1 - f) * 0.85}
          />
        );
      })}
    </g>
  );
};

/** Rayitas de dolor (estilo cómic) alrededor de un punto. */
export const RayosDolor: React.FC<{
  x: number;
  y: number;
  r?: number;
  n?: number;
  color?: string;
  t0: number;
  t1?: number;
  largo?: number;
  ancho?: number;
  arco?: [number, number];
  periodo?: number;
}> = ({ x, y, r = 70, n = 9, color = C.rojo, t0, t1 = 9999, largo = 30, ancho = 7, arco = [0, 360], periodo = 0.42 }) => {
  const t = useT();
  const vis = ventana(t, t0, t1, 0.2) * pop(t, t0);
  if (vis <= 0.01) return null;
  return (
    <g opacity={Math.min(1, vis)}>
      {Array.from({ length: n }, (_, i) => {
        const ang = ((arco[0] + ((arco[1] - arco[0]) * i) / Math.max(1, n - (arco[1] - arco[0] >= 360 ? 0 : 1))) * Math.PI) / 180;
        const f = 0.35 + 0.65 * onda(t, periodo, azar(i + 3));
        const a = r + 6 * f;
        const b = r + largo * f + 6;
        return (
          <line
            key={i}
            x1={x + Math.cos(ang) * a}
            y1={y + Math.sin(ang) * a}
            x2={x + Math.cos(ang) * b}
            y2={y + Math.sin(ang) * b}
            stroke={color}
            strokeWidth={ancho}
            strokeLinecap="round"
          />
        );
      })}
    </g>
  );
};

/** Punta de flecha abierta orientada según la tangente del path en `u`. */
export const Flecha: React.FC<{
  d: string;
  color: string;
  ancho?: number;
  t0: number;
  dur?: number;
  cabeza?: number;
  brillo?: number;
  punteado?: string;
  fin?: number;
}> = ({ d, color, ancho = 8, t0, dur = 0.8, cabeza = 26, brillo = 0, punteado, fin }) => {
  const t = useT();
  const p = prog(t, t0, dur, Easing.inOut(Easing.cubic));
  const salida = fin === undefined ? 1 : 1 - prog(t, fin, 0.3);
  const fin_ = enRuta(d, 1);
  const k = prog(t, t0 + dur * 0.85, 0.25, Easing.out(Easing.back(2)));
  return (
    <g>
      <Trazo d={d} color={color} ancho={ancho} t0={t0} dur={dur} brillo={brillo} punteado={punteado} fin={fin} />
      {p > 0.85 && salida > 0.01 && (
        <g transform={`translate(${fin_.x} ${fin_.y}) rotate(${fin_.ang}) scale(${k})`} opacity={salida}>
          <path
            d={`M ${-cabeza} ${-cabeza * 0.62} L 0 0 L ${-cabeza} ${cabeza * 0.62}`}
            fill="none"
            stroke={color}
            strokeWidth={ancho}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}
    </g>
  );
};

// ---------------------------------------------------------------------------
// Texto: etiquetas anatómicas que nunca se salen del margen (≥ 80 px)
// ---------------------------------------------------------------------------
export { anchoEstimado };

export const Marcas: React.FC<{ texto: string; tam: number }> = ({ texto, tam }) => {
  const piezas = analizar(texto);
  return (
    <>
      {piezas.map((m, i) => {
        if (m.modo === "n") {
          const antes = piezas[i - 1];
          const dy = antes && antes.modo !== "n" ? (antes.modo === "sup" ? tam * 0.4 : -tam * 0.18) : undefined;
          return (
            <tspan key={i} dy={dy}>
              {m.texto}
            </tspan>
          );
        }
        const dy = m.modo === "sup" ? -tam * 0.4 : tam * 0.18;
        return (
          <tspan key={i} dy={dy} fontSize={tam * 0.65}>
            {m.texto}
          </tspan>
        );
      })}
    </>
  );
};

type EtiquetaProps = {
  x: number;
  y: number;
  texto: string | string[];
  t0: number;
  t1?: number;
  color?: string;
  tam?: number;
  /** a qué lado de `x` crece la etiqueta */
  ancla?: "start" | "middle" | "end";
  peso?: number;
  pastilla?: boolean;
  /** línea guía hasta un punto (anclaje anatómico) */
  guia?: { x: number; y: number };
  colorTexto?: string;
};

export const Etiqueta: React.FC<EtiquetaProps> = ({
  x,
  y,
  texto,
  t0,
  t1 = 9999,
  color = C.hueso,
  tam = 36,
  ancla = "middle",
  peso = 700,
  pastilla = true,
  guia,
  colorTexto,
}) => {
  const t = useT();
  const k = ventana(t, t0, t1, 0.25);
  if (k <= 0.01) return null;
  const lineas = Array.isArray(texto) ? texto : [texto];
  const wTexto = Math.max(...lineas.map((l) => anchoEstimado(l, tam, peso)));
  const padX = pastilla ? tam * 0.6 : 4;
  const padY = pastilla ? tam * 0.34 : 2;
  const interlinea = tam * 1.22;
  const alto = lineas.length * interlinea;
  const wTotal = wTexto + padX * 2;

  let izq = ancla === "middle" ? x - wTotal / 2 : ancla === "start" ? x : x - wTotal;
  izq = Math.min(Math.max(izq, MARGEN_LOCAL), W - MARGEN_LOCAL - wTotal);
  const cx = izq + wTotal / 2;

  const esc = 0.82 + 0.18 * Math.min(1.12, pop(t, t0));
  const yTexto0 = -alto / 2 + interlinea / 2 + tam * 0.35;

  return (
    <g opacity={k}>
      {guia && (
        <g>
          <line x1={cx} y1={y} x2={guia.x} y2={guia.y} stroke={color} strokeWidth={3} strokeOpacity={0.85} strokeLinecap="round" />
          <circle cx={guia.x} cy={guia.y} r={7} fill={color} />
        </g>
      )}
      <g transform={`translate(${cx} ${y}) scale(${esc})`} data-texto="etiqueta">
        {pastilla && (
          <rect
            x={-wTotal / 2}
            y={-alto / 2 - padY}
            width={wTotal}
            height={alto + padY * 2}
            rx={(alto + padY * 2) / 2 > 34 ? 26 : (alto + padY * 2) / 2}
            fill={C.fondo}
            fillOpacity={0.88}
            stroke={color}
            strokeWidth={3}
            strokeOpacity={0.8}
          />
        )}
        <text
          textAnchor="middle"
          fontFamily={FUENTE}
          fontWeight={peso}
          fontSize={tam}
          fill={colorTexto ?? (pastilla ? C.hueso : color)}
          stroke={pastilla ? "none" : C.fondo}
          strokeWidth={pastilla ? 0 : 7}
          paintOrder="stroke"
          strokeLinejoin="round"
        >
          {lineas.map((l, i) => (
            <tspan key={i} x={0} y={yTexto0 + i * interlinea}>
              <Marcas texto={l} tam={tam} />
            </tspan>
          ))}
        </text>
      </g>
    </g>
  );
};

/** Texto grande y suelto dentro del escenario (títulos de tarjeta, signos "?" "!"). */
export const Rotulo: React.FC<{
  x: number;
  y: number;
  texto: string;
  t0: number;
  t1?: number;
  tam?: number;
  color?: string;
  peso?: number;
  rot?: number;
}> = ({ x, y, texto, t0, t1 = 9999, tam = 120, color = C.amarillo, peso = 900, rot = 0 }) => {
  const t = useT();
  const k = ventana(t, t0, t1, 0.2);
  if (k <= 0.01) return null;
  const esc = 0.6 + 0.4 * Math.min(1.2, pop(t, t0));
  const w = anchoEstimado(texto, tam, peso);
  const xx = Math.min(Math.max(x, MARGEN_LOCAL + w / 2), W - MARGEN_LOCAL - w / 2);
  return (
    <g opacity={k} transform={`translate(${xx} ${y}) rotate(${rot}) scale(${esc})`} data-texto="rotulo">
      <text
        textAnchor="middle"
        fontFamily={FUENTE}
        fontWeight={peso}
        fontSize={tam}
        fill={color}
        stroke={C.fondo}
        strokeWidth={tam * 0.12}
        paintOrder="stroke"
        strokeLinejoin="round"
      >
        {texto}
      </text>
    </g>
  );
};
