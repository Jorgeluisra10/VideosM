/**
 * LIENZO LIBRE: la IA escribe, para cada escena, el cuerpo de un componente React/SVG/Three.js que se dibuja sobre TODO el lienzo 1080×1920,
 * apoyándose en el Kit de Pinceles Cinematográficos (src/primitives/MotionKit.tsx). Aquí vive la parte pura (sin Node ni navegador):
 * colores de la paleta, prompt de sistema, esquema de la respuesta, política de seguridad del código y plantilla del «Prompt Formateador».
 */
import { PALETAS, paletaPorId } from "./paletas";
import { todosLosIconos } from "./iconos";
import { tokensDeTexto } from "./costos";
import type { EscenaLibreGuion } from "./guionLibre";

/* ───────────── colores que ve la IA (C.*) ───────────── */

/**
 * Colores con nombre que la IA usa como `C.fondo`, `C.acento`… IMNOBA usa los hex oficiales de marca
 * (azul profundo #02224E, dorado #FFC500, blanco #F8FAFC, coral #E63926, esmeralda #10B981).
 */
export function coloresIA(id: string | undefined): Record<string, string> {
  if (id === "imnoba" || id === undefined) {
    return { fondo: "#02224E", fondo2: "#08336F", primario: "#2F66B8", azul: "#2F66B8", acento: "#FFC500", blanco: "#F8FAFC", coral: "#E63926", esmeralda: "#10B981", suave: "#8EA6CC", tinta: "#F8FAFC", papel: "#F8FAFC" };
  }
  if (id === "medicina") {
    return { fondo: "#0B0F19", fondo2: "#141C2E", primario: "#3B82F6", azul: "#3B82F6", acento: "#FACC15", blanco: "#F8FAFC", coral: "#EF4444", esmeralda: "#10B981", suave: "#94A3B8", tinta: "#F8FAFC", papel: "#F8FAFC" };
  }
  const p = paletaPorId(id);
  const k = p.oscuro;
  const c = p.claro;
  return { fondo: k.fondoBorde, fondo2: k.fondoCentro === k.fondoBorde ? "#14161C" : k.fondoCentro, primario: k.primario, azul: k.alerta, acento: k.acento, blanco: k.blanco, coral: k.primario, esmeralda: k.ok, suave: k.suave, tinta: k.tinta, papel: c.fondoBorde };
}

const DESCRIPCION_COLORES: Record<string, string> = {
  fondo: "fondo profundo", fondo2: "centro de degradado del fondo", primario: "estructura principal / objetos", azul: "azul de apoyo", acento: "destacados, cifras clave, llamadas a la acción",
  blanco: "texto sobre oscuro", coral: "alerta, riesgo, contraste cálido", esmeralda: "positivo, rentabilidad, check", suave: "líneas secundarias y guías", tinta: "texto principal sobre fondo oscuro", papel: "fondo claro (para escenas «papel»; sobre él, texto en C.fondo)",
};

/* ───────────── política de seguridad y determinismo del código ───────────── */

const PROHIBIDO: [RegExp, string][] = [
  [/\b(import|export|require)\b/, "no uses import/export/require: todo ya está en el ámbito"],
  [/\b(eval|Function)\s*\(|\bnew\s+Function\b/, "no uses eval ni Function()"],
  [/\b(fetch|XMLHttpRequest|WebSocket|EventSource|Worker|importScripts|sendBeacon)\b/, "no hay acceso a la red"],
  [/\b(window|document|globalThis|navigator|localStorage|sessionStorage|indexedDB)\b/, "no uses window/document/globalThis/navigator… (no existen en la escena)"],
  [/\b(process|Buffer)\s*\.|\b(__dirname|__filename)\b/, "no hay Node en la escena"],
  [/\b(setTimeout|setInterval|requestAnimationFrame|queueMicrotask)\b/, "no uses temporizadores: el tiempo es useCurrentFrame()"],
  [/\bMath\.random\b/, "Math.random rompe el render determinista: usa rand(semilla)"],
  [/\b(Date|performance)\b/, "no uses Date/performance: el tiempo es useCurrentFrame()"],
  [/\b(useState|useEffect|useLayoutEffect|useRef|useReducer)\b/, "no uses useState/useEffect/useRef: cada fotograma se calcula desde useCurrentFrame()"],
  [/dangerouslySetInnerHTML|\binnerHTML\b|<script|\bconstructor\b|__proto__|\bprototype\b/, "construcción no permitida (HTML crudo, constructor, prototipos)"],
];

/** Quita comentarios y literales de texto simples para no marcar palabras que solo son parte de un rótulo. */
const sinTextos = (c: string): string => c.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/.*$/gm, "$1").replace(/'(?:\\.|[^'\\\n])*'/g, "''").replace(/"(?:\\.|[^"\\\n])*"/g, '""');

