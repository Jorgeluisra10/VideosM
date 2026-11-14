/**
 * «El secreto perdido del hormigón romano» (IMNOBA · forense/microscópico) · escenas 2/2
 *   rom-cristal   tobermorita: el cristal raro que crece en el mar (cámara rápida de 2.000 años)
 *   rom-curita    una grieta que se sella sola con cristales (curita automática)
 *   rom-grumos    grumos de cal que se disuelven y tapan la fisura (MIT, 2023)
 *   rom-panteon   un viaducto moderno se parte y el Panteón sigue en pie
 *   rom-sesgo     sesgo del sobreviviente: lo malo se cayó y nadie lo recuerda
 *   rom-co2       el cemento moderno se cuece a más de 1.400 °C y emite ≈ 7 % del CO2
 *   rom-caso      caso resuelto: química paciente
 */
import React from "react";
import { ROM, TRM } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeInOut, easeOut, lerp, spr, useReloj } from "../comun";
import { azar } from "../../lib/anim";
import { useUid } from "../../estudio/util";
import { FONT, Frases, MONOF } from "./real-kit";
import { Dato, Fuente } from "./real1";
import { Chip } from "./med1";
import { Globo, Onoma } from "./chi-kit";
import { Bloque, Cristales, Evidencia, Fabrica, FondoLab, Gota, Inspector, Ion, Mar, MuelleRomano, Panteon, RO, Sello, Viaducto } from "./rom-kit";

type P = { e: EscenaViralGuardada };
const rp = (t: number, a: (x: number) => number, ini: number, dur: number): number => clamp((t - a(ini)) / a(dur));

/* ───────────── rom-cristal ───────────── */

export const RomCristal: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const T = TRM.cristal;
  const uid = useUid();
  const cx = 540, cy = 900, R = 330;
  const sV = spr(f, a(T.vista), { damping: 13, stiffness: 110, mass: 0.9 });
  const k = easeInOut((t - a(T.crece)) / a(T.creceDur));
  return (
    <FondoLab tono="verde">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs><clipPath id={`${uid}c`}><circle cx={cx} cy={cy} r={R} /></clipPath></defs>
        <g opacity={clamp(sV * 2)}>
          <circle cx={cx} cy={cy} r={R} fill="#0E1C18" />
          <g clipPath={`url(#${uid}c)`}>
            {Array.from({ length: 14 }, (_, i) => <circle key={i} cx={cx - R + azar(i * 3.3) * 2 * R} cy={cy - R + azar(i * 5.1) * 2 * R} r={30 + azar(i * 7.7) * 50} fill={["#4A4038", "#58504A", "#3A332E"][i % 3]} />)}
            <Cristales x={cx} y={cy} r={310} k={k} t={t} n={34} />
            {[[-200, -190], [210, -170], [-210, 190], [220, 200]].map(([x, y], i) => <Cristales key={i} x={cx + x} y={cy + y} r={150} k={clamp(k * 1.2 - 0.1)} t={t} n={16} semilla={i + 4} color={i % 2 ? RO.oro : "#FFE27A"} />)}
          </g>
          <circle cx={cx} cy={cy} r={R} fill="none" stroke={RO.verde} strokeWidth={5} opacity={0.85} />
        </g>
        <g opacity={rp(t, a, T.crece, 0.5)}><text x={W - 130} y={1262} textAnchor="end" fontFamily={MONOF} fontWeight={800} fontSize={30} fill={RO.rojo} opacity={0.6 + 0.4 * Math.sin(t * 6)} data-texto="rom-rapida">● cámara rápida</text></g>
      </svg>
      <Dato valor={ROM.anios * k} x={W / 2} y={1330} px={118} digitos={4} color={RO.oro} sufijo=" años" etiqueta="bajo el agua del Mediterráneo" etiquetaY={1445} id="rom-anios" opacidad={clamp(k * 5)} />
      <Chip texto="tobermorita aluminosa" x={W / 2} y={1545} color={RO.verde} id="rom-tober" ancho={560} opacidad={rp(t, a, T.chip, 0.4)} />
      <Frases frases={[{ t: 0.02, texto: "el protagonista", px: 80 }, { t: T.crece, texto: "la tobermorita", color: RO.oro, px: 92 }, { t: T.f2, texto: "un cristal raro: pide calor", px: 62 }, { t: T.f3, texto: "aquí crece en el mar", color: RO.cian, px: 82 }]} y={352} ancho={860} />
      <Fuente texto="La Al-tobermorita suele formarse con calor; en el hormigón marino romano cristaliza a temperatura del mar (Jackson y colaboradores) · cámara rápida ilustrativa" delay={1.4} y={1625} />
    </FondoLab>
  );
};

