/**
 * Kit «geométrico» de «La bola de 660 toneladas» (IMNOBA · carril B). Todo se dibuja con polígonos simples —cuadros, rombos y triángulos— que se
 * ensamblan como un mosaico: cada pieza llega girando desde el aire y encaja en su sitio (la idea de «cortar la imagen en formas simples y
 * volver a armarla»). Sin imágenes externas.
 *   Mosaico         ensambla una lista de facetas (polígonos de color) con llegada escalonada
 *   facetasTorre    rascacielos escalonado de 8 módulos (cuadros, triángulos y rombos) con corona y aguja
 *   facetasEsfera   esfera de facetas (rombos y triángulos) con luz dorada
 *   Pila            41 discos de acero apilados (bandas de facetas) que forman la esfera
 *   Soldador        figura de polígonos con casco, careta y soplete; Chispas (rombos que saltan)
 *   Espiral         tifón: brazos de triángulos que giran
 *   FondoPsico      fondo azul marino y violeta con mandala de rombos que gira y astillas flotantes
 *   PersonaG        persona geométrica para dar escala
 */
import React from "react";
import { azar } from "../../lib/anim";
import { useUid } from "../../estudio/util";
import { H, W, clamp, easeOut, lerp, mezclar, useReloj } from "../comun";

export type Pt = [number, number];
export type Faceta = { p: Pt[]; c: string; k: number; cx: number; cy: number; banda?: number };

export const TC = {
  navy0: "#050818",
  navy1: "#0A1030",
  violeta: "#2A1058",
  magenta: "#FF3D9A",
  cian: "#3DF0E0",
  oro: "#FFC500",
  oro1: "#FFE27A",
  oro2: "#E0A400",
  oro3: "#8A5A00",
  blanco: "#F5F7FA",
} as const;

const OROS = ["#5E3600", "#A66F00", "#E0A400", "#FFC500", "#FFE27A", "#FFF7D1"];
/** tono dorado según la luz l (0 oscuro … 1 brillo) */
export const tonoOro = (l: number): string => {
  const x = clamp(l) * (OROS.length - 1);
  const i = Math.min(OROS.length - 2, Math.floor(x));
  return mezclar(OROS[i], OROS[i + 1], x - i);
};

const fac = (p: Pt[], c: string, k: number, banda?: number): Faceta => ({ p, c, k: clamp(k), cx: p.reduce((a, q) => a + q[0], 0) / p.length, cy: p.reduce((a, q) => a + q[1], 0) / p.length, banda });
const pts = (p: Pt[]): string => p.map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(" ");

/* ───────────── Mosaico ───────────── */

/** Dibuja las facetas de `facetas` con llegada escalonada (`prog` de 0 a 1): cada una gira y cae desde un punto disperso hasta su lugar. */
export const Mosaico: React.FC<{ facetas: Faceta[]; prog: number; dispersion?: number; borde?: string; bordeOp?: number; semilla?: number; vuelo?: number }> = ({ facetas, prog, dispersion = 520, borde = "#FFFFFF", bordeOp = 0.22, semilla = 1, vuelo = 1 }) => (
  <g>
    {facetas.map((fc, i) => {
      const local = easeOut((prog - fc.k * 0.62) / 0.38);
      if (local <= 0.001) return null;
      const a1 = azar(i * 2.13 + semilla), a2 = azar(i * 3.71 + semilla), a3 = azar(i * 5.3 + semilla);
      const f = 1 - local;
      const dx = (a1 - 0.5) * dispersion * f * vuelo, dy = (-0.15 - a2 * 0.85) * dispersion * f * vuelo;
      const rot = (a3 - 0.5) * 240 * f;
      return (
        <g key={i} opacity={clamp(local * 2.4)} transform={`translate(${dx.toFixed(1)} ${dy.toFixed(1)}) translate(${fc.cx.toFixed(1)} ${fc.cy.toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${(0.35 + 0.65 * local).toFixed(3)}) translate(${(-fc.cx).toFixed(1)} ${(-fc.cy).toFixed(1)})`}>
          <polygon points={pts(fc.p)} fill={fc.c} stroke={borde} strokeOpacity={bordeOp} strokeWidth={1.2} strokeLinejoin="round" />
        </g>
      );
    })}
  </g>
);

