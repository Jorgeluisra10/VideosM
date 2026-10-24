/**
 * Plantillas del estilo DOCUMENTAL 1/2 (explicativos de ciencia y curiosidades con estudios citados):
 *   PAPEL     ficha de estudio sobre papel: «autor · año», rol, la cifra que cuenta, un campo de puntos y el sello con la muestra
 *   PILARES   columnas isométricas con una fracción rayada («k de n») y la fracción gigante arriba
 *   CICLO     pasos que se encadenan en círculo con flechas que se dibujan (el último vuelve al primero)
 *   PUNCH     una palabra (golpe con partículas) o una pregunta (letras que caen) gigante
 * Titulares en la tipografía de la paleta (Archivo Black en el estilo documental), datos en mono, rojo = el sujeto, azul = lo que cambia, lima = datos.
 */
import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import { azar } from "../lib/anim";
import { TV, type EscenaViralGuardada } from "../anim/viral";
import { ANCHO_DOC, Etiqueta, EsferaIcono, FUENTE, H, IconoSvg, LineaCap, MONO, W, ajustarTexto, clamp, easeInOut, easeOut, fmtNum, leerNumero, lerp, mezclar, oscurecer, polarXY, spr, useReloj, useViral } from "./comun";
import { StudioSvgDefs } from "../estudio/efectos";

type P = { e: EscenaViralGuardada };

/* ───────────── PAPEL ───────────── */

/** Cifra «odómetro»: los dígitos que aún no se alcanzaron salen en gris como ceros. */
function odometro(final: string, actual: string): { ch: string; gris: boolean }[] {
  const F = final.split(""), C = actual.split("");
  const off = F.length - C.length;
  return F.map((c, i) => (i < off ? { ch: /[.,]/.test(c) ? c : "0", gris: true } : { ch: C[i - off], gris: false }));
}

