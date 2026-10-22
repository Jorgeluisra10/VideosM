# VideMed con IA (API de OpenAI) — cómo funciona y cómo usarlo

Dices un tema («por qué la insulina baja el azúcar») y el agente entrega un reel vertical de ~35 s: guion verificado, voz, dibujos médicos animados sincronizados palabra por palabra, subtítulos, portada y texto del post.

> **Estado honesto.** Todo el flujo está probado de punta a punta con un servidor que simula la API de OpenAI (32 pruebas, `npm run ia:prueba`), incluidos los fallos típicos de un modelo. **No se ha podido probar con tu clave real** (no la tenía). La primera vez ejecuta `npm run ia:diagnostico`: en 10 segundos te dice si tu cuenta, tu modelo y el formato estructurado funcionan.

---

## 1. Cómo funciona el generador

```
tema ──► ① GUION ──► ② VOZ ──► ③ PLAN DE ESCENAS ──► ④ REVISIÓN VISUAL ──► ⑤ POST ──► ⑥ RENDER
        (IA +         (edge-tts   (IA diseña, el        (capturas reales +    (IA)      (Remotion,
        revisor        gratis,     validador mide y      IA con visión)                   sin IA)
        médico +       tiempos     la IA repara)
        tu OK)         por
                       palabra)
```

**La idea clave: la IA no programa, decide.** El video está hecho de «piezas» (un catálogo de 27 elementos: corazón, cerebro, cuerpo, célula, membrana, neurona, gráfica, flecha, partículas, etiqueta…). La IA solo escribe un **plan en JSON**: qué elementos pone, dónde (cuadrícula 0–100) y **en qué palabra del guion aparece cada uno**. Un motor determinista (Remotion + React, `src/dsl/`) dibuja ese plan siempre igual. Por eso:

- **Nada se desincroniza.** Cada elemento se ata a una frase exacta del guion (`"cuando": "se bloquea"`). Si cambias la voz o la velocidad, todo se recoloca solo.
- **El estilo no depende del humor del modelo.** Colores anatómicos (rojo = arteria/dolor, azul = vena/membrana, amarillo = nervio/señal, hueso = estructura), márgenes ≥ 80 px, subtítulos y zonas están fijados por el motor.
- **Los errores se detectan antes de gastar 25 minutos de render.** `scripts/ia/validar-plan.mjs` mide con las mismas fórmulas que el render: anclas que no existen, textos que se pisan, piezas solapadas, escenas vacías, tramos quietos > 2 s, símbolos que la tipografía no tiene, portada ilegible… Cada problema vuelve al modelo con el arreglo concreto («mueve la etiqueta ≥ 4 unidades») para que lo repare (hasta 4 rondas).

### Las fases con detalle

| Fase | Qué pasa | Dónde |
|---|---|---|
| ① Guion | El modelo redacta 85–110 palabras (gancho / mecanismo / remate). Si se pasa o se queda corto, se le pide ajustar. Un **segundo modelo-revisor** (rol de profesor de medicina) lo contrasta y puede corregirlo. Se te muestra con la tabla de afirmaciones y su certeza **para tu visto bueno** (lo exige `GEMINI.md`). | `agente.mjs`, `prompts.mjs` |
| ② Voz | edge-tts (gratis, sin clave) genera `voz.mp3` y los tiempos por palabra. | `generar-voz.mjs` |
| ③ Plan | El modelo recibe el guion con la **línea de tiempo** (`palabra[segundo]`), el catálogo y dos planes de ejemplo ya validados, y devuelve el plan con un **JSON Schema estricto** (no puede inventar tipos ni propiedades). Se valida y se repara. | `esquemas.mjs`, `validar-plan.mjs` |
| ④ Visión | Se renderizan capturas reales (2 por escena) y un modelo con visión las critica (solapes, ilegible, metáfora confusa, error médico, descompensado). Si hay problemas graves, se corrige el plan, se vuelve a validar y a capturar (hasta 2 rondas). Si la corrección empeora el plan, se descarta. | `capturas.mjs` |
| ⑤ Post | Descripción + exactamente 5 hashtags (`src/data/post.txt`). | |
| ⑥ Render | `npm run producir -- --sin-voz`: QA completo (márgenes medidos en el DOM, solapes por píxeles, tramos estáticos) → render reanudable → portada + archivo. | `producir.mjs`, `render.mjs` |

