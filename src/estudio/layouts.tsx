/**
 * Los 4 layouts matemáticos del estudio. Reglas comunes: más del 60 % del lienzo es espacio negativo, nada se pisa y todo texto queda ≥ 80 px de los bordes.
 *   HERO_CENTER     titular (Y 12–25 %) + una figura protagonista grande (Y 30–80 %) con sombra de piso en puntos
 *   VERSUS_50_50    dos columnas simétricas (X 27 % / 73 %): contadores, figuras, símbolo central y etiquetas
 *   DIAGONAL_SPLIT  lienzo partido por una diagonal a −22°: figura en estado 1 arriba y en estado 2 abajo, con estela y reflejo
 *   SURFACE_STAGE   barra metálica en Y 68 %: una cápsula se estira y avanza como una oruga con reflejo sobre la barra
 */
import React from "react";
import { spring, useCurrentFrame } from "remotion";
import { T_ESTUDIO, type EscenaEstudio, type RolEstudio } from "../anim/estudio";
import { FloorReflection, FondoEstudioSvg, HalftoneFloorShadow, MotionTrail, StudioSvgDefs, useEstudio } from "./efectos";
import { GeometricPrimitive } from "./primitivas";
import { FPS, FUENTE, H, MONO, W, ajustarTam, clamp, dimensiones, grados, movimientoFigura, useUid } from "./util";

/* ───────────── titular ───────────── */

const norm = (s: string): string => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^\p{L}\p{N}%$]/gu, "");

/** Parte el titular en 2 líneas lo más parejas posible. */
export function partirTitular(texto: string): string[][] {
  const palabras = texto.split(/\s+/).filter(Boolean);
  if (palabras.length <= 1 || texto.length <= 13) return [palabras];
  let mejor = 1, dif = Infinity;
  for (let i = 1; i < palabras.length; i++) {
    const d = Math.abs(palabras.slice(0, i).join(" ").length - palabras.slice(i).join(" ").length);
    if (d < dif) { dif = d; mejor = i; }
  }
  return [palabras.slice(0, mejor), palabras.slice(mejor)];
}

/** Tamaño de letra del titular: 72 px, y menos solo si la línea más larga no cabe en 900 px. */
export function tamanoTitular(lineas: string[][]): number {
  const maxCar = Math.max(...lineas.map((l) => l.join(" ").length), 1);
  return Math.max(40, Math.min(72, Math.floor(900 / (maxCar * 0.7))));
}

