/* pictos.js — pictogramas de ejercicios (SVG de trazo, viewBox 48) para las rutinas del plan.
   App.pictos.svg(id) devuelve el SVG de un ejercicio; App.pictos.tira(items) convierte la lista de
   una rutina en una cuadrícula de fichas (pictograma + texto del ejercicio); lo que no es ejercicio
   («3 rondas», notas de técnica, calidad) queda como lista al pie. Estilo de trazo como icons.js:
   sólo currentColor, así funciona en claro, oscuro e impresión. Sólo construye cadenas. */
(function (global) {
  'use strict';
  var App = global.App || (global.App = {});

  /* Cada postura: h = cabeza, t = tronco (cuello → cadera), b = brazos, p = piernas,
     x = accesorios detrás (suelo, banco, saco), z = accesorios delante (mancuernas, banda). */
  var PINTA = {
    sentadilla: { h: [19, 11], t: [[19, 15], [21, 27]],
      b: [[[19, 17], [24, 26]], [[19, 17], [16, 26]]],
      p: [[[21, 27], [29, 34], [30, 43]], [[21, 27], [13, 31], [7, 34]]],
      x: [['l', 4, 34, 15, 34], ['l', 5, 34, 5, 42], ['l', 14, 34, 14, 42], ['l', 16, 43, 44, 43]],
      z: [['db', 24, 26, 0], ['db', 16, 26, 0]] },
    pdr: { h: [14, 19], t: [[17, 21], [30, 24]],
      b: [[[18, 22], [17, 32]], [[18, 22], [21, 31]]],
      p: [[[30, 24], [31, 33], [31, 43]], [[30, 24], [41, 20]]],
      x: [['l', 16, 43, 44, 43]],
      z: [['bell', 17, 36]] },
    flexion: { h: [9, 19], t: [[13, 21], [33, 27]],
      b: [[[14, 22], [14, 40]], [[16, 22], [17, 40]]],
      p: [[[33, 27], [43, 42]]],
      x: [['l', 4, 43, 46, 43], ['l', 10, 41, 19, 41], ['l', 11, 41, 11, 43], ['l', 18, 41, 18, 43]] },
    press_hombros: { h: [16, 13], t: [[17, 17], [20, 31]],
      b: [[[17, 19], [25, 23], [26, 13]], [[17, 19], [23, 24], [24, 15]]],
      p: [[[20, 31], [29, 34], [30, 42]]],
      x: [['l', 14, 32, 34, 32], ['l', 14, 32, 14, 18], ['l', 16, 32, 16, 42], ['l', 32, 32, 32, 42], ['l', 9, 43, 40, 43]],
      z: [['db', 26, 11, -1.5708], ['db', 24, 13, -1.5708]] },
    dominada: { h: [24, 13], t: [[24, 17], [24, 30]],
      b: [[[24, 18], [19, 6]], [[24, 18], [29, 6]]],
      p: [[[24, 30], [21, 38]], [[24, 30], [28, 38]]],
      x: [['l', 7, 6, 41, 6]] },
    remo_barra: { h: [13, 19], t: [[16, 21], [31, 26]],
      b: [[[17, 23], [19, 32]], [[18, 23], [21, 32]]],
      p: [[[31, 26], [33, 35], [33, 43]], [[31, 26], [30, 35], [31, 43]]],
      x: [['l', 8, 43, 44, 43]],
      z: [['bar', 13, 33, 27, 33]] },
    puente_barra: { h: [8, 38], t: [[11, 38], [26, 31]],
      b: [[[13, 37], [20, 30]]],
      p: [[[26, 31], [34, 26], [35, 41]]],
      x: [['l', 4, 41, 44, 41]],
      z: [['bar', 20, 29, 32, 29]] },
    kb_swing: { h: [18, 15], t: [[21, 18], [27, 27]],
      b: [[[22, 20], [25, 30]], [[23, 20], [26, 30]]],
      p: [[[27, 27], [23, 35], [22, 43]], [[27, 27], [32, 35], [33, 43]]],
      x: [['l', 8, 43, 40, 43]],
      z: [['bell', 26, 33]] },
    boxeo_pie: { h: [13, 12], t: [[14, 16], [16, 28]],
      b: [[[15, 18], [24, 19], [32, 18]], [[15, 18], [20, 23], [16, 25]]],
      p: [[[16, 28], [11, 36], [10, 43]], [[16, 28], [22, 36], [24, 43]]],
      x: [['l', 6, 43, 42, 43]] },
    boxeo_sentado: { h: [23, 12], t: [[22, 16], [21, 31]],
      b: [[[22, 18], [30, 19], [38, 18]], [[22, 18], [26, 23], [22, 25]]],
      p: [[[21, 31], [30, 34], [31, 42]]],
      x: [['l', 12, 32, 34, 32], ['l', 12, 32, 12, 20], ['l', 14, 32, 14, 42], ['l', 32, 32, 32, 42], ['l', 7, 43, 41, 43]] },
    saco: { h: [13, 12], t: [[14, 16], [16, 28]],
      b: [[[15, 18], [24, 19], [30, 19]], [[15, 18], [20, 23], [16, 25]]],
      p: [[[16, 28], [11, 36], [10, 43]], [[16, 28], [22, 36], [24, 43]]],
      x: [['l', 4, 43, 44, 43], ['path', "M36 5v34"], ['rect', 31, 5, 9, 34]] },
    cuerda: { h: [24, 10], t: [[24, 14], [24, 25]],
      b: [[[24, 16], [19, 23]], [[24, 16], [29, 23]]],
      p: [[[24, 25], [21, 32], [23, 37]], [[24, 25], [28, 32], [26, 37]]],
      x: [['l', 8, 43, 40, 43], ['path', 'M18 24 C 8 46, 40 46, 30 24']] },
    gato: { h: [10, 32], t: [[14, 29], [24, 25], [33, 29]],
      b: [[[14, 29], [12, 43]]],
      p: [[[33, 29], [32, 43], [39, 43]]],
      x: [['l', 4, 43, 44, 43]] },
    bird_dog: { h: [13, 27], t: [[17, 27], [31, 27]],
      b: [[[17, 27], [15, 43]], [[17, 26], [8, 19]]],
      p: [[[31, 27], [30, 43], [38, 43]], [[31, 27], [42, 20]]],
      x: [['l', 4, 43, 44, 43]] },
    dead_bug: { h: [10, 37], t: [[14, 37], [30, 37]],
      b: [[[15, 37], [15, 26]], [[16, 37], [9, 32]]],
      p: [[[30, 37], [31, 27], [38, 27]], [[30, 37], [41, 34]]],
      x: [['l', 4, 40, 44, 40]] },
    plancha_lateral: { h: [12, 22], t: [[15, 26], [39, 40]],
      b: [[[15, 27], [11, 43], [18, 43]], [[15, 26], [15, 14]]],
      p: [[[39, 40], [44, 42]]],
      x: [['l', 4, 43, 46, 43]] },
    plancha_lateral_rodilla: { h: [13, 23], t: [[16, 27], [30, 38]],
      b: [[[16, 28], [12, 43], [19, 43]], [[16, 27], [16, 15]]],
      p: [[[30, 38], [33, 43], [41, 43]]],
      x: [['l', 4, 43, 46, 43]] },
    plancha_rodillas: { h: [10, 28], t: [[14, 32], [33, 41]],
      b: [[[14, 33], [11, 43], [20, 43]]],
      p: [[[33, 41], [40, 38]]],
      x: [['l', 4, 43, 44, 43]] },
    puente_gluteo: { h: [8, 39], t: [[11, 39], [26, 32]],
      b: [[[13, 39], [7, 41]]],
      p: [[[26, 32], [34, 27], [35, 42]]],
      x: [['l', 4, 42, 44, 42]] },
    flexor: { h: [25, 10], t: [[25, 14], [24, 27]],
      b: [[[25, 16], [30, 26]]],
      p: [[[24, 27], [31, 35], [31, 43]], [[24, 27], [17, 43], [9, 43]]],
      x: [['l', 4, 43, 44, 43]] },
    equilibrio: { h: [24, 9], t: [[24, 13], [24, 26]],
      b: [[[24, 16], [18, 21]], [[24, 16], [30, 21]]],
      p: [[[24, 26], [24, 43]], [[24, 26], [30, 33], [29, 39]]],
      x: [['l', 8, 43, 40, 43]] },
    escalon: { h: [16, 6], t: [[16, 10], [16, 22]],
      b: [[[16, 12], [10, 17]], [[16, 12], [23, 17]]],
      p: [[[16, 22], [16, 34]], [[16, 22], [23, 31], [24, 43]]],
      x: [['l', 4, 43, 44, 43], ['l', 6, 34, 20, 34], ['l', 6, 34, 6, 43], ['l', 20, 34, 20, 43]] },
    banda_lateral: { h: [24, 10], t: [[24, 14], [24, 26]],
      b: [[[24, 17], [19, 23]], [[24, 17], [29, 23]]],
      p: [[[24, 26], [19, 35], [18, 43]], [[24, 26], [30, 35], [31, 43]]],
      x: [['l', 8, 43, 40, 43]],
      z: [['path', 'M19.5 33 Q24 37 29.5 33']] },
    talon: { h: [23, 9], t: [[23, 13], [23, 26]],
      b: [[[23, 16], [17, 21]], [[23, 16], [29, 21]]],
      p: [[[23, 26], [23, 38], [23, 41], [28, 43]], [[23, 26], [30, 33], [29, 39]]],
      x: [['l', 8, 43, 40, 43]] },
    zancada_giro: { h: [22, 10], t: [[22, 14], [23, 27]],
      b: [[[22, 17], [31, 20], [38, 17]]],
      p: [[[23, 27], [31, 35], [31, 43]], [[23, 27], [15, 36], [9, 42]]],
      x: [['l', 6, 43, 44, 43]] },
    press_pecho: { h: [8, 39], t: [[11, 39], [27, 39]],
      b: [[[13, 38], [13, 27]], [[17, 38], [17, 27]]],
      p: [[[27, 39], [34, 31], [35, 42]]],
      x: [['l', 4, 42, 44, 42]],
      z: [['db', 13, 24, -1.5708], ['db', 17, 24, -1.5708]] },
    remo_mancuerna: { h: [9, 23], t: [[12, 25], [30, 28]],
      b: [[[12, 26], [9, 30]], [[13, 27], [19, 32], [26, 29]]],
      p: [[[30, 28], [24, 30], [23, 39]], [[30, 28], [36, 36], [37, 43]]],
      x: [['l', 4, 30, 30, 30], ['l', 6, 30, 6, 42], ['l', 28, 30, 28, 42], ['l', 4, 43, 46, 43]],
      z: [['db', 27, 29, -1.5708]] },
    remo_banda: { h: [21, 21], t: [[20, 25], [16, 38]],
      b: [[[20, 26], [25, 31]], [[20, 26], [24, 33]]],
      p: [[[16, 38], [37, 40]], [[37, 40], [37, 35]]],
      x: [['l', 4, 42, 46, 42]],
      z: [['path', 'M36 39 Q30 35 25 31']] },
    curl: { h: [23, 12], t: [[22, 16], [21, 31]],
      b: [[[22, 18], [28, 25], [24, 21]], [[22, 18], [26, 26], [23, 23]]],
      p: [[[21, 31], [30, 34], [31, 42]]],
      x: [['l', 13, 32, 33, 32], ['l', 13, 32, 13, 19], ['l', 15, 32, 15, 42], ['l', 31, 32, 31, 42], ['l', 8, 43, 40, 43]],
      z: [['db', 24, 21, 0]] },
    pajaro: { h: [13, 17], t: [[16, 19], [31, 26]],
      b: [[[17, 21], [11, 28]], [[17, 21], [24, 27]]],
      p: [[[31, 26], [33, 35], [33, 43]], [[31, 26], [30, 35], [31, 43]]],
      x: [['l', 8, 43, 44, 43]],
      z: [['db', 10, 29, 0.8], ['db', 25, 28, 2.3]] },
    face_pull: { h: [19, 12], t: [[20, 16], [20, 28]],
      b: [[[20, 18], [27, 18], [24, 13]], [[20, 18], [26, 20], [23, 15]]],
      p: [[[20, 28], [16, 36], [15, 43]], [[20, 28], [25, 36], [26, 43]]],
      x: [['l', 8, 43, 40, 43], ['l', 45, 9, 45, 19]],
      z: [['path', 'M24 13 Q34 10 45 12'], ['path', 'M23 15 Q34 16 45 17']] },
    retraccion_w: { h: [24, 11], t: [[24, 15], [24, 27]],
      b: [[[24, 17], [20, 24], [15, 20]], [[24, 17], [28, 24], [33, 20]]],
      p: [[[24, 27], [20, 35], [19, 43]], [[24, 27], [28, 35], [29, 43]]],
      x: [['l', 8, 43, 40, 43]],
      z: [['path', 'M15 20 Q24 27 33 20']] },
    pull_over: { h: [12, 39], t: [[15, 39], [30, 39]],
      b: [[[16, 38], [9, 33]], [[18, 38], [11, 32]]],
      p: [[[30, 39], [37, 32], [38, 42]]],
      x: [['l', 4, 42, 44, 42]],
      z: [['db', 8, 31, 0.5]] },
    elevacion_lateral: { h: [24, 10], t: [[24, 14], [24, 27]],
      b: [[[24, 17], [17, 19], [10, 19]], [[24, 17], [31, 19], [38, 19]]],
      p: [[[24, 27], [19, 35], [18, 43]], [[24, 27], [29, 35], [30, 43]]],
      x: [['l', 8, 43, 40, 43]],
      z: [['db', 9, 19, -1.5708], ['db', 39, 19, -1.5708]] },
    elevacion_piernas: { h: [7, 39], t: [[10, 39], [26, 39]],
      b: [[[13, 40], [19, 41]]],
      p: [[[26, 39], [33, 30], [40, 33]]],
      x: [['l', 4, 42, 44, 42]] }
  };

  var NOM = {
    sentadilla: 'Sentadilla búlgara', pdr: 'Peso muerto a una pierna', flexion: 'Flexiones',
    press_hombros: 'Press de hombros', dominada: 'Dominadas', remo_barra: 'Remo con barra',
    puente_barra: 'Puente con barra', kb_swing: 'Balanceo de kettlebell', boxeo_pie: 'Golpes de pie',
    boxeo_sentado: 'Golpes sentado', saco: 'Saco de boxeo', cuerda: 'Cuerda saltar',
    gato: 'Gato-camello', bird_dog: 'Bird-dog', dead_bug: 'Dead bug',
    plancha_lateral: 'Plancha lateral', plancha_lateral_rodilla: 'Plancha lateral (rodilla)',
    plancha_rodillas: 'Plancha de rodillas', puente_gluteo: 'Puente de glúteo',
    flexor: 'Estiramiento de flexor', equilibrio: 'Equilibrio a una pierna',
    escalon: 'Bajada de escalón', banda_lateral: 'Caminata con banda', talon: 'Elevación de talón',
    zancada_giro: 'Zancada con giro', press_pecho: 'Press de pecho en el suelo',
    remo_mancuerna: 'Remo a una mano', remo_banda: 'Remo con banda sentado', curl: 'Curl de bíceps', pajaro: 'Pájaro (posterior)',
    face_pull: 'Face pull', retraccion_w: 'Retracción en W', pull_over: 'Pull-over',
    elevacion_lateral: 'Elevación lateral', elevacion_piernas: 'Elevación de piernas'
  };

  /* Lista de comprobación: de la línea del ejercicio (plan.js RUTINAS) a su pictograma.
     Ordenada de más concreta a más genérica. Lo que no aparece aquí es nota, no ejercicio. */
  var MAPA = [
    [/Sentadilla búlgara/, 'sentadilla'],
    [/Peso muerto rumano/, 'pdr'],
    [/Flexiones con soportes/, 'flexion'],
    [/Press de hombros/, 'press_hombros'],
    [/Dominadas/, 'dominada'],
    [/Remo inclinado con la barra/, 'remo_barra'],
    [/Puente de glúteo con la barra/, 'puente_barra'],
    [/Balanceo de kettlebell/, 'kb_swing'],
    [/golpes rápidos|al saco o al aire|jab, directo/, 'boxeo_pie'],
    [/Si al girar o al cargar el pie molesta/, 'boxeo_sentado'],
    [/en el saco/, 'saco'],
    [/de cuerda/, 'cuerda'],
    [/Gato-camello/, 'gato'],
    [/Bird-dog/, 'bird_dog'],
    [/Dead[- ]bug/, 'dead_bug'],
    [/Plancha lateral sobre la rodilla/, 'plancha_lateral_rodilla'],
    [/Plancha lateral/, 'plancha_lateral'],
    [/Plancha con rodillas|Plancha sobre los antebrazos con las rodillas/, 'plancha_rodillas'],
    [/Puente de glúteo con pausa|Puente de glúteo apoyando talones/, 'puente_gluteo'],
    [/flexor de cadera/, 'flexor'],
    [/Equilibrio a una pierna/, 'equilibrio'],
    [/Bajada lateral de escalón/, 'escalon'],
    [/Caminata lateral con banda/, 'banda_lateral'],
    [/Elevación de talón/, 'talon'],
    [/Zancada con giro/, 'zancada_giro'],
    [/Press de pecho/, 'press_pecho'],
    [/Remo a una mano/, 'remo_mancuerna'],
    [/Remo con banda sentado/, 'remo_banda'],
    [/Curl de bíceps/, 'curl'],
    [/Pájaro/, 'pajaro'],
    [/Jalón a la cara/, 'face_pull'],
    [/Retracción de omóplatos/, 'retraccion_w'],
    [/Pull-over/, 'pull_over'],
    [/Elevación de piernas/, 'elevacion_piernas'],
    [/elevaci[oó]n lateral|elevaciones laterales/, 'elevacion_lateral']
  ];

  function poly(pts, w) {
    return "<polyline points='" + pts.map(function (p) { return p[0] + ',' + p[1]; }).join(' ') +
      "' stroke-width='" + w + "'/>";
  }

  function prop(a) {
    var t = a[0], s = " stroke-width='2.2'";
    if (t === 'l') return "<path d='M" + a[1] + ' ' + a[2] + 'L' + a[3] + ' ' + a[4] + "'" + s + '/>';
    if (t === 'path') return "<path d='" + a[1] + "'" + s + '/>';
    if (t === 'rect') return "<rect x='" + a[1] + "' y='" + a[2] + "' width='" + a[3] + "' height='" + a[4] + "' rx='4'" + s + '/>';
    if (t === 'c') return "<circle cx='" + a[1] + "' cy='" + a[2] + "' r='" + a[3] + "'" + s + '/>';
    if (t === 'bell') {   // kettlebell: campana + asa
      return "<circle cx='" + a[1] + "' cy='" + (a[2] + 1) + "' r='3'" + s + "/><path d='M" +
        (a[1] - 2.2) + ' ' + (a[2] - 2.6) + 'Q' + a[1] + ' ' + (a[2] - 6) + ' ' + (a[1] + 2.2) + ' ' + (a[2] - 2.6) + "'" + s + '/>';
    }
    if (t === 'bar') {    // barra: eje + dos discos en los extremos
      return "<path d='M" + a[1] + ' ' + a[2] + 'L' + a[3] + ' ' + a[4] + "'" + s + "/><circle cx='" +
        a[1] + "' cy='" + a[2] + "' r='3'" + s + "/><circle cx='" + a[3] + "' cy='" + a[4] + "' r='3'" + s + '/>';
    }
    if (t === 'db') {     // mancuerna: asa + dos discos a lo largo del eje (ángulo en radianes)
      var an = a[3] || 0, dx = Math.cos(an) * 2.8, dy = Math.sin(an) * 2.8;
      return "<path d='M" + (a[1] - dx) + ' ' + (a[2] - dy) + 'L' + (a[1] + dx) + ' ' + (a[2] + dy) + "'" + s +
        "/><circle cx='" + (a[1] - dx) + "' cy='" + (a[2] - dy) + "' r='2.2'" + s +
        "/><circle cx='" + (a[1] + dx) + "' cy='" + (a[2] + dy) + "' r='2.2'" + s + '/>';
    }
    return '';
  }

  function svg(id, cls) {
    var d = PINTA[id];
    if (!d) return '';
    var s = '';
    (d.x || []).forEach(function (a) { s += prop(a); });
    (d.p || []).forEach(function (q) { s += poly(q, 3.2); });
    if (d.t) s += poly(d.t, 3.4);
    (d.b || []).forEach(function (q) { s += poly(q, 2.8); });
    (d.z || []).forEach(function (a) { s += prop(a); });
    if (d.h) s += "<circle cx='" + d.h[0] + "' cy='" + d.h[1] + "' r='3.4' fill='currentColor' stroke='none'/>";
    return "<svg class='pi" + (cls ? ' ' + cls : '') + "' viewBox='0 0 48 48' fill='none' stroke='currentColor' " +
      "stroke-width='2.6' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true' focusable='false'>" + s + '</svg>';
  }

  function deItem(txt) {
    for (var i = 0; i < MAPA.length; i++) if (MAPA[i][0].test(txt)) return MAPA[i][1];
    return null;
  }

  /* La lista de una rutina → cuadrícula de fichas con pictograma; las notas («3 rondas»,
     técnica, calidad) quedan como lista al pie. Devuelve '' si ningún ejercicio tiene picto. */
  function tira(items) {
    var esc = App.esc || function (x) { return x; };
    var fichas = [], notas = [];
    (items || []).forEach(function (it) {
      var id = deItem(it);
      if (id) fichas.push("<figure class='ej'>" + svg(id) + '<figcaption>' + esc(it) + '</figcaption></figure>');
      else notas.push('<li>' + esc(it) + '</li>');
    });
    if (!fichas.length) return '';
    return "<div class='ejgrid'>" + fichas.join('') + '</div>' +
      (notas.length ? "<ul class='ej-notas'>" + notas.join('') + '</ul>' : '');
  }

  /* La rutina entera por letra (P.RUTINAS[k].items). */
  function rutina(k) {
    var r = App.plan && App.plan.RUTINAS && App.plan.RUTINAS[k];
    return r ? tira(r.items) : '';
  }

  App.pictos = { svg: svg, deItem: deItem, tira: tira, rutina: rutina, PINTA: PINTA, NOM: NOM };
})(this);
