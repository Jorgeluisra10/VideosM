/**
 * «La casa que vale menos cada año» (IMNOBA · figuras realistas) · escenas 1/2
 *   jap-gancho   la casa envejece de 0 a 30 años mientras su valor baja y el del terreno se queda
 *   jap-grafico  gráfico: el terreno conserva su valor; la construcción se deprecia (22 años para impuestos)
 *   jap-demole   excavadora demoliendo y barras: edad promedio de las casas demolidas (Japón 32 · EE. UU. 66 · Reino Unido 81)
 */
import React from "react";
import { JAP, TJP, valorContable } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeInOut, easeOut, lerp, spr, useReloj } from "../comun";
import { Estudio, FONT, Frases, MONOF, RE } from "./real-kit";
import { Dato, Fuente } from "./real1";
import { Chip } from "./med1";
import { CasaJ, Escombros, Excavadora, JP, Medidor, Terreno } from "./jap-kit";

type P = { e: EscenaViralGuardada };
const rp = (t: number, a: (x: number) => number, ini: number, dur: number): number => clamp((t - a(ini)) / a(dur));

/* ───────────── jap-gancho ───────────── */

export const JapGancho: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const T = TJP.gancho;
  const s = spr(f, a(T.casa), { damping: 15, stiffness: 110, mass: 0.9 });
  const k = easeInOut((t - a(T.anios)) / a(T.aniosDur));
  const anios = 30 * k;
  const casa = 1 - 0.93 * easeOut(k);
  const tierra = rp(t, a, T.tierra, 0.5);
  return (
    <Estudio piso={1480} resplandor={0.5}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g opacity={clamp(s * 2)} transform={`translate(0 ${(1 - s) * 70})`}>
          <Terreno x={500} y={1150} s={0.95} valor={tierra} t={t} />
          <CasaJ x={540} y={1130} s={1.12} edad={k} luz={0.6 * (1 - k * 0.7)} />
        </g>
        <Medidor x={150} y={1240} alto={320} valor={casa} color={JP.rojo} etiqueta="casa" k={rp(t, a, T.anios, 0.4)} />
        <Medidor x={930} y={1240} alto={320} valor={1} color={JP.cian} etiqueta="terreno" k={rp(t, a, T.anios, 0.4)} />
      </svg>
      <Frases frases={[{ t: 0.02, texto: "en Japón", px: 92 }, { t: 1.2, texto: "casa de 30 años", color: JP.rojo, px: 78 }, { t: T.tierra - 0.3, texto: "el terreno sí vale", color: RE.oro, px: 78 }]} y={352} ancho={860} />
      <Dato valor={anios} x={W / 2} y={1470} px={110} digitos={2} sufijo=" años" id="jap-anios" opacidad={rp(t, a, T.anios, 0.3)} />
      <Fuente texto="Esquema ilustrativo: en Japón la construcción pierde valor con los años y el terreno suele conservarlo" delay={0.8} />
    </Estudio>
  );
};

/* ───────────── jap-grafico ───────────── */

export const JapGrafico: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const T = TJP.grafico;
  const X0 = 160, X1 = 930, Y0 = 1350, Y1 = 620; // ejes
  const px = (an: number): number => lerp(X0, X1, an / 30), py = (v: number): number => lerp(Y0, Y1, v);
  const kC = easeInOut((t - a(T.casa)) / a(T.casaDur));
  const kT = easeOut((t - a(T.tierra)) / a(T.casaDur));
  const an = 30 * kC;
  const ptsC = Array.from({ length: 61 }, (_, i) => (i / 60) * an).map((x) => `${px(x)},${py(valorContable(x))}`).join(" ");
  const ptsT = Array.from({ length: 61 }, (_, i) => (i / 60) * 30 * kT).map((x) => `${px(x)},${py(1 + 0.00 * x)}`).join(" ");
  const m = rp(t, a, T.marca22, 0.5);
  const s = spr(f, a(T.ejes), { damping: 15, stiffness: 120, mass: 0.8 });
  const xm = px(JAP.depreciacionAnios);
  return (
    <Estudio piso={1580} resplandor={0.45}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g opacity={clamp(s * 2)}>
          <rect x={X0 - 40} y={Y1 - 70} width={X1 - X0 + 80} height={Y0 - Y1 + 150} rx={26} fill="#0B1830" opacity={0.75} stroke="#3C5F87" strokeWidth={2} />
          {[0, 0.5, 1].map((v) => <line key={v} x1={X0} y1={py(v)} x2={X1} y2={py(v)} stroke="#6B7C93" strokeOpacity={0.35} strokeDasharray="6 10" />)}
          <line x1={X0} y1={Y0} x2={X1} y2={Y0} stroke="#E6EEF7" strokeWidth={4} /><line x1={X0} y1={Y0} x2={X0} y2={Y1 - 20} stroke="#E6EEF7" strokeWidth={4} />
          {[0, 10, 20, 30].map((n) => <g key={n}><line x1={px(n)} y1={Y0} x2={px(n)} y2={Y0 + 12} stroke="#E6EEF7" strokeWidth={3} /></g>)}
        </g>
        <polyline points={ptsT} fill="none" stroke={JP.cian} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={ptsC} fill="none" stroke={JP.rojo} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
        {kC > 0.01 && <circle cx={px(an)} cy={py(valorContable(an))} r={16} fill="#fff" stroke={JP.rojo} strokeWidth={6} />}
        {m > 0.01 && <g opacity={m}><line x1={xm} y1={Y1 - 20} x2={xm} y2={Y0} stroke={JP.oro} strokeWidth={5} strokeDasharray="12 10" /><circle cx={xm} cy={py(0)} r={14} fill={JP.oro} /></g>}
      </svg>
      {[0, 10, 20, 30].map((n) => <div key={n} data-texto={`jap-x${n}`} style={{ position: "absolute", left: px(n) - 50, top: Y0 + 20, width: 100, textAlign: "center", fontFamily: MONOF, fontWeight: 700, fontSize: 26, color: RE.hielo, opacity: clamp(s * 2) }}>{n}</div>)}
      <div data-texto="jap-xt" style={{ position: "absolute", left: X0, top: Y0 + 62, width: X1 - X0, textAlign: "center", fontFamily: MONOF, fontWeight: 700, fontSize: 24, color: RE.hielo, opacity: clamp(s * 2) * 0.9 }}>años desde que se construye</div>
      <div data-texto="jap-lt" style={{ position: "absolute", left: 250, top: py(1) - 80, fontFamily: FONT, fontWeight: 800, fontSize: 40, color: JP.cian, opacity: clamp(kT * 3) }}>terreno</div>
      <div data-texto="jap-lc" style={{ position: "absolute", left: 560, top: py(0.5) - 40, fontFamily: FONT, fontWeight: 800, fontSize: 40, color: JP.rojo, opacity: clamp(kC * 2) }}>construcción</div>
      <Frases frases={[{ t: 0.02, texto: "el terreno se queda", color: JP.cian, px: 78 }, { t: 2.0, texto: "la construcción baja", color: JP.rojo, px: 76 }, { t: T.marca22 - 0.3, texto: "22 años para impuestos", color: RE.oro, px: 62 }]} y={352} ancho={860} />
      <Chip texto="depreciación lineal · esquema" x={W / 2} y={1500} color={RE.hielo} id="jap-esq" ancho={640} opacidad={rp(t, a, T.chip, 0.4)} />
      <Fuente texto="Vida útil tributaria de una casa de madera en Japón: 22 años · la línea es un esquema, no precios reales" delay={0.8} />
    </Estudio>
  );
};

