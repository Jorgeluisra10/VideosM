/**
 * «Tu cerebro se lava mientras duermes» (SINAPSIS · sin voz) · escenas 2/2
 *   glf-sueno   despierto → dormido: las células se encogen y el espacio entre ellas crece ≈ 60 % (ratones)
 *   glf-doble   dos recipientes: dormido se elimina el β-amiloide ≈ 2 veces más rápido (ratones)
 *   glf-humano  en adultos dormidos: ondas lentas del EEG y olas de líquido de ≈ 20 s (resonancia)
 *   glf-vela    una noche sin dormir: el β-amiloide sube (PET) · y la cautela honesta
 */
import React from "react";
import { GLF, TGL, mulberry32 } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeInOut, easeOut, lerp, mezclar, spr, useReloj } from "../comun";
import { Estudio, Frases, MONOF, RE } from "./real-kit";
import { Dato, Fuente } from "./real1";
import { Chip } from "./med1";
import { Cerebro, GL, Residuos, motitasCerebro } from "./glf-kit";

type P = { e: EscenaViralGuardada };

/* ───────────── glf-sueno ───────────── */

const CEL = (() => {
  const out: { x: number; y: number; fase: number }[] = [];
  const dx = 150, dy = 130;
  for (let fila = 0; fila < 5; fila++) {
    for (let col = 0; col < 5; col++) out.push({ x: 540 + (col - 2) * dx + (fila % 2 ? dx / 2 : 0) - dx / 4, y: 905 + (fila - 2) * dy, fase: (col * 7 + fila * 3) % 6 });
  }
  return out;
})();

export const GlfSueno: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const S = TGL.sueno;
  const ent = spr(f, a(S.celulas), { damping: 15, stiffness: 100, mass: 0.9 });
  const dormido = easeInOut((t - a(S.ensancha)) / a(S.ensanchaDur));
  const knob = spr(f, a(S.interruptor), { damping: 14, stiffness: 160, mass: 0.6 });
  const valor = Math.round(GLF.espacioMas * easeOut((t - a(S.cifra)) / a(S.cifraDur)));
  const mot = motitasCerebro(0, 1);
  void mot;
  const r0 = 66, r1 = 52;
  const rad = lerp(r0, r1, dormido);
  return (
    <Estudio piso={1560} resplandor={0.35}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        {/* el líquido que llena los espacios */}
        <rect x={110} y={560} width={860} height={690} rx={40} fill={mezclar("#150F26", "#0E3550", dormido * 0.8)} stroke={RE.hielo} strokeOpacity={0.2} strokeWidth={2} />
        <rect x={110} y={560} width={860} height={690} rx={40} fill={GL.lcr} opacity={0.08 + 0.2 * dormido} />
        {CEL.map((c, i) => {
          const resp = 1 + 0.012 * Math.sin(t * 1.8 + c.fase);
          const rr = rad * resp * ent;
          return (
            <g key={i} transform={`translate(${c.x} ${c.y})`}>
              <ellipse rx={rr * 1.1} ry={rr} fill={mezclar("#3A2A66", "#6A52B8", 0.4)} stroke="#9B86E8" strokeWidth={2.4} />
              <ellipse cx={-rr * 0.28} cy={-rr * 0.34} rx={rr * 0.36} ry={rr * 0.2} fill="#fff" opacity={0.28} transform={`rotate(-24 ${-rr * 0.28} ${-rr * 0.34})`} />
              <circle cx={rr * 0.1} cy={rr * 0.08} r={rr * 0.3} fill="#1F1540" stroke="#7C68D8" strokeWidth={1.6} />
            </g>
          );
        })}
        {/* residuos entre las células: salen con el líquido al dormir */}
        {Array.from({ length: 18 }, (_, i) => {
          const r = mulberry32(i + 70);
          const x0 = 170 + r() * 740, y0 = 610 + r() * 590;
          const salida = easeOut(clamp((dormido - 0.2) * 1.2 - r() * 0.4));
          return <g key={i} transform={`translate(${lerp(x0, x0 + 190, salida)} ${y0 - 24 * salida})`} opacity={(1 - salida) * ent}><circle r={13} fill={GL.ambar} opacity={0.18} /><circle r={5.5} fill={GL.ambarClaro} stroke={GL.ambar} strokeWidth={1.4} /></g>;
        })}
        {/* interruptor despierto / dormido */}
        <g transform="translate(300 1330) scale(0.8)" opacity={ent}>
          <rect x={-150} y={-38} width={300} height={76} rx={38} fill={mezclar("#2A3550", "#0E5F86", knob)} stroke={RE.hielo} strokeOpacity={0.5} strokeWidth={3} />
          <circle cx={lerp(-112, 112, knob)} cy={0} r={31} fill={mezclar("#FFE58A", "#BDEBFF", knob)} stroke="#fff" strokeOpacity={0.6} strokeWidth={2} />
          <circle cx={lerp(-112, 112, knob) - 9} cy={-9} r={8} fill="#fff" opacity={0.5} />
        </g>
      </svg>
      <Frases frases={[{ t: 0.2, texto: "al dormir,", px: 100 }, { t: 2.0, texto: "el espacio\nse abre", color: GL.lcr, px: 108 }]} y={390} id="glf-sueno-t" />
      <Chip texto={dormido < 0.5 ? "DESPIERTO" : "DORMIDO"} x={300} y={1410} color={dormido < 0.5 ? RE.oro : GL.lcrClaro} opacidad={ent} ancho={300} id="glf-sueno-estado" />
      <Dato valor={valor} x={740} y={1335} px={104} digitos={2} prefijo="+" sufijo=" %" color={GL.lcrClaro} etiqueta="más espacio entre células" etiquetaY={1425} opacidad={clamp((t - a(S.cifra - 0.2)) / 0.4)} id="glf-sueno-dato" />
      <Fuente texto={`Xie et al., Science ${GLF.xieAnio} · ratones dormidos o anestesiados · volumen del espacio extracelular`} y={1486} delay={0} />
    </Estudio>
  );
};

