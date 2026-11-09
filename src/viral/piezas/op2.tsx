/**
 * «El nervio óptico: la parte del cerebro que sale a mirar» (SINAPSIS · pares craneales) · escenas 2/2
 *   op-regenera  al ser parte del cerebro no se regenera, a diferencia del olfatorio: en el glaucoma las fibras perdidas no vuelven
 *   op-genes     2020: tres genes reprograman las células del nervio óptico en ratones y mejoran su visión
 *   op-ensayo    hoy un ensayo de fase 1 prueba esa idea en personas con glaucoma: primeros datos de octubre de 2026, bien tolerada
 *   op-temprano  es muy temprano: el objetivo es la seguridad, con tres personas, y aún no demuestra que devuelva la vista (cierre)
 * Dibujos esquemáticos de anatomía; no son imágenes médicas reales.
 */
import React from "react";
import { OP, TOP } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeOut, lerp, spr, useReloj } from "../comun";
import { Frases } from "./real-kit";
import { Fuente } from "./real1";
import { Cap, Fondo } from "./san1";
import { Ambiente, Cerebro, Chip, FONT, Helice, ME, MONOF, NUEVA, OPC, Ojo, PC, Persona, Raton, mezclar, sua } from "./op-kit";
import { Neurona, OLC } from "./ol-kit";

type P = { e: EscenaViralGuardada };

/* ───────────── op-regenera ───────────── */

export const OpRegenera: React.FC<P> = ({ e }) => {
  const { t, a } = useReloj();
  const R = TOP.regenera;
  const kPa = clamp((t - a(R.parte)) / 0.6), kNo = clamp((t - a(R.noRegenera)) / 0.4), kOl = clamp((t - a(R.olfatorio)) / 0.5), kGl = clamp((t - a(R.glaucoma)) / 0.4);
  const p = (((t - a(R.olfatorio)) * 0.4) % 1 + 1) % 1;
  const muerta = p < 0.5 ? sua(p, 0.15, 0.45) : 0, nace = p < 0.5 ? 1 : clamp((p - 0.5) / 0.4);
  const ys = Array.from({ length: 9 }, (_, i) => 1062 + i * 20);
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1050} color={kGl > 0.2 ? OPC.rojo : OPC.cereb} intensidad={0.7} />
        {/* olfatorio: renace */}
        <g opacity={kOl}>
          <Neurona x={200} y={790} s={0.8} color={OLC[5]} muerta={muerta} nace={t > a(R.olfatorio) ? nace : 1} t={t} brillo={0.5} />
          <rect x={96} y={880} width={888} height={4} rx={2} fill={NUEVA} opacity={0.5} />
        </g>
        {/* óptico: no vuelve */}
        <g opacity={kPa}>
          <Ojo x={170} y={1142} r={58} iris="#4FA3FF" t={t} />
          {ys.map((y, i) => {
            const td = a(R.glaucoma) + i * 0.17, muerto = t > td, kD = clamp((t - td) / 0.35);
            return (
              <g key={i}>
                <line x1={236} y1={y} x2={560} y2={y} stroke={muerto ? mezclar("#4FA3FF", "#4A5470", kD) : "#4FA3FF"} strokeWidth={9} strokeLinecap="round" />
                <line x1={560} y1={y} x2={930} y2={y} stroke="#4FA3FF" strokeWidth={9} strokeLinecap="round" opacity={muerto ? 0.12 + 0.88 * (1 - kD) : 1} strokeDasharray={muerto ? "2 14" : "0"} />
                {muerto && <g transform={`translate(560 ${y})`} opacity={kD}><circle r={9} fill="#3A0A14" stroke={PC.rojo} strokeWidth={3} /></g>}
                {!muerto && kPa > 0.9 && <circle cx={236 + ((t * 260 + i * 70) % 690)} cy={y} r={6} fill="#fff" opacity={0.85} />}
              </g>
            );
          })}
          {kGl > 0 && [-1, 0, 1].map((k) => <path key={k} d={`M ${60} ${1142 + k * 60} L ${104} ${1142 + k * 40}`} stroke={OPC.rojo} strokeWidth={7} strokeLinecap="round" opacity={kGl} />)}
        </g>
      </svg>
      <Chip x={330} y={760} texto={"OLFATORIO\nrenace ✓"} color={NUEVA} px={26} id="op-r-ol" opacidad={kOl} />
      <Chip x={104} y={950} texto={"ÓPTICO · parte del cerebro: no regenera"} color={OPC.rojo} px={22} id="op-r-op" opacidad={kNo} />
      <Chip x={976} y={1290} texto={"las fibras perdidas no vuelven"} color={OPC.rojo} px={24} anchor="right" id="op-r-no" opacidad={kGl} />
      <Chip x={104} y={1290} texto={"GLAUCOMA"} color={OPC.dato} px={24} id="op-r-gl" opacidad={kGl} />
      <Frases frases={[{ t: 0.2, texto: "AL SER PARTE\nDEL CEREBRO", px: 88 }, { t: R.noRegenera - 0.1, texto: "NO SE\nREGENERA", px: 100, color: OPC.rojo }, { t: R.olfatorio - 0.1, texto: "A DIFERENCIA\nDEL OLFATORIO", px: 84, color: NUEVA }, { t: R.glaucoma - 0.1, texto: "FIBRAS PERDIDAS:\nNO VUELVEN", px: 78, color: OPC.rojo }]} y={450} x={104} id="titular-op-regenera" />
      <Fuente texto="Los axones del nervio óptico son del sistema nervioso central: en mamíferos adultos casi no se regeneran tras una lesión; en el glaucoma, las células ganglionares perdidas no se reemplazan. Esquema." y={1510} delay={R.noRegenera} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── op-genes ───────────── */

