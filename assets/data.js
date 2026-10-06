/* data.js — carga ano2026_datos.min.json. Con fetch si hay servidor, con datos.js si se abre desde el disco. */
(function (global) {
  'use strict';
  var App = global.App || (global.App = {});

  var RUTA = 'ano2026_datos.min.json';

  function cargar() {
    // Si datos.js ya dejó el JSON incrustado (modo file://), se usa tal cual.
    if (global.__DATOS__) return Promise.resolve(global.__DATOS__);
    if (location.protocol === 'file:') {
      return Promise.reject(new Error(
        'Abriste la página desde el disco y el navegador no deja leer el JSON así. ' +
        'Ejecuta "node connector/serve.mjs" y entra a http://localhost:8080, ' +
        'o genera datos.js con "node connector/build.mjs".'));
    }
    return fetch(RUTA, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error('No se pudo leer ' + RUTA + ' (HTTP ' + r.status + ')');
      return r.json();
    });
  }

  /* ---------- preferencias locales (perfil + ediciones del calendario) ---------- */
  var CLAVE = 'strava-analyzer/v1';
  function leerPrefs() {
    try { return JSON.parse(localStorage.getItem(CLAVE) || '{}'); } catch (e) { return {}; }
  }
  function guardarPrefs(p) {
    try { localStorage.setItem(CLAVE, JSON.stringify(p)); return true; } catch (e) { return false; }
  }
  function pref(k, def) {
    var p = leerPrefs();
    return p[k] === undefined ? def : p[k];
  }
  function setPref(k, v) {
    var p = leerPrefs(); p[k] = v; return guardarPrefs(p);
  }

  App.data = { cargar: cargar, RUTA: RUTA, pref: pref, setPref: setPref, leerPrefs: leerPrefs, guardarPrefs: guardarPrefs };
})(this);
