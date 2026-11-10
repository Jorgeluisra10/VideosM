/**
 * «El viaje de la luz» (IMNOBA · POV) · escenas 2/2
 *   cen-transmision  un transformador sube el voltaje y la energía vuela por las torres de alta tensión
 *   cen-barrio       otro transformador baja el voltaje a 120 V y la energía llega a tu casa y a tu medidor
 *   cen-balance      la electricidad casi no se guarda: producción y consumo se igualan cada segundo (60 Hz)
 *   cen-enchufe      llega al enchufe y la luz se enciende: un viaje de un instante
 */
import React from "react";
import { CEN, TCE, frecuenciaRed } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { azar } from "../../lib/anim";
import { H, W, clamp, easeInOut, easeOut, lerp, spr, useReloj } from "../comun";
import { FONT, Frases, MONOF, RE } from "./real-kit";
import { Fuente } from "./real1";
import { Chip } from "./med1";
import { CE, Casa, Enchufe, FondoPOV, Lampara, MedidorLuz, Paquete, Poste, TorresPOV, Transformador, golpe } from "./cen-kit";

type P = { e: EscenaViralGuardada };
const rp = (t: number, a: (x: number) => number, ini: number, dur: number): number => clamp((t - a(ini)) / a(dur));

/* ───────────── cen-transmision ───────────── */

export const CenTransmision: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const T = TCE.transmision;
  const s = spr(f, a(T.trafo), { damping: 14, stiffness: 120, mass: 0.8 });
  const sube = easeOut((t - a(T.sube)) / a(0.5));
  const vuelo = easeInOut((t - a(T.torres)) / a(0.6));
  const fase2 = vuelo > 0.02;
  const g = golpe(t, a(T.sube), 1.12, 0.4);
  const p = Math.max(0, t - a(T.torres)) * 1.1;
  return (
    <FondoPOV cy={820} vel={fase2 ? 4 : 1.2} color={fase2 ? CE.oro : CE.cian}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        {!fase2 && (
          <g transform={`translate(${g.dx} ${g.dy})`} opacity={clamp(s * 2)}>
            <g transform={`translate(540 1000) scale(${0.95 * g.s}) translate(-540 -1000)`}><Transformador x={540} y={1000} sube t={t} carga={sube} /></g>
          </g>
        )}
        {fase2 && (
          <g opacity={vuelo}>
            <TorresPOV cx={540} cy={800} p={p} t={t} />
            <Paquete x={540} y={1300} r={36} t={t} dir={-90} estela={10} />
          </g>
        )}
      </svg>
      {sube > 0.01 && !fase2 && <div data-texto="cen-kv" style={{ position: "absolute", left: 120, top: 560, width: 840, textAlign: "center", fontFamily: FONT, fontWeight: 900, fontSize: 70, color: RE.oro, opacity: sube }}>↑ voltaje ↑</div>}
      <Frases frases={[{ t: 0.02, texto: "sube el voltaje", px: 88 }, { t: T.chip, texto: "cientos de miles de voltios", color: RE.oro, px: 58 }, { t: T.torres, texto: "vuela por las torres", color: CE.cian, px: 78 }]} y={352} ancho={860} />
      <Chip texto="menos pérdidas en el viaje" x={W / 2} y={1520} color={RE.hielo} id="cen-perd" ancho={620} opacidad={rp(t, a, T.chip2, 0.4)} />
      <Fuente texto="A mayor voltaje, menor corriente para la misma potencia y menos pérdidas en los cables · esquema" delay={0.8} />
    </FondoPOV>
  );
};

/* ───────────── cen-barrio ───────────── */

