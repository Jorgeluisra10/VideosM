# Entrega · «Los dueños del cerebro» (SINAPSIS · serie neuroanatomía en SINAPSIS)

**Elegí:** marca SINAPSIS · paleta `medicina` · serie `neuroanatomia` (nueva en el panel: «Neuroanatomía en SINAPSIS») · gancho de supervivencia.

## 1 · Video final
`trabajo/archivo/2026-10-29-astrocitos-einstein/video-final.mp4` (1080×1920 · 60 fps · H.264 (master CRF 17) · AAC · 44,8 s · **sin voz**: solo música sintetizada y efectos). Pista de música y efectos sola: `trabajo/archivo/2026-10-29-astrocitos-einstein/stems/musica-y-efectos.wav`. Copia ligera de revisión en esta carpeta (`revision.mp4`).

## 2 · Guion final (locución)
1. Ahora mismo, toxinas intentan entrar a tu cerebro. Algo las frena.
2. Son los astrocitos: con sus pies perivasculares envuelven cada capilar y ayudan a mantener la barrera hematoencefálica.
3. Los libros dibujan dos neuronas. Falso: hay un tercer participante, el astrocito.
4. Si la conexión es débil, la eliminan; si importa, la refuerzan. Esculpen tus recuerdos.
5. En los ochenta, Marian Diamond comparó el cerebro de Einstein con el de once hombres.
6. En la corteza parietal izquierda, más células gliales por cada neurona.
7. Una pista, no una prueba: era un solo cerebro.
8. Teñidos con GFAP, forman un cielo nocturno: tu cerebro está lleno de estrellas.
9. Guárdalo para tus repasos y síguenos en Sinapsis.

Guion técnico con fuentes y precauciones: `ejemplos/animacion-viral/guion-tecnico-astrocitos-einstein.md`.

## 3 · Ganchos
- A) «Cuando analizaron el cerebro de Einstein, descubrieron que no tenía más neuronas que tú o yo…» (histórico/viral): potente, pero obliga a afirmar de entrada algo que el estudio no demuestra.
- B) «Ahora mismo, toxinas intentan entrar a tu cerebro. Algo las frena.» ← **elegido** (supervivencia): intriga inmediata, 100 % defendible, y deja a Einstein como clímax del minuto 21.
- C) «Las neuronas se llevan la fama, pero son unas divas inútiles sin sus asistentes: los astrocitos.» (neuroanatomía): buen gancho para estudiantes; «inútiles» exagera.

## 4 · Texto para publicar
Ahora mismo hay toxinas intentando entrar a tu cerebro 🧠 y unas células con forma de estrella las frenan: los astrocitos. Envuelven tus capilares, forman parte de la sinapsis y hasta se investigó si el cerebro de Einstein tenía más glía por neurona… (spoiler: una pista, no una prueba). Guárdalo para tus repasos de histología y síguenos en Sinapsis. (Información educativa; las imágenes son esquemas.)
#neuroanatomia #histologia #astrocitos #neurociencia #sinapsis

## 5 · Nota
Espero que los estudiantes lo guarden para repasar histología/neuroanatomía y que el público lo comparta por la revelación de Einstein (con matiz). Métrica: guardados y compartidos por cada 1.000 alcanzados y retención al pasar la escena 5 (≈ 21 s).

## 6 · Registro
Registrado en el Panel de Videos con estado «grabado» y serie «Neuroanatomía en SINAPSIS» (`videos/2026-10-29-astrocitos-einstein/registro.json`: tu panel lo trae solo al hacer git pull).

## Lo que cambié del pedido y lo que no se pudo cumplir (dicho con claridad)
- **Einstein:** el pedido decía «más astrocitos». El estudio (Diamond 1985) contó **células gliales por neurona** (sin aislar astrocitos), con 11 controles, y solo el área 39 izquierda fue significativa (p < 0,05; 1 de 4 áreas). Críticas: Hines y Colombo 2018. Por eso el video dice «células gliales» y «una pista, no una prueba». Ya no se afirma que el secreto fuera ese.
- **Barrera hematoencefálica:** «ayudan a mantener», no «deciden qué entra»: el sello principal es el endotelio; astrocitos y pericitos lo inducen y mantienen.
- **Sinapsis tripartita:** eliminar/reforzar se apoya en Chung 2013 (ratones); el refuerzo sigue en estudio. «Esculpen recuerdos» es analogía. Araque 1999 está citado de memoria.
- **Histología:** los cortes H&E y GFAP son **esquemas dibujados** (color falso), no fotos de microscopio. GFAP marca procesos/citoesqueleto, no toda la célula.
- **Sin voz:** no hay `OPENAI_API_KEY`. Locución en `ejemplos/animacion-viral/locucion-astrocitos-einstein.txt`. Sin voz el audio sale a ≈ −28 LUFS: **no lo publiques así**; ponle voz desde el Estudio → «Voz en off».
- **Música:** `assets/musica/` vacío; se usó la sintetizada (libre de derechos). **Subtítulos palabra por palabra:** no existen; el texto grande de cada escena los reemplaza. **Fotos:** no se usaron.
- **Duración 44,8 s:** sobre los 35 s habituales (el pedido pide cuatro bloques con clímax). Puedo preparar un corte de ≈ 35 s si quieres.
- **60 fps** en lugar de 30. **Zona segura:** el botón del cierre toca el borde del 20 % inferior (plantilla fija del motor).
- **Estructura:** se fusionaron «Patovica» y «Vista al microscopio» en piezas con campo de microscopio; el «cielo nocturno» cierra el video.
