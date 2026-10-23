/**
 * Prompts del motor de animación:
 *  - sistemaAnimacion: instrucciones fijas para la IA (prefijo estático → OpenAI lo cachea y cobra menos).
 *  - promptUsuario: los bloques de escena ya interpretados por el parser local.
 *  - promptFormateador: el texto que el usuario copia para ordenar su guion con cualquier chat externo.
 */
import { esquemaAnimacion, esquemaGeometria, type OpcionesEsquema, type OpcionesGeometria } from "./esquema";
import { esRetro, paletaPorId } from "./paletas";
import { tokensDeTexto } from "./costos";
import type { EscenaBloque } from "./parser";
import type { EscenaEstructurada } from "./guionEstructurado";

export const LIENZO = { w: 1080, h: 1920, margen: 90, arriba: 150, abajo: 1770 };

const REGLAS_2D = `ESCENAS «SVG» (animación vectorial 2D, lienzo 1080×1920 px, origen arriba-izquierda):
- Zona segura: x entre ${LIENZO.margen} y ${LIENZO.w - LIENZO.margen}; y entre ${LIENZO.arriba} y ${LIENZO.abajo}. No hay subtítulos ni encabezados: el lienzo está limpio, úsalo completo y compón con jerarquía (un elemento protagonista grande, apoyos pequeños).
- Cada elemento tiene t (segundo, desde el inicio de la escena, en que entra), hasta (segundo en que sale, o null = se queda) y entrada.
- Elementos: trazo (path SVG «d» que se dibuja solo, en coordenadas del lienzo; úsalo para siluetas, fachadas, curvas), linea (polilínea de puntos que se dibuja; flecha/curva opcionales), forma (x,y = CENTRO; w,h), texto (x,y = punto de anclaje según «alinear»; tam 40–120; texto corto, máx. 5–6 palabras por línea), icono (x,y = centro; tam 80–220; fondo=true lo pone sobre un círculo), plano (plano arquitectónico que se dibuja solo; x,y = CENTRO; habitaciones con coordenadas 0–100 relativas al plano), grafica (barras|lineas|pastel|dona; x,y = CENTRO; 3–6 datos), contador (número que sube de «desde» a «valor»), anillo (progreso circular 0–100), ondas (pulsos concéntricos), lista (items que entran uno a uno; x,y = esquina SUPERIOR-izquierda), tarjeta (panel de cristal con título + valor; x,y = CENTRO).
- ambiente: fondo animado sutil (cuadricula, particulas, aros, lineas) o ninguno.
- Una escena buena tiene 6–14 elementos escalonados en el tiempo (cada ~0.4–0.8 s algo nuevo), siempre algo en movimiento, y el último elemento clave entra antes de que termine el 80 % de la escena.`;

const REGLAS_3D = `ESCENAS «3D» (Three.js; unidades ≈ metros; el suelo es y = 0; se ve en vertical 1080×1920):
- Objetos: edificio (x,z = centro de la base; w,d; pisos 1–40; remate; ventanas), caja, cilindro, esfera, piramide, extrusion (polígono de puntos x,z extruido h; para plantas de terreno o perfiles), barras3d (datos numéricos → barras 3D financieras; hmax = alto de la barra mayor), ciudad (bloques de ciudad procedurales; resaltar = índice de la manzana que se ilumina en el color de acento, o null), casa (volumen con techo a dos aguas), anillo.
- «y» es la altura de la BASE del objeto (en esfera y anillo es el centro). El cuadro es VERTICAL y estrecho: a distancia «radio» caben ≈ 0.43×radio unidades de ancho y ≈ 0.77×radio de alto (radio 14 → 6 de ancho × 10 de alto; radio 26 → 11 × 20). Dimensiona la composición para eso: columnas verticales y profundidad en z, o un radio mayor para vistas anchas.
- t (segundo de entrada) y dur (duración de la entrada); entrada: crecer | caer | aparecer | ninguna; giro = grados por segundo sobre su eje (0 = quieto).
- camara: órbita alrededor de (mirarX, mirarY, mirarZ): radio→radioFin, altura→alturaFin y anguloInicio→anguloFin en GRADOS. Un movimiento suave de 25–90° durante la escena (el motor interpola con spring). fov 35–55. radio típico 14–32.
- luces: ambiente 0.3–0.8, direccional 0.8–2.2 (dirX/dirY/dirZ = posición de la luz), puntoAcento 0–2 (luz del color de acento).
- overlay: textos, cifras, tarjetas, iconos 2D encima del 3D (mismas reglas de coordenadas y zona segura que las escenas SVG; úsalos con moderación: 2–5).
- Una escena buena tiene 4–12 objetos con entradas escalonadas y la cámara siempre en movimiento.`;

