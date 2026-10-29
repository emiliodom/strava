/* vtaper.js — Módulo 16: V-taper (hombros y espalda anchos contra cintura estrecha). Lo que se hace cada día sale de plan.js (RUTINAS V/W/L)
   y de ajuste.js (aplicarVTaper); aquí se marca lo hecho, se anotan las medidas y se ve el avance. Strava no ve estas microsesiones,
   así que se registran a mano.
   Dónde se guarda (en este orden): 1) archivo del servidor PHP (registro/api.php → mistrava-store/datos/vtaper.json, con el token de Registro);
   2) archivo del repo data/vtaper.json si la página corre con connector/serve.mjs; 3) sólo el navegador (prefs vtHecho y vtMedidas).
   Las prefs siempre son la copia de trabajo (el calendario las lee síncronas); el archivo es la fuente de verdad entre equipos. */
(function (global) {
  'use strict';
  var App = global.App, U = App.ui, F = App.fmt, esc = App.esc, P = App.plan;

  var META_V = 1.40, META_PECHO = 1.25, META_CINTURA = 85;     // hombros÷cintura, pecho÷cintura y cintura en cm
  var SERIES_LAT = 3;                                          // las tres rutinas llevan 3 series de elevación lateral
  var NOMBRE = { V: 'dorsales + lateral', W: 'hombro posterior + postura', L: 'laterales' };
  var DOW = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
  var CAMPOS = { cintura: [50, 200], pecho: [60, 200], hombros: [70, 220], cuelloHombro: [8, 40], brazo: [15, 70], peso: [30, 250] };
  var API = 'registro/api.php', K_TOK = 'registroToken', LOCAL = 'api/vtaper', ARCHIVO = 'data/vtaper.json';
  var estado = { msg: 'Buscando el archivo…', sync: false };

  function iso(d) { var m = d.getMonth() + 1, dd = d.getDate(); return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (dd < 10 ? '0' : '') + dd; }
  function hoyISO() { return iso(new Date()); }
  function sumar(f, n) { var d = new Date(f + 'T12:00:00'); d.setDate(d.getDate() + n); return iso(d); }
  function planActivo() { return App.data.pref('calPlan', 'estructurado'); }
  function hechos() { return App.data.pref('vtHecho', {}) || {}; }
  function listaMedidas() { return App.data.pref('vtMedidas', []) || []; }
  function num(v) { var x = parseFloat(String(v).replace(',', '.')); return isFinite(x) ? x : null; }
  function esFecha(s) { return /^\d{4}-\d{2}-\d{2}$/.test(String(s)); }
  function token() { try { return localStorage.getItem(K_TOK) || ''; } catch (e) { return ''; } }

  /* ---------- archivo: leer, guardar y reconciliar ---------- */
  function paquete() { return { v: 1, t: App.data.pref('vtT', 0), hechos: hechos(), medidas: listaMedidas() }; }
  function limpiar(j) {
    var h = {}, por = {};
    j = j || {};
    if (j.hechos && typeof j.hechos === 'object') Object.keys(j.hechos).forEach(function (k) { if (esFecha(k) && j.hechos[k]) h[k] = 1; });
    (j.medidas instanceof Array ? j.medidas : []).forEach(function (x) {
      if (!x || !esFecha(x.f)) return;
      var e = { f: x.f }, n = 0;
      Object.keys(CAMPOS).forEach(function (c) { var v = num(x[c]); if (x[c] != null && v != null && v >= CAMPOS[c][0] && v <= CAMPOS[c][1]) { e[c] = Math.round(v * 10) / 10; n++; } });
      if (n) por[e.f] = e;
    });
    return { t: Math.round(Number(j.t) || 0), hechos: h, medidas: Object.keys(por).sort().map(function (k) { return por[k]; }) };
  }
  function adoptar(j) {
    App.data.setPref('vtHecho', j.hechos); App.data.setPref('vtMedidas', j.medidas); App.data.setPref('vtT', j.t);
  }
  function unir(a, b) {                                         // a (remoto) + b (local); lo local pisa campo a campo
    var h = Object.assign({}, a.hechos, b.hechos), por = {};
    a.medidas.concat(b.medidas).forEach(function (m) { por[m.f] = Object.assign(por[m.f] || {}, m); });
    return { t: Math.max(a.t, b.t), hechos: h, medidas: Object.keys(por).sort().map(function (k) { return por[k]; }) };
  }
  function igual(a, b) { return JSON.stringify([a.hechos, a.medidas]) === JSON.stringify([b.hechos, b.medidas]); }

  function pintarEstado() {
    var el = document.querySelector('#vtaper .vt-estado');
    if (el) el.textContent = estado.msg;
  }
  function leerRemoto() {
    var servidor = token()
      ? fetch(API + '?accion=vt_leer', { headers: { 'X-Token': token() }, cache: 'no-store' }).then(function (r) {
        return r.json().then(function (j) { if (!r.ok || !j.datos) throw new Error('vacío'); return j.datos; });
      })
      : Promise.reject(new Error('sin token'));
    return servidor.catch(function () {
      return fetch(ARCHIVO + '?_=' + Date.now(), { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error('sin archivo'); return r.json(); });
    });
  }
  function empujar() {
    var cuerpo = JSON.stringify(paquete());
    var servidor = token()
      ? fetch(API + '?accion=vt_guardar', { method: 'POST', headers: { 'X-Token': token(), 'Content-Type': 'application/json' }, body: cuerpo })
        .then(function (r) { if (!r.ok) throw new Error('servidor'); return 'archivo del servidor'; })
      : Promise.reject(new Error('sin token'));
    return servidor.catch(function () {
      return fetch(LOCAL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: cuerpo })
        .then(function (r) { if (!r.ok) throw new Error('local'); return 'data/vtaper.json'; });
    }).then(function (donde) { estado.msg = 'Guardado en ' + donde + ' ✓'; },
      function () { estado.msg = 'Guardado sólo en este navegador: no hay archivo al que escribir aquí. Pon el token en Registro (servidor) o abre la página con connector/serve.mjs, y usa «Exportar copia» mientras tanto.'; })
      .then(pintarEstado);
  }
  function sincronizar() {
    leerRemoto().then(function (crudo) {
      var r = limpiar(crudo), tl = App.data.pref('vtT', 0), l = limpiar(paquete());
      if (!tl) {
        var u = unir(r, l); adoptar(u);
        estado.msg = 'Archivo leído ✓'; refrescar();
        if (!igual(u, r)) { App.data.setPref('vtT', Date.now()); return empujar(); }
      } else if (r.t > tl) {
        adoptar(r); estado.msg = 'Archivo leído (más reciente que este navegador) ✓'; refrescar();
      } else if (r.t < tl && !igual(r, l)) {
        return empujar();
      } else estado.msg = 'Archivo al día ✓';
      pintarEstado();
    }).catch(function () { estado.msg = 'Sin archivo a la vista: se usa la copia de este navegador.'; pintarEstado(); });
  }
  function tocar() { App.data.setPref('vtT', Date.now()); }
  function cambiado() { tocar(); refrescar(); empujar(); }

  function marcar(f) {
    var h = hechos();
    if (h[f]) delete h[f]; else h[f] = 1;
    App.data.setPref('vtHecho', h); cambiado();
  }

  /* Punto de partida: el escaneo del 6 oct (cintura, pecho, brazo y peso); los hombros se anotan aparte (data/vtaper.json). */
  function base() {
    var B = global.__BODY360__, at = B && Object.keys(B)[0], e = at && B[at][0], m = e && e.medidas;
    if (!m) return null;
    var cm = function (v) { return v == null ? null : Math.round(v * 10) / 10; };
    return { f: e.fecha, cintura: cm(m.waist), pecho: cm(m.chest), hombros: null, brazo: cm(m.bicep), peso: m.weight || null, base: 1 };
  }
  function medidas() {
    var l = listaMedidas().slice().sort(function (a, b) { return a.f < b.f ? -1 : a.f > b.f ? 1 : 0; });
    var b = base();
    return b ? [b].concat(l) : l;
  }
  function ultimo(ms, campo) {
    for (var i = ms.length - 1; i >= 0; i--) if (ms[i][campo] != null) return ms[i];
    return null;
  }
  function ratio(m, campo, cint) { var c = cint || (m && m.cintura); return m && m[campo] != null && c ? m[campo] / c : null; }

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
    return { lunes: l, dias: dias, hechos: hechosSem, filas: filas, series: series, serieProg: dias.length * SERIES_LAT };
  }

  function formulario() {
    return "<form id='vtForm' class='vt-form' autocomplete='off'>" +
      "<label>Fecha<input type='date' name='f' value='" + hoyISO() + "' required></label>" +
      "<label>Cintura (cm)<input type='text' inputmode='decimal' name='cintura' placeholder='93,9'></label>" +
      "<label>Pecho (cm)<input type='text' inputmode='decimal' name='pecho' placeholder='101,6'></label>" +
      "<label>Hombros (cm)<input type='text' inputmode='decimal' name='hombros' placeholder='115'></label>" +
      "<label>Cuello–hombro (cm)<input type='text' inputmode='decimal' name='cuelloHombro' placeholder='20'></label>" +
      "<label>Brazo (cm)<input type='text' inputmode='decimal' name='brazo' placeholder='33'></label>" +
      "<label>Peso (kg)<input type='text' inputmode='decimal' name='peso' placeholder='77'></label>" +
      "<button type='submit'>Guardar medidas</button></form>" +
      "<p class='vt-msg' role='status' aria-live='polite'></p>";
  }

  function tablaMedidas(ms) {
    var u = ms.slice().reverse(), cintBase = ultimo(ms, 'cintura');
    return U.tabla([{ t: 'Fecha' }, { t: 'Cintura', n: 1 }, { t: 'Pecho', n: 1 }, { t: 'Hombros', n: 1 }, { t: 'Cuello–hombro', n: 1 }, { t: 'Hombros ÷ cintura', n: 1 }, { t: 'Brazo', n: 1 }, { t: 'Peso', n: 1 }, { t: '' }],
      u.map(function (m) {
        var v = ratio(m, 'hombros', m.cintura || (cintBase && cintBase.cintura));
        var c = function (x) { return x == null ? '—' : F.num(x, 1); };
        return [esc(m.f) + (m.base ? ' <small>(escaneo)</small>' : ''), c(m.cintura), c(m.pecho), c(m.hombros), c(m.cuelloHombro), v == null ? '—' : F.num(v, 2), c(m.brazo), c(m.peso),
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
    var cint = ultimo(ms, 'cintura'), conH = ms.filter(function (m) { return m.hombros != null && (m.cintura != null || cint); });
    if (conH.length > 1) out += C.lines({
      labels: conH.map(function (m) { return m.f.slice(5); }),
      series: [{ name: 'Hombros ÷ cintura', color: 'var(--accent)', values: conH.map(function (m) { return ratio(m, 'hombros', m.cintura || cint.cintura); }), dots: true, width: 2 }],
      hline: [{ v: META_V, color: 'var(--ok)', label: 'meta ' + F.num(META_V, 2) }],
      height: 190, fmtY: function (v) { return F.num(v, 2); }, label: 'Índice V (hombros ÷ cintura)',
      caption: 'Sube por dos lados: la cintura baja y los hombros crecen.'
    });
    return out;
  }

  function render() {
    var ms = medidas(), s = semana(), h = hechos(), hoy = hoyISO();
    var uC = ultimo(ms, 'cintura'), uH = ultimo(ms, 'hombros'), uP = ultimo(ms, 'pecho'), b = base();
    var vIdx = uH && uC ? uH.hombros / uC.cintura : null, pIdx = uP && uC ? uP.pecho / uC.cintura : null;
    var cintura = uC ? uC.cintura : null, cinturaIni = b ? b.cintura : null;
    var desde = '2026-10-30', prog = plan(desde, hoy), cumplidos = prog.filter(function (d) { return h[d.fecha]; }).length;
    var pctSem = s.dias.length ? Math.round(100 * s.hechos / s.dias.length) : 0;

    return U.modhead('16', 'V-taper: hombros y espalda anchos, cintura estrecha',
      'Un poco cada día: 5–14 minutos de dorsales y deltoides, sin tocar el pie lesionado. Lo que ves aquí es lo que hiciste y lo que midieron tu cinta y tu báscula.') +
      U.kpis([
        U.kpi('Esta semana', s.hechos + ' / ' + s.dias.length, 'sesiones hechas (' + pctSem + ' %)', s.hechos >= s.dias.length && s.dias.length ? 'ok' : ''),
        U.kpi('Racha', racha(prog, h, hoy) + ' días', 'programados seguidos'),
        U.kpi('Series laterales', s.series.lat + ' / ' + s.serieProg, 'esta semana; meta 12–20'),
        U.kpi('Desde el 30 oct', cumplidos + ' / ' + prog.length, 'sesiones cumplidas'),
        U.kpi('Cintura', cintura == null ? '—' : F.num(cintura, 1) + ' cm', cinturaIni && cintura != null ? (cintura - cinturaIni <= 0 ? '' : '+') + F.num(cintura - cinturaIni, 1) + ' cm desde el escaneo · meta ' + META_CINTURA : 'meta ' + META_CINTURA),
        U.kpi('Hombros ÷ cintura', vIdx == null ? 'mide hombros' : F.num(vIdx, 2), (uH ? 'hombros ' + F.num(uH.hombros, 0) + ' cm · ' : '') + 'meta ' + F.num(META_V, 2), vIdx != null && vIdx >= META_V ? 'ok' : ''),
        U.kpi('Pecho ÷ cintura', pIdx == null ? '—' : F.num(pIdx, 2), 'meta ' + F.num(META_PECHO, 2) + ' · escaneo 6 oct: ' + (b && b.cintura ? F.num(b.pecho / b.cintura, 2) : '—'))
      ], 'k3') +

      '<h3>Esta semana</h3>' +
      "<progress value='" + s.hechos + "' max='" + Math.max(1, s.dias.length) + "' aria-label='Sesiones de V-taper de la semana'></progress>" +
      "<ul class='vt-sem'>" + s.filas.join('') + '</ul>' +
      '<p><small>Cada día suma 3 series de elevación lateral; los lunes y jueves, además, 9 de dorsales; martes y viernes, 9 de hombro posterior y postura. Los días de fuerza B/U y la víspera de un evento sólo llevan los laterales. Lo marcado también se ve como ✓ en el calendario.</small></p>' +

      '<h3>Tus medidas</h3>' + U.note('Cómo medir', 'Cada 7–14 días, el mismo día de la semana, por la mañana, en ayunas y sin ropa gruesa. <b>Cintura:</b> a la altura del ombligo, exhalando. <b>Pecho:</b> a la altura de los pezones, brazos relajados. <b>Hombros:</b> el contorno completo alrededor de los deltoides por el punto más ancho, con los brazos caídos (necesitas que alguien te ayude). <b>Cuello–hombro:</b> del borde del cuello a la punta del hombro; si baja o sube con los meses, es el trapecio que cambia. <b>Brazo:</b> el bíceps flexionado. Usa siempre la misma cinta y la misma postura: lo que importa es la tendencia, no un valor aislado.', 'info') +
      formulario() + graficos(ms) + tablaMedidas(ms) +
      "<p class='vt-estado' role='status'><small>" + esc(estado.msg) + '</small></p>' +
      "<p><button type='button' data-vt-guardar>Guardar en el archivo</button> <button type='button' class='outline' data-vt-exp>Exportar copia (JSON)</button> <label class='vt-imp'>Importar copia<input type='file' accept='application/json' data-vt-imp></label></p>" +
      '<p><small>Los datos se guardan en un archivo (<code>data/vtaper.json</code> con <code>serve.mjs</code>, o en el servidor con el token de Registro) y también en este navegador. Si el archivo está en el repo, haz commit para versionarlo.</small></p>' +

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

  function guardarMedida(m) {
    var l = listaMedidas().filter(function (x) { return x.f !== m.f; });
    l.push(m);
    App.data.setPref('vtMedidas', l);
  }
  function refrescar() { ['vtaper', 'resumen', 'calendario', 'dia'].forEach(function (id) { if (App.refrescar) App.refrescar(id); }); }

  function montar(el) {
    if (!estado.sync) { estado.sync = true; sincronizar(); }
    if (!el._vt) {                                              // el contenedor se reutiliza al refrescar: un solo escuchador
      el._vt = true;
      el.addEventListener('click', function (ev) {
        var t = ev.target.closest ? ev.target.closest('[data-vt-hecho]') : null;
        if (t) { marcar(t.getAttribute('data-vt-hecho')); return; }
        var bo = ev.target.closest ? ev.target.closest('[data-vt-borrar]') : null;
        if (bo) {
          ev.preventDefault();
          var d = bo.getAttribute('data-vt-borrar');
          App.data.setPref('vtMedidas', listaMedidas().filter(function (x) { return x.f !== d; }));
          cambiado(); return;
        }
        if (ev.target.closest && ev.target.closest('[data-vt-guardar]')) { tocar(); estado.msg = 'Guardando…'; pintarEstado(); empujar(); return; }
        if (ev.target.closest && ev.target.closest('[data-vt-exp]')) {
          var blob = new Blob([JSON.stringify(paquete(), null, 2)], { type: 'application/json' });
          var a = document.createElement('a');
          a.href = URL.createObjectURL(blob); a.download = 'vtaper-' + hoyISO() + '.json';
          document.body.appendChild(a); a.click(); document.body.removeChild(a);
          setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
        }
      });
    }
    var imp = el.querySelector('[data-vt-imp]');
    if (imp) imp.addEventListener('change', function () {
      var arch = imp.files && imp.files[0], msg = el.querySelector('.vt-msg');
      if (!arch) return;
      var r = new FileReader();
      r.onload = function () {
        try {
          var j = limpiar(JSON.parse(r.result)), u = unir(limpiar(paquete()), j);
          adoptar(u); cambiado();
        } catch (e) { if (msg) msg.textContent = 'Ese archivo no es una copia válida.'; }
      };
      r.readAsText(arch);
    });
    var fo = el.querySelector('#vtForm');
    if (fo) fo.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var msg = el.querySelector('.vt-msg'), m = { f: fo.elements.f.value }, alguno = false, mal = null;
      Object.keys(CAMPOS).forEach(function (k) {
        var raw = fo.elements[k].value.trim();
        if (!raw) return;
        var v = num(raw);
        if (v == null || v < CAMPOS[k][0] || v > CAMPOS[k][1]) mal = k; else { m[k] = Math.round(v * 10) / 10; alguno = true; }
      });
      if (mal) { msg.textContent = 'Revisa «' + mal + '»: el valor no parece una medida en ' + (mal === 'peso' ? 'kg' : 'cm') + '.'; return; }
      if (!m.f || !alguno) { msg.textContent = 'Escribe al menos una medida.'; return; }
      var previa = listaMedidas().filter(function (x) { return x.f === m.f; })[0];
      if (previa) Object.keys(previa).forEach(function (k) { if (m[k] === undefined) m[k] = previa[k]; });
      guardarMedida(m); cambiado();
    });
  }

  App.vtaper = { hechos: hechos, plan: plan, racha: racha, medidas: medidas, semana: semana, hoyISO: hoyISO, marcar: marcar };
  App.mods.push({ id: 'vtaper', nom: 'V-taper', tab: 'V-taper', icono: 'M3 5h18l-6 7v8h-6v-8z', render: render, montar: montar });
})(this);
