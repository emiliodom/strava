/* build.mjs — convierte el crudo de Strava en ano2026_datos.min.json (y opcionalmente datos.js).
   El esquema es exactamente el que consume la aplicación; si cambias algo aquí, revisa assets/metrics.js. */
import fs from 'node:fs';
import path from 'node:path';
import { RAIZ } from './strava.mjs';

const CRUDO = path.join(RAIZ, 'data', 'raw');
const SALIDA = path.join(RAIZ, 'ano2026_datos.min.json');
const SALIDA_JS = path.join(RAIZ, 'datos.js');
const OVERRIDES = path.join(RAIZ, 'connector', 'anomalias.json');

const args = new Set(process.argv.slice(2));
const ANIO = Number([...args].find((a) => /^\d{4}$/.test(a)) || 2026);
const CON_JS = args.has('--js');

const leer = (f, d) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : d);
const r1 = (v) => Math.round(v * 10) / 10;
const r2 = (v) => Math.round(v * 100) / 100;

/* ---------- agrupación de deportes (espejo de assets/metrics.js) ---------- */
const GRUPO = {
  Run: 'running', TrailRun: 'running', VirtualRun: 'running',
  Ride: 'ruta', VirtualRide: 'ruta', GravelRide: 'ruta', EBikeRide: 'ruta',
  MountainBikeRide: 'mtb', EMountainBikeRide: 'mtb',
  WeightTraining: 'fuerza', Workout: 'fuerza', Crossfit: 'fuerza', Elliptical: 'fuerza',
  Swim: 'nado'
};
const grupoDe = (s) => GRUPO[s] || 'otros';

