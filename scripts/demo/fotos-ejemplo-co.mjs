#!/usr/bin/env node
/**
 * Ilustraciones de ejemplo (NO son fotos reales) para el perfil «inmobiliario-co»: un apartamento en Bogotá.
 *   node scripts/demo/fotos-ejemplo-co.mjs [carpeta-de-salida]     (por defecto ejemplos/inmobiliario-co-apartamento/media)
 * Genera: fachada, sala, cocina, habitacion, terraza y un logo. En un proyecto real las sustituyes por tus fotos
 * (a 1600 px o más; verticales u horizontales).
 */
import { mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { H, W, crearLienzo } from "./lienzo.mjs";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const salida = resolve(process.argv[2] ?? join(RAIZ, "ejemplos", "inmobiliario-co-apartamento", "media"));
mkdirSync(salida, { recursive: true });
const Lienzo = crearLienzo(salida);

/**
 * Cerros orientales de Bogotá: dos siluetas superpuestas. `base` = altura de las cumbres; se recortan a la caja
 * {x, w, bottom} (para dibujarlos solo dentro de una ventana).
 */
function cerros(L, base, { x = 0, w = W, bottom = H } = {}) {
  const k = w / 1280;
  const P = (lista) => [...lista.map(([px, py]) => [x + px * k, Math.min(bottom, base + py)]), [x + w, bottom], [x, bottom]];
  L.poligono(P([[0, 0], [180, -130], [380, -70], [560, -190], [780, -90], [980, -170], [1280, -60]]), "#1b4332", 255);
  L.poligono(P([[0, 40], [220, -40], [470, 10], [700, -70], [940, 20], [1280, -20]]), "#2d6a4f", 255);
}

// ---------------------------------------------------------------- fachada: edificio al atardecer
{
  const L = new Lienzo();
  L.degradado(0, 560, "#1e1b4b", "#f59e0b");
  L.circulo(1000, 470, 80, "#fde68a", 235, 70);
  cerros(L, 560);
  L.degradado(700, H, "#334155", "#0f172a"); // calle
  L.rect(330, 150, 620, 640, "#e2e8f0"); // torre
  L.rect(330, 150, 620, 26, "#94a3b8");
  for (let fila = 0; fila < 8; fila++) {
    for (let col = 0; col < 5; col++) {
      const x = 360 + col * 114;
      const y = 200 + fila * 74;
      const prendida = (fila * 3 + col * 5) % 7 !== 0;
      L.rect(x, y, 84, 52, "#0f172a");
      L.rect(x + 4, y + 4, 76, 44, prendida ? "#fcd34d" : "#475569", prendida ? 235 : 255);
      L.rect(x - 6, y + 52, 96, 8, "#94a3b8"); // baranda
    }
  }
  L.rect(520, 690, 240, 100, "#10b981"); // acceso
  L.rect(535, 705, 100, 85, "#0f172a");
  L.rect(645, 705, 100, 85, "#0f172a");
  L.rect(300, 780, 680, 20, "#64748b");
  for (const [x, r] of [[250, 50], [1030, 56], [200, 38]]) {
    L.rect(x - 8, 740, 16, 60, "#5a3825");
    L.circulo(x, 720, r, "#40916c");
  }
  L.viñeta();
  L.guardar("fachada.png");
}

// ---------------------------------------------------------------- sala con ventanal a la ciudad
{
  const L = new Lienzo();
  L.rect(0, 0, W, 640, "#e7e5e4");
  L.degradado(640, H, "#a8845f", "#7c5f3f");
  L.rect(120, 90, 700, 470, "#f8fafc"); // marco del ventanal
  L.degradado(110, 550, "#1e3a8a", "#fb923c", 140, 800);
  cerros(L, 380, { x: 140, w: 660, bottom: 550 });
  for (let i = 0; i < 26; i++) L.rect(150 + i * 25, 470 + (i * 37) % 70, 10, 14, "#fde68a", 230);
  L.rect(468, 110, 8, 440, "#f8fafc");
  L.rrect(560, 600, 640, 210, 40, "#10b981"); // sofá esmeralda
  L.rrect(540, 630, 90, 190, 34, "#0e9f6e");
  L.rrect(1130, 630, 90, 190, 34, "#0e9f6e");
  for (const [x, c] of [[620, "#f59e0b"], [1040, "#f1f5f9"]]) L.rrect(x, 560, 120, 120, 24, c);
  L.rrect(260, 770, 620, 130, 60, "#cbd5e1", 235); // alfombra
  L.rrect(420, 700, 300, 70, 14, "#5a3825"); // mesa de centro
  L.rect(980, 200, 14, 390, "#1f2937");
  L.poligono([[920, 200], [1054, 200], [1020, 130], [954, 130]], "#fbbf24");
  L.circulo(987, 160, 120, "#fbbf24", 60, 90);
  L.circulo(70, 640, 52, "#40916c");
  L.rect(62, 680, 16, 120, "#5a3825");
  L.viñeta();
  L.guardar("sala.png");
}

// ---------------------------------------------------------------- cocina integrada con isla
{
  const L = new Lienzo();
  L.rect(0, 0, W, 560, "#f1f5f9");
  for (let x = 0; x < W; x += 80) L.rect(x, 0, 2, 560, "#cbd5e1");
  for (let y = 0; y < 560; y += 80) L.rect(0, y, W, 2, "#cbd5e1");
  L.degradado(560, H, "#94a3b8", "#64748b");
  L.rect(60, 80, 520, 190, "#e2e8f0");
  L.rect(700, 80, 520, 190, "#e2e8f0");
  for (const x of [60, 320, 700, 960]) L.rect(x + 4, 84, 252, 182, "#10b981", 90);
  for (const x of [250, 310, 890, 950]) L.rrect(x, 165, 24, 8, 4, "#0f172a");
  L.rect(40, 450, 1200, 200, "#1e293b");
  L.rect(40, 440, 1200, 20, "#e2e8f0");
  L.rect(40, 650, 1200, 230, "#334155");
  L.rrect(180, 380, 220, 60, 10, "#0f172a");
  for (const x of [215, 265, 315]) L.circulo(x + 15, 410, 16, "#94a3b8");
  L.rrect(820, 340, 160, 100, 16, "#f1f5f9");
  L.rrect(840, 360, 100, 60, 8, "#0f172a");
  L.rrect(300, 690, 700, 70, 30, "#0e9f6e"); // isla
  L.rrect(250, 700, 800, 40, 10, "#f1f5f9");
  for (const x of [420, 640, 860]) L.circulo(x, 760, 50, "#fbbf24", 60, 80);
  L.viñeta();
  L.guardar("cocina.png");
}

// ---------------------------------------------------------------- habitación principal
{
  const L = new Lienzo();
  L.rect(0, 0, W, 660, "#cbd5e1");
  L.degradado(660, H, "#8d6e55", "#6a4f3b");
  L.rect(780, 110, 380, 330, "#f8fafc");
  L.degradado(125, 425, "#1e3a8a", "#fdba74", 795, 1145);
  cerros(L, 290, { x: 795, w: 350, bottom: 425 });
  L.rect(960, 125, 6, 300, "#f8fafc");
  L.rrect(740, 90, 90, 380, 30, "#065f46", 215);
  L.rrect(1120, 90, 90, 380, 30, "#065f46", 215);
  L.rrect(120, 330, 600, 120, 30, "#3f3f46");
  L.rrect(100, 470, 640, 250, 36, "#f8f9fa");
  L.rrect(100, 560, 640, 170, 30, "#10b981");
  L.rrect(150, 430, 220, 100, 40, "#ffffff");
  L.rrect(420, 430, 220, 100, 40, "#ffffff");
  L.rrect(60, 700, 710, 60, 16, "#3f3f46");
  L.rrect(790, 590, 140, 150, 12, "#3f3f46");
  L.circulo(860, 540, 48, "#fbbf24", 220, 70);
  L.rect(852, 560, 16, 40, "#1f2937");
  L.rrect(300, 150, 260, 170, 10, "#f8fafc");
  L.rect(316, 166, 228, 138, "#fbbf24", 190);
  L.circulo(430, 235, 40, "#f59e0b");
  L.viñeta();
  L.guardar("habitacion.png");
}

// ---------------------------------------------------------------- terraza con vista a la ciudad
{
  const L = new Lienzo();
  L.degradado(0, 520, "#1e1b4b", "#fb923c");
  L.circulo(240, 420, 70, "#fde68a", 235, 60);
  cerros(L, 470);
  for (let i = 0; i < 40; i++) {
    const x = 20 + i * 31;
    const alto = 60 + ((i * 53) % 150);
    L.rect(x, 640 - alto, 24, alto, "#1e293b");
    for (let k = 0; k < alto / 22; k++) if ((i + k) % 3) L.rect(x + 5, 640 - alto + 8 + k * 22, 6, 8, "#fde68a", 230);
  }
  L.degradado(640, H, "#334155", "#0f172a");
  L.rrect(120, 680, 1040, 230, 30, "#a98467"); // deck
  L.rect(100, 600, 1080, 18, "#e2e8f0"); // baranda
  for (let x = 120; x < 1180; x += 70) L.rect(x, 604, 8, 100, "#94a3b8");
  L.rrect(240, 760, 300, 90, 40, "#10b981"); // sillones
  L.rrect(740, 760, 300, 90, 40, "#10b981");
  L.rrect(560, 790, 150, 70, 14, "#5a3825");
  for (const x of [150, 1130]) {
    L.rect(x - 7, 700, 14, 70, "#5a3825");
    L.circulo(x, 680, 44, "#40916c");
  }
  L.circulo(640, 560, 160, "#fbbf24", 40, 120);
  L.viñeta();
  L.guardar("terraza.png");
}

// ---------------------------------------------------------------- logo (fondo transparente)
{
  const L = new Lienzo(600, 600, true);
  L.circulo(300, 300, 270, "#f59e0b");
  L.circulo(300, 300, 240, "#0f172a");
  L.rect(190, 170, 110, 270, "#10b981");
  L.rect(300, 230, 100, 210, "#f59e0b");
  for (let k = 0; k < 4; k++) {
    L.rect(210, 195 + k * 55, 28, 28, "#0f172a");
    L.rect(250, 195 + k * 55, 28, 28, "#0f172a");
  }
  for (let k = 0; k < 3; k++) L.rect(322, 255 + k * 55, 28, 28, "#0f172a");
  L.guardar("logo.png");
}