/* ───────────── rejilla de facetas ───────────── */

type Modo = "cuadro" | "triangulo" | "rombo";

/** Rejilla de `ncol`×`nfil` entre dos alturas (el ancho cambia linealmente): cuadros, triángulos (cada celda en dos) o rombos (con triángulos en las esquinas). */
function rejilla(cx: number, yB: number, yT: number, hwB: number, hwT: number, ncol: number, nfil: number, modo: Modo, color: (f: number, c: number, mitad: number) => string, k0: number, kEsc: number, base: number): Faceta[] {
  const out: Faceta[] = [];
  for (let f = 0; f < nfil; f++) {
    const y0 = lerp(yB, yT, f / nfil), y1 = lerp(yB, yT, (f + 1) / nfil);
    const h0 = lerp(hwB, hwT, f / nfil), h1 = lerp(hwB, hwT, (f + 1) / nfil);
    const X = (c: number, h: number): number => cx - h + (2 * h * c) / ncol;
    for (let c = 0; c < ncol; c++) {
      const a: Pt = [X(c, h0), y0], b: Pt = [X(c + 1, h0), y0], d: Pt = [X(c + 1, h1), y1], e: Pt = [X(c, h1), y1];
      const k = k0 + ((base - (y0 + y1) / 2) / base) * kEsc;
      if (modo === "cuadro") out.push(fac([a, b, d, e], color(f, c, 0), k));
      else if (modo === "triangulo") {
        if ((f + c) % 2) { out.push(fac([a, b, d], color(f, c, 0), k), fac([a, d, e], color(f, c, 1), k)); }
        else { out.push(fac([a, b, e], color(f, c, 0), k), fac([b, d, e], color(f, c, 1), k)); }
      } else {
        const m = (p: Pt, q: Pt): Pt => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
        const ma = m(a, b), mb = m(b, d), mc = m(d, e), md = m(e, a);
        out.push(fac([ma, mb, mc, md], color(f, c, 0), k));
        out.push(fac([a, ma, md], color(f, c, 1), k), fac([b, mb, ma], color(f, c, 1), k), fac([d, mc, mb], color(f, c, 1), k), fac([e, md, mc], color(f, c, 1), k));
      }
    }
  }
  return out;
}

/* ───────────── rascacielos ───────────── */

/** Rascacielos de 8 módulos que se ensanchan hacia arriba (como una pagoda moderna), con podio, corona y aguja. (cx, base) = centro de la base; `H` alto total; `Wd` ancho del podio. */
export function facetasTorre(cx: number, base: number, H: number, Wd: number): Faceta[] {
  const out: Faceta[] = [];
  const vidrio = (m: number) => (f: number, c: number, mitad: number): string => {
    const paleta = ["#2FA6D0", "#1F83B4", "#18699B", "#115083"];
    const q = paleta[(f + c + m + mitad) % 4];
    return mezclar(q, "#06142D", 0.05 + 0.1 * mitad + 0.04 * c);
  };
  // podio
  out.push(...rejilla(cx, base, base - 0.045 * H, 0.5 * Wd * 1.0, 0.5 * Wd * 0.9, 9, 2, "cuadro", (f, c) => mezclar((f + c) % 2 ? "#1C5E8E" : "#16507C", "#06142D", 0.1 + 0.03 * c), 0, 0.05, base));
  const mh = 0.0865 * H;
  let yb = base - 0.045 * H;
  for (let i = 0; i < 8; i++) {
    const yt = yb - mh * 0.9;
    const hwb = 0.5 * Wd * (0.74 - 0.03 * i), hwt = hwb * 1.26;
    const modo: Modo = i % 3 === 0 ? "triangulo" : i % 3 === 1 ? "cuadro" : "rombo";
    out.push(...rejilla(cx, yb, yt, hwb, hwt, 5, 3, modo, vidrio(i), 0.04, 0.9, base));
    // filete dorado en el borde superior de cada módulo
    out.push(fac([[cx - hwt, yt], [cx + hwt, yt], [cx + hwt * 0.985, yt + 7], [cx - hwt * 0.985, yt + 7]], i % 2 ? TC.oro2 : TC.oro, 0.04 + ((base - yt) / base) * 0.9));
    yb -= mh;
  }
  // corona y aguja
  const kC = 0.93;
  out.push(...rejilla(cx, yb, yb - 0.06 * H, 0.5 * Wd * 0.34, 0.5 * Wd * 0.3, 3, 2, "cuadro", (f, c) => mezclar("#7FC3E6", "#0F3F66", 0.2 + 0.2 * c + 0.1 * f), kC, 0.04, base));
  const yc2 = yb - 0.06 * H;
  out.push(...rejilla(cx, yc2, yc2 - 0.05 * H, 0.5 * Wd * 0.2, 0.5 * Wd * 0.16, 2, 2, "rombo", (f, c, m) => (m ? "#5BA9D4" : "#BFE6FA"), kC + 0.02, 0.03, base));
  const yA = base - H, yS = yc2 - 0.05 * H;
  out.push(fac([[cx - 7, yS], [cx, yA], [cx, yS]], "#E9F6FF", 1), fac([[cx, yA], [cx + 7, yS], [cx, yS]], "#8DBBD6", 1));
  out.push(fac([[cx - 7, yS], [cx, yS - (yS - yA) * 0.45], [cx + 7, yS]], TC.oro, 0.99));
  return out;
}

