import React from "react";
import { Easing } from "remotion";
import { C, FUENTE } from "../../lib/colores";
import { azar, lerp, onda, pop, prog, useT, ventana } from "../../lib/anim";
import { tiempoDe } from "../../lib/voz";
import { CORAZON } from "../../components/anatomia/Corazon";
import { Aros, Etiqueta, Flujo, Halo, Impulso, Trazo, Tubo } from "../../components/svg/primitivas";
import type { EscenaProps } from "../tipos";

// ---- Geometría (coordenadas absolutas del escenario: x 0–1080, y 350–1350) ----
const ARTERIA_Y = 520;
const CLOT = { x: 566, y: ARTERIA_Y };
const ARTERIA_IZQ = `M -60,${ARTERIA_Y} L ${CLOT.x - 52},${ARTERIA_Y}`;
const FRONTERA_X = 590; // a la derecha de esta línea el músculo no recibe sangre

type Celda = { cx: number; cy: number; isq: boolean; orden: number };
const CELDAS: Celda[] = [];
for (let r = 0; r < 7; r++) {
  for (let c = 0; c < 5; c++) {
    const cx = 180 + c * 175 + (r % 2) * 87;
    const cy = 722 + r * 78;
    CELDAS.push({ cx, cy, isq: cx >= FRONTERA_X, orden: cx / 1100 + r * 0.045 });
  }
}

const CAPILARES_SANOS = [180, 355, 520];
const CAPILARES_VACIOS = [705, 880];

// Nervio sensitivo: dos ramas terminales en el músculo que confluyen en un tronco que baja
const NERVIO_A = "M 706,905 C 742,950 768,962 800,1004 C 842,1064 900,1066 935,1124 L 935,1352";
const NERVIO_B = "M 806,800 C 838,850 872,858 902,902 C 952,960 962,1040 935,1124 L 935,1352";
const TERMINALES = [
  { x: 706, y: 905 },
  { x: 806, y: 800 },
];

const MOLECULAS = [
  { txt: "H^{+}", color: C.rojo, tam: 31 },
  { txt: "K^{+}", color: C.azul, tam: 31 },
  { txt: "ATP", color: C.amarillo, tam: 33 },
] as const;

