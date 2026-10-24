/**
 * Plantillas del estilo DOCUMENTAL 2/2:
 *   DUO      dos paneles comparados («se queda» / «se mueve») y una palabra grande que se llena según cada caso
 *   OSCILO   pantalla de osciloscopio con una curva que se dibuja (lissajous, onda o espiral)
 *   CUBO     cubo isométrico de posibilidades: cada punto es una opción y casi todo está vacío
 *   DIALES   tres diales que cambian de valor y deforman una figura (espiral de concha u onda)
 */
import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import { azar } from "../lib/anim";
import { TV, type EscenaViralGuardada } from "../anim/viral";
import { StudioSvgDefs } from "../estudio/efectos";
import { useUid } from "../estudio/util";
import { ANCHO_DOC, Etiqueta, FUENTE, H, LineaCap, MONO, TextoCinetico, W, clamp, easeInOut, easeOut, fmtNum, lerp, mezclar, oscurecer, polarXY, spr, useReloj, useViral } from "./comun";

type P = { e: EscenaViralGuardada };

const LIMA = "#D4FF33";

/* ───────────── DUO ───────────── */

export const Duo: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const { T, doc } = useViral();
  const uid = useUid();
  const d = e.duo!;
  const rojo = T.peligro, azul = T.acento2;
  const paneles = [
    { k: "a" as const, lado: d.a, y: 430, col: rojo, delay: TV.duoA },
    { k: "b" as const, lado: d.b, y: 890, col: azul, delay: TV.duoB },
  ];
  const PH = 290;
  const pxPal = Math.min(132, Math.floor(800 / (Math.max(3, d.palabra.length) * 0.74 * (doc ? ANCHO_DOC : 1))));
  const kPal = easeInOut((t - a(TV.duoPalabra)) / a(TV.duoPalabraDur));
  return (
    <AbsoluteFill>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <StudioSvgDefs />
        <defs>
          {paneles.map((p) => (
            <linearGradient key={p.k} id={`${uid}${p.k}`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={mezclar(p.col, "#FFFFFF", 0.35)} /><stop offset="0.45" stopColor={p.col} /><stop offset="1" stopColor={oscurecer(p.col, 0.4)} /></linearGradient>
          ))}
        </defs>
        {paneles.map((p) => {
          const s = spr(f, a(p.delay), { damping: 14, stiffness: 130, mass: 0.8 });
          const suelo = p.y + PH - 60;
          // «a» se queda quieta; «b» se lanza hacia un lado (con estela) y se queda tumbada
          const tt = p.k === "b" ? easeInOut((t - a(p.delay + 0.6)) / 0.5) : 0;
          const giro = p.k === "b" ? -76 * tt : 0;
          const corre = p.k === "b" ? -190 * tt : 0;
          const actor = (alfa: number, tt2: number, key: string): JSX.Element => (
            <g key={key} opacity={alfa} transform={`translate(${540 + (p.k === "b" ? -190 * tt2 : 0)} ${suelo - 76 + (p.k === "b" ? 52 * tt2 : 0)}) rotate(${p.k === "b" ? -76 * tt2 : 0})`}>
              <rect x={-30} y={-76} width={60} height={152} rx={30} fill={`url(#${uid}${p.k})`} stroke={oscurecer(p.col, 0.5)} strokeWidth={3} />
              <rect x={-17} y={-62} width={9} height={110} rx={4.5} fill="#FFFFFF" opacity={0.28} />
            </g>
          );
          void giro; void corre;
          return (
            <g key={p.k} opacity={clamp(s * 2)} transform={`translate(0 ${(1 - s) * 40})`}>
              <rect x={120} y={p.y} width={840} height={PH} rx={28} fill={T.panel} stroke={T.borde} strokeWidth={2.5} />
              <circle cx={158} cy={p.y + 36} r={8} fill={p.col} />
              <line x1={160} x2={920} y1={suelo + 76} y2={suelo + 76} stroke={T.suave} strokeOpacity={0.6} strokeWidth={3} />
              {p.k === "b" && [0.7, 0.45, 0.22].map((l, i) => actor(l * 0.35, Math.max(0, tt - (i + 1) * 0.16), `g${i}`))}
              {actor(1, tt, "x")}
              <circle cx={800} cy={suelo + 62} r={10} fill={T.texto} stroke={T.suave} strokeWidth={2} />
            </g>
          );
        })}
      </svg>
      {paneles.map((p) => (
        <React.Fragment key={p.k}>
          <Etiqueta texto={p.lado.l} x={182} y={p.y + 38} px={30} ancho={640} alinear="left" mono color={T.suave} peso={400} mayus={false} delay={p.delay + 0.1} id="duo-etiqueta" />
          {(() => {
            const rel = clamp(p.lado.v * kPal);
            return (
              <div data-texto="duo-palabra" style={{ position: "absolute", left: 120, top: p.y + PH + 78, width: 840, transform: "translateY(-50%)", textAlign: "center", fontFamily: FUENTE, fontWeight: 900, fontSize: pxPal, lineHeight: 1, letterSpacing: "0.01em", whiteSpace: "nowrap", color: "transparent", WebkitTextStroke: `3px ${T.texto}`, backgroundImage: `linear-gradient(90deg, ${p.col} 0%, ${p.col} ${rel * 100}%, transparent ${rel * 100}%)`, WebkitBackgroundClip: "text", backgroundClip: "text", opacity: clamp((t - a(TV.duoPalabra - 0.3)) / 0.3) }}>
                {d.palabra}
              </div>
            );
          })()}
        </React.Fragment>
      ))}
      {e.cap && <LineaCap texto={e.cap} y={320} px={32} delay={0.2} id="cap-duo" />}
    </AbsoluteFill>
  );
};