/* ───────────── glf-doble ───────────── */

const N_PART = 28;
const PARTS = (() => {
  const r = mulberry32(31);
  return Array.from({ length: N_PART }, (_, i) => ({ x: 20 + r() * 300, y: 30 + r() * 340, rad: 5 + r() * 5, orden: ((i * 11) % N_PART) / N_PART, fase: r() * 6.28 }));
})();

const Caja: React.FC<{ x: number; y: number; titulo: string; color: string; tasa: number; t: number; f: number; limpia: number; ent: number }> = ({ x, y, titulo, color, tasa, t, limpia, ent }) => {
  const prog = clamp(limpia * tasa);
  return (
    <g transform={`translate(${x} ${y})`} opacity={ent}>
      <rect x={0} y={0} width={340} height={400} rx={30} fill="#0C1428" stroke={color} strokeOpacity={0.7} strokeWidth={3} />
      <rect x={6} y={6} width={328} height={80} rx={24} fill="#fff" opacity={0.05} />
      {PARTS.map((p, i) => {
        const sale = clamp((prog - p.orden * 0.95) / 0.05);
        const yy = p.y - sale * 90 + Math.sin(t * 2 + p.fase) * 3;
        return <g key={i} transform={`translate(${p.x} ${yy})`} opacity={1 - sale}><circle r={p.rad * 2.8} fill={GL.ambar} opacity={0.15} /><circle r={p.rad} fill={GL.ambarClaro} stroke={GL.ambar} strokeWidth={1.4} /></g>;
      })}
      {/* el nivel cian sube a medida que se limpia */}
      <rect x={6} y={394 - 80 * prog} width={328} height={80 * prog} rx={4} fill={GL.lcr} opacity={0.15 + 0.15 * prog} />
    </g>
  );
};

