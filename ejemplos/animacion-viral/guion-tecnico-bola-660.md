# «La bola de 660 toneladas» · guion técnico (IMNOBA, 9:16, ≈ 43 s)

**Marca:** IMNOBA · paleta `imnoba` · **Serie:** ingeniería extrema · **Estilo:** formas geométricas simples (cuadros, triángulos y rombos) que se ensamblan como un mosaico sobre fondo azul marino y violeta con mandala de rombos, dorado de IMNOBA; música psicodélica propia.
**Caso real:** el amortiguador de masa sintonizado del Taipei 101 (Taipéi, Taiwán), fabricado por la empresa A+H Tuned; récord Guinness de mayor amortiguador de masa sintonizado.
**Cómo se carga:** `node scripts/anim/desde-respuesta.mjs --idea=ejemplos/animacion-viral/idea-bola-660.txt --respuesta=ejemplos/animacion-viral/respuesta-ia-bola-660.json --paleta=imnoba`. Carpeta de trabajo: `videos/2026-11-03-bola-660/`. Código: `src/viral/piezas/tmd-kit.tsx` (`Mosaico`, `facetasTorre`, `facetasEsfera`, `Pila`, `Soldador`, `Chispas`, `Espiral`, `PersonaG`, `FondoPsico`), `tmd1.tsx`, `tmd2.tsx`; datos y tiempos en `src/anim/piezas.ts` (`TMD`, `TTM`).
**Música y sonidos:** `videos/2026-11-03-bola-660/componer-musica.mjs` (síntesis propia) → `assets/musica/bola-660-psicodelica.wav` → `node scripts/anim/musica.mjs --usar=assets/musica/bola-660-psicodelica.wav` (y `--restaurar` al terminar; el WAV no va a git).

## Diseño sonoro (distinto en cada parte)
| Escena | Sonidos propios |
|---|---|
| 1 · gancho | gong con caída grave · campanitas de cristal al armarse el edificio · «boing» elástico al abrir la lupa · platillo invertido |
| 2 · viento | ráfagas de viento · crujido metálico de la torre · «whoomp» grave cuando la bola va al revés · riser láser |
| 3 · discos | zumbido de la grúa · chisporroteo de soldadura · yunque que sube de tono cada 5 discos · «ka-chunk» al cerrar el disco 41 · destello de marimba |
| 4 · bola | barrido de armónicos de cristal · «zip» de la cota · latido grave · destellos de marimba · rumor ascendente |
| 5 · cuelga | tañido grave de cable · siseo de pistón · trinquete de cabrestante con una nota de marimba por piso · trinquete que se acelera |
| 6 · tifón | trueno y lluvia · «swoosh» doppler en cada vaivén · estruendo grave · campana de calma con marimba |
| 7 · cierre | jingle de marimba y sitar en arpegio ascendente con destello |
Cama musical: tanpura (drones), sitar, pad con phaser, bajo «wub», tabla y shaker (104 bpm, escala frigia dominante en re) con eco en corchea con puntillo y reverberación; se aligera en la escena 5 y vuelve fuerte en la 6.

| # | Pieza | Voz en off | Dato / fuente | Imagen |
|---|---|---|---|---|
| 1 | `tmd-gancho` | «Dentro del Taipéi ciento uno cuelga una bola de acero de seiscientas sesenta toneladas. ¿Para qué?» | ≈ 660 t (Guinness, A+H Tuned) | El rascacielos se arma con facetas; una lupa muestra la bola dorada colgando; odómetro 0 → 660 t |
| 2 | `tmd-viento` | «Los rascacielos se balancean con el viento. Esta bola se mueve al revés y lo frena.» | Principio del amortiguador de masa sintonizado | Edificio que se mece (exagerado), viento, tifón y la bola que va en sentido contrario |
| 3 | `tmd-discos` | «Se armó dentro del edificio, plancha por plancha: cuarenta y un discos de acero soldados uno sobre otro.» | 41 placas de acero de ≈ 125 mm, unidas por soldadura | Pila de discos que sube de 1 a 41, grúa pórtico, soldador con chispas y andamio |
| 4 | `tmd-bola` | «Cada uno mide doce centímetros y medio. Juntos forman una esfera de cinco metros y medio.» | ≈ 12,5 cm por placa; esfera de ≈ 5,5 m | Esfera de facetas que se ensambla, cota de 5,5 m, lupa de 12,5 cm y una persona para dar escala |
| 5 | `tmd-cuelga` | «Cuelga de cables de acero entre los pisos ochenta y siete y noventa y dos.» | Colgada del piso 92 hasta el 87 | Corte del edificio con los pisos que se iluminan de 87 a 92, cables y pistones |
| 6 | `tmd-tifon` | «En el tifón de dos mil quince, la bola se movió cerca de un metro y frenó el vaivén.» | Tifón Soudelor, 8-ago-2015: ≈ 1 m; «hasta 40 %»: cifra del edificio | Tifón, péndulo que oscila con cota de ≈ 1 m y barras «sin bola 100 % / con bola −40 %» |
| 7 | `CTA` | «Guárdalo y síguenos en IMNOBA, tu plataforma de propiedades y vehículos.» | — | Cierre con el logo de IMNOBA |

## Precauciones antes de publicar (lo que NO se afirma o se matiza)
- **Imágenes:** los dibujos son figuras geométricas hechas a mano a partir de cómo luce el original (esfera dorada colgada, módulos escalonados del edificio); **no son fotos ni calcos de una foto real**. No se pudo descargar fotos reales (Wikimedia está bloqueado en este entorno).
- **Número de cables:** las fuentes discrepan (hay resúmenes que dicen «92 cables», que parece confusión con el piso 92); el video NO da el número. Los pistones y el aro de tope son una interpretación esquemática.
- **«Hasta 40 %»:** es la cifra que da el propio edificio/fabricante y es un máximo, no un resultado típico; el video lo dice y lo rotula.
- **Tifón Soudelor:** el movimiento de ≈ 1 m (8-ago-2015) es lo más grande registrado según Taipei 101 y la prensa; no hay una cifra exacta de 100 cm en todas las fuentes, por eso el video dice «cerca de un metro» y la cota «≈ 1 m». El péndulo del dibujo está exagerado.
- **«Se armó dentro del edificio»:** las fuentes dicen que las placas se soldaron por capas en el sitio; el detalle (andamio, grúa pórtico, un soldador) es una **ilustración**, no el proceso real.
- **Vaivén del edificio:** exagerado a propósito y rotulado; la bola «va al revés» es una simplificación del desfase del amortiguador.
- **Sin promesas inmobiliarias:** el cierre solo invita a seguir IMNOBA; no promete ganancias ni rentabilidad ni da asesoría.

## Fuentes (búsqueda web, sesión del 3-nov-2026; solo resúmenes de búsqueda)
- Guinness World Records, «Largest tuned mass damper»; Taiwan News; The Civil Engineer; Business Insider: 660 t, esfera de ≈ 5,5 m, 41 placas de ≈ 125 mm soldadas, piso 92 al 87, «hasta 40 %», movimiento de ≈ 1 m en el tifón Soudelor (2015).
