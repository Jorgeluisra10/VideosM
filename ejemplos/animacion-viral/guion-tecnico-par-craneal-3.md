# El par craneal III: la pupila que avisa · guion técnico (SINAPSIS, 9:16, ≈ 63 s)

**Serie:** pares craneales en SINAPSIS (par III; el 0, el I y el II salieron antes) · **Paleta:** `medicina` (marca SINAPSIS) · **Estilo:** anatomía vectorial esquemática sobre fondo oscuro: dos ojos con pupilas que reaccionan o no, músculos del ojo en ámbar, vía del reflejo fotomotor con óptico azul y oculomotor ámbar, vista lateral del recorrido entre dos arterias y el seno cavernoso, corte del nervio con fibras verdes en la superficie, corte coronal con herniación del uncus, cara con párpado caído y arteria con aneurisma, y señal de urgencias. Color: ámbar = oculomotor (III) · azul = óptico (II) · verde = fibras de la pupila · rojo = presión, daño y urgencia · violeta = cerebro.
**Cómo se carga:** `node scripts/anim/desde-respuesta.mjs --idea=ejemplos/animacion-viral/idea-par-craneal-3.txt --respuesta=ejemplos/animacion-viral/respuesta-ia-par-craneal-3.json --paleta=medicina`. Carpeta de trabajo: `videos/2026-11-11-par-craneal-3/`. Código: `src/viral/piezas/oc-kit.tsx`, `oc1.tsx` y `oc2.tsx` (reusa `polyPt` de `op-kit.tsx`); datos y tiempos en `src/anim/piezas.ts` (`OC`, `TOC`).

## Diseño sonoro
Pista propia por síntesis, sin muestras ni licencias: `videos/2026-11-11-par-craneal-3/componer-musica.mjs`. Se activa con `node scripts/anim/musica.mjs --usar=assets/musica/par-craneal-3.wav` y se retira con `--restaurar` (el WAV no va a git). Los eventos usan el ritmo real de cada escena.
| Sonido | Cuándo | Cómo |
|---|---|---|
| Colchón | 0–66 s | acordes en La menor, Fa, Re menor, Mi menor, La menor tenso y Mi menor sobrio (la alerta) |
| Gancho | escena 1 | golpe del trauma, chispa de la pupila dilatada y alarma de la emergencia |
| Músculos y reflejo | escenas 2–3 | pops de los cuatro músculos, campana del párpado, zap de la luz y pulsos azul y ámbar |
| Recorrido y fibras | escenas 4–5 | tics del nervio entre las arterias y golpe de la compresión |
| Herniación y aneurisma | escenas 6–7 | whoosh del desplazamiento, golpe grave de aplastamiento y latidos del aneurisma |
| Urgencia | escena 8 | tres tics de las señales y campana de alerta final |
Sin voz, el nivel total es ≈ −27 LUFS; con voz, el render normaliza a −14 LUFS.

