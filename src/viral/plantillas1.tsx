/** Plantillas virales 1/3: HOOK (gancho cinético), NUM (número gigante), VS (comparación) y CTA (cierre con llamada a la acción). */
import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { TV, type EscenaViralGuardada } from "../anim/viral";
import { StudioSvgDefs } from "../estudio/efectos";
import { ANCHO_TEXTO, Confeti, Etiqueta, EsferaIcono, FUENTE, H, IconoSvg, MONO, Panel, TextoCinetico, W, aclarar, clamp, easeOut, fmtNum, leerNumero, lerp, prog, spr, useReloj, useViral } from "./comun";

type P = { e: EscenaViralGuardada };

/** Encabezado de escena (arriba): titular de hasta 2 líneas con la palabra clave en color de acento. */
export const Encabezado: React.FC<{ texto: string; destacada: string; y?: number }> = ({ texto, destacada, y = 330 }) =>
  texto ? <TextoCinetico texto={texto} destacada={destacada} y={y} maxPx={74} minPx={46} maxLineas={2} caja={false} delay={0.08} id="encabezado" /> : null;

/* ───────────── HOOK ───────────── */

export const Hook: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const { T } = useViral();
  const golpe = t > a(0.32) ? Math.exp(-(t - a(0.32)) * 8) : 0;
  const dx = Math.sin(f * 1.9) * 16 * golpe, dy = Math.cos(f * 2.3) * 11 * golpe;
  const giro = f * 0.12;
  return (
    <AbsoluteFill style={{ transform: `translate(${dx}px, ${dy}px)` }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <StudioSvgDefs />
        <g opacity={0.075} transform={`translate(540 940) rotate(${giro})`}><IconoSvg nombre={e.ic} x={0} y={0} tam={1000} color={T.texto} /></g>
        <EsferaIcono nombre={e.ic} x={540} y={470} d={230} color={T.acento} delay={0.05} flota={12} colorIcono={T.sobreAcento} />
      </svg>
      <TextoCinetico texto={e.h} destacada={e.w} y={980} maxPx={158} minPx={90} maxLineas={3} golpe delay={0.2} />
      {e.sub && <Etiqueta texto={e.sub} x={W / 2} y={1400} px={50} ancho={ANCHO_TEXTO} color={T.texto} delay={0.9} peso={700} mayus={false} fondo={T.panel} relleno={40} id="sub" />}
    </AbsoluteFill>
  );
};

/* ───────────── NUM ───────────── */

export const Num: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const { T } = useViral();
  const n = e.num!;
  const { v, dec } = leerNumero(n.n);
  const inicio = a(TV.contar), dur = a(TV.contarDur);
  const k = easeOut((t - inicio) / dur);
  const actual = v * k;
  const texto = `${n.pre}${fmtNum(actual, dec)}`;
  const largo = (n.pre + fmtNum(v, dec)).length + (n.u ? 1.1 : 0);
  const px = Math.max(110, Math.min(300, Math.floor(600 / (largo * 0.62))));
  const esPct = n.u === "%";
  const objetivoAnillo = esPct ? clamp(v / 100) : 1;
  const R = 420;
  const circ = 2 * Math.PI * R;
  const pop = spr(f, a(0.15), { damping: 11, stiffness: 160, mass: 0.7 });
  return (
    <AbsoluteFill>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <StudioSvgDefs />
        <circle cx={540} cy={990} r={R} fill="none" stroke={T.texto} strokeOpacity={0.14} strokeWidth={30} />
        <circle cx={540} cy={990} r={R} fill="none" stroke={T.acento} strokeWidth={30} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - objetivoAnillo * k)} transform="rotate(-90 540 990)" />
        <circle cx={540} cy={990 - R} r={22} fill={T.acento} opacity={k > 0 ? 1 : 0} transform={`rotate(${objetivoAnillo * k * 360} 540 990)`} style={{ transformOrigin: "540px 990px" }} />
        <EsferaIcono nombre={e.ic} x={540} y={560} d={210} color={T.acento} delay={0.05} flota={10} colorIcono={T.sobreAcento} />
        <Confeti x={540} y={990} t0={TV.contar + TV.contarDur} />
      </svg>
      <Encabezado texto={e.h} destacada={e.w} y={310} />
      <div data-texto="numero" style={{ position: "absolute", left: 540 - 400, top: 990, width: 800, transform: `translateY(-50%) scale(${0.7 + 0.3 * pop})`, opacity: clamp(pop * 2), textAlign: "center", fontFamily: FUENTE, fontWeight: 900, fontSize: px, letterSpacing: "-0.04em", lineHeight: 1, color: T.texto, whiteSpace: "nowrap", textShadow: T.oscuro ? "0 14px 50px rgba(0,0,0,0.5)" : "none" }}>
        <span style={{ background: `linear-gradient(180deg, ${T.oscuro ? aclarar(T.acento, 0.25) : T.texto}, ${T.acento})`, WebkitBackgroundClip: "text", color: "transparent" }}>{texto}</span>
        {n.u && <span style={{ fontSize: px * 0.5, marginLeft: px * 0.06, color: T.acento, letterSpacing: 0 }}>{n.u}</span>}
      </div>
      <Etiqueta texto={n.l} x={W / 2} y={1500} px={54} ancho={ANCHO_TEXTO} color={T.sobreAcento} delay={TV.contar + TV.contarDur - 0.4} peso={900} fondo={T.acento} relleno={44} id="etiqueta-num" />
    </AbsoluteFill>
  );
};

