# VideMed — reels automáticos (🩺 medicina Argentina · 🏙️ inmobiliario Colombia)

> 🖥️ **Lo más fácil: el panel web.** `npm install` y luego `npm run panel -- --abrir` → http://localhost:4173. Eliges el nicho, cargas datos y fotos, y te lleva paso a paso hasta el .mp4. **Guía completa: [`GUIA.md`](GUIA.md).**

Tú dices el tema (o los datos del inmueble/vehículo). El sistema escribe el guion, genera la voz, anima los dibujos médicos en sincronía con cada palabra, revisa el resultado y exporta el video, la portada y el texto del post.

Hay **tres formas de usarlo**: el **panel web** (recomendado, `npm run panel`), la **terminal** (`npm run crear`, `npm run crear-video`) y lo que sigue:

| | Quién escribe guion y escenas | Necesita |
|---|---|---|
| **A. Con Claude Code** | Claude (abre la carpeta y pide «Hazme un video sobre …») | Claude Code |
| **B. Con la API de OpenAI (ChatGPT)** | El agente de `scripts/ia/` | Una clave de OpenAI en `.env` |

La voz (Microsoft Edge TTS), el render y la revisión de calidad son **gratis y no usan ninguna clave** en ambas formas. Solo la IA de la forma B usa tu cuenta de OpenAI.

> 📘 **Para entenderlo a fondo, `GUIA-IA.md`** (cómo funciona, uso, costes, problemas). **Para que otra IA continúe el trabajo, `AGENTS.md`.**

## Lo que ya está listo

- ✅ Entorno instalado (Node, Remotion, edge-tts, navegador de render).
- ✅ Primer video terminado: **dolor referido del infarto** (36,65 s, 1080×1920, 60 fps, con voz, ambiente y efectos).
- ✅ Resultados en `trabajo/salida/`: `video-terminado.mp4` · `portada.jpg` · `texto-del-post.txt` · `qa/` (4 capturas + informe).
- ✅ Agente de IA integrado y probado con un servidor simulado (32 pruebas). **Falta probarlo con tu clave real** → `npm run ia:diagnostico`.

## Forma B: hacer un video con la API de OpenAI

1. Copia `.env.example` como `.env` y escribe tu clave: `OPENAI_API_KEY=sk-...` (se crea en platform.openai.com/api-keys; la cuenta necesita saldo). **No compartas ese archivo.**
2. `npm run ia:diagnostico` → debe terminar en ✅.
3. `npm run ia -- "Por qué la insulina baja el azúcar"`
   - te muestra el guion con la verificación médica y **te pide el visto bueno** (puedes responder con cambios en texto libre);
   - genera la voz, diseña las escenas, las comprueba con un validador y con capturas reales revisadas por un modelo con visión;
   - escribe el texto del post.
4. `npm run producir -- --sin-voz` → QA + render (≈ 25 min) + portada + copia de seguridad.
5. **Antes de publicar, lee `trabajo/ia/<tema>/informe.md` y mira el video**: la verificación médica la hace un modelo y no es una garantía.

Atajos: `npm run ia -- "tema" --si --render` (sin preguntar, hasta el video) · `npm run ia -- --guion mi-guion.txt` (usas tu guion) · `npm run ia -- --ayuda`.
¿Sin API? Hay un modo manual con ChatGPT en el navegador (`npm run ia:prompt` / `npm run ia:importar`, ver `GUIA-IA.md` §4).

## Forma A: con Claude Code

Abre esta carpeta con Claude Code y escribe, por ejemplo: «Hazme un video sobre por qué la insulina baja la glucosa». Sigue las 5 fases de `GEMINI.md` (guion para tu visto bueno → voz → escenas → QA → render). Otros mensajes: `configúrame` · `cambia la voz a mexicana` · `hazlo más rápido`.

## Comandos manuales

```bash
npm run panel            # interfaz web para usar todo (http://localhost:4173)
npm run crear            # asistente por preguntas (nicho, datos, fotos)
npm run crear-video -- --niche inmobiliario-co --datos datos.json   # un comando
npm run test             # tipos + 72 pruebas sin coste
npm start                # previsualizar en el navegador (Remotion Studio)
npm run voz              # voz y tiempos desde src/data/guion.txt   (--voz ar|mx|es|ar-f|mx-f|es-f  --velocidad +10%)
npm run qa               # revisión automática de calidad (≈ 1 min)
npm run build            # renderizar el video (≈ 25 min; si se cae, relánzalo y continúa)
npm run entregables      # portada + texto del post + copia de seguridad
npm run producir         # voz + QA + render + entregables   (-- --sin-voz para reutilizar la voz)
npm run proyecto -- listar | guardar | activar <id>     # guardar/volver a un video anterior
npm run ia:validar       # comprueba src/data/plan.json (errores y avisos con su arreglo)
npm run ia:capturas      # JPG de cada escena en trabajo/ia/capturas/ para revisarlas
npm run ia:prueba        # 32 pruebas del agente sin gastar nada
```

## Dónde está cada cosa

| Qué | Dónde |
|---|---|
| Guion actual / texto del post | `src/data/guion.txt` · `src/data/post.txt` |
| Voz y tiempos por palabra | `public/audios/voz.mp3` · `src/data/timestamps.json` |
| Escenas del video actual | `src/scenes/dolor-referido/` (a mano) · `src/data/plan.json` (generadas por IA) |
| Videos anteriores (paquete restaurable) | `trabajo/archivo/<tema>/` |
| Trabajo del agente de IA (informe, capturas, plan) | `trabajo/ia/<tema>/` |
| Tu clave y ajustes de IA | `.env` (plantilla: `.env.example`) |
| Prompt original / notas técnicas / guía IA / relevo | `GEMINI.md` · `CLAUDE.md` · `GUIA-IA.md` · `AGENTS.md` |

## Si algo falla

- **«No se pudo generar el audio»** → revisa tu conexión a internet y repite `npm run voz`.
- **Problemas con la clave, el modelo o el saldo de OpenAI** → `npm run ia:diagnostico` te dice qué falla; la tabla de `GUIA-IA.md` §5 cubre los casos.
- **Render lento** → es normal (2.200 fotogramas a 1080×1920, ≈ 25 min). No abras otro render a la vez.
- **«Memoria insuficiente…»** → poca RAM libre. Cierra el navegador, otras ventanas de VS Code y WSL (`wsl --shutdown`); el render continúa solo cuando hay memoria. Si se interrumpe, vuelve a ejecutar `npm run build`: **no repite** lo ya renderizado.
- **Arreglo permanente (esta PC)**: el disco C: está casi lleno y el archivo de paginación es fijo (4 GB). Windows → Configuración → Sistema → Acerca de → Configuración avanzada → Rendimiento → Opciones avanzadas → Memoria virtual: «Administrar automáticamente» o crea un archivo en D:.
- **«Target closed» / el navegador se cierra** → hubo dos renders a la vez; deja solo uno.
- **Python no encontrado** → instálalo desde python.org marcando «Add to PATH».
