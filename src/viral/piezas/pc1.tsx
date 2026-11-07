/**
 * «El par craneal 0» (SINAPSIS · neuroanatomía) · escenas 1/2
 *   pc0-gancho     te enseñaron 12 pares craneales, pero hay uno más: el cero
 *   pc0-fritsch    1878: Gustav Fritsch lo describió por primera vez, no en personas sino en tiburones
 *   pc0-recorrido  red de fibras finas sin mielina, junto al nervio olfatorio, que cruza la lámina cribosa y llega al cerebro
 *   pc0-numero     se llama cero porque está por delante del par I, el olfatorio (vista inferior esquemática)
 * Dibujos esquemáticos de anatomía; no son imágenes médicas reales.
 */
import React from "react";
import { PC0, TPC } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeOut, lerp, spr, useReloj } from "../comun";
import { Frases } from "./real-kit";
import { Fuente } from "./real1";
import { Cap, Fondo } from "./san1";
import { Ambiente, Cabeza, CabezaZoom, Chip, FONT, LineaP, ME, PC, ParesHUD, ROMANOS, Tiburon, VistaInf, pz } from "./pc-kit";

type P = { e: EscenaViralGuardada };

/* ───────────── pc0-gancho ───────────── */

export const Pc0Gancho: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const G = TPC.gancho;
  const pos = (k: number): [number, number] => (k <= 6 ? [290 + (k - 1) * 130, 820] : [290 + (k - 7) * 130, 980]);
  const nVis = Math.max(0, Math.min(12, Math.floor((t - a(G.doce)) / 0.15) + 1));
  const kUno = clamp((t - a(G.uno)) / 0.5), kAntes = clamp((t - a(G.antes)) / 0.5);
  const kCero = spr(f, a(G.cero), { damping: 9, stiffness: 190, mass: 0.8 });
  const tras = t > a(G.cero) && t < a(G.cero) + 0.7 ? Math.sin((t - a(G.cero)) * 40) * 4 * (1 - (t - a(G.cero)) / 0.7) : 0;
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={950} color={kCero > 0.2 ? PC.nervio : ME.cereb} intensidad={0.8 + 0.8 * kCero} />
        {Array.from({ length: 12 }, (_, i) => {
          const k = i + 1, [x, y] = pos(k), tk = a(G.doce) + i * 0.15, s = easeOut((t - tk) / 0.3);
          if (t < tk) return null;
          return (
            <g key={k} transform={`translate(${x} ${y}) scale(${0.4 + 0.6 * s})`} opacity={s}>
              <circle r={48} fill="#0F1A38" stroke={ME.sens} strokeWidth={4} /><circle r={48} fill={ME.sens} opacity={0.14} />
              <text y={15} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={k >= 8 && k !== 9 && k !== 10 ? 36 : 42} fill="#fff">{ROMANOS[k]}</text>
            </g>
          );
        })}
        {/* hueco del cero */}
        {kUno > 0 && (
          <g transform={`translate(${130 + tras} 820) scale(${1 + 0.3 * kCero})`} opacity={kUno}>
            <circle r={52} fill={kCero > 0.3 ? "#0E3A30" : "none"} stroke={kCero > 0.3 ? PC.nervio : "#8B97B8"} strokeWidth={kCero > 0.3 ? 6 : 4} strokeDasharray={kCero > 0.3 ? "0" : "10 10"} />
            {kCero > 0.3 && <circle r={72 + 10 * Math.sin(t * 6)} fill="none" stroke={PC.nervio} strokeWidth={3} opacity={0.45} />}
            <text y={kCero > 0.3 ? 20 : 16} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={kCero > 0.3 ? 58 : 40} fill={kCero > 0.3 ? PC.nervio : "#8B97B8"}>{kCero > 0.3 ? "0" : "?"}</text>
          </g>
        )}
        {/* flecha «viene antes» */}
        {kAntes > 0 && (
          <g opacity={kAntes * (1 - kCero * 0.4)}>
            <path d={`M ${236} 760 C 200 730 170 730 ${lerp(150, 140, kAntes)} 752`} stroke={ME.oro} strokeWidth={6} fill="none" strokeLinecap="round" />
            <path d="M 150 738 L 138 756 L 160 758" stroke={ME.oro} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        )}
        <ParesHUD y={1430} lit={nVis} cero={kCero} />
      </svg>
      <Chip x={540} y={1130} texto={kCero > 0.3 ? "lo que hay: 0 → XII" : "lo que te enseñaron: I → XII"} color={kCero > 0.3 ? PC.nervio : "#BFE0FF"} px={30} anchor="center" id="pc0-g-lista" opacidad={clamp((t - a(G.doce) - 1.5) / 0.4)} />
      <Chip x={290} y={1210} texto={"par craneal cero · nervus terminalis"} color={PC.nervio} px={26} id="pc0-g-nombre" opacidad={clamp(kCero * 2)} />
      <Frases frases={[{ t: 0.2, texto: "12 PARES\nCRANEALES", px: 100 }, { t: G.uno - 0.1, texto: "PERO HAY\nUNO MÁS", px: 100, color: ME.oro }, { t: G.cero - 0.1, texto: "EL PAR\nCRANEAL 0", px: 100, color: PC.nervio }]} y={450} x={104} id="titular-pc0-gancho" />
      <Fuente texto={`La mayoría de los textos enseña ${PC0.paresClasicos} pares craneales (I–XII); el nervio terminal se conoce como par craneal 0. Esquema, no a escala.`} y={1510} delay={G.cero} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── pc0-fritsch ───────────── */

