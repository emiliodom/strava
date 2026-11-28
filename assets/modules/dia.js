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

  var SEL = null; // día elegido (ISO); null = el último con datos

  /* Días con al menos una actividad, del más antiguo al más reciente. */
  function diasConDatos(D) {
    return D.dias.filter(function (d) { return d.acts && d.acts.length; }).map(function (d) { return d.iso; });
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
        zh ? "<span><i style='display:inline-block;width:.6rem;height:.6rem;border-radius:50%;margin-right:.35rem;background:" + zh.col + "'></i>" + esc(zh.nom) + '</span>' : (zp ? esc(zp.nom) : '—'),
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

  /* ---------- veredicto global de una actividad + mejora para la próxima ---------- */
  function analisisSplits(a) {
    var sp = (a.splits || []).filter(function (s) { return s && s[0]; });
    if (sp.length < 3) return null;
    var n = sp.length, enteros = [];
    for (var i = 0; i < n; i++) {
      var dist = i < n - 1 ? 1 : Math.max(a.km - (n - 1), 0.01);
      if (dist >= 0.6) enteros.push(sp[i][0] / dist);
    }
    if (enteros.length < 2) return null;
    var mitad = Math.floor(enteros.length / 2);
    var avg = function (arr) { return arr.reduce(function (s, x) { return s + x; }, 0) / arr.length; };
    var p1 = avg(enteros.slice(0, mitad)), p2 = avg(enteros.slice(mitad));
    return { diff: p2 - p1, p1: p1, p2: p2, primero: enteros[0], ultimo: enteros[enteros.length - 1] };
  }

  function veredicto(a, D, f) {
    var esRun = a.grupo === 'running', esBici = a.grupo === 'ruta' || a.grupo === 'mtb';
    var zp = esRun ? zonaPace(D.zonas, a.paceSpk) : null;
    var zh = zonaHR(f, a.hr);
    var pts = [], mejora = [], nivel = zh && zh.k === 'z3' ? 'warn' : 'ok';

    if (esRun) {
      if (zp) pts.push('Por ritmo medio cae en <b>' + esc(zp.nom) + '</b>');
      if (zh) pts.push('la FC media la sitúa en <b>' + esc(zh.nom) + '</b>');
      if (zp && zh && /Fácil|Recuperación/.test(zp.nom) && zh.k !== 'z1') {
        var cadPpm = a.cad ? a.cad * 2 : 0;
        if (cadPpm && Math.abs(a.hr - cadPpm) <= 14) {
          pts.push('posible enganche de muñeca a la cadencia (' + F.num(a.hr, 0) + ' lpm vs ' + F.num(cadPpm, 0) + ' ppm) por frío');
        } else {
          pts.push('ritmo fácil con pulso en ' + zh.nom.split(' ')[0] + ' (calor, fatiga o desnivel)');
        }
      }
      var sp = analisisSplits(a);
      if (sp) {
        if (sp.diff <= -8) pts.push('<b>progresión negativa</b> (' + F.paceKm(sp.p1) + ' → ' + F.paceKm(sp.p2) + ')');
        else if (sp.diff >= 15) pts.push('caída de ritmo en la segunda mitad (' + F.paceKm(sp.p1) + ' → ' + F.paceKm(sp.p2) + ')');
        else pts.push('ritmo parejo (' + F.paceKm(sp.p1) + ' → ' + F.paceKm(sp.p2) + ')');
      }
      if (a.cad) {
        var ppm = a.cad * 2;
        pts.push('cadencia ' + (ppm >= 178 ? 'viva' : ppm >= 168 ? 'sólida' : 'baja') + ' (' + F.num(ppm, 0) + ' ppm)');
      }
      // Mejora concreta para la próxima carrera
      if (sp && sp.diff >= 15) mejora.push('arranca 10–15 s/km más suave en los primeros 2 km para sostener el cierre');
      else if (zp && /Fácil|Recuperación/.test(zp.nom) && zh && zh.k !== 'z1') mejora.push('baja 15–20 s/km o usa banda de pecho en frío para confirmar Z1 real');
      else if (sp && sp.diff <= -8) mejora.push('buen control: la próxima vez mantén ese primer km contenido y acelera sólo los últimos 2 km');
      if (a.cad && a.cad * 2 < 168) mejora.push('suma 4 × 20 s de rectas suaves al final para subir cadencia');
      if (!mejora.length) mejora.push(a.km >= 10 ? 'lleva agua y 30–60 g/h de carbohidrato si pasa de 75 min' : 'calienta 5–10 min dentro de casa antes de salir con frío');
    } else if (esBici) {
      var picoKmh = a.maxMs ? a.maxMs * 3.6 : 0;
      if (picoKmh > 75) {
        pts.push('<b>pico de velocidad irreal (' + F.num(picoKmh, 0) + ' km/h)</b> por fallo de GPS: toma como válidos el tiempo (' + F.num(a.min, 0) + ' min)' + (a.hr ? ' y la FC (' + F.num(a.hr, 0) + ' lpm)' : '') + ', no la distancia ni los vatios estimados');
        nivel = 'warn';
      } else {
        if (zh) pts.push('Intensidad en <b>' + esc(zh.nom) + '</b>');
        if (a.watts) pts.push('potencia estimada ' + F.num(a.watts, 0) + ' W');
        if (a.elev >= 50 && a.km >= 1) pts.push('densidad de subida ' + F.num(a.elev / a.km, 0) + ' m/km');
      }
      if (a.elapsed > a.min + 10) pts.push('pausas acumuladas de ' + F.num(a.elapsed - a.min, 0) + ' min');
      // Mejora concreta para la próxima salida en bici
      if (picoKmh > 75) mejora.push('espera 30 s a que fije el GPS antes de arrancar o graba con Wahoo para no distorsionar distancia ni vatios');
      else if (zh && zh.k === 'z1') mejora.push('si buscas mantener forma en frío, mete 3 × 8 min en Z3 al mediodía en la próxima salida');
      else if (a.elev >= 300) mejora.push('come 60 g/h de carbohidrato desde los primeros 25 min para no vaciar piernas en subidas largas');
      else mejora.push('mantén cadencia ágil (80–90 rpm) y guantes/cortavientos para conservar potencia muscular');
    }

    if (!pts.length) return '';
    var cuerpo = pts.join(' · ') + '.' + (mejora.length ? '<br><b>Para la próxima:</b> ' + esc(mejora.join('; ')) + '.' : '');
    return U.note('Análisis de la sesión', cuerpo, nivel);
  }

  /* ---------- tarjeta por actividad ---------- */
  function tarjeta(a, D, f) {
    if (a.anomalia) {
      return "<article class='card'><h4>" + (EMO[a.grupo] || '•') + ' ' + esc(a.nombre || a.deporte) +
        '</h4>' + U.note('Datos inconsistentes', esc(a.anomalia) + ' Esta actividad queda fuera de las estadísticas.', 'warn') + '</article>';
    }
    var w = App.clima && App.clima.actividad ? App.clima.actividad(a.id) : null;
    var hora = (a.hora < 10 ? '0' : '') + a.hora + ':00';
    var out = "<article class='card'><h4>" + (EMO[a.grupo] || '•') + ' ' + esc(a.nombre || a.deporte) +
      " <small style='font-weight:normal;opacity:.7'>· " + esc(hora) + '</small></h4>';
    if (w) out += "<p class='dia-clima'><b>Clima:</b> " + esc(App.clima.texto(w)) + ' <small>(' + esc(w.f) + ')</small></p>';
    out += U.kpis(kpisDe(a, f), 'k3');
    out += veredicto(a, D, f);
    if (a.grupo === 'running') out += splits(a, D, f);
    return out + '</article>';
  }

  /* ---------- comparación con el plan del día ---------- */
  function contraPlan(iso, D) {
    if (!App.calExport) return '';
    var pid = App.data.pref('calPlan', 'estructurado');
    var NOMBRE = { estructurado: 'Normal', intermedio: 'Intermedio', brutal: 'Brutal' };
    var dia = App.calExport.dias(pid).filter(function (d) { return d.fecha === iso; })[0];
    if (!dia) return U.note('Sin plan para este día (' + esc(NOMBRE[pid]) + ')', 'Este día queda fuera del bloque octubre–noviembre, así que no hay sesión programada con la que comparar.', 'warn');

    var tipo = (P.TIPOS && P.TIPOS[dia.tipo]) || {};
    var evaluacion = App.calExport.evaluarDia(dia, D);
    var componentes = evaluacion.componentes.map(function (c) {
      var marca = c.estado === 'ok' ? '✓' : c.estado === 'parcial' ? '≈' : '✗';
      var cantidad = c.manual ? 'registro manual' : c.cantidad + (c.cantidad === 1 ? ' actividad' : ' actividades');
      return marca + ' ' + c.nombre + ' — ' + cantidad + ' · ' +
        F.num(c.valor, c.unidad === 'km' ? 1 : 0) + ' / ' + F.num(c.objetivo, c.unidad === 'km' ? 1 : 0) + ' ' + c.unidad;
    });
    var nivel = !evaluacion.total ? 'ok' : evaluacion.cumplidas === evaluacion.total ? 'ok'
      : evaluacion.cumplidas || evaluacion.parciales ? 'warn' : 'bad';
    var titulo = !evaluacion.total ? 'Día sin exigencia concreta en el plan «' + NOMBRE[pid] + '»'
      : 'Plan «' + NOMBRE[pid] + '» — ' + evaluacion.cumplidas + ' / ' + evaluacion.total + ' actividades cumplidas' +
        (evaluacion.parciales ? ', ' + evaluacion.parciales + ' parciales' : '');
    var cuerpo = '<b>' + esc(tipo.nom ? tipo.nom + ' · ' : '') + esc(dia.sesion) + '</b>' +
      (componentes.length ? '<br>' + esc(componentes.join(' · ')) : '<br>Sin componentes puntuables: cualquier movimiento suma.') +
      '<br><small>Cuenta como cumplida una actividad con al menos el 75 % del volumen previsto (70 % si hubo intensidad o desnivel, o el mínimo del rango; fuerza: 12 min). Se comparan deportes por separado.</small>';
    return U.note(titulo, cuerpo, nivel);
  }

  /* ---------- selector de fecha ---------- */
  function selector(lista, iso, ultimo) {
    var i = lista.indexOf(iso);
    var opts = lista.slice().reverse().map(function (d) {
      return '<option value="' + d + '"' + (d === iso ? ' selected' : '') + '>' + esc(fechaLarga(d)) + (d === ultimo ? ' (último)' : '') + '</option>';
    }).join('');
    return '<div class="dia-sel" style="display:flex;gap:.5rem;align-items:center;flex-wrap:wrap;margin-bottom:1rem">' +
      '<button type="button" data-dia="prev"' + (i <= 0 ? ' disabled' : '') + ' aria-label="Día anterior">◀</button>' +
      '<select data-dia="sel" aria-label="Elegir día" style="flex:1;min-width:12rem;margin:0">' + opts + '</select>' +
      '<button type="button" data-dia="next"' + (i >= lista.length - 1 ? ' disabled' : '') + ' aria-label="Día siguiente">▶</button>' +
      '</div>';
  }

  function montar(el, D) {
    var lista = diasConDatos(D);
    function ir(iso) { SEL = iso; App.refrescar('dia'); }
    function actual() { return (SEL && lista.indexOf(SEL) >= 0) ? SEL : ultimoDiaISO(D); }
    var sel = el.querySelector('select[data-dia]');
    if (sel) sel.addEventListener('change', function () { ir(sel.value); });
    [['prev', -1], ['next', 1]].forEach(function (p) {
      var b = el.querySelector('[data-dia="' + p[0] + '"]');
      if (b) b.addEventListener('click', function () {
        var j = lista.indexOf(actual()) + p[1];
        if (j >= 0 && j < lista.length) ir(lista[j]);
      });
    });
  }

  /* ---------- render ---------- */
  function render(D) {
    var head = U.modhead('', 'Sesión del día', 'El desglose de lo que hiciste el último día con datos (o el día que elijas del histórico): cada actividad por separado, kilómetro a kilómetro, y cómo cuadra con el plan.');
    var ultimo = ultimoDiaISO(D);
    var lista = diasConDatos(D);
    var iso = (SEL && lista.indexOf(SEL) >= 0) ? SEL : ultimo;
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
    var aviso = (iso === ultimo && iso < hoyISO) ? U.note('Mostrando el ' + esc(fechaLarga(iso)), 'Es el último día con datos en Strava. Si ya entrenaste hoy (' + esc(hoyISO) + '), sincroniza para verlo aquí.', 'warn') : '';

    var tarjetas = acts.map(function (a) { return tarjeta(a, D, f); }).join('');

    return head +
      selector(lista, iso, ultimo) +
      '<h3>' + esc(fechaLarga(iso)) + '</h3>' +
      resumen + aviso +
      contraPlan(iso, D) +
      tarjetas;
  }

  App.mods.push({
    id: 'dia', nom: 'Sesión del día', tab: 'Sesión',
    icono: 'M13 2 3 14h7l-1 8 10-12h-7l1-8z',
    render: render, montar: montar
  });
})(this);
