# La noche que Röntgen vio a través de la piel · guion técnico (SINAPSIS, 9:16, ≈ 65 s)

**Serie:** historia de la medicina en SINAPSIS · **Paleta:** `medicina` (marca SINAPSIS) · **Estilo:** laboratorio oscuro de 1895, tubo de Crookes cubierto con cartón negro, pantalla fluorescente verde con los huesos como sombra, placa fotográfica, línea de tiempo (nov 1895 → hoy) y calendario. Color: verde fósforo = pantalla · azul = rayos · oro = fechas y datos.
**Gancho de actualidad:** el **domingo 8 de noviembre de 2026** se cumplen **131 años** del descubrimiento (8 nov 1895) y ese día es el **Día Internacional de la Radiología** (lo celebran ESR, RSNA y ACR desde 2012).
**Cómo se carga:** `node scripts/anim/desde-respuesta.mjs --idea=ejemplos/animacion-viral/idea-rayos-x.txt --respuesta=ejemplos/animacion-viral/respuesta-ia-rayos-x.json --paleta=medicina`. Carpeta de trabajo: `videos/2026-11-04-rayos-x-roentgen/`. Código: `src/viral/piezas/rx-kit.tsx`, `rx1.tsx` y `rx2.tsx`; datos y tiempos en `src/anim/piezas.ts` (`RXH`, `TRX`, `aniversarioAnios`, `diasEntreFechas`, `diaSemana`).

## Diseño sonoro
Pista propia por síntesis, sin muestras ni licencias: `videos/2026-11-04-rayos-x-roentgen/componer-musica.mjs`. Se activa con `node scripts/anim/musica.mjs --usar=assets/musica/rayos-x-roentgen.wav` y se retira con `--restaurar` (el WAV no va a git). Los eventos usan el ritmo real de cada escena.
| Sonido | Cuándo | Cómo |
|---|---|---|
| Colchón | 0–66 s | acordes graves en Re menor y La menor que se abren a Fa y Re mayor (Nobel y Día de la Radiología) |
| Zumbido y chispas | escenas 1–2 | zumbido eléctrico de 60 Hz y 100 Hz, chispas de la bobina; se corta con el clic de la luz |
| Contador | 131 años, 15 min, monedas | tics suaves mientras corre la cifra y campana al cerrarla |
| Pantalla y huesos | escenas 1 y 3 | destello ascendente al encenderse y campanas al aparecer los huesos |
| X | escena 4 | blips de marimba de los interrogantes y golpe sordo al caer la «X» |
| Placa | escena 5 | siseo del revelado, campana del anillo, reloj de la exposición |
| Mundo | escena 6 | sello, pings de las ciudades que se encienden y chasquido de la aguja |
| Nobel y cierre | escenas 7–8 | golpe del sello, campana dorada, monedas, golpe sordo de las quemaduras y gran campana del 8 de noviembre |
Sin voz, el nivel total es ≈ −27 LUFS; con voz, el render normaliza a −14 LUFS.

| # | Pieza | Voz en off | Dato / fuente | Imagen |
|---|---|---|---|---|
| 1 | `rx-gancho` | «Este domingo se cumplen ciento treinta y un años de la noche en que un físico vio sus propios huesos.» | 2026 − 1895 = 131; 8 nov 2026 es domingo (cálculo propio) | Pantalla verde que se enciende, huesos como sombra y contador 131 |
| 2 | `rx-tubo` | «En Würzburg, Röntgen cubre un tubo con cartón negro y apaga la luz. Aun así, una pantalla cercana empieza a brillar.» | 8 nov 1895, Würzburg; platinocianuro de bario (fluorescente) | Tubo, cartón, bobina, lámpara que se apaga y pantalla que brilla |
| 3 | `rx-huesos` | «Eran rayos invisibles que atravesaban el cartón. Al interponer su mano, según se cuenta, vio sus propios huesos.» | Relato más difundido; los cuadernos de laboratorio se quemaron | Rayos, mano real y sombra de los huesos en la pantalla |
| 4 | `rx-x` | «No sabía qué eran, así que los llamó rayos X, la letra de la incógnita.» | Nombre «X» por lo desconocido | X que se dibuja y signos de interrogación |
| 5 | `rx-anna` | «Seis semanas después, el veintidós de diciembre, radiografió la mano de su esposa Anna Bertha, con su anillo. Tardó quince minutos.» | 22 dic 1895 (44 días ≈ 6 semanas); ≈ 15 min de exposición (Atlas Obscura; Deutsches Röntgen-Museum); «he visto mi muerte» es un relato atribuido | Placa con la mano y el anillo, reloj de exposición y cita «según se cuenta» |
| 6 | `rx-mundo` | «Publicó el hallazgo el veintiocho de diciembre. En enero ya se usaba para ver una aguja clavada en una mano.» | Artículo 28 dic 1895; John Hall-Edwards, 11 ene 1896 (aguja en una mano) | Artículo, ciudades que se encienden y placa con aguja |
| 7 | `rx-nobel` | «Rechazó patentarlo. En mil novecientos uno recibió el primer Nobel de Física, y entregó el dinero a su universidad.» | Primer Nobel de Física 1901; no patentó; dinero a su universidad (según algunas fuentes) | Patente con sello, medalla y monedas a la universidad |
| 8 | `rx-cierre` | «Los pioneros no conocían el riesgo y sufrieron quemaduras. Hoy se dosifican, y el ocho de noviembre es el Día Internacional de la Radiología.» | Clarence Dally (asistente de Edison) murió en 1904 por radiodermatitis: se piensa que fue la primera muerte por rayos X (no se nombra en el video); Día Internacional de la Radiología (2012) | Comparación 1896 vs hoy y calendario del 8 de noviembre |
| 9 | `CTA` | «Compártelo con alguien que estudie salud. Síguenos en Sinapsis.» | — | Cierre de SINAPSIS |

## Precauciones antes de publicar
- **Dibujos esquemáticos, no son imágenes históricas:** el laboratorio, el tubo, la mano y la placa son ilustraciones; la radiografía real de Anna Bertha no se reproduce.
- **El relato tiene versiones:** los cuadernos de Röntgen se quemaron tras su muerte; el momento en que vio sus huesos y la frase «he visto mi muerte» son el relato más difundido y **no son verificables** («según se cuenta» sale en pantalla y en la voz). Hay discrepancias sobre la distancia de la pantalla (por eso no se da) y sobre si la mano de la placa es la izquierda o la derecha.
- **El dinero del Nobel:** «a su universidad» es lo que dicen varias fuentes; el video lo marca «según algunas fuentes».
- **Comparación «hoy»:** «fracciones de segundo» y «dosis medida» son un orden de magnitud; varían según el estudio. **No es consejo médico**: no hay recomendaciones sobre hacerse o evitar radiografías.
- **Sin humor sobre la radiación** ni imágenes de lesiones.
- **No pude abrir** los artículos originales (Röntgen 1895, Hall-Edwards) ni los museos: trabajé con resúmenes de búsqueda. Confirma fechas y cifras antes de usarlas en un trabajo.
- **Sin voz:** no hay `OPENAI_API_KEY`; la locución está en `ejemplos/animacion-viral/locucion-rayos-x.txt`. Sin voz el audio sale a ≈ −27 LUFS: no lo publiques así.