/* ───────────── rom-curita ───────────── */

const GRIETA: [number, number][] = [[0.1, 0.2], [0.3, 0.4], [0.45, 0.36], [0.62, 0.6], [0.8, 0.7], [0.95, 0.9]];

export const RomCurita: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const T = TRM.curita;
  const bx = 140, by = 600, bw = 800, bh = 640;
  const sB = spr(f, a(T.bloque), { damping: 13, stiffness: 110, mass: 0.9 });
  const gr = rp(t, a, T.grieta, 0.6);
  const cr = easeOut((t - a(T.cristal)) / a(2.4));
  const sella = easeInOut((t - a(T.sella) + 0.4) / a(1.0));
  const cu = spr(f, a(T.curita), { damping: 9, stiffness: 150, mass: 0.7 });
  const poli = GRIETA.map(([u, v]) => `${bx + u * bw},${by + v * bh}`).join(" ");
  return (
    <FondoLab>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g opacity={clamp(sB * 2)} transform={`translate(0 ${(1 - sB) * 60})`}>
          <Bloque x={bx} y={by} w={bw} h={bh} poros={9} semilla={5} agua={0.5} grieta={gr * (1 - 0.8 * sella)} />
          {GRIETA.map(([u, v], i) => <Cristales key={i} x={bx + u * bw} y={by + v * bh} r={95} k={clamp(cr * 1.3 - i * 0.06)} t={t} n={14} semilla={i + 1} />)}
          {sella > 0 && <polyline points={poli} fill="none" stroke={RO.oro} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" opacity={0.6 * sella} />}
        </g>
        {/* gotas de agua que entran a la grieta */}
        {t >= a(T.agua) && Array.from({ length: 6 }, (_, i) => {
          const q = clamp((t - a(T.agua + i * 0.3)) / a(1.0));
          if (q <= 0 || q >= 1) return null;
          return <Gota key={i} x={lerp(bx + 0.1 * bw - 20 + i * 14, bx + GRIETA[1][0] * bw, easeInOut(q))} y={lerp(by - 120, by + GRIETA[1][1] * bh, easeInOut(q))} s={0.6} />;
        })}
        {/* curita */}
        <g opacity={clamp(cu * 2)} transform={`translate(${bx + 0.5 * bw} ${by + 0.48 * bh}) rotate(-28) scale(${0.5 + 0.5 * cu})`}>
          <rect x={-130} y={-38} width={260} height={76} rx={38} fill="#EBC79A" stroke="#8A6A3A" strokeWidth={5} />
          <rect x={-46} y={-38} width={92} height={76} fill="#F7E3C6" stroke="#8A6A3A" strokeWidth={3} />
          {[-100, -76, 76, 100].map((dx) => <circle key={dx} cx={dx} cy={0} r={4} fill="#B58C54" />)}
          <path d="M -16 0 H 16 M 0 -16 V 16" stroke="#C94A3C" strokeWidth={9} strokeLinecap="round" />
        </g>
        <Onoma x={bx + 0.72 * bw} y={by - 30} texto="¡CURITA!" k={rp(t, a, T.curita, 0.6)} color={RO.oro} px={70} rot={-8} id="rom-curita" />
      </svg>
      <Frases frases={[{ t: 0.02, texto: "si aparece una grieta…", px: 74 }, { t: T.f2, texto: "el agua entra", color: RO.cian, px: 90 }, { t: T.f3, texto: "los cristales la sellan", color: RO.oro, px: 70 }]} y={352} ancho={860} />
      <Chip texto="hormigón con curitas automáticas" x={W / 2} y={1370} color={RO.oro} id="rom-curitas" ancho={740} opacidad={rp(t, a, T.chip, 0.4)} />
      <Fuente texto="Esquema: los cristales (Al-tobermorita y filipsita) refuerzan la mezcla y rellenan poros; el sellado de fisuras se ilustra de forma simplificada" delay={1.2} y={1625} />
    </FondoLab>
  );
};