| # | Pieza | Voz en off | Dato / fuente | Imagen |
|---|---|---|---|---|
| 1 | `oc-gancho` | «Una pupila dilatada tras un golpe en la cabeza puede ser una emergencia: el par craneal tres está pidiendo ayuda.» | Pupila dilatada y fija ipsilateral = signo clásico de compresión del III por herniación del uncus (StatPearls); la midriasis tiene otras causas (golpe directo al ojo, fármacos) | Dos ojos: uno reacciona a la luz y el otro no |
| 2 | `oc-musculos` | «El oculomotor mueve cuatro de los seis músculos que giran cada ojo y además levanta el párpado.» | III: rectos superior, inferior y medial, oblicuo inferior y elevador del párpado; oblicuo superior (IV) y recto lateral (VI) (Radiopaedia, textos de anatomía) | Ojo con los músculos del III en ámbar |
| 3 | `oc-reflejo` | «Si una luz entra en un ojo, el nervio óptico avisa y el oculomotor cierra las dos pupilas, no solo una.» | Reflejo fotomotor: aferencia por el II, eferencia parasimpática (Edinger-Westphal, ganglio ciliar) con el III; respuesta consensual (StatPearls); el detalle de las conexiones pretectales se simplifica | Vía azul y ámbar entre ojos y mesencéfalo |
| 4 | `oc-recorrido` | «Nace en el mesencéfalo, pasa entre dos arterias del cerebro y cruza el seno cavernoso hasta la órbita.» | Sale en la fosa interpeduncular entre la arteria cerebral posterior y la cerebelosa superior, cruza el seno cavernoso y entra por la fisura orbitaria superior (referencias de anatomía) | Vista lateral esquemática |
| 5 | `oc-fibras` | «Las fibras de la pupila van por la superficie del nervio: suelen ser las primeras en sufrir cuando algo lo comprime.» | Explicación clásica: las fibras parasimpáticas van por la superficie; una revisión de 2020 matiza que no es tan simple (a veces hay miosis inicial) | Corte del nervio con fibras verdes y ámbar |
| 6 | `oc-herniacion` | «Si sube la presión dentro del cráneo, el lóbulo temporal puede desplazarse, aplastar el nervio y dilatar la pupila.» | Herniación del uncus: compresión del III contra el borde de la tienda del cerebelo (StatPearls); la dilatación suele ser el primer signo | Corte coronal con masa, uncus y nervio |
| 7 | `oc-aneurisma` | «Un aneurisma cercano también puede comprimirlo: el párpado cae, el ojo se desvía hacia abajo y afuera y la pupila se dilata.» | Parálisis aguda del III con pupila dilatada: aneurisma de la comunicante posterior hasta demostrar lo contrario (WikEM, MSD Manuals); algunos aneurismas respetan la pupila; en la diabetes suele respetarse | Cara con ptosis y arteria con aneurisma sobre el nervio |
| 8 | `oc-urgencia` | «Un párpado caído de golpe, con visión doble o dolor de cabeza intenso, merece atención médica urgente.» | Se recomienda estudiar con imagen toda parálisis nueva del III; el dolor de cabeza brusco e intenso con pupila dilatada sugiere aneurisma roto | Tres señales de alerta y señal de urgencias |
| 9 | `CTA` | «Compártelo con alguien que ame el cerebro. Síguenos en Sinapsis.» | — | Cierre de SINAPSIS |

## Precauciones antes de publicar
- **Dibujos esquemáticos, no son imágenes médicas.** El corte del nervio, la herniación y el aneurisma son simplificaciones; no a escala.
- **No sirve para autodiagnóstico.** Una pupila grande tiene otras causas (golpe directo al ojo, gotas o fármacos, variantes normales como la anisocoria fisiológica); el video dice «puede ser».
- **Fibras superficiales:** es la explicación clásica de por qué la pupila falla primero, pero hay matices (a veces hay miosis inicial; algunos aneurismas respetan la pupila). El video dice «suelen».
- **Aneurisma:** un aneurisma a veces respeta la pupila (no la dilata) y la parálisis isquémica (diabetes, hipertensión) suele respetarla; por eso la recomendación es estudiar toda parálisis nueva del III, no confiar en la pupila.
- **Mensaje final:** «atención médica urgente» ante párpado caído brusco, visión doble o dolor de cabeza intenso; no es consejo médico ni diagnóstico, es una advertencia general.
- **No pude abrir** los artículos originales ni las guías clínicas: trabajé con resúmenes de búsqueda (StatPearls, WikEM, MSD Manuals, Radiopaedia). Confirma antes de usarlo en un trabajo.
- **Sin voz:** no hay `OPENAI_API_KEY`; la locución está en `ejemplos/animacion-viral/locucion-par-craneal-3.txt`. Sin voz el audio sale a ≈ −27 LUFS: no lo publiques así.
