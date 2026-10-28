/**
 * LABORATORIO DE VOZ: escribe o elige un guion corto, genera 1–3 versiones (voz + instrucciones) con OpenAI gpt-4o-mini-tts, escúchalas lado a lado
 * y marca la que te gustó para dejarla como voz por defecto (voz.config.json). También: ver cómo queda el texto ya preparado para la voz,
 * editar el diccionario de pronunciación y ver cuántos caracteres llevas este mes.
 * Recibe del panel principal sus utilidades en `ctx` = { h, api, aviso, fallo, num, N }.
 */
let h, api, aviso, fallo, N;

const EJEMPLOS = [
  ["Registrar una propiedad o vehículo", "¿Tienes una propiedad o un vehículo para vender? Publícalo gratis en imnoba.com y llega a personas que de verdad lo están buscando. Solo te toma tres minutos."],
  ["Precio y área", "Esta propiedad en Tunja cuesta $950.000.000, tiene 85 m² y está a cinco minutos de la UPTC. ¿Cuánto crees que vale el metro cuadrado? Te lo cuento al final."],
  ["Contra las estafas", "Ojo con esto: si te piden plata antes de que veas la propiedad, desconfía. En el 37 % de las estafas el anuncio parecía perfecto. Verifica siempre con un agente registrado."],
];
const PRIMERAS = ["coral", "nova", "shimmer", "sage"];

const L = { cfg: null, uso: null, claveOpenAI: false, texto: EJEMPLOS[0][1], preparar: true, versiones: [], resultado: null, preparado: null, generando: false, dic: "" };

const dicATexto = (d) => Object.entries(d).filter(([k]) => !k.startsWith("_")).map(([k, v]) => `${k} = ${v}`).join("\n");
const textoADic = (t) => Object.fromEntries(String(t).split("\n").map((l) => l.trim()).filter((l) => l && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }).filter(([k, v]) => k && v));
const fmt = (n) => Number(n ?? 0).toLocaleString("es-CO");

async function cargar() {
  const r = await api("/api/voz/config");
  L.cfg = r.config; L.uso = r.uso; L.claveOpenAI = r.claveOpenAI; L.dic = dicATexto(r.pronunciacion);
  if (!L.versiones.length) L.versiones = PRIMERAS.slice(0, 3).map((v) => ({ voz: v === "coral" ? L.cfg.voz : v, instrucciones: L.cfg.instrucciones }));
}

let temporizador;
/** Pide cómo queda el texto preparado y repinta SOLO esa zona (así no se pierde el cursor al escribir). */
function pedirPreparado() {
  clearTimeout(temporizador);
  temporizador = setTimeout(async () => {
    try { L.preparado = await api("/api/voz/preparar", { metodo: "POST", cuerpo: { texto: L.texto, diccionario: textoADic(L.dic) } }); } catch { L.preparado = null; }
    pintarPreparado();
  }, 350);
}
function pintarPreparado() {
  const z = document.querySelector("#lab-prep");
  if (!z) return;
  const p = L.preparado;
  z.replaceChildren(...(p ? [h("details", { open: true }, h("summary.chico-t.suave", `Así se lee en voz alta (${p.tramos.length} tramos de ${Math.min(...p.tramos)} a ${Math.max(...p.tramos)} palabras)`),
    h("p.lab-preparado", p.texto), p.cambios.filter((c) => c.tipo !== "pausa").length ? h("ul.chico-t.suave", p.cambios.filter((c) => c.tipo !== "pausa").slice(0, 14).map((c) => h("li", `${c.tipo === "numero" ? "🔢" : c.tipo === "diccionario" ? "📖" : "✏️"} «${c.de}» → «${c.a}»`))) : null)] : []));
}

