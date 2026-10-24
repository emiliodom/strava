# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y versionado [SemVer](https://semver.org/lang/es/).
Mientras la versión sea `0.x`, la estructura del JSON de datos y de los módulos puede cambiar entre versiones menores.

## [0.13.0] — 2026-10-23

### Añadido
- **Página «Comida»** (`assets/modules/menu.js`, módulo 15): calendario mensual (23 oct–14 ene) de comida guatemalteca con tope diario de kcal (sale de `App.cuerpo.metaDia` del plan activo), porciones por grupo (palmas, tortillas, tazas) y menú de 4 comidas; reglas de cocina (plato servido, cocina cerrada 21:00, sin líquidos con calorías). Del 24 nov al 14 ene (Charlotte) las mismas bases con reglas para porciones de EE. UU. (mitad en la caja antes de empezar, tamaño regular, cocinar 5 de 7 días, una comida libre medida el sábado).

### Cambiado
- **Xab Sibaná** (22 nov): 22 km / 700 m D+ (antes 20 km / 800 m); se anota la alternativa Dec Santo Tomás (30 km, 800 m D+, rifa de bici). Pendiente: el usuario aún no decide.
- Versión de los assets a `?v=0.13.0`.

## [0.12.9] — 2026-10-22

### Cambiado
- **Se levanta la pausa y se reestructuran dos semanas (22 oct–4 nov)** (`ajuste.js`, `RETORNO` + `aplicarRetorno`, iguales en los tres planes): el pie mejora (2 km caminando con algo de dolor; la bici sin dolor).
  - **La bici manda:** Z2 de 45–150 min y calidad **sentado** (FTP 2 × 12 y 3 × 10 los sábados; 5 × 4 y 6 × 3 los miércoles), nada de pararse sobre los pedales ni sprints de pie. MTB de 150 min el 1 nov como ensayo de Campanabaj.
  - **La racha se cumple caminando** 1,6–2 km (`d.caminar`); el detalle del día muestra «Caminata de la racha» en vez de un bloque de correr, y el calendario la puntúa como «Caminata (racha)».
  - **Pesas sin cargar el pie** (rutina nueva **U**, 30 min) 3 veces por semana y **boxeo sin desplazamiento** (rutina nueva **G**, sólo golpes, sin cuerda ni pivotar sobre la punta) 2 veces por semana; descanso los lunes con sólo la caminata.
  - **Trote como prueba** el 31 oct y el 3 nov, sólo con 2 días caminando sin dolor (dolor ≤ 2/10, sin cojear); el 29 oct, caminata de 2–3 km para decidirlo. Sin natación ni equilibrio a una pierna en estas dos semanas.
  - Desde el 5 nov vuelve el plan original, con un recordatorio: la calidad corriendo sólo si los trotes de prueba fueron sin dolor.
- `PAUSA.activa = false` (el código de pausa y la ruta de lesión del 21 oct siguen ahí, sin borrar). Las regex de fuerza aceptan `fuerza U` y `fuerza G` (`actividad.js`, `calendario.js`, `hoy.js`, `replan.js`, `ajuste.js`).

## [0.12.8] — 2026-10-21

### Añadido
- **Pausa general por posible fractura de un dedo del pie** (`ajuste.js`, constante `PAUSA`; `calendario.js`, `resumen.js`, `hoy.js`, `cuerpo.js`): desde el 21 oct todo el plan queda en pausa **sin borrar ni reescribir nada**; cada día lleva `d.pausa = 1`.
  - **Portada:** el hero pasa a gris («Pausa · hasta nuevo aviso»), con botón «Qué hacer» (hielo, elevar, radiografía, decisión sobre la racha, enlace a la guía), la tira semanal con ‖ y sin «No la hice». La comida se calcula **sin déficit** mientras sana el hueso.
  - **Calendario:** banner de pausa, celdas en gris con borde punteado y un anillo de pausa; el detalle de cada día muestra el plan original dentro de un acordeón; la columna de km semanal dice «pausa»; la leyenda incluye «en pausa». Las proyecciones de carga y los km del bloque no cuentan los días en pausa (la carga decae).
  - **Reanudar:** pon `activa: false` en `PAUSA` (o fija `hasta`); el plan original y la ruta de vuelta del 21–28 oct siguen intactos.
