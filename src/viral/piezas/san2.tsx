/**
 * «El viaje de una gota de sangre» (SINAPSIS · anatomía humana) · escenas 2/2
 *   san-capilar  el capilar (≈ 8 µm): los glóbulos rojos se deforman en «bala», avanzan de a uno y entregan oxígeno; ≈ 270 millones de hemoglobinas por glóbulo
 *   san-venas    vena con válvulas de un solo sentido y músculo de la pantorrilla que empuja la sangre oscura hacia el corazón (≈ 2/3 de la sangre está en las venas)
 *   san-pulmon   alvéolo: en ≈ 0,75 s (cámara lenta) el glóbulo suelta CO2, recoge O2 y vuelve a ser rojo brillante
 *   san-vida     un glóbulo vive ≈ 120 días y da ≈ 172.800 vueltas; la médula ósea lo repone (≈ 2–3 millones por segundo); el viaje cierra el círculo
 * Esquemas de fisiología en reposo; el reloj del viaje y los tiempos por tramo son ilustrativos (distribución del volumen de sangre).
 */
import React from "react";
import { SAN, TSAN, vueltasEnVida, sistole } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { azar } from "../../lib/anim";
import { H, W, clamp, easeInOut, easeOut, lerp, mezclar, spr, useReloj } from "../comun";
import { Lectura } from "./jet-kit";
import { Frases, FONT, MONOF } from "./real-kit";
import { Fuente } from "./real1";
import { Cap, Fondo } from "./san1";
import { DefGlobulo, Gota, GlobuloBala, GlobuloRojo, Ruta, RelojViaje, SA } from "./san-kit";

type P = { e: EscenaViralGuardada };

const smooth = (k: number): number => { const x = clamp(k); return x * x * (3 - 2 * x); };
/** seis degradados de glóbulo, de oscuro (0) a rojo brillante (5) */
const Defs6: React.FC<{ p: string }> = ({ p }) => <>{[0, 1, 2, 3, 4, 5].map((i) => <DefGlobulo key={i} id={`${p}${i}`} oxi={i / 5} />)}</>;
const gid = (p: string, oxi: number): string => `${p}${Math.round(clamp(oxi) * 5)}`;
/** «O2» / «CO2» con el 2 como subíndice dibujado (la tipografía no trae subíndices Unicode) */
const Quim: React.FC<{ x: number; y: number; size: number; fill: string; c?: boolean; anchor?: "start" | "middle" | "end"; weight?: number }> = ({ x, y, size, fill, c, anchor = "middle", weight = 800 }) => (
  <text x={x} y={y} textAnchor={anchor} fontFamily={FONT} fontWeight={weight} fontSize={size} fill={fill}>{c ? "CO" : "O"}<tspan dy={size * 0.22} fontSize={size * 0.68}>2</tspan></text>
);

/* ───────────── san-capilar ───────────── */

