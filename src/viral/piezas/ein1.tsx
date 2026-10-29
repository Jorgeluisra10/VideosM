/**
 * «Los dueños del cerebro» (SINAPSIS · astrocitos v2) · escenas 1/2
 *   ein-gancho     toxinas que empujan la pared del capilar; un escudo dorado las frena y una estrella aparece en el tejido
 *   ein-barrera    campo de microscopio (corte H&E esquemático): pies perivasculares que envuelven el capilar, nutrientes que pasan y toxinas que rebotan
 *   ein-tripartita lo que dibujan los libros (dos neuronas) → «FALSO» → el tercer participante, el astrocito
 *   ein-esculpe    una red de conexiones: las débiles se eliminan, las importantes se refuerzan y queda una constelación (el recuerdo)
 */
import React from "react";
import { TEIN } from "../../anim/piezas";
import { useUid } from "../../estudio/util";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeOut, lerp, spr, useReloj } from "../comun";
import { Estudio, Frases, MONOF, RE } from "./real-kit";
import { Fuente } from "./real1";
import { Chip } from "./med1";
import { AC, Astrocito } from "./astro-kit";
import { CampoMicroscopio, Globulo, HE, Nutriente, TejidoHE, Toxina } from "./ein-kit";

type P = { e: EscenaViralGuardada };

/* ───────────── ein-gancho ───────────── */

