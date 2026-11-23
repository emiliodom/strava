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

  // «El año en gráficas»: horas por deporte, km a pie por semana, tirada más larga por mes y la brecha de resistencia.
  function lunes(iso) { var d = new Date(iso + 'T00:00:00Z'); return new Date(d - ((d.getUTCDay() + 6) % 7) * 864e5).toISOString().slice(0, 10); }
  function pace(v) { var m = Math.floor(v), s = Math.round((v - m) * 60); if (s === 60) { m++; s = 0; } return m + ':' + (s < 10 ? '0' : '') + s; }
  function exponente(X) {
    var g15 = X.runs.filter(function (a) { return a.fechaISO === '2026-11-21' && a.km >= 14; })[0];
    var k5 = X.runs.filter(function (a) { return a.fechaISO === '2026-11-20' && a.km >= 4.9 && a.km < 5.2; })[0];
    return g15 && k5 ? { e: Math.log(g15.min / k5.min) / Math.log(g15.km / k5.km), k5: k5, g15: g15 } : null;
  }
  function graficasAno(X) {
    var ks = Object.keys(X.meses).sort(), lab = ks.map(function (k) { return MES[+k.slice(5, 7) - 1]; });
    var hM = function (g) { return ks.map(function (k) { return sum(X.A.filter(function (a) { return a.grupo === g && a.fechaISO.slice(0, 7) === k; }), function (a) { return a.min / 60; }); }); };
    var out = C.legend([{ name: 'Ruta', color: 'var(--z1)' }, { name: 'MTB', color: 'var(--z2)' }, { name: 'A pie', color: 'var(--accent)' }]) +
      C.stacked({ labels: lab, labelEvery: 1, height: 200, fmtY: function (v) { return F.num(v, 0) + ' h'; }, label: 'Horas por mes y deporte en 2026',
        series: [{ name: 'Ruta', color: 'var(--z1)', values: hM('ruta') }, { name: 'MTB', color: 'var(--z2)', values: hM('mtb') }, { name: 'A pie', color: 'var(--accent)', values: hM('running') }],
        caption: 'Horas en movimiento por mes. La bici es casi todo tu volumen: el motor aeróbico se construyó pedaleando.' });
    // km a pie por semana
    var sem = {}; X.runs.forEach(function (a) { var k = lunes(a.fechaISO); sem[k] = (sem[k] || 0) + a.km; });
    var sk = Object.keys(sem).sort(), sv = sk.map(function (k) { return sem[k]; }), media = sum(sv, function (v) { return v; }) / (sv.length || 1);
    var maxI = sv.indexOf(Math.max.apply(null, sv));
    out += C.bars({ values: sv, labels: sk.map(function (k) { return F.fecha(k); }), labelEvery: 6, height: 170, mean: media, meanLabel: 'media ' + F.num(media, 0) + ' km',
      color: 'var(--accent)', fmtVal: function (v) { return F.num(v, 1) + ' km'; }, label: 'Kilómetros a pie por semana en 2026',
      caption: 'Km a pie por semana (racha incluida). La más alta: ' + F.num(sv[maxI], 0) + ' km la semana del ' + F.fecha(sk[maxI]) + '. Para un medio maratón hacen falta semanas de 30–40 km sostenidas; para un ultra, de 50 o más.' });
    // tirada más larga por mes
    var lg = ks.map(function (k) { return Math.max.apply(null, X.runs.filter(function (a) { return a.fechaISO.slice(0, 7) === k; }).map(function (a) { return a.km; }).concat([0])); });
    out += C.lines({ labels: lab, height: 190, forceMin: 0, fmtY: function (v) { return F.num(v, 0) + ' km'; }, fmtVal: function (v) { return F.num(v, 1) + ' km'; }, label: 'Salida a pie más larga de cada mes',
      series: [{ name: 'Más larga', color: 'var(--accent)', values: lg, dots: true }],
      hline: [{ v: 21.1, label: 'medio maratón 21,1 km', color: 'var(--z5)' }, { v: 15, label: '15 km' }],
      caption: 'La salida a pie más larga de cada mes. Septiembre es la etapa de trail del Challenge Cobán (20 km en más de 5 h). Ningún mes ha pasado de 21 km todavía.' });
    // brecha de resistencia: ritmo previsto por distancia
    var E = exponente(X);
    if (E) {
      var dist = [5, 10, 15, 21.0975, 42.195], dl = ['5K', '10K', '15K', '21K', '42K'];
      var base = E.k5.min / E.k5.km, prev = function (e) { return dist.map(function (d) { return base * Math.pow(d / E.k5.km, e - 1); }); };
      var real = dist.map(function (d) { return d === 5 ? base : d === 15 ? E.g15.min / E.g15.km : null; });
      out += C.legend([{ name: 'Si tuvieras resistencia de corredor entrenado (1,06)', color: 'var(--z2)' }, { name: 'Con tu resistencia de hoy (' + F.num(E.e, 2) + ')', color: 'var(--z5)' }, { name: 'Tus carreras de noviembre', color: 'var(--ink)' }]) +
        C.lines({ labels: dl, height: 200, fmtY: pace, fmtVal: function (v) { return pace(v) + '/km'; }, label: 'Ritmo previsto por distancia: la brecha de resistencia',
          series: [{ name: 'Entrenado', color: 'var(--z2)', values: prev(1.06), dots: true }, { name: 'Hoy', color: 'var(--z5)', values: prev(E.e), dots: true, dash: '5 3' }, { name: 'Real', color: 'var(--ink)', values: real, dots: true, width: 0.1 }],
          caption: 'Ritmo por km (más arriba = más lento) según la fórmula de Riegel desde tu 5K de 23:56. La línea verde es lo que tu velocidad permitiría con resistencia; la roja, lo que sale con la de hoy: en el maratón la diferencia pasa de ' + pace(prev(E.e)[4] - prev(1.06)[4]) + ' min por km. Cerrar esa brecha es entrenar resistencia, no velocidad.' });
    }
    return out;
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
    // Desde el 21 nov la Guatemágica y Sibaná son resultados; el pronóstico nuevo es el medio maratón.
    var g15 = X.runs.filter(function (a) { return a.fechaISO === '2026-11-21' && a.km >= 14; })[0];
    var k5 = X.runs.filter(function (a) { return a.fechaISO === '2026-11-20' && a.km >= 4.9 && a.km < 5.2; })[0];
    if (g15) {
      var eR = k5 ? Math.log(g15.min / k5.min) / Math.log(g15.km / k5.km) : null;
      filas.push(['<b>Guatemágica 15K</b>', '<b>' + hm(g15.min) + '</b> (' + ritmo(g15.min * 60 / g15.km) + '/km) · hecha',
        "<span class='wrap'>Pronóstico 1 h 21–1 h 25 si aguantabas la distancia; salió más lenta con 31,7 km de MTB y sprints esa mañana, la parada al baño del km 11 y el pie derecho desde el km 10. Aun así, tu mejor 15K: 6:02/km frente a 6:36 el 23 ago." +
        (eR ? ' Del 5K al 15K tu exponente de Riegel fue ' + F.num(eR, 2) + ' (lo habitual en corredores entrenados es 1,06–1,08)' + c('riegel') + ': la velocidad está, la resistencia a pie es lo que falta.' : '') + '</span>']);
      var lo21 = g15.min * Math.pow(21.0975 / g15.km, 1.06), hi21 = g15.min * Math.pow(21.0975 / g15.km, 1.10);
      filas.push(['<b>Medio maratón (primavera 2027)</b>', '<b>' + hm(lo21) + '–' + hm(hi21 + 5) + '</b>',
        "<span class='wrap'>Desde la Guatemágica con Riegel 1,06–1,10, más 5 min de margen. Vale si antes la tirada larga llega a 16–18 km sin dolor (Charlotte la sube a 14–15 km). Si haces el 15K sin el MTB de la mañana y sin parar, el punto de partida baja solo.</span>"]);
    }
    filas.push(['<b>Xab Sibaná</b>', '<b>1 h 50</b> en movimiento · hecha', "<span class='wrap'>Pronóstico 1 h 55–2 h 15 a 11–13 km/h; saliste a 14,1 km/h con 584 m y FC 152, 13 h después del 15K: más rápido que Entre Senderos (13,9 km/h con FC 158). Sin competir, el motor de la bici sigue muy por delante del de correr.</span>"]);
    filas.push(['<b>5K Bomberos, 17 ene</b>', '<b>23:30–24:30</b>', "<span class='wrap'>Desde los 23:56 del 20 nov, con seis semanas de carrera en Charlotte a favor y el calor de Retalhuleu en contra a tres días de volver (se reaclimata en 1–2 semanas). Si la contrarreloj del 7 ene sale por debajo de 23:30, apunta al extremo rápido.</span>"]);
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
        '<li><b>A pie eres más rápido de lo que dice tu volumen.</b> El 5K del 20 nov en 24:00 (4:48/km, VDOT ≈ 40) y los 4,6 km a 4:46 del 4 oct muestran velocidad; lo que falta es resistencia: la tirada más larga reciente es de 6 km y en octubre hubo un golpe. Sube los kilómetros despacio' + c('lauersen') + '. Ojo: el «10K a 6:19» del 16 oct incluía una parada de ~12 min en el km 2.</li>' +
        '<li><b>La fuerza llegó tarde.</b> Casi toda está en octubre y noviembre. Mantenerla todo el año (incluso sin pesas en Charlotte) es la mejora más barata que te queda' + c('ronnestadMujika') + '.</li>' +
        '<li><b>Comer es entrenar.</b> El déficit siguió en pleno bloque fuerte y en Entre Senderos comiste poco: dos decisiones que cuestan rendimiento' + c('mountjoy', 'jeukendrup') + '.</li></ol>') +
      U.coach('Decisiones para 2027 (lo que concluimos)', '<ol>' +
        '<li><b>Bici para el volumen, carrera para la velocidad.</b> A pie ya tienes un 5K de 23:56 (VDOT ≈ 40, umbral ≈ 5:04/km); lo que falta es resistencia. Metas: 10K por debajo de 47 min en 2027 y de 45 en 2028; en bici, conocer tu FTP real y acercarte a 3,3 W/kg en 2–3 años (Guía › Bici o correr).</li>' +
        '<li><b>Fácil de verdad en bici:</b> la mayoría de las salidas por debajo de FC 135 y dos sesiones duras de verdad por semana' + c('seiler') + '.</li>' +
        '<li><b>Medir:</b> referencias de bici en el Greenway (7 dic y 4 ene), 5K contrarreloj (7 ene), Candelaria (23 ene) y FTP de 20 min en subida (30 ene, con la calculadora de la Guía). Repetir cada 6–8 semanas.</li>' +
        '<li><b>Elegir carreras:</b> 4–6 objetivos A al año. Arranque de 2027: 5K por los Bomberos o Travesía San Pablo (17 ene, una de las dos), Tecpanpana (6 feb, objetivo B) y, opcional, la travesía de la Pana Epic (7 feb). Las etapas de la Pana Epic son de élite: no esta temporada.</li>' +
        '<li><b>Charlotte:</b> crecer a pie (tirada larga hasta 11–15 km según el plan), mantener la bici con 3 × 8 min fuertes una vez por semana, fuerza con peso corporal y barra (Guía › Charlotte y › Barra).</li>' +
        '<li><b>Comer y dormir para absorberlo:</b> 60–90 g/h de carbohidrato en salidas largas, sin déficit en los bloques duros y 7–8 h de sueño' + c('jeukendrup', 'mountjoy') + '.</li>' +
        '<li><b>Durabilidad a pie:</b> el 15K del 21 nov fue tu mejor marca, pero del 5K al 15K perdiste mucho más de lo normal y acabaste con los cuádriceps cargados. Una tirada larga por semana que crezca poco a poco, bajadas y sentadilla búlgara para el cuádriceps, y el día de una carrera a pie, la bici sólo suave.</li>' +
        '<li><b>Ultra a pie, paso a paso:</b> Medio Maratón de Cobán (30 may), Challenge Cobán (5 sep; la etapa de trail en 3 h 30–4 h 30, no 7 h 20) y, si pasas las pruebas de «listo», el primer 50K en noviembre (UTG Antigua) u octubre (UTAM). Maratón en 2028 y 100K hacia 2030. Detalle en Guía › Ultra y Metas › Temporada 2027.</li>' +
        '<li><b>Fuerza todo el año:</b> 1–2 sesiones por semana, la barra de dominadas por niveles y la prevención lumbar' + c('ronnestadMujika') + '.</li></ol>') +
      U.acc('El año en gráficas', graficasAno(X), true) +
      U.acc('Volumen por mes', graficas(X)) +
      U.acc('¿Polarizado o gris? Tu intensidad', intensidad(X)) +
      U.acc('Trotes fáciles: pulso y ritmo por mes', trotes(X)) +
      U.acc('Eventos del año (' + X.eventos.length + ')', eventos(X)) +
      U.acc('Pronósticos', pronosticos(X), true);
  }

  App.mods.push({ id: 'leccion', nom: 'Tu 2026', tab: 'Tu 2026', icono: 'M4 20V10M10 20V4M16 20v-8M22 20H2', render: render });
})(this);