export const Pc0Fritsch: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const F = TPC.fritsch;
  const kAnio = easeOut((t - a(F.anio)) / a(1.6)), anio = Math.round(lerp(1800, PC0.fritsch, kAnio));
  const kNom = clamp((t - a(F.nombre)) / 0.4), kNo = spr(f, a(F.personas), { damping: 10, stiffness: 190, mass: 0.8 });
  const kTib = easeOut((t - a(F.tiburon)) / 0.9), kNerv = clamp((t - a(F.tiburon) - 0.9) / 1.0);
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1000} color={kTib > 0.3 ? "#2FA89A" : ME.sens} />
        <text x={540} y={830} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={190} fill="#E6EDFF" opacity={clamp(kAnio * 4)} style={{ letterSpacing: "-0.02em" }}>{anio}</text>
        {/* cabeza humana (gris) con ✗ */}
        <g opacity={0.9}><Cabeza x={250} y={1120} s={0.62} nervio={0} olfat={0.2} t={t} /></g>
        {kNo > 0.05 && <g transform={`translate(250 1120) scale(${kNo})`}><circle r={74} fill="#3A0A14" stroke={PC.rojo} strokeWidth={9} opacity={0.92} /><path d="M -30 -30 L 30 30 M 30 -30 L -30 30" stroke="#fff" strokeWidth={13} strokeLinecap="round" /></g>}
        <Tiburon x={lerp(1300, 720, kTib)} y={1130} s={0.7} nervio={kNerv} t={t} opacidad={clamp(kTib * 3)} />
      </svg>
      <Chip x={104} y={870} texto={"GUSTAV FRITSCH"} color={ME.oro} px={36} id="pc0-f-nombre" opacidad={kNom} />
      <Chip x={104} y={920} texto={"anatomista · describe el nervio"} color="#BFE0FF" px={24} id="pc0-f-sub" opacidad={kNom} />
      <Chip x={250} y={1320} texto="EN PERSONAS" color={PC.rojo} px={26} anchor="center" id="pc0-f-no" opacidad={clamp(kNo * 2)} />
      <Chip x={720} y={1290} texto={"nervio «supernumerario»"} color={PC.nervio} px={26} anchor="center" id="pc0-f-super" opacidad={clamp((t - a(F.tiburon) - 1.6) / 0.4)} />
      <Frases frases={[{ t: 0.2, texto: "EN 1878", px: 110 }, { t: F.personas - 0.3, texto: "NO EN PERSONAS", px: 90, color: PC.rojo }, { t: F.tiburon - 0.1, texto: "SINO EN\nTIBURONES", px: 100, color: PC.nervio }]} y={450} x={104} id="titular-pc0-fritsch" />
      <Fuente texto={`Fritsch (${PC0.fritsch}) lo describió en tiburones y rayas y lo llamó «nervio supernumerario»; después se reconoció también en humanos. Esquema.`} y={1510} delay={F.tiburon} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── pc0-recorrido ───────────── */

