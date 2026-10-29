/* plan.js — competencias reales y los dos calendarios (estructurado y brutal).
   Es sólo datos: el módulo de calendario los renderiza, los deja editar y los exporta. */
(function (global) {
  'use strict';
  var App = global.App || (global.App = {});

  /* ---------- Competencias confirmadas ---------- */
  var EVENTOS = [
    { id: 'colomba', fecha: '2026-10-18', nombre: 'Ida a Colomba (travesía)', deporte: 'mtb',
      km: null, prioridad: 'C', lugar: 'Colomba', desnivel: 800,
      nota: 'Travesía con ~800 m de desnivel positivo. Es salida larga con montaña: ritmo constante, hidratación y comida desde el inicio, sin competir.' },
    { id: 'capis', fecha: '2026-10-18', nombre: 'Rodada con los Capis', deporte: 'mtb',
      km: null, prioridad: 'C', lugar: 'Por confirmar', nota: 'Rodada de grupo. Sirve como salida larga en bici.' },
    { id: 'rodada100', fecha: '2026-11-01', nombre: 'Rodada de 100 km, 2.000 m D+ (6:00)', deporte: 'bici',
      km: 100, prioridad: 'B', lugar: 'Por confirmar', desnivel: 2000,
      nota: 'Salida a las 6:00, 100 km con 2.000 m D+: tu salida más larga del año y, por desnivel, el ensayo de verdad para el sueño de 2.000 m. Ritmo Z2 constante, sube sentado y a cadencia 75–90, come 60 g de carbohidrato por hora desde la primera y bebe con sodio. Siete días antes de Campanabaj: si la espalda o el pie molestan, acorta, no aprietes. Al terminar, la milla de la racha y la prevención lumbar.' },
    { id: 'campana', fecha: '2026-11-08', nombre: 'Campanabaj MTB, Totonicapán', deporte: 'mtb',
      km: 30, prioridad: 'B', lugar: 'Totonicapán', desnivel: 1200, nota: '30 km con 1.200 m de desnivel positivo y altura (~2.500 m). Con altura y 1.200 m D+, una semana después de los 100 km. Ese día sólo la milla de la racha, al bajarte de la bici.' },
    { id: 'senderos', fecha: '2026-11-15', nombre: 'Entre Senderos MTB', deporte: 'mtb',
      km: 50, prioridad: 'B', lugar: 'Por confirmar', desnivel: 1500, nota: '50 km con 1.500 m D+ de montaña, 6 días antes de la Guatemágica. Ritmo de Z2 constante, come desde la hora 1 y no compitas; luego la milla de la racha.' },
    { id: 'sanfelipe', fecha: '2026-11-19', nombre: '5K y 10K San Felipe', deporte: 'atletismo',
      km: 5, prioridad: 'C', lugar: 'San Felipe, Retalhuleu',
      nota: 'Dos días antes de la Guatemágica. Sólo el 5K y sólo a ritmo de 15K, o no corras.' },
    { id: 'guatemagica', fecha: '2026-11-21', nombre: 'Guatemágica Nocturna 15K (19:00)', deporte: 'atletismo',
      km: 15, prioridad: 'A', lugar: 'Retalhuleu',
      nota: 'La carrera A del año: exactamente la distancia de tu meta de 15K a 5:00/km. Sale a las 19:00: bici suave de 40 min por la mañana o la tarde (terminada ≥3 h antes), comida principal a las 15:30.' },
    { id: 'xab', fecha: '2026-11-22', nombre: 'Xab Sibaná MTB (8:00)', deporte: 'mtb',
      km: 22, prioridad: 'C', lugar: 'Por confirmar', desnivel: 700,
      nota: 'MTB de 22 km con 700 m D+ (sale más tarde que la otra opción, Dec Santo Tomás: 30 km, 800 m D+, con rifa de una bici), apenas 13 horas después de la Guatemágica. Rodada suave en Z2, sin competir; camina o baja el ritmo en las subidas y, al terminar, la milla de la racha.' }
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
    C: { nom: 'boxeo', min: 20, items: ['5 rounds de 3 min en el saco, 1 min de pausa', '3 × 2 min de cuerda'] },
    P: { nom: 'espalda baja y cadera', min: 12, items: ['2 rondas, sin dolor (una molestia leve está bien; el dolor que sube, no)', 'Gato-camello · 10 lentos', 'Bird-dog con pausa de 5 s · 8 por lado', 'Dead bug · 8 por lado', 'Plancha lateral · 30 s por lado', 'Puente de glúteo con pausa de 3 s · 12', 'Estiramiento del flexor de cadera en rodilla · 45 s por lado'] },
    E: { nom: 'equilibrio y estabilidad', min: 10, items: ['2 rondas', 'Equilibrio a una pierna con los ojos cerrados · 30 s por lado', 'Bajada lateral de escalón, 3 s · 8 por pierna', 'Caminata lateral con banda · 12 pasos por lado', 'Elevación de talón a una pierna, bajada de 3 s · 12 por pierna', 'Zancada con giro de tronco · 8 por lado'] },
    U: { nom: 'pesas sin cargar el pie', min: 30, items: ['3 rondas; todo sentado, tumbado o de rodillas, con el pie golpeado sin apoyo de puntas', 'Press de pecho en el suelo o en banco con mancuernas · 8–12', 'Remo a una mano con rodilla y mano en el banco · 10 por lado', 'Press de hombros sentado con mancuernas · 8–10', 'Dominadas con banda o negativas de 4 s · 3–6 (bájate sin saltar)', 'Curl de bíceps sentado + extensión de tríceps · 12 + 12', 'Puente de glúteo apoyando talones · 12–15 (sólo si no duele)', 'Plancha con rodillas apoyadas · 30–40 s'] },
    G: { nom: 'boxeo sin desplazamiento (sólo golpes)', min: 20, items: ['De pie y fijo, peso en el talón y en el pie sano; sin pivotar sobre la punta del pie golpeado, sin cuerda ni saltos', '5 rounds de 2 min al saco o al aire, 1 min de pausa: jab, directo, ganchos y uppercuts con giro de cadera, no de pie', 'Si al girar o al cargar el pie molesta, hazlo sentado en un banco (sólo brazos y tronco)', 'Cierra con 2 × 30 s de golpes rápidos sin potencia'] },
    Z: { nom: 'core y tren superior sin cargar el pie', min: 15, items: ['2 rondas, todo sentado o tumbado; si el pie molesta, sáltalo', 'Plancha sobre los antebrazos con las rodillas apoyadas · 30 s', 'Dead-bug lento · 8 por lado', 'Press de hombros sentado con mancuernas · 10', 'Remo con banda sentado · 12', 'Elevación de piernas tumbado, rodillas flexionadas · 10', 'Plancha lateral sobre la rodilla · 20 s por lado'] },
    /* V-taper: espalda ancha y hombros contra cintura estrecha. Mancuerna de 25 lb, kettlebell, barra, banda y barra de dominadas; todo sentado o de pie sin cargar la punta del pie. */
    V: { nom: 'V-taper · dorsales y hombro lateral', min: 14, items: ['3 rondas, sin llegar al fallo (deja 1–2 repeticiones en reserva) y 45–60 s de pausa entre ejercicios', 'Dominadas con banda o negativas de 4 s · 3–6 (agarre ancho, pecho hacia la barra, codos hacia las caderas)', 'Remo a una mano con mancuerna · 10 por lado (el codo va a la cadera; no encojas el hombro hacia la oreja)', 'Pull-over con una mancuerna tumbado · 12 (costillas abajo, sin arquear la espalda)', 'Elevación lateral con mancuerna ligera o botellas de 1,5 L · 12–15 (codo apenas flexionado, sube hasta la altura del hombro)'] },
    W: { nom: 'V-taper · hombro posterior, lateral y postura', min: 12, items: ['3 rondas, ligero y con técnica; la bici y el escritorio redondean los hombros y esto lo corrige', 'Elevación lateral con mancuerna ligera o botellas · 12–15', 'Pájaro (elevación posterior) inclinado con mancuernas ligeras · 15', 'Jalón a la cara con banda (face pull) · 15, apretando los omóplatos 1 s', 'Retracción de omóplatos con banda, brazos en «W» · 10 + estiramiento de pectoral en el marco de la puerta · 30 s por lado'] },
    L: { nom: 'V-taper · sólo laterales', min: 5, items: ['3 × 12–15 elevaciones laterales con mancuerna ligera o botellas, 45 s de pausa', 'Se hace incluso los días de fuerza fuerte y la víspera de un evento: es poco volumen y casi no fatiga'] }
  };

  // Fila = [fecha, tipo, descripción, km de carrera, minutos de bici, id de evento]
  var ESTRUCTURADO = [
    ['2026-10-05', 'R', 'R', 2, 0, null],
    ['2026-10-06', 'Q', 'Q', 6, 0, null],
    ['2026-10-07', 'B', '4 km fácil AM + bici Z2 PM', 4, 60, null],
    ['2026-10-08', 'E', 'E + fuerza A', 5, 0, null],
    ['2026-10-09', 'R', 'R + fuerza B', 2, 0, null],
    ['2026-10-10', 'E', 'E corto + 4 rectas (pre-carrera)', 4, 0, null],
    ['2026-10-11', 'E', 'E suave (el 15K Trail se canceló)', 5, 0, null],
    ['2026-10-12', 'R', 'R', 2, 0, null],
    ['2026-10-13', 'E', 'E', 4, 0, null],
    ['2026-10-14', 'Q', 'Q', 6, 0, null],
    ['2026-10-15', 'Q', 'Q AM (calentamiento largo) + trote de la racha PM', 6, 0, null],
    ['2026-10-16', 'R', 'R AM + fuerza B PM', 3, 0, null],
    ['2026-10-17', 'E', 'E AM + 4 rectas (víspera de Colomba)', 4, 0, null],
    ['2026-10-18', 'B', 'Ida a Colomba (hecha) + sólo la milla de la racha (lluvia, piernas y espalda cargadas)', 1.6, 180, 'colomba'],
    ['2026-10-19', 'R', 'R AM + trote de la racha PM', 2, 0, null],
    ['2026-10-20', 'E', 'E con 4 rectas + fuerza A PM (si la espalda lo permite)', 4, 0, null],
    ['2026-10-21', 'H', 'HIIT AM (5 × 3 min) + trote de la racha PM', 6, 0, null],
    ['2026-10-22', 'Q', 'Q', 9, 0, null],
    ['2026-10-23', 'R', 'R + fuerza B', 2, 0, null],
    ['2026-10-24', 'F', 'FTP en bici AM + 3 km off-bike (brick)', 3, 90, null],
    ['2026-10-25', 'L', 'L', 12, 0, null],
    ['2026-10-26', 'R', 'R', 2, 0, null],
    ['2026-10-27', 'Q', 'Q', 8, 0, null],
    ['2026-10-28', 'B', '4 km fácil AM + bici Z2 PM', 4, 60, null],
    ['2026-10-29', 'H', 'HIIT + fuerza A', 7, 0, null],
    ['2026-10-30', 'R', 'R + fuerza B', 2, 0, null],
    ['2026-10-31', 'F', 'FTP en bici + 4 km fácil', 4, 75, null],
    ['2026-11-01', 'B', 'Rodada de 100 km, 2.000 m D+ (salida 6:00, unas 6–7 h) + trote o caminata de la racha 1,6 km al terminar', 1.6, 390, 'rodada100'],
    ['2026-11-02', 'R', 'R', 2, 0, null],
    ['2026-11-03', 'Q', 'Q', 8.5, 0, null],
    ['2026-11-04', 'B', '4 km fácil AM + bici Z2 PM', 4, 60, null],
    ['2026-11-05', 'S', 'Sprints cortos (activación, 3 días antes de Campanabaj) + fuerza A', 5, 0, null],
    ['2026-11-06', 'R', 'R + fuerza B', 2, 0, null],
    ['2026-11-07', 'E', 'E', 4, 0, null],
    ['2026-11-08', 'C', 'Campanabaj MTB (30 km, 1.200 m D+) + milla de la racha al bajar', 1.6, 240, 'campana'],
    ['2026-11-09', 'R', 'R', 2, 0, null],
    ['2026-11-10', 'Q', 'Q', 8, 0, null],
    ['2026-11-11', 'S', 'Sprints cortos + fuerza A', 5, 0, null],
    ['2026-11-12', 'L', 'L', 14, 0, null],
    ['2026-11-13', 'R', 'R + fuerza B', 2, 0, null],
    ['2026-11-14', 'R', 'R', 2, 0, null],
    ['2026-11-15', 'B', 'Entre Senderos MTB (50 km, 1.500 m D+) + milla de la racha al bajar', 1.6, 300, 'senderos'],
    ['2026-11-16', 'R', 'R', 2, 0, null],
    ['2026-11-17', 'Q', 'Q de afinación: 3 × 2 km a ritmo de 15K', 8, 0, null],
    ['2026-11-18', 'S', 'Sprints cortos (activación) + fuerza A ligera (2 rondas)', 5, 0, null],
    ['2026-11-19', 'C', 'C', 6.5, 0, 'sanfelipe'],
    ['2026-11-20', 'D', 'D', 1.6, 0, null],
    ['2026-11-21', 'C', 'Bici suave 40 min (mañana o tarde, ≥3 h antes) + Guatemágica Nocturna 15K a las 19:00', 15.1, 40, 'guatemagica'],
    ['2026-11-22', 'B', 'Xab Sibaná MTB 8:00 (22 km, 700 m D+; alternativa: Dec Santo Tomás 30 km/800 m D+; rodada suave tras la Guatemágica) + milla de la racha', 1.6, 120, 'xab'],
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
    ['2026-10-10', 'E', 'E corto + rectas + bici suave (pre-carrera)', 4, 20, null],
    ['2026-10-11', 'E', 'E suave (el 15K Trail se canceló)', 5, 0, null],
    ['2026-10-12', 'R', 'R AM + bici suave + fuerza C PM', 3, 30, null],
    ['2026-10-13', 'E', 'E AM + bici Z2 PM', 5, 40, null],
    ['2026-10-14', 'Q', 'Q AM + bici suave PM', 7, 30, null],
    ['2026-10-15', 'R', 'R AM + bici suave PM', 3, 30, null],
    ['2026-10-16', 'Q', 'Q AM + bici suave PM', 7, 30, null],
    ['2026-10-17', 'E', 'E AM + bici Z2 + fuerza B PM', 5, 50, null],
    ['2026-10-18', 'M', 'Ida a Colomba (hecha) + sólo la milla de la racha (lluvia, piernas y espalda cargadas)', 1.6, 210, 'colomba'],
    ['2026-10-19', 'R', 'R AM + bici suave PM', 3, 30, null],
    ['2026-10-20', 'E', 'E AM + bici Z2 PM (primero la espalda)', 5, 40, null],
    ['2026-10-21', 'H', 'HIIT AM + bici suave PM', 8, 30, null],
    ['2026-10-22', 'Q', 'Q AM + bici suave PM', 8, 30, null],
    ['2026-10-23', 'R', 'R AM + bici suave + fuerza B PM', 3, 30, null],
    ['2026-10-24', 'B', 'Bici larga + 4 km off-bike (brick)', 4, 150, null],
    ['2026-10-25', 'L', 'L', 16, 0, null],
    ['2026-10-26', 'R', 'R AM + bici suave + fuerza C PM', 3, 30, null],
    ['2026-10-27', 'Q', 'Q AM + bici suave PM', 10, 30, null],
    ['2026-10-28', 'V', 'Sprints bici PM + 3 km off-bike', 3, 75, null],
    ['2026-10-29', 'S', 'Sprints cortos AM + fuerza A PM', 6, 0, null],
    ['2026-10-30', 'R', 'R AM + bici suave + fuerza B PM', 3, 30, null],
    ['2026-10-31', 'B', 'Bici fondo + 4 km off-bike (brick)', 4, 120, null],
    ['2026-11-01', 'B', 'Rodada de 100 km, 2.000 m D+ (salida 6:00, unas 6–7 h) + trote o caminata de la racha 1,6 km al terminar', 1.6, 390, 'rodada100'],
    ['2026-11-02', 'R', 'R AM + bici suave + fuerza C PM', 3, 30, null],
    ['2026-11-03', 'Q', 'Q AM + bici suave PM', 10, 30, null],
    ['2026-11-04', 'E', 'E AM + bici Z2 + fuerza A PM', 6, 40, null],
    ['2026-11-05', 'S', 'Sprints cortos (activación) + bici suave PM', 6, 30, null],
    ['2026-11-06', 'R', 'R AM + bici suave + fuerza B PM', 3, 30, null],
    ['2026-11-07', 'E', 'E AM + bici Z2 PM', 4, 40, null],
    ['2026-11-08', 'M', 'Campanabaj MTB (30 km, 1.200 m D+) + milla de la racha al bajar', 1.6, 240, 'campana'],
    ['2026-11-09', 'R', 'R AM + bici suave PM', 3, 30, null],
    ['2026-11-10', 'H', 'HIIT AM + bici suave PM', 8, 30, null],
    ['2026-11-11', 'E', 'E AM + bici Z2 + fuerza A PM', 7, 40, null],
    ['2026-11-12', 'L', 'L (más corto: el domingo son 50 km de MTB)', 14, 0, null],
    ['2026-11-13', 'R', 'R AM + bici suave + fuerza B PM', 3, 30, null],
    ['2026-11-14', 'S', 'Sprints cortos (activación) + bici Z2 PM', 5, 30, null],
    ['2026-11-15', 'C', 'Entre Senderos MTB (50 km, 1.500 m D+) + milla de la racha al bajar', 1.6, 300, 'senderos'],
    ['2026-11-16', 'R', 'R', 3, 0, null],
    ['2026-11-17', 'Q', 'Q de afinación: 3 × 2 km a ritmo de 15K', 9, 0, null],
    ['2026-11-18', 'S', 'Sprints cortos (activación) + fuerza A ligera (2 rondas)', 5, 0, null],
    ['2026-11-19', 'C', 'C', 8, 0, 'sanfelipe'],
    ['2026-11-20', 'R', 'R', 2, 0, null],
    ['2026-11-21', 'C', 'Bici suave 40 min (mañana o tarde, ≥3 h antes) + Guatemágica Nocturna 15K a las 19:00', 15.1, 40, 'guatemagica'],
    ['2026-11-22', 'B', 'Xab Sibaná MTB 8:00 (22 km, 700 m D+; alternativa: Dec Santo Tomás 30 km/800 m D+; rodada suave tras la Guatemágica) + milla de la racha', 1.6, 120, 'xab'],
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
    ['2026-10-10', 'E', 'E corto + 4 rectas (pre-carrera)', 4, 0, null],
    ['2026-10-11', 'E', 'E suave (el 15K Trail se canceló)', 5, 0, null],
    ['2026-10-12', 'R', 'R', 2, 0, null],
    ['2026-10-13', 'E', 'E', 5, 0, null],
    ['2026-10-14', 'Q', 'Q', 7, 0, null],
    ['2026-10-15', 'Q', 'Q AM (calentamiento largo) + trote de la racha PM', 7, 0, null],
    ['2026-10-16', 'R', 'R AM + fuerza B PM', 3, 0, null],
    ['2026-10-17', 'E', 'E AM + bici suave PM', 5, 30, null],
    ['2026-10-18', 'M', 'Ida a Colomba (hecha) + sólo la milla de la racha (lluvia, piernas y espalda cargadas)', 1.6, 210, 'colomba'],
    ['2026-10-19', 'R', 'R AM + trote de la racha PM', 3, 0, null],
    ['2026-10-20', 'E', 'E AM + fuerza A PM (primero la espalda)', 5, 0, null],
    ['2026-10-21', 'H', 'HIIT AM + bici suave PM', 8, 30, null],
    ['2026-10-22', 'Q', 'Q', 9, 0, null],
    ['2026-10-23', 'R', 'R + fuerza B', 2, 0, null],
    ['2026-10-24', 'F', 'FTP PM + 4 km off-bike (brick)', 4, 90, null],
    ['2026-10-25', 'L', 'L', 14, 0, null],
    ['2026-10-26', 'R', 'R', 2, 0, null],
    ['2026-10-27', 'H', 'HIIT', 8, 0, null],
    ['2026-10-28', 'B', '5 km fácil AM + bici Z2 PM', 5, 60, null],
    ['2026-10-29', 'S', 'Sprints AM + fuerza A PM', 6, 0, null],
    ['2026-10-30', 'R', 'R + fuerza B', 2, 0, null],
    ['2026-10-31', 'F', 'FTP en bici + 3 km fácil', 3, 75, null],
    ['2026-11-01', 'B', 'Rodada de 100 km, 2.000 m D+ (salida 6:00, unas 6–7 h) + trote o caminata de la racha 1,6 km al terminar', 1.6, 390, 'rodada100'],
    ['2026-11-02', 'R', 'R', 2, 0, null],
    ['2026-11-03', 'Q', 'Q', 9, 0, null],
    ['2026-11-04', 'F', 'FTP PM + 3 km off-bike (brick)', 3, 70, null],
    ['2026-11-05', 'S', 'Sprints cortos (activación) + fuerza A', 6, 0, null],
    ['2026-11-06', 'R', 'R + fuerza B', 2, 0, null],
    ['2026-11-07', 'E', 'E', 4, 0, null],
    ['2026-11-08', 'M', 'Campanabaj MTB (30 km, 1.200 m D+) + milla de la racha al bajar', 1.6, 240, 'campana'],
    ['2026-11-09', 'R', 'R', 2, 0, null],
    ['2026-11-10', 'H', 'HIIT', 8, 0, null],
    ['2026-11-11', 'S', 'Sprints + fuerza A', 6, 0, null],
    ['2026-11-12', 'L', 'L (corto: el domingo son 50 km de MTB)', 13, 0, null],
    ['2026-11-13', 'R', 'R + fuerza B', 2, 0, null],
    ['2026-11-14', 'R', 'R', 2, 0, null],
    ['2026-11-15', 'B', 'Entre Senderos MTB (50 km, 1.500 m D+) + milla de la racha al bajar', 1.6, 300, 'senderos'],
    ['2026-11-16', 'R', 'R', 2, 0, null],
    ['2026-11-17', 'Q', 'Q de afinación: 3 × 2 km a ritmo de 15K', 8, 0, null],
    ['2026-11-18', 'S', 'Sprints cortos (activación) + fuerza A ligera (2 rondas)', 5, 0, null],
    ['2026-11-19', 'C', 'C', 6.5, 0, 'sanfelipe'],
    ['2026-11-20', 'D', 'D', 1.6, 0, null],
    ['2026-11-21', 'C', 'Bici suave 40 min (mañana o tarde, ≥3 h antes) + Guatemágica Nocturna 15K a las 19:00', 15.1, 40, 'guatemagica'],
    ['2026-11-22', 'B', 'Xab Sibaná MTB 8:00 (22 km, 700 m D+; alternativa: Dec Santo Tomás 30 km/800 m D+; rodada suave tras la Guatemágica) + milla de la racha', 1.6, 120, 'xab'],
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
      resumen: 'El punto medio: calidad de verdad —HIIT, sprints, FTP y una montaña fuerte— sobre una base parecida a la estructurada, pero con un día libre real y descargas cada cuarta semana. Un brick por semana (bici fuerte y 3–4 km en seco al bajar) y uno o dos dobles AM/PM. El trail del 11 de octubre se corre a tempo, no a muerte.',
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
      texto: 'Un 10K a fondo el jueves 19 te quita entre 20 y 40 segundos por kilómetro el sábado. Si vas, corre sólo el 5K a ritmo de 15K y trátalo como activación.' }
  ];

  /* Disponibilidad real de Emilio: cada día, una ventana de 5:30 a 7:30 para UN deporte (bici, correr, trail, HIIT);
     desde las 18:00, lo que no se hizo por la mañana o pesas. Los domingos largos salen a las 5:30 y pueden pasar de las 7:30. */
  var HORARIO = { semana: 'mañana 5:30–7:30 (un deporte) · noche desde las 18:00 (pesas o lo pendiente)', sabado: 'mañana 5:30–7:30 (un deporte) · noche desde las 18:00', domingo: 'desde las 5:30 (aquí van los largos y las travesías)' };

  App.plan = { HORARIO: HORARIO, EVENTOS: EVENTOS, PLANES: PLANES, TIPOS: TIPOS, RUTINAS: RUTINAS, CONFLICTOS: CONFLICTOS };
})(this);
