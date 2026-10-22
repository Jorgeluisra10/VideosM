import React from "react";
import { makePie, makePolygon, makeStar, makeTriangle } from "@remotion/shapes";
import { C, FUENTE } from "../../lib/colores";
import { onda, pop, prog, useT } from "../../lib/anim";
import { anchoEstimado } from "../../lib/texto";
import { Aros, Etiqueta, Flecha, Flujo, Halo, Impulso, Marcas, RayosDolor, Rotulo, Trazo } from "../../components/svg/primitivas";
import { Punto, polilinea, pu, puntosValidos, px, py, rutaDe } from "../medidas";
import { sanitizarSvg } from "../svgSeguro";
import { Aparece, ElProps, bool, claveColor, col, lineasDe, num, texto } from "./comun";
import { iconoExtra } from "./iconos";

const TAM_ETIQUETA: Record<string, number> = { s: 30, m: 36, l: 44 };

export const EtiquetaEl: React.FC<ElProps> = ({ el, t0, t1 }) => {
  const guia = puntosValidos([el.guia, el.guia]) ? { x: px(el.guia[0]), y: py(el.guia[1]) } : undefined;
  return (
    <Etiqueta
      x={px(el.x)}
      y={py(el.y)}
      texto={lineasDe(el.texto)}
      t0={t0}
      t1={t1}
      color={col(el.color, "hueso")}
      tam={TAM_ETIQUETA[String(el.tam)] ?? 36}
      guia={guia}
    />
  );
};

export const RotuloEl: React.FC<ElProps> = ({ el, t0, t1 }) => (
  <Rotulo x={px(el.x)} y={py(el.y)} texto={texto(el.texto)} t0={t0} t1={t1} tam={Math.min(220, Math.max(40, pu(el.tam, 12)))} color={col(el.color, "amarillo")} rot={num(el.rotacion, 0, -30, 30)} />
);

export const FormaEl: React.FC<ElProps> = ({ el, t0, t1 }) => {
  const t = useT();
  /** "pastel": porción que se va llenando durante ~1,2 s desde que aparece (rentabilidad, porcentajes) */
  const pie = Math.max(0.02, num(el.progreso, 0.75, 0, 1) * prog(t, t0, 1.2));
  const relleno = el.relleno ? col(el.relleno) : "none";
  const borde = el.borde ? col(el.borde) : "none";
  const op = num(el.opacidad, 0.35, 0.05, 1);
  const w = pu(el.ancho, 20);
  const h = pu(el.alto, 20);
  const cx = px(el.x);
  const cy = py(el.y);
  const comun = { fill: relleno, fillOpacity: relleno === "none" ? 0 : op, stroke: borde, strokeWidth: 5, strokeLinejoin: "round" as const };
  let forma: React.ReactNode = null;
  switch (el.forma) {
    case "circulo":
      forma = <circle cx={cx} cy={cy} r={w / 2} {...comun} />;
      break;
    case "elipse":
      forma = <ellipse cx={cx} cy={cy} rx={w / 2} ry={h / 2} {...comun} />;
      break;
    case "redondeado":
      forma = <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx={Math.min(w, h) * 0.22} {...comun} />;
      break;
    case "poligono":
      if (puntosValidos(el.puntos)) forma = <path d={`${polilinea(el.puntos as Punto[])} Z`} {...comun} />;
      break;
    // figuras de @remotion/shapes: trazado exacto, centradas en (x, y) y de ancho = "ancho"
    case "estrella":
    case "hexagono":
    case "triangulo":
    case "pastel": {
      const r = w / 2;
      const f =
        el.forma === "estrella"
          ? makeStar({ points: 5, innerRadius: r * 0.45, outerRadius: r })
          : el.forma === "hexagono"
            ? makePolygon({ points: 6, radius: r })
            : el.forma === "triangulo"
              ? makeTriangle({ length: w, direction: "up" })
              : makePie({ radius: r, progress: pie, closePath: true });
      forma = <path d={f.path} transform={`translate(${cx - f.width / 2} ${cy - f.height / 2})`} {...comun} />;
      break;
    }
    default:
      forma = <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} {...comun} />;
  }
  return (
    <Aparece t0={t0} t1={t1}>
      <g transform={`rotate(${num(el.rotacion, 0, -180, 180)} ${cx} ${cy})`}>{forma}</g>
    </Aparece>
  );
};

