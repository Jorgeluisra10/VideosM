/**
 * «La médula espinal: el atajo del cuerpo» (SINAPSIS · neuroanatomía) · escenas 2/2
 *   me-velocidad  axones con mielina: la señal salta de nodo en nodo hasta ≈ 120 m/s (≈ 430 km/h)
 *   me-reflejo    reflejo de retirada: la mano se aparta por un arco espinal corto, casi antes de sentir el dolor
 *   me-lesion     si la médula se lesiona, cerebro y cuerpo se desconectan: cuanto más arriba, más funciones se afectan
 *   me-puente     2023: un hombre paralizado vuelve a caminar con muletas gracias a un puente digital cerebro–médula
 * Dibujos esquemáticos; no son imágenes médicas reales.
 */
import React from "react";
import { MDE, TME, msAKmh } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeOut, lerp, spr, useReloj } from "../comun";
import { Frases, FONT, MONOF } from "./real-kit";
import { Fuente } from "./real1";
import { Cap, Fondo } from "./san1";
import { Mano } from "./rx-kit";
import { Ambiente, Axon, Cerebro, Chip, Cuerpo, LineaN, ME } from "./me-kit";

type P = { e: EscenaViralGuardada };

/* ───────────── me-velocidad ───────────── */

export const MeVelocidad: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const V = TME.velocidad;
  const kMi = clamp((t - a(V.mielina)) / 0.8);
  const cnt = easeOut((t - a(V.cifra)) / a(V.cifraDur));
  const ms = Math.round(MDE.velocidadMaxMs * cnt);
  const kKm = spr(f, a(V.kmh), { damping: 11, stiffness: 170, mass: 0.8 });
  const u1 = (t * (kMi > 0.5 ? 0.55 : 0.18)) % 1, u2 = (t * 0.1) % 1;
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={900} color={ME.oro} intensidad={0.5} />
        <Axon x={90} y={880} largo={900} n={6} u={u1} mielina={kMi} color={ME.oro} />
        {/* axón sin mielina, de comparación */}
        <g opacity={clamp((t - a(V.mielina)) / 0.6)}>
          <Axon x={90} y={1130} largo={900} n={6} u={u2} mielina={0} color={ME.hielo} grosor={0.8} />
        </g>
        <LineaN activo={2} prog={clamp(t / a(7))} y={1440} />
      </svg>
      <div data-texto="me-vel-cifra" style={{ position: "absolute", left: 90, top: 640, width: 900, textAlign: "center", fontFamily: FONT, fontWeight: 900, fontSize: 116, color: ME.oro, opacity: clamp((t - a(V.cifra) + 0.2) / 0.3), textShadow: "0 6px 30px #000" }}>{ms} m/s</div>
      <div data-texto="me-vel-kmh" style={{ position: "absolute", left: 90, top: 770, width: 900, textAlign: "center", fontFamily: MONOF, fontWeight: 800, fontSize: 36, color: ME.sens, opacity: clamp(kKm * 2), transform: `scale(${0.85 + 0.15 * clamp(kKm)})` }}>≈ {Math.round(msAKmh(MDE.velocidadMaxMs) / 10) * 10} km/h</div>
      <Chip x={540} y={950} texto="CON MIELINA · la señal salta de nodo en nodo" color={ME.oro} px={22} anchor="center" id="me-vel-mi" opacidad={kMi} />
      <Chip x={540} y={1190} texto="SIN MIELINA · mucho más lento" color={ME.hielo} px={22} anchor="center" id="me-vel-sin" opacidad={clamp((t - a(V.mielina)) / 0.6)} />
      <Frases frases={[{ t: 0.2, texto: "AXONES CON\nMIELINA", px: 96 }, { t: V.cifra - 0.1, texto: "SALTA DE\nNODO EN NODO", px: 88, color: ME.oro }, { t: V.kmh - 0.1, texto: "MÁS DE\n400 km/h", px: 100, color: ME.sens }]} y={450} x={104} id="titular-me-vel" />
      <Fuente texto="Velocidad máxima de conducción de los axones mielinizados más rápidos ≈ 120 m/s (≈ 430 km/h); la mayoría de las fibras es más lenta. Esquema, no a escala." y={1520} delay={V.cifra} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── me-reflejo ───────────── */