const REGLAS_SFX = `SONIDO: para cada escena devuelve «sfx»: 2–6 eventos {t, tipo, vol} sincronizados con lo que aparece (pop = aparece un elemento; whoosh = transición/movimiento amplio; cash = precio o dinero; ding = logro/cifra clave; thud = impacto; tick = conteo; zap; heartbeat). vol 0.05–0.25.`;

const REGLAS_RETRO = `ESTILO «RETRO-CIENTÍFICA» (infografía técnica de los años 60 + telemetría moderna, 1080×1920):
- Composición fija: ZONA SUPERIOR (y 0–350) = título e instrucciones de terminal, que el motor dibuja desde los campos de la escena; ZONA CENTRAL (y 350–1450) = el escenario (aquí van tus elementos y el modelo 3D); ZONA INFERIOR (y 1450–1920) = panel HUD con hasta 3 medidores que el motor dibuja desde «medidores». NUNCA pongas elementos fuera de y 350–1450 ni textos que repitan el título.
- Cada escena DEBE llevar: «titulo» (H1 en MAYÚSCULAS, 1–5 palabras impactantes, sin punto final), «subtitulo» (una línea técnica tipo terminal, p. ej. «> CALCULANDO VALORIZACIÓN…», máx. 60 caracteres, o null) y «medidores» (1–3, con los datos REALES del bloque: etiqueta ≤ 12 caracteres en MAYÚSCULAS, unidad ≤ 5, min/max razonables, valor inicial y final, cuándo cambia (t, en s) y cuánto tarda (dur ≥ 0.8 s)). Si el bloque no trae cifras, usa porcentajes o índices coherentes y márcalos como ilustrativos en el subtítulo; no inventes datos oficiales.
- SINCRONÍA DE DATOS: cuando un medidor cambia, el motor mueve a la vez la aguja, el número, el borde (lima/activo) y el modelo vinculado. Escalona los medidores (uno por vez: t distintos) para que cada cambio se note.
- Movimiento mecánico y preciso: sin rebotes ni elásticos. Líneas de 3 px (grosor 3), sólidas o punteadas (punteado = true para ejes y guías).
- Usa el color «primario» para el OBJETO DE ESTUDIO, «acento» para telemetría, «alerta» para anomalías y destacados de contraste. Alterna temas: «oscuro» (negro mate) y «claro» (papel hueso, para citas, documentos, comparativas históricas).
- «terminal»: líneas de texto monoespaciado que se escriben solas carácter a carácter (30 ms) con cursor; úsalas para notas técnicas cortas dentro del escenario.`;

const REGLAS_2D_RETRO = `ESCENAS «SVG» retro: el escenario es y entre 350 y 1450, x entre ${LIENZO.margen} y ${LIENZO.w - LIENZO.margen}. Elementos como en SVG normal (trazo, linea, forma, texto, icono, plano, grafica, contador, anillo, ondas, lista, tarjeta) más «terminal». Dibuja ejes, gráficas, planos y formas técnicas cuyos valores coincidan con los medidores; 5–10 elementos escalonados. El título NO va como elemento «texto».`;