export const OpGenes: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const G = TOP.genes;
  const kAn = clamp((t - a(G.anio)) / 0.4), kRa = clamp((t - a(G.ratones)) / 0.5);
  const kOsk = (i: number): number => spr(f, a(G.tres) + i * 0.2, { damping: 9, stiffness: 190, mass: 0.8 });
  const kRe = clamp((t - a(G.rejuvenece)) / a(1.5)), kMe = clamp((t - a(G.mejora)) / 0.5);
  const kAx = easeOut((t - a(G.rejuvenece) - 0.8) / a(2.2));
  const marcas = 1 - kRe;
  const letras: [string, string][] = [["O", "#FF6A8A"], ["S", "#FFD166"], ["K", "#7BE08A"]];
  const axFin = lerp(470, 880, kAx);
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1050} color={kRe > 0.3 ? "#4FD6D0" : OPC.cereb} intensidad={0.8} />
        <g opacity={kRa}><Raton x={840} y={760} s={0.62} /></g>
        <Helice x0={110} x1={970} y={940} amp={40} marcas={marcas} color={mezclar("#8FA3C8", "#4FD6D0", kRe)} t={t} />
        {letras.map(([l, c], i) => {
          const k = kOsk(i), subida = clamp((kRe * 2.2) - i * 0.15), yy = lerp(1090, 975, easeOut(subida));
          return k > 0.02 ? (
            <g key={l} transform={`translate(${330 + i * 210} ${yy}) scale(${k})`} opacity={1 - clamp(kRe * 1.6 - 0.8)}>
              <circle r={46} fill="#0F1730" stroke={c} strokeWidth={6} /><text y={16} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={50} fill={c}>{l}</text>
            </g>
          ) : null;
        })}
        {/* célula ganglionar y su axón */}
        <g opacity={kRa}>
          <Neurona x={240} y={1250} s={0.6} color={kRe > 0.5 ? "#4FD6D0" : "#8B97B8"} t={t} />
          <line x1={240} y1={1250} x2={470} y2={1250} stroke={kRe > 0.5 ? "#4FD6D0" : "#8B97B8"} strokeWidth={8} strokeLinecap="round" />
          {kAx < 0.02 && <g transform="translate(470 1250)"><circle r={14} fill="#3A0A14" stroke={PC.rojo} strokeWidth={4} /><path d="M -5 -5 L 5 5 M 5 -5 L -5 5" stroke="#fff" strokeWidth={4} strokeLinecap="round" /></g>}
          {kAx > 0.02 && <><line x1={470} y1={1250} x2={axFin} y2={1250} stroke={NUEVA} strokeWidth={8} strokeLinecap="round" strokeDasharray={kAx < 1 ? "3 9" : "0"} /><circle cx={axFin} cy={1250} r={10} fill={NUEVA} stroke="#fff" strokeWidth={2} /></>}
          <Cerebro x={930} y={1250} s={0.32} brillo={0.3 + 0.7 * kMe} apagado={0} t={t} />
        </g>
      </svg>
      <Chip x={104} y={700} texto={"2020 · NATURE"} color={OPC.dato} px={28} id="op-ge-n" opacidad={kAn} />
      <Chip x={976} y={850} texto={"EN RATONES"} color={"#C8D2E8"} px={24} anchor="right" id="op-ge-r" opacidad={kRa} />
      <Chip x={540} y={1160} texto={"OCT4 · SOX2 · KLF4 (OSK)"} color={OPC.dato} px={22} anchor="center" id="op-ge-osk" opacidad={clamp(kOsk(0) * 2)} />
      <Chip x={104} y={1330} texto={"marcas epigenéticas ●  borradas"} color={OPC.rojo} px={20} id="op-ge-mar" opacidad={clamp(kRe * 2)} />
      <Chip x={976} y={1330} texto={"la fibra vuelve a crecer"} color={NUEVA} px={22} anchor="right" id="op-ge-fib" opacidad={clamp(kAx * 3)} />
      <Frases frases={[{ t: 0.2, texto: "EN 2020", px: 110 }, { t: G.ratones - 0.1, texto: "EN RATONES", px: 100, color: "#C8D2E8" }, { t: G.tres - 0.1, texto: "TRES GENES", px: 100, color: OPC.dato }, { t: G.rejuvenece - 0.1, texto: "REJUVENECEN\nLAS CÉLULAS", px: 84, color: "#4FD6D0" }, { t: G.mejora - 0.1, texto: "MEJORÓ SU\nVISIÓN", px: 90, color: NUEVA }]} y={450} x={104} id="titular-op-genes" />
      <Fuente texto={`Lu y cols., Nature, ${OP.reprogramacion.anio}: tres factores de reprogramación (OSK) en células ganglionares de la retina de ratones; regeneración axonal tras lesión y mejora de la visión en glaucoma murino. Solo ratones. Esquema.`} y={1510} delay={G.ratones} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── op-ensayo ───────────── */