export const MeReflejo: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const R = TME.reflejo;
  const tt = a(R.toca), ta = a(R.aparta);
  const baja = easeOut(clamp(t / tt));
  const sube = easeOut((t - ta) / 0.35);
  const my = t < ta ? lerp(640, 905, baja) : lerp(905, 600, sube);
  const mrot = t < ta ? 0 : -16 * sube;
  const kArco = clamp((t - tt) / 0.5), kCer = clamp((t - tt) / a(3.2));
  const kDol = spr(f, a(R.dolor), { damping: 8, stiffness: 220, mass: 0.8 });
  const kC = clamp((t - a(R.cerebro)) / 0.4);
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={900} color={ME.mot} intensidad={0.5} />
        {/* sartén caliente */}
        <g transform="translate(300 1130)">
          <ellipse cx={0} cy={40} rx={210} ry={40} fill="#FF8A2A" opacity={0.25 + 0.15 * Math.sin(t * 8)} />
          <path d="M -170 -20 L -150 40 Q 0 70 150 40 L 170 -20 Z" fill="#23262E" stroke="#555B68" strokeWidth={6} /><ellipse cx={0} cy={-20} rx={170} ry={30} fill="#33363E" stroke="#555B68" strokeWidth={6} />
          <rect x={160} y={-34} width={160} height={26} rx={12} fill="#23262E" stroke="#555B68" strokeWidth={4} />
          {Array.from({ length: 5 }, (_, i) => { const u = ((t * 0.7 + i / 5) % 1); return <path key={i} d={`M ${-100 + i * 50} ${-50 - u * 120} q 12 -20 0 -40 q -12 -20 0 -40`} stroke="#FF6A4A" strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.7 * (1 - u)} />; })}
        </g>
        {/* mano */}
        <Mano x={300} y={my + 130} s={0.5} rot={180 + mrot} piel="#C8987A" huesos={0} />
        {t >= tt && t < tt + 0.5 && <circle cx={300} cy={1030} r={30 + 200 * (t - tt)} fill="none" stroke={ME.oro} strokeWidth={6} opacity={1 - (t - tt) / 0.5} />}
        <LineaN activo={1} prog={0.2} y={1440} />
      </svg>
      {/* carriles: arco espinal vs vía al cerebro */}
      <div data-texto="me-ref-arco" style={{ position: "absolute", left: 620, top: 700, width: 380, fontFamily: MONOF, fontWeight: 800, fontSize: 26, color: ME.sens }}>ARCO ESPINAL
        <div style={{ marginTop: 10, height: 18, borderRadius: 9, background: "rgba(191,224,255,0.18)" }}><div style={{ width: `${100 * kArco}%`, height: "100%", borderRadius: 9, background: ME.sens }} /></div>
        <div style={{ marginTop: 8, fontSize: 20, color: ME.hielo, opacity: kArco }}>médula → músculo</div>
      </div>
      <div data-texto="me-ref-cer" style={{ position: "absolute", left: 620, top: 900, width: 380, fontFamily: MONOF, fontWeight: 800, fontSize: 26, color: ME.cereb, opacity: clamp(kC * 2 + kCer) }}>HASTA EL CEREBRO
        <div style={{ marginTop: 10, height: 18, borderRadius: 9, background: "rgba(183,140,255,0.18)" }}><div style={{ width: `${100 * kCer}%`, height: "100%", borderRadius: 9, background: ME.cereb }} /></div>
        <div style={{ marginTop: 8, fontSize: 20, color: ME.hielo }}>médula → cerebro → «¡me duele!»</div>
      </div>
      <div data-texto="me-ref-dolor" style={{ position: "absolute", left: 620, top: 1080, width: 380, textAlign: "left", opacity: clamp(kDol * 2), transform: `scale(${0.7 + 0.3 * clamp(kDol)})`, transformOrigin: "0% 50%", fontFamily: FONT, fontWeight: 900, fontSize: 70, color: ME.rojo, textShadow: "0 4px 24px #000" }}>¡DOLOR!</div>
      <Frases frases={[{ t: 0.2, texto: "AL TOCAR ALGO\nMUY CALIENTE", px: 76 }, { t: R.aparta - 0.1, texto: "TU MANO\nSE APARTA", px: 100, color: ME.mot }, { t: R.cerebro - 0.1, texto: "CASI ANTES DE\nSENTIR EL DOLOR", px: 76, color: ME.cereb }]} y={450} x={104} id="titular-me-reflejo" />
      <Fuente texto="El reflejo de retirada se resuelve en circuitos de la médula; la percepción consciente del dolor requiere llegar al cerebro y es algo posterior. Las barras son esquemáticas (sin tiempos reales)." y={1510} delay={R.aparta} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── me-lesion ───────────── */

