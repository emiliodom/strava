/* prevencion.js — Módulo 10: espalda baja, calambres y equilibrio al subir. Las rutinas salen de plan.js (P.RUTINAS.P y .E),
   las mismas que aparecen en el detalle de cada día del calendario. */
(function (global) {
  'use strict';
  var App = global.App, U = App.ui, esc = App.esc, P = App.plan;
  var C = function (t, h) { return U.coach(t, h); };

  function rutina(k, titulo) {
    var r = P.RUTINAS[k];
    if (!r) return '';
    return '<p><b>' + esc(titulo) + ' · ' + r.min + ' min</b></p><ol>' + r.items.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ol>';
  }

  function render() {
    return U.modhead('10', 'Espalda, calambres y equilibrio', 'Lo que pasó en la última subida (dolor lumbar), cómo evitar que se repita y cómo prevenir calambres y pérdida de equilibrio en la cuesta. Las rutinas ya están dentro del calendario.') +
      U.note('Honestidad', 'Esto es preparación general, no un diagnóstico. Si el dolor baja con los días, lo normal es una sobrecarga muscular. Pero si se repite pese a todo lo de abajo, se queda más de 1–2 semanas o aparece alguna de las señales de alarma, ve con un fisioterapeuta o médico del deporte: puede mirar en persona tu ajuste de la bici y tu movimiento.', 'warn') +

      U.acc('Señales de alarma: cuándo parar y consultar', C('No lo aguantes',
        '<ul><li>Dolor que baja por la pierna <b>por debajo de la rodilla</b>, hormigueo o entumecimiento en pierna o pie.</li>' +
        '<li>Debilidad al levantar el pie, o entumecimiento en la zona del sillín.</li>' +
        '<li>Cualquier cambio al orinar o al evacuar, o fiebre junto con el dolor de espalda.</li>' +
        '<li>Dolor intenso tras una caída o un golpe, o que te despierta de noche.</li>' +
        '<li>Dolor que no baja tras 1–2 semanas o que empeora en cada rodada.</li></ul>' +
        '<p>Con cualquiera de estas, no es de «estirar más»: consulta antes de volver a las pruebas fuertes.</p>'), true) +

      U.acc('Espalda baja en las subidas: por qué pasa y cómo evitarlo', C('Postura fija, cadera cerrada y core cansado',
        '<p>En una subida larga sentado la pelvis se inclina, la espalda queda flexionada y el core trabaja durante horas; cuando se cansa, la <b>zona lumbar carga con lo que deberían sostener el abdomen y los glúteos</b>. Los flexores de cadera acortados por muchas horas de bici y de oficina empeoran el cuadro, y empujar una marcha pesada a baja cadencia aumenta la carga sobre la espalda.</p>' +
        '<p><b>En la bici (lo que cambias hoy mismo):</b></p>' +
        '<ul><li><b>Cadencia de 75–90 rpm</b> en las subidas: baja de marcha antes de que el pedal se endurezca.</li>' +
        '<li><b>Cambia de postura cada 5–10 min:</b> de pie 20–30 s, o adelántate y vuelve al fondo del sillín. La postura fija es lo que más duele.</li>' +
        '<li><b>Inclina la pelvis hacia delante</b> (como mostrar el ombligo al manillar) y mantén el pecho abierto; no cuelgues del manillar.</li>' +
        '<li><b>Brazos relajados y codos flexionados:</b> si los brazos sostienen el peso, la espalda lo paga.</li>' +
        '<li><b>Ajuste:</b> un sillín demasiado alto o muy atrás, o un alcance largo, obligan a la zona lumbar a estirarse. Pide una revisión de la altura del sillín, su retroceso y la longitud de la potencia: es la solución más barata si el dolor se repite.</li>' +
        '<li><b>Activa la espalda</b> con la rutina de abajo antes de una rodada larga y repítela al terminar.</li></ul>' +
        rutina('P', 'Rutina «espalda baja y cadera»') +
        '<p><small>Todo debe sentirse bien. Si un movimiento duele, reduce el rango o sáltalo.</small></p>'), true) +

      U.acc('Calambres: qué dice la evidencia y qué hacer', C('Sobre todo fatiga, y también sodio y calor',
        '<p>La explicación más sólida (Schwellnus) es la <b>fatiga neuromuscular</b>: el músculo se sobrecarga por un esfuerzo mayor al que está preparado y fallan los reflejos que lo relajan. La deshidratación y el sodio influyen sobre todo con calor y sudor abundante, pero no son la única causa.</p>' +
        '<p><b>Prevención:</b></p>' +
        '<ul><li><b>Ritmo:</b> los calambres aparecen casi siempre cuando se pasa del ritmo para el que estás entrenado (arrancar fuerte, subir de golpe). Sube de forma progresiva durante la primera hora.</li>' +
        '<li><b>Cadencia:</b> moler una marcha pesada es la causa más común de calambres de cuádriceps en bici; gira más suave.</li>' +
        '<li><b>Sodio y líquido:</b> 400–800 mL/h con 300–600 mg de sodio por litro en calor; empieza desde el inicio, no cuando ya duele.</li>' +
        '<li><b>Carbohidrato:</b> 60 g/h en rodadas de más de 2 h; con el glucógeno bajo la fatiga llega antes.</li>' +
        '<li><b>Fuerza específica:</b> la sentadilla búlgara y el peso muerto a una pierna (rutina A) y el trabajo de pantorrilla de la rutina de equilibrio cargan los músculos que más calambre dan.</li>' +
        '<li><b>Magnesio de noche</b> si ya lo tomas: la evidencia es modesta, pero no cuesta nada.</li></ul>' +
        '<p><b>Si te da en plena subida:</b> baja la intensidad (no hace falta bajarte), estira suave el músculo afectado 20–30 s, masajéalo y toma sodio y líquido. Algunos deportistas usan un trago pequeño (60–80 mL) de salmuera de encurtido, que podría cortar el espasmo por un reflejo en la boca; la evidencia es limitada, así que pruébalo en un entreno, no en una prueba.</p>'), false) +

      U.acc('Equilibrio al subir: causas y técnica', C('Peso bien repartido, marcha lista y piernas estables',
        '<p>Perder el equilibrio en una subida suele ser un problema de <b>tracción y posición</b>: si el peso se va hacia atrás se levanta la rueda delantera, y si se va demasiado adelante patina la trasera. La fatiga de glúteos y core, y la marcha equivocada, hacen el resto.</p>' +
        '<ul><li><b>Mira 3–5 m adelante</b>, no la rueda delantera: el cuerpo va hacia donde miras.</li>' +
        '<li><b>Elige la marcha antes de la rampa,</b> no durante: cambiar con el pedal cargado te frena en seco y te desequilibra.</li>' +
        '<li><b>Posición:</b> caderas adelante en el sillín, pecho bajo y codos abiertos; en lo empinado, pecho hacia el manillar sin levantar la rueda delantera.</li>' +
        '<li><b>Pedaleo redondo,</b> sin acelerones: la tracción se pierde con golpes de potencia.</li>' +
        '<li><b>Presión de las llantas:</b> más baja en el tramo técnico mejora el agarre; pruébalo antes de la prueba.</li>' +
        '<li><b>Práctica:</b> una cuesta corta de 30–60 s repetida 4–6 veces, sentado y de pie, a ritmo controlado, una vez por semana.</li></ul>' +
        rutina('E', 'Rutina «equilibrio y estabilidad»')), false) +

      U.acc('Dónde está esto en el calendario', C('Tres veces por semana, más después de las rodadas largas',
        '<ul><li><b>Prevención lumbar (12 min):</b> lunes, miércoles y viernes, y al terminar cada MTB larga (Campanabaj, Entre Senderos, Xab Sibaná). Aparece en la descripción del día y en la pestaña «Sesión».</li>' +
        '<li><b>Equilibrio (10 min):</b> jueves y sábado.</li>' +
        '<li><b>No sustituyen</b> a la fuerza A/B ni a la calidad: se hacen aparte, en casa, sin pesas y sin fatiga.</li></ul>' +
        '<p>Si una semana la espalda está cargada, deja sólo la prevención lumbar y salta el equilibrio.</p>'), false);
  }

  App.mods.push({ id: 'prevencion', nom: 'Espalda y equilibrio', tab: 'Espalda', icono: 'M12 3a2 2 0 100 4 2 2 0 000-4zM12 8v6M8 21l4-7 4 7M7 11h10', render: render });
})(this);
