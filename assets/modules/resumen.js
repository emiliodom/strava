/* resumen.js — la portada: el veredicto en treinta segundos. */
(function (global) {
  'use strict';
  var App = global.App, U = App.ui, F = App.fmt, M = App.metrics, h = App.h, raw = App.raw, esc = App.esc;

  function render(D) {
    var hoy = D.dias[D.dias.length - 1] || {};
    var sem = D.semanas.filter(function (w) { return w.completa; });
    var ult = sem[sem.length - 1] || {};
    var it = D.intensidad, hb = D.habitos;
    var largoRun = Math.max.apply(null, D.runs.map(function (a) { return a.km; }).concat([0]));

    var p15 = M.predecir(D.vdot, 15000, largoRun);
    var dias15 = App.date.diffDays(new Date(), App.date.d('2026-11-21'));

    var verdictos = [
      { n: 'ok', t: 'Tienes un motor que la mayoría no tiene',
        c: F.num(D.extra.horas_totales, 0) + ' horas de entrenamiento en ' + D.dias.length + ' días, ' +
           F.m(D.bici.maxElev) + ' de desnivel en una sola salida y ' + F.km(D.bici.maxKm, 0) +
           ' como salida más larga. La base aeróbica está construida.' },
      { n: 'bad', t: 'Pero no estás entrenando, estás acumulando',
        c: 'El ' + F.pct(it.pct.z1, 0) + ' de tus minutos de carrera son fáciles y sólo el ' + F.pct(it.pct.z3, 1) +
           ' es trabajo duro. Con ' + F.num(hb.maxRachaSinDescanso, 0) + ' días seguidos sin descansar y ' +
           F.num(hb.diasMinimos, 0) + ' días de menos de 20 minutos, el calendario está lleno y el estímulo vacío.' },
      { n: 'warn', t: 'La carrera del año es el 21 de noviembre',
        c: 'La Guatemágica 15K en Retalhuleu es exactamente tu meta de 15K a 5:00/km. Faltan ' + dias15 +
           ' días y hoy la predicción honesta es ' + F.hms(p15.real) + ' (' + F.paceKm(p15.real / 15) + '). ' +
           'Está cerca, pero no sale sola: hay seis competencias antes y dos se pisan con ella.' }
    ];

    return h`
      ${raw(U.modhead('', 'Dónde estás hoy', 'Cuatrocientas cincuenta y siete actividades resumidas en lo que importa.'))}

      ${raw(U.kpis([
        U.kpi('VDOT', F.num(D.vdot, 1), esc(D.vdotFuente)),
        U.kpi('ACWR hoy', F.num(hoy.acwrEwma, 2), M.clasifAcwr(hoy.acwrEwma) === 'ok' ? 'en rango' : 'fuera de rango',
          M.clasifAcwr(hoy.acwrEwma) === 'ok' ? 'ok' : 'bad'),
        U.kpi('Monotonía', F.num(ult.monotonia, 2), M.clasifMonotonia(ult.monotonia) === 'ok' ? 'variada' : 'semana plana',
          M.clasifMonotonia(ult.monotonia) === 'ok' ? 'ok' : 'bad'),
        U.kpi('Salida más larga', F.km(largoRun), 'tope de resistencia corriendo')
      ]))}

      ${raw(verdictos.map(function (v) { return U.note(v.t, esc(v.c), v.n); }).join(''))}

      ${raw(U.coach('Las tres metas, con fecha realista', `
        <p><b>15K a 5:00/km</b> — cuatro a seis meses con entrenamiento estructurado. La Guatemágica de este noviembre
        es el ensayo; la versión a ritmo llega en 2027.</p>
        <p><b>10K a 5:00/km</b> — tres a nueve meses. Es la más cercana de las tres.</p>
        <p><b>5K a 4:00/km</b> — dos a cuatro años. Exige un VDOT de 49,8 y hoy estás en ${F.num(D.vdot, 1)}.
        Prefiero decírtelo claro: es un proyecto de varias temporadas, no de un invierno.</p>`))}

      <p class='lede'>Abajo tienes el análisis completo: carga y riesgo, el motor de carrera, la bici, las proyecciones,
      los dos calendarios editables para octubre y noviembre, los cuatro sueños y el material de estudio.</p>
    `;
  }

  App.mods.push({ id: 'resumen', nom: 'Resumen', tab: 'Inicio', icono: 'M3 11l9-8 9 8M5 10v10h14V10', render: render });
})(this);
