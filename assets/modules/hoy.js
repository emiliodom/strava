/* hoy.js — «Lo que te toca hoy»: el plan del día (normal o brutal), con fuerza, comida y cumplimiento contra Strava.
   Se incrusta en el Resumen; no es un módulo propio. */
(function (global) {
  'use strict';
  var App = global.App, U = App.ui, F = App.fmt, esc = App.esc, P = App.plan;
  var DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

  function isoLocal(d) {
    var m = d.getMonth() + 1, dd = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (dd < 10 ? '0' : '') + dd;
  }
  function planActivo() { return App.data.pref('calPlan', 'estructurado'); }
  function fecha(iso) { var d = new Date(iso + 'T12:00:00'); return DIAS[d.getDay()] + ' ' + d.getDate(); }

  /* Lo que Strava dice que se hizo ese día */
  function real(D, iso) {
    var d = D.dias.filter(function (x) { return x.iso === iso; })[0];
    if (!d) return null;
    var g = d.grupos || {};
    return { kmRun: d.kmRun, bici: (g.ruta || 0) + (g.mtb || 0), fuerza: (g.fuerza || 0) + (g.otros || 0), min: d.min };
  }

  /* ¿Se cumplió? '✓' todo, '≈' parte, '✗' nada, '·' sin requisitos */
  function cumple(dia, r) {
    var req = [], ok = [];
    var fz = /fuerza [ABC]/.test(dia.sesion);
    if (dia.km >= 3) { req.push(1); if (r && r.kmRun >= 0.8 * dia.km) ok.push(1); }
    if (dia.minBici >= 30) { req.push(1); if (r && r.bici >= 0.8 * dia.minBici) ok.push(1); }
    if (fz) { req.push(1); if (r && r.fuerza >= 15) ok.push(1); }
    if (!req.length) return r && r.min > 90 ? '≈' : '✓';
    return ok.length === req.length ? '✓' : ok.length ? '≈' : '✗';
  }

  function filaReal(r) {
    if (!r || !r.min) return 'nada';
    var p = [];
    if (r.kmRun) p.push(F.num(r.kmRun, 1) + ' km');
    if (r.bici) p.push(F.num(r.bici, 0) + ' min bici');
    if (r.fuerza) p.push(F.num(r.fuerza, 0) + ' min fuerza');
    return p.join(' · ') || F.num(r.min, 0) + ' min';
  }

  function render(D) {
    var pid = planActivo(), hoyISO = isoLocal(new Date());
    var dias = App.calExport.dias(pid);
    var ultimoDato = D.dias.length ? D.dias[D.dias.length - 1].iso : null;
    var hoyDia = dias.filter(function (d) { return d.fecha === hoyISO; })[0];
    var NOMBRE = { estructurado: 'Normal', intermedio: 'Intermedio', brutal: 'Brutal' };
    var botones = "<div role='group' style='margin-bottom:1rem'>" + ['estructurado', 'intermedio', 'brutal'].map(function (id) {
      return "<button data-hoy-plan='" + id + "' class='" + (id === pid ? '' : 'outline secondary') + "'>" + NOMBRE[id] + '</button>';
    }).join('') + '</div>';

    var cab = "<h3>Lo que te toca hoy</h3>" + botones;
    if (!hoyDia) {
      var sig = dias.filter(function (d) { return d.fecha > hoyISO; })[0];
      return cab + U.note(sig ? 'Hoy no hay sesión en el plan' : 'El plan terminó el 30 de noviembre',
        sig ? 'Lo siguiente es el ' + esc(fecha(sig.fecha)) + ': ' + esc(sig.sesion) + '.' : 'Pide el bloque de diciembre y lo armamos con lo que pase en la Guatemágica.', 'warn');
    }

    var tipo = P.TIPOS[hoyDia.tipo] || {}, dow = new Date(hoyISO + 'T12:00:00').getDay();
    var ventana = dow === 6 ? P.HORARIO.sabado : dow === 0 ? P.HORARIO.domingo : P.HORARIO.semana;
    var partes = [];
    if (hoyDia.km >= 1) partes.push(F.num(hoyDia.km, 1) + ' km');
    if (hoyDia.minBici) partes.push(hoyDia.minBici + ' min de bici');
    var obj = App.actividad ? App.actividad.corto(hoyDia, D) : '';
    var html = cab + U.note(esc(tipo.nom || 'Sesión') + ' · ' + esc(fecha(hoyISO)),
      '<b>' + esc(hoyDia.sesion) + '</b><br>' + (partes.length ? esc(partes.join(' + ')) + '. ' : '') +
      (obj ? 'Objetivo: <b>' + esc(obj) + '</b>. ' : '') + 'Ventana: ' + esc(ventana) + '.', hoyDia.tipo === 'C' ? 'warn' : 'ok');

    if (App.actividad) html += U.acc('Detalle de la actividad, por deporte', App.actividad.detalle(hoyDia, D), true);

    if (App.cuerpo && App.cuerpo.metaDia) {
      var n = App.cuerpo.metaDia(pid, hoyDia);
      if (n) html += U.kpis([
        U.kpi('Comer hoy', F.num(n.kcal, 0) + ' kcal', esc(n.modo)),
        U.kpi('Proteína', F.num(n.prot, 0) + ' g', '4 tomas de ' + F.num(n.prot / 4, 0) + ' g'),
        U.kpi('Carbohidrato', F.num(n.carbG, 0) + ' g', esc(n.carbTxt))
      ], 'k3') + '<p><small>' + esc(n.nota) + '</small></p>';
    }

    /* ---- cumplimiento contra Strava ---- */
    var rHoy = real(D, hoyISO);
    if (ultimoDato && ultimoDato < hoyISO) {
      html += U.note('Strava aún no trae datos de hoy', 'La última actividad sincronizada es del ' + esc(ultimoDato) + '. Corre <code>node connector/sync.mjs &amp;&amp; node connector/build.mjs --js</code> para comparar el plan con lo que hiciste.', 'warn');
    } else {
      html += '<p><small>Hasta ahora en Strava hoy: <b>' + esc(filaReal(rHoy)) + '</b>.</small></p>';
    }

    var filas = dias.filter(function (d) { return d.fecha < hoyISO && d.fecha >= '2026-10-06'; }).slice(-7).map(function (d) {
      var r = real(D, d.fecha), c = d.fecha > (ultimoDato || '') ? '—' : cumple(d, r);
      return [esc(fecha(d.fecha)), esc(d.sesion), esc(filaReal(r)), c];
    });
    if (filas.length) {
      var buenos = filas.filter(function (f) { return f[3] === '✓'; }).length;
      html += '<h4>Últimos días: plan contra Strava</h4>' + U.tabla([{ t: 'Día' }, { t: 'Plan' }, { t: 'Strava' }, { t: '' }], filas,
        { pie: buenos + ' de ' + filas.length + ' días cumplidos (✓ todo · ≈ parte · ✗ nada). Cuenta como cumplido el 80 % de los km o de los minutos de bici, y 15 min de fuerza.' });
    }
    return html;
  }

  function montar(el) {
    var bs = el.querySelectorAll('[data-hoy-plan]');
    Array.prototype.forEach.call(bs, function (b) {
      b.addEventListener('click', function () {
        App.data.setPref('calPlan', b.getAttribute('data-hoy-plan'));
        App.refrescar('resumen'); if (App.refrescar) App.refrescar('calendario');
      });
    });
  }

  App.hoy = { render: render, montar: montar };
})(this);