export async function vistaLab(cont, contexto) {
  ({ h, api, aviso, fallo, N } = contexto);
  document.body.classList.add("modo-pv");
  try { await cargar(); } catch (e) { return cont.replaceChildren(h("div.pv", h("div.pv-alerta", `No pude leer la configuración de voz: ${e.message}`))); }
  const raiz = h("div.pv.lab");
  const pintar = () => {
    const cfg = L.cfg;
    const esDefecto = (v) => v.voz === cfg.voz && v.instrucciones === cfg.instrucciones;
    const columna = (v, i) => {
      const r = L.resultado?.versiones?.[i];
      return h("div.pv-tarjeta.lab-version", { "data-version": i },
        h("div.fila", h("h3", `Versión ${i + 1}`), esDefecto(v) ? h("span.pv-chip.pv-ok", "✔ tu voz por defecto") : null, h("span.espacio"), L.versiones.length > 1 ? h("button.btn.chico", { type: "button", "aria-label": `Quitar la versión ${i + 1}`, onclick: () => { L.versiones.splice(i, 1); L.resultado = null; pintar(); } }, "✕") : null),
        h("label.campo", "Voz", h("select", { onchange: (e) => { v.voz = e.target.value; pintar(); } },
          h("optgroup", { label: "Para empezar" }, PRIMERAS.map((id) => { const x = N.vozPorId(id); return h("option", { value: id, selected: v.voz === id }, `${x.nombre} · ${x.suena} · ${x.nota}`); })),
          h("optgroup", { label: "Otras voces" }, N.VOCES_OPENAI.filter((x) => !PRIMERAS.includes(x.id)).map((x) => h("option", { value: x.id, selected: v.voz === x.id }, `${x.nombre} · ${x.suena} · ${x.nota}`))))),
        h("label.campo", "Instrucciones (cómo debe sonar)", h("textarea", { rows: 8, spellcheck: false, value: v.instrucciones, oninput: (e) => { v.instrucciones = e.target.value; } })),
        h("div.fila.chicos", h("button.btn.chico", { type: "button", onclick: () => { v.instrucciones = cfg.instrucciones; pintar(); } }, "↺ Volver a las de siempre")),
        r ? h("div.lab-resultado", h("audio", { controls: true, src: r.url, preload: "auto", "aria-label": `Audio de la versión ${i + 1}` }), h("p.chico-t.suave", `${r.desdeCache ? "♻️ Salió de la caché (sin costo)" : `≈ US$ ${r.costoUsd.toFixed(4)}`} · ${r.caracteres} caracteres`),
          h("button.btn.ambar", { type: "button", disabled: esDefecto(v), onclick: async () => { try { L.cfg = (await api("/api/voz/config", { metodo: "POST", cuerpo: { voz: v.voz, instrucciones: v.instrucciones } })).config; aviso(`⭐ Listo: «${N.vozPorId(v.voz).nombre}» con estas instrucciones es ahora tu voz por defecto.`, "ok", 5000); pintar(); } catch (er) { fallo(er); } } }, esDefecto(v) ? "⭐ Ya es tu voz por defecto" : "⭐ Me gustó esta: usarla por defecto")) : h("p.chico-t.suave", "Genera las versiones para escucharlas aquí."));
    };
    const generar = async () => {
      if (L.generando) return;
      L.generando = true; pintar();
      try { L.resultado = await api("/api/voz/lab", { metodo: "POST", cuerpo: { texto: L.texto, preparar: L.preparar, variantes: L.versiones } }); L.uso = L.resultado.uso; aviso("🎧 Versiones listas.", "ok", 2500); }
      catch (e) { fallo(e); }
      L.generando = false; pintar();
    };
    raiz.replaceChildren(
      h("div.pv-cab", h("div", h("h1", "Laboratorio de voz"), h("p.suave", "Prueba voces e instrucciones con un guion corto, escucha las versiones lado a lado y deja como favorita la que más te guste. Todas salen al mismo volumen (−14 LUFS) y sin silencios largos, para compararlas bien.")), h("span.espacio"), h("a.btn", { href: "#/" }, "← Estudio")),
      !L.claveOpenAI ? h("div.pv-alerta", "🔑 Falta la clave de OpenAI para generar audios: ", h("a", { href: "#/ajustes" }, "ponla en Ajustes"), " (queda solo en el archivo .env).") : null,
      h("div.pv-tarjeta",
        h("h2", "1 · Guion"),
        h("div.fila", h("label.campo", "Elegir un guion de ejemplo", h("select", { onchange: (e) => { const x = EJEMPLOS.find(([t]) => t === e.target.value); if (x) { L.texto = x[1]; L.resultado = null; pintar(); pedirPreparado(); } } }, h("option", { value: "" }, "— Elegir —"), EJEMPLOS.map(([t]) => h("option", { value: t }, t)))), h("span.espacio"),
          h("label.chico-t", h("input", { type: "checkbox", checked: L.preparar, onchange: (e) => { L.preparar = e.target.checked; } }), " Preparar el guion antes de enviarlo (números a palabras, pronunciación, pausas)")),
        h("textarea#lab-texto", { rows: 4, maxlength: 700, spellcheck: true, value: L.texto, placeholder: "Escribe un guion corto…", oninput: (e) => { L.texto = e.target.value; pedirPreparado(); } }),
        h("div#lab-prep")),
      h("div.pv-tarjeta",
        h("div.fila", h("h2", "2 · Versiones"), h("span.espacio"), L.versiones.length < 3 ? h("button.btn.chico", { type: "button", onclick: () => { const sig = ["coral", "nova", "shimmer", "sage", "ash"].find((x) => !L.versiones.some((v) => v.voz === x)) ?? "coral"; L.versiones.push({ voz: sig, instrucciones: L.cfg.instrucciones }); L.resultado = null; pintar(); } }, "＋ Agregar versión") : null,
          h("button.btn.primario", { type: "button", disabled: !L.claveOpenAI || L.generando || L.texto.trim().length < 10, onclick: generar }, L.generando ? "⏳ Generando…" : `🎧 Generar y escuchar ${L.versiones.length > 1 ? `las ${L.versiones.length} versiones` : "la versión"}`)),
        h("div.lab-columnas", L.versiones.map(columna))),
      h("div.pv-dos",
        h("div.pv-tarjeta", h("h2", "Ajustes de la voz por defecto"),
          h("label.campo", `Velocidad (×${cfg.velocidad})`, h("input", { type: "range", min: 0.8, max: 1.2, step: 0.05, value: cfg.velocidad, oninput: (e) => { L.cfg = { ...L.cfg, velocidad: Number(e.target.value) }; e.target.previousSibling.textContent = `Velocidad (×${L.cfg.velocidad})`; } })),
          h("label.campo", "Formato del audio", h("select", { onchange: (e) => { L.cfg = { ...L.cfg, formato: e.target.value }; } }, N.FORMATOS_VOZ.map((f) => h("option", { value: f, selected: f === cfg.formato }, f)))),
          h("p.chico-t.suave", "La velocidad se aplica con ffmpeg (este modelo no admite velocidad propia). Voz actual: ", h("strong", N.vozPorId(cfg.voz)?.nombre ?? cfg.voz), "."),
          h("button.btn", { type: "button", onclick: async () => { try { L.cfg = (await api("/api/voz/config", { metodo: "POST", cuerpo: { velocidad: L.cfg.velocidad, formato: L.cfg.formato } })).config; aviso("✅ Ajustes guardados en voz.config.json", "ok", 3000); pintar(); } catch (e) { fallo(e); } } }, "💾 Guardar ajustes")),
        h("div.pv-tarjeta", h("h2", "Uso este mes"),
          h("div.pv-kpi", h("div.pv-kpi-v", fmt(L.uso.total)), h("div.pv-kpi-t", "caracteres generados"), h("div.pv-kpi-s", `≈ US$ ${(((L.uso.total / N.CARACTERES_POR_SEGUNDO) / 60) * N.USD_POR_MINUTO_TTS).toFixed(2)} con OpenAI`)),
          h("ul.chico-t.suave", Object.entries(L.uso.porMotor).map(([m, e]) => h("li", `${m === "eleven" ? "ElevenLabs" : "OpenAI"}: ${fmt(e.caracteres)} caracteres en ${e.solicitudes} audios`))),
          h("p.chico-t.suave", "Los audios que salen de la caché (cache/audio/) no cuentan: no se pagan dos veces."))),
      h("div.pv-tarjeta", h("h2", "Diccionario de pronunciación"),
        h("p.chico-t.suave", "Una por línea: ", h("code", "como aparece = como debe sonar"), ". Se guarda en pronunciacion.json y se aplica a todos los guiones."),
        h("textarea#lab-dic", { rows: 8, spellcheck: false, value: L.dic, oninput: (e) => { L.dic = e.target.value; pedirPreparado(); } }),
        h("button.btn", { type: "button", onclick: async () => { try { await api("/api/voz/pronunciacion", { metodo: "POST", cuerpo: { diccionario: textoADic(L.dic) } }); aviso("✅ Diccionario guardado en pronunciacion.json", "ok", 3000); } catch (e) { fallo(e); } } }, "💾 Guardar diccionario")));
    pintarPreparado(); // el texto preparado se conserva entre repintados
  };
  cont.replaceChildren(raiz);
  pintar();
  pedirPreparado();
}
