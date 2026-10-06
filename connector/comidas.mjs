/* comidas.mjs — baja el registro de comidas del hosting PHP a data/comidas/ y arma el resumen semanal para evaluarlo con IA en local.
   Uso: node connector/comidas.mjs [AAAA-MM-DD]   (por defecto, los últimos 7 días)
   Necesita COMIDAS_URL y COMIDAS_TOKEN en connector/.env (o en el entorno). */
import fs from 'node:fs';
import path from 'node:path';
import { RAIZ } from './strava.mjs';

const env = { ...process.env };
const f = path.join(RAIZ, 'connector', '.env');
if (fs.existsSync(f)) for (const l of fs.readFileSync(f, 'utf8').split(/\r?\n/)) { const m = /^\s*([A-Z_]+)\s*=\s*(.*)\s*$/.exec(l); if (m && !(m[1] in env)) env[m[1]] = m[2]; }
const URL_API = (env.COMIDAS_URL || '').replace(/\/$/, ''), TOKEN = env.COMIDAS_TOKEN || '';
if (!URL_API || !TOKEN) { console.error('Falta COMIDAS_URL (p. ej. https://tiemposguate.com/mistrava/registro/api.php) y COMIDAS_TOKEN en connector/.env'); process.exit(1); }

const pedir = (q) => fetch(`${URL_API}?accion=${q}`, { headers: { 'X-Token': TOKEN } });
const desde = process.argv[2] || new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
const out = path.join(RAIZ, 'data', 'comidas');
fs.mkdirSync(path.join(out, 'fotos'), { recursive: true });

const r = await pedir('lista');
if (!r.ok) { console.error('✗', r.status, await r.text()); process.exit(1); }
const entradas = (await r.json()).entradas.filter((e) => e.fecha >= desde).sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));
for (const e of entradas.filter((x) => x.foto)) {
  const d = path.join(out, 'fotos', `${e.fecha}_${e.hora.replace(':', '')}_${e.id}.jpg`);
  if (fs.existsSync(d)) continue;
  const p = await pedir(`foto&id=${e.id}`);
  if (p.ok) fs.writeFileSync(d, Buffer.from(await p.arrayBuffer())); else console.warn('⚠ foto', e.id, p.status);
}
const md = [`# Comidas desde ${desde}`, '', 'Evalúa estas comidas contra el plan (proteína 1,8–2,2 g/kg, verdura, azúcar líquida, alcohol, fritos) y contra lo entrenado en Strava. Devuelve: qué estuvo bien, 3 cambios concretos y calorías/proteína aproximadas por día.', ''];
let dia = '';
for (const e of entradas) {
  if (e.fecha !== dia) { dia = e.fecha; md.push(`## ${dia}`); }
  md.push(`- ${e.hora} · ${e.comida}: ${e.desc || '(sin descripción)'}${e.foto ? ` — foto: fotos/${e.fecha}_${e.hora.replace(':', '')}_${e.id}.jpg` : ''}`);
}
const archivo = path.join(out, `resumen-${desde}.md`);
fs.writeFileSync(archivo, md.join('\n') + '\n');
console.log(`✓ ${entradas.length} comidas → ${path.relative(RAIZ, archivo)}`);
