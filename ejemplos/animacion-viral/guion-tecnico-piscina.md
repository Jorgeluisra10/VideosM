# «La piscina que cuelga entre dos edificios» · guion técnico (SINAPSIS, 9:16, ≈ 56 s)

**Serie:** ingeniería extrema en SINAPSIS · **Paleta:** `medicina` (marca SINAPSIS) con la paleta de laboratorio del pedido dentro de las piezas (negro #0D0E12, papel #F4F1EA, bermellón = acrílico, azul eléctrico = el modelo que FALLA, lima = acero e instrumentos, cian = agua) · **Estilo:** isometría con halftone, Rayos X alámbrico, potenciómetros, odómetro, marcas de conteo y trazos a mano; construcción «pieza por pieza»: cada pieza resuelve el problema de la anterior.
**Caso real:** la *Sky Pool* de Embassy Gardens (Nine Elms, Londres), diseñada por HAL Architects y Eckersley O'Callaghan, fabricada en acrílico por Reynolds Polymer (Colorado) y abierta a residentes el 19 de mayo de 2021.
**Cómo se carga:** `node scripts/anim/desde-respuesta.mjs --idea=ejemplos/animacion-viral/idea-piscina.txt --respuesta=ejemplos/animacion-viral/respuesta-ia-piscina.json --paleta=medicina`. Carpeta de trabajo: `videos/2026-11-01-piscina-suspendida/`. Código: `src/viral/piezas/pis-kit.tsx`, `pis1.tsx` y `pis2.tsx` (sobre `anom-ui`, `dig-kit` y `pte-kit`); datos y tiempos en `src/anim/piezas.ts` (`PIS`, `TPIS`, `presionKPa`, `dilatacionMm`, `inerciaU`).

## Diseño sonoro (lo que pidió el brief)
Pista propia por síntesis, sin muestras ni licencias: `videos/2026-11-01-piscina-suspendida/componer-musica.mjs`. Se activa con `node scripts/anim/musica.mjs --usar=assets/musica/piscina-suspendida.wav` y se retira con `--restaurar` (el WAV no va a git). **Los eventos se calculan con el ritmo real de cada escena**, así que caen donde se ven:
| Sonido | Cuándo (s) | Cómo |
|---|---|---|
| Viento de altura constante | 0–56 | ruido filtrado con ráfagas lentas y un silbido; sube cuando las torres se mecen (escena 6: 33,5–36,7 s) |
| Fractura de cristal | 8,5 | chasquido seco + 46 esquirlas agudas + golpe sordo; a 9,7 s entra el acrílico con un golpe grave |
| Encastre de las tinas de acero | 25,5 y 25,9 | golpes metálicos graves (parciales inarmónicos 2,76 / 5,4 / 8,9) |
| Zumbido de tensión de los cables | 27,1–31,1 | dos senos casi iguales que baten (118 → 154 Hz) y un tono agudo creciente; un «pling» por tensor |
| Crac de la unión rígida (ilustración) y quejido metálico | 35,1 | ráfaga de ruido + seno que vibra |
| Apoyo que encaja, roce deslizante y «ding» | 36,4 / 36,6 / 38,2 | clang grave, ruido suave y tono de 523 Hz |
| Llenado de agua sincronizado con el odómetro | 40,4–43,3 | chorro filtrado que sube de frecuencia + 140 burbujas; un tono de 784 Hz al llegar a 150 t |
| Chapuzón, burbujeo subacuático y reverberación | 49,8 | ruido filtrado descendente, «plof» grave y 90 burbujas |
Además suena lo que pone el motor (clics, golpes, estática, gotas, ding). Sin voz, el nivel total es ≈ −29 LUFS; con voz el render normaliza a −14 LUFS.

| # | Pieza | Voz en off | Dato / fuente | Imagen |
|---|---|---|---|---|
| 1 | `pis-gancho` | «A treinta y cinco metros de altura, dos edificios sostienen ciento cincuenta toneladas de agua.» | Sky Pool: 35 m de altura, 25 m de largo, 3,2 m de profundidad, vano libre ≈ 15 m entre los edificios (Eckersley O'Callaghan; otras fuentes 14 m) y ≈ 150 t de agua (IStructE) | Dos torres isométricas con halftone, un rectángulo trazado en el vacío y el agua que lo llena; cotas de 35 m y ≈ 15 m |
| 2 | `pis-vidrio` | «¿Y si fuera de vidrio? Sería más pesado, más frágil y menos claro. Por eso usaron acrílico.» | Eckersley O'Callaghan eligió acrílico por menor peso, menor fragilidad, mejor claridad y juntas adhesivas transparentes, **aunque** el acrílico tiene ≈ ¼ de la resistencia y ≈ 20 × más flecha que el vidrio (RIBA J, Spa Business). Densidades: acrílico ≈ 1,18 g/cm³ (hojas de datos) y vidrio ≈ 2,4–2,8 | Viga de vidrio (azul eléctrico) que cede y se fractura (**ilustración**) y el acrílico (bermellón) que la reemplaza; barras de densidad |
| 3 | `pis-acrilico` | «El acrílico flexiona más, por eso es grueso: paredes de dieciocho centímetros, fondo de treinta y seis.» | Paredes de 180 mm y fondo de ≈ 356 mm (14 in) según fuentes (el anuncio de 2015 hablaba de 200 mm); δ ∝ 1/(E·I) | Sección en U con tres potenciómetros: pared, fondo y flecha (el 3.º es el **resultado**: I sube ×3,2 al pasar de 5/10 cm a 18/36 cm) |
| 4 | `pis-union` | «Se unen secciones con juntas adhesivas transparentes, sin tornillos, y el acrílico casi no distorsiona el agua.» | Estructura fabricada en secciones unidas con juntas adhesivas transparentes, sin juntas mecánicas (IStructE, RIBA J); n acrílico ≈ 1,49 y n agua ≈ 1,33 → ley de Snell: 40° en aire → 26° en acrílico y 40° en agua → 35° | Papel crema: dos bloques, una junta que se vuelve transparente y dos rayos que se doblan distinto |
| 5 | `pis-tinas` | «En los extremos, dos tinas de acero y dos tensores de treinta y ocho milímetros abrazan el acrílico.» | Dos tinas de acero inoxidable en los extremos unidas por dos tensores de 38 mm bajo la piscina (Ballymore, RIBA J); p = ρ·g·h = 31,4 kPa a 3,2 m | Rayos X alámbrico: tinas, viga, tensores y diagrama triangular de presión |
| 6 | `pis-viento` | «Pero los edificios se mueven con el viento y con el calor, así que la piscina descansa sobre apoyos deslizantes.» | La piscina se apoya sobre apoyos de puente (deslizantes y giratorios) que permiten el movimiento diferencial entre las torres; el acrílico también se dilata (α ≈ 70·10⁻⁶ /K → 35 mm en 25 m con +20 °C) | Torres que se mecen en sentidos opuestos, viga que falla con una unión rígida (**ilustración**) y apoyos que deslizan |
| 7 | `pis-carga` | «Se abre el grifo: de cero a ciento cincuenta toneladas de agua.» | ≈ 150 t de agua (IStructE) | Odómetro 000 → 150 t, nivel y presión; 15 marcas de conteo (**ilustración**, no el protocolo real) |
| 8 | `pis-zoom` | «Del enlace molecular a la ciudad: una piscina brillando en el aire. ¿Te animarías a cruzar nadando?» | Ilustración de escala (1 µm → 100 m) | Cadenas de polímero → sección de la pared → las torres con la piscina y una silueta nadando |
| 9 | `CTA` | «Guárdalo para tus repasos de estructuras y síguenos en Sinapsis.» | — | Cierre SINAPSIS |

## Precauciones antes de publicar (lo que NO se afirma o se matiza)
- **«Con vidrio, las 150 toneladas la habrían partido en dos el primer día»:** NO se afirma. No hay fuente que diga que un diseño de vidrio se rompería ese día. La **fractura del vidrio es una ilustración** («no una simulación»). Lo respaldado es la comparación de ingeniería: el vidrio laminado de ese espesor habría perdido claridad y pesado más, y el acrílico tiene ≈ ¼ de la resistencia y ≈ 20 × más flecha, pero se eligió por claridad, peso y unión adhesiva.
- **«Mito del vidrio irrompible»:** el video no usa esa expresión. El vidrio no es «irrompible»; el punto es que el acrílico, **más flexible y menos resistente**, necesita más espesor.
- **«Soldadura química a nivel molecular que borra las costuras / acrílico monolítico»:** NO se afirma. Las fuentes dicen **secciones unidas con juntas adhesivas transparentes** (hay una fuente poco fiable que habla de «sin juntas»). El video dice «juntas adhesivas transparentes» y el pie aclara «no “fusión molecular”».
- **«Ninguna fábrica puede moldear 25 m de un golpe» y «50 toneladas» de acrílico:** los 50 t salen de Architectural Digest vía Inverse; la estructura de acrílico **no es de 25 m en una pieza**. No se afirma lo de la fábrica.
- **«Tres potenciómetros: espesor lateral 20 cm, fondo 30 cm»:** las fuentes dan paredes de ≈ 180 mm (200 mm en el anuncio de 2015) y fondo de ≈ 356 mm (14 in); el video usa **18 cm y 36 cm**. El 3.er potenciómetro (elasticidad) se cambió por **flecha**, que es el resultado de los otros dos (δ ∝ 1/I); el acrílico no se «mueve» con un potenciómetro.
- **«Tinas de acero» «invisibles»:** son de acero inoxidable en los extremos, con los escalones y los equipos; no son «invisibles» ni «contienen el empuje horizontal» según las fuentes: solo se dice que unen los extremos con **dos tensores de 38 mm**. Las fuentes discrepan: unas hablan de tensores **pretensados**, otras de **postensados** o «tensados por resortes»: el video dice «tensores» y la pantalla «pre o postensados».
- **«Cables postensados que anulan micro-fisuras» (pieza 4 del pedido):** no se afirma. Las fuentes dicen que los tensores unen las tinas y «reducen las cargas sobre el acrílico».
- **«Sin recibir ni un gramo de torsión»:** NO se afirma. Los apoyos permiten el **movimiento diferencial**, no eliminan todas las cargas. El video dice «descansa sobre apoyos deslizantes».
- **«Un edificio al norte y el otro al sur»:** es una **ilustración** del movimiento opuesto; no hay un dato de milímetros (no encontré cifras de movimiento de los edificios).
- **Dilatación del acrílico:** α ≈ 70–80·10⁻⁶ /K (hojas de datos de cast/extruido; una hoja en unidades imperiales da más); se usa 70 → ≈ 35 mm en 25 m con +20 °C. Es un cálculo ΔL = α·L·ΔT, no un dato del proyecto.
- **Llenado y prueba de carga:** el llenado de 0 a 150 t con 15 marcas es una **ilustración**; no sé cómo fue el protocolo real. Los 150 t vienen de IStructE (≈ 148 m³).
- **Presión:** p = ρ·g·h con 3,2 m de agua = 31,4 kPa en el fondo (hidrostática elemental, no un cálculo del proyecto).
- **Izado:** no está en el video, pero para contexto: una grúa móvil de 500 t lo izó en ≈ 2 horas (Ballymore, Ainscough); el viaje por barco y camión se cuenta de formas distintas según la fuente.
- **Cifras de longitud y vano:** 25 m de largo y 3,2 m de profundidad coinciden en varias fuentes; el vano libre es ≈ 15 m (Eckersley O'Callaghan) o 14 m (otras); el video dice «≈ 15 m».
- **«Nadar a 35 m»:** la altura es la de la piscina sobre el suelo; el video no dice que sea seguro ni da consejos.
- **Esquemas:** todos los gráficos son esquemas (no a escala); el zoom (cadenas de polímero dibujadas al azar) es una ilustración.

## Fuentes consultadas (búsqueda web, sesión del 1-nov-2026; sin lectura de documentos completos: Wikipedia, Ballymore y Reynolds no se pudieron abrir en esta sesión)
- Eckersley O'Callaghan y RIBA J, «Mid-air Sky Pool is the plastic fantastic»; Spa Business; Dezeen: elección del acrílico, comparación con el vidrio, 25 m de largo y 3,2 m de profundidad.
- Ballymore, «Creating a world first: Sky Pool at Embassy Gardens» y notas de prensa: tinas de acero, dos tensores de 38 mm, apoyos de puente, estructura de 50 t.
- IStructE Structural Awards 2022, «Sky Pool»: secciones con juntas adhesivas transparentes y ≈ 150 t de agua.
- Reynolds Polymer Technology, Grand Junction Sentinel y Mitsubishi Chemical Methacrylates (FreeFlow): fabricación, paneles de 356 mm y 180 mm, transporte e izado.
- Hojas de datos de PMMA (SIA Ultraplast, Clax Italia, apsoparts, Princeton): densidad 1,18 g/cm³, módulo ≈ 3 GPa, índice 1,49, dilatación ≈ 70–80·10⁻⁶ /K.
- Índice de refracción del agua (1,33) y densidad del vidrio (2,4–2,8 g/cm³): valores estándar; el del agua no estaba en las búsquedas.
