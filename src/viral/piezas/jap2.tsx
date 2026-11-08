/**
 * «La casa que vale menos cada año» (IMNOBA · figuras realistas) · escenas 2/2
 *   jap-porque   no se caen solas: preferencia por lo nuevo y normas antisísmicas que cambian
 *   jap-vacias   9 millones de viviendas vacías, 13,8 % (2023): 100 casitas, 14 vacías
 *   jap-leccion  al comprar, pide que separen el valor del terreno y el de la construcción
 */
import React from "react";
import { JAP, TJP } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeInOut, easeOut, lerp, spr, useReloj } from "../comun";
import { Estudio, FONT, Frases, MONOF, RE } from "./real-kit";
import { Dato, Fuente } from "./real1";
import { Chip } from "./med1";
import { CasaJ, JP, Terreno } from "./jap-kit";

type P = { e: EscenaViralGuardada };
const rp = (t: number, a: (x: number) => number, ini: number, dur: number): number => clamp((t - a(ini)) / a(dur));

/* ───────────── jap-porque ───────────── */

export const JapPorque: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const T = TJP.porque;
  const sV = spr(f, a(T.viejas), { damping: 15, stiffness: 110, mass: 0.9 });
  const sN = spr(f, a(T.nueva), { damping: 11, stiffness: 140, mass: 0.7 });
  const fl = rp(t, a, T.flecha, 0.5);
  const onda = rp(t, a, T.onda, 0.5);
  const pts = Array.from({ length: 80 }, (_, i) => {
    const x = 120 + (i / 79) * 840;
    const amp = (i > 14 && i < 40 ? 70 * Math.sin((i - 14) * 0.9) * (1 - (i - 14) / 40) : 5 * Math.sin(i)) * onda;
    return `${x},${1300 + amp * Math.sin(t * 9 + i * 0.4)}`;
  }).join(" ");
  return (
    <Estudio piso={1480} resplandor={0.5}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g opacity={clamp(sV * 2)} transform={`translate(0 ${(1 - sV) * 60})`}><CasaJ x={290} y={1000} s={0.82} edad={0.9} luz={0.15} /></g>
        <g opacity={fl}>
          <polygon points="470,800 560,800 560,770 640,830 560,890 560,860 470,860" fill={JP.oro} />
        </g>
        <g opacity={clamp(sN * 2)} transform={`translate(0 ${(1 - sN) * 60})`}><CasaJ x={790} y={1000} s={0.82} edad={0} luz={0.9} brillo={0.9} /></g>
        <polyline points={pts} fill="none" stroke={JP.cian} strokeWidth={6} strokeLinejoin="round" opacity={onda} />
      </svg>
      <Frases frases={[{ t: 0.02, texto: "no se caen solas", px: 84 }, { t: T.nueva - 0.2, texto: "se reemplazan", color: RE.oro, px: 86 }]} y={352} ancho={860} />
      <Chip texto="preferencia por lo nuevo" x={W / 2} y={1420} color={RE.oro} id="jap-nuevo" ancho={640} opacidad={rp(t, a, T.chip1, 0.4)} />
      <Chip texto="normas antisísmicas que cambian" x={W / 2} y={1490} color={JP.cian} id="jap-sismo" ancho={780} opacidad={rp(t, a, T.chip2, 0.4)} />
      <Fuente texto="Razones citadas por analistas: gusto por lo nuevo y cambios en las normas de construcción · no es la única causa" delay={0.8} />
    </Estudio>
  );
};

/* ───────────── jap-vacias ───────────── */

const Mini: React.FC<{ x: number; y: number; vacia: number; k: number }> = ({ x, y, vacia, k }) => (
  <g opacity={clamp(k * 2)} transform={`translate(${x} ${y}) scale(${0.6 + 0.4 * easeOut(k)})`}>
    <polygon points="-16,0 16,0 16,-18 0,-32 -16,-18" fill={vacia > 0.5 ? "#1B2433" : "#6FA8DC"} stroke={vacia > 0.5 ? JP.rojo : "#BFE0FF"} strokeWidth={vacia > 0.5 ? 2.5 : 1.2} strokeOpacity={0.9} />
    <rect x={-5} y={-12} width={10} height={12} fill={vacia > 0.5 ? "#0A0F18" : "#FFE9A8"} />
    {vacia > 0.5 && <line x1={-12} y1={-26} x2={12} y2={-2} stroke={JP.rojo} strokeWidth={2.5} />}
  </g>
);

