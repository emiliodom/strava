/* cuerpo.js — Módulo 6: escáner corporal 360 (medidas + fotos con cara difuminada) y plan de composición. */
(function (global) {
  'use strict';
  var App = global.App, U = App.ui, F = App.fmt, esc = App.esc;
  var MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  var fechaLarga = function (d) { return d.getDate() + ' ' + MES[d.getMonth()] + ' ' + d.getFullYear(); };

  /* ---------- cálculos (todas son estimaciones) ---------- */
  function analizar(m) {
    var kg = m.weight, cm = m.height, imc = kg / Math.pow(cm / 100, 2);
    var sexo = m.gender === 'male' ? 0 : 1, edad = m.age;
    // CUN-BAE (Gómez-Ambrosi 2012) y Deurenberg (1991): % de grasa a partir de IMC, edad y sexo
    var cun = -44.988 + 0.503 * edad + 10.689 * sexo + 3.172 * imc - 0.026 * imc * imc + 0.181 * imc * sexo -
      0.02 * imc * edad - 0.005 * imc * imc * sexo + 0.00021 * imc * imc * edad;
    var deu = 1.2 * imc + 0.23 * edad - 10.8 * (1 - sexo) - 5.4;
    var grasa = (cun + deu) / 2, magra = kg * (1 - grasa / 100);
    var bmr = 10 * kg + 6.25 * cm - 5 * edad + (sexo ? -161 : 5);       // Mifflin–St Jeor
    return {
      kg: kg, cm: cm, imc: imc, grasa: grasa, grasaMin: Math.min(cun, deu), grasaMax: Math.max(cun, deu), magra: magra,
      cintura: m.waist, whtr: m.waist / cm, cinturaPecho: m.waist / m.chest, brazo: m.bicep, muslo: m.hamstring,
      bmr: bmr, tdee: bmr * 1.55,                                         // ×1,55: ~1 h diaria de entrenamiento
      pesoParaGrasa: function (g) { return magra / (1 - g / 100); }
    };
  }

  function galeria(e) {
    var fotos = e.fotos.map(function (f, i) {
      return "<figure style='margin:0;flex:0 0 min(70%,15rem);scroll-snap-align:start'>" +
        "<img src='" + esc(f.f) + "' loading='lazy' alt='Escaneo " + esc(e.fecha) + ', ' + esc(f.vista) +
        "' style='width:100%;border-radius:var(--pico-border-radius)'>" +
        '<figcaption><small>' + (i + 1) + ' · ' + esc(f.vista) + '</small></figcaption></figure>';
    }).join('');
    return "<div style='display:flex;gap:.75rem;overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:.5rem'>" + fotos + '</div>';
  }

  function render(D) {
    var B = global.__BODY360__, atleta = B && Object.keys(B)[0], e = atleta && B[atleta][B[atleta].length - 1];
    var cab = U.modhead('6', 'Cuerpo 360', 'Un escáner experimental: tus medidas y fotos convertidos en un plan que une entrenamiento, comida guatemalteca, sueño y estrés.');
    if (!e) {
      return cab + U.note('Aún no hay escaneo', 'Coloca las fotos y <code>measurements.txt</code> en <code>data/body360/&lt;atleta&gt;/&lt;fecha&gt;/</code> y ejecuta <code>python connector/body360.py</code>. Las fotos quedan en tu equipo y la cara se difumina antes de mostrarlas.', 'warn');
    }
    var A = analizar(e.medidas), hoy = new Date(2026, 9, 6), carrera = new Date(2026, 10, 21);
    var diasCarrera = Math.round((carrera - hoy) / 864e5);
    var meta = A.pesoParaGrasa(17), meta15 = A.pesoParaGrasa(15), cinturaMeta = A.cm * 0.5;
    var cinturaCm = A.cintura;                               // body360.py ya convierte pulgadas a cm

    var rutas = [
      { n: 'Camino normal', ini: hoy, def: 400, prot: 1.8, nota: 'Déficit moderado; sostenible durante meses sin dañar el rendimiento.' },
      { n: 'Camino brutal', ini: new Date(carrera.getTime() + 3 * 864e5), def: 750, prot: 2.2, nota: 'Cerca del 1 % del peso por semana: el tope razonable. Dos días de mantenimiento y fecha de fin fija.' }
    ].map(function (r) {
      var porSem = r.def * 7 / 7700, sem = Math.ceil((A.kg - meta) / porSem);
      var fin = new Date(r.ini.getTime() + (sem * 7 + 7) * 864e5);
      return [esc(r.n), F.num(A.tdee - r.def, 0) + ' kcal', F.num(r.prot * A.kg, 0) + ' g', '−' + F.num(porSem, 2) + ' kg',
        sem + ' sem · ' + fechaLarga(fin), esc(r.nota)];
    });

    var nivel = A.whtr >= 0.6 ? 'bad' : A.whtr >= 0.5 ? 'warn' : 'ok';
    return cab +
      U.kpis([
        U.kpi('IMC', F.num(A.imc, 1), 'sobrepeso leve (25–30)', 'warn'),
        U.kpi('Cintura / talla', F.num(A.whtr, 2), 'meta: menos de 0,50', nivel),
        U.kpi('Grasa estimada', F.num(A.grasa, 0) + '%', 'rango ' + F.num(A.grasaMin, 0) + '–' + F.num(A.grasaMax, 0) + '%'),
        U.kpi('Masa magra', F.num(A.magra, 1) + ' kg', 'lo que hay que proteger')
      ]) +
      U.note('Qué significan los números',
        'Con ' + F.num(cinturaCm, 0) + ' cm de cintura para ' + F.num(A.cm, 0) + ' cm de estatura estás en ' + F.num(A.whtr, 2) +
        ': por encima de 0,5 sube el riesgo cardiometabólico aunque el peso parezca normal. Es la medida que más conviene bajar. ' +
        'Meta concreta: <b>' + F.num(cinturaMeta, 0) + ' cm de cintura</b> (' + F.num(cinturaCm - cinturaMeta, 0) + ' cm menos), unos <b>' +
        F.num(meta, 0) + ' kg</b> con la masa magra intacta.', nivel) +
      U.note('Honestidad sobre el método',
        'El % de grasa sale de fórmulas (CUN-BAE y Deurenberg) con IMC, edad y sexo: error típico de ±4 puntos, no es una densitometría. ' +
        'Úsalo como brújula y compárate <i>contigo mismo</i> cada 4 semanas, con la misma cinta y las mismas fotos. No sustituye a un médico.', 'warn') +

      '<h3>Tus fotos · ' + esc(fechaLarga(new Date(e.fecha + 'T12:00:00'))) + '</h3>' + galeria(e) +
      U.note('Lo que se ve y lo que falta',
        'Cintura y vientre miden lo mismo (37 in) y la relación cintura/pecho es ' + F.num(A.cinturaPecho, 2) + ' (un torso atlético ronda 0,80): ' +
        'el cambio pendiente es de composición, no de falta de entrenamiento. Para que la próxima comparación valga: en ayunas, solo ropa interior, luz frontal, ' +
        'cámara a la altura del ombligo a 2 m, cuatro vistas (frente, ambos perfiles, espalda) y cinta a la altura del ombligo exhalando. ' +
        'Estas fotos mezclan pantalón, ropa interior y lentes distintos: sirven de línea base, no de comparación exacta.', 'ok') +
      U.note('Privacidad',
        'La cara se difumina con pixelado grueso más desenfoque (no es reversible) y se borran los metadatos GPS. Las fotos y <code>body360.js</code> están en <code>.gitignore</code>: no se suben al repositorio.', 'ok') +

      '<h3>Dos caminos para la misma meta</h3>' +
      U.tabla([{ t: 'Ruta' }, { t: 'Comer', n: 1 }, { t: 'Proteína', n: 1 }, { t: 'Por semana', n: 1 }, { t: 'Llegas a ' + F.num(meta, 0) + ' kg' }, { t: 'Cómo' }], rutas,
        { pie: 'Gasto estimado ' + F.num(A.tdee, 0) + ' kcal/día (Mifflin–St Jeor ×1,55); 7.700 kcal ≈ 1 kg de grasa. Con 17 % de grasa pesarías ' + F.num(meta, 1) + ' kg y con 15 %, ' + F.num(meta15, 1) + ' kg.' }) +
      U.note('Faltan ' + diasCarrera + ' días para la Guatemágica',
        'Hasta el 21 de noviembre, <b>sólo el camino normal</b> y con no más de −300 kcal: un déficit fuerte justo antes de tu carrera principal baja la calidad de los entrenos clave y sube el riesgo de lesión. ' +
        'El camino brutal empieza el lunes siguiente a la carrera. En ambos, sin déficit la semana de carrera ni los dos días después.', 'warn') +

      U.acc('Comer bien en Guatemala', U.coach('El plato base',
        '<p><b>½ plato</b> de verdura (güisquil, ejotes, brócoli, chipilín, hierbamora, tomate), <b>¼</b> de proteína (huevo, pollo, pescado, res magra, frijol), <b>¼</b> de carbohidrato (2 tortillas, arroz, plátano, camote o papa).</p>' +
        '<p><b>Lo que ya ayuda:</b> frijol (proteína y fibra), tortilla de maíz, huevo con tomate, caldo de gallina o res, pollo en pepián o jocón con poca grasa, media pieza de aguacate, papaya y piña de postre, atol de avena sin azúcar.</p>' +
        '<p><b>Lo que más pesa en la cintura:</b> gaseosas y jugos azucarados (un litro ≈ 400 kcal líquidas), pan dulce y pan francés en cantidad, fritanga y chicharrón, el cafecito con tres cucharadas de azúcar y la cerveza del fin de semana. Cámbialos por agua o café sin azúcar y deja el tamal para el sábado.</p>' +
        '<p><b>Alrededor del entreno:</b> antes, banano con pan o tortilla con frijol; después, huevos con frijol y tortilla o pollo con arroz. Ahí van los carbohidratos; el resto del día, menos.</p>' +
        '<p><b>Proteína:</b> en 4 tomas de 30–40 g (' + F.num(1.8 * A.kg, 0) + '–' + F.num(2.2 * A.kg, 0) + ' g al día). Un huevo ≈ 6 g, una pechuga mediana ≈ 40 g, una taza de frijoles ≈ 15 g, un vaso de leche ≈ 8 g.</p>' +
        '<p><b>Calor y sodio:</b> en Retalhuleu sudarás mucho; en los entrenos largos agrega electrolitos o sal al agua.</p>'), true) +

      U.acc('Sueño', U.coach('Dormir es parte del plan',
        '<p>Dormir poco sube el apetito por azúcar y grasa y, en déficit, hace que pierdas más músculo y menos grasa. Meta: <b>7,5–9 h</b> y hora de levantarte fija, también sábado y domingo.</p>' +
        '<p>Último café a las 14:00. Cena ligera 2–3 h antes de dormir. Cuarto oscuro y fresco; sin pantallas 30 min antes. Si entrenas de madrugada, acuéstate antes en vez de recortar horas. Una siesta de 20 min antes de las 16:00 ayuda sin robarle a la noche.</p>')) +

      U.acc('Estrés', U.coach('Entrenar todos los días también es estrés',
        '<p>Llevas una racha de ' + F.num(D.habitos.maxRachaSinDescanso, 0) + ' días sin descansar. Pon <b>un día de descanso real por semana</b>, sin sesión «suave» escondida.</p>' +
        '<p>Respiración 4-6 (inhalar 4 s, exhalar 6 s) 5 min al acostarte; caminar 10 min después de comer; una hora al día sin teléfono; hablar de lo que preocupa antes de que se vuelva comida de madrugada. Si el estrés o la ansiedad te desbordan, un psicólogo es parte del entrenamiento.</p>')) +

      U.acc('Fuerza: lo que más cambia la silueta', U.coach('Dos o tres sesiones a la semana',
        '<p>Si bajas peso sin fuerza pierdes músculo junto con la grasa. Dos sesiones de 40 min: sentadilla o prensa, peso muerto rumano, remo, press, plancha y cargas de campesino. Tu brazo (' + F.num(A.brazo, 0) + ' cm) y tu muslo (' + F.num(A.muslo, 0) + ' cm) deberían mantenerse o subir mientras la cintura baja: esa es la señal de que vas bien.</p>' +
        '<p>En el camino brutal, tres sesiones y los días de mantenimiento calórico en las semanas de más carga.</p>'));
  }

  App.mods.push({ id: 'cuerpo', nom: 'Cuerpo 360', tab: 'Cuerpo', icono: 'M12 4a2 2 0 100 4 2 2 0 000-4zM8 21l1.5-8L7 11l5-2 5 2-2.5 2L16 21', render: render });
})(this);