export const GlfDoble: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const D = TGL.doble;
  const ent = spr(f, a(D.cajas), { damping: 15, stiffness: 110, mass: 0.8 });
  const limpia = easeInOut((t - a(D.limpia)) / a(D.limpiaDur)) * 0.5;
  const dos = spr(f, a(D.dos), { damping: 9, stiffness: 190, mass: 0.7 });
  return (
    <Estudio piso={1560} resplandor={0.35}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Caja x={100} y={700} titulo="DESPIERTO" color={RE.oro} tasa={1} t={t} f={f} limpia={limpia} ent={ent} />
        <Caja x={640} y={700} titulo="DORMIDO" color={GL.lcr} tasa={2} t={t} f={f} limpia={limpia} ent={ent} />
        <g opacity={ent}>
          <text x={270} y={666} textAnchor="middle" fontFamily={MONOF} fontWeight={700} fontSize={32} fill={RE.oro}>DESPIERTO</text>
          <text x={810} y={666} textAnchor="middle" fontFamily={MONOF} fontWeight={700} fontSize={32} fill={GL.lcrClaro}>DORMIDO</text>
          <text x={540} y={920} textAnchor="middle" fontFamily={MONOF} fontWeight={700} fontSize={30} fill={RE.hielo} opacity={0.7}>vs</text>
        </g>
        <g transform={`translate(540 1250) scale(${dos})`} opacity={clamp(dos * 1.5)}>
          <circle r={96} fill="#06101C" fillOpacity={0.9} stroke={GL.lcr} strokeWidth={5} />
          <text y={34} textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight={900} fontSize={104} fill={GL.lcrClaro}>2×</text>
        </g>
      </svg>
      <Frases frases={[{ t: 0.2, texto: "dormido,", px: 100 }, { t: 1.6, texto: "la basura sale\nel doble de rápido", color: GL.ambarClaro, px: 80 }]} y={400} id="glf-doble-t" />
      <Chip texto="β-amiloide eliminado · ratones" x={W / 2} y={1400} color={GL.ambarClaro} opacidad={dos} ancho={540} id="glf-doble-chip" />
      <Fuente texto={`Xie et al., Science ${GLF.xieAnio} · el β-amiloide se eliminó ≈ 2 veces más rápido en ratones dormidos`} y={1486} delay={0} />
    </Estudio>
  );
};

/* ───────────── glf-humano ───────────── */

const PX_S = 14; // px por segundo en el eje del tiempo
const X0 = 130, ANCHO = 820;

/** Ráfaga de ondas lentas (EEG) que se repite cada 20 s. */
const eeg = (s: number): number => {
  const fase = (((s - 3) % GLF.cicloSeg) + GLF.cicloSeg) % GLF.cicloSeg;
  const env = Math.exp(-Math.pow((fase - 5) / 3.2, 2));
  return (0.18 + 0.82 * env) * (Math.sin(s * 5.4) * 0.8 + Math.sin(s * 9.1 + 1) * 0.3);
};
/** Ola de líquido: periodo de 20 s, con retraso tras las ondas lentas. */
const lcr = (s: number): number => Math.sin(((s - 8) / GLF.cicloSeg) * Math.PI * 2);

export const GlfHumano: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const H_ = TGL.humano;
  const ent = spr(f, a(H_.panel), { damping: 15, stiffness: 110, mass: 0.8 });
  const rev = clamp((t - a(H_.eeg)) / a(H_.eegDur));
  const revL = clamp((t - a(H_.lcr)) / a(H_.eegDur));
  const sMax = ANCHO / PX_S;
  const trazoEeg = Array.from({ length: 330 }, (_, i) => {
    const s = (i / 329) * sMax * rev;
    return `${i ? "L" : "M"} ${X0 + s * PX_S} ${790 - 92 * eeg(s)}`;
  }).join(" ");
  const trazoLcr = Array.from({ length: 200 }, (_, i) => {
    const s = (i / 199) * sMax * revL;
    return `${i ? "L" : "M"} ${X0 + s * PX_S} ${1115 - 90 * lcr(s)}`;
  }).join(" ");
  const cursor = X0 + sMax * PX_S * rev;
  const sActual = sMax * revL;
  const pulso = revL > 0 ? 0.5 + 0.5 * lcr(sActual) : 0;
  return (
    <Estudio piso={1560} resplandor={0.35}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g opacity={ent}>
          <rect x={100} y={600} width={880} height={300} rx={28} fill="#08101E" stroke={GL.neurona} strokeOpacity={0.55} strokeWidth={2.5} />
          <rect x={100} y={930} width={880} height={300} rx={28} fill="#08101E" stroke={GL.lcr} strokeOpacity={0.6} strokeWidth={2.5} />
          {[0, 1, 2, 3, 4, 5].map((i) => <line key={i} x1={X0 + i * 20 * PX_S * 0.5} y1={620} x2={X0 + i * 20 * PX_S * 0.5} y2={1210} stroke={RE.hielo} strokeOpacity={0.08} />)}
          <text x={124} y={640} fontFamily={MONOF} fontWeight={700} fontSize={26} fill={GL.neurona}>EEG · ondas lentas</text>
          <text x={124} y={970} fontFamily={MONOF} fontWeight={700} fontSize={26} fill={GL.lcr}>líquido cefalorraquídeo</text>
        </g>
        <path d={trazoEeg} fill="none" stroke={GL.neurona} strokeWidth={4} strokeLinejoin="round" />
        <path d={trazoLcr} fill="none" stroke={GL.lcr} strokeWidth={5} strokeLinecap="round" />
        {rev > 0 && rev < 1 && <line x1={cursor} y1={612} x2={cursor} y2={1218} stroke="#fff" strokeOpacity={0.35} strokeWidth={2} />}
        {/* cuarto ventrículo que late con el líquido */}
        <g transform="translate(870 1310)" opacity={ent}>
          <ellipse rx={90} ry={60} fill={GL.lcr} opacity={0.12 + 0.18 * pulso} />
          <path d={`M 0 -${34 + 8 * pulso} C 26 -10 26 10 0 ${34 + 8 * pulso} C -26 10 -26 -10 0 -${34 + 8 * pulso} Z`} fill={GL.lcr} opacity={0.5 + 0.4 * pulso} stroke={GL.lcrClaro} strokeWidth={2.5} />
        </g>
      </svg>
      <Frases frases={[{ t: 0.2, texto: "¿y en\nhumanos?", px: 100 }, { t: 1.7, texto: "olas de\nlíquido", color: GL.lcr, px: 100 }]} y={400} id="glf-hum-t" />
      <div data-texto="glf-hum-ciclo" style={{ position: "absolute", left: 124, top: 1290, fontFamily: MONOF, fontWeight: 700, fontSize: 30, color: GL.lcrClaro, opacity: clamp((t - a(H_.chip - 0.4)) / 0.4) }}>1 ola ≈ {GLF.cicloSeg} s</div>
      <Chip texto="sueño profundo (NREM)" x={430} y={1400} color={RE.hielo} opacidad={ent} ancho={420} id="glf-hum-chip" />
      <Fuente texto={`Fultz et al., Science ${GLF.fultzAnio} · adultos dormidos en resonancia magnética (fMRI + EEG) · trazos esquemáticos`} y={1486} delay={0} />
    </Estudio>
  );
};

