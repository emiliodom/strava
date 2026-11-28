/* barrancas.js — Pestaña «Barrancas» de la Guía de resistencia (módulo 31): preparación específica para el Reto Las Barrancas
   (16 ene 2027 · 55 km gravel de montaña + asfalto · 1.500 m D+ y 1.500 m D−), puente desde Charlotte y táctica de subida/bajada. */
(function (global) {
  'use strict';
  var App = global.App, U = App.ui, F = App.fmt, DT = App.date, esc = App.esc;

  function cards(arr, fn) { return "<div class='gcards'>" + arr.map(fn).join('') + '</div>'; }

  function render() {
    var hoy = DT.iso(new Date());
    var dias = Math.max(0, DT.diffDays(DT.d(hoy), DT.d('2027-01-16')));
    var cita = App.guiaRefs ? App.guiaRefs.cita : function () { return ''; };

    return U.modhead('31', 'Reto Las Barrancas · 16 de enero', 'Objetivo principal: 55 km de gravel de montaña y asfalto con 1.500 m de subida y 1.500 m de bajada, tres días después de volver de Charlotte.') +

      U.coach('El reto en una frase',
        '<p><b>1.500 m de subida te vacían si arrancas en Z3; 1.500 m de bajada te rompen si llegas sin piernas ni frenos.</b> A ~27 m/km promedio, es una prueba de 3,5 a 5 horas donde la gestión energética, la fuerza lumbar y el control en transición grava ↔ asfalto pesan más que la velocidad punta.</p>' +
        '<p>Llegas de Charlotte el <b>13 de enero a las 22:00</b> tras siete semanas de frío y terreno plano/colinas. La buena noticia: el bloque de tiradas largas a pie, el trail en Crowders y los bloques de torque al mediodía construyen exactamente el motor y la resistencia excéntrica que necesitas.</p>') +

      U.kpis([
        U.kpi('Faltan', dias === 0 ? 'Hoy' : dias + ' días', 'sábado 16 ene 2027'),
        U.kpi('Distancia', '55 km', 'gravel de montaña + asfalto'),
        U.kpi('Desnivel', '+1.500 / −1.500 m', '≈27 m/km acumulados'),
        U.kpi('Duración est.', '3,5–5 h', '60–80 g/h de carbohidrato')
      ]) +

      U.acc('1. Cómo entrenar los 1.500 m desde Charlotte (con frío)', cards([
        ['Torque en bici (mediodía)', 'En las salidas de sábado al mediodía (3 × 8 min), haz 4 min a cadencia baja sentado (55–65 rpm, desarrollo duro) + 4 min a cadencia ágil (85–90 rpm). Simula la fuerza de rampa larga sin necesitar montaña.', 'Fuerza de subida'],
        ['Trail excéntrico (Crowders)', 'En las salidas de montaña del sábado, sube caminando fuerte con zancada corta (sin dar pasos largos que carguen el lumbar) y baja con pasos rápidos y controlados. Eso blinda los cuádriceps para aguantar 1.500 m de bajada en bici.', 'Resistencia de bajada'],
        ['Fuerza sin pesas (Rutina K)', '1–2 veces por semana: sentadilla búlgara, puente a una pierna y elevación de talones. Mantienen la fuerza de empuje en rampa y la estabilidad de tobillo/rodilla sin gimnasio' + cita('bickel') + '.', 'Pierna y estabilidad'],
        ['Espalda lumbar (Rutina P)', '12 min lun/mié/vie (gato-camello, bird-dog, dead bug, plancha lateral). En Colomba la espalda avisó en la última subida: 1.500 m D+ sentado exigen core resistente antes que vatios máximos.', 'Cero dolor lumbar']
      ], function (x) { return "<article class='gcard'><h5>" + esc(x[0]) + "</h5><span class='ver'>" + esc(x[2]) + '</span><p>' + x[1] + '</p></article>'; }), true) +

      U.acc('2. Táctica para los +1.500 m de subida', U.coach('Dosificación, cadencia y combustible',
        '<ul>' +
        '<li><b>Primeros 45–60 min en Z2 alta:</b> no sigas ataques ni ruedas rápidas en la primera rampa. Quien pasa a Z3–Z4 en la primera hora paga la deuda en el último tercio.</li>' +
        '<li><b>Cadencia según superficie:</b> en asfalto sube sentado a 75–85 rpm; en gravel de montaña baja a 65–75 rpm manteniendo peso atrás para no perder tracción en la rueda trasera.</li>' +
        '<li><b>Cuándo bajar a empujar:</b> si una rampa suelta te obliga a ir por encima del 90 % de tu FC máx. o patina la cubierta, caminar rápido empujando la bici gasta menos energía y protege la espalda baja.</li>' +
        '<li><b>Comida y sodio (lección de Entre Senderos):</b> <b>60–80 g de carbohidrato por hora</b> y <b>500–750 ml/h con sodio</b> desde el minuto 20' + cita('jeukendrup') + '. En salida fresca de mañana es fácil olvidar beber; pon alarma cada 20 min.</li>' +
        '</ul>')) +

      U.acc('3. Táctica y técnica para los −1.500 m de bajada', cards([
        ['Postura y reparto de peso', 'Talones abajo, codos y rodillas semiflexionados como suspensión, pecho bajo y mirada 15–20 m adelante. No te quedes sentado ni rígido en los baches.', 'Control'],
        ['Frenos y fatiga de manos', 'Usa un solo dedo (índice) en la leva para conservar cuatro dedos en el manillar. En bajadas largas de 20–30 min, suelta y sacude brevemente una mano cada vez en tramos rectos de asfalto para evitar calambres en antebrazos.', 'Manos frescas'],
        ['Transición gravel ↔ asfalto', 'Frena SIEMPRE antes de entrar a la curva sobre asfalto o terreno firme; nunca toques el freno delantero inclinado sobre grava suelta. Si dudas en una curva ciega con piedra suelta, baja velocidad antes.', 'Cero caídas'],
        ['Presión y cubiertas', 'Busca un punto medio que absorba la piedra sin flanear en curva de asfalto (si usas tubeless, revisa líquido sellador). Demasiada presión te hace rebotar en grava y multiplica la fatiga de brazos y piernas.', 'Agarre']
      ], function (x) { return "<article class='gcard'><h5>" + esc(x[0]) + "</h5><span class='ver'>" + esc(x[2]) + '</span><p>' + esc(x[1]) + '</p></article>'; }), true) +

      U.acc('4. Puente Charlotte → Reto Las Barrancas (13–16 ene)', U.coach('Del frío al calor en 72 horas',
        '<ul>' +
        '<li><b>Martes 13 ene (llegada 22:00):</b> vuelo + milla de la racha; hidratación con electrolitos y dormir.</li>' +
        '<li><b>Miércoles 14 ene:</b> 4 km suaves + 45 min bici Z1–Z2 para soltar el viaje y empezar a sentir el calor de Retalhuleu (sin intensidad: no se gana forma en 48 h, pero sí se pierde frescura).</li>' +
        '<li><b>Viernes 15 ene (víspera):</b> 35 min bici muy suave con 3 × 1 min alegre + 2 km trote + 4 rectas. <b>Revisión obligatoria:</b> pastillas de freno (1.500 m D− las consumen rápido), cubiertas/sellador, cadena lubricada y 250–350 g de carbohidrato listos.</li>' +
        '<li><b>Sábado 16 ene (Reto Las Barrancas):</b> 10 min de calentamiento progresivo antes de salir, agua con sodio extra (pierdes la aclimatación al calor tras 7 semanas en Charlotte) y milla de la racha + prevención lumbar 12 min al terminar.</li>' +
        '</ul>'));
  }

  App.mods.push({ id: 'barrancas', nom: 'Reto Las Barrancas', tab: 'Barrancas', icono: 'M3 20l7-12 4 6 3-4 4 10H3z', render: render });
})(this);
