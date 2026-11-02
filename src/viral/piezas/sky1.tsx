/**
 * «Así se construye una piscina a 35 m» (IMNOBA · figuras realistas) · escenas 1/2
 *   sky-gancho   150 t de agua a 35 m de altura entre dos edificios y nada debajo (la Sky Pool de Embassy Gardens, Londres)
 *   sky-espesor  paso 1: el acrílico flexiona más que el vidrio, así que es grueso (paredes 18 cm, fondo 36 cm > una regla de 30 cm) y resiste 31 kPa
 *   sky-union    paso 2: se fabrica en secciones que se unen con juntas adhesivas transparentes (estructura ≈ 50 t)
 */
import React from "react";
import { SKY, TSK, presionKPa } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeInOut, easeOut, lerp, spr, useReloj } from "../comun";
import { Cota, Estudio, FONT, Frases, MONOF, Persona, RE, Torre } from "./real-kit";
import { Dato, Fuente } from "./real1";
import { Chip } from "./med1";
import { Bloque, Piscina, Regla, SK } from "./sky-kit";

type P = { e: EscenaViralGuardada };

/* ───────────── sky-gancho ───────────── */

export const SkyGancho: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const T = TSK.gancho;
  const ESC = 22, PISO = 1330;
  const yFondo = PISO - SKY.alturaM * ESC; // base de la piscina a 35 m
  const xi = 375, xd = 705; // caras de los edificios que miran al hueco (15 m)
  const largo = SKY.longitudM * ESC;
  const x0 = 540 - largo / 2, x1 = 540 + largo / 2;
  const alto = SKY.profundidadM * ESC;
  const sTorre = (i: number): number => spr(f, a(T.torres + i * 0.14), { damping: 17, stiffness: 110, mass: 0.9 });
  const entra = easeOut((t - a(T.piscina)) / a(0.7));
  const nivel = easeInOut((t - a(T.agua)) / a(T.aguaDur));
  const cota = easeOut((t - a(T.cota)) / a(0.9));
  const sPer = spr(f, a(T.cota + 0.3));
  const toneladas = SKY.aguaTon * nivel;
  return (
    <Estudio piso={PISO} resplandor={0.5}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g opacity={clamp(sTorre(0) * 2)} transform={`translate(0 ${(1 - sTorre(0)) * 70})`}>
          <Torre x={xi - 210} y={PISO} w={420} h={40 * ESC} semilla={4} luz={0.5} tono="#3A6FA0" lado={0.06} />
        </g>
        <g opacity={clamp(sTorre(1) * 2)} transform={`translate(0 ${(1 - sTorre(1)) * 70})`}>
          <Torre x={xd + 210} y={PISO} w={420} h={40 * ESC} semilla={9} luz={0.42} tono="#2F5F8A" lado={0.06} />
        </g>
        {entra > 0.01 && (
          <g opacity={clamp(entra * 1.5)} transform={`translate(0 ${(1 - entra) * -24})`}>
            <Piscina x0={x0} x1={x1} yFondo={yFondo} alto={alto} fondo={0.36 * ESC} pared={Math.max(5, 0.18 * ESC)} nivel={nivel} t={t} />
          </g>
        )}
        <g opacity={sPer}><Persona x={470} y={PISO + 6} s={0.23} fase={0} /></g>
        <Cota x={540} y0={PISO} y1={yFondo + alto} texto="35 m" progreso={cota} />
      </svg>
      <Frases frases={[{ t: 0.02, texto: "150 toneladas\nde agua", px: 90 }, { t: T.nada, texto: "35 m de altura,\nsin nada debajo", color: RE.oro, px: 72 }]} y={350} />
      <Dato valor={toneladas} x={W / 2} y={1465} px={150} digitos={3} sufijo=" t de agua" id="sky-ton" opacidad={clamp((t - a(T.agua)) / 0.4)} />
      <Chip texto="¿cómo se construye?" x={W / 2} y={1572} color={RE.oro} id="sky-como" ancho={520} opacidad={clamp((t - a(T.chip)) / 0.35)} />
      <Fuente texto="Sky Pool, Embassy Gardens (Londres) · ≈ 150 t: IStructE · esquema a escala" delay={0.8} />
    </Estudio>
  );
};