/* ───────────── VS ───────────── */

export const Vs: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const { T } = useViral();
  const vs = e.vs!;
  const gana = vs.op === ">" ? "a" : vs.op === "<" ? "b" : "";
  const COL = 390, Y = 520, ALTO = 900;
  const lados = [
    { k: "a" as const, d: vs.a, cx: 300, color: T.acento },
    { k: "b" as const, d: vs.b, cx: 780, color: T.acento2 },
  ];
  const sOp = spr(f, a(1.7), { damping: 6, stiffness: 190, mass: 0.6 });
  return (
    <AbsoluteFill>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <StudioSvgDefs />
        {lados.map(({ k, d, cx, color }, i) => {
          const s = spr(f, a(0.15 + i * 0.12), { damping: 13, stiffness: 140, mass: 0.8 });
          const win = gana === k;
          const esc = (0.92 + 0.08 * s) * (win ? 1 + 0.04 * clamp((t - a(2)) / 0.4) : 1);
          return (
            <g key={k} transform={`translate(${cx} ${Y + ALTO / 2}) scale(${esc}) translate(${-cx} ${-(Y + ALTO / 2)})`} opacity={clamp(s * 2) * (gana && !win ? lerp(1, 0.72, clamp((t - a(2)) / 0.4)) : 1)}>
              <Panel x={cx - COL / 2} y={Y} w={COL} h={ALTO} r={56} borde={win && t > a(2) ? T.acento : undefined} />
              {win && t > a(2) && <rect x={cx - COL / 2} y={Y} width={COL} height={ALTO} rx={56} fill="none" stroke={T.acento} strokeWidth={7} opacity={0.9} />}
              <EsferaIcono nombre={d.ic} x={cx} y={Y + 210} d={240} color={color} delay={0.35 + i * 0.12} flota={9} colorIcono={T.oscuro ? "#FFFFFF" : "#FFFFFF"} />
            </g>
          );
        })}
        {gana && <g opacity={clamp((t - a(2.0)) / 0.3)} transform={`translate(${gana === "a" ? 300 : 780} ${Y - 20})`}><IconoSvg nombre="corona" x={0} y={0} tam={110} color={T.acento} /></g>}
        <g transform={`translate(540 ${Y + 450}) scale(${Math.max(0.0001, sOp)}) rotate(${(1 - sOp) * -50})`} opacity={clamp(sOp * 2)}>
          <circle r={86} fill={T.acento} stroke={T.oscuro ? T.bg1 : "#fff"} strokeWidth={10} />
        </g>
      </svg>
      <Encabezado texto={e.h} destacada={e.w} y={310} />
      {lados.map(({ k, d, cx, color }, i) => {
        const { v, dec } = leerNumero(d.n);
        const kk = easeOut((t - a(TV.contar + i * 0.12)) / a(TV.contarDur));
        const txt = fmtNum(v * kk, dec);
        const largo = Math.max(txt.length, fmtNum(v, dec).length);
        const px = Math.min(170, Math.floor(310 / (largo * 0.62)));
        return (
          <React.Fragment key={k}>
            <div data-texto="contador" style={{ position: "absolute", left: cx - 170, top: Y + 560, width: 340, textAlign: "center", transform: "translateY(-50%)", fontFamily: MONO, fontWeight: 700, fontSize: px, letterSpacing: "-0.02em", lineHeight: 1, color: gana === k ? T.acento : T.texto, opacity: clamp((t - a(TV.contar - 0.2 + i * 0.12)) / 0.25), textShadow: T.oscuro ? `0 0 32px ${color}88` : "none", whiteSpace: "nowrap" }}>{txt}</div>
            <Etiqueta texto={d.l} x={cx} y={Y + 740} px={54} ancho={COL - 40} color={T.texto} delay={0.8 + i * 0.12} peso={900} id="etiqueta-vs" />
          </React.Fragment>
        );
      })}
      <div data-texto="operador" style={{ position: "absolute", left: 540 - 86, top: Y + 450 - 86, width: 172, height: 172, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FUENTE, fontWeight: 900, fontSize: 112, lineHeight: 1, color: T.sobreAcento, transform: `scale(${Math.max(0.0001, sOp)})`, opacity: clamp(sOp * 2) }}>{vs.op}</div>
    </AbsoluteFill>
  );
};