### Redes de seguridad
- **Salida estructurada estricta** (`text.format: json_schema, strict`), con degradación automática si el servidor la rechaza (estricto → laxo → JSON libre).
- **Reintentos** con espera creciente (429, 5xx, red, timeout) y respeto de `Retry-After`; los errores de saldo (`insufficient_quota`) y clave (401) se explican en claro.
- **Sin `/responses`** (algunos proxies) → cae solo a `/chat/completions`.
- **Plan que no valida** tras todas las rondas → el programa **se detiene (código 4)** y guarda `plan-mejor.json` + `problemas.json`; no renderiza algo defectuoso. Con `--emergencia` usa un plan sencillo garantizado (rótulo + halo por escena: feo pero correcto).
- **Guion sin visto bueno** en una ejecución sin terminal → se detiene (código 3) y deja el borrador.

---

## 2. Puesta en marcha

1. **Requisitos**: Node 18+ (probado con 20), Python 3 (solo para la voz gratuita), conexión a internet.
2. `npm install`
3. Copia `.env.example` como **`.env`** y pon tu clave:
   ```
   OPENAI_API_KEY=sk-...
   ```
   La creas en <https://platform.openai.com/api-keys>; la cuenta necesita saldo (Billing). **`.env` es secreto: no lo compartas ni lo subas a internet.**
4. `npm run ia:diagnostico` → debe terminar con ✅. (Sin clave: `npm run ia:diagnostico -- --prueba`.)
5. Primer video: `npm run ia -- "Por qué la insulina baja el azúcar"`

### Modelos
Déjalos vacíos y el programa elige solo el modelo **equilibrado** más reciente de tu cuenta (consulta `/v1/models`). Para fijarlos edita `.env`:

| Variable | Qué controla | Recomendación |
|---|---|---|
| `OPENAI_MODEL` | guion, post | equilibrado (`gpt-6.1-sol` en oct-2026) |
| `OPENAI_MODEL_PLAN` | el plan de escenas (lo más difícil) | el más capaz si quieres máxima calidad (`gpt-6-astra`) |
| `OPENAI_MODEL_VISION` | crítica de capturas | equilibrado |
| `OPENAI_MODEL_REVISOR` | revisor médico | equilibrado o superior |

Los nombres de modelo cambian con el tiempo: `npm run ia:diagnostico` lista los que tu cuenta tiene. Evita los modelos «mini/luna/nano» para el plan: el validador rechazará más y gastarás rondas.

---

## 3. Uso

```bash
npm run ia -- "tema"                      # guion → te lo muestra → pregunta tu OK → voz → plan → revisión visual → post
npm run ia -- "tema" --si --render        # sin preguntar y hasta el video final (≈ 25 min de render)
npm run ia -- --guion mi-guion.txt        # usas TU guion (no se modifica; el revisor solo avisa)
npm run ia -- --solo-guion "tema"         # solo guion; luego  --reanudar  para seguir
npm run ia -- --solo-plan                 # ya tienes guion+voz en src/data: solo diseña las escenas
npm run ia -- --prueba "tema"             # servidor simulado (0 coste)
npm run ia -- --ayuda
```

Opciones: `--si` · `--render` · `--voz ar|mx|es|ar-f|mx-f|es-f` · `--velocidad +5%` · `--modelo id` · `--rondas N` · `--sin-revision` · `--sin-vision` · `--sin-voz` · `--reanudar` · `--emergencia` · `--aceptar-errores` · `--comentario "..."` · `--id nombre`.

Al guion puedes responder con texto libre («hazlo más corto y menciona el tálamo»): genera otra versión con tu indicación.

Después de preparar el proyecto:
```bash
npm start                         # ver las escenas en el navegador
npm run ia:capturas               # capturas JPG de cada escena en trabajo/ia/capturas/
npm run producir -- --sin-voz     # QA + render + portada + archivo
```
El resultado queda en `trabajo/salida/` (`video-terminado.mp4`, `portada.jpg`, `texto-del-post.txt`) y una copia restaurable en `trabajo/archivo/<id>/`.

### Qué se guarda de cada ejecución (`trabajo/ia/<tema>/`)
`guion.json` (con la verificación y las simplificaciones) · `plan.json` · `plan-mejor.json` · `critica-N.json` · `capturas-N/` · `informe.md` (**léelo antes de publicar**: tabla de afirmaciones médicas y su certeza) · `llamadas.jsonl` (tokens por llamada). `IA_DEBUG=1` guarda además cada petición/respuesta en `trabajo/ia/debug/`.

