import React from "react";
import { AbsoluteFill, Img } from "remotion";
import { C, H, W } from "../lib/colores";
import { clamp, useT } from "../lib/anim";
import { existeMedia, infoMedia, razonMedia, rutaMedia } from "../lib/media";
import { movimientoFoto } from "./kenburns";
import type { FondoPlan } from "./tipos";

/**
 * Foto a pantalla completa detrás de una escena (estilo reel inmobiliario): movimiento de cámara lento,
 * degradados arriba y abajo para que se lean el título y los subtítulos, y oscurecimiento ajustable.
 *  - modo "cubrir": la foto rellena los 1080×1920 (recorta los lados de una foto horizontal).
 *  - modo "marco": la foto se ve ENTERA, centrada, sobre una copia desenfocada de sí misma.
 */
export const FondoFoto: React.FC<{ fondo: FondoPlan; ini: number; fin: number }> = ({ fondo, ini, fin }) => {
  const t = useT();
  const archivo = fondo.foto;
  const p = clamp((t - ini) / Math.max(1, fin - ini));
  const m = movimientoFoto(fondo.mov ?? "zoom-in", p);
  const oscurecer = Math.min(0.8, Math.max(0, fondo.oscurecer ?? 0.3));
  const ok = existeMedia(archivo);
  const info = infoMedia(archivo);

  const capas = (
    <>
      <AbsoluteFill style={{ background: `rgba(0,0,0,${oscurecer})` }} />
      <AbsoluteFill style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.62) 0px, rgba(0,0,0,0) 520px, rgba(0,0,0,0) 1200px, rgba(0,0,0,0.72) 1920px)" }} />
    </>
  );

  if (!ok) {
    return <AbsoluteFill style={{ background: `linear-gradient(160deg, ${C.panelClaro}, ${C.fondo})` }}>{capas}</AbsoluteFill>;
  }

  if (fondo.modo === "marco") {
    const alto = Math.min(1500, W / razonMedia(archivo));
    return (
      <AbsoluteFill style={{ backgroundColor: C.fondo, overflow: "hidden" }}>
        {/* copia desenfocada: se usa la miniatura ya difuminada (sin filtros costosos en cada fotograma) */}
        <Img src={rutaMedia(info?.fondo ?? archivo)} style={{ position: "absolute", left: 0, top: 0, width: W, height: H, objectFit: "cover", transform: "scale(1.15)" }} />
        <AbsoluteFill style={{ background: "rgba(0,0,0,0.35)" }} />
        <div style={{ position: "absolute", left: 0, top: (H - alto) / 2 - 20, width: W, height: alto, overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,0.55)" }}>
          <Img src={rutaMedia(archivo)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `translate(${m.tx * W}px, ${m.ty * alto}px) scale(${m.s})`, transformOrigin: "50% 50%" }} />
        </div>
        {capas}
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ backgroundColor: C.fondo, overflow: "hidden" }}>
      <Img src={rutaMedia(archivo)} style={{ position: "absolute", left: 0, top: 0, width: W, height: H, objectFit: "cover", transform: `translate(${m.tx * W}px, ${m.ty * H}px) scale(${m.s})`, transformOrigin: "50% 50%" }} />
      {capas}
    </AbsoluteFill>
  );
};
