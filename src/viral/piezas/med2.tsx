/**
 * «Médicos que se probaron a sí mismos» (v4) · escenas 2/3 (Marshall y Warren, Australia)
 *   med-pylori1   el estómago con su úlcera y, al lado, la lupa sobre una bacteria en espiral (Helicobacter pylori)
 *   med-vaso      un vaso de caldo con bacterias; 1984: Marshall se lo bebe
 *   med-gastritis la endoscopia se enrojece (gastritis) y aparecen las cápsulas de antibiótico
 *   med-nobel2    pictograma de 10 personas (≈ 44 % infectadas) y la medalla Nobel 2005
 */
import React from "react";
import { MED, TM } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeInOut, easeOut, lerp, spr, useReloj } from "../comun";
import { Estudio, FONT, Frases, MONOF, RE, Reflejo } from "./real-kit";
import { Dato, Fuente } from "./real1";
import { Chip } from "./med1";
import { Capsula, CampoBacterias, Endoscopia, Estomago, MC, Medalla, Vaso } from "./med-kit";

type P = { e: EscenaViralGuardada };

/* ───────────── med-pylori1 ───────────── */

export const MedPylori1: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const lupa = spr(f, a(TM.pylori1.lupa), { damping: 13, stiffness: 140, mass: 0.7 });
  const infl = 0.25 + 0.5 * easeInOut(t / a(8));
  return (
    <Estudio piso={1380} resplandor={0.45}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g opacity={clamp((t - 0.2) / 0.5)}><Estomago x={395} y={990} s={0.92} inflamacion={infl} ulcera={1} latido={Math.sin(t * 1.6)} /></g>
        <g transform={`translate(0 ${(1 - lupa) * 30})`}>
          <CampoBacterias x={780} y={740} r={170} n={22} t={t} lupa={lupa} />
        </g>
        {lupa > 0.3 && <path d="M 560 800 C 600 790 620 780 640 770" fill="none" stroke={RE.hielo} strokeWidth={4} strokeDasharray="10 10" opacity={0.6 * clamp(lupa)} />}
      </svg>
      <Frases frases={[{ t: 0.2, texto: "¿estrés y\ncomida picante?", px: 92 }, { t: 5.2, texto: "una bacteria\nen espiral", color: MC.verdeBac, px: 96 }]} y={405} />
      <Chip texto="Helicobacter pylori" x={780} y={985} color={MC.verdeBac} opacidad={clamp(lupa * 2)} id="pylori-nombre" ancho={380} />
      <Chip texto="úlcera péptica" x={395} y={1390} color={RE.rojo} opacidad={clamp((t - 1) / 0.5)} id="pylori-ulcera" ancho={340} />
      <Fuente texto="NobelPrize.org · Premio Nobel 2005: Warren y Marshall, Helicobacter pylori en gastritis y úlcera péptica" y={1600} delay={4} />
    </Estudio>
  );
};

/* ───────────── med-vaso ───────────── */

export const MedVaso: React.FC<P> = ({ e }) => {
  const { t, a } = useReloj();
  const beber = easeInOut((t - a(TM.vaso.beber)) / a(TM.vaso.beberDur));
  const giro = -38 * Math.sin(beber * Math.PI * 0.5) * (1 - 0.35 * clamp((beber - 0.7) / 0.3));
  const nivel = lerp(0.82, 0.18, beber);
  const anio = 1900 + 84 * easeOut((t - a(TM.vaso.anio)) / a(1.6));
  return (
    <Estudio piso={1290} resplandor={0.5}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Reflejo piso={1290} intensidad={0.2} alto={110}>
          <g opacity={clamp((t - 0.2) / 0.5)}><Vaso x={540} y={1290} s={2.05} nivel={nivel} giro={giro} t={t} bacterias /></g>
        </Reflejo>
      </svg>
      <Frases frases={[{ t: 0.2, texto: "nadie les creía", color: RE.rojo, px: 100 }, { t: 2.2, texto: "«ninguna bacteria\nsobrevive al ácido»", px: 74 }, { t: 5.7, texto: "se lo bebió", color: MC.verdeBac, px: 118 }]} y={405} />
      <Chip texto="ácido gástrico · pH 1–3" x={W / 2} y={1400} color={RE.oro} opacidad={clamp((t - a(2.4)) / 0.5) * (1 - clamp((t - a(5.6)) / 0.4))} id="vaso-ph" ancho={440} />
      <Dato valor={anio} x={W / 2} y={1470} px={150} digitos={4} sinSep id="vaso-anio" opacidad={clamp((t - a(TM.vaso.anio)) / 0.4)} />
      <Fuente texto="Marshall et al., Med J Aust 1985 (autoexperimento de 1984) · NobelPrize.org 2005" y={1626} delay={6.4} />
    </Estudio>
  );
};

/* ───────────── med-gastritis ───────────── */

