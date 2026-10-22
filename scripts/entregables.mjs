#!/usr/bin/env node
/**
 * VideMed · Fase 5 — Entregables finales.
 *   node scripts/entregables.mjs
 *
 * Requiere haber renderizado ya trabajo/salida/video-terminado.mp4 (npm run build).
 * Genera/copia:
 *   trabajo/salida/portada.jpg           portada (composición "Portada")
 *   trabajo/salida/texto-del-post.txt    descripción + 5 hashtags (desde src/data/post.txt)
 * y archiva todo el paquete en trabajo/archivo/<id-del-tema>/ para no perder videos anteriores.
 */
import "./_tmp.mjs"; // temporales dentro del proyecto (evita discos del sistema llenos)
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";
import { dormir, esperarMemoria, obtenerPaquete } from "./_comun.mjs";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SALIDA = join(RAIZ, "trabajo", "salida");
mkdirSync(SALIDA, { recursive: true });
const arg = (n) => process.argv.slice(2).find((a) => a.startsWith(`--${n}=`))?.split("=")[1];

const video = join(SALIDA, "video-terminado.mp4");
if (!existsSync(video)) {
  console.error("❌ Falta trabajo/salida/video-terminado.mp4. Ejecuta antes:  npm run build");
  process.exit(1);
}

// ---- portada ----
console.log("🖼️  Renderizando portada...");
const serveUrl = await obtenerPaquete({ bundleDado: arg("bundle") });
const portada = join(SALIDA, "portada.jpg");
let portadaLista = false;
for (let intento = 1; intento <= 5 && !portadaLista; intento++) {
  await esperarMemoria("renderizar la portada", { min: 0.5 });
  let nav = null;
  try {
    nav = await openBrowser("chrome", { logLevel: "error" });
    const composition = await selectComposition({ serveUrl, id: "Portada", puppeteerInstance: nav });
    await renderStill({ composition, serveUrl, output: portada, imageFormat: "jpeg", jpegQuality: 95, overwrite: true, puppeteerInstance: nav });
    portadaLista = existsSync(portada) && statSync(portada).size > 20000;
  } catch (e) {
    console.warn(`   ↻ la portada falló (${String(e?.message ?? e).split("\n")[0].slice(0, 90)}). Reintento ${intento}/4...`);
    await dormir(4000 * intento);
  } finally {
    try {
      await nav?.close({ silent: true });
    } catch {
      /* ya estaba cerrado */
    }
  }
}
if (!portadaLista) {
  console.error("❌ No pude generar la portada. Vuelve a ejecutar  npm run entregables");
  process.exit(1);
}
console.log("   ✔ portada.jpg");

// ---- texto del post ----
const rutaPost = join(RAIZ, "src", "data", "post.txt");
const destinoPost = join(SALIDA, "texto-del-post.txt");
if (existsSync(rutaPost)) {
  copyFileSync(rutaPost, destinoPost);
  const hashtags = (readFileSync(rutaPost, "utf8").match(/#[\p{L}\p{N}_]+/gu) ?? []).length;
  console.log(`   ✔ texto-del-post.txt (${hashtags} hashtags)`);
  if (hashtags !== 5) console.warn(`⚠️  El post tiene ${hashtags} hashtags; el formato pide 5.`);
} else {
  writeFileSync(destinoPost, "Escribe aquí la descripción del post.\n\n#medicina #salud #anatomia #fisiologia #medicostiktok\n", "utf8");
  console.warn("⚠️  No existe src/data/post.txt: dejé una plantilla en texto-del-post.txt");
}

// ---- archivo histórico ----
const tema = JSON.parse(readFileSync(join(RAIZ, "src", "data", "tema.json"), "utf8"));
const archivo = join(RAIZ, "trabajo", "archivo", tema.id);
mkdirSync(archivo, { recursive: true });
const paquete = [
  [video, "video-terminado.mp4"],
  [portada, "portada.jpg"],
  [destinoPost, "texto-del-post.txt"],
  [join(RAIZ, "public", "audios", "voz.mp3"), "voz.mp3"],
  [join(RAIZ, "src", "data", "timestamps.json"), "timestamps.json"],
  [join(RAIZ, "src", "data", "guion.txt"), "guion.txt"],
];
for (const [origen, nombre] of paquete) if (existsSync(origen)) copyFileSync(origen, join(archivo, nombre));

const mb = (statSync(video).size / 1048576).toFixed(1);
console.log(`\n✅ Listo. Video de ${mb} MB.`);
console.log("   trabajo/salida/video-terminado.mp4");
console.log("   trabajo/salida/portada.jpg");
console.log("   trabajo/salida/texto-del-post.txt");
console.log(`   (copia de seguridad en trabajo/archivo/${tema.id}/)`);
