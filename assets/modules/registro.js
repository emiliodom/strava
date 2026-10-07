/* registro.js — Módulo 8: registro de comidas (foto + descripción). Sólo registra; la evaluación semanal con IA se hace en local.
   Habla con registro/api.php (PHP) usando un token que queda en este navegador. */
(function (global) {
  'use strict';
  var App = global.App, U = App.ui, esc = App.esc;
  var API = 'registro/api.php', K_TOK = 'registroToken';
  var COMIDAS = ['desayuno', 'almuerzo', 'cena', 'merienda', 'antes-entreno', 'despues-entreno', 'bebida'];
  var estado = { entradas: null, error: null, fotos: {} };

  // Miniatura servida por el CDN de Cloudinary (ajusta formato/calidad/tamaño en la propia URL).
  function miniatura(url) { return url.indexOf('/image/upload/') < 0 ? url : url.replace('/image/upload/', '/image/upload/f_auto,q_auto,c_limit,w_1024/'); }
  function token() { try { return localStorage.getItem(K_TOK) || ''; } catch (e) { return ''; } }
  function guardarToken(t) { try { localStorage.setItem(K_TOK, t); } catch (e) { /* sin almacenamiento */ } }
  function hoyISO() { var d = new Date(), m = d.getMonth() + 1, dd = d.getDate(); return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (dd < 10 ? '0' : '') + dd; }
  function horaAhora() { var d = new Date(); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }

  function pedir(accion, opt) {
    opt = opt || {};
    opt.headers = Object.assign({ 'X-Token': token() }, opt.headers || {});
    return fetch(API + '?accion=' + accion + (opt.q || ''), opt).then(function (r) {
      var tipo = r.headers.get('content-type') || '';
      if (tipo.indexOf('json') < 0 && accion !== 'foto') throw new Error('El servidor no ejecuta PHP aquí (¿estás en local o en hosting estático?).');
      if (accion === 'foto') { if (!r.ok) throw new Error('foto'); return r.blob(); }
      return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || 'Error ' + r.status); return j; });
    });
  }

  function reducir(archivo) {
    return new Promise(function (ok, mal) {
      var img = new Image(), url = URL.createObjectURL(archivo);
      img.onload = function () {
        var k = Math.min(1, 1280 / Math.max(img.width, img.height)), c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(function (b) { b ? ok(b) : mal(new Error('No se pudo procesar la foto')); }, 'image/jpeg', 0.82);
      };
      img.onerror = function () { mal(new Error('Foto no legible')); };
      img.src = url;
    });
  }

  // Color del chip según el tipo de comida, para leer el día de un vistazo.
  var MEAL_CLS = { desayuno: 'info', almuerzo: 'ok', cena: 'warn', merienda: 'mut', 'antes-entreno': 'info', 'despues-entreno': 'ok', bebida: 'mut' };

  function tarjeta(e) {
    var img = e.foto
      ? "<img class='reg-foto' " + (e.url ? "src='" + esc(miniatura(e.url)) + "' data-full='" + esc(e.url) + "' loading='lazy'" : "data-foto='" + esc(e.id) + "'") + " alt='" + esc(e.desc || e.comida) + "'>"
      : '';
    return "<article class='reg-card'>" +
      "<div class='reg-head'>" + U.chip(e.comida, MEAL_CLS[e.comida] || 'mut') + "<small>" + esc(e.hora) + "</small></div>" +
      img +
      (e.desc ? "<p class='reg-desc'>" + esc(e.desc) + "</p>" : '') +
      "<a href='#' data-borrar='" + esc(e.id) + "'><small>borrar</small></a></article>";
  }

  function lista(entradas) {
    if (!entradas.length) return U.note('Sin registros', 'Todavía no hay comidas. Sube la primera con el formulario de arriba.', 'mut');
    var porDia = {};
    entradas.forEach(function (e) { (porDia[e.fecha] = porDia[e.fecha] || []).push(e); });
    return Object.keys(porDia).sort().reverse().slice(0, 14).map(function (f, i) {
      var es = porDia[f].slice().sort(function (a, b) { return a.hora < b.hora ? 1 : -1; });   // más reciente arriba
      var dow = App.fmt.DOW[App.date.dowMon0(App.date.d(f))] || '';
      var titulo = dow + ' · ' + App.fmt.fechaLarga(f) + ' · ' + es.length + (es.length === 1 ? ' registro' : ' registros');
      return U.acc(titulo, "<div class='cols reg-grid'>" + es.map(tarjeta).join('') + '</div>', i === 0);   // el día más reciente, abierto
    }).join('');
  }

  function render() {
    var cab = U.modhead('8', 'Registro de comidas', 'Foto y una línea de lo que comes. Aquí sólo se registra; cada semana lo descargas y la IA lo evalúa en tu equipo.');
    if (!token()) {
      return cab + U.note('Primero la llave', 'Pon el token que definiste en <code>registro/config.php</code> del servidor. Se queda sólo en este navegador.', 'warn') +
        "<form id='regTok'><input name='t' type='password' placeholder='token' autocomplete='off' required><button>Guardar</button></form>";
    }
    var opts = COMIDAS.map(function (c) { return '<option>' + esc(c) + '</option>'; }).join('');
    return cab +
      "<form id='regForm'>" +
      "<input name='foto' type='file' accept='image/*' capture='environment'>" +
      "<textarea name='desc' rows='2' maxlength='500' placeholder='¿Qué es y cuánto? (2 tortillas, 1 huevo, frijol…)'></textarea>" +
      "<div class='grid'><select name='comida'>" + opts + "</select><input name='fecha' type='date' value='" + hoyISO() + "'><input name='hora' type='time' value='" + horaAhora() + "'></div>" +
      "<button>Registrar</button> <small id='regMsg'></small></form>" +
      '<div id="regLista">' + (estado.error ? U.note('No se pudo cargar', esc(estado.error), 'bad') : estado.entradas ? lista(estado.entradas) : '<p aria-busy="true">Cargando…</p>') + '</div>' +
      "<p><small><a href='#' id='regSalir'>Cambiar token</a></small></p>" +
      "<dialog id='regModal' class='reg-modal'><img alt='Foto de la comida'></dialog>";
  }

  function cargarFotos(el) {
    Array.prototype.forEach.call(el.querySelectorAll('img[data-foto]'), function (img) {
      var id = img.getAttribute('data-foto');
      if (estado.fotos[id]) { img.src = estado.fotos[id]; return; }
      pedir('foto', { q: '&id=' + id }).then(function (b) { img.src = estado.fotos[id] = URL.createObjectURL(b); }).catch(function () { /* se queda el hueco */ });
    });
  }

  function recargar(el) {
    pedir('lista').then(function (j) { estado.entradas = j.entradas; estado.error = null; })
      .catch(function (e) { estado.error = e.message; })
      .then(function () { var c = el.querySelector('#regLista'); if (c) { c.innerHTML = estado.error ? U.note('No se pudo cargar', esc(estado.error), 'bad') : lista(estado.entradas); cargarFotos(el); } });
  }

  function montar(el) {
    var ft = el.querySelector('#regTok');
    if (ft) { ft.addEventListener('submit', function (ev) { ev.preventDefault(); guardarToken(ft.t.value.trim()); App.refrescar('registro'); }); return; }
    el.querySelector('#regSalir').addEventListener('click', function (ev) { ev.preventDefault(); guardarToken(''); estado.entradas = null; App.refrescar('registro'); });
    var f = el.querySelector('#regForm'), msg = el.querySelector('#regMsg');
    f.addEventListener('submit', function (ev) {
      ev.preventDefault(); msg.textContent = 'Subiendo…';
      var fd = new FormData(), arch = f.foto.files[0];
      ['desc', 'comida', 'fecha', 'hora'].forEach(function (k) { fd.append(k, f[k].value); });
      (arch ? reducir(arch).then(function (b) { fd.append('foto', b, 'comida.jpg'); }) : Promise.resolve())
        .then(function () { return pedir('subir', { method: 'POST', body: fd }); })
        .then(function () { f.reset(); f.fecha.value = hoyISO(); f.hora.value = horaAhora(); msg.textContent = 'Registrado ✓'; recargar(el); })
        .catch(function (e) { msg.textContent = e.message; });
    });
    var modal = el.querySelector('#regModal'), modalImg = modal.querySelector('img');
    modal.addEventListener('click', function () { modal.close(); });
    modal.addEventListener('close', function () { modalImg.removeAttribute('src'); });
    el.addEventListener('click', function (ev) {
      if (!ev.target.closest) return;
      var im = ev.target.closest('img.reg-foto');
      if (im) { var full = im.getAttribute('data-full') || im.getAttribute('src'); if (full) { modalImg.src = full; modal.showModal(); } return; }
      var a = ev.target.closest('[data-borrar]');
      if (!a) return;
      ev.preventDefault();
      if (!confirm('¿Borrar esta comida?')) return;
      var fd = new FormData(); fd.append('id', a.getAttribute('data-borrar'));
      pedir('borrar', { method: 'POST', body: fd }).then(function () { recargar(el); }).catch(function (e) { msg.textContent = e.message; });
    });
    recargar(el);
  }

  App.mods.push({ id: 'registro', nom: 'Registro', tab: 'Registro', icono: 'M4 7h3l2-3h6l2 3h3v13H4zM12 17a4 4 0 100-8 4 4 0 000 8z', render: render, montar: montar });
})(this);
