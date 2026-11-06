# «Los 3 códigos escondidos en tu vehículo» · guion técnico (IMNOBA, 9:16, ≈ 42 s)

**Marca:** IMNOBA · paleta `imnoba` · **Serie:** ingeniería extrema · **Estilo:** figuras realistas tipo render (estudio azul marino de `real-kit.tsx`): medidor de gasolina con aguja, vehículo desde arriba con surtidor, llanta con placa DOT que se agrieta, placa metálica del VIN, parabrisas y tarjeta de propiedad.
**Cómo se carga:** `node scripts/anim/desde-respuesta.mjs --idea=ejemplos/animacion-viral/idea-codigos-vehiculo.txt --respuesta=ejemplos/animacion-viral/respuesta-ia-codigos-vehiculo.json --paleta=imnoba`. Carpeta de trabajo: `videos/2026-11-06-codigos-vehiculo/`. Código: `src/viral/piezas/aut-kit.tsx` (`Medidor`, `AutoPlanta`, `Isla`, `Llanta`, `PlacaVIN`, `Parabrisas`, `Tarjeta`), `aut1.tsx`, `aut2.tsx`; datos y tiempos en `src/anim/piezas.ts` (`AUT`, `TAT`, `vinAnioModelo`).
**Música y sonidos:** `videos/2026-11-06-codigos-vehiculo/componer-musica.mjs` → `assets/musica/codigos-vehiculo.wav` → `node scripts/anim/musica.mjs --usar=assets/musica/codigos-vehiculo.wav` (y `--restaurar` al terminar; el WAV no va a git).

## Diseño sonoro (distinto en cada escena)
| Escena | Sonidos propios |
|---|---|
| 1 · gancho | arranque del motor (marcha y encendido) · «tics» de la aguja · campanita del cinturón · riser |
| 2 · tanque | intermitente «tic-toc» · tapa que abre · pistola que encaja · gluglú de la gasolina · timbre de la bomba |
| 3 · llanta | chirrido de llanta · golpe de goma · barrido del zoom · sello del código · 52 clics del calendario |
| 4 · edad | crujido del caucho · grietas · reloj que se acelera · pitido de aviso (6 años) y alarma doble (10 años) |
| 5 · VIN | máquina de escribir al estampar la placa · «bip» de escáner · acorde de la T · tabla de años |
| 6 · repaso | limpiaparabrisas · barrido láser · golpe de papel de la tarjeta · tres «tics» de la lista |
| 7 · cierre | «bip-bip» del seguro del vehículo · portazo · jingle de marimba |
Cama musical: synthwave en la menor a 108 bpm (arpegiador de sierra con filtro, bajo con compuerta, pad con phaser, kick, caja y hi-hats); entra en la escena 2, se aligera en la 4, sube en la 5 y explota en la 6.

| # | Pieza | Voz en off | Dato / fuente | Imagen |
|---|---|---|---|---|
| 1 | `aut-gancho` | «Esa flechita junto al medidor de gasolina no está de adorno. Y hay dos códigos más escondidos.» | La flecha junto al icono de la bomba indica el lado de la tapa del tanque | Medidor con aguja que sube y flechita dorada que pulsa |
| 2 | `aut-tanque` | «Apunta al lado donde está la tapa del tanque, así nunca te equivocas de lado en la bomba.» | Ídem; algunos modelos antiguos no la traen | Vehículo desde arriba con surtidor a la izquierda y luego a la derecha |
| 3 | `aut-llanta` | «Segundo: en la llanta, los últimos cuatro números del DOT son semana y año de fabricación.» | DOT: 4 últimos dígitos = semana y año (llantas desde el 2000); ejemplo «3624» = semana 36 de 2024 | Zoom a la placa de la llanta y calendario de 52 semanas |
| 4 | `aut-edad` | «Muchos fabricantes recomiendan cambiarlas entre los seis y diez años, aunque tengan dibujo.» | Recomendación habitual de fabricantes: 6 a 10 años (Ford, Nissan y Mercedes-Benz recomiendan 6 según resúmenes) | Llanta que se agrieta mientras corre una línea de tiempo de 0 a 10 años |
| 5 | `aut-vin` | «Tercero: el VIN. Su décimo carácter es el año modelo; la T, por ejemplo, es dos mil veintiséis.» | 10.º carácter = año modelo (no se usan I, O, Q, U, Z ni 0); ciclo de 30 años (S = 1995 o 2025) | Placa de 17 caracteres con la casilla 10 resaltada, T = 2026 y tabla R·S·T·V |
| 6 | `aut-repaso` | «Lo encuentras en el parabrisas y en la tarjeta de propiedad. Revísalo antes de comprar.» | El VIN se ve en la base del parabrisas y en la tarjeta de propiedad | Esquina del parabrisas con la placa y la tarjeta con el VIN resaltado; lista 1·2·3 |
| 7 | `CTA` | «Guárdalo y síguenos en IMNOBA, tu plataforma de propiedades y vehículos.» | — | Cierre con el logo de IMNOBA |

## Precauciones antes de publicar (lo que NO se afirma o se matiza)
- **La flecha:** indica el lado de la tapa en casi todos los modelos modernos, pero no en todos (hay excepciones y los modelos antiguos pueden no traerla). El video lo rotula. No se afirma nada sobre la posición de la manguera del icono (Snopes: no es confiable).
- **DOT:** los 4 últimos dígitos son semana y año en llantas fabricadas desde el 2000 (antes eran 3 dígitos). «3624» y «DOT 7MR3» son **ejemplos ilustrativos**, no la llanta de nadie.
- **Edad de las llantas:** muchos fabricantes recomiendan cambiarlas entre 6 y 10 años desde la fabricación, sin importar el dibujo; las fuentes no coinciden en un número único (algunas piden revisarlas desde los 5). No se afirma que «caduquen» a los 6 o a los 10 años ni se da asesoría; se manda a revisar el manual. No se pudo confirmar la postura de la NHTSA.
- **VIN:** el décimo carácter es el año **modelo**, no la fecha de fabricación, y aplica en la mayoría de vehículos (sobre todo los del sistema norteamericano); el ciclo se repite cada 30 años (S = 1995 o 2025). La placa del video usa «X» como relleno: es ilustrativa.
- **Tarjeta de propiedad y parabrisas:** el VIN suele estar en la base del parabrisas (lado del conductor) y en la tarjeta de propiedad; la tarjeta del video es un dibujo genérico con campos ilustrativos, no un documento real.
- **Sin asesoría ni promesas:** información general; no promete ahorro ni ganancia ni sustituye una revisión mecánica o legal antes de comprar.

## Fuentes (búsqueda web, sesión del 6-nov-2026; solo resúmenes de búsqueda)
- Motor1, Gear Patrol, Jalopnik, Snopes: la flecha junto a la bomba indica el lado de la tapa del tanque.
- Guías de código DOT (Capital One, Sensor Automotriz, Mucho Neumático): semana y año en los 4 últimos dígitos; recomendaciones de 6 a 10 años.
- VIN Year Chart (ALLDATA, CarsXE, Wikibooks): décimo carácter = año modelo; I, O, Q, U, Z y 0 no se usan; ciclo de 30 años.
