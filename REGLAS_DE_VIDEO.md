# REGLAS DE VIDEO (leer SIEMPRE antes de crear un video)

## Contexto
Hago videos verticales diarios para Instagram y TikTok sobre Imnoba (plataforma de propiedades y
vehículos en Colombia, con alianzas en Florida). Objetivo de cada video: que lo vean completo, lo
guarden y lo compartan, y que hagan una acción concreta que defino en cada pedido.
Idioma: español colombiano neutro. Tono: cercano, seguro, sin sonar a anuncio.
Di "propiedad o vehículo", nunca "casa o carro". No prometas ganancias ni rentabilidades.
No des asesoría legal ni fiscal; solo información general.

## Reparto de trabajo
Yo te doy un TEMA. Tú decides todo lo creativo: ángulo, gancho, guion, escenas, animación, música
y efectos. No me hagas preguntas salvo que falte algo imprescindible; si dudas, decide y dime qué
decidiste.

## Antes de crear
1. Propón 3 ganchos distintos (máx. 12 palabras) y elige el mejor, con una línea de motivo.
2. Escribe el guion para el oído: frases de 8 a 14 palabras, números y precios con letras.
3. Divide en escenas: qué se ve, qué se dice, cuánto dura, qué animación y qué sonido lleva.

## Estructura viral obligatoria
- 0–2 s GANCHO: afirmación, pregunta o dato que obligue a quedarse. Nunca empieces con "Hola" ni
  presentaciones. Texto grande en pantalla a la vez que se dice.
- 2–8 s PROMESA o TENSIÓN: por qué vale la pena seguir viendo.
- CUERPO: un cambio visual cada 2–3 segundos (corte, zoom, movimiento, texto nuevo).
- Un solo mensaje por video, máximo 3 ideas.
- Dato o giro más fuerte cerca del final.
- CIERRE (últimos 2–3 s): una sola llamada a la acción y un final que invite a repetir o que
  conecte con el inicio (loop).
- Duración: 20 a 35 s, salvo que pida otra.

## Calidad visual
- 1080x1920 (9:16). *En este sistema se renderiza a 60 fps (el motor es así; sirve igual en
  Instagram y TikTok y se ve más fluido). No lo cambies.*
- Zonas seguras: nada importante en el 12 % superior ni en el 20 % inferior; márgenes laterales
  de al menos 6 %. *El motor reserva y = 220…1640 y x = 120…960 (11,5 % arriba, 14,6 % abajo):
  es más permisivo que esta regla, así que la revisión de fotogramas marca con líneas amarillas
  las zonas de ESTA regla y lo que pase de ellas se corrige.*
- Animaciones fluidas con intención: easing suave, zoom o paneo lento sobre imágenes, parallax con
  capas, texto que entra palabra por palabra o línea por línea, transiciones limpias. Nada que
  parpadee, tiemble o se solape.
- Estilo realista y cinematográfico: iluminación, profundidad, sombras suaves, paleta coherente.
  Prohibido el aspecto de plantilla genérica.
- Marca: azul marino y dorado, fuente Inter. Logo solo en el cierre. *(Paleta `imnoba`; el logo lo
  dibuja la escena CTA, así que solo en el cierre.)*
- Subtítulos grandes, alto contraste, sincronizados con la voz, máx. 2 líneas y 5–6 palabras por
  línea, con la palabra clave resaltada en dorado. *En este sistema el motor viral NO genera
  subtítulos palabra por palabra: el texto grande de cada escena (que sale de la misma frase que se
  dice, máx. 2 líneas, 5–6 palabras por línea, palabra clave en dorado) hace de subtítulo. Si el
  pedido exige subtítulos sincronizados palabra por palabra, avísame: hoy no existen.*
- Imágenes de propiedades o vehículos: solo fotos reales que yo entregue. Nunca inventes con IA una
  propiedad, un vehículo, una persona real ni un dato. *El motor viral dibuja con vectores y no
  incorpora fotos todavía: si el pedido trae fotos, dime que no se pueden usar y decide qué hacer
  con ilustración vectorial; nunca generes imágenes falsas de propiedades, vehículos o personas.*