export const MeLesion: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const L = TME.lesion;
  const kRo = spr(f, a(L.rotura), { damping: 9, stiffness: 200, mass: 0.8 });
  const kDes = clamp((t - a(L.desconecta)) / 0.8);
  const lv = t < a(L.sube) ? 0 : clamp((t - a(L.sube)) / a(1.6)) * 2;
  const yMarca = lerp(985, 800, lv / 2);
  const piernas = 1 - kDes;
  const tronco = lv >= 1 ? 1 - clamp((lv - 1) * 4) * kDes - 0 : 1;
  const trValor = lv >= 1 ? 0 : 1, brValor = lv >= 1.9 ? 0 : 1;
  const mezcla = (conectado: number, objetivo: number): number => lerp(conectado, objetivo, clamp((t - a(L.desconecta)) / 0.8));
  const kF = clamp((t - a(L.funciones)) / 0.6);
  const filas: [string, string, number][] = [["lumbar", "piernas", 0], ["torácica", "tronco y piernas", 1], ["cervical", "brazos, tronco y piernas", 1.9]];
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={950} color={ME.rojo} intensidad={0.4} />
        <Cerebro x={360} y={650} s={0.4} brillo={0.4} t={t} />
        <Cuerpo x={360} y={760} s={0.82} brazos={mezcla(1, brValor)} tronco={mezcla(1, trValor)} piernas={mezcla(1, 0)} />
        {/* médula dentro del cuerpo y la lesión */}
        <line x1={360} y1={705} x2={360} y2={990} stroke={ME.blanca} strokeWidth={9} strokeLinecap="round" opacity={0.9} />
        <g opacity={clamp(kRo * 2)} transform={`translate(360 ${t < a(L.sube) ? 985 : yMarca})`}>
          <circle r={34 + 5 * Math.sin(t * 6)} fill="none" stroke={ME.rojo} strokeWidth={7} /><path d="M -50 -8 L -16 -8 L -4 14 L 8 -14 L 20 8 L 50 8" stroke={ME.rojo} strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        <LineaN activo={1} prog={0.5} y={1440} />
      </svg>
      {filas.map(([n, z, k], i) => {
        const op = clamp((lv - k + 0.3) / 0.3) * (t >= a(L.sube) || i === 0 ? 1 : 0) * (t > a(L.desconecta) ? 1 : 0);
        return <div key={n} data-texto={`me-les-${n}`} style={{ position: "absolute", left: 640, top: 760 + i * 120, width: 380, opacity: op, fontFamily: MONOF, fontWeight: 800, fontSize: 26, lineHeight: 1.2, color: i === 0 ? ME.oro : i === 1 ? ME.verde : ME.sens }}>{n.toUpperCase()}<br /><span style={{ color: "#fff", fontSize: 30 }}>{z}</span></div>;
      })}
      <Chip x={640} y={1150} texto={"depende de si la lesión\nes completa o parcial"} color={ME.hielo} px={22} id="me-les-depende" opacidad={kF} />
      <Frases frases={[{ t: 0.2, texto: "SI LA MÉDULA\nSE LESIONA", px: 84 }, { t: L.desconecta - 0.1, texto: "CEREBRO Y CUERPO\nSE DESCONECTAN", px: 70, color: ME.rojo }, { t: L.sube - 0.1, texto: "CUANTO MÁS\nARRIBA…", px: 100 }, { t: L.funciones - 0.1, texto: "…MÁS SE\nAFECTA", px: 100, color: ME.oro }]} y={450} x={104} id="titular-me-lesion" />
      <Fuente texto="Esquema general: una lesión medular interrumpe la comunicación por debajo del nivel; el efecto real depende del nivel y de si la lesión es completa o incompleta. No es consejo médico." y={1520} delay={L.desconecta} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── me-puente ───────────── */