export const JapVacias: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const T = TJP.vacias;
  const COLS = 10, FILAS = 10;
  const orden = React.useMemo(() => Array.from({ length: 100 }, (_, i) => i).sort((p, q) => Math.sin(p * 12.9898) - Math.sin(q * 12.9898)), []);
  const rango = new Map(orden.map((v, i) => [v, i]));
  const nVac = Math.round(14 * rp(t, a, T.vacias, T.vaciasDur));
  const dato = rp(t, a, T.dato, 1.4);
  return (
    <Estudio piso={1580} resplandor={0.45}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: COLS * FILAS }, (_, i) => {
          const c = i % COLS, r = Math.floor(i / COLS);
          const k = rp(t, a, T.grid + (i / 100) * T.gridDur, 0.4);
          return <Mini key={i} x={140 + c * 90} y={660 + r * 70} vacia={(rango.get(i) ?? 99) < nVac ? 1 : 0} k={k} />;
        })}
      </svg>
      <Frases frases={[{ t: 0.02, texto: "100 viviendas", px: 84 }, { t: T.vacias - 0.2, texto: "14 vacías", color: JP.rojo, px: 100 }]} y={352} ancho={860} />
      <Dato valor={JAP.vacias.millones * dato} x={W / 2} y={1470} px={120} digitos={1} sufijo=" millones vacías" id="jap-9" opacidad={clamp(dato * 3)} />
      <Chip texto="13,8 % de las viviendas · 2023" x={W / 2} y={1370} color={RE.oro} id="jap-138" ancho={700} opacidad={rp(t, a, T.chip, 0.4)} />
      <Fuente texto="Encuesta de Vivienda y Suelo 2023 de Japón: ≈ 9 millones de viviendas vacías (13,8 %); solo ≈ 3,6 % están a la venta" delay={0.8} />
    </Estudio>
  );
};

/* ───────────── jap-leccion ───────────── */

export const JapLeccion: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const T = TJP.leccion;
  const s = spr(f, a(T.casa), { damping: 15, stiffness: 110, mass: 0.9 });
  const parte = rp(t, a, T.parte, 0.6);
  const tar = spr(f, a(T.tarjeta), { damping: 14, stiffness: 120, mass: 0.8 });
  const fila = (i: number): number => rp(t, a, T.filas + i * 0.35, 0.35);
  return (
    <Estudio piso={1580} resplandor={0.5}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g opacity={clamp(s * 2)} transform={`translate(0 ${(1 - s) * 60})`}>
          <Terreno x={400} y={960} s={0.6} valor={parte} t={t} />
          <CasaJ x={430} y={945} s={0.72} edad={0.1} luz={0.7} />
        </g>
        {/* llaves: construcción arriba, terreno abajo */}
        <g opacity={parte}>
          <path d="M 700 740 q 30 0 30 30 v 50 q 0 30 30 30 q -30 0 -30 30 v 50 q 0 30 -30 30" fill="none" stroke={JP.rojo} strokeWidth={6} strokeLinecap="round" transform="translate(-20 -40)" />
          <path d="M 700 1030 q 30 0 30 30 v 20 q 0 30 30 30 q -30 0 -30 30 v 0 q 0 30 -30 30" fill="none" stroke={JP.cian} strokeWidth={6} strokeLinecap="round" transform="translate(-20 -100) scale(1 0.8)" />
        </g>
        {/* tarjeta de avalúo */}
        <g opacity={clamp(tar * 2)} transform={`translate(0 ${(1 - tar) * 60})`}>
          <rect x={150} y={1190} width={780} height={250} rx={22} fill="#F4F7FA" stroke="#fff" strokeWidth={3} />
          <rect x={150} y={1190} width={780} height={56} rx={22} fill="#1A3C8C" /><rect x={150} y={1220} width={780} height={26} fill="#1A3C8C" />
          <text x={186} y={1230} fontFamily={FONT} fontWeight={800} fontSize={28} fill="#fff">AVALÚO</text>
        </g>
      </svg>
      {["Terreno", "Construcción", "Total"].map((r, i) => (
        <div key={r} data-texto={`jap-fila${i}`} style={{ position: "absolute", left: 186, top: 1274 + i * 54, width: 710, display: "flex", justifyContent: "space-between", fontFamily: MONOF, fontWeight: 800, fontSize: 30, color: i === 2 ? "#1A222C" : "#52606E", opacity: fila(i) }}>
          <span>{r}</span><span>· · · · · · ·</span>
        </div>
      ))}
      <Frases frases={[{ t: 0.02, texto: "al comprar", px: 90 }, { t: T.parte - 0.2, texto: "separa terreno y construcción", color: RE.oro, px: 62 }]} y={352} ancho={860} />
      <Chip texto="pide el desglose por escrito" x={W / 2} y={1530} color={RE.hielo} id="jap-desglose" ancho={700} opacidad={rp(t, a, T.chip, 0.4)} />
      <Fuente texto="Consejo general: no es asesoría de compra ni inversión · confirma con un profesional y con la escritura" delay={0.8} />
    </Estudio>
  );
};