export const Papel: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const { T, doc } = useViral();
  const p = e.papel!;
  const { v, dec } = leerNumero(p.n);
  const k = easeOut((t - a(TV.papelContar)) / a(TV.papelContarDur));
  const F = fmtNum(v, dec);
  const cifra = odometro(F, fmtNum(v * k, dec));
  const px = Math.min(190, Math.floor(780 / (Math.max(3, F.length) * 0.74 * (doc ? ANCHO_DOC : 1))));
  const N = Math.min(Math.round(v), 320);
  const puntos = useMemo(() => Array.from({ length: N }, (_, i) => ({ x: 150 + azar(i * 3.7 + 1) * 780, y: 792 + azar(i * 5.3 + 2) * 246, r: 4.6 + azar(i * 7.1) * 2.6 })), [N]);
  const campo = p.puntos;
  const kc = clamp((t - a(TV.papelCampo)) / a(TV.papelCampoDur));
  const visibles = Math.floor(N * kc);
  const sSello = spr(f, a(campo ? TV.papelSello : TV.papelContar + TV.papelContarDur), { damping: 8, stiffness: 190, mass: 0.7 });
  const tinta = T.texto;
  const listaNota = !p.puntos ? p.nota.split(/\s*[·;|]\s*/).filter(Boolean).slice(0, 5) : [];
  return (
    <AbsoluteFill>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <StudioSvgDefs />
        <rect x={120} y={248} width={840} height={2.5} fill={tinta} opacity={0.55} />
        {campo && (
          <g opacity={clamp((t - a(TV.papelContar + 0.6)) / 0.4)}>
            {/* el «arco»: travesaño y postes, con zonas punteadas */}
            <path d="M 120 1058 L 120 770 L 960 770 L 960 1058" fill="none" stroke={tinta} strokeWidth={10} strokeLinejoin="miter" />
            <line x1={80} x2={1000} y1={1058} y2={1058} stroke={tinta} strokeWidth={4} />
            {[400, 680].map((x) => <line key={x} x1={x} x2={x} y1={770} y2={1058} stroke={tinta} strokeOpacity={0.45} strokeWidth={2.5} strokeDasharray="7 7" />)}
            <line x1={120} x2={960} y1={914} y2={914} stroke={tinta} strokeOpacity={0.45} strokeWidth={2.5} strokeDasharray="7 7" />
            {puntos.slice(0, visibles).map((d, i) => <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={tinta} />)}
          </g>
        )}
      </svg>
      <Etiqueta texto={p.anio ? `${p.autor} · ${p.anio}` : p.autor} x={W / 2} y={286} px={30} ancho={760} mono color={tinta} peso={400} mayus={false} delay={0.1} id="papel-autor" />
      {p.rol && <Etiqueta texto={p.rol} x={W / 2} y={350} px={32} ancho={760} mono color={T.acento2} peso={400} mayus={false} delay={0.3} id="papel-rol" />}
      <div data-texto="papel-cifra" style={{ position: "absolute", left: 120, top: 482, width: 840, transform: "translateY(-50%)", textAlign: "center", fontFamily: FUENTE, fontWeight: 900, fontSize: px, lineHeight: 1, letterSpacing: "-0.03em", color: tinta, whiteSpace: "nowrap", opacity: clamp((t - a(0.3)) / 0.3) }}>
        {cifra.map((c, i) => <span key={i} style={{ color: c.gris ? mezclar(tinta, T.bg0, 0.7) : tinta }}>{c.ch}</span>)}
      </div>
      <Etiqueta texto={p.u} x={W / 2} y={600} px={40} ancho={760} mono color={tinta} peso={700} mayus={false} delay={TV.papelContar + TV.papelContarDur * 0.6} id="papel-unidad" />
      {p.desc && <Etiqueta texto={p.desc} x={W / 2} y={662} px={28} ancho={800} mono color={T.suave} peso={400} mayus={false} delay={TV.papelContar + TV.papelContarDur * 0.8} id="papel-desc" />}
      {!campo && (
        <>
          {/* figura grabada («FIG. 1») y, a la derecha, los datos en mono con su corchete */}
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
            <g opacity={clamp((t - a(1.0)) / 0.5)}>
              <rect x={120} y={790} width={440} height={400} fill="none" stroke={tinta} strokeOpacity={0.35} strokeWidth={2.5} strokeDasharray="8 8" />
              <IconoSvg nombre={e.ic} x={340} y={990} tam={330} color={tinta} />
              {listaNota.length > 0 && <path d={`M 596 ${850} L 580 ${850} L 580 ${850 + 56 * listaNota.length + 10} L 596 ${850 + 56 * listaNota.length + 10}`} fill="none" stroke={tinta} strokeWidth={3} />}
            </g>
          </svg>
          <Etiqueta texto="FIG. 1" x={340} y={1226} px={22} ancho={300} mono color={T.suave} peso={700} delay={1.3} id="papel-fig" />
          {listaNota.map((ln, i) => <Etiqueta key={i} texto={ln} x={612} y={880 + 56 * i} px={34} ancho={330} alinear="left" mono color={tinta} peso={400} mayus={false} delay={1.5 + 0.25 * i} id="papel-dato" />)}
        </>
      )}
      {campo && p.nota && <Etiqueta texto={p.nota} x={W / 2} y={1130} px={28} ancho={800} mono color={T.suave} peso={400} mayus={false} delay={TV.papelCampo + TV.papelCampoDur} id="papel-nota" />}
      {/* sello con la muestra */}
      <div style={{ position: "absolute", left: 720, top: 1330, width: 330, transform: `translate(-50%, -50%) rotate(-7deg) scale(${Math.max(0.0001, sSello) * 1})`, opacity: clamp(sSello * 2) }}>
        <div style={{ position: "absolute", inset: 0, transform: "translate(9px, 10px)", border: `4px solid ${tinta}`, background: tinta, opacity: 0.9 }} />
        <div data-texto="papel-sello" style={{ position: "relative", border: `5px solid ${tinta}`, background: T.bg0, padding: "16px 20px 14px", textAlign: "center", color: tinta }}>
          <div style={{ fontFamily: FUENTE, fontWeight: 900, fontSize: Math.min(76, Math.floor(280 / (Math.max(3, F.length) * 0.74 * (doc ? ANCHO_DOC : 1)))), lineHeight: 1, letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>{F}</div>
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 22, letterSpacing: "0.14em", marginTop: 6, whiteSpace: "nowrap", textTransform: "uppercase" }}>{p.u.length > 16 ? p.u.slice(0, 16) : p.u}</div>
        </div>
      </div>
      {e.cap && <LineaCap texto={e.cap} y={1500} px={30} delay={0.6} id="cap-papel" />}
    </AbsoluteFill>
  );
};

