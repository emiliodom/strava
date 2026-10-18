# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y versionado [SemVer](https://semver.org/lang/es/).
Mientras la versión sea `0.x`, la estructura del JSON de datos y de los módulos puede cambiar entre versiones menores.

## [0.12.0] — 2026-10-17

### Añadido
- **Análisis de sesiones pasadas** (`calendario.js`): el detalle de cada día tiene ahora pestañas **Sesión · Análisis · Horario**. El análisis da un veredicto graduado —cumplida, **parcial** o sin calidad—, el porqué (minutos en Z2/Z3 por kilómetro, bloque continuo más largo, ritmo), qué faltó y la tabla km a km. Una sesión con esfuerzo aeróbico real pero por debajo del umbral ya no se marca «sin calidad»: es parcial y no se reprograma. Nueva sección «Calidad hasta ahora» con resumen.
- **Racha de la milla** (`ajuste.js`): no hay un solo día sin correr hasta el 6 de enero de 2027 (mínimo 1,6 km); los descansos son de bici y fuerza. Banner con el día de racha y los días que faltan.
- **Natación opcional** (una vez por semana, 30 min, no penaliza si no se hace) y **boxeo** repartido (una vez por semana; dos en el camino brutal).
- **Viaje a Charlotte (25 nov – 13 ene)**: los tres planes se extienden hasta el 13 de enero; recordatorio de hacer la calidad por la mañana, hito de vuelo (aterrizaje 15:27) y de regreso (vuelo 14:00, milla a las 22:00 en Guatemala).
- **Horario del día** (pestaña «Horario» y «Hoy»): línea de tiempo con la hora de levantarse según la fase —verano de Utah, horario estándar desde el 1 de noviembre, o Charlotte (trabajo 9:00–18:00, dos sesiones entre 6:00 y 8:30).
- Iconos de natación, vuelo, reloj y recordatorio; tarjetas de próximos hitos; .ics con recordatorios.

### Cambiado
- El botón «No la hice · reorganizar» queda deshabilitado en días pasados (se detectan solos con Strava).
- Una sesión saltada ya no deja un día en cero: queda como la milla de la racha. El «Días libres» del resumen se sustituye por la racha.
- En bici no se supone nada en Charlotte: los días de bici pasan a rodaje fácil de al menos 5 km.

### Corregido
- Texto de zona de FC en «Día» con contraste insuficiente (ahora punto de color + texto normal).

## [No publicado]

### Añadido
- **Reacomodo de intervalos con datos reales** (`replan.js`, `calendario.js`): la calidad «hecha» se juzga por kilómetro (splits, FC por zonas, ritmo contra la mediana) y no por la FC media; sólo se recupera una sesión dura por semana (la más reciente); las calidades de los próximos 14 días se topan a 1,25 × la salida más larga de 28 días. La bitácora cita los datos (km, tiempo, ritmo, FC).
- **Navegación por páginas** (`app.js`, `index.html`): los 14 módulos dejan de ser un único scroll de ~15 000 px y se agrupan en seis páginas
  —Hoy, Calendario, Rendimiento, Metas, Cuerpo y ciencia, Registro— con URL propia (`#calendario`) y un índice interno sticky cuando una página agrupa varios módulos.
  Los enlaces antiguos a un módulo (`#carga`, `#recursos`…) abren su página y bajan hasta él. Barra superior de seis entradas (antes dos filas) y barra inferior móvil con las seis.
- **Calendario rehecho** (`calendario.js`, `icons.js`, `app.css`): cada día muestra **iconos** de lo que toca (correr, bici, fuerza, descanso, competencia; calidad, largo, trail, HIIT…).
  En los días pasados, un **anillo de cumplimiento** (✓ / % / ✕) más una marca en cada icono (✓ hecho, ½ parcial, ✕ no hecho) y «real/plan» en el volumen: el estado se lee por forma, no sólo por color.
  Tres **diseños** (Cuadrícula, Compacta, Agenda; la agenda es la de móvil por defecto) y seis **interruptores de datos** (Iconos, Sesión, Ritmo, Volumen, Cumplimiento, Competencias), guardados en el navegador.
  Color por familia de sesión (6 en vez de 14) sólo en borde e icono; el texto va siempre en tinta normal. Se reordena la página: plan, vista y calendario arriba; KPIs, competencias y gráficas debajo; «Plan reorganizado» pasa a acordeón.
