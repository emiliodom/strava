/* bici.js — ruta y MTB: desnivel, VAM y capacidad de ultra. */
(function (global) {
  'use strict';
  var App = global.App, U = App.ui, C = App.chart, F = App.fmt, h = App.h, raw = App.raw;

  function render(D) {
    var b = D.bici, e = D.est, cmp = e.comparativa_mtb_vs_ruta || {};

    var kpi = U.kpis([
      U.kpi('Mayor desnivel en una salida', F.m(b.maxElev), 'tu techo de montaña del año', b.maxElev >= 2000 ? 'ok' : ''),
      U.kpi('Salida más larga', F.km(b.maxKm, 0), F.num(b.maxHoras, 1) + ' h en movimiento'),
      U.kpi('VAM media', F.num(b.vamMedia, 0) + ' m/h', 'en salidas de más de 300 m de desnivel'),
      U.kpi('Salidas de 1.000 m+', F.num(b.n1000, 0), F.num(b.n100km, 0) + ' salidas de 100 km o más')
    ]);

    var gVam = C.scatter({
      points: b.salidas.filter(function (a) { return a.elev > 200; }).map(function (a) {
        return { x: a.min / 60, y: a.vam, r: Math.max(2.5, Math.min(7, a.km / 18)),
          color: D.GRUPO_COLOR[a.grupo], tip: a.nombre + ' · ' + F.fecha(a.fechaISO) + ' · ' + F.km(a.km) + ' · ' + F.m(a.elev) };
      }),
      trend: true, height: 230, xLabel: 'horas en movimiento',
      fmtX: function (v) { return F.num(v, 1) + 'h'; }, fmtY: function (v) { return F.num(v, 0); },
      label: 'VAM frente a duración',
      caption: 'Velocidad ascensional media (m de desnivel por hora) según la duración. El tamaño del punto es la distancia. La línea punteada es la tendencia: tu VAM cae a medida que la salida se alarga, que es exactamente lo que hay que entrenar para el ultra.'
    }) + C.legend([{ name: 'Ruta', color: D.GRUPO_COLOR.ruta }, { name: 'MTB', color: D.GRUPO_COLOR.mtb }]);

    var filasTop = b.topDesnivel.map(function (a) {
      return [F.fecha(a.fechaISO), "<span class='wrap'>" + App.esc(a.nombre) + '</span>',
        App.esc(D.GRUPO_NOM[a.grupo]), F.num(a.km, 1), '<b>' + F.num(a.elev, 0) + '</b>',
        F.num(a.min / 60, 1), F.num(a.vam, 0), F.num(a.mkm, 1)];
    });

    var mm = e.mtb_mensual || {}, mesesM = Object.keys(mm).sort();
    var gMtb = C.bars({
      values: mesesM.map(function (m) { return mm[m].desnivel_m; }),
      labels: mesesM.map(F.mesCorto), height: 170, labelEvery: 1, color: D.GRUPO_COLOR.mtb,
      fmtVal: function (v) { return F.m(v); }, fmtY: function (v) { return F.num(v / 1000, 1) + 'k'; },
      label: 'Desnivel MTB por mes',
      caption: 'Desnivel acumulado en MTB cada mes.'
    });

    return h`
      ${raw(U.modhead('', 'La bici: tu base real', 'Aquí está el motor aeróbico que ya construiste. Es lo que hace creíbles los sueños de ultra.'))}
      ${raw(kpi)}
      ${raw(U.note('Ya hiciste 2.000 m de desnivel en un día',
        'El ' + F.fechaLarga(b.topDesnivel[0].fechaISO) + ' acumulaste ' + F.m(b.maxElev) + ' en una sola salida. ' +
        'El sueño de «2.000 m D+» no es un objetivo nuevo: es algo que ya te sale una vez. Lo que falta es poder repetirlo sin que te cueste tres días de recuperación.', 'ok'))}

      <h3>Ruta contra MTB</h3>
      ${raw(U.tabla(
        [{ t: '' }, { t: 'Salidas', n: true }, { t: 'km', n: true }, { t: 'Horas', n: true }, { t: 'Desnivel', n: true }, { t: 'Vel. media', n: true }, { t: 'm/km', n: true }],
        ['mtb', 'ruta_limpia'].filter(function (k) { return cmp[k]; }).map(function (k) {
          var r = cmp[k];
          return [k === 'mtb' ? 'MTB' : 'Ruta', F.num(r.n, 0), F.num(r.km, 0), F.num(r.horas, 0),
            F.m(r.desnivel_m), F.num(r.vel_media_ponderada_kmh, 1) + ' km/h', F.num(r.desnivel_m_por_km, 1)];
        }),
        { pie: 'La MTB te cuesta el doble de desnivel por kilómetro: es tu mejor herramienta de fuerza específica sin impacto.' }
      ))}

      <h3>Velocidad ascensional</h3>
      ${raw(gVam)}
      ${raw(gMtb)}

      <h3>Tus ocho salidas con más desnivel</h3>
      ${raw(U.tabla(
        [{ t: 'Fecha' }, { t: 'Salida' }, { t: 'Tipo' }, { t: 'km', n: true }, { t: 'D+', n: true }, { t: 'Horas', n: true }, { t: 'VAM', n: true }, { t: 'm/km', n: true }],
        filasTop
      ))}

      ${raw(U.coach('Cómo convertir esto en ultra', `
        <p>Para el ultra ciclismo lo que decide no es la potencia máxima, es cuánto se te cae el rendimiento en la hora cinco.
        Tu VAM media es de ${F.num(b.vamMedia, 0)} m/h y tu mejor cuartil llega a ${F.num(b.vamP75, 0)} m/h, pero la tendencia del gráfico
        muestra la caída con la duración. Ese es el margen que hay que atacar.</p>
        <p>Tres palancas, por orden de rendimiento:</p>
        <p>1. <b>Una salida larga progresiva al mes</b>, sumando 30 minutos cada vez hasta llegar a 6–7 h. No importa el ritmo.</p>
        <p>2. <b>Comer y beber en la bici desde el minuto 30</b>: 60–90 g de carbohidrato por hora y 500–750 ml de líquido.
        La mayoría de los abandonos en ultra son de estómago, no de piernas.</p>
        <p>3. <b>Bloques de subida en Z2 alta</b>: 4–6 repeticiones de 8–12 min al 6–8% de pendiente. Construye la fuerza específica
        que después se transfiere al trail corriendo.</p>`))}
    `;
  }

  App.mods.push({ id: 'bici', nom: 'Bici y montaña', tab: 'Bici', icono: 'M5 18a3 3 0 100-6 3 3 0 000 6zM19 18a3 3 0 100-6 3 3 0 000 6zM9 18l3-8 4 5M12 10l-2-4h3', render: render });
})(this);
