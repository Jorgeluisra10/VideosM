# Entrega · «El laboratorio bacteriano bajo tu terreno» (IMNOBA · serie ingeniería extrema)

**Elegí:** marca IMNOBA · paleta `imnoba` · serie `ingenieria_extrema` · objetivo: que lo **guarden y compartan** y que **sigan a IMNOBA** (una sola llamada a la acción) · público: personas que miran terrenos y lotes sin alcantarillado · estilo: corte transversal en plano continuo hecho con formas geométricas (rombos, cuadros, triángulos y hexágonos), con bacterias de caricatura y música psicodélica propia.

## 1 · Video final
`trabajo/archivo/2026-11-03-laboratorio-septico/video-final.mp4` (1080×1920 · 60 fps · H.264 + AAC · 81,5 s · **sin voz**; el audio está nivelado a ≈ −15 LUFS con pico −2 dBFS: es solo música y sonidos). Copia ligera de revisión en esta carpeta (`revision.mp4`). Pistas en `trabajo/archivo/2026-11-03-laboratorio-septico/stems/`: `musica-y-efectos-normalizado.wav` (para escuchar) y `musica-y-efectos.wav` (la mezcla del motor, para reeditar con voz).

## 2 · Guion final (locución)
1. Bajo un terreno aislado hay un laboratorio secreto, y lo operan millones de bacterias.
2. Pero un pozo cavado sin más es una bomba de tiempo. El agua sucia se filtra, huele y puede llegar a la napa.
3. La solución no es taparlo: es convertirlo en una planta de tratamiento con tres etapas.
4. Primera etapa, la cámara de decantación: lo pesado se hunde, la grasa flota y en el medio queda el agua más clara.
5. Abajo no hay oxígeno, y eso les encanta a las bacterias anaerobias: se comen parte de los sólidos y sueltan gas.
6. El agua pasa a una segunda cámara, más tranquila, donde terminan de asentarse las partículas.
7. Un tubo de ventilación saca el gas, y una trampa de agua evita los olores.
8. Segunda etapa: el agua sale a un lecho de grava, donde otras bacterias siguen limpiándola.
9. Tercera etapa: la tierra termina el trabajo y el agua llega a la napa mucho más limpia.
10. Eso sí, no es magia: hay que vaciar los lodos cada tres a cinco años y no echar cloro ni aceite.
11. Si vas a comprar un terreno sin alcantarillado, pregunta cómo trata sus aguas y revisa la norma de tu zona.
12. Guárdalo y síguenos en IMNOBA, tu plataforma de propiedades y vehículos.

Guion técnico con el análisis del video de referencia, fuentes y precauciones: `ejemplos/animacion-viral/guion-tecnico-laboratorio-septico.md`.

## 3 · Ganchos
- A) «Bajo un terreno aislado hay un laboratorio secreto, y lo operan millones de bacterias.» ← **elegido**: curiosidad + promesa de ver algo oculto; en pantalla «BAJO TU TERRENO» desde el segundo 0 mientras la cámara se hunde bajo tierra.
- B) «El agua de tu baño no desaparece: se la comen millones de bacterias.»
- C) «Un hueco en la tierra puede contaminar tu agua, o limpiarla. Depende de esto.»

## 4 · Texto para publicar
¿Qué pasa con el agua del baño en un terreno sin alcantarillado? 🦠🏞️ Bajo la tierra puede haber un laboratorio: cámaras que separan lo pesado y la grasa, bacterias que digieren parte de los sólidos, una trampa de agua y una ventilación contra los olores, un lecho de grava y el suelo que terminan el tratamiento. No es magia: hay que vaciar los lodos cada 3 a 5 años y no echar cloro ni aceite. Si vas a comprar un lote, pregunta por su sistema y revisa la norma de tu zona. Guárdalo y síguenos en IMNOBA, tu plataforma de propiedades y vehículos. (Información general, no asesoría; los dibujos son figuras geométricas, no fotos.)
#terrenos #ingenieria #sistemaseptico #construccion #imnoba

## 5 · Nota
Espero que lo guarden y lo compartan por lo visual (el corte con bacterias de caricatura) y que el cierre lleve seguidores a IMNOBA. Métrica: retención a los 3 s y al llegar a la grava (≈ 50 s), y guardados por cada 1.000 alcanzados.

