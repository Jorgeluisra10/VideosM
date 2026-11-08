# Entrega · «La casa que vale menos cada año» (IMNOBA · serie ingeniería extrema · inmobiliario)

**Elegí:** tema viral con relación directa a lo inmobiliario: por qué en Japón las casas se reemplazan y pierden valor mientras el terreno lo conserva · marca IMNOBA · paleta `imnoba` · serie `ingenieria_extrema` · objetivo: que lo **guarden y compartan** y que **sigan a IMNOBA** · público: quienes miran comprar casa o lote · estilo realista tipo render (casa de tejas que envejece, lote en bloque, excavadora, gráfico, cuadrícula de casitas, tarjeta de avalúo), música japonesa moderna.

## 1 · Video final
`trabajo/archivo/2026-11-08-casas-japon/video-final.mp4` (1080×1920 · 60 fps · H.264 + AAC · 47,8 s · **sin voz**; audio nivelado a ≈ −15 LUFS: solo música y sonidos). Copia ligera de revisión en esta carpeta (`revision.mp4`). Pistas en `trabajo/archivo/2026-11-08-casas-japon/stems/` (`musica-y-efectos-normalizado.wav` para escuchar y `musica-y-efectos.wav` para reeditar con voz).

## 2 · Guion final (locución)
1. En Japón, una casa de treinta años casi no vale nada. Pero el terreno donde está, sí.
2. El terreno conserva su valor; la construcción se deprecia. Para impuestos, una casa de madera se deprecia en veintidós años.
3. En un dato oficial de dos mil ocho, las casas demolidas tenían treinta y dos años. En Estados Unidos, sesenta y seis.
4. No se caen solas: muchas se reemplazan por preferencia a lo nuevo y por normas antisísmicas que cambian.
5. Japón también tiene nueve millones de casas vacías: casi catorce de cada cien viviendas, en dos mil veintitrés.
6. Si compras, pide que separen el valor del terreno y el de la construcción. Ahí está la clave.
7. Guárdalo y síguenos en IMNOBA, tu plataforma de propiedades y vehículos.

Guion técnico con fuentes y precauciones: `ejemplos/animacion-viral/guion-tecnico-casas-japon.md`.

## 3 · Ganchos
- A) «En Japón, una casa de treinta años casi no vale nada. Pero el terreno donde está, sí.» ← **elegido**: contraste inmediato y contraintuitivo, con «EN JAPÓN» y una casa que envejece en pantalla desde el segundo 0.
- B) «En Japón demuelen casas casi nuevas. Mira por qué.»
- C) «Tu casa vale menos cada año. Tu terreno, no.»

## 4 · Texto para publicar
¿Por qué en Japón una casa de 30 años casi no vale nada, pero el terreno sí? 🏚️🇯🇵 En el mercado japonés la construcción se deprecia (para impuestos, una casa de madera en 22 años) y el terreno conserva su valor. Un dato oficial de 2008 muestra que las casas demolidas tenían 32 años de edad promedio, frente a 66 en EE. UU. (es la edad en que se reemplazan, no cuánto pueden durar). Si compras, pide que separen el valor del terreno y el de la construcción. Guárdalo y síguenos en IMNOBA, tu plataforma de propiedades y vehículos. (Información general, no asesoría; el mercado colombiano es distinto.)
#inmobiliaria #casas #japon #bienesraices #imnoba

## 5 · Nota
Espero que lo guarden y lo compartan por la curiosidad y por el consejo del desglose terreno/construcción. Métrica: retención a los 3 s y al pasar la demolición (≈ 14 s), y guardados por cada 1.000 alcanzados.

## 6 · Registro
Registrado en el Panel de Videos con estado «grabado» y serie «ingeniería extrema».

## Música y sonidos
`videos/2026-11-08-casas-japon/componer-musica.mjs`: escala hirajoshi en mi a 100 bpm (koto, shamisen, flauta tipo shakuhachi, taiko, bajo sub y pad con phaser); crece con la demolición y se aquieta en las casas vacías. Más de 30 sonidos distintos por escena: reloj que se acelera y campana de templo; lápiz, sello y moneda; motor diésel, quejido hidráulico, derrumbe y escombros; temblor, cristal y onda sísmica; crujido de puerta, clac de madera por casita vacía y viento; papel y bolígrafo; koto y marimba. Para reeditar: `node videos/2026-11-08-casas-japon/componer-musica.mjs` y `node scripts/anim/musica.mjs --usar=assets/musica/casas-japon.wav` (y `--restaurar`; el WAV no va a git).

## Lo que conviene saber (dicho con claridad)
- **Sin voz:** no hay `OPENAI_API_KEY`. Para publicar graba el guion (tu voz o CapCut con `npm run capcut`) o usa «Voz en off» en el Estudio.
- **No afirmo que las casas japonesas «duren 30 años»:** el dato de 32,1 años es la edad promedio de las casas **demolidas** (2008), no su vida física; un estudio que cuenta casas en pie y demolidas estima ≈ 65 años. El video lo rotula.
- **«Casi no vale nada»** es una simplificación del mercado japonés; el medidor y el gráfico son **esquemas**, no precios. La cita de «15 años» no se usa (sin verificar); las cifras de 55 y 77 años tampoco (origen no verificado).
- **Casas vacías:** los 9 millones (13,8 %) son de la encuesta de 2023 y se asocian al envejecimiento y la despoblación; el video no los atribuye a la demolición.
- **Colombia:** el mercado es distinto; el consejo es general, no asesoría de compra ni inversión, y no prometo valorización ni ahorro.
- **«Realista»:** figuras vectoriales tipo render, no fotos. **Duración 47,8 s** (la norma es 20–35 s «salvo que pida otra»).
- **Subtítulos palabra por palabra:** no existen en este motor; los rótulos grandes los reemplazan. **Zona segura:** sin avisos de márgenes.
- **Verifica los datos** antes de publicar: salen de resúmenes de búsqueda web.
