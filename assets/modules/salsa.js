/* salsa.js — Pestaña «Bici o correr» de la Guía de resistencia (módulo 27): qué es un «buen nivel» amateur en cada
   deporte, dónde está la oportunidad más cercana con tus datos (se calcula en vivo) y la «salsa secreta» que dice la
   evidencia. Referencias propias comprobadas en Crossref; las compartidas se toman de App.guiaRefs.raw. */
(function (global) {
  'use strict';
  var App = global.App, U = App.ui, F = App.fmt;

  var PROPIAS = [
    ['pinot', 'Pinot J, Grappe F (2011). The record power profile to assess performance in elite cyclists. Int J Sports Med 32:839–844.', '10.1055/s-0031-1279773'],
    ['videbaek', 'Videbæk S, Bueno AM, Nielsen RO, Rasmussen S (2015). Incidence of running-related injuries per 1000 h of running in different types of runners: a systematic review and meta-analysis. Sports Med 45:1017–1026.', '10.1007/s40279-015-0333-8'],
    ['clarsen', 'Clarsen B, Krosshaug T, Bahr R (2010). Overuse injuries in professional road cyclists. Am J Sports Med 38:2494–2501.', '10.1177/0363546510376816'],
    ['saunders', 'Saunders PU, Pyne DB, Telford RD, Hawley JA (2004). Factors affecting running economy in trained distance runners. Sports Med 34:465–485.', '10.2165/00007256-200434070-00005'],
    ['hopker', 'Hopker J, Passfield L, Coleman D, Jobson S, Edwards L, Carter H (2009). The effects of training on gross efficiency in cycling: a review. Int J Sports Med 30:845–850.', '10.1055/s-0029-1237712'],
    ['tanaka', 'Tanaka H, Seals DR (2008). Endurance exercise performance in Masters athletes: age-associated changes and underlying physiological mechanisms. J Physiol 586:55–63.', '10.1113/jphysiol.2007.141879'],
    ['neal', 'Neal CM, Hunter AM, Brennan L, et al. (2013). Six weeks of a polarized training-intensity distribution leads to greater physiological and performance adaptations than a threshold model in trained cyclists. J Appl Physiol 114:461–471.', '10.1152/japplphysiol.00652.2012'],
    ['ronnestad20', 'Rønnestad BR, Hansen J, Nygaard H, Lundby C (2020). Superior performance improvements in elite cyclists following short-interval vs effort-matched long-interval training. Scand J Med Sci Sports 30:849–857.', '10.1111/sms.13627'],
    ['debraux', 'Debraux P, Grappe F, Manolova AV, Bertucci W (2011). Aerodynamic drag in cycling: methods of assessment. Sports Biomech 10:197–218.', '10.1080/14763141.2011.592209'],
    ['fullagar', 'Fullagar HHK, Skorski S, Duffield R, et al. (2015). Sleep and athletic performance: the effects of sleep loss on exercise performance, and physiological and cognitive responses to exercise. Sports Med 45:161–186.', '10.1007/s40279-014-0260-0'],
    ['jeukendrup00', 'Jeukendrup AE, Craig NP, Hawley JA (2000). The bioenergetics of world class cycling. J Sci Med Sport 3:414–433.', '10.1016/S1440-2440(00)80008-0']
  ];
  var DE_GUIA = ['joyner', 'seiler', 'ronnestad15', 'jeukendrup', 'ronnestad11', 'mountjoy'];
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
      return '<li>' + App.esc(r[1]) + (r[2] ? " <a href='https://doi.org/" + r[2] + "' target='_blank' rel='noopener'>doi:" + r[2] + '</a>' : '') + '</li>';
    }).join('') + '</ol>';
  }
  function mmss(min) { var m = Math.floor(min), s = Math.round((min - m) * 60); if (s === 60) { m++; s = 0; } return m + ':' + (s < 10 ? '0' : '') + s; }
  function cards(arr, fn) { return "<div class='gcards'>" + arr.map(fn).join('') + '</div>'; }
  function bici(a) { return a.grupo === 'ruta' || a.grupo === 'mtb'; }

  var EST_10K = 26.4;   // estándar abierto masculino de 10 km en ruta (WMA/USATF 2025), en minutos

  function datos(D) {
    var hoy = D.limpias.length ? D.limpias[D.limpias.length - 1].fechaISO : '2026-11-17';
    var desde = new Date(Date.parse(hoy + 'T00:00:00Z') - 365 * 864e5).toISOString().slice(0, 10);
    var A = D.limpias.filter(function (a) { return a.fechaISO > desde; });
    var bh = 0, rh = 0, rkm = 0;
    A.forEach(function (a) { if (bici(a)) bh += a.min / 60; if (a.grupo === 'running') { rh += a.min / 60; rkm += a.km; } });
    var base = A.filter(function (a) { return a.grupo === 'running' && a.km >= 8 && a.km <= 16 && a.fechaISO >= '2026-07-01' && a.min * 60 / a.km < 450; })
      .map(function (a) { return { a: a, t10: a.min * Math.pow(10 / a.km, 1.06) }; })
      .sort(function (x, y) { return x.t10 - y.t10; })[0] || null;
    var at = (App.data.atleta && App.data.atleta()) || {};
    return { bh: bh, rh: rh, rkm: rkm, base: base, kg: +at.peso || 77, edad: +at.edad || 39 };
  }

  function render(D) {
    var X = datos(D), kg = X.kg;
    var ag = X.base ? EST_10K / X.base.t10 * 100 : null;
    var w = function (wkg, m) { return Math.round(wkg * m) + ' W'; };

    var veredicto = U.coach('La respuesta corta',
      '<p><b>Sí: tu oportunidad más cercana de «números buenos» está en la bici, pero no por la razón que se suele dar.</b> No es que la bici sea más fácil; es que tú ya tienes la base de horas, que la bici admite más volumen sin lesiones por impacto' + c('videbaek', 'clarsen') + ', y que tus mayores fugas (zona gris, no medir potencia, comer poco en la bici) se arreglan en meses, no en años. A pie también mejorarías, pero llegar a un nivel «bueno» exige años de kilómetros que el tendón y el pie tienen que tolerar' + c('saunders') + '.</p>' +
      '<p>La salsa secreta no es secreta: <b>constancia durante años + la mayor parte fácil de verdad + dos sesiones duras bien hechas + comer y dormir para absorberlo</b>' + c('joyner', 'seiler') + '. Lo que separa a los buenos amateurs es que la hacen 48 semanas al año, no que conozcan un truco.</p>');

    var kp = U.kpis([
      U.kpi('Bici, últimos 12 meses', F.num(X.bh, 0) + ' h', 'tu base ya existe'),
      U.kpi('A pie, últimos 12 meses', F.num(X.rh, 0) + ' h', F.num(X.rkm, 0) + ' km'),
      U.kpi('10K equivalente', X.base ? mmss(X.base.t10) : '—', X.base ? 'desde ' + F.num(X.base.a.km, 1) + ' km el ' + F.fecha(X.base.a.fechaISO) : 'sin carrera de 8–16 km'),
      U.kpi('Nivel por edad a pie', ag ? '≈ ' + F.num(ag, 0) + ' %' : '—', '60 % = nivel local', ag && ag < 50 ? 'warn' : '')
    ]);

    var niveles = U.acc('¿Qué es «bueno» en cada deporte? (no élite)', cards([
      ['Correr: nivel por edad', '<p>Se compara tu tiempo con el récord para tu edad y sexo: 60 % es nivel local, 70 % regional, 80 % nacional. Para un hombre de ' + X.edad + ' años en 10 km:</p><ul><li><b>60 %:</b> ≈ 44 min (4:24/km)</li><li><b>70 %:</b> ≈ 38–39 min (3:50/km)</li></ul>' +
        (ag ? '<p>Tú estás en ≈ ' + F.num(ag, 0) + ' % (10K equivalente ' + mmss(X.base.t10) + '). Llegar a 60 % es bajar ' + F.num(X.base.t10 - 44, 0) + ' min: posible, pero con 3–5 años de 40–60 km semanales.</p>' : '') +
        '<p><small>Cálculo aproximado con el estándar abierto de 10 km (26:24); a los 39 años el ajuste por edad apenas cambia el resultado.</small></p>', 'Años'],
      ['Bici: vatios por kilo (FTP)', '<p>La FTP es la potencia que sostienes cerca de una hora; dividida por el peso, ordena a los ciclistas en subida' + c('jeukendrup00', 'pinot') + '. Tablas de Coggan y datos de usuarios de potencia (las fuentes difieren):</p><ul><li><b>&lt; 2,5 W/kg:</b> principiante</li><li><b>2,5–3,0:</b> recreativo en forma (cerca de la mediana de quien entrena con potencia)</li><li><b>3,3–3,8:</b> <b>bueno</b>: cuartil alto de los amateurs con potenciómetro</li><li><b>&gt; 4,0:</b> competitivo regional</li></ul>' +
        '<p>Con ' + F.num(kg, 0) + ' kg, «bueno» es <b>' + w(3.3, kg) + '–' + w(3.8, kg) + '</b>; con ' + F.num(kg - 4, 0) + ' kg, ' + w(3.3, kg - 4) + '–' + w(3.8, kg - 4) + '.</p>', 'Meses a pocos años']
    ], function (d) { return "<article class='gcard'><h5>" + d[0] + "</h5><span class='ver'>" + d[2] + '</span>' + d[1] + '</article>'; }), true);

    var porQue = U.acc('Por qué la bici está más cerca (y en qué no)', cards([
      ['Volumen sin impacto', 'Correr produce del orden de 7–18 lesiones por cada 1 000 h según el tipo de corredor' + c('videbaek') + '; en bici los problemas típicos son de sobreuso (rodilla, lumbar) y se previenen con buen ajuste y fuerza' + c('clarsen') + '. Tu pie ya te paró en octubre: la bici es donde puedes meter horas.', 'A favor de la bici'],
      ['La economía de carrera tarda años', 'La economía de carrera mejora con años y kilómetros acumulados' + c('saunders') + '. En bici la eficiencia cambia poco con el entrenamiento' + c('hopker') + ': el rendimiento depende sobre todo del motor aeróbico, que responde en meses' + c('joyner') + '.', 'A favor de la bici'],
      ['Tu base ya está ahí', 'Llevas ' + F.num(X.bh, 0) + ' h de bici en 12 meses frente a ' + F.num(X.rh, 0) + ' h a pie. El volumen ya lo pagaste; falta ordenarlo.', 'A favor de la bici'],
      ['Las fugas se arreglan rápido', 'Casi tres cuartas partes de tus horas de bici con pulsómetro van en zona gris (ver «Tu 2026»). Polarizar en ciclistas entrenados mejoró más el rendimiento que entrenar en umbral en sólo 6 semanas' + c('neal') + '.', 'A favor de la bici'],
      ['El peso pesa en ambos', 'A pie el coste es proporcional a tu masa en cada metro; en bici, sólo en subida. Bajar 3–4 kg de grasa sin prisa ayuda en los dos, pero el déficit agresivo en bloques duros cuesta rendimiento y salud' + c('mountjoy') + '.', 'Empate'],
      ['La edad no es excusa todavía', 'El rendimiento de resistencia se mantiene bastante bien hasta los 50–60 y luego cae más deprisa; el VO₂máx es lo que más pesa' + c('tanaka') + '. A los ' + X.edad + ' tienes años por delante en los dos deportes.', 'Empate'],
      ['Lo que no te dice nadie', 'Sin potenciómetro no sabes tu FTP: los vatios de Strava son estimados. Puedes mejorar sin él, pero «números buenos» en bici se miden en vatios, y medir es la primera pieza.', 'Pendiente']
    ], function (f) { return "<article class='gcard'><h5>" + f[0] + "</h5><span class='ver'>" + f[2] + '</span><p>' + f[1] + '</p></article>'; })) ;

    var salsa = U.acc('La salsa secreta, ingrediente por ingrediente', cards([
      ['1 · Constancia de años', 'Lo que más explica el nivel amateur es acumular semanas sin interrupción: 8–12 h por semana, 46–48 semanas al año' + c('joyner', 'seiler') + '. Un mes perdido por lesión o agotamiento cuesta más que cualquier sesión mal hecha.'],
      ['2 · Fácil de verdad (≈ 80 %)', 'La mayoría de las sesiones por debajo de tu primer umbral (FC < 135 en tu caso)' + c('seiler', 'neal') + '. Tu cambio más grande: que las salidas «normales» dejen de ser 140–150.'],
      ['3 · Dos sesiones duras, bien elegidas', 'Series cortas tipo 30/15 (3 × 13 min) y bloques de 8–12 min a umbral. Las cortas rindieron más que las largas a igual esfuerzo en ciclistas' + c('ronnestad15', 'ronnestad20') + '. Duras de verdad, no «medio duras».'],
      ['4 · Medir', 'Potenciómetro (de pedal o biela) o, como mínimo, una subida de 20 min siempre igual cada 6–8 semanas. Con vatios se entrena, se dosifica la carrera y se ve el progreso.'],
      ['5 · Vatios por kilo', 'Subir la FTP y bajar grasa despacio (≈ 0,5 % del peso por semana como máximo), con proteína y carbohidrato en los días duros' + c('mountjoy') + '.'],
      ['6 · Comer en la bici', '60–90 g de carbohidrato por hora en salidas largas y en carreras. Sostiene la potencia de la segunda mitad y se entrena como cualquier otra cosa' + c('jeukendrup') + '.'],
      ['7 · Fuerza dos veces por semana', 'Pesada y sin fallo: mejora la potencia al final de 3 h de bici' + c('ronnestad11') + '. La barra y el V-taper suman, pero la clave es la pierna.'],
      ['8 · Dormir', 'Dormir poco empeora el rendimiento de resistencia y la recuperación' + c('fullagar') + '. Con el colegio desde el 14 ene, proteger 7–8 h vale más que una sesión extra.'],
      ['9 · Vatios gratis', 'En llano, la mayor parte de la resistencia es el aire' + c('debraux') + ': posición más baja y estable, ropa ajustada, neumáticos buenos a la presión correcta. Ajuste de bici para no lesionarte' + c('clarsen') + '.'],
      ['10 · Correr con cabeza', 'Saber ir a rueda, dosificar las subidas y comer a tiempo gana minutos sin un vatio más. Se aprende en salidas de grupo y carreras «B».']
    ], function (s) { return "<article class='gcard'><h5>" + s[0] + '</h5><p>' + s[1] + '</p></article>'; }), true);

    var plan = U.acc('Cómo se vería un año «bici primero»', U.coach('Propuesta para 2027 (se ajusta en el plan con tu visto bueno)',
      '<ul><li><b>Semana tipo (8–10 h):</b> 3 salidas Z2 (una larga de 3–4 h comiendo), 2 sesiones de calidad en bici (martes series cortas, jueves o viernes umbral), fuerza 2 × 30 min, carrera fácil 3–4 días + la milla de la racha.</li>' +
        '<li><b>Correr:</b> mantener fácil y constante con una sesión suave de ritmo; sin perseguir marcas hasta tener 6 meses sin dolor de pie.</li>' +
        '<li><b>Bloques:</b> 3 semanas de carga + 1 de descarga; test de 20 min (o de FTP con potenciómetro) al final de cada 2 bloques.</li>' +
        '<li><b>Carreras:</b> 4–6 objetivos «A» al año; el resto, entrenamientos con dorsal.</li>' +
        '<li><b>Metas realistas:</b> la comunidad suele contar +10–20 % de FTP en el primer año estructurado de alguien con base; luego, pocos % por año. Si tu FTP real ronda 2,5 W/kg, llegar a 3,3 W/kg es un plan de 2–3 años: alcanzable, no inmediato.</li></ul>' +
        '<p><small>Los porcentajes de mejora anual son lo que repite la comunidad (r/Velo, foros de TrainerRoad y Zwift), no un dato de estudio. Tu primer test te dirá de dónde partes.</small></p>'));

    return U.modhead('27', 'Bici o correr: ¿dónde están tus números buenos?', 'No élite, pero bueno de verdad. Qué significa «bueno» en cada deporte, dónde estás tú hoy (calculado con tus datos) y qué dice la evidencia que lo produce.') +
      veredicto + kp + niveles + porQue + salsa + plan + U.acc('Referencias', lista());
  }

  App.mods.push({ id: 'salsa', nom: 'Bici o correr', tab: 'Bici o correr', icono: 'M5 17a3 3 0 1 0 0 .01M19 17a3 3 0 1 0 0 .01M5 17l4-8h6l4 8M9 9l3 8', render: render });
})(this);
