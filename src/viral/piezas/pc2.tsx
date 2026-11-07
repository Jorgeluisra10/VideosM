/**
 * «El par craneal 0» (SINAPSIS · neuroanatomía) · escenas 2/2
 *   pc0-gnrh       en el embrión, neuronas con GnRH viajan de la nariz al cerebro siguiendo este nervio
 *   pc0-kallmann   si esa ruta falla puede aparecer el síndrome de Kallmann: sin olfato y pubertad ausente o retrasada
 *   pc0-misterio   en adultos su función no se conoce: se propone que modula la reproducción o detecta feromonas, sin demostrar
 *   pc0-libro      incluido en la nomenclatura anatómica internacional desde 1998, pero muchos libros enseñan solo 12 pares (cierre)
 * Dibujos esquemáticos de anatomía; no son imágenes médicas reales.
 */
import React from "react";
import { PC0, TPC, totalCraneales } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeOut, lerp, spr, useReloj } from "../comun";
import { Frases } from "./real-kit";
import { Fuente } from "./real1";
import { Cap, Fondo } from "./san1";
import { Ambiente, Cabeza, CabezaZoom, Chip, FONT, LineaP, MONOF, ME, PC, ParesHUD, pz } from "./pc-kit";

type P = { e: EscenaViralGuardada };

/* ───────────── pc0-gnrh ───────────── */

export const Pc0Gnrh: React.FC<P> = ({ e }) => {
  const { t, a } = useReloj();
  const G = TPC.gnrh;
  const kEmb = clamp((t - a(G.embrion)) / 0.5), kGn = clamp((t - a(G.gnrh)) / 0.5), kHo = clamp((t - a(G.hormona)) / 0.5);
  const dots = t < a(G.viaja) ? (t > a(G.gnrh) ? 0 : -1) : clamp((t - a(G.viaja)) / a(2.2));
  const kNer = clamp((t - a(G.nervio)) / 0.5);
  const hipo = clamp((dots - 0.7) / 0.3);
  const act = dots < 0.35 ? 0 : dots < 0.55 ? 1 : dots < 0.8 ? 2 : 3;
  const [gx, gy] = pz(262, 104), [hx, hy] = pz(96, 26);
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1050} color={ME.oro} intensidad={0.8} />
        <CabezaZoom nervio={1} olfat={0.6} dots={dots} hipo={hipo} pulso={0.4 + 0.6 * kNer * (0.5 + 0.5 * Math.sin(t * 6))} t={t} />
        {kGn > 0 && <line x1={700} y1={745} x2={gx} y2={gy} stroke={ME.oro} strokeWidth={3} opacity={kGn * 0.7} />}
        {hipo > 0.2 && <line x1={260} y1={745} x2={hx} y2={hy} stroke={PC.hipo} strokeWidth={3} opacity={hipo * 0.8} />}
        <LineaP y={1430} activo={act} prog={clamp(dots * 3 - act * 1)} color={ME.oro} />
      </svg>
      <Chip x={560} y={690} texto={"neuronas con GnRH\nla hormona de la pubertad"} color={ME.oro} px={24} id="pc0-gn-gnrh" opacidad={kGn} />
      <Chip x={104} y={690} texto={"HIPOTÁLAMO"} color={PC.hipo} px={26} id="pc0-gn-hipo" opacidad={clamp(hipo * 2)} />
      <Chip x={976} y={1290} texto="EN EL EMBRIÓN" color="#BFE0FF" px={26} anchor="right" id="pc0-gn-emb" opacidad={kEmb} />
      <Chip x={540} y={1345} texto={"siguiendo las fibras del nervio terminal"} color={PC.nervio} px={24} anchor="center" id="pc0-gn-sig" opacidad={kNer} />
      <Frases frases={[{ t: 0.2, texto: "EN EL EMBRIÓN", px: 90 }, { t: G.hormona - 0.1, texto: "GnRH ACTIVA\nLA PUBERTAD", px: 86, color: ME.oro }, { t: G.viaja - 0.1, texto: "VIAJAN POR\nESTE NERVIO", px: 90, color: PC.nervio }]} y={450} x={104} id="titular-pc0-gnrh" />
      <Fuente texto="Las neuronas GnRH nacen en la zona olfatoria y migran hacia el hipotálamo acompañando fibras del nervio terminal y vomeronasal (estudios en embriones). Esquema." y={1510} delay={G.viaja} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── pc0-kallmann ───────────── */

