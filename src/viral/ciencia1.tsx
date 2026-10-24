/**
 * Plantillas «documentales» 1/2 (ciencia, naturaleza, tecnología):
 *   ZOOM   viaje de escala sin cortes (anillos 10^x m, elementos que crecen, indicador «ANCHO DEL CUADRO»)
 *   CAPAS  disco plano que gira en perspectiva y se separa en capas (vista explotada)
 *   MIRA   mira telescópica que fija un objeto diminuto, lo mide con una cota y se acerca
 * Además: <Banda/> (franja superior con el titular), <FichaCita/> (ficha bibliográfica) y <HudEscala/>.
 */
import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import { getLength } from "@remotion/paths";
import { azar } from "../lib/anim";
import { TV, exponenteZoom, longitudLegible, opacidadZoom, type EscenaViralGuardada } from "../anim/viral";
import { StudioSvgDefs } from "../estudio/efectos";
import { useUid } from "../estudio/util";
import { Trama } from "./escenarios";
import { Etiqueta, EsferaIcono, FUENTE, H, IconoSvg, MONO, TextoCinetico, W, aclarar, clamp, easeInOut, easeOut, fmtNum, lerp, oscurecer, prog, puntoEn, spr, useReloj, useViral } from "./comun";

type P = { e: EscenaViralGuardada };

const FONDO_BANDA = "rgba(1,10,31,0.74)";
const frac = (x: number): number => x - Math.floor(x);

