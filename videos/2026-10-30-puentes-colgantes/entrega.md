# Entrega · «El secreto de los puentes colgantes» (SINAPSIS · serie física estructural en SINAPSIS)

**Elegí:** marca SINAPSIS · paleta `medicina` (con la paleta de laboratorio del pedido dentro de las piezas) · serie `fisica_estructural` (nueva en el panel: «Física estructural en SINAPSIS») · gancho «El cable no cuelga: tira».

## 1 · Video final
`trabajo/archivo/2026-10-30-puentes-colgantes/video-final.mp4` (1080×1920 · 60 fps · H.264 (master CRF 17) · AAC · 46,6 s · **sin voz**: solo música sintetizada y efectos). Pista de música y efectos sola: `trabajo/archivo/2026-10-30-puentes-colgantes/stems/musica-y-efectos.wav`. Copia ligera de revisión en esta carpeta (`revision.mp4`).

## 2 · Guion final (locución)
1. El cable no cuelga: tira. Y tira con miles de toneladas.
2. El peso baja por los tirantes y el cable lo desvía hacia las orillas, en parábola.
3. Las torres lo convierten en compresión: sesenta y un mil quinientas toneladas por torre en el Golden Gate.
4. Brooklyn no usó barras macizas: hiló en el aire más de cinco mil alambres por cable.
5. Y miles de alambres delgados pueden soportar más que una barra del mismo grosor.
6. Cada diseño tiene su límite: carga, área y límite elástico deciden si resiste. Brooklyn, con margen de seis.
7. Haz zoom de mil metros a un milímetro: no hay un tubo macizo, hay un panal de alambres.
8. Guárdalo para repasar estática y síguenos en Sinapsis.

Guion técnico con fuentes y precauciones: `ejemplos/animacion-viral/guion-tecnico-puentes.md`.

## 3 · Ganchos
- A) «El cable no cuelga: tira. Y tira con miles de toneladas.» ← **elegido** (del «supervivencia» y del «ingeniería»): contradice la intuición en 3 s y se puede defender entero.
- B) «Lo que te sostiene en un puente no empuja: tira.» (versión corta del «supervivencia», sin «asfalto que intenta hundirte» ni «acero como una liga»).
- C) «Tus ojos creen que el cable cuelga. La estática dice que tira.» (del «ingeniería/física»).
- El «histórico» (cable del Golden Gate cortado que sale disparado como resortera) **no se usó**: no hay una fuente que lo respalde.

## 4 · Texto para publicar
Un puente colgante no se sostiene colgando: se sostiene tirando 🌉 El cable desvía el peso hacia las orillas en forma de parábola, las torres lo convierten en compresión (61.500 toneladas por torre en el Golden Gate) y el de Brooklyn se hiló con más de 5.000 alambres por cable, con un margen de seguridad de diseño de 6. Guárdalo para tus repasos de estática y síguenos en Sinapsis. (Información educativa; los gráficos son esquemas.)
#ingenieriacivil #estatica #puentes #fisica #sinapsis

## 5 · Nota
Espero que estudiantes de ingeniería, arquitectura y física lo guarden como apunte de estática y que el público lo comparta por «el cable no cuelga: tira». Métrica: guardados y compartidos por cada 1.000 alcanzados, y retención al pasar la escena 3 (≈ 10 s, los Rayos X).

## 6 · Registro
Registrado en el Panel de Videos con estado «grabado» y serie «Física estructural en SINAPSIS» (`videos/2026-10-30-puentes-colgantes/registro.json`: tu panel lo trae solo al hacer git pull).

## Lo que cambié del pedido y lo que no se pudo cumplir (dicho con claridad)
- **Los tres potenciómetros:** w, f y H **no son independientes** (H = w·L²/(8·f)). Dos son entradas (peso, flecha) y la tercera, **H, es el resultado**; el video lo dice en pantalla. Así se ve la lección: más peso o menos flecha → más tensión.
- **Hook del látigo/resortera, «asfalto que te hunde», «acero como una liga»:** no se usan (sin fuente o exagerados).
- **«Roebling demostró que una barra se rompería por su peso»:** no se usa; no encontré fuente. Lo que sí se dice: se hiló alambre a alambre en el aire y miles de alambres delgados **pueden** soportar más que una barra del mismo grosor (resumen de fuentes, no leí los artículos completos).
- **«Cuaderno técnico de Roebling»:** es una **ilustración** rotulada «Cuaderno de campo · Brooklyn, 1883», no un documento original. Los 5.434 alambres vienen de AISC/Structure; Wikipedia dice 5.282: el video dice «más de cinco mil».
- **Cubo de parámetros:** reemplacé «flexibilidad, diámetro y límite elástico» por **carga, área y límite elástico** (σ = F/A ≤ σy). Es un **modelo simplificado**: no incluye pandeo, fatiga, viento ni sismo, y **no es el cálculo de un puente**. El factor de seguridad 6 es el de diseño de Brooklyn según Structure (otras fuentes citan ≈ 5 tras el fraude del alambre).
- **«Absorbe huracanes y terremotos sin romperse jamás» y nodos que «laten con cada paso»:** no se usan. Los colores rojo/amarillo de los nodos del zoom son decorativos.
- **«Compresión vertical pura» y «los tirones se anulan»:** son idealizaciones de un caso simétrico; en la práctica las torres también trabajan a flexión. El video no dice «pura».
- **Cifras del Golden Gate** (61.500 t por torre, anclajes ≈ 60.000 t, 61 hebras, 27.572 alambres): de las estadísticas oficiales del Golden Gate Bridge District vía búsqueda; confírmalas antes de usarlas en un trabajo.
- **Sin voz:** no hay `OPENAI_API_KEY`. Locución en `ejemplos/animacion-viral/locucion-puentes.txt`. Sin voz el audio sale a ≈ −29 LUFS: **no lo publiques así**; ponle voz desde el Estudio → «Voz en off».
- **Música:** `assets/musica/` vacío; se usó la sintetizada (libre de derechos). **Subtítulos palabra por palabra:** no existen; el texto grande de cada escena los reemplaza. **Fotos:** no se usaron; todo es vectorial. **Telemetría de laboratorio:** solo como instrumentos (potenciómetros, medidores); no se muestran datos reales de sensores.
- **Duración 46,6 s:** sobre los 35 s habituales. Puedo preparar un corte de ≈ 35 s. **60 fps** en lugar de 30. **Zona segura:** el botón del cierre toca el borde del 20 % inferior (plantilla fija del motor).
- **Estructura:** «Ilusión de la cuerda floja» = escenas 1–2; «Duelo de titanes» = escena 3; «Secreto del hilo de araña» = escenas 4–6 (con el cubo de parámetros en lugar del «cubo de flexibilidad»); «Vista interna del acero» = zoom de la escena 7.