## 6 · Registro
Registrado en el Panel de Videos con estado «grabado» y serie «ingeniería extrema» (`videos/2026-11-03-laboratorio-septico/registro.json`: tu panel lo trae solo al hacer `git pull` / `npm run actualizar`).

## Análisis del video de referencia (y qué se tomó)
Es un explicativo vertical de ≈ 121 s sobre un tema doméstico (el tubo del boiler y el tinaco): empieza con un objeto cotidiano, construye el sistema pieza por pieza con la lógica **problema → componente → nuevo problema**, usa **un mismo dibujo en corte transversal** donde la cámara se acerca y se aleja, agua azul que fluye en puntos por los tubos, rótulos de una a tres palabras en mayúscula (en rojo cuando algo falla) y cierra con la revelación que contesta el título. **No pude transcribir su audio** (no hay herramienta de voz a texto en este entorno): lo deduje de los fotogramas, los rótulos y el nombre del archivo. Tomé: el corte continuo, la cámara que viaja, la cadena problema → componente → nuevo problema (pozo ciego → cámaras → ventilación → grava → tierra → mantenimiento), los rótulos cortos con color por significado y el flujo de puntos. No copié su marca de agua ni su paleta gris.

## Música y sonidos
Compositor propio: `videos/2026-11-03-laboratorio-septico/componer-musica.mjs`. **Música psicodélica nueva** (distinta a la del video anterior): tanpura, sitar, pad con phaser, bajo «wub», tabla y un arpegiador «burbujeante» con filtro, a 96 bpm, con ecos y reverberación; inquietud en el pozo, groove en las cámaras, calma, ascenso en la grava y la tierra, pausa tensa en el mantenimiento y cierre. **Sonidos distintos en cada escena (más de 40):** caída al subsuelo, crujido de tierra, sonar, goteo, «glub», bocina que se desinfla, alarma, golpes de hormigón, llana, marimba, «plop» y «bloop», chillidos y mordiscos de bacterias, «pfff», «gloc» de la trampa, silbido de ventilación, lluvia de piedras, gotas que bajan de tono, motor y aspiración del camión, zumbidos de «prohibido», martillazo, tics y jingle final. Para reeditar: `node videos/2026-11-03-laboratorio-septico/componer-musica.mjs` y `node scripts/anim/musica.mjs --usar=assets/musica/laboratorio-septico-psicodelica.wav` (y `--restaurar` al terminar; el WAV no va a git).

## Lo que cambié del pedido y lo que no se pudo cumplir (dicho con claridad)
- **«Parte de una imagen REAL»:** **no pude.** El entorno bloquea Wikimedia y no descarga fotos, así que dibujé el corte con formas geométricas a partir de cómo se ven los cortes de un sistema séptico; no es calco de ninguna foto y lo digo en pantalla. Si me subes una foto o un esquema real, lo traduzco a facetas.
- **«Agua limpia sin olores ni contaminación de napas»:** no lo afirmo sin condiciones. El tanque solo trata en parte; la grava y el suelo terminan el trabajo, y el resultado depende del diseño, de la distancia a la napa y a los pozos, del suelo y del mantenimiento. El video dice «mucho más limpia», rotula «no elimina todo» y manda a revisar la norma local. Tampoco doy distancias ni cifras de normas.
- **«Convertir un pozo»:** lo traduje como convertir un pozo ciego en un sistema de cámaras + grava; un pozo ciego sin tratamiento es justamente el riesgo.
- **Vaciado cada 3 a 5 años:** es lo habitual para una familia según resúmenes de la EPA (no pude abrir su página); depende del tamaño y del uso.
- **Duración 81,5 s** (pediste «lo suficiente para explicar»; la norma diaria es 20–35 s «salvo que pida otra»).
- **Sin voz:** no hay `OPENAI_API_KEY`. El audio sale nivelado para escucharse, pero para publicar graba el guion (tu voz o CapCut con `npm run capcut`) o usa «Voz en off» en el Estudio; al poner voz el motor baja la música y mezcla a −14 LUFS.
- **Subtítulos palabra por palabra y fotos:** no existen en este motor; los rótulos grandes de cada escena los reemplazan. **Zona segura:** sin avisos de márgenes.
- **Música:** `assets/musica/` está vacío; la música es de creación propia (sin canciones comerciales).
- **Verifica las cifras** antes de publicar: salen de resúmenes de búsqueda web, no de los documentos completos. Información general, no asesoría técnica ni legal.
