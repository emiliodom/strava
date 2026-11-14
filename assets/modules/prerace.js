/* prerace.js — Módulo 20: análisis reciente y guía Pre Race Day para MTB, 5K y 10K. */
(function (global) {
  'use strict';
  var App = global.App, U = App.ui, esc = App.esc, F = App.fmt;

  var PLANES = {
    mtb: {
      nom: 'MTB',
      foco: 'Llega con piernas vivas y cabeza tranquila: no persigas potencia, cuida técnica, hidratación y decisiones limpias.',
      ejercicios: [
        'Víspera (10-12 min): movilidad de cadera, 2 x 30 s plancha lateral, 2 x 10 puente de glúteo, 2 x 10 sentadilla sin carga.',
        'Activación race day (12-15 min): 8 min de pedaleo progresivo + 3 x 30 s en Z3 con 90 s suaves + 3 aceleraciones de 8 s.',
        'Post carrera (8-10 min): caminar 3-5 min + respiración nasal + estiramiento suave de flexores y glúteo.'
      ],
      mental: [
        '"No tengo que demostrar nada hoy; sólo ejecutar bien cada tramo."',
        '"Subo con paciencia, bajo con margen, y termino entero."',
        '"Si el terreno cambia, yo me adapto sin pánico."'
      ],
      checklist: [
        'Bici: presión de llantas según terreno, frenos, cadena lubricada, cambios finos.',
        'Kit: cámara/plug, bomba o CO2, multiherramienta, eslabón rápido.',
        'Nutrición: 60-80 g CH/h, 500-750 ml/h, sodio listo desde salida.',
        'Ropa: guantes, capa ligera, número/dorsal, luces si aplica.',
        'Plan A/B: ritmo conservador primera hora y plan de recorte si hay dolor.'
      ]
    },
    k5: {
      nom: '5K',
      foco: 'Controla salida y respira: el 5K se gana por ritmo inteligente, no por adrenalina al inicio.',
      ejercicios: [
        'Víspera (8-10 min): trote suave 10-15 min + 4 rectas de 15-20 s, sin fatigar.',
        'Activación race day (12 min): trote 8 min + movilidad tobillo/cadera + 3 x 20 s a ritmo de carrera.',
        'Post carrera (6-8 min): trote muy suave o caminata + 2 min respiración para bajar pulsaciones.'
      ],
      mental: [
        '"Primer kilómetro con control: hoy no regalo el final."',
        '"Corro suelto, hombros bajos, zancada corta y firme."',
        '"Del km 3 al 5 compito con cabeza, no con miedo."'
      ],
      checklist: [
        'Zapatillas y calcetines ya probados; nada nuevo el día de carrera.',
        'Reloj cargado y lap automático por kilómetro activo.',
        'Desayuno ligero 2-3 h antes y agua en sorbos, sin exceso.',
        'Calentamiento terminado 8-12 min antes del disparo.',
        'Plan de ritmo: salida controlada, progresar desde mitad.'
      ]
    },
    k10: {
      nom: '10K',
      foco: 'Ritmo parejo y reserva mental: del km 1 al 7 se administra, del 8 al 10 se compite.',
      ejercicios: [
        'Víspera (10-12 min): 15-20 min fácil + 4 rectas cortas + movilidad dinámica.',
        'Activación race day (14-16 min): 10 min suave + 3 x 45 s ritmo 10K con 75 s suaves.',
        'Post carrera (8-10 min): caminata activa y descarga de gemelo/soleo + hidratación.'
      ],
      mental: [
        '"Voy en economía: cada kilómetro vale igual."',
        '"Si aparece la duda, vuelvo a la técnica y la respiración."',
        '"Del km 8 al 10 cierro fuerte porque guardé energía al inicio."'
      ],
      checklist: [
        'Objetivo de ritmo por bloques: km 1-3 control, km 4-7 estable, km 8-10 progresivo.',
        'Hidratación previa simple, sin inventos ni suplementos nuevos.',
        'Kit de carrera listo desde la noche: dorsal, imperdibles, reloj, ropa.',
        'Llegar con tiempo para calentar y ubicar salida/baños.',
        'Revisión final: cordones firmes, reloj iniciado, respiración tranquila.'
      ]
    }
  };

  function restaDias(iso, n) {
    var d = new Date(iso + 'T12:00:00');
    d.setDate(d.getDate() - n);
    var m = d.getMonth() + 1, dd = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (dd < 10 ? '0' : '') + dd;
  }

  function resumenReciente(D) {
    var acts = D.acts.filter(function (a) { return !a.anomalia; });
    if (!acts.length) return '<p>No hay actividades recientes para analizar.</p>';
    var fin = acts[acts.length - 1].fechaISO;
    var ini = restaDias(fin, 13);
    var r = acts.filter(function (a) { return a.fechaISO >= ini && a.fechaISO <= fin; });
    var run = r.filter(function (a) { return a.grupo === 'running'; });
    var mtb = r.filter(function (a) { return a.grupo === 'mtb'; });
    var bici = r.filter(function (a) { return a.grupo === 'ruta' || a.grupo === 'mtb'; });
    var fuerza = r.filter(function (a) { return a.grupo === 'fuerza'; });
    var runKm = run.reduce(function (s, a) { return s + a.km; }, 0);
    var runMin = run.reduce(function (s, a) { return s + a.min; }, 0);
    var biciKm = bici.reduce(function (s, a) { return s + a.km; }, 0);
    var mtbD = mtb.reduce(function (s, a) { return s + a.elev; }, 0);
    var carga = r.reduce(function (s, a) { return s + a.carga; }, 0);
    var pace = runKm > 0 ? (runMin * 60) / runKm : null;
    var ultRun = run.length ? run[run.length - 1] : null;
    var ultMtb = mtb.length ? mtb[mtb.length - 1] : null;
    return U.kpis([
      U.kpi('Últimos 14 días', F.fecha(ini) + ' a ' + F.fecha(fin), F.num(r.length, 0) + ' actividades'),
      U.kpi('Running', F.num(runKm, 1) + ' km', pace ? F.pace(pace) + '/km promedio' : 'sin carrera reciente'),
      U.kpi('Bici total', F.num(biciKm, 0) + ' km', F.num(mtbD, 0) + ' m+ en MTB'),
      U.kpi('Carga y fuerza', F.num(carga, 0), F.num(fuerza.length, 0) + ' sesiones de fuerza')
    ]) +
      U.note('Lectura rápida',
        (ultRun ? 'Última carrera: ' + esc(ultRun.nombre) + ' (' + F.fecha(ultRun.fechaISO) + '). ' : 'No hay carrera reciente. ') +
        (ultMtb ? 'Última MTB: ' + esc(ultMtb.nombre) + ' (' + F.fecha(ultMtb.fechaISO) + ').' : 'No hay MTB reciente.'), 'ok');
  }

  function lista(items) {
    return '<ul>' + items.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>';
  }

  function panel(id, p, abierto) {
    return "<section data-prerace-panel='" + id + "'" + (abierto ? '' : " hidden") + '>' +
      U.note('Foco del día', esc(p.foco), 'ok') +
      U.coach('Ejercicios (víspera y race day)', lista(p.ejercicios)) +
      U.coach('Notas mentales positivas', lista(p.mental)) +
      U.acc('Checklist de preparación', lista(p.checklist), true) +
      '</section>';
  }

  function render(D) {
    return U.modhead('20', 'Pre Race Day', 'Análisis reciente y guía de ejecución para MTB, 5K y 10K: ejercicios, enfoque mental y checklist.') +
      resumenReciente(D) +
      "<div class='seg' data-prerace-tabs>" +
      "<button type='button' data-prerace-tab='mtb' aria-pressed='true'>MTB</button>" +
      "<button type='button' data-prerace-tab='k5' aria-pressed='false'>5K</button>" +
      "<button type='button' data-prerace-tab='k10' aria-pressed='false'>10K</button>" +
      '</div>' +
      panel('mtb', PLANES.mtb, true) +
      panel('k5', PLANES.k5, false) +
      panel('k10', PLANES.k10, false) +
      U.note('Regla final', 'Nada nuevo el día de carrera: ni equipo, ni comida, ni estrategia. Sólo ejecutar lo ya probado.', 'warn');
  }

  function montar(el) {
    var tabs = App.$$('[data-prerace-tab]', el);
    var panels = App.$$('[data-prerace-panel]', el);
    function activar(id) {
      tabs.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-prerace-tab') === id ? 'true' : 'false'); });
      panels.forEach(function (p) { p.hidden = p.getAttribute('data-prerace-panel') !== id; });
    }
    tabs.forEach(function (b) {
      b.addEventListener('click', function () { activar(b.getAttribute('data-prerace-tab')); });
    });
  }

  App.mods.push({ id: 'prerace', nom: 'Pre Race Day', tab: 'Pre Race', icono: 'M6 20h12M6 4h12M8 4v4l4 2 4-2V4M8 20v-4l4-2 4 2v4', render: render, montar: montar });
})(this);
