/* running.js — motor de carrera: VDOT, ritmos de entrenamiento y distribución de intensidad. */
(function (global) {
  'use strict';
  var App = global.App, U = App.ui, C = App.chart, F = App.fmt, M = App.metrics, S = App.stat, h = App.h, raw = App.raw;

  var ZONA_NOM = {
    facil: 'Fácil (E)', maraton: 'Maratón (M)', umbral: 'Umbral (T)',
    intervalo: 'Intervalo (I)', repeticion: 'Repetición (R)'
  };
  var ZONA_USO = {
    facil: 'El 80% de tus kilómetros. Debes poder hablar en frases completas.',
    maraton: 'Tramos largos a ritmo de carrera larga. 20–40 min seguidos.',
    umbral: 'Tempo de 20 min o series de 8–15 min. Esfuerzo «cómodamente duro».',
    intervalo: 'Series de 3–5 min para subir el VO₂máx. Recuperación igual de larga.',
    repeticion: 'Series de 200–400 m para economía y velocidad. Recuperación completa.'
  };

  function render(D) {
    var e = D.est, z = D.zonas, vdot = D.vdot;
    if (!vdot) return '<p>No hay datos suficientes para estimar el VDOT.</p>';

    var metas = [
      { nom: '5K a 4:00/km', m: 5000, obj: 1200 },
      { nom: '10K a 5:00/km', m: 10000, obj: 3000 },
      { nom: '15K a 5:00/km', m: 15000, obj: 4500 },
      { nom: '21K bajo 2 h', m: 21097, obj: 7200 }
    ];
    var largoKm = Math.max.apply(null, D.runs.map(function (a) { return a.km; }).concat([0]));

    var filasMeta = metas.map(function (g) {
      var p = M.predecir(vdot, g.m, largoKm);
      // VDOT necesario: búsqueda binaria sobre tiempoDeVdot
      var lo = 25, hi = 80, nec = null;
      for (var i = 0; i < 60; i++) {
        var mid = (lo + hi) / 2;
        if (M.tiempoDeVdot(mid, g.m) > g.obj) lo = mid; else { hi = mid; nec = mid; }
      }
      nec = nec || hi;
      var falta = nec - vdot;
      return [
        App.esc(g.nom),
        F.hms(p.real, g.m > 9000),
        F.hms(g.obj, g.m > 9000),
        F.num(nec, 1),
        "<span style='color:" + (falta <= 0 ? 'var(--ok)' : falta < 3 ? 'var(--warn)' : 'var(--bad)') + "'>" +
          (falta <= 0 ? 'ya lo tienes' : '+' + F.num(falta, 1)) + '</span>'
      ];
    });

    /* ---- ritmos de entrenamiento ---- */
    var filasZona = Object.keys(ZONA_NOM).map(function (k) {
      var v = k === 'facil' ? null : z[k];
      var txt = k === 'facil' ? F.pace(z.facilRapido) + '–' + F.pace(z.facilLento) : F.pace(v);
      return [App.esc(ZONA_NOM[k]), '<b>' + txt + '/km</b>', App.esc(ZONA_USO[k])];
    });

    /* ---- distribución de intensidad ---- */
    var it = D.intensidad;
    var gInt = C.hbars([
      { label: 'Z1 · fácil', v: it.pct.z1, color: 'var(--z1)', text: F.pct(it.pct.z1, 1) + ' · ' + F.num(it.km.z1, 0) + ' km' },
      { label: 'Z2 · umbral', v: it.pct.z2, color: 'var(--z3)', text: F.pct(it.pct.z2, 1) + ' · ' + F.num(it.km.z2, 0) + ' km' },
      { label: 'Z3 · alta', v: it.pct.z3, color: 'var(--z5)', text: F.pct(it.pct.z3, 1) + ' · ' + F.num(it.km.z3, 0) + ' km' }
    ], { max: 100 });

    /* ---- ritmo mediano por mes ---- */
    var rm = e.running_mediana_por_mes || {};
    var mesesR = Object.keys(rm).sort();
    var seg = mesesR.map(function (m) {
      var p = String(rm[m].ritmo_mediano).split(':');
      return (+p[0]) * 60 + (+p[1]);
    });
    var gRitmo = C.lines({
      labels: mesesR.map(F.mesCorto),
      series: [{ name: 'Ritmo mediano', color: 'var(--accent)', values: seg.map(function (v) { return -v; }), width: 2, dots: true }],
      height: 200, labelEvery: 1,
      fmtY: function (v) { return F.pace(-v); }, fmtVal: function (v) { return F.paceKm(-v); },
      label: 'Ritmo mediano por mes',
      caption: 'Eje invertido: más arriba es más rápido. De ' + (rm[mesesR[0]] || {}).ritmo_mediano + '/km en ' + F.mesLargo(mesesR[0]) + ' a ' + (rm[mesesR[mesesR.length - 1]] || {}).ritmo_mediano + '/km ahora.'
    });

    /* ---- mejores esfuerzos ---- */
    var filasEsf = D.mejorPorDist.slice().sort(function (a, b) { return a.metros - b.metros; }).map(function (x) {
      return [App.esc(x.dist), F.hms(x.seg), F.paceKm(x.seg / (x.metros / 1000)), F.fecha(x.fecha), F.num(x.vdot, 1)];
    });

    /* ---- reparto por tramo de ritmo ---- */
    var dr = e.running_distribucion_ritmo || [];
    var gTramo = C.bars({
      values: dr.map(function (r) { return r.km; }),
      labels: dr.map(function (r) { return r.tramo; }),
      height: 180, labelEvery: 1, color: 'var(--z2)',
      fmtVal: function (v) { return F.num(v, 0) + ' km'; }, fmtY: function (v) { return F.num(v, 0); },
      label: 'Kilómetros por tramo de ritmo',
      caption: 'Kilómetros del año en cada tramo de ritmo medio de salida.'
    });

    return h`
      ${raw(U.modhead('', 'Tu motor de carrera', 'El VDOT de Daniels traduce una marca real en un número de forma física, y de ahí salen todos los ritmos de entrenamiento.'))}
      ${raw(U.kpis([
        U.kpi('VDOT actual', F.num(vdot, 1), App.esc(D.vdotFuente)),
        U.kpi('Rango estimado', F.num(D.vdotRango.min, 1) + '–' + F.num(D.vdotRango.max, 1), 'según la distancia que se use de referencia'),
        U.kpi('Salida más larga', F.km(largoKm), 'tope de resistencia del año'),
        U.kpi('Ritmo medio ponderado', App.esc((e.running_totales_validos || {}).ritmo_medio_ponderado || '—') + '/km', F.num((e.running_totales_validos || {}).km, 0) + ' km en el año')
      ]))}
      ${raw(U.note('Por qué el VDOT se ancla en los 5 km y no en el mejor kilómetro',
        'Daniels indica usar la distancia más larga con marca fiable. Tu mejor kilómetro suelto da un VDOT de ' +
        F.num(D.vdot1k || 0, 1) + ', pero es un tramo dentro de una salida fácil, no una carrera. Los 5 km de ' +
        F.fecha(D.mejor5k.fecha) + ' en ' + F.hms(D.mejor5k.segundos) + ' son la referencia honesta.', 'warn'))}

      <h3>Dónde estás frente a tus metas</h3>
      ${raw(U.tabla(
        [{ t: 'Meta' }, { t: 'Hoy (estimado)', n: true }, { t: 'Objetivo', n: true }, { t: 'VDOT necesario', n: true }, { t: 'Diferencia', n: true }],
        filasMeta,
        { pie: 'La predicción de hoy incluye una penalización por durabilidad cuando la distancia supera con mucho tu salida más larga de ' + F.km(largoKm) + '.' }
      ))}

      <h3>Tus ritmos de entrenamiento</h3>
      ${raw(U.tabla([{ t: 'Zona' }, { t: 'Ritmo', n: true }, { t: 'Para qué sirve' }], filasZona))}

      <h3>Cómo repartes la intensidad</h3>
      ${raw(gInt)}
      ${raw(U.note('Esto no es entrenamiento polarizado, es entrenamiento plano',
        'El modelo de tres zonas de Seiler describe lo que hacen los fondistas de élite: alrededor del 80% fácil y un 20% claramente duro. ' +
        'Tú tienes ' + F.pct(it.pct.z1, 0) + ' fácil, pero el resto se reparte en ' + F.pct(it.pct.z2, 1) + ' de umbral y ' + F.pct(it.pct.z3, 1) +
        ' de alta intensidad. Dicho de otro modo: te falta el 20% duro, no te sobra volumen fácil. ' +
        'Dos sesiones de calidad a la semana es el cambio con más rendimiento por hora invertida que puedes hacer.', 'bad'))}

      ${raw(seccionFc(D))}

      <h3>Evolución del ritmo</h3>
      ${raw(gRitmo)}
      ${raw(gTramo)}

      <h3>Mejores esfuerzos del año</h3>
      ${raw(U.tabla(
        [{ t: 'Distancia' }, { t: 'Tiempo', n: true }, { t: 'Ritmo', n: true }, { t: 'Fecha', n: true }, { t: 'VDOT', n: true }],
        filasEsf, { pie: 'Se excluyen los esfuerzos marcados como sospechosos por GPS inconsistente.' }
      ))}

      ${raw(U.acc('La fórmula, por si quieres comprobarla', `
        <p>VO₂ a velocidad v (m/min): VO₂ = −4,60 + 0,182258·v + 0,000104·v².</p>
        <p>Fracción de VO₂máx sostenible durante t minutos: %VO₂máx = 0,8 + 0,1894393·e^(−0,012778·t) + 0,2989558·e^(−0,1932605·t).</p>
        <p>VDOT = VO₂ ÷ %VO₂máx. Los ritmos de entrenamiento salen de invertir la primera fórmula para los porcentajes
        de VDOT que Daniels asigna a cada zona: fácil 62–75%, maratón 83,5%, umbral 88%, intervalo 97,5%, repetición 106%.</p>`))}
    `;
  }

  /* ---- frecuencia cardiaca: lo que el ritmo no enseña ---- */
  function seccionFc(D) {
    var pref = Number(App.data.pref('fcmax', 0)) || null;
    var fc = M.fisiologia(D.acts, pref, App.data.atleta().edad);
    var cob = fc.cobertura;
    if (!fc.disponible) {
      return U.note('Frecuencia cardiaca', 'Sólo ' + cob.n + ' de ' + cob.total + ' carreras tienen FC; hacen falta más para sacar conclusiones.', 'warn');
    }
    var z = fc.pct, nivelEf = fc.eficiencia;
    var out = '<h3>Lo que dice tu corazón</h3>';
    out += U.kpis([
      U.kpi('Carreras con FC', cob.n + ' / ' + cob.total, 'Sólo desde ' + (nivelEf.length ? F.mesLargo(nivelEf[0].mes) : 'hace poco') + ' (' + F.num(100 * cob.n / cob.total, 0) + '%)'),
      U.kpi('FC máxima usada', F.num(fc.fcmax, 0), fc.usuario ? 'la que pusiste en Perfil' : fc.acotada ? 'tope por edad (Tanaka); observada ' + fc.observada : 'percentil 98 de tus máximos'),
      U.kpi('Límites de zona', fc.lim.l1 + ' / ' + fc.lim.l2, 'lpm: fácil · umbral · alta')
    ], 'k3');
    out += C.hbars([
      { label: 'Z1 · fácil', v: z.z1, color: 'var(--z1)', text: F.pct(z.z1, 1) + ' · ' + F.num(fc.min.z1 / 60, 0) + ' h' },
      { label: 'Z2 · umbral', v: z.z2, color: 'var(--z3)', text: F.pct(z.z2, 1) + ' · ' + F.num(fc.min.z2 / 60, 1) + ' h' },
      { label: 'Z3 · alta', v: z.z3, color: 'var(--z5)', text: F.pct(z.z3, 1) + ' · ' + F.num(fc.min.z3 / 60, 1) + ' h' }
    ], { max: 100 });
    if (!fc.usuario) {
      out += U.note('Este reparto depende de tu FC máxima y la mía es una estimación',
        (fc.acotada ? 'Tus máximos registrados llegan a ' + fc.observada + ' lpm, muy por encima de lo esperable a tu edad (208 − 0,7·edad ± 10; Tanaka 2001), así que los traté como picos del sensor y usé ' + fc.fcmax + ' lpm. ' : 'Tomé ' + fc.fcmax + ' lpm, el percentil 98 de tus máximos registrados. ') + 'Los relojes de muñeca suelen inflar los picos, y si tu máxima real es más baja, ' +
        'una parte del tiempo que aparece como fácil sería en realidad umbral. Si la conoces de una prueba o de una carrera a tope, ' +
        'ponla en <b>Perfil</b> y todo se recalcula.', 'warn');
    }
    if (nivelEf.length >= 3) {
      var ef0 = nivelEf[0].ef, ef1 = nivelEf[nivelEf.length - 1].ef;
      out += C.lines({
        labels: nivelEf.map(function (r) { return F.mesCorto(r.mes); }),
        series: [{ name: 'Eficiencia aeróbica', color: 'var(--accent)', values: nivelEf.map(function (r) { return r.ef; }), width: 2, dots: true }],
        height: 190, labelEvery: 1, fmtY: function (v) { return F.num(v, 2); }, fmtVal: function (v) { return F.num(v, 3) + ' m/min por lpm'; },
        label: 'Eficiencia aeróbica por mes',
        caption: 'Metros por minuto por cada latido en salidas ≥3 km por debajo del umbral. Más alto = más ritmo al mismo costo cardiaco. ' +
          'Cambia ' + F.num(100 * (ef1 - ef0) / ef0, 1) + '% entre ' + F.mesLargo(nivelEf[0].mes) + ' y ' + F.mesLargo(nivelEf[nivelEf.length - 1].mes) +
          '; el último mes tiene pocas salidas (' + nivelEf[nivelEf.length - 1].n + ').'
      });
    }
    if (fc.deriva.length >= 3) {
      var med = fc.derivaMediana;
      out += U.note('Deriva cardiaca en salidas largas: ' + F.num(med, 1) + '% de mediana (' + fc.deriva.length + ' salidas)',
        'Compara la eficiencia de la primera y la segunda mitad. Por debajo de 5% la base aeróbica aguanta esa distancia; ' +
        'por encima, el corazón trabaja cada vez más para el mismo ritmo y es señal de que el largo es demasiado rápido o demasiado largo para tu base actual.',
        med > 5 ? 'warn' : 'ok');
    } else {
      out += U.note('Deriva cardiaca', 'Hacen falta al menos 3 salidas de ≥8 km con FC por kilómetro; hoy tienes ' + fc.deriva.length + '.', 'warn');
    }
    return out;
  }

  App.mods.push({ id: 'running', nom: 'Motor de carrera', tab: 'Running', icono: 'M13 4a2 2 0 100-.01M7 21l3-6 3 2 1 4M5 11l4-3 4 1 2 3 3 1', render: render });
})(this);
