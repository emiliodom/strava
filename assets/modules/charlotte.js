/* charlotte.js — Pestaña «Charlotte» de la Guía de resistencia (módulo 28): qué se puede mejorar en los 49 días de
   Charlotte (25 nov–13 ene) con frío y sin pesas, cómo entrenar en frío, las pruebas de referencia y la vuelta al calor.
   Referencias propias comprobadas en Crossref; las compartidas se toman de App.guiaRefs.raw. */
(function (global) {
  'use strict';
  var App = global.App, U = App.ui, F = App.fmt;

  var PROPIAS = [
    ['ely', 'Ely MR, Cheuvront SN, Roberts WO, Montain SJ (2007). Impact of weather on marathon-running performance. Med Sci Sports Exerc 39:487–493.', '10.1249/mss.0b013e31802d3aba'],
    ['tanaka94', 'Tanaka H (1994). Effects of cross-training: transfer of training effects on VO2max between cycling, running and swimming. Sports Med 18:330–339.', '10.2165/00007256-199418050-00005'],
    ['bickel', 'Bickel CS, Cross JM, Bamman MM (2011). Exercise dosing to retain resistance training adaptations in young and older adults. Med Sci Sports Exerc 43:1177–1187.', '10.1249/MSS.0b013e318207c15d'],
    ['daanen', 'Daanen HAM, Racinais S, Périard JD (2018). Heat acclimation decay and re-induction: a systematic review and meta-analysis. Sports Med 48:409–430.', '10.1007/s40279-017-0808-x'],
    ['castellani', 'Castellani JW, Tipton MJ (2015). Cold stress effects on exposure tolerance and exercise performance. Compr Physiol 6:443–469.', '10.1002/cphy.c140081'],
    ['galloway', 'Galloway SDR, Maughan RJ (1997). Effects of ambient temperature on the capacity to perform prolonged cycle exercise in man. Med Sci Sports Exerc 29:1240–1249.', '10.1097/00005768-199709000-00018'],
    ['oksa', 'Oksa J (2002). Neuromuscular performance limitations in cold. Int J Circumpolar Health 61:154–162.', '10.3402/ijch.v61i2.17448'],
    ['castellaniYoung', 'Castellani JW, Young AJ (2016). Human physiological responses to cold exposure: acute responses and acclimatization to prolonged exposure. Auton Neurosci 196:63–74.', '10.1016/j.autneu.2016.02.009'],
    ['carlsen', 'Carlsen KH (2012). Sports in extreme conditions: the impact of exercise in cold temperatures on asthma and bronchial hyper-responsiveness in athletes. Br J Sports Med 46:796–799.', '10.1136/bjsports-2012-091292'],
    ['osczevski', 'Osczevski R, Bluestein M (2005). The new wind chill equivalent temperature chart. Bull Am Meteorol Soc 86:1453–1458.', '10.1175/BAMS-86-10-1453']
  ];
  var DE_GUIA = ['mujikaPadilla', 'seiler', 'lauersen'];
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
  function cards(arr, fn) { return "<div class='gcards'>" + arr.map(fn).join('') + '</div>'; }

  // Pruebas de referencia: también están en el plan (AGENDA de ajuste.js).
  var PRUEBAS = [
    ['2026-12-05', 'Bici · referencia 1 (sábado, mediodía)', 'Greenway, tramo plano, mismo sentido, entre 12:00 y 15:00: 15 min suave + 20 min a tope + 15 min suave. Anota distancia, velocidad, temperatura y viento (el pulso de muñeca falla con frío).', 'Sin potenciómetro no es la FTP: es tu punto de partida en Charlotte.'],
    ['2027-01-02', 'Bici · referencia 2 (sábado, mediodía)', 'La misma prueba, mismo tramo, sentido y hora; compara con una temperatura parecida.', 'Si vas más rápido con el mismo pulso (o igual de rápido con menos), la bici se mantuvo o mejoró.'],
    ['2027-01-07', 'Carrera · 5K contrarreloj', 'Greenway: 2 km suaves + 4 rectas + 5 km a tope + 2 km suaves.', 'Compárala con los 23:56 del 20 nov. Con frío y 6 semanas de constancia, 23:00–23:30 es razonable; no es una promesa.'],
    ['2027-01-30', 'Bici · FTP de 20 min en subida', 'En Retalhuleu, en una subida constante de 20 min o más sin bajadas: 20 min de calentamiento con 3 × 1 min fuerte, 5 min suave, 20 min a tope, 15 min suave. Anota tiempo, distancia y desnivel del tramo.', 'Mete los datos en Guía › Bici o correr › «Calculadora de FTP en subida». Repetirla cada 6–8 semanas en la misma subida.']
  ];

  function render() {
    var ida = new Date(Date.UTC(2026, 10, 25)), vuelta = new Date(Date.UTC(2027, 0, 13)), dias = Math.round((vuelta - ida) / 864e5);
    return U.modhead('28', 'Charlotte: 49 días con frío', 'Qué se puede mejorar del 25 nov al 13 ene, cómo entrenar con frío y sin pesas, las pruebas para medirlo y cómo volver al calor de Retalhuleu.') +

      U.coach('La respuesta corta',
        '<p><b>Sí, puedes volver mejor, sobre todo a pie.</b> El frío moderado es el mejor clima para correr: los tiempos de maratón empeoran a medida que sube el calor por encima de unos 5–10 °C' + c('ely') + ', justo al revés que en Retalhuleu. Tienes un tramo plano para velocidad, y lo que te falta a pie es exactamente lo que Charlotte permite: siete semanas de kilómetros constantes con una tirada larga que crece de 10 a 14–15 km.</p>' +
        '<p><b>En bici, el objetivo es mantener, no crecer.</b> Una o dos sesiones por semana con algo de intensidad conservan la mayor parte de la forma aeróbica durante semanas' + c('mujikaPadilla') + ', y correr más transfiere parte del motor (corazón, VO₂máx), aunque no los músculos de pedalear' + c('tanaka94') + '. <b>La fuerza</b> se mantiene meses con una sesión por semana' + c('bickel') + ': peso corporal y barra bastan.</p>') +

      U.kpis([
        U.kpi('Días en Charlotte', dias, '25 nov–13 ene'),
        U.kpi('Meta a pie', '5K 23:00–23:30', 'contrarreloj el 7 ene'),
        U.kpi('Meta en bici', 'Mantener', 'fin de semana al mediodía · pruebas 5 dic y 2 ene'),
        U.kpi('Fuerza', '1–2 por semana', 'peso corporal + barra')
      ]) +

      U.acc('Qué puede mejorar y qué no', cards([
        ['Correr: resistencia', 'Lo que más rinde, y lo que confirmó la Guatemágica: 6:02/km en 15K frente a 4:48/km en 5K es una caída mucho mayor de lo normal. La tirada larga del domingo sube de 10 a 14–15 km, a 6:30–7:00/km y FC baja. No subas más de una tirada y unos 3–5 km semanales por semana' + c('lauersen') + '.', 'Puede mejorar'],
        ['Correr: velocidad', 'El tempo y los HIIT del Greenway ya están en el plan, con los ritmos del VDOT 40 (umbral ≈ 5:04/km). Con frío salen más rápidos al mismo esfuerzo: no te asustes ni te pases.', 'Puede mejorar'],
        ['Bici', 'Con el frío real, una salida por semana al mediodía del fin de semana con 3 × 8 min fuertes (o la prueba de referencia). Si hay otro mediodía templado, una segunda salida suave suma. Sin intensidad, el VO₂máx empieza a caer en 2–4 semanas' + c('mujikaPadilla') + '.', 'Mantener'],
        ['Fuerza sin pesas', 'Rutina K (peso corporal) 1–2 veces por semana: sentadilla búlgara, puente a una pierna, elevación de talones, flexiones. Una barra de puerta convierte Charlotte en un bloque de dominadas (Guía › Barra).', 'Mantener o subir'],
        ['Pie y zapatillas', 'En el 15K del 21 nov el pie derecho se deslizaba dentro de la zapatilla y dolieron los dedos pequeños y el dedo gordo desde el km 10. Antes de subir la tirada larga: lazada de bloqueo del talón, calcetín adecuado y, si hace falta, otra talla o modelo (en Charlotte hay tiendas de running donde te miran la pisada). Si duele en reposo o en un punto del hueso, médico.', 'Cuidar'],
        ['Peso y fiestas', 'Thanksgiving (26 nov) y Navidad caen dentro. Sin déficit agresivo con más kilómetros a pie: proteína en cada comida y que los días de fiesta sean días, no semanas.', 'Cuidar'],
        ['Sueño', 'Charlotte va una hora por delante: acostarte a la hora de Charlotte desde el primer día. Las mañanas son oscuras: correr 6:00–7:15 pide luces.', 'Cuidar']
      ], function (f) { return "<article class='gcard'><h5>" + f[0] + "</h5><span class='ver'>" + f[2] + '</span><p>' + f[1] + '</p></article>'; }), true) +

      U.acc('Ajuste por frío (desde el 28 nov)', U.coach('Qué dice la ciencia y qué cambia en el plan',
        '<p><b>Correr con frío va bien; pedalear, peor.</b> Al correr produces mucho calor por kilo y vas despacio, así que el aire te enfría poco: en maratón los mejores tiempos salen con unos 5–10 °C' + c('ely') + '. En bici pasan dos cosas: el viento de tu propia velocidad multiplica la pérdida de calor (a 25 km/h con 0 °C la sensación térmica ronda los −5 °C)' + c('osczevski') + ', y el músculo frío pierde fuerza y potencia: cada grado que baja la temperatura del músculo resta rendimiento, sobre todo en esfuerzos rápidos' + c('oksa') + '. En laboratorio, el tiempo que se aguanta pedaleando fuerte fue máximo a unos 11 °C y menor a 4 °C' + c('galloway') + '.</p>' +
        '<p><b>El cuerpo se acostumbra poco al frío</b> en unas semanas: manos y cara sufren menos, pero la adaptación real es pequeña; la ropa hace casi todo el trabajo' + c('castellaniYoung', 'castellani') + '. <b>El aire frío y seco</b> irrita las vías respiratorias en esfuerzos intensos y repetidos' + c('carlsen') + ': si notas tos o pecho cerrado tras las series, cúbrete boca y nariz con un cuello y bájale a la intensidad; si se repite, consúltalo (información general).</p>' +
        '<p><b>El pulso de muñeca falla con frío:</b> el 26 nov marcó 157 de media y 173 a 6:26/km, casi igual que tu cadencia (167 pasos por minuto). Con frío, la piel de la muñeca recibe menos sangre y el sensor se engancha al paso. Usa ritmo y sensación, o la banda de pecho.</p>' +
        '<h4>Qué cambia en el plan</h4><ul>' +
        '<li><b>Entre semana, sólo correr</b> por la mañana (6:00–9:30), con las capas de abajo y 5–10 min de calentamiento dentro de casa. Las series del martes y el jueves siguen: calienta más y no empieces la primera hasta sentirte caliente.</li>' +
        '<li><b>La bici va al mediodía del fin de semana</b> (12:00–15:00, lo más templado): un sábado de cada dos, 3 × 8 min fuertes y 20–30 min de trote en tierra después; el otro sábado, trail en Crowders en coche. Las pruebas de referencia pasan al <b>5 dic y 2 ene</b> al mediodía.</li>' +
        '<li><b>Regla del día:</b> bici sólo si la sensación térmica a 25 km/h pasa de −5 °C y no hay hielo; si no, trote o trail. Mantener la forma de bici siete semanas pide poca frecuencia si hay intensidad' + c('mujikaPadilla') + '.</li>' +
        '<li><b>Si consigues un rodillo o un gimnasio con bici</b>, 45 min con 3 × 8 min fuerte cualquier tarde vale más que una salida helada: dímelo y lo meto en el plan.</li></ul>')) +

      U.acc('Entrenar con frío', U.coach('Lo práctico',
        '<p>Charlotte en diciembre y enero: máximas de unos 10–13 °C y mínimas cerca de 0 °C, con mañanas bajo cero algunas semanas. El frío no daña al que va bien abrigado y moviéndose; lo que limita es la pérdida de calor en manos, pies y cara, y la potencia de los músculos fríos' + c('castellani') + '.</p>' +
        '<ul><li><b>Capas por temperatura al correr:</b> más de 10 °C, camiseta de manga larga · 5–10 °C, manga larga y mallas o cortos con guantes finos · 0–5 °C, capa térmica + cortavientos, mallas, guantes, gorro · bajo 0 °C, lo mismo más cuello y calcetines gruesos. Sales con algo de frío: a los 10 min sobra calor.</li>' +
        '<li><b>Bici, más frío que correr:</b> el viento de tu propia velocidad (20–25 km/h) baja la sensación unos 5–8 °C. Bajo 5 °C: guantes gruesos, cubrezapatillas, cortavientos y bajadas cortas. Si hay hielo o la sensación es de −5 °C o menos, la bici va al mediodía o se cambia por correr.</li>' +
        '<li><b>Calentamiento en casa (5–10 min antes de salir):</b>' +
        '<ol><li><b>Subir temperatura (2–3 min):</b> marcha rápida, saltos suaves (jumping jacks) o 1–2 min de boxeo de sombra ligero hasta entrar en calor sin llegar a sudar.</li>' +
        '<li><b>Movilidad y activación (4–5 min):</b> gato-camello (8–10 lentos), balanceos de pierna adelante-atrás y laterales (10 por lado), puentes de glúteo con pausa de 2–3 s (10–12), sentadillas sin carga o zancadas atrás (8–10) y círculos de tobillo + elevaciones de talón (10 por lado).</li>' +
        '<li><b>Arranque fuera (primeros 10 min):</b> muy suave (Z1–Z2); en días de series (mar/jue), mete 2–4 × 20 s progresivos sólo después de 10–15 min suaves cuando el músculo ya esté caliente.</li></ol></li>' +
        '<li><b>Oscuridad:</b> amanece cerca de las 7:20. Luz frontal o de pecho, ropa reflectante y el tramo del Greenway sin cruces.</li>' +
        '<li><b>Hidratación:</b> con frío se tiene menos sed pero se sigue sudando; bebe igual en las tiradas largas.</li>' +
        '<li><b>Al volver:</b> quítate la ropa mojada enseguida; el enfriamiento de después es lo que más se nota.</li>' +
        '<li><b>Aire frío y seco:</b> si notas tos o pecho cerrado al esforzarte, cúbrete la boca con un cuello y consúltalo si se repite. Es información general.</li></ul>')) +

      U.acc('Las pruebas para medirlo', cards(PRUEBAS, function (p) {
        return "<article class='gcard'><span class='ses-k'>" + F.fecha(p[0]) + ' ' + p[0].slice(0, 4) + '</span><h5>' + p[1] + '</h5><p>' + p[2] + '</p><p><small>' + p[3] + '</small></p></article>';
      }), true) +

      U.acc('Volver al calor (14 ene en adelante)', U.coach('La aclimatación se pierde y se recupera',
        '<p>Siete semanas de frío borran buena parte de tu adaptación al calor; se recupera más rápido que la primera vez, en una o dos semanas de entrenar con calor' + c('daanen') + '.</p>' +
        '<ul><li>Los primeros 7–10 días en Retalhuleu, ritmos y vatios algo más bajos al mismo pulso: es normal.</li>' +
        '<li>La prueba de Candelaria del 23 ene llega a los 10 días: compárala sabiendo eso; la de FTP del 30 ene ya estará más cerca de tu nivel real.</li>' +
        '<li>Más agua y sal esas dos semanas, y las sesiones duras temprano.</li></ul>')) +

      U.acc('Referencias', lista());
  }

  App.mods.push({ id: 'charlotte', nom: 'Charlotte con frío', tab: 'Charlotte', icono: 'M12 2v20M4 6l16 12M20 6L4 18', render: render });
})(this);
