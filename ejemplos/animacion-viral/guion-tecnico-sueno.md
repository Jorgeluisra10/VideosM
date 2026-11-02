# «Un día sin dormir» · guion técnico (SINAPSIS, 9:16, ≈ 61 s)

**Serie:** medicina cotidiana en SINAPSIS · **Paleta:** `medicina` (marca SINAPSIS) · **Estilo:** render realista y cinematográfico de noche en vectores: cielo con luna, reloj de pared, alcoholímetro, dial de rendimiento con zonas y límite legal, moléculas de adenosina y cafeína sobre un receptor de membrana, carretera nocturna vista por el conductor con párpados que se cierran, pasillo de hospital y ondas lentas del sueño.
**Cómo se carga:** `node scripts/anim/desde-respuesta.mjs --idea=ejemplos/animacion-viral/idea-sueno.txt --respuesta=ejemplos/animacion-viral/respuesta-ia-sueno.json --paleta=medicina`. Carpeta de trabajo: `videos/2026-11-02-un-dia-sin-dormir/`. Código: `src/viral/piezas/sue-kit.tsx`, `sue1.tsx` y `sue2.tsx` (sobre `real-kit`, `jet-kit` y `anom-ui`); datos y tiempos en `src/anim/piezas.ts` (`SUE`, `TSUE`, `bacPorHoras`, `metrosEn`).

## Diseño sonoro
Pista propia por síntesis, sin muestras ni licencias: `videos/2026-11-02-un-dia-sin-dormir/componer-musica.mjs`. Se activa con `node scripts/anim/musica.mjs --usar=assets/musica/un-dia-sin-dormir.wav` y se retira con `--restaurar` (el WAV no va a git). Los eventos se calculan con el ritmo real de cada escena:
| Sonido | Cuándo (s) | Cómo |
|---|---|---|
| Noche | 0–33 | colchón suave en La menor y grillos lejanos (pulsos de 4,1–4,6 kHz) |
| Tictac que se acelera | 0,9–4,3 y 7,0–10,6 | clics de madera de 3 a 14 por segundo, al ritmo del reloj |
| Alcoholímetro | 0,9–5,0 | 12 pitidos que suben de 900 a 1.800 Hz y un pitido largo a los 0,10 % |
| Campanada de las 17 h | 10,6 | tres notas (Do–Mi–Sol) |
| Alerta del límite legal | 15,9–18,3 | dos tonos tipo sirena (520–1.180 Hz), zap al cruzar 0,08 y golpe grave |
| Moléculas | 21,4–25,6 | burbujeo agudo cada vez más denso con la adenosina |
| Receptor y café | 28,3–30,5 | clic de acople, pulsos de señal, goteo del café y «clunk» + zumbido al bloquearse |
| Carretera, microsueño y despertar | 33–40 | motor y calzada; el tono cae al cabecear; silencio sordo con latido lento al cerrar los ojos; franja sonora, bocina e inhalación al abrirlos |
| Hospital | 40–49 | zumbido de ventilación, monitor cardíaco (70 lpm), tono que sube con la barra roja, alarma doble en +36 % e impacto de choque con cristales |
| Descanso | 49–61 | respiración serena, pulso grave de 0,85 Hz (onda lenta), campana a las 8 h y acorde abierto de La mayor |
Además suena lo que pone el motor (clics, golpes, estática, gotas, ding). Sin voz, el nivel total es ≈ −28 LUFS; con voz, el render normaliza a −14 LUFS.

