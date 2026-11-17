/* sesiones.js — Módulo 24 (página «Guía de resistencia»): catálogo de sesiones, días tipo y semanas tipo para cada etapa
   (Retalhuleu, semana de carrera, Charlotte sin pesas, rutina con colegio desde el 14 ene) y el ciclo de 3+1 semanas.
   Las intensidades están ancladas a tus propios datos (trotes fáciles a FC 118–130; FC máxima observada ~207). */
(function (global) {
  'use strict';
  var App = global.App, U = App.ui;
  function c() { return App.guiaRefs ? App.guiaRefs.cita.apply(null, arguments) : ''; }
  function w(t) { return "<span class='wrap'>" + t + '</span>'; }

  var ZONAS = [
    ['<b>Fácil (Z1–Z2)</b>', w('Hablas en frases completas. Trote: FC 118–132 (tus trotes suaves de nov.). Bici: FC media por debajo de ~135, sin picos de 170.'), w('Base, durabilidad, recuperación. El 75–80 % de las sesiones.')],
    ['<b>Medio (Z3, «gris»)</b>', w('Frases cortas. FC ~140–155 sostenida. Es donde caen casi todas tus salidas de MTB.'), w('Útil en dosis (ritmo de carrera larga), dañino como costumbre.')],
    ['<b>Duro (Z4–Z5)</b>', w('Palabras sueltas. Por encima de ~165 en series; 30/15 y umbral.'), w('Sube el techo. 2–3 sesiones por semana como máximo.')]
  ];

  // [nombre, tipo, para qué, cómo, cuándo, refs...]
  var SESIONES = [
    ['Z2 largo en bici', 'Bici · volumen', 'Durabilidad, grasa como combustible, intestino.', '2–4 h con FC media < 135, cadencia 80–95, subidas sentado sin pasar de ~150. Come 60–90 g/h desde el minuto 30 y bebe 500–750 ml/h con sodio.', 'Sábado o domingo; 1 por semana.', 'seiler', 'jeukendrup'],
    ['Largo con final de calidad', 'Bici · durabilidad', 'Rendir con las piernas cansadas, que es lo que piden Entre Senderos y Sibaná.', '2 h 30 en Z2 y en la última hora 3 × 8 min a ritmo de umbral (FC ~160–165) con 4 min suaves.', 'Una vez cada 2 semanas en fase de construcción.', 'maunder'],
    ['30/15 (Rønnestad)', 'Bici · VO₂máx', 'Subir el techo del motor con poco tiempo.', '15 min de calentamiento, 3 series de 13 × (30 s fuerte / 15 s suave) con 3 min entre series, 10 min suaves. Los 30 s al máximo que puedas repetir 13 veces.', 'Martes o miércoles; nunca la víspera de algo duro.', 'ronnestad15'],
    ['Umbral 2 × 15–20 min', 'Bici · umbral', 'Subir lo que aguantas durante horas (fracción utilizable).', '2 × 15–20 min a FC ~158–165 (o «fuerte pero controlado») con 5 min suaves. En subida larga mejor.', 'Una vez por semana alternando con los 30/15.', 'joyner'],
    ['Torque en subida', 'Bici · fuerza específica', 'Fuerza en la pedalada sin gimnasio (evidencia débil; útil en Charlotte).', '5 × 4 min a 50–60 rpm en Z3, sentado, con 4 min suaves.', 'Sustituto ocasional de las pesas, no del Z2.', null],
    ['Ensayo de comida', 'Bici · intestino', 'Que el estómago tolere 70–90 g/h en carrera.', '2 h 30 en Z2 tomando 70–90 g/h (bebida + geles o plátano, glucosa con fructosa). Sube 10 g/h cada semana.', 'Una vez por semana, 3–4 semanas antes de cada ultra.', 'jeukendrup'],
    ['Rodaje fácil', 'Carrera · base', 'Volumen aeróbico sin castigar tendones; mantener la racha.', '3–8 km a FC 118–132 (tu ~7:00–7:30/km). Si el pulso sube 10 al mismo ritmo, señal de fatiga.', '3–5 días por semana.', 'seiler'],
    ['Rectas', 'Carrera · técnica', 'Economía y zancada sin fatiga.', 'Al final de un rodaje: 6 × 20 s rápidos pero relajados, caminando 60 s.', '2 veces por semana.', 'paavolainen'],
    ['Tirada larga', 'Carrera · durabilidad', 'Aguantar 15–21 km.', 'Hasta un 25–30 % de los km de la semana, a ritmo fácil; sube 1–2 km cada 2 semanas.', 'Domingo o sábado, lejos de la MTB larga.', 'lauersen'],
    ['Umbral a pie', 'Carrera · umbral', 'Ritmo de 10K–15K.', '3 × 8 min a ritmo de 10K (~6:00–6:10/km) con 2 min trotando, o 20 min continuos a ritmo de 15K.', 'Una vez por semana en fase de carrera a pie.', 'joyner'],
    ['Cuestas cortas', 'Carrera · fuerza', 'Potencia y rigidez del tendón sin pesas.', '8–10 × 10 s cuesta arriba a tope, bajando caminando.', 'Una vez por semana; ideal en Charlotte.', 'paavolainen'],
    ['Fuerza pesada', 'Gimnasio', 'Economía, potencia al final de la prueba, menos lesiones.', 'Sentadilla 4 × 4–6, peso muerto rumano 3 × 6, búlgara 3 × 6 por pierna, talones 3 × 12, saltos 3 × 5. Sin llegar al fallo.', '2 veces por semana tras la sesión dura del día.', 'ronnestadMujika', 'lauersen'],
    ['Pierna sin pesas', 'Casa / Charlotte', 'Mantener la fuerza ganada.', 'Mochila de 8–15 kg: búlgara 4 × 8, peso muerto a una pierna 3 × 8, subida al banco 3 × 10, pared 3 × 45 s, saltos 3 × 6.', '2 veces por semana.', 'mujika16'],
    ['Día suave de verdad', 'Recuperación', 'Que la fatiga baje y la forma aparezca.', 'Nada, o 30–45 min de bici a FC < 125 y la milla de la racha. Sin pesas de pierna.', 'Tras cada carrera y cada 3–4 días duros.', 'meeusen']
  ];

  var DIAS = [
    ['<b>Día duro</b>', w('AM 5:30: 30/15 o umbral (75 min). PM: trote fácil 3–4 km + fuerza pesada 35 min.'), w('Lo duro, junto: así el día siguiente puede ser suave de verdad.')],
    ['<b>Día fácil</b>', w('AM: bici Z2 60 min o descanso. PM: trote fácil 3–5 km + rectas o movilidad.'), w('Si dudas entre fácil y nada, nada.')],
    ['<b>Día largo</b>', w('AM 6:00: bici o MTB 3–4 h comiendo 60–90 g/h. Tarde: la milla de la racha y comer bien.'), w('El día que construye la durabilidad.')],
    ['<b>Día de carrera</b>', w('Calentamiento 10–15 min suaves con 2–3 aceleraciones cortas, sin picos de 180. Come desde el km 5 cada 20–25 min.'), w('Las lecciones de Entre Senderos.')],
    ['<b>Día después</b>', w('Bici 30–45 min a FC < 125 o descanso, trote de la racha a ritmo de paseo, mucha comida y agua.'), w('Lo que no hiciste el 16 y el 17 nov.')]
  ];

  function semana(titulo, sub, filas, nota) {
    return U.acc(titulo, '<p><small>' + sub + '</small></p>' + "<div class='t'>" + U.tabla([{ t: 'Día' }, { t: 'Mañana' }, { t: 'Tarde / noche' }], filas.map(function (f) {
      return ['<b>' + f[0] + '</b>', w(f[1]), w(f[2])];
    })) + '</div>' + (nota ? U.note('', nota) : ''));
  }

  function render() {
    var ses = SESIONES.map(function (s) {
      var refs = s.slice(5).filter(Boolean);
      return "<article class='gcard'><span class='ses-k'>" + s[1] + '</span><h5>' + s[0] + '</h5><p><b>Para qué:</b> ' + s[2] + '</p><p><b>Cómo:</b> ' + s[3] + (refs.length ? c.apply(null, refs) : '') + '</p><p><b>Cuándo:</b> ' + s[4] + '</p></article>';
    });
    return U.modhead('24', 'Sesiones, días y semanas', 'Un catálogo de sesiones con su porqué, cómo combinarlas en un día y semanas tipo para cada etapa hasta enero. Las semanas son plantillas: el calendario manda en las fechas con carrera o viaje.') +
      U.coach('Cómo usar esto', '<p>Una semana buena tiene <b>2 días duros, 1 largo y el resto suaves</b>. Cada 3 semanas de carga, 1 de descarga (−40 % de volumen). Antes de una carrera importante, 10–14 días bajando el volumen de forma progresiva y manteniendo algo de intensidad' + c('bosquet') + '.</p>') +
      U.acc('Las tres intensidades, con tus números', "<div class='t'>" + U.tabla([{ t: 'Zona' }, { t: 'Cómo se siente / tu FC' }, { t: 'Para qué' }], ZONAS) + '</div>' +
        U.note('Para afinar', 'Estos rangos salen de tus datos (FC máxima observada 207; trotes fáciles 118–132), no de una prueba. Para fijar el umbral: 30 min a tope en llano o en una subida constante; tu FC media de los últimos 20 min ≈ FC de umbral. Repítelo cada 6–8 semanas.')) +
      U.acc('Catálogo de sesiones (' + SESIONES.length + ')', "<div class='gcards'>" + ses.join('') + '</div>', true) +
      U.acc('Días tipo', "<div class='gcards'>" + DIAS.map(function (d) { return "<article class='gcard'><h5>" + d[0] + '</h5><p>' + d[1] + '</p><p><small>' + d[2] + '</small></p></article>'; }).join('') + '</div>') +

      semana('Semana de construcción en Retalhuleu (10–12 h)', 'Para bloques sin carrera, como el de febrero o tras Charlotte.', [
        ['Lun', 'Descanso o bici Z1 45 min', 'Trote fácil 4 km + fuerza pesada'],
        ['Mar', 'Bici 30/15 (75 min)', 'Trote fácil 3 km + rectas'],
        ['Mié', 'Bici Z2 90 min', 'Trote fácil 5 km'],
        ['Jue', 'Bici umbral 2 × 15 min (75 min)', 'Trote fácil 3 km + fuerza pesada'],
        ['Vie', 'Descanso o bici Z1 45 min', 'Trote fácil 4 km + rectas'],
        ['Sáb', 'MTB larga 3–4 h comiendo 60–90 g/h', 'Milla de la racha'],
        ['Dom', 'Tirada larga a pie 10–14 km fácil', 'Bici Z1 45 min opcional']
      ], 'Duro: martes y jueves (y el sábado si la MTB tiene mucho desnivel). Todo lo demás, fácil de verdad.') +

      semana('Semana de descarga (6–7 h)', 'Cada cuarta semana o tras un bloque como el de oct–nov.', [
        ['Lun', 'Descanso', 'Milla'],
        ['Mar', 'Bici 60 min con 6 × 30 s', 'Trote 3 km + fuerza ligera'],
        ['Mié', 'Bici Z2 60 min', 'Trote 4 km'],
        ['Jue', 'Descanso', 'Trote 3 km + rectas'],
        ['Vie', 'Bici Z2 60 min', 'Milla'],
        ['Sáb', 'MTB 2 h tranquila', 'Milla'],
        ['Dom', 'Trote 6–8 km fácil', '—']
      ], 'Se mantiene algo de intensidad para no perder chispa; se quita volumen.') +

      semana('Semana con dos carreras (como 17–22 nov)', 'Una carrera a pie el sábado y una MTB el domingo.', [
        ['Lun', 'Descanso real (si el domingo hubo carrera)', 'Milla'],
        ['Mar', 'Bici Z2 50 min', 'Afinación: 2 × 1,5 km a ritmo de carrera'],
        ['Mié', 'Descanso o bici Z1 40 min', 'Trote 3 km'],
        ['Jue', 'Bici Z2 45 min con 3 × 1 min', 'Trote 3 km + rectas'],
        ['Vie', 'Bici 30 min suave', 'Trote 2 km + 4 rectas; deja todo listo'],
        ['Sáb', 'Bici suave 40 min (≥ 3 h antes)', 'Carrera a pie'],
        ['Dom', 'MTB de carrera en Z2, comiendo cada 20–25 min', 'Milla']
      ], 'Sin pierna pesada desde el martes. La prioridad es llegar fresco, no ganar forma.') +

      semana('Semana tipo en Charlotte, sin pesas (6–9 h)', '26 nov–12 ene: familia, frío, horario de Utah (trabajo 10:00–19:00 de Charlotte).', [
        ['Lun', '6:00 trote fácil 5 km + rectas', '19:30 pierna sin pesas (mochila)'],
        ['Mar', '7:30 bici 30/15 o cuestas en bici (60–75 min)', '—'],
        ['Mié', '6:00 trote fácil 4 km', '19:30 boxeo de sombra 20 min + core'],
        ['Jue', '7:30 bici Z2 60–75 min (greenway)', '19:30 pierna sin pesas'],
        ['Vie', '6:00 trote con 8 × 10 s de cuesta', '—'],
        ['Sáb', 'Bici larga 2–3 h (Sugar Creek o parque de MTB) según la familia', 'Milla'],
        ['Dom', 'Tirada larga 8–12 km fácil', '—']
      ], 'Con frío, calienta más y lleva capas; la FC sale más baja en frío, no te engañes subiendo el ritmo. Sin pesas, la fuerza se mantiene con pierna a pierna y saltos.') +

      semana('Semana tipo con colegio (desde el 14 ene)', 'Correr 5:00–6:00, trabajo 9:00–18:00 de Guatemala, bici a las 18:30.', [
        ['Lun', '5:00 trote fácil 5 km', '18:30 bici Z2 60 min + fuerza pesada'],
        ['Mar', '5:00 trote fácil 4 km + rectas', '18:30 bici 30/15 (75 min)'],
        ['Mié', '5:00 trote fácil 5 km', '18:30 descanso o bici Z1 45 min'],
        ['Jue', '5:00 umbral a pie 3 × 8 min', '18:30 bici Z2 60 min + fuerza pesada'],
        ['Vie', '5:00 trote fácil 4 km', 'Descanso'],
        ['Sáb', 'MTB larga 3 h', 'Milla'],
        ['Dom', 'Tirada larga 10–14 km', 'Bici Z1 opcional']
      ], 'El día duro de bici (martes) va tras un trote fácil por la mañana; la fuerza, en días de bici suave. Duerme 7 h o más: con las 5:00, eso es acostarse a las 21:30–22:00.');
  }

  App.mods.push({ id: 'sesiones', nom: 'Sesiones y semanas', tab: 'Sesiones', icono: 'M4 5h16v15H4zM4 9h16M9 5v15', render: render });
})(this);