export const LineaEl: React.FC<ElProps> = ({ el, t0, t1 }) => {
  if (!puntosValidos(el.puntos)) return null;
  const d = rutaDe(el.puntos as Punto[], bool(el.curva, true));
  const color = col(el.color, "hueso");
  const ancho = num(el.grosor, 5, 2, 16);
  const punteado = el.estilo === "punteada" ? "14 12" : undefined;
  const fin = t1 < 9000 ? t1 : undefined;
  if (bool(el.flecha)) return <Flecha d={d} color={color} ancho={ancho} t0={t0} dur={0.9} cabeza={ancho * 3.4 + 10} brillo={bool(el.brillo) ? 0.8 : 0} punteado={punteado} fin={fin} />;
  return <Trazo d={d} color={color} ancho={ancho} t0={t0} dur={0.9} brillo={bool(el.brillo) ? 0.8 : 0} punteado={punteado} fin={fin} />;
};

export const ParticulasEl: React.FC<ElProps> = ({ el, t0, t1 }) => {
  if (!puntosValidos(el.ruta)) return null;
  return (
    <Flujo
      d={rutaDe(el.ruta as Punto[], bool(el.curva, true))}
      color={col(el.color, "rojo")}
      n={Math.round(num(el.cantidad, 7, 2, 16))}
      velocidad={num(el.velocidad, 0.22, 0.05, 0.8)}
      radio={num(el.radio, 7, 3, 20)}
      t0={t0}
      t1={t1}
      celula={false}
    />
  );
};

export const ImpulsoEl: React.FC<ElProps> = ({ el, t0, t1 }) => {
  if (!puntosValidos(el.ruta)) return null;
  return <Impulso d={rutaDe(el.ruta as Punto[], bool(el.curva, true))} t0={t0} dur={num(el.duracion, 1.2, 0.4, 4)} periodo={num(el.periodo, 1.8, 0.6, 8)} color={col(el.color, "amarillo")} ancho={num(el.grosor, 9, 4, 16)} t1={t1} />;
};

export const MoleculaEl: React.FC<ElProps> = ({ el, t0, t1 }) => {
  const t = useT();
  const simbolo = texto(el.simbolo, "?");
  const color = col(el.color, "amarillo");
  const r = { s: 26, m: 34, l: 46 }[String(el.tam) as "s" | "m" | "l"] ?? 34;
  const fs = r * 0.78;
  const ancho = anchoEstimado(simbolo, fs, 800);
  const pastilla = ancho + 30 > r * 2;
  const w = pastilla ? ancho + 36 : r * 2;
  const k = Math.min(1.12, pop(t, t0));
  const flota = Math.sin(t * 2.2 + px(el.x) * 0.01) * 3;
  return (
    <Aparece t0={t0} t1={t1} fade={0.25}>
      <g transform={`translate(${px(el.x)} ${py(el.y) + flota}) scale(${0.6 + 0.4 * k})`} data-texto="molecula">
        <rect x={-w / 2 - 12} y={-r - 12} width={w + 24} height={r * 2 + 24} rx={r + 12} fill={color} opacity={0.14} />
        <rect x={-w / 2} y={-r} width={w} height={r * 2} rx={r} fill={C.fondo} fillOpacity={0.92} stroke={color} strokeWidth={4} />
        <text textAnchor="middle" y={fs * 0.35} fontFamily={FUENTE} fontWeight={800} fontSize={fs} fill={color}>
          <Marcas texto={simbolo} tam={fs} />
        </text>
      </g>
    </Aparece>
  );
};