export const MePuente: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const P = TME.puente;
  const kAn = clamp((t - a(P.anio)) / 0.5);
  const kHo = spr(f, a(P.hombre), { damping: 13, stiffness: 130, mass: 0.8 });
  const kCa = clamp((t - a(P.camina)) / 0.8);
  const kPu = clamp((t - a(P.puente)) / 0.8);
  const paso = t > a(P.camina) ? (t - a(P.camina)) * 0.8 : 0;
  const pulso = ((t - a(P.puente)) * 0.7) % 1;
  const cadena: [number, number][] = [[240, 790], [540, 790], [840, 790]];
  const pos = pulso < 0.5 ? lerp(cadena[0][0], cadena[1][0], pulso * 2) : lerp(cadena[1][0], cadena[2][0], (pulso - 0.5) * 2);
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={900} color={ME.sens} intensidad={0.7} />
        {/* cadena: cerebro → decodificador → estimulador */}
        <g opacity={clamp(kPu * 2 + kHo * 0.5)}>
          <Cerebro x={cadena[0][0]} y={cadena[0][1]} s={0.5} brillo={0.4 + 0.4 * kPu} t={t} />
          {[0, 1, 2, 3, 4, 5].map((i) => <circle key={i} cx={cadena[0][0] - 60 + (i % 3) * 40} cy={cadena[0][1] - 70 + Math.floor(i / 3) * 20} r={5} fill={ME.oro} opacity={0.4 + 0.5 * kPu} />)}
          <rect x={cadena[1][0] - 110} y={cadena[1][1] - 62} width={220} height={124} rx={22} fill="#0B1424" stroke={ME.sens} strokeWidth={6} /><text x={cadena[1][0]} y={cadena[1][1] - 8} textAnchor="middle" fontFamily={MONOF} fontWeight={800} fontSize={26} fill={ME.sens}>DECODIFICADOR</text><text x={cadena[1][0]} y={cadena[1][1] + 30} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={44} fill="#fff">IA</text>
          <rect x={cadena[2][0] - 110} y={cadena[2][1] - 62} width={220} height={124} rx={22} fill="#0B1424" stroke={ME.mot} strokeWidth={6} /><text x={cadena[2][0]} y={cadena[2][1] - 8} textAnchor="middle" fontFamily={MONOF} fontWeight={800} fontSize={24} fill={ME.mot}>ESTIMULADOR</text><text x={cadena[2][0]} y={cadena[2][1] + 28} textAnchor="middle" fontFamily={MONOF} fontWeight={700} fontSize={22} fill="#fff">en la médula</text>
          <path d="M 330 790 L 420 790 M 400 770 L 424 790 L 400 810 M 650 790 L 730 790 M 710 770 L 734 790 L 710 810" stroke={ME.hielo} strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.7} />
          {kPu > 0 && <circle cx={pos} cy={790} r={14} fill={ME.oro} stroke="#fff" strokeWidth={4} />}
          <path d={`M ${cadena[2][0]} 856 L ${cadena[2][0]} 940 L 600 990`} stroke={ME.blanca} strokeWidth={9} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.8} />
        </g>
        {/* hombre con muletas */}
        <g opacity={clamp(kHo * 2)}><Cuerpo x={470} y={940} s={0.5} brazos={lerp(0.5, 1, kCa)} tronco={lerp(0.3, 1, kCa)} piernas={lerp(0.1, 1, kCa)} paso={paso} muletas={kCa} /></g>
        <LineaN activo={0} prog={clamp(kPu)} y={1440} />
      </svg>
      <Chip x={104} y={606} texto="NATURE · MAYO 2023" color={ME.oro} px={28} id="me-pue-nature" opacidad={kAn} />
      <Chip x={720} y={1000} texto={"lesión desde 2011\n1 participante"} color={ME.hielo} px={22} id="me-pue-dato" opacidad={clamp(kHo * 2)} />
      <Chip x={720} y={1110} texto={"camina con\nmuletas y ayuda"} color={ME.verde} px={24} id="me-pue-muletas" opacidad={kCa} />
      <Frases frases={[{ t: 0.2, texto: "2023", px: 130 }, { t: P.hombre - 0.1, texto: "UN HOMBRE\nPARALIZADO", px: 96 }, { t: P.camina - 0.1, texto: "VUELVE A\nCAMINAR", px: 100, color: ME.verde }, { t: P.puente - 0.1, texto: "PUENTE DIGITAL\nCEREBRO–MÉDULA", px: 72, color: ME.sens }]} y={450} x={104} id="titular-me-puente" />
      <Fuente texto={`Lorach y cols., Nature (24 mayo 2023): interfaz cerebro–médula en un participante con tetraplejía crónica tras un accidente en ${MDE.bsi.lesion}; camina con muletas. Estudio de un solo caso; no es una cura. Esquema.`} y={1520} delay={P.hombre} />
      <Cap e={e} />
    </Fondo>
  );
};
