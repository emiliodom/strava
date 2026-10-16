/* navegador.mjs — Chrome sin interfaz + servidor estático efímero, para auditar contraste y generar el PDF.
   Sin dependencias: habla con Chrome por el protocolo DevTools (WebSocket nativo de Node ≥ 22).
   Ruta de Chrome: variable CHROME, o la habitual de macOS/Linux/Windows. */
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { RAIZ } from './strava.mjs';

const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg' };
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

function buscarChrome() {
  const c = [process.env.CHROME, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'].filter(Boolean);
  const ruta = c.find((x) => fs.existsSync(x));
  if (!ruta) throw new Error('No encuentro Chrome. Define la variable CHROME con la ruta del ejecutable.');
  return ruta;
}

function servidor() {
  return new Promise((ok) => {
    const s = http.createServer((req, res) => {
      let rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      if (rel === '/') rel = '/index.html';
      const f = path.join(RAIZ, path.normalize(rel));
      if (!f.startsWith(RAIZ) || /connector|data[/\\]raw/.test(path.relative(RAIZ, f))) { res.writeHead(403).end(); return; }
      fs.readFile(f, (e, b) => e ? res.writeHead(404).end() : res.writeHead(200, { 'content-type': TIPOS[path.extname(f)] || 'application/octet-stream' }).end(b));
    }).listen(0, '127.0.0.1', () => ok(s));
  });
}

export async function conNavegador(fn, { ancho = 1300, alto = 900 } = {}) {
  const srv = await servidor();
  const base = `http://127.0.0.1:${srv.address().port}/`;
  const puerto = 9300 + Math.floor(Math.random() * 600);
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'strava-chrome-'));
  const chrome = spawn(buscarChrome(), ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${puerto}`,
    `--window-size=${ancho},${alto}`, `--user-data-dir=${perfil}`, 'about:blank'], { stdio: 'ignore' });
  try {
    let pestana;
    for (let i = 0; i < 60 && !pestana; i++) {
      try { pestana = (await (await fetch(`http://127.0.0.1:${puerto}/json`)).json()).find((t) => t.type === 'page'); } catch { await espera(200); }
    }
    if (!pestana) throw new Error('Chrome no arrancó.');
    const ws = new WebSocket(pestana.webSocketDebuggerUrl);
    await new Promise((r) => { ws.onopen = r; });
    let n = 0; const pend = {}; const errores = [];
    ws.onmessage = (e) => {
      const m = JSON.parse(e.data);
      if (m.id && pend[m.id]) { pend[m.id](m); delete pend[m.id]; }
      if (m.method === 'Runtime.exceptionThrown') errores.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
    };
    const enviar = (method, params = {}) => new Promise((r) => { pend[++n] = r; ws.send(JSON.stringify({ id: n, method, params })); }).then((m) => {
      if (m.error) throw new Error(method + ': ' + m.error.message);
      return m.result;
    });
    await enviar('Runtime.enable'); await enviar('Page.enable');
    await enviar('Emulation.setDeviceMetricsOverride', { width: ancho, height: alto, deviceScaleFactor: 1, mobile: ancho < 600 });
    const api = {
      errores,
      async ir(hash = '', ms = 3500) { await enviar('Page.navigate', { url: base + hash }); await espera(ms); },
      async evaluar(js) {
        const r = await enviar('Runtime.evaluate', { expression: js, awaitPromise: true, returnByValue: true });
        if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
        return r.result.value;
      },
      async pdf(destino, opts = {}) {
        const r = await enviar('Page.printToPDF', { printBackground: true, preferCSSPageSize: true, ...opts });
        fs.writeFileSync(destino, Buffer.from(r.data, 'base64'));
      },
      async medio(media) { await enviar('Emulation.setEmulatedMedia', { media }); },
      async captura(destino) { fs.writeFileSync(destino, Buffer.from((await enviar('Page.captureScreenshot', { format: 'png' })).data, 'base64')); }
    };
    return await fn(api);
  } finally {
    chrome.kill(); srv.close();
    try { fs.rmSync(perfil, { recursive: true, force: true }); } catch { /* ya se limpiará */ }
  }
}
