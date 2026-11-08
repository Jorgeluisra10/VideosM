# «La casa que vale menos cada año» · guion técnico (IMNOBA, 9:16, ≈ 48 s)

**Marca:** IMNOBA · paleta `imnoba` · **Serie:** ingeniería extrema (ángulo inmobiliario: Japón) · **Estilo:** figuras realistas tipo render (casa de tejas que envejece, lote en bloque, excavadora, gráfico, cuadrícula de casitas y tarjeta de avalúo) sobre el estudio azul marino.
**Cómo se carga:** `node scripts/anim/desde-respuesta.mjs --idea=ejemplos/animacion-viral/idea-casas-japon.txt --respuesta=ejemplos/animacion-viral/respuesta-ia-casas-japon.json --paleta=imnoba`. Carpeta de trabajo: `videos/2026-11-08-casas-japon/`. Código: `src/viral/piezas/jap-kit.tsx` (`CasaJ`, `Terreno`, `Excavadora`, `Escombros`, `Medidor`), `jap1.tsx`, `jap2.tsx`; datos y tiempos en `src/anim/piezas.ts` (`JAP`, `TJP`, `valorContable`).
**Música y sonidos:** `videos/2026-11-08-casas-japon/componer-musica.mjs` → `assets/musica/casas-japon.wav` → `node scripts/anim/musica.mjs --usar=assets/musica/casas-japon.wav` (y `--restaurar` al terminar; el WAV no va a git).

## Diseño sonoro (distinto en cada escena)
| Escena | Sonidos propios |
|---|---|
| 1 · gancho | reloj que se acelera · campana de templo a los 30 años · destello del terreno · tics de los medidores |
| 2 · gráfico | lápiz que traza · marcas de los ejes · golpe de sello en los 22 años · moneda que cae |
| 3 · demolición | motor diésel · quejido hidráulico · crash del derrumbe · traqueteo de escombros · polvo · tres «pop» de barras |
| 4 · por qué | temblor grave · flecha · campanita de cristal de la casa nueva · onda sísmica · tics de las razones |
| 5 · vacías | crujido de puerta · «clac» de madera por cada casita vacía · viento solitario · eco de silbido |
| 6 · lección | papel que se desliza · sello · bolígrafo · «ding» de la clave |
| 7 · cierre | koto en arpegio ascendente · marimba · campana final |
Cama musical: escala hirajoshi en mi a 100 bpm (koto, shamisen, flauta tipo shakuhachi, taiko, bajo sub y pad con phaser); crece con la demolición y se aquieta en las casas vacías.

| # | Pieza | Voz en off | Dato / fuente | Imagen |
|---|---|---|---|---|
| 1 | `jap-gancho` | «En Japón, una casa de treinta años casi no vale nada. Pero el terreno donde está, sí.» | Según analistas del mercado japonés, la construcción pierde valor y el terreno suele conservarlo (esquema) | Casa que envejece de 0 a 30 años con medidores «casa» y «terreno» |
| 2 | `jap-grafico` | «El terreno conserva su valor; la construcción se deprecia. Para impuestos, una casa de madera se deprecia en veintidós años.» | Vida útil tributaria de una casa de madera en Japón: 22 años | Gráfico de depreciación lineal (esquema) |
| 3 | `jap-demole` | «En un dato oficial de dos mil ocho, las casas demolidas tenían treinta y dos años. En Estados Unidos, sesenta y seis.» | Ministerio de transporte de Japón (vía resúmenes): edad promedio de las casas demolidas en 2008 = 32,1 años; EE. UU. 66,6; Reino Unido 80,6 | Excavadora demoliendo y tres barras |
| 4 | `jap-porque` | «No se caen solas: muchas se reemplazan por preferencia a lo nuevo y por normas antisísmicas que cambian.» | Razones citadas por analistas; no es la única causa | Casa vieja → casa nueva y onda sísmica |
| 5 | `jap-vacias` | «Japón también tiene nueve millones de casas vacías: casi catorce de cada cien viviendas, en dos mil veintitrés.» | Encuesta de Vivienda y Suelo 2023: ≈ 9 millones (13,8 % de 65,05 millones); ≈ 3,6 % a la venta | 100 casitas con 14 vacías |
| 6 | `jap-leccion` | «Si compras, pide que separen el valor del terreno y el de la construcción. Ahí está la clave.» | Consejo general | Casa sobre su lote con llaves y tarjeta de avalúo |
| 7 | `CTA` | «Guárdalo y síguenos en IMNOBA, tu plataforma de propiedades y vehículos.» | — | Cierre con el logo de IMNOBA |

## Precauciones antes de publicar (lo que NO se afirma o se matiza)
- **«Las casas en Japón duran 30 años»:** NO se afirma. El dato de ≈ 32 años es la **edad promedio de las casas demolidas** (2008), no su vida física; un estudio que cuenta casas en pie y demolidas estima ≈ 65 años. El video lo rotula («no mide la vida física» y «no es cuánto dura: es cuándo se reemplaza»).
- **«Casi no vale nada»:** es una simplificación del mercado japonés (analistas hablan de que la construcción pierde casi todo su valor en décadas); el medidor es un **esquema ilustrativo**, no precios reales. Una cita de «15 años» atribuida a economistas está sin verificar y NO se usa.
- **22 años:** es la vida útil tributaria de una casa de madera en Japón (depreciación lineal); no es el valor de mercado.
- **Comparación EE. UU./Reino Unido:** los 66,6 y 80,6 años salen del mismo resumen del dato de 2008; existen otras cifras (55 y 77 años) de origen no verificado y no se usan. La voz solo dice «sesenta y seis».
- **Causas:** la preferencia por lo nuevo y los cambios en las normas antisísmicas son razones citadas, no la única causa.
- **Casas vacías:** el 13,8 % (≈ 9 millones) es del censo de 2023 y se debe en buena parte al envejecimiento y la despoblación; el video **no** lo atribuye a la demolición. La cuadrícula de 100 casitas con 14 vacías es una ilustración.
- **Colombia:** el mercado colombiano es distinto; el consejo de pedir el desglose terreno/construcción es general y no es asesoría de compra ni inversión. No se promete valorización, ahorro ni ganancia.

## Fuentes (búsqueda web, sesión del 8-nov-2026; solo resúmenes de búsqueda)
- Resúmenes de datos del ministerio de transporte de Japón (MLIT) sobre edad de demolición (2008): housingjapan.com, e-housing.jp, japanpropertycentral.com, World Architecture; análisis del profesor Jiro Yoshida; depreciación tributaria de 22 años (literatura académica).
- Encuesta de Vivienda y Suelo 2023 (Japón): ≈ 9 millones de viviendas vacías, 13,8 %, vía Kyodo/Nordot, Yahoo News, TBS News y akiyajapan.com.