export const EinGancho: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const uid = useUid();
  const G = TEIN.gancho;
  const vaso = spr(f, a(G.vaso), { damping: 14, stiffness: 130, mass: 0.8 });
  const escudo = easeOut((t - a(G.escudo)) / a(0.8));
  const estrella = easeOut((t - a(G.estrella)) / a(1.0));
  const TOP = 900, BOT = 1090;
  // glóbulos rojos que fluyen
  let desp = 0;
  const pasos = Math.max(1, Math.floor(t * 60));
  for (let k = 0; k < pasos; k++) desp += (150 + 260 * Math.pow(Math.max(0, Math.sin(2 * Math.PI * 1.1 * (k / 60))), 3)) / 60;
  const toxinas = Array.from({ length: 5 }, (_, i) => {
    const x = ((i * 230 + 120 + t * 90) % 1240) - 80;
    const mov = Math.abs(Math.sin(t * 1.5 + i * 1.3));
    const y = TOP + 36 + (BOT - TOP - 90) * (1 - mov);
    return { x, y, cerca: y < TOP + 52 };
  });
  return (
    <Estudio piso={1600} resplandor={0.45}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id={`${uid}pa`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#B5483A" /><stop offset="0.5" stopColor="#6E1E16" /><stop offset="1" stopColor="#B5483A" /></linearGradient>
          <linearGradient id={`${uid}pl`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFE9A8" stopOpacity="0.55" /><stop offset="1" stopColor="#E9B94A" stopOpacity="0.4" /></linearGradient>
          <linearGradient id={`${uid}te`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0B1630" stopOpacity="0" /><stop offset="1" stopColor="#1B2F7A" stopOpacity="0.45" /></linearGradient>
          <clipPath id={`${uid}cl`}><rect x={-10} y={TOP + 14} width={1100} height={BOT - TOP - 28} /></clipPath>
        </defs>
        {/* tejido cerebral encima del capilar */}
        <rect x={0} y={560} width={W} height={TOP - 560} fill={`url(#${uid}te)`} />
        {estrella > 0.01 && (
          <g opacity={0.9 * estrella}>
            <circle cx={540} cy={735} r={250} fill={AC.oro} opacity={0.07} />
            <Astrocito x={540} y={735} s={0.6 * (0.7 + 0.3 * estrella)} k={estrella} t={t} luz={estrella} opacidad={clamp(estrella * 2)} />
          </g>
        )}
        {/* capilar */}
        <g opacity={clamp(vaso * 1.6)} transform={`translate(0 ${(1 - vaso) * 50})`}>
          <rect x={-20} y={TOP} width={1120} height={BOT - TOP} rx={30} fill={`url(#${uid}pa)`} />
          <rect x={-10} y={TOP + 14} width={1100} height={BOT - TOP - 28} fill={`url(#${uid}pl)`} />
          <g clipPath={`url(#${uid}cl)`}>
            {Array.from({ length: 12 }, (_, i) => <Globulo key={i} x={((i * 129 + desp) % 1240) - 80} y={TOP + 44 + ((i * 47) % 100)} rot={(i % 5) * 12 - 24} />)}
          </g>
          {/* pies perivasculares: el escudo dorado */}
          {Array.from({ length: 9 }, (_, i) => {
            const x = 60 + i * 120;
            const k = clamp(escudo * 1.4 - i * 0.04);
            return <rect key={i} x={x - 52} y={TOP - 22} width={104} height={26 * k} rx={13} fill={AC.oro} stroke={AC.oroClaro} strokeWidth={2.5} opacity={0.95} />;
          })}
          {escudo > 0.05 && <rect x={-20} y={TOP - 34} width={1120} height={14} fill={AC.oro} opacity={0.18 * escudo} />}
          {toxinas.map((p, i) => (
            <g key={i}>
              <Toxina x={p.x} y={p.y} s={0.8} rot={t * 40 + i * 30} />
              {escudo > 0.5 && p.cerca && <g transform={`translate(${p.x} ${TOP + 10})`}><circle r={26} fill="none" stroke="#fff" strokeWidth={4} opacity={0.85} /><circle r={10} fill={AC.oroClaro} /></g>}
            </g>
          ))}
        </g>
      </svg>
      <Frases frases={[{ t: 0.2, texto: "ahora mismo", px: 104 }, { t: 0.9, texto: "toxinas intentan\nentrar a tu cerebro", px: 88 }, { t: 3.0, texto: "¿algo las frena?", color: RE.oro, px: 96 }]} y={385} id="ein-gancho-t" />
    </Estudio>
  );
};

/* ───────────── ein-barrera ───────────── */

const CX = 540, CY = 985, R = 345;
const VC = { x: -30, y: 40 };
const SOMA = { x: 195, y: -205 };
const PADS = Array.from({ length: 7 }, (_, i) => (i / 7) * Math.PI * 2 + 0.35);

export const EinBarrera: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const uid = useUid();
  const B = TEIN.barrera;
  const campo = spr(f, a(B.campo), { damping: 14, stiffness: 120, mass: 0.9 });
  const astro = clamp((t - a(B.astro)) / a(0.7));
  const nutri = clamp((t - a(B.nutri)) / a(1.5));
  const toxi = clamp((t - a(B.toxi)) / a(0.3));
  const chip = clamp((t - a(B.chip)) / a(0.4));
  const piesP = (i: number): number => easeOut((t - a(B.pies + i * 0.12)) / a(0.6));
  const pad = (th: number, r: number): [number, number] => [VC.x + Math.cos(th) * r, VC.y + Math.sin(th) * r];
  return (
    <Estudio piso={1600} resplandor={0.42}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id={`${uid}pi`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={AC.oroClaro} /><stop offset="1" stopColor={AC.oro} /></linearGradient>
          <radialGradient id={`${uid}so`} cx="40%" cy="35%" r="75%"><stop offset="0" stopColor={AC.oroClaro} /><stop offset="1" stopColor={AC.oro} /></radialGradient>
        </defs>
        <g opacity={clamp(campo * 1.6)} transform={`translate(0 ${(1 - campo) * 60})`}>
          <CampoMicroscopio cx={CX} cy={CY} r={R} etiqueta="corte · capilar cerebral" escala="10 µm" colorTexto={HE.tinta}>
            <g transform={`translate(${CX} ${CY})`}>
              <TejidoHE ancho={760} alto={760} n={110} semilla={9} />
              {/* neuronas del parénquima */}
              {[[-250, -130], [-215, 210], [250, 170]].map(([x, y], k) => (
                <g key={k} transform={`translate(${x} ${y})`} opacity={0.9}>
                  {[0, 1, 2, 3, 4].map((j) => <line key={j} x1={0} y1={0} x2={Math.cos(j * 1.3 + k) * 52} y2={Math.sin(j * 1.3 + k) * 52} stroke={AC.azul} strokeWidth={5} strokeLinecap="round" />)}
                  <circle r={22} fill={AC.azul} stroke={AC.azulClaro} strokeWidth={3} /><circle r={8} fill={AC.azulOscuro} />
                </g>
              ))}
              {/* procesos y soma del astrocito */}
              {PADS.map((th, i) => {
                const [ex, ey] = pad(th, 158);
                const q = clamp(astro * 1.2 - i * 0.05);
                const d = `M ${SOMA.x} ${SOMA.y} Q ${(SOMA.x + ex) / 2 + (i % 2 ? 40 : -40)} ${(SOMA.y + ey) / 2 - 20} ${ex} ${ey}`;
                return <path key={i} d={d} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - q} fill="none" stroke={AC.oro} strokeWidth={10} strokeLinecap="round" opacity={0.95} />;
              })}
              <g opacity={astro}>
                <circle cx={SOMA.x} cy={SOMA.y} r={52} fill={AC.oro} opacity={0.22} />
                <circle cx={SOMA.x} cy={SOMA.y} r={38} fill={`url(#${uid}so)`} stroke="#fff" strokeOpacity={0.7} strokeWidth={2.5} />
                <circle cx={SOMA.x + 3} cy={SOMA.y + 2} r={14} fill="#9A6A00" />
              </g>
              {/* capilar: luz, endotelio y pericito */}
              <circle cx={VC.x} cy={VC.y} r={88} fill="#FBE5EC" />
              {Array.from({ length: 6 }, (_, i) => {
                const ang = t * 0.5 + i * 1.05, rr = 38 + 12 * Math.sin(t + i);
                return <Globulo key={i} x={VC.x + Math.cos(ang) * rr} y={VC.y + Math.sin(ang) * rr} rot={ang * 57 + 90} s={0.85} />;
              })}
              <circle cx={VC.x} cy={VC.y} r={102} fill="none" stroke="#E27AA8" strokeWidth={22} />
              {Array.from({ length: 8 }, (_, k) => {
                const th = (k / 8) * Math.PI * 2;
                return <line key={k} x1={VC.x + Math.cos(th) * 94} y1={VC.y + Math.sin(th) * 94} x2={VC.x + Math.cos(th) * 112} y2={VC.y + Math.sin(th) * 112} stroke="#7A2350" strokeWidth={4} />;
              })}
              {[0.6, 3.4].map((th, k) => <ellipse key={k} cx={VC.x + Math.cos(th) * 102} cy={VC.y + Math.sin(th) * 102} rx={20} ry={8} transform={`rotate(${th * 57.3 + 90} ${VC.x + Math.cos(th) * 102} ${VC.y + Math.sin(th) * 102})`} fill={HE.nucleo} />)}
              <ellipse cx={VC.x + Math.cos(3.7) * 128} cy={VC.y + Math.sin(3.7) * 128} rx={22} ry={13} fill="#7B5BC0" stroke="#C9B6FF" strokeWidth={2.5} />
              {/* pies perivasculares */}
              {PADS.map((th, i) => {
                const q = piesP(i);
                if (q <= 0.01) return null;
                const a0 = th - 0.3, a1 = th + 0.3;
                const [x0, y0] = pad(a0, 140), [x1, y1] = pad(a1, 140);
                return (
                  <g key={i} opacity={clamp(q * 1.6)}>
                    <path d={`M ${x0} ${y0} A 140 140 0 0 1 ${x1} ${y1}`} fill="none" stroke={AC.oroOscuro} strokeOpacity={0.4} strokeWidth={34 * q} strokeLinecap="round" />
                    <path d={`M ${x0} ${y0} A 140 140 0 0 1 ${x1} ${y1}`} fill="none" stroke={`url(#${uid}pi)`} strokeWidth={26 * q} strokeLinecap="round" />
                  </g>
                );
              })}
              {/* toxinas que rebotan y nutriente que pasa */}
              {Array.from({ length: 3 }, (_, i) => {
                const ang = -0.6 + i * 2.1 + t * 0.35, rr = 38 + 34 * Math.abs(Math.sin(t * 1.3 + i * 1.7));
                const x = VC.x + Math.cos(ang) * rr, y = VC.y + Math.sin(ang) * rr;
                const choca = rr > 66;
                return (
                  <g key={i}>
                    <Toxina x={x} y={y} s={0.55} rot={t * 50} />
                    {toxi > 0.3 && choca && <circle cx={VC.x + Math.cos(ang) * 96} cy={VC.y + Math.sin(ang) * 96} r={16} fill="none" stroke="#fff" strokeWidth={4} opacity={0.9} />}
                  </g>
                );
              })}
              {nutri > 0 && nutri < 1 && <Nutriente x={lerp(VC.x + 20, VC.x + Math.cos(0.4) * 235, nutri)} y={lerp(VC.y, VC.y + Math.sin(0.4) * 235, nutri)} s={0.95} op={Math.sin(Math.PI * nutri) ** 0.4} />}
            </g>
          </CampoMicroscopio>
        </g>
      </svg>
      <Chip texto="pies perivasculares" x={740} y={586} color={AC.oroClaro} ancho={390} id="barrera-pies" opacidad={clamp((t - a(B.pies)) / 0.4)} />
      <Chip texto="capilar" x={230} y={1400} color="#FFB6C9" ancho={200} id="barrera-capilar" opacidad={campo} />
      <Chip texto="barrera hematoencefálica" x={W / 2} y={1450} color={RE.oro} ancho={560} id="barrera-bhe" opacidad={chip} />
      <Frases frases={[{ t: 0.2, texto: "los astrocitos", color: RE.oro, px: 104 }, { t: 1.7, texto: "envuelven\ncada capilar", px: 92 }, { t: 3.3, texto: "barrera\nhematoencefálica", color: RE.hielo, px: 80 }]} y={385} id="ein-barrera-t" />
      <Fuente texto="Esquema sobre un corte H&E · el sello lo hace el endotelio; astrocitos y pericitos lo inducen y lo mantienen" y={1490} delay={3.9} />
    </Estudio>
  );
};

/* ───────────── ein-tripartita ───────────── */

const PRE = "M 468 470 L 468 620 C 468 650 400 690 396 770 C 392 850 470 890 540 890 C 610 890 688 850 684 770 C 680 690 612 650 612 620 L 612 470 Z";
const POST = "M 396 960 C 440 940 640 940 684 960 C 700 1040 650 1090 630 1160 L 630 1250 L 450 1250 L 450 1160 C 430 1090 380 1040 396 960 Z";
const PROC = "M 1120 520 C 960 600 850 740 760 880 C 722 930 720 975 748 1008 C 790 1056 860 1130 960 1210";
const PROC_I = "M -40 520 C 120 600 230 740 320 880 C 358 930 360 975 332 1008 C 290 1056 220 1130 120 1210";

export const EinTripartita: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const uid = useUid();
  const T = TEIN.tripartita;
  const dos = spr(f, a(T.dos), { damping: 14, stiffness: 130, mass: 0.8 });
  const falso = spr(f, a(T.falso), { damping: 8, stiffness: 240, mass: 0.6 });
  const astro = easeOut((t - a(T.astro)) / a(1.0));
  const chip = clamp((t - a(T.chip)) / a(0.4));
  const ves = [0, 1, 2].map((i) => clamp((((t - a(T.dos + 0.4 + i * 0.5)) / a(0.8)) % 1.6)));
  const brilla = 0.5 + 0.5 * Math.sin(t * 6);
  return (
    <Estudio piso={1600} resplandor={0.4}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id={`${uid}n1`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={AC.azulClaro} /><stop offset="0.55" stopColor={AC.azul} /><stop offset="1" stopColor={AC.azulOscuro} /></linearGradient>
        </defs>
        <g transform={`translate(0 ${120 + (1 - dos) * 40})`} opacity={clamp(dos * 1.6)}>
          {/* el tercer participante: dos procesos dorados que abrazan la hendidura */}
          {astro > 0 && [PROC, PROC_I].map((d, i) => (
            <g key={i} fill="none" strokeLinecap="round">
              <path d={d} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - astro} stroke={AC.oroOscuro} strokeOpacity={0.35} strokeWidth={46} />
              <path d={d} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - astro} stroke={AC.oro} strokeWidth={30} />
              <path d={d} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - astro} stroke={AC.oroClaro} strokeOpacity={0.8} strokeWidth={9} />
            </g>
          ))}
          <path d={PRE} fill={`url(#${uid}n1)`} stroke={AC.azulClaro} strokeOpacity={0.8} strokeWidth={4} />
          <path d={POST} fill={`url(#${uid}n1)`} stroke={AC.azulClaro} strokeOpacity={0.8} strokeWidth={4} />
          {[[500, 790], [580, 790], [520, 760], [566, 762], [540, 815]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={10} fill={AC.azulOscuro} stroke={AC.azulClaro} strokeOpacity={0.6} strokeWidth={2} opacity={0.75} />)}
          {astro > 0.6 && <ellipse cx={540} cy={925} rx={160 + 30 * brilla} ry={34 + 8 * brilla} fill={AC.hielo} opacity={0.28 * astro} />}
          {ves.map((p, i) => (p > 0 && p < 1 ? <circle key={i} cx={500 + i * 40} cy={840 + p * 170} r={9} fill="#fff" stroke={AC.azulClaro} strokeWidth={2} opacity={1 - clamp((p - 0.7) / 0.3)} /> : null))}
        </g>
      </svg>
      <Chip texto="lo que dibujan los libros" x={W / 2} y={545} color={RE.hielo} ancho={520} id="tri-libros" opacidad={dos * (1 - 0.55 * falso)} />
      <Chip texto="neurona presináptica" x={275} y={890} color={AC.azulClaro} ancho={330} id="tri-pre" opacidad={dos} />
      <Chip texto="neurona postsináptica" x={275} y={1250} color={AC.azulClaro} ancho={360} id="tri-post" opacidad={dos} />
      {falso > 0.02 && (
        <div data-texto="tri-falso" style={{ position: "absolute", left: W / 2 - 260, top: 960, width: 520, textAlign: "center", transform: `rotate(-8deg) scale(${0.4 + 0.6 * clamp(falso)})`, opacity: clamp(falso * 1.4) * (1 - 0.8 * astro) }}>
          <span style={{ display: "inline-block", padding: "4px 36px", border: `10px solid ${RE.rojo}`, borderRadius: 18, background: "rgba(8,18,31,0.55)", color: RE.rojo, fontFamily: "Inter, 'Segoe UI', Arial, sans-serif", fontWeight: 900, fontSize: 130, letterSpacing: "0.04em" }}>FALSO</span>
        </div>
      )}
      <Chip texto="tercer participante: el astrocito" x={W / 2} y={1440} color={AC.oroClaro} ancho={760} id="tri-astro" opacidad={chip} />
      <Frases frases={[{ t: 0.2, texto: "los libros dibujan\ndos neuronas", px: 88 }, { t: 1.6, texto: "falso", color: RE.rojo, px: 118 }, { t: 2.3, texto: "hay un tercero:\nel astrocito", color: RE.oro, px: 92 }]} y={385} id="ein-tripartita-t" />
      <Fuente texto="Sinapsis tripartita (Araque et al., Trends Neurosci 1999): neurona presináptica + postsináptica + astrocito" y={1490} delay={3.6} />
    </Estudio>
  );
};

