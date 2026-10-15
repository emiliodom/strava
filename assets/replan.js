/* replan.js — reorganiza el calendario cuando no se hizo una sesión. Algoritmo de reglas, sin IA.
   Entrada: la lista de días del plan, las fechas «no la hice» y la fecha de hoy.
   Salida: { dias, cambios } con los días ya reajustados y una bitácora legible.

   Reglas (en orden):
   1. Una competencia no se recupera. Un descanso tampoco hay qué recuperar.
   2. Si ya hay algo hecho en Strava ese día, sólo se reprograma lo que falta (plan − real).
   3. Sesión DURA (Q, H, S, T, F, V, M, L): se muda entera al primer día de los próximos 4 que sea suave (E/R/D) y que
      no deje dos días duros seguidos, ni caiga a ≤2 días de una competencia A/B (≤1 de cualquier otra).
      Si no hay hueco seguro, se baja a volumen fácil (70 %).
   4. Volumen fácil (km de carrera, minutos de bici) se reparte en los próximos 4 días con tope de +25 % por día
      (máx. +2 km y +20 min). Lo que no cabe se descarta: no se «cobra» el atraso de golpe.
   5. Fuerza: pasa al primer día suave de los próximos 4 que no tenga ya fuerza.
   Un día ya reprogramado no vuelve a recibir una sesión dura. */
