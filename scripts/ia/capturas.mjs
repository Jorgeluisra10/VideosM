#!/usr/bin/env node
/**
 * Renderiza capturas reales de cada escena del plan ACTIVO (src/data/plan.json): una a mitad y otra al
 * final de cada escena larga. Son las mismas que mira el modelo con visión; también sirven para que
 * tú (o cualquier IA con visión) revises el resultado.
 *
 *   npm run ia:capturas                 → trabajo/ia/capturas/*.jpg
 *   npm run ia:capturas -- --escala 1   (tamaño completo 1080×1920; por defecto 0.75)
 */
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { RAIZ, cargarNucleo } from "./puente.mjs";

/** Fotogramas a capturar por escena (deterministas). */
export async function fotogramasPorEscena(plan, palabras, max = 14) {
  const N = await cargarNucleo();
  const { inicios, fines } = N.tiemposDePlan(plan, palabras);
  const lista = [];
  plan.escenas.forEach((e, i) => {
    const dur = fines[i] - inicios[i];
    const ts = dur >= 4.6 ? [inicios[i] + dur * 0.45, fines[i] - 0.55] : [Math.min(fines[i] - 0.3, inicios[i] + dur * 0.8)];
    ts.forEach((t, k) => {
      const seg = Math.max(0.1, t);
      lista.push({ escena: e.id, segundo: seg, frame: Math.round(seg * 60), mitad: ts.length === 2 && k === 0, indiceEscena: i });
    });
  });
  // Si hay demasiadas, se renuncia primero a las capturas "de mitad" de las últimas escenas.
  while (lista.length > max) {
    const idx = [...lista.keys()].reverse().find((k) => lista[k].mitad);
    lista.splice(idx ?? lista.length - 1, 1);
  }
  return lista;
}

/** Renderiza las capturas con scripts/qa.mjs (modo rápido). Devuelve [{escena, segundo, frame, archivo, dataUrl}] o null. */
export async function renderizarCapturas(plan, palabras, { escala = 0.75, max = 14, dataUrl = true } = {}) {
  const lista = await fotogramasPorEscena(plan, palabras, max);
  const dir = join(RAIZ, "trabajo", "tmp", "qa-rapido");
  rmSync(dir, { recursive: true, force: true });
  const r = spawnSync(process.execPath, [join(RAIZ, "scripts", "qa.mjs"), "--imagenes", lista.map((x) => x.frame).join(","), "--formato", "jpeg", "--escala", String(escala)], { cwd: RAIZ, stdio: "inherit" });
  if (r.status !== 0) return null;
  const out = [];
  for (const c of lista) {
    const archivo = join(dir, `frame-${String(c.frame).padStart(5, "0")}.jpg`);
    if (existsSync(archivo)) out.push({ ...c, archivo, ...(dataUrl ? { dataUrl: "data:image/jpeg;base64," + readFileSync(archivo).toString("base64") } : {}) });
  }
  return out;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const i = process.argv.indexOf("--escala");
  const escala = i > -1 ? Number(process.argv[i + 1]) || 0.75 : 0.75;
  const plan = JSON.parse(readFileSync(join(RAIZ, "src", "data", "plan.json"), "utf8"));
  const palabras = JSON.parse(readFileSync(join(RAIZ, "src", "data", "timestamps.json"), "utf8"));
  const caps = await renderizarCapturas(plan, palabras, { escala, max: 40, dataUrl: false });
  if (!caps) {
    console.error("❌ No se pudieron renderizar las capturas (¿poca memoria? cierra navegador/WSL y repite).");
    process.exit(1);
  }
  const destino = join(RAIZ, "trabajo", "ia", "capturas");
  rmSync(destino, { recursive: true, force: true });
  mkdirSync(destino, { recursive: true });
  caps.forEach((c, k) => {
    const nombre = `${String(k + 1).padStart(2, "0")}-${c.escena}-${c.segundo.toFixed(1)}s.jpg`;
    copyFileSync(c.archivo, join(destino, nombre));
    console.log("  📷", join("trabajo", "ia", "capturas", nombre));
  });
}
