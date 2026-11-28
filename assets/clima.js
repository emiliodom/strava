/* clima.js — lee data/clima.json (lo genera connector/clima.mjs con Open-Meteo y la estación NWS KCLT) y lo expone:
   · App.clima.actividad(id)  → clima de una actividad (temperatura, sensación, viento, humedad, fuente)
   · App.clima.dia(fecha)      → pronóstico de mañana (6–9 h) y mediodía (12–15 h) y si la bici pasa la regla del frío
   · App.clima.diaHtml(fecha)  → bloque HTML para el calendario (lo hecho y lo previsto)
   Si el archivo falta (p. ej. abriendo desde el disco), todo devuelve null y la web sigue igual. */
(function (global) {
  'use strict';
  var App = global.App || (global.App = {}), F = App.fmt, esc = App.esc;
  var C = null, V_BICI = 25;   // km/h de la bici para la sensación térmica (viento relativo)

  function cargar() {
    if (location.protocol === 'file:') return Promise.resolve(null);
    return fetch('data/clima.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { C = j; return j; }, function () { return null; });
  }
  // Sensación térmica (Environment Canada / NWS), válida con T ≤ 10 °C.
  function sensacion(t, v) {
    if (t == null || v == null || t > 10 || v <= 4.8) return t;
    var p = Math.pow(v, 0.16);
    return 13.12 + 0.6215 * t - 11.37 * p + 0.3965 * t * p;
  }
  function g(x) { return x == null ? '—' : F.num(x, 0) + ' °C'; }

  function actividad(id) { return C && C.actividades ? C.actividades[String(id)] || null : null; }
  function texto(w) {
    if (!w) return '';
    return g(w.t) + (w.st != null && Math.abs(w.st - w.t) >= 1 ? ' (sensación ' + g(w.st) + ')' : '') +
      (w.v != null ? ' · viento ' + F.num(w.v, 0) + ' km/h' : '') + (w.hr != null ? ' · humedad ' + w.hr + ' %' : '') +
      (w.pp ? ' · lluvia ' + F.num(w.pp, 1) + ' mm/h' : '');
  }

  function ventana(fecha, h0, h1) {
    var P = C && C.pronostico; if (!P) return null;
    var hs = P.horas.filter(function (h) { var hh = +h[0].slice(11, 13); return h[0].slice(0, 10) === fecha && hh >= h0 && hh < h1; });
    if (!hs.length) return null;
    var min = function (i) { return Math.min.apply(null, hs.map(function (h) { return h[i]; })); }, max = function (i) { return Math.max.apply(null, hs.map(function (h) { return h[i]; })); };
    var t = min(1), v = max(3);
    return { t: t, tMax: max(1), st: min(2), v: v, pp: max(4), bici: sensacion(t, v + V_BICI) };
  }
  function dia(fecha) {
    var P = C && C.pronostico; if (!P) return null;
    var d = P.dias.filter(function (x) { return x.f === fecha; })[0]; if (!d) return null;
    var am = ventana(fecha, 6, 10), md = ventana(fecha, 12, 15);
    return { lugar: P.nom, d: d, am: am, md: md, biciOk: md ? md.bici > -5 && md.t > 0 : null };
  }
  function lineaDia(x) {
    if (!x) return '';
    var s = esc(x.lugar.replace(/\s*\(.*\)/, '')) + ': ' + g(x.d.min) + ' a ' + g(x.d.max);
    if (x.am) s += ' · 6–10 h ' + g(x.am.t) + (x.am.st < x.am.t - 1 ? ' (sensación ' + g(x.am.st) + ')' : '');
    if (x.md) s += ' · 12–15 h ' + g(x.md.tMax) + ', viento ' + F.num(x.md.v, 0) + ' km/h';
    if (x.md && x.md.pp >= 40) s += ' · lluvia ' + x.md.pp + ' %';
    return s;
  }
  function veredictoBici(x) {
    if (!x || !x.md) return '';
    return x.biciOk ? 'Bici al mediodía: sí (sensación a ' + V_BICI + ' km/h ≈ ' + g(x.md.bici) + ')' : 'Bici al mediodía: mejor no (sensación a ' + V_BICI + ' km/h ≈ ' + g(x.md.bici) + '); trote o trail';
  }

  function diaHtml(fecha, idsReales) {
    if (!C) return '';
    var filas = (idsReales || []).map(function (a) { var w = actividad(a.id); return w ? '<li><b>' + esc(a.nombre || '') + ':</b> ' + esc(texto(w)) + ' <small>(' + esc(w.f) + ')</small></li>' : ''; }).join('');
    var x = dia(fecha);
    var verd = x && x.md ? " <span class='clima-tag " + (x.biciOk ? 'ok' : 'no') + "'>" + esc(veredictoBici(x)) + '</span>' : '';
    var prev = x ? "<p class='clima-prev'><b>Pronóstico:</b> " + lineaDia(x) + verd + '</p>' : '';
    if (!filas && !prev) return '';
    return "<div class='clima'><div class='clima-cab'><h5>Clima</h5>" + (x ? "<span class='clima-lugar'>" + esc(x.lugar.replace(/\s*\(.*\)/, '')) + '</span>' : '') + '</div>' +
      (filas ? '<ul>' + filas + '</ul>' : '') + prev + '</div>';
  }

  App.clima = { cargar: cargar, actividad: actividad, texto: texto, dia: dia, lineaDia: lineaDia, veredictoBici: veredictoBici, diaHtml: diaHtml, sensacion: sensacion, datos: function () { return C; } };
})(this);