export const Pc0Kallmann: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const K = TPC.kallmann;
  const kRot = spr(f, a(K.falla) + 0.3, { damping: 10, stiffness: 190, mass: 0.8 });
  const kSin = clamp((t - a(K.sindrome)) / 0.5), kOl = spr(f, a(K.olfato), { damping: 10, stiffness: 190, mass: 0.8 }), kPu = clamp((t - a(K.pubertad)) / 0.6);
  const dots = t > a(K.falla) ? clamp((t - a(K.falla)) / a(1.4)) : 0;
  const [rx, ry] = pz(216, 52);
  const barra = lerp(0.9, 0.06, easeOut(kPu));
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1050} color={PC.rojo} intensidad={0.5 + 0.5 * kRot} />
        <CabezaZoom nervio={1} olfat={0.6} dots={dots} rotura={kRot > 0.5 ? 1 : 0} hipo={0} pulso={0.2} t={t} />
        {kRot > 0.5 && <line x1={700} y1={745} x2={rx} y2={ry} stroke={PC.rojo} strokeWidth={3} opacity={0.8} />}
        {/* flor tachada: sin olfato */}
        <g transform="translate(190 1240)" opacity={kOl}>
          {Array.from({ length: 5 }, (_, i) => { const an = (i / 5) * Math.PI * 2 - Math.PI / 2; return <circle key={i} cx={Math.cos(an) * 26} cy={Math.sin(an) * 26} r={19} fill="#E86AB0" opacity={0.85} />; })}
          <circle r={14} fill={ME.oro} />
          <g transform={`scale(${kOl})`}><circle r={52} fill="none" stroke={PC.rojo} strokeWidth={7} /><path d="M -37 37 L 37 -37" stroke={PC.rojo} strokeWidth={7} strokeLinecap="round" /></g>
        </g>
        {/* barra de hormona: pubertad */}
        <g transform="translate(900 1210)" opacity={kPu}>
          <rect x={-22} y={-90} width={44} height={180} rx={14} fill="#0C1226" stroke="#4A5C92" strokeWidth={4} />
          <rect x={-16} y={90 - 168 * barra} width={32} height={168 * barra} rx={10} fill={ME.oro} />
        </g>
      </svg>
      <Chip x={104} y={690} texto={"SÍNDROME\nDE KALLMANN"} color={PC.rojo} px={30} id="pc0-k-sind" opacidad={kSin} />
      <Chip x={580} y={690} texto={"RUTA CORTADA\nlas neuronas GnRH no llegan"} color={PC.rojo} px={24} id="pc0-k-falla" opacidad={clamp((kRot - 0.3) * 2)} />
      <Chip x={110} y={1310} texto={"SIN OLFATO"} color={PC.rojo} px={24} id="pc0-k-olfato" opacidad={kOl} />
      <Chip x={976} y={1330} texto={"PUBERTAD\nAUSENTE O RETRASADA"} color={ME.oro} px={22} anchor="right" id="pc0-k-pub" opacidad={kPu} />
      <Frases frases={[{ t: 0.2, texto: "SI LA RUTA\nFALLA…", px: 100 }, { t: K.sindrome - 0.1, texto: "SÍNDROME DE\nKALLMANN", px: 90, color: PC.rojo }, { t: K.olfato - 0.1, texto: "SIN OLFATO,\nSIN PUBERTAD", px: 80, color: ME.oro }]} y={450} x={104} id="titular-pc0-kallmann" />
      <Fuente texto="Síndrome de Kallmann: hipogonadismo hipogonadotrópico con anosmia; se asocia a fallos en la migración de las neuronas GnRH (suele ser genético). Esquema; no es consejo médico." y={1510} delay={K.sindrome} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── pc0-misterio ───────────── */

