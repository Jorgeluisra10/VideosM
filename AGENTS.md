# AGENTS.md — relevo para cualquier IA que continúe VideMed (ChatGPT, Codex, otra)

Léelo entero antes de tocar nada. Está escrito para una IA con acceso a terminal y archivos **sin Claude**. `GEMINI.md` es el prompt original del producto (roles y fases); `CLAUDE.md` es la nota técnica de implementación; `GUIA-IA.md` explica el agente de OpenAI; `LEEME.md` es la guía del usuario. Este archivo es el punto de entrada operativo.

## 1. Qué es
Productor automático de reels de medicina (1080×1920, 60 fps, ~35 s): guion → voz gratuita con tiempos por palabra → escenas SVG animadas (Remotion) sincronizadas con la voz → QA → render → portada + texto del post. Stack: Remotion 4.0.536 (versión exacta, no `^`), React/TypeScript, Node 18+, Python 3 solo para `edge-tts`.

## 0. Novedades (2026-10-22): panel web, modo dual, voz dev/prod

Lee `GUIA.md` (uso) y la sección «Estado actual» de `CLAUDE.md` (arquitectura). Resumen: `npm run panel` (interfaz completa), nichos `medicina-ar` / `inmobiliario-co` (perfiles con voces, paletas y prompts propios), voz `--mode dev|prod` (edge-tts · OpenAI tts+whisper · ElevenLabs), íconos healthicons/lucide, `<SoundEffect>` en `public/sfx`, transiciones, cristal esmerilado, vehículos e inversión en el nicho colombiano, `npm run test` (72 pruebas sin coste). Sigue sin probarse con claves reales: primer paso en un PC con claves = Ajustes → «Probar conexión» y `npm run ia:diagnostico`.

## 2. Estado a 2026-10-21
| Qué | Estado |
|---|---|
| **Primer video (dolor referido del infarto)** | ✅ **TERMINADO** y verificado: `trabajo/salida/video-terminado.mp4` (36,65 s, 1080×1920, H.264 60 fps, AAC estéreo), `portada.jpg`, `texto-del-post.txt`, 4 capturas + `informe.json` en `trabajo/salida/qa/`. Copia restaurable: `trabajo/archivo/dolor-referido-infarto/datos/`. QA sin problemas. |
| Proyecto activo ahora | `dolor-referido-infarto` (tema `src/scenes/dolor-referido`, `src/tema.ts` lo apunta). |
| Motor de planes (DSL) | ✅ `src/dsl/` + tema `src/scenes/dinamico`: dibuja cualquier plan JSON con 27 elementos. Verificado visualmente con los planes de `ejemplos/` (infarto, insulina, potencial de acción) y con el validador (0 errores/avisos). |
| Agente de IA (OpenAI) | ✅ `scripts/ia/`. **32 pruebas pasan** con un servidor simulado (`npm run ia:prueba`). ⚠️ **Nunca se ejecutó con una clave real** (no había): el primer paso en un PC con clave es `npm run ia:diagnostico`. |
| Un video completo hecho *por el agente de IA* | ❌ no existe aún (requiere clave). Los `ejemplos/*/plan.json` son planes escritos a mano que sirven de referencia y de prueba. |
| `src/data/plan.json` | Resto del último plan dinámico de prueba; **solo importa si `src/tema.ts` apunta a `dinamico`**. Ignóralo mientras el tema activo sea `dolor-referido`. |

**Nada está a medias.** Lo único «pendiente» es lo que quieras producir de nuevo: ver §4.

## 3. Instalar en otro ordenador
1. Copia la carpeta entera (con `trabajo/`, `public/`, `ejemplos/`, `.env.example`; `node_modules/` es opcional: se reinstala).
2. Instala **Node 20** y **Python 3** (marca «Add to PATH»). En Windows/Mac/Linux funciona igual; el script busca `py -3`, `python`, `python3`.
3. `npm install` (reinstala Remotion 4.0.536 exacto). `pip install edge-tts` ya lo hace solo la primera vez que se genera una voz.
4. La primera renderización descarga Chrome Headless Shell (necesita internet). En Linux, si falla: `npx remotion browser ensure` e instala las librerías que pida (Chromium).
5. `cp .env.example .env` y pon `OPENAI_API_KEY=` (solo para el agente de IA; el render, la voz y los comandos manuales no la usan).
6. `npm run ia:diagnostico` — debe acabar en ✅. Si no hay clave aún: `npm run ia:diagnostico -- --sin-api`.
7. `npm run ia:prueba` — 32 pruebas sin coste (no abre Chrome, ≈ 30 s). Deben pasar todas.