/* ───────────── OSCILO ───────────── */

export const Oscilo: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const { T } = useViral();
  const o = e.osc!;
  const X0 = 120, Y0 = 470, AN = 840, AL = 860;
  const cx = X0 + AN / 2, cy = Y0 + AL / 2;
  const p = easeOut((t - a(TV.oscCurva)) / a(TV.oscDur));
  const fase = Math.max(0, t - a(TV.oscCurva)) * 0.35;
  const N = 1400;
  const puntos = useMemo(() => [] as string[], []);
  void puntos;
  const trazo = (): string => {
    const pts: string[] = [];
    const total = Math.max(2, Math.floor(N * clamp(p)));
    for (let i = 0; i < total; i++) {
      const u = i / N;
      let x = 0, y = 0;
      if (o.curva === "onda") {
        x = (u * 2 - 1) * 0.96;
        y = 0.5 * Math.sin(u * 22 + fase) * Math.sin(u * 3.1 + 0.4) + 0.22 * Math.sin(u * 61 + fase * 2);
      } else if (o.curva === "espiral") {
        const th = u * Math.PI * 14;
        const r = 0.04 + 0.9 * u;
        x = r * Math.cos(th + fase); y = r * Math.sin(th + fase);
      } else {
        const th = u * Math.PI * 2 * 9;
        x = Math.sin(3 * th + fase) * (0.55 + 0.3 * Math.sin(th * 0.11));
        y = Math.sin(2 * th + fase * 0.6) * (0.55 + 0.3 * Math.cos(th * 0.09)) + 0.28 * Math.sin(5 * th);
      }
      pts.push(`${(cx + x * AN * 0.46).toFixed(1)},${(cy - y * AL * 0.42).toFixed(1)}`);
    }
    return pts.join(" ");
  };
  const ln = trazo();
  const s = spr(f, a(0.05), { damping: 16, stiffness: 120, mass: 0.8 });
  return (
    <AbsoluteFill>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <StudioSvgDefs />
        <g opacity={clamp(s * 2)}>
          <rect x={X0} y={Y0} width={AN} height={AL} rx={34} fill="#06110A" stroke={LIMA} strokeOpacity={0.5} strokeWidth={3} />
          {Array.from({ length: 11 }, (_, i) => <line key={`v${i}`} x1={X0 + (AN * i) / 10} x2={X0 + (AN * i) / 10} y1={Y0 + 14} y2={Y0 + AL - 14} stroke={LIMA} strokeOpacity={i === 5 ? 0.45 : 0.14} strokeWidth={i === 5 ? 2.5 : 1.5} />)}
          {Array.from({ length: 11 }, (_, i) => <line key={`h${i}`} x1={X0 + 14} x2={X0 + AN - 14} y1={Y0 + (AL * i) / 10} y2={Y0 + (AL * i) / 10} stroke={LIMA} strokeOpacity={i === 5 ? 0.45 : 0.14} strokeWidth={i === 5 ? 2.5 : 1.5} />)}
          <polyline points={ln} fill="none" stroke={LIMA} strokeOpacity={0.18} strokeWidth={16} strokeLinejoin="round" strokeLinecap="round" />
          <polyline points={ln} fill="none" stroke={LIMA} strokeWidth={5} strokeLinejoin="round" strokeLinecap="round" />
        </g>
      </svg>
      <Etiqueta texto={o.l} x={X0 + 34} y={Y0 + AL - 38} px={22} ancho={560} alinear="left" mono color={LIMA} peso={400} mayus={false} delay={0.4} id="osc-canal" />
      {o.a && <Etiqueta texto={o.a} x={X0 + AN - 34} y={Y0 + AL - 38} px={22} ancho={160} alinear="right" mono color={LIMA} peso={400} mayus={false} delay={0.5} id="osc-anio" />}
      {e.cap && <LineaCap texto={e.cap} y={330} px={32} delay={0.2} id="cap-osc" />}
      {e.h && <TextoCinetico texto={e.h} destacada={e.w} y={1500} maxPx={64} minPx={40} maxLineas={2} caja={false} delay={0.6} id="osc-titulo" />}
    </AbsoluteFill>
  );
};