- **Exportar a PDF**: botón «PDF» (esta página o todo el informe; fuerza tema claro, abre acordeones, oculta menús, el calendario sale apaisado) y `node connector/pdf.mjs` para generarlo sin abrir el navegador.
- **Auditoría de contraste** `node connector/contraste.mjs`: mide WCAG AA (texto 4,5:1, gráficos 3:1) sobre la página real, en claro y oscuro y en las seis páginas, incluidas etiquetas SVG, iconos, anillos y el degradado del hero. Sale con código 1 si algo falla.

- **Calidad no cumplida** (
eplan.js, calendario.js): si una sesión Q/H/S/T ya pasada aparece en Strava corrida fácil (FC media < 80 % de la máxima), se marca sola como «hecho fácil, sin calidad» y la calidad se reubica en el primer día suave de los próximos 6 sin dos duros seguidos ni competencia cerca; si no hay hueco, no se acumula.
- **«No la hice · reorganizar»** (`assets/replan.js`, `calendario.js`, `resumen.js`): si no se hizo la sesión de la mañana, un botón en el hero y en el detalle de cada día
  marca la sesión como no realizada y el calendario se reorganiza con **reglas fijas, sin IA**: una sesión dura (Q, H, S, T, F, V, M, L) pasa al primer día suave
  de los próximos 4 sin dejar dos días duros seguidos ni caer cerca de una competencia (≤2 días de una A/B); si no hay hueco, baja a volumen fácil al 70 %;
  el volumen fácil (km y minutos de bici) se reparte con tope de +25 % por día (máx. +2 km y +20 min) y lo que no cabe se descarta; la fuerza pasa al primer día
  suave sin fuerza. Si Strava ya trae algo ese día, sólo se reprograma lo que falta. Una competencia no se reprograma. Hay bitácora de cambios (modal del hero y panel
  en el calendario) y «Restablecer plan original». Los días saltados se guardan en `localStorage` (`calSaltos`); `App.calExport.dias()` ya devuelve el plan reorganizado,
  así que hero, día, calendario y proyecciones lo usan sin cambios.

### Cambiado
- **Rediseño visual** (`app.css`, `resumen.js`, `index.html`): paleta nueva pensada para apps de ejercicio (naranja energía como acento,
  azul marino profundo en oscuro, fondo cálido en claro, verde/ámbar/rojo sólo con significado de estado), tipografía más fuerte con
  cifras tabulares, tarjetas con profundidad suave y botones redondeados. Nuevo **hero** en la portada (sesión de hoy, cuenta atrás a la
  Guatemágica y tira semanal) y fichas como **slider** deslizable con *scroll-snap* y puntos en móvil (cuadrícula desde 700 px).
  Las fichas «Hoy» y «Esta semana» pasan al hero. `theme-color` actualizado a `#0b1120`. Documentado en README, sección «Diseño».

### Corregido
- **Tema claro mezclaba azul de Pico y naranja propio**: el selector claro de Pico (`:root:not([data-theme=dark])`) era más específico que el nuestro, así que enlaces, botones y foco salían azules. Ahora el tema usa un único juego de variables.
- **Contraste**: el semáforo claro (`--ok/--warn/--bad/--info/--accent`) ahora es apto para texto (antes ámbar 2,7:1 y verde 3,4:1 sobre blanco); insignia de módulo y botones primarios con ≥ 5:1; las celdas del calendario ya no pintan texto en naranja sobre naranja.
- **«App.hoy.render is not a function» / módulos mezclados tras desplegar**: los scripts se servían de caché (hasta 1 h) y una `resumen.js` antigua convivía con una `hoy.js` nueva. Los recursos llevan ahora `?v=<versión>`; sube el número en `index.html` en cada versión.
- Calendario: el detalle de un día mostraba `99.53333333333333` minutos; ahora se redondea.

