/* notas.js — bitácora del entrenador: un análisis corto por día, escrito a mano a partir de los datos de Strava.
   Se muestra en Hoy («Los últimos 15 días», módulo bitacora.js) y en la pestaña «Análisis» del día en el calendario.
   Para añadir un día: 'AAAA-MM-DD': { t: 'titular', n: 'análisis' }. */
(function (global) {
  'use strict';
  var App = global.App || (global.App = {});

  App.notas = {
    resumen: { desde: '2026-10-26', hasta: '2026-11-09', t: 'Quince días de bloque fuerte',
      n: 'Del 26 oct al 9 nov: 27,2 h de bici, 407 km y 8.424 m de desnivel, 52 km a pie y 6 sesiones de pesas. En los 15 días anteriores fueron 4,9 h de bici: la carga de bici se multiplicó por más de 5 en dos semanas, sin un día sin bici salvo el 31 oct. Lo bueno: el pie aguanta trotes diarios de 2–6 km, completaste los 100 km y Campanabaj, y la Candelaria del 9 nov (18,1 km/h) fue más rápida que la del 6 con la misma fatiga. La señal a vigilar: el pulso de los trotes suaves sube (140 lpm el 5 nov a ~7:10/km frente a 118–129 en octubre) y casi todas las salidas de bici tienen FC media de 140–148, sin días de verdad suaves. «Fuerte todos los días» funciona si lo fuerte son dos o tres sesiones a la semana y el resto es suave de verdad; si no, el cansancio se come la forma (lo que pasó en la Candelaria del 6).' },
    '2026-10-26': { t: 'Arranque prudente', n: 'MTB de 66 min y 206 m a las 7:00 (FC 138), trote de la racha de 2,6 km muy suave (FC 119) y 22 min de pesas. Buen primer día tras dos semanas casi sin bici por el pie.' },
    '2026-10-27': { t: 'Primera calidad', n: 'MTB de 55 min y 283 m con FC media 144 y máxima 191: calidad de verdad. Por la noche 3 km a FC 118: lo fuerte fuerte y lo suave suave, como debe ser.' },
    '2026-10-28': { t: 'Primera salida larga', n: '30,5 km y 468 m en 1 h 51 (FC 140). Por la noche 6,1 km de trote con los dos últimos km a ~6:15/km y FC 128: el pie ya tolera 6 km.' },
    '2026-10-29': { t: 'Doble de 6 km', n: 'MTB de 25,7 km y 524 m (sin banda de pulso; 163 W estimados, la media más alta de la semana), otro trote de 6 km (FC 129) y 22 min de pesas. Dos días seguidos de 6 km: el volumen a pie sube rápido después del golpe.' },
    '2026-10-30': { t: 'Más duro de lo previsto', n: '«Entre senderos train»: 22,2 km y 426 m con FC media 146, máxima 196 y esfuerzo relativo 159, a dos días de los 100 km (el plan pedía Z2). Racha de 2,2 km.' },
    '2026-10-31': { t: 'Día de familia', n: 'Sólo la milla de la racha y un paseo. Descanso real antes de la rodada: bien hecho.' },
    '2026-11-01': { t: '100 km', n: 'Rodada de 100,5 km y 1.871 m en 5 h 55 en movimiento: la salida más larga del año. Además 5 km de trote esa noche (FC 132) y 15 min de pesas. Strava duplicó la actividad (121,6 km); esa copia está excluida.' },
    '2026-11-02': { t: 'Recuperación activa', n: 'Al día siguiente, 23 km y 444 m de bici suave (97 W) y 4 km de trote a ~7:40/km con pesas. Razonable tras los 100 km.' },
    '2026-11-03': { t: 'Segunda más dura del bloque', n: 'MTB de 32,7 km y 817 m en 2 h 09 (FC 145, máxima 193, esfuerzo relativo 203), dos días después de los 100 km. Trote de 3,3 km suave.' },
    '2026-11-04': { t: 'El día más ligero', n: 'Bici de 16 km y 413 m suave y la racha de 2 km con un primer km de 21 min (¿una pausa o caminata?). Útil para absorber la carga.' },
    '2026-11-05': { t: 'Fatiga acumulada', n: '«Entreno Entre Senderos»: 31,2 km y 746 m en 2 h 30 sin parar (FC 148 y esfuerzo relativo 264, el más alto del bloque fuera de los 100 km). El trote de 4 km salió con FC 140, el pulso más alto de tus trotes suaves: señal de cansancio.' },
    '2026-11-06': { t: 'Candelaria cansado', n: 'La ruta de Candelaria a 17,3 km/h llegando con 15 h y 4.718 m de bici en la semana (detalle en Ruta Candelaria). Trote de 4 km y 16 min de laterales y pierna.' },
    '2026-11-07': { t: 'Víspera acortada', n: '18,4 km y 277 m en 88 min (el plan decía 3 h y 700 m) con FC 141. Acortarla la víspera de Campanabaj fue la decisión correcta. Racha de 2 km.' },
    '2026-11-08': { t: 'Campanabaj', n: '25,7 km y 803 m en 2 h 05 en movimiento (3 h 25 en total), más unos 6 km de traslados. Sin banda de pulso, así que no hay esfuerzo medido. Racha de 4 km a ~7:40/km (FC 131).' },
    '2026-11-09': { t: 'Candelaria a fondo', n: '«Candelaria full gas» al día siguiente de Campanabaj: 24,1 km y 511 m a 18,1 km/h (FC 147, máxima 184, esfuerzo relativo 134), 0,8 km/h más rápido que el 6 nov con una fatiga parecida. Racha de 2,2 km muy lenta (FC 130) y 30 min de pesas. Buena señal de forma, pero llevas 15 días seguidos de bici: mañana la MTB de 480 m va en Z2.' },
    '2026-11-10': { t: 'Piernas fuertes, pero no fue Z2', n: '«Entreno Entre Senderos Travesía»: 27,3 km y 535 m en 1 h 51 (FC 143, máxima 193, esfuerzo relativo 160) con 151 W de media, la potencia más alta en MTB desde el 29 oct, y eso tras Campanabaj y la Candelaria a fondo. Es tu tercer día seguido de esfuerzo alto, y Entre Senderos es el domingo. Esta noche, trote de 3 km con FC por debajo de 130 y pesas A ligeras. El miércoles conviene un día suave de verdad antes de volver a meter intervalos.' }
  };
})(this);
