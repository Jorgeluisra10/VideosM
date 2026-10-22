#!/usr/bin/env node
/**
 * Genera ilustraciones de ejemplo (NO son fotos reales) para probar y demostrar los videos de inmobiliaria
 * sin depender de imágenes con derechos: fachada, living, cocina, dormitorio, jardín y un logo.
 *   node scripts/demo/fotos-ejemplo.mjs [carpeta-de-salida]     (por defecto ejemplos/inmobiliaria-casa/media)
 * En un proyecto real las sustituyes por tus fotos.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { PNG } = require("pngjs");
const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const salida = resolve(process.argv[2] ?? join(RAIZ, "ejemplos", "inmobiliaria-casa", "media"));
mkdirSync(salida, { recursive: true });

const W = 1280;
const H = 960;
const hex = (h, a = 255) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16), a];

class Lienzo {
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

// ---------------------------------------------------------------- fachada al atardecer
{
  const L = new Lienzo();
  L.degradado(0, 620, "#1d3557", "#f4a261");
  L.circulo(980, 520, 90, "#ffd9a0", 230, 60);
  L.degradado(620, H, "#2d6a4f", "#1b4332");
  L.poligono([[470, 960], [810, 960], [700, 640], [580, 640]], "#cbb99a"); // camino
  L.rect(300, 380, 680, 290, "#ead9c3"); // cuerpo
  L.poligono([[250, 395], [640, 215], [1030, 395]], "#8d3b2e"); // techo
  L.rect(820, 250, 54, 110, "#6c2b21"); // chimenea
  L.rect(590, 500, 100, 170, "#5a3825"); // puerta
  L.circulo(672, 590, 6, "#ffd166");
  for (const [x, y] of [[350, 450], [470, 450], [760, 450], [880, 450]]) {
    L.rect(x, y, 80, 96, "#264653");
    L.rect(x + 6, y + 6, 68, 84, "#ffd166", 235);
    L.rect(x + 38, y + 6, 4, 84, "#264653");
  }
  L.rect(280, 660, 720, 22, "#b8a98f");
  for (const [x, y, r] of [[250, 700, 46], [330, 720, 34], [950, 700, 50], [1040, 725, 36]]) L.circulo(x, y, r, "#40916c");
  L.circulo(150, 520, 70, "#2d6a4f");
  L.rect(142, 560, 16, 140, "#5a3825");
  L.viñeta();
  L.guardar("fachada.png");
}

// ---------------------------------------------------------------- living
{
  const L = new Lienzo();
  L.rect(0, 0, W, 640, "#d9cfc1");
  L.degradado(640, H, "#9a7b5a", "#7a5c3e");
  L.rect(150, 120, 460, 380, "#f8fafc");
  L.degradado(135, 485, "#8ecae6", "#e9f5fb", 165, 595);
  L.rect(378, 135, 8, 350, "#f8fafc");
  L.circulo(500, 250, 60, "#fff3b0", 200, 40);
  L.rrect(560, 560, 640, 220, 40, "#3d5a80"); // sillón
  L.rrect(540, 600, 90, 200, 36, "#324b6b");
  L.rrect(1130, 600, 90, 200, 36, "#324b6b");
  for (const [x, c] of [[620, "#ee6c4d"], [1040, "#e0fbfc"]]) L.rrect(x, 540, 120, 120, 24, c);
  L.rrect(300, 760, 560, 130, 60, "#b5838d", 240); // alfombra
  L.rrect(440, 690, 260, 70, 14, "#5a3825"); // mesa baja
  L.rect(980, 190, 14, 390, "#2b2d42");
  L.poligono([[920, 190], [1054, 190], [1020, 120], [954, 120]], "#ffd166");
  L.circulo(987, 150, 120, "#ffd166", 60, 90);
  L.rrect(880, 380, 110, 90, 12, "#f8fafc");
  L.rect(890, 390, 90, 70, "#e76f51");
  L.circulo(80, 620, 50, "#40916c");
  L.rect(72, 660, 16, 120, "#5a3825");
  L.viñeta();
  L.guardar("living.png");
}

// ---------------------------------------------------------------- cocina
{
  const L = new Lienzo();
  L.rect(0, 0, W, 560, "#e3e9ec");
  for (let x = 0; x < W; x += 80) L.rect(x, 0, 2, 560, "#c5ced3");
  for (let y = 0; y < 560; y += 80) L.rect(0, y, W, 2, "#c5ced3");
  L.degradado(560, H, "#a3a8ad", "#6b7075");
  L.rect(60, 80, 520, 190, "#cad2c5");
  L.rect(700, 80, 520, 190, "#cad2c5");
  for (const x of [60, 320, 700, 960]) L.rect(x + 4, 84, 252, 182, "#84a98c", 110);
  for (const x of [250, 310, 890, 950]) L.rrect(x, 165, 24, 8, 4, "#2f3e46");
  L.rect(40, 450, 1200, 200, "#2f3e46"); // mesada
  L.rect(40, 440, 1200, 20, "#cdd5d6");
  L.rect(40, 650, 1200, 230, "#354f52");
  L.rrect(180, 380, 220, 60, 10, "#1b263b"); // cocina
  for (const x of [215, 265, 315]) L.circulo(x + 15, 410, 16, "#6c757d");
  L.rrect(820, 340, 160, 100, 16, "#e9ecef"); // microondas
  L.rrect(840, 360, 100, 60, 8, "#343a40");
  L.rrect(300, 690, 700, 70, 30, "#52796f"); // isla
  L.rrect(250, 700, 800, 40, 10, "#e9ecef");
  for (const x of [420, 640, 860]) {
    L.rect(x - 2, 128, 4, 150, "#2b2d42", 0);
    L.circulo(x, 760, 50, "#ffd166", 60, 80);
  }
  L.viñeta();
  L.guardar("cocina.png");
}

// ---------------------------------------------------------------- dormitorio
{
  const L = new Lienzo();
  L.rect(0, 0, W, 660, "#c8b6e2");
  L.degradado(660, H, "#8d6e55", "#6a4f3b");
  L.rect(780, 110, 380, 330, "#f8fafc");
  L.degradado(125, 425, "#9ad0f5", "#f5f9ff", 795, 1145);
  L.rect(960, 125, 6, 300, "#f8fafc");
  L.rrect(740, 90, 90, 380, 30, "#9d4edd", 200);
  L.rrect(1120, 90, 90, 380, 30, "#9d4edd", 200);
  L.rrect(120, 330, 600, 120, 30, "#5a3825"); // respaldo
  L.rrect(100, 470, 640, 250, 36, "#f8f9fa"); // cama
  L.rrect(100, 560, 640, 170, 30, "#ff9aa2");
  L.rrect(150, 430, 220, 100, 40, "#ffffff");
  L.rrect(420, 430, 220, 100, 40, "#ffffff");
  L.rrect(60, 700, 710, 60, 16, "#5a3825");
  L.rrect(790, 590, 140, 150, 12, "#5a3825"); // mesa de luz
  L.circulo(860, 540, 48, "#ffd166", 220, 70);
  L.rect(852, 560, 16, 40, "#2b2d42");
  L.rrect(300, 150, 260, 170, 10, "#f8fafc");
  L.rect(316, 166, 228, 138, "#ffafcc");
  L.circulo(430, 235, 40, "#ffc8dd");
  L.viñeta();
  L.guardar("dormitorio.png");
}

// ---------------------------------------------------------------- jardín con pileta
{
  const L = new Lienzo();
  L.degradado(0, 520, "#8ecae6", "#d8f3ff");
  L.circulo(1080, 140, 80, "#fff3b0", 240, 70);
  L.degradado(520, H, "#52b788", "#2d6a4f");
  L.rrect(180, 580, 920, 300, 60, "#a98467"); // deck
  L.rrect(240, 630, 800, 200, 50, "#00b4d8"); // pileta
  L.rrect(270, 650, 740, 70, 40, "#48cae4", 200);
  for (let i = 0; i < 7; i++) L.rrect(300 + i * 100, 700 + (i % 2) * 40, 60, 8, 4, "#caf0f8", 230);
  for (const [x, y, r] of [[110, 480, 90], [210, 440, 70], [1170, 470, 100], [1060, 430, 74]]) {
    L.rect(x - 9, y + r - 10, 18, 120, "#5a3825");
    L.circulo(x, y, r, "#2d6a4f");
    L.circulo(x - r * 0.3, y - r * 0.25, r * 0.55, "#40916c");
  }
  L.rect(620, 470, 10, 190, "#6c757d");
  L.poligono([[500, 480], [750, 480], [625, 395]], "#e63946");
  L.poligono([[625, 395], [750, 480], [690, 480]], "#f1faee", 90);
  L.rrect(300, 840, 140, 40, 12, "#f1faee");
  L.rrect(850, 840, 140, 40, 12, "#f1faee");
  L.viñeta();
  L.guardar("jardin.png");
}

// ---------------------------------------------------------------- logo (fondo transparente)
{
  const L = new Lienzo(600, 600, true);
  L.circulo(300, 300, 270, "#d4af37");
  L.circulo(300, 300, 240, "#0a0f1c");
  L.poligono([[130, 310], [300, 160], [470, 310]], "#d4af37");
  L.rect(180, 300, 240, 140, "#d4af37");
  L.rect(270, 350, 60, 90, "#0a0f1c");
  L.rect(205, 330, 40, 40, "#0a0f1c");
  L.rect(355, 330, 40, 40, "#0a0f1c");
  L.guardar("logo.png");
}
