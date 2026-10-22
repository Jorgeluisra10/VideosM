# VideMed — productor automático de reels de medicina (Video-as-Code)

@GEMINI.md

Lo de arriba es el prompt original del proyecto (roles, fases, reglas de diseño). Todo ya está implementado;
esto explica **cómo** y en qué se aparta del prompt, para trabajar sin redescubrirlo.

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
