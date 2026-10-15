/* resumen.js — la portada: un tablero con todo lo importante a la mano. Cada ficha abre un modal con el detalle. */
(function (global) {
  'use strict';
  var App = global.App, U = App.ui, F = App.fmt, M = App.metrics, esc = App.esc;

  function ficha(id, lbl, val, sub, nivel, ancho) {
    return "<button type='button' class='tile" + (nivel ? ' ' + nivel : '') + (ancho ? ' ' + ancho : '') + "' data-modal='" + id + "'>" +
      "<span class='lbl'>" + esc(lbl) + "</span><span class='val'>" + val + "</span>" +
      (sub ? "<span class='sub'>" + sub + "</span>" : '') + "<span class='mas' aria-hidden='true'>ver más ›</span></button>";
  }
  function plantilla(id, titulo, cuerpo) {
    return "<template data-modal-t='" + id + "' data-titulo='" + esc(titulo) + "'>" + cuerpo + '</template>';
  }

  function render(D) {
    var H = App.hoy.partes(D), n = H.n, T = H.talla;
    var sem = D.semanas.filter(function (w) { return w.completa; });
    var ult = sem[sem.length - 1] || {};
    var hoyAct = D.dias[D.dias.length - 1] || {};
    var it = D.intensidad, hb = D.habitos;
    var largoRun = Math.max.apply(null, D.runs.map(function (a) { return a.km; }).concat([0]));
    var p15 = M.predecir(D.vdot, 15000, largoRun);
    var dias15 = App.date.diffDays(new Date(), App.date.d('2026-11-21'));
    var acwrOk = M.clasifAcwr(hoyAct.acwrEwma) === 'ok', monoOk = M.clasifMonotonia(ult.monotonia) === 'ok';

    var fichas = [], modales = [];

    /* ---- Hoy ---- */
    if (H.hoyDia) {
      var d = H.hoyDia;
      /* la sesión de hoy se pinta en el hero */
      modales.push(plantilla('hoy', 'Lo que te toca hoy',
        U.note(esc(H.tipo.nom || 'Sesión') + ' · ' + esc(App.hoy.fecha(H.hoyISO)),
          '<b>' + esc(d.sesion) + '</b><br>' + (H.resumenTxt ? esc(H.resumenTxt) + '. ' : '') +
          (H.obj ? 'Objetivo: <b>' + esc(H.obj) + '</b>. ' : '') + 'Ventana: ' + esc(H.ventana) + '.', d.tipo === 'C' ? 'warn' : 'ok') +
        H.detalleHtml));
    } else {
      modales.push(plantilla('hoy', 'Lo que te toca hoy',
        U.note('Hoy no hay sesión en el plan', H.sig ? 'Lo siguiente es el ' + esc(App.hoy.fecha(H.sig.fecha)) + ': ' + esc(H.sig.sesion) + '.' :
          'Pide el bloque de diciembre y lo armamos con lo que pase en la Guatemágica.', 'warn')));
    }

    /* ---- Comer hoy ---- */
    if (n) {
      fichas.push(ficha('comer', 'Comer hoy', F.num(n.kcal, 0) + ' kcal', 'P ' + F.num(n.prot, 0) + ' g · C ' + F.num(n.carbG, 0) + ' g', ''));
      modales.push(plantilla('comer', 'Comer hoy: calorías y macros', U.kpis([
        U.kpi('Comer hoy', F.num(n.kcal, 0) + ' kcal', esc(n.modo)),
        U.kpi('Proteína', F.num(n.prot, 0) + ' g', '4 tomas de ' + F.num(n.prot / 4, 0) + ' g'),
        U.kpi('Carbohidrato', F.num(n.carbG, 0) + ' g', esc(n.carbTxt))
      ], 'k3') + '<p><small>' + esc(n.nota) + '</small></p>' + (T ? T.html : '')));
    }

    /* ---- Talla ---- */
    if (T) {
      fichas.push(ficha('talla', 'Cintura', F.num(T.cintura, 0) + ' → ' + F.num(T.meta, 0) + ' cm',
        T.brutal ? 'mantenimiento hasta el 24 nov' : '≈ −' + F.num(T.cm, 1) + ' cm al 15 nov', 'warn'));
      modales.push(plantilla('talla', 'Meta de talla: cintura, pecho, costados y panza', T.html));
    }

    /* ---- Semana en curso ---- */
    var chipSem = H.semana.map(function (x) {
      var s = x.estado === 'hoy' ? '●' : x.estado === 'pend' ? '○' : x.estado;
      var c = x.estado === 'hoy' ? 'hoy' : x.estado === '✓' ? 'ok' : x.estado === '✗' ? 'bad' : x.estado === '≈' ? 'warn' : '';
      return "<span class='dia " + c + "' title='" + esc(x.sesion) + "'><b>" + x.dow + '</b><i>' + esc(x.tipo) + '</i><u>' + s + '</u></span>';
    }).join('');
    var pendientes = H.semana.filter(function (x) { return x.estado === 'pend' || x.estado === 'hoy'; }).length;
    /* la tira semanal se pinta dentro del hero */
    modales.push(plantilla('semana', 'Esta semana y los últimos días',
      U.tabla([{ t: 'Día' }, { t: 'Tipo' }, { t: 'Plan' }, { t: '' }], H.semana.map(function (x) {
        return [esc(App.hoy.fecha(x.iso)), esc(x.tipo), esc(x.sesion), x.estado === 'pend' ? '○' : x.estado === 'hoy' ? '●' : x.estado];
      }), { pie: '✓ cumplido · ≈ a medias · ✗ no · ● hoy · ○ pendiente.' }) +
      (H.tablaHtml ? '<h4>Últimos días: plan contra Strava</h4>' + H.tablaHtml : '')));

    /* ---- Strava hoy ---- */
    fichas.push(ficha('strava', 'Strava hoy', esc(H.realHoy),
      H.stravaAlDia ? (H.nFilas ? H.buenos + ' de ' + H.nFilas + ' días cumplidos' : 'al día') : 'sin sincronizar desde ' + esc(H.ultimoDato || '—'),
      H.stravaAlDia ? '' : 'warn'));
    modales.push(plantilla('strava', 'Cumplimiento contra Strava',
      (H.stravaAlDia ? '' : U.note('Strava aún no trae datos de hoy', 'La última actividad sincronizada es del ' + esc(H.ultimoDato) +
        '. Corre <code>npm run actualizar</code> en <code>connector/</code> para compararlo.', 'warn')) +
      '<p>Hasta ahora hoy: <b>' + esc(H.realHoy) + '</b>.</p>' + H.tablaHtml));

    /* ---- Guatemágica ---- */
    fichas.push(ficha('meta', 'Guatemágica 15K', dias15 + ' días', 'predicción ' + F.hms(p15.real) + ' · ' + F.paceKm(p15.real / 15), 'warn'));
    modales.push(plantilla('meta', 'La carrera del año: 21 de noviembre',
      U.note('La carrera del año es el 21 de noviembre',
        'La Guatemágica 15K en Retalhuleu es exactamente tu meta de 15K a 5:00/km. Faltan ' + dias15 + ' días y hoy la predicción honesta es ' +
        F.hms(p15.real) + ' (' + F.paceKm(p15.real / 15) + '). Está cerca, pero no sale sola: hay seis competencias antes y dos se pisan con ella.', 'warn') +
      U.coach('Las tres metas, con fecha realista',
        '<p><b>15K a 5:00/km</b> — cuatro a seis meses con entrenamiento estructurado. La Guatemágica de este noviembre es el ensayo; la versión a ritmo llega en 2027.</p>' +
        '<p><b>10K a 5:00/km</b> — tres a nueve meses. Es la más cercana de las tres.</p>' +
        '<p><b>5K a 4:00/km</b> — dos a cuatro años. Exige un VDOT de 49,8 y hoy estás en ' + F.num(D.vdot, 1) + '. Es un proyecto de varias temporadas, no de un invierno.</p>')));

    /* ---- Próximo evento ---- */
    var prox = App.plan.EVENTOS.filter(function (e) { return e.fecha >= H.hoyISO; }).sort(function (a, b) { return a.fecha < b.fecha ? -1 : 1; });
    if (prox.length) {
      var e0 = prox[0], dd = App.date.diffDays(new Date(H.hoyISO + 'T00:00:00'), new Date(e0.fecha + 'T00:00:00'));
      fichas.push(ficha('eventos', 'Próximo evento', dd === 0 ? 'hoy' : 'en ' + dd + ' días', esc(e0.nombre), ''));
      modales.push(plantilla('eventos', 'Próximos eventos', U.tabla([{ t: 'Fecha' }, { t: 'Evento' }, { t: 'Prio' }, { t: 'Nota' }],
        prox.map(function (e) { return [esc(F.fechaLarga ? F.fechaLarga(e.fecha) : e.fecha), esc(e.nombre), esc(e.prioridad), esc(e.nota || '')]; }),
        { pie: 'Cómo prepararte a 15, 10 y 5 días de cada una: módulo «Preparación».' })));
    }

    /* ---- Forma ---- */
    fichas.push(ficha('forma', 'Forma · VDOT', F.num(D.vdot, 1), 'ACWR ' + F.num(hoyAct.acwrEwma, 2) + (acwrOk ? ' en rango' : ' fuera de rango'), acwrOk ? 'ok' : 'bad'));
    modales.push(plantilla('forma', 'Dónde estás hoy', U.kpis([
      U.kpi('VDOT', F.num(D.vdot, 1), esc(D.vdotFuente)),
      U.kpi('ACWR hoy', F.num(hoyAct.acwrEwma, 2), acwrOk ? 'en rango' : 'fuera de rango', acwrOk ? 'ok' : 'bad'),
      U.kpi('Monotonía', F.num(ult.monotonia, 2), monoOk ? 'variada' : 'semana plana', monoOk ? 'ok' : 'bad'),
      U.kpi('Salida más larga', F.km(largoRun), 'tope de resistencia corriendo')
    ]) +
      U.note('Tienes un motor que la mayoría no tiene', F.num(D.extra.horas_totales, 0) + ' horas de entrenamiento en ' + D.dias.length + ' días, ' +
        F.m(D.bici.maxElev) + ' de desnivel en una sola salida y ' + F.km(D.bici.maxKm, 0) + ' como salida más larga. La base aeróbica está construida.', 'ok') +
      U.note('Pero no estás entrenando, estás acumulando', 'El ' + F.pct(it.pct.z1, 0) + ' de tus minutos de carrera son fáciles y sólo el ' + F.pct(it.pct.z3, 1) +
        ' es trabajo duro. Con ' + F.num(hb.maxRachaSinDescanso, 0) + ' días seguidos sin descansar y ' + F.num(hb.diasMinimos, 0) +
        ' días de menos de 20 minutos, el calendario está lleno y el estímulo vacío.', 'bad')));

    var heroHtml = "<div class='hero' data-tipo='" + esc(H.hoyDia ? H.hoyDia.tipo : '-') + "'>" +
      "<div class='hero-top'><span class='hero-fecha'>" + esc(App.hoy.fecha(H.hoyISO)) + "</span>" +
      (H.hoyDia ? "<span class='hero-chip'>" + esc(H.tipo.nom || 'Sesión') + "</span>" : '') + '</div>' +
      "<p class='hero-k'>Hoy toca</p>" +
      "<h2 class='hero-t'>" + (H.hoyDia ? esc(H.resumenTxt || 'Descanso activo') : 'Sin sesión') + '</h2>' +
      "<p class='hero-s'>" + (H.hoyDia ? esc((H.obj ? 'Objetivo ' + H.obj + ' · ' : '') + H.hoyDia.sesion) :
        (H.sig ? 'Sigue: ' + esc(H.sig.sesion) : 'el plan terminó el 30 nov')) + '</p>' +
      "<div class='hero-row'><button type='button' class='hero-cta' data-modal='hoy'>Ver sesión ›</button>" +
      "<div class='hero-race'><b>" + dias15 + "</b><span>días a la<br>Guatemágica 15K</span></div></div>" +
      "<button type='button' class='hero-week' data-modal='semana' aria-label='Ver la semana'>" +
      "<span class='hero-wl'>Esta semana · " + pendientes + " días por delante</span><span class='strip'>" + chipSem + '</span></button>' +
      '</div>';

    return "<div class='port'>" + heroHtml +
      "<div class='port-top'><div><h3>Tu tablero</h3><p class='lede'>Desliza las fichas · plan activo</p></div>" +
      App.hoy.botonesPlan(H.pid) + '</div>' +
      "<div class='tiles slider' id='slider'>" + fichas.join('') + "</div><div class='dots' id='dots' aria-hidden='true'></div>" + modales.join('') +
      "<dialog id='portDlg' class='port-dlg'><article><header><b id='portDlgT'></b>" +
      "<button type='button' class='close-x' aria-label='Cerrar' data-cerrar>✕</button></header><div id='portDlgB'></div></article></dialog>" +
      "<p class='lede'>Abajo tienes el análisis completo: carga y riesgo, el motor de carrera, la bici, las proyecciones, los calendarios editables, los sueños y el material de estudio.</p></div>";
  }

  function montar(el) {
    if (App.hoy) App.hoy.montar(el);
    var sl = el.querySelector('#slider'), dots = el.querySelector('#dots');
    if (sl && dots) {
      var cards = sl.children;
      dots.innerHTML = Array.prototype.map.call(cards, function () { return '<i></i>'; }).join('');
      var pintarDots = function () {
        var w = cards[0] ? cards[0].offsetWidth + 12 : 1, k = Math.round(sl.scrollLeft / w);
        Array.prototype.forEach.call(dots.children, function (d, i) { d.className = i === k ? 'on' : ''; });
      };
      sl.addEventListener('scroll', function () { requestAnimationFrame(pintarDots); }, { passive: true });
      pintarDots();
    }
    var dlg = el.querySelector('#portDlg');
    if (!dlg) return;
    function abrir(id) {
      var t = el.querySelector("template[data-modal-t='" + id + "']");
      if (!t) return;
      el.querySelector('#portDlgT').textContent = t.getAttribute('data-titulo') || '';
      el.querySelector('#portDlgB').innerHTML = t.innerHTML;
      if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
    }
    Array.prototype.forEach.call(el.querySelectorAll('[data-modal]'), function (b) {
      b.addEventListener('click', function () { abrir(b.getAttribute('data-modal')); });
    });
    dlg.addEventListener('click', function (ev) {
      if (ev.target === dlg || ev.target.closest('[data-cerrar]')) dlg.close();
    });
  }

  App.mods.push({ id: 'resumen', nom: 'Resumen', tab: 'Inicio', icono: 'M3 11l9-8 9 8M5 10v10h14V10', render: render, montar: montar });
})(this);