/* ───────────── esfera de facetas ───────────── */

/** Esfera de facetas (cuadros que se vuelven rombos y triángulos hacia los polos) vista de frente, con la luz arriba a la izquierda. `rot` gira las facetas (radianes). */
export function facetasEsfera(cx: number, cy: number, R: number, nLat: number, nLon: number, rot = 0): Faceta[] {
  const out: Faceta[] = [];
  const L = (() => { const x = -0.45, y = 0.55, z = 0.7, n = Math.hypot(x, y, z); return [x / n, y / n, z / n]; })();
  const P = (la: number, lo: number): Pt => [cx + R * Math.cos(la) * Math.sin(lo), cy - R * Math.sin(la)];
  for (let i = 0; i < nLat; i++) {
    const la0 = -Math.PI / 2 + (Math.PI * i) / nLat, la1 = -Math.PI / 2 + (Math.PI * (i + 1)) / nLat;
    for (let j = 0; j < nLon; j++) {
      const lo0 = rot + (2 * Math.PI * j) / nLon - Math.PI, lo1 = rot + (2 * Math.PI * (j + 1)) / nLon - Math.PI;
      const lam = (lo0 + lo1) / 2, phi = (la0 + la1) / 2;
      const z = Math.cos(phi) * Math.cos(lam);
      if (z < -0.02) continue;
      const nx = Math.cos(phi) * Math.sin(lam), ny = Math.sin(phi);
      const l = Math.max(0, nx * L[0] + ny * L[1] + z * L[2]) * 0.86 + 0.12 + (((i + j) % 2) ? 0.045 : -0.02);
      const a = P(la0, lo0), b = P(la0, lo1), d = P(la1, lo1), e = P(la1, lo0);
      const k = azar(i * 7.7 + j * 1.3) * 0.5 + (i / nLat) * 0.5;
      const c = tonoOro(l);
      if (i === 0) out.push(fac([a, d, e], c, k));
      else if (i === nLat - 1) out.push(fac([a, b, e], c, k));
      else if ((i + j) % 2) out.push(fac([a, b, d], c, k), fac([a, d, e], tonoOro(l - 0.08), k));
      else out.push(fac([a, b, d, e], c, k));
    }
  }
  return out;
}

/* ───────────── pila de 41 discos ───────────── */

/**
 * Pila de discos de acero que forman una esfera: `n` bandas de `cols` facetas, de abajo hacia arriba. `hasta` = discos terminados (admite decimales: el siguiente
 * está cayendo). `R` = radio de la esfera; (cx, yBot) = centro de la base. `soldadura` (0–1) ilumina la costura del último disco.
 */