export const OpEnsayo: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const E = TOP.ensayo;
  const hitos: [string, string, number][] = [["2020", "Nature · ratones", E.hoy], ["2026", "luz verde de la FDA", 1.3], ["JUN 2026", "primer paciente", E.personas], ["8 OCT 2026", "primeros datos", E.octubre]];
  const xs = [200, 430, 660, 880];
  const kLin = clamp((t - a(E.hoy)) / a(E.octubre + 0.6));
  const kPe = (i: number): number => spr(f, a(E.personas) + 0.4 * i, { damping: 10, stiffness: 190, mass: 0.8 });
  const kInj = easeOut((t - a(E.personas - 0.4)) / 1.0), kTo = clamp((t - a(E.tolerada)) / 0.5);
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1050} color={kTo > 0.3 ? NUEVA : OPC.dato} intensidad={0.7} />
        <line x1={xs[0]} y1={800} x2={xs[3]} y2={800} stroke="#BFE0FF" strokeOpacity={0.22} strokeWidth={6} strokeLinecap="round" />
        <line x1={xs[0]} y1={800} x2={lerp(xs[0], xs[3], easeOut(kLin))} y2={800} stroke={OPC.dato} strokeWidth={6} strokeLinecap="round" />
        {hitos.map(([, , tt], i) => <circle key={i} cx={xs[i]} cy={800} r={lerp(0, i === 3 ? 20 : 15, easeOut((t - a(tt)) / 0.4))} fill={i === 3 ? NUEVA : OPC.dato} stroke="#fff" strokeWidth={4} />)}
        <Ojo x={540} y={1120} r={96} iris="#4FA3FF" brillo={kTo} t={t} />
        {/* jeringa */}
        <g transform={`translate(${lerp(820, 640, kInj)} ${lerp(930, 1060, kInj)}) rotate(-35)`} opacity={clamp(kInj * 3)}>
          <rect x={-10} y={-120} width={20} height={150} rx={6} fill="#C8D2E8" stroke="#5C6A90" strokeWidth={3} /><rect x={-4} y={-16} width={8} height={30} fill={OPC.dato} />
          <rect x={-18} y={-132} width={36} height={12} rx={4} fill="#8B97B8" /><rect x={-3} y={30} width={6} height={50} fill="#C8D2E8" />
        </g>
        {[0, 1, 2].map((i) => <Persona key={i} x={400 + i * 140} y={1318} s={0.6} color={kTo > 0.3 ? "#9CE8C4" : OPC.gris} brillo={kTo} />).map((el, i) => <g key={i} opacity={clamp(kPe(i) * 2)}>{el}</g>)}
      </svg>
      {hitos.map(([y, d, tt], i) => {
        const k = clamp((t - a(tt)) / 0.4);
        return (
          <React.Fragment key={i}>
            <Chip x={xs[i]} y={i % 2 ? 716 : 836} texto={y} color={i === 3 ? NUEVA : OPC.dato} px={28} anchor="center" id={`op-e-y${i}`} opacidad={k} />
            <Chip x={xs[i]} y={i % 2 ? 756 : 874} texto={d} color="#BFE0FF" px={20} anchor="center" id={`op-e-d${i}`} opacidad={k} />
          </React.Fragment>
        );
      })}
      <Chip x={104} y={1000} texto={"FASE 1\nseguridad"} color={OPC.dato} px={24} id="op-e-f1" opacidad={clamp((t - a(E.hoy + 1.2)) / 0.4)} />
      <Chip x={976} y={1000} texto={"inyección única\nen el ojo"} color="#BFE0FF" px={22} anchor="right" id="op-e-iny" opacidad={clamp(kInj * 2)} />
      <Chip x={104} y={1230} texto={"3 PERSONAS\ncon glaucoma"} color="#BFE0FF" px={20} id="op-e-3" opacidad={clamp(kPe(0) * 2)} />
      <Chip x={976} y={1290} texto={"BIEN TOLERADA\nhasta el día 56"} color={NUEVA} px={22} anchor="right" id="op-e-tol" opacidad={kTo} />
      <Frases frases={[{ t: 0.2, texto: "HOY: ENSAYO\nDE FASE 1", px: 88 }, { t: E.personas - 0.1, texto: "EN PERSONAS\nCON GLAUCOMA", px: 84, color: OPC.dato }, { t: E.octubre - 0.1, texto: "BIEN\nTOLERADA", px: 100, color: NUEVA }]} y={450} x={104} id="titular-op-ensayo" />
      <Fuente texto={`Ensayo de fase ${OP.ensayo.fase} de ER-100 (Life Biosciences, NCT07290244): datos intermedios del 8 de octubre de 2026 en ${OP.ensayo.participantes} personas, sin toxicidad limitante hasta el día ${OP.ensayo.diasSeguimiento}. Resumen de prensa de la empresa. Esquema.`} y={1510} delay={E.octubre} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── op-temprano ───────────── */