/* ───────────── CUBO ───────────── */

export const Cubo: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const { T } = useViral();
  const c = e.cubo!;
  const S = 520, CXs = 540, CYs = 880;
  const psi = (45 + 9 * Math.sin(t * 0.5)) * (Math.PI / 180);
  const tilt = 35.26 * (Math.PI / 180);
  const proy = (x: number, y: number, z: number): [number, number, number] => {
    const X = x - 0.5, Y = y - 0.5, Z = z - 0.5;
    const xr = X * Math.cos(psi) - Z * Math.sin(psi), zr = X * Math.sin(psi) + Z * Math.cos(psi);
    return [CXs + S * xr, CYs + S * (-Y * Math.cos(tilt) + zr * Math.sin(tilt)), zr];
  };
  const pts = useMemo(() => {
    const total = c.n;
    const dentro = Math.round(total * 0.2);
    const L: { x: number; y: number; z: number; zona: number; r: number }[] = [];
    for (let i = 0; i < total; i++) {
      if (i < dentro) {
        const zi = i % c.zonas.length, zn = c.zonas[zi];
        const g = (k: number): number => (azar(i * 7.7 + k) + azar(i * 3.1 + k + 5) + azar(i * 5.3 + k + 9) - 1.5) * 0.11;
        L.push({ x: clamp(zn.x + g(1)), y: clamp(zn.y + g(2)), z: clamp(zn.z + g(3)), zona: zi, r: 3 + azar(i) * 2 });
      } else L.push({ x: azar(i * 2.9 + 11), y: azar(i * 4.3 + 12), z: azar(i * 6.1 + 13), zona: -1, r: 2.2 + azar(i + 4) * 2 });
    }
    // orden de aparición mezclado
    return L.map((p, i) => ({ ...p, o: azar(i * 9.1 + 3) })).sort((p, q) => p.o - q.o);
  }, [c]);
  const aparece = (t - a(TV.cuboPuntos)) / a(TV.cuboPuntosDur);
  const filtra = easeInOut((t - a(TV.cuboFiltra)) / a(TV.cuboFiltraDur));
  // vértices del cubo
  const V: Record<string, [number, number, number]> = {};
  for (const x of [0, 1]) for (const y of [0, 1]) for (const z of [0, 1]) V[`${x}${y}${z}`] = proy(x, y, z);
  const aristas: [string, string][] = [];
  for (const x of [0, 1]) for (const y of [0, 1]) for (const z of [0, 1]) {
    if (x === 0) aristas.push([`0${y}${z}`, `1${y}${z}`]);
    if (y === 0) aristas.push([`${x}0${z}`, `${x}1${z}`]);
    if (z === 0) aristas.push([`${x}${y}0`, `${x}${y}1`]);
  }
  // esquinas de la base: la más cercana a la cámara es el origen de los ejes 1 y 2; el eje 3 sube por la esquina de la izquierda
  const base = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([x, z]) => ({ k: `${x}0${z}`, p: V[`${x}0${z}`] }));
  const frente = base.reduce((m, q) => (q.p[1] > m.p[1] ? q : m));
  const izq = base.reduce((m, q) => (q.p[0] < m.p[0] ? q : m));
  // vecinas de la esquina frontal = las que difieren en una sola coordenada (x o z); la opuesta en diagonal no cuenta
  const vecinos = base.filter((q) => q.k !== frente.k && (q.k[0] === frente.k[0]) !== (q.k[2] === frente.k[2])).sort((p, q) => p.p[0] - q.p[0]);
  const ejeIzq = vecinos[0], ejeDer = vecinos[1] ?? vecinos[0];
  const ejes: { a: [number, number, number]; b: [number, number, number]; txt: string }[] = [
    { a: frente.p, b: ejeIzq.p, txt: `1 · ${c.ejes[0]}` },
    { a: frente.p, b: ejeDer.p, txt: `2 · ${c.ejes[1]}` },
    { a: izq.p, b: [izq.p[0], izq.p[1] - S * Math.cos(tilt), 0], txt: `3 · ${c.ejes[2]}` },
  ];
  const sCubo = spr(f, a(0.1), { damping: 16, stiffness: 120, mass: 0.8 });
  const kZonas = easeOut((t - a(TV.cuboZonas)) / 0.5);
  return (
    <AbsoluteFill>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <StudioSvgDefs />
        <g opacity={clamp(sCubo * 2)}>
          {aristas.map(([p, q], i) => <line key={i} x1={V[p][0]} y1={V[p][1]} x2={V[q][0]} y2={V[q][1]} stroke={T.texto} strokeOpacity={0.22} strokeWidth={2} />)}
          {ejes.map((x, i) => <line key={`e${i}`} x1={x.a[0]} y1={x.a[1]} x2={x.b[0]} y2={x.b[1]} stroke={LIMA} strokeWidth={6} strokeLinecap="round" />)}
        </g>
        {pts.map((p, i) => {
          const vis = clamp(aparece * 1.3 - (i / pts.length) * 1.3 + 0.001) > 0;
          if (!vis) return null;
          const [x, y] = proy(p.x, p.y, p.z);
          const entra = clamp(aparece * 1.3 - (i / pts.length) * 1.3);
          const zona = p.zona >= 0;
          const alfa = zona ? 1 : 1 - filtra;
          if (alfa <= 0.01) return null;
          const col = zona ? mezclar("#FFFFFF", T.peligro, filtra) : "#FFFFFF";
          return <circle key={i} cx={x} cy={y} r={p.r * (zona ? 1 + 0.5 * filtra : 1) * Math.min(1, entra * 2)} fill={col} opacity={alfa * 0.95} />;
        })}
        {c.zonas.map((z, i) => {
          if (kZonas <= 0) return null;
          const [x, y] = proy(z.x, z.y, z.z);
          const r = S * 0.17 * kZonas;
          return <circle key={`z${i}`} cx={x} cy={y} r={r} fill="none" stroke={LIMA} strokeWidth={3.5} strokeDasharray="7 9" strokeLinecap="round" />;
        })}
      </svg>
      {ejes.map((x, i) => {
        const mx = (x.a[0] + x.b[0]) / 2, my = (x.a[1] + x.b[1]) / 2;
        let ang = (Math.atan2(x.b[1] - x.a[1], x.b[0] - x.a[0]) * 180) / Math.PI;
        if (ang > 90) ang -= 180;
        if (ang < -90) ang += 180;
        const out = i === 2 ? [-60, 0] : [i === 0 ? -40 : 40, 52];
        return (
          <div key={i} data-texto="cubo-eje" style={{ position: "absolute", left: mx + out[0], top: my + out[1], transform: `translate(-50%, -50%) rotate(${ang}deg)`, fontFamily: MONO, fontWeight: 700, fontSize: 26, color: LIMA, whiteSpace: "nowrap", opacity: clamp((t - a(0.5 + 0.1 * i)) / 0.3) }}>{x.txt}</div>
        );
      })}
      {c.zonas.map((z, i) => {
        if (!z.l || kZonas < 0.6) return null;
        const [x, y] = proy(z.x, z.y, z.z);
        return <Etiqueta key={`l${i}`} texto={z.l} x={Math.min(900, Math.max(180, x))} y={y - S * 0.17 - 34} px={26} ancho={300} mono color={T.peligro} peso={700} mayus={false} delay={TV.cuboZonas + 0.2} id="cubo-zona" />;
      })}
      {e.cap && <LineaCap texto={e.cap} y={330} px={34} delay={0.2} id="cap-cubo" />}
      {e.h && <TextoCinetico texto={e.h} destacada={e.w} y={1500} maxPx={64} minPx={40} maxLineas={2} caja={false} delay={TV.cuboFiltra} id="cubo-titulo" />}
    </AbsoluteFill>
  );
};

