# Entrega · «El aire que no avisa» (SINAPSIS · serie medicina y actualidad en SINAPSIS)

**Elegí:** marca SINAPSIS · paleta `medicina` · serie `medicina_actualidad` (nueva en el panel: «Medicina y actualidad en SINAPSIS») · ángulo: aprovechar la noticia del jet privado de Florida **sin afirmar su causa**, y contar lo que la medicina de altura sí sabe (presión, oxígeno, cerebro, segundos de conciencia, síntomas silenciosos, qué funciona).
**Noticia:** Learjet 60 privado (Austin → North Eleuthera, Bahamas) caído en **Greenacres, condado de Palm Beach (Florida)** el 1 de noviembre de 2026; murieron las 9 personas a bordo. El piloto reportó hielo y turbulencia; la NTSB investiga y **la causa no está determinada**.
**Ojo con «Miami»:** el hecho no fue en Miami sino en Greenacres (≈ 100 km al norte); el video dice «Florida». Lo cubrieron medios de Miami (NBC 6).

## 1 · Video final
`trabajo/archivo/2026-11-02-jet-florida-hipoxia/video-final.mp4` (1080×1920 · 60 fps · H.264 · AAC · 61,8 s · **sin voz**: solo diseño sonoro y efectos). Pistas sueltas en `trabajo/archivo/2026-11-02-jet-florida-hipoxia/stems/`. Copia ligera de revisión en esta carpeta (`revision.mp4`).
**Diseño sonoro propio** (síntesis, libre de derechos; compositor en `videos/2026-11-02-jet-florida-hipoxia/componer-musica.mjs`): rugido de turbina que cae al entrar a la cabina, paso del jet con efecto Doppler, sello metálico, viento que se adelgaza al subir, choques de moléculas que se vuelven raros, siseo y escape de presurización, latidos que se aceleran con la hipoxia y se serenan con el oxígeno, zumbido en el oído mientras se cierra la visión en túnel, máscara de oxígeno y acorde abierto al final.

## 2 · Guion final (locución)
1. Un jet privado cayó en Florida. A diez mil metros, tu cuerpo no avisa cuando se queda sin aire.
2. La causa sigue en investigación. Lo que sí se mide: a diez mil metros, la presión del aire cae a casi una cuarta parte.
3. Sigue siendo veintiuno por ciento de oxígeno, pero a tus pulmones llega cinco veces menos, incluso menos que en el Everest.
4. Por eso la cabina se presuriza: adentro, la altura equivalente se limita a unos dos mil cuatrocientos metros.
5. El cerebro pesa dos por ciento del cuerpo, pero gasta veinte por ciento del oxígeno.
6. A treinta y cinco mil pies, la conciencia útil dura entre treinta y sesenta segundos.
7. Lo peligroso es que no duele ni ahoga: aparece euforia, visión en túnel, labios azulados y poco juicio.
8. Por eso los pilotos entrenan en cámaras de altura y usan máscara. El remedio: oxígeno puro y descender.
9. Guárdalo para tu próximo vuelo y síguenos en Sinapsis.

Guion técnico con fuentes, tiempos del sonido y precauciones: `ejemplos/animacion-viral/guion-tecnico-jet.md`.

## 3 · Ganchos
- A) «Un jet cayó en Florida. A diez mil metros, el aire no alcanza.» (la noticia + la tensión) ← **elegido** (en el video: «Un jet privado cayó en Florida. A diez mil metros, tu cuerpo no avisa cuando se queda sin aire.»): la noticia engancha en 1 s y «no avisa» abre una pregunta que se cierra en la última escena (loop: «Tu cuerpo no avisa. La máscara, sí.»).
- B) «¿Qué le pasa a tu cuerpo a diez mil metros de altura?» (curiosidad pura, sin noticia).
- C) «Nueve vidas en Florida y una pregunta: ¿qué sabe la medicina de ese aire?» (más emotivo; descartado por tono: no queremos lucrar con el dolor).