- **15K Trail Milpas Altas eliminado**: no se corrió. Se quitó el evento, su preparación, el conflicto «llega muy pronto» y la fila de hidratación; el 11 oct queda como rodaje suave en los tres planes.
- **Fecha del 15K Trail de San Bartolomé Milpas Altas**: es el **domingo 11 de octubre a las 8:00**, no el 14.
  Se corrigió el evento (`assets/plan.js`, con hora de salida) y se re-escaló el *taper* en los tres caminos para
  que la carrera caiga el 11: el sábado 10 pasa a ser rodaje corto con rectas (pre-carrera), el largo de esa semana
  lo absorbe la propia carrera, y el miércoles 14 —antes día de carrera— vuelve a una sesión normal de calidad.
  Actualizadas también las notas y el conflicto «El 15K Trail llega muy pronto».

### Añadido
- **Portada rediseñada como tablero** (`resumen.js`, `hoy.js`, `app.css`): en lugar de un scroll largo, fichas con lo esencial —hoy, comer hoy,
  cintura, semana en curso (lunes a domingo: hecho/pendiente), Strava hoy, cuenta atrás de la Guatemágica, próximo evento y forma (VDOT/ACWR)— y
  el selector de plan arriba. Cada ficha abre un **modal** (`<dialog>` nativo, se cierra tocando fuera o con ✕) con el detalle completo: detalle por
  deporte, macros y meta de talla, tabla plan-contra-Strava, las tres metas y los veredictos. `hoy.js` ahora expone `App.hoy.partes(D)` en vez de HTML
  y `metaTalla` devuelve un objeto con cifras y `html`.
- **«Meta de talla» en la portada** (`cuerpo.js` → `App.cuerpo.metaTalla`, usada por `hoy.js` bajo las kcal del día): cintura actual contra la meta
  (0,5 × estatura), reducción estimada hasta el 15 nov según el plan activo y semanas restantes tras la Guatemágica; aclara que la grasa
  de pecho, costados y panza no se quita por zona sino con déficit sostenido; lista qué evitar (líquidos azucarados, pan dulce, fritanga,
  alcohol, picoteo nocturno) y un menú chapino del día que cambia según sea día largo, de fuerza o de descanso.
- **Copia legible del JSON de datos** (`connector/build.mjs`): además de `ano2026_datos.min.json` (el que usa la app, no cambia),
  cada build escribe `ano2026_datos.json`, la misma información indentada (los arreglos de `splits` quedan en una línea).
  Está en `.gitignore`: se genera en local con `npm run build` / `npm run actualizar`.
- **Semana 15–21 oct reconstruida para la nueva rutina** (`assets/plan.js`): cada día, ventana de 5:30–7:30 para un solo
  deporte (bici, correr, trail o HIIT) y desde las 18:00 lo pendiente o pesas. Se recuperó la calidad que no se hizo el
  miércoles 14, la Ida a Colomba (18 oct) sustituye a la rodada de los Capis en los tres planes y `HORARIO` refleja la
  nueva disponibilidad.
- **Ida a Colomba (18 oct)**: nueva travesía de ~800 m de desnivel (`assets/plan.js`, con nota de preparación en `preparacion.js`).
- **Seguimiento automático de plan vs. realidad en el calendario** (`assets/modules/calendario.js`): los días pasados enlazan las actividades importadas desde Strava, marcan su actividad y comparan kilómetros de carrera y minutos de bici; un resumen muestra los últimos siete días con datos frente al plan activo. Se conserva el registro manual, que prevalece sobre los valores importados cuando se edita un día. El plan no se modifica automáticamente.
- **Puntuación por actividad planificada** (`assets/modules/calendario.js`, `assets/modules/dia.js`): carrera, bici y fuerza se evalúan por separado; cada componente suma un punto sólo si aparece al menos una actividad de ese deporte y alcanza el mínimo de volumen (80% de lo previsto; fuerza, 15 minutos). Los detalles muestran cuántas actividades reales se registraron, el calendario marca `cumplidas/previstas` y el resumen semanal añade el total global. Los minutos manuales sin deporte identificado no se atribuyen a bici ni a fuerza. Los km planeados y la carga proyectada ya no cuentan como carrera los valores de relleno de los días de descanso o de bici. Las actividades de otros deportes ya no pueden hacer pasar una sesión de fuerza ni una bici breve como cumplidas.
- **Selector de fecha en «Sesión del día»** (`assets/modules/dia.js`): además del último día con datos, ahora puedes
  revisar el análisis de cualquier día pasado con actividad. Los botones ◀ ▶ saltan al día anterior/siguiente con datos y una
  lista desplegable muestra todos los días (el más reciente marcado «último»). Usa el hook `montar` y `App.refrescar`
  para repintar sólo ese módulo; la elección vive en memoria (al recargar vuelve al último día). Sin dependencias nuevas.
