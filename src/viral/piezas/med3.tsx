/**
 * «Médicos que se probaron a sí mismos» (v4) · escenas 3/3 (Rogozov, Antártida, 1961) y cierre
 *   med-polar1   la base polar en plena ventisca: abril de 1961, el único médico tiene apendicitis
 *   med-cirugia  mesa de instrumental bajo la lámpara y un cronómetro que corre hasta casi dos horas
 *   med-polar2   amanece sobre la base: dos semanas después ya trabajaba otra vez
 *   med-cierre   tres tarjetas (1956 · 2005 · 1961), «no lo imites» y la pregunta final
 */
import React from "react";
import { MED, TM } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeInOut, easeOut, lerp, spr, useReloj } from "../comun";
import { Cronometro, Estudio, FONT, Frases, MONOF, RE, Reflejo } from "./real-kit";
import { Dato, Fuente } from "./real1";
import { Chip } from "./med1";
import { Bisturi, Espejo, Jeringa, Lampara, MC, Medalla, Pinzas, Polar } from "./med-kit";

type P = { e: EscenaViralGuardada };

/** Velo oscuro arriba para que el texto se lea sobre la aurora y el cielo. */
const VeloTexto: React.FC = () => <div style={{ position: "absolute", left: 0, top: 0, width: W, height: 760, background: "linear-gradient(180deg, rgba(2,8,16,0.72) 0%, rgba(2,8,16,0.35) 60%, rgba(2,8,16,0) 100%)", pointerEvents: "none" }} />;

/** Fundido desde el negro de 0,25 s en cada corte (igual que el del Estudio). */
const Entrada: React.FC = () => {
  const { t } = useReloj();
  return <div style={{ position: "absolute", inset: 0, background: "#02060C", opacity: clamp(1 - t / 0.25) * 0.85, pointerEvents: "none" }} />;
};

/* ───────────── med-polar1 ───────────── */

