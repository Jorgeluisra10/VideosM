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

1. **Caja de texto: tu idea en UNA frase** (ver «Una frase → video» más abajo). Si prefieres controlar cada escena, en «Avanzado» puedes pegar un guion en bloques:
   ```
   [ESCENA 1 | 0s-7s | MODO: SVG]
   VOZ_OFF: lo que tú grabas (no se dibuja).
   DIRECCION_VISUAL: composición central: una esfera roja que late. Titular "BOGOTÁ ESTÁ ATRAPADA".
   SFX: whoosh, pop

   [ESCENA 2 | 7s-14s | MODO: 3D]
   VOZ_OFF: …
   DIRECCION_VISUAL: …
   ```
   `MODO: SVG` = diseño plano con volumen (halftone, brillo, reflejo). `MODO: 3D` = lo mismo con una cámara orbital suave en perspectiva. Si tu guion está desordenado, pulsa **📋 Copiar Prompt Formateador**, pégalo en ChatGPT/Claude con tu texto y vuelve a pegar aquí el resultado. **🧪 Cargar ejemplo** te deja probar sin escribir nada.
2. **Modelo de IA** (con sus precios): `gpt-4.1-mini` (Recomendado calidad/precio), `o4-mini` (máxima precisión 3D y geometría), `gpt-4o-mini` (ultra económico), `gpt-4.1-nano` (mínimo costo: $0.10 / $0.40 por millón), `gpt-4.1` (Estudio Pro). Con el motor de estudio funcionan **todos** igual de bien, porque la IA solo elige entre opciones cerradas.
3. **Incluir sonido (efectos + música): Sí / No.** No = el video sale **sin pista de audio** (ni efectos ni música). Sí = efectos sincronizados con cada animación y, en el motor viral, una música sintética de fondo en bucle.
4. **Paleta:** *IMNOBA (Colores oficiales de marca)* o *Medicina Clínica*.

### 🎥 Una frase → video (motor viral) — el formato por defecto

Ya no hace falta escribir escenas: **escribes UNA frase con lo que quieres del video** y la IA hace el resto en una sola llamada barata (JSON compacto): escribe el guion con la locución de cada escena, decide la duración y elige entre **30 plantillas de reel profesional**, que el motor (`src/viral/`) dibuja siempre limpias, sin encimar nada y dentro de la zona segura de Instagram/TikTok.

> *Un video de 35 segundos para IMNOBA: por qué el metro de Bogotá valoriza las propiedades cercanas a las estaciones, y que publiquen gratis su inmueble.*

