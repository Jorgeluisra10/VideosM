import React, { useId } from "react";
import { Easing } from "remotion";
import { C, FUENTE } from "../../lib/colores";
import { azar, clamp, onda, pop, prog, useT } from "../../lib/anim";
import { MARCA } from "../../lib/marca";
import { existeMedia, razonMedia, rutaMedia, useImagenLista } from "../../lib/media";
import { anchoEstimado } from "../../lib/texto";
import { PALABRAS } from "../../lib/voz";
import { Etiqueta, Marcas, Trazo } from "../../components/svg/primitivas";
import { tiempoAncla } from "../anclas";
import { movimientoFoto } from "../kenburns";
import { formatoMonto, medidasCta, medidasFicha, medidasLista, medidasPrecio, miles, valorMonto } from "../layout-negocio";
import { pu, px, py } from "../medidas";
import { Cristal } from "../vidrio";
import { Aparece, El, ElProps, col, lineasDe, num, texto } from "./comun";
import { TextoCaja, ajustarTexto } from "./datos";
import { dibujarIcono } from "./dibujo";

const idSeguro = (s: string) => s.replace(/[^a-zA-Z0-9]/g, "");

// ---------------------------------------------------------------------------
// Foto enmarcada con movimiento de cámara
// ---------------------------------------------------------------------------
export const FotoEl: React.FC<ElProps> = ({ el, t0, t1 }) => {
  const t = useT();
  const archivo = texto(el.archivo);
  const ok = existeMedia(archivo);
  useImagenLista(ok ? rutaMedia(archivo) : null);
  const idClip = "cf" + idSeguro(useId());
  const w = pu(el.ancho, 80);
  const h = pu(el.alto, 56);
  const cx = px(el.x);
  const cy = py(el.y);
  const forma = texto(el.forma, "redondeado");
  const r = forma === "rect" ? 4 : forma === "circulo" ? Math.min(w, h) / 2 : 34;
  const k = Math.min(1.08, pop(t, t0));
  const fin = t1 < 9000 ? t1 : t0 + 8;
  const p = clamp((t - t0) / Math.max(2.5, fin - t0));
  const m = movimientoFoto(texto(el.mov, "zoom-in"), p);
  const borde = el.borde ? col(el.borde) : null;
  const pie = ajustarTexto(texto(el.pie), w - 90, 56, 34, 24);
  const pieW = texto(el.pie) ? Math.max(...pie.lineas.map((l) => anchoEstimado(l, pie.fs, 800))) + 50 : 0;
  return (
    <Aparece t0={t0} t1={t1} fade={0.3}>
      <g transform={`translate(${cx} ${cy}) scale(${0.9 + 0.1 * k}) translate(${-cx} ${-cy})`}>
        <rect x={cx - w / 2 + 8} y={cy - h / 2 + 16} width={w} height={h} rx={r} fill="#000" opacity={0.35} />
        <clipPath id={idClip}>
          <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx={r} />
        </clipPath>
        {ok ? (
          <g clipPath={`url(#${idClip})`}>
            <g transform={`translate(${cx + m.tx * w} ${cy + m.ty * h}) scale(${m.s}) translate(${-cx} ${-cy})`}>
              <image href={rutaMedia(archivo)} x={cx - w / 2} y={cy - h / 2} width={w} height={h} preserveAspectRatio="xMidYMid slice" />
            </g>
          </g>
        ) : (
          <g>
            <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx={r} fill={C.panel} />
            <text x={cx} y={cy} textAnchor="middle" fontFamily={FUENTE} fontWeight={700} fontSize={34} fill={C.hueso} fillOpacity={0.6} data-texto="foto-falta">
              {archivo ? `Falta la foto: ${archivo}` : "Falta la foto"}
            </text>
          </g>
        )}
        <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx={r} fill="none" stroke={borde ?? C.hueso} strokeOpacity={borde ? 1 : 0.35} strokeWidth={borde ? 7 : 3} />
        {pieW > 0 && (
          <g transform={`translate(${cx - w / 2 + 26} ${cy + h / 2 - 26 - (pie.lineas.length * pie.fs * 1.22 + 24)})`}>
            <rect width={pieW} height={pie.lineas.length * pie.fs * 1.22 + 24} rx={22} fill={C.fondo} fillOpacity={0.84} stroke={borde ?? C.hueso} strokeOpacity={0.5} strokeWidth={3} />
            <TextoCaja lineas={pie.lineas} fs={pie.fs} x={pieW / 2} y={(pie.lineas.length * pie.fs * 1.22 + 24) / 2} />
          </g>
        )}
      </g>
    </Aparece>
  );
};

