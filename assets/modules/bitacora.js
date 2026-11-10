/* bitacora.js — Módulo 19 (página Hoy): «Los últimos 15 días». Por cada día: lo que pedía el plan, lo que registró Strava y el
   análisis corto escrito en assets/notas.js. Arriba, el resumen del bloque. */
(function (global) {
  'use strict';
  var App = global.App, U = App.ui, F = App.fmt, esc = App.esc, P = App.plan;
  var DOW = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

  function planDe(f) {
    var id = App.data.pref('calPlan', 'estructurado'), pl = P && P.PLANES[id];
    if (!pl) return null;
    for (var i = 0; i < pl.dias.length; i++) if (pl.dias[i].fecha === f) return pl.dias[i];
    return null;
  }
  function actTxt(a) {
    var partes = [];
    if (a.km >= 0.1) partes.push(F.num(a.km, 1) + ' km');
    partes.push(F.num(a.min, 0) + ' min');
    if (a.elev >= 20) partes.push(F.num(a.elev, 0) + ' m');
    if (a.hr) partes.push('FC ' + F.num(a.hr, 0));
    return esc(D_GRUPO[a.grupo] || a.grupo) + ' · ' + partes.join(' · ');
  }
  var D_GRUPO = { ruta: 'Bici', mtb: 'MTB', running: 'Correr', fuerza: 'Pesas', nado: 'Natación', otros: 'Caminar' };

  function render(D) {
    var N = App.notas;
    if (!N || !N.resumen) return '';
    var R = N.resumen, fechas = Object.keys(N).filter(function (k) { return /^\d{4}-/.test(k); }).sort().reverse();
    var filas = fechas.map(function (f) {
      var d = planDe(f), acts = D.limpias.filter(function (a) { return a.fechaISO === f; }), dt = new Date(f + 'T12:00:00');
      return "<li class='bt-d'><div class='bt-f'><b>" + DOW[dt.getDay()] + ' ' + dt.getDate() + '</b><small>' + F.fecha(f).replace(/^\d+ /, '') + '</small></div>' +
        "<div class='bt-c'><p class='bt-t'><b>" + esc(N[f].t) + '</b></p>' +
        '<p>' + esc(N[f].n) + '</p>' +
        (acts.length ? "<p class='bt-a'><small>" + acts.map(actTxt).join(' &nbsp;·&nbsp; ') + '</small></p>' : '') +
        (d ? "<p class='bt-p'><small><b>Plan:</b> " + esc(d.sesionOriginal || d.sesion) + '</small></p>' : '') + '</div></li>';
    });
    return U.modhead('', 'Los últimos 15 días', esc(F.fecha(R.desde) + ' – ' + F.fecha(R.hasta)) + ': un análisis corto de cada día. También aparece en la pestaña «Análisis» de cada día del calendario.') +
      U.coach(R.t, '<p>' + esc(R.n) + '</p>') +
      U.acc('Día por día (' + fechas.length + ' días)', "<ol class='bt'>" + filas.join('') + '</ol>', true);
  }

  App.mods.push({ id: 'bitacora', nom: 'Últimos 15 días', tab: 'Bitácora', icono: 'M5 4h14v16H5zM8 8h8M8 12h8M8 16h5', render: render });
})(this);
