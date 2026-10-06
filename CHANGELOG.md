# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y versionado [SemVer](https://semver.org/lang/es/).
Mientras la versión sea `0.x`, la estructura del JSON de datos y de los módulos puede cambiar entre versiones menores.

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
