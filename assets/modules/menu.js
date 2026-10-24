/* menu.js — Módulo 15: calendario de comida guatemalteca con tope de porciones.
   Fase GT (hasta el 23 nov): comida de casa. Fase EE. UU. (24 nov–14 ene, Charlotte): mismas bases chapinas más reglas
   para porciones grandes. El tope de kcal sale de App.cuerpo.metaDia (mismo plan activo). Todo son estimaciones. */
(function (global) {
  'use strict';
  var App = global.App, U = App.ui, F = App.fmt, esc = App.esc;
  var DESDE = '2026-10-23', EE_DESDE = '2026-11-24', HASTA = '2027-01-14';
  var MES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var DOW = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
  var SEL = null;

  var planActivo = function () { return App.data.pref('calPlan', 'estructurado'); };
  var fase = function (f) { return f >= EE_DESDE ? 'ee' : 'gt'; };

  /* Porciones del día según el tope de kcal (medidas de mano y de cocina; nunca «hasta quedar lleno»). */
  function nivel(kcal) { return kcal < 2150 ? 0 : kcal < 2500 ? 1 : 2; }
  var POR = {
    prot: ['4 palmas', '4–5 palmas', '5 palmas'],           // palma = ~120 g cocido, ~25–30 g de proteína
    tort: ['3', '4', '6'],                                   // tortillas de maíz chicas
    carb: ['½ taza', '¾ de taza', '1 taza'],                 // arroz, plátano, camote o papa (extra a las tortillas)
    frijol: ['1 taza', '1 taza', '1½ tazas'],
    grasa: ['1 cda de aceite + ¼ de aguacate', '1 cda de aceite + ½ aguacate', '2 cdas de aceite + ½ aguacate']
  };

  var DESAYUNOS = [
    'Huevos a la mexicana (2–3) con tomate y cebolla, frijol volteado, tortillas y papaya',
    'Omelette de 3 huevos con hierbamora o espinaca, frijol colado, tortillas y piña',
    'Avena cocida con leche (sin azúcar) + 1 scoop de proteína o yogur natural, banano y pepitoria'
  ];
  var ALMUERZOS = [
    'Pollo sin piel en pepián o jocón (poca salsa), arroz, güisquil y ensalada',
    'Caldo de res o de gallina con verdura (güisquil, ejote, zanahoria) + tortillas',
    'Pescado o mojarra a la plancha, ensalada de repollo y tomate, plátano cocido',
    'Carne asada magra (lomito o culotte), frijol, chirmol y tortillas; sin papas fritas',
    'Pollo guisado con recado, camote, ejotes y ensalada',
    'Revolcado o hilachas de res, arroz y verdura al vapor',
    'Atún o sardina con tomate, aguacate y tortillas; ensalada grande'
  ];
  var CENAS = [
    'Cena chapina ligera: 2 huevos, frijol colado, ¼ de aguacate, queso fresco y 1 tortilla',
    'Pollo o pescado a la plancha, verdura salteada y 2 tortillas',
    'Tostadas de frijol con pollo desmenuzado y repollo (2 tostadas horneadas)',
    'Sopa de verduras con pollo y huevo cocido; 1 tortilla'
  ];
  var REFAC = ['Yogur natural con fruta', 'Jícama con limón y sal', 'Huevo cocido y 1 tortilla', 'Fruta y un puñado de pepitoria (25 g)'];
  var USA_ALM = [
    'En casa: pollo asado sin piel, arroz, frijol negro y ensalada; plato servido en la cocina, sin repetir',
    'Bowl tipo Chipotle «a lo chapín»: doble pollo, frijol, vegetales, ¼ de arroz, sin tortilla frita ni crema; pide tamaño regular',
    'Restaurante: asado o pescado + verdura al vapor; pide guarnición doble de verdura en vez de papas; guarda la mitad en la caja ANTES de empezar',
    'Sándwich de pavo en pan integral (1 sola mitad extra de verdura) con fruta; sin papas ni refresco',
    'Sopa de pollo con verduras + ensalada con pollo; vinagreta aparte'
  ];

  function receta(fecha, dia, n) {
    var ee = fase(fecha) === 'ee', lv = nivel(n.kcal), h = new Date(fecha + 'T12:00:00'), k = Math.floor(h / 864e5);
    var largo = dia.evento || dia.km >= 12 || dia.minBici >= 90, desc = dia.tipo === 'D', sab = h.getDay() === 6;
    var libre = !ee ? false : (sab && !dia.evento) || (!ee && false);
    var ali = ee ? USA_ALM[k % USA_ALM.length] : ALMUERZOS[k % ALMUERZOS.length];
    var comidas = [
      ['Desayuno', DESAYUNOS[k % DESAYUNOS.length]],
      ['Almuerzo', ali],
      ['Refacción', REFAC[k % REFAC.length]],
      ['Cena (cocina cerrada 21:00)', CENAS[k % CENAS.length]]
    ];
    if (largo) comidas.push(['Alrededor del entreno largo', 'Banano o tortilla con miel ANTES; durante: 40–60 g de carbohidrato/h (sólo si pasa de 90 min); después: leche o yogur + fruta. Es el único momento del día con carbohidrato extra.']);
    return { lv: lv, ee: ee, largo: largo, desc: desc, libre: libre, comidas: comidas };
  }

  function dias() { return App.calExport.dias(planActivo()).filter(function (d) { return d.fecha >= DESDE && d.fecha <= HASTA; }); }

  function techo(dia) { var n = App.cuerpo && App.cuerpo.metaDia ? App.cuerpo.metaDia(planActivo(), dia) : null; return n ? Math.round(n.kcal / 50) * 50 : 2300; }

  function detalle(dia) {
    var n = App.cuerpo.metaDia(planActivo(), dia) || { kcal: 2300, prot: 150, modo: '' };
    var kc = Math.round(n.kcal / 50) * 50, r = receta(dia.fecha, dia, n), lv = r.lv, ee = r.ee;
    var h = new Date(dia.fecha + 'T12:00:00');
    var cab = '<h4>' + DOW[h.getDay()] + ' ' + h.getDate() + ' de ' + MES[h.getMonth()] + ' · ' + (ee ? 'Charlotte (EE. UU.)' : 'Guatemala') + '</h4>' +
      U.kpis([U.kpi('Techo del día', F.num(kc, 0) + ' kcal', esc(n.modo)), U.kpi('Proteína', F.num(n.prot, 0) + ' g', '4 tomas de ' + F.num(n.prot / 4, 0) + ' g'), U.kpi('Tipo de día', r.largo ? 'largo / evento' : r.desc ? 'descanso' : 'normal', r.libre ? 'comida libre medida (sábado)' : 'sin comida libre')], 'k3');
    var ptab = U.tabla([{ t: 'Grupo' }, { t: 'Todo el día', n: 1 }],
      [['Proteína (pollo, pescado, huevo, res magra)', POR.prot[lv]], ['Tortillas de maíz', POR.tort[lv]], ['Arroz, plátano, camote o papa (extra)', POR.carb[lv] + (r.desc ? ' − 1 porción' : '')], ['Frijol', POR.frijol[lv]], ['Grasa añadida', POR.grasa[lv]], ['Verdura', 'libre: mínimo medio plato en 2 comidas']]);
    var lista = '<ul>' + r.comidas.map(function (c) { return '<li><b>' + esc(c[0]) + ':</b> ' + esc(c[1]) + '</li>'; }).join('') + '</ul>';
    var libre = r.libre ? U.note('Comida libre del sábado', 'Una sola comida «de las que te gustan», con la regla de la mitad: pide o sírvete la mitad, aparta la otra mitad en la caja antes de empezar y espera 15 min antes de decidir si quieres más. Sin postre extra ni bebida azucarada.', 'ok') : '';
    return cab + libre + '<h4>Porciones del día</h4>' + ptab + '<h4>Qué comer</h4>' + lista +
      '<p><small>Estimación orientativa; ajusta con cintura y peso cada 2 semanas. Si pesas tu comida un par de días, afinas el ojo para el resto.</small></p>';
  }

  function reglas() {
    return U.acc('Reglas de la cocina (aplican todos los días)',
      '<ul>' +
      '<li><b>El plato se sirve en la cocina</b> y la olla se guarda: nadie repite «un poquito». Si después de 15 min aún hay hambre, medio plato de verdura o un huevo cocido.</li>' +
      '<li><b>Proteína primero</b>, verdura después, carbohidrato al final: sacia más y es lo que más cuesta con porciones grandes.</li>' +
      '<li><b>Nada directo de la bolsa o la olla</b>; la refacción se sirve en un plato pequeño.</li>' +
      '<li><b>Cocina cerrada a las 21:00</b>: lavar los trastes y cepillarse los dientes cierra el apetito de noche.</li>' +
      '<li><b>Líquidos sin calorías</b>: agua, café sin azúcar, té. Cero gaseosa, jugos y cremas; alcohol sólo en la comida libre, máximo una bebida.</li>' +
      '<li><b>Compra con lista</b>: lo que no está en la casa (pan dulce, galletas, Tortrix) no se come a las 22:00.</li>' +
      '<li><b>Lo que no hacemos:</b> saltarse comidas para «compensar» ni pasar de −750 kcal; con la bici y las pesas de este bloque el déficit grande sólo funciona si dormís y comes proteína.</li></ul>', true);
  }

  function reglasUSA() {
    return U.acc('Charlotte (24 nov–14 ene): el punto medio con porciones de EE. UU.',
      '<p>Un plato típico de restaurante en EE. UU. trae <b>1,5 a 2 veces</b> lo que cabe en tu techo. La regla no es privarte: es decidir la porción <i>antes</i> de que llegue el plato.</p><ul>' +
      '<li><b>Mitad en la caja primero:</b> al llegar el plato, aparta la mitad (o pide la caja de entrada). Mañana es tu almuerzo.</li>' +
      '<li><b>Tamaño regular o pequeño</b>, nunca «grande»; comparte un plato fuerte y pide ensalada o verdura al vapor de más.</li>' +
      '<li><b>Cero rellenos</b> (refill) de bebida; agua con gas o sin azúcar.</li>' +
      '<li><b>Compra y cocina en casa 5 de 7 días</b> con la base chapina (frijol negro, arroz, pollo, huevos, tortillas de maíz, plátano). Es donde puedes controlar los gramos.</li>' +
      '<li><b>Una comida libre por semana (sábado)</b>, no un fin de semana libre. Los eventos familiares cuentan como esa comida.</li>' +
      '<li><b>Entreno duro = más pesas y bici, no más comida</b>: el techo ya incluye el entreno. Si entrenas dos veces, sólo se suma una fruta y yogur.</li></ul>', true);
  }

  function mes(ds, y, m) {
    var primero = new Date(y, m, 1), pad = (primero.getDay() + 6) % 7, fin = new Date(y, m + 1, 0).getDate(), c = [];
    for (var i = 0; i < pad; i++) c.push("<div class='mc e'></div>");
    for (var d = 1; d <= fin; d++) {
      var iso = y + '-' + (m + 1 < 10 ? '0' : '') + (m + 1) + '-' + (d < 10 ? '0' : '') + d, dia = ds.filter(function (x) { return x.fecha === iso; })[0];
      if (!dia) { c.push("<div class='mc e'></div>"); continue; }
      var e = fase(iso) === 'ee', r = receta(iso, dia, { kcal: techo(dia) }), kc = techo(dia);
      c.push("<div class='mc " + (e ? 'ee' : 'gt') + (r.largo ? ' lg' : '') + (iso === SEL ? ' sel' : '') + "' role='button' tabindex='0' data-mdia='" + iso + "' aria-label='" + d + ' ' + MES[m] + ', ' + kc + " kcal'>" +
        "<b>" + d + '</b><span>' + F.num(kc, 0) + '</span><small>' + (r.libre ? 'libre' : r.largo ? 'largo' : r.desc ? 'desc.' : (e ? 'EE. UU.' : 'GT')) + '</small></div>');
    }
    return '<h4>' + MES[m][0].toUpperCase() + MES[m].slice(1) + ' ' + y + "</h4><div class='mcal'>" +
      ['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(function (l) { return "<div class='mh'>" + l + '</div>'; }).join('') + c.join('') + '</div>';
  }

  function render() {
    if (!App.calExport || !App.cuerpo) return '';
    var ds = dias(), hoy = new Date().toISOString().slice(0, 10);
    if (!SEL || ds.every(function (d) { return d.fecha !== SEL; })) SEL = ds.some(function (d) { return d.fecha === hoy; }) ? hoy : (ds[0] && ds[0].fecha);
    var meses = [[2026, 9], [2026, 10], [2026, 11], [2027, 0]];
    return U.modhead('15', 'Comida chapina: calendario con tope', 'El techo de kcal sale de tu plan activo. Hasta el 23 nov es comida de casa; del 24 nov al 14 ene (Charlotte) las mismas bases, con reglas para las porciones de EE. UU. Cada día muestra el tope, las porciones y el menú.') +
      reglas() + reglasUSA() +
      "<div class='mlgd'><span class='mc gt'>GT</span> Guatemala <span class='mc ee'>EE. UU.</span> Charlotte <span class='mc lg'>largo</span> día largo o evento</div>" +
      meses.map(function (a) { return mes(ds, a[0], a[1]); }).join('') +
      "<div id='menuDia' class='coach' aria-live='polite'>" + (SEL ? detalle(ds.filter(function (d) { return d.fecha === SEL; })[0]) : '') + '</div>';
  }

  function montar(el) {
    function elegir(c) {
      if (!c) return;
      SEL = c.getAttribute('data-mdia');
      Array.prototype.forEach.call(el.querySelectorAll('.mc.sel'), function (x) { x.classList.remove('sel'); });
      c.classList.add('sel');
      var d = dias().filter(function (x) { return x.fecha === SEL; })[0];
      if (d) el.querySelector('#menuDia').innerHTML = detalle(d);
    }
    el.addEventListener('click', function (ev) { elegir(ev.target.closest('[data-mdia]')); });
    el.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { var c = ev.target.closest('[data-mdia]'); if (c) { ev.preventDefault(); elegir(c); } } });
  }

  App.menu = { detalle: detalle, techo: techo };
  App.mods.push({ id: 'menu', nom: 'Comida', tab: 'Comida', icono: 'M4 11h16a8 8 0 01-16 0zM12 3v4M8 5v2M16 5v2', render: render, montar: montar });
})(this);