- **Sin límite de caracteres:** la idea puede ser una frase o **todo el detalle que quieras** (puntos, cifras, nombres, tono, llamada a la acción; se conservan tus saltos de línea y viñetas). Si la idea es detallada, la IA recibe la orden de cubrir **todos** sus puntos, una escena por punto principal, con tus cifras y nombres tal cual. Cuanto más texto, más entrada para la IA (el costo estimado en pantalla lo refleja; sigue siendo de centavos).
- **Duración:** si dices «de 30 segundos», «de 2 minutos» o «el video dura 90 segundos» se respeta (15–180 s). Si no la dices, una idea corta dura ≈ 32 s con una escena cada ≈ 3,6 s, y una idea detallada **alarga el video solo** (+1 s por cada ≈ 55 caracteres a partir de 400, hasta 90 s y ≈ 25 escenas) para que quepa todo. Un «5 minutos» que sea un dato del tema no se confunde con la duración: solo cuenta si va junto a «video», «reel», «dura»… Un video largo tarda más en renderizar (≈ 16 min por cada 37 s en un equipo justo).
- **Plantillas:** `HOOK` (gancho cinético gigante con la palabra clave en caja de color) · `NUM` (número gigante que cuenta con anillo y chispas) · `VS` (comparación con contadores y corona al ganador) · `BARS` (barras que crecen con flecha de tendencia) · `LINE` (línea con brillo que se dibuja y burbuja de resultado) · `STEPS` (causa → efecto con iconos) · `LIST` (beneficios con check) · `ROUTE` (ruta de metro: un tren recorre las estaciones) · `SKYLINE` (ciudad que crece con flecha de valorización) · `DONUT` (reparto de un total con leyenda) · `PICTO` («7 de cada 10» con iconos que se encienden) · `TOP` (ranking que se revela del último al primero) · `MITO` (mito tachado vs. realidad) · `CTA` (cierre con logo de IMNOBA y llamada a la acción). Ejemplos: `npm run anim:ejemplo` (metro de Bogotá) y `node scripts/anim/ejemplo.mjs --tema=carros` (errores al vender tu carro).
- **Plantillas documentales (ciencia, naturaleza, tecnología — estilo «video científico viral»):** `ZOOM` (viaje de escala sin cortes: anillos de potencia de diez que se abren, elementos que crecen y el recuadro **ANCHO DEL CUADRO** con su barra de escala amarilla en vivo; la cámara se frena junto a cada elemento) · `CAPAS` (disco que gira en perspectiva y se separa en capas, con líneas guía y cota) · `MIRA` (mira telescópica roja que se cierra sobre un objeto diminuto, se vuelve azul al fijarlo, lo mide con una cota y se acerca) · `IMPACTO` (objeto que cae con estela de copias, se estrella soltando fragmentos poligonales, polvo y ondas de choque sobre la superficie lunar) · `RED` (nodos que se conectan con líneas y pulsos) · `TERMO` (termómetro que barre un rango mientras una cuadrícula de seres cambia de verde a rojo a gris al «morir») · `SPLIT` (pantalla dividida rojo vs. azul con semitono y el sujeto al centro) · `PILA` (un solo punto frente a una columna altísima de puntos que crece mientras el sujeto se aplasta debajo, con contador). Llevan **banda superior** (franja oscura con el titular y la palabra clave en color), tipografía **monoespaciada** para los datos y trama de puntos y rayado cruzado para dar volumen.
- **Extras de cualquier escena (opcionales):** `cita` pone una **ficha bibliográfica** (fondo claro, barra de color, sombra tramada) con la fuente y el año — la IA solo debe usarla con fuentes reales; **verifícalas** — y `sc` pone un **escenario ilustrado** de fondo: `espacio` (estrellas con parallax y planeta en semitono), `luna` (horizonte, cráteres y rocas con sombra dura), `bio` (musgo y gotas de agua) o `celula` (membrana y orgánulos). Al entrar o salir de un `ZOOM` (o tras una `MIRA`) la transición es un **zoom continuo** en vez del barrido diagonal.
- **Sonido:** además de los efectos de siempre hay **foley** (clics mecánicos en los contadores, golpe seco y polvo en los impactos, estática espacial, gotas de agua, ping de sonar) y una **música sintética en bucle** (synth científico a 120 BPM, volumen bajo para que no tape tu voz). Todo se sintetiza solo (`npm run sfx`) y se mezcla en el mp4. La voz sigue siendo tuya: graba el guion de locución aparte.
- Ejemplo científico: `node scripts/anim/ejemplo.mjs --tema=ciencia` (tardígrado: ZOOM, MIRA, SPLIT, TERMO, PILA, IMPACTO, CAPAS, RED y fichas de cita).
- **Ritmo viral:** fondos que alternan azul de marca / dorado `#FFC500` / blanco (nunca dos iguales seguidos), texto que entra con rebote, golpe de cámara en el gancho, zoom lento continuo, barrido diagonal entre escenas, barra de progreso arriba y SFX automáticos sincronizados con cada animación.
- **La locución te la dejamos lista:** después de generar aparece **📝 Descargar guion de locución**, con una línea por escena y su tiempo, para que grabes tu voz. ⚠️ Las cifras que la IA use son ilustrativas salvo las que tú des en la frase: verifícalas antes de publicar.
- **Costo:** entrada ≈ prompt fijo (≈ 1.080 tokens: pasa de los 1.024 que activan el caché de OpenAI) + tu frase; salida ≈ 165 tokens por escena. Un video de 35 s cuesta ≈ **$0.0032** con `gpt-4.1-mini`, ≈ **$0.0008** con `gpt-4.1-nano`, ≈ $0.0012 con `gpt-4o-mini` y ≈ $0.0157 con `gpt-4.1` (el lienzo libre costaba ≈ $0.012 con mini). Funciona igual con `gpt-4.1`, `gpt-4.1-mini`, `gpt-4.1-nano`, `gpt-4o-mini` y `o4-mini`.
- **Si ya tienes el guion en bloques** (`[ESCENA 1 | 0s-7s | MODO: SVG]` + `VOZ_OFF` + `DIRECCION_VISUAL` + `SFX`, también el formato libre) sigue funcionando: tus tiempos y tu locución se respetan y la IA solo elige la plantilla de cada escena. Está en «Avanzado».
- **🎞️ Estilo DOCUMENTAL (explicativos de ciencia y curiosidades con estudios citados) — elige la paleta «Retro-Científica · estilo documental»:** copia el estilo y la estructura de los videos de referencia (el de las conchas de Raup y el del portero en el penal). Fondo negro mate `#0B0C10` plano (o **papel crema** `#F4F1EA` para las fichas de estudio), **rojo `#E63926` = el sujeto**, **cobalto `#2B44FF` = lo que cambia o se mueve**, **lima `#D4FF33` = datos y ejes** en letra monoespaciada, titulares en **Archivo Black** (grotesca ancha y pesada), una **línea mono que se escribe sola** (`cap`, con *énfasis* en color), **cortes secos** entre escenas y la ficha de papel que **entra deslizándose**; sin barra de progreso. Con esta paleta la IA recibe un prompt distinto que le enseña la estructura narrativa de esos videos: **afirmación que choca con la intuición → prueba visual → el estudio (autor, año, muestra exacta) → el patrón y su giro («pero…») → el concepto con nombre → por qué ocurre → segunda fuente o segunda postura → analogías de la vida diaria → pregunta final para comentar**; y le prohíbe inventar autores, años o cifras. Sin pedir duración un video documental dura ≈ 60 s (hasta 120 s con mucho detalle; se puede pedir hasta 180 s), con una escena cada ≈ 4,4 s.
- **Plantillas documentales (8):** `PAPEL` (ficha de estudio: «autor · año», rol, la cifra que cuenta como odómetro, campo de puntos —uno por caso— y sello con la muestra; sin puntos, figura grabada «FIG. 1» y datos en mono) · `PILARES` (columnas isométricas con una parte rayada «k de n» y la fracción gigante arriba) · `CICLO` (pasos que se encadenan en círculo con flechas que se dibujan; el último vuelve al primero) · `PUNCH` (una palabra que golpea la pantalla con partículas, o una pregunta cuyas letras caen) · `DUO` (dos paneles comparados, uno «se queda» y otro «se mueve», y una palabra grande que se llena según cada caso) · `OSCILO` (osciloscopio con curva lissajous, onda o espiral) · `CUBO` (cubo isométrico de posibilidades: cada punto es una opción y casi todo está vacío; los rincones donde hay algo se marcan) · `DIALES` (tres diales «3 números» que cambian y deforman una figura: espiral de concha con sombreado y costillas, u onda; encadena escenas con los mismos diales para que la figura cambie sin cortes). También funcionan con cualquier otra paleta (con IMNOBA se dibujan con sus colores).
- Ejemplos: `node scripts/anim/ejemplo.mjs --tema=conchas` (DIALES, PAPEL, OSCILO, CUBO, SPLIT, PUNCH) y `--tema=documental` (DUO, PAPEL, PILARES, CICLO, PUNCH, MITO), ambos con la paleta Retro-Científica. ⚠️ Verifica las citas y las cifras (autores, años, tamaños de muestra) antes de publicar.
- **🎬 Piezas a medida (carril B) · piloto «Metro de Bogotá».** Las plantillas sirven para series; cuando un video merece su propia idea visual, se programan **escenas a medida** (tipo `PIEZA`) y se mezclan con las plantillas. El piloto es un ensayo visual de periodismo de datos (≈ 1 min 43 s, paleta Retro-Científica): ocho millones de puntos cayendo en un solo plano, buses atrapados entre semáforos con el dial en 12 km/h, rieles de metro por ciudad (Bogotá = vacío), la carrera de 24 km (viaducto 27 min vs. superficie), 72.000 pasajeros/hora, un isométrico 3D del suelo que se valoriza alrededor de la estación (sobre papel), la curva de plusvalía, el horizonte antes/después y la balanza tiempo-suelo, con una pregunta final. **Cómo cargarlo (sin IA y sin coste):** en el Estudio pulsa **«🎬 Piezas a medida (piloto: Metro de Bogotá)»** y luego **Renderizar**; o en terminal `node scripts/anim/ejemplo.mjs --tema=metro-bogota`. La locución para grabar queda en `trabajo/salida/guion-locucion.txt`. ⚠️ Si escribes la idea en el cuadro del Estudio y pulsas «Generar», la IA te dará una versión con plantillas documentales (buena, pero **no** con las piezas a medida: la IA no dibuja escenas nuevas; esas las programa Claude Code). Verifica las cifras antes de publicar (Lima/Medellín/Quito son aproximadas; 12 km/h, 100 h/año y 20–35 % vienen de tu texto).
- **🎬 Ensayo abstracto «Anomalía» (Bogotá, ≈ 1 min 34 s).** Segunda versión del ensayo, sin ilustración literal (nada de trenes, buses, edificios ni personas): un disco de 2.400 puntos que es la ciudad, una simulación de agentes con estelas y semáforos con tres potenciómetros, seis redes de flujo frente al vacío de Bogotá, una línea que se eleva por el eje Z sobre un plano de Voronoi, un duelo estroboscópico de velocidades, un zoom hasta un metro cuadrado con el módulo «ANCHO DEL CUADRO», parcelas extruidas en isométrico sobre papel, un laboratorio con potenciómetro que dibuja la curva de valorización, metaballs que se funden y un **cierre en bucle** que regresa a la geometría del primer fotograma y deja la pregunta «¿Qué ciudad aparece?». Colores: negro `#0D0E12` / papel `#F4F1EA`, rojo `#F04124`, azul `#2B38F0`, lima `#D4FF33`. **Cargar sin IA y sin coste:** botón **«🎬 Ensayo abstracto «Anomalía» (Bogotá)»** del Estudio y luego **Renderizar**; o `node scripts/anim/ejemplo.mjs --tema=anomalia`. Guion técnico escena por escena: `ejemplos/animacion-viral/guion-tecnico-anomalia.md`; locución para grabar en `trabajo/salida/guion-locucion.txt`. Para ver y arrastrar la línea de tiempo con el código vivo: `npm start` (Remotion Studio). ⚠️ La tarjeta académica dice «BID y estudios de desarrollo urbano» sin autor ni año: ponlos en `props.fuente`/`props.anio` de `respuesta-ia-anomalia.json` cuando tengas la cita exacta.
- **🎬 Video realista «Bogotá, la ciudad sin metro» (≈ 1 min 52 s, datos verificados).** Estilo «¿sabías que?»: estudio azul marino con piso y reflejo, **figuras realistas** (bus articulado de TransMilenio, taxi y autos con luces de freno, tren de metro, torres de vidrio con ventanas encendidas, cronómetros metálicos, semáforo, personas) y rótulos grandes que cambian de frase. Cuenta: 77 años esperando un metro (1942) y la ciudad creciendo de 400.000 a casi 8 millones · 191 horas perdidas por conductor en 2019 (INRIX) · TransMilenio mueve 43.000 personas por hora pero comparte la calle · 149 km de metro en Santiago, 110 en São Paulo… y cero en Bogotá · Medellín abrió en 1995, Bogotá en 2028 (33 años) · Línea 1 elevada a 14 m · un tren = 12 buses articulados · de hasta 2 h a 27 min · +11,7 % de valor del suelo a menos de 800 m antes del primer tren · 5 min a pie = −6,8 a −9,3 % de arriendo (Rodríguez y Targa, 2004) · y la pregunta «¿cuánto vale una hora de tu vida en esta ciudad?». **Cargar sin IA y sin coste:** botón **«🎬 Video realista «Bogotá, la ciudad sin metro»»** del Estudio y luego **Renderizar**; o `node scripts/anim/ejemplo.mjs --tema=bogota-real`. Cada escena muestra la fuente de su dato; las fuentes completas y las **precauciones antes de publicar** están en `ejemplos/animacion-viral/guion-tecnico-bogota-real.md`. La locución para grabar queda en `trabajo/salida/guion-locucion.txt`.
- **Motores anteriores:** `--motor=estudio` (figuras con halftone, solo bloques) y `--motor=clasico` (la IA escribe geometría o código) siguen disponibles; el formato `[CONFIG]` + HUD no cambió. Terminal: `npm run anim:ejemplo` · `node scripts/anim/generar.mjs --guion=idea.txt`.

