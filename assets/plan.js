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

  /* ---------- Tipos de sesión ---------- */
  var TIPOS = {
    E: { k: 'E', nom: 'Fácil', cls: 'dE' },
    Q: { k: 'Q', nom: 'Calidad', cls: 'dQ' },
    L: { k: 'L', nom: 'Largo', cls: 'dL' },
    R: { k: 'R', nom: 'Recuperación', cls: 'dR' },
    B: { k: 'B', nom: 'Bici', cls: 'dB' },
    D: { k: 'D', nom: 'Descanso', cls: 'dX' },
    C: { k: 'C', nom: 'Carrera', cls: 'dC' },
    P: { k: '✓', nom: 'Hecho', cls: 'dP' }
  };

  // Fila = [fecha, tipo, descripción, km de carrera, minutos de bici, id de evento]
  var ESTRUCTURADO = [
    ['2026-10-05', 'R', 'Recuperación + movilidad', 2, 0, null],
    ['2026-10-06', 'Q', 'Tempo 15 min a 5:24 + 2 km cal/vuelta', 6, 0, null],
    ['2026-10-07', 'B', 'Bici Z2 60 min', 1.6, 60, null],
    ['2026-10-08', 'E', 'Fácil 5 km + 4 rectas + fuerza A', 5, 0, null],
    ['2026-10-09', 'R', 'Muy suave', 2, 0, null],
    ['2026-10-10', 'B', 'MTB Z2 90 min', 1.6, 90, null],
    ['2026-10-11', 'L', 'Largo 11 km a 6:30', 11, 0, null],
    ['2026-10-12', 'R', 'Recuperación + movilidad', 2, 0, null],
    ['2026-10-13', 'E', 'Fácil 4 km + 4 rectas', 4, 0, null],
    ['2026-10-14', 'C', '15K Trail: ritmo controlado 6:30–7:00, camina las subidas', 15, 0, 'trail15'],
    ['2026-10-15', 'D', 'Descanso + trote de racha', 1.6, 0, null],
    ['2026-10-16', 'R', 'Muy suave', 3, 0, null],
    ['2026-10-17', 'E', 'Fácil 4 km + fuerza ligera', 4, 0, null],
    ['2026-10-18', 'B', 'Rodada Capis en Z2, sin competir', 1.6, 180, 'capis'],
    ['2026-10-19', 'R', 'Recuperación + movilidad', 2, 0, null],
    ['2026-10-20', 'E', 'Fácil 5 km + 4 rectas', 5, 0, null],
    ['2026-10-21', 'B', 'Bici Z2 75 min', 1.6, 75, null],
    ['2026-10-22', 'Q', '5×1.000 m a 4:59, trote 2 min', 9, 0, null],
    ['2026-10-23', 'R', 'Muy suave', 2, 0, null],
    ['2026-10-24', 'B', 'MTB subidas 2 h: 6×4 min al 6–8%', 1.6, 120, null],
    ['2026-10-25', 'L', 'Largo 12 km', 12, 0, null],
    ['2026-10-26', 'R', 'Recuperación + movilidad', 2, 0, null],
    ['2026-10-27', 'Q', 'Tempo 2×12 min a 5:24, 3 min trote', 8, 0, null],
    ['2026-10-28', 'B', 'Bici Z2 60 min', 1.6, 60, null],
    ['2026-10-29', 'E', 'Fácil 4 km + fuerza A', 4, 0, null],
    ['2026-10-30', 'R', 'Muy suave', 2, 0, null],
    ['2026-10-31', 'B', 'MTB Z2 90 min', 1.6, 90, null],
    ['2026-11-01', 'L', 'Largo 9 km (semana de descarga)', 9, 0, null],
    ['2026-11-02', 'R', 'Recuperación + movilidad', 2, 0, null],
    ['2026-11-03', 'Q', '6×800 m a 4:55, trote 2 min', 8.5, 0, null],
    ['2026-11-04', 'B', 'Bici Z2 60 min', 1.6, 60, null],
    ['2026-11-05', 'E', 'Fácil 5 km + rectas + fuerza B', 5, 0, null],
    ['2026-11-06', 'R', 'Muy suave', 2, 0, null],
    ['2026-11-07', 'E', 'Fácil 4 km, víspera de carrera', 4, 0, null],
    ['2026-11-08', 'C', 'Campanabaj MTB: tu ensayo de montaña, a fondo', 1.6, 210, 'campana'],
    ['2026-11-09', 'R', 'Recuperación post-MTB', 2, 0, null],
    ['2026-11-10', 'Q', 'Tempo 20 min a 5:20', 8, 0, null],
    ['2026-11-11', 'E', 'Fácil 4 km + fuerza A', 4, 0, null],
    ['2026-11-12', 'L', 'Largo 14 km, últimos 3 a 5:10', 14, 0, null],
    ['2026-11-13', 'R', 'Muy suave', 2, 0, null],
    ['2026-11-14', 'R', 'Suave 2 km, víspera de MTB', 2, 0, null],
    ['2026-11-15', 'B', 'Entre Senderos en Z2: NO competir, faltan 6 días para la A', 1.6, 150, 'senderos'],
    ['2026-11-16', 'R', 'Recuperación + movilidad', 2, 0, null],
    ['2026-11-17', 'Q', '4×1.000 m a ritmo de 15K (5:00)', 7, 0, null],
    ['2026-11-18', 'E', 'Fácil 4 km + 4 rectas', 4, 0, null],
    ['2026-11-19', 'C', 'San Felipe: sólo el 5K y a ritmo de 15K, como activación', 6.5, 0, 'sanfelipe'],
    ['2026-11-20', 'D', 'Descanso + trote de racha + carga de carbohidratos', 1.6, 0, null],
    ['2026-11-21', 'C', 'GUATEMÁGICA 15K — carrera A del año', 15.1, 0, 'guatemagica'],
    ['2026-11-22', 'R', 'Muy suave', 3, 0, null],
    ['2026-11-23', 'D', 'Descanso total + trote de racha', 1.6, 0, null],
    ['2026-11-24', 'R', 'Muy suave', 3, 0, null],
    ['2026-11-25', 'B', 'Bici suave 45 min', 1.6, 45, null],
    ['2026-11-26', 'R', 'Suave', 3, 0, null],
    ['2026-11-27', 'E', 'Fácil 4 km + fuerza ligera', 4, 0, null],
    ['2026-11-28', 'B', 'MTB Z2 90 min', 1.6, 90, null],
    ['2026-11-29', 'E', 'Fácil 6 km', 6, 0, null],
    ['2026-11-30', 'R', 'Recuperación + movilidad: empieza el bloque de diciembre', 2, 0, null]
  ];

  var BRUTAL = [
    ['2026-10-05', 'E', 'Fácil 5 km + fuerza A', 5, 0, null],
    ['2026-10-06', 'Q', '5×1.000 m a 4:55, trote 2 min', 9, 0, null],
    ['2026-10-07', 'B', 'MTB subidas 2 h, 1.000 m D+', 2, 120, null],
    ['2026-10-08', 'E', 'Fácil 6 km + 6 rectas', 6, 0, null],
    ['2026-10-09', 'R', 'Suave', 3, 0, null],
    ['2026-10-10', 'B', 'Ruta 3 h Z2', 2, 180, null],
    ['2026-10-11', 'L', 'Largo 13 km', 13, 0, null],
    ['2026-10-12', 'R', 'Suave', 3, 0, null],
    ['2026-10-13', 'E', 'Fácil 5 km + rectas', 5, 0, null],
    ['2026-10-14', 'C', '15K Trail A FONDO', 15, 0, 'trail15'],
    ['2026-10-15', 'R', 'Regenerativo', 3, 0, null],
    ['2026-10-16', 'Q', 'Tempo 20 min a 5:15', 7, 0, null],
    ['2026-10-17', 'E', 'Fácil 5 km + fuerza B', 5, 0, null],
    ['2026-10-18', 'B', 'Rodada Capis A FONDO', 2, 210, 'capis'],
    ['2026-10-19', 'R', 'Suave', 3, 0, null],
    ['2026-10-20', 'Q', '8×800 m a 4:50, trote 90 s', 10, 0, null],
    ['2026-10-21', 'B', 'MTB subidas 2 h, 1.200 m D+', 3, 120, null],
    ['2026-10-22', 'E', 'Fácil 7 km + fuerza A', 7, 0, null],
    ['2026-10-23', 'R', 'Suave', 3, 0, null],
    ['2026-10-24', 'B', 'Ruta 4 h con 1.500 m D+', 2, 240, null],
    ['2026-10-25', 'L', 'Largo 16 km al día siguiente de 4 h de bici', 16, 0, null],
    ['2026-10-26', 'R', 'Suave', 3, 0, null],
    ['2026-10-27', 'Q', 'Tempo 2×15 min a 5:15', 10, 0, null],
    ['2026-10-28', 'B', 'Bici Z2 75 min', 2, 75, null],
    ['2026-10-29', 'E', 'Fácil 6 km', 6, 0, null],
    ['2026-10-30', 'R', 'Suave', 3, 0, null],
    ['2026-10-31', 'B', 'MTB 2 h', 2, 120, null],
    ['2026-11-01', 'L', 'Largo 11 km', 11, 0, null],
    ['2026-11-02', 'R', 'Suave', 3, 0, null],
    ['2026-11-03', 'Q', '6×1.000 m a 4:50', 10, 0, null],
    ['2026-11-04', 'E', 'Fácil 6 km + fuerza B', 6, 0, null],
    ['2026-11-05', 'Q', 'Tempo 20 min a 5:10', 8, 0, null],
    ['2026-11-06', 'R', 'Suave', 3, 0, null],
    ['2026-11-07', 'E', 'Fácil 4 km', 4, 0, null],
    ['2026-11-08', 'C', 'Campanabaj MTB A FONDO', 2, 210, 'campana'],
    ['2026-11-09', 'R', 'Suave', 3, 0, null],
    ['2026-11-10', 'Q', '10×400 m a 4:30', 8, 0, null],
    ['2026-11-11', 'E', 'Fácil 7 km + fuerza A', 7, 0, null],
    ['2026-11-12', 'L', 'Largo 18 km, últimos 4 a 5:05', 18, 0, null],
    ['2026-11-13', 'R', 'Suave', 3, 0, null],
    ['2026-11-14', 'E', 'Fácil 4 km', 4, 0, null],
    ['2026-11-15', 'C', 'Entre Senderos MTB A FONDO', 2, 180, 'senderos'],
    ['2026-11-16', 'R', 'Suave', 3, 0, null],
    ['2026-11-17', 'Q', '5×1.000 m a ritmo de 15K', 9, 0, null],
    ['2026-11-18', 'E', 'Fácil 5 km + rectas', 5, 0, null],
    ['2026-11-19', 'C', '5K San Felipe A FONDO', 8, 0, 'sanfelipe'],
    ['2026-11-20', 'R', 'Suave 2 km + carbohidratos', 2, 0, null],
    ['2026-11-21', 'C', 'GUATEMÁGICA 15K A FONDO', 15.1, 0, 'guatemagica'],
    ['2026-11-22', 'R', 'Suave', 4, 0, null],
    ['2026-11-23', 'R', 'Suave', 3, 0, null],
    ['2026-11-24', 'E', 'Fácil 6 km', 6, 0, null],
    ['2026-11-25', 'B', 'MTB 2 h', 2, 120, null],
    ['2026-11-26', 'Q', 'Tempo 20 min', 8, 0, null],
    ['2026-11-27', 'R', 'Suave', 3, 0, null],
    ['2026-11-28', 'B', 'Ruta 3 h', 2, 180, null],
    ['2026-11-29', 'L', 'Largo 14 km', 14, 0, null],
    ['2026-11-30', 'E', 'Fácil 5 km', 5, 0, null]
  ];

  function aObjetos(filas) {
    return filas.map(function (f) {
      return { fecha: f[0], tipo: f[1], sesion: f[2], km: f[3], minBici: f[4], evento: f[5] };
    });
  }

  var PLANES = {
    estructurado: {
      id: 'estructurado', nombre: 'Ruta estructurada',
      resumen: 'Progresión del 8% semanal, descarga cada cuarta semana, dos calidades y un largo. Las MTB que caen cerca de la carrera A se corren en Z2.',
      dias: aObjetos(ESTRUCTURADO)
    },
    brutal: {
      id: 'brutal', nombre: 'Camino brutal',
      resumen: 'Todas las competencias a fondo, dobles sesiones, bloques de desnivel y largos encadenados después de la bici. Sin semanas de descarga reales.',
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

  App.plan = { EVENTOS: EVENTOS, PLANES: PLANES, TIPOS: TIPOS, CONFLICTOS: CONFLICTOS };
})(this);
