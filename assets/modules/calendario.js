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
  function realDe(fecha) { return reales()[fecha] || null; }

  // El plan ya no se edita: los km e intensidades son la referencia. Cada día lleva su registro real.
  function dias(plan) {
    return P.PLANES[plan].dias.map(function (d) {
      return { fecha: d.fecha, tipo: d.tipo, sesion: d.sesion, km: d.km, minBici: d.minBici, evento: d.evento, real: realDe(d.fecha) };
    });
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
      var p2 = d.minBici ? Math.round((r.min - d.minBici) / d.minBici * 100) : 0;
      out.push('Bici — plan ' + F.num(d.minBici, 0) + " min · real " + F.num(r.min, 0) + ' min <b class="' + claseDif(p2) + '">' + (p2 > 0 ? '+' : '') + p2 + '%</b>');
    }
    if (r.ritmo) out.push('Ritmo / intensidad real: <b>' + esc(r.ritmo) + '</b>');
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
    var minRun = d.km > 0 ? d.km * ritmoDe(d.tipo, z) / 60 : 0;
    var kBici = calib.mtb || 1.5;
    return { min: minRun + d.minBici, carga: minRun * (calib.running || 0.8) + d.minBici * kBici };
  }

  // Serie diaria sintética: historia real + plan, para poder calcular ACWR del plan.
  function proyectarCarga(D, lista) {
    var hist = D.dias.map(function (x) { return { iso: x.iso, carga: x.carga, min: x.min, semana: x.semana, dt: x.dt, dow: x.dow, acts: [], km: x.km, kmRun: x.kmRun, kmBici: x.kmBici, elev: 0, minRun: x.minRun, grupos: {} }; });
    var ultimo = hist.length ? hist[hist.length - 1].iso : null;
    lista.forEach(function (d) {
      if (ultimo && d.fecha <= ultimo) return;
      var c = cargaDia(d, D.zonas, D.calib), t = DT.d(d.fecha);
      hist.push({ iso: d.fecha, carga: c.carga, min: c.min, semana: DT.isoWeek(t), dt: t, dow: DT.dowMon0(t),
        acts: [], km: d.km, kmRun: d.km, kmBici: 0, elev: 0, minRun: c.min - d.minBici, grupos: {}, plan: true });
    });
    return M.semanas(M.acwr(hist));
  }

  /* ---------- rejilla ---------- */
  function rejilla(plan, lista, D) {
    var ini = DT.d(lista[0].fecha), fin = DT.d(lista[lista.length - 1].fecha);
    var idx = {}; lista.forEach(function (d) { idx[d.fecha] = d; });
    var cur = DT.addDays(ini, -DT.dowMon0(ini));
    var tope = DT.addDays(fin, 6 - DT.dowMon0(fin));
    var out = "<div class='cal'><div class='g8'>" +
      F.DOW.map(function (x) { return "<div class='h'>" + x + '</div>'; }).join('') + "<div class='h'>km</div>";
    var totSem = 0, celdas = '';
    while (cur <= tope) {
      var k = DT.iso(cur), d = idx[k];
      if (!d) {
        celdas += "<div class='c e'></div>";
      } else {
        var t = TIPOS[d.tipo] || TIPOS.E, ev = d.evento ? EVT[d.evento] : null;
        var obj = App.actividad.corto(d, D), hecho = !!d.real;
        totSem += d.km;
        celdas += "<div class='c " + t.cls + (hecho ? ' hecho' : '') + "' data-f='" + esc(k) + "' tabindex='0' role='button' " +
          "aria-label='" + esc(F.fechaLarga(k) + ': ' + d.sesion + '. Ver detalles de la actividad, por deporte') + "'>" +
          (hecho ? "<span class='ok' aria-hidden='true'>✓</span>" : '') +
          "<span class='tg'>" + esc(t.k) + '</span>' +
          '<b>' + DT.d(k).getUTCDate() + '</b>' +
          '<small>' + esc(d.sesion) + '</small>' +
          (ev ? "<small style='color:var(--bad);font-weight:600'>" + esc(ev.nombre) + '</small>' : '') +
          (obj ? "<small class='obj'>" + esc(obj) + '</small>' : '') +
          '<em>' + (d.km ? F.num(d.km, 1) + ' km' : '') + (d.minBici ? (d.km ? ' · ' : '') + F.num(d.minBici, 0) + "'" : '') + '</em>' +
          "<small class='det'>Ver detalles</small></div>";
      }
      if (DT.dowMon0(cur) === 6) {
        out += celdas + "<div class='tt'>" + F.num(totSem, 0) + '</div>';
        celdas = ''; totSem = 0;
      }
      cur = DT.addDays(cur, 1);
    }
    return out + '</div></div>';
  }

  function leyenda() {
    return "<div class='lg cal'>" + Object.keys(TIPOS).map(function (k) {
      return "<span class='" + TIPOS[k].cls + "'><i>" + esc(TIPOS[k].k) + '</i>' + esc(TIPOS[k].nom) + '</span>';
    }).join('') + '</div>';
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

  /* ---------- render ---------- */
  function render(D) {
    D0 = D;
    var plan = planActivo(), lista = dias(plan), info = P.PLANES[plan];
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

    var kmTot = lista.reduce(function (s, d) { return s + d.km; }, 0);
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
      ${raw(U.modhead('3', 'Octubre y noviembre, día por día', 'Tres caminos sobre las mismas seis competencias. Toca cualquier día para ver el detalle por deporte —ritmo o intensidad objetivo y la rutina de fuerza— y registrar lo que hiciste de verdad. Ajustados a tu horario: entre semana desde las 18:00 (máx. 75 min), sábado desde las 14:00 y domingo desde las 05:00; las «fuerza A/B/C» son rutinas en casa (módulo Cuerpo 360).'))}

      ${raw(P.CONFLICTOS.map(function (c) { return U.note(c.titulo, esc(c.texto), c.nivel); }).join(''))}

      <h3>Tus competencias</h3>
      ${raw(U.tabla(
        [{ t: 'Fecha' }, { t: 'Competencia' }, { t: 'Prioridad' }, { t: 'Lugar' }, { t: 'Qué dice el plan activo' }, { t: 'Añadir' }],
        filasEv, { pie: 'Prioridad A es la carrera del año: todo lo demás se subordina a ella.' }
      ))}

      <div id='calCtl' role='group' aria-label='Elegir plan'>
        ${raw(BOTONES.map(function (b) {
          return "<button type='button' data-plan='" + b[0] + "' class='" + (plan === b[0] ? '' : 'secondary outline') + "'>" + esc(b[1]) + '</button>';
        }).join(''))}
      </div>
      <p class='lede'>${esc(info.resumen)}</p>

      ${raw(U.kpis([
        U.kpi('Kilómetros del bloque', F.num(kmTot, 0), 'corriendo, del 5 oct al 30 nov'),
        U.kpi('Semana más alta', F.num(Math.max.apply(null, futuras.map(function (w) { return w.kmRun; })), 1) + ' km', 'pico de volumen'),
        U.kpi('ACWR máximo proyectado', F.num(pico, 2), pico > 1.5 ? 'zona de riesgo alto' : pico > 1.3 ? 'vigilar' : 'dentro de rango',
          pico > 1.5 ? 'bad' : pico > 1.3 ? '' : 'ok'),
        U.kpi('Días libres', F.num(lista.filter(function (d) { return d.tipo === 'D'; }).length, 0), 'descanso real programado'),
        U.kpi('Días registrados', F.num(lista.filter(function (d) { return d.real; }).length, 0), 'lo que ya anotaste de verdad')
      ]))}

      ${raw(leyenda())}
      <div id='calGrid'>${raw(rejilla(plan, lista, D))}</div>
      <p><small>Toca cualquier día para ver el detalle de la actividad por deporte y anotar lo que hiciste. El registro se guarda sólo en este navegador.</small></p>

      <div id='calExp' role='group'>
        <button type='button' data-exp='ics'>Descargar .ics</button>
        <button type='button' data-exp='csv' class='secondary'>Descargar .csv</button>
        <button type='button' data-exp='reset' class='secondary outline'>Borrar mi registro real</button>
      </div>
      ${raw(U.note('Cómo importarlo',
        '<b>Google Calendar:</b> abre «Configuración → Importar y exportar», sube el archivo .ics y elige en qué calendario entra. ' +
        'Para un solo día, usa el enlace «Google» de la tabla de competencias. ' +
        '<b>Apple Calendar / Outlook:</b> abre el .ics con doble clic.'))}

      <h3>Lo que cuesta cada camino</h3>
      ${raw(gAcwr)}
      ${raw(gMono)}

      ${raw(U.coach('La diferencia entre los tres caminos', `
        <p>La ruta estructurada acepta que el objetivo del año es la Guatemágica del 21 de noviembre y subordina todo lo demás:
        el trail del 14 de octubre se corre controlado, Entre Senderos se rueda en Z2, San Felipe es activación o no se corre.
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
          <header><b id='calDlgT'>Detalle</b><br><small>Detalle de la actividad, por deporte</small></header>
          <div id='calDet'></div>
          <form id='calForm'>
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
      root.querySelector('#calGrid').innerHTML = rejilla(plan, dias(plan), D0);
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

    root.querySelector('#calGrid').addEventListener('click', abrir);
    root.querySelector('#calGrid').addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); abrir(ev); }
    });

    function abrir(ev) {
      var c = ev.target.closest('.c[data-f]'); if (!c) return;
      var f = c.getAttribute('data-f'), plan = planActivo();
      var d = dias(plan).filter(function (x) { return x.fecha === f; })[0];
      if (!d) return;
      var r = d.real || {};
      form.fecha.value = f;
      form.km.value = r.km != null ? r.km : '';
      form.min.value = r.min != null ? r.min : '';
      form.ritmo.value = r.ritmo || '';
      form.nota.value = r.nota || '';
      root.querySelector('#calDlgT').textContent = F.fechaLarga(f);
      root.querySelector('#calDet').innerHTML = App.actividad.detalle(d, D0);
      root.querySelector('#calDif').innerHTML = difHtml(d);
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
      if (b.getAttribute('data-act') === 'cancelar') { dlg.close(); return; }
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
  App.calExport = { ics: ics, enlaceGoogle: enlaceGoogle, dias: dias };
})(this);
