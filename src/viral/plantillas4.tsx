/** Plantillas virales 4: DONUT (reparto de un total), PICTO («3 de cada 10»), TOP (ranking de abajo hacia arriba) y MITO (mito vs. realidad). */
import React from "react";
import { AbsoluteFill } from "remotion";
import { TV, type EscenaViralGuardada } from "../anim/viral";
import { StudioSvgDefs } from "../estudio/efectos";
import { ANCHO_TEXTO, Confeti, Etiqueta, EsferaIcono, FUENTE, H, IconoSvg, MONO, Panel, TextoCinetico, W, clamp, easeOut, fmtNum, polarXY, prog, spr, useReloj, useViral } from "./comun";
import { Encabezado } from "./plantillas1";

type P = { e: EscenaViralGuardada };

/* ───────────── DONUT ───────────── */

export const Donut: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const { T } = useViral();
  const partes = e.donut;
  const total = partes.reduce((s, p) => s + p.v, 0) || 1;
  const CX = 540, CY = 930, R = 300, GROSOR = 124, rm = R - GROSOR / 2;
  const p = easeOut((t - a(TV.donut)) / a(TV.donutDur));
  const colores = [T.acento, T.acento2, T.exito, T.peligro];
  const GAP = partes.length > 1 ? 3 : 0;
  let acumulado = 0;
  const arcos = partes.map((pt, i) => {
    const barrido = (pt.v / total) * 360;
    const ini = acumulado;
    acumulado += barrido;
    const visible = clamp((p * 360 - ini) / Math.max(0.001, barrido));
    return { ...pt, i, ini, barrido, visible };
  });
  const mayor = partes.reduce((m, x, i) => (x.v > partes[m].v ? i : m), 0);
  const pct = (partes[mayor].v / total) * 100;
  const pctMostrado = pct * p;
  const sCentro = spr(f, a(TV.donut - 0.1), { damping: 11, stiffness: 150, mass: 0.7 });
  const arco = (a0: number, a1: number): string => {
    const [x0, y0] = polarXY(CX, CY, rm, a0 - 90), [x1, y1] = polarXY(CX, CY, rm, a1 - 90);
    return `M ${x0} ${y0} A ${rm} ${rm} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}`;
  };
  return (
    <AbsoluteFill>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <StudioSvgDefs />
        <circle cx={CX} cy={CY} r={rm} fill="none" stroke={T.texto} strokeOpacity={0.12} strokeWidth={GROSOR} />
        {arcos.map((s) => s.visible > 0.002 && (
          <path key={s.i} d={arco(s.ini + GAP / 2, s.ini + Math.max(0.5, s.barrido * s.visible - GAP / 2))} fill="none" stroke={colores[s.i % 4]} strokeWidth={GROSOR + (s.i === mayor ? 16 : 0)} strokeLinecap="butt" />
        ))}
        <circle cx={CX} cy={CY} r={R - GROSOR - 24} fill={T.oscuro ? "rgba(2,20,50,0.55)" : "rgba(255,255,255,0.65)"} />
        {partes.map((pt, i) => {
          const s = spr(f, a(TV.donut + TV.donutDur - 0.2 + i * 0.12), { damping: 13, stiffness: 140, mass: 0.7 });
          const y = 1360 + i * 74;
          return <circle key={i} cx={W / 2 - 235} cy={y} r={20 * clamp(s * 1.4)} fill={colores[i % 4]} />;
        })}
      </svg>
      <Encabezado texto={e.h} destacada={e.w} y={310} />
      <div data-texto="porcentaje" style={{ position: "absolute", left: CX - 230, top: CY - 22, width: 460, textAlign: "center", transform: `translateY(-50%) scale(${0.7 + 0.3 * sCentro})`, opacity: clamp(sCentro * 2), fontFamily: FUENTE, fontWeight: 900, fontSize: 150, letterSpacing: "-0.04em", lineHeight: 1, color: T.texto, whiteSpace: "nowrap" }}>
        {fmtNum(pctMostrado, 0)}<span style={{ fontSize: 80, color: T.acento }}>%</span>
      </div>
      <Etiqueta texto={partes[mayor].l} x={CX} y={CY + 92} px={42} ancho={400} color={T.suave} delay={TV.donut + 0.3} peso={800} id="etiqueta-donut" />
      {partes.map((pt, i) => (
        <Etiqueta key={i} texto={`${pt.l} · ${fmtNum((pt.v / total) * 100, 0)} %`} x={W / 2 - 195} y={1360 + i * 74} px={46} ancho={560} alinear="left" color={T.texto} delay={TV.donut + TV.donutDur - 0.2 + i * 0.12} peso={800} id="leyenda" />
      ))}
    </AbsoluteFill>
  );
};

/* ───────────── PICTO ───────────── */