/* ───────────── jap-demole ───────────── */

export const JapDemole: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const T = TJP.demole;
  const s = spr(f, a(T.casa), { damping: 15, stiffness: 110, mass: 0.9 });
  const golpe = rp(t, a, T.golpe - 0.6, 0.6);
  const cae = easeOut((t - a(T.caida)) / a(0.9));
  const b1 = lerp(48, 30, easeInOut(golpe)), b2 = lerp(-5, -50, easeInOut(golpe)) + 6 * Math.sin(t * 3) * (1 - golpe);
  const filas = [
    { y: 1010, k: rp(t, a, T.barra1, 0.8), v: JAP.demolida.japon, c: JP.rojo, etq: "Japón" },
    { y: 1130, k: rp(t, a, T.barra2, 0.8), v: JAP.demolida.eeuu, c: JP.oro, etq: "EE. UU." },
    { y: 1250, k: rp(t, a, T.barra3, 0.8), v: JAP.demolida.reinoUnido, c: JP.cian, etq: "Reino Unido" },
  ];
  const ESC = 5.4, BX = 300;
  return (
    <Estudio piso={900} resplandor={0.45}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g opacity={clamp(s * 2)}>
          <CasaJ x={270} y={860} s={0.95} edad={0.85} luz={0.2} alto={1 - 0.88 * cae} />
          <Escombros x={270} y={860} s={0.9} k={cae} t={t} />
          <Excavadora x={760} y={860} s={0.85} b1={b1} b2={b2} t={t} />
        </g>
        {filas.map((fl, i) => fl.k > 0.01 ? <rect key={i} x={BX} y={fl.y} width={fl.v * ESC * easeOut(fl.k)} height={64} rx={10} fill={fl.c} opacity={0.95} /> : null)}
      </svg>
      <Frases frases={[{ t: 0.02, texto: "casas demolidas", px: 84 }, { t: 2.0, texto: "edad promedio", color: RE.hielo, px: 80 }, { t: T.barra1, texto: "Japón: 32 años", color: JP.rojo, px: 80 }]} y={352} ancho={860} />
      {filas.map((fl, i) => (
        <React.Fragment key={i}>
          <div data-texto={`jap-e${i}`} style={{ position: "absolute", left: 100, top: fl.y + 32, transform: "translateY(-50%)", width: 220, fontFamily: MONOF, fontWeight: 700, fontSize: 28, color: RE.hielo, opacity: clamp(fl.k * 3) }}>{fl.etq}</div>
          <div data-texto={`jap-v${i}`} style={{ position: "absolute", left: BX + fl.v * ESC * easeOut(fl.k) + 14, top: fl.y + 32, transform: "translateY(-50%)", fontFamily: FONT, fontWeight: 800, fontSize: 44, color: fl.c, opacity: clamp(fl.k * 3), whiteSpace: "nowrap" }}>{`${(fl.v * easeOut(fl.k)).toFixed(1).replace(".", ",")} años`}</div>
        </React.Fragment>
      ))}
      <Chip texto="no es cuánto dura: es cuándo se reemplaza" x={W / 2} y={1450} color={RE.hielo} id="jap-nodura" ancho={840} opacidad={rp(t, a, T.chip, 0.4)} />
      <Fuente texto="Edad promedio de las casas demoliendo: dato de 2008 del ministerio de transporte de Japón (vía resúmenes) · no mide la vida física" delay={0.8} />
    </Estudio>
  );
};
