/**
 * «La ciudad que subió con gatos» (IMNOBA · Chicago · steampunk) · escenas 1/2
 *   chi-gancho   un hotel de ladrillo sube sobre gatos mecánicos, con la gente adentro tomando té
 *   chi-pantano  una ciudad plana sobre un pantano, casi al nivel del lago, con calles de barro
 *   chi-colera   el agua sucia trae el cólera: nube verde enojada y contador de muertes de 1854
 *   chi-plan     Chesbrough diseña cloacas que necesitan bajada… pero el pantano es plano
 *   chi-idea     si las cloacas no pueden bajar, que suba la ciudad: relleno de tierra y edificios arriba
 */
import React from "react";
import { CHI, TCH } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeInOut, easeOut, lerp, spr, useReloj } from "../comun";
import { azar } from "../../lib/anim";
import { useUid } from "../../estudio/util";
import { FONT, Frases, RE } from "./real-kit";
import { Dato, Fuente } from "./real1";
import { Chip } from "./med1";
import { CH, Caballero, Edificio, FondoVapor, Gato, Globo, Humo, Miasma, Onoma, Pantano, Plano, Tubo, Viga, escalones, sacudidaPasos, type VentanaDef } from "./chi-kit";

type P = { e: EscenaViralGuardada };
const rp = (t: number, a: (x: number) => number, ini: number, dur: number): number => clamp((t - a(ini)) / a(dur));

/** Ventanas del hotel (de abajo arriba, izquierda a derecha): la planta baja es la tienda con puerta. */
const HOTEL: VentanaDef[] = [
  { quien: "nadie", luz: true }, {}, { quien: "caballero", luz: true },
  { quien: "caballero", luz: true }, { quien: "mozo", luz: true }, { quien: "dama", luz: true },
  { quien: "dama", luz: true }, { quien: "dama", luz: true }, { quien: "caballero", luz: true },
  { quien: "gato", luz: true }, { quien: "dama", luz: true }, { quien: "nadie", luz: true },
];

/* ───────────── chi-gancho ───────────── */

export const ChiGancho: React.FC<P> = () => {
  const { f, t, a, dur } = useReloj();
  const T = TCH.gancho;
  const s = spr(f, a(T.edificio), { damping: 13, stiffness: 110, mass: 0.9 });
  const sube = escalones(t, a(T.sube0), a(T.paso), 5, a(0.4));
  const alza = sube * 120;
  const sh = sacudidaPasos(t, a(T.sube0), a(T.paso), 5, 0.3);
  const G = 1400;
  const baseB = G - 116 - alza;
  const giro = sube * 1800;
  const gk = rp(t, a, T.globo, 0.4);
  return (
    <FondoVapor tono="cafe">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g transform={`translate(${sh.dx} ${sh.dy})`}>
          <rect x={0} y={G} width={W} height={H - G} fill="#2B1D10" />
          <line x1={0} y1={G} x2={W} y2={G} stroke={CH.bronce} strokeWidth={4} />
          {Array.from({ length: 14 }, (_, i) => <rect key={i} x={i * 80 + (i % 2) * 20} y={G + 12 + (i % 3) * 10} width={64} height={22} rx={5} fill="#3D2A18" opacity={0.8} />)}
          {[-200, -100, 0, 100, 200].map((dx) => <Gato key={dx} x={540 + dx} y={G} ext={alza} giro={giro + dx} />)}
          <g transform={`translate(0 ${(1 - s) * 90})`} opacity={clamp(s * 2)}>
            <Viga x={540} y={G - 98 - alza} w={600} />
            <Edificio x={540} y={baseB} w={520} pisos={4} pisoH={130} rotulo="HOTEL" abierto ventanas={HOTEL} t={t} />
          </g>
          {gk > 0 && <Globo x={560} y={baseB - 405} texto="¿Más té, querida?" ancho={330} k={gk} lado="izq" id="chi-globo" />}
          <Caballero x={lerp(-80, 1160, (t / dur) % 1)} y={G + 74} s={0.95} fase={t * 9} pose="camina" abrigo="#5C3B2A" />
          <Caballero x={lerp(1160, -80, ((t / dur) * 0.8 + 0.2) % 1)} y={G + 104} s={0.9} fase={t * 8 + 2} pose="bolsa" abrigo="#2F4A3A" espejo />
        </g>
      </svg>
      <Frases frases={[{ t: 0.02, texto: "Chicago levantó", px: 84 }, { t: T.f2, texto: "una ciudad entera", color: CH.laton, px: 88 }, { t: T.f3, texto: "con la gente adentro", color: CH.crema, px: 78 }]} y={352} ancho={860} />
      <Chip texto="Chicago · década de 1850" x={W / 2} y={1556} color={CH.laton} id="chi-anio" ancho={560} opacidad={rp(t, a, T.chip, 0.4)} />
      <Fuente texto="Ilustración simplificada de un edificio de ladrillo levantado sobre gatos mecánicos · Chicago, década de 1850" delay={0.8} />
    </FondoVapor>
  );
};

