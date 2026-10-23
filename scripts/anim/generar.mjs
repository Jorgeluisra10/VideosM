#!/usr/bin/env node
/**
 * Genera la animación (src/data/animacion.json) a partir de un guion en bloques [ESCENA N | inicio-fin | MODO: SVG|3D].
 *
 *   node scripts/anim/generar.mjs --guion=mi-guion.txt [--modelo=gpt-4.1-mini] [--sfx=si|no] [--paleta=imnoba|medicina] [--motor=estudio|clasico]
 *   node scripts/anim/generar.mjs --guion=-            (lee el guion de la entrada estándar)
 *
 * Necesita OPENAI_API_KEY (archivo .env). Imprime el costo REAL en USD (usage.prompt_tokens / completion_tokens).
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { cargarEnv } from "../ia/entorno.mjs";
import { configuracion } from "../ia/entorno.mjs";
import { ErrorGuion, generarAnimacion } from "./agente.mjs";
import { cargarNucleoAnim, RAIZ } from "./nucleo.mjs";

cargarEnv();
const args = process.argv.slice(2);
const valor = (n, def) => args.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3) ?? def;
const archivo = valor("guion");
if (!archivo) {
  console.error("Falta --guion=<archivo.txt> (o --guion=- para leer de la entrada estándar).");
  process.exit(1);
}
const guion = archivo === "-" ? readFileSync(0, "utf8") : readFileSync(archivo, "utf8");
const modelo = valor("modelo", "gpt-4.1-mini");
const sfx = !/^(no|false|0|off)$/i.test(valor("sfx", "si"));
const paleta = valor("paleta", "imnoba");
const verificar = !args.includes("--sin-verificar") && !process.env.VIDEMED_SIN_VERIFICAR;
// motor: «estudio» (JSON ultraligero + figuras prefabricadas, por defecto) o «clasico» (la IA escribe la escena completa)
const motor = valor("motor", process.env.VIDEMED_MOTOR || "estudio");

const cfg = configuracion();
if (!cfg.clave) {
  console.error("❌ No hay OPENAI_API_KEY. Ponla en el archivo .env (panel → Ajustes) y vuelve a intentarlo.");
  process.exit(1);
}

try {
  const N = await cargarNucleoAnim();
  const { anim, uso, locucion } = await generarAnimacion({ guion, modelo, sfx, paleta, log: (s) => console.log(s), cfg, verificar, motor });
  writeFileSync(join(RAIZ, "src", "data", "animacion.json"), JSON.stringify(anim, null, 1));
  // VOZ_OFF → guion-locucion.txt (solo para que lo leas al grabar; no se dibuja ni se envía a la IA)
  if (locucion) {
    mkdirSync(join(RAIZ, "trabajo", "salida"), { recursive: true });
    writeFileSync(join(RAIZ, "trabajo", "salida", "guion-locucion.txt"), locucion);
    console.log("📝 Guion de locución guardado en trabajo/salida/guion-locucion.txt");
  }
  const dir = join(RAIZ, "trabajo", "anim", "historial");
  mkdirSync(dir, { recursive: true });
  const id = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  writeFileSync(join(dir, `${id}.json`), JSON.stringify({ id, creado: new Date().toISOString(), opciones: { modelo, sfx, paleta }, guion, animacion: anim }, null, 1));
  console.log(`\n✅ ${anim.escenas.length} escenas · ${anim.duracion} s · guardada en src/data/animacion.json`);
  console.log(`💲 Costo real de este video: ${N.formatoUSD(uso.costo_usd, 5)}  (${uso.prompt_tokens} tokens de entrada + ${uso.completion_tokens} de salida, ${uso.llamadas} llamada${uso.llamadas > 1 ? "s" : ""})`);
} catch (e) {
  if (e instanceof ErrorGuion) {
    console.error("❌ El guion tiene problemas:\n" + e.errores.map((x) => "   · " + x).join("\n"));
    process.exit(2);
  }
  console.error("❌ " + (e?.message ?? e));
  process.exit(1);
}