export const Pc0Misterio: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const M = TPC.misterio;
  const kAd = clamp((t - a(M.adultos)) / 0.5), kNo = spr(f, a(M.nose), { damping: 9, stiffness: 170, mass: 0.8 });
  const kRe = clamp((t - a(M.repro)) / 0.5), kFe = clamp((t - a(M.feromonas)) / 0.5), kNa = spr(f, a(M.nada), { damping: 8, stiffness: 220, mass: 0.8 });
  const pulso = 0.5 + 0.5 * Math.sin(t * 4);
  const tarjeta = (y: number, texto: string, k: number, id: string, estampa: number) => (
    <g opacity={k} transform={`translate(${lerp(-40, 0, easeOut(k))} 0)`}>
      <rect x={104} y={y} width={872} height={84} rx={18} fill="rgba(11,18,40,0.9)" stroke={ME.oro} strokeWidth={4} />
      <text x={134} y={y + 54} fontFamily={MONOF} fontWeight={800} fontSize={28} fill="#E6EDFF" data-texto={id}>{texto}</text>
      {estampa > 0.05 && (
        <g transform={`translate(${820} ${y + 42}) rotate(-8) scale(${estampa})`}>
          <rect x={-120} y={-26} width={240} height={52} rx={8} fill="rgba(58,10,20,0.92)" stroke={PC.rojo} strokeWidth={4} />
          <text y={9} textAnchor="middle" fontFamily={MONOF} fontWeight={800} fontSize={24} fill={PC.rojo}>SIN DEMOSTRAR</text>
        </g>
      )}
    </g>
  );
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1100} color={PC.nervio} intensidad={0.7 + 0.5 * pulso} />
        <Cabeza x={540} y={1110} s={0.75} nervio={1} olfat={0.3} pulso={pulso} t={t} />
        {/* signo de interrogación */}
        <text x={880} y={1020} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={260 * (0.7 + 0.3 * kNo)} fill={ME.oro} opacity={kNo * (0.75 + 0.25 * pulso)}>?</text>
        {tarjeta(660, "¿modula la reproducción?", kRe, "pc0-m-repro", clamp(kNa * 1.3))}
        {tarjeta(760, "¿detecta feromonas?", kFe, "pc0-m-fero", clamp((kNa - 0.15) * 1.3))}
      </svg>
      <Chip x={540} y={1345} texto={"función en adultos: desconocida"} color="#BFE0FF" px={26} anchor="center" id="pc0-m-func" opacidad={clamp(kAd * kNo)} />
      <Frases frases={[{ t: 0.2, texto: "¿Y EN\nADULTOS?", px: 88 }, { t: M.nose - 0.1, texto: "AÚN NO\nSE SABE", px: 88, color: ME.oro }]} y={450} x={104} id="titular-pc0-misterio" />
      <Fuente texto="Su función en adultos no está establecida; se han propuesto papeles neuromoduladores y de detección de feromonas, ninguno demostrado en humanos." y={1510} delay={M.repro} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── pc0-libro ───────────── */

