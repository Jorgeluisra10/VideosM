/**
 * «Los 3 códigos escondidos en tu vehículo» (IMNOBA · figuras realistas) · escenas 2/2
 *   aut-edad    las llantas vencen: se grietan con los años (muchos fabricantes: cambiarlas entre 6 y 10 años, aunque tengan dibujo)
 *   aut-vin     el VIN: su décimo carácter es el año modelo (T = 2026)
 *   aut-repaso  dónde se ve el VIN (parabrisas y tarjeta de propiedad) y repaso de los tres códigos
 */
import React from "react";
import { AUT, TAT, vinAnioModelo } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeInOut, easeOut, lerp, spr, useReloj } from "../comun";
import { Estudio, FONT, Frases, MONOF, RE } from "./real-kit";
import { Fuente } from "./real1";
import { Chip } from "./med1";
import { AU, Llanta, Parabrisas, PlacaVIN, Tarjeta } from "./aut-kit";

type P = { e: EscenaViralGuardada };
const rp = (t: number, a: (x: number) => number, ini: number, dur: number): number => clamp((t - a(ini)) / a(dur));

/* ───────────── aut-edad ───────────── */

export const AutEdad: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const T = TAT.edad;
  const s = spr(f, 0, { damping: 15, stiffness: 120, mass: 0.8 });
  const k = easeInOut((t - a(T.env)) / a(T.envDur));
  const anios = k * AUT.llantaAniosMax;
  const X0 = 140, X1 = 940, BY = 1290;
  const xm = lerp(X0, X1, k);
  const x6 = lerp(X0, X1, AUT.llantaAniosMin / AUT.llantaAniosMax);
  return (
    <Estudio piso={1500} resplandor={0.45}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g opacity={clamp(s * 2)}><Llanta x={540} y={860} R={310} env={k} luz={0} fecha={AUT.dotEjemplo} /></g>
        {/* línea de tiempo de 0 a 10 años */}
        <rect x={X0} y={BY} width={X1 - X0} height={16} rx={8} fill="#22344D" />
        <rect x={X0} y={BY} width={Math.max(0, xm - X0)} height={16} rx={8} fill={k > 0.99 ? AU.rojo : k * AUT.llantaAniosMax >= AUT.llantaAniosMin ? "#FF9A3D" : AU.verde} />
        {[0, AUT.llantaAniosMin, AUT.llantaAniosMax].map((n) => <line key={n} x1={lerp(X0, X1, n / AUT.llantaAniosMax)} y1={BY - 20} x2={lerp(X0, X1, n / AUT.llantaAniosMax)} y2={BY + 36} stroke="#E6EEF7" strokeWidth={4} />)}
        <circle cx={xm} cy={BY + 8} r={18} fill="#fff" stroke={AU.oro} strokeWidth={6} />
        <line x1={x6} y1={BY - 20} x2={x6} y2={BY + 36} stroke={AU.oro} strokeWidth={6} opacity={rp(t, a, T.seis, 0.3)} />
      </svg>
      <Frases frases={[{ t: 0.02, texto: "las llantas vencen", px: 80 }, { t: T.seis, texto: "6 a 10 años", color: RE.oro, px: 92 }, { t: T.diez, texto: "aunque tengan dibujo", color: RE.hielo, px: 62 }]} y={352} ancho={860} />
      <div data-texto="aut-anios" style={{ position: "absolute", left: 140, top: 1360, width: 800, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 56, color: RE.blanco }}>{`${anios.toFixed(1).replace(".", ",")} años`}</div>
      <Chip texto="la edad importa" x={W / 2} y={1500} color={RE.oro} id="aut-edad" ancho={520} opacidad={rp(t, a, T.chip, 0.4)} />
      <Fuente texto="Muchos fabricantes recomiendan cambiarlas entre los 6 y los 10 años, sin importar el dibujo · revisa tu manual" delay={0.8} />
    </Estudio>
  );
};

/* ───────────── aut-vin ───────────── */

const VIN = "XXXXXXXXXTXXXXXXX";