const luminancia = (hex: string): number => {
  const h = hex.replace("#", "");
  const v = h.length === 3 ? h.split("").map((c) => parseInt(c + c, 16)) : [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
};
/** Color de acento que se ve sobre la banda oscura en cualquier fondo (en el dorado, el acento del tema es azul marino: se usa el dorado de marca). */
export const acentoBanda = (T: { acento: string; sobreAcento: string }): string => (luminancia(T.acento) >= luminancia(T.sobreAcento) ? T.acento : T.sobreAcento);

/* ───────────── banda superior, ficha de cita, indicador de escala ───────────── */

/** Franja oscura semitransparente arriba: etiqueta mono + titular (palabra clave en color de acento). Se abre de izquierda a derecha. */
export const Banda: React.FC<{ texto: string; destacada: string; tag: string }> = ({ texto, destacada, tag }) => {
  const { f, a } = useReloj();
  const { T } = useViral();
  const k = easeOut(spr(f, a(0.02), { damping: 18, stiffness: 120, mass: 0.7 }));
  const brillo = acentoBanda(T);
  return (
    <>
      <div style={{ position: "absolute", left: 0, top: 205, width: W, height: 190, background: FONDO_BANDA, borderBottom: `4px solid ${brillo}`, transformOrigin: "0 50%", transform: `scaleX(${clamp(k)})` }} />
      <div style={{ position: "absolute", left: 0, top: 205, width: 18, height: 190, background: brillo, transform: `scaleY(${clamp(k)})`, transformOrigin: "50% 0" }} />
      <Etiqueta texto={`// ${tag}`} x={120} y={243} px={26} ancho={600} alinear="left" mono color={brillo} delay={0.12} peso={700} id="banda-tag" />
      <TextoCinetico texto={texto} destacada={destacada} y={322} maxPx={68} minPx={40} maxLineas={2} caja={false} alinear="left" x={120} ancho={840} color="#FFFFFF" colorDestacada={brillo} delay={0.14} id="banda" />
    </>
  );
};

/** Ficha bibliográfica: fondo claro, barra lateral de color, tipografía mono y sombra tramada. Abajo a la izquierda. */
export const FichaCita: React.FC<{ cita: { t: string; y: string } }> = ({ cita }) => {
  const { f, a } = useReloj();
  const { T } = useViral();
  const s = spr(f, a(TV.cita), { damping: 14, stiffness: 140, mass: 0.7 });
  const texto = cita.y ? `${cita.t} · ${cita.y}` : cita.t;
  const px = Math.min(27, Math.floor(560 / (Math.max(8, texto.length) * 0.62)));
  return (
    <div style={{ position: "absolute", left: 120, top: 1562, opacity: clamp(s * 2), transform: `translateY(${(1 - s) * 44}px)` }}>
      <div style={{ position: "absolute", left: 10, top: 10, right: -10, bottom: -10, background: "repeating-linear-gradient(45deg, #02224E 0 2px, transparent 2px 7px)", opacity: 0.6 }} />
      <div data-texto="cita" style={{ position: "relative", display: "flex", background: "#F4F6FB", border: "3px solid #02224E", fontFamily: MONO }}>
        <div style={{ width: 16, background: T.oscuro ? T.acento : "#02224E" }} />
        <div style={{ padding: "10px 22px 12px 18px" }}>
          <div style={{ fontSize: 16, letterSpacing: 4, color: "#5B6B8C", fontWeight: 700 }}>FUENTE</div>
          <div style={{ fontSize: px, fontWeight: 700, color: "#02224E", whiteSpace: "nowrap", marginTop: 2 }}>{texto}</div>
        </div>
      </div>
    </div>
  );
};

/** Recuadro «ANCHO DEL CUADRO»: potencia de diez en vivo y barra de escala amarilla que se ajusta mientras la cámara viaja. */
export const HudEscala: React.FC<{ c: number }> = ({ c }) => {
  const { f, a } = useReloj();
  const { T } = useViral();
  const s = spr(f, a(0.3), { damping: 14, stiffness: 130, mass: 0.7 });
  const k = Math.floor(c - 0.25);
  const barra = 600 * Math.pow(10, k - c); // 34…337 px
  const exp = `${c < 0 ? "−" : ""}${fmtNum(Math.abs(c), 1)}`;
  return (
    <div style={{ position: "absolute", left: 120, top: 1352, opacity: clamp(s * 2), transform: `translateY(${(1 - s) * 40}px)` }}>
      <div style={{ position: "absolute", left: 10, top: 10, right: -10, bottom: -10, background: `repeating-linear-gradient(45deg, ${T.acento} 0 2px, transparent 2px 7px)`, opacity: 0.55 }} />
      <div data-texto="hud-escala" style={{ position: "relative", width: 440, padding: "16px 22px 18px", background: "rgba(1,10,31,0.88)", border: `3px solid ${T.acento}`, fontFamily: MONO, color: "#FFFFFF" }}>
        <div style={{ fontSize: 20, letterSpacing: 3, color: T.acento, fontWeight: 700 }}>ANCHO DEL CUADRO</div>
        <div style={{ display: "flex", alignItems: "flex-start", marginTop: 6, lineHeight: 1 }}>
          <span style={{ fontSize: 74, fontWeight: 800 }}>10</span>
          <span style={{ fontSize: 34, fontWeight: 700, color: T.acento, marginTop: 2, marginLeft: 4, minWidth: 96 }}>{exp}</span>
          <span style={{ fontSize: 34, fontWeight: 700, marginTop: 36, marginLeft: 4 }}>M</span>
        </div>
        <div style={{ position: "relative", height: 40, marginTop: 10 }}>
          <div style={{ position: "absolute", left: 0, top: 10, width: barra, height: 12, background: T.acento }} />
          <div style={{ position: "absolute", left: 0, top: 2, width: 3, height: 28, background: T.acento }} />
          <div style={{ position: "absolute", left: barra - 3, top: 2, width: 3, height: 28, background: T.acento }} />
          <div style={{ position: "absolute", left: barra + 16, top: 0, fontSize: 26, fontWeight: 700, whiteSpace: "nowrap" }}>{longitudLegible(k)}</div>
        </div>
      </div>
    </div>
  );
};

/* ───────────── ZOOM ───────────── */

export const Zoom: React.FC<P> = ({ e }) => {
  const { t } = useReloj();
  const { T } = useViral();
  const z = e.zoom!;
  const c = exponenteZoom(z, t, e.dur);
  const CX = 540, CY = 880;
  const colores = [T.acento, T.acento2, T.peligro, T.exito];
  const lo = Math.floor(Math.min(z.a, z.b)) - 2, hi = Math.ceil(Math.max(z.a, z.b)) + 2;
  const puntos = useMemo(() => Array.from({ length: 78 }, (_, i) => ({ ang: azar(i * 2.3 + 1) * Math.PI * 2, r0: 0.14 + azar(i * 5.1 + 2) * 0.86, capa: i % 3, off: azar(i * 9.7 + 3) * 0.33, tam: 1.1 + azar(i * 3.3) * 1.9 })), []);
  const ordenados = [...z.items.map((it, i) => ({ ...it, i }))].sort((p, q) => q.e - p.e);
  const entrada = prog(t, 0, 0.5);
  return (
    <AbsoluteFill>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }} opacity={entrada}>
        <StudioSvgDefs />
        {/* viaje: puntos que se abren desde el centro (o se cierran, si la cámara se aleja) */}
        {puntos.map((p, i) => {
          const fase = frac((z.a - c) * 0.34 + p.capa / 3 + p.off);
          const rad = (0.05 + 1.25 * Math.pow(fase, 1.6)) * 950 * p.r0;
          return <circle key={i} cx={CX + Math.cos(p.ang) * rad} cy={CY + Math.sin(p.ang) * rad} r={p.tam * (0.6 + fase)} fill="#FFFFFF" opacity={Math.sin(Math.PI * fase) * 0.7} />;
        })}
        {/* anillos de escala: el anillo k mide 10^k m */}
        {Array.from({ length: hi - lo + 1 }, (_, j) => lo + j).map((k) => {
          const R = 320 * Math.pow(10, k - c);
          if (R < 12 || R > 1400) return null;
          const borde = clamp(R / 90) * clamp((1250 - R) / 300);
          return <circle key={k} cx={CX} cy={CY} r={R} fill="none" stroke="#FFFFFF" strokeOpacity={0.3 * borde} strokeWidth={3} strokeDasharray="2 12" strokeLinecap="round" />;
        })}
        <g stroke="#FFFFFF" strokeOpacity={0.5} strokeWidth={3}>
          <line x1={CX - 22} x2={CX + 22} y1={CY} y2={CY} />
          <line x1={CX} x2={CX} y1={CY - 22} y2={CY + 22} />
        </g>
        {ordenados.map((it) => {
          const op = opacidadZoom(it.e, c);
          if (op < 0.01) return null;
          const D = 640 * Math.pow(10, it.e - c);
          const col = colores[it.i % 4];
          return (
            <g key={it.i} opacity={op}>
              <circle cx={CX} cy={CY} r={D / 2 + 16} fill="none" stroke={col} strokeOpacity={0.7} strokeWidth={4} strokeDasharray="3 15" strokeLinecap="round" />
              <EsferaIcono nombre={it.ic} x={CX} y={CY} d={D} color={col} />
            </g>
          );
        })}
      </svg>
      {Array.from({ length: hi - lo + 1 }, (_, j) => lo + j).map((k) => {
        const R = 320 * Math.pow(10, k - c);
        const y = CY - R - 20;
        if (R < 60 || y < 440 || y > 1280) return null;
        return <Etiqueta key={`a${k}`} texto={longitudLegible(k)} x={CX} y={y} px={24} ancho={260} mono color="#FFFFFF" peso={700} opacidad={0.7 * clamp(R / 120) * clamp((1250 - R) / 250)} id="anillo" />;
      })}
      {ordenados.map((it) => {
        const op = opacidadZoom(it.e, c);
        if (op < 0.02) return null;
        const D = 640 * Math.pow(10, it.e - c);
        const y = CY + Math.min(D / 2, 330) + 64;
        return (
          <React.Fragment key={it.i}>
            <Etiqueta texto={it.l} x={CX} y={y} px={46} ancho={780} color="#FFFFFF" peso={900} fondo={FONDO_BANDA} relleno={34} opacidad={op} id="zoom-item" />
            <Etiqueta texto={`≈ ${longitudLegible(Math.round(it.e))}`} x={CX} y={y + 58} px={26} ancho={300} mono color={colores[it.i % 4]} peso={700} opacidad={op} id="zoom-medida" />
          </React.Fragment>
        );
      })}
      <HudEscala c={c} />
      <Banda texto={e.h} destacada={e.w} tag="ESCALA" />
    </AbsoluteFill>
  );
};

