/* barra.js — Pestaña «Barra» de la Guía de resistencia (módulo 26): de cero a 10 dominadas estrictas sin lesionarse.
   Niveles con sesiones, tiempos y criterio para subir; calidad frente a cantidad; hombros, codos y regla del dolor;
   trampas; consejos de la comunidad parafraseados; y un estimador de fecha que guarda tu máximo en este navegador.
   Las 12 referencias se comprobaron en Crossref (DOI, autores, revista, volumen y páginas). */
(function (global) {
  'use strict';
  var App = global.App, U = App.ui;
  var K_MAX = 'strava.barra.max';

  var REFS = [
    ['schoenfeld', 'Schoenfeld BJ, Grgic J, Ogborn D, Krieger JW (2017). Strength and hypertrophy adaptations between low- vs. high-load resistance training: a systematic review and meta-analysis. J Strength Cond Res 31:3508–3523.', '10.1519/JSC.0000000000002200'],
    ['frecuencia', 'Grgic J, Schoenfeld BJ, Davies TB, Lazinica B, Krieger JW, Pedisic Z (2018). Effect of resistance training frequency on gains in muscular strength: a systematic review and meta-analysis. Sports Med 48:1207–1220.', '10.1007/s40279-018-0872-x'],
    ['ralston', 'Ralston GW, Kilgore L, Wyatt FB, Baker JS (2017). The effect of weekly set volume on strength gain: a meta-analysis. Sports Med 47:2585–2601.', '10.1007/s40279-017-0762-7'],
    ['refalo', 'Refalo MC, Helms ER, Trexler ET, Hamilton DL, Fyfe JJ (2023). Influence of resistance training proximity-to-failure on skeletal muscle hypertrophy: a systematic review with meta-analysis. Sports Med 53:649–665.', '10.1007/s40279-022-01784-y'],
    ['descanso', 'Grgic J, Lazinica B, Mikulic P, Krieger JW, Schoenfeld BJ (2017). The effects of short versus long inter-set rest intervals in resistance training on measures of muscle hypertrophy: a systematic review. Eur J Sport Sci 17:983–993.', '10.1080/17461391.2017.1340524'],
    ['douglas', 'Douglas J, Pearson S, Ross A, McGuigan M (2017). Chronic adaptations to eccentric training: a systematic review. Sports Med 47:917–941.', '10.1007/s40279-016-0628-4'],
    ['youdas', 'Youdas JW, Amundson CL, Cicero KS, Hahn JJ, Harezlak DT, Hollman JH (2010). Surface electromyographic activation patterns and elbow joint motion during a pull-up, chin-up, or perfect-pullup rotational exercise. J Strength Cond Res 24:3404–3414.', '10.1519/JSC.0b013e3181f1598c'],
    ['kibler', 'Kibler WB, Ludewig PM, McClure PW, Michener LA, Bak K, Sciascia AD (2013). Clinical implications of scapular dyskinesis in shoulder injury: the 2013 consensus statement from the «scapular summit». Br J Sports Med 47:877–885.', '10.1136/bjsports-2013-092425'],
    ['plotkin', 'Plotkin D, Coleman M, Van Every D, et al. (2022). Progressive overload without progressing load? The effects of load or repetition progression on muscular adaptations. PeerJ 10:e14142.', '10.7717/peerj.14142'],
    ['velocidad', 'Sánchez-Moreno M, Rodríguez-Rosell D, Pareja-Blanco F, Mora-Custodio R, González-Badillo JJ (2017). Movement velocity as indicator of relative intensity and level of effort attained during the set in pull-up exercise. Int J Sports Physiol Perform 12:1378–1384.', '10.1123/ijspp.2016-0791'],
    ['bohm', 'Bohm S, Mersmann F, Arampatzis A (2015). Human tendon adaptation in response to mechanical loading: a systematic review and meta-analysis of exercise intervention studies on healthy adults. Sports Med Open 1:7.', '10.1186/s40798-015-0009-9'],
    ['silbernagel', 'Silbernagel KG, Thomeé R, Eriksson BI, Karlsson J (2007). Continued sports activity, using a pain-monitoring model, during rehabilitation in patients with Achilles tendinopathy: a randomized controlled study. Am J Sports Med 35:897–906.', '10.1177/0363546506298279']
  ];
  var NUM = {};
  REFS.forEach(function (r, i) { NUM[r[0]] = i + 1; });
  function c() {
    var ns = Array.prototype.slice.call(arguments).map(function (k) { return NUM[k]; }).filter(Boolean);
    return " <sup class='ref'>[" + ns.join(', ') + ']</sup>';
  }
  function lista() {
    return "<ol class='grefs'>" + REFS.map(function (r) {
      return '<li>' + App.esc(r[1]) + " <a href='https://doi.org/" + r[2] + "' target='_blank' rel='noopener'>doi:" + r[2] + '</a></li>';
    }).join('') + '</ol>';
  }
  function cards(arr, fn) { return "<div class='gcards'>" + arr.map(fn).join('') + '</div>'; }

  /* Niveles: [id, nombre, cuándo estás aquí, objetivo, sesión A (fuerza), sesión B (volumen), opcional, pasas cuando…, semanas típicas] */
  var NIVELES = [
    ['0', 'Cimientos', 'Te cuesta colgarte 30 s o no controlas una bajada de 3 s.',
      'Que manos, hombros y codos toleren colgar tu peso; aprender a «encender» los omóplatos.',
      'Colgado pasivo 3 × 20–30 s · pull escapular (colgado, bajar y juntar omóplatos sin doblar codos) 3 × 8 · remo invertido bajo una mesa o barra baja 3 × 8–12.',
      'Igual, más ligero: colgado 2 × 20 s · remo con banda 3 × 12 · face pull 2 × 15.',
      '—',
      '3 × 30 s colgado, 3 × 8 escapulares limpios y 3 × 10 remos invertidos.', '2–3'],
    ['1', 'Primera dominada', 'Te cuelgas 30 s o más, pero aún no subes ninguna estricta.',
      'Fuerza en el tramo más difícil y en la bajada; la negativa es el atajo con más respaldo' ,
      'Negativas: 5 × 1–3 bajando en 5 s (saltas o subes con una silla) · isométrico arriba con la barbilla sobre la barra 3 × 10–20 s · remo invertido 3 × 8.',
      'Dominadas con la banda más fina que te deje 4 × 4–6 · colgado activo 2 × 20 s.',
      'Prueba una estricta al principio de la sesión A, fresco, una vez por semana. No más.',
      'Una dominada estricta desde brazos estirados y barbilla sobre la barra.', '4–12'],
    ['2', 'De 1 a 3', 'Haces 1–3 estrictas.',
      'Muchas repeticiones de calidad sin llegar al fallo.',
      'Singles: 6–8 × 1 con 90–120 s de pausa · 2–3 negativas de 5 s al final.',
      'Escaleras: 1-2, 1-2, 1-2 (y 1-2-3 cuando salga fácil) con 60–90 s entre peldaños; total 10–15.',
      'Engrase («grease the groove»): 3–5 singles repartidos en el día los días sin sesión, siempre fáciles.',
      'Cuatro estrictas seguidas.', '6–10'],
    ['3', 'De 4 a 7', 'Haces 4–7 estrictas.',
      'Volumen semanal: más series a la mitad de tu máximo.',
      '5 series al 50–60 % de tu máximo (máx 6 → 5 × 3) con 2–3 min de pausa; cada semana, una repetición más en total.',
      'Escaleras 1-2-3 × 3–4 (18–24 repeticiones) · 2 series de dominadas supinas (chin-ups) a 2 en reserva.',
      'Engrase opcional, con agarres que alternes.',
      'Ocho estrictas seguidas.', '10–16'],
    ['4', 'De 8 a 10', 'Haces 8 o más.',
      'Fuerza máxima con algo de lastre y densidad.',
      'Lastradas con mochila de 2–5 kg: 4 × 3–5 con 3 min de pausa.',
      'Densidad: cada minuto, durante 10–12 min, 2–3 dominadas a peso corporal (sube a 3–4 cuando lo hagas sin esfuerzo).',
      'Sin engrase: aquí la intensidad ya es alta.',
      'Diez estrictas: barbilla sobre la barra en todas y bajada completa.', '6–12']
  ];

  /* Semanas por repetición (rango bajo–alto); 0→1 es su propio tramo. */
  function semanasHasta10(max) {
    var lo = 0, hi = 0;
    if (max < 1) { lo += 6; hi += 12; max = 1; }
    for (var r = max; r < 10; r++) { if (r < 5) { lo += 2; hi += 3.5; } else { lo += 3; hi += 5; } }
    return [Math.round(lo * 1.1), Math.round(hi * 1.15)];   // ≈ 10–15 % extra por semanas de descarga, viajes y carreras
  }
  function nivelDe(max) { return max < 0 ? null : max === 0 ? 1 : max <= 3 ? 2 : max <= 7 ? 3 : 4; }
  function leerMax() { try { var v = localStorage.getItem(K_MAX); return v === null ? null : +v; } catch (e) { return null; } }
  function guardarMax(v) { try { if (v === null) localStorage.removeItem(K_MAX); else localStorage.setItem(K_MAX, String(v)); } catch (e) { /* sin almacenamiento */ } }
  function mes(d) { try { return d.toLocaleDateString('es', { month: 'long', year: 'numeric' }); } catch (e) { return d.getFullYear() + '-' + (d.getMonth() + 1); } }

  function estimador(max) {
    if (max === null || isNaN(max)) return '<p>Escribe tu máximo de dominadas estrictas (0 si todavía no sale ninguna) y verás tu nivel y una fecha estimada para las 10.</p>';
    if (max >= 10) return U.note('Ya estás en 10', 'Mantén con 1–2 sesiones por semana y, si quieres más, pasa a lastradas o variantes (arquero, supinas con pausa). Lo de «modo bestia» empieza aquí, no antes.', 'ok');
    var n = nivelDe(max), w = semanasHasta10(max), hoy = new Date();
    var a = new Date(hoy.getTime() + w[0] * 7 * 864e5), b = new Date(hoy.getTime() + w[1] * 7 * 864e5);
    return U.kpis([
      U.kpi('Tu nivel', NIVELES[n][0] + ' · ' + NIVELES[n][1], NIVELES[n][2]),
      U.kpi('Semanas hasta 10', w[0] + '–' + w[1], 'con 2–3 sesiones por semana'),
      U.kpi('Fecha estimada', mes(a), 'a ' + mes(b))
    ]) + (max === 0 ? '<p>Si todavía no aguantas 30 s colgado, empieza por el nivel 0 (Cimientos): suma 2–3 semanas.</p>' : '') + "<p><small>Estimación con los ritmos que suele contar la comunidad (la primera dominada en 1,5–3 meses; luego una repetición cada 2–5 semanas, más lento a partir de 5). No es un dato de estudio: cada test cada 4 semanas la corrige. Si nunca has hecho fuerza de tirón, apunta al extremo lento.</small></p>";
  }

  function render() {
    var max = leerMax();
    return U.modhead('26', 'Barra de dominadas: de cero a 10', 'Qué hacer en la barra, cuánto y cuándo, cómo no romperse hombros ni codos y cómo llegar a 10 dominadas estrictas. Sin prisa: aquí el tendón manda más que el músculo.') +

      U.coach('La respuesta corta',
        '<p><b>Calidad primero, cantidad después, nunca al fallo.</b> La dominada es fuerza relativa: tirar de tu peso corporal. Se gana con <b>muchas repeticiones limpias lejos del fallo</b>, repartidas en 2–3 sesiones por semana' + c('frecuencia', 'ralston', 'refalo') + ', más negativas lentas al principio' + c('douglas') + '. El músculo responde en semanas; los tendones del codo y del hombro, en meses' + c('bohm') + ', así que el ritmo lo ponen ellos.</p>' +
        '<p>En tu plan ya tienes la barra los <b>lunes y jueves</b> (V-taper de dorsales) y en la fuerza B. Sustituye ahí las «dominadas con banda o negativas» por el bloque de tu nivel; no hace falta añadir días.</p>') +

      "<article class='coach'><header>Tu nivel y tu fecha para las 10</header>" +
        "<label for='barra-max'>Máximo de dominadas estrictas hoy</label>" +
        "<input id='barra-max' type='number' min='0' max='40' step='1' inputmode='numeric' value='" + (max === null ? '' : max) + "' style='max-width:8rem'>" +
        "<div id='barra-est'>" + estimador(max) + '</div>' +
        '<p><small>Se guarda sólo en este navegador. Repite el test cada 4 semanas, descansado, al principio de una sesión.</small></p></article>' +

      U.acc('Qué cuenta como una dominada (calidad)', U.coach('Estándar estricto',
        '<ul><li><b>Abajo:</b> brazos estirados, pero con los hombros «enganchados» (omóplatos abajo, no colgado de los ligamentos). Cada repetición empieza bajando los omóplatos' + c('kibler') + '.</li>' +
        '<li><b>Arriba:</b> barbilla claramente sobre la barra, sin estirar el cuello.</li>' +
        '<li><b>Sin balanceo ni patada</b> (nada de kipping). El cuerpo, recto o en ligera «barquita».</li>' +
        '<li><b>Ritmo:</b> 1 s arriba, 2–3 s abajo. La bajada también entrena.</li>' +
        '<li><b>Agarre:</b> prono (palmas al frente) un poco más ancho que los hombros es la dominada «oficial». La supina (chin-up) carga más bíceps y pectoral; las tres variantes activan mucho el dorsal' + c('youdas') + '. Alternar agarres reparte la carga del codo.</li></ul>' +
        '<p>Media repetición no cuenta. Una repetición limpia vale más que tres feas: las feas entrenan otra cosa y castigan el codo.</p>'), true) +

      U.acc('Calidad frente a cantidad: lo que dicen los estudios', cards([
        ['Pesado o ligero', 'Para fuerza, las cargas altas (pocas repeticiones) ganan; para músculo, cargas bajas y altas rinden parecido' + c('schoenfeld') + '. En la barra: singles, negativas y lastre construyen la fuerza; las series largas, la resistencia de las 10.', 'Ambas, en ese orden'],
        ['¿Hasta el fallo?', 'No hace falta: quedarse a 1–3 repeticiones del fallo da casi lo mismo con mucha menos fatiga' + c('refalo') + '. Señal práctica: cuando una repetición sale claramente más lenta que la primera, para' + c('velocidad') + '.', 'Para con 1–3 en reserva'],
        ['¿Cuántas veces por semana?', 'Con el mismo volumen, la frecuencia apenas cambia la fuerza; su ventaja es que permite meter más volumen de calidad' + c('frecuencia') + '. Más series semanales, más fuerza, con rendimientos decrecientes' + c('ralston') + '.', '2–3 sesiones, 6–12 series duras por semana'],
        ['¿Cuánto descansar?', 'Las pausas largas (2–3 min) permiten más repeticiones buenas por serie que las de 30–60 s' + c('descanso') + '. Para la barra, pausa larga en lo duro; corta sólo en escaleras fáciles.', '2–3 min en lo duro'],
        ['¿Más peso o más repeticiones?', 'Progresar por repeticiones o por carga dio adaptaciones parecidas' + c('plotkin') + '. Hasta 8 subes repeticiones; luego, mochila.', 'Las dos valen'],
        ['¿Sirven las negativas?', 'El entrenamiento excéntrico mejora la fuerza y la tolerancia muscular' + c('douglas') + '. Es la forma más usada de llegar a la primera dominada, pero produce más agujetas: 5 × 1–3, no 30.', 'Sí, con dosis']
      ], function (f) { return "<article class='gcard'><h5>" + f[0] + "</h5><span class='ver'>" + f[2] + '</span><p>' + f[1] + '</p></article>'; })) +

      U.acc('Las sesiones por nivel', cards(NIVELES, function (n) {
        return "<article class='gcard'><span class='ses-k'>Nivel " + n[0] + ' · ' + n[8] + ' semanas típicas</span><h5>' + n[1] + '</h5>' +
          '<p><small>' + n[2] + '</small></p><p><b>Objetivo:</b> ' + n[3] + (n[0] === '1' ? c('douglas') : '') + '.</p>' +
          '<p><b>Sesión A (fuerza, lunes):</b> ' + n[4] + '</p><p><b>Sesión B (volumen, jueves):</b> ' + n[5] + '</p>' +
          (n[6] !== '—' ? '<p><b>Opcional:</b> ' + n[6] + '</p>' : '') + '<p><b>Pasas cuando:</b> ' + n[7] + '</p></article>';
      }), true) +

      U.acc('Tiempos: calentamiento, sesión, semana y bloque', U.coach('Cómo se reparte',
        '<ul><li><b>Calentamiento (5 min):</b> 15 separaciones con banda (pull-apart) · 8 pulls escapulares · 1–2 series fáciles con banda o de 2 repeticiones. En frío el codo protesta.</li>' +
        '<li><b>Sesión:</b> 15–20 min, siempre al <b>principio</b> de la fuerza o del V-taper, nunca al final de 2 h de bici. Las pausas largas son parte de la sesión.</li>' +
        '<li><b>Semana:</b> lunes A, jueves B (los días de V-taper de dorsales), con 48 h o más entre sesiones duras. Engrase opcional martes y viernes en niveles 2–3: 3–5 singles fáciles en el día.</li>' +
        '<li><b>Bloque de 4 semanas:</b> 3 semanas subiendo un poco (una serie o 2–4 repeticiones totales más por semana) y la 4.ª de descarga a la mitad del volumen. El test de máximo, al final de la descarga.</li>' +
        '<li><b>Semanas de carrera:</b> la barra apenas toca las piernas, así que puede seguir; sí quítala el día antes de un evento largo si te quita sueño o te deja agotado.</li>' +
        '<li><b>Charlotte (25 nov–13 ene):</b> una barra de puerta cuesta poco y cabe en la maleta; si no hay, parque. Sin barra: remo invertido bajo una mesa firme y remo con mochila mantienen buena parte de lo ganado unas semanas.</li></ul>')) +

      U.acc('Sin lesiones: hombros, codos, manos y la regla del dolor', U.coach('Lo que se rompe y cómo evitarlo',
        '<ul><li><b>Hombro:</b> el control del omóplato se asocia a menos problemas de hombro' + c('kibler') + '. Empieza cada repetición bajando los omóplatos, no encojas hacia las orejas y equilibra con tus rutinas W (face pull, pájaro) y algo de empuje (flexiones).</li>' +
        '<li><b>Codo:</b> la molestia por dentro o por fuera del codo es la lesión típica de quien sube volumen deprisa. El tendón se adapta en meses, más lento que el músculo' + c('bohm') + ': sube despacio, alterna agarres y no metas engrase el día después de una sesión dura.</li>' +
        '<li><b>Manos:</b> magnesio o una toalla seca; lima los callos para que no se abran.</li>' +
        '<li><b>Regla del dolor</b> (adaptada de un modelo para el tendón de Aquiles' + c('silbernagel') + '): una molestia de hasta 3/10 que se calma a la mañana siguiente es aceptable; si sube durante la sesión, si al día siguiente está peor o si es punzante, baja el volumen a la mitad una semana.</li>' +
        '<li><b>Para y consulta</b> si hay dolor que no mejora en 2 semanas, hormigueo o adormecimiento en la mano, pérdida de fuerza repentina o un chasquido con dolor. Esto es información general, no un diagnóstico.</li></ul>')) +

      U.acc('Trampas que parecen buenas', cards([
        ['Probar el máximo todos los días', 'Parece motivador; en realidad acumula fatiga y castiga el codo. El test, cada 4 semanas.'],
        ['Ir siempre al fallo', 'Sienta a trabajo duro, pero no gana más fuerza' + c('refalo') + ' y alarga la recuperación.'],
        ['Contar repeticiones con balanceo o a medias', 'Los números suben y la fuerza no. El día que intentes 10 limpias no salen.'],
        ['Vivir en la banda', 'La banda ayuda sobre todo abajo y casi nada arriba, justo donde falla la dominada. Combínala con negativas e isométricos arriba.'],
        ['Duplicar el volumen tras un buen día', 'El músculo lo aguanta; el tendón, no' + c('bohm') + '. Sube de a poco.'],
        ['Engrase que cansa', 'Los singles del engrase deben ser fáciles. Si son al límite, ya es otra sesión.'],
        ['Tirar sin equilibrar', 'Sólo dominadas y nada de omóplatos ni empuje: hombros adelantados y molestias. Tus rutinas W lo compensan.'],
        ['Dominadas al final de todo', 'Después de 2 h de bici y pesas, las repeticiones son feas. La barra va primero.']
      ], function (t) { return "<article class='gcard'><h5>" + t[0] + '</h5><p>' + t[1] + '</p></article>'; })) +

      U.acc('Lo que suele aconsejar la comunidad (y qué tan bien sale parado)', U.coach('Paráfrasis de consejos frecuentes en r/bodyweightfitness, r/fitness y r/overcominggravity',
        '<ul><li><b>«Primero escapulares, colgados y negativas; la banda, como apoyo.»</b> Es la progresión de la rutina recomendada de r/bodyweightfitness. Coincide con la evidencia sobre excéntricos y control escapular.</li>' +
        '<li><b>«Engrasa el surco: singles fáciles muchas veces al día.»</b> Idea popularizada por Pavel Tsatsouline. Encaja con «mucha calidad, lejos del fallo», pero no hay ensayos que la comparen con un programa normal. Útil en niveles 2–3 si no cansa.</li>' +
        '<li><b>«Fighter Pull-up Program» (escaleras casi diarias) y «Armstrong Pull-up Program» (programa militar diario).</b> Mucha gente cuenta grandes saltos con ellos; también son la fuente de muchos codos doloridos. Sin estudios: si los usas, recorta días y vigila el codo.</li>' +
        '<li><b>«Baja de peso y subirás más.»</b> Es física: cada kilo menos es carga menos en cada repetición. Pero no recortes comida en un bloque duro de bici; el déficit agresivo cuesta rendimiento y salud (lo ves en Ciencia del ultra).</li>' +
        '<li><b>«Haz la primera con saltos y kipping y ya saldrá la estricta.»</b> No: entrena otro movimiento y carga el hombro en mala posición.</li></ul>' +
        '<p><small>Son resúmenes de temas que se repiten en esas comunidades, no citas textuales. Úsalos como pistas; manda la evidencia y tu propio registro.</small></p>')) +

      U.acc('¿Y el «modo bestia»?', U.coach('Después de las 10',
        '<p>Cuando salgan 10 estrictas, la siguiente fase es <b>lastre</b> (mochila o cinturón: 5–10 kg × 3–5), <b>variantes</b> (supinas con pausa arriba, arquero, «máquina de escribir») y <b>densidad</b> (30 repeticiones en el menor tiempo, con pausas). La dominada a una mano o el muscle-up son otro deporte: piden un año más y tendones muy preparados. Para un ciclista y corredor, 10–15 estrictas ya son una espalda fuerte; más allá, el beneficio para la resistencia es pequeño.</p>')) +

      U.acc('Referencias', lista());
  }

  function montar(el) {
    var inp = el.querySelector('#barra-max'), out = el.querySelector('#barra-est');
    if (!inp || !out) return;
    inp.addEventListener('input', function () {
      var v = inp.value === '' ? null : Math.max(0, Math.min(40, Math.round(+inp.value)));
      guardarMax(v);
      out.innerHTML = estimador(v);
    });
  }

  App.mods.push({ id: 'barra', nom: 'Barra de dominadas', tab: 'Barra', icono: 'M3 5h18M7 5v4M17 5v4M12 9a2 2 0 1 1 0 4 2 2 0 1 1 0-4M9 21l3-8 3 8', render: render, montar: montar });
})(this);
