/* metrics.js — motor de ciencia del deporte.
   Todo lo que calcula sale de `actividades`; nada está escrito a mano.
   Referencias de los métodos en el Módulo 5 (material de estudio). */
(function (global) {
  'use strict';
  var App = global.App || (global.App = {});
  var S = App.stat, D = App.date;

  /* ===================== 1. Normalización ===================== */

  var GRUPO = {
    Ride: 'ruta', VirtualRide: 'ruta', GravelRide: 'ruta', EBikeRide: 'ruta',
    MountainBikeRide: 'mtb', EMountainBikeRide: 'mtb',
    Run: 'running', TrailRun: 'running', VirtualRun: 'running',
    WeightTraining: 'fuerza', Workout: 'fuerza', Crossfit: 'fuerza',
    Swim: 'nado',
    Walk: 'otros', Hike: 'otros', Skateboard: 'otros', Yoga: 'otros'
  };
  var GRUPO_NOM = { ruta: 'Ruta', mtb: 'MTB', running: 'Running', fuerza: 'Fuerza', nado: 'Natación', otros: 'Otros' };
  var GRUPO_COLOR = {
    ruta: 'var(--z1)', mtb: 'var(--z3)', running: 'var(--accent)',
    fuerza: 'var(--z5)', nado: 'var(--z2)', otros: 'var(--pico-muted-color)'
  };
  // UA por minuto cuando no hay esfuerzo relativo de Strava (se recalibra con los datos reales)
  var K_DEFECTO = { running: 1.30, mtb: 1.20, ruta: 0.95, fuerza: 0.50, nado: 0.90, otros: 0.35 };

  function normalizar(raw) {
    var anomalias = {};
    (raw.estadisticas && raw.estadisticas.anomalias_datos || []).forEach(function (a) { anomalias[String(a.id)] = a.detalle; });

    var acts = (raw.actividades || []).map(function (a) {
      var g = GRUPO[a.sport_type] || 'otros';
      var min = (a.moving_time || 0) / 60;
      var km = (a.distance || 0) / 1000;
      var ms = a.avg_speed || (a.moving_time ? a.distance / a.moving_time : 0);
      return {
        id: String(a.id), nombre: a.name || '', deporte: a.sport_type, grupo: g,
        fechaISO: String(a.start_local).slice(0, 10), hora: parseInt(String(a.start_local).slice(11, 13), 10) || 0,
        min: min, km: km, elev: a.elevation_gain || 0, re: a.relative_effort,
        kcal: a.calories || 0, ms: ms, paceSpk: ms > 0 ? 1000 / ms : null,
        maxMs: a.max_speed || 0, elapsed: (a.elapsed_time || 0) / 60,
        mkm: km > 0.5 ? (a.elevation_gain || 0) / km : null,
        anomalia: anomalias[String(a.id)] || null
      };
    }).sort(function (x, y) { return x.fechaISO < y.fechaISO ? -1 : 1; });

    var limpias = acts.filter(function (a) { return !a.anomalia; });

    /* --- calibración del modelo de carga contra el esfuerzo relativo de Strava --- */
    var calib = {}, cobertura = {};
    Object.keys(K_DEFECTO).forEach(function (g) {
      var con = limpias.filter(function (a) { return a.grupo === g && a.re > 0 && a.min > 1; });
      var totalMin = limpias.filter(function (a) { return a.grupo === g; }).reduce(function (s, a) { return s + a.min; }, 0);
      cobertura[g] = { n: con.length, minConRE: S.sum(con.map(function (a) { return a.min; })), minTotal: totalMin };
      if (con.length >= 5) {
        var k = S.sum(con.map(function (a) { return a.re; })) / S.sum(con.map(function (a) { return a.min; }));
        calib[g] = S.clamp(k, 0.2, 4);
      } else calib[g] = K_DEFECTO[g];
    });

    acts.forEach(function (a) {
      a.cargaMedida = (a.re > 0) ? a.re : null;
      a.cargaEst = a.min * (calib[a.grupo] || 0.5);
      a.carga = a.anomalia ? 0 : (a.cargaMedida != null ? a.cargaMedida : a.cargaEst);
    });

    return { acts: acts, limpias: limpias, calib: calib, cobertura: cobertura, GRUPO_NOM: GRUPO_NOM, GRUPO_COLOR: GRUPO_COLOR };
  }

  /* ===================== 2. Serie diaria ===================== */

  function serieDiaria(acts) {
    if (!acts.length) return [];
    var ini = D.d(acts[0].fechaISO), fin = D.d(acts[acts.length - 1].fechaISO);
    var idx = {};
    acts.forEach(function (a) { (idx[a.fechaISO] || (idx[a.fechaISO] = [])).push(a); });
    var out = [];
    for (var t = ini; t <= fin; t = D.addDays(t, 1)) {
      var k = D.iso(t), lista = idx[k] || [], dia = {
        iso: k, dt: new Date(t.getTime()), dow: D.dowMon0(t), semana: D.isoWeek(t),
        carga: 0, min: 0, km: 0, elev: 0, kmRun: 0, kmBici: 0, minRun: 0, acts: lista, grupos: {}
      };
      lista.forEach(function (a) {
        dia.carga += a.carga; dia.min += a.anomalia ? 0 : a.min; dia.km += a.anomalia ? 0 : a.km;
        dia.elev += a.anomalia ? 0 : a.elev;
        dia.grupos[a.grupo] = (dia.grupos[a.grupo] || 0) + (a.anomalia ? 0 : a.min);
        if (a.grupo === 'running') { dia.kmRun += a.km; dia.minRun += a.min; }
        if (a.grupo === 'ruta' || a.grupo === 'mtb') dia.kmBici += a.anomalia ? 0 : a.km;
      });
      out.push(dia);
    }
    return out;
  }

  /* ===================== 3. ACWR, monotonía, tensión ===================== */

  // EWMA (Williams et al. 2017): λ = 2/(N+1)
  function acwr(dias) {
    var la = 2 / (7 + 1), lc = 2 / (28 + 1), ea = null, ec = null;
    dias.forEach(function (d2, i) {
      ea = ea == null ? d2.carga : d2.carga * la + ea * (1 - la);
      ec = ec == null ? d2.carga : d2.carga * lc + ec * (1 - lc);
      d2.ewmaAgudo = ea; d2.ewmaCronico = ec;
      d2.acwrEwma = (i >= 27 && ec > 0) ? ea / ec : null;
      if (i >= 27) {
        var ag = S.mean(dias.slice(i - 6, i + 1).map(function (x) { return x.carga; }));
        var cr = S.mean(dias.slice(i - 27, i + 1).map(function (x) { return x.carga; }));
        d2.acwrRa = cr > 0 ? ag / cr : null;
        d2.agudo7 = ag * 7; d2.cronico7 = cr * 7;
      } else { d2.acwrRa = null; }
    });
    return dias;
  }

  // Foster 1998: monotonía = media diaria / desviación estándar; tensión = carga semanal × monotonía
  function semanas(dias) {
    var m = {}, orden = [];
    dias.forEach(function (d2) {
      if (!m[d2.semana]) { m[d2.semana] = { semana: d2.semana, dias: [] }; orden.push(d2.semana); }
      m[d2.semana].dias.push(d2);
    });
    return orden.map(function (k) {
      var w = m[k], cargas = w.dias.map(function (x) { return x.carga; });
      var s = S.sd(cargas), mu = S.mean(cargas);
      w.completa = w.dias.length === 7;
      w.carga = S.sum(cargas);
      w.min = S.sum(w.dias.map(function (x) { return x.min; }));
      w.km = S.sum(w.dias.map(function (x) { return x.km; }));
      w.kmRun = S.sum(w.dias.map(function (x) { return x.kmRun; }));
      w.kmBici = S.sum(w.dias.map(function (x) { return x.kmBici; }));
      w.elev = S.sum(w.dias.map(function (x) { return x.elev; }));
      w.diasActivos = w.dias.filter(function (x) { return x.min > 0; }).length;
      w.diasDescanso = w.dias.filter(function (x) { return x.min === 0; }).length;
      w.diasMinimos = w.dias.filter(function (x) { return x.min > 0 && x.min < 20; }).length;
      w.monotonia = s > 0 ? mu / s : (mu > 0 ? 6 : 0);     // sin variación = monotonía máxima
      w.tension = w.carga * w.monotonia;
      w.acwr = w.dias[w.dias.length - 1].acwrEwma;
      w.inicio = w.dias[0].iso; w.fin = w.dias[w.dias.length - 1].iso;
      w.corta = w.dias[w.dias.length - 1].kmRun;
      w.largoRun = Math.max.apply(null, w.dias.map(function (x) { return x.kmRun; }).concat([0]));
      return w;
    });
  }

  function clasifMonotonia(v) {
    if (v < 1.5) return { nivel: 'ok', txt: 'variada' };
    if (v < 2.0) return { nivel: 'warn', txt: 'poco variada' };
    return { nivel: 'bad', txt: 'monótona' };
  }
  function clasifAcwr(v) {
    if (v == null) return { nivel: 'mut', txt: 'sin dato' };
    if (v < 0.8) return { nivel: 'warn', txt: 'desentrenando' };
    if (v <= 1.3) return { nivel: 'ok', txt: 'zona segura' };
    if (v <= 1.5) return { nivel: 'warn', txt: 'subiendo rápido' };
    return { nivel: 'bad', txt: 'riesgo alto' };
  }

  /* ===================== 4. VDOT (Daniels) y predicciones ===================== */

  function vo2DeVelocidad(v) { return -4.60 + 0.182258 * v + 0.000104 * v * v; }        // v en m/min
  function pctDeDuracion(t) {                                                            // t en minutos
    return 0.8 + 0.1894393 * Math.exp(-0.012778 * t) + 0.2989558 * Math.exp(-0.1932605 * t);
  }
  function velDeVo2(vo2) {
    var a = 0.000104, b = 0.182258, c = -4.60 - vo2;
    return (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a);
  }
  function vdotDeCarrera(segundos, metros) {
    if (!segundos || !metros) return null;
    var t = segundos / 60, v = metros / t;
    return vo2DeVelocidad(v) / pctDeDuracion(t);
  }
  // Tiempo de carrera para un VDOT y distancia dados (búsqueda binaria sobre el tiempo)
  function tiempoDeVdot(vdot, metros) {
    if (!vdot || vdot <= 0) return null;
    var lo = 60, hi = 60 * 60 * 10;
    for (var i = 0; i < 60; i++) {
      var t = (lo + hi) / 2, v = metros / (t / 60);
      var est = vo2DeVelocidad(v) / pctDeDuracion(t / 60);
      if (est > vdot) lo = t; else hi = t;
    }
    return (lo + hi) / 2;
  }
  // Ritmos de entrenamiento como % del VDOT
  var PCT_ZONA = { facil: 0.70, facilLento: 0.62, facilRapido: 0.75, maraton: 0.835, umbral: 0.88, intervalo: 0.975, repeticion: 1.06 };
  function ritmoDePctVdot(vdot, pct) {
    var v = velDeVo2(vdot * pct);          // m/min
    return v > 0 ? 60000 / v : null;        // s/km
  }
  function zonasRitmo(vdot) {
    var z = {};
    Object.keys(PCT_ZONA).forEach(function (k) { z[k] = ritmoDePctVdot(vdot, PCT_ZONA[k]); });
    return z;
  }
  // Riegel: T2 = T1 · (D2/D1)^k   (k=1.06 con base; 1.10–1.15 sin base de largos o en trail)
  function riegel(t1, d1, d2, k) { return t1 * Math.pow(d2 / d1, k == null ? 1.06 : k); }

  // Penalización por falta de base de largos. Ni Daniels ni Riegel la incluyen:
  // ambos suponen que ya entrenas la distancia. Si la carrera es mucho más larga
  // que tu salida más larga, el tiempo real se va por encima de la predicción.
  function factorDurabilidad(distKm, largoKm) {
    if (!largoKm || largoKm <= 0) return 1.40;
    var r = distKm / largoKm;
    if (r <= 1.5) return 1;
    return Math.min(1.40, 1 + 0.18 * (r - 1.5));
  }
  // Predicción corregida: Daniels + penalización por durabilidad
  function predecir(vdot, metros, largoKm) {
    var base = tiempoDeVdot(vdot, metros);
    var f = factorDurabilidad(metros / 1000, largoKm);
    return { base: base, factor: f, real: base * f };
  }

  /* ===================== 5. Distribución de intensidad ===================== */

  // Modelo de 3 zonas (Seiler): Z1 por debajo de UL1, Z2 entre umbrales, Z3 por encima de UL2.
  // Aproximación con el ritmo medio de cada salida (no es tiempo-en-zona real).
  function distribucionIntensidad(runs, zonas) {
    var lim1 = zonas.maraton, lim2 = zonas.umbral;     // s/km (menor = más rápido)
    var z = { z1: 0, z2: 0, z3: 0 }, n = { z1: 0, z2: 0, z3: 0 }, km = { z1: 0, z2: 0, z3: 0 };
    runs.forEach(function (a) {
      if (!a.paceSpk || !a.min) return;
      var b = a.paceSpk > lim1 ? 'z1' : (a.paceSpk > lim2 ? 'z2' : 'z3');
      z[b] += a.min; n[b]++; km[b] += a.km;
    });
    var tot = z.z1 + z.z2 + z.z3 || 1;
    return {
      min: z, n: n, km: km, total: tot,
      pct: { z1: 100 * z.z1 / tot, z2: 100 * z.z2 / tot, z3: 100 * z.z3 / tot },
      lim1: lim1, lim2: lim2
    };
  }

  /* ===================== 6. Proyecciones ===================== */

  // Modelo de dos términos:
  //   V(t) = V0 + Δrápido·(1 − e^(−t/τ)) + pendiente·min(t, tope)
  // El primer término es la respuesta rápida a introducir intensidad estructurada
  // (meses 1–12). El segundo es la ganancia lenta por edad de entrenamiento:
  // volumen acumulado, economía de carrera, composición corporal. t en meses.
  var ESCENARIOS = [
    { id: 'cons', nombre: 'Conservador', dfast: 3.5, tau: 6.0, pend: 0.04, tope: 48, color: 'var(--z1)',
      nota: 'Sigues parecido a 2026: mucha frecuencia, calidad suelta y sin descargas.' },
    { id: 'plan', nombre: 'Plan cumplido', dfast: 7.0, tau: 5.5, pend: 0.15, tope: 48, color: 'var(--ok)',
      nota: 'Dos calidades por semana, largo progresivo, descarga cada 4ª semana, volumen 35–45 km.' },
    { id: 'techo', nombre: 'Techo optimista', dfast: 9.5, tau: 5.0, pend: 0.18, tope: 36, color: 'var(--accent)',
      nota: 'Lo anterior + fuerza 2×/sem, sueño, nutrición y peso alineados, sin lesiones, 60–80 km/sem al final.' }
  ];
  function proyectarVdot(v0, meses) {
    return ESCENARIOS.map(function (e) {
      return {
        esc: e,
        serie: meses.map(function (t) {
          return v0 + e.dfast * (1 - Math.exp(-t / e.tau)) + e.pend * Math.min(t, e.tope);
        })
      };
    });
  }
  // Primer mes en que la predicción alcanza el objetivo
  function mesObjetivo(serie, meses, metros, objetivoSeg) {
    for (var i = 0; i < serie.length; i++) {
      if (tiempoDeVdot(serie[i], metros) <= objetivoSeg) return meses[i];
    }
    return null;
  }
  // Rampa de volumen: +pct por semana, descarga de −pct2 cada 4ª semana, tope en `tope`
  function rampaVolumen(inicio, semanas2, pct, tope) {
    pct = pct == null ? 0.08 : pct;
    var out = [], v = inicio;
    for (var i = 0; i < semanas2; i++) {
      var descarga = (i + 1) % 4 === 0;
      out.push({ i: i, km: descarga ? v * 0.70 : v, descarga: descarga });
      if (!descarga) v = Math.min(tope, v * (1 + pct));
    }
    return out;
  }

  /* ===================== 7. Bici: VAM y capacidad de ascenso ===================== */

  function analisisBici(acts) {
    var bici = acts.filter(function (a) { return (a.grupo === 'ruta' || a.grupo === 'mtb') && !a.anomalia && a.min > 20; });
    bici.forEach(function (a) { a.vam = a.min > 0 ? a.elev / (a.min / 60) : 0; });
    var orden = bici.slice().sort(function (x, y) { return y.elev - x.elev; });
    var vams = bici.filter(function (a) { return a.elev > 300; }).map(function (a) { return a.vam; });
    return {
      salidas: bici,
      topDesnivel: orden.slice(0, 8),
      topKm: bici.slice().sort(function (x, y) { return y.km - x.km; }).slice(0, 8),
      topHoras: bici.slice().sort(function (x, y) { return y.min - x.min; }).slice(0, 8),
      vamMedia: S.mean(vams), vamP75: S.quantile(vams, 0.75), vamMax: Math.max.apply(null, vams.concat([0])),
      maxElev: orden.length ? orden[0].elev : 0,
      maxKm: Math.max.apply(null, bici.map(function (a) { return a.km; }).concat([0])),
      maxHoras: Math.max.apply(null, bici.map(function (a) { return a.min / 60; }).concat([0])),
      n1000: bici.filter(function (a) { return a.elev >= 1000; }).length,
      n100km: bici.filter(function (a) { return a.km >= 100; }).length
    };
  }

  /* ===================== 8. Hábitos ===================== */

  function habitos(dias, acts) {
    var porDow = [0, 0, 0, 0, 0, 0, 0].map(function () { return { min: 0, carga: 0, km: 0, n: 0 }; });
    dias.forEach(function (d2) {
      porDow[d2.dow].min += d2.min; porDow[d2.dow].carga += d2.carga;
      porDow[d2.dow].km += d2.km; porDow[d2.dow].n++;
    });
    var runs = acts.filter(function (a) { return a.grupo === 'running' && !a.anomalia; });
    var tarde = runs.filter(function (a) { return a.hora >= 19; }).length;
    var manana = runs.filter(function (a) { return a.hora < 10; }).length;
    var sinDescanso = 0, maxRacha = 0;
    dias.forEach(function (d2) {
      if (d2.min > 0) { sinDescanso++; maxRacha = Math.max(maxRacha, sinDescanso); } else sinDescanso = 0;
    });
    return {
      porDow: porDow,
      pctTarde: runs.length ? 100 * tarde / runs.length : 0,
      pctManana: runs.length ? 100 * manana / runs.length : 0,
      maxRachaSinDescanso: maxRacha,
      diasDescanso: dias.filter(function (d2) { return d2.min === 0; }).length,
      diasMinimos: dias.filter(function (d2) { return d2.min > 0 && d2.min < 20; }).length,
      diasDuros: dias.filter(function (d2) { return d2.min >= 90; }).length,
      diasDobles: dias.filter(function (d2) { return d2.acts.length >= 2; }).length
    };
  }

  /* ===================== 9. Modelo completo ===================== */

  function construir(raw) {
    var base = normalizar(raw);
    var dias = acwr(serieDiaria(base.acts));
    var sem = semanas(dias);
    var runs = base.acts.filter(function (a) { return a.grupo === 'running' && !a.anomalia && a.km >= 0.5; });

    // ---- VDOT: se estima desde todos los mejores esfuerzos del año ----
    var e = raw.estadisticas || {};
    var mejor5k = e.mejor_5k_ano && e.mejor_5k_ano.sin_sospechosos;
    var mejor1k = e.mejor_1k_ano && e.mejor_1k_ano.sin_sospechosos;
    var DIST = [
      { k: 'mejor_1k_s', m: 1000, nom: '1 km' },
      { k: 'mejor_1milla_s', m: 1609.34, nom: '1 milla' },
      { k: 'mejor_2millas_s', m: 3218.69, nom: '2 millas' },
      { k: 'mejor_5k_s', m: 5000, nom: '5 km' }
    ];
    var estVdot = [];
    (e.mejores_esfuerzos || []).forEach(function (r) {
      if (r.sospechoso) return;
      DIST.forEach(function (dd) {
        if (!r[dd.k]) return;
        estVdot.push({ dist: dd.nom, metros: dd.m, seg: r[dd.k], fecha: r.fecha, id: r.id, vdot: vdotDeCarrera(r[dd.k], dd.m) });
      });
    });
    // Mejor marca por distancia
    var mejorPorDist = DIST.map(function (dd) {
      var c = estVdot.filter(function (x) { return x.metros === dd.m; }).sort(function (a2, b2) { return a2.seg - b2.seg; })[0];
      return c || null;
    }).filter(Boolean);

    if (mejor5k && !mejorPorDist.some(function (x) { return x.metros === 5000; })) {
      mejorPorDist.push({ dist: '5 km', metros: 5000, seg: mejor5k.segundos, fecha: mejor5k.fecha, id: mejor5k.id, vdot: vdotDeCarrera(mejor5k.segundos, 5000) });
    }
    var vdot5k = mejor5k ? vdotDeCarrera(mejor5k.segundos, 5000) : null;
    var vdot1k = mejor1k ? vdotDeCarrera(mejor1k.segundos, 1000) : null;

    // Mejor salida completa (≥3 km) como referencia adicional
    var mejorSalida = runs.filter(function (a) { return a.km >= 3; })
      .sort(function (x, y) { return x.paceSpk - y.paceSpk; })[0];
    var vdotSalida = mejorSalida ? vdotDeCarrera(mejorSalida.paceSpk * mejorSalida.km, mejorSalida.km * 1000) : null;

    // Se trabaja con el VDOT de la distancia más larga fiable (criterio de Daniels),
    // no con el máximo: los esfuerzos cortos dentro de una salida fácil lo inflan.
    var ancla = mejorPorDist.slice().sort(function (a2, b2) { return b2.metros - a2.metros; })[0] || null;
    var vdot = ancla ? ancla.vdot : (vdotSalida || null);
    var fuenteVdot = ancla ? ('mejor ' + ancla.dist + ' del año (' + ancla.fecha + ')') : 'mejor salida ≥3 km';
    var vdotRango = mejorPorDist.length
      ? { min: Math.min.apply(null, mejorPorDist.map(function (x) { return x.vdot; })),
          max: Math.max.apply(null, mejorPorDist.map(function (x) { return x.vdot; })) }
      : null;
    var zonas = vdot ? zonasRitmo(vdot) : null;

    return {
      meta: raw.meta || {},
      origen: raw.estadisticas ? 'completo' : 'parcial',
      acts: base.acts, limpias: base.limpias, calib: base.calib, cobertura: base.cobertura,
      GRUPO_NOM: GRUPO_NOM, GRUPO_COLOR: GRUPO_COLOR,
      dias: dias, semanas: sem, runs: runs,
      hoy: dias[dias.length - 1],
      vdot: vdot, vdotFuente: fuenteVdot, vdotRango: vdotRango,
      vdot5k: vdot5k, vdot1k: vdot1k, vdotSalida: vdotSalida,
      mejorPorDist: mejorPorDist, ancla: ancla,
      mejor5k: mejor5k, mejor1k: mejor1k, mejorSalida: mejorSalida,
      zonas: zonas,
      intensidad: zonas ? distribucionIntensidad(runs, zonas) : null,
      bici: analisisBici(base.acts),
      habitos: habitos(dias, base.acts),
      est: e, extra: raw.estadisticas_extra || {}
    };
  }

  App.metrics = {
    construir: construir, normalizar: normalizar, serieDiaria: serieDiaria,
    acwr: acwr, semanas: semanas, clasifMonotonia: clasifMonotonia, clasifAcwr: clasifAcwr,
    vdotDeCarrera: vdotDeCarrera, tiempoDeVdot: tiempoDeVdot, zonasRitmo: zonasRitmo,
    factorDurabilidad: factorDurabilidad, predecir: predecir, velDeVo2: velDeVo2, vo2DeVelocidad: vo2DeVelocidad,
    ritmoDePctVdot: ritmoDePctVdot, riegel: riegel, PCT_ZONA: PCT_ZONA,
    distribucionIntensidad: distribucionIntensidad,
    proyectarVdot: proyectarVdot, ESCENARIOS: ESCENARIOS, mesObjetivo: mesObjetivo, rampaVolumen: rampaVolumen,
    analisisBici: analisisBici, habitos: habitos, GRUPO: GRUPO, GRUPO_NOM: GRUPO_NOM, GRUPO_COLOR: GRUPO_COLOR
  };
})(this);
