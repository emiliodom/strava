/* calendario.js — Módulo 3: los dos calendarios (estructurado y brutal), editables y exportables. */
(function (global) {
  'use strict';
  var App = global.App, U = App.ui, C = App.chart, F = App.fmt, M = App.metrics, DT = App.date, h = App.h, raw = App.raw, esc = App.esc;

  var P = App.plan, TIPOS = P.TIPOS;
  var EVT = {};
  P.EVENTOS.forEach(function (e) { EVT[e.id] = e; });

  var CLAVE_PLAN = 'calPlan', CLAVE_REAL = 'calReal';
  var BOTONES = [['estructurado', 'Ruta estructurada'], ['intermedio', 'Ruta intermedia'], ['brutal', 'Camino brutal']];
  var D0 = null;                 // modelo, lo guarda render()

  /* ---------- plan activo ---------- */
  function planActivo() { var p = App.data.pref(CLAVE_PLAN, 'estructurado'); return P.PLANES[p] ? p : 'estructurado'; }

  /* ---------- registro real (lo que pasó de verdad, independiente del plan) ---------- */
  function reales() { return App.data.pref(CLAVE_REAL, {}); }
  function realStravaDe(fecha) {
    if (!D0) return null;
    var dia = D0.dias.filter(function (d) { return d.iso === fecha; })[0];
    var acts = dia && dia.acts ? dia.acts.filter(function (a) { return !a.anomalia; }) : [];
    if (!acts.length) return null;
    return acts.reduce(function (r, a) {
      if (a.grupo === 'running') r.km += a.km || 0;
      if (a.grupo === 'ruta' || a.grupo === 'mtb') r.minBici += a.min || 0;
      r.min += a.min || 0;
      return r;
    }, { km: 0, min: 0, minBici: 0, strava: true });
  }
  function realDe(fecha) {
    var auto = realStravaDe(fecha), manual = reales()[fecha];
    if (!auto) return manual ? Object.assign({ manual: true }, manual) : null;
    Object.keys(manual || {}).forEach(function (k) { auto[k] = manual[k]; });
    auto.manual = !!manual;
    auto.manualData = manual || null;
    return auto;
  }

  function componentesPlan(d, conPausa) {
    if (d.pausa && !conPausa) return [];            // en pausa: el plan sigue ahí, pero no exige nada
    var tipo = TIPOS[d.tipo] || {};
    var ev = d.evento ? EVT[d.evento] : null;
    var corridaBrick = /off-bike|brick/i.test(d.sesion || '');
    var componentes = [];
    var milla = (d.racha && d.km < 3 && tipo.deporte !== 'run') || d.caminar >= 1;
    if (d.km >= 1 && (d.km >= 3 || milla || tipo.deporte === 'run' || (ev && /trail|atletismo/.test(ev.deporte)))) {
      var nombreRun = d.caminar ? (/trote/i.test(d.sesion || '') ? 'Caminata o trote (racha)' : 'Caminata (racha)') : milla ? 'Milla de la racha' : corridaBrick ? 'Correr (brick)' : tipo.nom && tipo.nom !== 'Fácil' ? 'Correr · ' + tipo.nom : 'Correr fácil';
      componentes.push({ deporte: 'running', nombre: nombreRun, objetivo: d.km, unidad: 'km' });
    }
    if (d.minBici >= 20) componentes.push({ deporte: 'bici', nombre: 'Bici', objetivo: d.minBici, unidad: 'min' });
    var fuerza = /fuerza ([ABCGU])/i.exec(d.sesion || '');
    if (fuerza) componentes.push({ deporte: 'fuerza', nombre: /[CG]/.test(fuerza[1].toUpperCase()) ? 'Boxeo' : 'Fuerza ' + fuerza[1].toUpperCase(), objetivo: 15, unidad: 'min' });
    if (d.nat) componentes.push({ deporte: 'nado', nombre: 'Natación (opcional)', objetivo: d.nat, unidad: 'min', opcional: true });
    return componentes;
  }

  function kmRunPlan(d) {
    if (d.pausa) return 0;
    return componentesPlan(d).filter(function (c) { return c.deporte === 'running'; })
      .reduce(function (s, c) { return s + c.objetivo; }, 0);
  }

  function evaluarDia(d, D) {
    var dia = D.dias.filter(function (x) { return x.iso === d.fecha; })[0];
    var acts = dia && dia.acts ? dia.acts.filter(function (a) { return !a.anomalia; }) : [];
    var componentes = componentesPlan(d).map(function (c) {
      var candidatas = acts.filter(function (a) {
        return c.deporte === 'bici' ? a.grupo === 'ruta' || a.grupo === 'mtb' : a.grupo === c.deporte;
      });
      var cantidad = candidatas.length;
      var valor = candidatas.reduce(function (s, a) { return s + (c.unidad === 'km' ? a.km || 0 : a.min || 0); }, 0);
      var manual = false, entrada = d.real && (d.real.manualData || (d.real.manual ? d.real : null));
      if (!cantidad && entrada) {
        var manualValor = c.deporte === 'running' ? entrada.km : c.deporte === 'bici' ? entrada.minBici : entrada.minFuerza;
        if (manualValor != null && manualValor > 0) { valor = manualValor; manual = true; }
      }
      var minimo = c.deporte === 'fuerza' ? c.objetivo : c.objetivo * 0.8;
      return {
        deporte: c.deporte, nombre: c.nombre, unidad: c.unidad, objetivo: c.objetivo, valor: valor, cantidad: cantidad, manual: manual, opcional: !!c.opcional,
        estado: (cantidad || manual) && valor + 1e-9 >= minimo ? 'ok' : cantidad || manual ? 'parcial' : 'miss'
      };
    });
    componentes = componentes.filter(function (c) { return !(c.opcional && !c.cantidad && !c.manual); });   // lo opcional no hecho no penaliza
    return {
      componentes: componentes,
      cumplidas: componentes.filter(function (c) { return c.estado === 'ok'; }).length,
      parciales: componentes.filter(function (c) { return c.estado === 'parcial'; }).length,
      total: componentes.length,
      pct: componentes.length ? componentes.reduce(function (a, c) { return a + Math.min(1, c.valor / (c.objetivo || 1)); }, 0) / componentes.length : null
    };
  }

  function resumenReciente(D, lista) {
    var conDatos = D.dias.filter(function (d) {
      return d.acts && d.acts.some(function (a) { return !a.anomalia; });
    });
    if (!conDatos.length) return '';
    var fin = conDatos[conDatos.length - 1].iso;
    var inicio = DT.iso(DT.addDays(DT.d(fin), -6));
    var dias = D.dias.filter(function (d) { return d.iso >= inicio && d.iso <= fin; });
    var actual = dias.reduce(function (s, d) {
      (d.acts || []).forEach(function (a) {
        if (a.anomalia) return;
        if (a.grupo === 'running') s.km += a.km || 0;
        if (a.grupo === 'ruta' || a.grupo === 'mtb') s.minBici += a.min || 0;
      });
      return s;
    }, { km: 0, minBici: 0 });
    var porFecha = {};
    dias.forEach(function (d) { porFecha[d.iso] = true; });
    var plan = lista.filter(function (d) { return porFecha[d.fecha]; }).reduce(function (s, d) {
      var componentes = componentesPlan(d);
      s.km += componentes.filter(function (c) { return c.deporte === 'running'; }).reduce(function (n, c) { return n + c.objetivo; }, 0);
      s.minBici += componentes.filter(function (c) { return c.deporte === 'bici'; }).reduce(function (n, c) { return n + c.objetivo; }, 0);
      return s;
    }, { km: 0, minBici: 0 });
    var puntos = lista.filter(function (d) { return porFecha[d.fecha]; }).reduce(function (s, d) {
      var evalDia = evaluarDia(d, D);
      s.cumplidas += evalDia.cumplidas;
      s.parciales += evalDia.parciales;
      s.total += evalDia.total;
      return s;
    }, { cumplidas: 0, parciales: 0, total: 0 });
    function comparacion(real, objetivo, unidad) {
      var texto = 'Plan: ' + F.num(objetivo, unidad === 'km' ? 1 : 0) + ' ' + unidad;
      if (objetivo > 0) {
        var pct = Math.round((real - objetivo) / objetivo * 100);
        texto += ' · ' + (pct > 0 ? '+' : '') + pct + '%';
      }
      return texto;
    }
    return "<article><h4>Últimos 7 días con datos · hasta " + esc(F.fecha(fin)) + '</h4>' +
      U.kpis([
        U.kpi('Carrera real', F.num(actual.km, 1) + ' km', comparacion(actual.km, plan.km, 'km')),
        U.kpi('Bici real', F.num(actual.minBici, 0) + ' min', comparacion(actual.minBici, plan.minBici, 'min')),
        U.kpi('Actividades cumplidas', puntos.total ? puntos.cumplidas + ' / ' + puntos.total : '—',
          puntos.total ? puntos.parciales + ' parciales · una por cada componente previsto' : 'sin componentes previstos',
          puntos.total && puntos.cumplidas === puntos.total ? 'ok' : puntos.total ? 'warn' : '')
      ], 'k3') +
      '<small>Se calcula automáticamente con Strava. Cada componente (carrera, bici o fuerza) aporta un punto sólo al alcanzar el mínimo; 80% del volumen previsto, o 15 min de fuerza. No ajusta el plan automáticamente.</small></article>';
  }

  // El plan base no se edita; lo único que lo mueve son los días «no la hice», que App.replan reorganiza con reglas fijas.
  var CLAVE_SALTOS = 'calSaltos', ULT_CAMBIOS = {};
  function saltos() { return App.data.pref(CLAVE_SALTOS, {}) || {}; }
  function estaSaltado(f) { return !!saltos()[f]; }
  function isoHoy() { var d = new Date(), m = d.getMonth() + 1, dd = d.getDate(); return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (dd < 10 ? '0' : '') + dd; }
  // Los días de calidad pasados se juzgan por kilómetro (splits), con tres veredictos y no con un sí/no:
  //   ok = cumplida · parcial = esfuerzo real pero por debajo de lo que pedía la sesión · sin = no hubo calidad.
  // Valor en `saltos`: 2 = sin calidad (se reprograma), 3 = parcial (no se reprograma; el volumen cuenta).
  var ANALISIS = {}, ANALISIS_FULL = {};
  function limitesFC() {
    var f = D0 && M.fisiologia ? M.fisiologia(D0.acts, +App.data.pref('fcmax', 0) || null, (App.data.atleta() || {}).edad) : null;
    return f && f.disponible ? { l1: f.lim.l1, l2: f.lim.l2, med: Math.round((f.lim.l1 + f.lim.l2) / 2), fcmax: Math.round(f.fcmax) } : { l1: 143, l2: 162, med: 152, fcmax: 186 };
  }
  function mediana(v) { var s = v.slice().sort(function (a, b) { return a - b; }); return s[Math.floor(s.length / 2)]; }
  function zonaRitmo(z, spk) {
    if (!z || !spk) return '';
    return spk < z.intervalo ? 'Repetición' : spk < z.umbral ? 'Intervalo' : spk < z.maraton ? 'Umbral' : spk < z.facilRapido ? 'Maratón' : spk <= z.facilLento ? 'Fácil' : 'Recuperación';
  }
  function zonaFc(lim, hr) { return !hr ? '' : hr >= lim.l2 ? 'Z3' : hr >= lim.l1 ? 'Z2' : 'Z1'; }
  var OBJETIVO = {
    Q: 'Tempo o umbral: un bloque sostenido (≈ 12–20 min seguidos) con FC en Z2 alta o Z3, a ritmo de umbral.',
    H: 'HIIT (VO₂máx): repeticiones de 2–3 min con FC en Z3 y ritmo de intervalo, con trote entre cada una.',
    S: 'Sprints: repeticiones cortas y muy rápidas; la FC máxima debe tocar Z3.',
    T: 'Trail duro: esfuerzo sostenido en Z2–Z3 con desnivel; el ritmo del reloj no cuenta.',
    L: 'Largo: volumen. Lo que cuenta es acercarse a los km del plan a ritmo fácil y constante.'
  };

  /* Analiza la salida a pie de un día del plan: veredicto, razones, lo que faltó y los kilómetros uno a uno. */
  function analizarSesion(d) {
    if (!D0) return null;
    var dia = D0.dias.filter(function (x) { return x.iso === d.fecha; })[0];
    var runs = dia && dia.acts ? dia.acts.filter(function (a) { return a.grupo === 'running' && !a.anomalia; }) : [];
    if (!runs.length) return null;
    var lim = limitesFC(), z = D0.zonas, tipo = d.tipoOriginal || d.tipo;
    var km = 0, seg = 0, hrSeg = 0, hrMax = 0, filas = [];
    runs.forEach(function (a) {
      km += a.km || 0; seg += (a.min || 0) * 60; hrSeg += (a.hr || 0) * (a.min || 0) * 60; hrMax = Math.max(hrMax, a.hrMax || 0);
      (a.splits || []).forEach(function (s) { if (s && s[0] >= 150) filas.push({ spk: s[0], hr: s[1] || 0 }); });
    });
    var hr = seg ? hrSeg / seg : 0, ritmo = km ? seg / km : 0;
    var med = filas.length ? mediana(filas.map(function (f) { return f.spk; })) : 0;
    filas.forEach(function (f, i) {
      f.n = i + 1; f.pausa = !!med && f.spk > med * 1.6;           // un km muy lento = parada o caminata: no cuenta como esfuerzo
      f.zr = f.pausa ? 'Parada' : zonaRitmo(z, f.spk); f.zf = zonaFc(lim, f.hr);
    });
    var utiles = filas.filter(function (f) { return !f.pausa; });
    var z2min = 0, z3min = 0, bloque = 0, mejor = 0, rapidos = 0, kmUmbral = 0, maxHrKm = 0;
    utiles.forEach(function (f) {
      var mn = f.spk / 60;
      if (f.hr >= lim.l1) z2min += mn;
      if (f.hr >= lim.l2) z3min += mn;
      if (f.hr >= lim.med) { bloque += mn; mejor = Math.max(mejor, bloque); } else bloque = 0;
      if (med && f.spk <= med * 0.88 && f.hr >= lim.l1) rapidos++;
      if (/Umbral|Intervalo|Repetición/.test(f.zr)) kmUmbral++;
      maxHrKm = Math.max(maxHrKm, f.hr);
    });
    var sinSplits = utiles.length < 3;
    var m = { km: km, seg: seg, ritmo: ritmo, hr: hr, hrMax: hrMax, z2min: z2min, z3min: z3min, bloque: mejor, rapidos: rapidos, kmUmbral: kmUmbral, maxHrKm: maxHrKm, n: utiles.length, pausas: filas.length - utiles.length };
    var nivel, razones = [], falto = [], planKm = d.km || 0;
    razones.push('Corriste <b>' + F.num(km, 1) + ' km</b> en ' + F.hms(seg, false) + ' (' + F.paceKm(ritmo) + ') con FC media <b>' + Math.round(hr) + '</b> (' + Math.round(100 * hr / lim.fcmax) + ' % de la máxima).');
    if (!sinSplits) {
      razones.push('Por kilómetro: <b>' + F.num(z2min, 0) + ' min</b> con FC en Z2 o más (desde ' + lim.l1 + ' lpm), <b>' + F.num(z3min, 0) + ' min</b> en Z3 (desde ' + lim.l2 + '). El bloque continuo más largo con FC ≥ ' + lim.med + ' fue de <b>' + F.num(mejor, 0) + ' min</b>. FC máxima por km: ' + maxHrKm + ' lpm.');
      if (m.pausas) razones.push(m.pausas + ' km muy lento' + (m.pausas > 1 ? 's' : '') + ' (parada o caminata) no se cuenta' + (m.pausas > 1 ? 'n' : '') + ' como esfuerzo.');
    } else razones.push('Strava no trae kilómetros uno a uno de esta salida: se juzga sólo por la FC media.');
    var ref = z && z.umbral ? F.pace(z.umbral) + '/km' : 'ritmo de umbral';
    if (tipo === 'Q') {
      nivel = mejor >= 12 || z3min >= 10 || kmUmbral >= 3 ? 'ok' : (z2min >= 8 || (sinSplits && hr >= lim.l1)) ? 'parcial' : 'sin';
      if (nivel === 'parcial') razones.push('Fue un <b>esfuerzo aeróbico sostenido</b> (Z2), no tempo: sirve como volumen de calidad moderada, pero queda por debajo del umbral (FC ' + lim.l2 + ' lpm, ' + ref + ').');
      if (nivel !== 'ok') {
        falto.push('Subir la FC al rango de umbral (≥ ' + lim.med + ' lpm; Z3 desde ' + lim.l2 + ') durante un bloque de 12–20 min seguidos.');
        falto.push('Ese bloque a ritmo de umbral (' + ref + ' o más rápido); tu ritmo medio fue ' + F.paceKm(ritmo) + '.');
        if (z2min >= 8) falto.push('Juntar los tramos en Z2 en uno solo y empujar los últimos 10 min.');
      }
    } else if (tipo === 'H') {
      nivel = z3min >= 6 || rapidos >= 3 ? 'ok' : (z3min >= 2 || rapidos >= 1 || hrMax >= lim.l2) ? 'parcial' : 'sin';
      if (nivel !== 'ok') { falto.push('5–6 repeticiones de 3 min con FC en Z3 (≥ ' + lim.l2 + ' lpm) y ritmo de intervalo (' + (z && z.intervalo ? F.pace(z.intervalo) + '/km' : '—') + ').'); falto.push('Trote de recuperación de 3 min entre repeticiones, no caminata.'); }
    } else if (tipo === 'S') {
      nivel = hrMax >= lim.l2 && rapidos >= 1 ? 'ok' : hrMax >= lim.l2 ? 'parcial' : 'sin';
      if (nivel !== 'ok') falto.push('8–10 × 20 s a máxima velocidad con 60–90 s de pausa; la FC máxima debe pasar de ' + lim.l2 + ' lpm (llegaste a ' + (hrMax || '—') + ').');
    } else if (tipo === 'T') {
      nivel = z2min >= 20 ? 'ok' : z2min >= 10 ? 'parcial' : 'sin';
      if (nivel !== 'ok') falto.push('Más tiempo en Z2–Z3 con desnivel: al menos 20 min con FC ≥ ' + lim.l1 + ' lpm.');
    } else if (tipo === 'L') {
      var r = planKm ? km / planKm : 1;
      nivel = r >= 0.85 ? 'ok' : r >= 0.6 ? 'parcial' : 'sin';
      razones.push('Volumen: <b>' + Math.round(r * 100) + ' %</b> de los ' + F.num(planKm, 0) + ' km del plan.');
      if (nivel !== 'ok') falto.push('Faltaron ' + F.num(Math.max(0, planKm - km), 1) + ' km para el largo completo.');
    } else {
      nivel = hr && hr >= lim.l1 ? 'fuerte' : 'ok';
      razones.push(nivel === 'fuerte' ? 'Era un día fácil y la FC media quedó en Z2: más intenso de lo previsto, resta frescura para la siguiente calidad.' : 'Día fácil bien ejecutado: FC media en Z1.');
    }
    var objetivo = OBJETIVO[tipo] || (tipo === 'E' || tipo === 'R' ? 'Rodaje suave: FC media en Z1 (bajo ' + lim.l1 + ' lpm), sin mirar el reloj.' : '');
    return { nivel: nivel, tipo: tipo, objetivo: objetivo, razones: razones, falto: falto, m: m, filas: filas, lim: lim, sinSplits: sinSplits };
  }
  var VEREDICTO = { ok: ['Cumplida', 'ok'], parcial: ['Parcial', 'warn'], sin: ['Sin calidad', 'bad'], fuerte: ['Más fuerte de lo previsto', 'warn'] };
  function veredictoTexto(a) {
    if (a.tipo === 'E' || a.tipo === 'R') return a.nivel === 'ok' ? ['Fácil bien hecha', 'ok'] : VEREDICTO.fuerte;
    if (a.tipo === 'L') return a.nivel === 'ok' ? ['Largo cumplido', 'ok'] : a.nivel === 'parcial' ? ['Largo parcial', 'warn'] : ['Largo corto', 'bad'];
    return VEREDICTO[a.nivel];
  }
  function autoSinCalidad(base) {
    var out = {}, hoy = isoHoy();
    ANALISIS = {}; ANALISIS_FULL = {};
    base.forEach(function (d) {
      if (d.fecha >= hoy || d.evento || !D0) return;
      var a = analizarSesion(d);
      if (!a) return;
      ANALISIS_FULL[d.fecha] = a;
      if (!/^[QHST]$/.test(d.tipo) || (a.nivel !== 'sin' && a.nivel !== 'parcial')) return;
      out[d.fecha] = a.nivel === 'sin' ? 2 : 3;
      ANALISIS[d.fecha] = (a.razones[0] + ' ' + (a.razones[1] || '')).replace(/<[^>]+>/g, '');
    });
    return out;
  }
  // Salida más larga de los últimos 28 días: ancla el volumen máximo razonable de las sesiones de calidad próximas.
  function kmMaxReciente(hoy) {
    if (!D0) return 0;
    var ini = DT.iso(DT.addDays(DT.d(hoy), -28)), m = 0;
    D0.acts.forEach(function (a) { if (a.grupo === 'running' && !a.anomalia && a.fechaISO >= ini && a.fechaISO < hoy) m = Math.max(m, a.km || 0); });
    return m;
  }
  function dias(plan) {
    var base = P.PLANES[plan].dias.map(function (d) {
      return Object.assign({}, d, { real: realDe(d.fecha) });
    });
    if (!App.replan) { ULT_CAMBIOS[plan] = []; return base; }
    var s = Object.assign(autoSinCalidad(base), saltos());
    var hoy = isoHoy();
    var r = App.replan.reorganizar(base, s, hoy, { info: ANALISIS, kmMax: kmMaxReciente(hoy) });
    ULT_CAMBIOS[plan] = r.cambios;
    return r.dias;
  }
  function cambios(plan) { dias(plan); return ULT_CAMBIOS[plan] || []; }
  function alternarSalto(f) {
    var s = saltos();
    if (!s[f] && f < isoHoy()) return;   // los días pasados se detectan solos con Strava
    if (s[f]) delete s[f]; else s[f] = 1;
    App.data.setPref(CLAVE_SALTOS, s);
  }
  function restablecerSaltos() { App.data.setPref(CLAVE_SALTOS, {}); }
  function refrescarPlan() {
    ['resumen', 'dia', 'calendario', 'cuerpo', 'proyeccion'].forEach(function (id) { if (App.refrescar) App.refrescar(id); });
  }
  function panelAjustes(plan) {
    var c = cambios(plan);
    if (!c.length) return '';
    return "<details class='acc ajustes'><summary>Plan reorganizado · " + c.length + " cambios</summary><ul>" + c.map(function (x) {
      return "<li class='" + esc(x.nivel) + "'><b>" + esc(x.fecha.slice(5)) + "</b> " + esc(x.texto) + '</li>';
    }).join('') + "</ul><button type='button' class='secondary outline' data-reset-saltos>Restablecer plan original</button></details>";
  }

  /* comparación plan vs realidad: dónde estamos fallando */
  function claseDif(pct) { var a = Math.abs(pct); return a <= 10 ? 'ok' : a <= 25 ? 'warn' : 'bad'; }
  function difHtml(d) {
    var r = d.real; if (!r) return '';
    var out = [];
    if (d.km >= 1 && r.km != null) {
      var pct = d.km ? Math.round((r.km - d.km) / d.km * 100) : 0;
      out.push('Correr — plan ' + F.num(d.km, 1) + ' km · real ' + F.num(r.km, 1) + ' km <b class="' + claseDif(pct) + '">' + (pct > 0 ? '+' : '') + pct + '%</b>');
    }
    if (d.minBici >= 10 && r.min != null) {
      var minBici = r.minBici != null ? r.minBici : r.min;
      var p2 = d.minBici ? Math.round((minBici - d.minBici) / d.minBici * 100) : 0;
      out.push('Bici — plan ' + F.num(d.minBici, 0) + " min · real " + F.num(minBici, 0) + ' min <b class="' + claseDif(p2) + '">' + (p2 > 0 ? '+' : '') + p2 + '%</b>');
    }
    if (r.ritmo) out.push('Ritmo / intensidad real: <b>' + esc(r.ritmo) + '</b>');
    if (r.strava) out.push('Datos importados automáticamente de Strava');
    return out.length ? "<div class='difP'><small>" + out.join('<br>') + '</small></div>' : '';
  }

  /* ---------- carga proyectada ---------- */
  function ritmoDe(tipo, z) {
    if (!z) return 390;
    if (tipo === 'R') return z.facilLento;
    if (tipo === 'Q') return z.maraton;
    if (tipo === 'C') return z.umbral;
    return z.facil;
  }
  function cargaDia(d, z, calib) {
    if (d.pausa) return { min: 0, minRun: 0, kmRun: 0, carga: 0 };   // descanso total: la carga proyectada decae
    var kmRun = kmRunPlan(d);
    var minRun = kmRun > 0 ? kmRun * ritmoDe(d.tipo, z) / 60 : 0;
    var kBici = calib.mtb || 1.5;
    return { min: minRun + d.minBici, minRun: minRun, kmRun: kmRun, carga: minRun * (calib.running || 0.8) + d.minBici * kBici };
  }

  // Serie diaria sintética: historia real + plan, para poder calcular ACWR del plan.
  function proyectarCarga(D, lista) {
    var hist = D.dias.map(function (x) { return { iso: x.iso, carga: x.carga, min: x.min, semana: x.semana, dt: x.dt, dow: x.dow, acts: [], km: x.km, kmRun: x.kmRun, kmBici: x.kmBici, elev: 0, minRun: x.minRun, grupos: {} }; });
    var ultimo = hist.length ? hist[hist.length - 1].iso : null;
    lista.forEach(function (d) {
      if (ultimo && d.fecha <= ultimo) return;
      var c = cargaDia(d, D.zonas, D.calib), t = DT.d(d.fecha);
      hist.push({ iso: d.fecha, carga: c.carga, min: c.min, semana: DT.isoWeek(t), dt: t, dow: DT.dowMon0(t),
        acts: [], km: c.kmRun, kmRun: c.kmRun, kmBici: 0, elev: 0, minRun: c.minRun, grupos: {}, plan: true });
    });
    return M.semanas(M.acwr(hist));
  }

  /* ---------- vista: diseño y datos visibles (preferencia local) ---------- */
  var CLAVE_VISTA = 'calVista';
  var LAYOUTS = [['cuadricula', 'Cuadrícula'], ['compacta', 'Compacta'], ['agenda', 'Agenda']];
  var CAMPOS = [['ico', 'Iconos'], ['ses', 'Sesión'], ['rit', 'Ritmo'], ['vol', 'Volumen'], ['cum', 'Cumplimiento'], ['evt', 'Competencias']];
  var CAMPOS_DEF = { ico: 1, ses: 1, rit: 0, vol: 1, cum: 1, evt: 1 };
  function vista() {
    var v = App.data.pref(CLAVE_VISTA, null) || {};
    var movil = global.matchMedia && global.matchMedia('(max-width:700px)').matches;
    var lay = LAYOUTS.some(function (l) { return l[0] === v.layout; }) ? v.layout : (movil ? 'agenda' : 'cuadricula');
    return { layout: lay, show: Object.assign({}, CAMPOS_DEF, v.show || {}) };
  }
  function guardarVista(v) { App.data.setPref(CLAVE_VISTA, v); }
  function claseVista() {
    var v = vista();
    return 'vista v-' + v.layout + CAMPOS.map(function (c) { return v.show[c[0]] ? ' sh-' + c[0] : ''; }).join('');
  }
  function barraVista() {
    var v = vista();
    return "<div class='calbar'>" +
      "<div class='seg' id='calLay' role='toolbar' aria-label='Diseño del calendario'>" + LAYOUTS.map(function (l) {
        return "<button type='button' data-lay='" + l[0] + "' aria-pressed='" + (v.layout === l[0]) + "'>" + esc(l[1]) + '</button>';
      }).join('') + '</div>' +
      "<div class='seg tg' id='calTgl' role='toolbar' aria-label='Datos visibles'>" + CAMPOS.map(function (c) {
        return "<button type='button' data-campo='" + c[0] + "' aria-pressed='" + !!v.show[c[0]] + "'>" + esc(c[1]) + '</button>';
      }).join('') + '</div></div>';
  }

  /* ---------- piezas de una celda ---------- */
  function vtHecho(f) { var h = App.data.pref('vtHecho', {}) || {}; return !!h[f]; }
  var SPORT_DEP = { run: 'running', bici: 'bici', fuerza: 'fuerza', nado: 'nado' };
  function iconosDe(d, evalDia, puntuado) {
    var I = App.icons, T = TIPOS[d.tipo] || TIPOS.E, comps = componentesPlan(d, true), out = [];
    var estado = {};
    evalDia.componentes.forEach(function (c) { estado[c.deporte] = c.estado; });
    function dep(n) {
      var k = SPORT_DEP[n];
      return puntuado && k && estado[k] ? ' st-' + (estado[k] === 'miss' ? 'miss' : estado[k]) : '';
    }
    var main = I.TIPO_ICONO[d.tipo] || 'run';
    var tiene = { run: comps.some(function (c) { return c.deporte === 'running'; }),
      bici: comps.some(function (c) { return c.deporte === 'bici'; }),
      fuerza: comps.some(function (c) { return c.deporte === 'fuerza'; }),
      nado: comps.some(function (c) { return c.deporte === 'nado'; }) };
    var mainEsDeporte = SPORT_DEP[main] && tiene[main];
    out.push({ n: main, t: T.nom, st: mainEsDeporte ? dep(main) : '', main: true });
    ['run', 'bici', 'fuerza', 'nado'].forEach(function (s) {
      if (!tiene[s] || (s === main && mainEsDeporte)) return;
      out.push({ n: s, t: s === 'run' ? 'Correr' : s === 'bici' ? 'Bici' : s === 'nado' ? 'Natación (opcional)' : 'Fuerza', st: dep(s) });
    });
    if (d.vt) out.push({ n: 'vtaper', t: 'V-taper: ' + (d.vt === 'V' ? 'dorsales' : d.vt === 'W' ? 'hombro posterior y postura' : 'laterales') + ' (' + P.RUTINAS[d.vt].min + ' min)', st: vtHecho(d.fecha) ? ' st-ok' : '' });
    if (d.hito) out.push({ n: d.hito === 'hora' ? 'reloj' : 'avion', t: d.hito === 'vuelo' ? 'Vuelo a Charlotte' : d.hito === 'regreso' ? 'Regreso a Guatemala' : 'Termina el horario de verano de EE. UU.', st: '' });
    else if (d.recordatorio) out.push({ n: 'campana', t: d.recordatorio, st: '' });
    return out.slice(0, 6).map(function (x) {
      var txt = { ' st-ok': 'hecho', ' st-parcial': 'parcial', ' st-miss': 'no hecho' }[x.st];
      return "<span class='ico " + (d.pausa ? 'libre' : I.TIPO_FAMILIA[d.tipo]) + (x.main ? ' mn' : '') + x.st + "' title='" + esc(x.t + (txt ? ' · ' + txt : '')) + "'>" + I.svg(x.n) + '</span>';
    }).join('');
  }
  function anillo(pct) {
    var p = Math.round(pct * 100), cls = p >= 80 ? 'ok' : p >= 40 ? 'warn' : 'bad';
    return "<span class='ring " + cls + "' style='--p:" + p + "' role='img' aria-label='Cumplimiento " + p + " por ciento'><b>" +
      (p >= 80 ? '✓' : p === 0 ? '✕' : p) + '</b></span>';
  }
  function volumen(d, evalDia, puntuado) {
    var partes = [];
    var cr = evalDia.componentes.filter(function (c) { return c.deporte === 'running'; })[0];
    var cb = evalDia.componentes.filter(function (c) { return c.deporte === 'bici'; })[0];
    if (cr) partes.push((puntuado ? F.num(cr.valor, 1) + '/' : '') + F.num(cr.objetivo, 1) + ' km');
    else if (d.km) partes.push(F.num(d.km, 1) + ' km');
    if (cb) partes.push((puntuado ? F.num(cb.valor, 0) + '/' : '') + F.num(cb.objetivo, 0) + "'");
    else if (d.minBici) partes.push(F.num(d.minBici, 0) + "'");
    return partes.join(' · ');
  }
  function detalleComps(evalDia) {
    return evalDia.componentes.map(function (c) {
      var marca = c.estado === 'ok' ? '✓' : c.estado === 'parcial' ? '½' : '✕';
      return "<span class='cp " + c.estado + "'>" + marca + ' ' + esc(c.nombre) + ' ' + F.num(c.valor, c.unidad === 'km' ? 1 : 0) + '/' + F.num(c.objetivo, c.unidad === 'km' ? 1 : 0) + ' ' + c.unidad + '</span>';
    }).join('');
  }

  function celda(d, k, D, agenda, hoyIso) {
    var t = TIPOS[d.tipo] || TIPOS.E, ev = d.evento ? EVT[d.evento] : null, I = App.icons;
    var obj = App.actividad.corto(d, D), evalDia = evaluarDia(d, D);
    var ultimoDato = D.dias.length ? D.dias[D.dias.length - 1].iso : null;
    var pasado = !!ultimoDato && k <= ultimoDato;
    var puntuado = evalDia.total > 0 && (pasado || !!d.real);
    var pct = puntuado ? evalDia.pct : null;
    var fam = d.pausa ? 'libre' : I.TIPO_FAMILIA[d.tipo] || 'libre';
    var aria = F.fechaLarga(k) + (d.pausa ? ' (en pausa)' : '') + ': ' + d.sesion + (puntuado ? '. ' + evalDia.cumplidas + ' de ' + evalDia.total + ' componentes cumplidos.' : '') + ' Ver detalles de la actividad, por deporte';
    var dia = DT.d(k).getUTCDate();
    var cls = 'c f-' + fam + (k === hoyIso ? ' hoy' : '') + (puntuado ? ' pas' : '') + (d.viaje ? ' viaje' : '') + (d.pausa ? ' pausa' : '');
    var tip = esc(t.nom + ' · ' + d.sesion);
    var fecha = agenda ? "<span class='fe'><i>" + F.DOW[DT.dowMon0(DT.d(k))] + '</i><b>' + dia + '</b></span>' : "<b class='fe'>" + dia + '</b>';
    var ico = "<span class='p-ico'>" + iconosDe(d, evalDia, puntuado) + '</span>';
    var ses = "<span class='p-ses'>" + esc(d.sesion) + '</span>';
    var rit = obj ? "<span class='p-rit'>" + esc(obj) + '</span>' : '';
    var evt = ev ? "<span class='p-evt'>" + I.svg('carrera') + esc(ev.nombre) + '</span>' : '';
    var vol = "<span class='p-vol'>" + volumen(d, evalDia, puntuado) + '</span>';
    var cum = "<span class='p-cum'>" + (d.pausa ? "<span class='ring pz' role='img' aria-label='En pausa'>" + I.svg('pausa') + '</span>' : puntuado ? anillo(pct) : '') + '</span>';
    var det = puntuado ? "<span class='p-det'>" + detalleComps(evalDia) + '</span>' : '';
    var cuerpo = agenda
      ? fecha + ico + "<span class='ag-tx'>" + ses + evt + rit + det + '</span>' + vol + cum
      : fecha + cum + ico + ses + evt + rit + vol;
    return "<div class='" + cls + "' data-f='" + esc(k) + "' tabindex='0' role='button' title='" + tip + "' aria-label='" + esc(aria) + "'>" + cuerpo + '</div>';
  }

  /* ---------- rejilla ---------- */
  function semanasDe(lista) {
    var ini = DT.d(lista[0].fecha), fin = DT.d(lista[lista.length - 1].fecha);
    var idx = {}; lista.forEach(function (d) { idx[d.fecha] = d; });
    var cur = DT.addDays(ini, -DT.dowMon0(ini)), tope = DT.addDays(fin, 6 - DT.dowMon0(fin)), out = [];
    while (cur <= tope) {
      var sem = { lunes: DT.iso(cur), num: String(DT.isoWeek(cur)).slice(-2), dias: [], plan: 0, real: 0, bici: 0, vt: 0, vtOk: 0 };
      for (var i = 0; i < 7; i++) {
        var k = DT.iso(cur), d = idx[k] || null;
        sem.dias.push({ k: k, d: d });
        if (d) {
          if (d.pausa) sem.pausa = (sem.pausa || 0) + 1;
          sem.plan += kmRunPlan(d);
          if (!d.pausa && d.minBici) sem.bici += d.minBici;
          if (d.vt) { sem.vt++; if (vtHecho(k)) sem.vtOk++; }
          var r = realDe(k); if (r && r.km) sem.real += r.km;
        }
        cur = DT.addDays(cur, 1);
      }
      out.push(sem);
    }
    return out;
  }
  function kmSemana(s) {
    if (s.pausa && !s.plan) return "<span class='kmw'><b>pausa</b>" + (s.real ? "<small>real " + F.num(s.real, 0) + '</small>' : '') + '</span>';
    return "<span class='kmw'><b>" + F.num(s.plan, 0) + " km</b>" + (s.real ? "<small>real " + F.num(s.real, 0) + '</small>' : '') +
      (s.bici ? "<small>bici " + F.num(s.bici / 60, 1) + ' h</small>' : '') +
      (s.vt ? "<small>V " + s.vtOk + '/' + s.vt + '</small>' : '') + '</span>';
  }
  function rejilla(plan, lista, D) {
    var v = vista(), agenda = v.layout === 'agenda', hoy = isoHoy(), sems = semanasDe(lista);
    if (agenda) {
      return "<div class='ag'>" + sems.map(function (s) {
        var filas = s.dias.filter(function (x) { return x.d; }).map(function (x) { return celda(x.d, x.k, D, true, hoy); }).join('');
        if (!filas) return '';
        return "<div class='ag-sem'><header><b>Semana " + esc(s.num) + '</b> <span>' + esc(F.fecha(s.dias[0].k)) + ' – ' + esc(F.fecha(s.dias[6].k)) + '</span>' + kmSemana(s) + '</header>' + filas + '</div>';
      }).join('') + '</div>';
    }
    var out = "<div class='cal'><div class='g8'>" + F.DOW.map(function (x) { return "<div class='h'>" + x + '</div>'; }).join('') + "<div class='h'>km</div>";
    sems.forEach(function (s) {
      s.dias.forEach(function (x) { out += x.d ? celda(x.d, x.k, D, false, hoy) : "<div class='c e'></div>"; });
      out += "<div class='tt'>" + kmSemana(s) + '</div>';
    });
    return out + '</div></div>';
  }

  function bannerPausa() {
    if (!P.PAUSA || !P.PAUSA.activa) return '';
    return U.note('Entrenamiento en pausa desde el ' + esc(F.fecha(P.PAUSA.desde)),
      esc(P.PAUSA.motivo) + ' Los días en gris conservan su plan original (nada se borró) pero no exigen nada ni cuentan para la carga proyectada. ' +
      'Cuando el médico lo autorice, se reanuda: el plan se retoma con la vuelta gradual de la sección «Dedo del pie posiblemente roto» (Cuerpo y ciencia).', 'warn');
  }

  function leyenda() {
    var I = App.icons;
    return "<div class='lgd cal' aria-label='Leyenda'>" +
      I.FAMILIAS.map(function (f) { return "<span class='f-" + f[0] + "'><span class='ico " + f[0] + "'>" + I.svg({ suave: 'run', duro: 'rayo', monte: 'monte', bici: 'bici', carrera: 'carrera', libre: 'descanso' }[f[0]]) + '</span>' + esc(f[1]) + '</span>'; }).join('') +
      "<span class='sep'></span>" +
      "<span><span class='ico vtaper'>" + I.svg('vtaper') + '</span>V-taper (gris: pendiente; verde: hecho)</span>' +
      "<span><span class='ring ok' style='--p:100'><b>✓</b></span>hecho (≥ 80 %)</span>" +
      "<span><span class='ring warn' style='--p:55'><b>55</b></span>parcial</span>" +
      "<span><span class='ring bad' style='--p:0'><b>✕</b></span>no hecho</span>" +
      (P.PAUSA && P.PAUSA.activa ? "<span><span class='ring pz'>" + I.svg('pausa') + '</span>en pausa</span>' : '') + '</div>';
  }

  /* ---------- exportación ---------- */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function ics(plan, lista) {
    var L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//strava-analyzer//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
      'X-WR-CALNAME:Plan ' + P.PLANES[plan].nombre];
    var stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
    lista.forEach(function (d) {
      var ev = d.evento ? EVT[d.evento] : null;
      var f = d.fecha.replace(/-/g, ''), t = TIPOS[d.tipo] || TIPOS.E;
      var fin = DT.iso(DT.addDays(DT.d(d.fecha), 1)).replace(/-/g, '');
      var titulo = (ev ? '🏁 ' + ev.nombre : t.nom + ': ' + d.sesion);
      var desc = [d.sesion];
      if (d.km) desc.push(F.num(d.km, 1) + ' km corriendo');
      if (d.minBici) desc.push(F.num(d.minBici, 0) + ' min de bici');
      if (ev) desc.push(ev.nota);
      if (d.recordatorio) desc.push('⏰ ' + d.recordatorio);
      if (d.nat) desc.push('Natación opcional ' + d.nat + ' min');
      L.push('BEGIN:VEVENT',
        'UID:' + plan + '-' + d.fecha + '@strava-analyzer',
        'DTSTAMP:' + stamp,
        'DTSTART;VALUE=DATE:' + f,
        'DTEND;VALUE=DATE:' + fin,
        'SUMMARY:' + escIcs(titulo),
        'DESCRIPTION:' + escIcs(desc.join('. ')),
        ev && ev.lugar ? 'LOCATION:' + escIcs(ev.lugar) : 'X-SKIP:1',
        'CATEGORIES:' + escIcs(t.nom),
        'END:VEVENT');
    });
    L.push('END:VCALENDAR');
    return L.filter(function (x) { return x !== 'X-SKIP:1'; }).map(plegar).join('\r\n');
  }
  // RFC 5545: ninguna línea puede pasar de 75 octetos; la continuación lleva un espacio delante.
  function plegar(linea) {
    if (linea.length < 60) return linea;
    var trozos = [], cur = "", n = 0;
    for (var i = 0; i < linea.length; i++) {
      var c = linea[i];
      var o = c.charCodeAt(0) < 128 ? 1 : unescape(encodeURIComponent(c)).length;
      if (n + o > 73) { trozos.push(cur); cur = ""; n = 0; }
      cur += c; n += o;
    }
    trozos.push(cur);
    return trozos.join('\r\n ');
  }
  function escIcs(s) {
    return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
  }
  function enlaceGoogle(d) {
    var ev = d.evento ? EVT[d.evento] : null, t = TIPOS[d.tipo] || TIPOS.E;
    var f = d.fecha.replace(/-/g, ''), fin = DT.iso(DT.addDays(DT.d(d.fecha), 1)).replace(/-/g, '');
    var q = ['action=TEMPLATE',
      'text=' + encodeURIComponent(ev ? ev.nombre : t.nom + ': ' + d.sesion),
      'dates=' + f + '/' + fin,
      'details=' + encodeURIComponent(d.sesion),
      ev && ev.lugar ? 'location=' + encodeURIComponent(ev.lugar) : ''
    ].filter(Boolean);
    return 'https://calendar.google.com/calendar/render?' + q.join('&');
  }
  function descargar(nombre, texto, tipo) {
    var b = new Blob([texto], { type: tipo || 'text/calendar;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(b); a.download = nombre;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  /* ---------- análisis, horario y racha (pestañas del detalle y paneles) ---------- */
  function vd(a) { var v = veredictoTexto(a); return "<span class='vd " + v[1] + "'>" + esc(v[0]) + '</span>'; }
  function hora(x) { var h0 = Math.floor(x + 1e-9), m = Math.round((x - h0) * 60); return h0 + ':' + (m < 10 ? '0' : '') + m; }
  function refsHtml(lim, z) {
    return "<ul class='an-ref'><li><b>Z1</b> FC bajo " + lim.l1 + ' lpm: fácil y recuperación.</li>' +
      '<li><b>Z2</b> FC ' + lim.l1 + '–' + lim.l2 + ' lpm: aeróbico sostenido.</li>' +
      '<li><b>Z3</b> FC desde ' + lim.l2 + ' lpm: umbral y VO₂máx.</li>' +
      (z ? '<li><b>Ritmos:</b> intervalo ' + F.pace(z.intervalo) + ' · umbral ' + F.pace(z.umbral) + ' · maratón ' + F.pace(z.maraton) + ' · fácil ' + F.pace(z.facilRapido) + '–' + F.pace(z.facilLento) + ' /km.</li>' : '') + '</ul>';
  }
  function analisisHtml(d) {
    var f = d.fecha, a = ANALISIS_FULL[f], tipo = d.tipoOriginal || d.tipo, T = TIPOS[tipo] || {}, lim = limitesFC(), z = D0 && D0.zonas;
    var plan = d.sesionOriginal || d.sesion;
    if (f < isoHoy()) {
      if (!a) return "<p class='vacio'>No hay una salida a pie en Strava este día (plan: " + esc(plan) + '). Si corriste y no se sincronizó, anótalo en «Sesión» y se cuenta como hecho.</p>';
      var out = "<div class='an-cab'>" + vd(a) + ' <span>' + esc(T.nom || '') + ' · ' + esc(plan) + '</span></div>';
      if (a.objetivo) out += "<p><b>Qué pedía la sesión:</b> " + esc(a.objetivo) + '</p>';
      out += '<h5>Qué pasó</h5><ul>' + a.razones.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>';
      if (a.falto.length) out += '<h5>Qué faltó para cumplirla</h5><ul>' + a.falto.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
      else out += "<p class='ok-tx'>No faltó nada: la sesión cumplió lo que pedía.</p>";
      if (a.nivel === 'parcial') out += "<p><small>Parcial no es fallo: el esfuerzo fue real, y por eso no se reprograma. Sólo cuenta como calidad completa si llegas al bloque o la zona que pedía.</small></p>";
      if (!a.sinSplits) out += '<details><summary>Kilómetro por kilómetro</summary><div class="an-sc"><table class="an-km"><thead><tr><th>km</th><th>Ritmo</th><th>FC</th><th>Zona FC</th><th>Zona ritmo</th></tr></thead><tbody>' +
        a.filas.map(function (r) { return '<tr' + (r.pausa ? " class='pausa'" : '') + '><td>' + r.n + '</td><td>' + F.pace(r.spk) + '</td><td>' + (r.hr || '—') + '</td><td>' + r.zf + '</td><td>' + esc(r.zr) + '</td></tr>'; }).join('') + '</tbody></table></div></details>';
      return out + '<details><summary>Zonas de referencia</summary>' + refsHtml(lim, z) + '</details>';
    }
    var obj = OBJETIVO[tipo] || (tipo === 'E' || tipo === 'R' ? 'Rodaje suave: FC media en Z1 (bajo ' + lim.l1 + ' lpm), sin mirar el reloj.' : '');
    return "<div class='an-cab'><span class='vd futuro'>" + (f === isoHoy() ? 'Hoy' : 'Por venir') + '</span> <span>' + esc(T.nom || '') + ' · ' + esc(plan) + '</span></div>' +
      (obj ? '<p><b>Qué pide la sesión:</b> ' + esc(obj) + '</p>' : '') +
      '<h5>Cómo se juzgará</h5>' + refsHtml(lim, z) +
      '<p><small>Cuando Strava sincronice la salida, aquí aparecerá el veredicto (cumplida, parcial o sin calidad), el porqué y qué faltó.' + (d.racha ? ' Pase lo que pase, la milla mínima (1,6 km) mantiene la racha.' : '') + '</small></p>';
  }
  function horarioHtml(d) {
    var H = P.horarioDe && P.horarioDe(d.fecha, d); if (!H) return '';
    var ini = 4.5, fin = 24, span = fin - ini;
    var barra = H.bloques.map(function (b) {
      return "<span class='hr-b " + b.t + "' style='left:" + ((b.h0 - ini) / span * 100).toFixed(1) + '%;width:' + ((b.h1 - b.h0) / span * 100).toFixed(1) + "%' title='" + esc(hora(b.h0) + '–' + hora(b.h1) + ' · ' + b.txt) + "'></span>";
    }).join('');
    var eje = [6, 9, 12, 15, 18, 21].map(function (x) { return "<i style='left:" + ((x - ini) / span * 100).toFixed(1) + "%'>" + x + '</i>'; }).join('');
    return "<div class='hr'><div class='hr-cab'><b>" + esc(H.titulo) + '</b>' + (H.despertar ? "<span class='hr-up'>Despierta " + esc(H.despertar) + '</span>' : '') + '</div>' +
      "<p class='hr-z'><small>" + esc(H.zona) + '</small></p>' +
      (d.recordatorio ? "<p class='hr-rec'>" + App.icons.svg('campana') + '<span>' + esc(d.recordatorio) + '</span></p>' : '') +
      "<div class='hr-tl' role='img' aria-label='Línea de tiempo del día'>" + barra + "</div><div class='hr-ax'>" + eje + '</div>' +
      "<ul class='hr-ls'>" + H.bloques.map(function (b) { return "<li><i class='" + b.t + "'></i><b>" + hora(b.h0) + '–' + hora(b.h1) + '</b> ' + esc(b.txt) + '</li>'; }).join('') + '</ul>' +
      (H.notas.length ? "<ul class='hr-nt'>" + H.notas.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul>' : '') + '</div>';
  }
  function rachaHtml() {
    var R = P.RACHA; if (!R) return '';
    var hoy = isoHoy(), n = P.diaRacha(hoy), total = P.diaRacha(R.meta), falta = Math.max(0, total - n);
    var pct = Math.min(100, Math.round(n / total * 100));
    return "<section class='racha' aria-label='Racha'><div class='rc-n'><b>Día " + n + '</b><span>de la racha</span></div>' +
      "<div class='rc-m'><div class='rc-bar' role='img' aria-label='" + pct + " por ciento hacia la meta'><i style='width:" + pct + "%'></i></div>" +
      '<small>' + (falta ? 'Faltan <b>' + falta + ' días</b> para el 6 de enero de 2027 (día ' + total + ').' : 'Meta cumplida: la racha sigue como extra.') +
      ' Mínimo diario: <b>1 milla (1,6 km)</b>. En este plan no hay un solo día sin correr; el descanso es de bici y fuerza.</small></div></section>';
  }
  function hitosHtml() {
    var hoy = isoHoy(), I = App.icons;
    var H = [['2026-11-01', 'reloj', 'Termina el horario de verano de EE. UU.', 'Domingo 1 nov: Utah queda una hora más tarde; Guatemala no cambia.'],
      ['2026-11-25', 'avion', 'Vuelo a Charlotte', 'Aterrizas 15:27. Calidad por la mañana, rutina de noche desde las 18:00.'],
      ['2027-01-13', 'avion', 'Regreso a Retalhuleu', 'Vuelo 14:00 · la milla de la racha a las 22:00 de Guatemala.']];
    var prox = H.filter(function (x) { return x[0] >= hoy; });
    if (!prox.length) return '';
    return "<div class='hitos'>" + prox.map(function (x) {
      var dd = Math.round((DT.d(x[0]) - DT.d(hoy)) / 864e5);
      return "<div class='hito'><span class='ico libre'>" + I.svg(x[1]) + "</span><div><b>" + esc(x[2]) + '</b><small>' + esc(F.fecha(x[0])) + ' · ' + (dd === 0 ? 'hoy' : 'en ' + dd + ' días') + '<br>' + esc(x[3]) + '</small></div></div>';
    }).join('') + '</div>';
  }
  /* Tabla «calidad hasta ahora»: todos los días pasados con sesión de calidad o largo. */
  function calidadHasta(lista) {
    var filas = [], c = { ok: 0, parcial: 0, sin: 0 };
    Object.keys(ANALISIS_FULL).sort().forEach(function (f) {
      var a = ANALISIS_FULL[f];
      if (!/^[QHSTL]$/.test(a.tipo)) return;
      var d = lista.filter(function (x) { return x.fecha === f; })[0] || { sesion: '' };
      c[a.nivel === 'ok' ? 'ok' : a.nivel === 'parcial' ? 'parcial' : 'sin']++;
      var m = a.m;
      filas.push([F.fecha(f), "<span class='wrap'>" + esc(d.sesionOriginal || d.sesion) + '</span>', vd(a),
        F.num(m.km, 1) + ' km · FC ' + Math.round(m.hr) + (a.sinSplits ? '' : ' · ' + F.num(m.z2min, 0) + ' min en Z2+' + (m.z3min >= 1 ? ' · ' + F.num(m.z3min, 0) + ' en Z3' : ''))]);
    });
    if (!filas.length) return '';
    return '<h3>Calidad hasta ahora</h3>' +
      U.kpis([U.kpi('Cumplidas', String(c.ok), 'sesiones de calidad o largo', c.ok ? 'ok' : ''),
        U.kpi('Parciales', String(c.parcial), 'esfuerzo real, por debajo de lo pedido', c.parcial ? 'warn' : ''),
        U.kpi('Sin calidad', String(c.sin), 'se reprograman', c.sin ? 'bad' : 'ok')], 'k3') +
      U.tabla([{ t: 'Fecha' }, { t: 'Sesión del plan' }, { t: 'Veredicto' }, { t: 'Lo medido' }], filas,
        { pie: 'Se juzga por kilómetro con Strava: FC en zonas (Z2 desde ' + limitesFC().l1 + ' lpm, Z3 desde ' + limitesFC().l2 + ') y ritmo. Toca el día en el calendario, pestaña «Análisis», para ver el porqué y qué faltó.' });
  }

  /* ---------- render ---------- */
  function render(D) {
    D0 = D;
    var plan = planActivo(), lista = dias(plan), info = P.PLANES[plan];
    var secCalidad = calidadHasta(lista), racha = rachaHtml(), hitos = hitosHtml(), hoyN = P.diaRacha ? P.diaRacha(isoHoy()) : 0;
    var semPlan = proyectarCarga(D, lista);
    var futuras = semPlan.filter(function (w) { return w.dias.some(function (d) { return d.plan; }); });

    // comparación de riesgo entre los tres planes
    var COLOR = { estructurado: 'var(--ok)', intermedio: 'var(--warn)', brutal: 'var(--bad)' };
    var comp = ['estructurado', 'intermedio', 'brutal'].map(function (pid) {
      var s = proyectarCarga(D, dias(pid)).filter(function (w) { return w.dias.some(function (d) { return d.plan; }); });
      return { id: pid, nombre: P.PLANES[pid].nombre, sem: s, color: COLOR[pid] };
    });
    var brutalComp = comp.filter(function (c) { return c.id === 'brutal'; })[0];
    var etiquetas = comp[0].sem.map(function (w) { return w.semana.slice(6); });
    var gAcwr = C.lines({
      labels: etiquetas,
      series: comp.map(function (c) { return { name: c.nombre, color: c.color, values: c.sem.map(function (w) { return w.acwr; }), width: 2.2, dots: true }; }),
      bands: [{ from: 0.8, to: 1.3, color: 'var(--ok)' }],
      hline: [{ v: 1.5, color: 'var(--bad)', label: 'riesgo alto' }],
      height: 240, labelEvery: 1, forceMin: 0.5,
      fmtY: function (v) { return F.num(v, 1); }, fmtVal: function (v) { return F.num(v, 2); },
      label: 'ACWR proyectado de los dos planes',
      caption: 'Mismo motor que usa el módulo 1, aplicado a la carga que proyecta cada plan. No es una opinión sobre el camino brutal: es su propio número.'
    }) + C.legend(comp.map(function (c) { return { name: c.nombre, color: c.color }; }));

    var gMono = C.bars({
      values: brutalComp.sem.map(function (w) { return w.monotonia; }),
      labels: etiquetas, height: 160, labelEvery: 1,
      colorFn: function (v) { var c = M.clasifMonotonia(v); return c === 'ok' ? 'var(--ok)' : c === 'warn' ? 'var(--warn)' : 'var(--bad)'; },
      fmtVal: function (v) { return F.num(v, 2); }, fmtY: function (v) { return F.num(v, 1); },
      label: 'Monotonía del camino brutal',
      caption: 'Monotonía semanal proyectada del camino brutal.'
    });

    var kmTot = lista.reduce(function (s, d) { return s + kmRunPlan(d); }, 0);
    var pico = futuras.reduce(function (m, w) { return Math.max(m, w.acwr || 0); }, 0);

    /* ---- competencias ---- */
    var filasEv = P.EVENTOS.map(function (e) {
      var d = lista.filter(function (x) { return x.fecha === e.fecha; })[0];
      return [
        F.fecha(e.fecha) + ' <small>' + F.DOW[DT.dowMon0(DT.d(e.fecha))] + '</small>',
        "<span class='wrap'>" + esc(e.nombre) + '</span>',
        U.chip(e.prioridad, e.prioridad === 'A' ? '' : 'mut'),
        esc(e.lugar),
        d ? "<span class='wrap'>" + esc(d.sesion) + '</span>' : '—',
        "<a href='" + esc(enlaceGoogle(d || { fecha: e.fecha, sesion: e.nombre, evento: e.id, tipo: 'C' })) + "' target='_blank' rel='noopener'>Google</a>"
      ];
    });

    return h`
      ${raw(U.modhead('3', 'Octubre a enero, día por día', 'Tres caminos sobre las mismas seis competencias. Toca un día para ver el detalle por deporte y registrar lo que hiciste de verdad.'))}

      ${raw(racha)}
      ${raw(hitos)}
      ${raw(bannerPausa())}
      <div id='calCtl' role='group' aria-label='Elegir plan'>
        ${raw(BOTONES.map(function (b) {
          return "<button type='button' data-plan='" + b[0] + "' class='" + (plan === b[0] ? '' : 'secondary outline') + "'>" + esc(b[1]) + '</button>';
        }).join(''))}
      </div>
      <p class='ordenSel'><button type='button' id='calOrden' class='secondary outline' aria-pressed='${App.data.pref('ordenInvertido', false) ? 'true' : 'false'}' title='Orden en los días con correr y bici'>Orden en días híbridos: ${App.data.pref('ordenInvertido', false) ? 'invertido (voltear a la propuesta)' : 'propuesto (voltear)'}</button></p>
      <p class='lede'>${esc(info.resumen)}</p>
      ${raw(panelAjustes(plan))}

      ${raw(barraVista())}
      ${raw(leyenda())}
      <div id='calGrid' class='${claseVista()}'>${raw(rejilla(plan, lista, D))}</div>
      <p><small>Las actividades de Strava marcan automáticamente los días pasados y completan el plan vs. real. Toca cualquier día para ver el detalle o añadir una nota; el registro manual se guarda sólo en este navegador.</small></p>

      ${raw(resumenReciente(D, lista))}
      ${raw(secCalidad)}
      ${raw(U.kpis([
        U.kpi('Kilómetros del bloque', F.num(kmTot, 0), 'corriendo, del ' + F.fecha(lista[0].fecha) + ' al ' + F.fecha(lista[lista.length - 1].fecha)),
        U.kpi('ACWR máximo proyectado', F.num(pico, 2), pico > 1.5 ? 'zona de riesgo alto' : pico > 1.3 ? 'vigilar' : 'dentro de rango',
          pico > 1.5 ? 'bad' : pico > 1.3 ? '' : 'ok'),
        U.kpi('Racha', 'Día ' + hoyN, 'meta 6 ene 2027 · mínimo 1 milla al día', 'ok'),
        U.kpi('Natación y boxeo', lista.filter(function (d) { return d.nat; }).length + ' · ' + lista.filter(function (d) { return /fuerza C/i.test(d.sesion || ''); }).length, 'sesiones previstas: natación opcional · boxeo'),
        U.kpi('Días con actividad', F.num(lista.filter(function (d) { return d.real; }).length, 0), 'Strava o registro manual')
      ]))}

      <div id='calExp' role='group'>
        <button type='button' data-exp='ics'>Descargar .ics</button>
        <button type='button' data-exp='csv' class='secondary'>Descargar .csv</button>
        <button type='button' data-exp='reset' class='secondary outline'>Borrar mi registro real</button>
      </div>
      ${raw(U.note('Cómo importarlo',
        '<b>Google Calendar:</b> abre «Configuración → Importar y exportar», sube el archivo .ics y elige en qué calendario entra. ' +
        'Para un solo día, usa el enlace «Google» de la tabla de competencias. ' +
        '<b>Apple Calendar / Outlook:</b> abre el .ics con doble clic.'))}

      ${raw(U.acc('Horario y rutinas en que se basa el plan', '<p>Cada día tiene su pestaña «Horario». Hasta el 1 de nov (verano de Utah): mañana 5:30–6:45, trabajo 7:00–16:00. Del 2 de nov al 24 de nov: Utah una hora más tarde, mañana hasta 7:30. En Charlotte (25 nov–13 ene, trabajo 9:00–18:00 allá): dos sesiones entre 6:00 y 8:30 y la calidad siempre por la mañana. Las «fuerza A/B/C» son rutinas en casa (módulo Cuerpo 360); la C es boxeo.</p>'))}
      <h3>Competencias del bloque</h3>
      ${raw(P.CONFLICTOS.map(function (c) { return U.note(c.titulo, esc(c.texto), c.nivel); }).join(''))}

      ${raw(U.tabla(
        [{ t: 'Fecha' }, { t: 'Competencia' }, { t: 'Prioridad' }, { t: 'Lugar' }, { t: 'Qué dice el plan activo' }, { t: 'Añadir' }],
        filasEv, { pie: 'Prioridad A es la carrera del año: todo lo demás se subordina a ella.' }
      ))}

      <h3>Lo que cuesta cada camino</h3>
      ${raw(gAcwr)}
      ${raw(gMono)}

      ${raw(U.coach('La diferencia entre los tres caminos', `
        <p>La ruta estructurada acepta que el objetivo del año es la Guatemágica del 21 de noviembre y subordina todo lo demás:
        el trail del 11 de octubre se corre controlado, Entre Senderos se rueda en Z2, San Felipe es activación o no se corre.
        Llegas a la línea de salida descansado.</p>
        <p>La ruta intermedia es el punto medio que pediste: mete calidad de verdad —HIIT, sprints, un día de FTP en bici y una montaña
        fuerte— pero conserva un día libre real y una semana de descarga cada cuatro. El trail se corre a tempo, no a muerte.
        Es la que más entrena sin disparar el riesgo.</p>
        <p>El camino brutal corre las seis competencias a fondo, suma dobles sesiones y no tiene semanas de descarga reales.
        Hay un argumento a su favor: la experiencia de competir se entrena compitiendo, y tú disfrutas eso. Pero el número está arriba:
        el ACWR proyectado se dispara por encima de 1,5 en varias semanas, y vienes de ${F.num(D.habitos.maxRachaSinDescanso, 0)} días
        seguidos sin un día libre. No es una opinión moral sobre el esfuerzo; es aritmética de riesgo.</p>
        <p class='lede'>Si quieres el camino brutal, el precio mínimo es innegociable: un día completamente libre por semana
        y abandonar cualquier sesión en la que el ritmo fácil te salga 30 s/km más lento de lo normal.</p>`))}

      <dialog id='calDlg'>
        <article>
          <header><button type='button' class='x' data-act='cerrar' aria-label='Cerrar'>×</button><b id='calDlgT'>Detalle</b><br><small>Sesión, análisis y horario del día</small></header>
          <div class='seg mtabs' id='calTabs' role='tablist' aria-label='Secciones del día'>
            <button type='button' role='tab' data-tab='ses' aria-pressed='true'>Sesión</button>
            <button type='button' role='tab' data-tab='an' aria-pressed='false'>Análisis</button>
            <button type='button' role='tab' data-tab='hr' aria-pressed='false'>Horario</button>
          </div>
          <div id='calDet' data-p='ses'></div>
          <div id='calAn' data-p='an' hidden></div>
          <div id='calHr' data-p='hr' hidden></div>
          <form id='calForm' data-p='ses'>
            <input type='hidden' name='fecha'>
            <h5>Lo que hiciste de verdad</h5>
            <div class='grid'>
              <label>km corridos<input name='km' type='number' step='0.1' min='0' max='80' placeholder='—'></label>
              <label>minutos totales<input name='min' type='number' step='5' min='0' max='600' placeholder='—'></label>
            </div>
            <label>Ritmo / intensidad real<input name='ritmo' type='text' maxlength='40' placeholder='p. ej. 5:40/km · o «bici Z3 · RPE 7»'></label>
            <label>¿Cómo te fue?<textarea name='nota' rows='2' maxlength='300' placeholder='sensaciones, molestias, por qué cambiaste algo…'></textarea></label>
            <div id='calDif'></div>
            <footer>
              <button type='button' class='secondary outline' data-act='cancelar'>Cerrar</button>
              <button type='button' class='secondary' data-act='saltar'>No la hice · reorganizar</button>
              <button type='button' class='secondary' data-act='borrar'>Borrar registro</button>
              <button type='submit'>Guardar</button>
            </footer>
          </form>
        </article>
      </dialog>
    `;
  }

  /* ---------- interacción ---------- */
  function montar(root, D) {
    D0 = D;
    var dlg = root.querySelector('#calDlg'), form = root.querySelector('#calForm');

    function repintar() {
      var plan = planActivo();
      var g = root.querySelector('#calGrid');
      g.className = claseVista();
      g.innerHTML = rejilla(plan, dias(plan), D0);
      App.$$('#calCtl button', root).forEach(function (b) {
        b.className = b.getAttribute('data-plan') === plan ? '' : 'secondary outline';
      });
      if (App.refrescar) App.refrescar('calendario');
    }

    root.querySelector('#calCtl').addEventListener('click', function (ev) {
      var b = ev.target.closest('button[data-plan]'); if (!b) return;
      App.data.setPref(CLAVE_PLAN, b.getAttribute('data-plan'));
      App.refrescar ? App.refrescar('calendario') : repintar();
    });

    root.querySelector('#calOrden').addEventListener('click', function () {
      App.data.setPref('ordenInvertido', !App.data.pref('ordenInvertido', false));
      App.refrescar ? App.refrescar('calendario') : repintar();
      if (App.refrescar) { App.refrescar('resumen'); App.refrescar('hoy'); }
    });

    root.querySelector('#calLay').addEventListener('click', function (ev) {
      var b = ev.target.closest('button[data-lay]'); if (!b) return;
      var v = vista(); v.layout = b.getAttribute('data-lay'); guardarVista(v);
      App.$$('#calLay button', root).forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
      repintar();
    });
    root.querySelector('#calTgl').addEventListener('click', function (ev) {
      var b = ev.target.closest('button[data-campo]'); if (!b) return;
      var v = vista(), k = b.getAttribute('data-campo'); v.show[k] = v.show[k] ? 0 : 1; guardarVista(v);
      b.setAttribute('aria-pressed', !!v.show[k]);
      root.querySelector('#calGrid').className = claseVista();
    });

    var rs = root.querySelector('[data-reset-saltos]');
    if (rs) rs.addEventListener('click', function () { restablecerSaltos(); refrescarPlan(); });

    root.querySelector('#calGrid').addEventListener('click', abrir);
    root.querySelector('#calGrid').addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); abrir(ev); }
    });

    function pestana(k) {
      App.$$('#calTabs button', root).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-tab') === k); });
      App.$$('[data-p]', dlg).forEach(function (e) { e.hidden = e.getAttribute('data-p') !== k; });
    }
    dlg.addEventListener('click', function (ev) {
      var tb = ev.target.closest('button[data-tab]');
      if (tb) { pestana(tb.getAttribute('data-tab')); return; }
      if (ev.target.closest('button[data-act=cerrar]')) dlg.close();
    });

    function abrir(ev) {
      var c = ev.target.closest('.c[data-f]'); if (!c) return;
      var f = c.getAttribute('data-f'), plan = planActivo();
      var d = dias(plan).filter(function (x) { return x.fecha === f; })[0];
      if (!d) return;
      var r = d.real || {};
      form.fecha.value = f;
      form.km.value = r.km != null ? Math.round(r.km * 100) / 100 : '';
      form.min.value = r.min != null ? Math.round(r.min) : '';
      form.ritmo.value = r.ritmo || '';
      form.nota.value = r.nota || '';
      var bs = form.querySelector('[data-act=saltar]'), pasado = f < isoHoy();
      bs.textContent = estaSaltado(f) ? 'Sí la hice · deshacer' : 'No la hice · reorganizar';
      bs.hidden = !!d.pausa;                       // en pausa no hay nada que reorganizar
      bs.disabled = pasado && !estaSaltado(f);
      bs.title = bs.disabled ? 'Este día ya pasó: se detecta solo con Strava. Sólo se reorganizan hoy y los días por venir.' : '';
      root.querySelector('#calDlgT').textContent = F.fechaLarga(f);
      root.querySelector('#calDet').innerHTML = d.pausa
        ? U.note('Entrenamiento en pausa', esc(P.PAUSA.motivo) + ' Lo de abajo es el plan original, que queda guardado y no se hace hasta nuevo aviso.', 'warn') +
          '<details class="acc"><summary>Ver el plan original de este día</summary>' + App.actividad.detalle(d, D0) + '</details>'
        : App.actividad.detalle(d, D0);
      root.querySelector('#calDif').innerHTML = difHtml(d);
      root.querySelector('#calAn').innerHTML = analisisHtml(d);
      root.querySelector('#calHr').innerHTML = horarioHtml(d);
      var an = ANALISIS_FULL[f];
      root.querySelector('[data-tab=an]').innerHTML = 'Análisis' + (an && pasado ? " <span class='dot " + veredictoTexto(an)[1] + "'></span>" : '');
      pestana(pasado && an && an.nivel !== 'ok' ? 'an' : 'ses');
      dlg.showModal();
    }

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var r = reales(), f = form.fecha.value, reg = {};
      var km = parseFloat(form.km.value), min = parseFloat(form.min.value);
      if (!isNaN(km)) reg.km = km;
      if (!isNaN(min)) reg.min = min;
      if (form.ritmo.value.trim()) reg.ritmo = form.ritmo.value.trim();
      if (form.nota.value.trim()) reg.nota = form.nota.value.trim();
      if (Object.keys(reg).length) r[f] = reg; else delete r[f];
      App.data.setPref(CLAVE_REAL, r);
      dlg.close(); repintar();
    });
    form.addEventListener('click', function (ev) {
      var b = ev.target.closest('button[data-act]'); if (!b) return;
      var act = b.getAttribute('data-act');
      if (act === 'cancelar') { dlg.close(); return; }
      if (act === 'saltar') { if (b.disabled) return; alternarSalto(form.fecha.value); dlg.close(); refrescarPlan(); return; }
      var r = reales(); delete r[form.fecha.value];
      App.data.setPref(CLAVE_REAL, r);
      dlg.close(); repintar();
    });

    root.querySelector('#calExp').addEventListener('click', function (ev) {
      var b = ev.target.closest('button[data-exp]'); if (!b) return;
      var plan = planActivo(), lista = dias(plan), q = b.getAttribute('data-exp');
      if (q === 'ics') {
        descargar('plan-' + plan + '-2026.ics', ics(plan, lista));
      } else if (q === 'csv') {
        var cab = 'fecha,tipo,sesion,km_run,min_bici,competencia\n';
        var cuerpo = lista.map(function (d) {
          return [d.fecha, (TIPOS[d.tipo] || {}).nom, '"' + String(d.sesion).replace(/"/g, '""') + '"',
            d.km, d.minBici, d.evento ? '"' + EVT[d.evento].nombre + '"' : ''].join(',');
        }).join('\n');
        descargar('plan-' + plan + '-2026.csv', cab + cuerpo, 'text/csv;charset=utf-8');
      } else if (q === 'reset') {
        if (!confirm('Se borra todo tu registro real (lo que hiciste de verdad). ¿Seguro?')) return;
        App.data.setPref(CLAVE_REAL, {});
        repintar();
      }
    });
  }

  App.mods.push({ id: 'calendario', nom: 'Calendario', tab: 'Plan', icono: 'M3 9h18M7 3v4M17 3v4M4 5h16v16H4z', render: render, montar: montar });
  App.calExport = { ics: ics, enlaceGoogle: enlaceGoogle, dias: dias, evaluarDia: evaluarDia, cambios: cambios,
    estaSaltado: estaSaltado, alternarSalto: alternarSalto, restablecerSaltos: restablecerSaltos };
})(this);
