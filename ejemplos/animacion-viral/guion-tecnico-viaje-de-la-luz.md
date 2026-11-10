# «El viaje de la luz» · guion técnico (IMNOBA, 9:16, ≈ 61 s)

**Marca:** IMNOBA · paleta `imnoba` · **Serie:** ingeniería extrema · **Estilo:** viaje en primera persona (POV) de la energía: túnel de líneas de velocidad, paquete de energía dorado con estela, golpes de zoom y destellos; objetos tipo render (caldera, presa, turbina, generador en corte, transformador, torres en perspectiva, poste, casa, medidor, enchufe, lámpara) sobre azul noche.
**Cómo se carga:** `node scripts/anim/desde-respuesta.mjs --idea=ejemplos/animacion-viral/idea-viaje-de-la-luz.txt --respuesta=ejemplos/animacion-viral/respuesta-ia-viaje-de-la-luz.json --paleta=imnoba`. Carpeta de trabajo: `videos/2026-11-10-viaje-de-la-luz/`. Código: `src/viral/piezas/cen-kit.tsx` (`FondoPOV`, `Paquete`, `Caldera`, `Fuego`, `Presa`, `Turbina`, `Generador`, `Onda`, `Transformador`, `TorresPOV`, `Poste`, `Casa`, `MedidorLuz`, `Interruptor`, `Lampara`, `Enchufe`, `golpe`), `cen1.tsx`, `cen2.tsx`; datos y tiempos en `src/anim/piezas.ts` (`CEN`, `TCE`, `frecuenciaRed`).
**Música y sonidos:** `videos/2026-11-10-viaje-de-la-luz/componer-musica.mjs` → `assets/musica/viaje-de-la-luz.wav` → `node scripts/anim/musica.mjs --usar=assets/musica/viaje-de-la-luz.wav` (y `--restaurar` al terminar; el WAV no va a git).

## Diseño sonoro (distinto en cada escena)
| Escena | Sonidos propios |
|---|---|
| 1 · gancho | clic del interruptor · zumbido de la lámpara · whoosh que se mete por el cable · «ping» de llegada |
| 2 · fuente | crepitar del fuego · rugido del quemador · chorro de agua · zap del paquete |
| 3 · turbina | rotor que acelera · silbido del vapor · golpe grave de arranque |
| 4 · generador | tics del imán por cada bobina · zumbido eléctrico que crece · «ding» de la onda |
| 5 · transmisión | zumbido de transformador a 120 Hz · zap de subida de voltaje · corona · paso de cada torre |
| 6 · barrio | golpe del poste · zap de bajada de voltaje · campanita de la ventana · clics del medidor |
| 7 · balance | radar · tics de casas que se encienden · tono de 60 Hz · «ding» de igualdad |
| 8 · enchufe | llegada · golpe seco al conectar · destello y «ding» de la lámpara · zumbido del filamento |
| 9 · cierre | arpegio de sintetizador y marimba |
Cama musical: synth-electro en la menor a 124 bpm (bajo de sierra con sidechain, arpegiador, pad con phaser, bombo, aplauso y hats) con subidas en cada cambio de escena; el «drop» llega en las torres.

| # | Pieza | Voz en off | Dato | Imagen |
|---|---|---|---|---|
| 1 | `cen-gancho` | «Aprietas un interruptor y se enciende la luz. ¿De dónde sale esa energía? Ven, sígueme.» | — | Interruptor y lámpara; zoom al interruptor y túnel con el paquete |
| 2 | `cen-fuente` | «Todo empieza con fuego o con agua: una caldera quema combustible, o una presa deja caer el agua.» | Centrales térmicas (combustible) e hidráulicas (agua) | Caldera con llamas y presa con caída de agua |
| 3 | `cen-turbina` | «El vapor, o el agua que cae, empuja las aspas de una turbina gigante que no deja de girar.» | Una turbina convierte el empuje en giro | Turbina que acelera con chorro de vapor |
| 4 | `cen-generador` | «Gira un imán dentro de bobinas de cobre. Imán en movimiento, cable cerca: ahí nace la electricidad.» | Inducción electromagnética (Faraday) | Generador en corte con bobinas que brillan y onda senoidal |
| 5 | `cen-transmision` | «Un transformador sube el voltaje a cientos de miles de voltios, y la energía cruza el país por torres con menos pérdidas.» | Mayor voltaje = menor corriente = menos pérdidas (P = I²R) | Transformador y vuelo por torres en perspectiva |
| 6 | `cen-barrio` | «En tu barrio, otro transformador la baja a ciento veinte voltios, y llega a tu casa.» | 120 V y 60 Hz típicos de una vivienda en Colombia | Poste, casa y medidor de luz |
| 7 | `cen-balance` | «Y el truco: casi no se guarda. Cada segundo, las centrales producen justo lo que millones de casas consumen.» | La red equilibra producción y consumo; la frecuencia (60 Hz) es la señal | Dos barras iguales, ciudad que se enciende y medidor de frecuencia |
| 8 | `cen-enchufe` | «Y llega al enchufe. Un viaje de un instante que empezó en una central.» | — | Paquete que entra al enchufe y la lámpara se enciende |
| 9 | `CTA` | «Guárdalo y síguenos en IMNOBA, tu plataforma de propiedades y vehículos.» | — | Cierre con el logo de IMNOBA |

## Precauciones antes de publicar (lo que NO se afirma o se matiza)
- **Datos NO verificados en esta sesión:** la búsqueda web llegó a su límite semanal; todo se basa en física básica y valores típicos. Antes de publicar, confirma con una fuente de XM/UPME/CREG: 120 V y 60 Hz en viviendas colombianas y los niveles de transmisión.
- **«Cientos de miles de voltios»:** es un orden de magnitud (el sistema de transmisión nacional usa tensiones de ese orden); no se da una cifra exacta.
- **Sin porcentajes ni cifras de producción:** no se dice cuánta electricidad sale de agua o de combustibles ni cuántas casas atiende una central.
- **«Casi no se guarda»:** se refiere al almacenamiento a gran escala; existen baterías y embalses (incluso bombeo), pero cubren una parte pequeña. «Cada segundo» es una simplificación: producción y consumo se equilibran continuamente y la frecuencia indica el desbalance.
- **Velocidad de la energía:** el video NO afirma «a la velocidad de la luz» (la energía de la señal viaja a una fracción alta de la luz, pero los electrones se mueven lento); se evitó para no inducir a error.
- **Esquemas:** todo está simplificado y fuera de escala; el viaje del «paquete» es una metáfora, no una partícula real; la flecha de energía no representa electrones.
- **Seguridad y asesoría:** información general; no es asesoría técnica ni de instalaciones eléctricas, y no se debe manipular una instalación sin un profesional. No promete ahorro ni ganancia.