/* ───────────── chi-pantano ───────────── */

export const ChiPantano: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const T = TCH.pantano;
  const uid = useUid();
  const nivel = 1130;
  const calle = nivel - 22;
  const sS = spr(f, a(T.suelo), { damping: 14, stiffness: 120, mass: 0.8 });
  const hunde = easeInOut((t - a(T.hunde)) / a(1.2));
  const slurp = rp(t, a, T.slurp, 0.7);
  const sale = easeOut((t - a(T.slurp)) / a(0.45));
  const sombreroY = lerp(0, -260, sale) + 160 * Math.pow(clamp((t - a(T.slurp) - 0.45) / a(0.6)), 2);
  const rueda = Math.sin(t * 6) * 6 * (1 - slurp);
  return (
    <FondoVapor tono="cafe" vel={0.8}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs><clipPath id={`${uid}c`}><rect x={0} y={0} width={W} height={calle + 8} /></clipPath></defs>
        <g opacity={clamp(sS * 2)} transform={`translate(0 ${(1 - sS) * 60})`}>
          <Pantano x0={0} x1={W} nivel={nivel} alto={22} t={t} fondo={1560} />
          {/* cielo: sol, humo de un vapor en el lago */}
          <circle cx={860} cy={700} r={120} fill="#FFD98A" opacity={0.16} /><circle cx={860} cy={700} r={64} fill="#FFE9B0" opacity={0.3} />
          <g transform={`translate(${lerp(1000, 760, ((t * 0.04) % 1))} ${nivel - 2})`}>
            <path d="M -110 -4 L 110 -4 L 84 40 L -84 40 Z" fill="#3B2512" stroke="#1A1008" strokeWidth={4} />
            <rect x={-60} y={-52} width={120} height={48} fill="#E9D3A3" stroke="#1A1008" strokeWidth={4} /><rect x={-14} y={-110} width={28} height={58} fill="#B98A3A" stroke="#1A1008" strokeWidth={4} />
            <Humo x={0} y={-110} t={t} s={1.6} n={5} vel={0.3} />
          </g>
          {/* casitas del pueblo */}
          <g transform={`translate(130 ${calle}) scale(0.72)`}><Edificio x={0} y={0} w={300} pisos={2} pisoH={150} ventanas={[{}, {}, {}, { luz: true, quien: "dama" }, { luz: true }, { luz: true }]} t={t} /></g>
          <g transform={`translate(520 ${calle}) scale(0.6)`}><Edificio x={0} y={0} w={300} pisos={3} pisoH={150} ladrillo="#7E5A3A" ventanas={[{}, {}, {}, { luz: true }, { luz: true, quien: "caballero" }, { luz: true }, { luz: true }, { luz: true }, { luz: true }]} t={t} /></g>
          {/* carreta atascada */}
          <g clipPath={`url(#${uid}c)`}>
            <g transform={`translate(640 ${calle + 20}) rotate(${rueda})`}>
              <circle r={62} fill="none" stroke="#6B4724" strokeWidth={11} /><circle r={9} fill="#6B4724" />
              {[0, 45, 90, 135].map((g) => <line key={g} x1={0} y1={-60} x2={0} y2={60} stroke="#6B4724" strokeWidth={7} transform={`rotate(${g})`} />)}
            </g>
            {/* caballero que se hunde */}
            <Caballero x={300} y={calle + 6 + hunde * 70 * (1 - sale)} s={1.15} fase={t * 4} pose="susto" abrigo="#4B3524" sombrero={sale < 0.02} />
          </g>
          {/* el sombrero sale volando */}
          {sale > 0.01 && (
            <g transform={`translate(300 ${calle - 140 + sombreroY}) rotate(${sale * 340})`}>
              <rect x={-30} y={-6} width={60} height={9} rx={3} fill="#15100B" /><rect x={-19} y={-48} width={38} height={46} rx={4} fill="#15100B" /><rect x={-19} y={-18} width={38} height={7} fill={CH.laton} />
            </g>
          )}
          {/* barro alrededor del hundido */}
          <ellipse cx={300} cy={calle + 10} rx={62 + hunde * 10} ry={9} fill="#3B2A16" />
          <line x1={0} y1={nivel} x2={W} y2={nivel} stroke={CH.hielo} strokeWidth={3} strokeDasharray="16 12" opacity={0.85} />
          <Onoma x={300} y={calle - 330} texto="¡SLURP!" k={slurp} color={CH.laton} px={72} rot={-9} id="chi-slurp" />
        </g>
      </svg>
      <Frases frases={[{ t: 0.02, texto: "nació sobre un pantano", px: 78 }, { t: T.f2, texto: "casi al nivel del lago", color: CH.laton, px: 74 }, { t: T.f3, texto: "calles de barro puro", color: "#E0B67A", px: 78 }]} y={352} ancho={860} />
      <Chip texto="← nivel del lago" x={780} y={nivel + 56} color={CH.hielo} id="chi-lago" ancho={400} opacidad={rp(t, a, T.chip, 0.4)} />
      <Fuente texto="Chicago se fundó en terreno bajo y encharcado, a pocos pies sobre el lago Míchigan · ilustración" delay={0.8} />
    </FondoVapor>
  );
};

