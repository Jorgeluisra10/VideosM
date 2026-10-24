#!/usr/bin/env node
/**
 * Trae la ÚLTIMA versión del proyecto desde GitHub sin que choque con lo que generaste en tu equipo.
 *   npm run actualizar
 *
 * Por qué hace falta: src/data/animacion.json (y otros archivos de datos) cambian cada vez que generas un video, y `git pull` se niega a
 * actualizar si hay cambios locales («Your local changes would be overwritten»). Entonces te quedas con el código VIEJO sin darte cuenta.
 * Este script guarda tus cambios locales en un «stash» (no se pierde nada: `git stash list`), hace el pull, instala dependencias y te dice
 * si hay que reiniciar el panel.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(fileURLToPath(import.meta.url), "..", "..");
const win = process.platform === "win32";
const git = (...args) => spawnSync("git", args, { cwd: RAIZ, encoding: "utf8", shell: win });
const mostrar = (r) => { if (r.stdout?.trim()) console.log(r.stdout.trim()); if (r.stderr?.trim()) console.log(r.stderr.trim()); };
const paso = (t) => console.log(`\n▶ ${t}`);

if (!existsSync(join(RAIZ, ".git"))) {
  console.error("❌ Esta carpeta no es un repositorio de git (no hay .git). Clona el proyecto con: git clone https://github.com/jorgeluisra10/videosm");
  process.exit(1);
}

const antes = git("rev-parse", "--short", "HEAD").stdout.trim();
const rama = git("rev-parse", "--abbrev-ref", "HEAD").stdout.trim();
console.log(`Versión actual: ${antes} (rama ${rama})`);

paso("Revisando si hay cambios locales que bloqueen la actualización");
const sucio = git("status", "--porcelain", "--untracked-files=no").stdout.trim();
if (sucio) {
  console.log(`Hay cambios locales en:\n${sucio.split("\n").map((l) => "   " + l).join("\n")}`);
  const r = git("stash", "push", "-m", `videmed-antes-de-actualizar-${new Date().toISOString().slice(0, 16)}`);
  mostrar(r);
  if (r.status !== 0) { console.error("❌ No pude guardar tus cambios locales. Cópialos a otra carpeta y ejecuta: git checkout -- ."); process.exit(1); }
  console.log("✔ Tus cambios locales quedaron guardados (git stash list). Si algún día los necesitas: git stash pop");
} else console.log("✔ Sin cambios locales.");

paso("Descargando la última versión");
let r = git("pull", "--ff-only", "origin", rama === "HEAD" ? "main" : rama);
mostrar(r);
if (r.status !== 0) {
  console.error("\n❌ No se pudo actualizar. Si tu rama local tiene commits propios, ejecuta: git pull origin main --no-rebase  (o pide ayuda con este mensaje).");
  process.exit(1);
}

paso("Instalando dependencias (solo si cambiaron)");
const npm = spawnSync(win ? "npm.cmd" : "npm", ["install", "--no-audit", "--no-fund"], { cwd: RAIZ, stdio: "inherit", shell: win });
if (npm.status !== 0) console.warn("⚠ npm install terminó con avisos; si el panel no arranca, ejecútalo a mano.");

const despues = git("rev-parse", "--short", "HEAD").stdout.trim();
let version = "";
try { version = JSON.parse(readFileSync(join(RAIZ, "package.json"), "utf8")).version; } catch { /* sin versión */ }
console.log(`\n✅ Listo: ${antes} → ${despues}${version ? ` (paquete ${version})` : ""}.`);
console.log("🔄 Si el panel estaba abierto: ciérralo (Ctrl+C en su terminal), vuelve a lanzarlo con  npm run panel  y recarga la página con Ctrl+F5.");
