/* dia.js — «Sesión del día»: analiza cada actividad del último día con datos.
   Desglosa splits, ritmo y FC por kilómetro, clasifica la intensidad contra tus
   zonas reales y compara lo hecho con la sesión «normal» que tocaba ese día.
   El análisis histórico (año, running, bici…) sigue viviendo en sus módulos. */
(function (global) {
  'use strict';
  var App = global.App, U = App.ui, C = App.chart, F = App.fmt, M = App.metrics, esc = App.esc, P = App.plan;
  var DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  var EMO = { running: '🏃', ruta: '🚴', mtb: '🚵', fuerza: '💪', nado: '🏊', otros: '🏋️' };
  var ZCOL = { z1: 'var(--z1)', z2: 'var(--z3)', z3: 'var(--z5)' };

  function fechaLarga(iso) {
    var d = new Date(iso + 'T12:00:00');
    return DIAS[d.getDay()] + ' ' + d.getDate() + ' de ' + F.mesLargo(iso);
  }

  /* El último día que tenga actividad real (no el calendario vacío de hoy). */
  function ultimoDiaISO(D) {
    for (var i = D.dias.length - 1; i >= 0; i--) {
      if (D.dias[i].acts && D.dias[i].acts.length) return D.dias[i].iso;
    }
    return D.acts.length ? D.acts[D.acts.length - 1].fechaISO : null;
  }

  function fisio(D) {
    var pref = Number(App.data.pref('fcmax', 0)) || null;
    return M.fisiologia(D.acts, pref, (App.data.atleta() || {}).edad);
  }

  /* ---------- clasificación por zona ---------- */
  function zonaPace(z, spk) {
    if (!z || !spk) return null;
    if (spk < z.intervalo) return { nom: 'Repetición (R)', col: 'var(--bad)' };
    if (spk < z.umbral) return { nom: 'Intervalo (I)', col: 'var(--bad)' };
    if (spk < z.maraton) return { nom: 'Umbral (T)', col: 'var(--warn)' };
    if (spk < z.facilRapido) return { nom: 'Maratón (M)', col: 'var(--warn)' };
    if (spk <= z.facilLento) return { nom: 'Fácil (E)', col: 'var(--ok)' };
    return { nom: 'Recuperación', col: 'var(--ok)' };
  }
  function zonaHR(f, hr) {
    if (!f || !f.disponible || !hr) return null;
    if (hr < f.lim.l1) return { k: 'z1', nom: 'Z1 · suave', col: ZCOL.z1 };
    if (hr < f.lim.l2) return { k: 'z2', nom: 'Z2 · moderada', col: ZCOL.z2 };
    return { k: 'z3', nom: 'Z3 · alta', col: ZCOL.z3 };
  }

  /* ---------- KPIs según el deporte ---------- */
  function kpisDe(a, f) {
    var k = [];
    var esRun = a.grupo === 'running', esBici = a.grupo === 'ruta' || a.grupo === 'mtb';
    if (a.km >= 0.3) k.push(U.kpi('Distancia', F.km(a.km), EMO[a.grupo] + ' ' + esc(a.deporte)));
    k.push(U.kpi('Tiempo en movimiento', F.hms(a.min * 60, a.min >= 60), a.elapsed > a.min + 1 ? F.hms(a.elapsed * 60, a.elapsed >= 60) + ' en total' : 'sin pausas'));
    if (esRun && a.paceSpk) k.push(U.kpi('Ritmo medio', F.paceKm(a.paceSpk), 'media de la salida'));
    if (esBici && a.ms) k.push(U.kpi('Velocidad media', F.kmh(a.ms), a.maxMs ? 'pico ' + F.kmh(a.maxMs) : 'media de la salida'));
    if (a.hr) k.push(U.kpi('FC media', F.num(a.hr, 0) + ' lpm', a.hrMax ? 'máx ' + F.num(a.hrMax, 0) + ' lpm' : (f && f.disponible ? F.num(100 * a.hr / f.fcmax, 0) + '% de la máx' : '')));
    if (a.re) k.push(U.kpi('Esfuerzo relativo', F.num(a.re, 0), 'de Strava'));
    if (a.kcal) k.push(U.kpi('Calorías', F.num(a.kcal, 0) + ' kcal', esRun && a.km ? F.num(a.kcal / a.km, 0) + ' kcal/km' : 'gasto estimado'));
    if (esRun && a.cad) k.push(U.kpi('Cadencia', F.num(a.cad * 2, 0) + ' ppm', F.num(a.cad, 0) + ' por pierna'));
    if (esBici && a.watts) k.push(U.kpi('Potencia media', F.num(a.watts, 0) + ' W', 'de Strava'));
    if (a.elev >= 5) k.push(U.kpi('Desnivel+', F.m(a.elev), a.km >= 1 ? F.num(a.elev / a.km, 0) + ' m/km' : ''));
    return k;
  }

  /* ---------- desglose por kilómetro (splits) ---------- */
  function splits(a, D, f) {
    var sp = (a.splits || []).filter(function (s) { return s && s[0]; });
    if (sp.length < 2) return '';
    var z = D.zonas, n = sp.length;
    var kms = sp.map(function (s, i) {
      var dist = i < n - 1 ? 1 : Math.max(a.km - (n - 1), 0.01);
      return { i: i, dist: dist, parcial: i === n - 1 && dist < 0.6, spk: s[0] / dist, seg: s[0], hr: s[1] || null, elev: s[2] || 0 };
    });
    var enteros = kms.filter(function (x) { return !x.parcial; });
    if (!enteros.length) return '';

    /* tiempo por zona de FC a partir de los splits */
    var segZ = { z1: 0, z2: 0, z3: 0 }, totZ = 0;
    kms.forEach(function (x) { var zz = zonaHR(f, x.hr); if (zz) { segZ[zz.k] += x.seg; totZ += x.seg; } });

    /* gráfico de ritmo por km (eje invertido: más arriba = más rápido), color por zona de FC */
    var g = C.bars({
      values: enteros.map(function (x) { return -x.spk; }),
      labels: enteros.map(function (x) { return 'K' + (x.i + 1); }),
      tips: enteros.map(function (x) { return F.paceKm(x.spk) + (x.hr ? ' · ' + x.hr + ' lpm' : ''); }),
      colorFn: function (v, i) { var zz = zonaHR(f, enteros[i].hr); return zz ? zz.col : 'var(--z2)'; },
      height: 190, labelEvery: 1,
      fmtY: function (v) { return F.pace(-v); }, fmtVal: function (v) { return F.paceKm(-v); },
      mean: a.paceSpk ? -a.paceSpk : null, meanLabel: a.paceSpk ? 'media ' + F.paceKm(a.paceSpk) : '',
      label: 'Ritmo por kilómetro',
      caption: 'Eje invertido: más arriba es más rápido. El color es la zona de frecuencia cardiaca de cada kilómetro.'
    });

    var filas = kms.map(function (x) {
      var zp = zonaPace(z, x.spk), zh = zonaHR(f, x.hr);
      return [
        'K' + (x.i + 1) + (x.parcial ? ' <small>(' + F.num(x.dist, 2) + ' km)</small>' : ''),
        '<b>' + (x.dist < 0.1 ? '—' : F.paceKm(x.spk)) + '</b>',
        x.hr ? x.hr + ' lpm' : '—',
        zh ? "<span style='color:" + zh.col + "'>" + esc(zh.nom) + '</span>' : (zp ? esc(zp.nom) : '—'),
        (x.elev > 0 ? '+' : '') + F.num(x.elev, 0) + ' m'
      ];
    });

    var hbar = totZ ? C.hbars([
      { label: 'Z1 · suave', v: 100 * segZ.z1 / totZ, color: ZCOL.z1, text: F.pct(100 * segZ.z1 / totZ, 0) },
      { label: 'Z2 · moderada', v: 100 * segZ.z2 / totZ, color: ZCOL.z2, text: F.pct(100 * segZ.z2 / totZ, 0) },
      { label: 'Z3 · alta', v: 100 * segZ.z3 / totZ, color: ZCOL.z3, text: F.pct(100 * segZ.z3 / totZ, 0) }
    ], { max: 100 }) : '';

    return g +
      (hbar ? '<h5>Tiempo en cada zona de FC</h5>' + hbar + '<p><small>Zonas sobre ' + F.num(f.fcmax, 0) + ' lpm de FC máxima: Z1 &lt;' + f.lim.l1 + ', Z2 ' + f.lim.l1 + '–' + f.lim.l2 + ', Z3 &gt;' + f.lim.l2 + ' lpm.</small></p>' : '') +
      U.acc('Tabla kilómetro a kilómetro', U.tabla(
        [{ t: 'Km' }, { t: 'Ritmo', n: true }, { t: 'FC', n: true }, { t: 'Zona' }, { t: 'Desnivel', n: true }], filas), false);
  }

  /* ---------- veredicto global de una actividad ---------- */
  function veredicto(a, D, f) {
    var esRun = a.grupo === 'running';
    var zp = esRun ? zonaPace(D.zonas, a.paceSpk) : null;
    var zh = zonaHR(f, a.hr);
    if (!zp && !zh) return '';
    var txt = [];
    if (zp) txt.push('Por ritmo medio cae en <b>' + esc(zp.nom) + '</b>');
    if (zh) txt.push('la FC media la sitúa en <b>' + esc(zh.nom) + '</b>');
    var aviso = '';
    if (esRun && zp && zh && /Fácil|Recuperación/.test(zp.nom) && zh.k !== 'z1') {
      aviso = ' El ritmo era de rodaje fácil pero el corazón iba en ' + zh.nom.split(' ')[0] + ': un «fácil que no lo es», típico de días de calor, cansancio o desnivel.';
    }
    return U.note('Cómo salió', txt.join(' y ') + '.' + aviso, zh && zh.k === 'z3' ? 'warn' : 'ok');
  }

  /* ---------- tarjeta por actividad ---------- */
  function tarjeta(a, D, f) {
    if (a.anomalia) {
      return "<article class='card'><h4>" + (EMO[a.grupo] || '•') + ' ' + esc(a.nombre || a.deporte) +
        '</h4>' + U.note('Datos inconsistentes', esc(a.anomalia) + ' Esta actividad queda fuera de las estadísticas.', 'warn') + '</article>';
    }
    var hora = (a.hora < 10 ? '0' : '') + a.hora + ':00';
    var out = "<article class='card'><h4>" + (EMO[a.grupo] || '•') + ' ' + esc(a.nombre || a.deporte) +
      " <small style='font-weight:normal;opacity:.7'>· " + esc(hora) + '</small></h4>';
    out += U.kpis(kpisDe(a, f), 'k3');
    out += veredicto(a, D, f);
    if (a.grupo === 'running') out += splits(a, D, f);
    return out + '</article>';
  }

  /* ---------- comparación con el plan del día ---------- */
  function contraPlan(iso, acts, D) {
    if (!App.calExport) return '';
    var pid = App.data.pref('calPlan', 'estructurado');
    var NOMBRE = { estructurado: 'Normal', intermedio: 'Intermedio', brutal: 'Brutal' };
    var dia = App.calExport.dias(pid).filter(function (d) { return d.fecha === iso; })[0];
    if (!dia) return U.note('Sin plan para este día (' + esc(NOMBRE[pid]) + ')', 'Este día queda fuera del bloque octubre–noviembre, así que no hay sesión programada con la que comparar.', 'warn');

    var kmRun = acts.filter(function (a) { return a.grupo === 'running'; }).reduce(function (s, a) { return s + a.km; }, 0);
    var minBici = acts.filter(function (a) { return a.grupo === 'ruta' || a.grupo === 'mtb'; }).reduce(function (s, a) { return s + a.min; }, 0);
    var minFuerza = acts.filter(function (a) { return a.grupo === 'fuerza' || a.grupo === 'otros'; }).reduce(function (s, a) { return s + a.min; }, 0);
    var tipo = (P.TIPOS && P.TIPOS[dia.tipo]) || {};

    var req = [], ok = [], det = [];
    if (dia.km >= 1) { req.push(1); var cRun = kmRun >= 0.8 * dia.km; if (cRun) ok.push(1); det.push((cRun ? '✓' : '✗') + ' correr ' + F.num(kmRun, 1) + ' / ' + F.num(dia.km, 1) + ' km'); }
    if (dia.minBici >= 20) { req.push(1); var cBici = minBici >= 0.8 * dia.minBici; if (cBici) ok.push(1); det.push((cBici ? '✓' : '✗') + ' bici ' + F.num(minBici, 0) + ' / ' + F.num(dia.minBici, 0) + ' min'); }
    if (/fuerza [ABC]/.test(dia.sesion)) { req.push(1); var cFz = minFuerza >= 15; if (cFz) ok.push(1); det.push((cFz ? '✓' : '✗') + ' fuerza ' + F.num(minFuerza, 0) + ' min'); }

    var nivel = !req.length ? 'ok' : ok.length === req.length ? 'ok' : ok.length ? 'warn' : 'bad';
    var titulo = !req.length ? 'Día sin exigencia concreta en el plan «' + NOMBRE[pid] + '»'
      : ok.length === req.length ? 'Sesión «' + NOMBRE[pid] + '» cumplida' : ok.length ? 'Sesión «' + NOMBRE[pid] + '» cumplida a medias' : 'Sesión «' + NOMBRE[pid] + '» sin cumplir';
    var cuerpo = '<b>' + esc(tipo.nom ? tipo.nom + ' · ' : '') + esc(dia.sesion) + '</b>' +
      (det.length ? '<br>' + esc(det.join(' · ')) : '<br>Sin requisitos mínimos: cualquier movimiento suma.');
    return U.note(titulo, cuerpo, nivel);
  }

  /* ---------- render ---------- */
  function render(D) {
    var head = U.modhead('', 'Sesión del día', 'El desglose de lo que hiciste el último día con datos: cada actividad por separado, kilómetro a kilómetro, y cómo cuadra con el plan.');
    var iso = ultimoDiaISO(D);
    if (!iso) return head + U.note('Todavía no hay actividades', 'Sincroniza con <code>node connector/sync.mjs &amp;&amp; node connector/build.mjs --js</code> y vuelve.', 'warn');

    var acts = D.acts.filter(function (a) { return a.fechaISO === iso; }).sort(function (x, y) { return x.hora - y.hora; });
    var f = fisio(D);
    var limpias = acts.filter(function (a) { return !a.anomalia; });

    var tKm = limpias.reduce(function (s, a) { return s + a.km; }, 0);
    var tMin = limpias.reduce(function (s, a) { return s + a.min; }, 0);
    var tKcal = limpias.reduce(function (s, a) { return s + (a.kcal || 0); }, 0);
    var tElev = limpias.reduce(function (s, a) { return s + a.elev; }, 0);

    var resumen = U.kpis([
      U.kpi('Actividades', F.num(acts.length, 0), limpias.length !== acts.length ? (acts.length - limpias.length) + ' descartada(s)' : 'del día'),
      U.kpi('Distancia total', F.km(tKm), 'sumando deportes'),
      U.kpi('Tiempo total', F.hms(tMin * 60, tMin >= 60), 'en movimiento'),
      U.kpi('Gasto', tKcal ? F.num(tKcal, 0) + ' kcal' : '—', tElev >= 5 ? '+' + F.m(tElev) + ' de desnivel' : 'calorías del día')
    ], 'k4');

    var ultimoDato = D.dias.length ? D.dias[D.dias.length - 1].iso : null;
    var hoyISO = (function () { var d = new Date(), m = d.getMonth() + 1, dd = d.getDate(); return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (dd < 10 ? '0' : '') + dd; })();
    var aviso = (iso < hoyISO) ? U.note('Mostrando el ' + esc(fechaLarga(iso)), 'Es el último día con datos en Strava. Si ya entrenaste hoy (' + esc(hoyISO) + '), sincroniza para verlo aquí.', 'warn') : '';

    var tarjetas = acts.map(function (a) { return tarjeta(a, D, f); }).join('');

    return head +
      '<h3>' + esc(fechaLarga(iso)) + '</h3>' +
      resumen + aviso +
      contraPlan(iso, limpias, D) +
      tarjetas;
  }

  App.mods.push({
    id: 'dia', nom: 'Sesión del día', tab: 'Sesión',
    icono: 'M13 2 3 14h7l-1 8 10-12h-7l1-8z',
    render: render
  });
})(this);
