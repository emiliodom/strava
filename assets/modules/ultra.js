/* ultra.js — Pestaña «Ultra» de la Guía de resistencia (módulo 29): del 21K a los 100K a pie. Diagnóstico con tus datos
   (motor de bici vs piernas de correr), la etapa de trail del Challenge Cobán km a km, la escalera 21K → 42K → 50K → 100K
   con requisitos y pruebas de «listo», las claves del trail y cómo encaja con la bici.
   Referencias propias comprobadas en Crossref (22 nov 2026); las compartidas se toman de App.guiaRefs.raw. */
(function (global) {
  'use strict';
  var App = global.App, U = App.ui, F = App.fmt, C = App.chart, esc = App.esc;

  var PROPIAS = [
    ['knechtle', 'Knechtle B, Nikolaidis PT (2018). Physiology and pathophysiology in ultra-marathon running. Front Physiol 9:634.', '10.3389/fphys.2018.00634'],
    ['hoffman', 'Hoffman MD, Krishnan E (2014). Health and exercise-related medical issues among 1,212 ultramarathon runners: baseline findings from the Ultrarunners Longitudinal TRAcking (ULTRA) Study. PLoS One 9:e83867.', '10.1371/journal.pone.0083867'],
    ['millet', 'Millet GY, Hoffman MD, Morin JB (2012). Sacrificing economy to improve running performance — a reality in the ultramarathon? J Appl Physiol 113:507–509.', '10.1152/japplphysiol.00016.2012'],
    ['vernillo', 'Vernillo G, Giandolini M, Edwards WB, et al. (2017). Biomechanics and physiology of uphill and downhill running. Sports Med 47:615–629.', '10.1007/s40279-016-0605-y'],
    ['giandolini', 'Giandolini M, Vernillo G, Samozino P, et al. (2016). Fatigue associated with prolonged graded running. Eur J Appl Physiol 116:1859–1873.', '10.1007/s00421-016-3437-4'],
    ['mchugh', 'McHugh MP (2003). Recent advances in the understanding of the repeated bout effect: the protective effect against muscle damage from a single bout of eccentric exercise. Scand J Med Sci Sports 13:88–97.', '10.1034/j.1600-0838.2003.02477.x'],
    ['costa', 'Costa RJS, Miall A, Khoo A, et al. (2017). Gut-training: the impact of two weeks repetitive gut-challenge during exercise on gastrointestinal status, glucose availability, fuel kinetics, and running performance. Appl Physiol Nutr Metab 42:547–557.', '10.1139/apnm-2016-0453']
  ];
  var DE_GUIA = ['jeukendrup', 'lauersen', 'riegel', 'ronnestadMujika'];
  var REFS = null, NUM = {};
  function refs() {
    if (REFS) return REFS;
    var raw = (App.guiaRefs && App.guiaRefs.raw) || [];
    REFS = PROPIAS.concat(raw.filter(function (r) { return DE_GUIA.indexOf(r[0]) >= 0; }));
    REFS.forEach(function (r, i) { NUM[r[0]] = i + 1; });
    return REFS;
  }
  function c() {
    refs();
    var ns = Array.prototype.slice.call(arguments).map(function (k) { return NUM[k]; }).filter(Boolean);
    return ns.length ? " <sup class='ref'>[" + ns.join(', ') + ']</sup>' : '';
  }
  function lista() {
    return "<ol class='grefs'>" + refs().map(function (r) {
      return '<li>' + esc(r[1]) + (r[2] ? " <a href='https://doi.org/" + r[2] + "' target='_blank' rel='noopener'>doi:" + r[2] + '</a>' : '') + '</li>';
    }).join('') + '</ol>';
  }
  function cards(arr, fn) { return "<div class='gcards'>" + arr.map(fn).join('') + '</div>'; }
  function hm(min) { var h = Math.floor(min / 60), m = Math.round(min % 60); if (m === 60) { h++; m = 0; } return h + ' h ' + (m < 10 ? '0' : '') + m; }

  var COBAN = { run1: '20061880669', mtb: '20063774603', trail: '20068919073' };

  function crudo() {
    var raw = App.data && App.data.raw, por = {};
    ((raw && raw.actividades) || []).forEach(function (a) { por[String(a.id)] = a; });
    return por;
  }

  // Lo que dicen tus datos: motor (bici) vs piernas de correr.
  function diag(D) {
    var A = D.limpias.filter(function (a) { return a.fechaISO >= '2026-01-01'; });
    var runs = A.filter(function (a) { return a.grupo === 'running'; }), bik = A.filter(function (a) { return a.grupo === 'ruta' || a.grupo === 'mtb'; });
    var maxRun = runs.reduce(function (m, a) { return a.km > m.km ? a : m; }, { km: 0 });
    var maxBike = bik.reduce(function (m, a) { return a.min > m.min ? a : m; }, { min: 0 });
    var lejos = bik.reduce(function (m, a) { return a.km > m.km ? a : m; }, { km: 0 });
    var sem = {}; runs.forEach(function (a) { var d = new Date(a.fechaISO + 'T00:00:00Z'), k = new Date(d - ((d.getUTCDay() + 6) % 7) * 864e5).toISOString().slice(0, 10); sem[k] = (sem[k] || 0) + a.km; });
    var maxSem = Math.max.apply(null, Object.keys(sem).map(function (k) { return sem[k]; }).concat([0]));
    var trail = runs.filter(function (a) { return /Trail/.test(a.deporte || '') || a.elev / Math.max(a.km, 0.1) >= 30; });
    return { maxRun: maxRun, maxBike: maxBike, lejos: lejos, maxSem: maxSem, nTrail: trail.length, kmRun: runs.reduce(function (s, a) { return s + a.km; }, 0) };
  }

  function coban() {
    var R = crudo(), t = R[COBAN.trail];
    if (!t || !t.splits) return U.note('Sin datos', 'No encuentro la etapa de trail del Challenge Cobán en los datos.', 'warn');
    var sp = t.splits.filter(function (s) { return s[0] > 60; });
    var cats = sp.map(function (s) { return s[2] > 20 ? 'up' : s[2] < -20 ? 'down' : 'flat'; });
    var COL = { up: 'var(--accent)', down: 'var(--z1)', flat: 'var(--z2)' }, NOM = { up: 'subida (más de 20 m)', down: 'bajada (más de 20 m)', flat: 'llano o mixto' };
    var mins = sp.map(function (s) { return s[0] / 60; });
    var prim = mins.slice(0, 7), resto = mins.slice(7);
    var avg = function (xs) { return xs.reduce(function (a, b) { return a + b; }, 0) / (xs.length || 1); };
    var bajadas = sp.map(function (s, i) { return { i: i, m: mins[i], d: s[2], hr: s[1] }; }).filter(function (x) { return x.d < -20; });
    var peorB = bajadas.slice().sort(function (a, b) { return b.m - a.m; })[0];
    var tot = [R[COBAN.run1], R[COBAN.mtb], t].filter(Boolean);
    var mov = tot.reduce(function (s, a) { return s + a.moving_time; }, 0) / 60, el = tot.reduce(function (s, a) { return s + a.elapsed_time; }, 0) / 60;
    var parado = (t.elapsed_time - t.moving_time) / 60;
    var chart = C.legend(['up', 'flat', 'down'].map(function (k) { return { name: NOM[k], color: COL[k] }; })) +
      C.bars({ values: mins, labels: mins.map(function (_, i) { return 'km ' + (i + 1); }), labelEvery: 2, height: 200,
        colorFn: function (v, i) { return COL[cats[i]]; }, fmtY: function (v) { return F.num(v, 0) + ' min'; },
        tips: sp.map(function (s, i) { return F.num(mins[i], 1) + ' min · ' + (s[2] > 0 ? '+' : '') + s[2] + ' m · FC ' + (s[1] || '—'); }),
        mean: 12, meanLabel: '12 min/km', label: 'Etapa 3 del Challenge Cobán: minutos por kilómetro',
        caption: 'Minutos en movimiento por cada km de la etapa de trail (6 sep): ' + F.num(t.distance / 1000, 1) + ' km y ' + Math.round(t.elevation_gain) + ' m en ' + hm(t.moving_time / 60) + ' en movimiento y ' + hm(t.elapsed_time / 60) + ' en total. La línea de 12 min/km es caminar rápido en montaña. Pasa el dedo o el ratón por cada barra para ver desnivel y pulso.' });
    return U.coach('Lo que pasó, km a km',
      '<p>Fue el tercer tramo del día: antes corriste ' + (R[COBAN.run1] ? F.num(R[COBAN.run1].distance / 1000, 1) + ' km' : 'la etapa 1') + ' y pedaleaste ' + (R[COBAN.mtb] ? F.num(R[COBAN.mtb].distance / 1000, 1) + ' km de MTB con FC ' + R[COBAN.mtb].avg_hr + ' de media' : 'la etapa 2') + '. En total, ' + hm(mov) + ' en movimiento y <b>' + hm(el) + ' en la montaña</b>.</p>' +
      '<ul><li><b>Los primeros 7 km</b> salieron a ' + F.num(avg(prim), 1) + ' min/km de media: trote y caminata, sostenible. <b>Del km 8 al final</b>, ' + F.num(avg(resto), 1) + ' min/km: ahí empezó el «gatear».</li>' +
      '<li><b>Lo más lento fueron las bajadas, no las subidas.</b> ' + (peorB ? 'El km ' + (peorB.i + 1) + ' bajaba ' + Math.abs(peorB.d) + ' m y te costó ' + F.num(peorB.m, 0) + ' min.' : '') + ' Bajar con cuádriceps cansados y barro es lo que más destruye en montaña: el trabajo excéntrico (el músculo frena mientras se alarga) daña la fibra y la fatiga se acumula hora a hora' + c('vernillo', 'giandolini') + '.</li>' +
      '<li><b>El corazón no fue el límite.</b> FC media ' + t.avg_hr + ' y de 114–115 en los peores km: ibas despacio porque las piernas, el terreno y probablemente la energía no daban, no por falta de motor. Eso es buena noticia: lo que falta se entrena.</li>' +
      '<li><b>' + hm(parado) + ' parado</b> en esa etapa. Parte será el terreno (pasos de barro, caminar con las manos), parte la falta de energía: tras ~4 h de trabajo previo, sin comer 60–90 g de carbohidrato por hora, las piernas se apagan' + c('jeukendrup') + '.</li></ul>') + chart +
      U.note('Meta para el próximo Challenge Cobán', 'Misma etapa en <b>3 h 30–4 h 30 en total</b>, caminando fuerte las subidas, bajando con técnica y comiendo cada 30 min, en vez de 7 h 20. Es razonable con 9 meses de trail una vez por semana, bajadas regulares y una tirada larga de 3 h en montaña antes de la carrera.', 'ok');
  }

  var ESCALERA = [
    ['21K · medio maratón', 'Primavera 2027 (mar–abr)', 'Semanas de 30–40 km a pie; tirada larga hasta 16–18 km; una sesión de umbral (≈ 5:05/km) a la semana.', '18 km fáciles sin dolor y un 10K por debajo de 50 min. Pronóstico desde la Guatemágica: 2 h 10–2 h 17 (Tu 2026 › Pronósticos).'],
    ['Trail 20–30 km · Challenge Cobán', 'Sep 2027 (objetivo A de trail)', 'Una sesión de montaña por semana (subidas caminando fuerte + bajadas), 600–1.200 m de desnivel a pie por semana, tirada larga de 2–3 h en montaña cada 2 semanas.', '20 km y 800 m en menos de 4 h comiendo 60 g/h sin problemas de estómago ni de pies.'],
    ['42K · maratón (ruta o trail)', '2028', '45–60 km a pie por semana durante 4–6 meses, tirada larga de 28–32 km, la bici como volumen extra pero no el día antes de la tirada.', '30 km a ritmo fácil sin que se caiga el ritmo en los últimos 10 km.'],
    ['50K trail', '2028–2029, después del maratón', 'Fines de semana «back-to-back» (sábado 25 km + domingo 15 km), tiradas de 4–5 h, 1.500–2.500 m de desnivel por semana, ensayo de comida y material.', 'Un fin de semana de 40 km y 2.000 m sin dolor y comiendo todo el tiempo.'],
    ['100K', '2030 o más (tras 2–3 años de ultras cortos)', 'Años de base: los que terminan 100 km suelen llevar mucho tiempo corriendo y varios ultras más cortos' + '§knechtle' + '. Noche, frío, estómago y cabeza pesan tanto como las piernas.', 'Haber terminado bien 2–3 ultras de 50–80 km y una salida de 8–10 h de prueba.']
  ];

  var CLAVES = [
    ['Caminar es parte de la carrera', 'En pendientes de más de ~15 %, caminar fuerte (manos en las rodillas o con bastones) gasta menos que trotar y los mejores lo hacen' + '§millet' + '. Entrénalo: series de 3–5 min subiendo a paso rápido.'],
    ['Bajar se entrena', 'Pasos cortos y rápidos, mirar 3–4 m adelante, brazos abiertos, pisar plano en barro. Una sesión de bajadas protege de daño muscular las siguientes semanas (efecto de la carga repetida)' + '§mchugh' + ': empieza con 10–15 min de bajada y sube poco a poco.'],
    ['Cuádriceps y tobillos', 'Sentadilla búlgara, step-down lento (3 s bajando), elevaciones de talón y saltos suaves. La fuerza reduce lesiones y mejora la economía' + '§ronnestadMujika' + '§lauersen' + '.'],
    ['Comer desde el minuto 30', '60–90 g de carbohidrato por hora en salidas de más de 2 h. El estómago se entrena: dos semanas comiendo así en los entrenos ya reducen las molestias' + '§costa' + '§jeukendrup' + '. Ensaya lo mismo que comerás en carrera (y lo del intestino de la Guatemágica).'],
    ['Tiempo en pie, no kilómetros', 'En montaña, planifica por horas. Una tirada de 2 h a 12 min/km vale más para un ultra que 15 km en llano.'],
    ['Zapatillas y pies', 'Zapatilla de trail con taco y que no se mueva (tu pie derecho en el 15K), calcetín técnico, uñas cortas, vaselina en zonas de roce. Las ampollas y las uñas negras retiran a mucha gente.'],
    ['Material y seguridad', 'Mochila con 1–1,5 L, frontal, chaqueta, silbato, comida para 1 h más de lo previsto. En Cobán llueve: ropa que seque.'],
    ['Lesiones típicas', 'Rodilla, tendón de Aquiles, fascia plantar y fracturas por estrés son de las más frecuentes en ultrafondistas' + '§hoffman' + '. Si un dolor cambia tu forma de pisar, para y que lo vea un médico; es información general.']
  ];

  function citar(txt) { return txt.replace(/((?:§\w+)+)/g, function (m) { return c.apply(null, m.split('§').filter(Boolean)); }); }

  function render(D) {
    if (!D || !D.limpias) return '';
    var X = diag(D);
    return U.modhead('29', 'Ultra: del 21K a los 100K', 'Qué te falta para correr distancias largas en montaña, qué pasó en el Challenge Cobán y la escalera paso a paso, con fechas realistas.') +

      U.coach('La respuesta corta',
        '<p><b>El motor ya lo tienes; las piernas de correr, todavía no.</b> En bici has estado ' + hm(X.maxBike.min) + ' en movimiento de un tirón (' + F.num(X.maxBike.km, 0) + ' km y ' + F.num(X.maxBike.elev, 0) + ' m), ' + F.num(X.lejos.km, 0) + ' km en ruta y tres horas de carrera a FC 158 en Entre Senderos: eso es resistencia aeróbica de ultra. Pero un ultra a pie no lo limita el corazón: lo limitan el impacto, las bajadas, los pies, el estómago y el terreno' + c('knechtle') + '. Y eso se adapta más despacio que el corazón: músculos en semanas, tendones y huesos en meses.</p>' +
        '<p><b>Tus números a pie en 2026:</b> salida más larga ' + F.num(X.maxRun.km, 1) + ' km, semana más alta ' + F.num(X.maxSem, 0) + ' km y apenas ' + X.nTrail + ' salidas de trail o con mucho desnivel. Para el 21K basta con crecer en Charlotte; para el trail largo, hay que meter la montaña cada semana. <b>La bici no está completa por haber hecho distancia</b>: sigue siendo tu mejor herramienta de volumen sin impacto, y la que te mantendrá sano mientras las piernas se adaptan.</p>') +

      U.kpis([
        U.kpi('Salida a pie más larga', F.num(X.maxRun.km, 1) + ' km', X.maxRun.fechaISO ? F.fecha(X.maxRun.fechaISO) : ''),
        U.kpi('Semana a pie más alta', F.num(X.maxSem, 0) + ' km', 'meta ultra: 50+ km sostenidos'),
        U.kpi('Trail en 2026', String(X.nTrail), 'salidas de trail o ≥ 30 m/km'),
        U.kpi('Bici más larga', hm(X.maxBike.min), F.num(X.maxBike.km, 0) + ' km · el motor ya está')
      ]) +

      U.acc('Challenge Cobán 2026: dónde se fue el día', coban(), true) +

      U.acc('La escalera: 21K → trail → 42K → 50K → 100K', cards(ESCALERA, function (e, i) {
        return "<article class='gcard'><span class='ses-k'>Paso " + (i + 1) + ' · ' + e[1] + '</span><h5>' + e[0] + '</h5><p>' + citar(e[2]) + '</p><p><small><b>Listo cuando:</b> ' + e[3] + '</small></p></article>';
      }) + U.note('La regla que no se salta', 'Sube el volumen a pie poco a poco (más o menos un 10 % por semana y una semana más suave cada 3–4) y nunca subas a la vez distancia, desnivel y ritmo. Cada escalón necesita un año de base; saltarse uno es como acabas gateando.', 'warn'), true) +

      U.acc('Las claves del trail', cards(CLAVES, function (k) { return "<article class='gcard'><h5>" + k[0] + '</h5><p>' + citar(k[1]) + '</p></article>'; })) +

      U.acc('Cómo encaja con la bici y con Charlotte', U.coach('Un plan para 2027',
        '<ul><li><b>Charlotte (25 nov–13 ene), entre semana:</b> trabajas 8:00–17:00 de Utah = 10:00–19:00 en Charlotte (dos horas por delante), así que tienes de 6:00 a 9:30. Amanece hacia las 7:20: la primera parte va por greenway asfaltado con luz y la tierra cuando ya hay sol. Los senderos de tierra cercanos son los de Revolution Park (unos 3 km) y Renaissance Park (unos 6 km, al sur): ahí caben 1–2 trails cortos por semana.</li>' +
        '<li><b>Charlotte, sábado:</b> el U.S. National Whitewater Center (más de 60 km de senderos, gratis; sólo se paga el parking si vas en coche) queda a unos 20 km. En bici es un día «bici + trail»: ≈1 h de ida, 60–90 min de trail y vuelta, de día y evitando las avenidas grandes. En coche con la familia, también vale.</li>' +
        '<li><b>Ene–abr 2027:</b> medio maratón como objetivo. Bici 2–3 días (volumen y una sesión dura), carrera 4–5 días con tirada larga, umbral y una sesión de cuesta.</li>' +
        '<li><b>May–sep 2027:</b> bloque de trail hacia el Challenge Cobán: una salida de montaña por semana, bajadas, fuerza de cuádriceps y ensayos de comida. La MTB larga se queda, pero no la víspera de la tirada.</li>' +
        '<li><b>Siempre:</b> el día de una carrera a pie, la bici sólo suave (lo aprendiste con Boxomá y la Guatemágica).</li></ul>')) +

      U.acc('Referencias', lista());
  }

  App.mods.push({ id: 'ultra', nom: 'Ultra a pie', tab: 'Ultra', icono: 'M3 20l6-10 4 6 3-4 5 8z', render: render });
})(this);
