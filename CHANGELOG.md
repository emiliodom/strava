# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y versionado [SemVer](https://semver.org/lang/es/).
Mientras la versión sea `0.x`, la estructura del JSON de datos y de los módulos puede cambiar entre versiones menores.

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