export const MedPolar1: React.FC<P> = ({ e }) => {
  const { t, a } = useReloj();
  const viento = 1 + 1.5 * easeInOut((t - a(TM.polar1.viento)) / a(2.6));
  const dolor = clamp((t - a(TM.polar1.dolor)) / a(1.4));
  const latido = 0.5 + 0.5 * Math.sin(t * 6.5);
  const anio = 1900 + 61 * easeOut((t - a(0.3)) / a(1.8));
  return (
    <>
      <Polar viento={viento} ventana={0.8 + 0.2 * Math.sin(t * 9) * Math.sin(t * 3.1)}>
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 50% 60%, rgba(0,0,0,0) 50%, rgba(220,30,40,${0.38 * dolor * latido}) 100%)`, pointerEvents: "none" }} />
        <VeloTexto />
        <Frases frases={[{ t: 0.2, texto: "Antártida", px: 124 }, { t: 3.4, texto: "único médico", color: RE.oro, px: 104 }, { t: 5.5, texto: "apendicitis", color: RE.rojo, px: 126 }, { t: 7.2, texto: "nadie más\npuede operarlo", px: 92 }]} y={405} />
        <Dato valor={anio} x={W / 2} y={1470} px={150} digitos={4} sinSep id="polar1-anio" opacidad={clamp((t - 0.3) / 0.5)} />
        <div data-texto="polar1-fecha" style={{ position: "absolute", left: 104, width: W - 208, top: 1560, textAlign: "center", fontFamily: MONOF, fontWeight: 700, fontSize: 28, color: RE.hielo, opacity: 0.9 * clamp((t - 0.8) / 0.5) }}>abril de 1961 · base Novolazarévskaya</div>
        <Fuente texto="Rogozov y Bermel, BMJ 2009;339:b4965 («Auto-appendectomy in the Antarctic») · Expedición Antártica Soviética 1960–61" y={1626} delay={4.5} />
      </Polar>
      <Entrada />
    </>
  );
};

/* ───────────── med-cirugia ───────────── */

export const MedCirugia: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const PISO = 1470;
  const k = easeInOut((t - a(TM.cirugia.reloj)) / a(TM.cirugia.relojDur));
  const min = MED.rogozov.minutos * k;
  const flicker = 0.8 + 0.2 * Math.sin(t * 8.1) * Math.sin(t * 2.7 + 1);
  const sale = (i: number): number => spr(f, a(0.3 + i * 0.35), { damping: 14, stiffness: 130, mass: 0.7 });
  const hh = Math.floor(min / 60), mm = Math.floor(min % 60);
  return (
    <Estudio piso={PISO} resplandor={0.35} particulas={40}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Lampara x={540} y={650} alto={PISO - 650} ancho={1000} intensidad={0.55 * flicker} cable={120} />
        <Cronometro x={540} y={960} r={200} valor={min / 120} arco={min / 120} color={RE.rojo} etiqueta="MIN" numeros={["120", "10", "20", "30", "40", "50", "60", "70", "80", "90", "100", "110"]} />
        <Reflejo piso={PISO} intensidad={0.12} alto={120}>
          <g opacity={clamp(sale(0) * 2)} transform={`translate(0 ${(1 - sale(0)) * -40})`}><Espejo x={175} y={1330} s={0.7} rot={-10} /></g>
          <g opacity={clamp(sale(1) * 2)} transform={`translate(0 ${(1 - sale(1)) * -40})`}><Bisturi x={410} y={1340} s={0.68} rot={-62} /></g>
          <g opacity={clamp(sale(2) * 2)} transform={`translate(0 ${(1 - sale(2)) * -40})`}><Pinzas x={650} y={1340} s={0.66} rot={-70} /></g>
          <g opacity={clamp(sale(3) * 2)} transform={`translate(0 ${(1 - sale(3)) * -40})`}><Jeringa x={890} y={1345} s={0.6} rot={-72} liquido={0.8} /></g>
        </Reflejo>
      </svg>
      <Frases frases={[{ t: 0.2, texto: "medio sentado", px: 104 }, { t: 1.6, texto: "espejo y\nanestesia local", color: RE.oro, px: 80 }, { t: 3.4, texto: "se abrió el abdomen", color: RE.rojo, px: 84 }, { t: 4.7, texto: "meteorólogo\n+ mecánico", px: 86 }, { t: 8.7, texto: "casi 2 horas", color: RE.oro, px: 112 }]} y={405} />
      <Chip texto={`${hh} h ${String(mm).padStart(2, "0")} min`} x={W / 2} y={1215} color={RE.oro} opacidad={clamp((t - a(TM.cirugia.reloj)) / 0.4)} id="cirugia-reloj" ancho={300} />
      <Fuente texto="Rogozov y Bermel, BMJ 2009;339:b4965 · duración: ≈ 1 h 45 min según Wikipedia («Self-surgery»); otros relatos: ≈ 2 h" y={1626} delay={5} />
    </Estudio>
  );
};

/* ───────────── med-polar2 ───────────── */

export const MedPolar2: React.FC<P> = ({ e }) => {
  const { t, a } = useReloj();
  const amanece = easeInOut((t - a(TM.polar2.sol)) / a(TM.polar2.solDur));
  const dias = 14 * easeOut((t - a(TM.polar2.dias)) / a(TM.polar2.diasDur));
  return (
    <>
      <Polar viento={Math.max(0.15, 1.2 - amanece)} ventana={1} amanece={amanece}>
        <VeloTexto />
        <Frases frases={[{ t: 0.2, texto: "terminó agotado", px: 98 }, { t: 2.0, texto: "14 días", color: RE.oro, px: 132 }, { t: 3.9, texto: "y volvió\na trabajar", px: 98 }, { t: 6.2, texto: "su propio cirujano\ny su propio paciente", color: RE.blanco, px: 72 }]} y={405} />
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
          {Array.from({ length: 14 }, (_, i) => {
            const lleno = clamp(dias - i);
            return (
              <g key={i}>
                <rect x={104 + i * 64.7} y={1470} width={56} height={38} rx={9} fill="#0C1A2A" fillOpacity={0.7} stroke={RE.hielo} strokeOpacity={0.5} strokeWidth={2} />
                <rect x={104 + i * 64.7} y={1470} width={56 * lleno} height={38} rx={9} fill={RE.esmeralda} />
              </g>
            );
          })}
        </svg>
        <div data-texto="polar2-dias" style={{ position: "absolute", left: 104, width: W - 208, top: 1530, textAlign: "left", fontFamily: MONOF, fontWeight: 700, fontSize: 26, color: RE.hielo, opacity: 0.9 * clamp((t - a(TM.polar2.dias)) / 0.5) }}>≈ 2 semanas hasta volver al trabajo</div>
        <Fuente texto="Relatos divulgativos: de vuelta a sus funciones en ≈ 2 semanas (sin fuente primaria confirmada) · Rogozov y Bermel, BMJ 2009" y={1590} delay={3.4} />
      </Polar>
      <Entrada />
    </>
  );
};

/* ───────────── med-cierre ───────────── */

const Tarjeta: React.FC<{ x: number; y: number; r: number; k: number; titulo: string; sub: string; color?: string; children: React.ReactNode }> = ({ x, y, r, k, titulo, sub, color = RE.hielo, children }) => (
  <g transform={`translate(${x} ${y + (1 - k) * 36})`} opacity={clamp(k * 2)}>
    <circle r={r + 6} fill="none" stroke={color} strokeOpacity={0.55} strokeWidth={3} />
    <circle r={r} fill="#0E2438" />
    <circle r={r} fill="none" stroke="#fff" strokeOpacity={0.08} strokeWidth={2} />
    {children}
    <text y={r + 56} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={36} fill={RE.blanco}>{titulo}</text>
    <text y={r + 96} textAnchor="middle" fontFamily={MONOF} fontWeight={700} fontSize={24} fill={color}>{sub}</text>
  </g>
);

export const MedCierre: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const c = (i: number): number => spr(f, a(TM.cierre.tarjetas + i * 0.5), { damping: 13, stiffness: 140, mass: 0.7 });
  const no = spr(f, a(TM.cierre.noImites), { damping: 10, stiffness: 190, mass: 0.6 });
  const pregunta = clamp((t - a(TM.cierre.pregunta)) / 0.4);
  const respira = 0.5 + 0.5 * Math.sin(t * 3);
  return (
    <Estudio piso={1250} resplandor={0.45}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <ellipse cx={W / 2} cy={1010} rx={330 + 50 * respira} ry={(330 + 50 * respira) * 0.7} fill={RE.oro} opacity={0.07 * (0.6 + 0.8 * respira)} />
        <circle cx={W / 2} cy={1010} r={120 + 220 * ((t * 0.5) % 1)} fill="none" stroke={RE.oro} strokeWidth={3} opacity={0.4 * (1 - ((t * 0.5) % 1)) * c(0)} />
        <g opacity={1 - 0.7 * pregunta}>
          <Tarjeta x={218} y={830} r={118} k={c(0)} titulo="Forssmann" sub="1929 · catéter" color={MC.oroMed}><Medalla x={0} y={0} r={90} anio="1956" brillo={(t * 0.35) % 1} /></Tarjeta>
          <Tarjeta x={540} y={830} r={118} k={c(1)} titulo="Marshall" sub="1984 · bacteria" color={MC.verdeBac}><Medalla x={0} y={0} r={90} anio="2005" brillo={(t * 0.35 + 0.5) % 1} /></Tarjeta>
          <Tarjeta x={862} y={830} r={118} k={c(2)} titulo="Rogozov" sub="1961 · apéndice" color={RE.rojo}><g transform="translate(0 6)"><Bisturi x={0} y={0} s={0.46} rot={-35} /></g></Tarjeta>
        </g>
      </svg>
      <Frases frases={[{ t: 0.2, texto: "3 médicos\n3 apuestas", px: 108 }, { t: 2.2, texto: "2 Nobel y una\ncirugía imposible", color: RE.oro, px: 76 }, { t: 7.4, texto: "¿hasta dónde\nllegarías?", color: RE.oro, px: 112 }]} y={405} />
      <div data-texto="cierre-no" style={{ position: "absolute", left: W / 2 - 330, width: 660, top: 1250, textAlign: "center", fontFamily: FONT, fontWeight: 900, fontSize: 56, color: "#fff", opacity: clamp(no * 2) * (1 - 0.85 * pregunta), transform: `scale(${0.7 + 0.3 * no})` }}>
        <span style={{ display: "inline-block", padding: "10px 34px", borderRadius: 22, background: RE.rojo, boxShadow: `0 0 ${24 + 24 * respira}px rgba(240,65,36,0.55)` }}>NO LO IMITES</span>
      </div>
      <div data-texto="cierre-aviso" style={{ position: "absolute", left: 104, width: W - 208, top: 1370, textAlign: "center", fontFamily: MONOF, fontWeight: 700, fontSize: 26, color: RE.hielo, opacity: 0.9 * clamp(no * 2) * (1 - 0.85 * pregunta) }}>hoy existen los comités de ética y los ensayos clínicos</div>
      <div data-texto="cierre-fecha" style={{ position: "absolute", left: 104, width: W - 208, top: 1560, textAlign: "center", fontFamily: MONOF, fontWeight: 700, fontSize: 24, color: RE.hielo, opacity: 0.6 }}>Relato histórico con fines educativos. No sustituye el consejo médico.</div>
    </Estudio>
  );
};
