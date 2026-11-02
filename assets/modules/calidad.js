/* calidad.js — Módulo: intensidad y sesiones de calidad (bici, carrera, pesas), subidas/desnivel y la evidencia detrás.
   Los conteos salen de los planes reales (App.calExport.dias); la evidencia es un resumen citado por autor y año, sin enlaces. */
(function (global) {
  'use strict';
  var App = global.App, U = App.ui, F = App.fmt, DT = App.date, P = App.plan, esc = App.esc;
  var C = function (t, h) { return U.coach(t, h); };
  var PLANES = [['estructurado', 'Estructurado'], ['intermedio', 'Intermedio'], ['brutal', 'Brutal']];

  function isoHoy() { var d = new Date(), m = d.getMonth() + 1, dd = d.getDate(); return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (dd < 10 ? '0' : '') + dd; }

  /* Semanas (lunes) con el conteo de calidad, largo y carreras de cada plan. */
  function semanas() {
    var out = {}, orden = [];
    PLANES.forEach(function (p) {
      var lista = App.calExport && App.calExport.dias ? App.calExport.dias(p[0]) : [];
      lista.forEach(function (d) {
        var f = DT.d(d.fecha), lun = DT.iso(DT.addDays(f, -DT.dowMon0(f)));
        if (!out[lun]) { out[lun] = {}; orden.push(lun); }
        var o = out[lun][p[0]] || (out[lun][p[0]] = { q: 0, l: 0, c: 0, pausa: 0 });
        if (d.pausa) { o.pausa++; return; }
        if (P.CALIDAD[d.tipo]) o.q++;
        else if (d.tipo === 'L') o.l++;
        else if (d.tipo === 'C') o.c++;
      });
    });
    orden.sort();
    return { map: out, orden: orden };
  }
  function nivelDe(q) { return q >= 3 ? 3 : q; }

  function tablaPlanes() {
    var S = semanas(), hoy = isoHoy(), hoyF = DT.d(hoy), lunHoy = DT.iso(DT.addDays(hoyF, -DT.dowMon0(hoyF)));
    var orden = S.orden.filter(function (l) { return l >= lunHoy; }).slice(0, 7);
    if (!orden.length) return U.note('', 'No hay semanas futuras en los planes.');
    var prom = PLANES.map(function (p) {
      var n = 0, t = 0;
      orden.forEach(function (l) { var o = S.map[l][p[0]]; if (o && !o.pausa) { n++; t += o.q; } });
      return n ? t / n : 0;
    });
    var kp = U.kpis(PLANES.map(function (p, i) { return U.kpi('Calidad por semana · ' + p[1], F.num(prom[i], 1), 'promedio de las próximas semanas'); }));
    var filas = orden.map(function (l, i) {
      var cel = PLANES.map(function (p) {
        var o = S.map[l][p[0]];
        if (!o) return '—';
        if (o.pausa && !o.q && !o.l && !o.c) return 'pausa';
        var txt = '<b>Q ' + o.q + '</b>' + (o.l ? ' · L ' + o.l : '') + (o.c ? ' · carrera' : '');
        return o.q ? txt + ' ' + U.chip('N' + nivelDe(o.q), o.q >= 3 ? 'bad' : o.q === 2 ? 'warn' : 'ok') : txt;
      });
      return [esc(F.fecha(l)) + (i === 0 ? ' <small>(esta semana)</small>' : '')].concat(cel);
    });
    return kp + U.tabla([{ t: 'Semana (lunes)' }].concat(PLANES.map(function (p) { return { t: p[1] }; })), filas,
      { pie: 'Q = sesiones de calidad (calidad, HIIT, sprints, trail duro, FTP, sprints en bici y montaña dura). L = largo. Las carreras se cuentan aparte. N1/N2/N3 = el nivel que corresponde a ese número de Q.' });
  }

  function niveles() {
    return '<ul>' +
      '<li><b>Nivel 1 · fácil — 1 sesión de calidad + el largo.</b> Para la semana de descarga, la semana siguiente a un evento largo (rodada de 100 km, carrera), pie en recuperación, déficit calórico marcado o sueño malo. Todo lo demás en Z2 de verdad; si el pie o el cuerpo avisan, la calidad se hace en bici, sentado, o se cambia por fácil.</li>' +
      '<li><b>Nivel 2 · medio — 2 sesiones + el largo.</b> La semana normal de base, la mayoría del tiempo. Una de carrera o montaña y una de bici, o una de calidad y pesas pesadas; nunca dos duras seguidas.</li>' +
      '<li><b>Nivel 3 · brutal — 3 sesiones + el largo.</b> Sólo 2–3 semanas seguidas, con el pie sano, comida y sueño en regla; después, una semana de nivel 1. Deja un día completo entre sesiones duras; si la FC en reposo sube o el sueño cae, baja a nivel 2 ese mismo día.</li>' +
      '</ul>' +
      '<p><small>3/2/1 es una regla práctica para ordenar el plan; ningún estudio fija «3 sesiones» como número mágico. Lo que sí respaldan los estudios es la distribución: la mayor parte del tiempo fácil y pocas sesiones realmente duras.</small></p>';
  }

  function definicion() {
    return C('Bici: calidad = tiempo útil a la intensidad pedida',
        '<ul>' +
        '<li><b>Umbral/FTP:</b> 3–4 × 8–12 min a ritmo sostenible ~45–60 min, 3–5 min de pausa pedaleando suave. Calidad es que el último intervalo salga igual que el primero.</li>' +
        '<li><b>VO₂máx:</b> 4–6 × 3–4 min muy duros, pausa igual de larga. Pocos, y no en semana de nivel 1.</li>' +
        '<li><b>Sprints:</b> 6–10 × 10–15 s a tope con recuperación completa (2–3 min). Se hacen frescos; la fatiga arruina el estímulo.</li>' +
        '<li><b>Montaña dura (M):</b> la subida sostenida cuenta como calidad <i>sólo si la haces a ritmo de umbral</i>. Los metros de desnivel solos no son calidad.</li>' +
        '</ul>') +
      C('Carrera: calidad = ritmo exacto, no cansancio',
        '<ul>' +
        '<li><b>Umbral:</b> 2–3 × 10 min o un tempo de 20–30 min, con técnica estable hasta el final.</li>' +
        '<li><b>Intervalos cortos (HIIT):</b> 4–6 × 3–4 min a ~VO₂máx; más corto y rápido (200–400 m) si el pie o la espalda no toleran series largas.</li>' +
        '<li><b>Sprints y progresivos:</b> 6 × 15–20 s en subida suave y 4–6 progresivos al final de una carrera fácil; son la forma más barata de calidad (casi no fatigan).</li>' +
        '<li><b>Largo:</b> no cuenta como calidad salvo que termine rápido; su valor es la duración y la durabilidad, no la velocidad.</li>' +
        '</ul>') +
      C('Pesas: calidad no es sólo cargar más peso',
        '<ul>' +
        '<li><b>Cerca del fallo, sin llegar:</b> series que terminan con 2–3 repeticiones en reserva. Estar muy cerca del fallo importa poco para ganar fuerza y algo más para el músculo; no hace falta llegar al fallo y fatiga de más antes de correr.</li>' +
        '<li><b>Carga:</b> con series cercanas al fallo, la masa muscular sube parecido con cargas ligeras o pesadas; la <i>fuerza máxima</i> sube más con cargas pesadas. Para corredores y ciclistas conviene incluir series pesadas (3–6 repeticiones) en los ejercicios grandes.</li>' +
        '<li><b>Volumen semanal:</b> más series por grupo muscular dan más ganancia en forma gradual; 10 o más series por semana por músculo es una referencia, y no está claro cuál es el techo.</li>' +
        '<li><b>Rango completo y control:</b> bajar en ~3 s y recorrer todo el rango da igual o más masa muscular que los rangos recortados, y es más seguro para espalda y pie.</li>' +
        '<li><b>Descanso:</b> 2–3 min entre series pesadas rinden algo más que 1 min; en circuito corto, descansa más en lo pesado y menos en el core.</li>' +
        '<li><b>Técnica y progresión:</b> añade repeticiones o carga sólo cuando la técnica es limpia. Un día de pesas bien hecho puede ser «calidad» sin dejarte roto.</li>' +
        '</ul>' +
        '<p><small>Para resistencia: la fuerza pesada mejora la economía de carrera y de pedaleo sin ganar peso; en pausa por el pie, las rutinas U/Z mantienen el estímulo del tren superior.</small></p>');
  }

  function desnivel() {
    return C('Subidas y desnivel positivo (D+)',
        '<ul>' +
        '<li><b>El estímulo es intensidad × duración, no metros.</b> Una subida larga en Z2 es entrenamiento fácil con más trabajo de piernas; la misma subida a ritmo de umbral es calidad.</li>' +
        '<li><b>Subir a Z2:</b> pon tope a la FC (no a los vatios) y cambia de piñón antes de que la cadencia caiga por debajo de ~70 rpm; subir «a pulso» convierte un fácil en calidad sin querer.</li>' +
        '<li><b>Bajadas:</b> en bici dañan poco el músculo, pero cansan por la técnica y el frío; corriendo, la bajada sí genera daño excéntrico: súbela progresiva antes de una carrera con desnivel.</li>' +
        '<li><b>Altitud:</b> en estudios con atletas entrenados, la VO₂máx baja ~6 % por cada 1.000 m sobre ~300 m, y el rendimiento en contrarreloj, ~14 % por cada 1.000 m (Wehrlin y Hallén, 2006; es un estudio hasta ~2.000 m, el resto es extrapolación). A ~2.500 m espera ritmos claramente menores; guíate por la FC y la sensación, no por los vatios del llano.</li>' +
        '<li><b>Rodada de 100 km con 2.000 m D+ (1 nov):</b> trátala como un largo con calidad repartida: sube en Z2, evita los picos sobre umbral en la primera mitad, 60–90 g/h de carbohidrato y sodio, y la semana siguiente, nivel 1.</li>' +
        '</ul>');
  }

  function guardas() {
    return C('Frenos que mandan sobre el nivel',
        '<ul>' +
        '<li><b>Pie en recuperación:</b> la calidad va en bici o sentado; nada de series de carrera hasta que el médico lo autorice.</li>' +
        '<li><b>Déficit de −500 kcal:</b> con una carga alta y poca energía disponible crece el riesgo de RED-S (deficiencia relativa de energía en el deporte: peor recuperación, sueño, hormonas, huesos; consenso del COI 2018). No combines nivel 3 con déficit; en nivel 3 sube la ingesta.</li>' +
        '<li><b>Señales para bajar de nivel:</b> FC en reposo +5 latidos tres mañanas, sueño corto dos noches, piernas pesadas que no se aflojan en el calentamiento, dolor que sube.</li>' +
        '<li><b>Entre pesas y calidad de carrera:</b> evita las pesas pesadas de pierna en las horas previas; correr interfiere con las ganancias de fuerza y de masa más que pedalear (Wilson et al., 2012).</li>' +
        '</ul>');
  }

  function evidencia() {
    var L = [
      ['Seiler y Kjerland, 2006', 'Los deportistas de élite pasan ~75–80 % del tiempo en zona baja y ~20 % en zona alta.', 'Descriptivo; no prueba que sea la mejor distribución.'],
      ['Esteve-Lanao et al., 2007', 'En corredores, más tiempo fácil y menos en umbral mejoró el rendimiento de carrera.', 'Muestra pequeña, ~5 meses.'],
      ['Stöggl y Sperlich, 2014', 'En 9 semanas con atletas bien entrenados, el modelo polarizado mejoró más que umbral, volumen alto o sólo HIIT.', 'Corto; el efecto no se repite siempre.'],
      ['Rosenblat et al., 2019', 'Metaanálisis: el polarizado no supera con claridad a otros modelos con el mismo volumen; el HIIT sí suma.', 'Discutido: hay revisiones posteriores con matices.'],
      ['Mujika y Padilla, 2000', 'Parar por completo durante semanas hace perder capacidad aeróbica; por eso conviene reducir en vez de parar.', 'Revisión; atletas entrenados.'],
      ['Blagrove et al., 2018; Rønnestad y Mujika, 2014', 'La fuerza pesada y la pliometría mejoran la economía de carrera y de pedaleo en deportistas de resistencia.', 'Estudios cortos y con jóvenes varones.'],
      ['Sunde et al., 2010; Rønnestad et al., 2015', 'En ciclistas, la fuerza máxima mejora la economía y el rendimiento.', 'Muestras pequeñas.'],
      ['Wilson et al., 2012', 'Metaanálisis del entrenamiento concurrente: correr interfiere con la fuerza y la masa muscular; pedalear, poco o nada.', 'Estudios heterogéneos.'],
      ['Schoenfeld et al., 2017 (volumen)', 'Más series semanales dan más masa muscular de forma gradual; 10 o más por músculo es referencia.', 'El techo no está claro.'],
      ['Schoenfeld et al., 2017 (carga)', 'Con series cercanas al fallo, la masa muscular es similar con cargas ligeras o pesadas; la fuerza máxima gana con cargas pesadas.', 'Estudios de 6–12 semanas.'],
      ['Robinson et al., 2024', 'Cerca del fallo importa poco para la fuerza y algo más para la masa muscular.', 'Metarregresión, estimación indirecta.'],
      ['Kassiano et al., 2023', 'Rango de movimiento completo: igual o más masa muscular que los rangos parciales.', 'Revisión.'],
      ['Schoenfeld et al., 2016', '3 min de descanso entre series rindió algo más que 1 min en fuerza y masa muscular.', 'Efecto pequeño; hombres entrenados.'],
      ['Wehrlin y Hallén, 2006', 'VO₂máx −6,3 % y rendimiento −14,5 % por cada 1.000 m sobre ~300 m, en atletas entrenados.', 'Hasta ~2.000 m; la persona real varía.'],
      ['Mountjoy et al., 2018 (COI)', 'Consenso sobre RED-S: la baja energía disponible afecta salud y rendimiento.', 'Consenso, no ensayo.']
    ];
    return '<ul>' + L.map(function (r) {
      return '<li><b>' + r[0] + ':</b> ' + r[1] + ' <small>Límites: ' + r[2] + '</small></li>';
    }).join('') + '</ul><p><small>La mayoría son estudios cortos (8–12 semanas), con pocos participantes y jóvenes varones; úsalos como orientación, no como receta, y confirma con tus propios datos (FC, ritmo, sueño). Es un resumen del contenido de cada trabajo; consulta el original antes de citarlo.</small></p>';
  }

  function render() {
    return U.modhead('8', 'Calidad: cuánta intensidad y cuál', 'Cuántas sesiones duras por semana, qué cuenta como calidad en bici, carrera y pesas, qué pasa con las subidas, y los estudios detrás de cada idea.') +
      U.note('Idea central', 'La calidad es hacer pocas sesiones realmente buenas, no muchas medianas: el resto del tiempo, fácil de verdad. Las pesas también tienen calidad (cercanía al fallo, rango, control, descanso), no sólo carga.') +
      U.acc('Los tres niveles: 1, 2 y 3 sesiones de calidad', C('Brutal = 3 · medio = 2 · fácil = 1', niveles()), true) +
      U.acc('Qué da cada plan en las próximas semanas', C('Conteo real de tus calendarios', tablaPlanes() +
        '<p><small>El cuadro cuenta las sesiones reales de cada plan (con los ajustes ya aplicados); los nombres de los planes no equivalen a los niveles 1, 2 y 3. Sirve para decidir qué semana bajar a nivel 1 sin tocar el plan.</small></p>'), true) +
      U.acc('Qué es calidad: bici, carrera y pesas', definicion()) +
      U.acc('Subidas, desnivel y altitud', desnivel()) +
      U.acc('Frenos: pie, déficit y señales del cuerpo', guardas()) +
      U.acc('Estudios y qué tan firmes son', C('Evidencia resumida', evidencia()));
  }

  App.mods.push({ id: 'calidad', nom: 'Calidad e intensidad', tab: 'Calidad', icono: 'M13 3L5 14h6l-1 7 8-11h-6z', render: render });
})(this);