/* ───────────── rom-grumos ───────────── */

export const RomGrumos: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const T = TRM.grumos;
  const bx = 140, by = 640, bw = 800, bh = 640;
  const sB = spr(f, a(T.bloque), { damping: 13, stiffness: 110, mass: 0.9 });
  const fis = rp(t, a, T.fisura, 0.5);
  const dis = easeInOut((t - a(T.disuelve)) / a(1.6));
  const tapa = easeInOut((t - a(T.tapa)) / a(1.6));
  const kB = spr(f, a(T.botiquin), { damping: 9, stiffness: 150, mass: 0.7 });
  const kg = rp(t, a, T.grumo, 0.5);
  const grum = (cx: number, cy: number, r: number, i: number) => Array.from({ length: 9 }, (_, k) => { const an = (k / 9) * Math.PI * 2; const rr = r * (0.75 + azar(i * 7 + k) * 0.4) * (1 - 0.5 * dis); return `${(cx + Math.cos(an) * rr).toFixed(1)},${(cy + Math.sin(an) * rr).toFixed(1)}`; }).join(" ");
  const poli = [[0.05, 0.1], [0.28, 0.3], [0.5, 0.45], [0.72, 0.62], [0.95, 0.85]].map(([u, v]) => `${bx + u * bw},${by + v * bh}`).join(" ");
  return (
    <FondoLab tono="cian">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g opacity={clamp(sB * 2)} transform={`translate(0 ${(1 - sB) * 60})`}>
          <Bloque x={bx} y={by} w={bw} h={bh} poros={6} semilla={9} agua={0.3} />
          {/* grumos de cal */}
          <polygon points={grum(bx + 0.5 * bw, by + 0.45 * bh, 80, 1)} fill="#F4F1E8" stroke="#BDB5A2" strokeWidth={4} opacity={clamp(kg * 2)} />
          <polygon points={grum(bx + 0.22 * bw, by + 0.7 * bh, 50, 2)} fill="#F4F1E8" stroke="#BDB5A2" strokeWidth={4} opacity={clamp(kg * 2)} />
          <polygon points={grum(bx + 0.8 * bw, by + 0.25 * bh, 55, 3)} fill="#F4F1E8" stroke="#BDB5A2" strokeWidth={4} opacity={clamp(kg * 2)} />
          {/* fisura que atraviesa el grumo */}
          <polyline points={poli} fill="none" stroke="#14110D" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" opacity={fis * (1 - 0.9 * tapa)} />
          {/* calcio disuelto que fluye por la fisura y se recristaliza */}
          {dis > 0 && Array.from({ length: 10 }, (_, i) => { const q = (t * 0.4 + i / 10) % 1; return <Ion key={i} x={bx + (0.5 + (i % 2 ? 1 : -1) * 0.4 * q) * bw} y={by + (0.45 + (i % 2 ? 1 : -1) * 0.3 * q) * bh} texto="Ca" color={RO.marmol} r={19} id={`rom-ca${i}`} k={dis * clamp(q * 5)} />; })}
          {tapa > 0 && <polyline points={poli} fill="none" stroke="#FFFFFF" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" opacity={0.85 * tapa} />}
        </g>
        <Evidencia x={bx + 0.5 * bw} y={by - 190} texto="grumo de cal" k={kg} ancho={340} id="rom-grumo" />
        {/* botiquín */}
        <g opacity={clamp(kB * 2)} transform={`translate(${bx + 0.2 * bw} ${by + bh + 150}) scale(${0.6 + 0.4 * kB})`}>
          <rect x={-90} y={-60} width={180} height={120} rx={16} fill="#F4F1E8" stroke="#8A8F96" strokeWidth={6} /><rect x={-40} y={-80} width={80} height={26} rx={8} fill="none" stroke="#8A8F96" strokeWidth={6} />
          <path d="M -26 0 H 26 M 0 -26 V 26" stroke="#D3382C" strokeWidth={18} strokeLinecap="round" />
        </g>
        <text x={bx + 0.2 * bw + 130} y={by + bh + 160} fontFamily={MONOF} fontWeight={800} fontSize={30} fill={RO.cian} opacity={kB} data-texto="rom-botiquin">botiquín incluido</text>
      </svg>
      <Frases frases={[{ t: 0.02, texto: "además: grumos de cal", px: 78 }, { t: T.f2, texto: "si hay fisura, se disuelven", color: RO.cian, px: 62 }, { t: T.f3, texto: "y la tapan", color: RO.oro, px: 104 }]} y={352} ancho={860} />
      <Chip texto="Seymour, Masic et al. · MIT, 2023" x={W / 2} y={1530} color={RO.oro} id="rom-mit" ancho={680} opacidad={rp(t, a, T.chip, 0.4)} />
      <Fuente texto="Estudio de 2023 (Science Advances): mezclar cal viva con ceniza «en caliente» deja grumos de cal que pueden disolverse y recristalizar como calcita en las fisuras · esquema" delay={1.2} y={1618} />
    </FondoLab>
  );
};