/* ───────────── chi-colera ───────────── */

export const ChiColera: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const T = TCH.colera;
  const sP = spr(f, a(T.pueblo), { damping: 14, stiffness: 120, mass: 0.8 });
  const sN = spr(f, a(T.nube), { damping: 11, stiffness: 70, mass: 1 });
  const cuenta = easeOut((t - a(T.dato)) / a(2.6));
  const ag = rp(t, a, T.agua, 0.5);
  return (
    <FondoVapor tono="verde" vel={0.7}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        {/* pueblo en silueta */}
        <g opacity={clamp(sP * 2)} transform={`translate(0 ${(1 - sP) * 70})`}>
          {Array.from({ length: 9 }, (_, i) => {
            const x = 30 + i * 118, h = 70 + azar(i * 3.3) * 70, w = 100;
            return (
              <g key={i}>
                <rect x={x} y={1470 - h} width={w} height={h} fill="#0E1409" stroke="#26331A" strokeWidth={3} />
                <polygon points={`${x - 6},${1470 - h} ${x + w / 2},${1470 - h - 36} ${x + w + 6},${1470 - h}`} fill="#0A0F06" stroke="#26331A" strokeWidth={3} />
                <rect x={x + 22} y={1470 - h + 20} width={24} height={26} fill="#B7D86A" opacity={0.45 + 0.25 * Math.sin(t * 3 + i)} />
                <rect x={x + 60} y={1470 - h + 20} width={24} height={26} fill="#B7D86A" opacity={0.35 + 0.25 * Math.sin(t * 2.4 + i * 2)} />
              </g>
            );
          })}
          <rect x={0} y={1470} width={W} height={120} fill="#101A0B" />
          <ellipse cx={170} cy={1484} rx={120} ry={12} fill="#5E6B2A" opacity={0.9} />
        </g>
        {/* gotera sucia */}
        <g opacity={ag}>
          <rect x={150} y={1260} width={40} height={14} fill="#3A3A2A" stroke="#1A1A10" strokeWidth={2} />
          {Array.from({ length: 6 }, (_, i) => {
            const q = (t * 1.1 + i / 6) % 1;
            return <ellipse key={i} cx={170} cy={1274 + q * 200} rx={6} ry={9} fill="#7B8A2E" opacity={1 - q * 0.6} />;
          })}
        </g>
        {/* nube del cólera */}
        <g opacity={clamp(sN * 2)} transform={`translate(${Math.sin(t * 0.8) * 24} 0)`}>
          <Miasma x={540} y={880} s={0.5 + 0.8 * sN} t={t} />
        </g>
      </svg>
      <Frases frases={[{ t: 0.02, texto: "el agua sucia", px: 84 }, { t: T.f2, texto: "trajo el cólera", color: "#B6F068", px: 92 }]} y={352} ancho={860} />
      <Dato valor={CHI.colera1854 * cuenta} x={W / 2} y={1130} px={140} digitos={4} color="#C8F27A" sufijo="+" etiqueta="muertes por cólera en 1854" etiquetaY={1230} id="chi-dato" opacidad={clamp(cuenta * 4)} />
      <Chip texto="el cólera no tenía nada de gracia" x={W / 2} y={1330} color="#B6F068" id="chi-seria" ancho={760} opacidad={rp(t, a, T.chip, 0.4)} />
      <Fuente texto="Registros de la Junta de Salud de Chicago: más de 1.400 muertes por cólera en 1854 (otras fuentes citan cifras cercanas) · ilustración" delay={1.2} />
    </FondoVapor>
  );
};