export const Pc0Recorrido: React.FC<P> = ({ e }) => {
  const { t, a } = useReloj();
  const R = TPC.recorrido;
  const kRed = clamp((t - a(R.red)) / a(2.0)), kOl = clamp((t - a(R.olfatorio)) / 0.9);
  const kMi = clamp((t - a(R.mielina)) / 0.4), kPl = clamp((t - a(R.placa)) / 0.4), kCe = clamp((t - a(R.cerebro)) / 1.0);
  const pulso = 0.5 + 0.5 * Math.sin(t * 5);
  const act = t < a(R.placa) ? 0 : t < a(R.cerebro) ? 1 : 2;
  const prog = act === 0 ? clamp(kRed) : act === 1 ? clamp((t - a(R.placa)) / a(1.5)) : clamp((t - a(R.cerebro)) / a(1.0));
  const [bx, by] = pz(205, 28), [nx, ny] = pz(236, 66), [px, py] = pz(200, 53);
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1050} color={PC.nervio} intensidad={0.7} />
        <CabezaZoom nervio={kRed} olfat={kOl} pulso={pulso * (kRed > 0.9 ? 1 : 0.3)} hipo={kCe} t={t} />
        {kOl > 0 && <line x1={300} y1={745} x2={bx} y2={by} stroke={PC.olfat} strokeWidth={3} opacity={kOl * 0.7} />}
        {kMi > 0 && <line x1={700} y1={745} x2={nx} y2={ny} stroke={PC.nervio} strokeWidth={3} opacity={kMi * 0.7} />}
        {kPl > 0 && <line x1={300} y1={1215} x2={px} y2={py} stroke={ME.oro} strokeWidth={3} opacity={kPl * 0.6} strokeDasharray="8 8" />}
        <LineaP y={1430} activo={act} prog={prog} />
      </svg>
      <Chip x={104} y={690} texto={"NERVIO OLFATORIO\npar I"} color={PC.olfat} px={24} id="pc0-r-olf" opacidad={kOl} />
      <Chip x={600} y={690} texto={"PAR 0 · sin mielina\nfibras finísimas"} color={PC.nervio} px={24} id="pc0-r-par0" opacidad={clamp((t - a(R.red) - 0.4) / 0.4)} />
      <Chip x={104} y={1190} texto={"LÁMINA\nCRIBOSA"} color={ME.oro} px={24} id="pc0-r-lam" opacidad={kPl} />
      <Frases frases={[{ t: 0.2, texto: "FIBRAS FINÍSIMAS", px: 84 }, { t: R.olfatorio - 0.1, texto: "JUNTO AL\nOLFATORIO", px: 90, color: PC.olfat }, { t: R.placa - 0.1, texto: "CRUZA LA\nLÁMINA CRIBOSA", px: 80, color: ME.oro }]} y={450} x={104} id="titular-pc0-recorrido" />
      <Fuente texto="El nervio terminal es un plexo de fibras amielínicas que acompaña al nervio olfatorio y cruza la lámina cribosa del etmoides. Esquema, no a escala." y={1510} delay={R.placa} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── pc0-numero ───────────── */

export const Pc0Numero: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const N = TPC.numero;
  const kRes = clamp((t - a(0.2)) / a(1.0)), k0 = clamp((t - a(N.bautizo)) / 1.0), kAn = clamp((t - a(N.ochenta)) / 0.4);
  const kDel = clamp((t - a(N.delante)) / 0.6), k1 = clamp((t - a(N.olfatorio - 1.6)) / 1.0), k2 = clamp((t - a(N.olfatorio)) / 0.8);
  const kSel = spr(f, a(N.olfatorio), { damping: 10, stiffness: 180, mass: 0.8 });
  const CXv = 540, CYv = 1010, S = 0.95;
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1010} color={ME.cereb} />
        <VistaInf x={CXv} y={CYv} s={S} c0={k0} c1={k1} c2={k2 * 0.9} resto={kRes} t={t} />
        {/* flecha «delante» */}
        {kDel > 0 && (
          <g opacity={kDel}>
            <path d={`M 160 1260 L 160 ${lerp(1260, 930, easeOut(kDel))}`} stroke={ME.oro} strokeWidth={7} strokeLinecap="round" />
            <path d="M 134 960 L 160 920 L 186 960" stroke={ME.oro} strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={clamp(kDel * 2 - 0.8)} />
          </g>
        )}
        {/* guías */}
        {k0 > 0.6 && <line x1={300} y1={790} x2={CXv - 24} y2={CYv - 0.95 * 262} stroke={PC.nervio} strokeWidth={3} opacity={0.7} />}
        {k1 > 0.8 && <line x1={760} y1={800} x2={CXv + 0.95 * 62} y2={CYv - 0.95 * 190} stroke={PC.olfat} strokeWidth={3} opacity={0.7} />}
        <ParesHUD y={1430} lit={kSel > 0.5 ? 2 : k0 > 0.5 ? 1 : 0} cero={k0} />
      </svg>
      <Chip x={104} y={750} texto={"PAR 0"} color={PC.nervio} px={34} id="pc0-n-0" opacidad={clamp(k0 * 2)} />
      <Chip x={976} y={760} texto={"PAR I · olfatorio"} color={PC.olfat} px={28} anchor="right" id="pc0-n-1" opacidad={clamp(k1 * 2)} />
      <Chip x={976} y={1120} texto={"PAR II\nóptico"} color={ME.oro} px={26} anchor="right" id="pc0-n-2" opacidad={k2} />
      <Chip x={196} y={1236} texto="DELANTE" color={ME.oro} px={26} id="pc0-n-del" opacidad={kDel} />
      <Chip x={976} y={1260} texto={"nombre propuesto a\nfinales de los años 80"} color="#BFE0FF" px={24} anchor="right" id="pc0-n-80" opacidad={kAn} />
      <Frases frases={[{ t: 0.2, texto: "POR QUÉ\nSE LLAMA 0", px: 100 }, { t: N.delante - 0.1, texto: "VA POR DELANTE\nDEL PAR I", px: 80, color: ME.oro }]} y={450} x={104} id="titular-pc0-numero" />
      <Fuente texto="Vista inferior esquemática del cerebro (el frente arriba): el par 0 queda por delante de los bulbos olfatorios (par I). Solo se dibujan algunos pares; no a escala." y={1510} delay={N.delante} />
      <Cap e={e} />
    </Fondo>
  );
};