/* ───────────── rom-panteon ───────────── */

export const RomPanteon: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const T = TRM.panteon;
  const sV = spr(f, a(T.viaducto), { damping: 13, stiffness: 110, mass: 0.9 });
  const parte = easeInOut((t - a(T.parte)) / a(1.6));
  const sP = spr(f, a(T.panteon), { damping: 12, stiffness: 100, mass: 1 });
  const brillo = easeOut((t - a(T.brillo)) / a(1.6));
  const kc = spr(f, a(T.cartel), { damping: 10, stiffness: 140, mass: 0.7 });
  return (
    <FondoLab tono="ambar">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g opacity={clamp(sV * 2)} transform={`translate(0 ${(1 - sV) * 60})`}>
          <Viaducto x={540} y={660} w={500} k={parte} t={t} />
          <Mar y={930} t={t} alto={90} />
        </g>
        {/* cartel con asterisco */}
        <g opacity={clamp(kc * 2)} transform={`translate(540 540) scale(${0.7 + 0.3 * kc})`}>
          <rect x={-250} y={-44} width={500} height={88} rx={14} fill="#F4F1E8" stroke="#04101A" strokeWidth={6} />
          <text x={0} y={14} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={44} fill="#04101A" data-texto="rom-garantia">GARANTÍA: 50 AÑOS*</text>
        </g>
        <line x1={0} y1={1030} x2={W} y2={1030} stroke={RO.ambar} strokeWidth={3} strokeDasharray="14 10" opacity={0.7} />
        <rect x={0} y={1034} width={W} height={530} fill="#2A1E10" opacity={0.85} />
        <g opacity={clamp(sP * 2)} transform={`translate(0 ${(1 - sP) * 60})`}>
          <Panteon x={540} y={1500} s={0.78} t={t} brillo={brillo} />
        </g>
        <line x1={0} y1={1514} x2={W} y2={1514} stroke="#8F7B52" strokeWidth={4} />
      </svg>
      <Frases frases={[{ t: 0.02, texto: "el Panteón de Roma", px: 84 }, { t: T.f2, texto: "cúpula sin acero", color: RO.oro, px: 82 }, { t: T.f3, texto: "casi dos mil años en pie", color: RO.cian, px: 66 }]} y={352} ancho={860} />
      <Chip texto="*no aplica: mar, sal ni tiempo" x={W / 2} y={990} color="#FF8A6A" id="rom-asterisco" ancho={640} opacidad={rp(t, a, T.chip1, 0.4)} />
      <Chip texto="Panteón · hormigón sin acero · ≈ 126 d. C." x={W / 2} y={1566} color={RO.oro} id="rom-pant" ancho={760} opacidad={rp(t, a, T.chip2, 0.4)} />
      <Fuente texto="La cúpula del Panteón (≈ 43 m de diámetro) es hormigón con ceniza puzolánica y sin armadura de acero; el viaducto es genérico y la «garantía» es una parodia de las vidas de diseño modernas" delay={1.4} y={1625} />
    </FondoLab>
  );
};

/* ───────────── rom-sesgo ───────────── */