/* ───────────── DIALES ───────────── */

/**
 * Concha de espiral logarítmica con tres parámetros (W: cuánto se ensancha por vuelta, D: cuánto se aleja del centro, T: cuánto baja por vuelta).
 * Es una banda continua (el tubo visto desde arriba) pintada del giro más viejo al más nuevo, con sombreado de tres tonos según hacia dónde mira cada tramo
 * (cel-shading), costillas radiales, borde de luz y el labio de la abertura en rosa.
 */
const Espiral: React.FC<{ w: number; d: number; tt: number; cx: number; cy: number; color: string; luz: string; sombra: string }> = ({ w, d, tt, cx, cy, color, luz, sombra }) => {
  const g = Math.min(Math.log(Math.max(1.05, w)), 3.4);
  const vueltas = Math.min(4.4, Math.max(1.2, 5.6 / g));
  const total = vueltas * Math.PI * 2;
  const ROUT = 330;
  const dd = clamp(d / 0.6);
  const N = Math.round(Math.min(260, Math.max(120, 64 * vueltas)));
  const P = Array.from({ length: N + 1 }, (_, i) => {
    const th = (i / N) * total;
    const R = ROUT * Math.exp(-g * ((total - th) / (Math.PI * 2)));
    // borde interior: el exterior de la vuelta anterior (e^-g · R) y, cuanto mayor es D, más hacia afuera (aparece el hueco entre vueltas)
    const Rin = R * (Math.exp(-g) + dd * 0.55 * (1 - Math.exp(-g)));
    const ancho = R - Rin;
    const ang = th - Math.PI / 2;
    const lift = ((total - th) / (Math.PI * 2)) * Math.max(0, tt) * R * 0.45;
    const o: [number, number] = [cx + R * Math.cos(ang), cy + R * Math.sin(ang) * 0.92 - lift];
    const n: [number, number] = [cx + Rin * Math.cos(ang), cy + Rin * Math.sin(ang) * 0.92 - lift];
    const Rm = Rin + ancho * 0.35;
    const m: [number, number] = [cx + Rm * Math.cos(ang), cy + Rm * Math.sin(ang) * 0.92 - lift];
    return { o, n, m, ang };
  });
  const ys = P.flatMap((q) => [q.o[1], q.n[1]]);
  // la figura se centra en la zona libre (y 520–1230) y, si es una torre muy alta, se reduce para que quepa
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const esc = Math.min(1, 700 / Math.max(1, maxY - minY));
  const medio = (minY + maxY) / 2;
  const luzAng = -Math.PI * 0.75;
  const pt = (q: [number, number]): string => `${q[0].toFixed(1)},${q[1].toFixed(1)}`;
  const labio = Math.max(2, Math.round(N * 0.025));
  return (
    <g transform={`translate(${cx} ${cy}) scale(${esc}) translate(${-cx} ${-medio})`}>
      {P.slice(0, N).map((q, i) => {
        const r = P[i + 1];
        const s = 0.5 + 0.5 * Math.cos((q.ang + r.ang) / 2 - luzAng);
        const labioFin = i >= N - labio;
        const base = labioFin ? "#FFB7A8" : s < 0.3 ? mezclar(color, sombra, 0.55) : s < 0.62 ? color : mezclar(color, luz, 0.5);
        return (
          <g key={i}>
            <polygon points={[pt(q.o), pt(r.o), pt(r.n), pt(q.n)].join(" ")} fill={base} stroke={base} strokeWidth={0.8} strokeLinejoin="round" />
            {!labioFin && <polygon points={[pt(q.m), pt(r.m), pt(r.n), pt(q.n)].join(" ")} fill={sombra} opacity={0.42} />}
            {!labioFin && i % 3 === 0 && <line x1={q.o[0]} y1={q.o[1]} x2={q.n[0]} y2={q.n[1]} stroke={sombra} strokeWidth={1.7} opacity={0.55} />}
          </g>
        );
      })}
    </g>
  );
};

