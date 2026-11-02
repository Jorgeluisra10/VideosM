# Entrega · «Así se construye una piscina a 35 metros» (IMNOBA · serie ingeniería extrema)

**Elegí:** marca IMNOBA · paleta `imnoba` · serie `ingenieria_extrema` · objetivo: que lo **guarden y compartan** y que **sigan a IMNOBA** (una sola llamada a la acción) · público: curiosos de arquitectura e ingeniería y quienes se fijan en cómo se hacen las propiedades · estilo realista tipo render (estudio azul marino, edificios con vidrio, grúa, apoyo de puente en corte, acrílico y agua) con los datos y su fuente siempre en pantalla.
**Caso real:** la Sky Pool de Embassy Gardens (Londres): ≈ 150 t de agua a 35 m, entre dos edificios.

## 1 · Video final
`trabajo/archivo/2026-11-02-piscina-35m/video-final.mp4` (1080×1920 · 60 fps · H.264 + AAC · 42,4 s · **sin voz**: solo música sintetizada del sistema y efectos). Es la misma copia que `trabajo/salida/video-animacion.mp4`; los MP4 no van a git. Copia ligera de revisión en esta carpeta (`revision.mp4`) y pistas sueltas en `trabajo/archivo/2026-11-02-piscina-35m/stems/` (`voz.wav` vacía y `musica-y-efectos.wav`).

## 2 · Guion final (locución)
1. Ciento cincuenta toneladas de agua, a treinta y cinco metros, sin nada debajo. ¿Cómo se construye?
2. Paso uno: el acrílico se flexiona más que el vidrio, por eso su fondo mide treinta y seis centímetros.
3. Paso dos: se fabrica en secciones y se une con juntas adhesivas transparentes.
4. Paso tres: una grúa sube unas cincuenta toneladas, con un margen de apenas treinta centímetros.
5. Paso cuatro: los edificios se mueven distinto. Por eso la piscina descansa sobre apoyos que deslizan y giran.
6. Solo entonces se llena: de cero a ciento cincuenta toneladas. ¿Te animarías a nadar ahí?
7. Guárdalo y síguenos en IMNOBA, tu plataforma de propiedades y vehículos.

Escenas y qué se ve: ver `ejemplos/animacion-viral/guion-tecnico-piscina-35m.md` (con fuentes y precauciones). Piezas a medida (carril B, decidido porque ninguna plantilla dibuja una grúa, un apoyo de puente ni una canaleta de acrílico): `sky-gancho`, `sky-espesor`, `sky-union`, `sky-izado`, `sky-apoyos`, `sky-llenado` + el cierre `CTA` con el logo.

## 3 · Ganchos
- A) «Ciento cincuenta toneladas de agua, a treinta y cinco metros, sin nada debajo.» ← **elegido**: cifra y vértigo desde el segundo 0, con el texto «150 toneladas de agua» en pantalla a la vez que se dice, y la pregunta «¿cómo se construye?» promete los pasos.
- B) «Esta piscina cuelga entre dos edificios. ¿Por qué no se cae?»
- C) «Hay una piscina a treinta y cinco metros. ¿Aguantaría?»

## 4 · Texto para publicar
¿Cómo se sostienen 150 toneladas de agua a 35 metros de altura, sin nada debajo? 🏊‍♂️🏙️ Te mostramos los 4 pasos de la Sky Pool de Londres: un acrílico de fondo grueso (≈ 36 cm), secciones unidas con juntas adhesivas transparentes, una grúa que sube la estructura con apenas ≈ 30 cm de margen y apoyos que deslizan y giran cuando los edificios se mueven. Guárdalo y síguenos en IMNOBA, tu plataforma de propiedades y vehículos. (Información educativa; los gráficos son esquemas.)
#ingenieria #arquitectura #construccion #megaconstrucciones #imnoba

## 5 · Nota
Espero que lo guarden y lo compartan por el vértigo de nadar a 35 m, y que el cierre convierta esa atención en seguidores de IMNOBA. Métrica: guardados y compartidos por cada 1.000 alcanzados, y retención al pasar el paso 1 (≈ 6 s).