export const SanCapilar: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const K = TSAN.capilar;
  const yc = (x: number): number => 900 + 34 * Math.sin(x * 0.0058 + 0.6);
  const dyc = (x: number): number => 34 * 0.0058 * Math.cos(x * 0.0058 + 0.6);
  const hh = (x: number): number => 38 + 74 * smooth((340 - x) / 340);
  const xs = React.useMemo(() => Array.from({ length: 59 }, (_, i) => -40 + i * 20), []);
  const poly = `M ${xs.map((x) => `${x},${(yc(x) - hh(x)).toFixed(1)}`).join(" L ")} L ${xs.slice().reverse().map((x) => `${x},${(yc(x) + hh(x)).toFixed(1)}`).join(" L ")} Z`;
  // velocidad: constante y luego se frena (la sangre va lenta en los capilares)
  const tl = a(K.lento), v0 = 300, v1 = 110;
  const s = Math.max(0, t - tl), xr = Math.min(1, s / 0.8);
  const integ = s <= 0 ? 0 : xr < 1 ? 0.8 * (Math.pow(xr, 3) - Math.pow(xr, 4) / 2) : 0.4 + (s - 0.8);
  const pos = v0 * t - (v0 - v1) * integ;
  const kO = smooth((t - a(K.o2)) / 1.0);
  const kEntra = spr(f, a(K.entra), { damping: 12, stiffness: 180, mass: 0.7 });
  const kHb = spr(f, a(K.hb), { damping: 13, stiffness: 150, mass: 0.8 });
  const cuenta = easeOut((t - a(K.hb)) / 1.3);
  const tejido: [number, number, number, number][] = [[170, 715, 150, 86], [510, 706, 160, 80], [860, 716, 160, 86], [190, 1090, 160, 84], [540, 1100, 170, 78], [880, 1090, 150, 84]];
  const molec = React.useMemo(() => Array.from({ length: 18 }, (_, k) => ({ x0: 430 + (k % 9) * 58 + azar(k * 1.3) * 22, up: k % 2 ? 1 : -1, ph: azar(k * 3.3), sp: 0.55 + 0.45 * azar(k * 1.7), d: 120 + azar(k * 5.1) * 50 })), []);
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id="cap-tej" cx="42%" cy="35%" r="80%"><stop offset="0" stopColor="#8A4A8C" /><stop offset="0.6" stopColor="#5A2766" /><stop offset="1" stopColor="#2E1038" /></radialGradient>
          <linearGradient id="cap-lum" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#3A0A18" /><stop offset="0.5" stopColor="#2A0610" /><stop offset="1" stopColor="#24050E" /></linearGradient>
          <filter id="cap-glo" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="9" /></filter>
        </defs>
        <Defs6 p="cap-g" />
        {/* células del tejido: se «encienden» al recibir oxígeno */}
        {tejido.map(([x, y, rx, ry], i) => (
          <g key={i}>
            <ellipse cx={x} cy={y} rx={rx + 14} ry={ry + 14} fill={SA.cian} opacity={0.22 * kO * (0.6 + 0.4 * Math.sin(t * 3 + i))} filter="url(#cap-glo)" />
            <ellipse cx={x} cy={y} rx={rx} ry={ry} fill="url(#cap-tej)" stroke={mezclar("#4A1E58", "#C58AD8", 0.5 * kO)} strokeWidth={5} opacity={0.82 + 0.18 * kO} />
            <ellipse cx={x + (i % 3 - 1) * 22} cy={y + (i < 3 ? 12 : -12)} rx={rx * 0.3} ry={ry * 0.42} fill="#1B0724" opacity={0.7} />
            <ellipse cx={x - rx * 0.3} cy={y - ry * 0.4} rx={rx * 0.28} ry={ry * 0.12} fill="#fff" opacity={0.1} />
          </g>
        ))}
        {/* el capilar */}
        <path d={poly} fill="url(#cap-lum)" stroke="#C0657A" strokeWidth={9} strokeLinejoin="round" />
        <path d={poly} fill="none" stroke="#FFB1B8" strokeOpacity={0.18} strokeWidth={2} transform="translate(0 -4)" />
        {/* glóbulos rojos que se deforman y se oscurecen */}
        {Array.from({ length: 6 }, (_, i) => {
          const x = (((pos + i * 270) % 1620) + 1620) % 1620 - 300;
          if (x < -150 || x > 1230) return null;
          const wd = clamp((340 - x) / 340);
          const alto = 2 * hh(x) * 0.78, largo = lerp(152, 172, wd);
          const oxi = 1 - 0.78 * kO * smooth((x - 380) / 520);
          return (
            <g key={i} transform={`translate(${x.toFixed(1)} ${yc(x).toFixed(1)}) rotate(${((Math.atan(dyc(x)) * 180) / Math.PI).toFixed(1)})`}>
              <GlobuloBala x={0} y={0} largo={largo} alto={alto} grad={gid("cap-g", oxi)} hundido={0.1 + 0.5 * (1 - wd)} />
            </g>
          );
        })}
        {/* oxígeno que sale hacia las células */}
        {t > a(K.o2) && molec.map((m, k) => {
          const cyc = (((t - a(K.o2)) * m.sp + m.ph) % 1);
          const y0 = yc(m.x0), y1 = y0 + m.up * (hh(m.x0) + m.d);
          const x = m.x0 + Math.sin(cyc * 6 + k) * 8, y = lerp(y0, y1, easeOut(cyc));
          const op = Math.sin(Math.PI * cyc);
          return (
            <g key={k} opacity={op * 0.95}>
              <circle cx={x} cy={y} r={15} fill={SA.cian} opacity={0.3} />
              <circle cx={x} cy={y} r={8} fill={SA.cian} stroke="#fff" strokeWidth={2} />
            </g>
          );
        })}
        {/* medida: el capilar tiene el ancho de un glóbulo */}
        <g opacity={clamp(kEntra * 2)}>
          <line x1={640} y1={yc(640) - hh(640) - 4} x2={640} y2={yc(640) + hh(640) + 4} stroke={SA.oro} strokeWidth={5} />
          <path d={`M 640 ${yc(640) - hh(640) - 4} l -12 18 M 640 ${yc(640) - hh(640) - 4} l 12 18 M 640 ${yc(640) + hh(640) + 4} l -12 -18 M 640 ${yc(640) + hh(640) + 4} l 12 -18`} stroke={SA.oro} strokeWidth={5} strokeLinecap="round" fill="none" />
          <rect x={668} y={yc(640) - 66} width={174} height={52} rx={14} fill="rgba(10,2,6,0.85)" stroke={SA.oro} strokeWidth={3} />
          <text x={755} y={yc(640) - 29} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={36} fill={SA.oro}>≈ 8 µm</text>
        </g>
        <Ruta paso={3} prog={clamp(t / a(7))} y={1420} />
      </svg>
      {/* velocidad */}
      <div data-texto="capilar-lento" style={{ position: "absolute", left: 90, top: 592, width: 900, textAlign: "center", fontFamily: MONOF, fontWeight: 700, fontSize: 26, letterSpacing: "0.04em", color: SA.hielo, opacity: smooth((t - tl) / 0.6) }}>← la sangre se frena: tiempo para intercambiar</div>
      {/* hemoglobina */}
      <div data-texto="capilar-hb" style={{ position: "absolute", left: 90, top: 1218, width: 900, height: 118, borderRadius: 24, background: "rgba(10,2,6,0.82)", border: "3px solid rgba(255,154,162,0.45)", opacity: clamp(kHb * 2), transform: `translateY(${(1 - clamp(kHb)) * 24}px)` }}>
        <svg width={150} height={118} viewBox="0 0 150 118" style={{ position: "absolute", left: 6, top: 0 }}>
          <DefGlobulo id="cap-hb" oxi={1} />
          <GlobuloRojo x={75} y={59} r={46} grad="cap-hb" tilt={0.5} rot={0.4} />
          {[0, 1, 2, 3].map((k) => <circle key={k} cx={75 + Math.cos(k * 1.57 + 0.8) * 56} cy={59 + Math.sin(k * 1.57 + 0.8) * 48} r={6} fill={SA.cian} />)}
        </svg>
        <div style={{ position: "absolute", left: 170, top: 10, fontFamily: MONOF, fontWeight: 700, fontSize: 24, color: SA.hielo, letterSpacing: "0.05em" }}>CADA GLÓBULO ROJO LLEVA</div>
        <div style={{ position: "absolute", left: 170, top: 38, fontFamily: FONT, fontWeight: 900, fontSize: 44, color: SA.oro, lineHeight: 1.1 }}>≈ {Math.round(SAN.hbMillones * cuenta)} millones</div>
        <div style={{ position: "absolute", left: 520, top: 46, fontFamily: FONT, fontWeight: 600, fontSize: 28, lineHeight: 1.15, color: "#fff" }}>de hemoglobinas<br />(4 O<span style={{ fontSize: 19, position: "relative", top: 5 }}>2</span> cada una)</div>
      </div>
      <RelojViaje seg={15 + clamp(t / a(7)) * 3} />
      <Frases frases={[{ t: 0.2, texto: "ENTRA AL\nCAPILAR", px: 104 }, { t: K.entra, texto: "TAN FINO QUE\nPASAN DE A UNO", px: 82, color: SA.oro }, { t: K.o2, texto: "ENTREGA EL\nOXÍGENO", px: 100, color: SA.cian }]} y={450} x={104} id="titular-san-capilar" />
      <Fuente texto="Capilar ≈ 5–10 µm; glóbulo rojo ≈ 8 µm; ≈ 270 millones de hemoglobinas por glóbulo. Esquema; el reloj del viaje es ilustrativo." y={1500} delay={K.hb} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── san-venas ───────────── */

