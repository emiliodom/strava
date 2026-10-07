# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y versionado [SemVer](https://semver.org/lang/es/).
Mientras la versión sea `0.x`, la estructura del JSON de datos y de los módulos puede cambiar entre versiones menores.

## [No publicado]

### Añadido
- **Sección «Sesión del día»** (`assets/modules/dia.js`): analiza por separado cada actividad del último día con
  datos en Strava (hoy pueden ser varias: la de correr, la de la bici, la fuerza…). Por cada una muestra las
  métricas que tienen sentido según el deporte, clasifica la intensidad contra tus zonas reales (ritmo frente al
  VDOT y FC frente a la máxima), y en las carreras con parciales añade el **ritmo kilómetro a kilómetro** (gráfico
  con eje invertido coloreado por zona de FC), el **tiempo en cada zona de FC** y la tabla detallada. Arriba, un
  resumen del día y el **veredicto contra el plan activo** (Normal/Intermedio/Brutal). Aparece en el menú y en la
  barra inferior. El análisis histórico (año, running, bici…) sigue en sus módulos.

### Documentación
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
