/* proyeccion.js — Módulo 2: proyecciones a corto, mediano y largo plazo. */
(function (global) {
  'use strict';
  var App = global.App, U = App.ui, C = App.chart, F = App.fmt, M = App.metrics, h = App.h, raw = App.raw;

  var HORIZONTE = [0, 1, 2, 3, 4, 6, 9, 12, 18, 24, 30, 36, 42, 48];

  var METAS = [
    { id: '10k', nom: '10K a 5:00/km', m: 10000, obj: 3000, plazo: 'corto' },
    { id: '15k', nom: '15K a 5:00/km', m: 15000, obj: 4500, plazo: 'corto' },
    { id: '21k', nom: 'Medio maratón bajo 2 h', m: 21097.5, obj: 7200, plazo: 'mediano' },
    { id: '42k', nom: 'Maratón bajo 4 h', m: 42195, obj: 14400, plazo: 'mediano' },
    { id: '5k', nom: '5K a 4:00/km', m: 5000, obj: 1200, plazo: 'largo' }
  ];

  function render(D) {
    var v0 = D.vdot;
    if (!v0) return '<p>Sin VDOT no se puede proyectar.</p>';
    var proy = M.proyectarVdot(v0, HORIZONTE);
    var largoKm = Math.max.apply(null, D.runs.map(function (a) { return a.km; }).concat([0]));

    /* ---- gráfica de VDOT ---- */
    var hlines = METAS.map(function (g) {
      var lo = 25, hi = 80, nec = hi;
      for (var i = 0; i < 60; i++) { var mid = (lo + hi) / 2; if (M.tiempoDeVdot(mid, g.m) > g.obj) lo = mid; else { hi = mid; nec = mid; } }
      g.vdotNec = nec;
      return { v: nec, color: 'var(--pico-muted-color)', label: g.nom };
    });
    var gr = C.lines({
      labels: HORIZONTE.map(function (t) { return t === 0 ? 'hoy' : t + ' m'; }),
      series: proy.map(function (p) {
        return { name: p.esc.nombre, color: p.esc.color, values: p.serie, width: 2.2, dots: true };
      }),
      hline: hlines, height: 300, labelEvery: 1,
      fmtY: function (x) { return F.num(x, 0); }, fmtVal: function (x) { return 'VDOT ' + F.num(x, 1); },
      label: 'Proyección de VDOT a 4 años',
      caption: 'Las líneas punteadas son el VDOT que exige cada meta. Donde una curva cruza una línea, esa meta se vuelve alcanzable.'
    }) + C.legend(proy.map(function (p) { return { name: p.esc.nombre, color: p.esc.color }; }));

    /* ---- tabla meta × escenario ---- */
    var cols = [{ t: 'Meta' }, { t: 'VDOT necesario', n: true }].concat(proy.map(function (p) { return { t: p.esc.nombre, n: true }; }));
    var filas = METAS.map(function (g) {
      var cel = proy.map(function (p) {
        var mes = M.mesObjetivo(p.serie, HORIZONTE, g.m, g.obj);
        if (mes == null) return "<span style='color:var(--bad)'>fuera de alcance</span>";
        if (mes === 0) return "<span style='color:var(--ok)'>ya</span>";
        var col = mes <= 12 ? 'var(--ok)' : mes <= 24 ? 'var(--warn)' : 'var(--info)';
        return "<span style='color:" + col + "'>" + mes + ' meses</span>';
      });
      return [App.esc(g.nom), F.num(g.vdotNec, 1)].concat(cel);
    });

    /* ---- qué pasa a 3, 12 y 36 meses ---- */
    var instantes = [3, 12, 36];
    var plan = proy[1];
    var filasT = instantes.map(function (t) {
      var i = HORIZONTE.indexOf(t), v = plan.serie[i];
      var p5 = M.predecir(v, 5000, largoKm), p10 = M.predecir(v, 10000, largoKm),
          p15 = M.predecir(v, 15000, largoKm), p21 = M.predecir(v, 21097.5, Math.max(largoKm, t >= 12 ? 25 : largoKm)),
          p42 = M.predecir(v, 42195, Math.max(largoKm, t >= 12 ? 32 : largoKm));
      return [t + ' meses', F.num(v, 1), F.hms(p5.real), F.hms(p10.real), F.hms(p15.real), F.hms(p21.real, true), F.hms(p42.real, true)];
    });

    /* ---- rampa de volumen ---- */
    var ultimas = D.semanas.filter(function (w) { return w.completa; }).slice(-4);
    var kmBase = App.stat.mean(ultimas.map(function (w) { return w.kmRun; }));
    var rampa = M.rampaVolumen(Math.max(kmBase, 22), 20, 0.08, 55);
    var gRampa = C.bars({
      values: rampa.map(function (r) { return r.km; }),
      labels: rampa.map(function (r) { return 'S' + (r.i + 1); }),
      height: 180, labelEvery: 2,
      colorFn: function (v, i) { return rampa[i].descarga ? 'var(--ok)' : 'var(--z2)'; },
      fmtVal: function (v) { return F.km(v); }, fmtY: function (v) { return F.num(v, 0); },
      label: 'Rampa de volumen',
      caption: 'Progresión del 8% semanal desde tus ' + F.km(kmBase) + ' actuales, con descarga del 30% cada cuarta semana (en verde).'
    });

    return h`
      ${raw(U.modhead('2', 'Hasta dónde puedes llegar', 'Tres escenarios sobre el mismo punto de partida: VDOT ' + F.num(v0, 1) + '. Lo que cambia es qué tan bien entrenes, no de dónde sales.'))}

      ${raw(U.kpis(proy.map(function (p) {
        var i12 = HORIZONTE.indexOf(12);
        return U.kpi(p.esc.nombre, F.num(p.serie[i12], 1), 'VDOT en 12 meses');
      }).concat([U.kpi('Hoy', F.num(v0, 1), App.esc(D.vdotFuente))])), 'k3')}

      ${raw(gr)}

      <h3>Cuándo llega cada meta</h3>
      ${raw(U.tabla(cols, filas, { pie: 'Meses desde hoy en los que la proyección alcanza el VDOT necesario. «Fuera de alcance» significa que ese escenario no llega ni en 4 años.' }))}

      ${raw(U.note('La verdad sobre el 5K a 4:00/km',
        'Correr 5 km a 4:00/km son 20:00 bordados: exige un VDOT de ' + F.num(METAS[4].vdotNec, 1) + ', y hoy estás en ' + F.num(v0, 1) +
        '. Eso no es un objetivo de temporada, es un proyecto de dos a cuatro años con entrenamiento serio y constante. ' +
        'No es imposible — la curva dice que llega — pero cualquiera que te prometa eso en doce meses te está vendiendo humo. ' +
        'Tus metas de 10K y 15K a 5:00/km, en cambio, están a meses de distancia, no a años.', 'warn'))}

      <h3>Qué marcas tendrías con el plan cumplido</h3>
      ${raw(U.tabla(
        [{ t: 'Horizonte' }, { t: 'VDOT', n: true }, { t: '5K', n: true }, { t: '10K', n: true }, { t: '15K', n: true }, { t: '21K', n: true }, { t: 'Maratón', n: true }],
        filasT,
        { pie: 'Las distancias largas incluyen la penalización por durabilidad: predicen peor que la fórmula pura mientras tu salida más larga siga en ' + F.km(largoKm) + '. A partir de los 12 meses se supone que ya llevas largos de 25 y 32 km.' }
      ))}

      <h3>Cómo se sube el volumen sin romperse</h3>
      ${raw(gRampa)}

      ${raw(U.acc('Qué significa cada escenario', proy.map(function (p) {
        return "<p><b style='color:" + p.esc.color + "'>" + App.esc(p.esc.nombre) + '.</b> ' + App.esc(p.esc.nota) + '</p>';
      }).join(''), true))}

      ${raw(U.acc('El modelo, en limpio', `
        <p>VDOT(t) = V₀ + Δ·(1 − e^(−t/τ)) + m·min(t, tope), con t en meses.</p>
        <p>El primer término es la adaptación rápida: los primeros meses de entrenamiento estructurado dan mucho porque partes
        de no hacer calidad. El segundo es la pendiente lenta de la edad de entrenamiento, que no satura tan pronto.
        Un solo término exponencial da un techo artificial y haría parecer imposible lo que sólo es lento.</p>
        <p>Las predicciones de tiempo salen del VDOT por la fórmula de Daniels, corregidas por un factor de durabilidad
        que penaliza correr distancias muy por encima de tu salida más larga. Sin ese factor el modelo te prometería
        un maratón sub-4 con un largo de ${F.km(largoKm)}, que es exactamente el error que lleva a la gente a la pared del kilómetro 30.</p>
        <p>Fórmula de Riegel (T₂ = T₁·(D₂/D₁)^k) disponible como contraste, con k = 1,06 para corredor entrenado
        y 1,10–1,15 sin base de largos.</p>`))}
    `;
  }

  App.mods.push({ id: 'proyeccion', nom: 'Proyecciones', tab: 'Futuro', icono: 'M3 3v18h18M7 15l4-5 3 3 5-7', render: render });
})(this);
