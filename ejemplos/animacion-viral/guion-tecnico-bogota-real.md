# «Bogotá, la ciudad sin metro» · guion técnico (v3, figuras realistas, 9:16, ≈ 112 s)

**Estilo:** estudio azul marino con piso y reflejo (como los videos de «¿sabías que?»), figuras dibujadas como renders (bus articulado, taxi y autos, tren de metro, torres de vidrio, cronómetros, semáforo, personas) y rótulos grandes que cambian de frase. Cifras en odómetro. Colores: rojo = el problema, dorado = la métrica, esmeralda = el valor del suelo, blanco = texto.
**Cómo se carga:** `node scripts/anim/ejemplo.mjs --tema=bogota-real` (o el botón «🎬 Video realista «Bogotá, la ciudad sin metro»» del Estudio) → Renderizar. La locución para grabar queda en `trabajo/salida/guion-locucion.txt`. Código: `src/viral/piezas/real-kit.tsx` (figuras) y `real1…3.tsx` (escenas); datos y tiempos en `src/anim/piezas.ts` (`BOG`, `REDES_KM`, `TR`, `PIEZAS`).

| # | Pieza | Voz en off | Dato curioso (fuente) | Imagen |
|---|---|---|---|---|
| 1 | `real-historia` 9,2 s | «¿Sabías que Bogotá lleva setenta y siete años esperando un metro? En 1942 tenía 400.000 habitantes. Hoy, casi ocho millones.» | Primer estudio en 1942 (alcalde Carlos Sanz de Santamaría), ciudad de ≈ 400.000; adjudicación en octubre de 2019, «77 años de espera»; población 2025 ≈ 7.942.867 (proyección DANE) | Una aldea de casitas se convierte en un skyline de torres encendidas; odómetros de año (1942→2025) y de habitantes |
| 2 | `real-trancon` 11,5 s | «Mientras tanto, el trancón se volvió un impuesto. En 2019, cada conductor perdió 191 horas en el tráfico: casi ocho días. El peor del mundo, según INRIX.» | INRIX 2019: Bogotá 1.º del mundo con 191 h (2020: 133 h, 1.º; 2022: 122 h, 6.º) | Cronómetro metálico que gira, taxi y autos con luces de freno, semáforo en rojo, ocho «días» que se llenan |
| 3 | `real-bus` 10,5 s | «TransMilenio mueve 43.000 personas por hora y por sentido, con 150 por bus. Pero comparte la calle y apenas pasa de veinte kilómetros por hora.» | Univ. Javeriana (medición): ≈ 43.000 pas/h·sentido, ≈ 150 por articulado, velocidad comercial 22–24 km/h | Bus articulado rojo que llega y frena en el semáforo, pasajeros que asoman por las ventanas |
| 4 | `real-redes` 10,8 s | «Mira el continente. Santiago: 149 km de metro. São Paulo, 110. Buenos Aires, 57. Lima, 40. Medellín, 31. Quito, 23. Bogotá, cero.» | Santiago 149 km (Metro, jun. 2025); São Paulo 110,3; Buenos Aires 56,7; Lima 39,6; Medellín 31,3; Quito ≈ 22,5 | Rieles de acero con su tren y odómetro por ciudad; en Bogotá, un bus articulado donde otros tienen metro («SIN METRO») |
| 5 | `real-tiempo` 8,6 s | «Y Medellín abrió su metro en 1995. Bogotá lo abrirá en 2028: treinta y tres años después.» | Metro de Medellín: 1995; Línea 1 de Bogotá: operación comercial prevista en marzo de 2028 | Dos líneas de tiempo con su tren y una cota dorada de 33 años |
| 6 | `real-viaducto` 8,6 s | «La Línea 1 es otra cosa: 24 kilómetros, 16 estaciones, elevada a catorce metros. Pasa por encima de cada semáforo.» | Línea 1: 23,96 km, 16 estaciones, viaducto elevado de ≈ 13,5–14 m | Tren sobre el viaducto con estela; abajo, taxi, auto y bus quietos en el semáforo; cota «14 m» |
| 7 | `real-untren` 8,8 s | «Un solo tren lleva 1.800 pasajeros: lo mismo que doce buses articulados llenos. Y pasa uno cada noventa segundos.» | 1.800 pasajeros por tren e intervalo mínimo de 90 s (Empresa Metro); 1.800 ÷ 150 = 12 buses (cálculo propio) | Un tren arriba y doce buses que aparecen uno a uno; anillo de 90 s |
| 8 | `real-resultado` 11,5 s | «Resultado: la velocidad pasa a 43 kilómetros por hora. Hasta dos horas de viaje se vuelven 27 minutos. Y la capacidad sube a 72.000 personas por hora.» | Metro: 27 min estimados, 43 km/h, 72.000 pas/h·sentido; «hasta 2 h» hoy en hora pico (reportes de prensa); TransMilenio medido 43.000 | Dos cronómetros (hasta 2 h vs. 27 min) y dos barras en relieve (43.000 vs. 72.000) |
| 9 | `real-plusvalia` 10,2 s | «El efecto oculto: antes de que ruede el primer tren, los predios a menos de 800 metros de las estaciones ya subieron 11,7 %.» | Análisis con datos catastrales reseñado por Noticias RCN: +11,7 % (2019, anuncio) y +8,8 % (2023, obras) a < 800 m; U. del Rosario: +5,7 % apartamentos y +6,9 % casas a 1 km | Torres que se levantan en onda alrededor de la estación, ondas doradas y cota de 800 m, monedas |
| 10 | `real-caminata` 10,8 s | «Cada cinco minutos caminando de más hasta una estación de TransMilenio, el arriendo cae entre 6,8 y 9,3 %. Rodríguez y Targa, 2004.» | Rodríguez y Targa (2004), *Transport Reviews* 24(5): −6,8 a −9,3 % de arriendo por cada 5 min a pie (estudio transversal) | Persona que camina de la estación al edificio de los 5 min, cronómetro, etiquetas de precio, tarjeta académica |
| 11 | `real-cierre` 11 s | «Un metro no solo mueve gente: comprime el tiempo y multiplica el valor del suelo. Marzo de 2028. ¿Cuánto vale una hora de tu vida en esta ciudad?» | Avance de la obra 83,73 % (sept. 2026, Alcaldía) | Skyline con el viaducto y un tren que pasa; barra de avance y pregunta final |