const Celdas: React.FC<{ t0: number; iscP: number }> = ({ t0, iscP }) => {
  const t = useT();
  return (
    <g>
      {CELDAS.map((c, i) => {
        const k = prog(t, t0 + c.orden * 0.55, 0.45, Easing.out(Easing.cubic));
        if (k <= 0.01) return null;
        const temblor = c.isq ? iscP * Math.sin(t * 38 + i * 1.7) * 1.4 : 0;
        return (
          <g key={i} transform={`translate(${c.cx + temblor} ${c.cy}) scale(${0.9 + 0.1 * k})`} opacity={k}>
            <rect x={-75} y={-26} width={150} height={52} rx={26} fill={C.panel} />
            <rect x={-75} y={-26} width={150} height={52} rx={26} fill="rgba(248,250,252,0.07)" stroke="rgba(248,250,252,0.5)" strokeWidth={3} />
            {[-40, -14, 14, 40].map((x) => (
              <line key={x} x1={x} y1={-12} x2={x} y2={12} stroke={C.hueso} strokeOpacity={0.14} strokeWidth={2} />
            ))}
            <ellipse cx={0} cy={0} rx={15} ry={9} fill={C.hueso} fillOpacity={0.2} />
            {c.isq && (
              <g opacity={iscP}>
                <rect x={-75} y={-26} width={150} height={52} rx={26} fill="#2a3446" fillOpacity={0.88} />
                <rect x={-75} y={-26} width={150} height={52} rx={26} fill="none" stroke={C.rojo} strokeWidth={3.2} strokeDasharray="9 8" strokeOpacity={0.85} />
                <path d="M -12,-9 L 12,9 M 12,-9 L -12,9" stroke={C.rojo} strokeWidth={4} strokeLinecap="round" opacity={0.75} />
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
};

/** Cola de glóbulos atascada contra el trombo: vive y respira, pero no avanza. */
const ColaSangre: React.FC<{ t0: number }> = ({ t0 }) => {
  const t = useT();
  const k = prog(t, t0, 0.4);
  if (k <= 0.01) return null;
  const dots = [];
  const n = 19;
  for (let i = 0; i < n; i++) {
    const x = CLOT.x - 78 - i * 28 + Math.sin(t * 3 + i) * 2.2;
    const y = ARTERIA_Y + Math.sin(t * 2.4 + i * 1.9) * 9 + (i % 2 === 0 ? -4 : 4);
    const o2 = i % 3 === 1;
    dots.push(
      <g key={i} transform={`translate(${x} ${y})`} opacity={k * Math.min(1, 1.3 - i / n)}>
        <circle r={o2 ? 12 : 14} fill={o2 ? C.azul : C.rojo} opacity={0.18} />
        <circle r={o2 ? 8 : 10.5} fill={o2 ? C.azul : C.rojo} />
        {!o2 && <circle r={4.5} fill={C.fondo} opacity={0.35} />}
      </g>,
    );
  }
  return <g>{dots}</g>;
};

/** Estallido de moléculas que salen de las células sin oxígeno y buscan las terminales nerviosas. */
const Liberacion: React.FC<{ t0: number; tUnion: number }> = ({ t0, tUnion }) => {
  const t = useT();
  const dots = [];
  const origen = { x: 790, y: 960 };
  for (let i = 0; i < 34; i++) {
    const grande = i < 3;
    const tipo = MOLECULAS[i % 3];
    const inicio = t0 + (grande ? 0.05 * i : 0.06 + 0.035 * i);
    const k = prog(t, inicio, 0.5, Easing.out(Easing.cubic));
    if (k <= 0) continue;
    const ang = (azar(i + 3) * 2 - 1) * Math.PI;
    const radioSalida = 80 + azar(i + 11) * 230;
    const x0 = origen.x + Math.cos(ang) * radioSalida * 0.45 + (azar(i + 21) - 0.5) * 90;
    const y0 = origen.y + Math.sin(ang) * radioSalida * 0.6 + (azar(i + 31) - 0.5) * 130;
    const meta = grande ? TERMINALES[0] : TERMINALES[i % TERMINALES.length];
    const ir = prog(t, t0 + 0.45 + (i % 7) * 0.05, Math.max(0.3, tUnion - t0 - 0.5), Easing.inOut(Easing.cubic));
    // las 3 moléculas grandes se reparten en triángulo alrededor de la terminal para que se lean
    const angMeta = ((i * 120 + 30) * Math.PI) / 180;
    const offX = grande ? Math.cos(angMeta) * 70 : (azar(i + 5) - 0.5) * 70;
    const offY = grande ? Math.sin(angMeta) * 70 : (azar(i + 9) - 0.5) * 70;
    const x = lerp(x0, meta.x + offX, ir) + Math.sin(t * 5 + i) * (1 - ir) * 8;
    const y = lerp(y0, meta.y + offY, ir) + Math.cos(t * 4 + i) * (1 - ir) * 8;
    const r = grande ? tipo.tam : 8 + azar(i + 2) * 6;
    const alfa = k * (ir > 0.97 ? 1 - prog(t, tUnion + 0.15, 0.35) : 1);
    if (alfa <= 0.01) continue;
    dots.push(
      <g key={i} transform={`translate(${x} ${y}) scale(${0.4 + 0.6 * k})`} opacity={alfa}>
        <circle r={r * 1.9} fill={tipo.color} opacity={0.16} />
        <circle r={r} fill={grande ? C.fondo : tipo.color} stroke={tipo.color} strokeWidth={grande ? 3.5 : 0} />
        {grande && (
          <text textAnchor="middle" y={r * 0.34} fontFamily={FUENTE} fontWeight={800} fontSize={r * 0.88} fill={tipo.color}>
            {tipo.txt.includes("{") ? (
              <>
                {tipo.txt[0]}
                <tspan dy={-r * 0.34} fontSize={r * 0.55}>
                  {tipo.txt.slice(3, -1)}
                </tspan>
              </>
            ) : (
              tipo.txt
            )}
          </text>
        )}
      </g>,
    );
  }
  return <g>{dots}</g>;
};

/** 6,5–12 s · isquemia → liberación de sustancias → activación de nervios sensitivos */
export const Isquemia: React.FC<EscenaProps> = ({ ini }) => {
  const t = useT();
  const T = {
    musculo: tiempoDe("músculo"),
    cardiaco: tiempoDe("cardíaco"),
    sin: tiempoDe("sin"),
    oxigeno: tiempoDe("oxígeno"),
    libera: tiempoDe("libera"),
    sustancias: tiempoDe("sustancias"),
    activan: tiempoDe("activan"),
    nervios: tiempoDe("nervios"),
    sensitivos: tiempoDe("sensitivos"),
  };
  const iscP = prog(t, T.sin, 1.1, Easing.inOut(Easing.quad));
  const brilloNervio = prog(t, T.activan, 0.5);
  const clot = pop(t, ini - 0.3);

  return (
    <g>
      <Halo x={800} y={950} r={380} color="rojo" opacidad={0.5 * iscP} />

      {/* Arteria obstruida */}
      <Tubo d={ARTERIA_IZQ} ancho={66} borde={C.rojo} relleno="#2a1220" t0={ini - 0.4} dur={0.5} grosorBorde={5} brillo={0.5} />
      <Trazo d={`M ${CLOT.x + 56},${ARTERIA_Y - 33} L 1120,${ARTERIA_Y - 33}`} color={C.hueso} ancho={4} t0={ini + 0.1} dur={0.7} punteado="10 12" opacidad={0.28} marcha={0} />
      <Trazo d={`M ${CLOT.x + 56},${ARTERIA_Y + 33} L 1120,${ARTERIA_Y + 33}`} color={C.hueso} ancho={4} t0={ini + 0.1} dur={0.7} punteado="10 12" opacidad={0.28} marcha={0} />
      <ColaSangre t0={ini - 0.3} />
      <g transform={`translate(${CLOT.x} ${CLOT.y}) scale(${3.1 * Math.min(1.05, clot)}) translate(-10 -4)`} opacity={clot > 0.02 ? 1 : 0}>
        <path d={CORAZON.trombo} fill="#7f1d1d" stroke={C.rojo} strokeWidth={2.6} strokeLinejoin="round" />
        <path d="M -6,-6 L 22,16 M 2,-12 L 26,8 M -10,6 L 14,24 M 8,-14 L 30,2" stroke="#fca5a5" strokeWidth={1.2} opacity={0.65} fill="none" />
      </g>

      {/* Capilares: los sanos llevan oxígeno, los del territorio bloqueado están vacíos */}
      {CAPILARES_SANOS.map((x, i) => (
        <g key={x}>
          <Tubo d={`M ${x},${ARTERIA_Y + 33} L ${x},684`} ancho={20} borde={C.rojo} relleno="#2a1220" t0={ini + 0.1 + i * 0.1} dur={0.5} grosorBorde={3} />
          <Flujo d={`M ${x},${ARTERIA_Y + 33} L ${x},690`} color={C.azul} n={3} velocidad={0.55} radio={6} t0={ini + 0.5 + i * 0.2} celula={false} />
        </g>
      ))}
      {CAPILARES_VACIOS.map((x, i) => (
        <Trazo key={x} d={`M ${x},${ARTERIA_Y + 33} L ${x},684`} color={C.hueso} ancho={5} t0={ini + 0.3 + i * 0.1} dur={0.5} punteado="6 9" opacidad={0.3} marcha={0} />
      ))}

      {/* Músculo cardíaco */}
      <Celdas t0={T.musculo - 0.15} iscP={iscP} />
      <Trazo d={`M ${FRONTERA_X},668 L ${FRONTERA_X},1236`} color={C.rojo} ancho={4} t0={T.sin} dur={0.6} punteado="12 12" opacidad={0.55} marcha={26} />

      {/* Sin oxígeno: señal de prohibido sobre el territorio apagado */}
      {(() => {
        const k = ventana(t, T.oxigeno, T.libera - 0.1, 0.25) * pop(t, T.oxigeno);
        if (k <= 0.01) return null;
        return (
          <g transform={`translate(800 905) scale(${0.7 + 0.3 * Math.min(1.1, k)})`} opacity={Math.min(1, k)}>
            <circle r={78} fill={C.fondo} fillOpacity={0.82} stroke={C.rojo} strokeWidth={9} />
            <text textAnchor="middle" y={20} fontFamily={FUENTE} fontWeight={900} fontSize={66} fill={C.azul}>
              O<tspan dy={14} fontSize={38}>2</tspan>
            </text>
            <path d="M -55,-55 L 55,55" stroke={C.rojo} strokeWidth={10} strokeLinecap="round" />
          </g>
        );
      })()}

      {/* Liberación química */}
      <Liberacion t0={T.libera} tUnion={T.activan + 0.35} />

      {/* Nervio sensitivo */}
      <g opacity={0.95}>
        <Trazo d={NERVIO_A} color={C.amarillo} ancho={7} t0={T.libera + 0.2} dur={0.9} brillo={0.4 + 0.8 * brilloNervio} />
        <Trazo d={NERVIO_B} color={C.amarillo} ancho={7} t0={T.libera + 0.35} dur={0.9} brillo={0.4 + 0.8 * brilloNervio} />
        {TERMINALES.map((p, i) => {
          const k = pop(t, T.libera + 0.9 + i * 0.1);
          return (
            <g key={i} opacity={Math.min(1, k)}>
              <circle cx={p.x} cy={p.y} r={22 * (1 + 0.25 * brilloNervio * onda(t, 0.35))} fill={C.amarillo} opacity={0.2 + 0.4 * brilloNervio} />
              <circle cx={p.x} cy={p.y} r={11} fill={C.amarillo} />
            </g>
          );
        })}
      </g>
      <Aros x={706} y={905} color={C.amarillo} r0={14} r1={80} n={2} periodo={0.8} t0={T.activan + 0.1} t1={T.sensitivos + 1.2} ancho={4} />
      <Aros x={806} y={800} color={C.amarillo} r0={14} r1={80} n={2} periodo={0.8} t0={T.activan + 0.25} t1={T.sensitivos + 1.2} ancho={4} />
      <Impulso d={NERVIO_A} t0={T.sensitivos + 0.05} dur={1.1} periodo={1.25} />
      <Impulso d={NERVIO_B} t0={T.sensitivos + 0.45} dur={1.1} periodo={1.25} />

      {/* Etiquetas */}
      <Etiqueta x={300} y={1282} texto="Músculo cardíaco" t0={T.cardiaco} tam={34} guia={{ x: 310, y: 1190 }} />
      <Etiqueta x={800} y={628} texto="Sin oxígeno" t0={T.oxigeno} t1={T.libera + 0.8} color={C.rojo} tam={38} guia={{ x: 800, y: 700 }} />
      <Etiqueta x={712} y={1280} texto={["Sustancias", "químicas"]} t0={T.sustancias} t1={T.nervios + 0.5} color={C.hueso} tam={34} guia={{ x: 740, y: 1100 }} />
      <Etiqueta x={340} y={885} texto={["Nervios", "sensitivos"]} t0={T.nervios} color={C.amarillo} tam={36} guia={{ x: 706, y: 905 }} />
      <Aros x={CLOT.x} y={CLOT.y} color={C.rojo} r0={50} r1={120} n={2} periodo={1.4} t0={ini} t1={ini + 6} ancho={4} />
    </g>
  );
};

