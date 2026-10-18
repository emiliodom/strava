/* hoy.js — datos del día para la portada: el plan del día (normal, intermedio o brutal), comida, talla y cumplimiento contra Strava.
   No es un módulo propio: lo consume resumen.js. */
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

  /* Piezas del día para la portada: la sesión, la comida, la talla y el cumplimiento contra Strava. */
  function partes(D) {
    var pid = planActivo(), hoyISO = isoLocal(new Date());
    var dias = App.calExport.dias(pid);
    var ultimoDato = D.dias.length ? D.dias[D.dias.length - 1].iso : null;
    var hoyDia = dias.filter(function (d) { return d.fecha === hoyISO; })[0];
    var out = { pid: pid, hoyISO: hoyISO, hoyDia: hoyDia, ultimoDato: ultimoDato, dias: dias };

    var rHoy = real(D, hoyISO);
    out.realHoy = filaReal(rHoy);
    out.stravaAlDia = !(ultimoDato && ultimoDato < hoyISO);

    // Los últimos siete días contra Strava.
    var filas = dias.filter(function (d) { return d.fecha < hoyISO && d.fecha >= '2026-10-06'; }).slice(-7).map(function (d) {
      var r = real(D, d.fecha), c = d.fecha > (ultimoDato || '') ? '—' : cumple(d, r);
      return [esc(fecha(d.fecha)), esc(d.sesion), esc(filaReal(r)), c];
    });
    out.buenos = filas.filter(function (f) { return f[3] === '✓'; }).length;
    out.nFilas = filas.length;
    out.tablaHtml = filas.length ? U.tabla([{ t: 'Día' }, { t: 'Plan' }, { t: 'Strava' }, { t: '' }], filas,
      { pie: out.buenos + ' de ' + filas.length + ' días cumplidos (✓ todo · ≈ parte · ✗ nada). Cuenta como cumplido el 80 % de los km o de los minutos de bici, y 15 min de fuerza.' }) : '';

    // La semana en curso (lunes a domingo): hecho, hoy y lo que falta.
    var lun = new Date(hoyISO + 'T12:00:00'); lun.setDate(lun.getDate() - ((lun.getDay() + 6) % 7));
    out.semana = [0, 1, 2, 3, 4, 5, 6].map(function (i) {
      var d = new Date(lun); d.setDate(lun.getDate() + i);
      var iso = isoLocal(d), pd = dias.filter(function (x) { return x.fecha === iso; })[0];
      var estado = iso < hoyISO ? (pd ? cumple(pd, real(D, iso)) : '·') : iso === hoyISO ? 'hoy' : 'pend';
      return { iso: iso, dow: ['D', 'L', 'M', 'X', 'J', 'V', 'S'][d.getDay()], tipo: pd ? pd.tipo : '·', sesion: pd ? pd.sesion : 'sin plan', estado: estado };
    });

    if (!hoyDia) {
      var sig = dias.filter(function (d) { return d.fecha > hoyISO; })[0];
      out.sig = sig;
      return out;
    }

    var tipo = P.TIPOS[hoyDia.tipo] || {}, dow = new Date(hoyISO + 'T12:00:00').getDay();
    var ventana = dow === 6 ? P.HORARIO.sabado : dow === 0 ? P.HORARIO.domingo : P.HORARIO.semana;
    var H = P.horarioDe ? P.horarioDe(hoyISO, hoyDia) : null;
    if (H) {
      ventana = (H.despertar ? 'despierta ' + H.despertar + ' · ' : '') + H.bloques.filter(function (b) { return b.t === 'sesion' || b.t === 'noche'; }).map(function (b) {
        var f = function (x) { var h = Math.floor(x), m = Math.round((x - h) * 60); return h + ':' + (m < 10 ? '0' : '') + m; };
        return f(b.h0) + '–' + f(b.h1) + ' ' + b.txt.toLowerCase();
      }).join(' · ') + (hoyDia.recordatorio ? ' · ⏰ ' + hoyDia.recordatorio : '') + (hoyDia.racha ? ' · mínimo de la racha: 1 milla' : '');
    }
    var partesTxt = [];
    if (hoyDia.km >= 1) partesTxt.push(F.num(hoyDia.km, 1) + ' km');
    if (hoyDia.minBici) partesTxt.push(hoyDia.minBici + ' min de bici');
    out.tipo = tipo; out.ventana = ventana; out.resumenTxt = partesTxt.join(' + ');
    out.obj = App.actividad ? App.actividad.corto(hoyDia, D) : '';
    out.detalleHtml = App.actividad ? App.actividad.detalle(hoyDia, D) : '';
    out.n = App.cuerpo && App.cuerpo.metaDia ? App.cuerpo.metaDia(pid, hoyDia) : null;
    out.talla = App.cuerpo && App.cuerpo.metaTalla ? App.cuerpo.metaTalla(pid, hoyDia) : null;
    return out;
  }

  function botonesPlan(pid) {
    var NOMBRE = { estructurado: 'Normal', intermedio: 'Intermedio', brutal: 'Brutal' };
    return "<div role='group'>" + ['estructurado', 'intermedio', 'brutal'].map(function (id) {
      return "<button data-hoy-plan='" + id + "' class='" + (id === pid ? '' : 'outline secondary') + "'>" + NOMBRE[id] + '</button>';
    }).join('') + '</div>';
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

  App.hoy = { partes: partes, botonesPlan: botonesPlan, montar: montar, fecha: fecha };
})(this);