## Audio
- Tú agregas música de fondo y efectos de sonido. Hazlo con criterio: la música acompaña y no compite.
- Solo música y efectos libres de derechos o creados por ti. Nunca uses canciones comerciales. Si no
  hay música libre disponible en `assets/musica/`, avísame y propón cómo conseguirla. *Mientras tanto
  se usa la música sintetizada del proyecto (la crea el sistema, es libre de derechos).*
- Música: energía acorde al tema, sin letra, volumen bajo (aprox. -22 a -26 dB bajo la voz) y con
  ducking automático mientras habla la voz. Entra suave y sale con fade de 1 s. *(Medido: el mezclador
  la deja ≈ −24 dB bajo la voz mientras habla y la nivela sea cual sea la pista; entra con fundido de
  1,2 s y sale con 1,6 s.)*
- Efectos: pocos y sutiles (whoosh en transiciones, un "ding" suave al dato clave). Nunca saturar.
- La VOZ va siempre en su propia pista separada y el campo de la voz debe quedar LIBRE y editable:
  yo puedo dejar la voz IA o reemplazarla por una grabación mía sin romper el resto. Mantén la
  sincronía de subtítulos ligada al audio de voz, que se recalcule si cambio la voz. *(La voz es una
  pista aparte colocada en el tiempo de cada escena: `trabajo/anim/voz/voz-mezcla.wav`. Para
  reemplazarla por tu grabación: `node scripts/anim/voz-externa.mjs --audio=mi-voz.mp3` ajusta las
  escenas a tu voz; `--deshacer` vuelve a la voz IA. También desde el Estudio → «Voz en off» → «Mi voz».)*
- Mezcla final a -14 LUFS, sin recortes ni clics. 0,3 s de silencio al inicio y 0,5 s al final.
  *(Con voz generada, el render lleva la mezcla a −14 LUFS; `revisar-video.mjs` mide volumen, pico,
  recortes y los silencios de la voz al inicio y al final. Un video SIN voz no se normaliza —solo
  lleva música y efectos— y sale a ≈ −28 LUFS: no lo publiques así; agrégale la voz («Ponerla al video
  ya renderizado», que sí normaliza) o avísame.)*
- Exporta además la voz sola (.wav) y la mezcla de música y efectos sola, por si quiero reeditar.
  *(Al renderizar quedan en `trabajo/salida/stems/`: `voz.wav` y `musica-y-efectos.wav`.)*

## Voz
- Usa la configuración de voz del proyecto (locutora joven colombiana, alegre) por defecto.
  *(`voz.config.json`; se cambia en el Laboratorio de voz, `#/voz`. Requiere `OPENAI_API_KEY`; sin ella
  entrega el video sin voz con el guion de locución listo en `trabajo/salida/guion-locucion.txt`.)*

## Revisión obligatoria antes de entregar
1. Renderiza el video completo.
2. Extrae al menos 8 fotogramas (inicio, gancho, cada cambio de escena, cierre) y míralos.
3. Verifica: texto cortado o fuera de zona segura, superposiciones, subtítulos desfasados, imágenes
   pixeladas o mal centradas, picos de volumen, música que tapa la voz, datos incorrectos.
4. Corrige y vuelve a renderizar hasta que esté bien. Si algo no se pudo resolver, dímelo claro.

## Qué me entregas siempre
1. Ruta del video final.
2. Guion final.
3. Los 3 ganchos propuestos y cuál elegiste.
4. Texto para publicar: descripción corta y 5 hashtags.
5. Una nota de 2 líneas: qué esperas que haga bien y qué métrica mirar.
6. Si hay panel de videos, registra el video con estado "grabado".

## Aprendizaje
Cuando yo te diga "guarda esto", agrega la lección al final de este archivo en la sección
"LECCIONES" con fecha. Lee esa sección antes de cada video.