// ---------------------------------------------------------------------------
// Logo de la marca
// ---------------------------------------------------------------------------
export const LogoEl: React.FC<ElProps> = ({ el, t0, t1 }) => {
  const t = useT();
  const archivo = texto(el.archivo) || MARCA.logo || "";
  const ok = existeMedia(archivo);
  useImagenLista(ok ? rutaMedia(archivo) : null);
  if (!ok) return null;
  const w = pu(el.tam, 22);
  const h = w / razonMedia(archivo);
  const k = Math.min(1.1, pop(t, t0));
  return (
    <Aparece t0={t0} t1={t1} fade={0.3}>
      <g transform={`translate(${px(el.x)} ${py(el.y)}) scale(${0.85 + 0.15 * k})`}>
        <image href={rutaMedia(archivo)} x={-w / 2} y={-h / 2} width={w} height={h} preserveAspectRatio="xMidYMid meet" />
      </g>
    </Aparece>
  );
};

// ---------------------------------------------------------------------------
// Lista con viñetas que van apareciendo
// ---------------------------------------------------------------------------
export const ListaEl: React.FC<ElProps> = ({ el, t0, t1 }) => {
  const t = useT();
  const m = medidasLista(el);
  const color = col(el.color, "amarillo");
  const x0 = px(el.x) - m.w / 2;
  const y0 = py(el.y) - m.h / 2;
  const tit = ajustarTexto(texto(el.titulo), m.w - 70, 74, 46, 30);
  const kp = Math.min(1.06, pop(t, t0));
  return (
    <Aparece t0={t0} t1={t1} fade={0.25}>
      <g transform={`translate(${x0 + m.w / 2} ${y0 + m.h / 2}) scale(${0.94 + 0.06 * kp}) translate(${-(x0 + m.w / 2)} ${-(y0 + m.h / 2)})`}>
        <Cristal x={x0} y={y0} w={m.w} h={m.h} r={32} color={color} />
        {m.tituloH > 0 && (
          <g>
            <TextoCaja lineas={tit.lineas} fs={tit.fs} x={x0 + m.w / 2} y={y0 + m.tituloH / 2 + 6} color={C.hueso} peso={900} />
            <path d={`M ${x0 + 40},${y0 + m.tituloH - 6} L ${x0 + m.w - 40},${y0 + m.tituloH - 6}`} stroke={color} strokeOpacity={0.6} strokeWidth={4} strokeLinecap="round" />
          </g>
        )}
        {m.items.map((it, i) => {
          const ti = tiempoAncla(PALABRAS, typeof it.cuando === "string" ? it.cuando : null, null, t0 + 0.6 * (i + 1));
          const k = Math.min(1.1, pop(t, ti));
          if (k <= 0.01) return null;
          const yc = y0 + m.tituloH + 20 + i * m.fila + m.fila / 2;
          const aj = ajustarTexto(texto(it.texto), m.w - 150, m.fila - 14, 40, 26);
          return (
            <g key={i} opacity={Math.min(1, k)} transform={`translate(${(1 - Math.min(1, k)) * -30} 0)`}>
              <circle cx={x0 + 52} cy={yc} r={22} fill={color} fillOpacity={0.22} stroke={color} strokeWidth={4} />
              <path d={`M ${x0 + 42},${yc + 1} L ${x0 + 49},${yc + 9} L ${x0 + 63},${yc - 8}`} fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
              <TextoCaja lineas={aj.lineas} fs={aj.fs} x={x0 + 94} y={yc} anchor="start" />
            </g>
          );
        })}
      </g>
    </Aparece>
  );
};

