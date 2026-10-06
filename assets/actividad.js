/* actividad.js — componente reutilizable «Detalle de la actividad, por deporte».
   A partir de un día del plan y de tus zonas reales (D.zonas) arma la referencia de qué hacer:
   ritmo objetivo al correr, intensidad en la bici y la rutina de fuerza. Sólo construye HTML. */
(function (global) {
  'use strict';
  var App = global.App, esc = App.esc, F = App.fmt, P = App.plan;
  var EVT = {};
  (P.EVENTOS || []).forEach(function (e) { EVT[e.id] = e; });

  function pr(z, k) { return z && z[k] ? F.pace(z[k]) + '/km' : '—'; }
  function rango(z) { return (z && z.facilRapido ? F.pace(z.facilRapido) : '—') + '–' + pr(z, 'facilLento'); }

  /* ---------- referencia al correr ---------- */
  var RUN = {
    E: function (z) { return { nom: 'Fácil', ritmo: rango(z), est: ['Rodaje continuo y relajado.'], nota: 'Debes poder hablar en frases completas. Si no puedes, vas demasiado rápido.' }; },
    R: function (z) { return { nom: 'Recuperación', ritmo: 'más lento que ' + pr(z, 'facilLento'), est: ['Trote muy suave para soltar las piernas.'], nota: 'Sin mirar el reloj. Si algo molesta, camina.' }; },
    L: function (z) { return { nom: 'Largo', ritmo: pr(z, 'facilLento') + ' (últimos 15–20 min a ' + pr(z, 'maraton') + ' si te sientes bien)', est: ['Rodaje largo a ritmo fácil y constante.', 'Come e hidrata si pasa de 75 min.'], nota: 'Construye resistencia, no es día de velocidad.' }; },
    Q: function (z) { return { nom: 'Calidad (tempo / umbral)', ritmo: pr(z, 'umbral'), est: ['Calienta 15 min suave.', '20 min continuos a umbral, o 4 × 8 min con 2 min de trote.', 'Enfría 10 min.'], nota: 'Esfuerzo «cómodamente duro»: sólo te saldrían pocas palabras.' }; },
    H: function (z) { return { nom: 'HIIT (VO₂máx)', ritmo: pr(z, 'intervalo'), est: ['Calienta 15 min + 4 rectas progresivas.', '5–6 × 3 min a ritmo intervalo, con 3 min de trote entre cada uno.', 'Enfría 10 min.'], nota: 'Duro pero repetible: el último intervalo igual de rápido que el primero.' }; },
    S: function (z) { return { nom: 'Sprints / velocidad', ritmo: pr(z, 'repeticion') + ' o más rápido', est: ['Calienta bien, incluye movilidad.', '8–10 × 20 s muy rápidos, con 60–90 s de recuperación completa.'], nota: 'Son neuromusculares: prioriza la técnica y no acumules fatiga.' }; },
    T: function () { return { nom: 'Trail duro', ritmo: 'por esfuerzo, no por GPS · subidas a 8/10', est: ['Calienta 10–15 min en llano.', 'Sube fuerte; baja controlando la técnica.'], nota: 'En trail el ritmo del reloj engaña: guíate por la respiración y las piernas. En altura, baja una marcha.' }; },
    C: function (z) { return { nom: 'Carrera', ritmo: 'ritmo de competencia', est: ['Calienta según la distancia.', 'Corre tu plan de carrera, no el de los demás.'], nota: 'Referencia de ritmos por zona: fácil ' + rango(z) + ', umbral ' + pr(z, 'umbral') + '.' }; }
  };

  /* ---------- referencia en la bici (sin potenciómetro: RPE + zona + cómo se siente) ---------- */
  var BICI = {
    B: { nom: 'Fondo (Z2)', inten: 'RPE 3–4 · Z2 · puedes conversar', est: ['Rodaje constante, cadencia 85–95 rpm.', 'Come e hidrata si pasa de 90 min.'], nota: 'La base aeróbica se construye aquí, sin héroes.' },
    F: { nom: 'FTP (umbral funcional)', inten: 'RPE 7–8 · justo por debajo de «ya no puedo hablar»', est: ['Calienta 15 min.', '2–3 × 15–20 min al umbral, con 5 min suave entre bloques.', 'Enfría 10 min.'], nota: 'Sin potenciómetro: usa el máximo esfuerzo que aguantarías alrededor de una hora.' },
    V: { nom: 'Sprints en bici', inten: 'RPE 10 · máximos', est: ['Calienta 20 min.', '6–10 × 30 s a tope, con 4–5 min de recuperación muy suave.'], nota: 'Recupera completo entre sprints: buscas potencia pico, no fundirte.' },
    M: { nom: 'Montaña dura', inten: 'RPE 7–9 en las subidas · Z3–Z4', est: ['Busca 2–4 subidas largas y súbelas fuerte.', 'Recupera en el llano y la bajada; cuida la técnica en lo técnico.'], nota: 'Tu mejor ensayo para el sueño de 2.000 m de desnivel.' }
  };

  var CORTO_RUN = {
    E: function (z) { return rango(z); }, R: function () { return 'suave'; },
    L: function (z) { return pr(z, 'facilLento'); }, Q: function (z) { return 'umbral ' + pr(z, 'umbral'); },
    H: function (z) { return 'VO₂ ' + pr(z, 'intervalo'); }, S: function (z) { return 'sprints ' + pr(z, 'repeticion'); },
    T: function () { return 'por esfuerzo'; }, C: function () { return 'ritmo carrera'; }
  };
  var CORTO_BICI = { B: 'Z2', F: 'FTP', V: 'sprints', M: 'montaña' };

  function esRun(dia, T) { return dia.km >= 3 || T.deporte === 'run'; }
  function esBici(dia, T) { return dia.minBici > 0 || T.deporte === 'bici'; }

  /* Una línea corta para la celda del calendario y para «Lo que te toca hoy». */
  function corto(dia, D) {
    var z = D && D.zonas, T = P.TIPOS[dia.tipo] || {};
    if (esRun(dia, T)) { var f = CORTO_RUN[dia.tipo] || CORTO_RUN.E; return f(z); }
    if (esBici(dia, T)) return CORTO_BICI[dia.tipo] || 'Z2';
    return '';
  }

  function bloque(icono, titulo, lineas, est, nota) {
    return "<div class='act'><h5>" + icono + ' ' + esc(titulo) + '</h5>' +
      lineas.map(function (l) { return '<p>' + l + '</p>'; }).join('') +
      (est && est.length ? '<ul>' + est.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ul>' : '') +
      (nota ? "<p class='n'><small>" + esc(nota) + '</small></p>' : '') + '</div>';
  }

  /* HTML completo para el modal: tantos bloques como deportes tenga el día. */
  function detalle(dia, D) {
    var z = D && D.zonas, T = P.TIPOS[dia.tipo] || {}, ev = dia.evento ? EVT[dia.evento] : null, out = '';

    if (ev) out += bloque('🏁', ev.nombre,
      ['<b>' + esc(ev.lugar || 'Lugar por confirmar') + '</b> · prioridad ' + esc(ev.prioridad)], null, ev.nota);

    if (esRun(dia, T)) {
      var r = (RUN[dia.tipo] || RUN.E)(z);
      out += bloque('🏃', 'Correr — ' + r.nom,
        ['<b>Ritmo objetivo:</b> ' + esc(r.ritmo)].concat(dia.km >= 1 ? ['<b>Distancia:</b> ' + F.num(dia.km, 1) + ' km'] : []),
        r.est, r.nota);
    }

    if (esBici(dia, T)) {
      var b = BICI[dia.tipo] || BICI.B;
      out += bloque('🚴', 'Bici — ' + b.nom,
        ['<b>Intensidad:</b> ' + esc(b.inten)].concat(dia.minBici ? ['<b>Duración:</b> ' + F.num(dia.minBici, 0) + ' min'] : []),
        b.est, b.nota);
    }

    var m = /fuerza ([ABC])/.exec(dia.sesion || '');
    if (m) {
      var ru = P.RUTINAS[m[1]];
      if (ru) out += bloque('💪', 'Fuerza ' + m[1] + ' — ' + ru.nom + ' (' + ru.min + ' min)', [], ru.items, 'En casa, antes o después del rodaje fácil.');
    }

    if (dia.tipo === 'D') out += bloque('🛌', 'Descanso', ['Día libre de verdad: sin correr ni rodar.'], ['Camina, estira, duerme bien.'], 'El descanso es parte del plan, no un premio.');

    return out || "<p><small>Sin sesión programada este día.</small></p>";
  }

  App.actividad = { detalle: detalle, corto: corto };
})(this);
