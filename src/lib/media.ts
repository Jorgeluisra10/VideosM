import { useEffect, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";
import mediaJson from "../data/media.json";

/** Archivo de medios del proyecto activo (lo escribe scripts/media.mjs al importar las fotos). */
export type MediaItem = { archivo: string; tipo: "foto" | "logo" | "musica"; ancho?: number; alto?: number; fondo?: string; original?: string; descripcion?: string };

export const MEDIA: MediaItem[] = mediaJson as MediaItem[];

export const infoMedia = (archivo: unknown): MediaItem | undefined => MEDIA.find((m) => m.archivo === archivo);
export const existeMedia = (archivo: unknown): boolean => typeof archivo === "string" && archivo.length > 0 && Boolean(infoMedia(archivo));
export const rutaMedia = (archivo: string): string => staticFile(`media/${archivo}`);

/** Relación ancho/alto de una foto (si no se conoce, 4:3). */
export const razonMedia = (archivo: unknown): number => {
  const m = infoMedia(archivo);
  return m?.ancho && m?.alto ? m.ancho / m.alto : 4 / 3;
};

/**
 * Hace que el render espere a que la imagen termine de cargar (para <image> dentro de un SVG, donde <Img>
 * de Remotion no se puede usar). Siempre se libera, aunque la imagen falle, para no colgar el render.
 */
export function useImagenLista(src: string | null): void {
  const [handle] = useState(() => (src ? delayRender(`Cargando ${src}`, { timeoutInMilliseconds: 40000 }) : null));
  useEffect(() => {
    if (handle === null || !src) return;
    let liberado = false;
    const liberar = () => {
      if (!liberado) {
        liberado = true;
        continueRender(handle);
      }
    };
    const img = new Image();
    img.onload = liberar;
    img.onerror = liberar;
    img.src = src;
    if (img.complete) liberar();
    return liberar;
  }, [src, handle]);
}