// ---------------------------------------------------------------------------
// Llamada a la acción (contacto)
// ---------------------------------------------------------------------------
export const CtaEl: React.FC<ElProps> = ({ el, t0, t1 }) => {
  const t = useT();
  const m = medidasCta(el);
  const color = col(el.color, "amarillo");
  const x0 = px(el.x) - m.w / 2;
  const y0 = py(el.y) - m.h / 2;
  const kp = Math.min(1.06, pop(t, t0));
  const tit = ajustarTexto(texto(el.titulo), m.w - 80, m.tituloH - 14, 58, 36);
  const boton = texto(el.boton);
  const bw = Math.min(m.w - 70, anchoEstimado(boton, 44, 800) + 110);
  const latido = 1 + 0.035 * onda(t, 1.1);
  return (
    <Aparece t0={t0} t1={t1} fade={0.3}>
      <g transform={`translate(${x0 + m.w / 2} ${y0 + m.h / 2}) scale(${0.92 + 0.08 * kp}) translate(${-(x0 + m.w / 2)} ${-(y0 + m.h / 2)})`}>
        <Cristal x={x0} y={y0} w={m.w} h={m.h} r={38} color={color} velo={0.5} />
        <TextoCaja lineas={tit.lineas} fs={tit.fs} x={x0 + m.w / 2} y={y0 + 48 + m.tituloH / 2} color={C.hueso} peso={900} />
        {m.subH > 0 && (
          <text x={x0 + m.w / 2} y={y0 + 48 + m.tituloH + 38} textAnchor="middle" fontFamily={FUENTE} fontWeight={600} fontSize={32} fill={C.hueso} fillOpacity={0.85} data-texto="cta-sub">
            {texto(el.subtitulo)}
          </text>
        )}
        {m.contactos.map((c, i) => {
          const ki = Math.min(1.1, pop(t, t0 + 0.5 + 0.35 * i));
          if (ki <= 0.01) return null;
          const yc = y0 + 48 + m.tituloH + m.subH + i * m.fila + m.fila / 2;
          const aj = ajustarTexto(texto(c.texto), m.w - 190, m.fila - 14, 42, 28);
          return (
            <g key={i} opacity={Math.min(1, ki)}>
              <g transform={`translate(${x0 + 78} ${yc}) scale(0.5)`}>{dibujarIcono(texto(c.icono, "telefono"), color)}</g>
              <TextoCaja lineas={aj.lineas} fs={aj.fs} x={x0 + 132} y={yc} anchor="start" peso={800} />
            </g>
          );
        })}
        {boton && (
          <g transform={`translate(${x0 + m.w / 2} ${y0 + m.h - 24 - m.botonH / 2 + 12}) scale(${latido})`}>
            <rect x={-bw / 2} y={-40} width={bw} height={80} rx={40} fill={color} />
            <text textAnchor="middle" y={15} fontFamily={FUENTE} fontWeight={900} fontSize={44} fill={C.fondo} data-texto="cta-boton">
              {boton}
            </text>
          </g>
        )}
      </g>
    </Aparece>
  );
};

// ---------------------------------------------------------------------------
// Cinta / sello / pastilla ("NUEVO", "OPORTUNIDAD", "-15 %")
// ---------------------------------------------------------------------------
export const CintaEl: React.FC<ElProps> = ({ el, t0, t1 }) => {
  const t = useT();
  const color = col(el.color, "rojo");
  const fs = Math.min(90, Math.max(30, pu(el.tam, 6)));
  const lineas = lineasDe(texto(el.texto));
  const sello = el.estilo === "sello";
  const k = Math.min(1.15, pop(t, t0));
  const ancho = Math.max(...lineas.map((l) => anchoEstimado(l, fs, 900)));
  const rot = num(el.rotacion, sello ? -10 : -4, -30, 30);
  const R = Math.max(ancho / 2 + fs * 0.7, (lineas.length * fs * 1.15) / 2 + fs * 0.7);
  return (
    <Aparece t0={t0} t1={t1} fade={0.2}>
      <g transform={`translate(${px(el.x)} ${py(el.y)}) rotate(${rot}) scale(${0.5 + 0.5 * k})`} data-texto="cinta">
        {sello ? (
          <g>
            <circle r={R} fill={color} />
            <circle r={R - 12} fill="none" stroke={C.fondo} strokeOpacity={0.7} strokeWidth={4} strokeDasharray="10 9" />
          </g>
        ) : (
          <rect x={-ancho / 2 - fs * 0.7} y={-(lineas.length * fs * 1.15) / 2 - fs * 0.35} width={ancho + fs * 1.4} height={lineas.length * fs * 1.15 + fs * 0.7} rx={(fs * 1.7) / 2} fill={color} />
        )}
        <text textAnchor="middle" fontFamily={FUENTE} fontWeight={900} fontSize={fs} fill={C.fondo}>
          {lineas.map((l, i) => (
            <tspan key={i} x={0} y={-(lineas.length * fs * 1.15) / 2 + (i + 0.5) * fs * 1.15 + fs * 0.35}>
              {l}
            </tspan>
          ))}
        </text>
      </g>
    </Aparece>
  );
};

