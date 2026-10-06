/* app.js — arranque: carga los datos, pinta los módulos y gestiona navegación, tema y perfil. */
(function (global) {
  'use strict';
  var App = global.App, $ = App.$, $$ = App.$$;

  var ORDEN = ['resumen', 'ano', 'carga', 'running', 'bici', 'proyeccion', 'calendario', 'suenos', 'recursos'];
  var EN_TABBAR = ['resumen', 'carga', 'proyeccion', 'calendario', 'suenos'];
  var MODELO = null, MODS = {};

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

  /* ---------- navegación ---------- */
  function pintarNav(mods) {
    $('#nav').innerHTML = mods.map(function (m) {
      return "<li><a href='#" + m.id + "'>" + App.esc(m.nom) + '</a></li>';
    }).join('');
    $('#tab').innerHTML = mods.filter(function (m) { return EN_TABBAR.indexOf(m.id) >= 0; }).map(function (m) {
      return "<a href='#" + m.id + "'><svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.7' " +
        "stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='" + m.icono + "'/></svg>" +
        App.esc(m.tab) + '</a>';
    }).join('');
  }

  function vigilarScroll() {
    var secciones = $$('main section[id]');
    if (!('IntersectionObserver' in global) || !secciones.length) return;
    var visibles = {};
    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) { visibles[e.target.id] = e.isIntersecting ? e.intersectionRatio : 0; });
      var mejor = null, max = 0;
      Object.keys(visibles).forEach(function (k) { if (visibles[k] > max) { max = visibles[k]; mejor = k; } });
      if (!mejor) return;
      $$('#tab a, #nav a').forEach(function (a) {
        a.setAttribute('aria-current', a.getAttribute('href') === '#' + mejor ? 'true' : 'false');
      });
    }, { rootMargin: '-25% 0px -55% 0px', threshold: [0, 0.2, 0.5, 1] });
    secciones.forEach(function (s) { io.observe(s); });
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
    pintarNav(mods);
    vigilarScroll();
  }

  // Un módulo puede pedir que se repinte sólo él (lo usa el calendario al cambiar de plan).
  App.refrescar = function (id) {
    var m = MODS[id], el = document.getElementById(id);
    if (!m || !el || !MODELO) return;
    el.innerHTML = m.render(MODELO);
    if (m.montar) m.montar(el, MODELO);
  };

  /* ---------- arranque ---------- */
  function arrancar() {
    iniciarTema();
    $('#tm').addEventListener('click', function () {
      var t = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      App.data.setPref('tema', t); aplicarTema(t);
    });
    iniciarPerfil();

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
      if (location.hash) {
        var dest = document.querySelector(location.hash);
        if (dest) dest.scrollIntoView();
      }
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
