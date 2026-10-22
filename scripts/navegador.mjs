/**
 * VideMed · abre el navegador sin cabeza que usa Remotion.
 *
 * Normalmente Remotion descarga su propio Chrome la primera vez (necesita internet). Si el equipo no puede
 * descargarlo (red restringida, servidor, contenedor), esta ayuda busca un Chrome/Chromium ya instalado:
 *
 *   1. variable BROWSER_EXECUTABLE (o REMOTION_BROWSER_EXECUTABLE) con la ruta al ejecutable
 *   2. el Chrome de Remotion, si ya está descargado (node_modules/.remotion)  → se usa el de siempre
 *   3. Playwright (PLAYWRIGHT_BROWSERS_PATH, ~/.cache/ms-playwright, /opt/pw-browsers)
 *   4. Chrome / Chromium / Edge del sistema
 *
 * Si no encuentra ninguno, devuelve undefined y Remotion lo descarga como siempre.
 * Importar DESPUÉS de "./_tmp.mjs".
 */
import { existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { openBrowser } from "@remotion/renderer";
import { RAIZ_PROYECTO } from "./_tmp.mjs";

const hijos = (dir) => {
  try {
    return readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort().reverse();
  } catch {
    return [];
  }
};

function propioDeRemotion() {
  const base = join(RAIZ_PROYECTO, "node_modules", ".remotion");
  if (!existsSync(base)) return false;
  const exe = process.platform === "win32" ? "chrome-headless-shell.exe" : "chrome-headless-shell";
  const buscar = (dir, prof = 0) => {
    if (prof > 4) return false;
    for (const d of readdirSync(dir, { withFileTypes: true })) {
      if (d.isFile() && d.name === exe) return true;
      if (d.isDirectory() && buscar(join(dir, d.name), prof + 1)) return true;
    }
    return false;
  };
  try {
    return buscar(base);
  } catch {
    return false;
  }
}

function dePlaywright() {
  const raices = [process.env.PLAYWRIGHT_BROWSERS_PATH, join(homedir(), ".cache", "ms-playwright"), "/opt/pw-browsers", join(homedir(), "AppData", "Local", "ms-playwright")].filter(Boolean);
  for (const raiz of raices) {
    for (const d of hijos(raiz)) {
      const candidatos = [
        d.startsWith("chromium_headless_shell") && join(raiz, d, "chrome-linux", "headless_shell"),
        d.startsWith("chromium_headless_shell") && join(raiz, d, "chrome-win", "headless_shell.exe"),
        d.startsWith("chromium-") && join(raiz, d, "chrome-linux", "chrome"),
        d.startsWith("chromium-") && join(raiz, d, "chrome-win", "chrome.exe"),
        d.startsWith("chromium-") && join(raiz, d, "chrome-mac", "Chromium.app", "Contents", "MacOS", "Chromium"),
      ].filter(Boolean);
      const ok = candidatos.find((c) => existsSync(c));
      if (ok) return ok;
    }
  }
  return null;
}

function delSistema() {
  const c = [
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  ];
  return c.find((x) => existsSync(x)) ?? null;
}

let memo;
/** Ruta del ejecutable a usar o undefined (= el Chrome propio de Remotion). */
export function ejecutableNavegador() {
  if (memo !== undefined) return memo || undefined;
  const env = process.env.BROWSER_EXECUTABLE || process.env.REMOTION_BROWSER_EXECUTABLE;
  if (env && existsSync(env)) memo = env;
  else if (propioDeRemotion()) memo = "";
  else memo = dePlaywright() || delSistema() || "";
  return memo || undefined;
}

/** Opciones que hay que pasar a openBrowser / renderStill / renderFrames para usar el ejecutable elegido. */
export const opcionesNavegador = () => {
  const browserExecutable = ejecutableNavegador();
  return browserExecutable ? { browserExecutable } : {};
};

/**
 * Motor gráfico para WebGL (escenas 3D). VIDEMED_GL = angle | swangle | egl | vulkan | angle-egl.
 * Sin variable: en Linux (servidores, contenedores sin GPU) "swangle" (por software); en Windows/Mac el predeterminado de Remotion (usa la GPU si hay).
 */
export const glPorDefecto = () => process.env.VIDEMED_GL || (process.platform === "linux" ? "swangle" : undefined);

/** openBrowser("chrome") con el ejecutable adecuado y WebGL configurado; `chromiumOptions` propias se combinan, no se pisan. */
export const abrirNavegador = (opciones = {}) => {
  const gl = glPorDefecto();
  const { chromiumOptions = {}, ...resto } = opciones;
  return openBrowser("chrome", { logLevel: "error", ...opcionesNavegador(), ...resto, chromiumOptions: { ...(gl ? { gl } : {}), ...chromiumOptions } });
};