export const CenBarrio: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const T = TCE.barrio;
  const s = spr(f, a(T.poste), { damping: 14, stiffness: 120, mass: 0.8 });
  const baja = rp(t, a, T.baja, 0.5);
  const casa = rp(t, a, T.casa, 0.6);
  const med = easeInOut((t - a(T.medidor)) / a(0.6));
  const g = golpe(t, a(T.baja), 1.08, 0.4);
  const alambre = (u: number) => ({ x: lerp(300, 760, u), y: 700 + Math.sin(u * Math.PI) * 70 + u * 280 });
  return (
    <FondoPOV cy={1000} vel={1.0 + 2 * casa}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g opacity={(1 - med) * clamp(s * 2)} transform={`translate(${g.dx} ${g.dy})`}>
          <Poste x={250} y={1300} s={1.15} t={t} />
          <Casa x={780} y={1300} s={1.05} luz={casa * 0.9} />
          <path d="M 300 780 Q 540 760 740 1010" fill="none" stroke="#1B2433" strokeWidth={7} />
          {Array.from({ length: 4 }, (_, i) => { const u = (t * 0.5 + i / 4) % 1; const x = lerp(300, 740, u), y = lerp(780, 1010, u) + Math.sin(u * Math.PI) * -30; return <circle key={i} cx={x} cy={y} r={10} fill={CE.oro} opacity={baja > 0.1 ? 0.95 : 0} />; })}
        </g>
        {med > 0.01 && <g opacity={med} transform={`translate(540 ${960 + (1 - med) * 80}) scale(${0.7 + 0.3 * med}) translate(-540 -960)`}><MedidorLuz x={540} y={960} r={230} t={t} vel={1.2} /></g>}
      </svg>
      <Frases frases={[{ t: 0.02, texto: "en tu barrio", px: 88 }, { t: T.baja, texto: "baja a 120 V", color: RE.oro, px: 92 }, { t: T.medidor - 0.2, texto: "pasa por tu medidor", color: CE.cian, px: 66 }]} y={352} ancho={860} />
      <Chip texto={`${CEN.voltiosCasa} V · ${CEN.hz} Hz en tu casa`} x={W / 2} y={1520} color={RE.oro} id="cen-120" ancho={600} opacidad={rp(t, a, T.chip, 0.4)} />
      <Fuente texto="Valores típicos de una vivienda en Colombia: 120 V y 60 Hz · esquema simplificado" delay={0.8} />
    </FondoPOV>
  );
};

/* ───────────── cen-balance ───────────── */