/* ---------- utilidades de fecha ---------- */
const iso = (d) => d.toISOString().slice(0, 10);
function semanaISO(f) {
  const t = new Date(Date.UTC(+f.slice(0, 4), +f.slice(5, 7) - 1, +f.slice(8, 10)));
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const w = Math.ceil(((t - y0) / 86400000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(w).padStart(2, '0')}`;
}
const mesDe = (f) => f.slice(0, 7);
const ritmo = (s) => (s > 0 && isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}` : null);
const hhmmss = (s) => [Math.floor(s / 3600), Math.floor(s / 60) % 60, Math.round(s % 60)]
  .map((n, i) => (i ? String(n).padStart(2, '0') : String(n))).join(':');

const sum = (a) => a.reduce((s, x) => s + (x || 0), 0);
const media = (a) => (a.length ? sum(a) / a.length : 0);
function mediana(a) {
  if (!a.length) return 0;
  const b = [...a].sort((x, y) => x - y), n = b.length;
  return n % 2 ? b[(n - 1) / 2] : (b[n / 2 - 1] + b[n / 2]) / 2;
}

/* ---------- detección de datos inconsistentes ---------- */
function detectarAnomalias(acts) {
  const fuera = new Map();
  const marcar = (a, detalle) => { if (!fuera.has(String(a.id))) fuera.set(String(a.id), detalle); };

  for (const a of acts) {
    const km = a.distance / 1000, min = a.moving_time / 60;
    const ms = a.moving_time > 0 ? a.distance / a.moving_time : 0;
    const g = grupoDe(a.sport_type);

    // Salida larga sin un metro de desnivel: o es manual, o duplica una real que sí lo tiene.
    if (a.distance > 50000 && !a.total_elevation_gain) {
      const gemela = acts.find((b) => b.id !== a.id && b.total_elevation_gain > 0 &&
        Math.abs(b.distance - a.distance) / a.distance < 0.05 &&
        Math.abs(Date.parse(b.start_date) - Date.parse(a.start_date)) < 60 * 86400000);
      if (gemela || a.manual) {
        marcar(a, gemela
          ? `Entrada de ${Math.round(km)} km sin desnivel que duplica «${gemela.name}»`
          : `Entrada manual ${Math.round(km)} km sin desnivel ni datos de dispositivo`);
        continue;
      }
    }
    if (a.moving_time > a.elapsed_time + 60) { marcar(a, `Tiempo en movimiento (${hhmmss(a.moving_time)}) mayor que el total`); continue; }
    if (a.moving_time < 60 && a.distance < 100) { marcar(a, `${a.moving_time} s y ${Math.round(a.distance)} m: registro arrancado y parado por error`); continue; }
    if (km < 1 && a.total_elevation_gain > 100) { marcar(a, `${Math.round(a.total_elevation_gain)} m de desnivel en ${Math.round(a.distance)} m: GPS erróneo`); continue; }
    if ((g === 'ruta' || g === 'mtb') && km > 3 && ms > 0 && ms < 1.8) { marcar(a, `Salida en bici de ${r1(km)} km a ${r1(ms * 3.6)} km/h: datos de tiempo corruptos`); continue; }
    if (g === 'running' && km > 1 && ms > 6.5) { marcar(a, `Carrera de ${r1(km)} km a ${ritmo(1000 / ms)}/km: GPS inconsistente`); continue; }
    if (a.distance > 0 && a.moving_time === 0) { marcar(a, 'Distancia sin tiempo en movimiento'); continue; }
    if (min > 480 && g !== 'otros') marcar(a, `${r1(min / 60)} h en movimiento: probablemente no se detuvo el registro`);
  }

  // correcciones manuales declaradas por el usuario
  for (const [id, detalle] of Object.entries(leer(OVERRIDES, {}))) {
    if (detalle === null) fuera.delete(String(id)); else fuera.set(String(id), detalle);
  }
  return fuera;
}

/* ---------- mejores esfuerzos ---------- */
const DIST_OBJ = [
  ['mejor_1k_s', 1000], ['mejor_1milla_s', 1609.34],
  ['mejor_2millas_s', 3218.69], ['mejor_5k_s', 5000]
];
function mejoresEsfuerzos(acts, detalles, fuera) {
  const filas = [];
  for (const a of acts) {
    if (grupoDe(a.sport_type) !== 'running') continue;
    const d = detalles[a.id];
    if (!d || !d.best_efforts?.length) continue;
    const km = a.distance / 1000;
    const ms = a.moving_time > 0 ? a.distance / a.moving_time : 0;
    const fila = {
      id: String(a.id), fecha: a.start_date_local.slice(0, 10), km: r2(km),
      ritmo_medio: ritmo(ms > 0 ? 1000 / ms : 0),
      mejor_1k_s: null, mejor_1milla_s: null, mejor_2millas_s: null, mejor_5k_s: null,
      sospechoso: fuera.has(String(a.id)) ? fuera.get(String(a.id)) : null
    };
    for (const [clave, metros] of DIST_OBJ) {
      const e = d.best_efforts.find((b) => Math.abs(b.distance - metros) < Math.max(12, metros * 0.01));
      if (e) fila[clave] = e.moving_time ?? e.elapsed_time;
    }
    // Un tramo imposible dentro de una salida fácil suele ser error de GPS.
    if (fila.mejor_1k_s && fila.mejor_1k_s < 170) fila.sospechoso = fila.sospechoso || 'Mejor 1 km por debajo de 2:50: GPS dudoso';
    if (DIST_OBJ.some(([k]) => fila[k])) filas.push(fila);
  }
  return filas;
}
function mejorDelAnio(filas, clave) {
  const limpio = (arr) => arr.filter((f) => f[clave]).sort((a, b) => a[clave] - b[clave])[0] || null;
  const todo = limpio(filas), sin = limpio(filas.filter((f) => !f.sospechoso));
  const fmt = (f) => (f ? { segundos: f[clave], fecha: f.fecha, id: f.id } : null);
  return { bruto: fmt(todo), sin_sospechosos: fmt(sin) };
}

/* ---------- construcción ---------- */
function construir() {
  const crudas = leer(path.join(CRUDO, 'actividades.json'), null);
  if (!crudas) throw new Error('No hay data/raw/actividades.json. Ejecuta antes: node connector/sync.mjs');
  const detalles = leer(path.join(CRUDO, 'detalles.json'), {});

  const acts = crudas
    .filter((a) => a.start_date_local?.startsWith(String(ANIO)))
    .sort((x, y) => x.start_date_local.localeCompare(y.start_date_local));
  if (!acts.length) throw new Error(`No hay actividades de ${ANIO} en el crudo.`);

  const fuera = detectarAnomalias(acts);
  const esFuera = (a) => fuera.has(String(a.id));

  /* --- actividades para el navegador (sólo lo que la app usa) --- */
  const actividades = acts.map((a) => ({
    id: String(a.id),
    name: a.name,
    sport_type: a.sport_type || a.type,
    start_local: a.start_date_local,
    distance: Math.round(a.distance),
    moving_time: a.moving_time,
    elapsed_time: a.elapsed_time,
    elevation_gain: r1(a.total_elevation_gain || 0),
    max_speed: r2(a.max_speed || 0),
    relative_effort: detalles[a.id]?.suffer_score ?? a.suffer_score ?? null,
    calories: detalles[a.id]?.calories ?? null,
    avg_speed: r2(a.average_speed || (a.moving_time ? a.distance / a.moving_time : 0)),
    // Fisiología (sólo si el dispositivo la registró)
    avg_hr: a.average_heartrate ? Math.round(a.average_heartrate) : null,
    max_hr: a.max_heartrate ? Math.round(a.max_heartrate) : null,
    avg_cadence: a.average_cadence ? r1(a.average_cadence) : null,
    avg_watts: a.average_watts ? Math.round(a.average_watts) : null,
    kj: a.kilojoules ? Math.round(a.kilojoules) : null,
    splits: detalles[a.id]?.splits ?? null
  }));

  /* --- vista enriquecida para las estadísticas --- */
  const V = acts.map((a) => {
    const ms = a.moving_time > 0 ? a.distance / a.moving_time : 0;
    return {
      a, id: String(a.id), fecha: a.start_date_local.slice(0, 10),
      hora: Number(a.start_date_local.slice(11, 13)),
      mes: mesDe(a.start_date_local), semana: semanaISO(a.start_date_local),
      dow: (new Date(a.start_date_local.slice(0, 10)).getUTCDay() + 6) % 7,   // 0 = lunes … 6 = domingo
      grupo: grupoDe(a.sport_type), deporte: a.sport_type || a.type,
      km: a.distance / 1000, horas: a.moving_time / 3600, min: a.moving_time / 60,
      elev: a.total_elevation_gain || 0, ms, spk: ms > 0 ? 1000 / ms : null,
      re: detalles[a.id]?.suffer_score ?? a.suffer_score ?? null,
      fuera: esFuera(a), nombre: a.name
    };
  });
  const L = V.filter((v) => !v.fuera);                       // limpias
  const runs = L.filter((v) => v.grupo === 'running');
  const bicis = L.filter((v) => v.grupo === 'ruta' || v.grupo === 'mtb');

  const agregar = (lista) => ({
    n: lista.length, km: r2(sum(lista.map((v) => v.km))), horas_mov: r2(sum(lista.map((v) => v.horas))),
    desnivel_m: r1(sum(lista.map((v) => v.elev))),
    esfuerzo_relativo: Math.round(sum(lista.map((v) => v.re || 0)))
  });
  const porClave = (lista, f) => {
    const m = {};
    for (const v of lista) (m[f(v)] ||= []).push(v);
    return m;
  };

  /* --- totales --- */
  const totales_por_deporte = Object.fromEntries(Object.entries(porClave(V, (v) => v.deporte))
    .map(([k, l]) => [k, { ...agregar(l), kcal: Math.round(sum(l.map((v) => detalles[v.id]?.calories || 0))) }]));
  const totales_por_grupo = Object.fromEntries(Object.entries(porClave(V, (v) => v.grupo)).map(([k, l]) => [k, agregar(l)]));

  const por_mes = Object.fromEntries(Object.entries(porClave(L, (v) => v.mes)).map(([mes, l]) => [
    mes, Object.fromEntries(Object.entries(porClave(l, (v) => v.grupo)).map(([g, gl]) => [g, {
      n: gl.length, km: r2(sum(gl.map((v) => v.km))), horas: r2(sum(gl.map((v) => v.horas))),
      desnivel_m: r1(sum(gl.map((v) => v.elev))), esfuerzo_relativo: Math.round(sum(gl.map((v) => v.re || 0)))
    }]))
  ]));

  const semanasMap = porClave(L, (v) => v.semana);
  const por_semana_iso = Object.keys(semanasMap).sort().map((s) => {
    const l = semanasMap[s], r = l.filter((v) => v.grupo === 'running');
    return {
      semana: s,
      km_running: r2(sum(r.map((v) => v.km))),
      km_ruta: r2(sum(l.filter((v) => v.grupo === 'ruta').map((v) => v.km))),
      km_mtb: r2(sum(l.filter((v) => v.grupo === 'mtb').map((v) => v.km))),
      dias_activos: new Set(l.map((v) => v.fecha)).size,
      esfuerzo_relativo: Math.round(sum(l.map((v) => v.re || 0))),
      carrera_mas_larga_km: r2(Math.max(0, ...r.map((v) => v.km))),
      n_running: r.length
    };
  });

  const saltos_semanales_running_gt30 = por_semana_iso.slice(1).map((w, i) => {
    const prev = por_semana_iso[i].km_running;
    if (!prev) return null;
    const pct = ((w.km_running - prev) / prev) * 100;
    return Math.abs(pct) > 30 ? { semana: w.semana, var_pct: r1(pct), km_prev: prev, km: w.km_running } : null;
  }).filter(Boolean);

  const kmSem = por_semana_iso.map((w) => w.km_running).filter((k) => k > 0);
  const running_km_semana = {
    min: Math.min(...kmSem), max: Math.max(...kmSem), media: r2(media(kmSem)), mediana: r2(mediana(kmSem)),
    n_semanas: kmSem.length,
    semana_min: por_semana_iso.find((w) => w.km_running === Math.min(...kmSem))?.semana,
    semana_max: por_semana_iso.find((w) => w.km_running === Math.max(...kmSem))?.semana
  };

  /* --- running --- */
  const TRAMOS = [['<4:30', 0, 270], ['4:30-5:00', 270, 300], ['5:00-5:30', 300, 330], ['5:30-6:00', 330, 360],
    ['6:00-6:30', 360, 390], ['6:30-7:00', 390, 420], ['7:00-8:00', 420, 480], ['>=8:00', 480, 1e9]];
  const kmRunTot = sum(runs.map((v) => v.km));
  const running_distribucion_ritmo = TRAMOS.map(([tramo, lo, hi]) => {
    const l = runs.filter((v) => v.spk >= lo && v.spk < hi);
    return { tramo, n: l.length, km: r2(sum(l.map((v) => v.km))), pct_km: r1(100 * sum(l.map((v) => v.km)) / (kmRunTot || 1)) };
  });

  const running_mediana_por_mes = Object.fromEntries(Object.entries(porClave(runs, (v) => v.mes)).map(([m, l]) => [m, {
    n: l.length, ritmo_mediano: ritmo(mediana(l.map((v) => v.spk).filter(Boolean))), dist_mediana_km: r2(mediana(l.map((v) => v.km)))
  }]));

  const RANGOS = [['<2.5', 0, 2.5], ['2.5-4', 2.5, 4], ['4-6', 4, 6], ['6-10', 6, 10], ['>=10', 10, 1e9]];
  const running_n_por_rango_km = Object.fromEntries(RANGOS.map(([k, lo, hi]) =>
    [k, runs.filter((v) => v.km >= lo && v.km < hi).length]));

  const running_10_mas_largas = [...runs].sort((a, b) => b.km - a.km).slice(0, 10)
    .map((v) => ({ fecha: v.fecha, nombre: v.nombre, km: r2(v.km), ritmo: ritmo(v.spk) }));

  const kmRapidos = sum(runs.filter((v) => v.spk && v.spk < 330).map((v) => v.km));
  const mejorRitmoPor = (minKm) => {
    const c = runs.filter((v) => v.km >= minKm && v.spk).sort((a, b) => a.spk - b.spk)[0];
    return c ? { ritmo: ritmo(c.spk), fecha: c.fecha, km: r2(c.km), nombre: c.nombre } : null;
  };

  /* --- racha --- */
  const fechas = new Set(L.map((v) => v.fecha));
  const ini = new Date(`${ANIO}-01-01`), fin = new Date(acts.at(-1).start_date_local.slice(0, 10));
  const todosDias = [];
  for (let d = new Date(ini); d <= fin; d.setUTCDate(d.getUTCDate() + 1)) todosDias.push(iso(d));
  const sinActividad = todosDias.filter((f) => !fechas.has(f));
  const conRun = new Set(runs.map((v) => v.fecha));
  const porFecha = porClave(L, (v) => v.fecha);

  /* --- bici --- */
  const filaBici = (v) => ({
    fecha: v.fecha, nombre: v.nombre, km: r2(v.km), desnivel_m: r1(v.elev), horas_mov: r2(v.horas),
    vel_media_kmh: r2(v.ms * 3.6), desnivel_m_por_km: v.km > 0.5 ? r2(v.elev / v.km) : null,
    esfuerzo_relativo: v.re, anomalia: null
  });
  const mtb = L.filter((v) => v.grupo === 'mtb'), ruta = L.filter((v) => v.grupo === 'ruta');
  const cmp = (l) => ({
    n: l.length, km: r2(sum(l.map((v) => v.km))), horas: r2(sum(l.map((v) => v.horas))),
    desnivel_m: r1(sum(l.map((v) => v.elev))),
    vel_media_ponderada_kmh: r2(sum(l.map((v) => v.km)) / (sum(l.map((v) => v.horas)) || 1)),
    desnivel_m_por_km: r2(sum(l.map((v) => v.elev)) / (sum(l.map((v) => v.km)) || 1))
  });

  const esfuerzos = mejoresEsfuerzos(acts, detalles, fuera);

  /* --- estadisticas_extra --- */
  const diasMap = Object.fromEntries(todosDias.map((f) => [f, porFecha[f] || []]));
  const cargaDia = (l) => sum(l.map((v) => v.min));
  const semanasExtra = Object.keys(semanasMap).sort().map((s) => {
    const dias = todosDias.filter((f) => semanaISO(f) === s).map((f) => cargaDia(diasMap[f]));
    const mu = media(dias);
    const sd = dias.length > 1 ? Math.sqrt(sum(dias.map((x) => (x - mu) ** 2)) / (dias.length - 1)) : 0;
    const horas = sum(dias) / 60;
    const mono = sd > 0 ? mu / sd : (mu > 0 ? 6 : 0);
    return { sem: s, horas: r2(horas), monotonia: r2(mono), tension: Math.round(horas * 60 * mono), acwr: null };
  });

  const horas_mensual_por_deporte = Object.fromEntries(Object.entries(porClave(L, (v) => v.mes)).map(([m, l]) => [m,
    Object.fromEntries(Object.entries(porClave(l, (v) => (v.grupo === 'ruta' ? 'ride' : v.grupo === 'running' ? 'run' : v.grupo === 'otros' ? 'otro' : v.grupo)))
      .map(([g, gl]) => [g, r1(sum(gl.map((v) => v.horas)))]))]));

  const dow_horas = {};
  for (let i = 0; i < 7; i++) dow_horas[i] = r1(sum(L.filter((v) => v.dow === i).map((v) => v.horas)));

  const horasTot = sum(L.map((v) => v.horas));
  const topDesnivel = [...bicis].sort((a, b) => b.elev - a.elev).slice(0, 10)
    .map((v) => ({ fecha: v.fecha, nombre: v.nombre, tipo: v.grupo === 'ruta' ? 'ride' : 'mtb', km: r1(v.km), desnivel: Math.round(v.elev), horas: r2(v.horas), vel: r1(v.ms * 3.6) }));

  const salida = {
    meta: {
      atleta: process.env.ATLETA || 'Emilio',
      fuente: 'Strava',
      generado: iso(new Date()),
      periodo: `${ANIO}-01-01 a ${acts.at(-1).start_date_local.slice(0, 10)}`,
      unidades: { distance: 'm', moving_time: 's', elapsed_time: 's', elevation_gain: 'm', avg_speed: 'm/s', max_speed: 'm/s' },
      nota: `Generado por connector/build.mjs a partir de ${acts.length} actividades. ${fuera.size} marcadas con datos inconsistentes y excluidas de las estadísticas.`
    },
    estadisticas: {
      totales_por_deporte, totales_por_grupo, por_mes, por_semana_iso,
      saltos_semanales_running_gt30, running_km_semana, running_distribucion_ritmo,
      running_mediana_por_mes, running_n_por_rango_km,
      running_pct_corridas_lt2_5km: r1(100 * runs.filter((v) => v.km < 2.5).length / (runs.length || 1)),
      running_10_mas_largas,
      running_pct_km_mas_rapido_5_30: r1(100 * kmRapidos / (kmRunTot || 1)),
      running_totales_validos: {
        n: runs.length, km: r2(kmRunTot),
        ritmo_medio_ponderado: ritmo(sum(runs.map((v) => v.min)) * 60 / (kmRunTot || 1))
      },
      running_mejor_ritmo_medio: { '>=3km': mejorRitmoPor(3), '>=5km': mejorRitmoPor(5), '>=10km': mejorRitmoPor(10) },
      racha: {
        primer_dia: todosDias[0], ultimo_dia: todosDias.at(-1), dias_periodo: todosDias.length,
        dias_con_actividad: todosDias.length - sinActividad.length,
        dias_sin_actividad: sinActividad,
        dias_con_2mas: todosDias.filter((f) => diasMap[f].length >= 2).length,
        dias_sin_running: todosDias.filter((f) => !conRun.has(f))
      },
      mtb_lista: mtb.map(filaBici),
      mtb_mensual: Object.fromEntries(Object.entries(porClave(mtb, (v) => v.mes)).map(([m, l]) => [m, {
        n: l.length, km: r2(sum(l.map((v) => v.km))), horas: r2(sum(l.map((v) => v.horas))), desnivel_m: r1(sum(l.map((v) => v.elev)))
      }])),
      ruta_15_mas_largas_limpias: [...ruta].sort((a, b) => b.km - a.km).slice(0, 15).map(filaBici),
      comparativa_mtb_vs_ruta: { mtb: cmp(mtb), ruta_limpia: cmp(ruta) },
      eventos: L.filter((v) => v.km >= 40 || (v.grupo === 'running' && v.km >= 10))
        .map((v) => ({ nombre: v.nombre, fecha: v.fecha, deporte: v.deporte, km: r2(v.km), tiempo_mov: hhmmss(v.min * 60), esfuerzo_relativo: v.re, anomalia: null })),
      anomalias_datos: [...fuera.entries()].map(([id, detalle]) => ({ id, detalle })),
      _verificacion_km: Object.fromEntries(Object.entries(porClave(V, (v) => v.deporte))
        .map(([k, l]) => [k, [Math.round(sum(l.map((v) => v.km)) * 1000) / 1000, r2(sum(l.map((v) => v.km)))]])),
      _verificacion_total: {
        raw: r2(sum(V.map((v) => v.km))),
        json_deporte: r2(sum(Object.values(totales_por_deporte).map((t) => t.km))),
        json_grupo: r2(sum(Object.values(totales_por_grupo).map((t) => t.km))),
        json_mes: r2(sum(Object.values(por_mes).flatMap((m) => Object.values(m).map((g) => g.km)))),
        n_raw: acts.length
      },
      mejores_esfuerzos: esfuerzos,
      mejor_1k_ano: mejorDelAnio(esfuerzos, 'mejor_1k_s'),
      mejor_5k_ano: mejorDelAnio(esfuerzos, 'mejor_5k_s')
    },
    estadisticas_extra: {
      semanas: semanasExtra,
      horas_mensual_por_deporte,
      dias: {
        total: todosDias.length, sin_actividad: sinActividad.length,
        minimo_esfuerzo_lt20min: todosDias.filter((f) => { const m = cargaDia(diasMap[f]); return m > 0 && m < 20; }).length,
        solo_run_en_esos: todosDias.filter((f) => { const l = diasMap[f]; const m = cargaDia(l); return m > 0 && m < 20 && l.every((v) => v.grupo === 'running'); }).length,
        minimo_por_mes: Object.fromEntries(Object.entries(porClave(todosDias.map((f) => ({ f, mes: mesDe(f) })), (x) => x.mes))
          .map(([m, l]) => [m, l.filter((x) => { const c = cargaDia(diasMap[x.f]); return c > 0 && c < 20; }).length]))
      },
      dow_horas,
      largos_run_ge8_por_dow: Object.fromEntries(Object.entries(porClave(runs.filter((v) => v.km >= 8), (v) => v.dow)).map(([k, l]) => [k, l.length])),
      largos_bici_ge60_por_dow: Object.fromEntries(Object.entries(porClave(bicis.filter((v) => v.km >= 60), (v) => v.dow)).map(([k, l]) => [k, l.length])),
      pct_runs_tarde_ge19h: r1(100 * runs.filter((v) => v.hora >= 19).length / (runs.length || 1)),
      ritmo_por_banda: Object.fromEntries(RANGOS.slice(1, 4).map(([k, lo, hi]) => [k,
        Object.fromEntries(Object.entries(porClave(runs.filter((v) => v.km >= lo && v.km < hi), (v) => v.mes))
          .map(([m, l]) => [m, [Math.round(mediana(l.map((v) => v.spk).filter(Boolean))), l.length]]))])),
      runs_ge8km_por_mes: Object.fromEntries(Object.entries(porClave(runs.filter((v) => v.km >= 8), (v) => v.mes)).map(([m, l]) => [m, l.length])),
      bici: { top_desnivel: topDesnivel },
      nado: L.filter((v) => v.grupo === 'nado').map((v) => ({ fecha: v.fecha, nombre: v.nombre, tipo: 'swim', km: r2(v.km), desnivel: Math.round(v.elev), horas: r2(v.horas), vel: r1(v.ms * 3.6) })),
      horas_totales: r1(horasTot),
      horas_por_semana_media: r1(horasTot / (Object.keys(semanasMap).length || 1))
    },
    actividades
  };

  if (fs.existsSync(SALIDA)) fs.copyFileSync(SALIDA, SALIDA.replace(/\.json$/, '.anterior.json'));
  fs.writeFileSync(SALIDA, JSON.stringify(salida));
  console.log(`✓ ${path.relative(RAIZ, SALIDA)} — ${actividades.length} actividades, ${fuera.size} anomalías, ${(fs.statSync(SALIDA).size / 1024).toFixed(0)} KB`);
  if (fuera.size) {
    console.log('  Datos inconsistentes detectados:');
    for (const [id, d] of fuera) console.log(`   · ${id}: ${d}`);
    console.log('  Para corregir a mano, edita connector/anomalias.json: {"<id>":"motivo"} o {"<id>":null} para rehabilitarla.');
  }
  if (!esfuerzos.length) {
    console.warn('  ⚠ Sin mejores esfuerzos: ejecuta sync.mjs sin --sin-detalle para que el VDOT se pueda calcular.');
  }

  if (CON_JS) {
    fs.writeFileSync(SALIDA_JS, 'window.__DATOS__=' + JSON.stringify(salida) + ';');
    console.log(`✓ ${path.relative(RAIZ, SALIDA_JS)} — permite abrir index.html directamente desde el disco`);
  }
}

try { construir(); } catch (e) { console.error('✗', e.message); process.exit(1); }
