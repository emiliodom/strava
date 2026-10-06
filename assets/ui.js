/* ui.js — piezas de interfaz reutilizables sobre Pico. Devuelven cadenas HTML. */
(function (global) {
  'use strict';
  var App = global.App || (global.App = {}), esc = App.esc;

  function kpi(lbl, val, sub, cls) {
    return "<div class='kpi" + (cls ? ' ' + cls : '') + "'>" +
      "<span class='lbl'>" + esc(lbl) + "</span>" +
      "<span class='val'>" + val + "</span>" +
      (sub ? "<span class='sub'>" + sub + "</span>" : '') + "</div>";
  }
  function kpis(items, cls) {
    return "<div class='kpis" + (cls ? ' ' + cls : '') + "'>" + items.join('') + "</div>";
  }
  function chip(txt, cls) { return "<span class='chip" + (cls ? ' ' + cls : '') + "'>" + esc(txt) + "</span>"; }

  function note(titulo, cuerpo, nivel) {
    return "<div class='note" + (nivel ? ' ' + nivel : '') + "'>" +
      (titulo ? "<p>" + esc(titulo) + "</p>" : '') + "<p>" + cuerpo + "</p></div>";
  }
  function coach(titulo, cuerpo) {
    return "<article class='coach'><header>" + esc(titulo) + "</header>" + cuerpo + "</article>";
  }
  function acc(titulo, cuerpo, abierto) {
    return "<details class='acc'" + (abierto ? ' open' : '') + "><summary>" + esc(titulo) + "</summary>" + cuerpo + "</details>";
  }

  // cols: [{t:'Cabecera', n:true}], filas: [[celda,...]] (celdas ya en HTML)
  function tabla(cols, filas, opts) {
    opts = opts || {};
    var th = cols.map(function (c) { return "<th" + (c.n ? " class='n'" : '') + ">" + esc(c.t) + "</th>"; }).join('');
    var tb = filas.map(function (f) {
      return "<tr>" + f.map(function (celda, i) {
        return "<td" + (cols[i] && cols[i].n ? " class='n'" : '') + ">" + celda + "</td>";
      }).join('') + "</tr>";
    }).join('');
    return "<div class='tw'><table><thead><tr>" + th + "</tr></thead><tbody>" + tb + "</tbody></table></div>" +
      (opts.pie ? "<small>" + opts.pie + "</small>" : '');
  }

  function modhead(num, titulo, lede) {
    return "<div class='modhead'>" + (num ? "<span class='num'>" + esc(num) + "</span>" : '') +
      "<h2>" + esc(titulo) + "</h2></div>" + (lede ? "<p class='lede'>" + lede + "</p>" : '');
  }

  App.ui = { kpi: kpi, kpis: kpis, chip: chip, note: note, coach: coach, acc: acc, tabla: tabla, modhead: modhead };
  App.mods = App.mods || [];
})(this);
