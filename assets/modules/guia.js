/* guia.js — Página «Guía de resistencia» (módulos 21–23): qué crea a un atleta de ultradistancia, si la fuerza de piernas
   garantiza resultados (ciencia frente a lo que repite la comunidad) y las trampas que parecen buenas y no lo son.
   Las referencias (REFS) se comprobaron en PubMed/DOI; App.guiaRefs las comparten sesiones.js y leccion.js. */
(function (global) {
  'use strict';
  var App = global.App, U = App.ui;

  var REFS = [
    ['joyner', 'Joyner MJ, Coyle EF (2008). Endurance exercise performance: the physiology of champions. J Physiol 586:35–44.', '10.1113/jphysiol.2007.143834'],
    ['maunder', 'Maunder E, Seiler S, Mildenhall MJ, Kilding AE, Plews DJ (2021). The importance of «durability» in the physiological profiling of endurance athletes. Sports Med 51:1619–1628.', '10.1007/s40279-021-01459-0'],
    ['seiler', 'Seiler S (2010). What is best practice for training intensity and duration distribution in endurance athletes? Int J Sports Physiol Perform 5:276–291.', '10.1123/ijspp.5.3.276'],
    ['stoggl', 'Stöggl T, Sperlich B (2014). Polarized training has greater impact on key endurance variables than threshold, high intensity, or high volume training. Front Physiol 5:33.', '10.3389/fphys.2014.00033'],
    ['ronnestad15', 'Rønnestad BR, Hansen J, Vegge G, Tønnessen E, Slettaløkken G (2015). Short intervals induce superior training adaptations compared with long intervals in cyclists – an effort-matched approach. Scand J Med Sci Sports 25:143–151.', '10.1111/sms.12165'],
    ['jeukendrup', 'Jeukendrup AE (2017). Training the gut for athletes. Sports Med 47(Suppl 1):101–110.', '10.1007/s40279-017-0690-6'],
    ['millet', 'Millet GY, Tomazin K, Verges S, et al. (2011). Neuromuscular consequences of an extreme mountain ultra-marathon. PLoS One 6:e17059.', '10.1371/journal.pone.0017059'],
    ['knechtle', 'Knechtle B, Rüst CA, Rosemann T, Lepers R (2012). Age-related changes in 100-km ultra-marathon running performance. Age (Dordr) 34:1033–1045.', '10.1007/s11357-011-9290-9'],
    ['bouchard', 'Bouchard C, An P, Rice T, et al. (1999). Familial aggregation of VO2max response to exercise training: results from the HERITAGE Family Study. J Appl Physiol 87:1003–1008.', '10.1152/jappl.1999.87.3.1003'],
    ['ronnestadMujika', 'Rønnestad BR, Mujika I (2014). Optimizing strength training for running and cycling endurance performance: a review. Scand J Med Sci Sports 24:603–612.', '10.1111/sms.12104'],
    ['blagrove', 'Blagrove RC, Howatson G, Hayes PR (2018). Effects of strength training on the physiological determinants of middle- and long-distance running performance: a systematic review. Sports Med 48:1117–1149.', '10.1007/s40279-017-0835-7'],
    ['storen', 'Støren Ø, Helgerud J, Støa EM, Hoff J (2008). Maximal strength training improves running economy in distance runners. Med Sci Sports Exerc 40:1087–1092.', '10.1249/MSS.0b013e318168da2f'],
    ['paavolainen', 'Paavolainen L, Häkkinen K, Hämäläinen I, Nummela A, Rusko H (1999). Explosive-strength training improves 5-km running time by improving running economy and muscle power. J Appl Physiol 86:1527–1533.', '10.1152/jappl.1999.86.5.1527'],
    ['balsalobre', 'Balsalobre-Fernández C, Santos-Concejero J, Grivas GV (2016). Effects of strength training on running economy in highly trained runners: a systematic review with meta-analysis of controlled trials. J Strength Cond Res 30:2361–2368.', '10.1519/JSC.0000000000001316'],
    ['vikmoen', 'Vikmoen O, Ellefsen S, Trøen Ø, et al. (2016). Strength training improves cycling performance, fractional utilization of VO2max and cycling economy in female cyclists. Scand J Med Sci Sports 26:384–396.', '10.1111/sms.12468'],
    ['ronnestad11', 'Rønnestad BR, Hansen EA, Raastad T (2011). Strength training improves 5-min all-out performance following 185 min of cycling. Scand J Med Sci Sports 21:250–259.', '10.1111/j.1600-0838.2009.01035.x'],
    ['mujika16', 'Mujika I, Rønnestad BR, Martin DT (2016). Effects of increased muscle strength and muscle mass on endurance-cycling performance. Int J Sports Physiol Perform 11:283–289.', '10.1123/ijspp.2015-0405'],
    ['beattie', 'Beattie K, Kenny IC, Lyons M, Carson BP (2014). The effect of strength training on performance in endurance athletes. Sports Med 44:845–865.', '10.1007/s40279-014-0157-y'],
    ['lauersen', 'Lauersen JB, Bertelsen DM, Andersen LB (2014). The effectiveness of exercise interventions to prevent sports injuries: a systematic review and meta-analysis of randomised controlled trials. Br J Sports Med 48:871–877.', '10.1136/bjsports-2013-092538'],
    ['wilson', 'Wilson JM, Marin PJ, Rhea MR, et al. (2012). Concurrent training: a meta-analysis examining interference of aerobic and resistance exercises. J Strength Cond Res 26:2293–2307.', '10.1519/JSC.0b013e31823a3e2d'],
    ['gabbett', 'Gabbett TJ (2016). The training–injury prevention paradox: should athletes be training smarter and harder? Br J Sports Med 50:273–280.', '10.1136/bjsports-2015-095788'],
    ['impellizzeri', 'Impellizzeri FM, Tenan MS, Kempton T, Novak A, Coutts AJ (2020). Acute:chronic workload ratio: conceptual issues and fundamental pitfalls. Int J Sports Physiol Perform 15:907–913.', '10.1123/ijspp.2019-0864'],
    ['burke', 'Burke LM, Ross ML, Garvican-Lewis LA, et al. (2017). Low carbohydrate, high fat diet impairs exercise economy and negates the performance benefit from intensified training in elite race walkers. J Physiol 595:2785–2807.', '10.1113/JP273230'],
    ['mountjoy', 'Mountjoy M, Sundgot-Borgen JK, Burke LM, et al. (2018). IOC consensus statement on relative energy deficiency in sport (RED-S): 2018 update. Br J Sports Med 52:687–697.', '10.1136/bjsports-2018-099193'],
    ['meeusen', 'Meeusen R, Duclos M, Foster C, et al. (2013). Prevention, diagnosis, and treatment of the overtraining syndrome: joint consensus statement of the ECSS and the ACSM. Med Sci Sports Exerc 45:186–205.', '10.1249/MSS.0b013e318279a10a'],
    ['bosquet', 'Bosquet L, Montpetit J, Arvisais D, Mujika I (2007). Effects of tapering on performance: a meta-analysis. Med Sci Sports Exerc 39:1358–1365.', '10.1249/mss.0b013e31806010e0'],
    ['mujikaPadilla', 'Mujika I, Padilla S (2000). Detraining: loss of training-induced physiological and performance adaptations. Part I. Sports Med 30:79–87.', '10.2165/00007256-200030020-00002'],
    ['riegel', 'Riegel PS (1981). Athletic records and human endurance. American Scientist 69:285–290.', null]
  ];
  var NUM = {};
  REFS.forEach(function (r, i) { NUM[r[0]] = i + 1; });
  function cita() {
    var ns = Array.prototype.slice.call(arguments).map(function (k) { return NUM[k]; }).filter(Boolean);
    return " <sup class='ref'>[" + ns.join(', ') + ']</sup>';
  }
  function listaRefs() {
    return "<ol class='grefs'>" + REFS.map(function (r) {
      return '<li>' + App.esc(r[1]) + (r[2] ? " <a href='https://doi.org/" + r[2] + "' target='_blank' rel='noopener'>doi:" + r[2] + '</a>' : '') + '</li>';
    }).join('') + '</ol>';
  }
  App.guiaRefs = { cita: cita, lista: listaRefs };

  /* ---------- 21 · Qué crea a un atleta de resistencia ---------- */
  function renderGuia() {
    return U.modhead('21', 'Qué crea a un atleta de ultradistancia', 'Ultra en bici, a pie o nadando: lo que dice la fisiología, qué pesa más (calidad o cantidad) y qué significa para ti. Las cifras de tu año están en «Tu 2026»; las sesiones, en «Sesiones y semanas».') +
      U.coach('La respuesta corta', '<p>Al atleta de ultra lo crea sobre todo la <b>cantidad</b>: años de volumen fácil y constante. La <b>calidad</b> es una dosis pequeña encima, 2–3 sesiones duras por semana. Lo que lo separa de un atleta rápido en distancias cortas no es lo alto que llega su motor, sino <b>lo poco que se degrada después de horas</b>, y que puede comer, beber y decidir bien con el cuerpo cansado.</p>') +

      U.acc('Los tres números del motor y el cuarto que decide los ultras', U.coach('Fisiología básica',
        '<p>En cualquier distancia el rendimiento sale de tres cosas' + cita('joyner') + ':</p><ol>' +
        '<li><b>VO₂máx</b>: el tamaño del motor, el máximo de oxígeno que puedes usar.</li>' +
        '<li><b>Fracción utilizable</b>: qué porcentaje de ese máximo aguantas durante horas. Lo marca tu umbral.</li>' +
        '<li><b>Economía</b>: cuánta energía te cuesta cada kilómetro o cada vatio.</li></ol>' +
        '<p>Más allá de 2–3 horas aparece un cuarto factor: la <b>durabilidad</b>, cuánto se deterioran esos tres números con la fatiga' + cita('maunder') + '. Dos ciclistas con el mismo laboratorio pueden ser muy distintos a la hora 4: uno pierde el 3 % de su potencia de umbral y el otro el 15 %. Eso es lo que entrena el volumen.</p>' +
        '<p><b>En tu caso:</b> en Entre Senderos sostuviste FC 158 durante 3 h 08 con 146 W; en la Travesía entre Fincas de julio, la misma FC 158 te daba 137 W durante 2 h 32. Más trabajo, más tiempo, mismo pulso: eso es durabilidad ganada.</p>'), true) +

      U.acc('Qué construye la durabilidad', U.coach('Volumen, especificidad y tejidos',
        '<ul><li><b>Muchas horas fáciles.</b> Más mitocondrias y capilares, fibras lentas más eficaces y más grasa quemada a intensidades medias, lo que guarda glucógeno para el final.</li>' +
        '<li><b>Sesiones largas y días seguidos.</b> Enseñan a tendones, músculo e intestino a aguantar carga repetida. En ultra la especificidad pesa más que en distancias cortas: entrenar tanto tiempo como durará la prueba, en su terreno y comiendo lo que comerás.</li>' +
        '<li><b>Resistencia al daño muscular.</b> Las bajadas a pie son lo que más destruye. El músculo se adapta y cada vez sufre menos daño por kilómetro (efecto de la carga repetida); por eso las bajadas se entrenan semanas antes, no la víspera.</li>' +
        '<li><b>Fuerza.</b> Mejora la economía y la potencia al final de esfuerzos largos' + cita('ronnestad11', 'blagrove') + '. Tiene su propia pestaña.</li></ul>')) +

      U.acc('Calidad frente a cantidad: lo que dice la evidencia', U.coach('Polarizado, con poco en medio',
        '<p>Los mejores atletas de resistencia de todos los deportes hacen alrededor del <b>80 % de sus sesiones a intensidad baja</b> y el 20 % duro, con poco tiempo en la zona media' + cita('seiler') + '. En un estudio con atletas entrenados, nueve semanas de entreno polarizado mejoraron más el VO₂máx y el rendimiento que el entreno de umbral, el de alto volumen o el de sólo intervalos' + cita('stoggl') + '.</p>' +
        '<ul><li><b>El volumen</b> construye la base y la durabilidad. Es lento: se nota en meses y años.</li>' +
        '<li><b>La intensidad</b> sube el techo (VO₂máx y umbral). Bastan 2–3 sesiones por semana; los 30/15 de Rønnestad dieron más mejora que las series largas con el mismo tiempo de trabajo' + cita('ronnestad15') + '.</li>' +
        '<li><b>La zona gris</b> es la trampa amateur: todo «medio fuerte». Demasiado duro para recuperar y demasiado suave para subir el techo. Tus datos: de tus horas de bici con banda de pulso desde junio, casi tres cuartas partes fueron salidas con FC media de 135–149 y apenas un 3 % por debajo de 135; a pie es al revés, con más del 60 % fácil (detalle en «Tu 2026»).</li></ul>' +
        '<p>Para ti, con 6–12 h por semana, la receta práctica es: <b>dos días duros</b> (uno de bici con intervalos y uno de carrera o una competencia), <b>un largo</b>, y el resto suave de verdad.</p>')) +

      U.acc('Cada deporte tiene su propio límite', "<div class='gcards'>" + [
        ['Correr', 'Impacto: daño muscular, tendones y hueso. El volumen sube despacio y las cuestas se caminan.', 'Rodajes fáciles frecuentes, una tirada larga (≤ 25–30 % de la semana), cuestas y bajadas progresivas, fuerza.'],
        ['Bici', 'Casi sin impacto: se entrenan muchas más horas. Limitan la energía, los puntos de contacto (sillín, manos, lumbar) y el sueño en pruebas de días.', 'Horas en Z2, salidas de 3–6 h comiendo 60–90 g/h, intervalos cortos, posición y espalda.'],
        ['Natación', 'Frío y pérdida de calor (algo de grasa corporal ayuda), hombros, sal, medusas y comer desde un bote sin parar. La técnica pesa más que en ningún otro deporte.', 'Técnica y economía, volumen en aguas abiertas, aclimatación al frío, alimentación cada 30 min.']
      ].map(function (d) { return "<article class='gcard'><h5>" + d[0] + '</h5><p><b>Qué limita:</b> ' + d[1] + '</p><p><b>Qué se entrena:</b> ' + d[2] + '</p></article>'; }).join('') + '</div>') +

      U.acc('Lo que no se ve: intestino, cabeza, edad y genes', U.coach('Más allá de las piernas',
        '<ul><li><b>Intestino entrenable.</b> Lo que absorbes sube con práctica: de 60 a 90–120 g/h de carbohidrato mezclando glucosa y fructosa' + cita('jeukendrup') + '. Muchos ultras se pierden por el estómago, no por las piernas. El mareo de Entre Senderos es una versión pequeña de esto.</li>' +
        '<li><b>La fatiga es en buena parte central.</b> Tras unos 166 km de montaña la fuerza de las piernas cae mucho con una parte central (el sistema nervioso activa peor el músculo) y otra periférica (falla el acople dentro de la fibra)' + cita('millet') + '; casi toda la fuerza vuelve en 9 días. El cerebro regula el esfuerzo para proteger al cuerpo; por eso el ritmo, la motivación y la experiencia valen tanto.</li>' +
        '<li><b>Edad y experiencia.</b> En los 100 km los mejores tiempos llegan entre los 30 y los 49 años en hombres (30–54 en mujeres)' + cita('knechtle') + ', más tarde que en el maratón: los años de volumen y saber dosificarse compensan la caída lenta del VO₂máx.</li>' +
        '<li><b>Genética.</b> En el estudio HERITAGE, hasta cerca de la mitad (estimación máxima del 47 %) de cuánto sube el VO₂máx con el entreno se hereda' + cita('bouchard') + '. Pero la durabilidad, la economía y la tolerancia a la incomodidad son muy entrenables.</li></ul>')) +

      U.acc('Referencias', listaRefs() + '<small>Comprobadas en PubMed o en la página de la revista. Son resúmenes de literatura, no una prescripción médica.</small>');
  }

  /* ---------- 22 · Fuerza de piernas: ¿garantiza resultados? ---------- */
  function renderFuerza() {
    var filas = [
      ['«Piernas más fuertes = más rápido»', "<span class='wrap'>Sí, pero por la economía, no por el motor. La fuerza pesada o explosiva mejora la economía de carrera y el rendimiento en contrarreloj sin cambiar el VO₂máx" + cita('blagrove', 'balsalobre', 'storen', 'paavolainen') + '. En bici mejora la economía y la potencia al final de salidas largas' + cita('vikmoen', 'ronnestad11') + '.</span>', '<b>Cierto con condiciones</b>'],
      ['«La fuerza te da resistencia al lactato»', "<span class='wrap'>No en el sentido de «aguantar más ácido». Lo que pasa es que con más fuerza cada pedalada o zancada usa un porcentaje menor de tu máximo, reclutas menos fibras rápidas y produces menos lactato al mismo ritmo. En ciclistas mejoró la fracción utilizable del VO₂máx" + cita('vikmoen') + '.</span>', '<b>Medio cierto</b>: el mecanismo es otro'],
      ['«Sentadilla pesada = rodillas a prueba de todo»', "<span class='wrap'>El entreno de fuerza redujo las lesiones deportivas a menos de un tercio en un metaanálisis de ensayos; los estiramientos no tuvieron efecto" + cita('lauersen') + '. Reduce el riesgo, no lo elimina: un salto brusco de volumen lesiona igual.</span>', '<b>Ayuda, no garantiza</b>'],
      ['«Las pesas te hacen pesado para subir»', "<span class='wrap'>En corredores, ocho semanas de sentadilla pesada subieron la fuerza un 33 % sin cambiar el peso corporal" + cita('storen') + '; en ciclistas el cuádriceps creció algo y aun así mejoró el rendimiento' + cita('vikmoen') + '. Sólo resta en subidas si la masa sube más que la potencia (es física de vatios por kilo), lo que pasa con volumen de culturismo al fallo y comiendo para ganar peso.</span>', '<b>Mito en la práctica</b>'],
      ['«Con circuitos de peso corporal basta»', "<span class='wrap'>Las mejoras de economía vienen de cargas altas (≥ 80–85 % del máximo, 3–6 repeticiones) o de saltos explosivos" + cita('ronnestadMujika', 'beattie') + '. Las series largas de 20–30 repeticiones mejoran poco la fuerza máxima. En Charlotte, sin pesas, la salida es pierna a pierna con mochila y saltos.</span>', '<b>Falso para rendimiento</b>; útil para mantener'],
      ['«Pesas y resistencia se estorban»', "<span class='wrap'>La interferencia existe sobre todo en la fuerza y la potencia, y la provoca más la carrera que la bici" + cita('wilson') + '. Se minimiza separando 6 h o más las sesiones, poniendo las pesas tras el entreno duro del mismo día y no al revés.</span>', '<b>Cierto pero manejable</b>'],
      ['«Más fuerza sustituye kilómetros»', "<span class='wrap'>No. La fuerza mejora la economía un 2–8 %; los años de volumen aeróbico explican la mayor parte del rendimiento de resistencia" + cita('joyner', 'beattie') + '.</span>', '<b>Falso</b>']
    ];
    return U.modhead('22', 'Fuerza de piernas: ¿garantiza resultados?', 'Lo que repiten atletas e influencers sobre la fuerza, contrastado con los estudios y con lo que suele aconsejar la comunidad.') +
      U.coach('Veredicto', '<p><b>No garantiza nada por sí sola, pero es la mejora más barata que te queda.</b> Dos sesiones por semana de fuerza <i>pesada</i> o explosiva durante 8–12 semanas mejoran la economía de carrera alrededor de un 2–8 %, la potencia al final de salidas de 3 h y reducen el riesgo de lesión. No sube tu VO₂máx ni sustituye las horas. El matiz que se pierde en redes: tiene que ser <b>pesada</b> (pocas repeticiones, sin llegar al fallo), no circuitos de quemazón.</p>') +
      "<div class='gcards'>" + filas.map(function (f) {
        return "<article class='gcard'><h5>" + f[0] + "</h5><span class='ver'>" + f[2] + '</span><p>' + f[1] + '</p></article>';
      }).join('') + '</div>' +

      U.acc('Lo que suele aconsejar la comunidad (y qué tan bien sale parado)', U.coach('Paráfrasis de consejos frecuentes en r/Velo, r/AdvancedRunning, r/ultrarunning y r/cycling',
        '<ul><li><b>«Corre más, rueda más: el volumen es el rey.»</b> Coincide con la evidencia (Seiler, Joyner). Lo que se omite: el volumen sube despacio, sobre todo a pie.</li>' +
        '<li><b>«Fácil fácil, duro duro.»</b> Es el modelo polarizado. Es el consejo con más respaldo de todos.</li>' +
        '<li><b>«Levanta pesado dos veces por semana, pocas repeticiones, sin fallo.»</b> Coincide con Rønnestad y Mujika (2014) y Blagrove (2018).</li>' +
        '<li><b>«Come en la bici antes de tener hambre.»</b> Coincide con Jeukendrup. En ultras es casi una ley.</li>' +
        '<li><b>«Camina las subidas empinadas en trail.»</b> Sensato: en pendientes fuertes caminar cuesta casi lo mismo que trotar y ahorra piernas para las bajadas.</li>' +
        '<li><b>«La zona 2 es mágica.»</b> Exagerado. La zona 2 construye la base, pero sin algo de intensidad el techo no sube; y la «zona 2» de una aplicación sin prueba de umbral puede ser cualquier cosa.</li>' +
        '<li><b>«Haz el doble umbral noruego.»</b> Funciona en élites que miden lactato en cada serie. Copiado a ojo por un amateur con trabajo y familia suele acabar en zona gris crónica.</li></ul>' +
        '<p><small>Son resúmenes de temas que se repiten en esas comunidades, no citas textuales. Úsalos como pistas; lo que manda es la evidencia y tu propio registro.</small></p>')) +

      U.acc('Cómo hacerlo bien (con pesas y sin pesas)', U.coach('Dosis mínima eficaz',
        '<p><b>Con pesas (Retalhuleu y desde el 14 ene):</b> 2 sesiones por semana en la fase de base, 1 para mantener en semanas de carreras: sin mantenimiento, lo ganado se pierde en la temporada' + cita('mujika16') + '.</p>' +
        '<ul><li>Sentadilla o prensa: 4 × 4–6 pesada (te sobran 1–2 repeticiones).</li>' +
        '<li>Peso muerto rumano o hip thrust: 3 × 6.</li>' +
        '<li>Subida al cajón o zancada búlgara: 3 × 6 por pierna.</li>' +
        '<li>Elevación de talones con rodilla recta y doblada: 3 × 10–12 (tendón de Aquiles y sóleo).</li>' +
        '<li>Saltos: 3 × 5 saltos al cajón o a pies juntos, máximos y con descanso completo.</li></ul>' +
        '<p><b>Sin pesas (Charlotte):</b> pierna a pierna con mochila de 8–15 kg (zancada búlgara, peso muerto a una pierna, subida a una silla o un banco), sentadilla isométrica en la pared 3 × 45 s, saltos y sprints en cuesta de 8–10 s. Mantiene la fuerza ganada durante semanas.</p>' +
        '<p><b>Cuándo:</b> el mismo día que la sesión dura, después de ella y con 6 h o más de separación si puedes. Nunca la víspera de una sesión clave o de una carrera, ni pierna pesada 72 h antes de una competencia.</p>')) +
      U.acc('Referencias', listaRefs());
  }

  /* ---------- 23 · Trampas: parece bueno, pero no lo es ---------- */
  var TRAMPAS = [
    ['Rodar «con ritmo» todos los días', 'Te sientes fuerte y cada salida da buenos números en Strava.', 'Sin días suaves de verdad, el cansancio tapa la forma y no hay días frescos para que los intervalos sean intensos de verdad. Es la zona gris.', 'En el bloque del 26 oct al 10 nov casi todas las salidas tuvieron FC media de 140–148; la Candelaria del 6 nov salió a 17,3 km/h cansado.', 'seiler'],
    ['Multiplicar la carga porque las piernas responden', 'Subes de 1–4 h de bici por semana a 20 h y no pasa nada.', 'El corazón y los pulmones se adaptan en semanas; tendones, huesos y sistema hormonal tardan meses. Los saltos bruscos de carga se asocian con más lesiones y sobreentrenamiento (aunque el cociente agudo:crónico exacto tiene críticas fuertes).', 'Semana del 19 oct: 1,3 h de bici; semana del 26 oct: unas 20 h. Salió bien, pero fue una apuesta.', 'gabbett', 'impellizzeri', 'meeusen'],
    ['Competir casi cada fin de semana', 'Cada carrera es una sesión de calidad con ambiente.', 'Cada carrera se come el día anterior (víspera) y 2–3 días después. Con 2–3 eventos al mes no queda espacio para bloques de construcción.', 'Unos 25 eventos en 2026; en noviembre, Campanabaj, Entre Senderos, Guatemágica y Sibaná en 15 días.', 'meeusen'],
    ['«Recuperación activa» que no es suave', 'Al día siguiente de la carrera sales «a soltar».', 'Si la FC media pasa de ~130 ya no es recuperación: es otra sesión media, y los músculos necesitan 48–72 h tras una carrera de 3 h.', '16 nov: Candelaria a 17,3 km/h (esfuerzo relativo 142); 17 nov: FC 148 con 118 W.', 'meeusen'],
    ['Bajar la cintura durante el bloque más duro', 'Comes menos, pesas menos y subes mejor.', 'Con poca energía disponible bajan las hormonas, el hueso, la inmunidad y la calidad del entreno (RED-S). Las dietas bajas en carbohidrato empeoran la economía en sesiones intensas.', 'El déficit de −500 kcal siguió hasta el 15 nov, en pleno bloque fuerte y con la carrera.', 'mountjoy', 'burke'],
    ['Comer poco en carrera para no perder tiempo', 'Sin paradas ganas minutos.', 'A 3 h de intensidad alta gastas 1.500–1.700 kcal, sobre todo de carbohidrato. Lo que ganas sin parar lo pierdes en la última hora, o con mareo.', 'Entre Senderos: 3 min detenido en 3 h 11 y mareo.', 'jeukendrup'],
    ['Pesas al fallo y con quemazón', 'Terminas reventado y sientes que trabajaste.', 'Para un atleta de resistencia la fatiga extra roba la sesión siguiente y no mejora más la fuerza que series pesadas sin fallo.', 'Pierna el 12 nov a tres días de Entre Senderos: corto y sin fallo, bien hecho.', 'ronnestadMujika'],
    ['Subir los kilómetros a pie porque el corazón aguanta', 'El pulso a 125 te dice que vas sobrado.', 'El sistema cardiovascular se adapta más rápido que el tendón y el hueso. El pie golpeado el 20 oct es el recordatorio.', 'La tirada más larga desde el 16 oct es de 6 km y el sábado son 15.', 'lauersen'],
    ['La racha a cualquier precio', 'Mantener #streak365 da disciplina.', 'La milla mínima es inocua salvo con lesión o fiebre: entonces el riesgo es convertir algo pequeño en algo largo.', 'La milla del 21 oct casi sin poder apoyar.', 'meeusen'],
    ['Fiarse de los vatios de Strava y de la FC media en MTB', 'El número sale en la pantalla, parece preciso.', 'Sin potenciómetro los vatios son una estimación con peso, velocidad y pendiente: en MTB el error es grande. La FC media de una salida con picos de 190 esconde mucho tiempo duro.', 'Las MTB de octubre y noviembre muestran 100–170 W «estimados».', null],
    ['Copiar el entreno de un profesional', 'Si funciona para él, funciona para mí.', 'Un profesional duerme, come y recupera como trabajo. Tu vida tiene trabajo con horario de Utah, familia, colegio y vuelos.', 'Mejor 8–10 h bien repartidas que 15 h a medias.', 'seiler'],
    ['Entrenar fuerte la semana de la carrera por miedo a perder forma', 'Una última sesión dura «para llegar a tope».', 'La forma no se pierde en 10 días. Bajar el volumen un 40–60 % de forma progresiva durante unas dos semanas, manteniendo la intensidad y la frecuencia, mejora el rendimiento.', 'Lo hiciste bien antes de Entre Senderos y la carrera salió.', 'bosquet', 'mujikaPadilla']
  ];
  function renderTrampas() {
    return U.modhead('23', 'Trampas: parece bueno, pero no lo es', 'Decisiones que se sienten como progreso y terminan costando forma, salud o una carrera. Con el ejemplo de tu propio año cuando lo hay.') +
      TRAMPAS.map(function (t, i) {
        var refs = t.slice(5).filter(Boolean);
        return U.acc((i + 1) + '. ' + t[0], '<p><b>Por qué parece buena idea:</b> ' + App.esc(t[1]) + '</p>' +
          '<p><b>Por qué sale mal:</b> ' + App.esc(t[2]) + (refs.length ? cita.apply(null, refs) : '') + '</p>' +
          U.note('En tus datos', App.esc(t[3]), 'warn'), i === 0);
      }).join('') +
      U.note('La señal de alarma más útil', 'Si el pulso de tus trotes fáciles sube 10 o más pulsaciones al mismo ritmo durante 3 días, o duermes mal y no tienes ganas de entrenar, toca un día suave o de descanso, aunque el plan diga otra cosa. Es lo que pasó del 5 nov (FC 140) al 12 nov (FC 125) tras bajar la carga.' + cita('meeusen'), 'ok') +
      U.acc('Referencias', listaRefs());
  }

  App.mods.push({ id: 'guia', nom: 'Ciencia del ultra', tab: 'Ciencia', icono: 'M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z', render: renderGuia });
  App.mods.push({ id: 'fuerza', nom: 'Fuerza de piernas', tab: 'Fuerza', icono: 'M4 10v4M8 7v10M16 7v10M20 10v4M8 12h8', render: renderFuerza });
  App.mods.push({ id: 'trampas', nom: 'Trampas', tab: 'Trampas', icono: 'M12 3l10 18H2zM12 10v5M12 18v.5', render: renderTrampas });
})(this);