### 🎬 Motor de estudio (JSON ultraligero) — figuras con halftone (opcional)

Estilo geométrico minimalista de estudio (tipo Kurzgesagt / Vox): fondo oscuro con bokeh y ruido sutil, figuras con **sombreado halftone**, **brillo especular**, **sombra de piso en puntos**, **reflejo de suelo** y **estela de movimiento**. La IA **ya no escribe código ni coordenadas**: por escena devuelve un JSON de ~120 tokens y el motor prefabricado (`src/estudio/`) lo dibuja siempre limpio, sin figuras deformes ni elementos encimados.

```json
{"scenes":[{"id":1,"layout":"HERO_CENTER","headline":{"text":"BOGOTÁ ESTÁ ATRAPADA","highlightWord":"ATRAPADA"},
  "primary":{"shape":"SPHERE","colorRole":"danger","detail":"glowing_core","motionTrail":false,"animation":"heartbeat_pulse"}}]}
```

- **4 layouts** (más del 60 % del lienzo queda libre; nada se pisa; texto ≥ 80 px de los bordes): `HERO_CENTER` (titular + una figura grande) · `VERSUS_50_50` (dos columnas, contadores de 3 dígitos que suben, símbolo `> < =` con rebote, etiquetas) · `DIAGONAL_SPLIT` (diagonal a −22°: estado 1 arriba y 2 abajo, con estela y reflejo) · `SURFACE_STAGE` (una cápsula se estira y avanza como oruga sobre una barra metálica con reflejo).
- **5 figuras** (`GeometricPrimitive`): `SPHERE` (con orejas de perro o gato, rostro, abeja con rayas, células o núcleo luminoso) · `CAPSULE` · `CELLULAR_OVAL` (huevo con células de Voronoi que crecen) · `RING_GAUGE` (anillo con aguja de velocímetro o partículas) · `PILL_TOWER` (torre con ondas y destellos). Colores por **rol** (`accent`, `primary`, `danger`, `success`, `neutral`, `secondary`): salen de tu paleta (IMNOBA: fondo `#02224E`, dorado `#FFC500`).
- **La IA traduce tu `DIRECCION_VISUAL`**: «composición central» → HERO_CENTER, «comparación 50/50» → VERSUS, «pantalla dividida diagonal» → DIAGONAL, «superficie/barra/oruga» → SURFACE; el titular y los datos salen de lo que pongas **entre comillas** o de las cifras de la `VOZ_OFF`. Hay un traductor **local** con las mismas reglas (`escenaPorReglas`) que completa lo que la IA omita o escriba mal, así que **no hay reparaciones costosas**.
- **Parser intacto**: acepta exactamente `[ESCENA 1 | 0s-7s | MODO: SVG|3D]` (y el formato libre `[ESCENA 1 | 00:00-00:07]`) con `VOZ_OFF:`, `DIRECCION_VISUAL:` y `SFX:`. Los SFX son locales: los que escribas mandan; si no, se ponen automáticos según lo que aparece; con «SFX = No» no hay audio.
- **Costos** (`response_format: json_object`, 1 llamada): entrada = prompt fijo ≈ 600 tokens + tu texto + 14 por escena; salida = 120 por escena. Un video de 6 escenas cuesta ≈ **$0.0016** con `gpt-4.1-mini`, ≈ **$0.0004** con `gpt-4.1-nano` y ≈ $0.0078 con `gpt-4.1` (el lienzo libre costaba ≈ $0.012 con mini). El prompt de sistema es idéntico en cada llamada (reglas y vocabulario al principio) para aprovechar el caché de OpenAI cuando el prefijo supera los 1.024 tokens.
- **Motor clásico (opcional):** `VIDEMED_MOTOR=clasico` (o `--motor=clasico`) vuelve a los motores anteriores (la IA escribe geometría SVG/3D o código libre; cuesta unas 10× más).