## 4. Qué puedes hacer ahora
### A. Confirmar o rehacer el video ya entregado
```bash
ls -la trabajo/salida/video-terminado.mp4        # debe existir (~29 MB)
npx remotion ffprobe trabajo/salida/video-terminado.mp4   # 1080x1920, 60 fps, ~36.65 s, con audio AAC
```
Si falta (p. ej. copiaste solo el código) o quieres regenerarlo:
```bash
node scripts/proyecto.mjs activar dolor-referido-infarto   # restaura guion, voz, tiempos, tema y post
npm run qa                                                 # ≈ 1 min; debe decir ✅ (sale con código 2 si hay problemas)
npm run build -- --desde-cero                              # render reanudable (≈ 25 min con 1 hilo; más rápido con --concurrency=4 si hay RAM)
npm run entregables                                        # portada.jpg + texto-del-post.txt + archivo
```
### B. Un video nuevo con la API de OpenAI
```bash
npm run ia -- "Por qué la insulina baja el azúcar"          # guion → (pregunta visto bueno) → voz → plan → visión → post
npm run producir -- --sin-voz                               # QA + render + entregables
```
Sin humano delante: `npm run ia -- "tema" --si --render`. **Pero GEMINI.md exige que una persona vea el guion antes**: usa `--si` solo si el usuario lo autorizó. Sin `--si` y sin terminal el agente se detiene (código 3) y deja `trabajo/ia/<tema>/guion-borrador.txt`: enséñaselo al usuario y repite con `--si` o con su versión (`--guion archivo.txt`). Antes de publicar, el usuario debe leer `trabajo/ia/<tema>/informe.md` (verificación médica hecha por el modelo, **no es garantía**).

Códigos de salida del agente: 0 ok · 2 uso/clave · 3 espera visto bueno · 4 el modelo no logró un plan válido (mira `problemas.json`; reintenta con `--rondas 8`, `OPENAI_MODEL_PLAN` más capaz o `--emergencia`) · 1 otro error.

### C. Un video nuevo SIN API (tú eres la IA)
Tú sustituyes al modelo. Sigue exactamente las 5 fases de `GEMINI.md`:
1. Escribe el guion (85–110 palabras, gancho/mecanismo/remate; reglas en `scripts/ia/prompts.mjs` → `sistemaGuion`) y **muéstraselo al usuario**. Guárdalo en `src/data/guion.txt`; pon `src/data/tema.json` (`id` kebab-case, `etiqueta` MAYÚSCULAS, `titulo`).
2. `npm run voz` → mira `src/data/timestamps.json`.
3. Escribe `src/data/plan.json` (formato: `ejemplos/*/plan.json`; catálogo y reglas: `src/dsl/catalogo.json` y `npm run ia:prompt` → `trabajo/ia/prompts/2-plan.md`, que contiene el manual completo para ti). Activa el tema: `node scripts/activar-tema.mjs dinamico`.
4. Itera: `npm run ia:validar` (errores y avisos con su arreglo) → `npm run ia:capturas` (JPG en `trabajo/ia/capturas/`; **míralos**) → corrige. Cuando valide sin errores y las capturas se vean limpias, `npm run qa`.
5. `src/data/post.txt` (descripción + exactamente 5 hashtags) → `npm run producir -- --sin-voz`.
Si usas ChatGPT en el navegador en vez de terminal: `npm run ia:prompt -- "tema"` / `npm run ia:prompt` / `npm run ia:importar -- plan-chatgpt.json` (ver `GUIA-IA.md` §4).

