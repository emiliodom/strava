/* ano.js — Resumen del año y composición semanal / hábitos. */
(function (global) {
  'use strict';
  var App = global.App, U = App.ui, C = App.chart, F = App.fmt, S = App.stat, h = App.h, raw = App.raw;

  function render(D) {
    var e = D.est, x = D.extra;
    var tg = e.totales_por_grupo || {};
    var horas = x.horas_totales || 0;
    var hoy = D.hoy || {};
    var sem = D.semanas.filter(function (w) { return w.completa; });
    var ult = sem[sem.length - 1];

    /* ---- KPIs de cabecera ---- */
    var kpiTop = U.kpis([
      U.kpi('Horas en movimiento', F.num(horas, 0), (x.horas_por_semana_media || 0).toFixed(1) + ' h/semana'),
      U.kpi('Kilómetros', F.num(e._verificacion_total ? e._verificacion_total.raw : 0, 0), 'suma de todos los deportes'),
      U.kpi('Desnivel acumulado', F.num(Object.keys(tg).reduce(function (s, k) { return s + (tg[k].desnivel_m || 0); }, 0), 0) + F.NBSP + 'm', 'equivale a 5 veces el Everest'),
      U.kpi('Actividades', F.num(D.acts.length, 0), D.acts.length - D.limpias.length + ' descartadas por datos malos')
    ]);

    /* ---- reparto por grupo ---- */
    var grupos = Object.keys(tg).filter(function (k) { return tg[k].horas_mov > 0.5; })
      .sort(function (a, b) { return tg[b].horas_mov - tg[a].horas_mov; });
    var barrasGrupo = C.hbars(grupos.map(function (g) {
      return { label: D.GRUPO_NOM[g] || g, v: tg[g].horas_mov,
        color: D.GRUPO_COLOR[g] || 'var(--pico-primary)',
        text: F.num(tg[g].horas_mov, 0) + ' h · ' + F.num(tg[g].km, 0) + ' km' };
    }));

    /* ---- horas por mes apiladas ---- */
    var hm = x.horas_mensual_por_deporte || {};
    var meses = Object.keys(hm).sort();
    var seriesMes = [
      { name: 'Ruta', key: 'ride', color: 'var(--z3)' },
      { name: 'MTB', key: 'mtb', color: 'var(--z4)' },
      { name: 'Running', key: 'run', color: 'var(--z2)' },
      { name: 'Otros', key: 'otro', color: 'var(--z1)' },
      { name: 'Fuerza', key: 'fuerza', color: 'var(--z5)' }
    ].map(function (s) {
      return { name: s.name, color: s.color, values: meses.map(function (m) { return (hm[m] || {})[s.key] || 0; }) };
    });
    var graficaMes = C.legend(seriesMes.map(function (s) { return { name: s.name, color: s.color }; })) +
      C.stacked({ labels: meses.map(F.mesCorto), series: seriesMes, height: 220,
        fmtY: function (v) { return F.num(v, 0) + 'h'; }, labelEvery: 1,
        label: 'Horas por mes y deporte',
        caption: 'Horas en movimiento por mes. El running nunca pasa de ~13 h al mes; la bici manda en volumen.' });

    /* ---- carga semanal ---- */
    var graficaSem = C.bars({
      values: sem.map(function (w) { return w.carga; }),
      labels: sem.map(function (w) { return w.semana.slice(6); }),
      height: 190, color: 'var(--accent)',
      fmtVal: function (v) { return F.num(v, 0) + ' UA'; },
      fmtY: function (v) { return F.num(v, 0); },
      label: 'Carga semanal',
      caption: 'Carga semanal en unidades arbitrarias, calibrada contra el esfuerzo relativo de Strava.'
    });

    /* ---- composición semanal: día de la semana ---- */
    var dow = x.dow_horas || {};
    var ordenDow = [1, 2, 3, 4, 5, 6, 0]; // lun..dom con la clave 0 = domingo del JSON
    var mapNom = { 1: 'lun', 2: 'mar', 3: 'mié', 4: 'jue', 5: 'vie', 6: 'sáb', 0: 'dom' };
    var valsDow = ordenDow.map(function (k) { return dow[k] || 0; });
    var mediaDow = S.mean(valsDow.slice(0, 6));
    var barrasDow = C.bars({
      values: valsDow, labels: ordenDow.map(function (k) { return mapNom[k]; }),
      height: 170, labelEvery: 1,
      colorFn: function (v) { return v > mediaDow * 2 ? 'var(--bad)' : 'var(--z2)'; },
      fmtVal: function (v) { return F.num(v, 1) + ' h'; }, fmtY: function (v) { return F.num(v, 0) + 'h'; },
      label: 'Horas por día de la semana',
      caption: 'El domingo concentra ' + F.num((dow[0] || 0) / (S.sum(valsDow) || 1) * 100, 0) + '% de todo el año.'
    });

    /* ---- hábitos ---- */
    var hb = D.habitos;
    var kpiHab = U.kpis([
      U.kpi('Días sin descansar', F.num(hb.maxRachaSinDescanso, 0), 'racha más larga del año', hb.maxRachaSinDescanso > 30 ? 'bad' : ''),
      U.kpi('Días de descanso', F.num(hb.diasDescanso, 0), 'en ' + D.dias.length + ' días', hb.diasDescanso < 10 ? 'bad' : 'ok'),
      U.kpi('Días de mínimo esfuerzo', F.num(hb.diasMinimos, 0), 'menos de 20 min, sólo para no romper la racha'),
      U.kpi('Días dobles', F.num(hb.diasDobles, 0), 'dos o más sesiones')
    ]);

    var tablaRango = U.tabla(
      [{ t: 'Distancia' }, { t: 'Salidas', n: true }, { t: 'Peso', n: true }],
      Object.keys(e.running_n_por_rango_km || {}).map(function (k) {
        var n = e.running_n_por_rango_km[k], tot = S.sum(Object.keys(e.running_n_por_rango_km).map(function (j) { return e.running_n_por_rango_km[j]; }));
        return [App.esc(k) + ' km', F.num(n, 0), F.pct(100 * n / tot, 0)];
      })
    );

    return h`
      ${raw(U.modhead('', 'El año 2026 en una página', 'Todo lo que sigue sale del archivo de ' + D.acts.length + ' actividades; nada está escrito a mano.'))}
      ${raw(kpiTop)}
      <div class='cols'>
        <article><h3>En qué se fue el tiempo</h3>${raw(barrasGrupo)}</article>
        <article><h3>Volumen de running por salida</h3>${raw(tablaRango)}
          <small>La mitad de tus salidas no llegan a 2,5 km. Eso mantiene la racha, pero no construye resistencia.</small></article>
      </div>
      <h3>Mes a mes</h3>
      ${raw(graficaMes)}
      <h3>Carga semanal</h3>
      ${raw(graficaSem)}
      <h3>Cómo se reparte tu semana</h3>
      ${raw(barrasDow)}
      ${raw(kpiHab)}
      ${raw(U.coach('Lo que dicen estos números', `
        <p>Tienes un motor construido sobre la bici y una racha de ${F.num(hb.maxRachaSinDescanso, 0)} días seguidos sin un solo día libre.
        Con ${F.num(hb.diasMinimos, 0)} días de menos de 20 minutos, buena parte de esa racha es simbólica: suma estrés, no entrenamiento.</p>
        <p>La semana está desequilibrada: el domingo pesa más que los otros seis días juntos en varias semanas del año.
        La resistencia se construye con un largo <em>progresivo</em> y días fáciles de verdad, no con un día enorme y seis de relleno.</p>`))}
      ${raw(U.acc('Actividades descartadas por datos inconsistentes', U.tabla(
        [{ t: 'ID' }, { t: 'Motivo' }],
        (e.anomalias_datos || []).map(function (a) { return [App.esc(a.id), App.esc(a.detalle)]; })
      )))}
    `;
  }

  App.mods.push({ id: 'ano', nom: 'El año', tab: 'Año', icono: 'M3 13h4v8H3zM10 3h4v18h-4zM17 9h4v12h-4z', render: render });
})(this);