const VX = 540;
export const SanVenas: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const V = TSAN.venas;
  const t0 = a(V.musculo);
  // squeeze del músculo: pulso cada 1,8 s desde `musculo`
  const sqDe = (tt: number): number => { if (tt < t0) return 0; const ph = (((tt - t0) / 1.8) % 1); return ph < 0.55 ? Math.pow(Math.sin((Math.PI * ph) / 0.55), 2) : 0; };
  const sq = sqDe(t);
  let lift = 0;
  for (let tt = t0; tt < t; tt += 0.04) lift += sqDe(tt) * 0.04 * 900;
  const ys = Array.from({ length: 32 }, (_, i) => 640 + i * 20);   // 640..1260
  const wDe = (y: number): number => 62 - 26 * sq * Math.pow(Math.sin(Math.PI * clamp((y - 760) / 460)), 0.8);
  const veinPath = `M ${ys.map((y) => `${VX - wDe(y)},${y}`).join(" L ")} L ${ys.slice().reverse().map((y) => `${VX + wDe(y)},${y}`).join(" L ")} Z`;
  const bulge = (y: number): number => 250 * Math.pow(Math.max(0, Math.sin(Math.PI * clamp((y - 740) / 500))), 0.7) * (1 + 0.14 * sq);
  const yM = Array.from({ length: 26 }, (_, i) => 740 + i * 20);
  const mus = (lado: number): string => `M ${yM.map((y) => `${VX + lado * (wDe(y) + 5)},${y}`).join(" L ")} L ${yM.slice().reverse().map((y) => `${VX + lado * (wDe(y) + 5 + bulge(y))},${y}`).join(" L ")} Z`;
  const fibras = (lado: number, j: number): string => `M ${yM.map((y) => `${VX + lado * (wDe(y) + 5 + bulge(y) * (j / 5))},${y}`).join(" L ")}`;
  const abre = (t < a(V.valvulas) ? 0.85 : 0) + clamp(sq * 1.6);
  const cierra = 1 - clamp(abre);
  const valv = [1110, 950, 800];
  const kV = smooth((t - a(V.valvulas)) / 0.5);
  const kUp = spr(f, a(V.sube), { damping: 12, stiffness: 150, mass: 0.8 });
  const cel = React.useMemo(() => Array.from({ length: 16 }, (_, i) => ({ off: i * 46 + azar(i * 3.3) * 20, dx: (azar(i * 5.1) - 0.5) * 70, ph: azar(i * 9.9) * 6.28, w: (azar(i * 2.2) - 0.5) * 3 })), []);
  const span = 620;
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="ven-mus" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#5E1420" /><stop offset="0.5" stopColor="#A03040" /><stop offset="1" stopColor="#6A1A28" /></linearGradient>
          <linearGradient id="ven-lum" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#2A1848" /><stop offset="0.5" stopColor="#4A2C7A" /><stop offset="1" stopColor="#2A1848" /></linearGradient>
        </defs>
        <Defs6 p="ven-g" />
        {/* músculo de la pantorrilla */}
        {[-1, 1].map((l) => (
          <g key={l}>
            <path d={mus(l)} fill="url(#ven-mus)" stroke="#2A0610" strokeWidth={6} strokeLinejoin="round" />
            {[1, 2, 3, 4].map((j) => <path key={j} d={fibras(l, j)} fill="none" stroke="#FFB1B8" strokeOpacity={0.14} strokeWidth={4} />)}
          </g>
        ))}
        <text x={VX - 250} y={990} textAnchor="middle" fontFamily={MONOF} fontWeight={800} fontSize={25} fill="#fff" opacity={0.85}>músculo</text>
        <text x={VX - 250} y={1022} textAnchor="middle" fontFamily={MONOF} fontWeight={700} fontSize={22} fill="#FFD0D4" opacity={0.8}>pantorrilla</text>
        {/* la vena */}
        <path d={veinPath} fill="url(#ven-lum)" stroke="#6C5BC0" strokeWidth={7} strokeLinejoin="round" />
        {cel.map((c, i) => {
          const p = (lift + t * 26 + c.off) % span;
          const y = 1250 - p;
          const w = wDe(y) * 0.72;
          const op = clamp((y - 650) / 40) * clamp((1255 - y) / 40);
          return <GlobuloRojo key={i} x={VX + c.dx * (w / 62) * 0.8} y={y} r={Math.min(18, w * 0.42)} rot={c.ph + t * c.w} tilt={t * 1.4 + c.ph} grad={gid("ven-g", 0.34)} opacidad={op} />;
        })}
        {/* válvulas */}
        {valv.map((y, i) => {
          const w = wDe(y);
          const tip = 40 * cierra + 8 * (1 - cierra);
          const inX = w * (0.04 + 0.96 * (1 - cierra));
          return (
            <g key={i}>
              <path d={`M ${VX - w} ${y} L ${VX - inX} ${y - tip}`} stroke="#F0CFCF" strokeWidth={11} strokeLinecap="round" fill="none" />
              <path d={`M ${VX + w} ${y} L ${VX + inX} ${y - tip}`} stroke="#F0CFCF" strokeWidth={11} strokeLinecap="round" fill="none" />
              {kV > 0 && <circle cx={VX} cy={y - 14} r={62 + 6 * Math.sin(t * 5 + i)} fill="none" stroke={SA.oro} strokeWidth={4} strokeDasharray="10 10" opacity={0.85 * kV * (t < a(V.musculo) ? 1 : 0.5)} />}
              {cierra > 0.6 && kV > 0 && <g opacity={kV}><path d={`M ${VX + 110} ${y - 70} L ${VX + 110} ${y - 20} M ${VX + 92} ${y - 38} L ${VX + 110} ${y - 18} L ${VX + 128} ${y - 38}`} stroke={SA.clara} strokeWidth={6} strokeLinecap="round" fill="none" /></g>}
            </g>
          );
        })}
        {kV > 0 && <text x={VX + 150} y={valv[1] - 20} fontFamily={MONOF} fontWeight={800} fontSize={25} fill={SA.oro} opacity={kV}>válvula</text>}
        {/* hacia el corazón */}
        <g opacity={clamp(kUp * 2)} transform={`translate(0 ${-8 * Math.sin(t * 4)})`}>
          <path d={`M 930 1130 L 930 740 M 880 800 L 930 740 L 980 800`} stroke={SA.oro} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </g>
        <Ruta paso={4} prog={clamp(t / a(6.4))} y={1420} />
      </svg>
      <div data-texto="venas-corazon" style={{ position: "absolute", left: 604, top: 612, width: 380, textAlign: "right", fontFamily: MONOF, fontWeight: 800, fontSize: 26, color: SA.oro, opacity: clamp(kUp * 2) }}>↑ AL CORAZÓN</div>
      <div data-texto="venas-dos-tercios" style={{ position: "absolute", left: 90, top: 1292, width: 900, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 34, color: "#fff", opacity: smooth((t - a(V.valvulas)) / 0.6) }}>
        <span style={{ color: SA.oro }}>≈ 2/3</span> de tu sangre está en las venas
      </div>
      <RelojViaje seg={18 + clamp(t / a(6.4)) * 37} />
      <Frases frases={[{ t: 0.2, texto: "VUELVE POR\nLAS VENAS", px: 104 }, { t: V.valvulas, texto: "VÁLVULAS: SOLO\nDEJAN SUBIR", px: 84, color: SA.oro }, { t: V.musculo, texto: "EL MÚSCULO\nLA EMPUJA", px: 100 }, { t: V.sube, texto: "CONTRA LA\nGRAVEDAD", px: 104, color: SA.hielo }]} y={450} x={104} id="titular-san-venas" />
      <Fuente texto="Venas sistémicas ≈ 64 % del volumen de sangre (Guyton; fuente secundaria). Esquema de la bomba muscular; el reloj del viaje es ilustrativo." y={1500} delay={V.valvulas} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── san-pulmon ───────────── */

