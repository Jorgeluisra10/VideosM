# Entrega · «Los 3 códigos escondidos en tu vehículo» (IMNOBA · serie ingeniería extrema)

**Elegí:** tema libre con ángulo de vehículos: tres códigos que cualquiera puede leer antes de comprar un vehículo (usado o nuevo) · marca IMNOBA · paleta `imnoba` · serie `ingenieria_extrema` · objetivo: que lo **guarden** (es una lista de revisión) y lo compartan, y que **sigan a IMNOBA** · estilo: realista tipo render (tablero, vehículo desde arriba, llanta, placa del VIN, parabrisas y tarjeta) · hook en el estilo del video de referencia («no está de adorno»).

## 1 · Video final
`trabajo/archivo/2026-11-06-codigos-vehiculo/video-final.mp4` (1080×1920 · 60 fps · H.264 + AAC · 42,5 s · **sin voz**; audio nivelado a ≈ −15 LUFS con pico −2,4 dBFS: solo música y sonidos). Copia ligera de revisión en esta carpeta (`revision.mp4`). Pistas en `trabajo/archivo/2026-11-06-codigos-vehiculo/stems/`: `musica-y-efectos-normalizado.wav` (para escuchar) y `musica-y-efectos.wav` (la mezcla del motor, para reeditar con voz).

## 2 · Guion final (locución)
1. Esa flechita junto al medidor de gasolina no está de adorno. Y hay dos códigos más escondidos.
2. Apunta al lado donde está la tapa del tanque, así nunca te equivocas de lado en la bomba.
3. Segundo: en la llanta, los últimos cuatro números del DOT son semana y año de fabricación.
4. Muchos fabricantes recomiendan cambiarlas entre los seis y diez años, aunque tengan dibujo.
5. Tercero: el VIN. Su décimo carácter es el año modelo; la T, por ejemplo, es dos mil veintiséis.
6. Lo encuentras en el parabrisas y en la tarjeta de propiedad. Revísalo antes de comprar.
7. Guárdalo y síguenos en IMNOBA, tu plataforma de propiedades y vehículos.

Guion técnico con fuentes y precauciones: `ejemplos/animacion-viral/guion-tecnico-codigos-vehiculo.md`.

## 3 · Ganchos
- A) «Esa flechita junto al medidor de gasolina no está de adorno.» ← **elegido**: curiosidad inmediata con un objeto que todos ven a diario; en pantalla «ESA FLECHITA» desde el segundo 0.
- B) «Tu vehículo esconde tres códigos que casi nadie lee.»
- C) «Mira tu llanta: ¿sabes qué edad tiene?»

## 4 · Texto para publicar
¿Para qué sirve esa flechita junto al medidor de gasolina? ⛽🚗 Apunta al lado de la tapa del tanque. Y hay dos códigos más: el DOT de la llanta (semana y año de fabricación; muchos fabricantes recomiendan cambiarlas entre los 6 y 10 años) y el VIN (su décimo carácter es el año modelo: la T es 2026). Revísalos antes de comprar un vehículo. Guárdalo y síguenos en IMNOBA, tu plataforma de propiedades y vehículos. (Información general, no asesoría; los ejemplos son ilustrativos.)
#vehiculos #carros #mecanica #comprarusado #imnoba

## 5 · Nota
Espero que lo guarden como lista de revisión antes de comprar un vehículo y que lo compartan por la curiosidad de la flechita. Métrica: retención a los 3 s y al pasar al segundo código (≈ 13 s), y guardados por cada 1.000 alcanzados.

## 6 · Registro
Registrado en el Panel de Videos con estado «grabado» y serie «ingeniería extrema» (`videos/2026-11-06-codigos-vehiculo/registro.json`: tu panel lo trae solo al hacer `git pull` / `npm run actualizar`).

## Música y sonidos
Compositor propio: `videos/2026-11-06-codigos-vehiculo/componer-musica.mjs`. **Música de carretera:** synthwave en la menor a 108 bpm (arpegiador de sierra con filtro, bajo con compuerta, pad con phaser, kick, caja y hi-hats); entra en la escena 2, se aligera con las llantas que vencen, sube con el VIN y explota en el repaso. **Sonidos distintos por escena (más de 25):** arranque de motor y campanita del cinturón; intermitente, tapa, pistola y gluglú de la gasolina; chirrido de llanta, sello y 52 clics del calendario; crujido del caucho, reloj que se acelera y alarma; máquina de escribir, escáner y acorde de la T; limpiaparabrisas, láser y papel; «bip-bip» del seguro, portazo y jingle. Para reeditar: `node videos/2026-11-06-codigos-vehiculo/componer-musica.mjs` y `node scripts/anim/musica.mjs --usar=assets/musica/codigos-vehiculo.wav` (y `--restaurar` al terminar; el WAV no va a git).

## Lo que no se pudo cumplir o conviene saber (dicho con claridad)
- **Sin voz:** no hay `OPENAI_API_KEY`. El audio sale nivelado para escucharse, pero para publicar graba el guion (tu voz o CapCut con `npm run capcut`) o usa «Voz en off» en el Estudio; al poner voz el motor baja la música y mezcla a −14 LUFS.
- **«Realista»:** son figuras vectoriales tipo render, no fotos (el motor no incorpora fotos y el entorno no descarga imágenes). La llanta, el DOT («3624» y «DOT 7MR3») y la placa del VIN («X» de relleno) son **ejemplos ilustrativos**; la tarjeta de propiedad es un dibujo genérico.
- **La flecha** existe en casi todos los modelos modernos, pero no en todos (hay excepciones y modelos antiguos); el video lo rotula.
- **Llantas:** «6 a 10 años» es la recomendación habitual de muchos fabricantes; las fuentes no coinciden en un número único y no pude confirmar la postura de la NHTSA. El video no afirma que «caduquen» y manda a revisar el manual.
- **VIN:** el décimo carácter es el año **modelo**, no la fecha de fabricación, y aplica en la mayoría de vehículos; el ciclo se repite cada 30 años (S = 1995 o 2025), y no se usan I, O, Q, U, Z ni 0.
- **Duración 42,5 s** (la norma diaria es 20–35 s «salvo que pida otra»; el pedido era libre): los tres códigos con su explicación no cabían en menos.
- **Subtítulos palabra por palabra:** no existen en este motor; los rótulos grandes de cada escena los reemplazan. **Zona segura:** sin avisos de márgenes.
- **Música:** `assets/musica/` está vacío; la música es de creación propia (sin canciones comerciales).
- **Verifica los datos** antes de publicar: salen de resúmenes de búsqueda web, no de los documentos completos. Información general, no asesoría mecánica, legal ni de compra.