/* ───────────── chi-plan ───────────── */

export const ChiPlan: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const T = TCH.plan;
  const kPlano = rp(t, a, T.plano, 0.6);
  const sI = spr(f, a(T.ing), { damping: 13, stiffness: 120, mass: 0.8 });
  const plana = easeInOut((t - a(T.plano2)) / a(0.8));
  const y2 = lerp(960, 820, plana);
  const flecha = rp(t, a, T.pend, 0.5) * (1 - plana);
  const glub = rp(t, a, T.glub, 0.6);
  const duda = rp(t, a, T.duda, 0.5);
  return (
    <FondoVapor tono="azul" vel={0.8}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Plano x={540} y={850} w={900} h={560} k={kPlano} rot={-1} />
        {/* lago y pantano en el plano */}
        <g opacity={kPlano}>
          <path d="M 120 1040 L 700 1040 L 700 1100 L 120 1100 Z" fill="#6B5230" opacity={0.85} />
          <rect x={700} y={940} width={260} height={160} fill="#3E8FA3" opacity={0.85} />
          <text x={830} y={1030} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={30} fill={CH.hielo} data-texto="chi-lago-plano">lago</text>
          <text x={410} y={1080} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={28} fill="#F3E3C0" data-texto="chi-pant-plano">pantano</text>
        </g>
        <g opacity={kPlano}>
          <Tubo x1={170} y1={780} x2={760} y2={y2} grosor={50} t={t} fluye={plana < 0.5} />
        </g>
        {flecha > 0.02 && (
          <g opacity={flecha}>
            <path d={`M 250 930 L 600 ${930 + (960 - 780) * 0.58}`} stroke={CH.laton} strokeWidth={8} strokeLinecap="round" strokeDasharray="22 14" fill="none" />
            <polygon points={`600,${930 + 105 + 18} 620,${930 + 105 - 12} 576,${930 + 105 - 12}`} fill={CH.laton} transform={`rotate(-24 600 ${930 + 105})`} />
            <text x={430} y={1010} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={34} fill={CH.laton} data-texto="chi-bajada">necesita bajada</text>
          </g>
        )}
        {plana > 0.5 && (
          <g opacity={clamp((plana - 0.5) * 2)}>
            <line x1={170} y1={900} x2={760} y2={900} stroke="#FF8A6A" strokeWidth={5} strokeDasharray="14 10" />
            <text x={470} y={934} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={34} fill="#FF8A6A" data-texto="chi-plana">¡plano como mesa!</text>
          </g>
        )}
        {/* ingeniero */}
        <g opacity={clamp(sI * 2)} transform={`translate(0 ${(1 - sI) * 80})`}>
          <Caballero x={170} y={1440} s={1.25} fase={t * 3} pose="quieto" abrigo="#2B4A6B" />
          {duda > 0 && <text x={170} y={1130 - Math.sin(t * 6) * 4} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={110} fill={CH.laton} stroke={CH.tinta} strokeWidth={8} paintOrder="stroke" opacity={duda} data-texto="chi-duda">?</text>}
        </g>
        <Onoma x={830} y={780} texto="¡glub!" k={glub} color="#9AD8F2" px={64} rot={8} id="chi-glub" />
      </svg>
      <Frases frases={[{ t: 0.02, texto: "un ingeniero", px: 84 }, { t: T.f2, texto: "cloacas con bajada", color: CH.laton, px: 80 }, { t: T.f3, texto: "¡el pantano es plano!", color: "#FF9A7A", px: 78 }]} y={352} ancho={860} />
      <Chip texto="Ellis Chesbrough · ingeniero" x={W / 2 + 120} y={1530} color={CH.hielo} id="chi-ing" ancho={560} opacidad={rp(t, a, T.chip, 0.4)} />
      <Fuente texto="Ellis S. Chesbrough diseñó el plan de alcantarillado de Chicago (1855): el agua de una cloaca solo corre si hay pendiente · esquema" delay={1.0} />
    </FondoVapor>
  );
};

