/* plan.js — competencias reales y los dos calendarios (estructurado y brutal).
   Es sólo datos: el módulo de calendario los renderiza, los deja editar y los exporta. */
(function (global) {
  'use strict';
  var App = global.App || (global.App = {});

  /* ---------- Competencias confirmadas ---------- */
  var EVENTOS = [
    { id: 'trail15', fecha: '2026-10-14', nombre: '15K Trail San Bartolomé Milpas Altas', deporte: 'trail',
      km: 15, prioridad: 'C', lugar: 'San Bartolomé Milpas Altas, Sacatepéquez',
      nota: 'Trail de montaña a ~2.100 m. Diez días después de empezar el bloque y tu salida más larga de las últimas 6 semanas fue de 6 km.' },
    { id: 'capis', fecha: '2026-10-18', nombre: 'Rodada con los Capis', deporte: 'mtb',
      km: null, prioridad: 'C', lugar: 'Por confirmar', nota: 'Rodada de grupo. Sirve como salida larga en bici.' },
    { id: 'campana', fecha: '2026-11-08', nombre: 'Campanabaj, Totonicapán', deporte: 'mtb',
      km: null, prioridad: 'B', lugar: 'Totonicapán', nota: 'Altura (~2.500 m) y desnivel. Es tu mejor ensayo del año para el sueño de 2.000 m D+.' },
    { id: 'senderos', fecha: '2026-11-15', nombre: 'Entre Senderos', deporte: 'mtb',
      km: null, prioridad: 'C', lugar: 'Por confirmar', nota: 'Cae 6 días antes de la Guatemágica. Es la que más puede arruinarte el objetivo del año.' },
    { id: 'sanfelipe', fecha: '2026-11-19', nombre: '5K y 10K San Felipe', deporte: 'atletismo',
      km: 5, prioridad: 'C', lugar: 'San Felipe, Retalhuleu',
      nota: 'Dos días antes de la Guatemágica. Sólo el 5K y sólo a ritmo de 15K, o no corras.' },
    { id: 'guatemagica', fecha: '2026-11-21', nombre: 'Guatemágica 15K', deporte: 'atletismo',
      km: 15, prioridad: 'A', lugar: 'Retalhuleu',
      nota: 'La carrera A del año: es exactamente la distancia de tu meta de 15K a 5:00/km.' }
  ];

  /* ---------- Tipos de sesión ----------
     deporte: 'run' | 'bici' | 'mixto' | 'libre' — para que el detalle por deporte sepa qué referencia mostrar. */
  var TIPOS = {
    E: { k: 'E', nom: 'Fácil', cls: 'dE', deporte: 'run' },
    Q: { k: 'Q', nom: 'Calidad', cls: 'dQ', deporte: 'run' },
    L: { k: 'L', nom: 'Largo', cls: 'dL', deporte: 'run' },
    R: { k: 'R', nom: 'Recuperación', cls: 'dR', deporte: 'run' },
    H: { k: 'H', nom: 'HIIT (VO₂máx)', cls: 'dH', deporte: 'run' },
    S: { k: 'S', nom: 'Sprints', cls: 'dS', deporte: 'run' },
    T: { k: 'T', nom: 'Trail duro', cls: 'dT', deporte: 'run' },
    B: { k: 'B', nom: 'Bici', cls: 'dB', deporte: 'bici' },
    F: { k: 'F', nom: 'FTP en bici', cls: 'dF', deporte: 'bici' },
    V: { k: 'V', nom: 'Sprints en bici', cls: 'dV', deporte: 'bici' },
    M: { k: 'M', nom: 'Montaña dura', cls: 'dM', deporte: 'bici' },
    D: { k: 'D', nom: 'Descanso', cls: 'dX', deporte: 'libre' },
    C: { k: 'C', nom: 'Carrera', cls: 'dC', deporte: 'mixto' },
    P: { k: '✓', nom: 'Hecho', cls: 'dP', deporte: 'libre' }
  };

  /* ---------- Rutinas de fuerza en casa (compartidas con «Lo que te toca hoy») ---------- */
  var RUTINAS = {
    A: { nom: 'pierna y empuje', min: 25, items: ['3 rondas', 'Sentadilla búlgara con mancuerna de 25 lb · 8–10 por pierna', 'Peso muerto rumano a una pierna con kettlebell · 8–10 por lado', 'Flexiones con soportes · 8–15', 'Press de hombros con mancuernas · 8–10'] },
    B: { nom: 'espalda y cadera', min: 25, items: ['3 rondas', 'Dominadas con banda o negativas de 4 s · 3–6', 'Remo inclinado con la barra · 10–12', 'Puente de glúteo con la barra · 12–15', 'Balanceo de kettlebell · 20'] },
    C: { nom: 'boxeo', min: 20, items: ['5 rounds de 3 min en el saco, 1 min de pausa', '3 × 2 min de cuerda'] }
  };

  // Fila = [fecha, tipo, descripción, km de carrera, minutos de bici, id de evento]
  var ESTRUCTURADO = [
    ['2026-10-05', 'R', 'R', 2, 0, null],
    ['2026-10-06', 'Q', 'Q', 6, 0, null],
    ['2026-10-07', 'B', '4 km fácil AM + bici Z2 PM', 4, 60, null],
    ['2026-10-08', 'E', 'E + fuerza A', 5, 0, null],
    ['2026-10-09', 'R', 'R + fuerza B', 2, 0, null],
    ['2026-10-10', 'B', 'Bici fondo + 3 km off-bike (brick)', 3, 90, null],
    ['2026-10-11', 'L', 'L', 11, 0, null],
    ['2026-10-12', 'R', 'R', 2, 0, null],
    ['2026-10-13', 'E', 'E', 4, 0, null],
    ['2026-10-14', 'C', 'C', 15, 0, 'trail15'],
    ['2026-10-15', 'D', 'D', 1.6, 0, null],
    ['2026-10-16', 'R', 'R + fuerza B', 3, 0, null],
    ['2026-10-17', 'E', 'E', 4, 0, null],
    ['2026-10-18', 'B', 'B', 1.6, 180, 'capis'],
    ['2026-10-19', 'R', 'R', 2, 0, null],
    ['2026-10-20', 'E', 'E + fuerza A', 5, 0, null],
    ['2026-10-21', 'B', '4 km fácil AM + bici Z2 PM', 4, 75, null],
    ['2026-10-22', 'Q', 'Q', 9, 0, null],
    ['2026-10-23', 'R', 'R + fuerza B', 2, 0, null],
    ['2026-10-24', 'B', 'Bici fondo + 3 km off-bike (brick)', 3, 120, null],
    ['2026-10-25', 'L', 'L', 12, 0, null],
    ['2026-10-26', 'R', 'R', 2, 0, null],
    ['2026-10-27', 'Q', 'Q', 8, 0, null],
    ['2026-10-28', 'B', '4 km fácil AM + bici Z2 PM', 4, 60, null],
    ['2026-10-29', 'E', 'E + fuerza A', 4, 0, null],
    ['2026-10-30', 'R', 'R + fuerza B', 2, 0, null],
    ['2026-10-31', 'B', 'B', 1.6, 90, null],
    ['2026-11-01', 'L', 'L', 9, 0, null],
    ['2026-11-02', 'R', 'R', 2, 0, null],
    ['2026-11-03', 'Q', 'Q', 8.5, 0, null],
    ['2026-11-04', 'B', '4 km fácil AM + bici Z2 PM', 4, 60, null],
    ['2026-11-05', 'E', 'E + fuerza A', 5, 0, null],
    ['2026-11-06', 'R', 'R + fuerza B', 2, 0, null],
    ['2026-11-07', 'E', 'E', 4, 0, null],
    ['2026-11-08', 'C', 'C', 1.6, 210, 'campana'],
    ['2026-11-09', 'R', 'R', 2, 0, null],
    ['2026-11-10', 'Q', 'Q', 8, 0, null],
    ['2026-11-11', 'E', 'E + fuerza A', 4, 0, null],
    ['2026-11-12', 'L', 'L', 14, 0, null],
    ['2026-11-13', 'R', 'R + fuerza B', 2, 0, null],
    ['2026-11-14', 'R', 'R', 2, 0, null],
    ['2026-11-15', 'B', 'B', 1.6, 150, 'senderos'],
    ['2026-11-16', 'R', 'R', 2, 0, null],
    ['2026-11-17', 'Q', 'Q', 7, 0, null],
    ['2026-11-18', 'E', 'E', 4, 0, null],
    ['2026-11-19', 'C', 'C', 6.5, 0, 'sanfelipe'],
    ['2026-11-20', 'D', 'D', 1.6, 0, null],
    ['2026-11-21', 'C', 'C', 15.1, 0, 'guatemagica'],
    ['2026-11-22', 'R', 'R', 3, 0, null],
    ['2026-11-23', 'D', 'D', 1.6, 0, null],
    ['2026-11-24', 'R', 'R', 3, 0, null],
    ['2026-11-25', 'B', '3 km suave AM + bici Z2 PM', 3, 45, null],
    ['2026-11-26', 'R', 'R + fuerza A', 3, 0, null],
    ['2026-11-27', 'E', 'E + fuerza B', 4, 0, null],
    ['2026-11-28', 'B', 'B', 1.6, 90, null],
    ['2026-11-29', 'E', 'E', 6, 0, null],
    ['2026-11-30', 'R', 'R', 2, 0, null]
  ];

  var BRUTAL = [
    ['2026-10-05', 'E', 'E AM + bici Z2 PM', 5, 40, null],
    ['2026-10-06', 'H', 'HIIT AM + bici suave PM', 9, 30, null],
    ['2026-10-07', 'B', 'Bici fondo + 3 km off-bike (brick)', 3, 75, null],
    ['2026-10-08', 'E', 'E AM + bici Z2 + fuerza A PM', 6, 40, null],
    ['2026-10-09', 'R', 'R AM + bici suave + fuerza B PM', 3, 30, null],
    ['2026-10-10', 'B', 'Bici larga + 4 km off-bike (brick)', 4, 180, null],
    ['2026-10-11', 'L', 'L', 13, 0, null],
    ['2026-10-12', 'R', 'R AM + bici suave + fuerza C PM', 3, 30, null],
    ['2026-10-13', 'E', 'E AM + bici Z2 PM', 5, 40, null],
    ['2026-10-14', 'T', 'Trail duro', 15, 0, 'trail15'],
    ['2026-10-15', 'R', 'R', 3, 0, null],
    ['2026-10-16', 'Q', 'Q AM + bici suave PM', 7, 30, null],
    ['2026-10-17', 'E', 'E AM + bici Z2 + fuerza B PM', 5, 50, null],
    ['2026-10-18', 'M', 'Montaña dura', 2, 210, 'capis'],
    ['2026-10-19', 'R', 'R AM + bici suave PM', 3, 30, null],
    ['2026-10-20', 'H', 'HIIT AM + bici suave PM', 10, 30, null],
    ['2026-10-21', 'F', 'FTP PM + 3 km off-bike (brick)', 3, 75, null],
    ['2026-10-22', 'E', 'E AM + bici Z2 + fuerza A PM', 7, 40, null],
    ['2026-10-23', 'R', 'R AM + bici suave + fuerza B PM', 3, 30, null],
    ['2026-10-24', 'B', 'Bici larga + 4 km off-bike (brick)', 4, 150, null],
    ['2026-10-25', 'L', 'L', 16, 0, null],
    ['2026-10-26', 'R', 'R AM + bici suave + fuerza C PM', 3, 30, null],
    ['2026-10-27', 'Q', 'Q AM + bici suave PM', 10, 30, null],
    ['2026-10-28', 'V', 'Sprints bici PM + 3 km off-bike', 3, 75, null],
    ['2026-10-29', 'E', 'E AM + bici Z2 + fuerza A PM', 6, 40, null],
    ['2026-10-30', 'R', 'R AM + bici suave + fuerza B PM', 3, 30, null],
    ['2026-10-31', 'B', 'Bici fondo + 4 km off-bike (brick)', 4, 120, null],
    ['2026-11-01', 'L', 'L', 11, 0, null],
    ['2026-11-02', 'R', 'R AM + bici suave + fuerza C PM', 3, 30, null],
    ['2026-11-03', 'Q', 'Q AM + bici suave PM', 10, 30, null],
    ['2026-11-04', 'E', 'E AM + bici Z2 + fuerza A PM', 6, 40, null],
    ['2026-11-05', 'Q', 'Q AM + bici suave PM', 8, 30, null],
    ['2026-11-06', 'R', 'R AM + bici suave + fuerza B PM', 3, 30, null],
    ['2026-11-07', 'E', 'E AM + bici Z2 PM', 4, 40, null],
    ['2026-11-08', 'M', 'Montaña dura', 2, 210, 'campana'],
    ['2026-11-09', 'R', 'R AM + bici suave PM', 3, 30, null],
    ['2026-11-10', 'H', 'HIIT AM + bici suave PM', 8, 30, null],
    ['2026-11-11', 'E', 'E AM + bici Z2 + fuerza A PM', 7, 40, null],
    ['2026-11-12', 'L', 'L', 18, 0, null],
    ['2026-11-13', 'R', 'R AM + bici suave + fuerza B PM', 3, 30, null],
    ['2026-11-14', 'E', 'E AM + bici Z2 PM', 4, 40, null],
    ['2026-11-15', 'C', 'C', 2, 180, 'senderos'],
    ['2026-11-16', 'R', 'R', 3, 0, null],
    ['2026-11-17', 'Q', 'Q', 9, 0, null],
    ['2026-11-18', 'E', 'E', 5, 0, null],
    ['2026-11-19', 'C', 'C', 8, 0, 'sanfelipe'],
    ['2026-11-20', 'R', 'R', 2, 0, null],
    ['2026-11-21', 'C', 'C', 15.1, 0, 'guatemagica'],
    ['2026-11-22', 'R', 'R', 4, 0, null],
    ['2026-11-23', 'R', 'R AM + bici suave PM', 3, 30, null],
    ['2026-11-24', 'E', 'E AM + bici Z2 + fuerza A PM', 6, 40, null],
    ['2026-11-25', 'B', 'Bici fondo + 3 km off-bike (brick)', 3, 120, null],
    ['2026-11-26', 'Q', 'Q AM + bici suave PM', 8, 30, null],
    ['2026-11-27', 'R', 'R AM + bici suave + fuerza B PM', 3, 30, null],
    ['2026-11-28', 'B', 'Bici larga + 4 km off-bike (brick)', 4, 150, null],
    ['2026-11-29', 'L', 'L', 14, 0, null],
    ['2026-11-30', 'E', 'E AM + bici Z2 + fuerza C PM', 5, 40, null]
  ];

  // Camino intermedio: entre la ruta estructurada y la brutal. Más calidad real (HIIT, sprints,
  // FTP y montaña) que la estructurada, pero con un día libre de verdad y descargas cada 4 semanas.
  var INTERMEDIO = [
    ['2026-10-05', 'R', 'R', 3, 0, null],
    ['2026-10-06', 'H', 'HIIT', 7, 0, null],
    ['2026-10-07', 'B', '5 km fácil AM + bici Z2 PM', 5, 70, null],
    ['2026-10-08', 'E', 'E + fuerza A', 6, 0, null],
    ['2026-10-09', 'R', 'R + fuerza B', 2, 0, null],
    ['2026-10-10', 'B', 'B', 1.6, 120, null],
    ['2026-10-11', 'L', 'L', 12, 0, null],
    ['2026-10-12', 'R', 'R', 2, 0, null],
    ['2026-10-13', 'E', 'E', 5, 0, null],
    ['2026-10-14', 'T', 'Trail duro', 15, 0, 'trail15'],
    ['2026-10-15', 'D', 'D', 1.6, 0, null],
    ['2026-10-16', 'R', 'R + fuerza B', 3, 0, null],
    ['2026-10-17', 'E', 'E', 4, 0, null],
    ['2026-10-18', 'B', 'B', 1.6, 195, 'capis'],
    ['2026-10-19', 'R', 'R', 2, 0, null],
    ['2026-10-20', 'S', 'Sprints', 6, 0, null],
    ['2026-10-21', 'F', 'FTP PM + 3 km off-bike (brick)', 3, 75, null],
    ['2026-10-22', 'Q', 'Q', 9, 0, null],
    ['2026-10-23', 'R', 'R + fuerza B', 2, 0, null],
    ['2026-10-24', 'B', 'Bici fondo + 4 km off-bike (brick)', 4, 135, null],
    ['2026-10-25', 'L', 'L', 14, 0, null],
    ['2026-10-26', 'R', 'R', 2, 0, null],
    ['2026-10-27', 'H', 'HIIT', 8, 0, null],
    ['2026-10-28', 'B', '5 km fácil AM + bici Z2 PM', 5, 60, null],
    ['2026-10-29', 'E', 'E + fuerza A', 5, 0, null],
    ['2026-10-30', 'R', 'R + fuerza B', 2, 0, null],
    ['2026-10-31', 'B', 'B', 1.6, 90, null],
    ['2026-11-01', 'L', 'L', 10, 0, null],
    ['2026-11-02', 'R', 'R', 2, 0, null],
    ['2026-11-03', 'Q', 'Q', 9, 0, null],
    ['2026-11-04', 'F', 'FTP PM + 3 km off-bike (brick)', 3, 70, null],
    ['2026-11-05', 'E', 'E + fuerza A', 5, 0, null],
    ['2026-11-06', 'R', 'R + fuerza B', 2, 0, null],
    ['2026-11-07', 'E', 'E', 4, 0, null],
    ['2026-11-08', 'M', 'Montaña dura', 1.6, 210, 'campana'],
    ['2026-11-09', 'R', 'R', 2, 0, null],
    ['2026-11-10', 'H', 'HIIT', 8, 0, null],
    ['2026-11-11', 'E', 'E + fuerza A', 4, 0, null],
    ['2026-11-12', 'L', 'L', 15, 0, null],
    ['2026-11-13', 'R', 'R + fuerza B', 2, 0, null],
    ['2026-11-14', 'R', 'R', 2, 0, null],
    ['2026-11-15', 'B', 'B', 1.6, 165, 'senderos'],
    ['2026-11-16', 'R', 'R', 2, 0, null],
    ['2026-11-17', 'Q', 'Q', 7, 0, null],
    ['2026-11-18', 'E', 'E', 4, 0, null],
    ['2026-11-19', 'C', 'C', 6.5, 0, 'sanfelipe'],
    ['2026-11-20', 'D', 'D', 1.6, 0, null],
    ['2026-11-21', 'C', 'C', 15.1, 0, 'guatemagica'],
    ['2026-11-22', 'R', 'R', 3, 0, null],
    ['2026-11-23', 'D', 'D', 1.6, 0, null],
    ['2026-11-24', 'R', 'R', 3, 0, null],
    ['2026-11-25', 'F', 'FTP suave PM + 3 km (brick)', 3, 60, null],
    ['2026-11-26', 'E', 'E + fuerza A', 4, 0, null],
    ['2026-11-27', 'R', 'R + fuerza B', 4, 0, null],
    ['2026-11-28', 'B', 'Bici fondo + 4 km off-bike (brick)', 4, 100, null],
    ['2026-11-29', 'E', 'E', 6, 0, null],
    ['2026-11-30', 'R', 'R', 2, 0, null]
  ];

  function aObjetos(filas) {
    return filas.map(function (f) {
      return { fecha: f[0], tipo: f[1], sesion: f[2], km: f[3], minBici: f[4], evento: f[5] };
    });
  }

  var PLANES = {
    estructurado: {
      id: 'estructurado', nombre: 'Ruta estructurada',
      resumen: 'Progresión del 8% semanal, descarga cada cuarta semana, dos calidades y un largo, más dos sesiones de fuerza en casa (A y B). Híbrido mínimo: un doble suave AM/PM (rodaje fácil + bici Z2) entre semana y un mini-brick bici→trote cada dos sábados, para sumar aeróbico sin más impacto en las articulaciones. Las MTB que caen cerca de la carrera A se corren en Z2.',
      dias: aObjetos(ESTRUCTURADO)
    },
    intermedio: {
      id: 'intermedio', nombre: 'Ruta intermedia',
      resumen: 'El punto medio: calidad de verdad —HIIT, sprints, FTP y una montaña fuerte— sobre una base parecida a la estructurada, pero con un día libre real y descargas cada cuarta semana. Un brick por semana (bici fuerte y 3–4 km en seco al bajar) y uno o dos dobles AM/PM. El trail del 14 de octubre se corre a tempo, no a muerte.',
      dias: aObjetos(INTERMEDIO)
    },
    brutal: {
      id: 'brutal', nombre: 'Camino brutal',
      resumen: 'Todas las competencias a fondo, dobles sesiones casi a diario (corres por la mañana, ruedas y pegas la fuerza por la noche) y bricks largos bici→carrera los fines de semana. Tres sesiones de fuerza y boxeo en casa; sin semanas de descarga reales; sólo la semana de la Guatemágica queda limpia; el déficit calórico empieza después de la carrera A.',
      dias: aObjetos(BRUTAL)
    }
  };

  /* ---------- Conflictos detectados a mano ---------- */
  var CONFLICTOS = [
    { nivel: 'bad', titulo: 'El 21K de Esquipulas ya no cabe el 8 de noviembre',
      texto: 'El plan anterior apuntaba a un medio maratón el domingo 8 de noviembre. Ese día ahora es Campanabaj MTB. Si sigues inscrito en los dos, hay que elegir: no se corren un 21K y una MTB de altura el mismo día.' },
    { nivel: 'bad', titulo: 'Entre Senderos cae 6 días antes de la Guatemágica',
      texto: 'Una MTB a fondo el domingo 15 deja las piernas cargadas para el sábado 21. En la ruta estructurada va en Z2 y sin disputar nada; si la vas a competir, acepta que la Guatemágica se convierte en carrera B.' },
    { nivel: 'warn', titulo: 'San Felipe es 48 horas antes de la carrera A',
      texto: 'Un 10K a fondo el jueves 19 te quita entre 20 y 40 segundos por kilómetro el sábado. Si vas, corre sólo el 5K a ritmo de 15K y trátalo como activación.' },
    { nivel: 'warn', titulo: 'El 15K Trail llega muy pronto',
      texto: 'Es el 14 de octubre, con una salida más larga de 6 km en las últimas 6 semanas y 15 km de trail en altura. A ritmo controlado es un gran largo; a fondo es la lesión más probable del bloque.' }
  ];

  /* Disponibilidad real de Emilio (horarios-preferidos.txt): entre semana desde las 18:00, sábado desde las 14:00, domingo desde las 05:00. */
  var HORARIO = { semana: 'desde las 18:00 (máx. 75 min)', sabado: 'desde las 14:00', domingo: 'desde las 05:00 (aquí van los largos y las carreras)' };

  App.plan = { HORARIO: HORARIO, EVENTOS: EVENTOS, PLANES: PLANES, TIPOS: TIPOS, RUTINAS: RUTINAS, CONFLICTOS: CONFLICTOS };
})(this);