// ---------------------------------------------------------------------------
// Ficha: iconos con cifras (dormitorios, baños, m², cochera…)
// ---------------------------------------------------------------------------
export const FichaEl: React.FC<ElProps> = ({ el, t0, t1 }) => {
  const t = useT();
  const m = medidasFicha(el);
  const color = col(el.color, "amarillo");
  const x0 = px(el.x) - m.W / 2;
  const y0 = py(el.y) - m.H / 2;
  return (
    <Aparece t0={t0} t1={t1} fade={0.2}>
      {m.items.map((it, i) => {
        const fila = Math.floor(i / m.cols);
        const colm = i % m.cols;
        const enFila = Math.min(m.cols, m.items.length - fila * m.cols);
        const extra = ((m.cols - enFila) * (m.cw + m.gap)) / 2; // centra la última fila incompleta
        const x = x0 + extra + colm * (m.cw + m.gap);
        const y = y0 + fila * (m.ch + m.gap);
        const ti = tiempoAncla(PALABRAS, typeof it.cuando === "string" ? it.cuando : null, null, t0 + 0.4 * i);
        const k = Math.min(1.1, pop(t, ti));
        if (k <= 0.01) return null;
        const c = it.color ? col(it.color) : color;
        const valor = texto(it.valor);
        const fsV = Math.min(58, Math.max(34, (m.cw - 30) / Math.max(3, valor.length * 0.62)));
        const etq = ajustarTexto(texto(it.etiqueta), m.cw - 24, 64, 30, 22);
        return (
          <g key={i} transform={`translate(${x + m.cw / 2} ${y + m.ch / 2}) scale(${0.7 + 0.3 * Math.min(1, k)}) translate(${-(x + m.cw / 2)} ${-(y + m.ch / 2)})`} opacity={Math.min(1, k)}>
            <Cristal x={x} y={y} w={m.cw} h={m.ch} r={30} color={c} />
            <g transform={`translate(${x + m.cw / 2} ${y + 54}) scale(0.58)`}>{dibujarIcono(texto(it.icono, "casa"), c)}</g>
            <text x={x + m.cw / 2} y={y + 128} textAnchor="middle" fontFamily={FUENTE} fontWeight={900} fontSize={fsV} fill={C.hueso} stroke={C.fondo} strokeWidth={6} paintOrder="stroke" data-texto="ficha-valor">
              <Marcas texto={valor} tam={fsV} />
            </text>
            <TextoCaja lineas={etq.lineas} fs={etq.fs} x={x + m.cw / 2} y={y + 168} color={c} peso={700} />
          </g>
        );
      })}
    </Aparece>
  );
};

