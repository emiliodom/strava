/* app.js — arranque: carga los datos, pinta los módulos y gestiona navegación, tema y perfil. */
(function (global) {
  'use strict';
  var App = global.App, $ = App.$, $$ = App.$$;

  var ORDEN = ['resumen', 'dia', 'ano', 'carga', 'running', 'bici', 'proyeccion', 'calendario', 'suenos', 'cuerpo', 'ciencia', 'prevencion', 'vtaper', 'preparacion', 'registro', 'recursos', 'menu'];
  // Cada «página» agrupa módulos afines; la URL es #pagina (o #modulo, que abre su página y baja hasta él).
  var PAGINAS = [
    { id: 'hoy', nom: 'Hoy', icono: 'p_hoy', mods: ['resumen', 'dia'] },
    { id: 'calendario', nom: 'Calendario', icono: 'p_cal', mods: ['calendario'] },
    { id: 'rendimiento', nom: 'Rendimiento', icono: 'p_rend', mods: ['ano', 'carga', 'running', 'bici'] },
    { id: 'metas', nom: 'Metas', icono: 'p_metas', mods: ['proyeccion', 'suenos', 'preparacion'] },
    { id: 'cuerpo', nom: 'Cuerpo y ciencia', icono: 'p_cuerpo', mods: ['cuerpo', 'ciencia', 'prevencion', 'vtaper'] },
    { id: 'comida', nom: 'Comida', icono: 'p_comida', mods: ['menu'] },
    { id: 'registro', nom: 'Registro', icono: 'p_registro', mods: ['registro', 'recursos'] }
  ];
  var MODELO = null, MODS = {}, PAGINA = null;

  /* ---------- tema ---------- */
  function aplicarTema(t) {
    document.documentElement.setAttribute('data-theme', t);
    var b = $('#tm'); if (b) { b.textContent = t === 'dark' ? '☀' : '☾'; b.setAttribute('aria-label', t === 'dark' ? 'Modo claro' : 'Modo oscuro'); }
  }
  function iniciarTema() {
    var t = App.data.pref('tema', null);
    if (!t) t = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    aplicarTema(t);
  }

  /* ---------- navegación por páginas ---------- */
  function paginaDe(hash) {
    var id = String(hash || '').replace(/^#\/?/, '');
    for (var i = 0; i < PAGINAS.length; i++) {
      if (PAGINAS[i].id === id) return { pag: PAGINAS[i], mod: null };
      if (PAGINAS[i].mods.indexOf(id) >= 0) return { pag: PAGINAS[i], mod: id };
    }
    return { pag: PAGINAS[0], mod: null };
  }

  function pintarNav() {
    $('#nav').innerHTML = PAGINAS.map(function (p) {
      return "<li><a href='#" + p.id + "' data-p='" + p.id + "'>" + App.esc(p.nom) + '</a></li>';
    }).join('');
    $('#tab').innerHTML = PAGINAS.map(function (p) {
      return "<a href='#" + p.id + "' data-p='" + p.id + "'>" + App.icons.svg(p.icono) + App.esc(p.nom.split(' ')[0]) + '</a>';
    }).join('');
  }

  function mostrar(hash, noScroll) {
    var r = paginaDe(hash), cambio = PAGINA !== r.pag.id;
    PAGINA = r.pag.id;
    $$('main > section').forEach(function (s) { s.classList.toggle('off', r.pag.mods.indexOf(s.id) < 0); });
    $$('#tab a, #nav a').forEach(function (a) { a.setAttribute('aria-current', a.getAttribute('data-p') === r.pag.id ? 'page' : 'false'); });
    // índice interno de la página, sólo si agrupa varios módulos
    var sub = $('#sub');
    sub.hidden = r.pag.mods.length < 2;
    sub.innerHTML = r.pag.mods.length < 2 ? '' : r.pag.mods.map(function (id) {
      return "<a href='#" + id + "'" + ((r.mod || r.pag.mods[0]) === id ? " aria-current='true'" : '') + '>' + App.esc(MODS[id].nom) + '</a>';
    }).join('');
    document.title = r.pag.nom + ' · Análisis 2026 · Emilio';
    if (noScroll) return;
    var dest = r.mod && document.getElementById(r.mod);
    if (dest) dest.scrollIntoView(); else if (cambio) global.scrollTo(0, 0);
  }

  function medirCabecera() {
    var h = $('header.top'); if (h) document.documentElement.style.setProperty('--hh', h.offsetHeight + 'px');
  }

  /* ---------- imprimir / PDF ---------- */
  // Para imprimir se fuerza el tema claro y se abren los acordeones; todo vuelve a su sitio al terminar.
  var ANTES = null;
  function prepararImpresion() {
    if (ANTES) return;
    ANTES = { tema: document.documentElement.getAttribute('data-theme'), abiertos: [] };
    document.documentElement.setAttribute('data-theme', 'light');
    $$('details:not([open])').forEach(function (d) { d.open = true; ANTES.abiertos.push(d); });
    var f = $('#pie-print'); if (f) f.textContent = 'Generado el ' + new Date().toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  function restaurarImpresion() {
    if (!ANTES) return;
    document.documentElement.setAttribute('data-theme', ANTES.tema);
    ANTES.abiertos.forEach(function (d) { d.open = false; });
    ANTES = null;
    document.body.classList.remove('imprimir-todo');
  }
  function imprimir(todo) {
    document.body.classList.toggle('imprimir-todo', !!todo);
    prepararImpresion();
    setTimeout(function () { global.print(); }, 60);
  }
  function iniciarImprimir() {
    global.addEventListener('beforeprint', prepararImpresion);
    global.addEventListener('afterprint', restaurarImpresion);
    var dlg = $('#pdfDlg');
    $('#btnPdf').addEventListener('click', function () { dlg.showModal(); });
    dlg.addEventListener('click', function (ev) {
      var b = ev.target.closest('button[data-pdf]'); if (!b) return;
      dlg.close();
      if (b.getAttribute('data-pdf') !== 'cancelar') imprimir(b.getAttribute('data-pdf') === 'todo');
    });
  }

  /* ---------- perfil ---------- */
  function iniciarPerfil() {
    var dlg = $('#perfil'), f = $('#perfilForm');
    if (!dlg) return;
    $('#btnPerfil').addEventListener('click', function () {
      f.peso.value = App.data.pref('peso', 70);
      f.edad.value = App.data.pref('edad', 30);
      f.fcmax.value = App.data.pref('fcmax', '');
      dlg.showModal();
    });
    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      App.data.setPref('peso', parseFloat(f.peso.value) || 70);
      App.data.setPref('edad', parseInt(f.edad.value, 10) || 30);
      App.data.setPref('fcmax', parseInt(f.fcmax.value, 10) || null);
      dlg.close();
      pintar(MODELO);
    });
    f.addEventListener('click', function (ev) {
      if (ev.target.closest("[data-act='cancelar']")) dlg.close();
    });
  }

  /* ---------- pintado ---------- */
  function pintar(D) {
    var mods = ORDEN.map(function (id) { return MODS[id]; }).filter(Boolean);
    $('#main').innerHTML = mods.map(function (m) {
      return "<section id='" + m.id + "'></section>";
    }).join('');
    mods.forEach(function (m) {
      var el = document.getElementById(m.id);
      try {
        el.innerHTML = m.render(D);
        if (m.montar) m.montar(el, D);
      } catch (err) {
        el.innerHTML = "<div class='err'><b>El módulo «" + App.esc(m.nom) + "» no se pudo dibujar.</b><p><code>" +
          App.esc(err && err.message) + '</code></p></div>';
        if (global.console) console.error(m.id, err);
      }
    });
    pintarNav();
    medirCabecera();
    mostrar(location.hash, true);
  }

  // Un módulo puede pedir que se repinte sólo él (lo usa el calendario al cambiar de plan).
  App.refrescar = function (id) {
    var m = MODS[id], el = document.getElementById(id);
    if (!m || !el || !MODELO) return;
    el.innerHTML = m.render(MODELO);
    if (m.montar) m.montar(el, MODELO);
  };

  /* ---------- auto-actualización ----------
     Cada 10 min (y al volver a la pestaña tras 2 min) mira si cambió el JSON de datos o index.html (una versión nueva del código).
     Si cambió, recarga la página; si hay un diálogo abierto o se está imprimiendo, espera al siguiente intento para no perder lo que escribes.
     Sólo con servidor (http/https). Se apaga con la casilla del pie (pref autoActualizar). */
  var AUTO_MS = 10 * 60 * 1000, AUTO_VUELTA_MS = 2 * 60 * 1000, huellas = {}, ultimoAuto = Date.now();
  function huella(url) {
    return fetch(url + (url.indexOf('?') < 0 ? '?' : '&') + '_=' + Date.now(), { method: 'HEAD', cache: 'no-store' }).then(function (r) {
      var h = r.headers.get('etag') || r.headers.get('last-modified') || r.headers.get('content-length');
      if (h) return h;
      return fetch(url, { cache: 'no-store' }).then(function (g) { return g.text(); }).then(function (t) { return t.length + ':' + t.slice(-40); });
    });
  }
  function comprobarActualizacion() {
    ultimoAuto = Date.now();
    if (!App.data.pref('autoActualizar', true) || location.protocol === 'file:') return;
    var urls = [App.data.RUTA, location.pathname.split('/').pop() || 'index.html'];
    Promise.all(urls.map(function (u) { return huella(u).catch(function () { return null; }); })).then(function (hs) {
      var cambio = false;
      hs.forEach(function (h, i) {
        if (h == null) return;
        if (huellas[urls[i]] != null && huellas[urls[i]] !== h) cambio = true;
        huellas[urls[i]] = h;
      });
      if (!cambio) return;
      if (document.querySelector('dialog[open]') || document.body.classList.contains('imprimir-todo')) { huellas = {}; return; }
      location.reload();
    });
  }
  App.comprobarActualizacion = function () { return comprobarActualizacion(); };
  function iniciarAutoActualizacion() {
    if (location.protocol === 'file:') return;
    comprobarActualizacion();
    global.setInterval(comprobarActualizacion, AUTO_MS);
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden && Date.now() - ultimoAuto > AUTO_VUELTA_MS) comprobarActualizacion();
    });
    var pie = $('#pie');
    if (pie) {
      var lab = document.createElement('label'); lab.className = 'autoAct';
      lab.innerHTML = "<input type='checkbox' id='autoAct'> Actualizar sola cada 10 min";
      pie.parentNode.insertBefore(lab, pie.nextSibling);
      var c = lab.querySelector('input'); c.checked = !!App.data.pref('autoActualizar', true);
      c.addEventListener('change', function () { App.data.setPref('autoActualizar', c.checked); if (c.checked) comprobarActualizacion(); });
    }
  }

  /* ---------- arranque ---------- */
  function arrancar() {
    iniciarTema();
    $('#tm').addEventListener('click', function () {
      var t = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      App.data.setPref('tema', t); aplicarTema(t);
    });
    iniciarPerfil();
    iniciarImprimir();
    global.addEventListener('resize', medirCabecera);
    global.addEventListener('hashchange', function () { if (MODELO) mostrar(location.hash); });

    (App.mods || []).forEach(function (m) { MODS[m.id] = m; });

    App.data.cargar().then(function (raw) {
      MODELO = App.metrics.construir(raw);
      global.__MODELO__ = MODELO;              // para inspeccionar desde la consola
      pintar(MODELO);
      var m = MODELO.meta || {};
      $('#pie').innerHTML = 'Datos de ' + App.esc(String(m.generado || '').slice(0, 10) || '2026') +
        ' · ' + MODELO.acts.length + ' actividades · ' +
        (MODELO.acts.length - MODELO.limpias.length) + ' descartadas. ' +
        'Para actualizar: <code>node connector/sync.mjs &amp;&amp; node connector/build.mjs</code>.';
      iniciarAutoActualizacion();
      if (location.hash === '#imprimir') { document.body.classList.add('imprimir-todo'); prepararImpresion(); }
      else if (location.hash) mostrar(location.hash);
    }).catch(function (err) {
      $('#main').innerHTML = "<div class='err'><b>No se pudieron cargar los datos.</b>" +
        '<p>' + App.esc(err && err.message) + '</p>' +
        '<p>Desde una terminal, en la carpeta del proyecto:</p>' +
        '<pre><code>node connector/serve.mjs</code></pre>' +
        '<p>y abre <code>http://localhost:8080</code>. Si todavía no has conectado Strava, ' +
        'empieza por <code>node connector/auth.mjs</code>.</p></div>';
      if (global.console) console.error(err);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar);
  else arrancar();
})(this);