export const Pila: React.FC<{ cx: number; yBot: number; R: number; n?: number; cols?: number; hasta: number; soldadura?: number; halo?: number }> = ({ cx, yBot, R, n = 41, cols = 8, hasta, soldadura = 0, halo = 0 }) => {
  const uid = useUid();
  const bh = (2 * R) / n, cyS = yBot - R;
  const hw = (y: number): number => Math.max(R * 0.1, Math.sqrt(Math.max(0, R * R - (y - cyS) * (y - cyS))));
  const bandas: React.ReactNode[] = [];
  const completos = Math.floor(hasta), frac = hasta - completos;
  for (let k = 0; k < Math.min(n, Math.ceil(hasta)); k++) {
    const caida = k === completos ? easeOut(frac) : 1;
    const off = (1 - caida) * -190;
    const yB = yBot - k * bh, yT = yB - bh;
    const hB = hw(yB - 0.5), hT = hw(yT + 0.5);
    const par = k % 2 ? -0.07 : 0.04;
    const v = ((cyS - (yB + yT) / 2) / R) * 0.1;
    const caras = Array.from({ length: cols }, (_, c) => {
      const u = ((c + 0.5) / cols) * 2 - 1;
      const l = 0.3 + 0.62 * Math.max(0, 1 - Math.abs(u + 0.4) * 0.95) + par + v;
      const x0b = cx - hB + (2 * hB * c) / cols, x1b = cx - hB + (2 * hB * (c + 1)) / cols;
      const x0t = cx - hT + (2 * hT * c) / cols, x1t = cx - hT + (2 * hT * (c + 1)) / cols;
      return <polygon key={c} points={pts([[x0b, yB], [x1b, yB], [x1t, yT], [x0t, yT]])} fill={tonoOro(l)} stroke="#FFF2B0" strokeOpacity={0.42} strokeWidth={1} strokeLinejoin="round" />;
    });
    const brilla = k === completos - 1 ? soldadura : 0;
    bandas.push(
      <g key={k} opacity={clamp(caida * 2.5)} transform={`translate(0 ${off.toFixed(1)})`}>
        {caras}
        <line x1={cx - hB} y1={yB} x2={cx + hB} y2={yB} stroke="#FFFFFF" strokeOpacity={0.35 + 0.65 * brilla} strokeWidth={1.5 + 4 * brilla} />
      </g>,
    );
  }
  return (
    <g>
      <defs><radialGradient id={`${uid}h`} cx="50%" cy="50%" r="50%"><stop offset="0" stopColor={TC.oro} stopOpacity={0.55} /><stop offset="1" stopColor={TC.oro} stopOpacity="0" /></radialGradient></defs>
      {halo > 0.01 && <circle cx={cx} cy={cyS} r={R * 1.5} fill={`url(#${uid}h)`} opacity={halo} />}
      {bandas}
    </g>
  );
};

/* ───────────── soldador y chispas ───────────── */

const barra = (a: Pt, b: Pt, g: number): Pt[] => {
  const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = (-dy / l) * g / 2, ny = (dx / l) * g / 2;
  return [[a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny], [b[0] - nx, b[1] - ny], [a[0] - nx, a[1] - ny]];
};

/** Chispas: rombos que salen en abanico desde (x, y) y caen. `t` en s; `n` chispas; `ritmo` ráfagas por segundo. */
export const Chispas: React.FC<{ x: number; y: number; t: number; n?: number; ritmo?: number; semilla?: number; escala?: number; dir?: number }> = ({ x, y, t, n = 14, ritmo = 3.2, semilla = 1, escala = 1, dir = 1 }) => (
  <g>
    {Array.from({ length: n }, (_, i) => {
      const ciclo = (t * ritmo + i / n + azar(i * 1.7 + semilla)) % 1;
      const ang = (-160 + azar(i * 3.1 + semilla) * 130) * (Math.PI / 180);
      const v = (140 + azar(i * 5.3 + semilla) * 220) * escala;
      const tau = ciclo * 0.55;
      const px = x + dir * Math.cos(ang) * v * tau, py = y + Math.sin(ang) * v * tau + 520 * tau * tau * escala;
      const s = (4 + azar(i * 7.9 + semilla) * 6) * (1 - ciclo * 0.7) * escala;
      const col = i % 3 === 0 ? "#FFFFFF" : i % 3 === 1 ? TC.oro1 : TC.oro;
      return <polygon key={i} points={`${px},${py - s * 1.5} ${px + s},${py} ${px},${py + s * 1.5} ${px - s},${py}`} fill={col} opacity={clamp(1 - ciclo * 1.1)} transform={`rotate(${(ciclo * 360 + i * 40) % 360} ${px} ${py})`} />;
    })}
  </g>
);