## 6 · Registro
Registrado en el Panel de Videos con estado «grabado» y serie «ingeniería extrema» (`videos/2026-11-02-piscina-35m/registro.json`: tu panel lo trae solo al hacer `git pull` / `npm run actualizar`).

## Lo que cambié del pedido y lo que no se pudo cumplir (dicho con claridad)
- **Tema repetido:** ya existe «La piscina que cuelga entre dos edificios» (2026-11-01, marca SINAPSIS, mismo caso). Las reglas piden no repetir temas de los últimos 60 días; lo hice igual porque lo pediste explícitamente y con otro ángulo y otra marca: aquí es el **montaje paso a paso** (grúa y apoyos) para IMNOBA, no el análisis de materiales de SINAPSIS. Si prefieres evitar la repetición, dímelo y lo cambio de ángulo.
- **Sin voz:** no hay `OPENAI_API_KEY` en este entorno. El video sale con música sintetizada y efectos, a **≈ −29 LUFS y con el audio empezando a los 0,1 s (la norma pide −14 LUFS y 0,3 s): NO lo publiques así.** La locución está en `videos/2026-11-02-piscina-35m/guion-locucion.txt`. Para ponerle voz: pon la clave y ejecuta `node scripts/anim/voz.mjs` + `npm run anim:render`, o usa «Voz en off» en el Estudio (ElevenLabs, OpenAI o tu propia voz con `npm run capcut`).
- **Duración 42,4 s** (la norma diaria es 20–35 s «salvo que pida otra»): el pedido pide física, materiales, montaje de la viga y apoyos móviles; en 35 s no cabían los cuatro pasos con calma. Cada escena dura 5–7 s.
- **«Rascacielos»:** son edificios de unas 10 plantas; el video dice «edificios».
- **«Viga de más de 30 cm»:** el fondo mide ≈ 36 cm (356 mm) y las paredes ≈ 18 cm; la escena 2 lo compara con una regla de 30 cm a la misma escala.
- **Montaje paso a paso:** el orden «fabricar y unir → izar → apoyar → llenar» es una **simplificación didáctica**: las fuentes confirman la fabricación por secciones con juntas adhesivas y el izado con grúa móvil, pero no el protocolo detallado. La estructura pesa de 50 a 55 t según la fuente.
- **Grúa:** no doy capacidad ni duración (las fuentes discrepan: 500 t o 750 t con apoyo). El **margen de ≈ 30 cm** sale de una nota de prensa del izado (vía búsqueda): confírmalo antes de publicar. No pude abrir las páginas de Ballymore ni de Ainscough (el entorno no tiene acceso a esos dominios).
- **Apoyos:** las fuentes dicen «apoyos de puente» deslizantes y giratorios. El vaivén de los edificios es una **ilustración exagerada** (no hay cifras de movimiento) y está rotulada; no afirmo que eliminen toda la carga.
- **Cálculos propios (rotulados en pantalla):** presión del fondo 31 kPa (ρ·g·h con 3,2 m) y dilatación ≈ 35 mm en 25 m con +20 °C (α ≈ 70·10⁻⁶ /K). El llenado de 0 a 150 t es una ilustración.
- **No se afirma** que el vidrio «se rompería», que la unión sea una «fusión molecular» ni que los apoyos anulen la torsión. **Sin promesas** de ganancia ni rentabilidad.
- **Música:** `assets/musica/` está vacío; se usó la sintetizada del proyecto (libre de derechos). Pistas libres: `assets/musica/README.md`.
- **Subtítulos palabra por palabra y fotos:** no existen en este motor; el texto grande de cada escena hace de subtítulo y todo es vectorial (no hay fotos de propiedades ni de personas).
- **Zona segura:** el cierre quedó sin el botón inferior de la plantilla para no pisar el 20 % de abajo; el resto cumple (la revisión automática no marcó márgenes). La del motor es más permisiva que la regla (11,5 % arriba, 14,6 % abajo).
- **Verifica las cifras** antes de publicar; las fuentes salieron de búsqueda web (resúmenes), no de los documentos completos.