/* ───────────── CTA ───────────── */

export const Cta: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const { T, marca } = useViral();
  const sLogo = spr(f, a(0.45), { damping: 10, stiffness: 140, mass: 0.8 });
  const pulso = 1 + 0.05 * Math.sin(f / 9);
  const sBtn = spr(f, a(1.1), { damping: 9, stiffness: 160, mass: 0.7 });
  return (
    <AbsoluteFill>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <StudioSvgDefs />
        {!marca && <EsferaIcono nombre={e.ic} x={540} y={1130} d={330} color={T.acento} delay={0.45} flota={12} colorIcono={T.sobreAcento} />}
        <Confeti x={540} y={1100} t0={0.45} n={34} radio={520} colores={[T.texto, "#FFFFFF", T.peligro]} />
      </svg>
      <TextoCinetico texto={e.h} destacada={e.w} y={620} maxPx={142} minPx={84} maxLineas={3} golpe delay={0.1} />
      {marca && (
        <div style={{ position: "absolute", left: 540 - 205, top: 1130 - 205 + Math.sin(f / 40) * 9, width: 410, height: 410, borderRadius: 74, background: "#FFFFFF", boxShadow: "0 40px 90px rgba(2,34,78,0.38)", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${Math.max(0.0001, sLogo)}) rotate(${(1 - sLogo) * -12}deg)`, opacity: clamp(sLogo * 2) }}>
          <Img src={staticFile("marca/imnoba-logo.png")} style={{ width: 372, height: 372, objectFit: "contain" }} />
        </div>
      )}
      {e.sub && (
        <div style={{ position: "absolute", left: 0, width: W, top: 1500, display: "flex", justifyContent: "center", transform: `translateY(-50%) scale(${Math.max(0.0001, sBtn) * pulso})`, opacity: clamp(sBtn * 2) }}>
          <div data-texto="cta" style={{ fontFamily: FUENTE, fontWeight: 900, fontSize: Math.min(60, Math.floor(700 / (Math.max(6, e.sub.length) * 0.62))), color: T.bg0, background: T.texto, padding: "26px 60px", borderRadius: 999, boxShadow: "0 22px 60px rgba(2,34,78,0.4)", whiteSpace: "nowrap", letterSpacing: "-0.01em" }}>{e.sub} →</div>
        </div>
      )}
    </AbsoluteFill>
  );
};