### 🎨 Lienzo libre (Dirección de Arte) — motor clásico opcional

Ya no hay layout fijo: **cada escena es dueña de todo el lienzo 1080×1920** y la IA actúa como director de motion graphics que **escribe el código** de la composición (React/SVG/Three.js) usando el *Kit de Pinceles Cinematográficos*. Los títulos son parte de la animación (entran con física spring, van detrás de los objetos 3D…) y un medidor solo aparece si tu guion lo pide, como elemento flotante.

```
[ESCENA 1 | 00:00-00:05]
VOZ_OFF: Lo que tú grabas (la IA lo recibe solo como contexto de ritmo y sentido).
DIRECCION_VISUAL: Noche azul con partículas doradas. La cámara se acerca a una casa que se dibuja sola con trazo dorado; las letras «¿Y SI PUBLICAR FUERA GRATIS?» entran con spring; una anotación flotante señala el techo: «$0 COP».
SFX: whoosh, ding

[ESCENA 2 | 00:05-00:10]
VOZ_OFF: …
DIRECCION_VISUAL: …
```

- **Lo único obligatorio es el tiempo** `[ESCENA n | MM:SS-MM:SS]`. No hay `[CONFIG]`, ni `GAUGE_n`, ni `FONDO`/`MODO`. Dentro de la escena escribes con libertad: lo que no lleve clave se toma como dirección visual (también valen `GEO`, `H1`, `SUB`, `HUD (00:01-00:03): …` o cualquier `CLAVE:` en mayúsculas; se entienden como dirección).
- **SFX opcional:** si pones un nombre que no existe no pasa nada (suena `pop`, o `whoosh` si suena a movimiento). Con «SFX = No» no hay audio.
- **Kit de Pinceles** (`src/primitives/MotionKit.tsx`): `Camera2D` (zoom, paneo, giro, sacudidas de impacto) · `OrganicDrawPath` (trazos Bézier que se dibujan solos, con brillo) · `FloatingAnnotation` (punto pulsante + línea curva + tarjeta con un dato) · `Isometric3DStage` (3D con luces volumétricas, sombras suaves, flotación orgánica y cámara orbital; con `Cuerpo3D`, `Barras3D`, `Ciudad3D`) · `AmbientParticles` · `KineticText` (tipografía cinética) · `Icono` (lucide/healthicons) · helpers `entra`, `float`, `rand`, `ease`.
- **Paleta:** la IA recibe los colores con nombre y hex. IMNOBA: azul profundo `#02224E`, dorado `#FFC500`, blanco `#F8FAFC`, coral `#E63926`, esmeralda `#10B981` (más azul de apoyo y papel claro). También Medicina y las dos retro.
- **Seguridad y fiabilidad:** el código generado pasa una política (sin red, sin `window`/`document`, sin `Math.random`/`Date`, debe usar `useCurrentFrame`), se compila con esbuild, se **verifica en Chrome real** (errores de ejecución, texto fuera del lienzo, escenas vacías o congeladas) y, si algo falla, la IA lo repara (máx. 2 rondas, solo esa escena). Si aún falla, esa escena se sustituye por una versión sencilla y el video sigue; el panel te lo avisa.
- **Costo estimado:** entrada = prompt del kit + paleta + texto de dirección y voz; salida ≈ 1.300 tokens de código por escena (+70 con SFX). Se muestra antes de generar y el real (`usage`) al terminar; suma las llamadas de reparación.
- **Botones:** «📋 Copiar Prompt Formateador» copia la plantilla de Dirección de Arte Libre y «🧪 Cargar ejemplo» carga el ejemplo IMNOBA de 5 escenas (casa y auto que se dibujan, ciudad 3D, plano con anotaciones, barras 3D, remate). Los formatos HUD retro y simple siguen en «Otros formatos». Terminal: `npm run anim:ejemplo` · `npm run anim:generar -- --guion=mi.txt`.

