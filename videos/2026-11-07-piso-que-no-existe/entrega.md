# Entrega · «El piso que no existe» (IMNOBA · serie ingeniería extrema · inmobiliario)

**Elegí:** tema viral con relación directa a lo inmobiliario: por qué muchos edificios no tienen piso 13 (o 4) y si eso afecta los precios · marca IMNOBA · paleta `imnoba` · serie `ingenieria_extrema` · objetivo: que lo **guarden y compartan** y que **sigan a IMNOBA** · público: quienes miran apartamentos · estilo realista tipo render (panel de ascensor de acero, pantalla ámbar, edificio en corte, cuadrícula de edificios, barras), música de ascensor que se «tuerce».

## 1 · Video final
`trabajo/archivo/2026-11-07-piso-que-no-existe/video-final.mp4` (1080×1920 · 60 fps · H.264 + AAC · 44,9 s · **sin voz**; audio nivelado a ≈ −15 LUFS: solo música y sonidos). Copia ligera de revisión en esta carpeta (`revision.mp4`). Pistas en `trabajo/archivo/2026-11-07-piso-que-no-existe/stems/` (`musica-y-efectos-normalizado.wav` para escuchar y `musica-y-efectos.wav` para reeditar con voz).

## 2 · Guion final (locución)
1. Mira este ascensor: salta del doce al catorce. ¿Adónde se fue el piso trece?
2. Sí existe: solo lo llaman catorce. Muchos edificios evitan el trece por superstición.
3. En un conteo de Manhattan, solo cincuenta y cinco de seiscientos veintinueve edificios altos lo muestran.
4. En China, Japón y Corea el cuatro suena parecido a muerte. Por eso muchos edificios se lo saltan.
5. El ocho suena a prosperidad. En Vancouver y Hong Kong, el cuatro se vende más barato y el ocho, a veces, más caro.
6. Si compras un apartamento, cuenta los pisos reales y mira el plano: el botón puede esconder uno.
7. Guárdalo y síguenos en IMNOBA, tu plataforma de propiedades y vehículos.

Guion técnico con fuentes y precauciones: `ejemplos/animacion-viral/guion-tecnico-piso-que-no-existe.md`.

## 3 · Ganchos
- A) «Mira este ascensor: salta del doce al catorce. ¿Adónde se fue el piso trece?» ← **elegido**: un misterio visual que todos reconocen, con el panel y el hueco «?» en pantalla desde el segundo 0.
- B) «Tu apartamento puede valer menos por un número.»
- C) «Hay un piso 13 en tu edificio y no lo sabías.»

## 4 · Texto para publicar
¿Por qué tantos ascensores saltan del 12 al 14? 🛗🏢 El piso 13 existe, solo lo rotulan 14. En un conteo de Manhattan, apenas 55 de 629 edificios altos muestran un 13; y en Asia muchos se saltan el 4 porque suena a «muerte». Estudios de Vancouver y Hong Kong encuentran precios algo menores con el 4 y, a veces, mayores con el 8. Si compras un apartamento, cuenta los pisos reales y mira el plano. Guárdalo y síguenos en IMNOBA, tu plataforma de propiedades y vehículos. (Información general, no asesoría; los porcentajes son de estudios puntuales y no aplican a Colombia.)
#apartamentos #inmobiliaria #arquitectura #curiosidades #imnoba

## 5 · Nota
Espero que lo guarden y lo compartan por la curiosidad y por el consejo de contar los pisos reales. Métrica: retención a los 3 s y al pasar el dato de Manhattan (≈ 11 s), y guardados por cada 1.000 alcanzados.

## 6 · Registro
Registrado en el Panel de Videos con estado «grabado» y serie «ingeniería extrema».

## Música y sonidos
`videos/2026-11-07-piso-que-no-existe/componer-musica.mjs`: bossa-lounge en re menor a 96 bpm (piano eléctrico, bajo caminante, vibráfono, escobillas), que **se desafina** cuando aparece el piso fantasma. Sonidos distintos por escena (más de 25): «ding» y puertas del ascensor, clics de botones, motor y cable, lluvia de teclas, máquina de contar, caja registradora, gong, tritono de «muerte», campana del 8, golpe sordo del 4, bocina de mercado, rollo de plano, lápiz, sello y jingle. Para reeditar: `node videos/2026-11-07-piso-que-no-existe/componer-musica.mjs` y `node scripts/anim/musica.mjs --usar=assets/musica/piso-que-no-existe.wav` (y `--restaurar`; el WAV no va a git).

## Lo que conviene saber (dicho con claridad)
- **Sin voz:** no hay `OPENAI_API_KEY`. Para publicar graba el guion (tu voz o CapCut con `npm run capcut`) o usa «Voz en off» en el Estudio.
- **Dato no usado:** el «85 % de edificios sin piso 13» (estimación de Otis) no se usa por no ser un conteo sistemático; se usa el conteo de Manhattan (solo una ciudad).
- **Precios:** los porcentajes (Vancouver +2,5 % y −2,2 %; Hong Kong −4,2 %) son de estudios puntuales, indicativos, y en otros mercados no se repiten (Taipei: sin prima para el 8). **No aplican a Colombia** ni sirven para decidir una compra; no prometo valorización ni ahorro.
- **«Realista»:** figuras vectoriales tipo render, no fotos; el panel con hueco es una ilustración.
- **Duración 44,9 s** (la norma es 20–35 s «salvo que pida otra»; el pedido era libre).
- **Subtítulos palabra por palabra:** no existen en este motor; los rótulos grandes los reemplazan. **Zona segura:** sin avisos de márgenes.
- **Verifica los datos** antes de publicar: salen de resúmenes de búsqueda web. Información general, no asesoría.