/* ───────────── PILARES ───────────── */

/** Proyección isométrica de un prisma de base cuadrada de arista L: devuelve los polígonos de sus tres caras visibles. */
function prisma(cx: number, base: number, L: number, alto: number): { izq: string; der: string; sup: string; c: number; s: number } {
  const c = L * 0.866, s = L * 0.5;
  const pt = (x: number, y: number): string => `${x.toFixed(1)},${y.toFixed(1)}`;
  return {
    izq: [pt(cx - c, base - alto), pt(cx, base + s - alto), pt(cx, base + s), pt(cx - c, base)].join(" "),
    der: [pt(cx, base + s - alto), pt(cx + c, base - alto), pt(cx + c, base), pt(cx, base + s)].join(" "),
    sup: [pt(cx, base - s - alto), pt(cx + c, base - alto), pt(cx, base + s - alto), pt(cx - c, base - alto)].join(" "),
    c, s,
  };
}

export const Pilares: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const { T, doc } = useViral();
  const pl = e.pilares!;
  const m = pl.cols.length;
  const BASE = 1290, L = 112, HMAX = 560;
  const nmax = Math.max(...pl.cols.map((c) => c.n));
  const paso = m === 2 ? 380 : m === 3 ? 300 : 230;
  const pRayas = easeInOut((t - a(TV.pilaresRayas)) / a(TV.pilaresRayasDur));
  const crema = "#F1ECE5";
  const azul = T.acento2;
  const sCab = spr(f, a(TV.pilaresCabeza), { damping: 8, stiffness: 190, mass: 0.7 });
  const cols = pl.cols.map((c, i) => {
    const cx = 540 + (i - (m - 1) / 2) * paso;
    const alto = Math.max(72, (HMAX * c.n) / nmax) * easeOut((t - a(TV.pilaresSuben + 0.12 * i)) / a(TV.pilaresSubenDur));
    return { ...c, i, cx, altoFinal: Math.max(72, (HMAX * c.n) / nmax), alto, hi: i === pl.hi };
  });
  const hiCol = cols[pl.hi];
  const pxCab = Math.min(170, Math.floor(700 / (Math.max(3, pl.cabeza.length) * 0.7 * (doc ? ANCHO_DOC : 1))));
  return (
    <AbsoluteFill>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <StudioSvgDefs />
        {pl.cabeza && hiCol && <line x1={hiCol.cx} x2={hiCol.cx} y1={560} y2={BASE - hiCol.altoFinal - L * 0.5 - 130} stroke={T.suave} strokeWidth={3} strokeDasharray="5 9" opacity={clamp((t - a(TV.pilaresCabeza + 0.2)) / 0.4)} />}
        {cols.map((c) => {
          if (c.alto < 1) return null;
          const base = c.hi ? crema : azul;
          const g = prisma(c.cx, BASE, L, c.alto);
          const fraccion = c.n > 0 ? c.k / c.n : 0;
          const cnt = Math.min(c.k, 26);
          const bandas = Array.from({ length: Math.floor(cnt * pRayas) }, (_, j) => {
            const h0 = (j / Math.max(1, cnt)) * Math.max(c.k > 0 ? 18 : 0, c.altoFinal * fraccion);
            const h1 = h0 + (Math.max(c.k > 0 ? 18 : 0, c.altoFinal * fraccion) / Math.max(1, cnt)) * 0.55;
            return { h0, h1: Math.min(h1, c.alto) };
          });
          return (
            <g key={c.i}>
              <ellipse cx={c.cx} cy={BASE + 8} rx={g.c + 30} ry={g.s + 16} fill="#000" opacity={T.oscuro ? 0.35 : 0.1} />
              <polygon points={g.izq} fill={oscurecer(base, 0.28)} />
              <polygon points={g.der} fill={oscurecer(base, 0.08)} />
              <polygon points={g.sup} fill={mezclar(base, "#FFFFFF", c.hi ? 0.25 : 0.3)} />
              {bandas.map((b, j) => {
                const y = (x: number, hh: number, desde: "izq" | "der"): number => BASE - hh + (desde === "izq" ? (x - (c.cx - g.c)) / g.c : (g.c - (x - c.cx)) / g.c) * g.s;
                const pi = [[c.cx - g.c, b.h1], [c.cx, b.h1], [c.cx, b.h0], [c.cx - g.c, b.h0]].map(([x, hh]) => `${x},${y(x, hh, "izq")}`).join(" ");
                const pd = [[c.cx, b.h1], [c.cx + g.c, b.h1], [c.cx + g.c, b.h0], [c.cx, b.h0]].map(([x, hh]) => `${x},${y(x, hh, "der")}`).join(" ");
                return <g key={j}><polygon points={pi} fill={T.peligro} /><polygon points={pd} fill={oscurecer(T.peligro, 0.2)} /></g>;
              })}
              <polygon points={g.sup} fill="none" stroke={T.texto} strokeOpacity={0.18} strokeWidth={2} />
            </g>
          );
        })}
      </svg>
      {pl.cabeza && (
        <div data-texto="pilares-cabeza" style={{ position: "absolute", left: 120, top: 470, width: 840, transform: `translateY(-50%) scale(${0.7 + 0.3 * Math.min(1.1, sCab)})`, opacity: clamp(sCab * 2), textAlign: "center", fontFamily: FUENTE, fontWeight: 900, fontSize: pxCab, letterSpacing: "-0.03em", lineHeight: 1, whiteSpace: "nowrap", color: T.neon ?? T.acento, textShadow: T.oscuro ? "0 10px 40px rgba(0,0,0,0.5)" : "none" }}>{pl.cabeza}</div>
      )}
      {cols.map((c) => {
        const kk = Math.round(c.k * pRayas);
        return (
          <React.Fragment key={c.i}>
            {c.l && c.alto > 20 && <Etiqueta texto={c.l} x={c.cx} y={BASE - c.alto - L * 0.5 - 62} px={62} ancho={Math.min(280, paso - 20)} color={T.texto} peso={900} delay={TV.pilaresSuben + 0.5 + 0.1 * c.i} id="pilares-etiqueta" />}
            <div data-texto="pilares-conteo" style={{ position: "absolute", left: c.cx - paso / 2 + 6, top: BASE + L * 0.5 + 60, width: paso - 12, textAlign: "center", fontFamily: MONO, fontWeight: 700, fontSize: Math.min(30, Math.floor((paso - 20) / ((String(c.n).length + String(c.k).length + 5) * 0.62))), whiteSpace: "nowrap", color: T.texto, opacity: clamp((t - a(TV.pilaresSuben + 0.5)) / 0.4) }}>
              <span style={{ color: T.peligro }}>{kk}</span> de {fmtNum(c.n, 0)}
            </div>
            {c.u && <Etiqueta texto={c.u} x={c.cx} y={BASE + L * 0.5 + 118} px={22} ancho={paso - 20} mono color={T.suave} peso={400} mayus={false} delay={TV.pilaresSuben + 0.6 + 0.1 * c.i} id="pilares-unidad" />}
          </React.Fragment>
        );
      })}
      {e.cap && <LineaCap texto={e.cap} y={320} px={32} delay={0.2} id="cap-pilares" />}
    </AbsoluteFill>
  );
};