### Coste y tiempo (estimación, no medición)
Por video, con el modelo equilibrado: ≈ 100–200 K tokens de entrada y 40–80 K de salida (el prompt del plan pesa ≈ 11 K y se repite en cada ronda; las capturas ≈ 1 K tokens cada una). Con los precios publicados en oct-2026 (equilibrado 2/10 USD por millón; el más capaz 10/50) eso es del orden de **0,5–1,5 USD** por video con el equilibrado y **3–6 USD** con el más capaz. El agente tarda 3–8 minutos (sin contar el render). Para abaratar: `IA_MAX_RONDAS_VISION=0` (sin revisión visual) y `--sin-revision`.

---

## 4. Sin API (modo manual con ChatGPT en el navegador)

```bash
npm run ia:prompt -- "tema"           # trabajo/ia/prompts/1-guion.md   → pégalo en ChatGPT
#   copia el campo "guion" a src/data/guion.txt, ajusta src/data/tema.json, y:
npm run voz
npm run ia:prompt                     # trabajo/ia/prompts/2-plan.md    → pégalo en ChatGPT (modelo más capaz)
#   guarda su JSON como plan-chatgpt.json y:
npm run ia:importar -- plan-chatgpt.json    # limpia, valida (lista los problemas para devolvérselos) y activa
```

También puedes **editar `src/data/plan.json` a mano** y comprobarlo con `npm run ia:validar`.

---

## 5. Si algo falla

| Síntoma | Qué hacer |
|---|---|
| `401` / «rechazó la clave» | Revisa `OPENAI_API_KEY` en `.env` (sin comillas ni espacios). |
| `insufficient_quota` | Añade saldo en <https://platform.openai.com/settings/organization/billing>. |
| `model_not_found` / 403 de modelo | Pon en `.env` un modelo que `npm run ia:diagnostico` liste; el programa ya prueba los siguientes candidatos. |
| Código 4: «no logró un plan válido» | Mira `trabajo/ia/<tema>/problemas.json`. Reintenta con `--rondas 8`, un modelo más capaz en `OPENAI_MODEL_PLAN`, o `--emergencia`. |
| Código 3: guion pendiente | Es el visto bueno: repite con `--si` o pasa tu versión con `--guion`. |
| El plan se ve raro | `npm run ia:capturas`, mira los JPG, y pídele cambios con `npm run ia -- --solo-plan --comentario "…"` o edita `plan.json`. |
| «Memoria insuficiente» al renderizar | Cierra navegador/WSL; el render es reanudable (`npm run build` otra vez). Ver `LEEME.md`. |
| `AssignProcessToJobObject: (87)` | Rareza de algunos Windows al lanzar un proceso **después** de `python` desde el mismo Node. Los scripts ya lo evitan; si lo ves en uno propio, ejecuta Python en un proceso aparte. |
| La voz falla | Necesita internet y Python 3 (`pip install edge-tts`). |

---

## 6. Ética y seguridad médica
- El revisor médico y la tabla de certeza **los produce un modelo**: reducen errores, no los eliminan. **Una persona con criterio médico debe leer `informe.md` y ver el video antes de publicarlo.**
- Los guiones son divulgación, no consejo clínico; el generador añade un aviso en el post cuando el tema es clínico.
- Nunca subas `.env`. Las llamadas se hacen con `store:false` (no se guardan en tu cuenta para evaluación).

---

## 7. Para desarrolladores: añadir un elemento nuevo
1. Describe el elemento en `src/dsl/catalogo.json` (propiedades y tipos). De ahí salen solos el **esquema estricto**, el **prompt** y las comprobaciones de tipos del validador.
2. Impleméntalo en `src/dsl/elementos/` y regístralo en `src/dsl/registro.tsx`.
3. Si ocupa espacio, añade su caja en `src/dsl/cajas.ts` (para que el validador detecte solapes) y, si se mueve solo, en `TIPOS_CON_MOVIMIENTO`.
4. `npm run check && npm run ia:prueba`.

Mapa de `scripts/ia/`: `agente.mjs` (orquestador) · `cliente.mjs` (API, reintentos, degradación) · `entorno.mjs` (.env) · `esquemas.mjs` · `prompts.mjs` · `validar-plan.mjs`/`validar.mjs` · `plan-util.mjs` (limpieza, saneado, plan de emergencia) · `capturas.mjs` · `puente.mjs` (comparte el código TypeScript del motor con Node vía esbuild) · `mock-server.mjs`/`probar.mjs` (pruebas sin coste) · `diagnostico.mjs` · `exportar-prompt.mjs`/`importar-plan.mjs` (modo manual).