export const Picto: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const { T } = useViral();
  const pc = e.picto!;
  const COLS = Math.min(pc.n, 5);
  const FILAS = Math.ceil(pc.n / COLS);
  const CELDA = FILAS <= 2 ? 150 : FILAS === 3 ? 136 : 120;
  const PASO = CELDA + 26;
  const ancho = COLS * PASO - 26;
  const x0 = 540 - ancho / 2;
  const alto = FILAS * PASO - 26;
  const yIni = 860 - alto / 2;
  const yTexto = yIni + alto + 150;
  const finIconos = TV.picto(pc.n - 1) + 0.5;
  const sTitulo = spr(f, a(finIconos - 0.3), { damping: 10, stiffness: 150, mass: 0.7 });
  const px = Math.min(130, Math.floor(820 / (`${pc.k} DE CADA ${pc.n}`.length * 0.66)));
  return (
    <AbsoluteFill>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <StudioSvgDefs />
        {Array.from({ length: pc.n }, (_, i) => {
          const col = i % COLS, fila = Math.floor(i / COLS);
          const cx = x0 + col * PASO + CELDA / 2, cy = yIni + fila * PASO + CELDA / 2;
          const s = spr(f, a(TV.picto(i)), { damping: 11, stiffness: 170, mass: 0.6 });
          const encendido = i < pc.k;
          return (
            <g key={i} transform={`translate(${cx} ${cy}) scale(${Math.max(0.0001, s)})`} opacity={clamp(s * 2)}>
              <rect x={-CELDA / 2} y={-CELDA / 2} width={CELDA} height={CELDA} rx={CELDA * 0.26} fill={encendido ? T.acento : T.panel} stroke={encendido ? "none" : T.borde} strokeWidth={2.5} />
              {encendido && <rect x={-CELDA / 2} y={-CELDA / 2} width={CELDA} height={CELDA} rx={CELDA * 0.26} fill="url(#halftone-dots-s)" mask="url(#halftone-shadow)" opacity={0.6} />}
              <IconoSvg nombre={pc.ic} x={0} y={0} tam={CELDA * 0.6} color={encendido ? T.sobreAcento : T.suave} />
            </g>
          );
        })}
        <Confeti x={540} y={yIni + alto / 2} t0={finIconos} n={26} radio={420} />
      </svg>
      <Encabezado texto={e.h} destacada={e.w} y={310} />
      <div data-texto="picto-titulo" style={{ position: "absolute", left: 540 - 420, top: yTexto, width: 840, textAlign: "center", transform: `translateY(-50%) scale(${0.6 + 0.4 * sTitulo})`, opacity: clamp(sTitulo * 2), fontFamily: FUENTE, fontWeight: 900, fontSize: px, letterSpacing: "-0.03em", lineHeight: 1, color: T.texto, whiteSpace: "nowrap" }}>
        <span style={{ color: T.acento }}>{pc.k}</span> DE CADA <span style={{ color: T.acento }}>{pc.n}</span>
      </div>
      {pc.l && <TextoCinetico texto={pc.l} y={yTexto + 150} maxPx={58} minPx={38} maxLineas={2} caja={false} delay={finIconos + 0.2} peso={800} color={T.texto} id="picto-etiqueta" />}
    </AbsoluteFill>
  );
};

/* ───────────── TOP ───────────── */