- **Guía ampliada del dedo roto** (`prevencion.js`, módulo «Pie, espalda y equilibrio»): síntomas de más leve a más serio, cuándo ir hoy a urgencias, dedo gordo frente a dedos pequeños, qué preguntar al médico, **analgésicos de venta libre** (paracetamol primero, ibuprofeno con criterio, combinar, gel de diclofenaco, contraindicaciones, aviso de que el analgésico no es permiso para entrenar), nutrición para el hueso y cómo volver. Información general, no diagnóstico ni receta.

### Cambiado
- La cabecera usa todo el ancho (la última entrada, «Registro», se recortaba en pantallas de 900–1100 px) y el modal de la portada cierra al seguir un enlace interno.
- Auditoría de contraste: el degradado del hero se evalúa con las variables del propio hero (el hero en pausa tiene otra paleta). Sigue en verde.

## [0.12.7] — 2026-10-21

### Cambiado
- **Golpe fuerte en el pie (20 oct): se pausa la calidad esta semana** (`ajuste.js`, `aplicarLesion`, en los tres planes). 21–25 oct: milla de la racha lenta o caminada, core y tren superior sin cargar el pie, prevención lumbar y natación opcional; el sábado, prueba del pie (trote de 2 km si hay 2 días sin dolor) y el domingo trote fácil de 3 km sólo si no duele. 26–28 oct: sólo fácil (se quitan HIIT/Q/sprints, FTP y sprints en bici, fuerza A y boxeo). El 29 oct la calidad vuelve sólo con 2 días sin dolor.
- Datos de Strava al 20 oct: racha 288 (3,17 km, FC 118) y fuerza nocturna de 21 min.

### Añadido
- Rutina **Z «core y tren superior sin cargar el pie»** (`plan.js`) y su bloque en el detalle del día (`actividad.js`).
- Sección «Golpe fuerte en el pie» en Espalda y equilibrio: cuándo pedir radiografía, primeros días, criterio para volver. No es un diagnóstico.

## [0.12.6] — 2026-10-20

### Añadido
- **Orden de correr y bici en los días híbridos, con interruptor** (`actividad.js`, `calendario.js`). Propuesta por defecto: si la bici es lo principal (tipos B/F/V/M), primero la bici y luego un trote corto (transición «ladrillo»); si lo principal es correr (calidad, largo, fácil), primero correr y luego bici suave. El botón «Orden en días híbridos» del calendario lo voltea y se guarda en el navegador (`ordenInvertido`). El detalle numera los bloques (1.º / 2.º) con una línea de motivo y la celda corta muestra «A → B».
- La fuerza se recomienda separada unas 6 h de la calidad (efecto de interferencia).

### Nota
- El orden propuesto sale de la literatura general (la sesión de calidad con piernas frescas; bici→carrera sólo como habilidad específica de triatlón; sin evidencia clara de que un orden queme más grasa), no de datos individuales.

## [0.12.5] — 2026-10-19

### Añadido
- **Tramos de bici unidos** (`metrics.js`, `unirBicis`): los tramos de bici del mismo día con 45 min o menos entre el final de uno y el inicio del siguiente se cuentan como una sola salida (Strava la parte cada vez que se pausa el reloj). Suma distancia, tiempo y desnivel, pondera la FC por el tiempo en movimiento y usa el nombre del tramo más largo con «(N tramos unidos)». Hoy: 4 tramos → una MTB de 20,4 km, 1:17:40 en movimiento, +399 m, FC media 145 y máxima 195, esfuerzo relativo 122.
- Racha 287/365 (trote de 3 km, FC 128).