/* ───────────── glf-vela ───────────── */

export const GlfVela: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const V = TGL.vela;
  const horas = Math.round(24 * easeOut((t - a(V.reloj)) / a(V.relojDur)));
  const frac = horas / 24;
  const sube = clamp((t - a(V.sube)) / a(2.6));
  const mot = motitasCerebro(46, 9);
  const caut = spr(f, a(V.caution), { damping: 13, stiffness: 150, mass: 0.7 });
  const R = 112, C = 2 * Math.PI * R;
  return (
    <Estudio piso={1560} resplandor={0.35}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        {/* anillo de 24 h */}
        <g transform="translate(320 880)">
          <circle r={R} fill="#06101C" fillOpacity={0.85} stroke={RE.hielo} strokeOpacity={0.2} strokeWidth={16} />
          <circle r={R} fill="none" stroke={GL.ambar} strokeWidth={16} strokeLinecap="round" strokeDasharray={`${C * frac} ${C}`} transform="rotate(-90)" />
          <text y={18} textAnchor="middle" fontFamily={MONOF} fontWeight={700} fontSize={64} fill={RE.blanco}>{String(horas).padStart(2, "0")}h</text>
          <text y={150} textAnchor="middle" fontFamily={MONOF} fontWeight={700} fontSize={24} fill={RE.hielo} opacity={0.8}>sin dormir</text>
        </g>
        {/* cerebro con residuos que aumentan */}
        <Cerebro x={730} y={880} s={0.95} luz={0.2} sucio={0.2 + 0.7 * sube}>
          <Residuos motitas={mot} t={t} visibles={0.25 + 0.75 * sube} />
        </Cerebro>
      </svg>
      <Frases frases={[{ t: 0.2, texto: "una noche\nen vela", px: 104 }, { t: 2.2, texto: "y la basura\nsube", color: GL.ambar, px: 100 }]} y={400} id="glf-vela-t" />
      <Chip texto="β-amiloide ↑ (hipocampo y tálamo)" x={W / 2} y={1240} color={GL.ambarClaro} opacidad={sube} ancho={680} id="glf-vela-chip" />
      <div data-texto="glf-vela-caut" style={{ position: "absolute", left: 120, width: W - 240, top: 1330, textAlign: "center", fontFamily: MONOF, fontWeight: 700, fontSize: 28, lineHeight: 1.35, color: RE.hielo, opacity: caut, transform: `translateY(${(1 - caut) * 16}px)` }}>
        el sistema glinfático aún se estudia · esto no es un diagnóstico
      </div>
      <Fuente texto={`Shokri-Kojori et al., PNAS ${GLF.shokriAnio} · PET en adultos sanos tras una noche sin dormir`} y={1486} delay={1} />
    </Estudio>
  );
};
