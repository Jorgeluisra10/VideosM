#!/usr/bin/env node
/**
 * Registra en el Panel de Videos (data/videos.json) el video que acaba de generar el sistema (estado «grabado», con guion, voz e instrucciones).
 *   node scripts/panel/registrar-video.mjs [--estado=grabado] [--sin-voz] [--serie=estafas] [--notas="qué esperas y qué métrica mirar"] [--carpeta=videos/AAAA-MM-DD-slug]
 * Con --carpeta también escribe en esa carpeta su registro.json, miniatura.jpg y una revision.mp4 liviana: al subirla a git, el panel de tu computador trae el video solo.
 * El panel lo ejecuta solo como último paso de «Renderizar» y de «Ponerla al video ya renderizado».
 */
import "../_tmp.mjs";
import { exportarRegistroCarpeta, registrarDesdeProyectoActivo } from "./videos.mjs";

const args = process.argv.slice(2);
const estado = args.find((a) => a.startsWith("--estado="))?.slice(9) || "grabado";
try {
  const valor = (n) => args.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3) ?? "";
  const r = await registrarDesdeProyectoActivo({ estado, sinVoz: args.includes("--sin-voz"), serie: valor("serie"), notas: valor("notas") });
  if (!r) console.log("(No hay una animación activa que registrar.)");
  else console.log(`📊 ${r.creado ? "Registrado" : "Actualizado"} en el Panel de Videos: «${r.video.titulo}» · ${r.video.estado}${r.video.ruta_archivo ? " · copia del video guardada" : ""}`);
  if (r && valor("carpeta")) {
    const { join } = await import("node:path");
    const { RAIZ } = await import("../anim/nucleo.mjs");
    const x = await exportarRegistroCarpeta({ carpeta: valor("carpeta"), titulo: r.video.titulo, mp4: join(RAIZ, "trabajo", "salida", "video-animacion.mp4") });
    console.log(`📁 Registro escrito en ${x.carpeta}/ (registro.json${x.registro.video ? " + revision.mp4" : ""}${x.registro.miniatura ? " + miniatura.jpg" : ""}). Haz commit y push: tu panel lo trae solo.`);
  }
} catch (e) {
  console.error(`⚠️ No pude registrar el video en el panel: ${e.message ?? e}`);
  process.exit(0); // el render ya terminó bien: esto nunca lo hace fallar
}
