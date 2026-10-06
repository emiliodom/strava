/* preparacion.js — Módulo 9: qué debe ocurrir 15, 10 y 5 días antes de cada evento del calendario. */
(function (global) {
  'use strict';
  var App = global.App, U = App.ui, esc = App.esc, P = App.plan;
  var MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  var PRIO = { A: 'Carrera A: se prepara de verdad', B: 'Carrera B: ensayo con carga completa', C: 'Carrera C: se aprovecha como entreno, sin recortar el plan' };

  function fecha(iso) { var d = new Date(iso + 'T12:00:00'); return d.getDate() + ' ' + MES[d.getMonth()]; }
  function restar(iso, n) { var d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() - n); var m = d.getMonth() + 1, dd = d.getDate(); return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (dd < 10 ? '0' : '') + dd; }
  function dias(a, b) { return Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 864e5); }
  function isoHoy() { var d = new Date(), m = d.getMonth() + 1, dd = d.getDate(); return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (dd < 10 ? '0' : '') + dd; }

  /* Qué debe ocurrir, por tipo de evento y prioridad. [15 días, 10 días, 5 días] */
  var BASE = {
    atletismo: {
      15: ['Última semana de carga fuerte: el largo más largo del bloque (hasta 12–13 km para un 15K) y una sesión de calidad a ritmo de carrera.',
           'Prueba el desayuno, las zapatillas, la ropa y, si vas a usarlo, el gel o el isotónico en un entreno largo.',
           'Revisa el recorrido, la hora de salida y cómo llegar; reserva transporte y hospedaje si hace falta.'],
      10: ['Última sesión de calidad larga: 3 × 3 km a ritmo de carrera o 20 min de tempo. Después empieza a bajar volumen.',
           'Fuerza: sigue con A/B, pero con 2 rondas y sin llegar al fallo. Nada nuevo desde aquí.',
           'Duerme 7,5–9 h fijas; cuida el sueño ahora, la semana de carrera no lo repone.'],
      5:  ['Volumen al 60–70 % de la semana normal; mantén 2–3 estímulos cortos a ritmo de carrera (4–6 × 1 min).',
           'Carbohidrato normal, sin experimentos con comida; alcohol cero desde hoy. Hidratación con sodio en el calor.',
           'Fuerza: la última sesión ligera (2 rondas) al menos 5 días antes; después, nada que dé agujetas.',
           'Prepara la bolsa: dorsal, zapatillas, reloj cargado, ropa, alimentación de carrera, plan de salida.']
    },
    trail: {
      15: ['Última salida larga con desnivel parecido (el 70–80 % del D+ de la carrera) y con las zapatillas y mochila que usarás.',
           'Bajadas progresivas: 2 sesiones de cuestas abajo controladas; el daño muscular excéntrico tarda hasta 7–10 días en pasar.',
           'Reconoce el perfil de la ruta: tramos técnicos, altura, abastecimientos.'],
      10: ['Última sesión fuerte de subida (repeticiones de cuesta o caminar rápido con bastones si los usarás).',
           'Aclimatación: duerme y entrena a altura si puedes; si no, hidrata y evita llegar de último momento.',
           'Fuerza: A/B en 2 rondas; deja las sentadillas profundas con carga para después.'],
      5:  ['Volumen al 50–60 %, con 20–30 min de ritmo cómodo y unas subidas cortas; bajadas suaves.',
           'Revisa material obligatorio, agua, sal, comida, chaqueta (en altura hace frío y hay lluvia).',
           'Carbohidratos desde 3 días antes, sin comidas nuevas; sueño sin recortes.']
    },
    mtb: {
      15: ['Última salida larga en bici con el D+ y el tiempo aproximados del evento; ensaya alimentación (60 g/h de carbohidrato, sal y agua).',
           'Revisión mecánica completa: cadena, frenos, neumáticos, sellador, suspensión. Hazla ahora para tener tiempo de reparar.',
           'Trabajo de fuerza de pierna y core, con las rutinas A/B.'],
      10: ['Última sesión fuerte (series en cuesta o umbral en rodillos de 2–3 × 10 min). Después baja carga.',
           'Prueba la ropa y las luces/accesorios; revisa el kit de reparación (cámara, bomba, cadena rápida, multiherramienta).',
           'Estudia el recorrido: abastecimientos, puntos de corte, altura máxima.'],
      5:  ['Volumen al 50–70 % con 2–3 cuestas cortas fuertes para mantener la chispa.',
           'Carga la hidratación y los geles, prepara las botellas; revisa la presión de las llantas para el terreno.',
           'Alimentación y sueño sin cambios; alcohol cero desde hoy. En altura (Campanabaj), toma agua y llega con un día de margen.']
    }
  };

  /* Matices por prioridad y por el evento concreto */
  var EXTRA = {
    guatemagica: {
      15: ['El plan llega a la A con el largo de 14 km del 12 de nov (9 días antes) como último de carga. Entre hoy y ese día evita otra carrera dura: Campanabaj (8 nov) ya es suficiente.'],
      10: ['11 de nov: E suave + fuerza A (la última del plan). El 12, el largo de 14 km a ritmo fácil; no lo conviertas en carrera.'],
      5:  ['17 de nov: última calidad (7 km con bloque a ritmo de carrera, 5:00/km). 18 fácil, 19 San Felipe sólo si es a ritmo de 15K, 20 descanso total. Sin déficit calórico desde el 16 de nov.']
    },
    sanfelipe: { 5: ['Corres el 5K sólo a ritmo de 15K (no de 5K) o no corres: dos días antes de la Guatemágica no vale la pena un esfuerzo máximo.'] },
    senderos: { 5: ['Seis días antes de la A: baja el ritmo, no compitas. Si llegas con fatiga, cámbialo por una rodada corta.'] },
    campana: { 10: ['Última semana para entrenar en altura o con mucho desnivel antes de la Guatemágica: no la recortes por miedo, pero tampoco le añadas carga nueva.'] },
    trail15: { 15: ['Es la primera carrera y estás a 8 días. Los 15 y 10 días ya pasaron: concéntrate en el bloque de 5 días y en una salida de 8–10 km con desnivel.'] },
    capis: { 5: ['Rodada de grupo: ve a ritmo conversacional y no persigas a nadie; es salida larga, no carrera.'] }
  };

  function plantilla(e, n) {
    var base = (BASE[e.deporte] || BASE.atletismo)[n].slice();
    var ex = (EXTRA[e.id] || {})[n];
    return ex ? ex.concat(base) : base;
  }

  function tarjeta(e, hoy) {
    var restan = dias(hoy, e.fecha);
    var cab = '<h3>' + esc(e.nombre) + ' · ' + fecha(e.fecha) + '</h3><p><small>' + esc(PRIO[e.prioridad] || '') + ' · ' +
      (restan > 0 ? 'faltan ' + restan + ' días' : restan === 0 ? 'es hoy' : 'ya pasó') + (e.lugar && e.lugar !== 'Por confirmar' ? ' · ' + esc(e.lugar) : '') + '</small></p>';
    var cuerpo = [15, 10, 5].map(function (n) {
      var f = restar(e.fecha, n), d = dias(hoy, f), estado = d < 0 ? 'ya pasó' : d === 0 ? 'hoy' : 'en ' + d + ' días';
      var items = plantilla(e, n).map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('');
      return U.acc(n + ' días antes · ' + fecha(f) + ' (' + estado + ')', U.coach(d < 0 ? 'Fecha pasada: sólo lo que aún aplique' : 'Qué debe ocurrir', '<ul>' + items + '</ul>'), d >= 0 && d <= 5);
    }).join('');
    return cab + cuerpo;
  }

  function render() {
    var hoy = isoHoy();
    var evs = P.EVENTOS.filter(function (e) { return e.fecha >= hoy; });
    return U.modhead('9', 'Preparación por evento', 'Qué debe ocurrir 15, 10 y 5 días antes de cada carrera y rodada del calendario. Los tres plazos se calculan desde la fecha de cada evento.') +
      U.note('Cómo leerlo', 'Las carreras C se usan como entreno; la A (Guatemágica, 21 nov) manda. Si dos eventos se pisan, el plazo de 5 días de uno se cruza con el de 10 o 15 del siguiente: ahí gana el que está más cerca de la A y se recorta el otro.', 'warn') +
      (evs.length ? evs.map(function (e) { return tarjeta(e, hoy); }).join('') : '<p>No quedan eventos en el calendario.</p>') +
      U.note('Regla para todos', 'Nada nuevo en los últimos 10 días: ni zapatillas, ni comida, ni suplemento, ni técnica. Todo lo que vayas a usar en la carrera se prueba antes, en un entreno largo.', 'ok');
  }

  App.mods.push({ id: 'preparacion', nom: 'Preparación', tab: 'Preparación', icono: 'M5 21V4M5 4h11l-2 4 2 4H5', render: render });
})(this);