const REGLAS_3D_RETRO = `ESCENAS «3D» retro (cel-shading de 3 niveles: luz, tono base y sombra con semitono; contornos negros): el escenario es un recuadro de 1080×1100 px; a distancia «radio» caben ≈ 0.75×radio de ancho y ≈ 0.77×radio de alto (radio 14 → 10 × 10).
- Incluye UN objeto «modelo» central y paramétrico: forma toroide | esfera | columna | superficie; v1, v2, v3 = índice (0–2) del medidor que controla cada parámetro (o null) y b1, b2, b3 = valor base 0–1 cuando no hay vínculo. toroide: v1 radio mayor, v2 grosor del tubo, v3 ondulación; esfera: v1 radio, v2 estiramiento vertical, v3 picos; columna: v1 altura, v2 radio, v3 conicidad; superficie: v1 amplitud, v2 frecuencia, v3 ondulación animada. Escala típica 1–1.6; x,z cerca de 0.
- Puedes añadir otros objetos (edificio, caja, ciudad…) como contexto, pero el protagonista es el modelo. Cámara: órbita lenta 20–60°, radio 12–24, fov 35–45. Overlay solo para anotaciones puntuales (2–3, en y 350–1450).`;

export type OpcionesPrompt = OpcionesEsquema;

export function sistemaAnimacion(o: OpcionesPrompt): string {
  const p = paletaPorId(o.paleta);
  const partes = [
    `Eres el director de arte de un estudio de motion graphics. Conviertes un guion dividido en escenas en INSTRUCCIONES GEOMÉTRICAS DECLARATIVAS que un motor (Remotion + Three.js) dibuja y anima. No escribes código ni colores hexadecimales: solo eliges tokens de color y rellenas el esquema JSON.`,
    `Devuelve UNA escena por cada bloque recibido, en el mismo orden y con el mismo número «n». El «modo» de cada escena es el que indica el bloque (SVG o 3D); no lo cambies. La duración de la escena (en segundos) ya viene dada: todos los tiempos (t, hasta, dur, sfx.t) deben caber en ella.`,
    `PALETA «${p.nombre}» (tokens de color): ${p.uso}. Usa SOLO estos tokens: primario, acento, blanco, tinta, suave, ok, alerta. Cada escena elige tema «oscuro» (fondo oscuro de la paleta) o «claro» (fondo blanco o papel); alterna para dar ritmo y usa el que mejor sirva al contenido. Usa «acento» con moderación para lo que el espectador debe recordar.`,
    `Lee en cada bloque la locución y los requerimientos visuales: dibuja lo que se dice (cifras exactas, nombres, lugares) y respeta lo que el bloque pida explícitamente. Textos cortos, en el idioma del guion, sin faltas. Nunca inventes datos que el bloque no dé.`,
  ];
  const retro = esRetro(o.paleta);
  if (retro) partes.push(REGLAS_RETRO);
  if (o.svg) partes.push(retro ? REGLAS_2D_RETRO : REGLAS_2D);
  if (o.tres) partes.push(retro ? REGLAS_3D_RETRO : REGLAS_3D);
  partes.push(o.sfx ? REGLAS_SFX : "NO incluyas sonido: el esquema no tiene campo de efectos.");
  partes.push(`Responde SOLO con el JSON del esquema.`);
  return partes.join("\n\n");
}

export function promptUsuario(escenas: EscenaBloque[]): string {
  const bloques = escenas.map((e) => `[ESCENA ${e.n} | duración ${e.dur.toFixed(2)} s | MODO: ${e.modo}]\n${e.texto}`);
  return `Guion (${escenas.length} escenas):\n\n${bloques.join("\n\n")}`;
}

/** Tokens de entrada que NO dependen del guion (sistema + esquema) para esta configuración. */
export function tokensFijos(o: OpcionesPrompt): number {
  return tokensDeTexto(sistemaAnimacion(o).length, 3.4) + tokensDeTexto(JSON.stringify(esquemaAnimacion(o).schema).length, 3.0);
}

