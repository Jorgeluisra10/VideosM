#!/usr/bin/env node
/**
 * Escribe en videos/<carpeta>/ el registro.json (+ miniatura.jpg y revision.mp4 livianos) de un video que ya está en el Panel de Videos.
 *   node scripts/panel/exportar-registro.mjs --carpeta=videos/2026-10-28-slug [--titulo="Título exacto"] [--mp4=ruta/al/video-final.mp4]
 * Sin --titulo usa el de la respuesta-ia.json de la carpeta. Después haz commit y push: el panel de tu computador trae el video al abrir la Biblioteca.
 */
import "../_tmp.mjs";
import { exportarRegistroCarpeta } from "./videos.mjs";

const args = process.argv.slice(2);
const valor = (n) => args.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3) ?? "";
try {
  if (!valor("carpeta")) throw new Error("Falta --carpeta=videos/AAAA-MM-DD-slug");
  const x = await exportarRegistroCarpeta({ carpeta: valor("carpeta"), titulo: valor("titulo"), mp4: valor("mp4") || null });
  console.log(`📁 ${x.carpeta}/registro.json · «${x.registro.titulo}» · ${x.registro.estado}${x.registro.video ? " · revision.mp4" : " · (sin video)"}${x.registro.miniatura ? " · miniatura.jpg" : ""}`);
} catch (e) {
  console.error(`⚠️ ${e.message ?? e}`);
  process.exit(1);
}
