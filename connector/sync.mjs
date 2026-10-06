/* sync.mjs — descarga todas las actividades y, para las carreras, el detalle con los mejores esfuerzos.
   Guarda el crudo en data/raw/ y es incremental: la segunda vez sólo baja lo nuevo. */
import fs from 'node:fs';
import path from 'node:path';
import { config, api, RAIZ } from './strava.mjs';

const cfg = config();
const CRUDO = path.join(RAIZ, 'data', 'raw');
const F_ACT = path.join(CRUDO, 'actividades.json');
const F_DET = path.join(CRUDO, 'detalles.json');
fs.mkdirSync(CRUDO, { recursive: true });

const leer = (f, d) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : d);
const escribir = (f, o) => fs.writeFileSync(f, JSON.stringify(o, null, 0));

const args = new Set(process.argv.slice(2));
const COMPLETO = args.has('--completo');
const SIN_DETALLE = args.has('--sin-detalle');
const DESDE = Number(cfg.SYNC_DESDE_EPOCH || Math.floor(Date.UTC(2026, 0, 1) / 1000));

async function principal() {
  const previas = COMPLETO ? [] : leer(F_ACT, []);
  const porId = new Map(previas.map((a) => [a.id, a]));
  const after = COMPLETO || !previas.length
    ? DESDE
    : Math.max(...previas.map((a) => Math.floor(Date.parse(a.start_date) / 1000))) - 86400;

  console.log(`· descargando actividades desde ${new Date(after * 1000).toISOString().slice(0, 10)}…`);
  let pagina = 1, nuevas = 0;
  for (;;) {
    const lote = await api(cfg, '/athlete/activities', { after, page: pagina, per_page: 200 });
    if (!lote.length) break;
    for (const a of lote) { if (!porId.has(a.id)) nuevas++; porId.set(a.id, a); }
    process.stdout.write(`\r  página ${pagina}: ${porId.size} actividades`);
    if (lote.length < 200) break;
    pagina++;
  }
  const todas = [...porId.values()].sort((x, y) => Date.parse(x.start_date) - Date.parse(y.start_date));
  escribir(F_ACT, todas);
  console.log(`\n✓ ${todas.length} actividades en total (${nuevas} nuevas) → data/raw/actividades.json`);

  if (SIN_DETALLE) { console.log('· detalle omitido (--sin-detalle)'); return; }

  /* ---- detalle sólo de carreras: ahí viven los best_efforts (1k, 1 milla, 2 millas, 5k…) ---- */
  const detalles = COMPLETO ? {} : leer(F_DET, {});
  const carreras = todas.filter((a) => (a.type === 'Run' || a.sport_type === 'Run' || a.sport_type === 'TrailRun'));
  const faltan = carreras.filter((a) => !detalles[a.id]);
  if (!faltan.length) { console.log('✓ no hay carreras nuevas que detallar'); return; }

  console.log(`· pidiendo el detalle de ${faltan.length} carreras (hay un límite de 100 peticiones cada 15 min)…`);
  let n = 0;
  for (const a of faltan) {
    try {
      const d = await api(cfg, `/activities/${a.id}`, { include_all_efforts: true });
      detalles[a.id] = {
        id: d.id,
        best_efforts: (d.best_efforts || []).map((b) => ({ name: b.name, distance: b.distance, elapsed_time: b.elapsed_time, moving_time: b.moving_time })),
        calories: d.calories ?? null,
        suffer_score: d.suffer_score ?? null,
        device_name: d.device_name ?? null,
        // Parciales por km: permiten medir la deriva de ritmo/FC dentro de cada salida.
        splits: (d.splits_metric || []).map((s) => [Math.round(s.elapsed_time), s.average_heartrate ? Math.round(s.average_heartrate) : null, Math.round(s.elevation_difference || 0)])
      };
    } catch (e) {
      if (e.cupoDiario) { escribir(F_DET, detalles); console.error('\n✗', e.message); process.exit(2); }
      console.warn(`\n  ⚠ ${a.id}: ${e.message}`);
      detalles[a.id] = { id: a.id, best_efforts: [], error: String(e.message).slice(0, 120) };
    }
    if (++n % 10 === 0) { escribir(F_DET, detalles); process.stdout.write(`\r  ${n}/${faltan.length}`); }
  }
  escribir(F_DET, detalles);
  console.log(`\n✓ detalle guardado → data/raw/detalles.json`);
  console.log('\nSiguiente paso: node connector/build.mjs');
}

principal().catch((e) => { console.error('\n✗', e.message); process.exit(1); });