export const PROMPT_FORMATEADOR = `Actúa como editor de guiones para videos verticales cortos (Reels/TikTok, 1080×1920). Voy a pegarte mi guion y mis ideas. Devuélvelo ESTRUCTURADO en bloques con EXACTAMENTE este formato, uno por escena, sin nada más:

[ESCENA 1 | 0s-4s | MODO: SVG]
Locución: lo que se dice en esta escena (frase corta y clara).
Visual: qué debe verse (elementos, cifras exactas, textos en pantalla, colores de marca si aplica, movimiento).

[ESCENA 2 | 4s-9s | MODO: 3D]
Locución: …
Visual: …

Reglas:
1. El encabezado es SIEMPRE «[ESCENA N | inicio-fin | MODO: X]» con segundos (por ejemplo 0s-4s, 4s-9s). Las escenas son consecutivas: el fin de una es el inicio de la siguiente. La primera empieza en 0s.
2. MODO: SVG = animación vectorial 2D (planos arquitectónicos que se dibujan solos, gráficas dinámicas, iconos animados, textos y cifras). MODO: 3D = Three.js (edificios 3D, bloques isométricos, barras financieras 3D, maquetas, giros de cámara). Elige el modo que mejor cuente cada idea; alterna para dar ritmo.
3. Cada escena dura entre 2 y 10 segundos; calcula los tiempos según el ritmo de lectura (≈ 2,5 palabras por segundo en la locución).
4. En «Visual» describe elementos concretos (qué aparece, dónde, en qué orden) y los datos exactos (precios, metros, porcentajes, nombres). No inventes cifras que yo no haya dado.
5. No uses subtítulos: no se mostrarán. La voz la grabo yo aparte.
6. Máximo 30 escenas. Responde solo con los bloques, sin explicaciones.

Mi guion e ideas:
`;

/* ───────────── FORMATO ESTRUCTURADO: prompt compacto, solo geometría del escenario central ───────────── */

export type OpcionesPromptGeo = OpcionesGeometria & { hud: boolean };

/** Alto (px) del escenario: 350→1450 con HUD, 350→1800 con «HUD: OFF». */
export const altoEscenario = (hud: boolean): number => (hud ? 1100 : 1450);

export function sistemaGeo(o: OpcionesPromptGeo): string {
  const p = paletaPorId(o.paleta);
  const y1 = 350 + altoEscenario(o.hud);
  const partes = [
    `Eres director de arte de motion graphics. Devuelve SOLO el JSON del esquema: la geometría del ESCENARIO CENTRAL de cada escena. Título, subtítulo, HUD, fondo y sonido ya están resueltos fuera: no los dibujes ni repitas textos de título. Sin código ni hexadecimales: solo tokens de color.`,
    `Una escena por bloque, mismo «n» y mismo MODO. Todos los tiempos (t, hasta, dur) son segundos desde el inicio de la escena y deben seguir las ventanas «GEO (a-b s)»: cada línea GEO = 3–7 elementos u objetos, que entran en su ventana. Nada de rebotes; líneas de grosor 3 (punteado=true en ejes y guías).`,
    `Tokens (${p.nombre}): ${p.uso}`,
    `Escenario: x 90–990, y 350–${y1} (1080×${altoEscenario(o.hud)}).`,
  ];
  if (o.svg) partes.push(`SVG: trazo (path «d» que se dibuja), linea (puntos), forma, texto (x,y = ancla; tam 36–120, corto), icono, plano (habitaciones 0–100), grafica (3–6 datos), contador, anillo, ondas, lista (x,y = esquina sup-izq), tarjeta, terminal (texto monoespaciado que se escribe solo). Salvo trazo, linea y lista, x,y es el CENTRO.`);
  if (o.tres) partes.push(`3D (escenario ${1080}×${altoEscenario(o.hud)}; a distancia «radio» caben ≈ 0.75×radio de ancho): objetos edificio, caja, cilindro, esfera, piramide, extrusion, barras3d, ciudad, casa, anillo y «modelo» (forma toroide|esfera|columna|superficie; v1,v2,v3 = índice 0–2 del medidor que lo deforma, null si no; b1,b2,b3 = valor base 0–1). G1,G2,G3 son los medidores 0,1,2 del HUD: si la línea GEO dice que el modelo reacciona a G1, pon v1=0. «y» = altura de la base. Cámara orbital (radio 12–24, ángulos en grados, fov 35–45); luces ambiente 0.3–0.8 y direccional 0.8–2.2.${o.mixto ? " MODO 3D+SVG: el overlay puede llevar cualquier elemento 2D." : " El overlay solo para anotaciones puntuales (2–3)."}`);
  return partes.join("\n");
}

