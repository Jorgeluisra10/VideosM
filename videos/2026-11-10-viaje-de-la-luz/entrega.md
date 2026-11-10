# Entrega · «El viaje de la luz» (IMNOBA · serie ingeniería extrema · centrales eléctricas en POV)

**Pedido:** cómo funcionan las centrales eléctricas para llevar luz a millones de casas a la vez, en estilo inmersivo e hiperdinámico, como un viaje en primera persona (POV) desde que se quema el combustible o cae el agua hasta que la energía sale por el enchufe · marca IMNOBA · paleta `imnoba` · serie `ingenieria_extrema` · objetivo: que lo **guarden y compartan** y que **sigan a IMNOBA** · estilo: túnel de líneas de velocidad, paquete de energía dorado con estela, golpes de zoom, objetos tipo render sobre azul noche, música electrónica a 124 bpm.

## 1 · Video final
`trabajo/archivo/2026-11-10-viaje-de-la-luz/video-final.mp4` (1080×1920 · 60 fps · H.264 + AAC · 60,9 s · **sin voz**; audio nivelado a ≈ −15 LUFS, pico −2,3 dBFS: solo música y sonidos). Copia ligera de revisión en esta carpeta (`revision.mp4`). Pistas en `trabajo/archivo/2026-11-10-viaje-de-la-luz/stems/` (`musica-y-efectos-normalizado.wav` para escuchar y `musica-y-efectos.wav` para reeditar con voz).

## 2 · Guion final (locución)
1. Aprietas un interruptor y se enciende la luz. ¿De dónde sale esa energía? Ven, sígueme.
2. Todo empieza con fuego o con agua: una caldera quema combustible, o una presa deja caer el agua.
3. El vapor, o el agua que cae, empuja las aspas de una turbina gigante que no deja de girar.
4. Gira un imán dentro de bobinas de cobre. Imán en movimiento, cable cerca: ahí nace la electricidad.
5. Un transformador sube el voltaje a cientos de miles de voltios, y la energía cruza el país por torres con menos pérdidas.
6. En tu barrio, otro transformador la baja a ciento veinte voltios, y llega a tu casa.
7. Y el truco: casi no se guarda. Cada segundo, las centrales producen justo lo que millones de casas consumen.
8. Y llega al enchufe. Un viaje de un instante que empezó en una central.
9. Guárdalo y síguenos en IMNOBA, tu plataforma de propiedades y vehículos.

Guion técnico con precauciones: `ejemplos/animacion-viral/guion-tecnico-viaje-de-la-luz.md`.

## 3 · Ganchos
- A) «Aprietas un interruptor y se enciende la luz. ¿De dónde sale esa energía? Ven, sígueme.» ← **elegido**: arranca en el gesto más cotidiano, plantea la pregunta y promete un viaje; el túnel con el paquete dorado arranca antes del segundo 4.
- B) «Esta luz acaba de salir de una central a cientos de kilómetros. Sígueme.»
- C) «Tu casa no guarda la luz: se produce justo cuando la usas.»

## 4 · Texto para publicar
Aprietas un interruptor… ¿y de dónde sale esa luz? ⚡🏠 Sígueme en este viaje en primera persona: del fuego o el agua que mueve una turbina, al imán que gira dentro de bobinas de cobre, a las torres de alta tensión y, al final, al enchufe de tu pared. Lo curioso: la red casi no guarda energía a gran escala; producción y consumo se equilibran todo el tiempo. Guárdalo y síguenos en IMNOBA, tu plataforma de propiedades y vehículos. 🔌
#energia #ingenieria #inmobiliaria #casas #imnoba

## 5 · Nota
Espero que lo guarden y lo compartan por lo inmersivo del recorrido y por la curiosidad del «casi no se guarda». Métrica: retención a los 3 s y al pasar las torres (≈ 28 s), y guardados por cada 1.000 alcanzados.

## 6 · Registro
Registrado en el Panel de Videos con estado «grabado» y serie «ingeniería extrema» (`registro.json`, `miniatura.jpg` y `revision.mp4` en esta carpeta).

## Música y sonidos
`videos/2026-11-10-viaje-de-la-luz/componer-musica.mjs`: synth-electro en la menor a 124 bpm (bajo de sierra con sidechain, arpegiador con filtro, pad con phaser, bombo, aplauso y hats) con una subida (riser) en cada cambio de escena; el «drop» llega en las torres, baja en el barrio, se tensa en el equilibrio y explota en el enchufe. Sonidos distintos por escena: clic de interruptor, zumbido de lámpara, whoosh y «ping»; crepitar de fuego, rugido de quemador y chorro de agua; rotor que acelera y silbido de vapor; tics del imán por bobina; zumbido de transformador a 120 Hz, zap de subida, corona y paso de torres; golpe de poste, zap de bajada, campanita y clics del medidor; radar, tics de casas y tono de 60 Hz; golpe al conectar, «ding» y filamento; arpegio y marimba en el cierre.

## Lo que conviene saber (dicho con claridad)
- **Sin voz:** no hay `OPENAI_API_KEY`. Para publicar graba el guion (tu voz o CapCut con `npm run capcut`) o usa «Voz en off» en el Estudio.
- **Datos NO verificados:** la búsqueda web llegó a su límite semanal en esta sesión. El video se apoya en física básica y valores típicos (120 V y 60 Hz en viviendas colombianas, «cientos de miles de voltios» como orden de magnitud). Confírmalos con XM/UPME/CREG antes de publicar.
- **«Casi no se guarda»:** se refiere al almacenamiento a gran escala; existen baterías y embalses (incluso bombeo), pero cubren una parte pequeña. «Cada segundo» es una simplificación: el equilibrio es continuo y la frecuencia indica el desbalance.
- **No digo «a la velocidad de la luz»:** la señal viaja rápido, pero los electrones se mueven lento; evité la frase para no inducir a error. El «paquete» dorado es una metáfora, no un electrón.
- **Sin cifras:** no doy porcentajes de agua/combustible ni cuántas casas atiende una central.
- **Esquemas:** todo está simplificado y fuera de escala; no es asesoría técnica ni de instalaciones eléctricas, ni promete ahorro.
- **«Realista»:** figuras vectoriales tipo render, no fotos. **Duración 60,9 s** (la norma es 20–35 s «salvo que el pedido diga otra»; aquí el pedido pide un viaje completo).
- **Subtítulos palabra por palabra:** no existen en este motor; los rótulos grandes los reemplazan.
