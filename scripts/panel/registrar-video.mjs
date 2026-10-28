#!/usr/bin/env node
/**
 * Registra en el Panel de Videos (data/videos.json) el video que acaba de generar el sistema (estado «grabado», con guion, voz e instrucciones).
 *   node scripts/panel/registrar-video.mjs [--estado=grabado] [--sin-voz]
 * El panel lo ejecuta solo como último paso de «Renderizar» y de «Ponerla al video ya renderizado».
 */
import "../_tmp.mjs";
import { registrarDesdeProyectoActivo } from "./videos.mjs";

const args = process.argv.slice(2);
const estado = args.find((a) => a.startsWith("--estado="))?.slice(9) || "grabado";
try {
  const r = await registrarDesdeProyectoActivo({ estado, sinVoz: args.includes("--sin-voz") });
  if (!r) console.log("(No hay una animación activa que registrar.)");
  else console.log(`📊 ${r.creado ? "Registrado" : "Actualizado"} en el Panel de Videos: «${r.video.titulo}» · ${r.video.estado}${r.video.ruta_archivo ? " · copia del video guardada" : ""}`);
} catch (e) {
  console.error(`⚠️ No pude registrar el video en el panel: ${e.message ?? e}`);
  process.exit(0); // el render ya terminó bien: esto nunca lo hace fallar
}
