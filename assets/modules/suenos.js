/* suenos.js — Módulo 4: los cuatro sueños y su hoja de ruta. */
(function (global) {
  'use strict';
  var App = global.App, U = App.ui, C = App.chart, F = App.fmt, M = App.metrics, h = App.h, raw = App.raw, esc = App.esc;

  function barraProgreso(pct, color) {
    return C.hbars([{ label: '', v: Math.min(pct, 100), color: color || 'var(--accent)', text: F.pct(Math.min(pct, 100), 0) }], { max: 100 });
  }

  function render(D) {
    var largoRun = Math.max.apply(null, D.runs.map(function (a) { return a.km; }).concat([0]));
    var b = D.bici, v0 = D.vdot;

    var p42 = M.predecir(v0, 42195, largoRun);
    var p42listo = M.predecir(v0, 42195, 32);

    var suenos = [
      {
        id: 'maraton', nom: 'Maratón', icono: '42,195 km',
        tengo: largoRun, necesito: 32, unidad: 'km de salida más larga',
        pct: 100 * largoRun / 32,
        estado: largoRun >= 32 ? 'ok' : largoRun >= 20 ? 'warn' : 'bad',
        plazo: 'Realista: 12 a 18 meses',
        resumen: 'Con tu VDOT de ' + F.num(v0, 1) + ' la fórmula dice ' + F.hms(p42listo.real, true) +
          ', pero eso presupone largos de 32 km. Hoy, con tu salida más larga en ' + F.km(largoRun) +
          ', la predicción honesta es ' + F.hms(p42.real, true) + '.',
        ruta: [
          'Fase 1 (meses 1–4): llevar el largo de ' + F.num(largoRun, 0) + ' a 25 km, sumando 2 km cada dos semanas.',
          'Fase 2 (meses 5–9): un medio maratón de carrera real. Es el examen intermedio obligatorio.',
          'Fase 3 (meses 10–15): bloque específico de 16 semanas con tres largos de 30–32 km y dos ensayos de nutrición en carrera.',
          'Fase 4: maratón. Objetivo de primera vez: terminar corriendo los últimos 10 km, no el cronómetro.'
        ],
        clave: 'La barrera del maratón no es el VO₂máx, es la durabilidad: la capacidad de que el ritmo no se degrade después de la hora tres. Eso sólo se entrena con largos y con comer bien durante la carrera.'
      },
      {
        id: 'dplus', nom: '2.000 m de desnivel positivo', icono: 'D+',
        tengo: b.maxElev, necesito: 2000, unidad: 'm en una salida',
        pct: 100 * b.maxElev / 2000,
        estado: b.maxElev >= 2000 ? 'ok' : 'warn',
        plazo: 'Ya lo hiciste una vez. Repetible en 3 a 6 meses',
        resumen: 'Tu mejor salida acumuló ' + F.m(b.maxElev) + ' el ' + F.fecha(b.topDesnivel[0].fechaISO) +
          '. Tienes ' + F.num(b.n1000, 0) + ' salidas de 1.000 m o más en el año. Lo que falta no es la capacidad: es la repetibilidad.',
        ruta: [
          'Una salida de montaña larga cada 15 días, alternando 1.200 m y 1.600 m.',
          'Bloques de subida: 5×10 min al 6–8% en Z2 alta, una vez por semana.',
          'Fuerza de piernas 2×/semana: sentadilla, peso muerto rumano y zancada. Es lo que más rinde en desnivel.',
          'Objetivo de control: 2.000 m D+ terminando con la última subida al mismo ritmo que la primera.'
        ],
        clave: 'A tu VAM media de ' + F.num(b.vamMedia, 0) + ' m/h, 2.000 m son unas 6 h de salida. El límite será el estómago y la cabeza antes que las piernas.'
      },
      {
        id: 'ultra', nom: '150–200 km en bici', icono: 'Ultra',
        tengo: b.maxKm, necesito: 150, unidad: 'km en una salida',
        pct: 100 * b.maxKm / 150,
        estado: b.maxKm >= 150 ? 'ok' : b.maxKm >= 100 ? 'warn' : 'bad',
        plazo: 'Realista: 4 a 8 meses',
        resumen: 'Tu salida real más larga es de ' + F.km(b.maxKm, 0) + ' en ' + F.num(b.maxHoras, 1) +
          ' h. Un 150 son unas 7 h y medio a tu velocidad media. El salto es de resistencia y de logística, no de forma física.',
        ruta: [
          'Progresión de la salida larga: 115 → 130 → 145 → 160 km, una cada tres semanas.',
          'Ensayo completo de avituallamiento: 60–90 g de carbohidrato por hora desde el minuto 30, sin excepción.',
          'Una salida de 6 h con las últimas 2 h a ritmo objetivo, para entrenar la degradación.',
          'Prueba de material: luces, repuestos, ropa de lluvia. Un ultra se abandona por una avería más que por las piernas.'
        ],
        clave: 'Ya tienes ' + F.num(b.n100km, 0) + ' salidas de 100 km o más. Esto es el sueño más cercano de los cuatro.'
      },
      {
        id: 'tri', nom: 'Mini Ironman propio', icono: 'Tri',
        tengo: 1, necesito: 1.9, unidad: 'km de natación continua',
        pct: 100 * 1 / 1.9,
        estado: 'bad',
        plazo: 'Realista: 12 a 24 meses. La natación manda',
        resumen: 'En todo 2026 tienes una sola sesión de natación: 1 km el 4 de julio. Un medio Ironman son 1,9 km de nado, ' +
          '90 km de bici y 21 km de carrera. La bici la tienes resuelta, la carrera está en camino, la natación está en cero.',
        ruta: [
          'Meses 1–3: tres sesiones de piscina por semana. Técnica primero, volumen después. Objetivo: 1.500 m continuos.',
          'Meses 4–6: aguas abiertas si hay acceso. Nadar en lago no se parece en nada a nadar en piscina.',
          'Meses 7–9: primer triatlón sprint (750 m / 20 km / 5 km) como examen de transiciones.',
          'Meses 10–18: olímpico (1,5 / 40 / 10) y luego el medio. El medio Ironman no se improvisa desde el sprint.'
        ],
        clave: 'La natación es el único deporte de los tres donde la técnica pesa más que el motor. Tu enorme base aeróbica no te sirve de nada si el agua te frena: invierte en clases, no en metros.'
      }
    ];

    var gRadar = C.hbars(suenos.map(function (s) {
      return { label: s.nom, v: Math.min(s.pct, 100),
        color: s.estado === 'ok' ? 'var(--ok)' : s.estado === 'warn' ? 'var(--warn)' : 'var(--bad)',
        text: F.pct(Math.min(s.pct, 100), 0) };
    }), { max: 100 });

    var cuerpos = suenos.map(function (s) {
      return U.acc(s.nom + ' — ' + s.plazo,
        "<p class='lede'>" + esc(s.resumen) + '</p>' +
        U.kpis([
          U.kpi('Dónde estás', F.num(s.tengo, s.tengo > 100 ? 0 : 1), esc(s.unidad)),
          U.kpi('Dónde hay que llegar', F.num(s.necesito, s.necesito > 100 ? 0 : 1), esc(s.unidad)),
          U.kpi('Avance', F.pct(Math.min(s.pct, 100), 0), '', s.estado === 'ok' ? 'ok' : s.estado === 'bad' ? 'bad' : '')
        ], 'k3') +
        '<h4>Hoja de ruta</h4><ol>' + s.ruta.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ol>' +
        U.note('La clave', esc(s.clave), s.estado === 'ok' ? 'ok' : 'warn'),
        s.id === 'maraton');
    }).join('');

    return h`
      ${raw(U.modhead('4', 'Los cuatro sueños', 'Cada uno medido contra lo que ya hiciste este año, no contra una ilusión.'))}
      ${raw(gRadar)}
      <p><small>Porcentaje de avance medido sobre el requisito físico central de cada sueño.</small></p>
      ${raw(cuerpos)}
      ${raw(U.coach('El orden importa', `
        <p>Los cuatro sueños no compiten por tu tiempo de la misma manera. Ordenados por cercanía real:</p>
        <p><b>1. Los 150 km en bici</b> están a un verano de distancia: ya tienes ${F.num(b.n100km, 0)} salidas de 100 km.</p>
        <p><b>2. Los 2.000 m de desnivel</b> ya los hiciste; falta repetirlos sin destrozarte.</p>
        <p><b>3. El maratón</b> es un proyecto de año y medio y choca de frente con tu meta de velocidad en 5K:
        entrenar maratón te hará más lento en distancias cortas durante el bloque. Hay que elegir el orden.</p>
        <p><b>4. El mini Ironman</b> es el más lejano y depende de un deporte que hoy no practicas. Si de verdad lo quieres,
        empieza la natación ya, en paralelo, porque es la que más tarda.</p>
        <p class='lede'>Un consejo incómodo: perseguir los cuatro a la vez es la forma más segura de no conseguir ninguno.
        Elige uno por temporada y deja los otros en mantenimiento.</p>`))}
    `;
  }

  App.mods.push({ id: 'suenos', nom: 'Los sueños', tab: 'Sueños', icono: 'M12 3l2.6 5.6 6.4.9-4.6 4.4 1.1 6.1L12 17l-5.5 3 1.1-6.1L3 9.5l6.4-.9z', render: render });
})(this);