// ---------------------------------------------------------------------------
// Precio con cuenta animada
// ---------------------------------------------------------------------------
export const PrecioEl: React.FC<ElProps> = ({ el, t0, t1 }) => {
  const t = useT();
  const m = medidasPrecio(el);
  const color = col(el.color, "amarillo");
  const k = Math.min(1.12, pop(t, t0));
  const v = valorMonto(el.valor);
  const mostrado = v !== null ? miles(v * Easing.out(Easing.cubic)(prog(t, t0 + 0.15, 1.3, (n) => n))) : formatoMonto(el.valor);
  const cx = px(el.x);
  const cy = py(el.y);
  const top = cy - m.h / 2;
  const brillo = prog(t, t0 + 1.5, 0.9, (n) => n);
  return (
    <Aparece t0={t0} t1={t1} fade={0.25}>
      <g transform={`translate(${cx} ${cy}) scale(${0.72 + 0.28 * k}) translate(${-cx} ${-cy})`} data-texto="precio">
        {m.operacion && (
          <g transform={`translate(${cx} ${top + m.pillH / 2})`}>
            <rect x={-m.pillW / 2} y={-27} width={m.pillW} height={54} rx={27} fill={color} />
            <text textAnchor="middle" y={12} fontFamily={FUENTE} fontWeight={900} fontSize={34} letterSpacing={3} fill={C.fondo}>
              {m.operacion}
            </text>
          </g>
        )}
        <text x={cx - m.wMonto / 2} y={top + m.pillH + m.fs * 1.0} fontFamily={FUENTE} fontWeight={900} fontSize={m.fs} fill={color} stroke={C.fondo} strokeWidth={m.fs * 0.1} paintOrder="stroke" strokeLinejoin="round">
          {m.moneda && (
            <tspan fontSize={m.fs * 0.42} fontWeight={800} dy={-m.fs * 0.28} dx={0}>
              {m.moneda}
            </tspan>
          )}
          <tspan dy={m.moneda ? m.fs * 0.28 : 0} dx={m.moneda ? 16 : 0}>
            {mostrado}
          </tspan>
          {m.sufijo && (
            <tspan fontSize={m.fs * 0.34} fontWeight={800} dx={18}>
              {m.sufijo}
            </tspan>
          )}
        </text>
        {m.detalle && (
          <text x={cx} y={top + m.pillH + m.fs * 1.0 + 54} textAnchor="middle" fontFamily={FUENTE} fontWeight={700} fontSize={34} fill={C.hueso} stroke={C.fondo} strokeWidth={7} paintOrder="stroke" opacity={brillo}>
            {m.detalle}
          </text>
        )}
      </g>
    </Aparece>
  );
};

// ---------------------------------------------------------------------------
// Mapa de ubicación estilizado
// ---------------------------------------------------------------------------
const semilla = (s: string): number => [...s].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) % 9973, 7);