export const CenBalance: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const T = TCE.balance;
  const s = spr(f, a(T.barras), { damping: 14, stiffness: 120, mass: 0.8 });
  const dem = 0.62 + 0.18 * Math.sin(t * 1.4) + 0.08 * Math.sin(t * 3.1);
  const prod = dem + 0.012 * Math.sin(t * 8);
  const casas = rp(t, a, T.casas, 1.6);
  const hz = frecuenciaRed(0, t);
  const ang = -90 + (hz - 60) * 90;
  const COLS = 14, FILAS = 9;
  const BX = 160, BW = 760;
  return (
    <FondoPOV cy={1000} vel={0.8} color={CE.cian}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g opacity={clamp(s * 2)}>
          {[{ y: 520, v: prod, c: CE.oro }, { y: 620, v: dem, c: CE.cian }].map((b, i) => (
            <g key={i}>
              <rect x={BX} y={b.y} width={BW} height={54} rx={12} fill="#0B1430" stroke="#3C5F87" strokeWidth={3} />
              <rect x={BX + 6} y={b.y + 6} width={(BW - 12) * clamp(b.v)} height={42} rx={8} fill={b.c} />
            </g>
          ))}
        </g>
        {/* ciudad */}
        {Array.from({ length: COLS * FILAS }, (_, i) => {
          const c = i % COLS, r = Math.floor(i / COLS);
          const enc = azar(i * 7.3) < casas * (0.75 + 0.25 * Math.sin(t * 2 + i));
          return <rect key={i} x={160 + c * 56} y={780 + r * 44} width={42} height={32} rx={4} fill={enc ? "#FFE27A" : "#16233D"} opacity={enc ? 0.95 : 0.8} />;
        })}
        {/* medidor de frecuencia */}
        {rp(t, a, T.hz, 0.5) > 0.01 && (
          <g opacity={rp(t, a, T.hz, 0.5)} transform="translate(540 1470)">
            <path d="M -200 0 A 200 200 0 0 1 200 0" fill="none" stroke="#3C5F87" strokeWidth={14} strokeLinecap="round" />
            <path d="M -40 -196 A 200 200 0 0 1 40 -196" fill="none" stroke={"#3DDC84"} strokeWidth={14} strokeLinecap="round" />
            <line x1={0} y1={0} x2={Math.cos((ang * Math.PI) / 180) * 180} y2={Math.sin((ang * Math.PI) / 180) * 180} stroke={CE.oro} strokeWidth={8} strokeLinecap="round" />
            <circle r={14} fill="#fff" />
          </g>
        )}
      </svg>
      <div data-texto="cen-lp" style={{ position: "absolute", left: BX, top: 470, fontFamily: MONOF, fontWeight: 700, fontSize: 26, color: CE.oro, opacity: clamp(s * 2) }}>producción</div>
      <div data-texto="cen-lc" style={{ position: "absolute", left: BX, top: 690, fontFamily: MONOF, fontWeight: 700, fontSize: 26, color: CE.cian, opacity: clamp(s * 2) }}>consumo</div>
      <div data-texto="cen-hz" style={{ position: "absolute", left: 540 - 220, top: 1488, width: 440, textAlign: "center", fontFamily: FONT, fontWeight: 900, fontSize: 64, color: RE.blanco, opacity: rp(t, a, T.hz, 0.5) }}>{`${hz.toFixed(2).replace(".", ",")} Hz`}</div>
      <Frases frases={[{ t: 0.02, texto: "casi no se guarda", px: 84 }, { t: T.casas, texto: "millones de casas", color: "#FFE27A", px: 80 }, { t: T.chip - 0.3, texto: "se iguala cada segundo", color: RE.oro, px: 64 }]} y={352} ancho={860} />
      <Chip texto="producción = consumo" x={W / 2} y={1170} color={RE.oro} id="cen-igual" ancho={540} opacidad={rp(t, a, T.chip2, 0.4)} />
      <Fuente texto="La red necesita equilibrar producción y consumo en todo momento; el almacenamiento a gran escala es limitado · esquema" delay={0.8} />
    </FondoPOV>
  );
};

/* ───────────── cen-enchufe ───────────── */

export const CenEnchufe: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const T = TCE.enchufe;
  const s = spr(f, a(T.enchufe), { damping: 14, stiffness: 120, mass: 0.8 });
  const llega = easeInOut((t - a(T.llega)) / a(T.mete - T.llega));
  const luz = easeOut((t - a(T.luz)) / a(0.3));
  const g = golpe(t, a(T.luz), 1.16, 0.5);
  const SX = 540 - 52 * 1.3, SY = 1290 - 15 * 1.3;
  const px = lerp(1000, SX, llega), py = lerp(700, SY, llega);
  return (
    <FondoPOV cy={1000} vel={0.6 + 4 * (1 - llega)} color={CE.oro}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g transform={`translate(${g.dx} ${g.dy})`}>
          <g opacity={clamp(s * 2)}><Enchufe x={540} y={1290} s={1.3} luz={luz} /></g>
          <Lampara x={540} y={780} s={0.8} on={luz} t={t} />
          {t < a(T.mete) + 0.05 && <Paquete x={px} y={py} r={30} t={t} dir={Math.atan2(SY - py, SX - px) * 180 / Math.PI} estela={12} />}
        </g>
      </svg>
      {luz > 0.01 && luz < 0.9 && <div style={{ position: "absolute", inset: 0, background: "#FFF4C2", opacity: (1 - luz) * 0.5 }} />}
      <Frases frases={[{ t: 0.02, texto: "y llega al enchufe", px: 80 }, { t: T.luz, texto: "¡luz!", color: RE.oro, px: 130 }]} y={352} ancho={860} />
      <Chip texto="un viaje de un instante" x={W / 2} y={1590} color={RE.oro} id="cen-instante" ancho={560} opacidad={rp(t, a, T.chip, 0.4)} />
      <Fuente texto="De la central al enchufe: generación, transformación, transmisión, distribución y consumo · esquema" delay={0.8} />
    </FondoPOV>
  );
};