/** Soldador de polígonos que mira a la izquierda: (x, y) = pies. Su soplete apunta a `punta` (coordenadas del lienzo) y llega hasta allí; `s` = escala. */
export const Soldador: React.FC<{ x: number; y: number; s?: number; punta: Pt; fase?: number }> = ({ x, y, s = 1, punta, fase = 0 }) => {
  const sx = (v: number): number => x + v * s, sy = (v: number): number => y + v * s;
  const hombro: Pt = [sx(-6), sy(-122)];
  const dx = punta[0] - hombro[0], dy = punta[1] - hombro[1], l = Math.hypot(dx, dy) || 1;
  const alcance = Math.min(l, 92 * s);
  const mano: Pt = [hombro[0] + (dx / l) * alcance, hombro[1] + (dy / l) * alcance];
  const bob = Math.sin(fase * 6) * 1.4 * s;
  return (
    <g>
      <ellipse cx={x} cy={y + 2} rx={44 * s} ry={6 * s} fill="#000" opacity={0.35} />
      {/* piernas y botas */}
      <polygon points={`${sx(-22)},${sy(-78)} ${sx(-4)},${sy(-78)} ${sx(-8)},${sy(-8)} ${sx(-26)},${sy(-8)}`} fill="#1D2E63" stroke="#8FB4FF" strokeOpacity={0.35} />
      <polygon points={`${sx(2)},${sy(-78)} ${sx(22)},${sy(-78)} ${sx(24)},${sy(-8)} ${sx(6)},${sy(-8)}`} fill="#172451" stroke="#8FB4FF" strokeOpacity={0.35} />
      <polygon points={`${sx(-32)},${sy(-8)} ${sx(-8)},${sy(-8)} ${sx(-8)},${sy(0)} ${sx(-34)},${sy(0)}`} fill="#0B0F1F" />
      <polygon points={`${sx(4)},${sy(-8)} ${sx(28)},${sy(-8)} ${sx(30)},${sy(0)} ${sx(4)},${sy(0)}`} fill="#0B0F1F" />
      {/* torso con chaleco naranja y bandas reflectivas */}
      <polygon points={`${sx(-26)},${sy(-124 + bob)} ${sx(24)},${sy(-124 + bob)} ${sx(20)},${sy(-74)} ${sx(-22)},${sy(-74)}`} fill="#FF8A1F" stroke="#FFD08A" strokeOpacity={0.5} />
      <polygon points={`${sx(-24)},${sy(-104)} ${sx(22)},${sy(-104)} ${sx(21)},${sy(-96)} ${sx(-23)},${sy(-96)}`} fill="#FFF3D1" opacity={0.9} />
      <polygon points={`${sx(-23)},${sy(-88)} ${sx(21)},${sy(-88)} ${sx(20.5)},${sy(-82)} ${sx(-22.5)},${sy(-82)}`} fill="#FFF3D1" opacity={0.9} />
      {/* brazo y soplete */}
      <polygon points={pts(barra(hombro, mano, 15 * s))} fill="#FF8A1F" stroke="#FFD08A" strokeOpacity={0.5} />
      <polygon points={pts(barra(mano, punta, 5 * s))} fill="#C9D3DE" />
      <polygon points={`${mano[0] - 8 * s},${mano[1] - 8 * s} ${mano[0] + 8 * s},${mano[1] - 8 * s} ${mano[0] + 8 * s},${mano[1] + 8 * s} ${mano[0] - 8 * s},${mano[1] + 8 * s}`} fill="#2B2B33" />
      <circle cx={punta[0]} cy={punta[1]} r={9 * s} fill="#FFFFFF" opacity={0.85} />
      <circle cx={punta[0]} cy={punta[1]} r={22 * s} fill={TC.oro1} opacity={0.28} />
      {/* casco con careta */}
      <polygon points={`${sx(-20)},${sy(-148 + bob)} ${sx(-8)},${sy(-168 + bob)} ${sx(14)},${sy(-168 + bob)} ${sx(26)},${sy(-148 + bob)} ${sx(22)},${sy(-128 + bob)} ${sx(-16)},${sy(-128 + bob)}`} fill="#8A97A8" stroke="#E6EEF7" strokeOpacity={0.6} />
      <polygon points={`${sx(-18)},${sy(-146 + bob)} ${sx(2)},${sy(-146 + bob)} ${sx(0)},${sy(-130 + bob)} ${sx(-14)},${sy(-130 + bob)}`} fill="#0B2A3A" />
      <polygon points={`${sx(-16)},${sy(-144 + bob)} ${sx(-8)},${sy(-144 + bob)} ${sx(-12)},${sy(-136 + bob)}`} fill="#7DE6FF" opacity={0.7} />
      <polygon points={`${sx(-8)},${sy(-168 + bob)} ${sx(14)},${sy(-168 + bob)} ${sx(16)},${sy(-176 + bob)} ${sx(-4)},${sy(-176 + bob)}`} fill={TC.oro} />
    </g>
  );
};