---

# CÓMO SE HACE EN ESTE SISTEMA (receta técnica; no cambiarla sin avisar)

El sistema es VideMed (Remotion + Node, todo local). **Tú eres el director y el modelo**: no hace
falta la API de OpenAI para crear el video (solo para la voz). Detalle del motor: `AGENTS.md`
(«Viral…»), `GUIA.md`. No rompas el flujo existente: el Estudio del panel, el modo clásico y los
ejemplos siguen funcionando igual.

## 0 · Antes de empezar
1. Lee la sección LECCIONES (abajo) y `PEDIDO_VIDEO.md` (la plantilla del pedido).
2. Mira `data/videos.json` (el Panel de Videos) para **no repetir temas ni ángulos de los últimos 60
   días** (`#/videos/nueva` avisa si hay uno parecido; o léelo directamente).
3. Revisa que no haya un render o QA en curso (no se lanzan dos a la vez: Chrome se cae).

## 1 · Carpeta del video
Crea `videos/AAAA-MM-DD-slug/` con:
- `idea.txt` — la idea en prosa (tema, objetivo, público, datos, límites). Pide la duración con una
  frase como «de 30 segundos» (el parser entiende 15 a 120 s; sin pedirla, ≈ 32 s). El motor reparte
  ≈ una escena cada 3,6 s.
- `respuesta-ia.json` — lo que normalmente devolvería la IA: `{"titulo": "...", "scenes": [ ... ]}`.
  Cada escena: `t` (plantilla), `voz` (frase para el oído, 8–14 palabras, cifras con letras), `dur`
  (s), `h`/`w` (titular y palabra clave que se resalta en dorado), `ic` (icono) y los campos de la
  plantilla. Modelo: `ejemplos/animacion-viral/respuesta-ia.json` y las plantillas en `AGENTS.md`.
  Reglas que el ensamblado ya cuida, pero tú debes respetar: la voz de cada escena cabe en su
  duración (≈ palabras ÷ 2,9 + 0,5 s ≤ `dur`), la 1.ª escena es el GANCHO (HOOK), la última es el
  CTA (con el logo), un cambio visual cada 2–3 s, un solo mensaje.
- `entrega.md` — lo que le entregas al usuario (ganchos, guion, texto para publicar, nota).
Paleta: **`imnoba`** (azul marino y dorado, Inter). Plantillas: las del catálogo
(`HOOK NUM VS BARS LINE STEPS LIST ROUTE SKYLINE DONUT PICTO TOP MITO PUNCH CTA…`). Si el tema pide una
imagen propia que ninguna plantilla da, puedes programar una escena a medida (`PIEZA`, «Carril B» en
`AGENTS.md`): hazlo solo cuando valga el esfuerzo y dime que lo decidiste.

## 2 · Crear la animación (sin IA, sin costo)
```
node scripts/anim/desde-respuesta.mjs --idea=videos/<carpeta>/idea.txt --respuesta=videos/<carpeta>/respuesta-ia.json --paleta=imnoba
```
Imprime las escenas, tiempos y cada corrección o aviso. Léelos: si el ensamblado corrigió algo (tipo
inventado, duración corta…), arréglalo en el JSON y vuelve a correrlo. Deja `src/data/animacion.json`
activa y `trabajo/salida/guion-locucion.txt` (lo que dice cada escena).

## 3 · Mirar escena por escena (antes de gastar voz y render completo)
```
node scripts/anim/previa.mjs --qa
```
Una captura por escena en `trabajo/tmp/anim-previa/` + control de márgenes, vacíos y movimiento.
Mira las imágenes (≈ 1 min). Corrige y repite hasta que no haya problemas.

## 4 · Música
`node scripts/anim/musica.mjs --listar` muestra lo que haya en `assets/musica/`. Si hay una pista
adecuada: `node scripts/anim/musica.mjs --usar=assets/musica/<pista>` (queda para los siguientes
videos; `--restaurar` vuelve a la sintetizada). Si no hay, se usa la sintetizada del proyecto y se lo
dices al usuario con cómo conseguir pistas libres (`assets/musica/README.md`). Nunca canciones
comerciales.

