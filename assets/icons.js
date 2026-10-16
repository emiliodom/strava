/* icons.js — iconos de trazo (viewBox 24) para sesiones del plan, estados y páginas. Sólo devuelve cadenas SVG. */
(function (global) {
  'use strict';
  var App = global.App || (global.App = {});

  var P = {
    run: "<circle cx='14.5' cy='4.5' r='1.6'/><path d='M13 8l-3 4 3 3-1 5M10 12l-4 1M13.5 9l3 2.5 3 .5M13 15l3 2 .5 3'/>",
    bici: "<circle cx='6' cy='16' r='3.5'/><circle cx='18' cy='16' r='3.5'/><path d='M6 16l4-7h5l3 7M10 9l3 7M9 6h3'/>",
    fuerza: "<path d='M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11'/>",
    descanso: "<path d='M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z'/>",
    carrera: "<path d='M5 21V4M5 4h11l-2 4 2 4H5'/>",
    rayo: "<path d='M13 3L5 13h6l-1 8 8-10h-6z'/>",
    sprint: "<path d='M5 6l6 6-6 6M12 6l6 6-6 6'/>",
    monte: "<path d='M3 19l6-11 4 7 2-3 6 7z'/>",
    largo: "<circle cx='6' cy='18' r='2'/><circle cx='18' cy='6' r='2'/><path d='M8 18h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7'/>",
    suave: "<path d='M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z'/>",
    medidor: "<path d='M4 17a8 8 0 1 1 16 0M12 17l4-5'/>",
    tempo: "<circle cx='12' cy='13' r='7.5'/><path d='M12 9v4l3 2M9.5 3h5'/>",
    hecho: "<circle cx='12' cy='12' r='9'/><path d='M8 12.5l3 3 5-6'/>",
    parcial: "<circle cx='12' cy='12' r='9'/><path d='M12 3a9 9 0 0 1 0 18z' fill='currentColor'/>",
    falla: "<circle cx='12' cy='12' r='9'/><path d='M9 9l6 6M15 9l-6 6'/>",
    pdf: "<path d='M6 3h8l4 4v14H6zM14 3v4h4M9 13h6M9 17h6'/>",
    imprimir: "<path d='M7 8V3h10v5M7 17H4v-7h16v7h-3M7 14h10v7H7z'/>",
    // páginas
    p_hoy: "<circle cx='12' cy='12' r='4'/><path d='M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1'/>",
    p_cal: "<path d='M3 9h18M7 3v4M17 3v4M4 5h16v16H4z'/>",
    p_rend: "<path d='M4 20V10M10 20V4M16 20v-8M22 20H2'/>",
    p_metas: "<circle cx='12' cy='12' r='9'/><circle cx='12' cy='12' r='5'/><circle cx='12' cy='12' r='1.2'/>",
    p_cuerpo: "<circle cx='12' cy='5' r='2'/><path d='M12 8v7M8 10l4-2 4 2M9 21l3-6 3 6'/>",
    p_registro: "<path d='M6 3h12v18H6zM9 8h6M9 12h6M9 16h4'/>"
  };

  function svg(nombre, cls) {
    return "<svg class='ic" + (cls ? ' ' + cls : '') + "' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.9' " +
      "stroke-linecap='round' stroke-linejoin='round' aria-hidden='true' focusable='false'>" + (P[nombre] || '') + '</svg>';
  }

  // Icono principal por tipo de sesión del plan (App.plan.TIPOS).
  var TIPO_ICONO = { E: 'run', Q: 'tempo', L: 'largo', R: 'suave', H: 'rayo', S: 'sprint', T: 'monte',
    B: 'bici', F: 'medidor', V: 'rayo', M: 'monte', D: 'descanso', C: 'carrera', P: 'hecho' };
  // Familia de color: la intensidad manda, el icono distingue la sesión.
  var TIPO_FAMILIA = { E: 'suave', R: 'suave', Q: 'duro', H: 'duro', S: 'duro', F: 'duro', V: 'duro',
    L: 'monte', T: 'monte', M: 'monte', B: 'bici', D: 'libre', C: 'carrera', P: 'libre' };
  var FAMILIAS = [
    ['suave', 'Fácil / recuperación'], ['duro', 'Calidad e intensidad'], ['monte', 'Largo y montaña'],
    ['bici', 'Bici de fondo'], ['carrera', 'Competencia'], ['libre', 'Descanso']
  ];

  App.icons = { svg: svg, TIPO_ICONO: TIPO_ICONO, TIPO_FAMILIA: TIPO_FAMILIA, FAMILIAS: FAMILIAS };
})(this);
