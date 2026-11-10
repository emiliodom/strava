/* candelaria.js — Módulo 18: la ruta de Candelaria (≈24 km, ≈500 m D+) en dos años. Cada pasada se clasifica por temporada (seca
   nov–abr, lluvias may–oct) y por la fatiga con que llegaste (horas de bici de los 7 días previos), para separar «estoy peor» de
   «llegué cansado o con el camino mojado». Después, el plan para volver a los 20 km/h con la evidencia que lo respalda. */
(function (global) {
  'use strict';
  var App = global.App, U = App.ui, F = App.fmt, C = App.chart, esc = App.esc;

  var RE_RUTA = /candelaria/i;
  var RANGO = { km: [21, 30], elev: [430, 640] };   // misma vuelta: deja fuera la de 100 km y las cortas
  var CARGADO_H = 10, CARGADO_M = 2500;            // ≥ 10 h o ≥ 2.500 m de bici en los 7 días previos = llegas cargado
  var MEJOR = { f: '2024-11-28', v: 20.6, t: '1:10:05' };
  // Pasadas de 2024–2025 que no están en el archivo de 2026: tomadas de «Vueltas ciclistas parejas» de Strava (6 nov 2026).
  var HISTORICO = [
    { f: '2024-11-26', v: 20.3, t: '1:11:28' }, { f: '2024-11-28', v: 20.6, t: '1:10:05' },
    { f: '2025-05-02', v: 17.9, t: '1:20:34' }, { f: '2025-05-06', v: 20.0, t: '1:15:26' }
  ];
  var COLOR = { seca: 'var(--ok)', lluvia: 'var(--info)', cargado: 'var(--warn)', historico: 'var(--pico-muted-color)' };
  var NOM = { seca: 'Fresco, temporada seca', lluvia: 'Fresco, temporada de lluvias', cargado: 'Llegaste cargado (≥ 10 h o ≥ 2.500 m en 7 días)', historico: '2024–2025 (Strava)' };
  var DIA0 = Date.UTC(2024, 10, 1);
  var MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  /* Evidencia: cada cita se comprobó en PubMed y su DOI resuelve al artículo (6 nov 2026); el resumen de cada una sale del abstract. */
  var REFS = [
    { t: 'Effects of tapering on performance: a meta-analysis', a: 'Bosquet, Montpetit, Arvisais y Mujika · Med Sci Sports Exerc 39(8):1358–1365, 2007', u: 'https://doi.org/10.1249/mss.0b013e31806010e0',
      d: 'Llegar fresco: la mejor puesta a punto duró 2 semanas, bajando el volumen un 41–60 % y manteniendo intensidad y frecuencia. Por eso la prueba se hace tras una semana suave, no tras 15 h de bici.' },
    { t: 'Detraining: loss of training-induced physiological and performance adaptations. Part I', a: 'Mujika y Padilla · Sports Med 30(2):79–87, 2000', u: 'https://doi.org/10.2165/00007256-200030020-00002',
      d: 'Con menos de 4 semanas de estímulo insuficiente ya caen el VO₂máx, el volumen de sangre y el umbral de lactato. Las semanas de pausa del pie y de sólo Z2 cuentan.' },
    { t: 'Overtraining syndrome: joint consensus statement of the ECSS and ACSM', a: 'Meeusen y cols. · Med Sci Sports Exerc 45(1):186–205, 2013', u: 'https://doi.org/10.1249/MSS.0b013e318279a10a',
      d: 'El bajón por acumular carga sin recuperar es difícil de distinguir de la falta de forma y no hay un marcador único que lo detecte: la prueba en condiciones fijas es tu mejor señal.' },
    { t: 'What is best practice for training intensity and duration distribution in endurance athletes?', a: 'Seiler · Int J Sports Physiol Perform 5(3):276–291, 2010', u: 'https://doi.org/10.1123/ijspp.5.3.276',
      d: 'Los atletas de resistencia de élite hacen ~80 % de las sesiones a baja intensidad y ~20 % de intervalos cerca del 90 % del VO₂máx: poco «ritmo medio».' },
    { t: 'Polarized training has greater impact on key endurance variables than threshold, high intensity, or high volume training', a: 'Stöggl y Sperlich · Front Physiol 5:33, 2014 · acceso libre', u: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3912323/',
      d: 'En 48 atletas entrenados, 9 semanas polarizadas dieron la mayor mejora: +11,7 % de VO₂pico, +17,4 % de tiempo hasta el agotamiento y +5,1 % de potencia pico.' },
    { t: 'Short intervals induce superior training adaptations compared with long intervals in cyclists', a: 'Rønnestad, Hansen, Vegge, Tønnessen y Slettaløkken · Scand J Med Sci Sports 25(2):143–151, 2015', u: 'https://doi.org/10.1111/sms.12165',
      d: 'Ciclistas, 10 semanas, mismo esfuerzo: los intervalos cortos (30 s / 15 s) subieron el VO₂máx un 8,7 % frente al 2,6 % de los largos, y mejoraron la potencia de 30 s, 5 min y 40 min.' },
    { t: 'Optimizing strength training for running and cycling endurance performance: a review', a: 'Rønnestad y Mujika · Scand J Med Sci Sports 24(4):603–612, 2014', u: 'https://doi.org/10.1111/sms.12104',
      d: 'La fuerza pesada es la que tiene más evidencia de sumar economía y rendimiento en ciclismo, además del entrenamiento de resistencia.' },
    { t: 'Concurrent training: a meta-analysis examining interference of aerobic and resistance exercises', a: 'Wilson y cols. · J Strength Cond Res 26(8):2293–2307, 2012', u: 'https://doi.org/10.1519/JSC.0b013e31823a3e2d',
      d: 'Mezclar fuerza y resistencia resta algo de ganancia de fuerza y potencia, y correr interfiere más que pedalear: con la racha diaria, separa las pesas del trote.' },
    { t: 'Validation of a mathematical model for road cycling power', a: 'Martin, Milliken, Cobb, McFadden y Coggan · J Appl Biomech 14(3):276–291, 1998', u: 'https://doi.org/10.1123/jab.14.3.276',
      d: 'El modelo físico (gravedad, rodadura y aire) predice la potencia real con R² = 0,97: es la base de la estimación de cuánto ayuda bajar de peso en la subida.' },
    { t: 'Evaluation of aerodynamic and rolling resistances in mountain-bike field conditions', a: 'Bertucci, Rogier y Reiser · J Sports Sci 31(14):1606–1613, 2013', u: 'https://doi.org/10.1080/02640414.2013.792945',
      d: 'En MTB, la llanta lisa tuvo un 21 % menos de resistencia a la rodadura que la de tacos, y la superficie y la presión la cambiaron: la llanta y el estado del camino pesan.' },
    { t: 'The effect of training at a specific time of day: a review', a: 'Chtourou y Souissi · J Strength Cond Res 26(7):1984–2005, 2012', u: 'https://doi.org/10.1519/JSC.0b013e31825770a7',
      d: 'El rendimiento anaeróbico es más bajo temprano y alcanza su pico al final de la tarde, y te adaptas más a la hora a la que sueles entrenar: prueba siempre a la misma hora.' },
    { t: 'IOC consensus statement on relative energy deficiency in sport (RED-S): 2018 update', a: 'Mountjoy y cols. · Br J Sports Med 52(11):687–697, 2018', u: 'https://doi.org/10.1136/bjsports-2018-099193',
      d: 'Comer de menos de forma sostenida para lo que entrenas afecta salud y rendimiento: el déficit para bajar cintura va en días suaves, nunca el de calidad ni el de prueba.' }
  ];

  function dias(f) { return (Date.UTC(+f.slice(0, 4), +f.slice(5, 7) - 1, +f.slice(8, 10)) - DIA0) / 864e5; }
  function seca(f) { var m = +f.slice(5, 7); return m >= 11 || m <= 4; }
  function media(a) { return a.length ? a.reduce(function (s, x) { return s + x; }, 0) / a.length : null; }

  function pasadas(D) {
    var bici = D.limpias.filter(function (a) { return a.grupo === 'ruta' || a.grupo === 'mtb'; });
    return bici.filter(function (a) {
      return RE_RUTA.test(a.nombre) && a.km >= RANGO.km[0] && a.km <= RANGO.km[1] && a.elev >= RANGO.elev[0] && a.elev <= RANGO.elev[1];
    }).map(function (a) {
      var t = dias(a.fechaISO);
      var prev = bici.filter(function (b) { var d = dias(b.fechaISO); return d < t && d >= t - 7; });
      var h7 = prev.reduce(function (s, b) { return s + b.min; }, 0) / 60, m7 = prev.reduce(function (s, b) { return s + b.elev; }, 0);
      var grupo = h7 >= CARGADO_H || m7 >= CARGADO_M ? 'cargado' : seca(a.fechaISO) ? 'seca' : 'lluvia';
      return { f: a.fechaISO, v: a.km / (a.min / 60), km: a.km, elev: a.elev, min: a.min, hora: a.hora, hr: a.hr, h7: h7, m7: m7, grupo: grupo, nombre: a.nombre };
    });
  }

  function grafica(P) {
    var pts = HISTORICO.map(function (h) {
      return { x: dias(h.f), y: h.v, r: 4.5, color: COLOR.historico, tip: F.fecha(h.f) + ' · ' + F.num(h.v, 1) + ' km/h · ' + h.t + ' (Strava)' };
    }).concat(P.map(function (p) {
      return { x: dias(p.f), y: p.v, r: 4.5, color: COLOR[p.grupo],
        tip: F.fecha(p.f) + ' · ' + F.num(p.v, 1) + ' km/h · ' + F.num(p.h7, 1) + ' h de bici en los 7 días previos · ' + p.hora + ':00 h' + (p.hr ? ' · FC ' + p.hr : '') };
    }));
    return C.scatter({
      points: pts, height: 240, label: 'Velocidad media en la ruta de Candelaria, 2024–2026',
      fmtX: function (v) { var d = new Date(DIA0 + v * 864e5); return MES[d.getUTCMonth()] + ' ' + String(d.getUTCFullYear()).slice(2); },
      fmtY: function (v) { return F.num(v, 0); },
      caption: 'Velocidad media (km/h) de cada pasada. Verde: llegaste fresco en temporada seca; azul: fresco en lluvias; naranja: con 10 h o 2.500 m de bici o más en la semana previa; gris: 2024–2025 desde Strava. Pasa el dedo o el ratón por un punto para ver el detalle.'
    }) + C.legend(['seca', 'lluvia', 'cargado', 'historico'].map(function (k) { return { name: NOM[k], color: COLOR[k] }; }));
  }

  function tabla(P) {
    var filas = P.slice().reverse().map(function (p) {
      return [F.fecha(p.f), "<span class='wrap'>" + esc(p.nombre) + '</span>', '<b>' + F.num(p.v, 1) + '</b>', F.num(p.km, 1), F.num(p.elev, 0),
        p.hora + ':00', F.num(p.h7, 1) + ' h · ' + F.num(p.m7, 0) + ' m', p.hr ? F.num(p.hr, 0) : '—', esc(NOM[p.grupo])];
    });
    return U.tabla([{ t: 'Fecha' }, { t: 'Salida' }, { t: 'km/h', n: true }, { t: 'km', n: true }, { t: 'D+ m', n: true }, { t: 'Hora' },
      { t: '7 días previos' }, { t: 'FC', n: true }, { t: 'Condición' }], filas);
  }

  function render(D) {
    var P = pasadas(D);
    if (!P.length) return U.modhead('18', 'Ruta Candelaria', 'Todavía no hay pasadas por la ruta en el archivo.');
    var fs = P.filter(function (p) { return p.grupo === 'seca'; }), fl = P.filter(function (p) { return p.grupo === 'lluvia'; }), fc = P.filter(function (p) { return p.grupo === 'cargado'; });
    var vs = media(fs.map(function (p) { return p.v; })), vl = media(fl.map(function (p) { return p.v; })), vc = media(fc.map(function (p) { return p.v; }));
    var ult = P[P.length - 1], rango = P.filter(function (p) { return p.h7 >= ult.h7; }).length;
    var masa = 77 + 14, ganancia = 5 / (masa - 5) * 0.6;            // −5 kg sobre ~91 kg de ciclista + bici; ~60 % del tiempo es subida

    var refs = REFS.length ? "<ul class='refs'>" + REFS.map(function (r) {
      return '<li><a href="' + esc(r.u) + '" target="_blank" rel="noopener">' + esc(r.t) + '</a>' +
        "<span class='meta'>" + esc(r.a) + '</span><p>' + esc(r.d) + '</p></li>';
    }).join('') + '</ul>' : '';

    return U.modhead('18', 'Ruta Candelaria: volver a los 20 km/h', 'La misma vuelta de ≈24 km y ≈500 m desde noviembre de 2024. Strava la pinta como una caída constante; aquí cada pasada se separa por temporada y por cómo llegaste de la semana anterior, porque eso explica más que la forma física.') +
      U.kpis([
        U.kpi('Tu mejor marca', F.num(MEJOR.v, 1) + ' km/h', MEJOR.t + ' · ' + F.fecha(MEJOR.f) + ' 2024 (temporada seca)', 'ok'),
        U.kpi('Fresco, temporada seca 2026', vs ? F.num(vs, 1) + ' km/h' : '—', fs.length + ' pasadas (ene–abr)', 'ok'),
        U.kpi('Fresco, lluvias 2026', vl ? F.num(vl, 1) + ' km/h' : '—', fl.length + ' pasadas (may–oct)', 'info'),
        U.kpi('Última (' + F.fecha(ult.f) + ')', F.num(ult.v, 1) + ' km/h', 'con ' + F.num(ult.h7, 0) + ' h y ' + F.num(ult.m7, 0) + ' m de bici en los 7 días previos', ult.grupo === 'cargado' ? 'warn' : '')
      ]) +
      grafica(P) +
      U.coach('Qué dicen tus datos', '<p><b>No es una caída lineal.</b> Las pasadas rápidas son de temporada seca y llegando fresco: en 2026, ' + (vs ? F.num(vs, 1) : '—') + ' km/h de media en ene–abr frente a ' + (vl ? F.num(vl, 1) : '—') + ' km/h en may–oct con la misma frescura. Tus mejores marcas (nov 2024, mar y abr 2026) caen todas en temporada seca y con menos de 4 h de bici en la semana previa.</p>' +
        '<p><b>La del ' + F.fecha(ult.f) + ' no mide tu forma:</b> llegaste con ' + F.num(ult.h7, 0) + ' h y ' + F.num(ult.m7, 0) + ' m de bici en 7 días' + (ult.f === '2026-11-06' ? ' (los 100 km incluidos)' : '') + ', ' + (rango === 1 ? 'la semana previa más cargada de todas tus pasadas' : 'una de las semanas previas más cargadas de todas tus pasadas') + ', a las ' + ult.hora + ':00' + (ult.hr ? '' : ' y sin banda de pulso') + '. Las pasadas con 10 h o 2.500 m o más en la semana previa promedian ' + (vc ? F.num(vc, 1) : '—') + ' km/h, ' + (vs && vc ? F.num(vs - vc, 1) + ' km/h menos que las frescas de temporada seca' : '') + '.</p>' +
        '<p><b>Lo que sí parece real:</b> en lluvias, aun fresco, vas ' + (vs && vl ? F.num(vs - vl, 1) : '—') + ' km/h más lento que en seca. Parte es el camino (barro y tierra suelta frenan mucho más que el asfalto o la tierra seca); otra parte puede ser forma, y hoy no se puede separar porque casi nunca la mediste en las mismas condiciones. Tu volumen mensual de bici apenas cambió en el año (15–27 h), así que lo que falta no son horas: es intensidad estructurada, fuerza y llegar fresco a la prueba.</p>') +
      '<h3>Cómo volver a los 20 km/h</h3>' +
      "<ol class='pasos'>" +
      '<li><b>Mídela bien.</b> Una prueba cada 4–6 semanas en las mismas condiciones: con menos de 6 h y 1.500 m de bici en los 7 días previos y el día anterior suave, a la misma hora que tus mejores marcas (17:00–19:00), con la banda de pulso, la misma presión de llantas y anotando si llovió. La primera está en el calendario el <b>sábado 23 ene 2027</b>, ya en temporada seca y de vuelta de Charlotte. Meta: 19,5 km/h en enero y 20,6 km/h en marzo–abril.</li>' +
      '<li><b>Dos sesiones de calidad por semana, el resto suave.</b> Una de intervalos cortos (3 series de 13 × 30 s fuerte / 15 s suave) y otra de subidas largas a umbral (4–5 × 6–8 min). Lo demás, de verdad en Z2. Rodar casi siempre a ritmo «medio» es lo que estanca.</li>' +
      '<li><b>Fuerza pesada dos veces por semana.</b> Sentadilla, peso muerto rumano y búlgara pesadas (4–8 repeticiones), separadas de los intervalos. En Charlotte, sin pesas, mantén la versión unilateral con lastre; en enero vuelve a cargar.</li>' +
      '<li><b>Menos kilos, sin comer de menos los días clave.</b> En la subida manda la relación vatios/kg. Bajar 5 kg (de ' + masa + ' kg de ciclista y bici) acelera las subidas un ' + F.num(5 / (masa - 5) * 100, 0) + ' % a igual potencia: en esta ruta, unos ' + F.num(ganancia * 100, 1) + ' %, ≈ +' + F.num(17.3 * ganancia, 1) + ' km/h (estimación física, no medida). El déficit va en días suaves; el día de calidad y el de prueba comes lo que gastas.</li>' +
      '<li><b>Una semana de descarga cada 3–4.</b> Baja el volumen un 40–60 % y mantén la intensidad; así llegas fresco a la prueba y a las carreras.</li>' +
      '<li><b>La bici también cuenta.</b> Presión revisada antes de salir, cadena limpia y lubricada, frenos que no rocen. En MTB, una llanta lisa rueda un 21 % más fácil que una de tacos: si la ruta es casi toda asfalto o tierra compacta, la llanta puede valer más que semanas de entreno.</li>' +
      '</ol>' +
      U.acc('Todas las pasadas de 2026', tabla(P)) +
      (refs ? '<h3>La evidencia</h3>' + refs : '') +
      "<p><small>Clasificación: temporada seca = nov–abr, lluvias = may–oct (Retalhuleu); «cargado» = 10 h o 2.500 m de bici o más en los 7 días previos. Las pasadas de 2024–2025 vienen de la gráfica de Strava porque el archivo empieza en 2026. Las estimaciones de peso usan 77 kg (escaneo del 6 oct) y una bici de ~14 kg.</small></p>";
  }

  App.mods.push({ id: 'candelaria', nom: 'Ruta Candelaria', tab: 'Ruta', icono: 'M3 19l5-9 4 6 3-4 6 7z', render: render });
})(this);