(function (global) {
  'use strict';
  var App = global.App || (global.App = {});

  var DUROS = { Q: 1, H: 1, S: 1, T: 1, F: 1, V: 1, M: 1, L: 1 };
  var SUAVES = { E: 1, R: 1, D: 1 };
  var VENTANA = 4;
  var DOW = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
  var RE_FUERZA = /fuerza ([ABC])/i;

  function iso(d) {
    var m = d.getMonth() + 1, dd = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (dd < 10 ? '0' : '') + dd;
  }
  function corta(f) { var d = new Date(f + 'T12:00:00'); return DOW[d.getDay()] + ' ' + d.getDate(); }
  function r05(x) { return Math.round(x * 2) / 2; }
  function r5(x) { return Math.round(x / 5) * 5; }

  function reorganizar(lista, saltos, hoy) {
    var EVT = {}; ((App.plan && App.plan.EVENTOS) || []).forEach(function (e) { EVT[e.id] = e; });
    hoy = hoy || iso(new Date());
    var L = lista.map(function (d) { return Object.assign({}, d); });
    var cambios = [];
    function nota(fecha, nivel, texto) { cambios.push({ fecha: fecha, nivel: nivel, texto: texto }); }

    function duro(d) { return !!d && (DUROS[d.tipo] || d.tipo === 'C' || !!d.evento); }
    function protegido(j) {   // demasiado cerca de una competencia como para cargar más
      for (var k = 1; k <= 2; k++) {
        var e = L[j + k];
        if (e && e.evento) {
          var ev = EVT[e.evento];
          if (k === 1 || (ev && (ev.prioridad === 'A' || ev.prioridad === 'B'))) return true;
        }
      }
      return false;
    }
    function ventana(i) {     // candidatos: los próximos días, siempre después de hoy
      var out = [];
      for (var j = i + 1; j < L.length && j <= i + VENTANA; j++) {
        if (L[j].fecha > hoy && !L[j].evento) out.push(j);
      }
      return out;
    }

    function moverDura(i, kmPlan, biciPlan, sesion, tipo, fecha) {
      var cand = ventana(i).filter(function (j) {
        var t = L[j];
        return SUAVES[t.tipo] && !t.movido && !protegido(j) && !duro(L[j - 1]) && !duro(L[j + 1]);
      });
      if (!cand.length) return false;
      var j = cand[0], t = L[j];
      var fzDestino = RE_FUERZA.exec(t.sesion || ''), fzOrigen = RE_FUERZA.test(sesion || '');
      t.tipoOriginal = t.tipo; t.sesionOriginal = t.sesion;
      t.tipo = tipo; t.km = kmPlan; t.minBici = biciPlan; t.movido = true;
      t.sesion = sesion + ' · reprogramada del ' + corta(fecha) + (!fzOrigen && fzDestino ? ' + fuerza ' + fzDestino[1].toUpperCase() : '');
      nota(t.fecha, 'ok', 'Pasa aquí la sesión dura del ' + corta(fecha) + ' (' + sesion + '). El plan que tenías este día (' + t.sesionOriginal + ') se sustituye.');
      return true;
    }

    function repartir(i, km, bici, fecha) {
      var restoKm = km, restoBici = bici;
      ventana(i).forEach(function (j) {
        var t = L[j];
        if (protegido(j) || duro(t) || t.movido) return;
        if (restoKm >= 1 && (t.tipo === 'E' || t.tipo === 'R' || t.tipo === 'B')) {
          var topeKm = Math.min(2, Math.max(1, r05(t.km * 0.25)));
          var addKm = Math.min(restoKm, topeKm);
          t.km = r05(t.km + addKm); restoKm -= addKm;
          t.sesion += ' (+' + addKm + ' km del ' + corta(fecha) + ')';
          nota(t.fecha, 'ok', '+' + addKm + ' km fáciles del ' + corta(fecha) + '.');
        }
        if (restoBici >= 20 && t.minBici >= 20) {
          var addB = Math.min(restoBici, Math.min(20, Math.max(5, r5(t.minBici * 0.25))));
          t.minBici += addB; restoBici -= addB;
          t.sesion += ' (+' + addB + ' min bici del ' + corta(fecha) + ')';
          nota(t.fecha, 'ok', '+' + addB + ' min de bici del ' + corta(fecha) + '.');
        }
      });
      if (restoKm >= 1) nota(fecha, 'warn', 'No se recuperan ' + r05(restoKm) + ' km: no caben sin pasar el tope de +25 % por día.');
      if (restoBici >= 20) nota(fecha, 'warn', 'No se recuperan ' + restoBici + ' min de bici: no caben sin pasar el tope por día.');
    }

    function moverFuerza(i, letra, fecha) {
      var cand = ventana(i).filter(function (j) {
        var t = L[j];
        return (SUAVES[t.tipo] || t.tipo === 'B') && !RE_FUERZA.test(t.sesion || '') && !protegido(j) && !t.movido;
      });
      if (!cand.length) { nota(fecha, 'warn', 'La fuerza ' + letra + ' no tiene un día seguro en los próximos ' + VENTANA + ' días: se descarta.'); return; }
      var t = L[cand[0]];
      t.sesion += ' + fuerza ' + letra;
      nota(t.fecha, 'ok', 'Pasa aquí la fuerza ' + letra + ' del ' + corta(fecha) + '.');
    }

    Object.keys(saltos || {}).sort().forEach(function (f) {
      var i = -1;
      L.forEach(function (d, k) { if (d.fecha === f) i = k; });
      if (i < 0) return;
      var d = L[i], real = d.real || {};
      var kmPlan = d.km || 0, biciPlan = d.minBici || 0, sesion = d.sesion || '', tipo = d.tipo;
      d.saltado = true;

      if (d.evento) { nota(f, 'warn', 'Una competencia no se reprograma: queda como no realizada.'); return; }
      if (tipo === 'D') { nota(f, 'ok', 'Era un día de descanso: no hay nada que reorganizar.'); d.saltado = false; return; }

      var kmHecho = real.km || 0, biciHecha = real.minBici || 0;
      var hecho = kmHecho >= 1 || biciHecha >= 20;
      var kmFalta = Math.max(0, kmPlan - kmHecho), biciFalta = Math.max(0, biciPlan - biciHecha);
      var fz = RE_FUERZA.exec(sesion);

      nota(f, 'warn', 'No hecha: ' + sesion + (hecho ? ' (parcial: sólo se reprograma lo que faltó).' : '.'));
      d.sesionOriginal = sesion; d.tipoOriginal = tipo;
      if (hecho) {
        d.km = kmHecho; d.minBici = biciHecha;
        d.sesion = sesion.replace(/\s*\+\s*fuerza [ABC](\s*PM)?/i, '') + ' (parcial)';
      } else {
        d.tipo = 'D'; d.km = 0; d.minBici = 0; d.sesion = 'Saltada: ' + sesion;
      }

      var seMovio = false;
      if (DUROS[tipo] && !hecho && (kmPlan >= 3 || biciPlan >= 30)) {
        seMovio = moverDura(i, kmPlan, biciPlan, sesion, tipo, f);
        if (!seMovio) {
          nota(f, 'warn', 'No hay un hueco seguro para una sesión dura (dos días duros seguidos o competencia cerca): se baja a volumen fácil al 70 %.');
          repartir(i, r05(kmFalta * 0.7), r5(biciFalta * 0.7), f);
        }
      } else if (kmFalta >= 1 || biciFalta >= 20) {
        repartir(i, kmFalta, biciFalta, f);
      }
      if (fz && !seMovio) moverFuerza(i, fz[1].toUpperCase(), f);
    });

    return { dias: L, cambios: cambios };
  }

  App.replan = { reorganizar: reorganizar };
})(this);

