/* core.js — utilidades compartidas. Sin dependencias, script clásico (funciona con file://). */
(function (global) {
  'use strict';
  var App = global.App || (global.App = {});

  /* ---------- escape + plantillas ---------- */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  // h`<p>${valor}</p>` escapa interpolaciones; usa App.raw(x) para insertar HTML ya construido.
  function raw(s) { return { __html: String(s) }; }
  function h(strings) {
    var out = strings[0];
    for (var i = 1; i < arguments.length; i++) {
      var v = arguments[i];
      out += render(v) + strings[i];
    }
    return out;
  }
  function render(v) {
    if (v == null || v === false) return '';
    if (Array.isArray(v)) return v.map(render).join('');
    if (typeof v === 'object' && v.__html != null) return v.__html;
    return esc(v);
  }

  /* ---------- formato (es-GT: coma decimal, punto de millar) ---------- */
  var NBSP = ' ';
  function num(v, d) {
    if (v == null || isNaN(v)) return '—';
    d = d == null ? 0 : d;
    var s = Math.abs(v).toFixed(d);
    var p = s.split('.');
    p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
    return (v < 0 ? '-' : '') + p.join(',');
  }
  function km(v, d) { return num(v, d == null ? 1 : d) + NBSP + 'km'; }
  function m(v) { return num(v, 0) + NBSP + 'm'; }
  function pct(v, d) { return num(v, d == null ? 1 : d) + '%'; }

  // segundos -> "m:ss" o "h:mm:ss"
  function hms(sec, forceH) {
    if (sec == null || isNaN(sec)) return '—';
    sec = Math.round(sec);
    var s = sec % 60, mn = Math.floor(sec / 60) % 60, hr = Math.floor(sec / 3600);
    var p2 = function (n) { return (n < 10 ? '0' : '') + n; };
    if (hr || forceH) return hr + ':' + p2(mn) + ':' + p2(s);
    return mn + ':' + p2(s);
  }
  // segundos por km -> "5:07"
  function pace(spk) {
    if (!spk || !isFinite(spk)) return '—';
    var mn = Math.floor(spk / 60), s = Math.round(spk - mn * 60);
    if (s === 60) { mn++; s = 0; }
    return mn + ':' + (s < 10 ? '0' : '') + s;
  }
  function paceKm(spk) { return pace(spk) + '/km'; }
  // m/s -> seg/km
  function msToPace(ms) { return ms > 0 ? 1000 / ms : null; }
  function kmh(ms) { return num(ms * 3.6, 1) + NBSP + 'km/h'; }

  var MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  var MESL = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var DOW = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];
  function mesCorto(ym) { return MES[parseInt(String(ym).slice(5, 7), 10) - 1] || ym; }
  function mesLargo(ym) { return MESL[parseInt(String(ym).slice(5, 7), 10) - 1] || ym; }
  function fecha(iso) {           // "2026-07-25" -> "25 jul"
    var p = String(iso).slice(0, 10).split('-');
    return parseInt(p[2], 10) + ' ' + (MES[parseInt(p[1], 10) - 1] || '');
  }
  function fechaLarga(iso) {
    var p = String(iso).slice(0, 10).split('-');
    return parseInt(p[2], 10) + ' de ' + (MESL[parseInt(p[1], 10) - 1] || '') + ' de ' + p[0];
  }

  /* ---------- fechas ---------- */
  function d(iso) { var p = String(iso).slice(0, 10).split('-'); return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])); }
  function iso(date) { return date.toISOString().slice(0, 10); }
  function addDays(date, n) { var x = new Date(date.getTime()); x.setUTCDate(x.getUTCDate() + n); return x; }
  function diffDays(a, b) { return Math.round((b - a) / 86400000); }
  function dowMon0(date) { return (date.getUTCDay() + 6) % 7; }   // 0 = lunes
  function isoWeek(date) {
    var t = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
    var y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    var wk = Math.ceil(((t - y0) / 86400000 + 1) / 7);
    return t.getUTCFullYear() + '-W' + (wk < 10 ? '0' : '') + wk;
  }

  /* ---------- estadística ---------- */
  function sum(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i] || 0; return s; }
  function mean(a) { return a.length ? sum(a) / a.length : 0; }
  function sd(a) {
    if (a.length < 2) return 0;
    var mu = mean(a), s = 0;
    for (var i = 0; i < a.length; i++) s += (a[i] - mu) * (a[i] - mu);
    return Math.sqrt(s / (a.length - 1));          // muestral, como usa Foster
  }
  function median(a) {
    if (!a.length) return 0;
    var b = a.slice().sort(function (x, y) { return x - y; }), n = b.length;
    return n % 2 ? b[(n - 1) / 2] : (b[n / 2 - 1] + b[n / 2]) / 2;
  }
  function quantile(a, q) {
    if (!a.length) return 0;
    var b = a.slice().sort(function (x, y) { return x - y; });
    var p = (b.length - 1) * q, lo = Math.floor(p), hi = Math.ceil(p);
    return b[lo] + (b[hi] - b[lo]) * (p - lo);
  }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  // regresión lineal simple -> {m, b, r2}
  function linreg(xs, ys) {
    var n = xs.length; if (n < 2) return { m: 0, b: ys[0] || 0, r2: 0 };
    var mx = mean(xs), my = mean(ys), sxy = 0, sxx = 0, syy = 0;
    for (var i = 0; i < n; i++) { var dx = xs[i] - mx, dy = ys[i] - my; sxy += dx * dy; sxx += dx * dx; syy += dy * dy; }
    var m2 = sxx ? sxy / sxx : 0;
    return { m: m2, b: my - m2 * mx, r2: (sxx && syy) ? (sxy * sxy) / (sxx * syy) : 0 };
  }

  /* ---------- DOM ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  App.esc = esc; App.h = h; App.raw = raw;
  App.fmt = {
    num: num, km: km, m: m, pct: pct, hms: hms, pace: pace, paceKm: paceKm,
    msToPace: msToPace, kmh: kmh, mesCorto: mesCorto, mesLargo: mesLargo,
    fecha: fecha, fechaLarga: fechaLarga, DOW: DOW, MES: MES, NBSP: NBSP
  };
  App.date = { d: d, iso: iso, addDays: addDays, diffDays: diffDays, dowMon0: dowMon0, isoWeek: isoWeek };
  App.stat = { sum: sum, mean: mean, sd: sd, median: median, quantile: quantile, clamp: clamp, linreg: linreg };
  App.$ = $; App.$$ = $$;
})(this);