/* ───────────── chi-idea ───────────── */

export const ChiIdea: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const T = TCH.idea;
  const viejo = 1200, nuevo = 1030;
  const sT = spr(f, a(T.tubo), { damping: 13, stiffness: 120, mass: 0.8 });
  const rel = easeInOut((t - a(T.relleno)) / a(1.8));
  const sube = easeInOut((t - a(T.sube)) / a(1.6));
  const gy = viejo - (viejo - nuevo) * rel;
  const kC = spr(f, a(T.cavar), { damping: 11, stiffness: 140, mass: 0.7 });
  const kS = spr(f, a(T.subir), { damping: 11, stiffness: 140, mass: 0.7 });
  const carro = clamp(rel * 1.2);
  const edBase = viejo - 14 - (viejo - nuevo) * sube;
  return (
    <FondoVapor tono="cafe" vel={0.8}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        {/* tierra base */}
        <rect x={0} y={viejo} width={W} height={1560 - viejo} fill="#4A3720" />
        {Array.from({ length: 16 }, (_, i) => <ellipse key={i} cx={azar(i * 3.1) * W} cy={viejo + 40 + azar(i * 5.7) * 300} rx={20 + azar(i) * 18} ry={8} fill="#5A4328" opacity={0.7} />)}
        {/* cloaca sobre el terreno viejo */}
        <g opacity={clamp(sT * 2)} transform={`translate(0 ${(1 - sT) * -60})`}>
          <Tubo x1={60} y1={viejo - 36} x2={1020} y2={viejo - 8} grosor={46} t={t} fluye />
        </g>
        {/* relleno */}
        <rect x={0} y={gy} width={W} height={viejo - gy + 1} fill="#6B4F2E" />
        <rect x={0} y={gy} width={W} height={8} fill="#8A6A3E" />
        {Array.from({ length: 12 }, (_, i) => <ellipse key={i} cx={azar(i * 4.4) * W} cy={gy + 20 + azar(i * 8.1) * Math.max(0, viejo - gy - 30)} rx={18} ry={6} fill="#7B5C34" opacity={0.7} />)}
        {/* carreta que vuelca tierra */}
        <g opacity={carro * (1 - clamp((t - a(T.sube) - 0.8) / a(0.8)))}>
          <g transform={`translate(150 ${gy - 70}) rotate(${-20 - 30 * Math.sin(t * 5)})`}>
            <path d="M -60 -40 L 60 -40 L 44 20 L -44 20 Z" fill="#8A6234" stroke="#3B2512" strokeWidth={4} />
          </g>
          {Array.from({ length: 8 }, (_, i) => { const q = (t * 1.6 + i / 8) % 1; return <circle key={i} cx={190 + q * 20} cy={gy - 54 + q * 54} r={7} fill="#6B4F2E" opacity={1 - q * 0.4} />; })}
        </g>
        {/* edificios que suben con la calle */}
        <g transform={`translate(260 ${edBase}) scale(0.62)`}><Edificio x={0} y={0} w={340} pisos={2} pisoH={150} ventanas={[{}, {}, {}, { luz: true, quien: "dama" }, { luz: true }, { luz: true, quien: "caballero" }]} t={t} sinPuerta={false} /></g>
        <g transform={`translate(640 ${edBase}) scale(0.62)`}><Edificio x={0} y={0} w={340} pisos={2} pisoH={150} ladrillo="#8B5A3A" ventanas={[{}, {}, {}, { luz: true }, { luz: true, quien: "gato" }, { luz: true }]} t={t} /></g>
        {/* niveles */}
        <line x1={0} y1={viejo} x2={W} y2={viejo} stroke={CH.hielo} strokeWidth={3} strokeDasharray="14 10" opacity={0.7} />
        <line x1={0} y1={nuevo} x2={W} y2={nuevo} stroke={CH.laton} strokeWidth={4} strokeDasharray="22 12" opacity={clamp(rel * 2)} />
        <text x={880} y={nuevo - 14} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={30} fill={CH.laton} opacity={clamp(rel * 2)} data-texto="chi-nuevo">nivel nuevo</text>
        {/* carteles */}
        <g opacity={clamp(kC * 2)} transform={`translate(300 600) scale(${0.8 + 0.2 * kC})`}>
          <rect x={-130} y={-70} width={260} height={140} rx={14} fill={CH.crema} stroke={CH.tinta} strokeWidth={5} />
          <text x={0} y={-6} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={44} fill={CH.tinta} data-texto="chi-cavar">¿CAVAR?</text>
          <path d="M -34 12 L 34 58 M 34 12 L -34 58" stroke={CH.rojo} strokeWidth={12} strokeLinecap="round" />
        </g>
        <g opacity={clamp(kS * 2)} transform={`translate(780 600) scale(${0.8 + 0.2 * kS})`}>
          <rect x={-130} y={-70} width={260} height={140} rx={14} fill={CH.crema} stroke={CH.tinta} strokeWidth={5} />
          <text x={0} y={-6} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={44} fill={CH.tinta} data-texto="chi-subir">¿SUBIR?</text>
          <path d="M -38 36 L -8 62 L 42 14" stroke="#2E9B3A" strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </g>
      </svg>
      <Frases frases={[{ t: 0.02, texto: "la solución: una locura", px: 72 }, { t: T.f2, texto: "si el pantano no baja…", color: CH.crema, px: 78 }, { t: T.cavar + 0.5, texto: "¡que suba la ciudad!", color: CH.laton, px: 82 }]} y={352} ancho={860} />
      <Chip texto="cloaca enterrada bajo el relleno" x={W / 2} y={1120} color={CH.hielo} id="chi-enterrada" ancho={700} opacidad={rp(t, a, T.chip, 0.4)} />
      <Fuente texto="Las cloacas se tendieron casi a ras del suelo y se cubrieron con tierra: calles y edificios quedaron más arriba · esquema" delay={1.0} />
    </FondoVapor>
  );
};