- **Registro de comidas reorganizado** (`assets/modules/registro.js`, `assets/app.css`): el listado agrupa por
  día en bloques plegables (`<details>`), con el día más reciente abierto y el título en fecha larga (día de la
  semana + «7 de octubre de 2026» + nº de registros). Cada día muestra sus comidas en una rejilla de tarjetas
  compactas (dos por fila en pantalla ancha) con el tipo de comida como chip de color. Al tocar una foto se abre
  a tamaño completo en un `<dialog>` (lightbox nativo, se cierra tocando fuera); usa la imagen original de
  Cloudinary cuando existe. Reutiliza `U.acc`, `U.chip`, `U.note` y la rejilla `.cols`, sin dependencias nuevas.
- **Fotos del registro de comidas en Cloudinary** (`registro/api.php`, `assets/modules/registro.js`,
  `connector/comidas.mjs`). Si existe `mistrava-store/.env` con las claves de Cloudinary
  (`CLOUDINARY_CLOUD_NAME` / `API_KEY` / `API_SECRET`, ver `registro/store.env.example`), la subida se firma
  en el servidor —el secreto nunca llega al navegador— y la foto va a su CDN; se guardan `url` y `public_id`
  en el índice. El navegador muestra la imagen directo desde la URL de Cloudinary (con `f_auto,q_auto,c_limit`,
  sin descargar un blob con token por foto), al borrar se elimina también en Cloudinary y el conector baja la
  foto del CDN. Sin ese `.env` todo sigue igual que antes: las fotos caen en `mistrava-store/datos/`. Esto quita
  los límites de disco del hosting y descarga al servidor de servir imágenes.
- **Sección «Sesión del día»** (`assets/modules/dia.js`): analiza por separado cada actividad del último día con
  datos en Strava (hoy pueden ser varias: la de correr, la de la bici, la fuerza…). Por cada una muestra las
  métricas que tienen sentido según el deporte, clasifica la intensidad contra tus zonas reales (ritmo frente al
  VDOT y FC frente a la máxima), y en las carreras con parciales añade el **ritmo kilómetro a kilómetro** (gráfico
  con eje invertido coloreado por zona de FC), el **tiempo en cada zona de FC** y la tabla detallada. Arriba, un
  resumen del día y el **veredicto contra el plan activo** (Normal/Intermedio/Brutal). Aparece en el menú y en la
  barra inferior. El análisis histórico (año, running, bici…) sigue en sus módulos.

### Documentación
- **Documentación del seguimiento plan vs. Strava en el README**: sección detallada que explica el cruce automático con Strava, la puntuación por componentes (umbrales del 80% y 15 min), insignias de cumplimiento en el calendario y el cálculo del balance rodante de 7 días.
- **Despliegue en Hostinger con cron**, documentado con diagramas Mermaid en el README: topología de las tres
  carpetas (public_html + `mistrava-store` + `mistrava-cron`), la autenticación headless con Strava (autorizas
  una vez en local, el servidor sólo refresca por HTTPS) y el ciclo del cron (`git pull` → sync → build →
  `git push` → deploy).
- Nuevo **[CHEATSHEET.md](CHEATSHEET.md)** con los comandos de uso diario, el montaje del servidor paso a paso
  y la tabla de «si algo falla».
- `connector/actualizar.sh`: script de cron que refresca los datos desde el servidor y los publica por git.
- `.gitattributes` fuerza fin de línea LF en los `.sh` para que el shebang funcione en el servidor Linux.

## [0.10.1] — 2026-10-06