export const Top: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const { T } = useViral();
  const n = e.top.length;
  const ALTO = n >= 5 ? 156 : n === 4 ? 188 : 206, PASO = ALTO + 26;
  const Y0 = n >= 5 ? 540 : 590;
  return (
    <AbsoluteFill>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <StudioSvgDefs />
        {e.top.map((it, i) => {
          const orden = n - 1 - i; // el último puesto sale primero y el #1 al final
          const s = spr(f, a(TV.item(orden)), { damping: 14, stiffness: 130, mass: 0.8 });
          const primero = i === 0;
          const y = Y0 + i * PASO;
          return (
            <g key={i} transform={`translate(${(i % 2 ? 1 : -1) * (1 - s) * 520} 0)`} opacity={clamp(s * 2)}>
              <Panel x={90} y={y} w={900} h={ALTO} r={52} relleno={primero ? T.acento : undefined} borde={primero ? T.acento : undefined} />
              <circle cx={192} cy={y + ALTO / 2} r={ALTO * 0.33} fill={primero ? T.sobreAcento : T.acento} />
            </g>
          );
        })}
        <Confeti x={540} y={Y0 + ALTO / 2} t0={TV.item(n - 1) + 0.15} n={24} radio={380} />
      </svg>
      <Encabezado texto={e.h} destacada={e.w} y={310} />
      {e.top.map((it, i) => {
        const orden = n - 1 - i;
        const s = spr(f, a(TV.item(orden)), { damping: 14, stiffness: 130, mass: 0.8 });
        const primero = i === 0;
        const y = Y0 + i * PASO + ALTO / 2;
        const dx = (i % 2 ? 1 : -1) * (1 - s) * 520;
        return (
          <React.Fragment key={i}>
            <div data-texto="puesto" style={{ position: "absolute", left: 192 - 60 + dx, top: y, width: 120, textAlign: "center", transform: "translateY(-50%)", fontFamily: FUENTE, fontWeight: 900, fontSize: Math.floor(ALTO * 0.38), lineHeight: 1, color: primero ? T.acento : T.sobreAcento, opacity: clamp(s * 2) }}>{i + 1}</div>
            <Etiqueta texto={it.l} x={290 + dx} y={y} px={56} ancho={it.v ? 450 : 650} alinear="left" color={primero ? T.sobreAcento : T.texto} delay={TV.item(orden) + 0.05} peso={900} id="top-item" />
            {it.v && <Etiqueta texto={it.v} x={950 + dx} y={y} px={54} ancho={230} alinear="right" color={primero ? T.sobreAcento : T.acento} delay={TV.item(orden) + 0.1} peso={900} mayus={false} mono={/^[\d.,%+\-x×° ]+$/i.test(it.v)} id="top-valor" />}
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};

/* ───────────── MITO ───────────── */

export const Mito: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const { T } = useViral();
  const sMito = spr(f, a(TV.mito), { damping: 13, stiffness: 140, mass: 0.8 });
  const sVerdad = spr(f, a(TV.verdad), { damping: 10, stiffness: 150, mass: 0.7 });
  const tacha = prog(t, a(TV.tacha), 0.45);
  const dim = 1 - 0.38 * tacha;
  const lineaA = tacha, lineaB = clamp((tacha - 0.35) / 0.65);
  const xA = 130, xB = 950, yA = 566, yB = 906;
  return (
    <AbsoluteFill>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <StudioSvgDefs />
        <g opacity={clamp(sMito * 2) * dim} transform={`translate(${(1 - sMito) * -500} 0)`}>
          <Panel x={90} y={520} w={900} h={430} r={56} />
          <rect x={140} y={556} width={190} height={64} rx={32} fill={T.peligro} />
        </g>
        <g opacity={clamp(sMito * 2)}>
          {lineaA > 0.01 && <line x1={xA} y1={yA} x2={xA + (xB - xA) * lineaA} y2={yA + (yB - yA) * lineaA} stroke={T.peligro} strokeWidth={18} strokeLinecap="round" />}
          {lineaB > 0.01 && <line x1={xB} y1={yA} x2={xB + (xA - xB) * lineaB} y2={yA + (yB - yA) * lineaB} stroke={T.peligro} strokeWidth={18} strokeLinecap="round" />}
        </g>
        <g opacity={clamp(sVerdad * 2)} transform={`translate(${(1 - sVerdad) * 500} 0)`}>
          <Panel x={90} y={1010} w={900} h={470} r={56} relleno={T.acento} borde={T.acento} />
          <rect x={140} y={1046} width={250} height={64} rx={32} fill={T.exito} />
        </g>
        <EsferaIcono nombre="cruz" x={900} y={520} d={120} color={T.peligro} delay={TV.mito + 0.2} />
        <EsferaIcono nombre="check" x={900} y={1010} d={130} color={T.exito} delay={TV.verdad + 0.1} />
        <Confeti x={540} y={1245} t0={TV.verdad + 0.1} n={26} radio={420} colores={[T.exito, "#FFFFFF", T.texto]} />
      </svg>
      <Encabezado texto={e.h} destacada={e.w} y={310} />
      <MiniTag texto="MITO" x={140 + 95} y={588} color="#FFFFFF" delay={TV.mito + 0.1} dx={(1 - sMito) * -500} />
      <MiniTag texto="REALIDAD" x={140 + 125} y={1078} color="#FFFFFF" delay={TV.verdad + 0.05} dx={(1 - sVerdad) * 500} />
      <div style={{ opacity: dim }}><TextoCinetico texto={e.myth} y={770} maxPx={66} minPx={40} maxLineas={3} caja={false} alinear="left" x={150} ancho={760} delay={TV.mito + 0.15} peso={800} color={T.texto} id="mito" /></div>
      <TextoCinetico texto={e.truth} y={1290} maxPx={70} minPx={40} maxLineas={3} caja={false} alinear="left" x={150} ancho={780} delay={TV.verdad + 0.1} peso={900} color={T.sobreAcento} id="verdad" />
    </AbsoluteFill>
  );
};

const MiniTag: React.FC<{ texto: string; x: number; y: number; color: string; delay: number; dx: number }> = ({ texto, x, y, color, delay, dx }) => {
  const { f, a } = useReloj();
  const s = spr(f, a(delay), { damping: 13, stiffness: 150, mass: 0.7 });
  return (
    <div data-texto="etiqueta-mito" style={{ position: "absolute", left: x + dx, top: y, transform: "translate(-50%, -50%)", fontFamily: FUENTE, fontWeight: 900, fontSize: 38, letterSpacing: "0.08em", color, opacity: clamp(s * 2), whiteSpace: "nowrap" }}>{texto}</div>
  );
};
