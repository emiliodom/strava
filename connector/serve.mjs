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

http.createServer((req, res) => {
  let rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (rel === '/') rel = '/index.html';

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