### 🧪 Estilo Retro-Científica (cuarto control: paleta)

En **4 · Paleta** hay dos opciones extra que cambian TODO el lenguaje visual (IMNOBA y Medicina siguen igual y IMNOBA sigue siendo la predeterminada):

| Paleta | Colores |
|---|---|
| **Retro-Científica (hex del brief)** | fondo `#0B0C10` · papel `#F4F1EA` · rojo bermellón `#E63926` (objeto de estudio) · luz `#FF9E8A` · lima `#D4FF33` (telemetría) · cobalto `#2B44FF` (anomalías) |
| **Retro-Científica IMNOBA (esencia de marca)** | mismo diseño con el navy `#02224E` de fondo, el amarillo `#FFC500` como objeto de estudio y un azul claro de telemetría (el lima chocaría con el amarillo) |

Qué cambia al elegirla: **título H1** en Inter Black, MAYÚSCULAS, centrado en Y = 180 · **subtítulo tipo terminal** (JetBrains Mono, se escribe carácter a carácter a 30 ms con un bloque que parpadea cada 250 ms) · **escenario central** en y 350–1450 · **HUD fijo abajo** (y 1450–1920) con hasta 3 medidores de aguja · modelos 3D en **cel-shading** (3 niveles duros: luz, base y sombra con semitono de puntos a 45°, contornos negros y divisiones visibles) · **modelo paramétrico** (toroide, esfera, columna o superficie) que se deforma con los medidores · movimiento con `cubic-bezier(0.22, 1, 0.36, 1)` y **sin rebotes** · transición **Halftone Wipe** (círculos de semitono que crecen hasta cubrir la pantalla). Cuando un medidor cambia, **en el mismo fotograma** se mueven la aguja, el número, el borde (lima 6 px; los inactivos quedan a 2 px y opacidad 0,4) y el modelo.