const Dial: React.FC<{ x: number; y: number; r: number; v: number; it: { l: string; min: number; max: number; u: string; dec: number }; activo: boolean; neon: string; texto: string; suave: string; delay: number }> = ({ x, y, r, v, it, activo, neon, texto, suave, delay }) => {
  const { f, a } = useReloj();
  const s = spr(f, a(delay), { damping: 14, stiffness: 140, mass: 0.7 });
  const ratio = clamp((v - it.min) / Math.max(1e-9, it.max - it.min));
  const arco = (g0: number, g1: number): string => {
    const [x0, y0] = polarXY(0, 0, r, g0), [x1, y1] = polarXY(0, 0, r, g1);
    return `M ${x0} ${y0} A ${r} ${r} 0 ${g1 - g0 > 180 ? 1 : 0} 1 ${x1} ${y1}`;
  };
  const gNeedle = 135 + 270 * ratio;
  const [nx, ny] = polarXY(0, 0, r * 0.78, gNeedle);
  return (
    <g transform={`translate(${x} ${y}) scale(${Math.max(0.0001, s)})`} opacity={clamp(s * 2)}>
      {activo && <circle r={r + 18} fill="none" stroke={neon} strokeOpacity={0.55} strokeWidth={3} />}
      <circle r={r + 8} fill="rgba(255,255,255,0.03)" />
      <path d={arco(135, 405)} fill="none" stroke={suave} strokeOpacity={0.35} strokeWidth={5} strokeLinecap="round" />
      <path d={arco(135, Math.max(135.5, gNeedle))} fill="none" stroke={neon} strokeWidth={8} strokeLinecap="round" />
      <line x1={0} y1={0} x2={nx} y2={ny} stroke={neon} strokeWidth={5} strokeLinecap="round" />
      <circle r={9} fill={neon} />
      <text x={0} y={r * 0.66} textAnchor="middle" fontFamily="'JetBrains Mono', ui-monospace, monospace" fontWeight={700} fontSize={Math.round(r * 0.3)} fill={texto}>{`${it.u === "×" ? "×" : ""}${fmtNum(v, it.dec)}${it.u && it.u !== "×" ? it.u : ""}`}</text>
    </g>
  );
};

