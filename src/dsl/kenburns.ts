/**
 * Movimientos de cámara sobre una foto (efecto Ken Burns). `p` va de 0 a 1 durante la vida de la foto.
 * La escala se mueve entre 1.0 y 1.12 (suave, nunca mareante); los desplazamientos laterales usan 1.12 fijo
 * para que no aparezcan bordes vacíos.
 */
export const MOVIMIENTOS_FOTO = ["zoom-in", "zoom-out", "izquierda", "derecha", "arriba", "abajo", "fijo"] as const;

/** Escala y desplazamiento (como fracción del tamaño de la foto) para cada movimiento. */
export function movimientoFoto(mov: string, p: number): { s: number; tx: number; ty: number } {
  switch (mov) {
    case "zoom-out":
      return { s: 1.12 - 0.12 * p, tx: 0, ty: 0 };
    case "izquierda":
      return { s: 1.12, tx: 0.035 - 0.07 * p, ty: 0 };
    case "derecha":
      return { s: 1.12, tx: -0.035 + 0.07 * p, ty: 0 };
    case "arriba":
      return { s: 1.12, tx: 0, ty: 0.035 - 0.07 * p };
    case "abajo":
      return { s: 1.12, tx: 0, ty: -0.035 + 0.07 * p };
    case "fijo":
      return { s: 1, tx: 0, ty: 0 };
    default: // zoom-in
      return { s: 1 + 0.12 * p, tx: 0, ty: 0 };
  }
}