/* ───────────── tifón ───────────── */

/** Tifón: brazos de triángulos que giran alrededor de un ojo oscuro. */
export const Espiral: React.FC<{ cx: number; cy: number; R: number; t: number; brazos?: number; op?: number }> = ({ cx, cy, R, t, brazos = 5, op = 1 }) => (
  <g opacity={op}>
    <circle cx={cx} cy={cy} r={R * 1.05} fill="#0B1235" opacity={0.55} />
    {Array.from({ length: brazos }, (_, a) =>
      Array.from({ length: 14 }, (_, j) => {
        const u = j / 13;
        const r = R * (0.14 + 0.86 * u);
        const ang = (a * 2 * Math.PI) / brazos + u * 3.4 + t * 1.5;
        const x = cx + r * Math.cos(ang), y = cy + r * Math.sin(ang);
        const g = 7 + 22 * u;
        const rot = ((ang + Math.PI / 2) * 180) / Math.PI;
        return <polygon key={`${a}-${j}`} points={`${x},${y - g} ${x + g * 0.7},${y + g * 0.6} ${x - g * 0.7},${y + g * 0.6}`} fill={mezclar(TC.cian, "#7A5CFF", u)} opacity={0.35 + 0.5 * (1 - u * 0.5)} transform={`rotate(${rot} ${x} ${y})`} />;
      }),
    )}
    <circle cx={cx} cy={cy} r={R * 0.12} fill="#050818" />
  </g>
);

/* ───────────── persona geométrica ───────────── */

/** Persona de polígonos (≈ 170 px de alto con s = 1): cabeza octogonal, torso, brazos y piernas. (x, y) = pies. */
export const PersonaG: React.FC<{ x: number; y: number; s?: number; color?: string }> = ({ x, y, s = 1, color = "#2B5BC4" }) => {
  const X = (v: number): number => x + v * s, Y = (v: number): number => y + v * s;
  const oct = Array.from({ length: 8 }, (_, i) => `${X(Math.cos((i * Math.PI) / 4 + Math.PI / 8) * 13)},${Y(-154 + Math.sin((i * Math.PI) / 4 + Math.PI / 8) * 13)}`).join(" ");
  return (
    <g>
      <ellipse cx={x} cy={y + 2} rx={30 * s} ry={5 * s} fill="#000" opacity={0.35} />
      <polygon points={`${X(-14)},${Y(-84)} ${X(-2)},${Y(-84)} ${X(-5)},${Y(0)} ${X(-17)},${Y(0)}`} fill="#18264F" />
      <polygon points={`${X(2)},${Y(-84)} ${X(14)},${Y(-84)} ${X(17)},${Y(0)} ${X(5)},${Y(0)}`} fill="#121D42" />
      <polygon points={`${X(-18)},${Y(-138)} ${X(18)},${Y(-138)} ${X(14)},${Y(-82)} ${X(-14)},${Y(-82)}`} fill={color} stroke="#BFD4FF" strokeOpacity={0.5} />
      <polygon points={`${X(-18)},${Y(-136)} ${X(-26)},${Y(-92)} ${X(-20)},${Y(-90)} ${X(-12)},${Y(-130)}`} fill={color} stroke="#BFD4FF" strokeOpacity={0.4} />
      <polygon points={`${X(18)},${Y(-136)} ${X(26)},${Y(-92)} ${X(20)},${Y(-90)} ${X(12)},${Y(-130)}`} fill={color} stroke="#BFD4FF" strokeOpacity={0.4} />
      <polygon points={oct} fill="#F1C9A5" stroke="#FFFFFF" strokeOpacity={0.4} />
    </g>
  );
};

