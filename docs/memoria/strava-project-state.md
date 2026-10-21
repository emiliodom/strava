---
name: strava-project-state
description: State of the Strava training-analysis site after v0.12.7 (architecture, pages, calendar, tooling, how to verify)
metadata:
  type: project
---

Static, no-build site (Spanish UI) analysing Emilio's Strava data; pushed as v0.11.0 (commit 84d4259, 2026-10-16). README, CHANGELOG and CHEATSHEET are current; read them first.

**Architecture:** `index.html` loads `assets/*.js` (global `App`, ES5 style, modules in `assets/modules/`). `app.js` renders all 14 modules into `<section id>` then routes by hash: 6 pages (hoy, calendario, rendimiento, metas, cuerpo, registro) hide other sections with class `off`; module ids (`#carga`) still work and scroll. `#imprimir` = print-everything mode (used by `connector/pdf.mjs`). Assets carry `?v=0.12.7` in index.html: bump it every release (a stale-cache mix of old/new modules caused "App.hoy.render is not a function").

**Calendar (`modules/calendario.js`, `icons.js`):** per-day icons, ring of completion on past days (evaluarDia().pct), 3 layouts (cuadricula/compacta/agenda) + 6 data toggles stored in pref `calVista`. Color only on border/icon by 6 families; text always `--ink`.

**Tooling (`connector/`):** `navegador.mjs` (headless Chrome over CDP + temp static server, needs Chrome; env CHROME), `pdf.mjs`, `contraste.mjs` + `contraste.pagina.js` (WCAG AA audit, exits 1 on failure; currently passes). Dev server: `node connector/serve.mjs` (port 8000).

**Gotchas learned:** Pico's light selector is `:root:not([data-theme=dark])` so overrides must use the same specificity. Pico sets `--pico-color` on `a` and `[role=button]`, which turns text dark/inverse; override with `--ink`. Calendar cells use `role=button`, so their CSS needs `.vista .c[role=button]` specificity. Audit gradient (hero) is computed analytically, not by pixel.

**Why:** user wanted readable calendar, coherent theme, easier navigation, PDF, contrast analysis.
**How to apply:** after any CSS/markup change run `node connector/contraste.mjs`; PDF could not be viewed locally (no poppler), only checked via print-media screenshots. Unverified/open: the "Tus competencias" table appears right-aligned in print preview (not investigated). Nothing deployed yet by me (deploy.mjs publishes to GCS; site also on Hostinger per CHEATSHEET).

**Reacomodo de intervalos (v0.11.1, 2026-10-17):** `replan.js` recibe `ctx {info, kmMax}`; `calendario.js` juzga calidad por splits/zonas FC (≥2 km en Z3 o ≥2 km 12 % más rápidos que la mediana con FC ≥ Z2), recupera sólo una dura por semana (la más reciente) y topa las calidades de los próximos 14 días a 1,25 × la salida más larga de 28 días (mín. 5 km). Scripts de `connector/` que usan Chrome necesitan `node --experimental-websocket` en Node 20. `datos.js` está en .gitignore; tras `sync.mjs` hay que correr `build.mjs --js`.

**v0.12.0 (2026-10-17):** `assets/ajuste.js` (se carga antes de `replan.js`) extiende los tres planes hasta el 13 ene 2027 y les aplica el viaje (Charlotte 25 nov–13 ene, con bici: calidad en Sugar Creek Greenway, trail semanal en Crowders/Whitewater Center), la racha (nunca un día sin correr: mínimo 1,6 km hasta el 6 ene 2027; `d.racha`), natación opcional semanal (`d.nat`) y boxeo repartido; expone `P.horarioDe(fecha, dia)`, `P.diaRacha`, `P.RACHA`, `P.VIAJE`. `calendario.js`: `analizarSesion` da veredicto ok/parcial/sin/fuerte (saltos: 2 = sin calidad, 3 = parcial, no reprograma); modal con pestañas Sesión/Análisis/Horario; botón «No la hice» deshabilitado en días pasados. El horario de verano de EE. UU. terminó el 1 nov 2026 (Guatemala no cambia). Supuestos: hay bici en Charlotte (el usuario lo confirmó); llegada del 13 ene a las 22:00 hora de Guatemala. Los estilos `--kv-*`/`--track` sólo existen dentro de `.cal,.lgd,.vista,#calDlg,.racha,.hitos`.

**v0.12.3:** en `plan.js` el orden de los arreglos es ESTRUCTURADO, BRUTAL, INTERMEDIO (no el de los nombres de PLANES). Eventos de nov: campana 8 (30 km/1200 m), senderos 15 (50 km/1500 m), guatemagica 21 (19:00, bici suave 40 min), xab 22 (8:00, 20 km/800 m, deporte 'mtb'). Regla: mínimo dos sesiones de calidad por semana hasta la Guatemágica.

**v0.12.4:** módulo `prevencion.js` (página «Cuerpo y ciencia», id `prevencion`, en `ORDEN` y `PAGINAS` de `app.js`) con espalda baja, calambres y equilibrio; rutinas `P.RUTINAS.P` (espalda y cadera) y `.E` (equilibrio). `ajuste.js` → `aplicarPrevencion` añade «+ prevención lumbar 12 min» (lun/mié/vie y al terminar MTB largas: colomba, campana, senderos, xab) y «+ equilibrio 10 min» (jue/sáb) desde 2026-10-19; `actividad.js` pinta los bloques por regex sobre `d.sesion`. Contexto: dolor lumbar en la última subida de Colomba (18 oct). Xab Sibaná (22 nov) es MTB. Si se añade otra MTB larga, ponla en `MTB_LARGAS`.

**v0.12.6:** `metrics.js` → `unirBicis` une tramos de ruta/mtb del mismo día con hueco ≤ 45 min (`GAP_UNIR_MIN`) antes de normalizar; el id es el del primer tramo y `unidas` guarda cuántos eran. Objetivo declarado del usuario para los planes: bajar grasa, más fuerza, equilibrio y core, y varias sesiones de calidad por semana (3 en semanas sin carrera); el orden de los arreglos de `plan.js` sigue siendo estructurado, brutal, intermedio.

**v0.12.6:** `actividad.js` decide el orden de correr y bici en días híbridos (`primero`: bici primero si el tipo es B/F/V/M, correr primero en el resto); la pref `ordenInvertido` (App.data.pref) lo voltea desde el botón `#calOrden` del calendario, que repinta calendario y resumen. Es una propuesta basada en literatura general, no individualizada.

**v0.12.7:** `ajuste.js` → `aplicarLesion` (constante `LESION`, textos en `LESION_TXT`) sobrescribe 21–25 oct (milla lenta/caminata, core Z, prueba del pie) y quita calidad/fuerza A/C el 26–28 oct; `d.lesion=1` marca esos días. Para quitar el modo lesión, borra la llamada en el `forEach` final. Rutina `P.RUTINAS.Z` y sección en `prevencion.js`.