/* ───────────── ein-esculpe ───────────── */

const NODOS: [number, number][] = [[200, 700], [420, 640], [640, 700], [860, 650], [300, 900], [540, 880], [780, 940], [180, 1130], [420, 1170], [660, 1190], [880, 1110]];
const FUERTES: [number, number][] = [[0, 1], [1, 2], [2, 6], [1, 5], [5, 8], [8, 9], [9, 10], [6, 10]];
const DEBILES: [number, number][] = [[0, 4], [4, 5], [4, 7], [4, 8], [7, 8], [2, 5], [3, 6], [6, 9], [5, 9], [2, 3], [5, 6]];
const enFuerte = new Set(FUERTES.flat());

export const EinEsculpe: React.FC<P> = () => {
  const { t, a } = useReloj();
  const E = TEIN.esculpe;
  const red = easeOut((t - a(E.red)) / a(0.8));
  const refuerza = easeOut((t - a(E.refuerza)) / a(0.9));
  const consts = easeOut((t - a(E.constelacion)) / a(0.9));
  const ptoEn = (i: number, u: number): [number, number] => [lerp(NODOS[FUERTES[i][0]][0], NODOS[FUERTES[i][1]][0], u), lerp(NODOS[FUERTES[i][0]][1], NODOS[FUERTES[i][1]][1], u)];
  return (
    <Estudio piso={1600} resplandor={0.42}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        {/* conexiones débiles: se eliminan una a una (la comen estrellitas doradas) */}
        {DEBILES.map(([p, q], i) => {
          const ti = a(E.poda + (i / DEBILES.length) * E.podaDur);
          const u = clamp((t - ti) / a(0.6));
          const [x1, y1] = NODOS[p], [x2, y2] = NODOS[q];
          const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
          return (
            <g key={`d${i}`} opacity={red}>
              {u < 1 && <line x1={lerp(x1, mx, u)} y1={lerp(y1, my, u)} x2={lerp(x2, mx, u)} y2={lerp(y2, my, u)} stroke="#8BA3C8" strokeOpacity={0.55 * (1 - u * 0.5)} strokeWidth={3} strokeLinecap="round" />}
              {u > 0 && u < 1 && (
                <g transform={`translate(${mx} ${my}) scale(${0.6 + 0.8 * Math.sin(Math.PI * u)})`}>
                  {Array.from({ length: 8 }, (_, k) => <line key={k} x1={Math.cos(k * 0.785) * 10} y1={Math.sin(k * 0.785) * 10} x2={Math.cos(k * 0.785) * 26} y2={Math.sin(k * 0.785) * 26} stroke={AC.oroClaro} strokeWidth={4} strokeLinecap="round" />)}
                  <circle r={10} fill={AC.oro} stroke="#fff" strokeWidth={2} />
                </g>
              )}
            </g>
          );
        })}
        {/* conexiones importantes: se engruesan y brillan */}
        {FUERTES.map(([p, q], i) => {
          const [x1, y1] = NODOS[p], [x2, y2] = NODOS[q];
          const w = 3 + 7 * refuerza;
          return (
            <g key={`f${i}`} opacity={red}>
              {refuerza > 0 && <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={AC.oro} strokeOpacity={0.3 * refuerza} strokeWidth={w + 14} strokeLinecap="round" />}
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={refuerza > 0.3 ? AC.oroClaro : "#8BA3C8"} strokeOpacity={refuerza > 0.3 ? 1 : 0.7} strokeWidth={w} strokeLinecap="round" />
              {refuerza > 0.5 && [0, 1].map((k) => { const [px, py] = ptoEn(i, (t * 0.5 + k * 0.5 + i * 0.13) % 1); return <circle key={k} cx={px} cy={py} r={7} fill="#fff" opacity={0.9} />; })}
            </g>
          );
        })}
        {NODOS.map(([x, y], i) => {
          const luz = enFuerte.has(i) ? consts : 0;
          return (
            <g key={i} opacity={red}>
              {luz > 0 && <circle cx={x} cy={y} r={34 + 8 * Math.sin(t * 4 + i)} fill={AC.oro} opacity={0.28 * luz} />}
              <circle cx={x} cy={y} r={20} fill={luz > 0.3 ? AC.oroClaro : AC.azul} stroke={luz > 0.3 ? "#fff" : AC.azulClaro} strokeWidth={3} />
              <circle cx={x} cy={y} r={7} fill={luz > 0.3 ? AC.oroOscuro : AC.azulOscuro} />
            </g>
          );
        })}
      </svg>
      <Chip texto="débil → se elimina" x={300} y={1400} color={RE.rojo} ancho={400} id="esc-debil" opacidad={clamp((t - a(E.poda)) / 0.4)} />
      <Chip texto="importante → se refuerza" x={745} y={1400} color={AC.oroClaro} ancho={470} id="esc-fuerte" opacidad={clamp((t - a(E.refuerza)) / 0.4)} />
      <Frases frases={[{ t: 0.2, texto: "conexión débil", px: 100 }, { t: 1.2, texto: "se elimina", color: RE.rojo, px: 108 }, { t: 3.0, texto: "si importa,\nse refuerza", color: RE.oro, px: 92 }, { t: 4.1, texto: "esculpen tus\nrecuerdos", color: RE.hielo, px: 88 }]} y={385} id="ein-esculpe-t" />
      <Fuente texto="Chung et al., Nature 2013: los astrocitos engullen sinapsis (ratones) · su papel en reforzarlas sigue en estudio" y={1470} delay={3.8} />
    </Estudio>
  );
};