### Corregido
- **Persistencia del registro de comidas en el hosting.** El deploy de Hostinger borra todo el contenido de `public_html` en cada publicación, así que el token (`config.php`) y las fotos subidas (`datos/`) no sobrevivían por estar en `.gitignore` (ignorar un archivo no lo protege del borrado). `registro/api.php` ahora guarda el token y las fotos en un almacén **fuera de `public_html`**: usa `MISTRAVA_STORE` si está definida, o detecta sola una carpeta `mistrava-store` a la par de `public_html`, y cae a `__DIR__` en local. Sólo hay que crear esa carpeta con `config.php` una vez; sobrevive a los deploys.

## [0.10.0] — 2026-10-06

### Añadido
- **Entrenamiento híbrido (bici + correr el mismo día)** en los tres caminos del calendario, dosificado por nivel y fundado en ciencia del deporte: la bici suma volumen aeróbico sin impacto (hasta ~50 % del running es sustituible sin perder rendimiento), los dobles AM/PM reparten la carga (una sesión dura, otra suave, ≥4–6 h de separación) y los bricks bici→carrera entrenan la transición por especificidad.
  - **Estructurado:** un doble suave AM/PM a la semana (rodaje fácil + bici Z2) y un mini-brick bici→trote cada dos sábados.
  - **Intermedio:** un brick por semana (FTP o fondo + 3–4 km en seco al bajar) y uno o dos dobles AM/PM.
  - **Brutal:** dobles casi a diario (corre por la mañana, rueda y pega la fuerza por la noche) con bricks largos el fin de semana; la semana de la Guatemágica queda limpia.

### Cambiado
- El efecto de interferencia fuerza/resistencia guía el orden: en los planes suaves la fuerza se separa; donde se apila (brutal) se asume el coste.
- `assets/actividad.js`: la línea corta de cada día muestra los dos deportes en los días híbridos (p. ej. «5:40/km + Z2»). El motor ya renderizaba dos deportes por día; sólo faltaban los datos.

## [0.9.0] — 2026-10-06

### Añadido
- Detalle de la actividad por deporte: al tocar cualquier día del calendario (y en «Lo que te toca hoy») se abre la referencia de qué hacer —ritmo objetivo al correr calculado desde tus zonas, intensidad en la bici (RPE/zonas/FTP) y la rutina de fuerza en casa— reutilizada como componente (`assets/actividad.js`).
- Tercer camino **Ruta intermedia**, entre la estructurada y la brutal, con calidad de verdad y un día libre real. Los tres aparecen en el calendario, en «Lo que te toca hoy» y en la comparación de riesgo (ACWR).
- Seis tipos de sesión nuevos: HIIT (VO₂máx), Sprints, Trail duro, FTP en bici, Sprints en bici y Montaña dura, con color propio en la leyenda y referencia específica.
- Registro real por día: el plan ya no se edita; cada día muestra sus km e intensidad como referencia fija y un campo libre para anotar lo que hiciste de verdad (km, minutos, ritmo/intensidad y sensaciones), con el porcentaje de desvío plan vs realidad para ver dónde se está fallando.

### Cambiado
- El modal de día pasó de «editar la sesión» a «ver detalles + registrar lo real». El botón de exportación «Deshacer mis ediciones» ahora es «Borrar mi registro real».

## [0.8.1] — 2026-10-06

### Añadido
- Módulo Preparación: qué debe ocurrir 15, 10 y 5 días antes de cada evento del calendario (carrera, trail o bici), con matices por evento y la Guatemágica alineada al plan.

## [0.8.0] — 2026-10-06

### Añadido
- «Lo que te toca hoy» en el Resumen: sesión del día (modo normal o brutal), rutina de fuerza, metas de comida y comparación contra Strava de los últimos 7 días.
- Módulo Ciencia: lactato, ultradistancia, combustible en carrera, evaluación de tus suplementos y cómo mejorar tus comidas favoritas.
- Módulo Registro de comidas: foto y descripción hacia un endpoint PHP con token (`registro/api.php`); `connector/comidas.mjs` descarga el registro y arma el resumen semanal para evaluarlo con IA en local.