export const RomSesgo: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const T = TRM.sesgo;
  const sF = spr(f, a(T.fila), { damping: 13, stiffness: 110, mass: 0.9 });
  const foco = easeOut((t - a(T.foco)) / a(0.8));
  const gk = rp(t, a, T.globo, 0.4);
  const n = 9, sobrev = 4;
  return (
    <FondoLab tono="ambar">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        {/* foco sobre el sobreviviente */}
        <polygon points={`${140 + sobrev * 100},420 ${140 + sobrev * 100 - 220},1250 ${140 + sobrev * 100 + 220},1250`} fill="#FFF6C4" opacity={0.1 * foco} />
        <g opacity={clamp(sF * 2)} transform={`translate(0 ${(1 - sF) * 60})`}>
          <line x1={0} y1={1250} x2={W} y2={1250} stroke="#8F7B52" strokeWidth={4} />
          {Array.from({ length: n }, (_, i) => {
            const x = 140 + i * 100;
            const cae = clamp((t - a(T.caen + i * 0.3)) / a(0.6));
            const vivo = i === sobrev;
            if (vivo) return (
              <g key={i} transform={`translate(${x} 1250)`}>
                <polygon points="-48,-190 0,-240 48,-190" fill="#D9CFB8" stroke="#6A604C" strokeWidth={4} /><rect x={-50} y={-190} width={100} height={190} fill="#CFC5AD" stroke="#6A604C" strokeWidth={4} />
                {[-30, 0, 30].map((dx) => <rect key={dx} x={dx - 8} y={-175} width={16} height={160} fill="#EDE6D6" stroke="#6A604C" strokeWidth={2} />)}
                <text x={0} y={46} textAnchor="middle" fontFamily={MONOF} fontWeight={800} fontSize={24} fill={RO.oro} opacity={foco} data-texto="rom-sobrev">¡en pie!</text>
              </g>
            );
            const h = 150 + azar(i * 3.3) * 80;
            return (
              <g key={i} transform={`translate(${x} 1250)`} opacity={1 - 0.35 * cae}>
                <g transform={`rotate(${(i % 2 ? 1 : -1) * 70 * cae} ${i % 2 ? 50 : -50} 0) translate(0 ${cae * 4})`}>
                  <rect x={-44} y={-h * (1 - 0.4 * cae)} width={88} height={h * (1 - 0.4 * cae)} fill="#6C655A" stroke="#2E2A24" strokeWidth={4} />
                  <polygon points={`-52,${-h * (1 - 0.4 * cae)} 0,${-h * (1 - 0.4 * cae) - 40} 52,${-h * (1 - 0.4 * cae)}`} fill="#7C7468" stroke="#2E2A24" strokeWidth={4} />
                </g>
                {cae > 0.5 && <g opacity={clamp((cae - 0.5) * 2)}><path d="M -26 -120 L 26 -70 M 26 -120 L -26 -70" stroke={RO.rojo} strokeWidth={8} strokeLinecap="round" /></g>}
                {cae > 0.7 && <text x={0} y={46} textAnchor="middle" fontFamily={MONOF} fontWeight={800} fontSize={18} fill="#C9BFA8" opacity={clamp((cae - 0.7) * 3)} data-texto={`rom-chap${i}`}>chapuza</text>}
              </g>
            );
          })}
        </g>
        <g opacity={rp(t, a, T.globo - 0.4, 0.4)}><Inspector x={170} y={1565} s={1.0} fase={t * 2} /></g>
        {gk > 0 && <Globo x={230} y={1480} texto="Los malos no salen en documentales." ancho={460} k={gk} lado="izq" px={28} id="rom-malos" />}
      </svg>
      <Frases frases={[{ t: 0.02, texto: "ojo: lo malo se cayó", px: 78 }, { t: T.f2, texto: "sesgo del sobreviviente", color: RO.ambar, px: 68 }]} y={352} ancho={860} />
      <Chip texto="solo vemos lo que resistió" x={W / 2 + 130} y={1566} color={RO.oro} id="rom-solo" ancho={560} opacidad={rp(t, a, T.chip, 0.4)} />
      <Fuente texto="Esquema ilustrativo del sesgo del sobreviviente: de las construcciones romanas solo conocemos las que no se cayeron" delay={1.0} y={1625} />
    </FondoLab>
  );
};

/* ───────────── rom-co2 ───────────── */