## 5 · Voz
`node scripts/anim/voz.mjs` — locutora de `voz.config.json`, una frase por escena ajustada a su tiempo,
con el preparador de guion (cifras a palabras, pronunciación). Cuesta ≈ US$ 0,015 por minuto y repetir
lo mismo sale de la caché. Mira el resumen: si alguna escena «no cabe», acorta esa frase o alarga la
escena y vuelve a generar. **Sin `OPENAI_API_KEY`**: sigue sin voz, avísalo y entrega el guion de
locución. **Si el usuario grabó su voz**: `node scripts/anim/voz-externa.mjs --audio=<archivo>`.

## 6 · Render
`npm run anim:render` (1080×1920 a 60 fps; tarda varios minutos según el equipo y es reanudable si se corta). Mezcla solo la voz
vigente (si cambias algo del texto o los tiempos, regenera la voz), la música con ducking y los
efectos, y exporta `trabajo/salida/stems/`. `-- --sin-voz` la omite. Salida:
`trabajo/salida/video-animacion.mp4`.

## 7 · Revisión (obligatoria)
```
node scripts/anim/revisar-video.mjs
```
Extrae ≥ 8 fotogramas con guías de zona segura a `trabajo/tmp/revision/` y mide resolución, fps,
volumen (LUFS), pico, recortes y silencios. **Mira TODOS los fotogramas** con la herramienta de
lectura de imágenes y los números del informe. Corrige el JSON o la voz, vuelve a renderizar y
revisa de nuevo hasta que esté bien.

## 8 · Entrega y registro
- Copia final: `trabajo/salida/video-animacion.mp4` (o `video-animacion-con-voz.mp4` si se le puso la
  voz después). Pistas sueltas en `trabajo/salida/stems/`.
- Registro en el Panel de Videos con estado «grabado»:
  `node scripts/panel/registrar-video.mjs --serie=<serie> --notas="<qué esperas y qué métrica mirar>" --carpeta=videos/AAAA-MM-DD-slug`
  (series: `estafas adivina_precio diario_fundador florida experimentos agente_semana propiedad_del_dia secretos_usa anatomia neuroanatomia neuroeconomia otro`).
  Guarda guion, voz, instrucciones, duración, una copia del MP4 y su miniatura. Si renderizaste desde
  el panel, ya se registró solo: el comando lo actualiza con la serie y la nota.
  **`--carpeta` es lo que hace que el video aparezca en TU panel:** escribe en la carpeta del video su
  `registro.json`, `miniatura.jpg` y una `revision.mp4` liviana (720 px, ≈ 2 MB). Esa carpeta SÍ va a git; al
  hacer commit + push y actualizar (`npm run actualizar`), el Panel de Videos de tu computador trae el video solo
  (🎬 «Listos para publicar», con 🆕 NUEVO). Sin `--carpeta`, el registro se queda en `data/videos.json` de la
  máquina donde se creó (que no va a git) y en tu panel no aparece. Si ya registraste un video antes:
  `node scripts/panel/exportar-registro.mjs --carpeta=videos/<carpeta> --mp4=<video-final.mp4>`.
- Escribe `videos/<carpeta>/entrega.md` y responde con los 6 puntos de «Qué me entregas siempre».

## Límites actuales (si el pedido los toca, dilo claro)
- Sin subtítulos palabra por palabra; sin fotos (el motor viral es vectorial).
- Zona segura del motor más permisiva que esta regla (ver arriba): revisa con las guías.
- Voz IA solo con `OPENAI_API_KEY` (o ElevenLabs en el Estudio); sin clave, video sin voz.
- Nada de esto se probó con la API real de OpenAI/ElevenLabs (solo con servidores simulados).

## LECCIONES
(vacío por ahora)