| # | Pieza | Voz en off | Dato / fuente | Imagen |
|---|---|---|---|---|
| 1 | `sue-gancho` | «Un día sin dormir te deja como si estuvieras borracho, y la ciencia lo midió.» | Dawson y Reid, Nature 1997; Williamson y Feyer, Occup Environ Med 2000: pruebas de laboratorio de rendimiento | Reloj de pared que avanza 24 h y alcoholímetro que sube a 0,10 % (ilustración) |
| 2 | `sue-horas` | «A las diecisiete horas despierto, tu rendimiento ya iguala al de cero coma cero cinco por ciento de alcohol.» | 17 h despierto ≈ 0,05 % de alcohol en sangre **en rendimiento** (Dawson y Reid 1997; Williamson y Feyer 2000, 39 sujetos, algunas pruebas) | Dial 0–0,12 %, hora del día (7:00 → 00:00) y regla de horas; curva **ilustrativa** entre los puntos medidos |
| 3 | `sue-limite` | «Hacia las veinticuatro horas ya es cero coma diez: más que el límite legal para conducir en Estados Unidos.» | ≈ 20–25 h despierto ≈ 0,10 % según la tarea (Lamond y Dawson 1999); límite legal de 0,08 % en la mayoría de los estados de EE. UU. | El dial cruza el límite, alerta roja, chip «LÍMITE EE. UU. · 0,08 %» |
| 4 | `sue-adenosina` | «¿Por qué? Mientras estás despierto, tu cerebro acumula adenosina, una molécula que empuja al sueño.» | La adenosina se acumula con la vigilia y aumenta la presión de sueño; hay otros factores (reloj circadiano) | Cerebro que se tiñe de violeta, moléculas de adenosina y barra de presión de sueño |
| 5 | `sue-cafe` | «El café no la elimina: solo tapa sus receptores, y la adenosina sigue ahí, esperando.» | La cafeína es antagonista competitivo de los receptores A1 y A2A de adenosina; no elimina la adenosina | Receptor en la membrana: adenosina que encaja, cafeína que lo bloquea, adenosina que sigue acumulándose |
| 6 | `sue-micro` | «Y llegan los microsueños: a cien kilómetros por hora, cuatro segundos son ciento once metros a ciegas.» | Microsueño = episodio involuntario de segundos; 100 km/h = 27,8 m/s → 4 s ≈ 111 m (cálculo propio) | Carretera nocturna con perspectiva, párpados que se cierran y contador de metros a ciegas |
| 7 | `sue-hospital` | «Internos con turnos de más de veinticuatro horas cometieron treinta y seis por ciento más errores graves, y chocaron más al volver a casa.» | Landrigan 2004 (NEJM): UCI, internos, +35,9 % de errores médicos graves comparando horarios; Barger 2005 (NEJM): encuesta a internos, odds de choque ×2,3 tras turnos de más de 24 h | Pasillo de hospital, barras 100 vs 136 y tarjeta de choques ×2,3 |
| 8 | `sue-dormir` | «No hay atajo: dormir siete horas o más. Ni el café ni la fuerza de voluntad pagan esa deuda.» | Consenso AASM/SRS 2015: adultos, 7 horas o más de sueño regular | Luna, ondas lentas y el dial que vuelve a 0 durante 8 h de sueño (curva ilustrativa) |
| 9 | `CTA` | «Mándaselo a quien presume de dormir poco y síguenos en Sinapsis.» | — | Cierre de SINAPSIS |

## Precauciones antes de publicar
- **«Borracho» es rendimiento, no alcohol real:** las equivalencias salen de pruebas de laboratorio (tiempo de reacción y coordinación). No significa que haya alcohol en la sangre ni que el riesgo sea idéntico. El video lo aclara en pantalla («*rendimiento en pruebas de laboratorio, no alcohol real»).
- **24 h = 0,10 % es aproximado:** Dawson y Reid asocian 17 h con ≈ 0,05 %; Lamond y Dawson ubican ≈ 0,10 % hacia las 20–25 h según la tarea. El video dice «hacia las veinticuatro horas». No pude abrir los artículos originales: **confirma los números en el texto completo** antes de usarlos en un trabajo.
- **Landrigan 2004:** el +35,9 % compara dos horarios (con y sin turnos de 24 h o más) en UCI y es un número redondeado a «treinta y seis». **Barger 2005:** es una encuesta a internos (odds ×2,3 de choque al volver a casa tras turnos de más de 24 h frente a turnos de menos de 12 h), no un registro de choques.
- **Adenosina y cafeína:** la presión de sueño no depende solo de la adenosina; el esquema molecular y el cerebro son ilustraciones. El video no dice que el café «no sirva»: solo que no elimina la adenosina.
- **7 horas o más:** consenso AASM/SRS 2015 (de memoria; no pude abrirlo en esta sesión).
- **Cálculo propio:** 111 m = 100/3,6 × 4. La curva entre 0 h, 17 h y 24 h y la de recuperación durante el sueño son **ilustraciones**.
- **No se promueve conducir cansado ni se da consejo médico:** el video es información educativa; no es consejo médico ni una prueba de aptitud para conducir. Si estás somnoliento al volante, detente.
- **Sin voz:** no hay `OPENAI_API_KEY`; la locución está en `ejemplos/animacion-viral/locucion-sueno.txt`. Sin voz el audio sale a ≈ −28 LUFS: no lo publiques así.
