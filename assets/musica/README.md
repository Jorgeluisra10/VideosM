# Música libre de derechos

Aquí van SOLO pistas libres de derechos o creadas por ti. **Nunca canciones comerciales** (Instagram y
TikTok te silencian o bajan el video).

## Cómo agregar una pista
1. Consigue una pista **instrumental (sin letra)**, de al menos 30 s (si el video dura más, se repite en
   bucle), con energía acorde a la serie: más suave para estafas o datos, más arriba para sorpresas.
2. Cópiala aquí (`assets/musica/`). Formatos: mp3, wav, m4a, aac, ogg, flac u opus. Nombre sugerido:
   `energia-titulo.mp3` (p. ej. `suave-amanecer.mp3`).
3. Anota en `LICENCIAS.md` de dónde salió, su licencia y la atribución si la exige (una línea por pista).
4. Actívala: `node scripts/anim/musica.mjs --listar` y luego
   `node scripts/anim/musica.mjs --usar=assets/musica/suave-amanecer.mp3`.
   Quedará como música de fondo de los siguientes videos hasta que cambies de pista o hagas
   `node scripts/anim/musica.mjs --restaurar` (vuelve a la música sintetizada del proyecto, que crea el
   sistema y es libre de derechos). `--actual` dice cuál está en uso.

## No tienes que ajustar el volumen
El render nivela cualquier pista al mismo volumen y la deja ≈ 24 dB por debajo de la voz mientras
habla (ducking automático), con fundido de entrada y de salida. Los efectos de sonido los pone el sistema.

## Dónde conseguir música libre
Verifica SIEMPRE la licencia vigente de cada pista antes de usarla (cambian) y guarda la prueba:
- **Biblioteca de audio de YouTube** (YouTube Studio → Biblioteca de audio): filtra por «sin atribución».
- **Pixabay Music** (pixabay.com/music): licencia de contenido propia de Pixabay, uso comercial sin atribución en la mayoría.
- **Free Music Archive** (freemusicarchive.org): filtra por licencias CC0 o CC BY (la CC BY exige atribución).
- **Incompetech / Kevin MacLeod**: gratis con atribución (CC BY) o con licencia paga sin ella.
- **Crearla tú**: con tu propia grabación o un generador cuya licencia permita uso comercial (guarda el comprobante).

Si una pista exige atribución, ponla en la descripción del video. En caso de duda, no la uses.

## Esta carpeta y git
Las pistas pesan: el `.gitignore` las deja fuera del repositorio. Quedan solo este README y `LICENCIAS.md`.