/** Lo ÚNICO que se manda como entrada: el modo, la duración, el fondo y las líneas GEO de cada escena (en segundos de la escena). */
export function promptUsuarioGeo(escenas: EscenaEstructurada[]): string {
  const f = (x: number) => x.toFixed(1);
  return escenas
    .map((e) => `[ESCENA ${e.n} | ${f(e.dur)} s | MODO: ${e.modo}${e.mixto ? "+SVG" : ""} | FONDO: ${e.fondo}]\n${e.geo.map((g) => `GEO (${f(g.t)}-${f(g.hasta)} s): ${g.texto}`).join("\n")}`)
    .join("\n\n");
}

/** Tokens fijos (que NO dependen del guion) del formato estructurado: prompt de sistema compacto + esquema estricto. */
export function tokensFijosGeo(o: OpcionesPromptGeo): { sistema: number; esquema: number } {
  return { sistema: tokensDeTexto(sistemaGeo(o).length, 3.4), esquema: tokensDeTexto(JSON.stringify(esquemaGeometria(o).schema).length, 3.0) };
}

export const PROMPT_FORMATEADOR_ESTRUCTURADO = `Actúa como editor de guiones para videos verticales cortos (1080×1920) en estilo Retro-Científico con panel de telemetría. Voy a pegarte mi guion e ideas. Devuélvelo ESTRUCTURADO con EXACTAMENTE este formato, sin nada más:

[CONFIG]
DURACION: 00:28
HUD: ON
GAUGE_1: ÁREA | 30-120 | m²
GAUGE_2: PRECIO/M² | 2-8 | M
GAUGE_3: VALOR | 60-700 | M

[ESCENA 1 | 00:00-00:05 | FONDO: dark | MODO: SVG]
H1: TÍTULO EN MAYÚSCULAS (1–5 palabras)
SUB: > línea técnica tipo terminal
VOZ_OFF: lo que se dice en esta escena (solo para que yo lo grabe; no se dibuja)
GEO (00:00-00:03): qué debe dibujarse en el escenario central y en qué orden (formas, ejes, gráficas, cifras exactas)
GEO (00:03-00:05): otra acción visual si hace falta
HUD (00:01-00:03): G1=90 | G2=5.5 | G3=-
SFX (00:03): ding

[ESCENA 2 | 00:05-00:11 | FONDO: paper | MODO: 3D]
H1: …
SUB: …
VOZ_OFF: …
GEO (00:05-00:11): …
HUD (00:06-00:09): G1=- | G2=- | G3=70

Reglas:
1. Los tiempos van en MM:SS y las escenas son consecutivas (el fin de una es el inicio de la siguiente; la primera empieza en 00:00).
2. FONDO: dark (negro mate) o paper (papel técnico, para citas, documentos o comparativas). MODO: SVG (vectores 2D), 3D (Three.js) o 3D+SVG (3D con capa vectorial completa).
3. HUD: ON muestra hasta 3 medidores (GAUGE_1..3 con NOMBRE | mínimo-máximo | unidad). En cada línea HUD, G1=75 mueve esa aguja a 75 dentro de esa ventana y «-» la deja quieta. Si el video no necesita medidores, pon HUD: OFF (el escenario crece hasta abajo) y omite las líneas HUD.
4. En GEO describe elementos concretos y datos exactos; en 3D puedes pedir un modelo paramétrico que se deforma con G1, G2 o G3. No inventes cifras que yo no haya dado: si es ilustrativo, dilo en SUB.
5. SFX (opcional): pop, whoosh, heartbeat, cash, tick, thud, zap o ding.
6. VOZ_OFF es solo mi locución: no se envía a la IA ni se dibuja. Sin subtítulos. Máximo 30 escenas.

Mi guion e ideas:
`;
