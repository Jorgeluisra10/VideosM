# «El aire que no avisa» · guion técnico (SINAPSIS, 9:16, ≈ 62 s)

**Serie:** medicina y actualidad en SINAPSIS · **Paleta:** `medicina` (marca SINAPSIS) · **Estilo:** render realista y cinematográfico en vectores: cielo al atardecer con mar de nubes en paralaje, jet de negocios con estela y luces, corte transversal de la cabina, cerebro con neuronas y glóbulos rojos, instrumentos de cabina, oxímetro y máscara de oxígeno; visión en túnel que se cierra y se abre.
**Noticia que aprovecha:** el 1 de noviembre de 2026 un Learjet 60 privado (de Austin hacia North Eleuthera, Bahamas) cayó en **Greenacres, condado de Palm Beach (Florida)** hacia las 12:50 h; murieron las 9 personas a bordo (anuncio del secretario de Transporte, Sean Duffy). El piloto había reportado hielo, turbulencia y precipitación y pidió subir 2.000 pies. La NTSB (con apoyo de la FAA) investiga; **la causa no está determinada**.
**Cómo se carga:** `node scripts/anim/desde-respuesta.mjs --idea=ejemplos/animacion-viral/idea-jet.txt --respuesta=ejemplos/animacion-viral/respuesta-ia-jet.json --paleta=medicina`. Carpeta de trabajo: `videos/2026-11-02-jet-florida-hipoxia/`. Código: `src/viral/piezas/jet-kit.tsx`, `jet1.tsx` y `jet2.tsx` (sobre `real-kit`, `med1` y `anom-ui`); datos y tiempos en `src/anim/piezas.ts` (`JET`, `TJET`, `isaKPa`, `isaC`, `pio2MmHg`).

## Diseño sonoro
Pista propia por síntesis, sin muestras ni licencias: `videos/2026-11-02-jet-florida-hipoxia/componer-musica.mjs`. Se activa con `node scripts/anim/musica.mjs --usar=assets/musica/jet-florida-hipoxia.wav` y se retira con `--restaurar` (el WAV no va a git). Los eventos se calculan con el ritmo real de cada escena, así que caen donde se ven (tiempos absolutos con las duraciones del JSON):
| Sonido | Cuándo (s) | Cómo |
|---|---|---|
| Rugido de turbina | 0–24 y 50–62 | ruido muy grave filtrado + zumbido de 58 y 116 Hz; cae al entrar a la cabina y se apaga con la hipoxia |
| Paso del jet | 0,2–3,4 | barrido de ruido con efecto Doppler y silbido de turbinas; pitido de «noticia» a los 0,4 s |
| Sello «causa en investigación» | 7,5 | golpe sordo + anillo metálico |
| Aire que se adelgaza | 10,4–15,5 | viento que sube de tono y se vuelve silbido fino arriba; tono al llegar a 10.668 m |
| Choques de moléculas | 16,5–21,4 | chasquidos diminutos, densos a nivel del mar y cada vez más raros (≈ ¼) |
| Siseo de presurización y escape | 26,1–30,8 | flujo de las salidas del techo; a los 29,5 s un escape que cae de tono y el aviso de altitud de cabina |
| Latidos | desde 31,2 | «lub-dub» a 66 → 52 lpm con el cerebro, 78 → 132 lpm con la hipoxia y 124 → 74 lpm con el oxígeno |
| Neuronas | 31,8–35,5 | destellos agudos; a los 35,5 s baja la energía cuando el cerebro se apaga |
| Zumbido en el oído | 44,4–54,6 | tono agudo (3,65 kHz) que crece mientras se cierra el túnel y se apaga al caer la máscara |
| Máscara de oxígeno | 50,6–57,6 | compuerta, caída, siseo con respiración que se calma y acorde de La mayor cuando la visión se abre |
Además suena lo que pone el motor (clics, golpes, estática, gotas, ding). Sin voz, el nivel total es ≈ −28 LUFS; con voz, el render normaliza a −14 LUFS.

