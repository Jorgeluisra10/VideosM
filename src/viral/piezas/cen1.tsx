/**
 * «El viaje de la luz» (IMNOBA · POV) · escenas 1/2
 *   cen-gancho   aprietas el interruptor y la luz se enciende; la cámara se mete por el cable y empieza el viaje
 *   cen-fuente   fuego o agua: una caldera que quema combustible y una presa que deja caer el agua
 *   cen-turbina  el vapor o el agua empujan las aspas de una turbina que no deja de girar
 *   cen-generador un imán que gira dentro de bobinas de cobre crea la electricidad
 */
import React from "react";
import { CEN, TCE } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeInOut, easeOut, lerp, spr, useReloj } from "../comun";
import { FONT, Frases, MONOF, RE } from "./real-kit";
import { Fuente } from "./real1";
import { Chip } from "./med1";
import { CE, Caldera, FondoPOV, Generador, Interruptor, Lampara, Onda, Paquete, Presa, Turbina, golpe } from "./cen-kit";

type P = { e: EscenaViralGuardada };
const rp = (t: number, a: (x: number) => number, ini: number, dur: number): number => clamp((t - a(ini)) / a(dur));

/* ───────────── cen-gancho ───────────── */

export const CenGancho: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const T = TCE.gancho;
  const on = easeOut((t - a(T.pulsa)) / a(0.18));
  const luz = easeOut((t - a(T.luz)) / a(0.3));
  const zk = easeInOut((t - a(T.zoom)) / a(T.zoomDur));
  const esc = lerp(1, 9, zk * zk);
  const fase2 = t >= a(T.zoom) + a(T.zoomDur) * 0.7;
  const tunel = rp(t, a, T.tunel, 0.4);
  const g = golpe(t, a(T.luz), 1.1, 0.5);
  const s = spr(f, a(T.interruptor), { damping: 14, stiffness: 120, mass: 0.8 });
  return (
    <FondoPOV cy={1000} vel={fase2 ? 3.4 : 0.5 + 2 * zk} color={fase2 ? CE.oro : CE.cian}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        {!fase2 && (
          <g transform={`translate(${540 + g.dx} ${1000 + g.dy}) scale(${esc * g.s}) translate(-540 -1000)`} opacity={clamp(s * 2) * (1 - clamp((zk - 0.7) * 3))}>
            <Lampara x={540} y={640} s={0.62} on={luz} t={t} />
            <Interruptor x={540} y={1000} s={1.45} on={on} />
          </g>
        )}
        {fase2 && (
          <g opacity={tunel}>
            <Paquete x={540} y={960} r={52} t={t} dir={-90} estela={12} />
          </g>
        )}
      </svg>
      {zk > 0.5 && zk < 0.95 && <div style={{ position: "absolute", inset: 0, background: "#FFF4C2", opacity: (1 - Math.abs(zk - 0.8) / 0.15) * 0.55 }} />}
      <Frases frases={[{ t: 0.02, texto: "aprietas un interruptor", px: 76 }, { t: 2.0, texto: "¿de dónde sale esa energía?", color: RE.oro, px: 62 }, { t: T.tunel, texto: "ven, sígueme", color: CE.cian, px: 96 }]} y={352} ancho={860} />
      <Chip texto="viaje en primera persona" x={W / 2} y={1520} color={RE.hielo} id="cen-pov" ancho={640} opacidad={rp(t, a, T.chip, 0.4)} />
      <Fuente texto="Recorrido simplificado y fuera de escala de la energía eléctrica, de la central al enchufe" delay={0.8} />
    </FondoPOV>
  );
};

/* ───────────── cen-fuente ───────────── */

export const CenFuente: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const T = TCE.fuente;
  const sC = spr(f, a(T.fuego), { damping: 14, stiffness: 120, mass: 0.8 });
  const sP = spr(f, a(T.agua), { damping: 14, stiffness: 120, mass: 0.8 });
  const pk = easeOut((t - a(T.paquete)) / a(0.5));
  const sale = easeInOut((t - a(T.entra)) / a(0.7));
  const g = golpe(t, a(T.paquete), 1.0, 0.1);
  const px = lerp(880, 1300, sale), py = 1010;
  const flujo = (x0: number, y0: number, c: string, off: number) => (
    <g opacity={pk}>
      <path d={`M ${x0} ${y0} Q ${(x0 + 880) / 2 + 40} ${(y0 + py) / 2 + off} 880 ${py}`} fill="none" stroke={c} strokeWidth={6} strokeDasharray="14 12" strokeDashoffset={-t * 120} opacity={0.8} />
    </g>
  );
  return (
    <FondoPOV cy={1000} vel={1.2}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g transform={`translate(${g.dx} ${g.dy})`}>
          <g opacity={clamp(sC * 2)} transform={`translate(0 ${(1 - sC) * 60})`}><Caldera x={270} y={990} s={0.62} t={t} /></g>
          <g opacity={clamp(sP * 2)} transform={`translate(0 ${(1 - sP) * 60})`}><Presa x={470} y={1510} s={0.78} t={t} /></g>
          {flujo(480, 700, "#FFB020", -60)}
          {flujo(620, 1420, "#7FD3FF", 60)}
          {pk > 0.01 && <Paquete x={px} y={py} r={34 * pk} t={t} dir={sale > 0.01 ? 0 : -45} estela={sale > 0.01 ? 12 : 6} />}
        </g>
      </svg>
      <Frases frases={[{ t: 0.02, texto: "todo empieza con", px: 76 }, { t: 0.5, texto: "fuego", color: "#FF8A2E", px: 110 }, { t: T.agua, texto: "o con agua", color: "#7FD3FF", px: 100 }]} y={352} ancho={860} />
      <Chip texto="caldera: quema combustible" x={380} y={1100} color="#FF8A2E" id="cen-cald" ancho={560} opacidad={rp(t, a, T.chip1, 0.4)} />
      <Chip texto="presa: cae el agua" x={W - 400} y={1590} color="#7FD3FF" id="cen-presa" ancho={440} opacidad={rp(t, a, T.chip2, 0.4)} />
      <Fuente texto="Dos formas de mover una turbina: combustible que se quema (térmica) y agua que cae (hidráulica) · esquema" delay={0.8} />
    </FondoPOV>
  );
};