/* ───────────── sky-espesor ───────────── */

export const SkyEspesor: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const T = TSK.espesor;
  const X0 = 240, X1 = 840, YF = 1100, FONDO = 61, PARED = 30, ALTO = 601;
  const yTope = YF - ALTO; // 499
  const seccion = spr(f, a(T.seccion), { damping: 16, stiffness: 120, mass: 0.8 });
  const nivel = easeInOut((t - a(T.agua)) / a(T.aguaDur));
  const pres = easeOut((t - a(T.presion)) / a(T.presionDur));
  const kpa = presionKPa(SKY.profundidadM);
  const ib = YF - FONDO; // cara interior del fondo
  const flechas = Array.from({ length: 7 }, (_, i) => {
    const d = ((i + 0.6) / 7.2) * SKY.profundidadM; // profundidad (m)
    return { y: ib - (SKY.profundidadM - d) * (540 / SKY.profundidadM), L: 175 * (d / SKY.profundidadM) };
  });
  const barra = (ini: number): number => easeOut((t - a(ini)) / a(0.55));
  const bPared = barra(T.barras), bRegla = barra(T.barras + 0.35), bFondo = barra(T.barras + 0.7);
  const PXCM = 15, BX = 330;
  const filas = [
    { y: 1296, k: bPared, etq: "pared", val: `${SKY.paredCm} cm`, w: SKY.paredCm * PXCM * bPared, c: SK.borde },
    { y: 1384, k: bRegla, etq: "regla", val: `${SKY.reglaCm} cm`, w: SKY.reglaCm * PXCM * bRegla, c: "#E6EBF0" },
    { y: 1472, k: bFondo, etq: "fondo", val: `${SKY.fondoCm} cm`, w: SKY.fondoCm * PXCM * bFondo, c: RE.oro },
  ];
  return (
    <Estudio piso={1610} resplandor={0.45}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g opacity={clamp(seccion * 2)} transform={`translate(0 ${(1 - seccion) * 40})`}>
          <Piscina x0={X0} x1={X1} yFondo={YF} alto={ALTO} fondo={FONDO} pared={PARED} nivel={nivel} t={t} />
          {/* marcas de espesor sobre el corte */}
          {t >= a(T.pared) && <g opacity={easeOut((t - a(T.pared)) / a(0.4))}><rect x={X1 - PARED} y={yTope - 22} width={PARED} height={8} fill={SK.borde} /><line x1={X1 - PARED} y1={yTope - 28} x2={X1 - PARED} y2={yTope - 6} stroke={SK.borde} strokeWidth={3} /><line x1={X1} y1={yTope - 28} x2={X1} y2={yTope - 6} stroke={SK.borde} strokeWidth={3} /></g>}
          {t >= a(T.fondo) && <g opacity={easeOut((t - a(T.fondo)) / a(0.4))}><line x1={X1 + 24} y1={ib} x2={X1 + 24} y2={YF} stroke={RE.oro} strokeWidth={5} /><line x1={X1 + 10} y1={ib} x2={X1 + 38} y2={ib} stroke={RE.oro} strokeWidth={4} /><line x1={X1 + 10} y1={YF} x2={X1 + 38} y2={YF} stroke={RE.oro} strokeWidth={4} /></g>}
        </g>
        {/* presión hidrostática: flechas hacia las paredes, más largas con la profundidad */}
        {pres > 0.01 && (
          <g opacity={clamp(pres * 2)}>
            {flechas.map((fl, i) => {
              const L = fl.L * clamp(pres * 1.3 - i * 0.04);
              const xr = X1 - PARED - 6, xl = X0 + PARED + 6;
              return (
                <g key={i} stroke={RE.rojo} strokeWidth={5} strokeLinecap="round" fill={RE.rojo}>
                  <line x1={xr - L} y1={fl.y} x2={xr - 14} y2={fl.y} /><polygon points={`${xr},${fl.y} ${xr - 20},${fl.y - 10} ${xr - 20},${fl.y + 10}`} stroke="none" />
                  <line x1={xl + L} y1={fl.y} x2={xl + 14} y2={fl.y} /><polygon points={`${xl},${fl.y} ${xl + 20},${fl.y - 10} ${xl + 20},${fl.y + 10}`} stroke="none" />
                </g>
              );
            })}
            <polyline points={`${X1 - PARED - 6},${yTope + 30} ${X1 - PARED - 6 - 175 * pres},${ib - 6}`} stroke={RE.rojo} strokeOpacity={0.6} strokeWidth={3} strokeDasharray="8 8" fill="none" />
            <polyline points={`${X0 + PARED + 6},${yTope + 30} ${X0 + PARED + 6 + 175 * pres},${ib - 6}`} stroke={RE.rojo} strokeOpacity={0.6} strokeWidth={3} strokeDasharray="8 8" fill="none" />
          </g>
        )}
      </svg>
      <Frases frases={[{ t: 0.2, texto: "paso 1:\nacrílico grueso", px: 80 }, { t: T.fondo - 0.3, texto: "fondo: 36 cm,\nmás que una regla", color: RE.oro, px: 66 }]} y={352} ancho={800} />
      <Chip texto={`${kpa.toFixed(0)} kPa en el fondo`.replace(".", ",")} x={W / 2} y={1170} color={RE.rojo} id="sky-kpa" ancho={440} opacidad={clamp((t - a(T.kpa)) / 0.35)} />
      {/* barras comparativas a la misma escala (15 px por cm) */}
      {filas.map((fl, i) => (
        <React.Fragment key={i}>
          <div data-texto={`sky-etq${i}`} style={{ position: "absolute", left: 104, top: fl.y + 28, transform: "translateY(-50%)", fontFamily: MONOF, fontWeight: 700, fontSize: 30, color: RE.hielo, opacity: clamp(fl.k * 3) }}>{fl.etq}</div>
          <div data-texto={`sky-val${i}`} style={{ position: "absolute", left: BX + fl.w + 18, top: fl.y + 28, transform: "translateY(-50%)", fontFamily: FONT, fontWeight: 800, fontSize: 44, color: i === 2 ? RE.oro : RE.blanco, opacity: clamp(fl.k * 3), whiteSpace: "nowrap" }}>{fl.val}</div>
        </React.Fragment>
      ))}
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        {filas[0].k > 0.01 && <g><rect x={BX} y={filas[0].y} width={filas[0].w} height={56} rx={5} fill={SK.acrilico} fillOpacity={0.3} stroke={SK.borde} strokeWidth={3} /></g>}
        {filas[1].k > 0.01 && <Regla x={BX} y={filas[1].y} cm={SKY.reglaCm} pxCm={PXCM} alto={56} k={bRegla} />}
        {filas[2].k > 0.01 && <g><rect x={BX} y={filas[2].y} width={filas[2].w} height={56} rx={5} fill={SK.acrilico} fillOpacity={0.34} stroke={RE.oro} strokeWidth={4} /></g>}
        {bFondo > 0.5 && <line x1={BX + SKY.reglaCm * PXCM} y1={1372} x2={BX + SKY.reglaCm * PXCM} y2={1540} stroke={RE.oro} strokeWidth={2.5} strokeDasharray="6 7" opacity={clamp((bFondo - 0.5) * 3)} />}
      </svg>
      <Fuente texto="Paredes ≈ 18 cm y fondo ≈ 36 cm: Eckersley O'Callaghan, Ballymore · presión = ρ·g·h (cálculo propio)" delay={1} />
    </Estudio>
  );
};