/* ───────────── CICLO ───────────── */

export const Ciclo: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const { T } = useViral();
  const cc = e.ciclo!;
  const n = cc.pasos.length;
  const CX = 540, CY = 960, RX = 270, RY = 350, DELTA = 30;
  const ang = (i: number): number => -90 + (360 * i) / n;
  const nodo = (i: number): [number, number] => [CX + RX * Math.cos((ang(i) * Math.PI) / 180), CY + RY * Math.sin((ang(i) * Math.PI) / 180)];
  const punto = (g: number): [number, number] => [CX + RX * Math.cos((g * Math.PI) / 180), CY + RY * Math.sin((g * Math.PI) / 180)];
  const sCentro = spr(f, a(0.2), { damping: 11, stiffness: 150, mass: 0.7 });
  return (
    <AbsoluteFill>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <StudioSvgDefs />
        {cc.pasos.map((_, i) => {
          const g0 = ang(i) + DELTA, g1 = ang(i + 1) - DELTA + (i === n - 1 ? 360 : 0) - (i === n - 1 ? 360 : 0);
          const gEnd = ang(i + 1) - DELTA + (ang(i + 1) < ang(i) ? 360 : 0);
          const [x0, y0] = punto(g0), [x1, y1] = punto(gEnd);
          const largo = gEnd - g0;
          const d = `M ${x0.toFixed(1)} ${y0.toFixed(1)} A ${RX} ${RY} 0 ${largo > 180 ? 1 : 0} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
          const p = easeInOut((t - a(TV.cicloPaso(i) + 0.15)) / a(0.55));
          if (p <= 0) return null;
          const ultimo = i === n - 1;
          const col = ultimo ? T.acento2 : T.texto;
          // punta de flecha: tangente de la elipse en el ángulo final
          const rad = (gEnd * Math.PI) / 180;
          const tx = -RX * Math.sin(rad), ty = RY * Math.cos(rad);
          const ang_t = (Math.atan2(ty, tx) * 180) / Math.PI;
          return (
            <g key={i}>
              <path d={d} fill="none" stroke={col} strokeWidth={8} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
              {p > 0.97 && <path d="M -28 -19 L 0 0 L -28 19" fill="none" stroke={col} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" transform={`translate(${x1} ${y1}) rotate(${ang_t})`} />}
            </g>
          );
        })}
        <ellipse cx={CX} cy={CY} rx={RX} ry={RY} fill="none" stroke={T.texto} strokeOpacity={0.22} strokeWidth={4} strokeDasharray="3 13" strokeLinecap="round" />
        <g transform={`translate(${CX} ${CY}) scale(${Math.max(0.0001, sCentro)})`} opacity={clamp(sCentro * 2)}>
          <circle r={158} fill="none" stroke={T.texto} strokeOpacity={0.45} strokeWidth={4} strokeDasharray="5 11" />
        </g>
        <EsferaIcono nombre={cc.ic} x={CX} y={CY} d={250} color={T.acento} colorIcono={T.sobreAcento} delay={0.25} flota={6} />
      </svg>
      {cc.pasos.map((txt, i) => {
        const [x, y] = nodo(i);
        const lateral = Math.abs(Math.cos((ang(i) * Math.PI) / 180)) > 0.5;
        const ancho = lateral ? 270 : 560;
        const s = spr(f, a(TV.cicloPaso(i)), { damping: 14, stiffness: 140, mass: 0.7 });
        return (
          <div key={i} data-texto="ciclo-paso" style={{ position: "absolute", left: x - ancho / 2, top: y, width: ancho, transform: `translateY(calc(-50% + ${(1 - s) * 20}px))`, opacity: clamp(s * 2), textAlign: "center", fontFamily: MONO, fontWeight: 700, fontSize: lateral ? 34 : 40, lineHeight: 1.28, color: T.texto }}>
            {txt}
          </div>
        );
      })}
      {e.cap && <LineaCap texto={e.cap} y={330} px={32} delay={0.2} id="cap-ciclo" />}
    </AbsoluteFill>
  );
};

/* ───────────── PUNCH ───────────── */

export const Punch: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const { T, doc } = useViral();
  const largo = e.h.length;
  const corto = largo <= 16;
  const golpe = a(TV.punchGolpe);
  const dt = Math.max(0, t - golpe);
  const k = doc ? ANCHO_DOC : 1;
  const { lineas, px } = ajustarTexto(e.h, 880, corto ? 330 : 150, corto ? 110 : 70, corto ? 2 : 4, 0.68 * k);
  const sacudida = dt > 0 ? Math.exp(-dt * 9) * 16 : 0;
  const dx = Math.sin(f * 2.3) * sacudida, dy = Math.cos(f * 2.9) * sacudida * 0.7;
  const s = spr(f, golpe - 0.18 > 0 ? 0 : 0, { damping: 9, stiffness: 210, mass: 0.6 });
  const entra = easeOut((t - (golpe - 0.18)) / 0.18);
  const escala = corto ? lerp(2.8, 1, easeOut((t - (golpe - 0.2)) / 0.2)) : 1;
  const particulas = useMemo(() => Array.from({ length: 70 }, (_, i) => ({ ang: azar(i * 3.1 + 1) * Math.PI * 2, v: 160 + azar(i * 5.3 + 2) * 760, r: 1.6 + azar(i * 7.7 + 3) * 3.4 })), []);
  const rojo = T.acento;
  const norm = (x: string): string => x.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
  let idx = 0;
  void s;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", inset: 0, transform: `translate(${dx}px, ${dy}px)` }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
          {corto && dt > 0 && particulas.map((p, i) => {
            const kk = clamp(dt / 1.5);
            const r = p.v * easeOut(kk);
            return <circle key={i} cx={540 + Math.cos(p.ang) * r * 1.1} cy={960 + Math.sin(p.ang) * r * 0.8 + 90 * kk * kk} r={p.r * (1 - kk * 0.5)} fill="#FFFFFF" opacity={(1 - kk) * 0.85} />;
          })}
        </svg>
        <div data-texto="punch" style={{ position: "absolute", left: 100, top: 960, width: 880, transform: `translateY(-50%) scale(${escala})`, opacity: corto ? clamp(entra * 3) : 1, display: "flex", flexDirection: "column", alignItems: "center", gap: px * 0.04, fontFamily: FUENTE, fontWeight: 900, fontSize: px, lineHeight: 1.02, letterSpacing: "-0.02em", textTransform: "uppercase", textAlign: "center", color: corto ? rojo : T.texto }}>
          {lineas.map((linea, li) => (
            <div key={li} style={{ display: "flex", gap: px * 0.28, whiteSpace: "nowrap" }}>
              {linea.map((pal, pi) => {
                const rojoPal = !corto && e.w && norm(pal) === norm(e.w);
                return (
                  <span key={pi} style={{ display: "inline-block", whiteSpace: "nowrap", color: rojoPal ? rojo : undefined }}>
                    {corto ? pal : pal.split("").map((ch) => {
                      const n = idx++;
                      const sc = spr(f, a(0.15 + n * 0.045), { damping: 11, stiffness: 150, mass: 0.7 });
                      const giro = (azar(n * 4.1) - 0.5) * 110;
                      return <span key={n} style={{ display: "inline-block", transform: `translate(${(1 - sc) * (azar(n * 2.3) - 0.5) * 260}px, ${-(1 - sc) * 900}px) rotate(${(1 - sc) * giro}deg)`, opacity: clamp(sc * 3) }}>{ch}</span>;
                    })}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {e.sub && <LineaCap texto={e.sub} y={corto ? 1330 : 1380} px={34} delay={corto ? TV.punchGolpe + 0.6 : 1.8} id="punch-sub" />}
      {e.cap && <LineaCap texto={e.cap} y={330} px={32} delay={0.2} id="cap-punch" />}
    </AbsoluteFill>
  );
};