| # | Pieza | Voz en off | Dato / fuente | Imagen |
|---|---|---|---|---|
| 1 | `jet-gancho` | «Un jet privado cayó en Florida. A diez mil metros, tu cuerpo no avisa cuando se queda sin aire.» | Noticia: Learjet 60, Greenacres (Florida), 1 nov 2026, causa en investigación (NBC 6 Miami, WPTV, CBS12; NTSB). 10.668 m = 35.000 pies es la altitud de crucero **típica** de un jet de negocios (FL350), no la del vuelo del accidente | Un jet de negocios cruza un mar de nubes al atardecer; altímetro que sube a 35.000 pies; chip «NOTICIA» |
| 2 | `jet-ascenso` | «La causa sigue en investigación. Lo que sí se mide: a diez mil metros, la presión del aire cae a casi una cuarta parte.» | Atmósfera estándar ISA (cálculo propio): 101,3 kPa → 23,8 kPa a 10.668 m (23,5 %), −54 °C | Sello «causa: en investigación»; el jet asciende, el cielo se oscurece, odómetro de metros y anillo de presión |
| 3 | `jet-aire` | «Sigue siendo veintiuno por ciento de oxígeno, pero a tus pulmones llega cinco veces menos, incluso menos que en el Everest.» | PiO2 = 0,2095 × (P − 47 mmHg): 149 (mar), 108 (cabina de 2.438 m), 40 (Everest, 8.849 m) y 28 mmHg (10.668 m); cociente 5,4 (cálculo propio con la atmósfera estándar; la medición real en el Everest da ≈ 43 mmHg) | Dos cámaras de vidrio con moléculas que rebotan (O2 en cian) y barras comparativas |
| 4 | `jet-cabina` | «Por eso la cabina se presuriza: adentro, la altura equivalente se limita a unos dos mil cuatrocientos metros.» | La norma de aeronavegabilidad limita la altitud de cabina a ≈ 8.000 pies (14 CFR 25.841); 8.000 pies = 2.438 m ≈ 75 kPa | Corte transversal: casco, pasajeros, aire denso adentro y escaso afuera; al final la presión se pierde (ilustración) |
| 5 | `jet-cerebro` | «El cerebro pesa dos por ciento del cuerpo, pero gasta veinte por ciento del oxígeno.» | Raichle y Gusnard, PNAS 2002 (≈ 2 % de la masa y ≈ 20 % del metabolismo de oxígeno en reposo) | Cerebro con neuronas y glóbulos rojos; dos cuadrículas de 100 celdas: 2 y 20 |
| 6 | `jet-reloj` | «A treinta y cinco mil pies, la conciencia útil dura entre treinta y sesenta segundos.» | FAA, AIM 8-1-2: tiempo de conciencia útil: 18.000 pies 20–30 min · 25.000: 3–5 min · 30.000: 1–2 min · 35.000: 30–60 s · 40.000: 15–20 s (son rangos y una despresurización brusca los acorta) | Cronómetro con la zona 30–60 s que se enciende y tabla en escala logarítmica |
| 7 | `jet-silencio` | «Lo peligroso es que no duele ni ahoga: aparece euforia, visión en túnel, labios azulados y poco juicio.» | Síntomas de hipoxia descritos por la FAA (euforia, visión en túnel, cianosis, juicio alterado); la hipoxia aparece de forma insidiosa, sin sensación de ahogo | Tablero visto en primera persona; la visión en túnel se cierra y los síntomas aparecen en cápsulas |
| 8 | `jet-descenso` | «Por eso los pilotos entrenan en cámaras de altura y usan máscara. El remedio: oxígeno puro y descender.» | Entrenamiento de fisiología de altura en cámaras hipobáricas (FAA CAMI y fuerzas aéreas); oxígeno suplementario y descenso a menor altitud como tratamiento | Cae la máscara, el altímetro baja de 35.000 a 10.000 pies, el oxímetro sube a 98 % y la visión se abre; «Tu cuerpo no avisa. La máscara, sí.» |
| 9 | `CTA` | «Guárdalo para tu próximo vuelo y síguenos en Sinapsis.» | — | Cierre de SINAPSIS |

## Precauciones antes de publicar
- **Causa del accidente: no se afirma.** La NTSB investiga; el piloto reportó hielo y turbulencia antes de la caída. El video **no sugiere** que la hipoxia, una despresurización o un problema médico causaran el accidente, y lo dice en pantalla (escenas 1, 2 y 8). No muestra víctimas, restos ni imágenes del siniestro. Si la NTSB publica una causa, revisa el gancho y los textos antes de reutilizarlos.
- **Greenacres y no Miami:** el hecho ocurrió en Greenacres (condado de Palm Beach), a ≈ 100 km al norte de Miami; el video dice «Florida». Los medios locales de Miami (NBC 6) lo cubrieron.
- **Altitud del vuelo:** algunos reportes (Wikipedia, un medio especializado) hablan de 35.000 pies antes de la caída; no está confirmado por la NTSB, así que el video usa 10.668 m como altitud de crucero **típica** de un jet de negocios.
- **Cálculos propios (no son datos de la investigación):** presión y temperatura con la atmósfera estándar ISA; PiO2 con la ecuación del gas alveolar simplificada; los 40 mmHg del Everest salen del mismo modelo (mediciones reales ≈ 43 mmHg).
- **Ilustraciones:** la lectura del oxímetro (72 → 98 %), el pulso, los síntomas y la pérdida de presión de la cabina son esquemas educativos; no son registros de ningún vuelo. Los tiempos de conciencia útil son rangos de la FAA y varían por persona; no es consejo médico ni una guía de procedimientos de vuelo.
- **No pude abrir** PBS, Fox News ni las normas de la FAA en esta sesión (red restringida): trabajé con resúmenes de búsqueda y con lo que conozco de la fisiología de altura. **Confirma las cifras antes de usarlas en un trabajo.**
- **Sin voz:** no hay `OPENAI_API_KEY`; la locución está en `ejemplos/animacion-viral/locucion-jet.txt`. Sin voz el audio sale a ≈ −28 LUFS: no lo publiques así.