/* ───────────── fondo ───────────── */

/** Fondo psicodélico y sobrio: degradado azul marino a violeta, mandala de rombos que gira y astillas que flotan. Cubre todo el cuadro. */
export const FondoPsico: React.FC<{ cy?: number; children?: React.ReactNode; mandala?: number }> = ({ cy = 900, children, mandala = 1 }) => {
  const { t } = useReloj();
  const uid = useUid();
  const anillos = [{ r: 250, n: 12, v: 0.06, c: TC.oro }, { r: 400, n: 16, v: -0.045, c: TC.magenta }, { r: 570, n: 22, v: 0.035, c: TC.cian }, { r: 760, n: 28, v: -0.03, c: TC.oro }];
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: TC.navy1 }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id={`${uid}bg`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={TC.navy0} /><stop offset="0.45" stopColor="#120A38" /><stop offset="0.8" stopColor={TC.violeta} /><stop offset="1" stopColor="#0A0820" /></linearGradient>
          <radialGradient id={`${uid}gl`} cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#7A3CFF" stopOpacity={0.42} /><stop offset="1" stopColor="#7A3CFF" stopOpacity="0" /></radialGradient>
          <radialGradient id={`${uid}vg`} cx="50%" cy="46%" r="78%"><stop offset="0.55" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity="0.55" /></radialGradient>
        </defs>
        <rect width={W} height={H} fill={`url(#${uid}bg)`} />
        <ellipse cx={W / 2} cy={cy} rx={640} ry={640} fill={`url(#${uid}gl)`} />
        <g opacity={mandala}>
          {anillos.map((an, i) => (
            <g key={i} transform={`rotate(${(t * an.v * 360).toFixed(2)} ${W / 2} ${cy})`}>
              {Array.from({ length: an.n }, (_, j) => {
                const a = (j * 2 * Math.PI) / an.n;
                const x = W / 2 + an.r * Math.cos(a), y = cy + an.r * Math.sin(a);
                const g = 20 + i * 9;
                return <polygon key={j} points={`${x},${y - g * 1.5} ${x + g},${y} ${x},${y + g * 1.5} ${x - g},${y}`} fill="none" stroke={an.c} strokeOpacity={0.1 + 0.07 * Math.sin(t * 1.6 + j + i)} strokeWidth={2} transform={`rotate(${(a * 180) / Math.PI + 90} ${x} ${y})`} />;
              })}
            </g>
          ))}
        </g>
        {Array.from({ length: 24 }, (_, i) => {
          const x = (azar(i * 3.1) * W + Math.sin(t * 0.5 + i) * 30 + W) % W;
          const y = (azar(i * 5.7 + 1) * H - t * (14 + azar(i) * 22) + H * 6) % H;
          const g = 6 + azar(i * 9.3) * 12;
          const forma = i % 3;
          const col = i % 4 === 0 ? TC.magenta : i % 4 === 1 ? TC.cian : TC.oro;
          const rot = t * (20 + azar(i * 2) * 50) * (i % 2 ? 1 : -1);
          const p = forma === 0 ? `${x},${y - g * 1.4} ${x + g},${y} ${x},${y + g * 1.4} ${x - g},${y}` : forma === 1 ? `${x - g},${y - g} ${x + g},${y - g} ${x + g},${y + g} ${x - g},${y + g}` : `${x},${y - g * 1.2} ${x + g * 1.1},${y + g * 0.8} ${x - g * 1.1},${y + g * 0.8}`;
          return <polygon key={i} points={p} fill={col} opacity={0.12 + 0.2 * azar(i * 7.7)} transform={`rotate(${rot.toFixed(1)} ${x} ${y})`} />;
        })}
        <rect width={W} height={H} fill={`url(#${uid}vg)`} />
      </svg>
      {children}
      <div style={{ position: "absolute", inset: 0, background: "#02030C", opacity: clamp(1 - t / 0.25) * 0.85, pointerEvents: "none" }} />
    </div>
  );
};