En tu guion no cambia nada: sigues usando los bloques `[ESCENA N | inicio-fin | MODO: SVG|3D]`. Si quieres que un medidor mande en el modelo, pídelo en «Visual» (por ejemplo: «un toroide que se deforma con ÁREA, UBICACIÓN y DEMANDA»). **🧪 Cargar ejemplo** carga el ejemplo retro cuando tienes esa paleta elegida. Terminal: `npm run anim:ejemplo -- --formato=hud --paleta=retro`.

### 🧾 Formato estructurado (`[CONFIG]` + `FONDO` + `GEO` + `HUD`) — el más barato

Además del formato simple, el cuadro de texto entiende un formato estructurado pensado para el estilo Retro-Científico. **Solo las líneas `GEO` (y el modo) se envían a la IA**; título, subtítulo, HUD, fondo, sonido y tu locución se resuelven en tu equipo, sin gasto de API. Se detecta solo (por `[CONFIG]` o por `FONDO:` en la cabecera) y usa siempre el diseño retro: si tenías IMNOBA se aplica *Retro-Científica IMNOBA*, y si tenías Medicina, *Retro-Científica*.

```
[CONFIG]
DURACION: 00:22
HUD: ON
GAUGE_1: ÁREA | 30-120 | m²
GAUGE_2: PRECIO/M² | 2-8 | M
GAUGE_3: VALOR | 60-700 | M

[ESCENA 1 | 00:00-00:05 | FONDO: dark | MODO: SVG]
H1: EL VALOR DE UN INMUEBLE
SUB: > MODELO: V = ÁREA × PRECIO/M²
VOZ_OFF: Lo que tú grabas (no se dibuja ni se envía a la IA).
GEO (00:00-00:03): Ejes punteados y una curva roja que sube.
HUD (00:01-00:03): G1=90 | G2=- | G3=-
SFX (00:04): ding
```