### Cambiado
- **Reacomodo hasta la Guatemágica** para bajar grasa y ganar fuerza, equilibrio y core con varias sesiones de calidad por semana: tres sesiones de calidad en las semanas del 19 y 26 oct (FTP en bici los sábados 24 y 31 oct, lejos del HIIT y del Q) y activación de sprints con fuerza A ligera el 18 nov, para que la semana de la carrera no quede sin fuerza. Se mantienen dos fuerzas por semana, la prevención lumbar/core tres o cuatro veces y el equilibrio dos veces.

## [0.12.4] — 2026-10-18

### Añadido
- **Módulo «Espalda y equilibrio»** (`prevencion.js`, en la página «Cuerpo y ciencia»): qué pasó con el dolor lumbar en la última subida y cómo evitar que se repita (cadencia, cambios de postura, pelvis, ajuste de la bici), prevención y actuación ante **calambres** (fatiga neuromuscular, ritmo, cadencia, sodio, carbohidrato), **equilibrio al subir** (mirada, marcha, posición, presión de llantas, práctica) y señales de alarma para consultar a un profesional.
- **Dos rutinas nuevas** en `P.RUTINAS`: `P` «espalda baja y cadera» (12 min) y `E` «equilibrio y estabilidad» (10 min).
- **En el calendario** (`ajuste.js`, desde el 19 oct, los tres planes): prevención lumbar lunes, miércoles y viernes y al terminar cada MTB larga (Colomba, Campanabaj, Entre Senderos, Xab Sibaná); equilibrio jueves y sábado. El detalle del día muestra las rutinas con sus ejercicios.
- **Xab Sibaná es MTB** (22 nov, 20 km, 800 m D+): rodada suave de 120 min más la milla de la racha.

## [0.12.3] — 2026-10-18

### Añadido
- **Calendario de noviembre con las pruebas fuertes**: Campanabaj MTB (8 nov, 30 km, 1.200 m D+), Entre Senderos MTB (15 nov, 50 km, 1.500 m D+), Guatemágica Nocturna 15K (21 nov, 19:00, con bici suave de 40 min por la mañana o la tarde) y **Xab Sibaná MTB** (22 nov, 8:00, 20 km, 800 m D+, rodada suave y la milla de la racha). En Campanabaj y Entre Senderos sólo se añade la milla de la racha.
- **Calidad obligatoria cada semana** en los tres planes hasta la Guatemágica: dos sesiones por semana (Q, HIIT, sprints o FTP), con activación corta de sprints en la semana de cada prueba y un Q de afinación de 3 × 2 km a ritmo de 15K el 17 nov. El largo de la semana de Entre Senderos se acorta.

### Cambiado
- Racha 286/365: el trote de 2,2 km del 18 oct (FC 127) cumplió el mínimo tras Colomba.

## [0.12.2] — 2026-10-18

### Cambiado
- **Reajuste tras la ida a Colomba** (lluvia, piernas y espalda cargadas): hoy sólo la milla de la racha (1,6 km); el 19 sigue suave y el 20 es fácil. La calidad vuelve el 21 (HIIT en los tres planes) y el 22 (Q en normal e intermedio); el intermedio añade FTP en bici el 24. El 29 pasa a HIIT (normal) o sprints (intermedio y brutal).
- Colomba en Strava: 14,7 km, 98 min, FC media 144 y máxima 181 (el plan preveía unos 180–210 min).

## [0.12.1] — 2026-10-17

### Añadido
- **Charlotte con bici**: la calidad se hace en el **Sugar Creek Greenway (Freedom Park → Pineville)**, el tramo más plano para velocidad, HIIT e intervalos; cada semana hay una salida de trail «de una vez» (Crowders Mountain State Park o U.S. National Whitewater Center, alternando) y un día de bici. Los tres planes tienen 6–8 sesiones de calidad en el viaje; el detalle del día muestra «📍 Dónde». Los parques son sugerencias, confírmalos.
- «No la hice · reorganizar» sigue dejando como mínimo la milla de la racha (1,6 km) en los días saltados, también en Charlotte.

### Cambiado
- Se retira el supuesto «sin bici en Charlotte» de 0.12.0.

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
