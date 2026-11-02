# Entrega · «Por qué tus cables se enredan solos» (SINAPSIS · serie física cotidiana en SINAPSIS)

**Elegí (no diste tema):** un fenómeno que le pasa a todo el mundo: los cables y audífonos que se enredan solos en el bolsillo. Marca SINAPSIS · paleta `medicina` · serie `fisica_cotidiana` · ≈ 40 s. Gancho: «Guardas tus audífonos bien enrollados y, al sacarlos, ya son un nudo.»
**Caso real:** Raymer D. M. y Smith D. E., «Spontaneous knotting of an agitated string», PNAS 2007;104(42):16432–16437 (Universidad de California en San Diego).

## 1 · Video final
`trabajo/archivo/2026-11-02-cables-enredados/video-final.mp4` (1080×1920 · 60 fps · H.264 · AAC · 40,4 s · **sin voz**: solo diseño sonoro y efectos). Pista de sonido sola: `trabajo/archivo/2026-11-02-cables-enredados/stems/musica-y-efectos.wav`. Copia ligera de revisión en esta carpeta (`revision.mp4`).
**Diseño sonoro propio** (síntesis, libre de derechos; `componer-musica.mjs`): base juguetona (bajo y marimba), roce de cuerda mientras se desordena y gira, «cinch» al cerrarse el nudo (4,2 s y 34,0 s), tres palomitas ascendentes y arpegio final.

## 2 · Guion final (locución)
1. Guardas tus audífonos bien enrollados y, al sacarlos, ya son un nudo.
2. Dos físicos de San Diego metieron una cuerda en una caja y la hicieron girar diez segundos.
3. Con menos de cuarenta y seis centímetros no hubo nudos; entre ahí y metro y medio, subieron rápido.
4. Y cuanto más flexible es la cuerda, más fácil se anuda.
5. Casi todos los nudos eran de tres a once cruces, y cuantos más cruces, menos frecuentes.
6. Tu bolsillo no es una caja de laboratorio, pero agitar un cable largo y flexible puede anudarlo.
7. Guárdalo y síguenos en Sinapsis.

Guion técnico con fuentes y precauciones: `ejemplos/animacion-viral/guion-tecnico-cables.md`. Locución con tiempos: `ejemplos/animacion-viral/locucion-cables.txt`.

## 3 · Ganchos
- A) «Guardas tus audífonos bien enrollados y, al sacarlos, ya son un nudo.» ← **elegido**: lo vive cualquiera y se ve en el segundo 0 (la espiral que se deshace en nudo).
- B) «No es mala suerte: es matemática.»
- C) «Dos físicos metieron una cuerda en una caja y la hicieron girar diez segundos.» (se usa como escena 2)

## 4 · Texto para publicar
¿Por qué tus audífonos salen hechos un nudo si los guardaste bien enrollados? 🎧🪢 En 2007 dos físicos de la Universidad de California en San Diego metieron una cuerda en una caja que giraba y vieron algo claro: con menos de ≈ 46 cm no se formaron nudos, la probabilidad sube con rapidez hasta ≈ 1,5 m y, además, una cuerda más flexible se anuda más. Largo + flexible + agitado = nudo. Guárdalo y síguenos en Sinapsis. (Información educativa; las simulaciones y los gráficos son ilustrativos.)
#fisica #cienciacotidiana #nudos #curiosidades #sinapsis

## 5 · Nota
Espero que curiosos y estudiantes de física lo guarden y lo compartan por la sorpresa de que el desorden de los cables tenga una física medida. Métrica: guardados y compartidos por cada 1.000 alcanzados, y retención al pasar la escena 2 (≈ 5 s, la caja que gira).

## 6 · Registro
Registrado en el Panel de Videos con estado «grabado» y serie «Física cotidiana en SINAPSIS» (`videos/2026-11-02-cables-enredados/registro.json`: tu panel lo trae solo al hacer git pull).

## 🎙️ Cómo ponerle la voz de CapCut (ahora en 3 pasos, sin calibrar nada)
1. `npm run capcut` → deja el texto listo en `trabajo/salida/guion-capcut.txt` (un párrafo por escena, números en palabras). Pégalo en CapCut, elige la voz que te guste y exporta el audio.
2. `npm run capcut -- --audio=<tu-audio.mp3> --carpeta=videos/2026-11-02-cables-enredados` → el VIDEO se ajusta a tu voz (no al revés) y te dice si la confianza de la alineación es ALTA/MEDIA/BAJA.
3. Para 100 % de exactitud: exporta **un audio por escena** (`01.mp3 … 07.mp3`) y usa `--escenas=<carpeta>`.
Deshacer: `npm run capcut -- --deshacer`.

## Lo que cambié del pedido y lo que no se pudo cumplir (dicho con claridad)
- **Simulación 2D ilustrativa:** el experimento real fue en 3D; en 2D no hay nudos de verdad, solo cruces. Los contadores de las escenas 2 y 4 salen de mi simulación (rígida vs flexible), **no del estudio**, y el video lo rotula («ILUSTRACIÓN 2D», «SIMULACIÓN 2D · ILUSTRATIVA»).
- **Curva de la escena 3 y barras de la escena 5:** son **esquemas** (la forma descrita por el estudio, no sus datos). No afirmo ningún porcentaje: la probabilidad «se estanca por debajo del 100 %».
- **No usé** «3.415 pruebas» ni «120 tipos de nudo» (circulan en resúmenes populares, pero no pude confirmarlos), ni «≈ 50 %».
- **Audífonos ≠ cuerda del estudio:** el estudio usó **una sola cuerda**; los audífonos tienen forma de Y. El cierre lo dice como **analogía** (cinta en pantalla).
- **No pude abrir** el artículo completo (red restringida): trabajé con resúmenes de búsqueda. Confirma las cifras antes de usarlas en un trabajo.
- **Sin voz:** no hay `OPENAI_API_KEY`. Sin voz el audio sale a ≈ −28 LUFS: **no lo publiques así**; ponle la voz de CapCut (arriba) o desde el Estudio → «Voz en off».
- **Subtítulos palabra por palabra:** no existen; el texto grande de cada escena los reemplaza. **Fotos:** no se usaron; todo es vectorial. **Música libre:** `assets/musica/` vacío; el sonido es de creación propia.
- **Duración 40,4 s:** sobre los 35 s habituales; el pedido daba libertad. **60 fps** en lugar de 30. **Zona segura:** el botón del cierre toca el borde del 20 % inferior (plantilla fija del motor).
