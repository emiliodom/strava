/* zonas.js — Módulo 17: Guatemala, Charlotte y West Jordan (Utah). Relojes en vivo, convertidor de horas, etapas del viaje con su
   horario de trabajo y de entrenamiento, y la tabla hora por hora de cualquier fecha. Las diferencias salen de ajuste.js
   (P.desfase/P.convertir con Intl), así que el cambio de horario de EE. UU. del 14 mar 2027 ya está contemplado. */
(function (global) {
  'use strict';
  var App = global.App, U = App.ui, esc = App.esc, P = App.plan;
  var ORDEN = ['gt', 'clt', 'ut'], RELOJ = null;
  var MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  function hoyISO() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function hh(h) { var dia = h >= 24 ? ' (+1)' : h < 0 ? ' (−1)' : ''; h = (h + 24) % 24; var m = Math.round((h % 1) * 60); return Math.floor(h) + ':' + (m < 10 ? '0' : '') + m + dia; }
  function fecha(f) { var p = f.split('-'); return +p[2] + ' ' + MES[+p[1] - 1]; }
  function utc(z, f) { var m = P.desfase(P.ZONAS[z].tz, f) / 60; return 'UTC' + (m < 0 ? '−' : '+') + Math.abs(m); }
  function difGT(z, f) {
    var d = (P.desfase(P.ZONAS[z].tz, f) - P.desfase(P.ZONAS.gt.tz, f)) / 60;
    return d === 0 ? 'misma hora que Guatemala' : Math.abs(d) + ' h ' + (d > 0 ? 'por delante' : 'por detrás') + ' de Guatemala';
  }
  function ahoraEn(z) {
    return new Date().toLocaleTimeString('es-GT', { timeZone: P.ZONAS[z].tz, hour: 'numeric', minute: '2-digit', hour12: false });
  }
  function diaEn(z) {
    return new Date().toLocaleDateString('es-GT', { timeZone: P.ZONAS[z].tz, weekday: 'long', day: 'numeric', month: 'short' });
  }

  // Etapas: dónde estás, qué zona manda y en qué ventanas entrenas (hora local de la etapa).
  function etapas() {
    var V = P.VIAJE, ut = P.UTAH;
    return [
      { de: '2026-11-07', a: '2026-11-24', z: 'gt', nom: 'Retalhuleu', ent: 'Mañana 5:30–8:30 (sesión principal) · noche 18:30–20:00 (trote de la racha y pesas)' },
      { de: V.ida, a: V.ida, z: 'clt', nom: 'Vuelo a Charlotte', ent: 'Aterrizas hacia las 15:30; la milla mínima o 5 km desde las 18:00' },
      { de: '2026-11-26', a: '2027-01-12', z: 'clt', nom: 'Charlotte', ent: 'Mañana 6:00–7:15 (atletismo) y 7:30–9:30 (bici o peso corporal) · noche 19:30 lo pendiente' },
      { de: ut.fechas[0], a: ut.fechas[1], z: 'ut', nom: 'West Jordan, Utah' + (ut.confirmado ? '' : ' (tentativo)'), ent: 'Sólo la milla mínima los dos días' },
      { de: V.vuelta, a: V.vuelta, z: 'clt', nom: 'Regreso a Retalhuleu', ent: 'Vuelo 14:00 de Charlotte; la milla por la noche en Guatemala (o caminata en el aeropuerto)' },
      { de: '2027-01-14', a: null, z: 'gt', nom: 'Retalhuleu, con colegio', ent: 'Correr 5:00–6:00 · respaldo 7:00–9:00 · bici de ruta o MTB 18:30–20:00' }
    ];
  }

  function tablaEtapas() {
    var filas = etapas().map(function (e) {
      var f = e.de, w0 = P.convertir(P.TRABAJO_UT[0], 'ut', e.z, f), w1 = P.convertir(P.TRABAJO_UT[1], 'ut', e.z, f);
      return ['<b>' + esc(e.nom) + '</b><br><small>' + fecha(e.de) + (e.a === e.de ? '' : e.a ? '–' + fecha(e.a) : ' en adelante') + '</small>',
        esc(P.ZONAS[e.z].nom) + '<br><small>' + utc(e.z, f) + (e.z === 'gt' ? '' : ' · ' + difGT(e.z, f)) + '</small>',
        hh(w0) + '–' + hh(w1),
        "<div class='wrap'><small>" + esc(e.ent) + '</small></div>'];
    });
    return U.tabla([{ t: 'Etapa' }, { t: 'Hora local' }, { t: 'Trabajo (hora local)' }, { t: 'Entrenamiento' }], filas,
      { pie: 'El trabajo es siempre de 8:00 a 17:00 de Utah. Guatemala no cambia de hora; EE. UU. volvió al horario estándar el 1 nov 2026 y vuelve al de verano el 14 mar 2027 (entonces Charlotte queda 2 h por delante de Guatemala y Utah a la misma hora).' });
  }

  function tablaHoras(f) {
    var base = P.faseDe ? P.faseDe(f) : 'invierno', zl = base === 'charlotte' ? 'clt' : base === 'utah' ? 'ut' : 'gt';
    var w0 = P.convertir(P.TRABAJO_UT[0], 'ut', zl, f), w1 = P.convertir(P.TRABAJO_UT[1], 'ut', zl, f);
    var filas = [];
    for (var h = 4; h <= 22; h++) {
      var trabajo = h >= w0 && h < w1;
      filas.push(ORDEN.map(function (z) {
        var t = hh(P.convertir(h, zl, z, f));
        return z === zl ? '<b>' + t + '</b>' + (trabajo ? ' <small>· trabajo</small>' : '') : t;
      }));
    }
    return '<p><small>Estás en <b>' + esc(P.ZONAS[zl].nom) + '</b> ese día (columna en negrita).</small></p>' +
      U.tabla(ORDEN.map(function (z) { return { t: P.ZONAS[z].nom + ' (' + utc(z, f) + ')' }; }), filas);
  }

  function relojes() {
    return U.kpis(ORDEN.map(function (z) {
      return U.kpi(P.ZONAS[z].nom, "<span data-reloj='" + z + "'>" + esc(ahoraEn(z)) + '</span>',
        "<span data-dia='" + z + "'>" + esc(diaEn(z)) + '</span> · ' + esc(utc(z, hoyISO())));
    }).concat([U.kpi('Trabajo hoy', hh(P.convertir(8, 'ut', 'gt', hoyISO())) + '–' + hh(P.convertir(17, 'ut', 'gt', hoyISO())), 'hora de Guatemala · ' +
      hh(P.convertir(8, 'ut', 'clt', hoyISO())) + '–' + hh(P.convertir(17, 'ut', 'clt', hoyISO())) + ' en Charlotte')]));
  }

  function opciones(sel) {
    return ORDEN.map(function (z) { return "<option value='" + z + "'" + (z === sel ? ' selected' : '') + '>' + esc(P.ZONAS[z].nom) + '</option>'; }).join('');
  }

  function render() {
    if (!P || !P.ZONAS) return '';
    var hoy = hoyISO();
    return U.modhead('17', 'Guatemala, Charlotte y Utah', 'Tres relojes en tu vida hasta enero: vives en Guatemala o en Charlotte y trabajas con la hora de West Jordan. Aquí ves la hora de los tres, conviertes cualquier hora y sabes qué ventana de entrenamiento te queda en cada etapa.') +
      relojes() +
      '<h3>Convertir una hora</h3>' +
      "<div class='grid zn-conv'>" +
      "<label>Fecha<input type='date' id='znF' value='" + hoy + "'></label>" +
      "<label>Hora<input type='time' id='znH' value='05:00'></label>" +
      "<label>En<select id='znZ'>" + opciones(P.faseDe && P.faseDe(hoy) === 'charlotte' ? 'clt' : 'gt') + '</select></label></div>' +
      "<p id='znR' aria-live='polite'></p>" +
      "<h3>Etapas del viaje</h3><div class='t'>" + tablaEtapas() + '</div>' +
      U.acc('Hora por hora de un día', "<div id='znT' class='t'>" + tablaHoras(hoy) + '</div><small>Cambia la fecha del convertidor para ver otro día.</small>') +
      U.note('Para no equivocarte', '<b>Charlotte = Guatemala + 1 h</b> y <b>Utah = Guatemala − 1 h</b> hasta el 13 de marzo. Strava guarda cada actividad con la hora local de donde la hiciste, así que en Charlotte tus salidas de las 6:00 aparecen a las 6:00, no a las 5:00. La racha cuenta por fecha local: si un vuelo te cambia de día, corre la milla con la fecha del lugar donde estás.');
  }

  function convertirForm(el) {
    var f = el.querySelector('#znF').value || hoyISO(), t = (el.querySelector('#znH').value || '05:00').split(':'), z = el.querySelector('#znZ').value;
    var h = +t[0] + (+t[1] || 0) / 60;
    el.querySelector('#znR').innerHTML = ORDEN.map(function (a) {
      return (a === z ? '<b>' : '') + esc(P.ZONAS[a].nom) + ': ' + hh(P.convertir(h, z, a, f)) + (a === z ? '</b>' : '');
    }).join(' · ');
    el.querySelector('#znT').innerHTML = tablaHoras(f);
  }

  function montar(el) {
    if (!P || !P.ZONAS) return;
    ['#znF', '#znH', '#znZ'].forEach(function (s) { el.querySelector(s).addEventListener('input', function () { convertirForm(el); }); });
    convertirForm(el);
    if (RELOJ) clearInterval(RELOJ);
    RELOJ = setInterval(function () {
      ORDEN.forEach(function (z) {
        var r = el.querySelector("[data-reloj='" + z + "']"), d = el.querySelector("[data-dia='" + z + "']");
        if (r) r.textContent = ahoraEn(z);
        if (d) d.textContent = diaEn(z);
      });
    }, 30000);
  }

  App.mods.push({ id: 'zonas', nom: 'Zonas horarias', tab: 'Horarios', icono: 'M12 3a9 9 0 100 18 9 9 0 000-18zM12 7v5l3 2', render: render, montar: montar });
})(this);