export const MapaEl: React.FC<ElProps> = ({ el, t0, t1 }) => {
  const t = useT();
  const W = pu(el.ancho, 84);
  const H = pu(el.alto, 56);
  const cx = px(el.x);
  const cy = py(el.y);
  const x0 = cx - W / 2;
  const y0 = cy - H / 2;
  const idClip = "cm" + idSeguro(useId());
  const sem = semilla(texto(el.texto, "mapa"));
  const color = col(el.color, "rojo");
  const pinX = x0 + W * num(el.pinX, 0.5, 0.1, 0.9);
  const pinY = y0 + H * num(el.pinY, 0.56, 0.2, 0.85);
  const pois: El[] = Array.isArray(el.puntos) ? el.puntos.slice(0, 4) : [];
  const kMapa = prog(t, t0, 0.5);
  const caida = Math.min(1.25, pop(t, t0 + 0.45));
  const radio = pu(el.radio, 0);
  const calles = Array.from({ length: 5 }, (_, i) => ({
    h: y0 + H * (0.12 + 0.76 * (i / 4) + (azar(sem + i) - 0.5) * 0.07),
    v: x0 + W * (0.1 + 0.8 * (i / 4) + (azar(sem + i + 20) - 0.5) * 0.07),
  }));
  return (
    <Aparece t0={t0} t1={t1} fade={0.3}>
      <clipPath id={idClip}>
        <rect x={x0} y={y0} width={W} height={H} rx={34} />
      </clipPath>
      <rect x={x0} y={y0} width={W} height={H} rx={34} fill={C.panel} stroke={C.hueso} strokeOpacity={0.35} strokeWidth={4} opacity={kMapa} />
      <g clipPath={`url(#${idClip})`} opacity={kMapa}>
        <path d={`M ${x0},${y0 + H * 0.78} C ${x0 + W * 0.18},${y0 + H * 0.62} ${x0 + W * 0.12},${y0 + H * 0.95} ${x0 + W * 0.3},${y0 + H}  L ${x0},${y0 + H} Z`} fill={C.azul} fillOpacity={0.3} />
        <rect x={x0 + W * (0.58 + azar(sem) * 0.1)} y={y0 + H * 0.1} width={W * 0.22} height={H * 0.22} rx={14} fill={C.hueso} fillOpacity={0.09} />
        {calles.map((c, i) => (
          <g key={i} stroke={C.hueso} strokeOpacity={0.17} strokeWidth={i % 2 ? 9 : 13} strokeLinecap="round">
            <line x1={x0} y1={c.h} x2={x0 + W} y2={c.h} />
            <line x1={c.v} y1={y0} x2={c.v} y2={y0 + H} />
          </g>
        ))}
        <line x1={x0 - 20} y1={y0 + H * 0.86} x2={x0 + W + 20} y2={y0 + H * 0.18} stroke={C.amarillo} strokeOpacity={0.4} strokeWidth={17} strokeLinecap="round" />
      </g>
      {radio > 0 && (
        <circle cx={pinX} cy={pinY} r={radio * kMapa} fill={color} fillOpacity={0.1} stroke={color} strokeOpacity={0.8} strokeWidth={4} strokeDasharray="14 12" />
      )}
      {[0, 1, 2].map((i) => {
        const f = (((t - t0 - 0.9) / 2.1 + i / 3) % 1 + 1) % 1;
        return t > t0 + 0.9 ? <circle key={i} cx={pinX} cy={pinY + 6} r={18 + f * 120} fill="none" stroke={color} strokeWidth={5} opacity={(1 - f) * 0.7} /> : null;
      })}
      {pois.map((p, i) => {
        const X = x0 + W * num(p.x, 0.5, 0.05, 0.95);
        const Y = y0 + H * num(p.y, 0.5, 0.08, 0.92);
        const ti = tiempoAncla(PALABRAS, typeof p.cuando === "string" ? p.cuando : null, null, t0 + 1.0 + 0.5 * i);
        const k = Math.min(1.1, pop(t, ti));
        const arriba = Y - y0 > 120;
        return (
          <g key={i}>
            {k > 0.02 && <circle cx={X} cy={Y} r={11 * (0.5 + 0.5 * k)} fill={C.amarillo} stroke={C.fondo} strokeWidth={4} />}
            <Etiqueta x={X} y={arriba ? Y - 62 : Y + 62} texto={lineasDe(texto(p.texto))} t0={ti} t1={t1} color={C.amarillo} tam={30} guia={{ x: X, y: Y }} />
          </g>
        );
      })}
      <g transform={`translate(${pinX} ${pinY - (1 - Math.min(1, caida)) * 260})`} opacity={Math.min(1, caida * 1.4)} data-texto="pin-mapa">
        <path d="M 0,6 C -26,-24 -32,-36 -32,-52 A 32 32 0 0 1 32,-52 C 32,-36 26,-24 0,6 Z" fill={color} stroke={C.fondo} strokeWidth={5} />
        <circle cx={0} cy={-52} r={11} fill={C.fondo} />
      </g>
      {texto(el.texto) && <Etiqueta x={pinX} y={pinY - 118} texto={lineasDe(texto(el.texto))} t0={t0 + 0.8} t1={t1} color={color} tam={36} />}
    </Aparece>
  );
};

// ---------------------------------------------------------------------------
// Casa / edificio dibujado a línea
// ---------------------------------------------------------------------------
type Parte = { d: string };
const ventanas = (cols: number, filas: number, x: number, y: number, dx: number, dy: number, lado = 9): { d: string; id: number }[] =>
  Array.from({ length: cols * filas }, (_, i) => {
    const c = i % cols;
    const f = Math.floor(i / cols);
    const X = x + c * dx;
    const Y = y + f * dy;
    return { d: `M ${X},${Y} h ${lado} v ${lado} h ${-lado} Z`, id: i };
  });