export const Diales: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const { T } = useViral();
  const dl = e.diales!;
  const u = easeInOut((t - a(TV.dialesIni)) / a(TV.dialesDur));
  const val = dl.items.map((it) => lerp(it.a, it.b, u));
  const activos = dl.items.map((it) => Math.abs(it.b - it.a) > 1e-9 && u > 0 && u < 1);
  const neon = T.neon ?? T.acento;
  const rojo = T.peligro;
  const sFig = spr(f, a(0.15), { damping: 14, stiffness: 120, mass: 0.8 });
  const ancho = [240, 540, 840];
  const [w0, d0, t0] = [val[0] ?? 3, val[1] ?? 0.1, val[2] ?? 0];
  return (
    <AbsoluteFill>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <StudioSvgDefs />
        <g opacity={clamp(sFig * 2)} transform={`translate(0 ${(1 - sFig) * 30})`}>
          {dl.fig === "espiral" ? (
            <Espiral w={w0} d={d0} tt={t0} cx={540} cy={870} color={rojo} luz="#FF9E8A" sombra={oscurecer(rojo, 0.55)} />
          ) : (
            <g>
              {[0, 1].map((k) => {
                const amp = 40 + 150 * clamp((w0 - dl.items[0].min) / Math.max(1e-9, dl.items[0].max - dl.items[0].min));
                const frec = 1 + 6 * clamp((d0 - dl.items[1].min) / Math.max(1e-9, dl.items[1].max - dl.items[1].min));
                const fase = (t0 - dl.items[2].min) * 4 + t * 1.2;
                const pts = Array.from({ length: 160 }, (_, i) => { const x = 120 + (840 * i) / 159; return `${x.toFixed(1)},${(800 + amp * Math.sin((i / 159) * Math.PI * 2 * frec + fase)).toFixed(1)}`; }).join(" ");
                return <polyline key={k} points={pts} fill="none" stroke={k === 0 ? oscurecer(rojo, 0.5) : rojo} strokeWidth={k === 0 ? 40 : 26} strokeLinecap="round" strokeLinejoin="round" />;
              })}
            </g>
          )}
        </g>
        {dl.items.map((it, i) => <Dial key={i} x={ancho[i]} y={1500} r={78} v={val[i]} it={it} activo={activos[i]} neon={neon} texto={T.texto} suave={T.suave} delay={0.3 + 0.12 * i} />)}
      </svg>
      <TextoCinetico texto={e.h} destacada={e.w} y={320} maxPx={110} minPx={56} maxLineas={1} caja={false} delay={0.1} id="diales-palabra" />
      {e.cap && <LineaCap texto={e.cap} y={425} px={32} delay={0.4} id="cap-diales" />}
      <Etiqueta texto={dl.titulo} x={W / 2} y={1330} px={26} ancho={500} mono color={neon} peso={700} mayus={false} delay={0.3} id="diales-titulo" />
      {dl.items.map((it, i) => (
        <div key={i} data-texto="diales-etiqueta" style={{ position: "absolute", left: ancho[i] - 130, top: 1610, width: 260, textAlign: "center", fontFamily: MONO, fontSize: 22, lineHeight: 1.25, color: activos[i] ? neon : T.suave, opacity: clamp((t - a(0.5 + 0.12 * i)) / 0.3) }}>{`${i + 1} · ${it.l}`}</div>
      ))}
    </AbsoluteFill>
  );
};
