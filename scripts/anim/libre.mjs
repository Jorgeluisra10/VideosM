/**
 * LIENZO LIBRE (Node): compila el código que escribe la IA y arma la animación.
 *   · revisarCodigo (política: sin red, sin window/document, sin Math.random, usa el tiempo…) viene del núcleo puro.
 *   · compilarEscena transpila JSX → JavaScript con esbuild y detecta errores de sintaxis ANTES de renderizar.
 */
import { transform } from "esbuild";
import { cargarNucleoAnim } from "./nucleo.mjs";

/** JSX → JS. El cuerpo se envuelve en `function Escena(){…}` (así `return` y los hooks son válidos). Lanza Error con un mensaje corto si no compila. */
export async function compilarEscena(codigo) {
  try {
    const r = await transform(`function Escena(){\n${codigo}\n}`, { loader: "jsx", jsx: "transform", jsxFactory: "React.createElement", jsxFragment: "React.Fragment", target: "es2019", logLevel: "silent" });
    return r.code;
  } catch (e) {
    const m = e?.errors?.[0];
    throw new Error(m ? `sintaxis (línea ${Math.max(1, (m.location?.line ?? 2) - 1)}): ${m.text}` : String(e?.message ?? e).split("\n")[0]);
  }
}

const SFX_OK = ["pop", "whoosh", "heartbeat", "cash", "tick", "thud", "zap", "ding"];

/**
 * Une lo que devolvió la IA (código por escena) con lo local (tiempos, texto, SFX del guion).
 * Cada escena pasa la política de seguridad y se compila; lo que falle sale en `errores` («Escena N: …») para repararlo.
 * @returns {{anim:object|null, errores:string[], correcciones:string[]}}
 */
export async function ensamblarLibre(raw, escenas, { paleta = "imnoba", sfx = true, titulo, rescate = false } = {}) {
  const N = await cargarNucleoAnim();
  const errores = [];
  const correcciones = [];
  const rescatadas = [];
  const crudas = Array.isArray(raw?.escenas) ? raw.escenas : [];
  const salida = [];
  for (let k = 0; k < escenas.length; k++) {
    const e = escenas[k];
    const r = crudas.find((x) => Number(x?.n) === e.n) ?? (crudas.length === escenas.length ? crudas[k] : undefined);
    const problemas = r ? N.revisarCodigo(r.codigo) : ["la IA no devolvió esta escena"];
    let js = "";
    if (r && !problemas.length) {
      try { js = await compilarEscena(r.codigo); } catch (err) { problemas.push(err.message); }
    }
    let codigo = r?.codigo;
    let rescatada = false;
    if (problemas.length) {
      for (const p of problemas) errores.push(`Escena ${e.n}: ${p}`);
      if (!rescate) continue;
      // escena de rescate: el video se puede renderizar aunque una escena no se haya podido reparar
      codigo = N.codigoFallback(e.direccion || e.voz);
      js = await compilarEscena(codigo);
      rescatada = true;
      rescatadas.push(e.n);
    }
    // SFX: lo que escribió el usuario manda; si no hay, los de la IA (nombres raros caen a «pop» sin avisar)
    let eventos;
    if (sfx) {
      const propios = e.sfx.map((s) => ({ t: s.t, tipo: s.tipo, vol: 0.15 }));
      const ia = (Array.isArray(r?.sfx) ? r.sfx : []).slice(0, 8).map((s) => ({ t: Math.min(Math.max(0, +Number(s?.t) || 0), Math.max(0, e.dur - 0.1)), tipo: SFX_OK.includes(s?.tipo) ? s.tipo : "pop", vol: Math.min(0.4, Math.max(0.02, Number(s?.vol) || 0.15)) }));
      eventos = propios.length ? propios : ia;
    }
    salida.push({ modo: "LIBRE", n: e.n, tema: "oscuro", codigo, js, ...(rescatada ? { fallback: true } : {}), ...(eventos ? { sfx: eventos } : {}), inicio: e.inicio, fin: e.fin, dur: e.dur, texto: e.direccion || e.voz });
  }
  const fin = escenas.length ? escenas[escenas.length - 1].fin : 0;
  const anim = {
    version: 1,
    titulo: titulo || (escenas[0]?.voz ? escenas[0].voz.split(/\s+/).slice(0, 7).join(" ") : "Video libre"),
    paleta, sfx, fps: 60, duracion: fin, escenas: salida, uso: null, hud: false, formato: "libre",
  };
  return { anim: errores.length && !rescate ? null : anim, errores, correcciones, rescatadas };
}

/** Sustituye por la escena de rescate el código de las escenas indicadas (las que no se lograron reparar). */
export async function aplicarRescate(anim, numeros, escenas) {
  const N = await cargarNucleoAnim();
  for (const n of numeros) {
    const i = anim.escenas.findIndex((e) => e.n === n);
    if (i < 0) continue;
    const e = escenas.find((x) => x.n === n);
    const codigo = N.codigoFallback(e?.direccion || e?.voz || "");
    anim.escenas[i] = { ...anim.escenas[i], codigo, js: await compilarEscena(codigo), fallback: true };
  }
  return anim;
}