export const RomCo2: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const T = TRM.co2;
  const sF = spr(f, a(T.fabrica), { damping: 12, stiffness: 100, mass: 1 });
  const k1 = easeOut((t - a(T.dato1)) / a(1.6));
  const k2 = easeOut((t - a(T.dato2)) / a(1.6));
  const gk = rp(t, a, T.cof, 0.4);
  return (
    <FondoLab tono="rojo">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <rect x={0} y={1500} width={W} height={100} fill="#1B1210" />
        <g opacity={clamp(sF * 2)} transform={`translate(0 ${(1 - sF) * 80})`}><Fabrica x={540} y={1500} s={0.85} t={t} k={clamp(sF)} /></g>
        {gk > 0 && <Globo x={600} y={1230} texto="¡Cof, cof!" ancho={260} k={gk} lado="izq" id="rom-cof" />}
      </svg>
      <Dato valor={ROM.clinkerC * k1} x={W / 2} y={520} px={104} digitos={4} color={RO.ambar} prefijo="más de " sufijo=" °C" etiqueta="a eso se cuece el cemento moderno" etiquetaY={622} id="rom-grados" opacidad={clamp(k1 * 4)} />
      <Dato valor={ROM.co2Pct * k2} x={W / 2} y={780} px={104} digitos={1} color={RO.rojo} prefijo="≈ " sufijo=" %" etiqueta="del CO₂ mundial viene del cemento" etiquetaY={882} id="rom-co2" opacidad={clamp(k2 * 4)} />
      <Frases frases={[{ t: 0.02, texto: "el cemento moderno", px: 80 }, { t: T.f2, texto: "también contamina", color: "#FF8A6A", px: 80 }]} y={352} ancho={860} />
      <Chip texto="las estimaciones van de ≈ 6 a ≈ 8 %" x={W / 2} y={1566} color={RO.ambar} id="rom-rango" ancho={700} opacidad={rp(t, a, T.chip, 0.4)} />
      <Fuente texto="El clínker de cemento Portland se cuece a ≈ 1.450 °C; la industria del cemento emite entre ≈ 6 y 8 % del CO₂ mundial según la fuente · esquema" delay={1.2} y={1625} />
    </FondoLab>
  );
};

/* ───────────── rom-caso ───────────── */

export const RomCaso: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const T = TRM.caso;
  const sM = spr(f, a(T.muelle), { damping: 12, stiffness: 100, mass: 1 });
  const brillo = easeOut((t - a(T.brillo)) / a(2.4));
  const ki = rp(t, a, T.insp, 0.4);
  const ks = rp(t, a, T.sello, 0.4);
  return (
    <FondoLab tono="ambar">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <circle cx={540} cy={1020} r={260} fill="#FFB020" opacity={0.12} /><circle cx={540} cy={1020} r={140} fill="#FFD98A" opacity={0.2} />
        <g opacity={clamp(sM * 2)} transform={`translate(0 ${(1 - sM) * 70})`}>
          <MuelleRomano x={540} y={1400} w={760} t={t} brillo={brillo} />
        </g>
        <Mar y={1180} t={t} alto={400} opacidad={0.55} />
        <g opacity={ki}>
          <Inspector x={880} y={1490} s={0.95} fase={t * 2} lupa={false} />
          <g transform="translate(830 1360) rotate(-12)"><rect x={-40} y={-30} width={80} height={60} rx={6} fill="#D9B66E" stroke="#7A5C2E" strokeWidth={4} /><rect x={-40} y={-38} width={34} height={12} rx={4} fill="#D9B66E" stroke="#7A5C2E" strokeWidth={4} /></g>
        </g>
        <Sello x={540} y={820} texto="CASO RESUELTO" k={ks} px={78} rot={-8} id="rom-resuelto" />
      </svg>
      <Frases frases={[{ t: 0.02, texto: "no era magia", px: 92 }, { t: T.f2, texto: "era química paciente", color: RO.oro, px: 76 }, { t: T.f3, texto: "el mar lo terminó de construir", color: RO.cian, px: 58 }]} y={352} ancho={860} />
      <Chip texto="tobermorita + agua de mar + tiempo" x={W / 2} y={1566} color={RO.oro} id="rom-formula" ancho={760} opacidad={rp(t, a, T.chip, 0.4)} />
      <Fuente texto="Resumen divulgativo de los hallazgos de Jackson (2013, 2017) y Seymour, Masic et al. (2023) · información histórica y científica general, sin asesoría de ingeniería" delay={1.2} y={1625} />
    </FondoLab>
  );
};
