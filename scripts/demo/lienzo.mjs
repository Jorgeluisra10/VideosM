/**
 * Lienzo mínimo para dibujar ilustraciones de ejemplo (PNG) sin dependencias gráficas: rectángulos, círculos,
 * polígonos, degradados y viñeta. Lo usan scripts/demo/fotos-ejemplo*.mjs (NO son fotos reales).
 */
import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const { PNG } = require("pngjs");

export const W = 1280;
export const H = 960;
export const hex = (h, a = 255) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16), a];

/** Devuelve la clase Lienzo cuyo guardar() escribe en la carpeta `salida`. */
export function crearLienzo(salida) {
  return class Lienzo {

    constructor(w = W, h = H, transparente = false) {
      this.w = w;
      this.h = h;
      this.png = new PNG({ width: w, height: h });
      if (!transparente) this.png.data.fill(255);
    }
    px(x, y, [r, g, b, a]) {
      if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
      const i = (y * this.w + x) * 4;
      const k = a / 255;
      const d = this.png.data;
      d[i] = Math.round(d[i] * (1 - k) + r * k);
      d[i + 1] = Math.round(d[i + 1] * (1 - k) + g * k);
      d[i + 2] = Math.round(d[i + 2] * (1 - k) + b * k);
      d[i + 3] = Math.max(d[i + 3], a);
    }
    degradado(y0, y1, c0, c1, x0 = 0, x1 = this.w) {
      const A = hex(c0);
      const B = hex(c1);
      for (let y = y0; y < y1; y++) {
        const k = (y - y0) / Math.max(1, y1 - y0 - 1);
        const c = [0, 1, 2].map((j) => Math.round(A[j] + (B[j] - A[j]) * k)).concat(255);
        for (let x = x0; x < x1; x++) this.px(x, y, c);
      }
    }
    rect(x, y, w, h, c, a = 255) {
      const col = typeof c === "string" ? hex(c, a) : c;
      for (let j = Math.round(y); j < Math.round(y + h); j++) for (let i = Math.round(x); i < Math.round(x + w); i++) this.px(i, j, col);
    }
    rrect(x, y, w, h, r, c, a = 255) {
      const col = hex(c, a);
      for (let j = Math.round(y); j < Math.round(y + h); j++)
        for (let i = Math.round(x); i < Math.round(x + w); i++) {
          const dx = Math.max(x + r - i, 0, i - (x + w - r));
          const dy = Math.max(y + r - j, 0, j - (y + h - r));
          if (dx * dx + dy * dy <= r * r) this.px(i, j, col);
        }
    }
    circulo(cx, cy, r, c, a = 255, suave = 0) {
      const col = hex(c, a);
      for (let j = Math.floor(cy - r - suave); j <= cy + r + suave; j++)
        for (let i = Math.floor(cx - r - suave); i <= cx + r + suave; i++) {
          const d = Math.hypot(i - cx, j - cy);
          if (d <= r) this.px(i, j, col);
          else if (suave && d <= r + suave) this.px(i, j, [col[0], col[1], col[2], Math.round(col[3] * (1 - (d - r) / suave))]);
        }
    }
    poligono(pts, c, a = 255) {
      const col = hex(c, a);
      const xs = pts.map((p) => p[0]);
      const ys = pts.map((p) => p[1]);
      for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) {
        const cortes = [];
        for (let k = 0; k < pts.length; k++) {
          const [x1, y1] = pts[k];
          const [x2, y2] = pts[(k + 1) % pts.length];
          if ((y1 <= y && y2 > y) || (y2 <= y && y1 > y)) cortes.push(x1 + ((y - y1) / (y2 - y1)) * (x2 - x1));
        }
        cortes.sort((a, b) => a - b);
        for (let k = 0; k + 1 < cortes.length; k += 2) for (let x = Math.round(cortes[k]); x < Math.round(cortes[k + 1]); x++) this.px(x, y, col);
      }
      void xs;
    }
    viñeta() {
      const d = this.png.data;
      for (let y = 0; y < this.h; y++)
        for (let x = 0; x < this.w; x++) {
          const k = Math.hypot((x - this.w / 2) / (this.w / 2), (y - this.h / 2) / (this.h / 2));
          const f = 1 - Math.max(0, k - 0.65) * 0.42;
          const i = (y * this.w + x) * 4;
          d[i] = Math.round(d[i] * f);
          d[i + 1] = Math.round(d[i + 1] * f);
          d[i + 2] = Math.round(d[i + 2] * f);
        }
    }
    guardar(nombre) {
      writeFileSync(join(salida, nombre), PNG.sync.write(this.png));
      console.log("  ✔", join(salida, nombre));
    }
  }
}
