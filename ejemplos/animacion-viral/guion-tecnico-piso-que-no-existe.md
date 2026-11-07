# «El piso que no existe» · guion técnico (IMNOBA, 9:16, ≈ 45 s)

**Marca:** IMNOBA · paleta `imnoba` · **Serie:** ingeniería extrema (ángulo inmobiliario: pisos 13 y 4) · **Estilo:** figuras realistas tipo render (panel de ascensor de acero cepillado con botones, pantalla ámbar, edificio en corte, cuadrícula de edificios y barras sobre el estudio azul marino).
**Cómo se carga:** `node scripts/anim/desde-respuesta.mjs --idea=ejemplos/animacion-viral/idea-piso-que-no-existe.txt --respuesta=ejemplos/animacion-viral/respuesta-ia-piso-que-no-existe.json --paleta=imnoba`. Carpeta de trabajo: `videos/2026-11-07-piso-que-no-existe/`. Código: `src/viral/piezas/flo-kit.tsx` (`PanelAscensor`, `Indicador`, `Edificio`, `Cuadricula`), `flo1.tsx`, `flo2.tsx`; datos y tiempos en `src/anim/piezas.ts` (`FLO`, `TFL`, `rotuloPiso`).
**Música y sonidos:** `videos/2026-11-07-piso-que-no-existe/componer-musica.mjs` → `assets/musica/piso-que-no-existe.wav` → `node scripts/anim/musica.mjs --usar=assets/musica/piso-que-no-existe.wav` (y `--restaurar` al terminar; el WAV no va a git).

## Diseño sonoro (distinto en cada escena)
| Escena | Sonidos propios |
|---|---|
| 1 · gancho | «ding» de llegada · puertas · clics de botones · desafinación hacia abajo del piso fantasma · «¿?» de dos notas |
| 2 · torre | motor del ascensor · cable que cruje · «bip» de cada piso · destello dorado del 13 |
| 3 · conteo | lluvia de teclas · máquina de contar · campana de los 55 · caja registradora |
| 4 · Asia | gong con eco · puerta que se cierra · tritono grave de «muerte» · «tic» de borrado del 4 |
| 5 · precio | campana alegre del 8 · golpe sordo del 4 · barras con «pop» y marimba · bocina de mercado que baja de tono |
| 6 · consejo | contador de pisos · rollo de plano · lápiz · sello de «ok» |
| 7 · cierre | «ding» del ascensor · puertas · jingle de marimba |
Cama musical: bossa-lounge en re menor a 96 bpm (piano eléctrico, bajo caminante, vibráfono, escobillas y rimshot); se «tuerce» (desafina) cuando aparece el piso fantasma y cierra con un giro luminoso.

| # | Pieza | Voz en off | Dato / fuente | Imagen |
|---|---|---|---|---|
| 1 | `flo-gancho` | «Mira este ascensor: salta del doce al catorce. ¿Adónde se fue el piso trece?» | Muchos edificios no rotulan un piso 13 | Panel de acero con el hueco «?» entre el 12 y el 14 |
| 2 | `flo-torre` | «Sí existe: solo lo llaman catorce. Muchos edificios evitan el trece por superstición.» | El piso físico 13 se rotula 14 | Edificio de 16 pisos con piso real a la izquierda y botón a la derecha |
| 3 | `flo-conteo` | «En un conteo de Manhattan, solo cincuenta y cinco de seiscientos veintinueve edificios altos lo muestran.» | City Realty (vía 99 % Invisible): 55 de 629 edificios con 13 o más pisos rotulan un piso 13 | Cuadrícula de 629 edificios con 55 en dorado |
| 4 | `flo-asia` | «En China, Japón y Corea el cuatro suena parecido a muerte. Por eso muchos edificios se lo saltan.» | El 4 suena parecido a «muerte» en chino; hay edificios que omiten el 4 (Korea Times, prensa de Vancouver) | Panel con el hueco en el 4 |
| 5 | `flo-precio` | «El ocho suena a prosperidad. En Vancouver y Hong Kong, el cuatro se vende más barato y el ocho, a veces, más caro.» | Vancouver (99 % Invisible): 8 ≈ +2,5 % y 4 ≈ −2,2 %; Hong Kong (tesis HKU): pisos con 4 ≈ −4,2 % | Fichas 8 y 4 y tres barras |
| 6 | `flo-consejo` | «Si compras un apartamento, cuenta los pisos reales y mira el plano: el botón puede esconder uno.» | Consejo general | Edificio con contador de pisos y plano |
| 7 | `CTA` | «Guárdalo y síguenos en IMNOBA, tu plataforma de propiedades y vehículos.» | — | Cierre con el logo de IMNOBA |

## Precauciones antes de publicar (lo que NO se afirma o se matiza)
- **«El 85 % de los edificios altos no tiene piso 13»:** NO se usa; es una estimación de un ejecutivo de Otis (2002), no un conteo sistemático. Se usa el conteo de Manhattan (55 de 629), que es de una sola ciudad y no representa al mundo.
- **Rótulo vs piso real:** muchos edificios omiten el rótulo «13» pero el piso físico existe; el video lo dice así («solo lo llaman catorce»). No todos los edificios que «saltan» el 13 tienen un piso físico sin usar.
- **Precios:** los porcentajes salen de estudios puntuales (Vancouver, tesis de Hong Kong), son **indicativos** y cambian por mercado y por tipo de vivienda. En Taipei (2012–2017) hallaron descuento para el 4 pero no prima para el 8; en obra nueva con precio uniforme, la prima del 8 desaparece (Chengdu). Un estudio de Nueva York sugiere que ubicación, tamaño y amenidades explican parte de las diferencias. **No aplican a Colombia** ni sirven para decidir una compra.
- **Superstición:** el 4 suena parecido a «muerte» en chino; en Japón y Corea ocurre algo similar con su propia lectura. No se afirma que «todos» los edificios de Asia omitan el 4.
- **Sin asesoría ni promesas:** información general, no promete valorización, ahorro ni ganancia, y no sustituye revisar el plano y la escritura.
- **Esquemas:** panel, edificios y barras son esquemas; el panel con hueco es una ilustración, no el de un edificio concreto.

## Fuentes (búsqueda web, sesión del 7-nov-2026; solo resúmenes de búsqueda)
- 99 % Invisible, «Floor M: avoiding unlucky numbers»; Boing Boing; Metro Manhattan: conteo de City Realty (55 de 629), estimación de Otis (85 %, no usada), estudio de Vancouver (8 ≈ +2,5 %, 4 ≈ −2,2 %).
- Auerbach y Hardesty (condominios de Nueva York); tesis de la U. de Hong Kong (4 ≈ −4,2 %); estudio de Chengdu (2004–2006); estudio de Taipei (2012–2017); Korea Times (tetrafobia).