const Titular: React.FC<{ texto: string; destacada: string; arriba?: number }> = ({ texto, destacada, arriba }) => {
  const f = useCurrentFrame();
  const C = useEstudio();
  const lineas = partirTitular(texto);
  const px = tamanoTitular(lineas);
  const top = arriba ?? 0.12 * H;
  const zona = 0.13 * H;
  let k = 0;
  return (
    <div data-texto="titular" style={{ position: "absolute", left: 90, right: 90, top, height: zona, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: FUENTE, fontWeight: 900, fontSize: px, lineHeight: 1.04, letterSpacing: "-0.03em", textTransform: "uppercase", color: C.texto, textAlign: "center" }}>
      {lineas.map((linea, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "center", gap: px * 0.26, whiteSpace: "nowrap" }}>
          {linea.map((p, j) => {
            const dest = norm(p) === norm(destacada);
            const n = k++;
            const s = f / FPS - (T_ESTUDIO.titulo + n * 0.09) <= 0 ? 0 : spring({ frame: f - (T_ESTUDIO.titulo + n * 0.09) * FPS, fps: FPS, config: { damping: 13, stiffness: 150, mass: 0.7 } });
            const subrayado = dest ? clamp((f / FPS - (T_ESTUDIO.titulo + 0.5)) / 0.5) : 0;
            return (
              <span key={j} style={{ position: "relative", display: "inline-block", color: dest ? C.roles.accent : C.texto, opacity: clamp(s * 1.6), transform: `translateY(${(1 - s) * 46}px) scale(${0.86 + 0.14 * s})`, textShadow: "0 6px 26px rgba(0,0,0,0.45)" }}>
                {p}
                {dest && <span style={{ position: "absolute", left: 0, bottom: -px * 0.06, height: px * 0.07, width: "100%", borderRadius: 9, background: C.roles.accent, transformOrigin: "left", transform: `scaleX(${subrayado})`, opacity: 0.9 }} />}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

/* ───────────── figura animada (movimiento + sombra + reflejo + estela) ───────────── */

type PropsFigura = {
  forma: Parameters<typeof dimensiones>[0];
  detalle: React.ComponentProps<typeof GeometricPrimitive>["detalle"];
  color: string;
  size: number;
  anim: EscenaEstudio["primary"]["animation"];
  t0: number;
  /** punto de contacto con el suelo */
  x: number;
  y: number;
  estela?: boolean;
  reflejo?: boolean;
  sombra?: boolean;
  /** reflejo y sombra se recortan a este rectángulo (barra) */
  recorteReflejo?: { x: number; y: number; w: number; h: number };
  /** limita el recorrido horizontal (px) para que la figura no salga del margen */
  recorrido?: number;
  opacidadReflejo?: number;
};

const FiguraAnimada: React.FC<PropsFigura> = ({ forma, detalle, color, size, anim, t0, x, y, estela, reflejo, sombra = true, recorteReflejo, recorrido, opacidadReflejo }) => {
  const f = useCurrentFrame();
  const uid = useUid();
  const m = movimientoFigura(anim, f, t0);
  const { w, h } = dimensiones(forma, size);
  const tx = recorrido === undefined ? m.tx : clamp(m.tx, -recorrido, recorrido) * (anim === "high_speed_slide" ? 1 : 1);
  const sx = Math.max(0.0001, m.sx), sy = Math.max(0.0001, m.sy);
  const cuerpo = (ligero: boolean) => <GeometricPrimitive forma={forma} detalle={detalle} color={color} size={size} t0={t0} ligero={ligero} />;
  const transf = `translate(${tx} ${m.ty}) scale(${sx} ${sy})`;
  const separacion = 20 + 160 * m.vel;
  return (
    <g transform={`translate(${x} ${y})`}>
      {sombra && m.visible && <g transform={`translate(${tx} 0) scale(${sx} 1)`}><HalftoneFloorShadow ancho={w} elevacion={-m.ty} opacidad={clamp(sx)} /></g>}
      {reflejo && m.visible && (
        <g clipPath={recorteReflejo ? `url(#${uid}rc)` : undefined}>
          {recorteReflejo && <defs><clipPath id={`${uid}rc`}><rect x={recorteReflejo.x - x} y={recorteReflejo.y - y} width={recorteReflejo.w} height={recorteReflejo.h} /></clipPath></defs>}
          <FloorReflection ancho={w * 1.6} alto={h} opacidad={opacidadReflejo}><g transform={transf}>{cuerpo(true)}</g></FloorReflection>
        </g>
      )}
      {estela && m.visible && (
        <MotionTrail activa separacion={separacion} ancho={w} alto={h}><g transform={transf}>{cuerpo(true)}</g></MotionTrail>
      )}
      {m.visible && <g transform={transf}>{cuerpo(false)}</g>}
    </g>
  );
};

const colorDe = (C: ReturnType<typeof useEstudio>, rol: RolEstudio): string => C.roles[rol] ?? C.roles.accent;

/** Dos figuras con el mismo color se confunden: si el rol secundario resuelve igual que el principal, usa el azul eléctrico. */
function colores(C: ReturnType<typeof useEstudio>, e: EscenaEstudio): [string, string] {
  const a = colorDe(C, e.primary.colorRole);
  let b = colorDe(C, e.secondary.colorRole);
  if (b.toLowerCase() === a.toLowerCase()) b = C.roles.secondary.toLowerCase() === a.toLowerCase() ? C.roles.danger : C.roles.secondary;
  return [a, b];
}

/* ───────────── HERO_CENTER ───────────── */

const HeroCenter: React.FC<{ e: EscenaEstudio }> = ({ e }) => {
  const C = useEstudio();
  const [color] = colores(C, e);
  const size = ajustarTam(e.primary.shape, 440, 760, 640);
  const { h } = dimensiones(e.primary.shape, size);
  const base = 0.55 * H + h / 2; // el centro óptico de la figura cae en Y 55 % (zona 30–80 %)
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
      <StudioSvgDefs />
      <FiguraAnimada forma={e.primary.shape} detalle={e.primary.detail} color={color} size={size} anim={e.primary.animation} t0={T_ESTUDIO.figura} x={W / 2} y={base} estela={e.primary.motionTrail} />
    </svg>
  );
};

/* ───────────── VERSUS_50_50 ───────────── */

const Contador: React.FC<{ valor: string; color: string; x: number; y: number; ancho: number }> = ({ valor, color, x, y, ancho }) => {
  const f = useCurrentFrame();
  const solo = valor.replace(/\D/g, "");
  const numerico = /^\d+$/.test(valor);
  const objetivo = numerico ? parseInt(valor, 10) : 0;
  const k = clamp((f / FPS - T_ESTUDIO.contadores) / T_ESTUDIO.contadorDur);
  const e = 1 - Math.pow(1 - k, 3);
  const mostrado = numerico ? Math.round(objetivo * e) : 0;
  const largo = numerico ? Math.max(valor.length, 3) : Math.max(valor.length, 3);
  const texto = numerico ? String(mostrado).padStart(largo, "0") : valor;
  const primerActivo = numerico ? Math.min(texto.search(/[1-9]/) < 0 ? largo - 1 : texto.search(/[1-9]/), largo - 1) : 0;
  const px = Math.min(104, Math.floor((ancho - 70) / (texto.length * 0.62)));
  const aparece = clamp((f / FPS - T_ESTUDIO.contadores + 0.3) / 0.3);
  return (
    <div data-texto="contador" style={{ position: "absolute", left: x - ancho / 2, top: y - px * 0.8, width: ancho, height: px * 1.6, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 24, background: "rgba(0,0,0,0.38)", border: "2px solid rgba(255,255,255,0.1)", boxShadow: `0 0 ${34 * e}px ${color}33, inset 0 0 22px rgba(0,0,0,0.5)`, opacity: aparece, transform: `scale(${0.92 + 0.08 * aparece})` }}>
      <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: px, letterSpacing: "0.04em", lineHeight: 1, display: "flex" }}>
        {texto.split("").map((c, i) => {
          const activo = !numerico || i >= primerActivo;
          return <span key={i} style={{ color: activo ? color : "#FFFFFF", opacity: activo ? 1 : 0.12, textShadow: activo ? `0 0 26px ${color}` : "none" }}>{c}</span>;
        })}
      </div>
      <span style={{ display: "none" }}>{solo}</span>
    </div>
  );
};

const Etiqueta: React.FC<{ texto: string; color: string; x: number; y: number; ancho: number; retraso: number }> = ({ texto, color, x, y, ancho, retraso }) => {
  const f = useCurrentFrame();
  const s = f / FPS - retraso <= 0 ? 0 : spring({ frame: f - retraso * FPS, fps: FPS, config: { damping: 14, stiffness: 130, mass: 0.7 } });
  const px = Math.min(56, Math.floor(ancho / (texto.length * 0.7)));
  return (
    <div data-texto="etiqueta" style={{ position: "absolute", left: x - ancho / 2, top: y - px * 0.6, width: ancho, textAlign: "center", fontFamily: FUENTE, fontWeight: 900, fontSize: px, letterSpacing: "0.02em", textTransform: "uppercase", color, whiteSpace: "nowrap", opacity: clamp(s * 1.5), transform: `translateY(${(1 - s) * 30}px)`, textShadow: `0 0 28px ${color}55` }}>
      {texto}
    </div>
  );
};

const Versus5050: React.FC<{ e: EscenaEstudio }> = ({ e }) => {
  const C = useEstudio();
  const f = useCurrentFrame();
  const v = e.versus!;
  const [ca, cb] = colores(C, e);
  const XL = 0.27 * W, XR = 0.73 * W;
  const COL = 400;
  const baseY = 1190;
  const sizeA = ajustarTam(e.primary.shape, 330, COL - 30, 380);
  const secForma = e.secondary.shape === "NONE" ? "SPHERE" : e.secondary.shape;
  const sizeB = ajustarTam(secForma, 330, COL - 30, 380);
  const sOp = f / FPS - T_ESTUDIO.operador <= 0 ? 0 : spring({ frame: f - T_ESTUDIO.operador * FPS, fps: FPS, config: { damping: 6, stiffness: 190, mass: 0.6 } });
  return (
    <>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <StudioSvgDefs />
        <FiguraAnimada forma={e.primary.shape} detalle={e.primary.detail} color={ca} size={sizeA} anim={e.primary.animation} t0={T_ESTUDIO.figura} x={XL} y={baseY} estela={e.primary.motionTrail} recorrido={30} />
        <FiguraAnimada forma={secForma} detalle={e.secondary.detail} color={cb} size={sizeB} anim={e.primary.animation === "high_speed_slide" ? "high_speed_slide" : "spring_pop"} t0={T_ESTUDIO.figura + 0.2} x={XR} y={baseY} estela={e.secondary.motionTrail} recorrido={30} />
      </svg>
      <Contador valor={v.leftCounter} color={ca} x={XL} y={690} ancho={COL - 40} />
      <Contador valor={v.rightCounter} color={cb} x={XR} y={690} ancho={COL - 40} />
      <div data-texto="operador" style={{ position: "absolute", left: W / 2 - 120, top: 905 - 100, width: 240, height: 200, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FUENTE, fontWeight: 900, fontSize: 190, lineHeight: 1, color: C.neon, textShadow: `0 0 40px ${C.neon}99, 0 0 90px ${C.neon}44`, transform: `scale(${sOp}) rotate(${(1 - sOp) * -40}deg)`, opacity: clamp(sOp * 2) }}>{v.operator}</div>
      <Etiqueta texto={v.leftLabel} color={ca} x={XL} y={1330} ancho={COL} retraso={T_ESTUDIO.etiquetas} />
      <Etiqueta texto={v.rightLabel} color={cb} x={XR} y={1330} ancho={COL} retraso={T_ESTUDIO.etiquetas + 0.15} />
    </>
  );
};

/* ───────────── DIAGONAL_SPLIT ───────────── */

/** Recta que pasa por el centro del lienzo, inclinada −22° (sube hacia la derecha): y = 960 − tan(22°)·(x − 540). */
const PENDIENTE = Math.tan(grados(22));
const yLinea = (x: number): number => H / 2 - PENDIENTE * (x - W / 2);

const DiagonalSplit: React.FC<{ e: EscenaEstudio }> = ({ e }) => {
  const C = useEstudio();
  const f = useCurrentFrame();
  const uid = useUid();
  const [ca, cb] = colores(C, e);
  const y0 = yLinea(0), y1 = yLinea(W);
  const arriba = `M 0 0 L ${W} 0 L ${W} ${y1} L 0 ${y0} Z`;
  const abajo = `M 0 ${y0} L ${W} ${y1} L ${W} ${H} L 0 ${H} Z`;
  const trazo = clamp((f / FPS - 0.1) / 0.7);
  const largo = Math.hypot(W, y0 - y1);
  const secForma = e.secondary.shape === "NONE" ? e.primary.shape : e.secondary.shape;
  const secDetalle = e.secondary.shape === "NONE" ? e.primary.detail : e.secondary.detail;
  const sizeA = ajustarTam(e.primary.shape, 320, 440, 340);
  const sizeB = ajustarTam(secForma, 320, 440, 340);
  const sueloA = 930, sueloB = 1560;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
      <StudioSvgDefs />
      <defs>
        <clipPath id={`${uid}a`}><path d={arriba} /></clipPath>
        <clipPath id={`${uid}b`}><path d={abajo} /></clipPath>
      </defs>
      <g clipPath={`url(#${uid}a)`}>
        <FondoEstudioSvg centro={C.fondo} borde={C.fondo} ruido={false} />
        <line x1={0} y1={sueloA} x2={W} y2={sueloA} stroke="#FFFFFF" strokeOpacity={0.12} strokeWidth={2} />
        <FiguraAnimada forma={e.primary.shape} detalle={e.primary.detail} color={ca} size={sizeA} anim={e.primary.animation} t0={T_ESTUDIO.figura} x={330} y={sueloA} estela={e.primary.motionTrail} reflejo recorrido={200} />
      </g>
      <g clipPath={`url(#${uid}b)`}>
        <FondoEstudioSvg centro={C.fondoAbajo} borde={C.fondoAbajo} ruido={false} />
        <line x1={0} y1={sueloB} x2={W} y2={sueloB} stroke="#FFFFFF" strokeOpacity={0.12} strokeWidth={2} />
        <FiguraAnimada forma={secForma} detalle={secDetalle} color={cb} size={sizeB} anim={e.primary.animation === "heartbeat_pulse" ? "heartbeat_pulse" : "high_speed_slide"} t0={T_ESTUDIO.figura + 0.25} x={W - 330} y={sueloB} estela reflejo recorrido={200} />
      </g>
      <rect width={W} height={H} fill="url(#studio-noise-tile)" opacity={0.06} style={{ mixBlendMode: "overlay" }} />
      <line x1={0} y1={y0} x2={W} y2={y1} stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" strokeDasharray={largo} strokeDashoffset={largo * (1 - trazo)} filter="url(#studio-glow)" />
    </svg>
  );
};

/* ───────────── SURFACE_STAGE ───────────── */

const SurfaceStage: React.FC<{ e: EscenaEstudio }> = ({ e }) => {
  const C = useEstudio();
  const uid = useUid();
  const [color] = colores(C, e);
  const YB = 0.68 * H; // 1306: cara superior de la barra
  const BARRA = { x: 90, y: YB, w: W - 180, h: 70 };
  const size = ajustarTam(e.primary.shape, 380, 520, 360);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
      <StudioSvgDefs />
      <defs>
        <linearGradient id={`${uid}m`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4A5670" /><stop offset="0.18" stopColor="#262E40" /><stop offset="1" stopColor="#0B0E16" /></linearGradient>
        <linearGradient id={`${uid}l`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#CFE0FF" stopOpacity={0} /><stop offset="0.5" stopColor="#E7F0FF" /><stop offset="1" stopColor="#CFE0FF" stopOpacity={0} /></linearGradient>
      </defs>
      <rect x={BARRA.x} y={BARRA.y} width={BARRA.w} height={BARRA.h} rx={14} fill={`url(#${uid}m)`} />
      <rect x={BARRA.x} y={BARRA.y + BARRA.h - 12} width={BARRA.w} height={12} rx={6} fill="url(#halftone-dots-m)" opacity={0.7} />
      <FiguraAnimada forma={e.primary.shape} detalle={e.primary.detail} color={color} size={size} anim={e.primary.animation === "spring_pop" ? "elastic_crawl" : e.primary.animation} t0={T_ESTUDIO.figura} x={W / 2} y={YB} estela={e.primary.motionTrail} reflejo opacidadReflejo={0.3} recorteReflejo={BARRA} sombra recorrido={130} />
      <rect x={BARRA.x + 10} y={BARRA.y} width={BARRA.w - 20} height={3.5} rx={2} fill={`url(#${uid}l)`} />
    </svg>
  );
};

/* ───────────── selector de layout ───────────── */

export const LayoutEstudio: React.FC<{ e: EscenaEstudio }> = ({ e }) => {
  switch (e.layout) {
    case "VERSUS_50_50": return e.versus ? <Versus5050 e={e} /> : <HeroCenter e={e} />;
    case "DIAGONAL_SPLIT": return <DiagonalSplit e={e} />;
    case "SURFACE_STAGE": return <SurfaceStage e={e} />;
    default: return <HeroCenter e={e} />;
  }
};

export { Titular };
