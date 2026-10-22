/** Movimientos de cámara sobre una foto (efecto Ken Burns). `p` va de 0 a 1 durante la vida de la foto. */
export const MOVIMIENTOS_FOTO = ["zoom-in", "zoom-out", "izquierda", "derecha", "arriba", "abajo", "fijo"] as const;

/** Escala y desplazamiento (como fracción del tamaño de la foto) para cada movimiento. */
export function movimientoFoto(mov: string, p: number): { s: number; tx: number; ty: number } {
  switch (mov) {
    case "zoom-out":
      return { s: 1.17 - 0.15 * p, tx: 0, ty: 0 };
    case "izquierda":
      return { s: 1.14, tx: 0.045 - 0.09 * p, ty: 0 };
    case "derecha":
      return { s: 1.14, tx: -0.045 + 0.09 * p, ty: 0 };
    case "arriba":
      return { s: 1.14, tx: 0, ty: 0.045 - 0.09 * p };
    case "abajo":
      return { s: 1.14, tx: 0, ty: -0.045 + 0.09 * p };
    case "fijo":
      return { s: 1, tx: 0, ty: 0 };
    default: // zoom-in
      return { s: 1.02 + 0.15 * p, tx: 0, ty: 0 };
  }
}
