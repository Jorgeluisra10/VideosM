/**
 * VideMed · utilidades compartidas por los scripts que usan Remotion/Chrome.
 *
 *  - memoriaLibreGB / esperarMemoria: en Windows con poca RAM, Chrome o ffmpeg mueren si falta
 *    memoria COMPROMETIDA (RAM + archivo de paginación). Se espera a que haya antes de empezar.
 *  - huellaProyecto / obtenerPaquete: el empaquetado de Remotion (bundle) es lo que más memoria
 *    pide; se cachea por huella de src/ y public/ y solo se rehace si algo cambia.
 *
 * Importar siempre DESPUÉS de "./_tmp.mjs" (redirige los temporales al proyecto).
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import os from "node:os";
import { join } from "node:path";
import { bundle } from "@remotion/bundler";
import { RAIZ_PROYECTO } from "./_tmp.mjs";

export const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

/** Memoria libre que importa: en Windows es la comprometida; en otros sistemas, la física libre. */
export function memoriaLibreGB() {
  if (process.platform === "win32") {
    const r = spawnSync("powershell", ["-NoProfile", "-NonInteractive", "-Command", "(Get-CimInstance Win32_OperatingSystem).FreeVirtualMemory"], { encoding: "utf8" });
    const kb = Number(String(r.stdout ?? "").trim());
    if (Number.isFinite(kb) && kb > 0) return kb / 1048576;
  }
  return os.freemem() / 2 ** 30;
}

/** Espera (con avisos) a que haya `min` GB libres. Pasado `maxMin` minutos continúa igualmente. */
export async function esperarMemoria(para, { min = 0.6, maxMin = 40 } = {}) {
  const inicio = Date.now();
  let ultimoAviso = 0;
  for (;;) {
    const libre = memoriaLibreGB();
    if (libre >= min) return;
    if ((Date.now() - inicio) / 60000 >= maxMin) {
      console.warn(`   ⚠️  Sigo sin memoria tras ${maxMin} min (${libre.toFixed(2)} GB libres). Lo intento igualmente.`);
      return;
    }
    if (Date.now() - ultimoAviso > 60000) {
      console.log(`   ⏳ Memoria insuficiente para ${para}: ${libre.toFixed(2)} GB libres, necesito ${min}. Cierra navegador/WSL/ventanas pesadas; continúo solo en cuanto haya.`);
      ultimoAviso = Date.now();
    }
    await dormir(8000);
  }
}

/** Huella de lo que afecta al paquete: si no cambió nada, se reutiliza el empaquetado anterior. */
export function huellaProyecto() {
  const h = createHash("sha1");
  const recorrer = (dir) => {
    if (!existsSync(dir)) return;
    for (const e of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const ruta = join(dir, e.name);
      if (e.isDirectory()) recorrer(ruta);
      else {
        const st = statSync(ruta);
        h.update(`${ruta}:${st.size}:${Math.round(st.mtimeMs)};`);
      }
    }
  };
  for (const d of ["src", "public"]) recorrer(join(RAIZ_PROYECTO, d));
  for (const f of ["package.json", "remotion.config.ts", "tsconfig.json"]) {
    const ruta = join(RAIZ_PROYECTO, f);
    if (existsSync(ruta)) h.update(`${f}:${statSync(ruta).size}:${Math.round(statSync(ruta).mtimeMs)};`);
  }
  return h.digest("hex").slice(0, 12);
}

/**
 * Devuelve la ruta de un paquete de Remotion listo para renderizar.
 * `bundleDado` (opcional) reutiliza una carpeta ya empaquetada; si no, usa/crea la caché.
 */
export async function obtenerPaquete({ bundleDado, minMemoria = 0.6, log = console.log } = {}) {
  if (bundleDado) {
    if (!existsSync(join(bundleDado, "index.html"))) throw new Error(`--bundle: no encuentro index.html en ${bundleDado}`);
    log(`📦 Usando paquete indicado: ${bundleDado}`);
    return bundleDado;
  }
  const cache = join(RAIZ_PROYECTO, "trabajo", "tmp", "bundle-cache");
  const destino = join(cache, huellaProyecto());
  if (existsSync(join(destino, "index.html"))) {
    log("📦 Paquete en caché (nada cambió desde la última vez)");
    return destino;
  }
  log("📦 Empaquetando proyecto (solo ocurre cuando cambia algo)...");
  for (let intento = 1; intento <= 4; intento++) {
    await esperarMemoria("empaquetar", { min: minMemoria });
    try {
      rmSync(cache, { recursive: true, force: true });
      mkdirSync(cache, { recursive: true });
      return await bundle({ entryPoint: join(RAIZ_PROYECTO, "src", "index.ts"), outDir: destino, onProgress: () => {} });
    } catch (e) {
      if (intento === 4) throw e;
      console.warn(`   ↻ el empaquetado falló (${String(e?.message ?? e).split("\n")[0].slice(0, 90)}). Reintento ${intento}/3...`);
      await dormir(5000 * intento);
    }
  }
}