/* ───────────── CAPAS (vista explotada 2.5D) ───────────── */

export const Capas: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const { T } = useViral();
  const uid = useUid();
  const cp = e.capas!;
  const n = cp.items.length;
  const CX = 400, RX = 215, TH = 40, CENTRO = 900;
  const tilt = easeInOut((t - a(TV.capasTilt)) / a(TV.capasTiltDur));
  const sep = easeInOut((t - a(TV.capasSepara)) / a(TV.capasSeparaDur));
  const RY = lerp(RX, RX * 0.38, tilt);
  const grosor = TH * tilt;
  const SEP = n === 2 ? 250 : n === 3 ? 220 : 180;
  const paso = lerp(grosor + 4, SEP, sep);
  const yCapa = (i: number): number => CENTRO + (i - (n - 1) / 2) * paso;
  const colores = [T.acento, "#9FB0D0", T.acento2, T.peligro];
  const giro = lerp(-100, 0, tilt) + (t - a(TV.capasTilt)) * 0; // el icono grabado gira mientras se inclina
  const trazo = T.oscuro ? "#02081C" : "#02224E";
  const yUltima = yCapa(n - 1);
  const yCota = yUltima + RY + grosor + 78;
  const pCota = easeOut((t - a(TV.capasEtiqueta(n))) / 0.5);
  return (
    <AbsoluteFill>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <StudioSvgDefs />
        <defs><Trama id={`${uid}hx`} color={trazo} paso={9} grosor={2.2} cruzada opacidad={0.55} /></defs>
        {/* guías de separación */}
        <line x1={CX} x2={CX} y1={yCapa(0)} y2={yUltima} stroke={T.texto} strokeOpacity={0.35 * sep} strokeWidth={3} strokeDasharray="3 12" strokeLinecap="round" />
        {cp.items.map((_, k) => {
          const i = n - 1 - k; // de abajo hacia arriba: la de arriba tapa a las demás
          const y = yCapa(i);
          const col = colores[i % 4];
          const lado = `M ${CX - RX} ${y} A ${RX} ${RY} 0 0 0 ${CX + RX} ${y} L ${CX + RX} ${y + grosor} A ${RX} ${RY} 0 0 1 ${CX - RX} ${y + grosor} Z`;
          return (
            <g key={i}>
              <path d={lado} fill={oscurecer(col, 0.35)} stroke={trazo} strokeWidth={3} strokeLinejoin="round" />
              <path d={lado} fill={`url(#${uid}hx)`} />
              <path d={lado} fill="url(#halftone-dots-m)" mask="url(#halftone-shadow-strong)" opacity={0.7} />
              <ellipse cx={CX} cy={y} rx={RX} ry={RY} fill={col} stroke={trazo} strokeWidth={3} />
              <ellipse cx={CX} cy={y} rx={RX} ry={RY} fill="url(#halftone-dots-l)" mask="url(#halftone-shadow)" opacity={0.75} />
              <ellipse cx={CX} cy={y} rx={RX * 0.78} ry={RY * 0.78} fill="none" stroke={trazo} strokeOpacity={0.35} strokeWidth={3} />
              {i === 0 && (
                <g transform={`translate(${CX} ${y}) scale(1 ${RY / RX}) rotate(${giro})`}>
                  <IconoSvg nombre={cp.ic} x={0} y={0} tam={RX * 0.85} color={trazo} />
                </g>
              )}
            </g>
          );
        })}
        {/* líneas guía hacia las etiquetas */}
        {cp.items.map((_, i) => {
          const p = easeOut((t - a(TV.capasEtiqueta(i)) + 0.12) / 0.35);
          const y = yCapa(i) + grosor / 2;
          return p > 0 ? <g key={i}><line x1={CX + RX + 6} x2={CX + RX + 6 + (656 - CX - RX - 12) * p} y1={y} y2={y} stroke={T.texto} strokeOpacity={0.75} strokeWidth={3} strokeDasharray="2 8" strokeLinecap="round" /><circle cx={CX + RX + 6} cy={y} r={7} fill={colores[i % 4]} stroke={trazo} strokeWidth={2.5} /></g> : null;
        })}
        {/* cota horizontal con el ancho del objeto */}
        {cp.medida && pCota > 0 && (
          <g stroke={T.texto} strokeWidth={3} strokeLinecap="round" opacity={pCota}>
            <line x1={CX - RX} x2={CX + RX} y1={yCota} y2={yCota} />
            <line x1={CX - RX} x2={CX - RX} y1={yCota - 16} y2={yCota + 16} />
            <line x1={CX + RX} x2={CX + RX} y1={yCota - 16} y2={yCota + 16} />
            <path d={`M ${CX - RX + 22} ${yCota - 10} L ${CX - RX} ${yCota} L ${CX - RX + 22} ${yCota + 10} M ${CX + RX - 22} ${yCota - 10} L ${CX + RX} ${yCota} L ${CX + RX - 22} ${yCota + 10}`} fill="none" />
          </g>
        )}
      </svg>
      {cp.items.map((it, i) => {
        const y = yCapa(i) + grosor / 2;
        return (
          <React.Fragment key={i}>
            <Etiqueta texto={it.l} x={672} y={y - (it.m ? 20 : 0)} px={40} ancho={288} alinear="left" color={T.texto} peso={900} delay={TV.capasEtiqueta(i)} id="capa-nombre" />
            {it.m && <Etiqueta texto={it.m} x={672} y={y + 24} px={28} ancho={288} alinear="left" mono color={colores[i % 4] === "#9FB0D0" ? T.suave : colores[i % 4]} peso={700} delay={TV.capasEtiqueta(i) + 0.08} id="capa-material" />}
          </React.Fragment>
        );
      })}
      {cp.medida && <Etiqueta texto={cp.medida} x={CX} y={yCota + 44} px={34} ancho={300} mono color={T.texto} peso={800} delay={TV.capasEtiqueta(n)} id="capa-medida" />}
      <Banda texto={e.h} destacada={e.w} tag="VISTA EXPLOTADA" />
    </AbsoluteFill>
  );
};

