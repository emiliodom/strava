/* vtaper.js — Módulo 16: V-taper (hombros y espalda anchos contra cintura estrecha). Lo que se hace cada día sale de plan.js (RUTINAS V/W/L)
   y de ajuste.js (aplicarVTaper); aquí se marca lo hecho, se anotan las medidas y se ve el avance. Strava no ve estas microsesiones,
   así que todo se registra a mano y se guarda en el navegador (prefs vtHecho y vtMedidas), con copia en JSON para no perderlo. */
(function (global) {
  'use strict';
  var App = global.App, U = App.ui, F = App.fmt, esc = App.esc, P = App.plan;

  var META_V = 1.40, META_PECHO = 1.25, META_CINTURA = 85;     // hombros÷cintura, pecho÷cintura y cintura en cm
  var SERIES_LAT = 3;                                          // las tres rutinas llevan 3 series de elevación lateral
  var NOMBRE = { V: 'dorsales + lateral', W: 'hombro posterior + postura', L: 'laterales' };
  var DOW = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

  function iso(d) { var m = d.getMonth() + 1, dd = d.getDate(); return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (dd < 10 ? '0' : '') + dd; }
  function hoyISO() { return iso(new Date()); }
  function sumar(f, n) { var d = new Date(f + 'T12:00:00'); d.setDate(d.getDate() + n); return iso(d); }
  function planActivo() { return App.data.pref('calPlan', 'estructurado'); }
  function hechos() { return App.data.pref('vtHecho', {}) || {}; }
  function num(v) { var x = parseFloat(String(v).replace(',', '.')); return isFinite(x) ? x : null; }

  /* Punto de partida: el escaneo del 6 oct (cintura, pecho, brazo y peso); los hombros nunca se midieron. */
  function base() {
    var B = global.__BODY360__, at = B && Object.keys(B)[0], e = at && B[at][0], m = e && e.medidas;
    if (!m) return null;
    var cm = function (v) { return v == null ? null : Math.round(v * 10) / 10; };
    return { f: e.fecha, cintura: cm(m.waist), pecho: cm(m.chest), hombros: null, brazo: cm(m.bicep), peso: m.weight || null, base: 1 };
  }
  function medidas() {
    var l = (App.data.pref('vtMedidas', []) || []).slice().sort(function (a, b) { return a.f < b.f ? -1 : a.f > b.f ? 1 : 0; });
    var b = base();
    return b ? [b].concat(l) : l;
  }
  function ultimo(ms, campo) {
    for (var i = ms.length - 1; i >= 0; i--) if (ms[i][campo] != null) return ms[i];
    return null;
  }
  function ratio(m, campo) { return m && m[campo] != null && m.cintura ? m[campo] / m.cintura : null; }

  /* Días con V-taper programado entre dos fechas (inclusive) del plan activo. */
  function plan(desde, hasta) {
    if (!App.calExport) return [];
    return App.calExport.dias(planActivo()).filter(function (d) { return d.vt && d.fecha >= desde && d.fecha <= hasta; });
  }
  function lunes(f) { var d = new Date(f + 'T12:00:00'); return sumar(f, -((d.getDay() + 6) % 7)); }

  /* Racha: días programados consecutivos cumplidos hasta hoy (hoy sin marcar todavía no la rompe). */
  function racha(prog, h, hoy) {
    var n = 0, i = prog.length - 1;
    while (i >= 0 && prog[i].fecha > hoy) i--;
    if (i >= 0 && prog[i].fecha === hoy && !h[hoy]) i--;
    for (; i >= 0; i--) { if (h[prog[i].fecha]) n++; else break; }
    return n;
  }

  function semana() {
    var hoy = hoyISO(), l = lunes(hoy), h = hechos(), dias = plan(l, sumar(l, 6));
    var hechosSem = dias.filter(function (d) { return h[d.fecha]; }).length;
    var filas = [0, 1, 2, 3, 4, 5, 6].map(function (i) {
      var f = sumar(l, i), d = dias.filter(function (x) { return x.fecha === f; })[0], dw = DOW[new Date(f + 'T12:00:00').getDay()];
      if (!d) return "<li class='vt-dia lib'><span class='vt-f'>" + dw + ' ' + f.slice(8) + "</span><span>libre</span></li>";
      var r = P.RUTINAS[d.vt], ok = !!h[f], fut = f > hoy;
      return "<li class='vt-dia" + (ok ? ' ok' : '') + (f === hoy ? ' hoy' : '') + "'><span class='vt-f'>" + dw + ' ' + f.slice(8) + '</span>' +
        '<span>' + esc(NOMBRE[d.vt]) + ' · ' + r.min + ' min</span>' +
        "<button type='button' class='outline " + (ok ? '' : 'secondary') + "' data-vt-hecho='" + f + "' aria-pressed='" + (ok ? 'true' : 'false') + "'" + (fut ? ' disabled' : '') + '>' +
        (ok ? '✓ hecho' : fut ? 'pendiente' : 'marcar') + '</button></li>';
    });
    var series = { lat: 0, dor: 0, pos: 0 };
    dias.forEach(function (d) {
      if (!h[d.fecha]) return;
      series.lat += SERIES_LAT;
      if (d.vt === 'V') series.dor += 9;
      if (d.vt === 'W') series.pos += 9;
    });
    var prog = dias.reduce(function (s, d) { return s + SERIES_LAT; }, 0);
    return { lunes: l, dias: dias, hechos: hechosSem, filas: filas, series: series, serieProg: prog };
  }

  function formulario() {
    return "<form id='vtForm' class='vt-form' autocomplete='off'>" +
      "<label>Fecha<input type='date' name='f' value='" + hoyISO() + "' required></label>" +
      "<label>Cintura (cm)<input type='text' inputmode='decimal' name='cintura' placeholder='93,9'></label>" +
      "<label>Pecho (cm)<input type='text' inputmode='decimal' name='pecho' placeholder='101,6'></label>" +
      "<label>Hombros (cm)<input type='text' inputmode='decimal' name='hombros' placeholder='116'></label>" +
      "<label>Brazo (cm)<input type='text' inputmode='decimal' name='brazo' placeholder='33'></label>" +
      "<label>Peso (kg)<input type='text' inputmode='decimal' name='peso' placeholder='77'></label>" +
      "<button type='submit'>Guardar medidas</button></form>" +
      "<p class='vt-msg' role='status' aria-live='polite'></p>";
  }

  function tablaMedidas(ms) {
    var u = ms.slice().reverse();
    return U.tabla([{ t: 'Fecha' }, { t: 'Cintura', n: 1 }, { t: 'Pecho', n: 1 }, { t: 'Hombros', n: 1 }, { t: 'Hombros ÷ cintura', n: 1 }, { t: 'Brazo', n: 1 }, { t: 'Peso', n: 1 }, { t: '' }],
      u.map(function (m) {
        var v = ratio(m, 'hombros');
        var c = function (x, d) { return x == null ? '—' : F.num(x, d == null ? 1 : d); };
        return [esc(m.f) + (m.base ? ' <small>(escaneo)</small>' : ''), c(m.cintura), c(m.pecho), c(m.hombros), v == null ? '—' : F.num(v, 2), c(m.brazo), c(m.peso),
          m.base ? '' : "<a href='#' data-vt-borrar='" + esc(m.f) + "'><small>borrar</small></a>"];
      }));
  }

  function graficos(ms) {
    var C = App.charts, out = '';
    if (!C || !C.lines) return '';
    var conC = ms.filter(function (m) { return m.cintura != null; });
    if (conC.length > 1) out += C.lines({
      labels: conC.map(function (m) { return m.f.slice(5); }),
      series: [{ name: 'Cintura (cm)', color: 'var(--accent)', values: conC.map(function (m) { return m.cintura; }), dots: true, width: 2 }],
      hline: [{ v: META_CINTURA, color: 'var(--ok)', label: 'meta ' + META_CINTURA }],
      height: 190, fmtY: function (v) { return F.num(v, 0); }, label: 'Cintura en el tiempo',
      caption: 'La cintura baja con el déficit; la línea verde es la meta (la mitad de tu estatura).'
    });
    var conH = ms.filter(function (m) { return m.hombros != null && m.cintura != null; });
    if (conH.length > 1) out += C.lines({
      labels: conH.map(function (m) { return m.f.slice(5); }),
      series: [{ name: 'Hombros ÷ cintura', color: 'var(--accent)', values: conH.map(function (m) { return ratio(m, 'hombros'); }), dots: true, width: 2 }],
      hline: [{ v: META_V, color: 'var(--ok)', label: 'meta ' + F.num(META_V, 2) }],
      height: 190, fmtY: function (v) { return F.num(v, 2); }, label: 'Índice V (hombros ÷ cintura)',
      caption: 'Sube por dos lados: la cintura baja y los hombros crecen.'
    });
    return out;
  }

  function render() {
    var ms = medidas(), s = semana(), h = hechos(), hoy = hoyISO();
    var uC = ultimo(ms, 'cintura'), uH = ultimo(ms, 'hombros'), uP = ultimo(ms, 'pecho'), b = base();
    var vIdx = uH ? ratio(uH, 'hombros') : null, pIdx = ratio(uP, 'pecho');
    var cintura = uC ? uC.cintura : null, cinturaIni = b ? b.cintura : null;
    var desde = '2026-10-30', prog = plan(desde, hoy), cumplidos = prog.filter(function (d) { return h[d.fecha]; }).length;
    var pctSem = s.dias.length ? Math.round(100 * s.hechos / s.dias.length) : 0;
    var prox = ms.length < 2 ? 'Aún no hay medidas nuevas. ' : '';

    return U.modhead('16', 'V-taper: hombros y espalda anchos, cintura estrecha',
      'Un poco cada día: 5–14 minutos de dorsales y deltoides, sin tocar el pie lesionado. Lo que ves aquí es lo que hiciste y lo que midieron tu cinta y tu báscula.') +
      U.kpis([
        U.kpi('Esta semana', s.hechos + ' / ' + s.dias.length, 'sesiones hechas (' + pctSem + ' %)', s.hechos >= s.dias.length && s.dias.length ? 'ok' : ''),
        U.kpi('Racha', racha(prog, h, hoy) + ' días', 'programados seguidos'),
        U.kpi('Series laterales', s.series.lat + ' / ' + s.serieProg, 'esta semana; meta 12–20'),
        U.kpi('Desde el 30 oct', cumplidos + ' / ' + prog.length, 'sesiones cumplidas'),
        U.kpi('Cintura', cintura == null ? '—' : F.num(cintura, 1) + ' cm', cinturaIni && cintura != null ? (cintura - cinturaIni <= 0 ? '' : '+') + F.num(cintura - cinturaIni, 1) + ' cm desde el escaneo · meta ' + META_CINTURA : 'meta ' + META_CINTURA),
        U.kpi('Hombros ÷ cintura', vIdx == null ? 'mide hombros' : F.num(vIdx, 2), 'meta ' + F.num(META_V, 2) + ' (atlético)', vIdx != null && vIdx >= META_V ? 'ok' : ''),
        U.kpi('Pecho ÷ cintura', pIdx == null ? '—' : F.num(pIdx, 2), 'meta ' + F.num(META_PECHO, 2) + ' · escaneo 6 oct: ' + (b && ratio(b, 'pecho') ? F.num(ratio(b, 'pecho'), 2) : '—'))
      ], 'k3') +

      '<h3>Esta semana</h3>' +
      "<progress value='" + s.hechos + "' max='" + Math.max(1, s.dias.length) + "' aria-label='Sesiones de V-taper de la semana'></progress>" +
      "<ul class='vt-sem'>" + s.filas.join('') + '</ul>' +
      '<p><small>Cada día suma 3 series de elevación lateral; los lunes y jueves, además, 9 de dorsales; martes y viernes, 9 de hombro posterior y postura. Los días de fuerza B/U y la víspera de un evento sólo llevan los laterales. Lo marcado también se ve como ✓ en el calendario.</small></p>' +

      '<h3>Tus medidas</h3>' + U.note('Cómo medir', prox + 'Cada 7–14 días, el mismo día de la semana, por la mañana, en ayunas y sin ropa gruesa. <b>Cintura:</b> a la altura del ombligo, exhalando. <b>Pecho:</b> a la altura de los pezones, brazos relajados. <b>Hombros:</b> el contorno más ancho alrededor de los deltoides, con los brazos caídos (necesitas que alguien te ayude). <b>Brazo:</b> el bíceps flexionado. Usa siempre la misma cinta y la misma postura: lo que importa es la tendencia, no un valor aislado.', 'info') +
      formulario() + graficos(ms) + tablaMedidas(ms) +
      "<p><button type='button' class='outline' data-vt-exp>Exportar copia (JSON)</button> <label class='vt-imp'>Importar copia<input type='file' accept='application/json' data-vt-imp></label></p>" +
      '<p><small>Se guarda sólo en este navegador. Si cambias de equipo, exporta la copia y vuelve a importarla.</small></p>' +

      U.acc('Qué se hace cada día y por qué', U.coach('Dosis pequeña, todos los días',
        '<ul><li><b>Lunes y jueves · V (14 min):</b> dominadas con banda o negativas, remo a una mano, pull-over y elevación lateral. Ensancha la espalda (dorsales).</li>' +
        '<li><b>Martes y viernes · W (12 min):</b> lateral, pájaro, face pull y «W». Hombro posterior y postura: la bici y el escritorio redondean los hombros.</li>' +
        '<li><b>Miércoles y sábado · L (5 min):</b> sólo laterales. Casi no fatiga, así que cabe incluso en días de fuerza.</li>' +
        '<li><b>Domingo:</b> libre.</li></ul>' +
        '<p>La evidencia sobre volumen: unas 10–20 series duras por semana por grupo muscular producen la mayor parte del crecimiento; el deltoides lateral tolera una frecuencia alta. Las repeticiones cerca del fallo (1–2 en reserva) importan más que la carga exacta.</p>' +
        '<p>Evita las flexiones laterales de tronco con mucha carga: engrosan la cintura, que es lo contrario de lo que buscas.</p>')) +
      U.acc('Qué mide cada número y qué esperar', '<ul><li><b>Hombros ÷ cintura:</b> el índice V. Con ≈ 1,40 se ve atlético; 1,618 es la «proporción áurea», una referencia popular y no una meta médica.</li>' +
        '<li><b>Pecho ÷ cintura:</b> tu escaneo de partida es 1,08; subirlo a ≈ 1,25 es una meta realista a meses, no a semanas.</li>' +
        '<li><b>Ritmo realista:</b> la cintura puede bajar 0,5–1 cm por semana con el déficit; el hombro y la espalda ganan milímetros al mes. Si el índice V sube, casi siempre es por la cintura.</li>' +
        '<li><b>Ojo con la cinta:</b> ±1 cm de error es normal; mira la tendencia de 3–4 mediciones.</li></ul>' +
        '<p><small>Información general de entrenamiento para adultos sanos, no una prescripción. Si algo duele en el hombro, para y consulta.</small></p>');
  }

  function guardar(m) {
    var l = (App.data.pref('vtMedidas', []) || []).filter(function (x) { return x.f !== m.f; });
    l.push(m);
    App.data.setPref('vtMedidas', l);
  }
  function refrescar() { ['vtaper', 'resumen', 'calendario', 'dia'].forEach(function (id) { if (App.refrescar) App.refrescar(id); }); }

  function montar(el) {
    el.addEventListener('click', function (ev) {
      var t = ev.target.closest ? ev.target.closest('[data-vt-hecho]') : null;
      if (t) {
        var f = t.getAttribute('data-vt-hecho'), h = hechos();
        if (h[f]) delete h[f]; else h[f] = 1;
        App.data.setPref('vtHecho', h); refrescar(); return;
      }
      var bo = ev.target.closest ? ev.target.closest('[data-vt-borrar]') : null;
      if (bo) {
        ev.preventDefault();
        var d = bo.getAttribute('data-vt-borrar');
        App.data.setPref('vtMedidas', (App.data.pref('vtMedidas', []) || []).filter(function (x) { return x.f !== d; }));
        refrescar(); return;
      }
      if (ev.target.closest && ev.target.closest('[data-vt-exp]')) {
        var blob = new Blob([JSON.stringify({ vtHecho: hechos(), vtMedidas: App.data.pref('vtMedidas', []) }, null, 2)], { type: 'application/json' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = 'vtaper-' + hoyISO() + '.json';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
      }
    });
    var imp = el.querySelector('[data-vt-imp]');
    if (imp) imp.addEventListener('change', function () {
      var arch = imp.files && imp.files[0], msg = el.querySelector('.vt-msg');
      if (!arch) return;
      var r = new FileReader();
      r.onload = function () {
        try {
          var j = JSON.parse(r.result);
          if (j.vtHecho && typeof j.vtHecho === 'object') {
            var h = hechos(); Object.keys(j.vtHecho).forEach(function (k) { if (/^\d{4}-\d{2}-\d{2}$/.test(k)) h[k] = 1; });
            App.data.setPref('vtHecho', h);
          }
          if (j.vtMedidas instanceof Array) j.vtMedidas.forEach(function (m) { if (m && /^\d{4}-\d{2}-\d{2}$/.test(m.f)) guardar(m); });
          refrescar();
        } catch (e) { if (msg) msg.textContent = 'Ese archivo no es una copia válida.'; }
      };
      r.readAsText(arch);
    });
    var fo = el.querySelector('#vtForm');
    if (fo) fo.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var msg = el.querySelector('.vt-msg'), m = { f: fo.elements.f.value };
      var campos = { cintura: [50, 200], pecho: [60, 200], hombros: [70, 220], brazo: [15, 70], peso: [30, 250] }, alguno = false, mal = null;
      Object.keys(campos).forEach(function (k) {
        var raw = fo.elements[k].value.trim();
        if (!raw) return;
        var v = num(raw);
        if (v == null || v < campos[k][0] || v > campos[k][1]) mal = k; else { m[k] = Math.round(v * 10) / 10; alguno = true; }
      });
      if (mal) { msg.textContent = 'Revisa «' + mal + '»: el valor no parece una medida en ' + (mal === 'peso' ? 'kg' : 'cm') + '.'; return; }
      if (!m.f || !alguno) { msg.textContent = 'Escribe al menos una medida.'; return; }
      var previa = (App.data.pref('vtMedidas', []) || []).filter(function (x) { return x.f === m.f; })[0];
      if (previa) Object.keys(previa).forEach(function (k) { if (m[k] === undefined) m[k] = previa[k]; });
      guardar(m); refrescar();
    });
  }

  App.vtaper = { hechos: hechos, plan: plan, racha: racha, medidas: medidas, semana: semana, hoyISO: hoyISO };
  App.mods.push({ id: 'vtaper', nom: 'V-taper', tab: 'V-taper', icono: 'M3 5h18l-6 7v8h-6v-8z', render: render, montar: montar });
})(this);