| Línea | Qué hace |
|---|---|
| `[CONFIG]` | `DURACION`, `HUD: ON/OFF` y hasta 3 medidores `GAUGE_n: NOMBRE \| mínimo-máximo \| unidad` |
| `[ESCENA n \| MM:SS-MM:SS \| FONDO: dark/paper \| MODO: SVG/3D/3D+SVG]` | tiempos, fondo (negro mate o papel técnico) y modo; `3D+SVG` = 3D con capa vectorial completa |
| `H1` / `SUB` | título en MAYÚSCULAS y línea de terminal (se escribe sola con cursor) |
| `VOZ_OFF` | tu locución: se guarda en `trabajo/salida/guion-locucion.txt` (botón de descarga en el Estudio) |
| `GEO (MM:SS-MM:SS)` | lo que la IA dibuja en el escenario central (una o varias líneas por escena) |
| `HUD (MM:SS-MM:SS)` | a qué valor va cada aguja en esa ventana (`G1=75 \| G2=- \| G3=40`; `-` la deja quieta) |
| `SFX (MM:SS)` | efectos: pop, whoosh, heartbeat, cash, tick, thud, zap, ding |

Con **`HUD: OFF`** desaparece el panel de medidores y el escenario crece hasta y 1800. El botón **📋 Copiar Prompt Formateador** copia esta plantilla (y **📋 Formato simple** la de siempre). **Costo estimado** de este formato: entrada = caracteres GEO ÷ 4 + prompt de sistema compacto (+ el esquema, que OpenAI también cuenta) y salida = 450 tokens por línea GEO; el costo real sale de `usage`. En el ejemplo (5 líneas GEO) ronda $0.007 con `gpt-4.1-mini`, frente a ≈ $0.014 del formato simple retro. Terminal: `npm run anim:ejemplo -- --formato=hud --paleta=retro`.

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
| El render termina con `ENOSPC: no space left on device` | Se llenó el disco. Desde ahora el render **codifica cada trozo de 5 s y borra sus fotogramas enseguida** (pico ≈ 0,2 GB; antes guardaba todos), mide el espacio antes de empezar y borra temporales viejos si falta. Si aun así no cabe: `npm run limpiar` (borra temporales y renders cortados; `-- --ver` solo muestra cuánto ocupan), vacía la Papelera y los archivos temporales de Windows, o mueve la carpeta del proyecto a otro disco. Lo ya renderizado se conserva: al volver a lanzar el render sigue donde quedó. |
| Hice `git pull` y el panel sigue igual, o muestra un error como «No encuentro ningún bloque… (o MODO: 3D)» | Estás con el código VIEJO: o el `git pull` se negó (hay cambios locales, casi siempre `src/data/animacion.json`) o el panel quedó abierto con la versión anterior en memoria. Ejecuta **`npm run actualizar`** (guarda tus cambios locales en un stash, trae lo último e instala dependencias), cierra el panel con Ctrl+C, vuelve a lanzar **`npm run panel`** y recarga con **Ctrl+F5**. El panel también te avisa con una franja roja si detecta que el código cambió con él abierto. |
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