/* ───────────── sky-union ───────────── */

export const SkyUnion: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const T = TSK.union;
  const sA = spr(f, a(T.bloques), { damping: 16, stiffness: 120, mass: 0.8 });
  const sB = spr(f, a(T.bloques + 0.1), { damping: 16, stiffness: 120, mass: 0.8 });
  const cierra = easeInOut((t - a(T.cierra)) / a(T.cierraDur));
  const brilla = clamp((t - a(T.junta)) / a(0.5)) * (1 - clamp((t - a(T.borra)) / a(0.9)) * 0.85);
  const pulso = 0.75 + 0.25 * Math.sin(t * 9);
  const BW = 330, BH = 300, D = 110, YB = 880, XA = 120;
  const xB = XA + BW + lerp(190, 0, cierra);
  const seccion = (i: number): number => spr(f, a(T.viga + i * 0.13), { damping: 15, stiffness: 140, mass: 0.7 });
  const peso = easeOut((t - a(T.peso)) / a(T.pesoDur));
  const xs = [150, 150 + 190, 150 + 380, 150 + 570];
  const yViga = 1290;
  return (
    <Estudio piso={1330} resplandor={0.45}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g opacity={clamp(sA * 2)} transform={`translate(${(1 - sA) * -60} 0)`}><Bloque x={XA} y={YB} w={BW} h={BH} d={D} /></g>
        <g opacity={clamp(sB * 2)}><Bloque x={xB} y={YB} w={BW} h={BH} d={D} /></g>
        {/* junta adhesiva: línea dorada que luego se vuelve casi invisible */}
        {cierra > 0.98 && (
          <g opacity={1}>
            <line x1={XA + BW} y1={YB - BH} x2={XA + BW} y2={YB} stroke={RE.oro} strokeWidth={9 * brilla + 1.4} strokeOpacity={brilla * pulso * 0.95 + 0.1} strokeLinecap="round" />
            <polyline points={`${XA + BW},${YB - BH} ${XA + BW + D},${YB - BH - D * 0.55}`} stroke={RE.oro} strokeWidth={7 * brilla + 1} strokeOpacity={brilla * pulso * 0.9 + 0.08} fill="none" strokeLinecap="round" />
            <line x1={XA + BW} y1={YB - BH} x2={XA + BW} y2={YB} stroke="#fff" strokeWidth={2} strokeOpacity={brilla * 0.7} />
          </g>
        )}
        {/* viga completa en cuatro secciones */}
        {xs.map((x, i) => (
          <g key={i} opacity={clamp(seccion(i) * 2)} transform={`translate(0 ${(1 - seccion(i)) * 40})`}><Bloque x={x} y={yViga} w={190} h={78} d={44} canal={false} /></g>
        ))}
        {xs.slice(1).map((x, i) => <line key={i} x1={x} y1={yViga - 78} x2={x} y2={yViga} stroke={RE.oro} strokeWidth={2.4} strokeOpacity={0.5 * clamp(seccion(i + 1) * 2)} />)}
        <g opacity={seccion(3)}><Persona x={96} y={yViga} s={0.24} fase={0} /></g>
      </svg>
      <Frases frases={[{ t: 0.2, texto: "paso 2:\nunir secciones", px: 80 }, { t: T.borra - 0.2, texto: "junta adhesiva\ntransparente", color: RE.oro, px: 66 }]} y={352} ancho={800} />
      <Chip texto="sin uniones mecánicas" x={W / 2} y={985} color={RE.hielo} id="sky-junta" ancho={520} opacidad={clamp((t - a(T.junta + 0.4)) / 0.4)} />
      <Dato valor={SKY.estructuraTon * peso} x={W / 2} y={1450} px={130} digitos={2} prefijo="≈ " sufijo=" t" etiqueta="toda la estructura de acrílico" etiquetaY={1535} id="sky-peso" opacidad={clamp((t - a(T.peso)) / 0.4)} />
      <Fuente texto="Secciones con juntas adhesivas transparentes: IStructE, RIBA J · peso de 50 a 55 t según la fuente" delay={1} />
    </Estudio>
  );
};