/* ───────────── MIRA ───────────── */

export const Mira: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const { T } = useViral();
  const m = e.mira!;
  const TX = 640, TY = 1010;
  const busca = easeInOut(t / a(TV.miraFija));
  const fijada = t >= a(TV.miraFija);
  const kZoom = easeInOut((t - a(TV.miraZoom)) / a(TV.miraZoomDur));
  const ZOOM = 4.4;
  const S = lerp(1, ZOOM, kZoom);
  const Ex = lerp(TX, 540, kZoom), Ey = lerp(TY, 960, kZoom);
  // la mira vaga por el cuadro y se cierra sobre el objetivo
  const errX = (1 - busca) * (Math.sin(t * 3.1) * 190 + 160), errY = (1 - busca) * (Math.cos(t * 2.3) * 150 - 120);
  const mx = TX + errX, my = TY + errY;
  const R = lerp(230, 66, busca);
  const rojo = T.peligro, azul = T.acento2;
  const color = fijada ? azul : rojo;
  const spin = fijada ? 0 : t * 130;
  const distractores = useMemo(() => Array.from({ length: 9 }, (_, i) => ({ x: 170 + azar(i * 6.1 + 1) * 740, y: 540 + azar(i * 4.9 + 2) * 860, r: 6 + azar(i * 3.7) * 14, f: i % 3 })), []);
  const ruta = `M 150 470 Q 330 ${TY + 140} ${TX} ${TY}`;
  const LARGO_RUTA = useMemo(() => getLength(ruta), [ruta]);
  const nPuntos = 34;
  const progRuta = easeOut(t / a(TV.miraFija));
  const pCota = easeOut((t - a(TV.miraCota)) / 0.45);
  const sFlash = clamp((t - a(TV.miraFija)) / 0.35);
  const ancho = 90;
  return (
    <AbsoluteFill>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <StudioSvgDefs />
        <g transform={`translate(${Ex} ${Ey}) scale(${S}) translate(${-TX} ${-TY})`}>
          {/* ruido del cuadro: elementos sin importancia que se desvanecen al acercarse */}
          <g opacity={1 - kZoom}>
            {distractores.map((d, i) => (
              d.f === 0 ? <circle key={i} cx={d.x} cy={d.y + Math.sin(t * 1.2 + i) * 6} r={d.r} fill="none" stroke={T.texto} strokeOpacity={0.4} strokeWidth={3} />
                : d.f === 1 ? <rect key={i} x={d.x - d.r} y={d.y - d.r} width={d.r * 2} height={d.r * 2} fill={T.texto} fillOpacity={0.22} transform={`rotate(${t * 20 + i * 30} ${d.x} ${d.y})`} />
                  : <path key={i} d={`M ${d.x} ${d.y - d.r} L ${d.x + d.r} ${d.y + d.r} L ${d.x - d.r} ${d.y + d.r} Z`} fill="none" stroke={T.texto} strokeOpacity={0.35} strokeWidth={3} />
            ))}
          </g>
          {/* seguimiento punteado desde la esquina hasta el objetivo */}
          {Array.from({ length: nPuntos }, (_, i) => {
            const u = i / (nPuntos - 1);
            if (u > progRuta) return null;
            const p = puntoEn(ruta, u * LARGO_RUTA);
            return <circle key={i} cx={p.x} cy={p.y} r={4 / S} fill={color} opacity={(1 - kZoom) * (0.35 + 0.65 * u)} />;
          })}
          {/* objetivo */}
          <EsferaIcono nombre={m.ic} x={TX} y={TY} d={64} color={T.acento} delay={0.15} />
          {/* mira telescópica */}
          <g transform={`translate(${mx} ${my})`}>
            <line x1={-1400} x2={-R - 24} y1={0} y2={0} stroke={color} strokeWidth={2.5} strokeOpacity={0.7} vectorEffect="non-scaling-stroke" />
            <line x1={R + 24} x2={1400} y1={0} y2={0} stroke={color} strokeWidth={2.5} strokeOpacity={0.7} vectorEffect="non-scaling-stroke" />
            <line y1={-1400} y2={-R - 24} x1={0} x2={0} stroke={color} strokeWidth={2.5} strokeOpacity={0.7} vectorEffect="non-scaling-stroke" />
            <line y1={R + 24} y2={1400} x1={0} x2={0} stroke={color} strokeWidth={2.5} strokeOpacity={0.7} vectorEffect="non-scaling-stroke" />
            <circle r={R} fill="none" stroke={color} strokeWidth={5} vectorEffect="non-scaling-stroke" />
            <g transform={`rotate(${spin})`} stroke={color} strokeWidth={6} strokeLinecap="round" vectorEffect="non-scaling-stroke">
              {[0, 90, 180, 270].map((g) => <path key={g} d={`M ${R + 14} 0 L ${R - 12} 0`} transform={`rotate(${g})`} vectorEffect="non-scaling-stroke" />)}
            </g>
            {sFlash > 0 && sFlash < 1 && <circle r={R + 60 * sFlash} fill="none" stroke={azul} strokeWidth={5} strokeOpacity={1 - sFlash} vectorEffect="non-scaling-stroke" />}
          </g>
          {/* cota: ancho del objetivo */}
          {m.med && pCota > 0 && (
            <g stroke={T.texto} strokeWidth={3} strokeLinecap="round" opacity={pCota} vectorEffect="non-scaling-stroke">
              <line x1={TX - ancho / 2} x2={TX + ancho / 2} y1={TY + 76} y2={TY + 76} vectorEffect="non-scaling-stroke" />
              <line x1={TX - ancho / 2} x2={TX - ancho / 2} y1={TY + 30} y2={TY + 88} strokeDasharray="3 6" vectorEffect="non-scaling-stroke" />
              <line x1={TX + ancho / 2} x2={TX + ancho / 2} y1={TY + 30} y2={TY + 88} strokeDasharray="3 6" vectorEffect="non-scaling-stroke" />
            </g>
          )}
        </g>
      </svg>
      <Etiqueta texto={fijada ? "OBJETIVO FIJADO" : "BUSCANDO…"} x={W / 2} y={1210} px={34} ancho={620} mono color={fijada ? "#FFFFFF" : rojo} peso={800} fondo={fijada ? azul : FONDO_BANDA} relleno={30} opacidad={1 - kZoom} id="mira-estado" />
      {m.med && <Etiqueta texto={m.med} x={TX} y={TY + 128 > 1180 ? 1180 : TY + 128} px={36} ancho={250} mono color={T.texto} peso={800} delay={TV.miraCota} opacidad={1 - kZoom} id="mira-medida" />}
      {kZoom > 0.6 && <Etiqueta texto={m.l} x={W / 2} y={1330} px={64} ancho={780} color="#FFFFFF" peso={900} fondo={FONDO_BANDA} relleno={44} opacidad={clamp((kZoom - 0.6) / 0.4)} id="mira-nombre" />}
      <Banda texto={e.h} destacada={e.w} tag="OBJETIVO" />
    </AbsoluteFill>
  );
};
