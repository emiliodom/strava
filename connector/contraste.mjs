/* contraste.mjs — auditoría de contraste WCAG 2.2 de la página real, en tema claro y oscuro y en todas las páginas.
   Texto: AA (4,5:1; 3:1 si es grande). Gráficos (iconos, anillos, bordes de sesión): 3:1.
   Uso: node connector/contraste.mjs [--json]          Sale con código 1 si algo no cumple. */
import fs from 'node:fs';
import path from 'node:path';
import { DIR } from './strava.mjs';
import { conNavegador } from './navegador.mjs';

const js = fs.readFileSync(path.join(DIR, 'contraste.pagina.js'), 'utf8');
const fallos = await conNavegador(async (b) => { await b.ir('', 4000); return JSON.parse(await b.evaluar(js)); });

if (process.argv.includes('--json')) console.log(JSON.stringify(fallos, null, 1));
else {
  const grupos = new Map();
  for (const f of fallos) {
    const k = `${f.tipo} ${f.tema} ${f.sel} ${f.fg}/${f.bg}`;
    if (!grupos.has(k)) grupos.set(k, { ...f, paginas: new Set() });
    grupos.get(k).paginas.add(f.pagina);
  }
  for (const g of [...grupos.values()].sort((a, c) => a.ratio - c.ratio))
    console.log(`${g.ratio.toFixed(2)} < ${g.min}  ${g.tipo.padEnd(7)} ${g.tema.padEnd(5)} ${g.sel}  ${g.fg} sobre ${g.bg}  «${g.texto}»  [${[...g.paginas].join(', ')}]`);
  console.log(fallos.length ? `\n✗ ${grupos.size} combinaciones por debajo del mínimo.` : '✓ Todo el texto y los gráficos superan el mínimo WCAG AA.');
}
process.exit(fallos.length ? 1 : 0);