## 4 · Texto para publicar
Un jet privado cayó en Florida ✈️ La causa sigue en investigación (NTSB) y este video no la afirma. Lo que sí se puede medir: a 10.668 m la presión del aire es casi ¼ de la del nivel del mar y a tus pulmones llega ≈ 5 veces menos oxígeno, menos que en la cima del Everest 🫁 Tu cerebro gasta el 20 % del oxígeno y, a 35.000 pies, la conciencia útil dura entre 30 y 60 segundos… y casi no duele ni ahoga. Por eso existen la cabina presurizada, la máscara de oxígeno y el descenso. Guárdalo para tu próximo vuelo y síguenos en Sinapsis. 🧠 (Información educativa; los gráficos son esquemas y no corresponden a ningún vuelo real.)
#hipoxia #medicinadeaviacion #fisiologia #medicina #sinapsis

## 5 · Nota
Espero que estudiantes y profesionales de salud lo guarden como repaso de fisiología de altura (presión parcial, hipoxia, tiempo de conciencia útil) y que el público lo comparta por la noticia. Métrica: retención al pasar la escena 2 (≈ 7 s, el sello «causa en investigación») y guardados + compartidos por cada 1.000 alcanzados. Vigila los comentarios: si alguien pregunta «¿entonces fue hipoxia?», responde que **no se sabe** y fija ese mensaje.

## 6 · Registro
Registrado en el Panel de Videos con estado «grabado» y serie «Medicina y actualidad en SINAPSIS» (`videos/2026-11-02-jet-florida-hipoxia/registro.json`: tu panel lo trae solo al hacer git pull).

## Lo que cambié del pedido y lo que no se pudo cumplir (dicho con claridad)
- **No dije ni sugerí la causa del accidente.** Pediste usar la noticia a nuestro favor: la usé como gancho, pero atribuir una hipoxia o un fallo de presurización a nueve fallecidos sin conclusiones de la NTSB sería desinformación (y el piloto reportó hielo y turbulencia). El video dice en pantalla «causa: en investigación» y en la última escena «sin relación comprobada con el accidente». No muestro víctimas ni imágenes del siniestro.
- **«Miami»:** el accidente fue en Greenacres (Palm Beach), no en Miami. Dije «Florida».
- **35.000 pies:** algunos reportes (Wikipedia y un medio especializado) hablan de esa altitud antes de la caída; no está confirmado. En el video es la altitud de crucero **típica** de un jet de negocios.
- **Cifras que son cálculos míos (no de la investigación):** presión y temperatura con la atmósfera estándar ISA; presión inspirada de O2 = 0,2095 × (P − 47 mmHg) → 149 / 108 / 40 / 28 mmHg; el Everest sale de 40 con este modelo (mediciones reales ≈ 43).
- **Datos con fuente que no pude abrir en esta sesión (red restringida):** FAA AIM 8-1-2 (tabla de conciencia útil), 14 CFR 25.841 (altitud de cabina ≈ 8.000 pies), Raichle y Gusnard 2002 (2 % y 20 %), notas de PBS y Fox. Trabajé con resúmenes de búsqueda y mi conocimiento de fisiología de altura: **confirma las cifras antes de usarlas en un trabajo o en comentarios técnicos.**
- **Ilustraciones:** oxímetro (72 → 98 %), pulso, síntomas y fuga de presión son esquemas educativos; los rangos de conciencia útil varían por persona. No es consejo médico ni guía de procedimientos de vuelo.
- **Sin voz:** no hay `OPENAI_API_KEY` en este entorno (ni ElevenLabs, ni edge-tts). La locución está en `ejemplos/animacion-viral/locucion-jet.txt`. Sin voz el audio sale a ≈ −28 LUFS: **no lo publiques así**; ponle voz desde el Estudio → «Voz en off» (OpenAI o ElevenLabs) o con «Mi voz».
- **Música/efectos:** `assets/musica/` no tiene pistas libres; el sonido es de creación propia. **Subtítulos palabra por palabra:** no existen; el texto grande de cada escena los reemplaza. **Fotos:** no se usaron; todo es vectorial (el jet es genérico, no la aeronave del accidente).
- **Duración 61,8 s:** sobre los 35 s habituales; pediste «súper animación» y 8 escenas a medida. **60 fps** en lugar de 30. **Zona segura:** las líneas de fuente al pie (y ≈ 1.500) y el botón del cierre tocan el borde del 20 % inferior.
- **Estructura:** gancho de noticia (1) → presión (2) → oxígeno (3) → cabina (4) → cerebro (5) → conciencia útil (6) → síntomas silenciosos (7) → qué funciona y cierre del bucle (8) → CTA.