export const AutVin: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const T = TAT.vin;
  const k = rp(t, a, T.placa, T.placaDur);
  const res = rp(t, a, T.resalta, 0.5);
  const tabla = rp(t, a, T.tabla, 0.5);
  const sT = spr(f, a(T.resalta), { damping: 11, stiffness: 160, mass: 0.7 });
  const anio = vinAnioModelo(VIN[AUT.vinPosAnio - 1]);
  const filas = ["R", "S", "T", "V"];
  return (
    <Estudio piso={1500} resplandor={0.5}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <PlacaVIN x={540} y={760} chars={VIN} resalta={res} k={k} />
        {/* conexión de la casilla 10 a la letra grande */}
        {res > 0.01 && <polyline points="590,830 330,990" fill="none" stroke={AU.oro} strokeWidth={4} strokeDasharray="10 10" opacity={0.7 * res} />}
        {res > 0.01 && (
          <g opacity={clamp(res * 2)} transform={`translate(330 1130) scale(${0.7 + 0.3 * sT})`}>
            <polygon points="-120,-70 0,-130 120,-70 120,70 0,130 -120,70" fill={AU.oro} stroke="#FFF6C9" strokeWidth={6} />
            <text x={0} y={52} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={150} fill="#2A1A00">T</text>
          </g>
        )}
      </svg>
      <Frases frases={[{ t: 0.02, texto: "tercero: el VIN", px: 84 }, { t: 2.0, texto: "décimo carácter", color: RE.hielo, px: 80 }, { t: 4.0, texto: `T = ${anio}`, color: RE.oro, px: 100 }]} y={352} ancho={860} />
      <div data-texto="aut-t2026" style={{ position: "absolute", left: 490, top: 1130, transform: "translateY(-50%)", fontFamily: FONT, fontWeight: 900, fontSize: 108, color: RE.oro, opacity: clamp(res * 2), whiteSpace: "nowrap" }}>{`= ${anio}`}</div>
      <div data-texto="aut-tabla" style={{ position: "absolute", left: 120, top: 1380, width: 840, display: "flex", justifyContent: "space-between", fontFamily: MONOF, fontWeight: 800, fontSize: 34, opacity: tabla }}>
        {filas.map((c) => <div key={c} style={{ padding: "10px 18px", borderRadius: 14, border: `2px solid ${c === "T" ? RE.oro : "#3C4F6B"}`, background: c === "T" ? "rgba(255,197,0,0.18)" : "rgba(8,18,31,0.7)", color: c === "T" ? RE.oro : RE.hielo }}>{`${c} · ${vinAnioModelo(c)}`}</div>)}
      </div>
      <Chip texto="año modelo, no fecha de fabricación" x={W / 2} y={1520} color={RE.hielo} id="aut-modelo" ancho={780} opacidad={rp(t, a, T.chip, 0.4)} />
      <Fuente texto="10.º carácter del VIN = año modelo en la mayoría de vehículos · el ciclo se repite cada 30 años (S = 1995 o 2025)" delay={0.8} />
    </Estudio>
  );
};

/* ───────────── aut-repaso ───────────── */

export const AutRepaso: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const T = TAT.repaso;
  const s1 = spr(f, a(T.parabrisas), { damping: 15, stiffness: 120, mass: 0.8 });
  const s2 = spr(f, a(T.tarjeta), { damping: 15, stiffness: 120, mass: 0.8 });
  const l1 = rp(t, a, T.parabrisas + 0.5, 0.5), l2 = rp(t, a, T.tarjeta + 0.4, 0.5);
  return (
    <Estudio piso={1500} resplandor={0.45}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g opacity={clamp(s1 * 2)} transform={`translate(0 ${(1 - s1) * 80})`}><Parabrisas x={110} y={470} w={860} h={380} luz={l1} t={t} /></g>
        <g opacity={clamp(s2 * 2)} transform={`translate(0 ${(1 - s2) * 80})`}><Tarjeta x={110} y={930} luz={l2} /></g>
      </svg>
      <Frases frases={[{ t: 0.02, texto: "dónde mirar", px: 84 }, { t: 0.6, texto: "el parabrisas", color: RE.oro, px: 84 }, { t: T.tarjeta, texto: "la tarjeta", color: RE.hielo, px: 84 }, { t: 4.0, texto: "revísalo antes de comprar", color: RE.oro, px: 62 }]} y={352} ancho={860} />
      <Chip texto="1 · la flecha" x={W / 2} y={1420} color={RE.hielo} id="aut-c1" ancho={440} opacidad={rp(t, a, T.c1, 0.4)} />
      <Chip texto="2 · el DOT" x={W / 2} y={1490} color={AU.oro} id="aut-c2" ancho={380} opacidad={rp(t, a, T.c2, 0.4)} />
      <Chip texto="3 · el VIN" x={W / 2} y={1560} color={AU.verde} id="aut-c3" ancho={380} opacidad={rp(t, a, T.c3, 0.4)} />
      <Fuente texto="El VIN suele verse en la base del parabrisas y en la tarjeta de propiedad · confirma que coincidan" delay={0.8} />
    </Estudio>
  );
};
