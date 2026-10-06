/* carga.js — Módulo 1: carga, monotonía, ACWR y recuperaciones. */
(function (global) {
  'use strict';
  var App = global.App, U = App.ui, C = App.chart, F = App.fmt, M = App.metrics, h = App.h, raw = App.raw;

  function semaforo(cls) { return cls === 'ok' ? 'var(--ok)' : cls === 'warn' ? 'var(--warn)' : 'var(--bad)'; }

  function render(D) {
    var sem = D.semanas.filter(function (w) { return w.completa; });
    var ult = sem[sem.length - 1] || {};
    var hoy = D.dias[D.dias.length - 1] || {};

    var clsMono = M.clasifMonotonia(ult.monotonia), clsAcwr = M.clasifAcwr(hoy.acwrEwma);

    var kpi = U.kpis([
      U.kpi('ACWR hoy', F.num(hoy.acwrEwma, 2), 'agudo 7 d / crónico 28 d', clsAcwr === 'ok' ? 'ok' : clsAcwr === 'bad' ? 'bad' : ''),
      U.kpi('Monotonía última semana', F.num(ult.monotonia, 2), 'media ÷ desviación diaria', clsMono === 'ok' ? 'ok' : clsMono === 'bad' ? 'bad' : ''),
      U.kpi('Tensión última semana', F.num(ult.tension, 0), 'carga × monotonía'),
      U.kpi('Carga última semana', F.num(ult.carga, 0) + ' UA', F.num(ult.min / 60, 1) + ' h en ' + ult.diasActivos + ' días')
    ]);

    /* ---- medidores ---- */
    var gACWR = C.gauge(hoy.acwrEwma || 0, [
      { to: 0.8, color: 'var(--warn)' }, { to: 1.3, color: 'var(--ok)' },
      { to: 1.5, color: 'var(--warn)' }, { to: 2.0, color: 'var(--bad)' }
    ], 2.0, function (v) { return F.num(v, 2); });
    var gMono = C.gauge(ult.monotonia || 0, [
      { to: 1.5, color: 'var(--ok)' }, { to: 2.0, color: 'var(--warn)' }, { to: 3.5, color: 'var(--bad)' }
    ], 3.5, function (v) { return F.num(v, 2); });

    /* ---- serie ACWR ---- */
    var conA = D.dias.filter(function (d) { return d.acwrEwma != null; });
    var gr1 = C.lines({
      labels: conA.map(function (d) { return F.fecha(d.iso); }),
      series: [
        { name: 'ACWR (EWMA)', color: 'var(--accent)', values: conA.map(function (d) { return d.acwrEwma; }), width: 2 },
        { name: 'ACWR (media móvil)', color: 'var(--pico-muted-color)', values: conA.map(function (d) { return d.acwrRoll; }), dash: '4 3' }
      ],
      bands: [{ from: 0.8, to: 1.3, color: 'var(--ok)' }],
      hline: [{ v: 1.5, color: 'var(--bad)', label: 'riesgo' }],
      height: 230, forceMin: 0, forceMax: 2.2, labelEvery: 30,
      fmtY: function (v) { return F.num(v, 1); },
      label: 'Evolución del ACWR',
      caption: 'Franja verde: la zona de 0,8–1,3 que Gabbett asocia con menos lesiones. Los picos son semanas en las que subiste la carga de golpe.'
    });

    /* ---- monotonía y tensión semanales ---- */
    var gr2 = C.bars({
      values: sem.map(function (w) { return w.monotonia; }),
      labels: sem.map(function (w) { return w.semana.slice(6); }),
      height: 180,
      colorFn: function (v) { return semaforo(M.clasifMonotonia(v)); },
      fmtVal: function (v) { return F.num(v, 2); }, fmtY: function (v) { return F.num(v, 1); },
      label: 'Monotonía semanal',
      caption: 'Monotonía de Foster: carga media diaria ÷ desviación. Por encima de 2,0 es semana plana, todos los días iguales.'
    });

    /* ---- recuperaciones ---- */
    var filasSem = sem.slice(-14).reverse().map(function (w) {
      var cm = M.clasifMonotonia(w.monotonia), ca = M.clasifAcwr(w.acwr);
      return [
        App.esc(w.semana.slice(6)) + ' <small>' + F.fecha(w.inicio) + '</small>',
        F.num(w.carga, 0),
        "<span style='color:" + semaforo(cm) + "'>" + F.num(w.monotonia, 2) + '</span>',
        F.num(w.tension, 0),
        w.acwr == null ? '—' : "<span style='color:" + semaforo(ca) + "'>" + F.num(w.acwr, 2) + '</span>',
        F.num(w.kmRun, 1),
        F.num(w.largoRun, 1),
        w.diasDescanso + ' / ' + w.diasMinimos
      ];
    });
    var tabla = U.tabla(
      [{ t: 'Semana' }, { t: 'Carga', n: true }, { t: 'Monot.', n: true }, { t: 'Tensión', n: true },
       { t: 'ACWR', n: true }, { t: 'km run', n: true }, { t: 'Largo', n: true }, { t: 'Desc./mín.', n: true }],
      filasSem, { pie: 'Últimas 14 semanas completas. «Desc./mín.» = días sin actividad y días de menos de 20 minutos.' }
    );

    /* ---- picos detectados ---- */
    var picos = sem.filter(function (w) { return w.acwr != null && w.acwr > 1.4; })
      .sort(function (a, b) { return b.acwr - a.acwr; }).slice(0, 5);
    var listaPicos = picos.length ? U.tabla(
      [{ t: 'Semana' }, { t: 'ACWR', n: true }, { t: 'Qué pasó' }],
      picos.map(function (w) {
        var dmax = w.dias.slice().sort(function (a, b) { return b.carga - a.carga; })[0];
        return [App.esc(w.semana.slice(6)) + ' <small>' + F.fecha(w.inicio) + '</small>', F.num(w.acwr, 2),
          dmax && dmax.acts.length ? App.esc(dmax.acts[0].nombre) + ' <small>(' + F.fecha(dmax.iso) + ', ' + F.num(dmax.km, 1) + ' km)</small>' : '—'];
      })
    ) : '<p>No hay semanas por encima de 1,4.</p>';

    /* ---- recuperaciones: días libres reales ---- */
    var libres = D.dias.filter(function (d) { return d.min === 0; });
    var minimos = D.dias.filter(function (d) { return d.min > 0 && d.min < 20; });

    return h`
      ${raw(U.modhead('1', 'Carga, monotonía y riesgo', 'Carga calibrada contra el esfuerzo relativo que Strava ya calculó para tus actividades, no contra constantes inventadas.'))}
      ${raw(kpi)}
      <div class='cols'>
        <article><h4>ACWR</h4>${raw(gACWR)}
          <small>Relación entre lo que hiciste esta semana y tu base de cuatro semanas. Entre 0,8 y 1,3 estás progresando sin saltos.</small></article>
        <article><h4>Monotonía</h4>${raw(gMono)}
          <small>Mide cuánto se parecen entre sí tus días. Baja es bueno: significa que hay días duros y días de verdad fáciles.</small></article>
      </div>
      <h3>El año completo</h3>
      ${raw(gr1)}
      ${raw(gr2)}
      <h3>Las semanas donde te pasaste</h3>
      ${raw(listaPicos)}
      <h3>Detalle semanal</h3>
      ${raw(tabla)}
      ${raw(U.coach('Lo que hay que corregir', `
        <p>Tu problema no es la carga total: es que está repartida igual todos los días.
        Una monotonía alta con una carga media produce más fatiga acumulada que una carga alta bien ondulada.</p>
        <p>En ${D.dias.length} días registrados tienes <b>${libres.length}</b> sin actividad y <b>${minimos.length}</b> de menos de 20 minutos.
        Esos 20 minutos no entrenan nada y te quitan el día de recuperación que sí haría efecto. Cambia el trote de racha por movilidad
        y camina: la racha sigue viva en tu cabeza y el cuerpo descansa.</p>
        <p class='lede'>Regla práctica: un día completamente libre por semana y una semana de descarga (−30% de carga) cada cuatro.</p>`))}
      ${raw(U.acc('Cómo se calcula todo esto', `
        <p><b>Carga.</b> Para cada grupo de deporte con al menos 5 actividades con esfuerzo relativo de Strava se ajusta una constante
        UA/minuto. Resultado medido en tus datos: running ${F.num(D.calib.running, 3)}, MTB ${F.num(D.calib.mtb, 3)}, ruta ${F.num(D.calib.ruta, 3)}.
        Las actividades que ya traen esfuerzo relativo usan ese valor directamente; el resto se estima con su constante.</p>
        <p><b>Monotonía y tensión.</b> Foster (1998): monotonía = carga media diaria ÷ desviación estándar de la semana;
        tensión = carga semanal × monotonía.</p>
        <p><b>ACWR.</b> Variante exponencial (EWMA) con λ = 2/(N+1), N = 7 para la carga aguda y N = 28 para la crónica,
        que es la forma menos sesgada según Williams y colaboradores. Se muestra también la versión de medias móviles.</p>`))}
    `;
  }

  App.mods.push({ id: 'carga', nom: 'Carga y riesgo', tab: 'Carga', icono: 'M3 17l6-6 4 4 8-8M21 7h-5m5 0v5', render: render });
})(this);
