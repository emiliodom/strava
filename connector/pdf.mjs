/* pdf.mjs — genera el informe completo en PDF (tema claro, A4, calendario apaisado) con Chrome sin interfaz.
   Uso: node connector/pdf.mjs [salida.pdf]      (por defecto informe-2026.pdf en la raíz) */
import path from 'node:path';
import { RAIZ } from './strava.mjs';
import { conNavegador } from './navegador.mjs';

const salida = path.resolve(process.argv[2] || path.join(RAIZ, 'informe-2026.pdf'));
await conNavegador(async (b) => {
  await b.ir('#imprimir', 4500);                       // #imprimir = todos los módulos, tema claro, acordeones abiertos
  const fallos = await b.evaluar("[...document.querySelectorAll('.err')].map(e => e.innerText).join(' | ')");
  if (fallos) throw new Error('Un módulo no se dibujó: ' + fallos);
  await b.pdf(salida);
});
console.log('✓ PDF escrito en ' + salida);