export const MAX_CODIGO = 14000;

/** Revisa el código de UNA escena. Devuelve la lista de problemas (vacía = aceptable). */
export function revisarCodigo(codigo: unknown): string[] {
  if (typeof codigo !== "string" || !codigo.trim()) return ["el código está vacío"];
  const p: string[] = [];
  if (codigo.length > MAX_CODIGO) p.push(`el código es demasiado largo (${codigo.length} caracteres; máximo ${MAX_CODIGO}): simplifica la escena`);
  const limpio = sinTextos(codigo);
  for (const [re, msg] of PROHIBIDO) if (re.test(limpio)) p.push(msg);
  if (!/\breturn\b/.test(limpio)) p.push("el cuerpo debe terminar con return (<AbsoluteFill>…</AbsoluteFill>)");
  if (!/\b(useCurrentFrame|useT)\s*\(/.test(limpio)) p.push("la escena no usa el tiempo (useCurrentFrame() o useT()): quedaría estática; todo debe tener movimiento continuo");
  return p;
}

/* ───────────── esquema de la respuesta (solo el sobre; el contenido es código) ───────────── */

type Sch = Record<string, unknown>;
export function esquemaLibre(o: { sfx: boolean }): { name: string; strict: true; schema: Sch } {
  const props: Record<string, Sch> = { n: { type: "integer" }, codigo: { type: "string" } };
  if (o.sfx) props.sfx = { type: "array", items: { type: "object", properties: { t: { type: "number" }, tipo: { type: "string", enum: ["pop", "whoosh", "heartbeat", "cash", "tick", "thud", "zap", "ding"] }, vol: { type: "number" } }, required: ["t", "tipo", "vol"], additionalProperties: false } };
  const escena = { type: "object", properties: props, required: Object.keys(props), additionalProperties: false };
  return { name: "escenas_libres", strict: true, schema: { type: "object", properties: { escenas: { type: "array", items: escena } }, required: ["escenas"], additionalProperties: false } };
}

/* ───────────── prompt de sistema ───────────── */

export const API_KIT = `ÁMBITO (todo está disponible sin importar nada):
· React, AbsoluteFill, useCurrentFrame(), spring({frame,fps:FPS,config}), interpolate, Easing, THREE.
· Constantes: W=1080, H=1920, FPS=60, DUR (duración de la escena en segundos), FUENTE, MONO. Colores: C.<nombre>.
· Helpers: useT() → segundos de la escena · entra(f, retrasoSeg=0) → 0…1 con spring suave · float(f, amp, periodoFrames=120, fase=0) → oscilación senoidal · rand(semilla) → 0…1 determinista · lerp(a,b,k) · clamp(v,a=0,b=1) · ease(t) → curva cubic-bezier(0.22,1,0.36,1).
· <Svg>…</Svg>: <svg> de 1080×1920 que cubre el lienzo (todo lo vectorial va dentro).
· <Camera2D zoom x y rotate focusX focusY shake>…</Camera2D>: cámara cinematográfica sobre todo lo que envuelve (zoom hacia un detalle con focusX/focusY en px; shake=[{t:segundos, amp:px, dur:s}] = sacudida de impacto).
· <OrganicDrawPath d progress stroke strokeWidth glow fill fillOpacity dashed opacity /> (dentro de <Svg>): traza que se dibuja de 0 a 1 con curvas Bézier suaves; glow añade brillo.
· <FloatingAnnotation targetX targetY label value color lineColor delay dx dy width /> (dentro de <Svg>): punto pulsante en la coordenada, línea curva elegante y tarjeta flotante con un dato.
· <KineticText texto x y tam color delay modo peso alinear maxAncho /> (fuera de <Svg>): tipografía cinética centrada en (x,y); modo "letras" | "palabras" | "deslizar" | "escala"; puede ir detrás o delante de lo 3D según el orden.
· <Icono nombre x y tam color /> (dentro de <Svg>): icono vectorial; nombres: ICONOS.
· <AmbientParticles count color speed size shape flow opacity seed />: partículas de fondo; shape "dot"|"cell"|"line", flow "up"|"drift"|"swirl".
· <Isometric3DStage cameraAngle lighting orbit distance dollyTo lookAt fov float shadows>…</Isometric3DStage>: escenario 3D (@remotion/three) a pantalla completa y transparente, con luces y sombras suaves. cameraAngle "iso"|"frontal"|"top"|"low"; lighting "clean"|"dramatic"; orbit = grados que gira la cámara durante la escena; distance/dollyTo = distancia inicial/final de la cámara (con fov 38 el ancho visible es ≈ 0.37×distancia: una maqueta de 8 unidades de ancho pide distancia ≈ 28; si la dejas corta, el 3D se sale del cuadro); float = amplitud de flotación orgánica. Dentro van elementos de three en JSX (<mesh><boxGeometry/><meshStandardMaterial color={C.acento}/></mesh>, <group>, <pointLight>…) y estos ayudantes: <Cuerpo3D forma="caja|cilindro|esfera|cono|toro" tam pos rot color emissive delay /> (caja tam=[ancho,alto,fondo]; cilindro/cono [radio,alto]; esfera [radio]; toro [radio,tubo]; pos = base), <Barras3D datos pos ancho sep hmax color delay /> (la mayor se resalta en dorado), <Ciudad3D filas columnas semilla resaltar color delay />.`;

const EJEMPLO = `EJEMPLO de cuerpo de escena (así de directo; sin function ni export):
const f = useCurrentFrame();
const p = interpolate(f, [0, 100], [0, 1], { extrapolateRight: "clamp", easing: ease });
return (
  <AbsoluteFill style={{ background: \`radial-gradient(circle at 50% 38%, \${C.fondo2}, \${C.fondo})\` }}>
    <AmbientParticles count={36} color={C.acento} speed={0.6} />
    <Camera2D zoom={1 + 0.1 * p} y={-50 * p} shake={[{ t: 2.4, amp: 10 }]}>
      <Svg>
        <OrganicDrawPath d="M 190 1250 L 540 900 L 890 1250 L 890 1550 L 190 1550 Z" progress={p} stroke={C.acento} strokeWidth={8} glow />
        <FloatingAnnotation targetX={540} targetY={900} label="Publicar" value="$0" color={C.acento} delay={1.4} dy={-200} />
      </Svg>
      <KineticText texto="¿Y si fuera GRATIS?" y={430} tam={118} color={C.blanco} delay={0.3} />
    </Camera2D>
  </AbsoluteFill>
);`;

export const iconosKit = (): string => todosLosIconos().join(", ");

export function sistemaLibre(o: { paleta: string; sfx: boolean }): string {
  const C = coloresIA(o.paleta);
  const p = paletaPorId(o.paleta);
  const lista = Object.entries(C).map(([k, v]) => `C.${k} ${v} (${DESCRIPCION_COLORES[k] ?? ""})`).join(" · ");
  return [
    `Eres un Director de Motion Graphics que programa en Remotion/React/SVG/Three.js. Para CADA escena del guion devuelves el CUERPO de un componente React (JavaScript con JSX; sin TypeScript, sin import/export, sin function envolvente) que se dibuja sobre TODO el lienzo vertical 1080×1920 px a 60 fps. Cada escena es dueña del 100 % del lienzo: no hay cabecera, HUD ni cajas fijas. Título, cámara, 3D e ilustración forman parte de la animación.`,
    `Devuelve SOLO el JSON del esquema: una entrada por escena, con su «n» y su «codigo»${o.sfx ? " (más «sfx»: 2–4 efectos sincronizados con lo que aparece, t en segundos de la escena)" : ""}.`,
    `REGLAS DE DISEÑO: (1) Composición única por escena: varía cámara, ritmo, ángulo y recursos; no repitas el mismo diseño. (2) Prohibidas las cajas rectangulares aburridas y los layouts de tarjetas apiladas: combina libremente trazados orgánicos (<path>, curvas Bézier), gradientes radiales, máscaras <clipPath>, glow, iconos, geometrías 3D con cámara dinámica y tipografía cinética. (3) Un protagonista grande y apoyos pequeños; aprovecha todo el alto del lienzo con profundidad (capas, parallax). (4) TODO tiene movimiento continuo y usa el tiempo de la escena (useCurrentFrame/spring/interpolate): cámara, flotación senoidal, trazado, pulso, partículas; nada aparece de golpe ni se queda congelado. (5) El orden en el JSX es el orden de capas: lo primero queda detrás (texto antes de <Isometric3DStage> = detrás de los objetos 3D). (6) Textos en español, cortos y sin faltas, con x entre 80 y 1000 px salvo en la entrada/salida animada; si escribes <text> o <div> propio de texto añade data-texto="rótulo". (7) Dentro de <Camera2D> con zoom > 1 todo se ensancha desde el foco: si el texto va ahí, usa maxAncho ≤ 800 para que no toque los bordes. Si una anotación o tarjeta va a quedar sobre un fondo claro o sobre otro elemento, elige colores que se lean y colócala con dx/dy; evita que se pisen entre sí o con el título. (8) Fiel al guion: usa las cifras y nombres que da; no inventes datos oficiales. (9) Determinista: prohibido Math.random, Date, useState, useEffect, useRef, fetch, window, document, eval e import (usa rand(semilla)).`,
    `PALETA «${p.nombre}»: usa SOLO estos colores (y degradados, opacidades o mezclas de ellos): ${lista}. ${p.uso}`,
    API_KIT.replace("ICONOS", iconosKit()),
    EJEMPLO,
  ].join("\n\n");
}

/** Entrada del usuario: duración, dirección visual y, como contexto de ritmo, la voz. Nada más. */
export function promptUsuarioLibre(escenas: EscenaLibreGuion[]): string {
  return escenas
    .map((e) => `[ESCENA ${e.n} | ${e.dur.toFixed(1)} s]\nDIRECCIÓN VISUAL: ${e.direccion || "(libre)"}${e.voz ? `\nVOZ (solo contexto narrativo de ritmo y sentido; no la escribas como subtítulo): ${e.voz}` : ""}`)
    .join("\n\n");
}

export function tokensFijosLibre(o: { paleta: string; sfx: boolean }): { sistema: number; esquema: number } {
  return { sistema: tokensDeTexto(sistemaLibre(o).length, 3.4), esquema: tokensDeTexto(JSON.stringify(esquemaLibre(o).schema).length, 3.0) };
}

/* ───────────── escena de rescate (si el código de una escena no se pudo reparar) ───────────── */

/** Escena segura con el kit: degradado + partículas + texto cinético. Evita que una escena rota detenga el video. */
export function codigoFallback(texto: string): string {
  const t = (texto || "").replace(/\s+/g, " ").trim().replace(/^\([^)]*\)\s*/, "").slice(0, 56) || "IMNOBA";
  return `const f = useCurrentFrame();
const p = entra(f, 0.1);
return (
  <AbsoluteFill style={{ background: \`radial-gradient(circle at 50% 40%, \${C.fondo2}, \${C.fondo})\` }}>
    <AmbientParticles count={34} color={C.acento} speed={0.5} />
    <Camera2D zoom={1 + 0.05 * p}>
      <KineticText texto={${JSON.stringify(t)}} y={920} tam={92} color={C.blanco} delay={0.2} />
    </Camera2D>
  </AbsoluteFill>
);`;
}