export const Pc0Libro: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const L = TPC.libro;
  const hitos: [number, string, string, number][] = [[PC0.fritsch, "1878", "Fritsch", 0.2], [1987, "AÑOS 80", "lo llaman «cero»", 1.2], [PC0.terminologia, "1998", "nomenclatura internacional", L.anio], [2026, "HOY", "libros: solo 12", L.libros]];
  const xs = [200, 430, 660, 880];
  const kLin = clamp((t - a(0.2)) / a(L.anio + 0.8));
  const kLibro = spr(f, a(L.libros), { damping: 10, stiffness: 180, mass: 0.8 });
  const tras = t > a(L.libros) + 0.9 ? Math.sin(t * 5) * 3 : 0;
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1000} color={ME.oro} intensidad={0.6} />
        <line x1={xs[0]} y1={820} x2={xs[3]} y2={820} stroke="#BFE0FF" strokeOpacity={0.22} strokeWidth={6} strokeLinecap="round" />
        <line x1={xs[0]} y1={820} x2={lerp(xs[0], xs[3], easeOut(kLin))} y2={820} stroke={PC.nervio} strokeWidth={6} strokeLinecap="round" />
        {hitos.map(([, , , tt], i) => {
          const k = easeOut((t - a(tt)) / 0.4);
          const col = i === 3 ? PC.rojo : i === 2 ? ME.oro : PC.nervio;
          return <circle key={i} cx={xs[i]} cy={820} r={lerp(0, i === 3 ? 20 : 16, k)} fill={col} stroke="#fff" strokeWidth={4} />;
        })}
        {/* libro de 12 pares con el hueco del cero */}
        <g transform={`translate(${540 + tras} 1150) scale(${0.85 + 0.15 * kLibro})`} opacity={clamp(kLibro * 2)}>
          <rect x={-260} y={-150} width={520} height={300} rx={22} fill="#1A2448" stroke="#4A5C92" strokeWidth={6} />
          <rect x={-260} y={-150} width={44} height={300} rx={14} fill="#2A3A78" />
          <circle cx={-186} cy={-34} r={21} fill="none" stroke="#8B97B8" strokeWidth={3} strokeDasharray="6 6" /><text x={-186} y={-24} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={26} fill="#8B97B8">0</text>
          <text x={20} y={-84} textAnchor="middle" fontFamily={MONOF} fontWeight={800} fontSize={28} fill="#BFE0FF">PARES CRANEALES</text>
          {Array.from({ length: 12 }, (_, i) => <text key={i} x={-124 + (i % 6) * 58} y={i < 6 ? -26 : 40} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={30} fill="#E6EDFF">{["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"][i]}</text>)}
        </g>
        <ParesHUD y={1430} lit={12} cero={clamp(kLibro)} />
      </svg>
      {hitos.map(([, y, d, tt], i) => {
        const k = clamp((t - a(tt)) / 0.4);
        return (
          <React.Fragment key={i}>
            <Chip x={xs[i]} y={i % 2 ? 716 : 856} texto={y} color={i === 3 ? PC.rojo : i === 2 ? ME.oro : PC.nervio} px={30} anchor="center" id={`pc0-l-y${i}`} opacidad={k} />
            <Chip x={xs[i]} y={i % 2 ? 758 : 892} texto={d} color="#BFE0FF" px={20} anchor="center" id={`pc0-l-d${i}`} opacidad={k} />
          </React.Fragment>
        );
      })}
      <Chip x={540} y={1345} texto={`${PC0.paresClasicos} pares en el libro · ${totalCraneales(PC0.paresClasicos)} contando el cero`} color={PC.nervio} px={26} anchor="center" id="pc0-l-total" opacidad={clamp((kLibro - 0.4) * 2)} />
      <Frases frases={[{ t: 0.2, texto: "INCLUIDO\nDESDE 1998", px: 100 }, { t: L.libros - 0.1, texto: "PERO MUCHOS\nLIBROS NO", px: 90, color: PC.rojo }]} y={450} x={104} id="titular-pc0-libro" />
      <Fuente texto="La Terminologia Anatomica (1998) incluye el nervio terminal como par craneal; muchos textos aún enseñan solo doce. Esquema." y={1510} delay={L.anio} />
      <Cap e={e} />
    </Fondo>
  );
};