/* ───────────── cen-turbina ───────────── */

export const CenTurbina: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const T = TCE.turbina;
  const s = spr(f, a(T.turbina), { damping: 13, stiffness: 120, mass: 0.8 });
  const v = 120 + 900 * easeInOut((t - a(T.giro)) / a(3.0));
  const ang = (t * v) % 360;
  const rap = rp(t, a, T.rapido, 0.5);
  const orbita = t * 5;
  const g = golpe(t, a(T.turbina), 1.25, 0.6);
  return (
    <FondoPOV cy={950} vel={1.6 + 2 * easeInOut((t - a(T.giro)) / a(3.0))}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g transform={`translate(${540 + g.dx} ${960 + g.dy}) scale(${g.s * (0.8 + 0.2 * easeOut(s))}) translate(-540 -960)`} opacity={clamp(s * 2)}>
          <Turbina x={540} y={960} R={300} ang={ang} chorro="vapor" t={t} />
          {/* desenfoque de giro: aspas fantasma */}
          {rap > 0.01 && <circle cx={540} cy={960} r={300} fill="#BFE0FF" opacity={0.08 * rap} />}
          <Paquete x={540 + Math.cos(orbita) * 150} y={960 + Math.sin(orbita) * 150} r={26} t={t} dir={(orbita * 180) / Math.PI + 90} estela={9} />
        </g>
      </svg>
      <Frases frases={[{ t: 0.02, texto: "empuja las aspas", px: 84 }, { t: T.giro + 0.6, texto: "una turbina gigante", color: RE.oro, px: 74 }, { t: T.rapido - 0.3, texto: "que no para", color: CE.cian, px: 100 }]} y={352} ancho={860} />
      <Chip texto="el movimiento es la clave" x={W / 2} y={1470} color={RE.hielo} id="cen-mov" ancho={620} opacidad={rp(t, a, T.chip, 0.4)} />
      <Fuente texto="Una turbina convierte el empuje del vapor o del agua en giro · esquema, fuera de escala" delay={0.8} />
    </FondoPOV>
  );
};

/* ───────────── cen-generador ───────────── */

export const CenGenerador: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const T = TCE.generador;
  const s = spr(f, a(T.gen), { damping: 14, stiffness: 120, mass: 0.8 });
  const ang = t * 260;
  const bob = rp(t, a, T.bobinas, 0.4);
  const onda = rp(t, a, T.onda, 0.9);
  const g = golpe(t, a(T.bobinas), 1.08, 0.4);
  return (
    <FondoPOV cy={880} vel={1.0} color={CE.oro}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g transform={`translate(${540 + g.dx} ${870 + g.dy}) scale(${g.s}) translate(-540 -870)`} opacity={clamp(s * 2)}>
          <Generador x={540} y={870} R={310} ang={ang} brillo={bob} />
        </g>
        {onda > 0.01 && <Onda x={120} y={1400} w={840} h={50} t={t} k={onda} />}
      </svg>
      <Frases frases={[{ t: 0.02, texto: "un imán gira", px: 90 }, { t: T.bobinas - 0.3, texto: "dentro del cobre", color: "#E09A52", px: 84 }, { t: T.onda, texto: "nace la electricidad", color: CE.oro, px: 70 }]} y={352} ancho={860} />
      <Chip texto="imán en movimiento + cable = corriente" x={W / 2} y={1520} color={RE.oro} id="cen-iman" ancho={780} opacidad={rp(t, a, T.chip, 0.4)} />
      <Fuente texto="Inducción electromagnética (Faraday): un imán que se mueve cerca de una bobina genera corriente alterna · esquema" delay={0.8} />
    </FondoPOV>
  );
};
