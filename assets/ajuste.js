/* ajuste.js — reglas de vida real sobre los tres planes base (plan.js), aplicadas una sola vez al cargar:
   1. Racha: ningún día sin correr. Mínimo 1 milla (1,6 km) hasta la meta del 6 ene 2027; no hay descanso absoluto de correr.
   2. Extiende cada plan hasta el 13 ene 2027 (regreso de Charlotte), con calidad por la mañana.
   3. Viaje a Charlotte (25 nov – 13 ene): con bici, calidad en el Sugar Creek Greenway por la mañana, un parque de montaña cada sábado, recordatorios.
   4. Natación opcional, una vez por semana. Boxeo (fuerza C) repartido: al menos una vez por semana.
   Además calcula el horario de cada día (Guatemala / Utah / Charlotte, con el fin del horario de verano de EE. UU.). */
(function (global) {
  'use strict';
  var App = global.App, P = App.plan, DT = App.date;

  var RACHA = { inicio: '2026-01-06', meta: '2027-01-06', milla: 1.6 };
  var VIAJE = { ida: '2026-11-25', vuelta: '2027-01-13', aterrizaje: '15:27', regreso: '14:00', llegadaGT: '22:00' };
  var FIN_VERANO = '2026-11-01';          // domingo: EE. UU. vuelve al horario estándar (Guatemala no cambia nunca)
  var FIN_PLAN = '2027-01-13';
  var DESDE_EXTRAS = '2026-10-17';        // natación y boxeo se reparten desde esta fecha en adelante

  var DUROS = { Q: 1, H: 1, S: 1, T: 1, L: 1, C: 1 };
  var RE_FZ = /fuerza ([ABC])/i;

  /* ---------- 1. extensión del 1 dic al 13 ene (plantilla semanal por plan; lun…dom) ---------- */
  var FACTOR = [1, 1.06, 1.12, 0.8, 1.1, 1.16, 0.8];   // 3 semanas de carga y una de descarga (Navidad)
  var PLANTILLA = {
    estructurado: [['R', 'R', 3], ['Q', 'Q AM (calidad por la mañana)', 7], ['E', 'E + fuerza A', 5], ['R', 'R + fuerza B', 3], ['E', 'E', 5], ['E', 'E + 4 rectas', 6], ['L', 'L', 10]],
    intermedio: [['R', 'R', 3], ['H', 'HIIT AM (calidad por la mañana)', 8], ['E', 'E + fuerza A', 5], ['Q', 'Q AM (tempo, por la mañana)', 7], ['R', 'R + fuerza B', 3], ['E', 'E + 4 rectas', 6], ['L', 'L', 12]],
    brutal: [['Q', 'Q AM (calidad por la mañana)', 8], ['E', 'E + fuerza A', 6], ['H', 'HIIT AM (calidad por la mañana)', 9], ['R', 'R + fuerza B', 4], ['S', 'Sprints AM', 6], ['E', 'E + 4 rectas', 7], ['L', 'L', 14]]
  };
  function extender(id, dias) {
    var ult = dias[dias.length - 1].fecha, ini = DT.d('2026-11-30'), plantilla = PLANTILLA[id];
    for (var f = DT.addDays(DT.d(ult), 1); DT.iso(f) <= FIN_PLAN; f = DT.addDays(f, 1)) {
      var k = DT.iso(f), sem = Math.floor((f - ini) / 6048e5);
      var t = plantilla[DT.dowMon0(f)], fac = FACTOR[Math.min(sem, FACTOR.length - 1)];
      var km = Math.max(3, Math.round(t[2] * fac * 2) / 2);
      dias.push({ fecha: k, tipo: t[0], sesion: t[1], km: t[0] === 'R' ? Math.max(2, Math.round(t[2] * fac)) : km, minBici: 0, evento: null });
    }
  }
  function porFecha(dias, f) { for (var i = 0; i < dias.length; i++) if (dias[i].fecha === f) return dias[i]; return null; }

  /* ---------- 3. viaje ---------- */
  // Charlotte tiene bici y buen terreno: el Sugar Creek Greenway (Freedom Park → Pineville) es plano, ideal para velocidad, HIIT e intervalos;
  // cada sábado hay una salida única a un parque de montaña. Calidad por dow (0 = lunes) y plan.
  var GREENWAY = 'Sugar Creek Greenway (Freedom Park → Pineville)';
  var MONTANAS = ['Crowders Mountain State Park', 'U.S. National Whitewater Center (senderos)'];
  var CALIDAD_CLT = {
    estructurado: { 1: ['Q', 'Q AM · tempo en el ' + GREENWAY, 7], 3: ['H', 'HIIT AM · repeticiones en el ' + GREENWAY, 7], 5: ['T', null, 9] },
    intermedio: { 1: ['H', 'HIIT AM · repeticiones en el ' + GREENWAY, 8], 3: ['Q', 'Q AM · tempo en el ' + GREENWAY, 8], 4: ['S', 'Sprints AM · rectas del ' + GREENWAY, 6], 5: ['T', null, 10] },
    brutal: { 0: ['Q', 'Q AM · tempo en el ' + GREENWAY, 9], 2: ['H', 'HIIT AM · repeticiones en el ' + GREENWAY, 9], 4: ['S', 'Sprints AM · rectas del ' + GREENWAY, 7], 5: ['T', null, 12] }
  };
  var BICI_CLT = { estructurado: [4, 50], intermedio: [2, 45], brutal: [1, 60] };   // [dow, minutos]
  function aplicarViaje(id, dias) {
    var semMonte = 0;
    dias.forEach(function (d) {
      if (d.fecha < VIAJE.ida || d.fecha > VIAJE.vuelta) return;
      d.viaje = 'charlotte';
      if (d.evento || d.fecha === VIAJE.ida || d.fecha === VIAJE.vuelta) return;
      var w = DT.dowMon0(DT.d(d.fecha)), fz = RE_FZ.exec(d.sesion || ''), cal = CALIDAD_CLT[id][w], bici = BICI_CLT[id];
      var fzTxt = fz ? ' + fuerza ' + fz[1].toUpperCase() + (/fuerza [ABC] PM/i.test(d.sesion) ? ' PM' : '') : '';
      if (cal) {
        d.tipo = cal[0]; d.km = cal[2]; d.minBici = 0;
        if (cal[0] === 'T') {
          var m = MONTANAS[semMonte++ % MONTANAS.length];
          d.sesion = 'Trail de montaña (salida única de la semana): ' + m; d.lugar = m + '. Sal temprano: el desnivel manda, no el ritmo.';
        } else { d.sesion = cal[1] + fzTxt; d.lugar = GREENWAY + ': tramo plano y sin cruces, el mejor lugar de Charlotte para velocidad. Calienta 2 km, lo duro en el tramo recto y vuelve trotando.'; }
      } else if (w === bici[0] && (d.tipo === 'E' || d.tipo === 'R') && !d.hito) {
        d.minBici = bici[1]; d.sesion = d.tipo + ' + bici Z2 por el ' + GREENWAY + fzTxt;
        d.lugar = 'Bici de Freedom Park a Pineville por el Sugar Creek Greenway (ida y vuelta); ajusta el retorno a los minutos del plan.';
      }
      if (DUROS[d.tipo] && !d.evento) {
        d.recordatorio = d.tipo === 'L'
          ? 'Largo el fin de semana a las 7:00 hora de Charlotte: sin trabajo, sin prisa.'
          : 'Calidad de atletismo por la MAÑANA (6:00–7:15, hora de Charlotte). Por la noche, sólo lo suave.';
      }
    });
    var ida = porFecha(dias, VIAJE.ida), vuelta = porFecha(dias, VIAJE.vuelta);
    if (ida) {
      ida.tipo = 'R'; ida.minBici = 0; ida.km = 3; ida.evento = null; ida.hito = 'vuelo';
      ida.sesion = 'Vuelo a Charlotte (aterrizas 15:27) · trote suave de noche, desde las 18:00';
      ida.recordatorio = 'Mañana en Charlotte empieza la rutina: calidad de atletismo por la MAÑANA (6:00). Hoy sólo el trote de la noche, mínimo la milla.';
    }
    if (vuelta) {
      vuelta.tipo = 'R'; vuelta.minBici = 0; vuelta.km = 3; vuelta.evento = null; vuelta.hito = 'regreso';
      vuelta.sesion = 'R AM 6:00 en Charlotte · vuelo 14:00 · milla de la racha al llegar a Retalhuleu (~22:00)';
      vuelta.recordatorio = 'Si la racha sigue, la milla se corre al llegar (hacia las 22:00 de Guatemala). Si el vuelo se atrasa, corre la milla en la terminal o en el hotel de escala.';
    }
    var pre = porFecha(dias, '2026-11-24');
    if (pre) pre.recordatorio = 'Mañana vuelas a Charlotte. Deja lista la ropa de correr para el día siguiente a las 6:00 y reserva el trote de la noche.';
    var sil = porFecha(dias, FIN_VERANO);
    if (sil) sil.hito = 'hora';
  }

  /* ---------- 2. racha ---------- */
  function aplicarRacha(dias) {
    dias.forEach(function (d) {
      d.racha = d.fecha <= RACHA.meta ? 1 : 2;           // 2 = opcional tras la meta
      if (d.tipo === 'D') {
        d.tipo = 'R'; d.km = RACHA.milla; d.minBici = 0;
        d.sesion = 'Milla de la racha (1,6 km): descanso activo, sin forzar';
      } else if (!(d.km >= RACHA.milla)) {
        d.km = RACHA.milla;
      }
    });
  }

  /* ---------- 4. natación opcional y boxeo ---------- */
  function semanas(dias) {
    var mapa = {}, orden = [];
    dias.forEach(function (d, i) {
      if (d.fecha < DESDE_EXTRAS) return;
      var f = DT.d(d.fecha), lunes = DT.iso(DT.addDays(f, -DT.dowMon0(f)));
      if (!mapa[lunes]) { mapa[lunes] = []; orden.push(lunes); }
      mapa[lunes].push(i);
    });
    return orden.map(function (l) { return mapa[l]; });
  }
  function dow(d) { return DT.dowMon0(DT.d(d.fecha)); }
  function sinFuerza(d) { return !RE_FZ.test(d.sesion || ''); }
  function aplicarExtras(id, dias) {
    semanas(dias).forEach(function (idx) {
      var sem = idx.map(function (i) { return dias[i]; });
      // natación: un día de recuperación (o fácil) a media semana, sin competencia ni vuelo
      var cand = sem.filter(function (d) { return !d.evento && !d.hito && (d.tipo === 'R' || d.tipo === 'E') && d.fecha >= DESDE_EXTRAS; });
      cand.sort(function (a, b) {
        var pa = (a.tipo === 'R' ? 0 : 3) + (sinFuerza(a) ? 0 : 1.5) + Math.abs(dow(a) - 2) * 0.5;
        var pb = (b.tipo === 'R' ? 0 : 3) + (sinFuerza(b) ? 0 : 1.5) + Math.abs(dow(b) - 2) * 0.5;
        return pa - pb;
      });
      var nado = cand[0];
      if (nado) { nado.nat = 30; nado.sesion += ' + natación opcional 30 min'; }
      // boxeo (fuerza C, 20 min): una vez por semana, dos en el camino brutal, lejos de la calidad y de la natación
      var veces = sem.filter(function (d) { return /fuerza C/i.test(d.sesion || ''); }).length, meta = id === 'brutal' ? 2 : 1;
      var libres = sem.filter(function (d) {
        return d !== nado && !d.evento && !d.hito && sinFuerza(d) && (d.tipo === 'E' || d.tipo === 'R' || d.tipo === 'B') && d.fecha >= DESDE_EXTRAS;
      });
      libres.sort(function (a, b) { return Math.abs(dow(a) - 4) - Math.abs(dow(b) - 4); });   // prefiere viernes/jueves…
      var usados = [];
      while (veces < meta && libres.length) {
        var d = libres.shift();
        if (usados.some(function (u) { return Math.abs(dow(u) - dow(d)) < 2; })) continue;
        d.sesion += ' + fuerza C PM'; usados.push(d); veces++;
      }
    });
  }

  /* Prevención (espalda baja y equilibrio): lunes, miércoles y viernes (espalda), jueves y sábado (equilibrio),
     y al terminar cada MTB larga. Nunca en días de vuelo. */
  var DESDE_PREV = '2026-10-19', MTB_LARGAS = { colomba: 1, campana: 1, senderos: 1, xab: 1 };
  function aplicarPrevencion(dias) {
    dias.forEach(function (d) {
      if (d.fecha < DESDE_PREV || d.hito) return;
      var w = dow(d);
      if (d.evento && MTB_LARGAS[d.evento]) d.sesion += ' + prevención lumbar 12 min al terminar';
      else if (!d.evento && (w === 0 || w === 2 || w === 4)) d.sesion += ' + prevención lumbar 12 min';
      else if (!d.evento && (w === 3 || w === 5)) d.sesion += ' + equilibrio 10 min';
    });
  }

  /* Golpe en el pie (20 oct): se pausan la calidad y la fuerza que carga el pie. 21–25 oct: milla lenta o caminata, core sin carga y,
     si no duele, trote corto el fin de semana. 26–28 oct: sólo fácil (la calidad vuelve el 29 si no hay dolor). */
  var LESION = { desde: '2026-10-21', hasta: '2026-10-25', vuelta: '2026-10-28' };
  var LESION_TXT = {
    '2026-10-21': ['Milla de la racha LENTA o caminada (pie golpeado): sin cojear, sin forzar', 'Sin intervalos hoy. Si al apoyar el pie duele o cojeas, camina la milla. Mira las señales de alarma en «Espalda y equilibrio».'],
    '2026-10-22': ['Milla lenta o caminata + core sin cargar el pie 15 min + prevención lumbar 12 min', null],
    '2026-10-23': ['Milla lenta o caminata + natación opcional 30 min (sin empujar la pared con el pie) + prevención lumbar 12 min', null],
    '2026-10-24': ['Prueba del pie: trote suave 2 km si llevas 2 días caminando sin dolor; si no, otra milla lenta + core sin cargar el pie 15 min', 'Si el dolor es mayor a 3/10 o cojeas, para y camina.'],
    '2026-10-25': ['Trote fácil de 3 km sólo si el pie está sin dolor; si no, la milla lenta', 'Si hay hinchazón, moretón grande o dolor al apoyar, no corras y consulta.']
  };
  function aplicarLesion(dias) {
    dias.forEach(function (d) {
      if (d.fecha < LESION.desde || d.hito || d.evento) return;
      if (d.fecha <= LESION.hasta) {
        var t = LESION_TXT[d.fecha];
        d.tipo = 'R'; d.minBici = 0; d.km = d.fecha === '2026-10-24' ? 2 : d.fecha === '2026-10-25' ? 3 : 1.6;
        d.sesion = t[0] + (d.nat && !/natación/.test(t[0]) ? ' + natación opcional ' + d.nat + ' min' : '');
        if (t[1]) d.recordatorio = t[1];
        d.lesion = 1;
      } else if (d.fecha <= LESION.vuelta) {
        d.sesion = d.sesion.replace(/ [+] fuerza [AC]( PM)?/g, '');   // sin zancadas ni boxeo mientras vuelve el pie
        if (d.tipo === 'Q' || d.tipo === 'H' || d.tipo === 'S') { d.tipo = 'E'; d.km = 4; d.minBici = 0; d.sesion = 'Fácil 4 km, sin calidad (reintroducción tras el golpe en el pie)'; d.lesion = 1; }
        else if (d.tipo === 'F' || d.tipo === 'V') { d.tipo = 'B'; d.km = 1.6; d.minBici = 60; d.sesion = 'Bici Z2 suave 60 min, sin esfuerzos de pie (reintroducción) + milla de la racha'; d.lesion = 1; }
      } else if (d.fecha === '2026-10-29') {
        d.recordatorio = 'La calidad vuelve sólo si el pie lleva 2 días sin dolor al caminar y al trotar. Si no, haz el fácil y pospón.';
      }
    });
  }

  Object.keys(P.PLANES).forEach(function (id) {
    var dias = P.PLANES[id].dias;
    extender(id, dias);
    aplicarViaje(id, dias);
    aplicarRacha(dias);
    aplicarExtras(id, dias);
    aplicarPrevencion(dias);
    aplicarLesion(dias);
  });

  /* ---------- horario del día (hora local de donde estás) ---------- */
  function fase(f) {
    if (f >= VIAJE.ida && f <= VIAJE.vuelta) return 'charlotte';
    return f < FIN_VERANO ? 'verano' : 'invierno';
  }
  // Bloques en horas decimales. tipo: sueno | sesion | trabajo | noche | viaje | libre
  function horarioDe(f, d) {
    var fs = fase(f), finde = dow({ fecha: f }) >= 5, bl = [], notas = [], zona, titulo, despertar;
    if (fs === 'charlotte') {
      zona = 'Charlotte (hora del este, EST)';
      if (f === VIAJE.ida) {
        titulo = 'Día de vuelo'; despertar = null;
        bl.push({ h0: 15, h1: 15.45, t: 'viaje', txt: 'Aterrizas a las 15:27' }, { h0: 18, h1: 19, t: 'noche', txt: 'Trote suave de noche (mínimo la milla)' });
        notas.push('Trabajo de Utah según tu itinerario ese día; al llegar, el horario normal de Charlotte empieza mañana.');
      } else if (f === VIAJE.vuelta) {
        titulo = 'Día de regreso'; despertar = '5:15';
        bl.push({ h0: 6, h1: 7.25, t: 'sesion', txt: 'Trote 3 km antes del vuelo' }, { h0: 14, h1: 15, t: 'viaje', txt: 'Vuelo 14:00' }, { h0: 23, h1: 23.5, t: 'noche', txt: 'Milla de la racha en Retalhuleu (22:00 GT)' });
        notas.push('A las 23:00 de Charlotte son las 22:00 en Guatemala: ahí corres la milla de la racha.');
      } else if (finde) {
        titulo = 'Fin de semana en Charlotte'; despertar = '6:30';
        bl.push({ h0: 7, h1: 9, t: 'sesion', txt: DUROS[d && d.tipo] ? 'Largo o sesión principal' : 'Sesión del día' }, { h0: 18, h1: 20, t: 'noche', txt: 'Pesas, boxeo, natación o la milla si falta' });
      } else {
        titulo = 'Día laboral en Charlotte'; despertar = '5:15';
        bl.push({ h0: 6, h1: 7.25, t: 'sesion', txt: 'Atletismo (calidad por la mañana)' }, { h0: 7.25, h1: 8.5, t: 'sesion', txt: 'Segunda sesión: fuerza, natación opcional o bici (Sugar Creek Greenway)' },
          { h0: 9, h1: 18, t: 'trabajo', txt: 'Trabajo de Utah (7:00–16:00 allá)' }, { h0: 18, h1: 20, t: 'noche', txt: 'Rutina de noche: lo pendiente y la milla de la racha' });
        notas.push('Tu reloj de Guatemala va una hora atrás: las 5:15 de Charlotte son las 4:15 de tu cuerpo. Acuéstate antes de las 21:30.');
      }
      notas.push('Utah (MST) va 2 h detrás de Charlotte: 7:00–16:00 allá = 9:00–18:00 aquí. Ambos cambiaron al horario estándar el 1 de noviembre.');
    } else if (fs === 'verano') {
      zona = 'Guatemala (UTC−6; Utah va en horario de verano, MDT, a la misma hora)';
      if (finde) { titulo = 'Fin de semana'; despertar = '5:00'; bl.push({ h0: 5.5, h1: 8.5, t: 'sesion', txt: DUROS[d && d.tipo] ? 'Largo o sesión principal' : 'Sesión del día' }, { h0: 18, h1: 20, t: 'noche', txt: 'Lo pendiente o pesas' }); }
      else {
        titulo = 'Día laboral · horario de verano de Utah'; despertar = '5:00';
        bl.push({ h0: 5.5, h1: 6.75, t: 'sesion', txt: 'Sesión de la mañana (máx. 75 min)' }, { h0: 7, h1: 16, t: 'trabajo', txt: 'Trabajo de Utah (7:00–16:00, igual que Guatemala)' }, { h0: 18, h1: 20, t: 'noche', txt: 'Pesas o lo pendiente' });
        notas.push('El domingo 1 de noviembre termina el horario de verano de EE. UU.: desde entonces tu jornada va una hora más tarde y ganas una hora de mañana.');
      }
    } else {
      zona = 'Guatemala (UTC−6; Utah en horario estándar, MST, una hora detrás)';
      if (finde) { titulo = 'Fin de semana'; despertar = '5:00'; bl.push({ h0: 5.5, h1: 8.5, t: 'sesion', txt: DUROS[d && d.tipo] ? 'Largo o sesión principal' : 'Sesión del día' }, { h0: 18, h1: 20, t: 'noche', txt: 'Lo pendiente o pesas' }); }
      else {
        titulo = 'Día laboral · horario estándar de Utah'; despertar = '5:00';
        bl.push({ h0: 5.5, h1: 7.5, t: 'sesion', txt: 'Sesión de la mañana (hasta 2 h, entra la doble si toca)' }, { h0: 8, h1: 17, t: 'trabajo', txt: 'Trabajo de Utah (7:00–16:00 allá = 8:00–17:00 aquí)' }, { h0: 18, h1: 20, t: 'noche', txt: 'Pesas, boxeo o lo pendiente' });
      }
    }
    return { fase: fs, zona: zona, titulo: titulo, despertar: despertar, bloques: bl, notas: notas };
  }

  /* ---------- racha: número de día ---------- */
  function diaRacha(f) { return Math.round((DT.d(f) - DT.d(RACHA.inicio)) / 864e5) + 1; }

  P.RACHA = RACHA; P.VIAJE = VIAJE; P.horarioDe = horarioDe; P.diaRacha = diaRacha; P.FIN_VERANO = FIN_VERANO; P.FIN_PLAN = FIN_PLAN;
})(this);
