/* ciencia.js — Módulo 7: ultradistancia, lactato, suplementos y comida (con tus gustos). Texto con evidencia, sin enlaces inventados. */
(function (global) {
  'use strict';
  var App = global.App, U = App.ui;
  var C = function (t, h) { return U.coach(t, h); };

  function render() {
    return U.modhead('7', 'Ciencia, suplementos y comida', 'Lo que dice la evidencia sobre lactato y ultradistancia, qué de tu gabinete vale la pena y cómo aprovechar lo que te gusta comer sin pagar la cintura.') +
      U.note('Honestidad', 'Resumen de literatura (Brooks, Seiler, Jeukendrup, Burke, Maunder y otros). Son principios, no una prescripción médica; las cifras individuales (umbrales, dosis) se verifican con tus propios datos o una prueba de lactato.', 'warn') +

      U.acc('Lactato: qué es y qué no es', C('Combustible, no veneno',
        '<p>El lactato no causa la fatiga ni las agujetas: es un combustible que músculos, corazón y cerebro reutilizan («lanzadera del lactato», Brooks). Sirve como <b>indicador</b> de intensidad.</p>' +
        '<p><b>LT1</b> (primer umbral, ~2 mmol/L): el lactato empieza a subir; por debajo vive el trabajo fácil. <b>LT2/MLSS</b> (~4 mmol/L, aproximado y muy individual): la mayor intensidad que se sostiene en equilibrio, unos 30–60 min.</p>' +
        '<p><b>Sin laboratorio:</b> LT1 ≈ el ritmo en que aún hablas frases completas (~Z2). LT2 ≈ tu FC media de los últimos 20 min de una prueba de 30 min a tope (test de Friel). Antes de subir la intensidad, comprueba que la base esté: eficiencia aeróbica y deriva de FC te lo dicen.</p>'), true) +

      U.acc('Cómo se entrena el lactato y la resistencia', C('Lo que sí tiene evidencia',
        '<p><b>Polarizado (Seiler):</b> ~80 % fácil, ~20 % duro, poco en medio. Para tu nivel (VDOT ~37) y 5–6 sesiones, lo duro son 1–2 días de umbral o intervalos, no cinco.</p>' +
        '<p><b>Umbral:</b> 2–3 × 10 min a ritmo de ~LT2 con 2 min de pausa, o tempo continuo de 20–30 min. El modelo noruego de doble umbral funciona en élites que miden lactato; sin medirlo, copiarlo es receta de sobreentreno.</p>' +
        '<p><b>Ultra:</b> la <i>durabilidad</i> (cuánto tarda en degradarse tu economía tras horas de esfuerzo) se entrena con largos progresivos, series al final del largo y mucha cuesta. En descenso hay daño muscular: entrena bajadas progresivas semanas antes, no la semana previa a la carrera.</p>' +
        '<p><b>Fuerza:</b> 2 sesiones por semana mejoran la economía de carrera (~2–4 % en metaanálisis); por eso las rutinas A/B/C del plan.</p>' +
        '<p><b>Calor:</b> 10–14 días de aclimatación bajan la FC y mejoran el rendimiento; en Retalhuleu ya tienes ventaja, pero hidrata con sodio.</p>')) +

      U.acc('Combustible en carrera y entrenos largos', C('Cuánto, qué y cuándo',
        '<p><b>Carbohidrato:</b> 30–60 g/h hasta ~2 h; 60–90 g/h en esfuerzos más largos con mezcla glucosa:fructosa 2:1 (Jeukendrup). Para la Guatemágica, 60 g/h es razonable <b>si entrenas el intestino</b>: sube 10 g/h por semana en los largos.</p>' +
        '<p><b>Líquidos y sodio:</b> 400–800 mL/h según calor; 300–600 mg de sodio por litro. No bebas «de más»: la hiponatremia existe.</p>' +
        '<p><b>Cafeína:</b> ~3 mg/kg (≈200 mg) 45–60 min antes mejora el rendimiento; pruébala en entrenos, no el día de carrera. Último café a las 14:00 si entrenas de noche.</p>' +
        '<p><b>Recuperación:</b> 1,2 g/kg de carbohidrato + 0,3 g/kg de proteína en las 2 h siguientes si vuelves a entrenar en menos de 12 h; si no, el plato normal basta.</p>')) +

      U.acc('Tus suplementos, uno por uno', C('Qué sí, qué quizá y qué no',
        '<ul>' +
        '<li><b>Creatina monohidrato (3–5 g/día):</b> el suplemento con más evidencia. Sube fuerza y masa magra. Retiene 1–2 kg de agua al inicio (el peso sube, la cintura no). Tu producto mezcla monohidrato, citrato y quelato de magnesio: el monohidrato solo basta; revisa que la dosis total llegue a 3–5 g.</li>' +
        '<li><b>Magnesio bisglicinato:</b> útil si tu dieta es baja en magnesio o tienes calambres o sueño ligero; la evidencia de rendimiento es modesta. 200–400 mg de magnesio elemental, de noche.</li>' +
        '<li><b>Omega-3 (fish oil 1.200 mg con 360 mg de omega-3):</b> cada cápsula aporta unos 360 mg de EPA+DHA; las dosis estudiadas son 1–2 g/día, o sea 3–5 cápsulas. Con una sola no esperes efecto; comer pescado 2 veces por semana (sardina, atún, mojarra) lo cubre mejor.</li>' +
        '<li><b>Colágeno + vitamina C + glucosamina/condroitina (Artrosil):</b> 10–15 g de colágeno con vitamina C 45–60 min antes de saltar o entrenar fuerza tiene respaldo preliminar para tendón; glucosamina/condroitina tienen evidencia débil para el dolor articular. No dañan; no hacen milagros.</li>' +
        '<li><b>Cromo picolinato:</b> no mejora composición corporal ni glucosa en personas sanas. Es el que quitaría.</li>' +
        '<li><b>Proteína en polvo:</b> sólo comodidad: úsala para llegar a tus gramos (≈140–170 g/día) cuando la comida no alcance, sin azúcar añadida.</li>' +
        '<li><b>Liquid I.V.:</b> sodio + azúcar + potasio; sirve en entrenos largos con calor. Para entrenos de menos de 60 min es agua cara.</li>' +
        '</ul>' +
        '<p><small>Busca sello de terceros (Informed Sport / NSF). Consulta con un médico o dietista si tomas medicinas o tienes dolencias.</small></p>')) +

      U.acc('Tus comidas favoritas: mejorarlas, no prohibirlas', C('Cambios que no se sienten como dieta',
        '<p>Lo que cuenta es <b>frecuencia y porción</b>: lo frito y dulce, de gusto, 1–2 veces por semana; el resto, versiones más ligeras.</p>' +
        '<ul>' +
        '<li><b>Pollo frito, cordon bleu, extra crujiente:</b> pollo al horno o a la plancha con la misma sazón, empanizado de avena o pan molido; el frito queda para un día fuerte.</li>' +
        '<li><b>Chicharrones, cerdo frito, tocino:</b> carne asada o lomito en lugar de fritura; el chicharrón como condimento (un puñito), no como plato.</li>' +
        '<li><b>Hígado, mollejas, sardina, atún, mojarra:</b> son buenas (proteína, hierro, omega-3). Hígado 1 vez por semana; pescado al horno o a la plancha en vez de frito.</li>' +
        '<li><b>Pastas, ramen, lasaña, cavatini, chow mein:</b> con el doble de verdura, pollo y media porción de pasta; úsalas el día largo o la víspera de un entreno fuerte.</li>' +
        '<li><b>Pan dulce, rol de canela, pastel, helado, choco krispies:</b> el dulce tiene su hora: <i>después del entreno largo</i>, con proteína (leche o yogur), no al azar. Una porción: un pan o una bola.</li>' +
        '<li><b>Gatorade, bebidas de sabor, frescos de fruta, gaseosa:</b> sólo en entrenos de más de 75 min o en carrera; el resto del tiempo, agua con limón o fresco sin azúcar.</li>' +
        '<li><b>Cerveza, vino, whisky, ron:</b> alcohol y déficit pelean: frena la recuperación y el sueño. Máximo 1–2 por semana y nunca la víspera de un entreno clave.</li>' +
        '<li><b>Panqueques, hamburguesa, panini, tacos, birria, garnachas:</b> hamburguesa con ensalada y sin papas; panqueques con huevo, avena y banano (más proteína); tacos con tortilla de maíz y más verdura, sin freír.</li>' +
        '<li><b>Mole, pepián, jocón, arroz amarillo, cena chapina:</b> tus mejores aliados, con porción controlada de tortilla o arroz; la cena chapina (huevos, frijol, plátano, queso) es casi un plato de recuperación perfecto.</li>' +
        '<li><b>Mango, melón, sandía, pepino, limón, aguacate, huevos, queso fresco:</b> ya están de tu lado. Crema y queso Kraft, con medida.</li>' +
        '<li><b>Café con leche sin azúcar:</b> bien. La cremora no aporta nada; la leche sí aporta proteína.</li>' +
        '</ul>' +
        '<p><b>Regla 80/20:</b> 5 de cada 6 comidas con proteína y verdura; 1 de cada 6 «de las que te gustan», con porción medida.</p>')) +

      U.acc('Qué cambiaría ya', C('Resumen accionable',
        '<ol><li>Fija el 80/20: dos días duros como máximo; lo demás, fácil de verdad.</li>' +
        '<li>Largos con 60 g/h de carbohidrato e hidratación con sodio; entrena el intestino.</li>' +
        '<li>Creatina 3–5 g diarios, omega-3 en dosis real o pescado 2 veces por semana, magnesio de noche; descarta el cromo.</li>' +
        '<li>Registra lo que comes (módulo Registro) y compáralo con el plan semanal.</li>' +
        '<li>Retest cada 4–6 semanas: un 5 K de prueba o 30 min a tope para ver la FC de umbral.</li></ol>'));
  }

  App.mods.push({ id: 'ciencia', nom: 'Ciencia', tab: 'Ciencia', icono: 'M9 3h6M10 3v6L5 19a2 2 0 002 3h10a2 2 0 002-3l-5-10V3', render: render });
})(this);
