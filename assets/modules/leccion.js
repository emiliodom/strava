/* leccion.js — Módulo 25 (página «Guía de resistencia»): «Tu 2026 y pronósticos». Todo lo numérico se calcula en vivo con
   D.limpias (volumen por mes, intensidad por FC media, trotes fáciles, carreras, racha) y los pronósticos usan reglas
   explícitas (proyección lineal, Riegel con exponente 1,06–1,08, rangos de velocidad por terreno). */
(function (global) {
  'use strict';
  var App = global.App, U = App.ui, F = App.fmt, C = App.chart, esc = App.esc;
  var MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  var RE_EVENTO = /2026|carrera|challenge|traves[ií]a|race|reto|tour |5k|10k|bicimarat|telet[oó]n|guatem[aá]gica|campanabaj|senderos/i;
  function c() { return App.guiaRefs ? App.guiaRefs.cita.apply(null, arguments) : ''; }
  function bici(a) { return a.grupo === 'ruta' || a.grupo === 'mtb'; }
  function sum(xs, f) { return xs.reduce(function (s, x) { return s + f(x); }, 0); }
  function hm(min) { var h = Math.floor(min / 60), m = Math.round(min % 60); if (m === 60) { h++; m = 0; } return h + ' h ' + (m < 10 ? '0' : '') + m; }
  function ritmo(spk) { var m = Math.floor(spk / 60), s = Math.round(spk % 60); if (s === 60) { m++; s = 0; } return m + ':' + (s < 10 ? '0' : '') + s; }

  function datos(D) {
    var A = D.limpias.filter(function (a) { return a.fechaISO >= '2026-01-01'; });
    var ult = A.length ? A[A.length - 1].fechaISO : '2026-01-01';
    var meses = {};
    A.forEach(function (a) {
      var k = a.fechaISO.slice(0, 7), o = meses[k] || (meses[k] = { bh: 0, bkm: 0, el: 0, rkm: 0, fz: 0, fac: [] });
      if (bici(a)) { o.bh += a.min / 60; o.bkm += a.km; o.el += a.elev; }
      if (a.grupo === 'running') { o.rkm += a.km; if (a.hr && a.km >= 2 && a.hr < 140 && a.min * 60 / a.km < 510) o.fac.push(a); }
      if (a.grupo === 'fuerza') o.fz++;
    });
    var bh = A.filter(function (a) { return bici(a) && a.hr && a.min >= 30; });
    var banda = function (xs) {
      var r = { a: 0, b: 0, c: 0 };
      xs.forEach(function (a) { var h = a.min / 60; if (a.hr < 135) r.a += h; else if (a.hr < 150) r.b += h; else r.c += h; });
      return r;
    };
    var runs = A.filter(function (a) { return a.grupo === 'running'; });
    var diasRun = {}; runs.forEach(function (a) { diasRun[a.fechaISO] = 1; });
    var racha = null;
    for (var i = runs.length - 1; i >= 0; i--) {
      var m = /Day (\d+)\/365/i.exec(runs[i].nombre);
      if (m) { racha = { n: +m[1], f: runs[i].fechaISO }; break; }
    }
    // Eventos desde los registros originales: la unión de tramos de bici de metrics.js mezcla calentamiento y carrera.
    var raw = App.data && App.data.raw, fuera = {};
    ((raw && raw.estadisticas && raw.estadisticas.anomalias_datos) || []).forEach(function (x) { fuera[String(x.id)] = 1; });
    var GR = { Ride: 'ruta', GravelRide: 'ruta', MountainBikeRide: 'mtb', Run: 'running', TrailRun: 'running' };
    var eventos = ((raw && raw.actividades) || []).filter(function (r) {
      var g = GR[r.sport_type], n = r.name || '';
      if (!g || fuera[String(r.id)] || (r.moving_time || 0) < 18 * 60 || String(r.start_local) < '2026') return false;
      if (/^entreno|train\b|entrenamiento/i.test(n)) return false;
      if (g === 'running') return /5k|10k|15k|21k|carrera|challenge|etapa|race/i.test(n);
      return RE_EVENTO.test(n);
    }).map(function (r) {
      return { fechaISO: String(r.start_local).slice(0, 10), nombre: r.name, grupo: GR[r.sport_type], km: r.distance / 1000, elev: r.elevation_gain || 0,
        min: r.moving_time / 60, hr: r.avg_hr || null, re: r.relative_effort || null };
    }).sort(function (x, y) { return x.fechaISO < y.fechaISO ? -1 : 1; });
    return { A: A, ult: ult, meses: meses, bandaBici: banda(bh), bandaRun: banda(runs.filter(function (a) { return a.hr && a.km >= 1.5; })), runs: runs, diasRun: diasRun, racha: racha, eventos: eventos };
  }

  function kpis(X) {
    var B = X.A.filter(bici), R = X.runs, Fz = X.A.filter(function (a) { return a.grupo === 'fuerza'; });
    var d0 = Date.UTC(2026, 0, 1), d1 = Date.parse(X.ult + 'T00:00:00Z'), nd = Math.round((d1 - d0) / 864e5) + 1;
    return U.kpis([
      U.kpi('Bici', F.num(sum(B, function (a) { return a.min; }) / 60, 0) + ' h', F.num(sum(B, function (a) { return a.km; }), 0) + ' km · ' + F.num(sum(B, function (a) { return a.elev; }), 0) + ' m de desnivel'),
      U.kpi('A pie', F.num(sum(R, function (a) { return a.km; }), 0) + ' km', R.length + ' salidas · ' + Object.keys(X.diasRun).length + ' de ' + nd + ' días con trote'),
      U.kpi('Fuerza', String(Fz.length), 'sesiones registradas en Strava'),
      U.kpi('Eventos', String(X.eventos.length), 'carreras, travesías y retos detectados por nombre')
    ]);
  }

  function graficas(X) {
    var ks = Object.keys(X.meses).sort(), lab = ks.map(function (k) { return MES[+k.slice(5, 7) - 1]; });
    return C.bars({ values: ks.map(function (k) { return X.meses[k].bh; }), labels: lab, labelEvery: 1, color: 'var(--z1)', height: 170, fmtVal: function (v) { return F.num(v, 1) + ' h'; },
      label: 'Horas de bici por mes en 2026', caption: 'Horas de bici por mes (ruta + MTB). Noviembre está incompleto.' }) +
      C.bars({ values: ks.map(function (k) { return X.meses[k].rkm; }), labels: lab, labelEvery: 1, color: 'var(--accent)', height: 170, fmtVal: function (v) { return F.num(v, 0) + ' km'; },
        label: 'Kilómetros a pie por mes en 2026', caption: 'Kilómetros a pie por mes (racha incluida).' });
  }

  function intensidad(X) {
    var b = X.bandaBici, r = X.bandaRun, tb = b.a + b.b + b.c || 1, tr = r.a + r.b + r.c || 1;
    var fila = function (lbl, v, t, col) { return { label: lbl, v: v, text: F.num(v, 0) + ' h · ' + F.num(100 * v / t, 0) + ' %', color: col }; };
    return '<h4>Bici (salidas de 30 min o más con banda)</h4>' +
      C.hbars([fila('FC media < 135', b.a, tb, 'var(--z1)'), fila('135–149', b.b, tb, 'var(--z3)'), fila('150 o más', b.c, tb, 'var(--z5)')]) +
      '<h4>A pie (con banda)</h4>' +
      C.hbars([fila('FC media < 135', r.a, tr, 'var(--z1)'), fila('135–149', r.b, tr, 'var(--z3)'), fila('150 o más', r.c, tr, 'var(--z5)')]) +
      U.note('Cómo leerlo', 'La FC media de una salida esconde los picos: una MTB a FC 143 de media con máximos de 193 tiene minutos muy duros y minutos suaves. Aun así, el patrón es claro: <b>a pie entrenas sobre todo fácil; en bici casi todo cae en la zona media</b>, con muy pocas salidas fáciles de verdad. Lo ideal sería ver mucha más barra verde en la bici' + c('seiler', 'stoggl') + '.', 'warn');
  }

  function trotes(X) {
    var meses = Object.keys(X.meses).sort().filter(function (k) { return X.meses[k].fac.length >= 3; }).map(function (k) {
      var f = X.meses[k].fac, hr = sum(f, function (a) { return a.hr; }) / f.length, sp = sum(f, function (a) { return a.min * 60; }) / sum(f, function (a) { return a.km; });
      return { k: k, n: f.length, hr: hr, sp: sp, mpl: 60000 / sp / hr };
    });
    if (!meses.length) return '';
    var mejor = meses.slice().sort(function (x, y) { return y.mpl - x.mpl; })[0], ult = meses[meses.length - 1];
    var filas = meses.map(function (m) {
      var t = F.num(m.mpl, 2);
      return [MES[+m.k.slice(5, 7) - 1], F.num(m.n, 0), F.num(m.hr, 0), ritmo(m.sp) + '/km', m === mejor ? '<b>' + t + '</b>' : t];
    });
    return "<div class='t'>" + U.tabla([{ t: 'Mes' }, { t: 'Trotes', n: true }, { t: 'FC media', n: true }, { t: 'Ritmo', n: true }, { t: 'm por latido', n: true }], filas,
      { pie: 'Trotes de 2 km o más con FC media por debajo de 140 y ritmo más rápido que 8:30/km. «m por latido» = metros que avanzas por cada pulsación: más alto es mejor. Tu mejor mes fue ' + MES[+mejor.k.slice(5, 7) - 1] + ' (' + F.num(mejor.mpl, 2) + '); el último, ' + MES[+ult.k.slice(5, 7) - 1] + ', va en ' + F.num(ult.mpl, 2) + (ult.mpl < mejor.mpl - 0.02 ? ': el bloque de bici de noviembre todavía pesa.' : ': estás en tu mejor nivel.') }) + '</div>';
  }

  function eventos(X) {
    var filas = X.eventos.slice().reverse().map(function (a) {
      var v = a.km / (a.min / 60);
      return [F.fecha(a.fechaISO), "<span class='wrap'>" + esc(a.nombre.replace(/\s*-?\s*Day \d+\/365.*$/i, '')) + '</span>', esc(a.grupo === 'running' ? 'A pie' : a.grupo === 'mtb' ? 'MTB' : 'Ruta'),
        F.num(a.km, 1), F.num(a.elev, 0), a.grupo === 'running' ? ritmo(a.min * 60 / a.km) + '/km' : F.num(v, 1) + ' km/h', a.hr ? F.num(a.hr, 0) : '—', a.re ? F.num(a.re / (a.min / 60), 0) : '—'];
    });
    return "<div class='t'>" + U.tabla([{ t: 'Fecha' }, { t: 'Evento' }, { t: 'Tipo' }, { t: 'km', n: true }, { t: 'D+', n: true }, { t: 'Ritmo', n: true }, { t: 'FC', n: true }, { t: 'Esfuerzo/h', n: true }], filas,
      { pie: 'Detectados por el nombre de la actividad. Esfuerzo/h = esfuerzo relativo de Strava por hora en movimiento: cuanto más alto, más intenso fue.' }) + '</div>';
  }

  function pronosticos(X) {
    var hoy = Date.parse(X.ult + 'T00:00:00Z'), fin = Date.UTC(2026, 11, 31), resta = Math.max(0, Math.round((fin - hoy) / 864e5));
    var desde = new Date(hoy - 55 * 864e5).toISOString().slice(0, 10), ult56 = X.A.filter(function (a) { return a.fechaISO >= desde; });
    var bhD = sum(ult56.filter(bici), function (a) { return a.min; }) / 60 / 56, rkD = sum(ult56.filter(function (a) { return a.grupo === 'running'; }), function (a) { return a.km; }) / 56;
    var bhT = sum(X.A.filter(bici), function (a) { return a.min; }) / 60, rkT = sum(X.runs, function (a) { return a.km; });
    var filas = [];
    filas.push(['<b>Fin de 2026</b>', "<span class='wrap'>Bici " + F.num(bhT + bhD * resta * 0.6, 0) + '–' + F.num(bhT + bhD * resta, 0) + ' h · a pie ' + F.num(rkT + rkD * resta * 0.9, 0) + '–' + F.num(rkT + rkD * resta * 1.1, 0) + ' km</span>',
      "<span class='wrap'>Ritmo de las últimas 8 semanas (" + F.num(bhD * 7, 1) + ' h de bici y ' + F.num(rkD * 7, 0) + ' km a pie por semana). El tramo bajo cuenta con menos bici en Charlotte.</span>']);
    if (X.racha) {
      var f365 = new Date(Date.parse(X.racha.f + 'T00:00:00Z') + (365 - X.racha.n) * 864e5).toISOString().slice(0, 10);
      filas.push(['<b>Racha #365</b>', 'Día 365 el <b>' + F.fecha(f365) + ' ' + f365.slice(0, 4) + '</b>', "<span class='wrap'>Último registro: día " + X.racha.n + ' el ' + F.fecha(X.racha.f) + '. Cae en Charlotte: planea la milla de ese día.</span>']);
    }
    var base = X.runs.filter(function (a) { return a.km >= 8 && a.km <= 16 && a.fechaISO >= '2026-07-01' && a.min * 60 / a.km < 450; })
      .map(function (a) { return { a: a, t15: function (e) { return a.min * Math.pow(15 / a.km, e); } }; })
      .sort(function (x, y) { return x.t15(1.06) - y.t15(1.06); });
    if (base.length) {
      var b0 = base[0], lo = b0.t15(1.06), hi = b0.t15(1.08);
      filas.push(['<b>Guatemágica 15K</b>', '<b>' + hm(lo) + '–' + hm(hi) + '</b> (' + ritmo(lo * 4) + '–' + ritmo(hi * 4) + '/km)',
        "<span class='wrap'>Fórmula de Riegel (exponente 1,06–1,08)" + c('riegel') + ' desde tu mejor carrera de 8–16 km desde julio: ' + F.num(b0.a.km, 1) + ' km a ' + ritmo(b0.a.min * 60 / b0.a.km) + '/km el ' + F.fecha(b0.a.fechaISO) + '. Bajar de 1 h 30 (6:00/km) pide un día perfecto; la tirada más larga reciente es corta y vienes de Entre Senderos.</span>']);
    }
    filas.push(['<b>Xab Sibaná</b>', '<b>1 h 55–2 h 15</b> en movimiento', "<span class='wrap'>25 km y 700 m (28 m/km) a 11–13 km/h, como Campanabaj (12,3 km/h, 31 m/km) y la Travesía entre Fincas (12,2, 28 m/km), 13 h después del 15K y en Z2.</span>"]);
    filas.push(['<b>Candelaria, 23 ene</b>', '<b>19–20,5 km/h</b>', "<span class='wrap'>Fresco en temporada seca promedias 19,6 km/h (página Ruta). Siete semanas en Charlotte con 2 sesiones de intensidad por semana mantienen casi toda la forma aeróbica; sin ellas, el VO₂máx empieza a caer en 2–4 semanas" + c('mujikaPadilla') + '. Clave: 9 días tranquilos antes de la prueba.</span>']);
    return "<div class='t'>" + U.tabla([{ t: 'Qué' }, { t: 'Pronóstico' }, { t: 'De dónde sale' }], filas) + '</div>' +
      U.note('Honestidad', 'Son estimaciones con reglas sencillas, no predicciones exactas: el calor, el sueño, el terreno y cómo comas el día de la prueba mueven más que cualquier fórmula.', '');
  }

  function render(D) {
    if (!D || !D.limpias) return '';
    var X = datos(D);
    return U.modhead('25', 'Tu 2026: lecciones y pronósticos', 'Lo que dicen tus datos de este año, calculado en vivo, y lo que es razonable esperar en las próximas carreras y al cerrar el año.') +
      kpis(X) +
      U.coach('Siete lecciones del año', '<ol>' +
        '<li><b>La constancia es tu superpoder.</b> Casi no hay día sin trote y la bici nunca baja de ~15 h al mes. Esa base es la que hizo posible el salto de noviembre.</li>' +
        '<li><b>El volumen funcionó.</b> Entre Senderos frente a la Travesía entre Fincas: misma FC 158, 41 % más distancia, 14 % más velocidad y 36 min más. Eso es durabilidad' + c('maunder') + '.</li>' +
        '<li><b>En bici te falta el «fácil».</b> Casi todas tus horas con banda caen en FC media de 135–149. Más salidas a FC < 135 dejarían frescura para que lo duro sea más duro' + c('seiler') + '.</li>' +
        '<li><b>Compites mucho.</b> Unos dos eventos al mes, y en noviembre cuatro en 15 días. Cada uno cuesta 3–4 días entre víspera y recuperación; elige 4–6 carreras A al año y el resto como entreno.</li>' +
        '<li><b>A pie, el corazón va por delante del pie.</b> Tus trotes fáciles volvieron a FC 125–128, pero la tirada más larga reciente es corta y en octubre hubo un golpe. Sube los kilómetros despacio' + c('lauersen') + '.</li>' +
        '<li><b>La fuerza llegó tarde.</b> Casi toda está en octubre y noviembre. Mantenerla todo el año (incluso sin pesas en Charlotte) es la mejora más barata que te queda' + c('ronnestadMujika') + '.</li>' +
        '<li><b>Comer es entrenar.</b> El déficit siguió en pleno bloque fuerte y en Entre Senderos comiste poco: dos decisiones que cuestan rendimiento' + c('mountjoy', 'jeukendrup') + '.</li></ol>') +
      U.acc('Volumen por mes', graficas(X), true) +
      U.acc('¿Polarizado o gris? Tu intensidad', intensidad(X)) +
      U.acc('Trotes fáciles: pulso y ritmo por mes', trotes(X)) +
      U.acc('Eventos del año (' + X.eventos.length + ')', eventos(X)) +
      U.acc('Pronósticos', pronosticos(X), true);
  }

  App.mods.push({ id: 'leccion', nom: 'Tu 2026', tab: 'Tu 2026', icono: 'M4 20V10M10 20V4M16 20v-8M22 20H2', render: render });
})(this);
