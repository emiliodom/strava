---
name: strava-project-state
description: State of the Strava training-analysis site after v0.11.0 (architecture, pages, calendar, tooling, how to verify)
metadata:
  type: project
---

Static, no-build site (Spanish UI) analysing Emilio's Strava data; pushed as v0.11.0 (commit 84d4259, 2026-10-16). README, CHANGELOG and CHEATSHEET are current; read them first.

**Architecture:** `index.html` loads `assets/*.js` (global `App`, ES5 style, modules in `assets/modules/`). `app.js` renders all 14 modules into `<section id>` then routes by hash: 6 pages (hoy, calendario, rendimiento, metas, cuerpo, registro) hide other sections with class `off`; module ids (`#carga`) still work and scroll. `#imprimir` = print-everything mode (used by `connector/pdf.mjs`). Assets carry `?v=0.11.0` in index.html: bump it every release (a stale-cache mix of old/new modules caused "App.hoy.render is not a function").

**Calendar (`modules/calendario.js`, `icons.js`):** per-day icons, ring of completion on past days (evaluarDia().pct), 3 layouts (cuadricula/compacta/agenda) + 6 data toggles stored in pref `calVista`. Color only on border/icon by 6 families; text always `--ink`.

**Tooling (`connector/`):** `navegador.mjs` (headless Chrome over CDP + temp static server, needs Chrome; env CHROME), `pdf.mjs`, `contraste.mjs` + `contraste.pagina.js` (WCAG AA audit, exits 1 on failure; currently passes). Dev server: `node connector/serve.mjs` (port 8000).

**Gotchas learned:** Pico's light selector is `:root:not([data-theme=dark])` so overrides must use the same specificity. Pico sets `--pico-color` on `a` and `[role=button]`, which turns text dark/inverse; override with `--ink`. Calendar cells use `role=button`, so their CSS needs `.vista .c[role=button]` specificity. Audit gradient (hero) is computed analytically, not by pixel.

**Why:** user wanted readable calendar, coherent theme, easier navigation, PDF, contrast analysis.
**How to apply:** after any CSS/markup change run `node connector/contraste.mjs`; PDF could not be viewed locally (no poppler), only checked via print-media screenshots. Unverified/open: the "Tus competencias" table appears right-aligned in print preview (not investigated). Nothing deployed yet by me (deploy.mjs publishes to GCS; site also on Hostinger per CHEATSHEET).