/* ───────────── plantilla del «Prompt Formateador» ───────────── */

export const PROMPT_FORMATEADOR_LIBRE = `Actúa como editor de guiones y director de arte para videos verticales cortos (1080×1920, 60 fps). Voy a pegarte mi guion e ideas. Devuélvelo con EXACTAMENTE este formato, sin nada más:

[ESCENA 1 | 00:00-00:05]
VOZ_OFF: lo que se dice en esta escena (solo para que yo lo grabe; no se dibuja).
DIRECCION_VISUAL: la composición como la dirigirías en cine de animación: qué se ve, qué se dibuja solo, cómo se mueve la cámara (zoom hacia un detalle, paneo, sacudida de impacto), qué entra con física spring, qué letras aparecen y dónde, si hay un objeto 3D que rota o flota, qué partículas ambientan, y las cifras o nombres exactos que deben verse.

[ESCENA 2 | 00:05-00:11]
VOZ_OFF: …
DIRECCION_VISUAL: …
SFX: pop, whoosh (opcional)

Reglas:
1. Solo es obligatorio el tiempo de cada escena en MM:SS; las escenas son consecutivas (el fin de una es el inicio de la siguiente; la primera empieza en 00:00) y duran entre 3 y 10 segundos.
2. Cada DIRECCION_VISUAL debe ser distinta de las demás: cambia el encuadre, el ritmo, el recurso visual (trazado orgánico, mapa, plano, 3D, gráfica, tipografía cinética…). Nada de cajas rectangulares ni tarjetas apiladas; piensa en composiciones orgánicas con profundidad y movimiento continuo.
3. Si quieres un dato o un medidor en pantalla, descríbelo como elemento flotante dentro de la composición (por ejemplo «una anotación flotante apunta a la fachada con "74 m²"»); no existe cabecera ni panel fijo.
4. Usa la identidad de la marca: azul profundo, dorado, blanco, coral y esmeralda para IMNOBA. No inventes cifras que yo no haya dado; si algo es ilustrativo, indícalo.
5. SFX es opcional (pop, whoosh, heartbeat, cash, tick, thud, zap, ding); si pones otro nombre no pasa nada. Sin subtítulos. Máximo 30 escenas.

Mi guion e ideas:
`;
