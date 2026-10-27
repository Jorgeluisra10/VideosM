# VideMed — productor automático de reels (Video-as-Code) · modo dual medicina-ar / inmobiliario-co

@GEMINI.md

Lo de arriba es el prompt original del proyecto (roles, fases, reglas de diseño). Todo ya está implementado;
esto explica **cómo** y en qué se aparta del prompt, para trabajar sin redescubrirlo.

## Estudio de animación SVG + 3D (añadido después; detalle en AGENTS.md §0b y GUIA.md §1b)

Pantalla principal del panel: textarea de bloques `[ESCENA N | inicio-fin | MODO: SVG|3D]`, modelo (gpt-4.1-mini/o4-mini/gpt-4o-mini/gpt-4.1), SFX sí/no, paleta IMNOBA/Medicina, costo estimado en vivo y real en USD. Código en `src/anim/` (puro: parser, costos, paletas, esquema, prompt, validar, sonido; motor: Animacion/motor2d/motor3d) y `scripts/anim/`. Sin subtítulos. **Voz en off con IA opcional** (OpenAI gpt-4o-mini-tts, estilos colombianos y alegres, select de voces en la tarjeta «🎙️ Voz en off» del Estudio; `src/anim/voces.ts`, `scripts/anim/voz.mjs`, `scripts/anim/poner-voz.mjs`; ver AGENTS.md «Voz en off con IA»). `npm run anim:prueba` (sin Chrome). Con Claude Code puedes saltarte la API: escribe `respuesta-ia.json` como en `ejemplos/animacion-imnoba/` y pásala por `ensamblar()` (`node scripts/anim/ejemplo.mjs` hace eso con el ejemplo). El modo clásico (voz+subtítulos) sigue intacto en `#/clasico`. **Estilo Retro-Científica**: paletas `retro` (hex del brief) y `retro-imnoba` (esencia de marca) — título H1, terminal 30 ms, HUD con medidores sincronizados con el modelo paramétrico, cel-shading + semitono, Halftone Wipe; detalle en AGENTS.md. **Dos marcas separadas en el panel: 🏠 IMNOBA (inmobiliario y vehículos; paletas `imnoba`/`retro-imnoba`) y 🧠 SINAPSIS (medicina y ciencia; paletas `medicina`/`retro`)** — selector arriba del Estudio, ejemplos, paletas, borrador, historial, colores, CTA y línea de marca de la IA propios de cada una, y nunca se mezclan (`src/anim/marcas.ts`; AGENTS.md «Marcas»). **Motor viral (POR DEFECTO): una idea (una frase o todo el detalle que quieras, sin límite de caracteres) → reel completo** (`src/anim/viral.ts` + `src/viral/`): la IA escribe locución, duración y elige entre 30 plantillas (más la escena a medida `PIEZA`, carril B: componentes hechos a mano para un video concreto en `src/viral/piezas/` + `src/anim/piezas.ts`; pilotos «Metro de Bogotá» (`--tema=metro-bogota`) el ensayo abstracto «Anomalía» (`--tema=anomalia`, 10 piezas `anom-*`, bucle sin costuras, transiciones por pieza) y el video realista «Bogotá, la ciudad sin metro» (`--tema=bogota-real`, 11 piezas `real-*` con figuras tipo render y datos con fuente y el video médico «Médicos que se probaron a sí mismos» (`--tema=medicos-experimento`, 12 piezas `med-*`: radiografía con sonda, estómago, bacteria, endoscopia, medalla Nobel, base antártica; datos con fuente y precauciones), el video «La regla del 37 %» de IMNOBA (`--tema=parada-optima`, 8 piezas `par-*` con casas y figuras realistas: parada óptima con matemática exacta, Kepler y simulación), ver AGENTS.md «Carril B», «Anomalía», «Video realista», «Video médico» y «La regla del 37 %») (HOOK, NUM, VS, BARS, LINE, DONUT, PICTO, TOP, MITO, STEPS, LIST, ROUTE, SKYLINE, CTA y las documentales ZOOM, CAPAS, MIRA, IMPACTO, RED, TERMO, SPLIT, PILA con banda superior, escenarios ilustrados, ficha de cita, zoom continuo, música sintética y foley; ver AGENTS.md «Viral v3»; con la paleta Retro-Científica se activa el estilo DOCUMENTAL —Archivo Black + mono, fondo plano/papel, cortes secos, prompt con el arco narrativo de los explicativos de referencia y 8 plantillas más: PAPEL, PILARES, CICLO, PUNCH, DUO, OSCILO, CUBO, DIALES—; ver AGENTS.md «Documental v4») en una llamada `json_object` de ~165 tokens por escena; el motor las dibuja (texto cinético, contadores, gráficas, ruta de metro, ciudad, cierre con logo; fondos alternados, barrido, progreso, SFX automáticos). También acepta guiones en bloques (respeta tiempos y locución). **Motor de estudio (opcional, `--motor=estudio`, solo bloques)**: `[ESCENA n | 0s-7s | MODO: SVG|3D]` (o `[ESCENA n | MM:SS-MM:SS]`) + `VOZ_OFF` + `DIRECCION_VISUAL` + `SFX`; la IA devuelve solo un JSON de ~120 tokens por escena (`response_format: json_object`: layout, titular, figura principal/secundaria, versus) y `src/estudio/` lo dibuja (halftone, brillo especular, reflejo, estela, bokeh; 4 layouts; 5 figuras). Lógica pura en `src/anim/estudio.ts` (saneado, traductor local de DIRECCION_VISUAL, prompt, costos). **Motor clásico opcional** (`--motor=clasico` / `VIDEMED_MOTOR=clasico`; `VIDEMED_MOTOR=estudio|viral` el resto): lienzo libre = la IA escribe cada escena como código con el Kit de Pinceles (`src/primitives/MotionKit.tsx`; política + esbuild + verificación en Chrome + reparación + rescate) o geometría SVG/3D completa (AGENTS.md). **Formato estructurado** (`[CONFIG]`, `FONDO`, `GEO`, `HUD`, `SFX`, `VOZ_OFF`): solo las líneas GEO van a la IA; el resto es local (AGENTS.md). Pruebas: `npm run anim:prueba` (421; `-- --render` añade las de Chrome, 437). `npm run limpiar` borra temporales (trabajo/tmp) y libera disco; el render (`scripts/render.mjs`) codifica cada trozo de 5 s y borra sus JPEG (pico ≈ 0,2 GB, mide el disco antes y atrapa ENOSPC con un mensaje claro; `scripts/_disco.mjs`). `npm run actualizar` = `git pull` seguro (stash de cambios locales + npm install); el panel avisa si el código cambió con él abierto.

## Estado actual (resumen para trabajar sin redescubrir)

- **Nichos (perfiles)**: `perfiles/medicina-ar` (voseo, fondo #0B0F19) y `perfiles/inmobiliario-co` (tuteo colombiano, #0F172A/esmeralda/ámbar, COP en «millones», vehículos, inversión). También `inmobiliaria` (AR, antiguo) y `generico`. `medicina` = alias de `medicina-ar`. Cada perfil define voces dev/prod (`voces`), paleta, campos del formulario (con `si:` condicionales), prompts (guion/revisor/plan/critica/post). Un **brief** (`proyectos/<id>/brief.json`) lleva los datos.
- **Panel web**: `npm run panel` (`scripts/panel/`): servidor Node sin dependencias en 127.0.0.1:4173 + SPA (`web/`). Ejecuta los mismos scripts como *trabajos* (uno a la vez), registro por SSE, subida de fotos, ajustes `.env` (claves enmascaradas), guía. **Una sola "ranura activa"** (`src/data` + `public/media`): `activarBorrador(id)` (en `panel/proyectos.mjs`) guarda el proyecto activo y deja el elegido; `proyecto.mjs guardar/activar` ahora archiva también marca, brief, media.json y `public/media`.
- **Voz** (`scripts/generar-voz.mjs --mode dev|prod`, módulos `scripts/voz/`): dev = edge-tts; prod = OpenAI `gpt-4o-mini-tts`+`whisper-1` (word timestamps) o ElevenLabs `/with-timestamps`. `alinearConGuion` (DP) empareja palabras del servicio con las del guion. Pruebas con `scripts/ia/mock-server.mjs` (simula OpenAI audio y ElevenLabs).
- **Agente** (`scripts/ia/agente.mjs`) ya usa perfil+brief+medios (`--nicho`, `--brief`); `scripts/crear-video.mjs` es la entrada simple; `scripts/plantilla.mjs` = guion+escenas SIN IA (inmobiliario; `--solo-guion`; fusiona escenas < 2 s).
- **Motor**: íconos `hi-*` (healthicons) / `lu-*` (lucide) desde `src/dsl/iconos-pro.json` (`npm run iconos` regenera `iconosPro.generated.tsx` y el enum del catálogo); formas de `@remotion/shapes`; `Trazo` usa `evolvePath`; transiciones `@remotion/transitions` por marca (`marca.transicion`, desactivadas en el QA); cristal esmerilado `src/dsl/vidrio.tsx` (copia desenfocada de la foto alineada con la cámara); precio con `sufijo` («millones»); Ken Burns 1.0→1.12.
- **SFX**: `public/sfx/<tipo>.wav` (pop, whoosh, heartbeat, cash, tick, thud, zap, ding; `latido` = alias de `heartbeat`), componente `<SoundEffect>` (vol 0.15), `scripts/audio.mjs` mezcla lo mismo en Node (respeta `marca.ambiente`/`musica`). Se sintetizan solos si faltan.
- **Navegador**: `scripts/navegador.mjs` usa Chrome de Remotion o, si no se puede descargar, Chromium de Playwright/sistema (o `BROWSER_EXECUTABLE`).
- **QA**: usa el color de fondo de la marca, no da «vacío/sin movimiento» en escenas con foto, y los subtítulos reducen letra con palabras largas.
- Pruebas: `npm run test` (tipos + 72 pruebas con servidores simulados, restaura el proyecto activo). **Nunca se probó con claves reales ni edge-tts** (sin internet en el entorno de desarrollo). Guía de usuario: `GUIA.md`.

## Stack y comandos

Remotion 4.0.536 (exacto, no usar `^`) + React + TypeScript · edge-tts (voz gratis, sin API key) · Python 3 solo para edge-tts.

| Comando | Qué hace |
|---|---|
| `npm run voz` | Fase 2. Lee `src/data/guion.txt` → `public/audios/voz.mp3`, `tiempos.vtt`, `src/data/timestamps.json`, `meta.json`. Opciones: `--voz ar\|mx\|es\|ar-f\|mx-f\|es-f`, `--velocidad +10%`, `--texto "..."` |
| `node scripts/qa.mjs --imagenes 60,300,900` | Renderiza solo esos fotogramas a `trabajo/tmp/qa-rapido/` (≈6 s). **Úsalo para iterar y míralos con Read.** |
| `npm run qa` | Fase 4 completa (≈1 min): márgenes medidos en el DOM, solapes por píxeles, tramos sin movimiento > 2 s, escenarios vacíos. Deja las 4 capturas en `trabajo/salida/qa/`. Sale con código 2 si hay problemas. |
| `npm run build` | Fase 5: `scripts/render.mjs` renderiza `trabajo/salida/video-terminado.mp4` (≈25 min a 1080×1920@60 con 1 hilo). **Robusto y reanudable**: audio aparte, fotogramas en tandas de 100 con Chrome nuevo y reintentos, paquete cacheado, espera a tener memoria libre, ensamblado con el ffmpeg de Remotion. Si se cae, vuelve a lanzarlo y sigue donde quedó. Opciones: `--concurrency=N`, `--tanda=N`, `--desde-cero`, `--memoria-min=GB`. |
| `npm run entregables` | `portada.jpg` + `texto-del-post.txt` (desde `src/data/post.txt`) + copia en `trabajo/archivo/<id>/`. |
| `npm run producir` | Encadena voz → QA → render → entregables. `-- --sin-voz`, `-- --sin-qa`. |
| `npm run sfx` | Regenera los efectos sintetizados en `public/audios/` (ya están generados). |
| `npm start` | Remotion Studio para previsualizar. |
| `npm run panel` | Interfaz web · `npm run crear` asistente · `npm run crear-video` un comando · `npm run plantilla` sin IA · `npm run test` pruebas |

**No lances dos renders/QA a la vez**: Chrome se cae con "Target closed".

**Memoria (importante en esta máquina)**: 7,4 GB de RAM y archivo de paginación fijo de 4 GB en un C: casi lleno. Con VS Code + Chrome + WSL abiertos la memoria comprometida libre baja de 1 GB y Windows mata procesos (`ffprobe` con código 3221225773 = 0xC000012D, "Chrome ran out of memory", "Fatal process out of memory: Zone"). Por eso `render.mjs` espera a tener ≥ 0,9 GB libres antes de cada tanda y no usa `npx remotion render` directamente. Consejo al usuario: cerrar navegador/WSL durante el render, y a medio plazo poner la memoria virtual en "administrada por el sistema" o crear un archivo de paginación en D:.

## Motor de planes (DSL) y agente de IA — añadido después

Además del tema hecho a mano (`src/scenes/dolor-referido/`) hay un tema **dinámico** (`src/scenes/dinamico/`) que dibuja cualquier
**plan JSON** (`src/data/plan.json`) con un catálogo de 27 elementos (`src/dsl/catalogo.json` es la fuente de verdad). Un plan ata
cada elemento a una frase del guion (`cuando`). El agente de OpenAI (`scripts/ia/`, `npm run ia -- "tema"`) genera guion + plan con
JSON Schema estricto, lo valida (`validar-plan.mjs` usa el mismo código TS que el render vía esbuild), lo repara y lo revisa con capturas
reales. **Documentación: `GUIA-IA.md` (cómo funciona/uso) y `AGENTS.md` (relevo para IAs sin Claude: estado, reglas, comandos).**

Con Claude Code NO hace falta la API: tú haces de modelo. Opción 1 (la de siempre): escenas a mano como en `dolor-referido`.
Opción 2 (más rápida): escribe `src/data/plan.json` siguiendo `ejemplos/*/plan.json` y el catálogo, `node scripts/activar-tema.mjs dinamico`,
itera con `npm run ia:validar` y `npm run ia:capturas` (mira los JPG), y produce con `npm run producir -- --sin-voz`.
Cambiar de proyecto: `npm run proyecto -- activar <id>` (restaura datos + tema; también acepta los de `ejemplos/`). **Al terminar una sesión de
pruebas, deja activo el proyecto entregado (`dolor-referido-infarto`)**. Pruebas del agente sin coste: `npm run ia:prueba` (restaura el proyecto activo).

## Diferencias respecto a GEMINI.md

1. **Tiempos por palabra con la API, no con el CLI.** `edge-tts --write-subtitles` solo da frases enteras en las versiones nuevas.
   `scripts/voz_edge.py` usa `boundary="WordBoundary"`; `generar-voz.mjs` parsea el VTT y **re-alinea con el guion original** para conservar `¿ ? , .` en los subtítulos.
2. **Las escenas se anclan a palabras, no a segundos.** `tiempoDe("bloquea")`, `tiempoDe("brazo", 3)` (3ª aparición), `finDe(...)`, en `src/lib/voz.ts`.
   Si cambias la voz/velocidad o retocas el guion, todo se re-sincroniza solo. Si una palabra ya no existe, falla con un mensaje claro.
3. **Archivos extra** (no pedidos): `scripts/qa.mjs`, `scripts/producir.mjs`, `scripts/entregables.mjs`, `scripts/generar-sfx.mjs`, `remotion.config.ts`,
   efectos de sonido y ambiente (`public/audios/sfx-*.wav`, `ambiente.wav`), tipografía Inter local (`public/fonts/`), `Portada` (composición `Still`).
4. `src/VideoMedico.tsx` monta Fondo → escenas → Encabezado → Subtítulos + audio. El resto está en `src/components/`, `src/lib/`, `src/scenes/<tema>/`.

## Arquitectura

```
src/
  VideoMedico.tsx     montaje: fondo, escenas con transición, encabezado, subtítulos, audio, sacudida de cámara
  Portada.tsx         portada 1080x1920 (gancho congelado en tema.fotogramaPortada)
  tema.ts             re-exporta el tema ACTIVO: export { tema } from "./scenes/<carpeta>"
  data/               guion.txt · timestamps.json · meta.json · tema.json (id, etiqueta) · post.txt
  lib/                colores · voz (tiempoDe, subtítulos) · anim (prog, resorte, pop, latido...) · ruta (muestreo de paths)
  components/
    svg/primitivas    Trazo (se dibuja solo), Tubo, Pieza, Flujo (con atasco), Impulso, Aros, RayosDolor, Flecha, Etiqueta, Rotulo
    anatomia/         Corazon, Cuerpo (Busto, Brazo), Columna, CorteMedula, Cerebro
    Fondo / Subtitulos / Encabezado / Escenario / SondaQA
  scenes/
    tipos.ts          EscenaDef, Tema, SfxDef
    dolor-referido/   tema de ejemplo (7 escenas) → úsalo como plantilla
```

## Cómo crear un video nuevo ("Hazme un video sobre X")

1. **Fase 1**: investiga, escribe 85–110 palabras (gancho 0–3 s / mecanismo / remate) y **muéstralo para visto bueno** (GEMINI.md lo pide).
2. Guarda el guion en `src/data/guion.txt`, actualiza `src/data/tema.json` (`id` en kebab-case, `etiqueta` en MAYÚSCULAS, `titulo`) y ejecuta `npm run voz`. Lee `timestamps.json`.
3. Copia `src/scenes/dolor-referido/` a `src/scenes/<id>/`, reescribe las escenas (cada frase del guion = una ilustración SVG con sus etiquetas), define `tema.escenas` con
   `desde: tiempoDe("primera palabra de la escena")`, `sfx`, `impactos`, `fotogramaPortada`. Apunta `src/tema.ts` a la carpeta nueva.
4. Itera con `node scripts/qa.mjs --imagenes ...` y **mira los PNG**. Cuando esté bien, `npm run qa` hasta ver ✅.
5. Escribe `src/data/post.txt` (descripción atractiva + exactamente 5 hashtags médicos), `npm run build`, `npm run entregables`.

## Reglas de diseño (ya aplicadas por los componentes; respétalas al añadir cosas)

- Lienzo 1080×1920 a 60 fps. Escenario (ilustración) y **350–1350**; subtítulos y **1450–1650**; encabezado arriba. Las orillas del escenario se difuminan 46 px: no pongas títulos pegados a y=350 ni a y=1350.
- Colores: rojo `#EF4444` (arterias/dolor/bloqueo) · azul `#3B82F6` (venas/receptores/flujo normal) · amarillo `#FACC15` (nervios/potencial de acción/ATP) · hueso `#F8FAFC` (tejidos/estructura) · fondo `#0B0F19`.
- Todo texto con **padding ≥ 80 px**. `Etiqueta`/`Rotulo` se recortan solas a `MARGEN_LOCAL = 102` porque la cámara hace zoom hasta ×1.035; el QA lo verifica con medidas reales.
- Nada de escenas vacías: cada escena debe tener movimiento continuo (latido, flujo, pulsos, aros).
- Animaciones con `spring()`/`interpolate()` de Remotion (envueltos en `resorte`, `prog`, `pop`). Tiempo siempre absoluto con `useT()` — **no uses `<Sequence>` para escenas** (movería el reloj).

## Trampas conocidas

- Inter (`public/fonts`, subconjunto latino) **no trae** subíndices/superíndices Unicode ni flechas `→`. Para fórmulas usa `O_{2}`, `H^{+}` en `Etiqueta` (o `<tspan>` en SVG propio). Sí trae `↑ ↓ · – — ¿ ¡`.
- `edge-tts` necesita internet. Si falla, `voz_edge.py` reintenta 3 veces y, como último recurso, reparte tiempos por longitud de palabra (avisa en consola).
- Los IDs de `clipPath`/`mask` deben ser únicos por instancia (ver `Brazo` con `useId`).
- `Flujo` con `bloqueo` simula la cola de glóbulos contra un trombo (requiere `hueco ≤ velocidad × periodo`).
- Windows: el script busca Python con `py -3`, `python`, `python3`.
- Todos los scripts que usan Remotion importan `scripts/_tmp.mjs` primero: redirige TEMP/TMP al proyecto (C: casi lleno).
- `npx remotion render` directo falla aquí por memoria/disco; usa siempre `npm run build`.
