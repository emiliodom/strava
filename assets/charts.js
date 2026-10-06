/* charts.js — gráficas SVG mínimas, sin dependencias. Todas devuelven una cadena HTML. */
(function (global) {
  'use strict';
  var App = global.App || (global.App = {}), F = App.fmt, esc = App.esc;
  var W = 640;

  function niceTicks(min, max, n) {
    n = n || 5;
    if (max === min) { max = min + 1; }
    var span = max - min, step = Math.pow(10, Math.floor(Math.log(span / n) / Math.LN10));
    var err = (span / n) / step;
    if (err >= 7.5) step *= 10; else if (err >= 3.5) step *= 5; else if (err >= 1.5) step *= 2;
    var lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step, t = [];
    for (var v = lo; v <= hi + step / 2; v += step) t.push(Math.abs(v) < step / 1e6 ? 0 : v);
    return t;
  }

  function frame(o) {
    // o: {min,max,height,padL,padR,padT,padB,fmtY,ticks}
    var padL = o.padL == null ? 34 : o.padL, padR = o.padR == null ? 10 : o.padR;
    var padT = o.padT == null ? 12 : o.padT, padB = o.padB == null ? 26 : o.padB;
    var H = o.height || 200, x0 = padL, x1 = W - padR, y0 = H - padB, y1 = padT;
    var ticks = o.ticks || niceTicks(o.min, o.max, o.nTicks || 5);
    var lo = o.forceMin != null ? o.forceMin : Math.min(ticks[0], o.min);
    var hi = o.forceMax != null ? o.forceMax : Math.max(ticks[ticks.length - 1], o.max);
    var Y = function (v) { return y0 - (v - lo) / (hi - lo || 1) * (y0 - y1); };
    var g = '';
    for (var i = 0; i < ticks.length; i++) {
      var y = Y(ticks[i]);
      if (y < y1 - 1 || y > y0 + 1) continue;
      g += "<line class='g' x1='" + x0 + "' x2='" + x1 + "' y1='" + y.toFixed(1) + "' y2='" + y.toFixed(1) + "'/>";
      g += "<text x='" + (x0 - 4) + "' y='" + (y + 3).toFixed(1) + "' text-anchor='end'>" + esc(o.fmtY ? o.fmtY(ticks[i]) : F.num(ticks[i], 0)) + "</text>";
    }
    return { x0: x0, x1: x1, y0: y0, y1: y1, H: H, Y: Y, lo: lo, hi: hi, grid: g };
  }

  function svg(H, inner, label) {
    return "<svg viewBox='0 0 " + W + " " + H + "' role='img' aria-label='" + esc(label || '') + "' preserveAspectRatio='xMidYMid meet'>" + inner + "</svg>";
  }

  function fig(inner, caption) {
    return "<figure class='ch'>" + inner + (caption ? "<figcaption>" + caption + "</figcaption>" : '') + "</figure>";
  }

  /* ---------- barras verticales ---------- */
  // o: {values, labels, height, color|colorFn, fmtVal, fmtY, mean, labelEvery, tips}
  function bars(o) {
    var vals = o.values, n = vals.length;
    var mx = Math.max.apply(null, vals.concat([0])), mn = Math.min.apply(null, vals.concat([0]));
    var f = frame({ min: mn, max: mx, height: o.height || 200, fmtY: o.fmtY, nTicks: o.nTicks });
    var bw = (f.x1 - f.x0) / n, gap = Math.min(3, bw * 0.18), w = Math.max(1, bw - gap);
    var s = f.grid, every = o.labelEvery || Math.ceil(n / 10), zero = f.Y(0);
    for (var i = 0; i < n; i++) {
      var x = f.x0 + i * bw + gap / 2, y = f.Y(vals[i]), hh = Math.abs(y - zero);
      var c = o.colorFn ? o.colorFn(vals[i], i) : (o.color || 'var(--pico-primary)');
      s += "<rect x='" + x.toFixed(1) + "' y='" + Math.min(y, zero).toFixed(1) + "' width='" + w.toFixed(1) +
        "' height='" + Math.max(hh, 0.8).toFixed(1) + "' rx='1.5' fill='" + c + "'>" +
        "<title>" + esc((o.labels && o.labels[i]) || '') + (o.tips && o.tips[i] ? ' · ' + o.tips[i] : ' · ' + (o.fmtVal ? o.fmtVal(vals[i]) : F.num(vals[i], 1))) + "</title></rect>";
      if (o.labels && i % every === 0)
        s += "<text x='" + (x + w / 2).toFixed(1) + "' y='" + (f.y0 + 13) + "' text-anchor='middle'>" + esc(o.labels[i]) + "</text>";
    }
    if (o.mean != null) {
      var ym = f.Y(o.mean);
      s += "<line class='m' x1='" + f.x0 + "' x2='" + f.x1 + "' y1='" + ym.toFixed(1) + "' y2='" + ym.toFixed(1) + "'/>" +
        "<text x='" + (f.x1 - 2) + "' y='" + (ym - 4).toFixed(1) + "' text-anchor='end'>" + esc(o.meanLabel || ('media ' + F.num(o.mean, 1))) + "</text>";
    }
    return fig(svg(f.H, s, o.label), o.caption);
  }

  /* ---------- barras apiladas ---------- */
  // o: {labels, series:[{name,color,values}], height, fmtY}
  function stacked(o) {
    var n = o.labels.length, tot = [];
    for (var i = 0; i < n; i++) { var t = 0; for (var j = 0; j < o.series.length; j++) t += o.series[j].values[i] || 0; tot.push(t); }
    var f = frame({ min: 0, max: Math.max.apply(null, tot.concat([1])), height: o.height || 210, fmtY: o.fmtY });
    var bw = (f.x1 - f.x0) / n, gap = Math.min(4, bw * 0.2), w = Math.max(1, bw - gap);
    var s = f.grid, every = o.labelEvery || Math.ceil(n / 12);
    for (i = 0; i < n; i++) {
      var acc = 0, x = f.x0 + i * bw + gap / 2;
      for (j = 0; j < o.series.length; j++) {
        var v = o.series[j].values[i] || 0; if (v <= 0) continue;
        var yT = f.Y(acc + v), yB = f.Y(acc);
        s += "<rect x='" + x.toFixed(1) + "' y='" + yT.toFixed(1) + "' width='" + w.toFixed(1) +
          "' height='" + Math.max(yB - yT, 0.6).toFixed(1) + "' fill='" + o.series[j].color + "'>" +
          "<title>" + esc(o.labels[i] + ' · ' + o.series[j].name + ': ' + F.num(v, 1)) + "</title></rect>";
        acc += v;
      }
      if (i % every === 0)
        s += "<text x='" + (x + w / 2).toFixed(1) + "' y='" + (f.y0 + 13) + "' text-anchor='middle'>" + esc(o.labels[i]) + "</text>";
    }
    return fig(svg(f.H, s, o.label), o.caption);
  }

  /* ---------- líneas / áreas ---------- */
  // o: {labels, series:[{name,color,values,dash,area,width}], bands:[{from,to,color}], height, fmtY, fmtVal, forceMin, forceMax, hline}
  function lines(o) {
    var all = [];
    o.series.forEach(function (s) { s.values.forEach(function (v) { if (v != null && isFinite(v)) all.push(v); }); });
    if (o.bands) o.bands.forEach(function (b) { all.push(b.from, b.to); });
    if (o.hline) o.hline.forEach(function (l) { all.push(l.v); });
    var f = frame({
      min: Math.min.apply(null, all), max: Math.max.apply(null, all), height: o.height || 210,
      fmtY: o.fmtY, forceMin: o.forceMin, forceMax: o.forceMax, nTicks: o.nTicks, padR: o.padR
    });
    var n = o.labels.length, X = function (i) { return n > 1 ? f.x0 + i * (f.x1 - f.x0) / (n - 1) : (f.x0 + f.x1) / 2; };
    var s = '';
    (o.bands || []).forEach(function (b) {
      var yT = f.Y(Math.min(b.to, f.hi)), yB = f.Y(Math.max(b.from, f.lo));
      s += "<rect x='" + f.x0 + "' y='" + yT.toFixed(1) + "' width='" + (f.x1 - f.x0) + "' height='" + Math.max(yB - yT, 0).toFixed(1) +
        "' fill='" + b.color + "' opacity='" + (b.opacity || .13) + "'/>";
      if (b.label) s += "<text x='" + (f.x0 + 4) + "' y='" + (yT + 10).toFixed(1) + "'>" + esc(b.label) + "</text>";
    });
    s += f.grid;
    (o.hline || []).forEach(function (l) {
      var y = f.Y(l.v);
      s += "<line x1='" + f.x0 + "' x2='" + f.x1 + "' y1='" + y.toFixed(1) + "' y2='" + y.toFixed(1) +
        "' stroke='" + (l.color || 'var(--pico-muted-color)') + "' stroke-width='1.2' stroke-dasharray='4 3'/>";
      if (l.label) s += "<text x='" + (f.x1 - 2) + "' y='" + (y - 4).toFixed(1) + "' text-anchor='end'>" + esc(l.label) + "</text>";
    });
    o.series.forEach(function (se) {
      var pts = [], segs = [], cur = [];
      for (var i = 0; i < se.values.length; i++) {
        var v = se.values[i];
        if (v == null || !isFinite(v)) { if (cur.length) { segs.push(cur); cur = []; } continue; }
        cur.push([X(i), f.Y(v)]);
      }
      if (cur.length) segs.push(cur);
      segs.forEach(function (sg) {
        var dstr = sg.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ');
        if (se.area && sg.length > 1) {
          s += "<polygon points='" + sg[0][0].toFixed(1) + ',' + f.y0 + ' ' + dstr + ' ' + sg[sg.length - 1][0].toFixed(1) + ',' + f.y0 +
            "' fill='" + se.color + "' opacity='.16'/>";
        }
        if (sg.length === 1) {
          s += "<circle cx='" + sg[0][0].toFixed(1) + "' cy='" + sg[0][1].toFixed(1) + "' r='2.4' fill='" + se.color + "'/>";
        } else {
          s += "<polyline points='" + dstr + "' fill='none' stroke='" + se.color + "' stroke-width='" + (se.width || 2) +
            "' stroke-linejoin='round' stroke-linecap='round'" + (se.dash ? " stroke-dasharray='" + se.dash + "'" : '') + "/>";
        }
      });
      if (se.dots) se.values.forEach(function (v, i) {
        if (v == null || !isFinite(v)) return;
        s += "<circle cx='" + X(i).toFixed(1) + "' cy='" + f.Y(v).toFixed(1) + "' r='2.6' fill='" + se.color + "'>" +
          "<title>" + esc(o.labels[i] + ' · ' + se.name + ': ' + (o.fmtVal ? o.fmtVal(v) : F.num(v, 2))) + "</title></circle>";
      });
    });
    // etiquetas eje X
    var every = o.labelEvery || Math.max(1, Math.ceil(n / 8));
    for (var i2 = 0; i2 < n; i2++) {
      if (i2 % every && i2 !== n - 1) continue;
      s += "<text x='" + X(i2).toFixed(1) + "' y='" + (f.y0 + 14) + "' text-anchor='middle'>" + esc(o.labels[i2]) + "</text>";
    }
    return fig(svg(f.H, s, o.label), o.caption);
  }

  /* ---------- dispersión ---------- */
  // o: {points:[{x,y,r,color,tip}], xLabel, yLabel, fmtX, fmtY, trend:bool}
  function scatter(o) {
    var xs = o.points.map(function (p) { return p.x; }), ys = o.points.map(function (p) { return p.y; });
    var fy = frame({ min: Math.min.apply(null, ys), max: Math.max.apply(null, ys), height: o.height || 220, fmtY: o.fmtY, padL: 40 });
    var xt = niceTicks(Math.min.apply(null, xs), Math.max.apply(null, xs), 5);
    var xlo = xt[0], xhi = xt[xt.length - 1];
    var X = function (v) { return fy.x0 + (v - xlo) / (xhi - xlo || 1) * (fy.x1 - fy.x0); };
    var s = fy.grid;
    xt.forEach(function (t) {
      s += "<text x='" + X(t).toFixed(1) + "' y='" + (fy.y0 + 14) + "' text-anchor='middle'>" + esc(o.fmtX ? o.fmtX(t) : F.num(t, 0)) + "</text>";
    });
    if (o.trend) {
      var r = App.stat.linreg(xs, ys);
      s += "<line x1='" + X(xlo).toFixed(1) + "' y1='" + fy.Y(r.m * xlo + r.b).toFixed(1) +
        "' x2='" + X(xhi).toFixed(1) + "' y2='" + fy.Y(r.m * xhi + r.b).toFixed(1) +
        "' stroke='var(--pico-muted-color)' stroke-width='1.4' stroke-dasharray='5 3'/>";
    }
    o.points.forEach(function (p) {
      s += "<circle cx='" + X(p.x).toFixed(1) + "' cy='" + fy.Y(p.y).toFixed(1) + "' r='" + (p.r || 3) +
        "' fill='" + (p.color || 'var(--pico-primary)') + "' opacity='.75'>" +
        (p.tip ? "<title>" + esc(p.tip) + "</title>" : '') + "</circle>";
    });
    if (o.xLabel) s += "<text x='" + ((fy.x0 + fy.x1) / 2) + "' y='" + (fy.H - 2) + "' text-anchor='middle'>" + esc(o.xLabel) + "</text>";
    return fig(svg(fy.H, s, o.label), o.caption);
  }

  /* ---------- leyenda ---------- */
  function legend(items) {
    return "<div class='leg'>" + items.map(function (it) {
      return "<span><b style='background:" + it.color + "'></b>" + esc(it.name) + "</span>";
    }).join('') + "</div>";
  }

  /* ---------- barras horizontales (HTML, no SVG) ---------- */
  function hbars(rows, opts) {
    opts = opts || {};
    var mx = opts.max || Math.max.apply(null, rows.map(function (r) { return r.v; }).concat([1]));
    return "<div class='hbar'>" + rows.map(function (r) {
      return "<span class='t'>" + esc(r.label) + "</span>" +
        "<span class='r'><i style='width:" + (100 * r.v / mx).toFixed(1) + "%;background:" + (r.color || 'var(--pico-primary)') + "'></i></span>" +
        "<span class='v'>" + (r.text != null ? esc(r.text) : F.num(r.v, 1)) + "</span>";
    }).join('') + "</div>";
  }

  /* ---------- medidor semáforo ---------- */
  // zones: [{to, color, label}] ordenadas; value: número; max: tope de la escala
  function gauge(value, zones, max, fmt) {
    var prev = 0, track = '', ticks = '';
    zones.forEach(function (z) {
      var w = (Math.min(z.to, max) - prev) / max * 100;
      if (w > 0) track += "<i style='width:" + w.toFixed(2) + "%;background:" + z.color + ";opacity:.55'></i>";
      if (z.to < max) ticks += "<span style='left:" + (z.to / max * 100).toFixed(2) + "%'>" + esc(F.num(z.to, 1)) + "</span>";
      prev = z.to;
    });
    var p = App.stat.clamp(value / max, 0, 1) * 100;
    return "<div class='gauge'><div class='track'>" + track + "</div>" +
      "<div class='ticks'>" + ticks + "</div>" +
      "<div class='pin' style='left:" + p.toFixed(2) + "%' data-v='" + esc(fmt ? fmt(value) : F.num(value, 2)) + "'></div></div>";
  }

  App.chart = { bars: bars, stacked: stacked, lines: lines, scatter: scatter, legend: legend, hbars: hbars, gauge: gauge, fig: fig, svg: svg, niceTicks: niceTicks };
})(this);
