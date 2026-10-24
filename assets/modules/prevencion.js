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
    return U.modhead('10', 'Pie, espalda, calambres y equilibrio', 'Primero, el golpe en el dedo del pie: síntomas, analgésicos y cómo volver. Después, lo que pasó en la última subida (dolor lumbar), cómo evitar que se repita y cómo prevenir calambres y pérdida de equilibrio en la cuesta. Las rutinas ya están dentro del calendario.') +
      U.note('Honestidad', 'Esto es preparación general, no un diagnóstico. Si el dolor baja con los días, lo normal es una sobrecarga muscular. Pero si se repite pese a todo lo de abajo, se queda más de 1–2 semanas o aparece alguna de las señales de alarma, ve con un fisioterapeuta o médico del deporte: puede mirar en persona tu ajuste de la bici y tu movimiento.', 'warn') +

      (P.PAUSA && P.PAUSA.activa ? U.note('Entrenamiento en pausa', esc(P.PAUSA.motivo) + ' Lo de abajo es información general para llegar bien a la consulta: no sustituye la radiografía ni al médico.', 'warn') : '') +

      U.acc('Dedo del pie posiblemente roto: síntomas, de más leve a más serio', C('Un golpe seco puede ser moretón… o fractura',
        '<p>Un golpe contra un objeto duro (patada a un bloque, algo que cae sobre el pie) causa desde un moretón hasta una <b>fractura de falange</b> o de metatarsiano. Sólo la radiografía lo confirma. Esto orienta; <b>no es un diagnóstico</b>.</p>' +
        '<h4>Lo que suele indicar fractura (y no sólo contusión)</h4>' +
        '<ul><li><b>Dolor agudo e inmediato</b> al golpe, a veces con un «crac» o chasquido que se oye o se siente.</li>' +
        '<li><b>Dolor puntual sobre el hueso:</b> al presionar con la yema del dedo una línea del hueso duele mucho más que el tejido de alrededor.</li>' +
        '<li><b>Hinchazón</b> que sube en minutos u horas: el dedo se ve «como salchicha» y el calzado ya no cabe.</li>' +
        '<li><b>Moretón</b> que aparece a las 24–48 h, morado y luego verde-amarillo, y que puede extenderse al dedo vecino, a la planta o al empeine.</li>' +
        '<li><b>Dolor al apoyar o al despegar el pie</b> (justo la fase de empuje al correr), cojera o necesidad de caminar de lado.</li>' +
        '<li><b>Dolor al mover el dedo</b> o rigidez. Ojo: <b>poder moverlo no descarta la fractura</b>; es un mito frecuente.</li>' +
        '<li><b>Sangre bajo la uña</b> (mancha oscura, dolor que palpita): puede acompañar una fractura de la punta del dedo.</li></ul>' +
        '<h4>Lo que obliga a ir hoy a urgencias</h4>' +
        '<ul><li>El dedo se ve <b>torcido, acortado, girado</b> o montado sobre el vecino.</li>' +
        '<li><b>Herida abierta</b>, hueso a la vista o uña arrancada con sangrado (riesgo de fractura expuesta e infección; pregunta por el tétanos).</li>' +
        '<li>Dedo <b>pálido, frío, azulado</b> o con <b>entumecimiento/hormigueo</b>: puede haber daño de nervio o de circulación.</li>' +
        '<li>Dolor intenso (7/10 o más) que <b>no cede con analgésico</b>, o que te despierta de noche.</li>' +
        '<li>Fiebre, calor local, enrojecimiento que avanza o pus en los días siguientes.</li></ul>' +
        '<h4>Dedo gordo frente a dedos pequeños</h4>' +
        '<ul><li><b>Dedos 2.º–5.º:</b> casi siempre se tratan con vendaje al dedo vecino («buddy taping») y calzado rígido; unas 4–6 semanas hasta caminar normal y algo más hasta correr.</li>' +
        '<li><b>Dedo gordo:</b> soporta buena parte del empuje al correr y de la presión del pedal; la fractura pesa más. Suele pedir bota o suela rígida, 6–8 semanas o más, y a veces cirugía si hay desplazamiento o si toca la articulación.</li>' +
        '<li><b>Dolor en el dorso o el borde externo del pie</b> en vez de en el dedo: puede ser un metatarsiano (el 5.º se rompe con golpes laterales). También pide radiografía.</li></ul>' +
        '<h4>Qué preguntar en la consulta</h4>' +
        '<ul><li>¿Qué hueso y cuál dedo? ¿Está desplazada o entra a la articulación?</li>' +
        '<li>¿Bota, zapato rígido o vendaje? ¿Cuántos días sin apoyar?</li>' +
        '<li>¿Puedo nadar? ¿Puedo pedalear (el pedal presiona el antepié) y con qué calzado?</li>' +
        '<li>¿Cuándo caminar sin dolor, cuándo trotar y qué señales me hacen parar?</li>' +
        '<li>¿Qué analgésicos son seguros para mí? ¿Calcio y vitamina D?</li></ul>'), true) +

      U.acc('Analgésicos de venta libre: qué suele usarse y qué cuidar', C('Primero paracetamol; el ibuprofeno con criterio',
        '<p><b>Información general para adultos sanos, no una receta.</b> Lee la etiqueta (los nombres comerciales cambian: busca el principio activo) y confirma con el médico o el farmacéutico, sobre todo si tomas otros medicamentos.</p>' +
        '<ul><li><b>Paracetamol (acetaminofén):</b> 500–1.000 mg cada 6–8 h; no pases de 3 g al día (4 g es el tope de la etiqueta). Es la primera opción cuando se sospecha fractura: no irrita el estómago, no aumenta el sangrado y no se ha ligado a una consolidación más lenta. Cuidado con el <b>alcohol</b> y con los productos «para la gripa» que ya lo traen: se suma sin darte cuenta.</li>' +
        '<li><b>Ibuprofeno:</b> 200–400 mg cada 6–8 h, <b>con comida</b>; el tope de venta libre es 1.200 mg al día (más sólo bajo indicación médica). Baja dolor e inflamación. Con una posible fractura, muchos médicos prefieren esperar a la radiografía y, si lo usan, que sea <b>pocos días</b>: hay estudios que sugieren que los antiinflamatorios en dosis altas o muy prolongadas podrían retrasar la consolidación (la evidencia en personas es mixta). En las primeras 48 h con mucho moretón se suele evitar.</li>' +
        '<li><b>Combinar ambos:</b> si el dolor lo exige, se pueden alternar (por ejemplo uno cada 3–4 h) sin pasar el máximo de cada uno; suele dar más alivio que subir la dosis de uno solo.</li>' +
        '<li><b>Naproxeno</b> funciona como el ibuprofeno (cada 8–12 h); <b>no tomes dos antiinflamatorios a la vez</b>. <b>Evita la aspirina</b>: aumenta el sangrado y el moretón.</li>' +
        '<li><b>Gel de diclofenaco</b> sobre piel sana (nunca sobre una herida): alivia con muy poca absorción al cuerpo, útil si no quieres pastillas.</li>' +
        '<li><b>Opioides y tramadol:</b> sólo con receta y para un dolor que no se controla; no hacen falta para un dedo.</li></ul>' +
        '<p><b>No uses antiinflamatorios si:</b> tienes úlcera o gastritis, enfermedad de riñón, asma que empeora con aspirina, estás embarazada, tomas anticoagulantes, o vas a estar deshidratado. <b>Como haces deporte de resistencia:</b> no tomes un antiinflamatorio antes ni durante un esfuerzo largo con calor (riesgo para el riñón).</p>' +
        '<div class="note warn"><p><b>El analgésico no es permiso para entrenar.</b> El dolor es lo que te impide cargar un hueso roto; taparlo y correr puede desplazar la fractura y convertir 4 semanas en 3 meses o en cirugía. Entrena sólo cuando el médico lo autorice, no cuando la pastilla haga efecto.</p></div>' +
        '<p><b>Sin pastillas:</b> pie por encima del corazón varias veces al día, hielo envuelto en un paño 10–15 min (no directo sobre la piel), calzado de suela rígida y reposo relativo. La evidencia sobre el hielo es discreta: úsalo para estar cómodo, no como tratamiento.</p>' +
        '<p><b>Mientras sana:</b> proteína sin recortar (1,6–2 g/kg), calcio y vitamina D en la dieta (lácteos, huevo, pescado, sol), nada de tabaco y <b>sin déficit calórico fuerte</b>: con poca energía el hueso consolida más despacio. Por eso la meta de comida está en mantenimiento mientras dure la pausa.</p>'), true) +

      U.acc('Cómo volver: bici, caminata y después trote', C('Por pasos, y el dolor manda',
        '<ul><li><b>Lo ideal:</b> radiografía y visto bueno del médico. Mientras tanto el calendario (22 oct–4 nov) va por bici sentado, caminata, pesas sin cargar el pie y boxeo sin desplazamiento; si el dolor sube en lugar de bajar, vuelve a la pausa y consulta.</li>' +
        '<li><b>Criterio para volver:</b> caminar sin dolor 2 días seguidos y sin cojera; luego trote suave de 2–3 km con dolor menor a 3/10. Si el dolor sube, vuelve un paso atrás.</li>' +
        '<li><b>Orden sugerido:</b> caminata → natación sin empujar la pared → bici suave sólo si el pedal no duele → trote corto → fácil → calidad. La calidad vuelve última y con dos días sin dolor.</li>' +
        '<li><b>Mientras tanto:</b> tren superior y core sin cargar el pie, y la prevención lumbar si el médico no lo prohíbe. Nada de sprints, saltos, zancadas ni elevaciones de talón.</li>' +
        '<li><b>La racha de la milla:</b> es una decisión tuya con el médico. Correr con una posible fractura puede desplazarla; pregúntale si caminar una milla con suela rígida es aceptable.</li></ul>' +
        rutina('Z', 'Rutina «core y tren superior sin cargar el pie»')), false) +

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

  App.mods.push({ id: 'prevencion', nom: 'Pie, espalda y equilibrio', tab: 'Espalda', icono: 'M12 3a2 2 0 100 4 2 2 0 000-4zM12 8v6M8 21l4-7 4 7M7 11h10', render: render });
})(this);