export const OpTemprano: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const T2 = TOP.temprano;
  const pasos: [string, string, string][] = [["RATONES", "✓", NUEVA], ["FASE 1\nSEGURIDAD", "aquí", OPC.dato], ["FASE 2\n¿FUNCIONA?", "?", OPC.gris], ["FASE 3", "?", OPC.gris], ["APROBACIÓN", "?", OPC.gris]];
  const kSt = (i: number): number => clamp((t - a(0.2) - i * 0.18) / 0.5);
  const kSe = clamp((t - a(T2.seguridad)) / 0.5), kTres = clamp((t - a(T2.tres)) / 0.5), kNo = spr(f, a(T2.noDemuestra), { damping: 9, stiffness: 190, mass: 0.8 });
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1050} color={OPC.dato} intensidad={0.6} />
        {pasos.map(([n, m, c], i) => {
          const k = easeOut(kSt(i)), h = 90 + i * 60, x = 110 + i * 170, base = 1280, act = i === 1;
          return (
            <g key={i} opacity={clamp(k * 2)}>
              <rect x={x} y={base - h * k} width={160} height={h * k} rx={14} fill={act ? mezclar("#141C3C", OPC.dato, 0.25 + 0.15 * kSe) : i === 0 ? mezclar("#141C3C", NUEVA, 0.25) : "#141C3C"} stroke={c} strokeWidth={act ? 6 : 4} strokeDasharray={i >= 2 ? "10 8" : "0"} />
              <text x={x + 80} y={base - h * k + 52} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={m === "aquí" ? 26 : 46} fill={c} opacity={i >= 2 ? 0.5 + 0.4 * Math.sin(t * 4 + i) : 1}>{m}</text>
            </g>
          );
        })}
        {[0, 1, 2].map((i) => <Persona key={i} x={310 + i * 52} y={1266} s={0.38} color={OPC.dato} brillo={kTres} />).map((el, i) => <g key={i} opacity={clamp(kTres * 3 - i * 0.5)}>{el}</g>)}
        <g transform={`translate(540 760) rotate(-4) scale(${kNo})`} opacity={clamp(kNo * 2)}>
          <rect x={-380} y={-58} width={760} height={116} rx={14} fill="rgba(58,10,20,0.94)" stroke={PC.rojo} strokeWidth={6} />
          <text y={-6} textAnchor="middle" fontFamily={MONOF} fontWeight={800} fontSize={32} fill={PC.rojo}>AÚN NO DEMUESTRA QUE</text>
          <text y={36} textAnchor="middle" fontFamily={MONOF} fontWeight={800} fontSize={32} fill={PC.rojo}>DEVUELVA LA VISTA</text>
        </g>
      </svg>
      {pasos.map(([n, , c], i) => <Chip key={i} x={110 + i * 170 + 80} y={1288 - (90 + i * 60) - 74 + 0} texto={n} color={c} px={18} anchor="center" id={`op-t-p${i}`} opacidad={clamp(kSt(i) * 2)} />)}
      <Chip x={540} y={1340} texto={"objetivo: seguridad · 3 personas"} color="#BFE0FF" px={22} anchor="center" id="op-t-obj" opacidad={kSe} />
      <Frases frases={[{ t: 0.2, texto: "ES MUY\nTEMPRANO", px: 100 }, { t: T2.seguridad - 0.1, texto: "OBJETIVO:\nSEGURIDAD", px: 96, color: OPC.dato }, { t: T2.noDemuestra - 0.1, texto: "AÚN NO\nHAY PRUEBA", px: 100, color: PC.rojo }]} y={450} x={104} id="titular-op-temprano" />
      <Fuente texto={`Fase 1 = seguridad (${OP.ensayo.participantes} personas hasta ahora); la eficacia no está demostrada. Los resultados en ratones no garantizan lo mismo en humanos. No es consejo médico.`} y={1510} delay={T2.noDemuestra} />
      <Cap e={e} />
    </Fondo>
  );
};