## 5. Reglas que no debes romper
- **Nunca** `npx remotion render` directo: usa `npm run build` (robusto, reanudable). **Nunca dos renders/QA a la vez**: Chrome se cae con «Target closed».
- No uses `<Sequence>` para escenas (el tiempo es absoluto con `useT()`); todo se ancla a **palabras** (`cuando`), nunca a segundos.
- Lienzo 1080×1920; escenario y 350–1350; subtítulos y 1450–1650; texto con padding ≥ 80 px; colores: rojo `#EF4444` (arteria/dolor/bloqueo), azul `#3B82F6` (vena/receptor/membrana), amarillo `#FACC15` (nervio/ATP/señal), hueso `#F8FAFC` (estructura), fondo `#0B0F19`.
- La tipografía Inter local **no trae** subíndices/superíndices ni flechas `→`: usa `O_{2}`, `H^{+}` y el elemento `linea`.
- No cambies versiones de Remotion; no cambies `src/dsl/catalogo.json` sin ejecutar `npm run check && npm run ia:prueba`.
- **Secretos**: no imprimas, registres ni subas `OPENAI_API_KEY`/`.env`.
- No borres `trabajo/archivo/` ni `trabajo/salida/` sin mirarlos antes: es el único sitio donde están los videos terminados.
- Antes de decir que algo funciona, ejecútalo y mira la salida (`npm run check`, `npm run ia:prueba`, `npm run qa`, capturas).

## 6. Memoria y render (lección dura de la máquina original)
La máquina original tenía 7,4 GB de RAM y archivo de paginación fijo de 4 GB en un disco C: casi lleno: Windows mataba procesos por falta de **memoria comprometida** (síntomas: «Chrome ran out of memory», ffprobe con código 3221225773 = 0xC000012D, «Fatal process out of memory: Zone», «Cannot allocate memory»). Por eso `scripts/render.mjs` renderiza en tandas de 100 fotogramas con Chrome nuevo y reintentos, mezcla el audio en Node (sin Chrome), cachea el paquete (`trabajo/tmp/bundle-cache/`), espera a tener ≥ 0,9 GB libres antes de cada tanda y ensambla con el ffmpeg de Remotion. Si se cae, **vuelve a lanzar `npm run build`**: sigue donde quedó (`--desde-cero` para empezar de nuevo). En un PC con 16 GB o más puedes subir `--concurrency=4`. Opciones: `--tanda=N`, `--memoria-min=GB`, `--ensamblar`. Todos los scripts que usan Remotion importan `scripts/_tmp.mjs` primero (redirige TEMP al proyecto).

## 7. Mapa del código
```
src/VideoMedico.tsx      montaje: fondo, escenas con transición, encabezado, subtítulos, audio+SFX, sacudida de cámara
src/tema.ts              re-exporta el tema ACTIVO (scripts/activar-tema.mjs lo reescribe junto con src/sonido.ts)
src/scenes/dolor-referido/   video 1, hecho a mano
src/scenes/dinamico/     tema que lee src/data/plan.json
src/dsl/                 motor de planes: catalogo.json (fuente de verdad), anclas/tiempos/cajas/medidas (lógica pura),
                         elementos/ (React), registro.tsx, svgSeguro.ts, EscenaDinamica.tsx, PortadaDinamica.tsx, nucleo.ts
src/data/                guion.txt · timestamps.json · meta.json · tema.json · post.txt · plan.json
src/lib, src/components  utilidades de anim/voz/texto, primitivas SVG y anatomía
scripts/                 voz · render · qa · entregables · producir · proyecto · activar-tema · audio · _comun · _tmp
scripts/ia/              agente (OpenAI): ver GUIA-IA.md §7
ejemplos/                3 proyectos completos (guion, voz, tiempos, plan) para pruebas y como referencia
trabajo/salida|archivo|ia|tmp   resultados · proyectos restaurables · trabajo del agente · temporales
```
Comandos útiles: `npm start` (Studio) · `npm run check` (tsc) · `npm run proyecto -- listar|guardar|activar <id>` · `npm run ia -- --ayuda`.

## 8. Trampas conocidas
- `edge-tts` necesita internet. Los tiempos por palabra salen de la API (`boundary="WordBoundary"`), no del CLI (que solo da frases).
- Los IDs de `clipPath`/`mask` deben ser únicos por instancia (`useId`).
- Una ancla `cuando` debe ser texto **exacto** del guion; si se repite, usa `n`. La frase `desde` de una escena empieza en su **primera** aparición: debe ser única.
- En algunos Windows, lanzar `py`/`python` y después otro proceso **desde el mismo Node** aborta con `AssignProcessToJobObject: (87)`. Lanza Python en un proceso hijo aparte (los scripts ya lo hacen).
- Las respuestas de modelos pueden traer `null` en propiedades no usadas: `normalizarPlan`/`limpiarNulos` los quitan antes de validar y guardar.
- Los nombres de modelos de OpenAI cambian: no los fijes en el código; usa `.env` o la elección automática (`cliente.mjs`).
