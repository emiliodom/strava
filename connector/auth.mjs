/* auth.mjs — abre el consentimiento de Strava y recoge el código en un servidor local de un solo uso. */
import http from 'node:http';
import crypto from 'node:crypto';
import { exec } from 'node:child_process';
import { config, canjear, leerTokens, OAUTH_AUTORIZAR, OAUTH_REVOCAR, AMBITOS } from './strava.mjs';

const cfg = config();
const estado = crypto.randomBytes(16).toString('hex');

const url = new URL(OAUTH_AUTORIZAR);
url.searchParams.set('client_id', cfg.STRAVA_CLIENT_ID);
url.searchParams.set('redirect_uri', cfg.REDIRECT_URI);
url.searchParams.set('response_type', 'code');
url.searchParams.set('approval_prompt', 'auto');
url.searchParams.set('scope', AMBITOS);
url.searchParams.set('state', estado);

function pagina(titulo, cuerpo) {
  return `<!doctype html><html lang="es"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${titulo}</title>
<style>body{font:16px/1.5 system-ui,sans-serif;max-width:34rem;margin:4rem auto;padding:0 1rem;color:#11191f}
h1{font-size:1.3rem}code{background:#eee;padding:.1rem .3rem;border-radius:4px}</style>
<h1>${titulo}</h1>${cuerpo}`;
}

const servidor = http.createServer(async (req, res) => {
  const u = new URL(req.url, `http://localhost:${cfg.PUERTO}`);
  if (u.pathname !== '/callback') { res.writeHead(404).end('no'); return; }

  const enviar = (code, html) => { res.writeHead(code, { 'content-type': 'text/html; charset=utf-8' }).end(html); };

  if (u.searchParams.get('state') !== estado) {
    enviar(400, pagina('Estado inválido', '<p>La respuesta no corresponde a esta sesión. Vuelve a ejecutar el comando.</p>'));
    return;
  }
  const error = u.searchParams.get('error');
  if (error) {
    enviar(400, pagina('Autorización cancelada', `<p>Strava devolvió <code>${error}</code>.</p>`));
    console.error('\n✗ Autorización cancelada:', error);
    servidor.close(); process.exit(1);
  }

  try {
    const t = await canjear(cfg, u.searchParams.get('code'));
    const concedidos = (u.searchParams.get('scope') || '').split(',');
    const faltan = AMBITOS.split(',').filter((a) => !concedidos.includes(a));
    enviar(200, pagina('Listo', '<p>Ya puedes cerrar esta pestaña y volver a la terminal.</p>' +
      (faltan.length ? `<p><b>Aviso:</b> no concediste <code>${faltan.join(', ')}</code>. Sin eso faltarán actividades privadas.</p>` : '')));
    console.log(`\n✓ Conectado como ${t.athlete?.firstname ?? ''} ${t.athlete?.lastname ?? ''} (id ${t.athlete?.id})`);
    console.log('  Tokens guardados en connector/.tokens.json (no lo subas a ningún repositorio).');
    if (faltan.length) console.warn('  ⚠ Permisos no concedidos:', faltan.join(', '));
    console.log('\nSiguiente paso: node connector/sync.mjs');
  } catch (e) {
    enviar(500, pagina('Error al canjear el código', `<pre>${e.message}</pre>`));
    console.error('\n✗', e.message);
  }
  servidor.close(); setTimeout(() => process.exit(0), 200);
});

servidor.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`\n✗ El puerto ${cfg.PUERTO} ya está ocupado por otro programa.`);
    console.error('  Cambia PUERTO en connector/.env por uno libre (p. ej. 8765) y vuelve a ejecutar.');
    console.error('  Strava sólo valida el dominio "localhost", así que no hay que tocar nada en su web.');
  } else console.error('\n✗', e.message);
  process.exit(1);
});

servidor.listen(cfg.PUERTO, () => {
  const ya = leerTokens();
  if (ya) console.log('· Ya existe una sesión guardada; al terminar se reemplazará.');
  console.log(`\nAbre esta dirección en tu navegador si no se abre sola:\n\n${url}\n`);
  console.log(`Esperando la respuesta en ${cfg.REDIRECT_URI} …`);
  console.log(`(Para desconectar más tarde: POST a ${OAUTH_REVOCAR} con tu access_token.)`);
  const abrir = process.platform === 'win32' ? `start "" "${url}"`
    : process.platform === 'darwin' ? `open "${url}"` : `xdg-open "${url}"`;
  exec(abrir, () => {});
});
