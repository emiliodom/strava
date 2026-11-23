/* temporada.js — Módulo 30 (página Metas): «Temporada 2027». Lee los eventos de 2027 de App.plan.EVENTOS y los cruza con los
   resultados de 2026 (App.data.raw) para responder: cuántas carreras hay y cuándo, qué es A/B/C, dónde chocan, qué hay que
   batir y cómo decidir el primer 50K (UTG Antigua en noviembre o UTAM en octubre). Fechas de 2027 estimadas por la edición 2026. */
(function (global) {
  'use strict';
  var App = global.App, U = App.ui, F = App.fmt, C = App.chart, esc = App.esc;
  var MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  // Ediciones 2026 de los eventos que se repiten (ids de Strava), para la gráfica de «lo que hay que batir».
  var REF2026 = [
    ['18730986273', 'Ruta Potenz'], ['18921506745', 'Ruta del Tun'], ['19192399109', 'Epic Xolhuitz'], ['19285762327', 'Teletón'],
    ['19476041236', 'Entre Fincas'], ['19572489648', 'Legado del Mar'], ['19673139124', 'Reto Cantel'], ['19770096538', 'Paseo Lunar'],
    ['20161935037', 'Tour Independencia'], ['20912553022', 'Campanabaj'], ['21000609771', 'Entre Senderos'], ['21086185896', 'Sibaná (MTB)']
  ];
  var CANTEL = '19673139124';

  function hm(min) { var h = Math.floor(min / 60), m = Math.round(min % 60); if (m === 60) { h++; m = 0; } return h + ' h ' + (m < 10 ? '0' : '') + m; }
  function cards(arr, fn) { return "<div class='gcards'>" + arr.map(fn).join('') + '</div>'; }
  function crudo() { var por = {}; (((App.data || {}).raw || {}).actividades || []).forEach(function (a) { por[String(a.id)] = a; }); return por; }
  function familia(e) { return e.deporte === 'mtb' || e.deporte === 'ruta' ? 'bici' : e.deporte === 'trail' ? 'trail' : 'pie'; }

  function eventos() {
    return App.plan.EVENTOS.filter(function (e) { return e.fecha >= '2027-01-01' && e.fecha <= '2027-12-31'; })
      .sort(function (a, b) { return a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : (a.prioridad < b.prioridad ? -1 : 1); });
  }

  function porMes(E) {
    var fam = { bici: [], pie: [], trail: [] };
    for (var m = 0; m < 12; m++) ['bici', 'pie', 'trail'].forEach(function (k) { fam[k].push(0); });
    E.forEach(function (e) { fam[familia(e)][+e.fecha.slice(5, 7) - 1]++; });
    return C.legend([{ name: 'Bici (MTB/ruta)', color: 'var(--z1)' }, { name: 'A pie (asfalto)', color: 'var(--accent)' }, { name: 'Trail', color: 'var(--z2)' }]) +
      C.stacked({ labels: MES, labelEvery: 1, height: 190, fmtY: function (v) { return F.num(v, 0); }, label: 'Eventos de 2027 por mes y deporte',
        series: [{ name: 'Bici', color: 'var(--z1)', values: fam.bici }, { name: 'A pie', color: 'var(--accent)', values: fam.pie }, { name: 'Trail', color: 'var(--z2)', values: fam.trail }],
        caption: 'Eventos por mes en 2027 (incluye los que chocan el mismo día). Julio–septiembre y noviembre son los meses cargados: justo el bloque de trail del Challenge y el del 50K.' });
  }

  function batir() {
    var R = crudo(), pts = REF2026.map(function (r) {
      var a = R[r[0]]; if (!a || !a.distance) return null;
      var km = a.distance / 1000, mpk = (a.elevation_gain || 0) / km, kmh = a.distance / a.moving_time * 3.6;
      return { x: mpk, y: kmh, r: r[0] === CANTEL ? 6 : 4, color: r[0] === CANTEL ? 'var(--z5)' : 'var(--z1)',
        tip: r[1] + ' 2026 · ' + F.num(km, 1) + ' km · ' + Math.round(a.elevation_gain) + ' m (' + F.num(mpk, 0) + ' m/km) · ' + F.num(kmh, 1) + ' km/h · ' + hm(a.moving_time / 60) + ' en movimiento' };
    }).filter(Boolean);
    if (pts.length < 3) return '';
    return C.scatter({ points: pts, trend: true, height: 220, fmtX: function (v) { return F.num(v, 0) + ' m/km'; }, fmtY: function (v) { return F.num(v, 0) + ' km/h'; },
      xLabel: 'desnivel por km', label: 'Velocidad 2026 frente a desnivel por km en los eventos de bici que repites',
      caption: 'Cada punto es un evento de bici de 2026 que se repite en 2027 (pasa el cursor para ver cuál). La línea es lo esperable para tu nivel según el desnivel; el punto rojo es el Reto Cantel. Para 2027, la meta es que cada punto suba.' });
  }

  function cantel() {
    var a = crudo()[CANTEL];
    if (!a) return '';
    var km = a.distance / 1000, mov = a.moving_time / 60, tot = a.elapsed_time / 60, kmh = km / mov * 60;
    return U.coach('Reto Cantel: por qué te cuesta y cómo medirte',
      '<p>2026: ' + F.num(km, 1) + ' km y ' + Math.round(a.elevation_gain) + ' m en <b>' + hm(mov) + ' en movimiento y ' + hm(tot) + ' en total</b> (' + hm(tot - mov) + ' parado), ' + F.num(kmh, 1) + ' km/h y FC ' + a.avg_hr + '. Llegaste último.</p>' +
      '<ul><li><b>No fue el motor.</b> FC 143 de media en carrera es baja para ti (Entre Fincas fue a 158, Entre Senderos a 158): igual que en el Challenge Cobán, te frenaron otras cosas.</li>' +
      '<li><b>La altura.</b> Cantel está a unos 2.400 m. Subiendo desde el nivel del mar, la potencia aeróbica baja aproximadamente un 10 % al mismo esfuerzo y el pulso máximo también se aplana: por eso la FC baja y las piernas no responden.</li>' +
      '<li><b>La técnica y las paradas.</b> Más de una hora detenido en 34 km es tiempo bajándote en tramos técnicos o esperando. Es lo que más se puede recortar.</li></ul>' +
      '<p><b>Meta 2027:</b> menos de 2 h 40 en movimiento y menos de 3 h 15 en total. Cómo: dos meses de subidas técnicas en el MTB (Campanabaj y Paseo Lunar enseñan lo mismo), salir los primeros 30 min por debajo de lo que sientes que puedes, comer desde el km 5 y no pararte en las subidas: si no se puede pedalear, se empuja caminando rápido. Que acabes último o no depende de quién vaya; tu número es el tiempo.</p>');
  }

  var PUERTAS = [
    ['30 may', 'Medio Maratón de Cobán', 'Terminado sin dolor y con la tirada larga previa de 18 km hecha.'],
    ['5 sep', 'Challenge Cobán', 'La etapa de trail en 4 h 30 o menos (en 2026, 7 h 20), comiendo todo el día.'],
    ['principios de oct', 'Volumen', 'Seis semanas seguidas con 45 km o más a pie y 1.000 m o más de desnivel por semana, sin molestias que te hagan cambiar la pisada.'],
    ['mediados de oct', 'Ensayo largo', 'Un fin de semana de 30 km + 15 km con 1.500 m, o una salida de 5–6 h en montaña, comiendo 60–90 g/h sin problemas de estómago.']
  ];

  function decision() {
    return cards([
      ['Opción 1 · UTG Antigua 50K (21 nov)', 'Tu idea. Más tiempo para prepararlo (11 semanas tras el Challenge) y la UTAM del 24 oct de ensayo con el 20K. A cambio, noviembre se vacía: Esquipulas sólo como tirada larga, Entre Senderos en Z2 o fuera, y sin Guatemágica (la noche antes) ni Sibaná (el mismo día). Antigua tiene volcanes: confirma desnivel y tiempo de corte.'],
      ['Opción 2 · UTAM 50K (24 oct)', 'Siete semanas después del Challenge: menos margen, pero conserva tu noviembre de siempre (Esquipulas 21K, Entre Senderos, Guatemágica y Sibaná) y te deja la UTG con otra distancia. Amatitlán es más bajo que Antigua.'],
      ['Si no pasas las pruebas', 'UTAM 20K o 40K y una distancia corta de la UTG, y el 50K pasa a 2028. No es fracasar: es el error del Challenge 2026 al revés. Tu escalera original ponía el 50K en 2028–2029; llegar en 2027 ya es adelantarse.']
    ], function (o) { return "<article class='gcard'><h5>" + o[0] + '</h5><p>' + o[1] + '</p></article>'; }) +
      '<h4>Las pruebas de «listo» (todas)</h4>' +
      cards(PUERTAS, function (p) { return "<article class='gcard'><span class='ses-k'>" + p[0] + '</span><h5>' + p[1] + '</h5><p>' + p[2] + '</p></article>'; }) +
      U.note('Recomendación', 'No hay que elegir ahora: el entrenamiento es el mismo hasta el Challenge. Decide el 12 sep, una semana después, con estas pruebas delante. Si pasan y tu prioridad es el 50K, opción 1; si pesan más tus carreras de noviembre, opción 2. Inscríbete en la UTAM 20K en cualquier caso: sirve para las dos.', 'ok');
  }

  // Las duras: si te preparas para estas, cualquiera de las opciones de cada choque sale sola.
  var DURAS = [
    ['challenge27', 'La más larga del año: 10 h en 2026. Manda sobre todo el bloque de junio a septiembre.'],
    ['utg27', 'El primer 50K (o la UTAM del 24 oct: se entrenan igual). Volumen a pie, montaña y comer durante horas.'],
    ['cantel', 'Altura (≈2.400 m), técnica y 760 m: la que más te humilló.'],
    ['lunar', '1.132 m en 40 km: la de más desnivel de las de bici.'],
    ['tun', '784 m y más de 3 h: la primera larga de bici tras el 21K.'],
    ['senderos27', '1.041 m y 3 h a FC 158: tu mejor referencia de bici.'],
    ['campanabaj27', 'Técnica, barro, frío y 800 m. Si te preparas para esta, el 21K de Esquipulas del mismo día también sale.'],
    ['coban21', 'La A a pie de mayo: la base de todo lo que viene después.']
  ];
  function duras() {
    var EV = {}; App.plan.EVENTOS.forEach(function (e) { EV[e.id] = e; });
    return cards(DURAS.filter(function (d) { return EV[d[0]]; }), function (d) {
      var e = EV[d[0]];
      return "<article class='gcard'><span class='ses-k'>" + F.fecha(e.fecha) + ' · ' + esc(e.deporte) + '</span><h5>' + esc(e.nombre) + ' ' + U.chip(e.prioridad, e.prioridad === 'A' ? '' : 'mut') + '</h5><p>' + d[1] + '</p></article>';
    }) + U.note('Sin elegir todavía', 'No hace falta decidir ahora entre las carreras del mismo día ni entre UTG y UTAM: el entrenamiento para la más dura de cada par cubre la otra. Se decide la semana de cada evento, según cómo llegues.', 'ok');
  }

  function bloques() {
    return U.coach('Tres bloques, tres A',
      '<ol><li><b>Ene–may: a pie hacia el 21K.</b> Charlotte construye la base; enero y febrero tienen el 5K de los Bomberos o San Pablo, Tecpanpana y la travesía de Panajachel. Marzo y abril, casi sin eventos: es el hueco para subir la tirada larga a 16–18 km. A: <b>Medio Maratón de Cobán (30 may)</b>. Ruta Potenz cae el mismo fin de semana: fuera.</li>' +
      '<li><b>Jun–sep: bloque de trail.</b> Una salida de montaña a pie por semana y bajadas, con las carreras de bici como rodadas largas en Z2. Aquí está el riesgo: <b>9 eventos en 11 fines de semana</b> de julio a mediados de septiembre. Si cada uno se corre a tope, no queda sitio para las tiradas de montaña que el Challenge necesita (la lección de 2026). Como B: Ruta del Tun, Entre Fincas y Reto Cantel (las tres te miden contra 2026). Las primeras que se pueden saltar: Legado del Mar (llana y rápida, poco útil para el trail) y el Tour de la Independencia (una semana después del Challenge). A: <b>Challenge Cobán (5 sep)</b>.</li>' +
      '<li><b>Oct–nov: el 50K o tu noviembre.</b> Ver abajo. A condicional: <b>UTG Antigua 50K (21 nov)</b> o UTAM 50K (24 oct).</li></ol>' +
      '<p>Regla de 2026 que se mantiene: el día de una carrera a pie, la bici sólo suave; y 4–6 objetivos A al año, el resto entrenos con dorsal.</p>');
  }

  function render() {
    var E = eventos();
    if (!E.length) return '';
    var A = E.filter(function (e) { return e.prioridad === 'A'; }), B = E.filter(function (e) { return e.prioridad === 'B'; });
    var dias = {}; E.forEach(function (e) { dias[e.fecha] = (dias[e.fecha] || 0) + 1; });
    var choques = Object.keys(dias).filter(function (f) { return dias[f] > 1; }).sort();
    var choqueTxt = choques.map(function (f) {
      return F.fecha(f) + ': ' + E.filter(function (e) { return e.fecha === f; }).map(function (e) { return e.nombre; }).join(' / ');
    });
    return U.modhead('30', 'Temporada 2027', 'Todas las carreras y travesías de 2027, qué es objetivo y qué es entreno, dónde chocan, qué hay que batir de 2026 y cómo decidir tu primer 50K. Fechas estimadas por la edición 2026: confírmalas al abrir inscripciones.') +
      U.kpis([
        U.kpi('Eventos en 2027', String(E.length), A.length + ' A · ' + B.length + ' B · ' + (E.length - A.length - B.length) + ' C'),
        U.kpi('A a pie', 'Cobán 21K', '30 may'),
        U.kpi('A de trail', 'Challenge Cobán', '5 sep'),
        U.kpi('50K', 'UTG o UTAM', '21 nov o 24 oct · condicional')
      ]) +
      bloques() +
      U.acc('El año en una gráfica', porMes(E), true) +
      U.acc('Las duras: para estas se entrena', duras(), true) +
      U.acc('Mismo día (' + choques.length + '): no hace falta elegir ahora', '<ul>' + choqueTxt.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' +
        U.note('Prepárate para la más dura del par', 'San Pablo (MTB) cubre el 5K del 17 ene porque Charlotte ya entrena la carrera; el Medio Maratón de Cobán cubre Ruta Potenz; Campanabaj cubre el 21K de Esquipulas si llevas el volumen del 50K; la UTG 50K cubre Sibaná 9K. Eliges la semana del evento.', '')) +
      U.acc('Tu primer 50K: UTG en noviembre o UTAM en octubre', decision()) +
      U.acc('Reto Cantel, tu referencia', cantel()) +
      U.acc('Lo que hay que batir de 2026', batir()) +
      U.acc('Todos los eventos de 2027', cards(E, function (e) {
        return "<article class='gcard'><span class='ses-k'>" + F.fecha(e.fecha) + ' · ' + esc(e.deporte) + (e.km ? ' · ' + F.num(e.km, 0) + ' km' : '') + (e.desnivel ? ' · ' + F.num(e.desnivel, 0) + ' m' : '') + '</span><h5>' + esc(e.nombre) + ' ' + U.chip(e.prioridad, e.prioridad === 'A' ? '' : 'mut') + '</h5><p>' + esc(e.nota || '') + '</p></article>';
      }));
  }

  App.mods.push({ id: 'temporada', nom: 'Temporada 2027', icono: 'M3 5h18v16H3zM3 9h18M8 3v4M16 3v4', render: render });
})(this);
