/* serve.mjs — servidor estático mínimo para ver la página en el navegador (y en el móvil por la red local). */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { RAIZ } from './strava.mjs';

const PUERTO = Number(process.env.PUERTO_WEB || process.argv[2] || 8000);

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json'
};

/* V-taper: la página guarda lo hecho y las medidas en data/vtaper.json (versionado en git). Sólo se acepta esa forma de JSON. */
const VT_ARCHIVO = path.join(RAIZ, 'data', 'vtaper.json');
const VT_CAMPOS = { cintura: [50, 200], pecho: [60, 200], hombros: [70, 220], cuelloHombro: [8, 40], brazo: [15, 70], peso: [30, 250] };
const esFecha = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s));
function vtLimpiar(j) {
  const hechos = {};
  Object.keys(j.hechos && typeof j.hechos === 'object' ? j.hechos : {}).sort().forEach((k) => { if (esFecha(k) && j.hechos[k]) hechos[k] = 1; });
  const por = {};
  (Array.isArray(j.medidas) ? j.medidas : []).forEach((x) => {
    if (!x || !esFecha(x.f)) return;
    const e = { f: x.f };
    Object.keys(VT_CAMPOS).forEach((c) => { const v = Number(x[c]); if (x[c] != null && isFinite(v) && v >= VT_CAMPOS[c][0] && v <= VT_CAMPOS[c][1]) e[c] = Math.round(v * 10) / 10; });
    if (Object.keys(e).length > 1) por[e.f] = e;
  });
  return { v: 1, t: Math.round(Number(j.t) || 0), hechos, medidas: Object.keys(por).sort().map((k) => por[k]) };
}

http.createServer((req, res) => {
  let rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (rel === '/') rel = '/index.html';

  if (req.method === 'POST' && rel === '/api/vtaper') {
    let n = 0; const trozos = [];
    req.on('data', (c) => { n += c.length; if (n > 200000) req.destroy(); else trozos.push(c); });
    req.on('end', () => {
      try {
        const j = vtLimpiar(JSON.parse(Buffer.concat(trozos).toString('utf8')));
        fs.mkdirSync(path.dirname(VT_ARCHIVO), { recursive: true });
        fs.writeFileSync(VT_ARCHIVO, JSON.stringify(j, null, 2) + '\n');
        res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' }).end('{"ok":true}');
      } catch (e) { res.writeHead(400, { 'content-type': 'application/json; charset=utf-8' }).end('{"error":"JSON no válido"}'); }
    });
    return;
  }

  // nada fuera de la raíz del proyecto, y nunca las credenciales
  const destino = path.join(RAIZ, path.normalize(rel).replace(/^([/\\])+/, ''));
  const prohibido = /(^|[/\\])(connector[/\\]\.(env|tokens\.json)|data[/\\]raw)([/\\]|$)/i;
  if (!destino.startsWith(RAIZ) || prohibido.test(path.relative(RAIZ, destino))) {
    res.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' }).end('403');
    return;
  }

  fs.readFile(destino, (err, buf) => {
    if (err) { res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('404 ' + rel); return; }
    res.writeHead(200, {
      'content-type': TIPOS[path.extname(destino).toLowerCase()] || 'application/octet-stream',
      'cache-control': 'no-cache'
    }).end(buf);
  });
}).listen(PUERTO, () => {
  const ips = Object.values(os.networkInterfaces()).flat()
    .filter((i) => i && i.family === 'IPv4' && !i.internal).map((i) => i.address);
  console.log(`\n  Local    http://localhost:${PUERTO}`);
  for (const ip of ips) console.log(`  Red      http://${ip}:${PUERTO}   ← ábrela en el móvil`);
  console.log('\n  Ctrl+C para parar.\n');
});
