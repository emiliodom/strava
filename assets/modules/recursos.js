/* recursos.js — Módulo 5: nutrición, recuperación y material de estudio con enlaces comprobados. */
(function (global) {
  'use strict';
  var App = global.App, U = App.ui, F = App.fmt, h = App.h, raw = App.raw, esc = App.esc;

  /* Todos los enlaces se comprobaron uno por uno: devuelven 200 y el contenido corresponde a la cita. */
  var REFS = [
    { t: 'Nutrition and Athletic Performance', a: 'Thomas, Erdman y Burke · ACSM, Academy of Nutrition and Dietetics y Dietitians of Canada, 2016',
      u: 'https://www.dietitians.ca/DietitiansOfCanada/media/Documents/Resources/noap-position-paper.pdf',
      tag: 'libre · PDF', d: 'El documento de consenso de referencia. Si sólo vas a leer uno, lee este: carbohidratos, proteína, hidratación y periodización nutricional, todo con números.' },
    { t: 'Carbohydrate Intake During Exercise', a: 'Jeukendrup · Sports Medicine 44(S1):25–33, 2014',
      u: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4008807/',
      tag: 'libre', d: 'De dónde salen los 60–90 g/h y por qué hay que mezclar glucosa con fructosa cuando la salida pasa de 2 h 30.' },
    { t: 'Position Stand: nutrición para ultramaratón de una etapa', a: 'Tiller y cols. · Journal of the ISSN 16:50, 2019',
      u: 'https://jissn.biomedcentral.com/articles/10.1186/s12970-019-0312-9',
      tag: 'libre', d: 'Lo específico del ultra: problemas gastrointestinales, sodio, hiponatremia y qué comer cuando llevas 8 h en marcha.' },
    { t: 'Exercise and Fluid Replacement', a: 'Sawka y cols. · ACSM Position Stand, 2007',
      u: 'https://doi.org/10.1249/mss.0b013e31802ca597',
      tag: 'de pago', d: 'La guía clásica de hidratación. Clave para Retalhuleu: calor húmedo a nivel del mar, condiciones muy distintas al altiplano donde entrenas.' },
    { t: 'Effects of Strength Training on Middle- and Long-Distance Running', a: 'Blagrove, Howatson y Hayes · Sports Medicine 48:1117–1149, 2018',
      u: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5889786/',
      tag: 'libre', d: 'Revisión sistemática: la fuerza mejora la economía de carrera entre un 2 y un 8%. Es la hora de entrenamiento mejor invertida que tienes disponible.' },
    { t: 'Sleep and the athlete: consenso de expertos 2021', a: 'Walsh y cols. · British Journal of Sports Medicine 55(7):356–368, 2021',
      u: 'https://researchonline.ljmu.ac.uk/id/eprint/16297/',
      tag: 'libre · repositorio', d: 'El sueño es la herramienta de recuperación con más evidencia. Incluye un protocolo práctico de higiene del sueño.' },
    { t: 'The training—injury prevention paradox', a: 'Gabbett · British Journal of Sports Medicine 50(5):273–280, 2016',
      u: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4789704/',
      tag: 'libre', d: 'El origen del ACWR que usa el módulo 1: no es el volumen lo que lesiona, es la velocidad con la que lo subes.' },
    { t: 'Training Load and Injury Prevention, Part 2: pitfalls', a: 'Impellizzeri y cols. · Journal of Athletic Training 55(9):893–901, 2020',
      u: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7534938/',
      tag: 'libre', d: 'La crítica seria al ACWR. Léela junto con la anterior: el número es una señal útil, no una ley de la física. Esta app lo muestra, no lo venera.' },
    { t: 'Training Intensity Distribution in Well-Trained and Elite Endurance Athletes', a: 'Stöggl y Sperlich · Frontiers in Physiology 6:295, 2015',
      u: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4621419/',
      tag: 'libre', d: 'La evidencia del reparto 80/20 y por qué tu 95% fácil con 2,8% duro no es lo mismo que entrenamiento polarizado.' },
    { t: 'What is best practice for training intensity and duration distribution?', a: 'Seiler · IJSPP 5(3):276–291, 2010',
      u: 'https://pubmed.ncbi.nlm.nih.gov/20861519/',
      tag: 'resumen libre', d: 'El artículo que fundó el modelo de tres zonas. El resumen de PubMed es suficiente para entender la idea.' },
    { t: 'Monitoring training in athletes with reference to overtraining syndrome', a: 'Foster · Medicine & Science in Sports & Exercise 30(7):1164–1168, 1998',
      u: 'https://doi.org/10.1097/00005768-199807000-00023',
      tag: 'de pago', d: 'De aquí salen la monotonía y la tensión del módulo 1.' },
    { t: "Daniels' Running Formula", a: 'Jack Daniels · Human Kinetics, 4ª edición',
      u: 'https://us.humankinetics.com/products/daniels-running-formula-4th-edition',
      tag: 'libro', d: 'El VDOT y todas las zonas de ritmo que ves en esta app salen de aquí. Es el libro que te recomendaría comprar.' }
  ];

  function render(D) {
    var z = D.zonas;
    var peso = App.data.pref('peso', 70);

    var refs = "<ul class='refs'>" + REFS.map(function (r) {
      return '<li><a href="' + esc(r.u) + '" target="_blank" rel="noopener">' + esc(r.t) + '</a>' +
        "<span class='tag'>" + esc(r.tag) + '</span>' +
        "<span class='meta'>" + esc(r.a) + '</span>' +
        '<p>' + esc(r.d) + '</p></li>';
    }).join('') + '</ul>';

    var tablaCarb = U.tabla(
      [{ t: 'Duración de la sesión' }, { t: 'Carbohidrato por hora', n: true }, { t: 'En la práctica' }],
      [
        ['Menos de 45 min', '0 g', 'Agua. No hace falta nada más.'],
        ['45–75 min', 'enjuague bucal', 'Basta con enjuagarse con bebida deportiva y escupir: el efecto es nervioso, no metabólico.'],
        ['1–2 h 30', '30–60 g', 'Un gel cada 40 min, o 500 ml de bebida deportiva por hora.'],
        ['Más de 2 h 30', '60–90 g', 'Obliga a mezclar glucosa y fructosa (relación 2:1). Un solo tipo de azúcar satura el transportador.']
      ],
      { pie: 'Fuente: Jeukendrup 2014 y el consenso ACSM/AND/DC 2016.' }
    );

    var tablaProt = U.tabla(
      [{ t: 'Momento' }, { t: 'Cantidad', n: true }, { t: 'Por qué' }],
      [
        ['Total del día', F.num(peso * 1.6, 0) + '–' + F.num(peso * 2.0, 0) + ' g', '1,6–2,0 g por kg de peso corporal al día para un atleta de resistencia que además hace fuerza.'],
        ['Después de entrenar', F.num(peso * 0.3, 0) + '–' + F.num(peso * 0.4, 0) + ' g', 'Dentro de las dos horas siguientes, junto con carbohidrato.'],
        ['Antes de dormir', '30–40 g', 'Proteína de digestión lenta: aprovecha la ventana de recuperación nocturna.']
      ],
      { pie: 'Calculado sobre ' + F.num(peso, 0) + ' kg. Cambia tu peso en el perfil (arriba a la derecha) y la tabla se recalcula.' }
    );

    return h`
      ${raw(U.modhead('5', 'Nutrición, recuperación y qué estudiar', 'Todos los enlaces de abajo se comprobaron uno por uno. Ninguno es una cita inventada.'))}

      <h3>Carbohidrato durante el ejercicio</h3>
      ${raw(tablaCarb)}
      ${raw(U.note('Lo que más te va a cambiar el ultra',
        'En tus salidas de bici de 4 y 5 horas esto no es un detalle: es la diferencia entre terminar y arrastrarte. ' +
        'El intestino se entrena. Empieza con 40 g/h y sube 10 g cada par de salidas largas hasta tolerar 80–90 g/h.', 'ok'))}

      <h3>Proteína</h3>
      ${raw(tablaProt)}

      <h3>Hidratación y las condiciones de tus carreras</h3>
      ${raw(U.tabla(
        [{ t: 'Carrera' }, { t: 'Condición' }, { t: 'Qué hacer' }],
        [
          ['15K Trail San Bartolomé', 'Altiplano, unos 2.100 m', 'El aire seco deshidrata más de lo que crees. Lleva 500 ml y bebe a sorbos desde el inicio. El ritmo a esa altura es naturalmente más lento: no pelees contra el reloj.'],
          ['Campanabaj, Totonicapán', 'Altura, unos 2.500 m, salida larga', 'Sube el carbohidrato a 70–90 g/h. En altura el cuerpo depende más del glucógeno y se vacía antes.'],
          ['Guatemágica 15K, Retalhuleu', 'Costa, calor y humedad altos', 'Es el escenario opuesto al que entrenas. Hidrátate la víspera, sal con 400–500 ml, usa gorra y acepta que tu ritmo será 10–20 s/km más lento que en el altiplano al mismo esfuerzo.']
        ],
        { pie: 'Si puedes, llega a Retalhuleu un día antes: la aclimatación al calor empieza a notarse desde las primeras 24–48 h.' }
      ))}

      <h3>Recuperación, en orden de lo que de verdad funciona</h3>
      ${raw(U.tabla(
        [{ t: 'Herramienta' }, { t: 'Evidencia' }, { t: 'Cómo aplicarla' }],
        [
          ['Dormir 7–9 h', "<span style='color:var(--ok)'>muy fuerte</span>", 'No hay suplemento que compita con esto. Horario fijo, cuarto oscuro, nada de pantallas la última hora.'],
          ['Días de descanso reales', "<span style='color:var(--ok)'>muy fuerte</span>", 'Uno por semana, sin trote de racha. Camina si necesitas moverte.'],
          ['Comer suficiente', "<span style='color:var(--ok)'>muy fuerte</span>", 'La baja disponibilidad energética es la causa más común de estancamiento en atletas que entrenan mucho.'],
          ['Fuerza 2×/semana', "<span style='color:var(--ok)'>fuerte</span>", '2–8% de mejora en economía de carrera. Sentadilla, peso muerto, zancada y pliometría ligera.'],
          ['Movilidad y trabajo de cadera', "<span style='color:var(--warn)'>moderada</span>", '15 min los días suaves. Más preventivo que regenerativo.'],
          ['Masaje y pistola de percusión', "<span style='color:var(--warn)'>débil</span>", 'Sientes alivio, pero mide poco en rendimiento. Úsalo si te gusta, no a costa del sueño.'],
          ['Baños de hielo', "<span style='color:var(--bad)'>contraproducente tras fuerza</span>", 'Reducen la adaptación al entrenamiento de fuerza. Resérvalos para competencias encadenadas.']
        ]
      ))}

      <h3>Material de estudio</h3>
      ${raw(refs)}

      ${raw(U.coach('Las tres cosas que cambian más tu año', `
        <p><b>1. Un día libre de verdad por semana.</b> Gratis, y es lo que más te va a rendir después de ${F.num(D.habitos.maxRachaSinDescanso, 0)} días seguidos.</p>
        <p><b>2. Dos sesiones de calidad por semana.</b> Hoy haces ${F.pct(D.intensidad.pct.z3, 1)} de trabajo duro. Ahí está tu progreso parado.</p>
        <p><b>3. Comer en las salidas largas.</b> Si vas a perseguir los 150 km y los 2.000 m D+, el estómago se entrena como las piernas.</p>
        <p class='lede'>Nada de esto requiere más horas. Requiere repartirlas distinto.</p>`))}
    `;
  }

  App.mods.push({ id: 'recursos', nom: 'Nutrición y estudio', tab: 'Estudio', icono: 'M4 5h7a2 2 0 012 2v12a2 2 0 00-2-2H4zM20 5h-7a2 2 0 00-2 2v12a2 2 0 012-2h7z', render: render });
})(this);