export const MedGastritis: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const infl = easeInOut((t - a(TM.gastritis.rojo)) / a(TM.gastritis.rojoDur));
  const aparece = spr(f, a(TM.gastritis.endo), { damping: 14, stiffness: 120, mass: 0.8 });
  const cap = (i: number): number => spr(f, a(TM.gastritis.caps + i * 0.35), { damping: 11, stiffness: 160, mass: 0.6 });
  return (
    <Estudio piso={1400} resplandor={0.45}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g opacity={clamp(aparece * 2)} transform={`translate(${W / 2} 890) scale(${0.85 + 0.15 * aparece}) translate(${-W / 2} -890)`}>
          <Endoscopia x={W / 2} y={890} r={300} t={t} inflamacion={infl} etiqueta="ENDOSCOPIA" />
        </g>
        <Reflejo piso={1400} intensidad={0.16}>
          {[0, 1, 2].map((i) => <g key={i} opacity={clamp(cap(i) * 2)} transform={`translate(0 ${(1 - cap(i)) * -40})`}><Capsula x={380 + i * 160} y={1360} s={0.52} rot={-22 + i * 18} /></g>)}
        </Reflejo>
      </svg>
      <Frases frases={[{ t: 0.2, texto: "pocos días\ndespués", px: 92 }, { t: 1.4, texto: "náuseas\nvómitos", color: RE.oro, px: 92 }, { t: 3.4, texto: "gastritis", color: RE.rojo, px: 130 }, { t: 7.0, texto: "funcionó", color: RE.esmeralda, px: 128 }, { t: 8.4, texto: "antibióticos", px: 110 }]} y={405} />
      <Chip texto={infl > 0.5 ? "mucosa inflamada" : "mucosa sana"} x={W / 2} y={1250} color={infl > 0.5 ? RE.rojo : RE.esmeralda} opacidad={clamp(aparece * 2)} id="gastritis-estado" ancho={360} />
      <Fuente texto="Marshall et al., Med J Aust 1985 (gastritis tras beber el cultivo; resolvió con tratamiento) · NobelPrize.org 2005" y={1560} delay={4.5} />
    </Estudio>
  );
};

/* ───────────── med-nobel2 ───────────── */

const Persona10: React.FC<{ x: number; y: number; s: number; lleno: number }> = ({ x, y, s, lleno }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <circle cx={0} cy={-62} r={22} fill="#27455F" />
    <path d="M -34 0 C -34 -30 -22 -40 0 -40 C 22 -40 34 -30 34 0 Z" fill="#27455F" />
    <g opacity={clamp(lleno)}>
      <circle cx={0} cy={-62} r={22} fill={MC.verdeBac} />
      <path d="M -34 0 C -34 -30 -22 -40 0 -40 C 22 -40 34 -30 34 0 Z" fill={MC.verdeBac} />
    </g>
    <circle cx={-7} cy={-70} r={6} fill="#fff" opacity={0.25 * clamp(lleno)} />
  </g>
);

export const MedNobel2: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const k = easeOut((t - a(TM.nobel2.picto)) / a(TM.nobel2.pictoDur));
  const entrada = spr(f, a(TM.nobel2.medalla), { damping: 12, stiffness: 120, mass: 0.9 });
  const brillo = clamp((t - a(TM.nobel2.medalla + 0.8)) / a(1.6));
  const n = MED.pylori.prevalencia / 10; // personas llenas de 10
  return (
    <Estudio piso={1330} resplandor={0.5}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g>
          {Array.from({ length: 10 }, (_, i) => <Persona10 key={i} x={152 + i * 86.2} y={810} s={1.35} lleno={clamp(n * k - i)} />)}
        </g>
        <Medalla x={W / 2} y={1285} r={112} anio="2005" brillo={brillo} entrada={entrada} />
      </svg>
      <Frases frases={[{ t: 0.2, texto: "la mayoría de\nlas úlceras", px: 90 }, { t: 3.7, texto: "y cerca de la\nmitad del mundo", color: MC.verdeBac, px: 80 }, { t: 7.1, texto: "Nobel 2005", color: MC.oroMed, px: 124 }]} y={405} />
      <Dato valor={MED.pylori.prevalencia * k} x={W / 2} y={960} px={118} digitos={3} decimales={1} sufijo="%" color={MC.verdeBac} id="nobel2-pct" opacidad={clamp(k * 4)} />
      <div data-texto="nobel2-etq" style={{ position: "absolute", left: 104, width: W - 208, top: 1030, textAlign: "center", fontFamily: MONOF, fontWeight: 700, fontSize: 24, color: RE.hielo, opacity: 0.85 * clamp(k * 3) * (1 - clamp(entrada * 2)) }}>de la población mundial (meta-análisis, 73 países)</div>
      <div data-texto="nobel2-comp" style={{ position: "absolute", left: 104, width: W - 208, top: 1470, textAlign: "center", fontFamily: FONT, fontWeight: 700, fontSize: 36, color: RE.blanco, opacity: clamp(entrada * 2) }}>Barry Marshall y Robin Warren</div>
      <Fuente texto="Zamani et al., Aliment Pharmacol Ther 2018 (44,3 %; otros estudios dan más; varía por país) · NobelPrize.org · Nobel de Fisiología o Medicina 2005" y={1590} delay={3.8} />
    </Estudio>
  );
};
