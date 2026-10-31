# «La física de los ruidos nocturnos» · guion técnico (SINAPSIS, 9:16, ≈ 51 s)

**Serie:** física cotidiana en SINAPSIS · **Paleta:** `medicina` (marca SINAPSIS) con la paleta de laboratorio del pedido dentro de las piezas (negro #0D0E12, papel #F4F1EA, bermellón #F04124, azul eléctrico, lima ácido, verde de osciloscopio) · **Estilo:** terror abstracto que muta a humor seco de laboratorio; cero objetos literales (sin fantasmas ni muebles): señales, mallas isométricas, columnas, nodos y celdas.
**Cómo se carga:** `node scripts/anim/desde-respuesta.mjs --idea=ejemplos/animacion-viral/idea-ruidos.txt --respuesta=ejemplos/animacion-viral/respuesta-ia-ruidos.json --paleta=medicina`. Carpeta de trabajo: `videos/2026-10-31-ruidos-nocturnos/`. Código: `src/viral/piezas/rui1.tsx` y `rui2.tsx` (usan `anom-ui.tsx`, `dig-kit.tsx` y `pte-kit.tsx`); datos y tiempos en `src/anim/piezas.ts` (`RUI`, `TRUI`, `PIEZAS`).

## Diseño sonoro (lo que pidió el brief)
La música es **propia** (síntesis aditiva, sin muestras ni licencias) y se compone con `videos/2026-10-31-ruidos-nocturnos/componer-musica.mjs`; se activa con `node scripts/anim/musica.mjs --usar=assets/musica/ruidos-nocturnos.wav` y se retira con `--restaurar`. Estructura medida:
| Tramo | Sonido | Nivel (RMS de la pista) |
|---|---|---|
| 0,0–28,9 s · escenas 1–5 | TERROR: dron de 41 Hz con batido lento, clúster disonante (220/233 Hz), pings metálicos con eco, latido que se acelera de 1,0 a 2,2 Hz y un chillido que sube hasta el corte; efectos del motor: estática, golpes, latido | de 0,06 a 0,24 (crescendo) |
| 28,9 s · entra el papel | CORTE BRUSCO (fundido de 5 ms) y 0,35 s de silencio total | 0,000 |
| 29,25–43 s · escenas 6–7 | CLÍNICO: zumbido de red a 60 Hz con armónicos, clics de laboratorio secos, bips de 1 kHz al cambiar de ficha (34,1 y 39,5 s), tecleo corto; efectos del motor: clics, ticks, ding | ≈ 0,028 (≈ −19 dB bajo el terror: seco, audible) |
| 43–52 s · escena 8 | La pregunta final: un swell grave que vuelve despacio y un latido (el punto rojo) | de 0,07 a 0,13 |
Al renderizar sin voz el nivel total es ≈ −29 LUFS: con voz el render normaliza a −14 LUFS.

| # | Pieza | Voz en off | Dato / fuente | Imagen |
|---|---|---|---|---|
| 1 | `rui-gancho` | «A las tres y catorce, un paso en el pasillo. ¿Demonio? No: física.» | Dramatización | Telemetría 03:14: señal plana y un pico que decae; ondas de choque en halftone. Nota «dramatización · señal esquemática» |
| 2 | `rui-dia` | «De día el sol calienta tu casa y todo se expande, en silencio.» | ΔL = α·L·ΔT; aluminio α ≈ 23·10⁻⁶ /K → 1 m con +15 K = 0,345 mm | Malla isométrica azul, fotones lima y tres potenciómetros: temperatura, humedad y expansión (esta última es el **resultado**) |
| 3 | `rui-noche` | «De noche la temperatura cae y todo se encoge, pero no por igual.» | 30 → 12 °C, −0,41 mm por metro de aluminio; la humedad relativa sube al enfriarse el aire (misma humedad absoluta) | La malla se encoge desigual: dos regiones con distinto α y una costura que se vuelve roja |
| 4 | `rui-ritmos` | «Aluminio, acero y madera se contraen distinto, y la madera varía hasta diez veces según su fibra.» | α típicos (10⁻⁶ /K): aluminio 23; acero 12; hormigón 10–14; madera a lo largo de la fibra 3–5 y a lo ancho 30–70 (EngineeringToolbox, Misumi); 10 K menos en 1 m → 0,23 / 0,12 / 0,12 / 0,04 / 0,3 mm | Cinco columnas isométricas |
| 5 | `rui-friccion` | «La fricción frena el movimiento y acumula tensión, hasta que resbala de golpe. Ese salto es el crujido.» | Mecanismo de adherencia y deslizamiento (stick-slip); tablero de 0,5 m que se enfría 2 K con α = 30·10⁻⁶ /K se acorta ≈ 30 µm; sonido a 343 m/s (20 °C): 5 m ≈ 15 ms | Rayos X alámbrico: nodos rojos tirados por resortes sobre una rejilla; medidor de tensión que se descarga en un salto y ondas de choque |
| 6 | `rui-remate` | «Tu cerebro oye un asesino. La física oye un cajón enfriándose dos grados.» | Comparación ilustrativa | Papel con halftone; osciloscopio verde con dos trazas, un óvalo a mano y la nota «igual de brusco, no de fuerte» |
| 7 | `rui-tally` | «El culpable: fricción estática mayor que cinética. Un fallo de diseño, no un fantasma.» | µs > µk (la fuerza para empezar a deslizar es mayor que para seguir deslizando) | Caja de datos con marcas de conteo (卌) y barras µs / µk; sello «FALLO DE DISEÑO · NO FANTASMA» |
| 8 | `rui-micro` | «Si te acercas, no hay espíritus: solo fibras de madera raspando metal. ¿Qué más está por crujir?» | Ilustración de escala | Zoom de 2 mm a 32 µm: celdas de Voronoi vibrando contra un surco en zigzag; colapsan en un punto rojo que late. Pie: «ruidos nuevos con grietas o puertas que no cierran: que lo revise un profesional» |
| 9 | `CTA` | «Guárdalo para tu próxima noche en vela y síguenos en Sinapsis.» | — | Cierre SINAPSIS |

## Precauciones antes de publicar (lo que NO se afirma o se matiza)
- **«A las 3:14 escuchas un paso exacto…» y «el silencio no existe»:** es una **dramatización**; se rotula así en pantalla. No se afirma que un crujido real suene «exactamente» como un paso.
- **«Las ondas de un asesino y de un cajón son idénticas»:** NO se afirma. No existe esa medición; el osciloscopio es **esquemático** (no son grabaciones) y la nota dice «igual de brusco, no de fuerte: el paso es mucho más intenso». Lo único que se compara es el arranque brusco con decaimiento.
- **«La melamina tira de tornillos de acero inamovibles» y «fallo de diseño»:** son **analogías**. El acero **también** se contrae (α ≈ 12): la pantalla dice «casi fijo» en sentido relativo, y el α de los tableros de melamina/MDF **no se verificó** (por eso los nodos no llevan un valor). El «fallo de diseño» es una licencia humorística: los muebles no tienen un «error de diseño» por contraerse.
- **Mecanismo stick-slip como causa de los crujidos nocturnos:** las fuentes de divulgación que encontré (de calidad mixta) hablan de contracción térmica, materiales que se contraen a distinto ritmo y roce en fijaciones; **el término «stick-slip» no aparece en ellas**: es la explicación física estándar de ese tipo de roce, pero aquí es una **inferencia**, no una cita. Los crujidos también dependen de la **humedad** de la madera, no solo de la temperatura.
- **Coeficientes α:** son valores **típicos** y varían con la aleación, la especie, la humedad y la fuente (hormigón 10–14; madera 3–5 a lo largo y 30–70 a lo ancho). El video usa 23, 12, 12, 4 y 30. «Hasta diez veces» entre la fibra a lo largo y a lo ancho es conservador (30/3 = 10; hasta 70/3 > 20).
- **Magnitud del salto (≈ 30 µm):** es un cálculo ΔL = α·L·ΔT de un tablero de 0,5 m a lo ancho de la fibra con 2 K menos; el desplazamiento real de un resbalón depende de la fijación. En pantalla se dice «los saltos reales son de micrómetros».
- **343 m/s:** velocidad del sonido en el aire a 20 °C; cambia con la temperatura (≈ 331 m/s a 0 °C).
- **«Todo se encoge… la casa entera»:** la contracción total de una casa es de milímetros, no se «nota»; el video lo dice con valores por metro y marca «contracción exagerada» en los dibujos.
- **No es una guía de seguridad:** no todos los ruidos nocturnos son inofensivos. Un pie en la última escena avisa: grietas nuevas o puertas que no cierran → que lo revise un profesional. El video no diagnostica la casa de nadie.
- **Zoom final:** las celdas de Voronoi y el zigzag son **ilustraciones**; las células de la madera real no tienen esa forma ni el tornillo ese perfil.

## Fuentes consultadas (búsqueda web, sesión del 31-oct-2026; sin lectura de documentos completos)
- EngineeringToolbox, «Linear Thermal Expansion Coefficients of Materials» (aluminio 23; acero ≈ 12; madera a lo largo ≈ 3 y a lo ancho ≈ 30); Misumi, «Thermal expansion coefficients» (madera 3–5 a lo largo, 30–70 a lo ancho); InspectAPedia y otras tablas (hormigón 10–14).
- Divulgación de construcción sobre crujidos nocturnos (varias páginas de calidad mixta, algunas de relleno automático): enfriamiento de noche, contracción de materiales a distinto ritmo, roce en fijaciones y efecto de la humedad.
- Velocidad del sonido en el aire a 20 °C = 343 m/s (valor estándar).