## Fuentes consultadas (búsqueda web)
- Línea 1 (24 km, 16 estaciones, 27 min, 43 km/h, 1.800 pas/tren, 72.000 pas/h·sentido, 90 s, marzo de 2028, 83,73 %): Empresa Metro de Bogotá (rendición de cuentas 2024, comunicados) · Portafolio · Forbes Colombia · Minuto30.
- INRIX: Blu Radio · Forbes Colombia (2020) · Portafolio · El Espectador.
- TransMilenio: Universidad Javeriana, «Methodology for calculating passenger capacity in bus rapid transit» (Transportation Research Record) · blog del Banco Mundial.
- Historia (1942, 77 años, 2019): El Espectador · Noticias Caracol («81 años de trabas») · Bogotá.gov.co.
- Kilómetros: Metro de Santiago (presentación corporativa, jun. 2025) · Wikipedia, lista de sistemas ferroviarios de América Latina por afluencia · Primicias (Quito 22,5 km).
- Valorización: Noticias RCN (análisis con datos catastrales) · Universidad del Rosario (repositorio) · La República (proyección oficial +10–20 % en la Av. Caracas).
- Rodríguez y Targa: Transport Reviews 24(5), 587–610 (UC Berkeley ITS / RePEc).

## Precauciones antes de publicar
- **«El peor del mundo»** vale para 2019 (INRIX); en 2020 también fue 1.º y en 2022 quedó 6.º.
- **«Hasta 2 horas»** es el tiempo que citan reportes de prensa para el recorrido actual en hora pico; no lo medimos nosotros.
- **24 km en 27 min** da 53 km/h y la velocidad comercial oficial es 43 km/h: son cifras oficiales distintas (con y sin paradas); si lo mencionas, aclara cuál es cuál.
- **Plusvalía 11,7 %:** viene de un análisis reseñado por la prensa; busca el estudio original y su autor antes de publicar. El de Rodríguez y Targa es transversal: muestra asociación, no causalidad.
- **Quito 23** es 22,5 km redondeado; Santiago 149 ya incluye las ampliaciones recientes (tu brief decía 140).
- **Población:** 7.942.867 es la proyección DANE 2025; el «400.000» de 1942 es la cifra que cita la prensa.