const PC = { x: 540, y: 840, R: 325, ra: 245, tail: 250 };
const LP = PC.tail * 2 + Math.PI * PC.R;
/** punto, dirección y fracción de arco a la distancia `s` del recorrido del capilar */
function enCapilar(s: number): { x: number; y: number; ang: number; arco: number } {
  if (s < PC.tail) return { x: PC.x - PC.R, y: PC.y - PC.tail + s, ang: 90, arco: 0 };
  const arcoLen = Math.PI * PC.R;
  if (s < PC.tail + arcoLen) {
    const phi = (s - PC.tail) / PC.R, th = Math.PI - phi;
    return { x: PC.x + PC.R * Math.cos(th), y: PC.y + PC.R * Math.sin(th), ang: (Math.atan2(-Math.cos(th), Math.sin(th)) * 180) / Math.PI, arco: (s - PC.tail) / arcoLen };
  }
  return { x: PC.x + PC.R, y: PC.y - (s - PC.tail - arcoLen), ang: -90, arco: 1 };
}

export const SanPulmon: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const L = TSAN.pulmon;
  const kA = spr(f, a(L.alveolo), { damping: 13, stiffness: 120, mass: 0.9 });
  const arcoLen = Math.PI * PC.R;
  const v = arcoLen / a(L.pasaDur);
  const sClave = v * (t - a(L.pasa)) + PC.tail;
  const frac = clamp((sClave - PC.tail) / arcoLen);
  const kBola = spr(f, a(L.bola), { damping: 12, stiffness: 160, mass: 0.7 });
  const N = 7;
  const celdas = Array.from({ length: N }, (_, i) => {
    const s = (((sClave + i * (LP / N)) % LP) + LP) % LP;
    const p = enCapilar(s);
    const oxi = s < PC.tail ? 0.08 : s < PC.tail + arcoLen ? 0.08 + 0.92 * smooth((p.arco - 0.08) / 0.7) : 1;
    return { i, s, p, oxi };
  });
  const burbujas = React.useMemo(() => Array.from({ length: 10 }, (_, k) => ({ a: azar(k * 2.1) * 6.28, r: 30 + azar(k * 3.7) * 150, w: 0.2 + azar(k * 5.3) * 0.3, tam: 7 + azar(k * 1.9) * 9 })), []);
  const arcoPath = `M ${PC.x - PC.R} ${PC.y - PC.tail} L ${PC.x - PC.R} ${PC.y} A ${PC.R} ${PC.R} 0 0 0 ${PC.x + PC.R} ${PC.y} L ${PC.x + PC.R} ${PC.y - PC.tail}`;
  const tiempoReal = 0.75 * frac;
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id="pul-air" cx="50%" cy="45%" r="60%"><stop offset="0" stopColor="#2A7FA0" stopOpacity="0.55" /><stop offset="0.8" stopColor="#0E3C58" stopOpacity="0.55" /><stop offset="1" stopColor="#0A2A40" stopOpacity="0.8" /></radialGradient>
          <linearGradient id="pul-lum" gradientUnits="userSpaceOnUse" x1={PC.x - PC.R} y1="0" x2={PC.x + PC.R} y2="0"><stop offset="0" stopColor="#1B0A20" /><stop offset="0.5" stopColor="#2A0812" /><stop offset="1" stopColor="#3A0614" /></linearGradient>
          <filter id="pul-glo" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="8" /></filter>
        </defs>
        <Defs6 p="pul-g" />
        {/* alvéolo */}
        <g opacity={clamp(kA * 2)} transform={`translate(${PC.x} ${PC.y}) scale(${0.85 + 0.15 * clamp(kA)}) translate(${-PC.x} ${-PC.y})`}>
          <circle cx={PC.x} cy={PC.y} r={PC.ra + 22} fill={SA.cian} opacity={0.1} filter="url(#pul-glo)" />
          <circle cx={PC.x} cy={PC.y} r={PC.ra} fill="url(#pul-air)" stroke="#9FD3E8" strokeWidth={9} />
          <circle cx={PC.x} cy={PC.y} r={PC.ra - 12} fill="none" stroke="#fff" strokeOpacity={0.12} strokeWidth={3} />
          {burbujas.map((b, k) => <circle key={k} cx={PC.x + Math.cos(b.a + t * b.w) * b.r} cy={PC.y - 30 + Math.sin(b.a + t * b.w) * b.r * 0.8} r={b.tam} fill={SA.cian} opacity={0.35} />)}
        </g>
        {/* capilar que envuelve al alvéolo */}
        <path d={arcoPath} fill="none" stroke="#C0657A" strokeWidth={96} strokeLinecap="butt" strokeLinejoin="round" />
        <path d={arcoPath} fill="none" stroke="url(#pul-lum)" strokeWidth={80} strokeLinecap="butt" />
        {/* intercambio de gases */}
        {t > a(L.pasa) - 0.3 && celdas.map(({ i, p }) => {
          if (p.arco <= 0.02 || p.arco >= 0.98) return null;
          const dx = PC.x - p.x, dy = PC.y - p.y, dl = Math.hypot(dx, dy) || 1, ux = dx / dl, uy = dy / dl;
          return [0, 1, 2].map((k) => {
            const cyc = ((t * 1.5 + k / 3 + i * 0.19) % 1);
            const co = lerp(0, 150, easeOut(cyc)), ox = 150 - co;
            return (
              <g key={`${i}-${k}`}>
                <circle cx={p.x + ux * co} cy={p.y + uy * co} r={8} fill={SA.ambar} stroke="#fff" strokeWidth={2} opacity={Math.sin(Math.PI * cyc) * clamp(1 - (p.arco - 0.7) * 3)} />
                <circle cx={p.x + ux * ox + uy * 16} cy={p.y + uy * ox - ux * 16} r={8} fill={SA.cian} stroke="#fff" strokeWidth={2} opacity={Math.sin(Math.PI * ((cyc + 0.5) % 1)) * clamp(1 - p.arco * 1.1)} />
              </g>
            );
          });
        })}
        {/* glóbulos */}
        {celdas.map(({ i, s, p, oxi }) => {
          const op = clamp(s / 40) * clamp((LP - s) / 40);
          return (
            <g key={i} opacity={op} transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${p.ang.toFixed(1)})`}>
              <GlobuloBala x={0} y={0} largo={112} alto={58} grad={gid("pul-g", oxi)} hundido={0.5} />
            </g>
          );
        })}
        {/* el glóbulo protagonista */}
        {(() => {
          const p = enCapilar(clamp(sClave, 0, LP));
          const ver = clamp((t - a(L.pasa) + 0.3) / 0.3) * (1 - clamp((frac - 0.995) * 200));
          return <circle cx={p.x} cy={p.y} r={56 + 3 * Math.sin(t * 8)} fill="none" stroke={SA.oro} strokeWidth={5} strokeDasharray="12 10" opacity={ver} />;
        })()}
        <g opacity={clamp(kA * 2)}>
          <text x={PC.x} y={PC.y - 36} textAnchor="middle" fontFamily={MONOF} fontWeight={800} fontSize={30} fill="#fff" opacity={0.9}>ALVÉOLO</text>
          <text x={PC.x} y={PC.y + 4} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={32} fill={SA.hielo}>aire con <tspan fill={SA.cian}>O<tspan dy={7} fontSize={22}>2</tspan></tspan></text>
          <g transform={`translate(${PC.x} ${PC.y + 70})`} opacity={clamp((t - a(L.pasa)) / 0.5)}>
            <circle cx={-150} cy={0} r={10} fill={SA.cian} stroke="#fff" strokeWidth={2} /><Quim x={-130} y={10} size={28} fill={SA.cian} anchor="start" weight={700} />
            <text x={-82} y={10} fontFamily={FONT} fontWeight={600} fontSize={26} fill="#fff">entra</text>
            <circle cx={22} cy={0} r={10} fill={SA.ambar} stroke="#fff" strokeWidth={2} /><Quim x={42} y={10} size={28} fill={SA.ambar} c anchor="start" weight={700} />
            <text x={112} y={10} fontFamily={FONT} fontWeight={600} fontSize={26} fill="#fff">sale</text>
          </g>
        </g>
        <Ruta paso={5} prog={0} y={1420} />
      </svg>
      <Lectura x={104} y={1268} ancho={620} alinear="left" titulo="TIEMPO REAL · CÁMARA LENTA" valor={`≈ ${tiempoReal.toFixed(2).replace(".", ",")} s`} px={58} color="#fff" opacidad={clamp((t - a(L.pasa) + 0.2) / 0.4)} id="pulmon-tiempo" colorTitulo={SA.hielo} />
      <div style={{ position: "absolute", right: 96, top: 1135, opacity: clamp(kBola * 2), transform: `scale(${0.6 + 0.4 * clamp(kBola)})`, transformOrigin: "100% 100%" }}>
        <svg width={260} height={260} viewBox="-130 -130 260 260"><Gota x={0} y={0} s={0.32} t={t} latido={sistole(t)} /></svg>
      </div>
      <RelojViaje seg={55 + clamp(t / a(7)) * 5} />
      <Frases frases={[{ t: 0.2, texto: "LLEGA A\nLOS PULMONES", px: 100 }, { t: L.pasa, texto: "EN MENOS DE\n1 SEGUNDO", px: 100, color: SA.oro }, { t: L.co2, texto: "SUELTA CO2,\nRECOGE O2", px: 96, color: SA.cian }, { t: L.bola, texto: "ROJO BRILLANTE\nOTRA VEZ", px: 88, color: SA.clara }]} y={450} x={104} id="titular-san-pulmon" />
      <Fuente texto="Tránsito del glóbulo por el capilar pulmonar en reposo ≈ 0,75 s (se muestra en cámara lenta). Esquema; el reloj del viaje es ilustrativo." y={1500} delay={L.pasa} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── san-vida ───────────── */

const RV = { x: 540, y: 960, R: 250 };
const NODOS = ["Corazón", "Aorta", "Arterias", "Capilares", "Venas", "Pulmones"];

export const SanVida: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const D = TSAN.vida;
  const vueltas = vueltasEnVida(SAN.vidaDias, SAN.vueltaS);
  const kAnillo = smooth((t - a(D.anillo)) / 0.9);
  const tau = t - a(D.vueltas);
  const kc = easeInOut(clamp(tau / a(D.vueltasDur)));
  const cuenta = Math.round(vueltas * kc);
  const phi = (tau <= 0 ? 0 : 2 * Math.PI * (14 * kc + 0.35 * Math.max(0, tau - a(D.vueltasDur)))) - Math.PI / 2;
  const km = smooth((t - a(D.medula)) / 0.9);
  const kFin = spr(f, a(D.fin), { damping: 12, stiffness: 150, mass: 0.8 });
  const esc = 1 - 0.42 * km, cy = lerp(RV.y, 800, km);
  const sis = sistole(t);
  const med = React.useMemo(() => Array.from({ length: 22 }, (_, i) => ({ x: 300 + azar(i * 2.7) * 480, off: i * 31 + azar(i * 4.1) * 20, ph: azar(i * 8.8) * 6.28, w: (azar(i * 3.3) - 0.5) * 3 })), []);
  const nodo = (k: number): [number, number] => [RV.x + RV.R * Math.cos((k * Math.PI) / 3 - Math.PI / 2), RV.y + RV.R * Math.sin((k * Math.PI) / 3 - Math.PI / 2)];
  const fmt = (n: number): string => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const C = 2 * Math.PI * RV.R;
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id="vid-hueso" cx="50%" cy="40%" r="70%"><stop offset="0" stopColor="#F4EBDD" /><stop offset="1" stopColor="#B8A58C" /></radialGradient>
          <radialGradient id="vid-medula" cx="50%" cy="50%" r="60%"><stop offset="0" stopColor="#B8344E" /><stop offset="1" stopColor="#6A1228" /></radialGradient>
          <filter id="vid-glo" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="8" /></filter>
        </defs>
        <Defs6 p="vid-g" />
        {/* anillo del viaje */}
        <g transform={`translate(${RV.x} ${cy}) scale(${esc}) translate(${-RV.x} ${-RV.y})`} opacity={clamp(kAnillo * 2)}>
          <circle cx={RV.x} cy={RV.y} r={RV.R} fill="none" stroke="#BFE0FF" strokeOpacity={0.2} strokeWidth={10} />
          <circle cx={RV.x} cy={RV.y} r={RV.R} fill="none" stroke={SA.clara} strokeWidth={12} strokeLinecap="round" strokeDasharray={`${C * kAnillo} ${C}`} transform={`rotate(-90 ${RV.x} ${RV.y})`} />
          <circle cx={RV.x} cy={RV.y} r={RV.R} fill="none" stroke={SA.clara} strokeWidth={26} opacity={0.12 + 0.12 * sis * km} filter="url(#vid-glo)" />
          {NODOS.map((n, k) => {
            const [x, y] = nodo(k);
            const lx = RV.x + (RV.R + 62) * Math.cos((k * Math.PI) / 3 - Math.PI / 2), ly = RV.y + (RV.R + 62) * Math.sin((k * Math.PI) / 3 - Math.PI / 2);
            return (
              <g key={n}>
                <circle cx={x} cy={y} r={15} fill="#1B0A12" stroke="#fff" strokeWidth={4} />
                <circle cx={x} cy={y} r={7} fill={k === 3 ? SA.cian : SA.clara} />
                <text x={lx} y={ly + 8} textAnchor="middle" fontFamily={MONOF} fontWeight={700} fontSize={23} fill={SA.hielo} opacity={(1 - km) * kAnillo}>{n}</text>
              </g>
            );
          })}
          {/* glóbulo que da vueltas, con estela */}
          {tau > -0.3 && [5, 4, 3, 2, 1, 0].map((k) => {
            const ang = phi - k * (0.1 + 0.5 * kc * (1 - km));
            return <circle key={k} cx={RV.x + RV.R * Math.cos(ang)} cy={RV.y + RV.R * Math.sin(ang)} r={k === 0 ? 20 : 20 - k * 2.2} fill={k === 0 ? "#fff" : SA.clara} opacity={k === 0 ? 1 : 0.5 - k * 0.07} />;
          })}
        </g>
        {/* la gota vuelve al final */}
        <g opacity={clamp(kFin * 2)}><Gota x={RV.x} y={cy} s={0.36 * clamp(kFin)} t={t} latido={sis} /></g>
        {/* médula ósea que repone glóbulos */}
        <g opacity={km}>
          <path d="M 190 1060 C 150 1020 70 1040 90 1110 C 100 1150 140 1160 170 1150 L 170 1210 C 140 1200 100 1230 110 1270 C 130 1330 200 1300 220 1260 L 860 1260 C 880 1300 950 1330 970 1270 C 980 1230 940 1200 910 1210 L 910 1150 C 940 1160 980 1150 990 1110 C 1010 1040 930 1020 890 1060 Z" fill="url(#vid-hueso)" stroke="#6A5A44" strokeWidth={5} />
          <rect x={190} y={1085} width={700} height={145} rx={34} fill="url(#vid-medula)" stroke="#4A0A1C" strokeWidth={5} />
          {med.map((m, i) => {
            const p = (t * 80 + m.off * 3.2) % 260;
            const y = 1170 - p;
            return <GlobuloRojo key={i} x={m.x + Math.sin(p * 0.03 + m.ph) * 14} y={y} r={y > 1090 ? 12 : 15} rot={m.ph + t * m.w} tilt={t * 2 + m.ph} grad={gid("vid-g", 1)} opacidad={clamp((1170 - y) / 20) * clamp((y - 900) / 60) * (y > 1090 ? 0.6 : 1)} />;
          })}
          <text x={540} y={1172} textAnchor="middle" fontFamily={MONOF} fontWeight={800} fontSize={30} fill="#fff" opacity={0.92} style={{ paintOrder: "stroke" }} stroke="rgba(30,0,10,0.7)" strokeWidth={6}>MÉDULA ÓSEA</text>
        </g>
      </svg>
      <Lectura x={540} y={850} ancho={880} alinear="center" titulo="VUELTAS EN SU VIDA" valor={fmt(cuenta)} sub="≈ 120 días × 1.440 min ÷ 1 min por vuelta" px={118} color={SA.oro} opacidad={clamp(tau / 0.4) * (1 - km)} id="vida-vueltas" colorTitulo={SA.hielo} />
      <Lectura x={540} y={1332} ancho={880} alinear="center" valor="≈ 2–3 millones por segundo" px={46} color="#fff" opacidad={km} id="vida-medula" />
      <RelojViaje seg={clamp(t / a(D.vueltas)) * 60} />
      <Frases frases={[{ t: 0.2, texto: "UN GLÓBULO VIVE\n≈ 120 DÍAS", px: 92 }, { t: D.medula, texto: "LA MÉDULA LOS\nREPONE", px: 96, color: SA.clara }, { t: D.fin, texto: "Y LA GOTA\nSIGUE SU VUELTA", px: 96, color: SA.oro }]} y={450} x={104} id="titular-san-vida" />
      <Fuente texto="Vida del glóbulo rojo ≈ 120 días; 172.800 vueltas = cálculo propio (1 vuelta ≈ 1 min en reposo). Producción de la médula: estimación de la fisiología (≈ 2–3 millones/s)." y={1500} delay={D.medula} />
      <Cap e={e} />
    </Fondo>
  );
};