### Corregido
- Las clasificaciones de monotonía y ACWR devolvían objetos y siempre mostraban «fuera de rango».
- La FCmax estimada se acota con la fórmula de Tanaka (+10 lpm) cuando el percentil 98 observado la supera.
- Cuerpo 360: déficit del camino normal coherente (−300 hasta la carrera, −400 después).

## [0.7.1] — 2026-10-06

### Cambiado
- Las fotos del escaneo llevan además un desenfoque suave en toda la imagen (la mitad del de la cara).

## [0.7.0] — 2026-10-06

### Cambiado
- Los dos calendarios se recalculan desde hoy según tu horario real (entre semana desde las 18:00, sábado desde las 14:00, domingo desde las 05:00): sin MTB de 2 h de noche ni rutas largas que acaben a oscuras.
- Fuerza en casa en ambos caminos (A y B; el brutal suma C de boxeo), nunca antes de calidad ni durante la semana de la Guatemágica.

### Añadido
- Rutinas A, B y C con el equipo de casa en «Cuerpo 360».
- Se publican las fotos difuminadas y `body360.js` (los originales siguen fuera).

## [0.6.0] — 2026-10-06

### Añadido
- Módulo 6 «Cuerpo 360»: medidas y fotos de un escaneo, estimación de grasa, dos rutas de composición (normal y brutal), nutrición guatemalteca, sueño, estrés y fuerza.
- `connector/body360.py`: difumina la cara, borra EXIF/GPS y genera `body360.js`; las fotos y medidas no se versionan.

## [0.5.2] — 2026-10-06

### Añadido
- Licencia MIT y capturas (móvil y escritorio) en el README.

### Corregido
- Fondo del `body` heredado de la página original (`var(--bg)`) que dejaba fondo blanco con texto de tema oscuro; ahora usa las variables de Pico.

## [0.5.1] — 2026-10-06

### Añadido
- `ano2026_datos.min.json` se publica como ejemplo de referencia (decisión del autor: los datos ya son públicos en Strava).

### Cambiado
- `.gitignore` sigue excluyendo credenciales, el crudo con trazados GPS y las copias de seguridad.

## [0.5.0] — 2026-10-05

### Añadido
- Análisis por frecuencia cardiaca en el módulo de running: reparto por zonas (Z1 < 77 % · Z2 < 87 % · Z3 de la FCmáx),
  eficiencia aeróbica mensual y deriva cardiaca de las salidas largas.
- El conector guarda FC, cadencia, potencia, kJ y parciales por kilómetro de cada carrera.
- `build.mjs` conserva una copia del JSON anterior antes de sobrescribirlo.

### Cambiado
- `sync.mjs` se detiene con un mensaje claro cuando se agota el cupo diario de Strava, en lugar de reintentar sin fin.
  Los 429 de 15 minutos siguen esperándose, con un máximo de 12 intentos.
- Puerto por defecto del callback de OAuth: `8765` (el `8080` suele estar ocupado).

### Corregido
- Se detecta el error `EADDRINUSE` en `auth.mjs` con instrucciones, en vez de volcar el stack.

## [0.4.0] — Conector de Strava
- OAuth local de un solo uso, descarga incremental, generación del JSON, servidor estático y despliegue a Google Cloud Storage.
- Detección de actividades con datos inconsistentes (duplicados manuales, tiempos corruptos, GPS erróneo).
- `serve.mjs` nunca sirve `.env`, `.tokens.json` ni `data/raw/`.

## [0.3.0] — Proyecciones, calendario, sueños y recursos
- Módulo 2: proyecciones a corto, mediano y largo plazo.
- Módulo 3: dos planes (estructurado y «brutal») con las seis carreras de octubre y noviembre, edición por día,
  exportación `.ics` con plegado RFC 5545 y enlaces a Google Calendar.
- Módulo 4: sueños con hoja de ruta. Módulo 5: nutrición, recuperación y referencias verificadas.

## [0.2.0] — Análisis profundo
- Carga, monotonía (Foster), ACWR (EWMA), recuperaciones, resumen del año, hábitos, running (VDOT de Daniels) y bici (VAM).

## [0.1.0] — Base
- Página dirigida por datos, mobile-first, sobre Pico.css. Motor de métricas, gráficas SVG sin dependencias.
