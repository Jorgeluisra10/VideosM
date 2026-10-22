# VideMed — Guía de uso (modo dual: Medicina 🇦🇷 / Inmobiliario 🇨🇴)

Esta guía explica **cómo queda funcionando todo** y cómo usarlo, de la forma más fácil (el **panel web**) y de la forma de terminal. Si solo quieres empezar: [Inicio rápido](#1-inicio-rápido-5-minutos).

---

## 0. Qué es y qué hace

Un generador automático de **reels verticales (1080×1920, 60 fps)** con calidad de estudio, para dos nichos:

| Nicho | Para quién | Estilo |
|---|---|---|
| 🩺 **`medicina-ar`** | Divulgación médica (anatomía, fisiología, farmacología, casos clínicos), público argentino | Voseo rioplatense natural («fijate lo que pasa en tu cuerpo»), fondo `#0B0F19` con grilla al 4 %, rojo = arterias/dolor, azul = venas/flujo, amarillo = nervios/ATP, hueso = tejidos. Dibujos vectoriales + íconos de *healthicons*, recorridos que se dibujan solos (`evolvePath`). |
| 🏙️ **`inmobiliario-co`** | Inmuebles, vehículos e inversión, público colombiano | Español colombiano persuasivo («Ojo a este dato si vas a comprar apartamento en Bogotá…»), fondo azul noche `#0F172A`, verde esmeralda `#10B981` (rentabilidad/valorización) y ámbar `#F59E0B` (precios y llamadas a la acción). **Modo híbrido**: tus fotos reales con efecto Ken Burns (zoom 1.0 → 1.12) + tarjetas de **cristal esmerilado** (glassmorphism), precio en COP («520 millones»), ficha en m², mapa de ubicación y retorno de inversión. |

Cada video pasa por el flujo: **datos → guion (con tu visto bueno) → voz con tiempos por palabra → escenas sincronizadas → control de calidad → render → portada + texto del post.**

> 🧠 **La idea clave:** la IA no programa, *decide*. El video se arma con un catálogo de piezas (corazón, cerebro, ficha, precio, mapa, lista, íconos…) y un **plan JSON** que ata cada pieza a **la palabra exacta** del guion. Un motor determinista (Remotion) lo dibuja siempre igual. Si cambias la voz o el guion, todo se vuelve a sincronizar solo.

---

## 1. Inicio rápido (5 minutos)

1. Instala **Node 20+** y **Python 3** (marca «Add to PATH»; Python solo se usa para la voz gratis).
2. En la carpeta del proyecto:
   ```bash
   npm install
   npm run panel -- --abrir
   ```
3. Se abre **http://localhost:4173**. Pulsa **➕ Nuevo video**, elige el nicho y sigue los 7 pasos. ¡Eso es todo!

La **voz gratis**, el **render** y el **control de calidad** no necesitan ninguna clave. Las claves (OpenAI / ElevenLabs) solo hacen falta para escribir guion/escenas con IA y para la voz de calidad estudio. Se ponen en **⚙️ Ajustes**.

---

## 1b. ✨ Estudio de animación (la pantalla principal del panel)

Al abrir el panel entras al **Estudio**: una pantalla minimalista para producir animaciones **SVG + 3D** con la paleta **IMNOBA** (azul navy `#02224E`, amarillo `#FFC500`, blanco `#FFFFFF`). **Sin subtítulos y sin voz sintética**: la locución la grabas tú y la pones en tu editor.

**Lo único que haces (4 controles):**

1. **Caja de texto grande** con el guion y lo que quieres ver, en bloques:
   ```
   [ESCENA 1 | 0s-4s | MODO: SVG]
   Locución: …   Visual: …

   [ESCENA 2 | 4s-9s | MODO: 3D]
   Locución: …   Visual: …
   ```
   `MODO: SVG` = vectores 2D (planos arquitectónicos que se dibujan solos, gráficas dinámicas, iconos animados). `MODO: 3D` = Three.js (edificios 3D, barras financieras, maquetas, cámara que orbita). Si tu guion está desordenado, pulsa **📋 Copiar Prompt Formateador**, pégalo en ChatGPT/Claude con tu texto y vuelve a pegar aquí el resultado. **🧪 Cargar ejemplo** te deja probar sin escribir nada.
2. **Modelo de IA** (con sus precios): `gpt-4.1-mini` (Recomendado calidad/precio), `o4-mini` (máxima precisión 3D y geometría), `gpt-4o-mini` (ultra económico, SVG), `gpt-4.1` (Estudio Pro).
3. **Incluir SFX automáticos: Sí / No.** No = el video sale **sin pista de audio** y la IA ni siquiera pide efectos.
4. **Paleta:** *IMNOBA (Colores oficiales de marca)* o *Medicina Clínica*.

### 🧪 Estilo Retro-Científica (cuarto control: paleta)

En **4 · Paleta** hay dos opciones extra que cambian TODO el lenguaje visual (IMNOBA y Medicina siguen igual y IMNOBA sigue siendo la predeterminada):

| Paleta | Colores |
|---|---|
| **Retro-Científica (hex del brief)** | fondo `#0B0C10` · papel `#F4F1EA` · rojo bermellón `#E63926` (objeto de estudio) · luz `#FF9E8A` · lima `#D4FF33` (telemetría) · cobalto `#2B44FF` (anomalías) |
| **Retro-Científica IMNOBA (esencia de marca)** | mismo diseño con el navy `#02224E` de fondo, el amarillo `#FFC500` como objeto de estudio y un azul claro de telemetría (el lima chocaría con el amarillo) |

Qué cambia al elegirla: **título H1** en Inter Black, MAYÚSCULAS, centrado en Y = 180 · **subtítulo tipo terminal** (JetBrains Mono, se escribe carácter a carácter a 30 ms con un bloque que parpadea cada 250 ms) · **escenario central** en y 350–1450 · **HUD fijo abajo** (y 1450–1920) con hasta 3 medidores de aguja · modelos 3D en **cel-shading** (3 niveles duros: luz, base y sombra con semitono de puntos a 45°, contornos negros y divisiones visibles) · **modelo paramétrico** (toroide, esfera, columna o superficie) que se deforma con los medidores · movimiento con `cubic-bezier(0.22, 1, 0.36, 1)` y **sin rebotes** · transición **Halftone Wipe** (círculos de semitono que crecen hasta cubrir la pantalla). Cuando un medidor cambia, **en el mismo fotograma** se mueven la aguja, el número, el borde (lima 6 px; los inactivos quedan a 2 px y opacidad 0,4) y el modelo.

En tu guion no cambia nada: sigues usando los bloques `[ESCENA N | inicio-fin | MODO: SVG|3D]`. Si quieres que un medidor mande en el modelo, pídelo en «Visual» (por ejemplo: «un toroide que se deforma con ÁREA, UBICACIÓN y DEMANDA»). **🧪 Cargar ejemplo** carga el ejemplo retro cuando tienes esa paleta elegida. Terminal: `npm run anim:ejemplo -- --paleta=retro`.

**Costo en dólares:** mientras escribes ves **«Costo estimado de este video: $0.0000 USD»** (cuenta los bloques `[ESCENA]` y los caracteres; es una estimación). Al terminar de generar ves el **costo real** con 5 decimales, calculado con los `prompt_tokens` y `completion_tokens` que devuelve OpenAI × el precio del modelo.

**Cómo se calculan los tiempos:** un parser local (sin IA, sin costo) lee `inicio-fin` de cada bloque; **fotogramas = segundos × 60**. Entiende `0s-4s`, `4-9`, `00:09-00:15`, y avisa de huecos, solapes o escenas demasiado cortas.

**Después de generar:** 👁️ *Ver capturas + control de calidad* (una captura por escena, márgenes ≥ 80 px, sin escenas vacías ni congeladas) → 🎬 *Renderizar video* (1080×1920, 60 fps; las escenas 3D tardan más) → ⬇️ descargar. Cada generación queda en el **Historial** (con su costo) para recargarla.

**Terminal:** `npm run anim:ejemplo` (carga el ejemplo sin IA) · `npm run anim:generar -- --guion=mi.txt --modelo=gpt-4.1-mini --sfx=si --paleta=imnoba` · `npm run anim:previa -- --qa` · `npm run anim:render` · `npm run anim:prueba` (80 pruebas con OpenAI simulado). Salida: `trabajo/salida/video-animacion.mp4`.

**3D y tu equipo:** WebGL necesita GPU o su emulación por software. En Windows/Mac se usa lo que haya; en Linux sin GPU el sistema usa `swangle` automáticamente. Puedes forzarlo con la variable `VIDEMED_GL` (`angle`, `swangle`, `egl`…). El render 3D por software es más lento (≈ 10 min para 28 s con 3 hilos).

> El flujo anterior (nichos médico/inmobiliario con voz, subtítulos y fotos) sigue disponible en **🎬 Modo clásico**.

---

## 2. El panel web, paso a paso

El panel es una página local (solo accesible desde tu equipo). Arriba siempre ves el **trabajo en curso** (con barra de progreso); al pulsarlo se abre el **registro** en vivo, y puedes **cancelar** (lo ya renderizado se conserva).

### 🎬 Proyectos (inicio)
Tus videos con su avance (6 barritas: guion · voz · escenas · calidad · video · entrega). Desde aquí: **Nuevo video**, abrir, borrar, copiar un **ejemplo** (datos ficticios) o **restaurar un video anterior**.

### 📝 Paso 1 · Datos
Formulario propio del nicho (se **guarda solo**):
- **Medicina:** tema, especialidad, público, enfoque.
- **Inmobiliario:** operación (venta/arriendo/preventa), tipo (apartamento, casa, lote, local, finca, **carro, camioneta, moto**…), ubicación, **precio en pesos** (ej. `520000000`), estrato, habitaciones, baños, parqueaderos, área m², comodidades, puntos fuertes, qué hay cerca, **rentabilidad y valorización estimadas** (opcionales) y contacto. Si eliges *Carro*, el formulario cambia y pide marca, modelo, año, kilometraje, combustible y transmisión.
- **Marca y estilo:** nombre, etiqueta de la pastilla superior, paleta (6 + la nueva *Colombia*), **transición entre escenas** (zoom, fundido, deslizar, cortinilla, giro, reloj — con `@remotion/transitions`), contacto.
- **Fotos, logo y música:** arrastra tus fotos (jpg/png/webp), un archivo «logo…» y, si quieres, un mp3. Pon una descripción a cada foto («Sala con balcón») y ordénalas con ↑↓. Sin fotos el video usa dibujos vectoriales.

### ✍️ Paso 2 · Guion
- **✨ Con IA (OpenAI):** escribe el guion con el estilo del nicho, un **segundo modelo-revisor** lo contrasta (revisor médico, o verificador de datos y publicidad en inmobiliario) y te muestra la **tabla de afirmaciones con su certeza**.
- **🆓 Plantilla gratuita (inmobiliario):** guion determinista que usa **solo tus datos** (no inventa nada).
- **✍️ Escribirlo tú:** pega o escribe directamente.
- Puedes pedir cambios («hazlo más corto») y editar el texto. **Nada avanza hasta que pulsas «Aprobar guion»** (regla del proyecto: ninguna persona deja de leerlo).
- Rango de palabras: medicina 85–110, inmobiliario 70–100 (≈ 35 s).

### 🎙️ Paso 3 · Voz
Dos modos:
| Modo | Qué usa | Costo |
|---|---|---|
| 🧪 **Desarrollo** | **edge-tts** (voz neuronal de Microsoft). `medicina-ar` → `es-AR-TomasNeural`; `inmobiliario-co` → `es-CO-GonzaloNeural` (o `es-CO-SalomeNeural`). También México, España. | **$0** |
| 🎙️ **Producción** | **OpenAI**: `gpt-4o-mini-tts` con la entonación del nicho en `instructions` («ritmo ágil, cálido y claro; acento argentino» / «acento colombiano comercial y confiable») y luego `whisper-1` (`verbose_json`, `timestamp_granularities: ["word"]`) para el tiempo de cada palabra. **O ElevenLabs** `/with-timestamps` (el plan gratuito sirve). | según tu plan |

Los tiempos por palabra se alinean con las palabras del **guion original** (tolera erratas o palabras que la transcripción no oyó), se guardan en `src/data/timestamps.json` y la voz queda en `public/audios/voz.mp3`. Puedes **escucharla** en el panel.

### 🎞️ Paso 4 · Escenas
Tres formas de diseñarlas:
1. **✨ Con IA:** el modelo devuelve el plan con **Structured Outputs** (`json_schema` estricto: no puede inventar tipos ni propiedades); un **validador** mide márgenes ≥ 80 px, solapes, anclas inexistentes, escenas vacías, símbolos que la tipografía no tiene…; lo repara hasta 4 rondas y un **modelo con visión** revisa capturas reales.
2. **🆓 Plantilla (inmobiliario):** gancho → presentación → recorrido con tus fotos → ficha → ubicación → inversión → precio → cierre con contacto. Si con la voz real una escena dura < 2 s, se **fusiona sola** con su vecina.
3. **📋 Pegar un plan JSON** (diseñado por ChatGPT/Claude): se limpia, valida y activa.

Aquí también: **✔ Validar**, **📸 Ver capturas** (una por escena) y **🎛 Abrir Remotion Studio** para ver el video en vivo.

### 🔎 Paso 5 · Calidad
Control automático (≈ 1 min): márgenes de 80 px medidos en el DOM real, solapes con los subtítulos (y 1450–1680) y el encabezado, pantallas vacías y tramos sin movimiento de más de 2 s. Te muestra los problemas con el segundo exacto y las 4 capturas clave (frames 60, 300, 600, 900).

### 🎬 Paso 6 · Video
Render robusto y **reanudable** (si se corta, vuelve a pulsar y sigue donde quedó). Elige hilos (1 = seguro; 4 si tienes ≥ 8 GB libres: en un equipo de 4 núcleos un video de 36 s tarda ≈ 4–5 min; con 1 hilo ≈ 25 min). Audio: voz + ambiente + música (si hay) + efectos.

### 📦 Paso 7 · Entrega
Reproductor, **descarga** del `.mp4` y la portada, **texto del post** editable (5 hashtags) con botón copiar, y copia de seguridad en `trabajo/archivo/<id>/`.

### 🚀 Producir todo
El botón naranja de arriba ejecuta en cadena **solo lo que falta**: voz → escenas → calidad → render → entrega (siempre exige guion aprobado).

### ⚙️ Ajustes
Claves (OpenAI, ElevenLabs) con **botón «Probar conexión»**, modelos, y el **estado de tu equipo** (Python, edge-tts, navegador de render, memoria, efectos de sonido, internet). Las claves se guardan en `.env` y **nunca** vuelven a mostrarse completas.

### 📘 Guía
Esta guía y el resto de documentos, dentro del panel.

---

## 3. Lo que se agregó (y dónde está)

| Pedido | Dónde quedó |
|---|---|
| Íconos pro | `healthicons-react` (48 íconos de salud: `hi-corazon`, `hi-pulmones`, `hi-adn`…) y `lucide-react` (64 de inmobiliaria/autos/finanzas: `lu-casa`, `lu-llave`, `lu-velocimetro`, `lu-tendencia-alza`…). Lista en `src/dsl/iconos-pro.json`; `npm run iconos` la sincroniza con el catálogo de la IA. Se usan con el elemento `icono` (y en fichas/CTA). |
| `@remotion/shapes`, `@remotion/paths`, `@remotion/transitions` | Formas `estrella`, `hexagono`, `triangulo`, `pastel` (gráfico circular que se llena); trazos de nervios/arterias con **`evolvePath`**; transiciones entre escenas elegibles por marca. |
| `<SoundEffect />` | `src/components/SoundEffect.tsx`: `type="pop" \| "whoosh" \| "heartbeat" \| "cash"` (+ tick, thud, zap, ding), por defecto **`volume={0.15}`**, sincronizado con el frame de entrada de cada elemento. Los efectos viven en `public/sfx/` y **si faltan se sintetizan solos** (`npm run sfx`, sin licencias). El render mezcla exactamente la misma lista. |
| Voz híbrida dev/prod | `scripts/generar-voz.mjs --mode=dev\|prod` (+ `--proveedor openai\|elevenlabs`), módulos en `scripts/voz/`. |
| Perfiles `niche` | `perfiles/medicina-ar/` y `perfiles/inmobiliario-co/` (prompts, voces, paleta, campos del formulario). `medicina` sigue funcionando como alias. |
| Modo híbrido fotos + vectores | Fotos de `public/fotos/` (o de la carpeta del proyecto), Ken Burns 1.0 → 1.12, cristal esmerilado (`src/dsl/vidrio.tsx`). |
| Generación con OpenAI Structured Outputs | `scripts/ia/agente.mjs` (el motor) y `scripts/crear-video.mjs` (entrada simple: tema **o datos del inmueble**). |
| QA visual obligatorio | `npm run qa` (4 capturas clave + medidas reales) y botón «Calidad» del panel. `producir` se detiene si hay problemas. |

> ℹ️ Los scripts son **`.mjs`** (JavaScript moderno de Node, sin compilar) en vez de `.ts`: hacen exactamente lo pedido (`generar-voz.mjs`, `crear-video.mjs`) y funcionan con solo `node`, sin instalar un ejecutor de TypeScript. El código de los videos (`src/`) sí es TypeScript.

---

## 4. Usarlo desde la terminal (equivalente al panel)

```bash
# Asistente por preguntas (crea proyectos/<id>/brief.json y lo genera)
npm run crear

# Un comando: nicho + tema o datos
npm run crear-video -- --niche medicina-ar "Por qué la insulina baja el azúcar"
npm run crear-video -- --niche inmobiliario-co --fotos ~/mis-fotos \
   --datos '{"tipo":"Apartamento","ubicacion":"Chapinero, Bogotá","precio":520000000,"dormitorios":3,"banos":2,"supTotal":112,"puntosFuertes":["terraza con vista a los cerros"],"whatsapp":"300 555 0100"}'
npm run crear-video -- --niche inmobiliario-co --datos datos.json --sin-api   # inmobiliario SIN IA (plantilla gratuita)

# Por pasos
npm run voz                         # voz de desarrollo (gratis) del guion de src/data/guion.txt
npm run voz:prod                    # voz de producción (OpenAI o ElevenLabs según tus claves)
npm run voz -- --perfil inmobiliario-co --voz co-f
npm run ia -- --nicho inmobiliario-co --brief proyectos/mi-apto     # guion + escenas con IA
npm run plantilla -- proyectos/mi-apto                              # guion + escenas SIN IA
npm run ia:validar && npm run ia:capturas                           # revisar el plan y ver capturas
npm run qa                          # control de calidad
npm run build                       # render (reanudable)
npm run entregables                 # portada + texto del post + copia en trabajo/archivo/
npm run producir -- --sin-voz       # QA → render → entregables en cadena
npm start                           # Remotion Studio para previsualizar
```

**Un proyecto de usuario** vive en `proyectos/<id>/`: `brief.json` (los datos) y `media/` (fotos y logo). Un ejemplo completo: `ejemplos/inmobiliario-co-apartamento/` (datos ficticios, ilustraciones en vez de fotos; su `meta.json` indica que los tiempos son simulados: genera la voz real con `npm run voz`).

---

## 5. Cómo se ve el flujo por dentro

```
brief.json ──► guion (IA + revisor, o plantilla, o a mano) ──► TU visto bueno
           ──► voz (edge-tts | OpenAI tts+whisper | ElevenLabs) ──► timestamps.json (palabra → segundo)
           ──► plan.json (escenas atadas a palabras) ──► validador ──► capturas
           ──► QA (márgenes, solapes, movimiento) ──► render (Remotion) ──► video + portada + post
```

Colores semánticos (los nombres del plan son *roles*; cada nicho les da su tono): `rojo` = alerta/pin, `azul` = flujo/receptores o rentabilidad, `amarillo` = señal/ATP o precio/CTA, `hueso` = estructura/texto.

---

## 6. Problemas frecuentes

| Síntoma | Qué hacer |
|---|---|
| «No se pudo generar el audio» (modo dev) | Necesita internet y Python 3. Revisa Ajustes → «Tu equipo». |
| «Falta OPENAI_API_KEY / ELEVENLABS_API_KEY» | Ponla en ⚙️ Ajustes y pulsa «Probar conexión». |
| El guion con IA está bloqueado 🔒 | Sin clave de OpenAI: usa la plantilla (inmobiliario) o escríbelo tú. |
| «Solo pude emparejar el X % de las palabras» | La voz dijo algo distinto del guion (rarísimo): repite la síntesis; evita cifras en dígitos (escríbelas con letras). |
| QA: «margen» en un subtítulo | Ya se ajusta solo el tamaño con palabras largas; si ocurre, avisa. |
| Render lento / «Memoria insuficiente» | Usa 1 hilo, cierra el navegador/WSL; el render es reanudable. |
| «Target closed» | Había dos renders/QA a la vez (el panel lo impide; en terminal lanza uno solo). |
| Chrome no se descarga (red restringida) | El sistema usa automáticamente Chrome/Chromium instalado (o define `BROWSER_EXECUTABLE`). |
| Escenas < 2 s | La plantilla las fusiona sola; con IA, el validador pide arreglo. |

---

## 7. Ética y seguridad

- **Medicina:** la verificación médica la produce un modelo: **una persona con criterio médico debe leer el guion y la tabla de certeza antes de publicar**. Es divulgación, no consejo clínico.
- **Inmobiliario/vehículos:** el video usa **solo los datos que escribes**. Rentabilidad y valorización salen siempre como *estimadas* y solo si tú las das. Sin lenguaje discriminatorio ni promesas de ganancia (lo revisa el verificador).
- **Claves:** `.env` es secreto (está en `.gitignore`). El panel solo escucha en `127.0.0.1`, rechaza peticiones de otros sitios y nunca devuelve una clave completa.
- **Fotos:** usa imágenes que tengas derecho a publicar.

---

## 8. Verificación (qué se probó y qué no)

- ✅ `npm run test` = chequeo de tipos + **72 pruebas automáticas** sin gastar nada (servidores simulados de OpenAI y ElevenLabs): perfiles, íconos, alineación de voz, voz de producción, plantilla colombiana, agente con brief, API y seguridad del panel, y las 18 pruebas del agente.
- ✅ Un video completo de ejemplo (`inmobiliario-co`) se **renderizó de punta a punta** desde el panel: 1080×1920, 60 fps, H.264 + AAC, con QA en verde.
- ⚠️ **No se pudo probar con claves reales ni con edge-tts** (el entorno de desarrollo no tenía internet hacia esos servicios). Los formatos de OpenAI y ElevenLabs siguen su documentación y se probaron contra simuladores; **la primera vez en tu PC** usa ⚙️ Ajustes → «Probar conexión» y `npm run ia:diagnostico`.