export const AroEl: React.FC<ElProps> = ({ el, t0, t1 }) => (
  <Aros x={px(el.x)} y={py(el.y)} color={col(el.color, "rojo")} r0={pu(num(el.radio, 12) * 0.2)} r1={pu(el.radio, 12)} n={3} periodo={1.2} t0={t0} t1={t1} ancho={5} />
);

export const RayosEl: React.FC<ElProps> = ({ el, t0, t1 }) => (
  <RayosDolor x={px(el.x)} y={py(el.y)} r={pu(el.radio, 8)} n={9} color={col(el.color, "rojo")} t0={t0} t1={t1 < 9000 ? t1 : undefined} largo={pu(num(el.radio, 8) * 0.45)} />
);

export const HaloEl: React.FC<ElProps> = ({ el, t0, t1 }) => {
  const t = useT();
  const k = prog(t, t0, 0.5) * (t1 < 9000 ? 1 - prog(t, t1 - 0.3, 0.3) : 1);
  if (k <= 0.01) return null;
  return <Halo x={px(el.x)} y={py(el.y)} r={pu(el.radio, 20)} color={claveColor(el.color, "amarillo")} opacidad={(0.55 + 0.25 * onda(t, 1.1)) * k} />;
};

/** Iconos sencillos en una caja de 100×100 centrada en (0,0). */
function icono(tipo: string, color: string): React.ReactNode {
  const base = { fill: "none", stroke: color, strokeWidth: 7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (tipo) {
    case "pildora":
      return (
        <g transform="rotate(-35)">
          <rect x={-46} y={-19} width={92} height={38} rx={19} fill={C.panel} {...{ stroke: color, strokeWidth: 6 }} />
          <path d="M 0,-19 L -27,-19 A 19 19 0 0 0 -27,19 L 0,19 Z" fill={color} fillOpacity={0.55} />
          <path d="M 0,-19 L 0,19" stroke={color} strokeWidth={5} />
        </g>
      );
    case "jeringa":
      return (
        <g transform="rotate(-40)">
          <rect x={-34} y={-13} width={58} height={26} rx={5} fill={C.panel} stroke={color} strokeWidth={6} />
          <path d="M -34,0 L -54,0 M 24,0 L 44,0 M 44,-16 L 44,16" {...base} />
          <path d="M -18,-13 L -18,-4 M -6,-13 L -6,-4 M 6,-13 L 6,-4 M 18,-13 L 18,-4" stroke={color} strokeWidth={4} />
          <rect x={-34} y={-13} width={26} height={26} fill={color} fillOpacity={0.35} />
        </g>
      );
    case "gota":
      return <path d="M 0,-44 C 14,-20 30,-4 30,14 C 30,32 16,44 0,44 C -16,44 -30,32 -30,14 C -30,-4 -14,-20 0,-44 Z" fill={color} fillOpacity={0.3} stroke={color} strokeWidth={6} strokeLinejoin="round" />;
    case "rayo":
      return <path d="M 10,-48 L -26,6 L -2,6 L -12,48 L 28,-10 L 2,-10 Z" fill={color} fillOpacity={0.35} stroke={color} strokeWidth={6} strokeLinejoin="round" />;
    case "reloj":
      return (
        <g>
          <circle r={40} fill={C.panel} stroke={color} strokeWidth={6} />
          <path d="M 0,0 L 0,-24 M 0,0 L 18,10" {...base} />
        </g>
      );
    case "bacteria":
      return (
        <g>
          <rect x={-40} y={-20} width={80} height={40} rx={20} fill={color} fillOpacity={0.2} stroke={color} strokeWidth={6} />
          <path d="M 40,0 C 52,-14 60,14 70,0" {...base} strokeWidth={5} />
          <circle cx={-14} cy={-4} r={4} fill={color} />
          <circle cx={6} cy={6} r={4} fill={color} />
          <circle cx={18} cy={-6} r={4} fill={color} />
        </g>
      );
    case "virus":
      return (
        <g>
          <circle r={22} fill={color} fillOpacity={0.25} stroke={color} strokeWidth={6} />
          {Array.from({ length: 10 }, (_, i) => {
            const a = (i / 10) * Math.PI * 2;
            return (
              <g key={i}>
                <line x1={Math.cos(a) * 24} y1={Math.sin(a) * 24} x2={Math.cos(a) * 40} y2={Math.sin(a) * 40} stroke={color} strokeWidth={5} strokeLinecap="round" />
                <circle cx={Math.cos(a) * 44} cy={Math.sin(a) * 44} r={5} fill={color} />
              </g>
            );
          })}
        </g>
      );
    case "check":
      return <path d="M -30,2 L -8,24 L 32,-24" {...base} strokeWidth={10} />;
    case "cruz":
      return <path d="M -26,-26 L 26,26 M 26,-26 L -26,26" {...base} strokeWidth={10} />;
    case "alerta":
      return (
        <g>
          <path d="M 0,-40 L 42,34 L -42,34 Z" fill={color} fillOpacity={0.2} stroke={color} strokeWidth={6} strokeLinejoin="round" />
          <path d="M 0,-14 L 0,12" {...base} strokeWidth={8} />
          <circle cx={0} cy={24} r={4.5} fill={color} />
        </g>
      );
    case "interrogacion":
      return (
        <text textAnchor="middle" y={34} fontFamily={FUENTE} fontWeight={900} fontSize={110} fill={color}>
          ?
        </text>
      );
    case "mas":
      return <path d="M -30,0 L 30,0 M 0,-30 L 0,30" {...base} strokeWidth={10} />;
    case "menos":
      return <path d="M -30,0 L 30,0" {...base} strokeWidth={10} />;
    case "flecha-arriba":
      return <path d="M 0,40 L 0,-36 M -24,-12 L 0,-38 L 24,-12" {...base} strokeWidth={9} />;
    case "flecha-abajo":
      return <path d="M 0,-40 L 0,36 M -24,12 L 0,38 L 24,12" {...base} strokeWidth={9} />;
    default:
      return iconoExtra(tipo, color) ?? <circle r={30} {...base} />;
  }
}

/** Dibuja un icono por nombre (lo comparten `icono`, `ficha` y `cta`). Caja 100×100 centrada en (0,0). */
export const dibujarIcono = icono;

export const ICONOS = ["pildora", "jeringa", "gota", "rayo", "reloj", "bacteria", "virus", "check", "cruz", "alerta", "interrogacion", "mas", "menos", "flecha-arriba", "flecha-abajo"] as const;

export const IconoEl: React.FC<ElProps> = ({ el, t0, t1 }) => {
  const t = useT();
  const k = Math.min(1.15, pop(t, t0));
  const s = (pu(el.tam, 10) / 100) * (0.5 + 0.5 * k);
  return (
    <Aparece t0={t0} t1={t1} fade={0.2}>
      <g transform={`translate(${px(el.x)} ${py(el.y)}) scale(${s})`}>{icono(texto(el.icono, "alerta"), col(el.color, "amarillo"))}</g>
    </Aparece>
  );
};

/** Dibujo libre de la IA: SVG saneado en una caja de 100×100 centrada en (0,0), escalada a `tam` unidades. */
export const SvgLibreEl: React.FC<ElProps> = ({ el, t0, t1 }) => {
  const { markup } = React.useMemo(() => sanitizarSvg(texto(el.svg)), [el.svg]);
  const s = pu(el.tam, 20) / 100;
  return (
    <Aparece t0={t0} t1={t1} fade={0.4}>
      <g transform={`translate(${px(el.x)} ${py(el.y)}) scale(${s})`} dangerouslySetInnerHTML={{ __html: markup }} />
    </Aparece>
  );
};
