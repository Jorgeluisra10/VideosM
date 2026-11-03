# Entrega · «La bola de 660 toneladas» (IMNOBA · serie ingeniería extrema)

**Elegí:** marca IMNOBA · paleta `imnoba` · serie `ingenieria_extrema` · objetivo: que lo **guarden y compartan** y que **sigan a IMNOBA** (una sola llamada a la acción) · público: curiosos de ingeniería y arquitectura · estilo: **formas geométricas** (cuadros, rombos y triángulos) que se ensamblan como un mosaico, con música psicodélica propia y sonidos distintos en cada escena.
**Caso real:** el amortiguador de masa sintonizado del Taipei 101 (Taiwán): esfera de acero de ≈ 660 t y ≈ 5,5 m, colgada entre los pisos 87 y 92.

## 1 · Video final
`trabajo/archivo/2026-11-03-bola-660/video-final.mp4` (1080×1920 · 60 fps · H.264 + AAC · 43,4 s · **sin voz**; el audio está nivelado a −14 LUFS: es solo música y sonidos). Copia ligera de revisión en esta carpeta (`revision.mp4`). Pistas en `trabajo/archivo/2026-11-03-bola-660/stems/`: `musica-y-efectos-normalizado.wav` (−14 LUFS, para escuchar) y `musica-y-efectos.wav` (la mezcla del motor, para reeditar con voz).

## 2 · Guion final (locución)
1. Dentro del Taipéi ciento uno cuelga una bola de acero de seiscientas sesenta toneladas. ¿Para qué?
2. Los rascacielos se balancean con el viento. Esta bola se mueve al revés y lo frena.
3. Se armó dentro del edificio, plancha por plancha: cuarenta y un discos de acero soldados uno sobre otro.
4. Cada uno mide doce centímetros y medio. Juntos forman una esfera de cinco metros y medio.
5. Cuelga de cables de acero entre los pisos ochenta y siete y noventa y dos.
6. En el tifón de dos mil quince, la bola se movió cerca de un metro y frenó el vaivén.
7. Guárdalo y síguenos en IMNOBA, tu plataforma de propiedades y vehículos.

Guion técnico con fuentes y precauciones: `ejemplos/animacion-viral/guion-tecnico-bola-660.md`.

## 3 · Ganchos
- A) «Dentro del Taipéi ciento uno cuelga una bola de acero de seiscientas sesenta toneladas. ¿Para qué?» ← **elegido**: cifra enorme + pregunta sin respuesta, con «una bola de 660 toneladas» en pantalla desde el fotograma 1 y un edificio que se arma solo.
- B) «Hay una bola dorada colgando dentro de un rascacielos y evita que te marees.»
- C) «Esta bola dorada es la razón por la que el edificio se balancea menos.»

## 4 · Texto para publicar
¿Para qué cuelga una bola de acero de 660 toneladas dentro de un rascacielos? 🌀🏙️ En el Taipei 101 se soldaron 41 discos de acero, plancha por plancha, hasta formar una esfera dorada de 5,5 m que se mueve al revés del edificio para frenar el vaivén del viento. En un tifón llegó a moverse cerca de un metro. Guárdalo y síguenos en IMNOBA, tu plataforma de propiedades y vehículos. (Información educativa; los dibujos son figuras geométricas, no fotos.)
#ingenieria #arquitectura #rascacielos #megaconstrucciones #imnoba

## 5 · Nota
Espero que lo guarden y lo compartan por lo visual (el mosaico geométrico) y la curiosidad de la bola de 660 t, y que el cierre lleve seguidores a IMNOBA. Métrica: retención a los 3 s y al pasar los 41 discos (≈ 14 s), y guardados por cada 1.000 alcanzados.

## 6 · Registro
Registrado en el Panel de Videos con estado «grabado» y serie «ingeniería extrema» (`videos/2026-11-03-bola-660/registro.json`: tu panel lo trae solo al hacer `git pull` / `npm run actualizar`).

## Música y sonidos (lo que pediste)
Compositor propio: `videos/2026-11-03-bola-660/componer-musica.mjs` (síntesis, libre de derechos). **Música psicodélica:** tanpura (drones), sitar, pad con phaser, bajo «wub», tabla y shaker a 104 bpm con eco en corchea con puntillo; se aligera en la escena 5 y vuelve fuerte en la 6. **Sonidos distintos por escena (más de 20):** gong y campanitas de cristal, «boing» elástico, platillo invertido (1); viento, crujido metálico, «wub» grave, riser láser (2); zumbido de grúa, chisporroteo de soldadura, yunque que sube de tono y «ka-chunk» (3); armónicos de cristal, «zip», latido grave y destellos de marimba (4); tañido de cable, siseo de pistón y trinquete con una nota de marimba por piso (5); trueno, lluvia, «swoosh» doppler y estruendo grave (6); jingle de marimba y sitar (7). Para reeditar: `node videos/2026-11-03-bola-660/componer-musica.mjs` y `node scripts/anim/musica.mjs --usar=assets/musica/bola-660-psicodelica.wav` (y `--restaurar` al terminar; el WAV no va a git).

## Lo que cambié del pedido y lo que no se pudo cumplir (dicho con claridad)
- **«Parte de una imagen REAL»:** **no pude.** Este entorno bloquea Wikimedia y no puede descargar fotos (error 403), así que redibujé las figuras con formas geométricas a partir de cómo luce el original (la esfera dorada colgada, los módulos escalonados del Taipei 101). No son calcos de una foto concreta y lo digo en pantalla («figura geométrica, no es una foto»). Si me subes una foto real, la traduzco a facetas.
- **«Entre los pisos 87 y 92 de un rascacielos»:** sí, y es el Taipei 101 (lo nombro en el guion).
- **Número de cables:** no lo digo. Las fuentes discrepan (algunas dicen «92 cables», que parece confusión con el piso 92). Los pistones y el aro de tope son interpretación esquemática.
- **Montaje:** las fuentes confirman 41 placas de ≈ 125 mm soldadas por capas; el andamio, la grúa pórtico y el soldador son una **ilustración**, no el proceso real. Tampoco afirmo cómo se subieron las placas (no hay fuente abierta).
- **Datos con matices:** «hasta 40 %» es la cifra del edificio y un máximo (se rotula); el tifón Soudelor (2015) movió la bola «cerca de un metro» (no todas las fuentes dicen 100 cm exactos); el vaivén del edificio está exagerado.
- **Menos fórmulas, más entretenimiento:** pedí cero fórmulas en pantalla; solo hay cifras con fuente en la parte baja.
- **Sin voz:** no hay `OPENAI_API_KEY`. El video sale con música y sonidos nivelados a −14 LUFS para que se escuche bien, pero para publicar graba el guion (tu voz o CapCut con `npm run capcut`) o usa «Voz en off» en el Estudio. Al poner voz, el motor baja la música y mezcla a −14 LUFS.
- **Duración 43,4 s** (la norma diaria es 20–35 s «salvo que pida otra»): los seis pasos con calma no cabían en menos.
- **Subtítulos palabra por palabra y fotos:** no existen en este motor; el texto grande de cada escena hace de subtítulo. **Zona segura:** sin avisos de márgenes; el cierre no lleva el botón inferior de la plantilla.
- **Música:** `assets/musica/` está vacío; la música es de creación propia, no hay canciones comerciales.
- **Verifica las cifras** antes de publicar: salen de resúmenes de búsqueda web (Guinness, Taiwan News, The Civil Engineer), no de los documentos completos.
