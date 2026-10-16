/* Se ejecuta DENTRO de la página (lo inyecta contraste.mjs). Devuelve un JSON con los incumplimientos. */
(async () => {
  document.head.insertAdjacentHTML('beforeend', '<style>*{transition:none!important;animation:none!important}</style>');
  const cv = document.createElement('canvas'); cv.width = cv.height = 1;
  const cx = cv.getContext('2d', { willReadFrequently: true });
  function rgba(c) {            // el lienzo entiende cualquier sintaxis CSS (color-mix, oklch…)
    cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = c; cx.fillRect(0, 0, 1, 1);
    const d = cx.getImageData(0, 0, 1, 1).data;
    if (d[3] === 0) return [0, 0, 0, 0];
    return [0, 1, 2].map((i) => Math.min(255, Math.round(d[i] * 255 / d[3]))).concat(d[3] / 255);
  }
  const sobre = (f, b) => [0, 1, 2].map((i) => f[i] * f[3] + b[i] * (1 - f[3])).concat(1);
  const lum = (c) => { const f = (v) => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(c[0]) + .7152 * f(c[1]) + .0722 * f(c[2]); };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
  const hex = (c) => '#' + c.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
  const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

  // El «hero» es un degradado oscuro con un resplandor naranja arriba a la derecha. Se calcula el fondo REAL bajo el centro
  // del elemento: base = el más claro de los dos tonos, más el resplandor (38 % en la esquina, 0 a 60 % de la elipse).
  function heroEn(el, hero) {
    const a = rgba(css('--hero-a')), b = rgba(css('--hero-b')), g = rgba(css('--glow'));
    const base = lum(a) > lum(b) ? a : b;
    const R = hero.getBoundingClientRect(), E = el.getBoundingClientRect();
    const x = E.left + E.width / 2, y = E.top + E.height / 2;
    const d = Math.hypot((R.right - x) / (1.2 * R.width), (y - R.top) / (0.9 * R.height));
    g[3] = d < 0.6 ? 0.38 * (1 - d / 0.6) : 0;
    return sobre(g, base);
  }
  function fondoDe(el) {
    const cadena = [];
    for (let e = el; e; e = e.parentElement) {
      const s = getComputedStyle(e);
      if (/gradient/.test(s.backgroundImage) && e.classList.contains('hero')) { cadena.push(heroEn(el, e)); break; }
      const c = rgba(s.backgroundColor);
      if (c[3] > 0) cadena.push(c);
      if (c[3] >= 1) break;
    }
    return cadena.reverse().reduce((base, c) => sobre(c, base), [255, 255, 255, 1]);
  }

  const fallos = [];
  const selDe = (el) => el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.') : '');
  const paginas = ['hoy', 'calendario', 'rendimiento', 'metas', 'cuerpo', 'registro'];

  for (const tema of ['light', 'dark']) {
    document.documentElement.setAttribute('data-theme', tema);
    for (const pagina of paginas) {
      location.hash = '#' + pagina; await new Promise((r) => setTimeout(r, 300));
      const vistos = new Set();
      const anota = (tipo, el, fg, bg, min, texto) => {
        const r = ratio(fg, bg); if (r >= min) return;
        const k = tipo + tema + selDe(el) + hex(fg) + hex(bg); if (vistos.has(k)) return; vistos.add(k);
        fallos.push({ tipo, tema, pagina, sel: selDe(el), ratio: +r.toFixed(2), min, fg: hex(fg), bg: hex(bg), texto: (texto || '').slice(0, 30) });
      };

      document.querySelectorAll('main svg text').forEach((el) => {   // etiquetas de las gráficas
        if (!el.getClientRects().length || !el.textContent.trim()) return;
        const s = getComputedStyle(el), bg = fondoDe(el.closest('svg'));
        anota('texto', el, rgba(s.fill), bg, 4.5, el.textContent);
      });
      document.querySelectorAll('header.top *, .subnav *, .tabbar *, main *').forEach((el) => {
        if (!el.offsetParent && getComputedStyle(el).position !== 'fixed') return;
        const s = getComputedStyle(el);
        if (s.visibility === 'hidden' || +s.opacity === 0) return;
        const bg = fondoDe(el);

        // texto
        const propio = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim()).map((n) => n.textContent.trim()).join(' ');
        if (propio && !el.closest('svg')) {
          let fg = rgba(s.color); if (fg[3] < 1) fg = sobre(fg, bg);
          const px = parseFloat(s.fontSize), grande = px >= 24 || (px >= 18.66 && +s.fontWeight >= 700);
          anota('texto', el, fg, bg, grande ? 3 : 4.5, propio);
        }
        // gráficos: iconos, anillos y borde de color de cada sesión (3:1)
        if (el.matches('.ico')) anota('gráfico', el, rgba(s.color), sobre(rgba(s.backgroundColor), bg), 3, 'icono');
        if (el.matches('.ring')) anota('gráfico', el, rgba(s.getPropertyValue('--rc')), rgba(s.getPropertyValue('--pico-card-background-color')), 3, 'anillo');
        if (el.matches('.c[data-f]')) anota('gráfico', el, rgba(s.borderLeftColor), bg, 3, 'borde de sesión');
        if (el.matches('.ico.st-ok,.ico.st-parcial,.ico.st-miss')) {
          const p = getComputedStyle(el, '::after');
          anota('texto', el, rgba(p.color), rgba(p.backgroundColor), 4.5, 'marca de estado');
        }
      });
    }
  }
  return JSON.stringify(fallos);
})()