function partesDe(tipo: string): { trazos: Parte[]; luces: { d: string; id: number }[] } {
  switch (tipo) {
    case "departamento": {
      const v = ventanas(3, 4, -17, -30, 14, 17);
      return {
        trazos: [{ d: "M -44,44 L 44,44" }, { d: "M -26,44 L -26,-40 L 26,-40 L 26,44" }, { d: "M -32,-40 L 32,-40" }, { d: "M -7,44 L -7,30 L 7,30 L 7,44" }, ...v.map((x) => ({ d: x.d }))],
        luces: v,
      };
    }
    case "edificio": {
      const a = ventanas(2, 5, -28, -34, 15, 15, 8);
      const b = ventanas(2, 3, 10, -10, 15, 15, 8);
      return {
        trazos: [{ d: "M -46,44 L 46,44" }, { d: "M -36,44 L -36,-42 L -2,-42 L -2,44" }, { d: "M 2,44 L 2,-18 L 36,-18 L 36,44" }, ...a.map((x) => ({ d: x.d })), ...b.map((x) => ({ d: x.d }))],
        luces: [...a, ...b.map((x) => ({ ...x, id: x.id + 20 }))],
      };
    }
    case "terreno":
      return {
        trazos: [{ d: "M -44,20 L 0,0 L 44,20 L 0,42 Z" }, { d: "M -44,20 L -44,6 M 44,20 L 44,6 M 0,0 L 0,-14 M 0,42 L 0,28" }, { d: "M 20,22 L 20,10 M 20,2 m -10,0 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0" }],
        luces: [],
      };
    case "local": {
      const v = [{ d: "M -30,2 L -30,26 L 6,26 L 6,2 Z", id: 0 }];
      return {
        trazos: [{ d: "M -46,44 L 46,44" }, { d: "M -40,44 L -40,-12 L 40,-12 L 40,44" }, { d: "M -46,-12 L -38,-34 L 38,-34 L 46,-12 Z" }, { d: "M -20,-12 L -16,-34 M 0,-12 L 0,-34 M 20,-12 L 16,-34" }, { d: "M 16,44 L 16,6 L 32,6 L 32,44" }, ...v.map((x) => ({ d: x.d }))],
        luces: v,
      };
    }
    default: {
      const v = [
        { d: "M -27,4 L -27,20 L -15,20 L -15,4 Z", id: 0 },
        { d: "M 15,4 L 15,20 L 27,20 L 27,4 Z", id: 1 },
      ];
      return {
        trazos: [{ d: "M -50,44 L 50,44" }, { d: "M -34,44 L -34,-4 L 34,-4 L 34,44" }, { d: "M -46,-2 L 0,-38 L 46,-2" }, { d: "M 20,-26 L 20,-40 L 31,-40 L 31,-17" }, { d: "M -8,44 L -8,18 L 8,18 L 8,44" }, ...v.map((x) => ({ d: x.d }))],
        luces: v,
      };
    }
  }
}

export const CasaEl: React.FC<ElProps> = ({ el, t0, t1 }) => {
  const t = useT();
  const tipo = texto(el.variante, "casa");
  const { trazos, luces } = partesDe(tipo);
  const color = col(el.color, "amarillo");
  const s = pu(el.tam, 50) / 100;
  const fin = t1 < 9000 ? t1 : undefined;
  const dibujado = t0 + 0.2 + trazos.length * 0.16 + 0.5;
  return (
    <g transform={`translate(${px(el.x)} ${py(el.y)}) scale(${s})`}>
      {trazos.map((p, i) => (
        <Trazo key={i} d={p.d} color={i === 0 ? C.hueso : color} ancho={6.5 / s} t0={t0 + 0.2 + i * 0.16} dur={0.55} brillo={i === 2 ? 0.6 : 0} fin={fin} />
      ))}
      {t > dibujado &&
        luces.map((l) => (
          <path key={l.id} d={l.d} fill={C.amarillo} fillOpacity={0.15 + 0.45 * onda(t, 2.6 + (l.id % 3) * 0.7, azar(l.id + 3))} stroke="none" opacity={t1 < 9000 ? 1 - prog(t, t1 - 0.3, 0.3) : 1} />
        ))}
    </g>
  );
};
