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
    ['castellani', 'Castellani JW, Tipton MJ (2015). Cold stress effects on exposure tolerance and exercise performance. Compr Physiol 6:443–469.', '10.1002/cphy.c140081']
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
    ['2026-12-07', 'Bici · referencia 1', 'Greenway, tramo plano, mismo sentido: 15 min suave + 20 min a tope + 15 min suave. Anota distancia, velocidad, FC media y viento.', 'Sin potenciómetro no es la FTP: es tu punto de partida en Charlotte.'],
    ['2027-01-04', 'Bici · referencia 2', 'La misma prueba, mismo tramo y sentido, a la misma hora.', 'Si vas más rápido con el mismo pulso (o igual de rápido con menos), la bici se mantuvo o mejoró.'],
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
        U.kpi('Meta en bici', 'Mantener', 'referencias 7 dic y 4 ene'),
        U.kpi('Fuerza', '1–2 por semana', 'peso corporal + barra')
      ]) +

      U.acc('Qué puede mejorar y qué no', cards([
        ['Correr: resistencia', 'Lo que más rinde. La tirada larga del domingo sube de 10 a 14–15 km, a 6:30–7:00/km y FC baja. No subas más de una tirada y unos 3–5 km semanales por semana' + c('lauersen') + '.', 'Puede mejorar'],
        ['Correr: velocidad', 'El tempo y los HIIT del Greenway ya están en el plan, con los ritmos del VDOT 40 (umbral ≈ 5:04/km). Con frío salen más rápidos al mismo esfuerzo: no te asustes ni te pases.', 'Puede mejorar'],
        ['Bici', 'Una salida por semana, ahora con 3 × 8 min fuertes dentro. Si hay sol al mediodía el fin de semana, una segunda salida suave suma. Sin intensidad, el VO₂máx empieza a caer en 2–4 semanas' + c('mujikaPadilla') + '.', 'Mantener'],
        ['Fuerza sin pesas', 'Rutina K (peso corporal) 1–2 veces por semana: sentadilla búlgara, puente a una pierna, elevación de talones, flexiones. Una barra de puerta convierte Charlotte en un bloque de dominadas (Guía › Barra).', 'Mantener o subir'],
        ['Peso y fiestas', 'Thanksgiving (26 nov) y Navidad caen dentro. Sin déficit agresivo con más kilómetros a pie: proteína en cada comida y que los días de fiesta sean días, no semanas.', 'Cuidar'],
        ['Sueño', 'Charlotte va una hora por delante: acostarte a la hora de Charlotte desde el primer día. Las mañanas son oscuras: correr 6:00–7:15 pide luces.', 'Cuidar']
      ], function (f) { return "<article class='gcard'><h5>" + f[0] + "</h5><span class='ver'>" + f[2] + '</span><p>' + f[1] + '</p></article>'; }), true) +

      U.acc('Entrenar con frío', U.coach('Lo práctico',
        '<p>Charlotte en diciembre y enero: máximas de unos 10–13 °C y mínimas cerca de 0 °C, con mañanas bajo cero algunas semanas. El frío no daña al que va bien abrigado y moviéndose; lo que limita es la pérdida de calor en manos, pies y cara, y la potencia de los músculos fríos' + c('castellani') + '.</p>' +
        '<ul><li><b>Capas por temperatura al correr:</b> más de 10 °C, camiseta de manga larga · 5–10 °C, manga larga y mallas o cortos con guantes finos · 0–5 °C, capa térmica + cortavientos, mallas, guantes, gorro · bajo 0 °C, lo mismo más cuello y calcetines gruesos. Sales con algo de frío: a los 10 min sobra calor.</li>' +
        '<li><b>Bici, más frío que correr:</b> el viento de tu propia velocidad (20–25 km/h) baja la sensación unos 5–8 °C. Bajo 5 °C: guantes gruesos, cubrezapatillas, cortavientos y bajadas cortas. Si hay hielo o la sensación es de −5 °C o menos, la bici va al mediodía o se cambia por correr.</li>' +
        '<li><b>Calentamiento:</b> 5–10 min dentro (movilidad, saltos suaves) antes de salir y los primeros 10 min muy suaves. Las series no empiezan hasta estar caliente.</li>' +
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
