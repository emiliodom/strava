/* strava.mjs — cliente mínimo de la API de Strava: configuración, tokens y peticiones con respeto al límite. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const DIR = path.dirname(fileURLToPath(import.meta.url));
export const RAIZ = path.resolve(DIR, '..');
const ENV = path.join(DIR, '.env');
const TOKENS = path.join(DIR, '.tokens.json');

export const API = 'https://www.strava.com/api/v3';
export const OAUTH_AUTORIZAR = 'https://www.strava.com/oauth/authorize';
export const OAUTH_TOKEN = 'https://www.strava.com/oauth/token';
export const OAUTH_REVOCAR = 'https://www.strava.com/oauth/revoke';
export const AMBITOS = 'activity:read_all,profile:read_all';

/* ---------- configuración ---------- */
export function config() {
  const cfg = { ...process.env };
  if (fs.existsSync(ENV)) {
    for (const linea of fs.readFileSync(ENV, 'utf8').split(/\r?\n/)) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(linea);
      if (m) cfg[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  }
  if (!cfg.STRAVA_CLIENT_ID || !cfg.STRAVA_CLIENT_SECRET) {
    throw new Error(
      'Faltan STRAVA_CLIENT_ID y STRAVA_CLIENT_SECRET.\n' +
      'Copia connector/.env.example a connector/.env y pon ahí los datos de tu aplicación de Strava\n' +
      '(se crean en https://www.strava.com/settings/api).');
  }
  cfg.PUERTO = Number(cfg.PUERTO || 8080);
  cfg.REDIRECT_URI = cfg.REDIRECT_URI || `http://localhost:${cfg.PUERTO}/callback`;
  return cfg;
}

/* ---------- tokens ---------- */
export function leerTokens() {
  if (!fs.existsSync(TOKENS)) return null;
  try { return JSON.parse(fs.readFileSync(TOKENS, 'utf8')); } catch { return null; }
}
export function guardarTokens(t) {
  fs.writeFileSync(TOKENS, JSON.stringify(t, null, 2));
  try { fs.chmodSync(TOKENS, 0o600); } catch { /* en Windows no aplica */ }
  return t;
}

export async function canjear(cfg, code) {
  const r = await fetch(OAUTH_TOKEN, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      client_id: cfg.STRAVA_CLIENT_ID, client_secret: cfg.STRAVA_CLIENT_SECRET,
      code, grant_type: 'authorization_code'
    })
  });
  if (!r.ok) throw new Error(`Strava rechazó el código (${r.status}): ${await r.text()}`);
  return guardarTokens(await r.json());
}

// Strava devuelve un refresh_token NUEVO en cada refresco: hay que guardarlo siempre.
export async function refrescar(cfg, t) {
  const r = await fetch(OAUTH_TOKEN, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      client_id: cfg.STRAVA_CLIENT_ID, client_secret: cfg.STRAVA_CLIENT_SECRET,
      refresh_token: t.refresh_token, grant_type: 'refresh_token'
    })
  });
  if (!r.ok) throw new Error(`No se pudo refrescar el token (${r.status}): ${await r.text()}`);
  const nuevo = await r.json();
  return guardarTokens({ ...t, ...nuevo });
}

export async function tokenValido(cfg) {
  let t = leerTokens();
  if (!t) throw new Error('No hay sesión de Strava. Ejecuta primero: node connector/auth.mjs');
  const ahora = Math.floor(Date.now() / 1000);
  if (t.expires_at - ahora < 300) {
    console.log('· token caducado, refrescando…');
    t = await refrescar(cfg, t);
  }
  return t.access_token;
}

/* ---------- peticiones ---------- */
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

export async function api(cfg, ruta, params = {}, intento = 0) {
  const token = await tokenValido(cfg);
  const url = new URL(API + ruta);
  for (const [k, v] of Object.entries(params)) if (v != null) url.searchParams.set(k, v);

  const r = await fetch(url, { headers: { authorization: `Bearer ${token}` } });

  // 429: se agotó la cuota de 15 minutos. Se espera al siguiente bloque.
  if (r.status === 429) {
    const uso = r.headers.get('x-ratelimit-usage') || '?';
    // Si lo agotado es el cupo del DÍA, esperar 15 minutos no sirve: hay que parar y volver mañana.
    const [u15, uDia] = uso.split(',').map(Number), [l15, lDia] = (r.headers.get('x-ratelimit-limit') || '').split(',').map(Number);
    if (lDia && uDia >= lDia) {
      throw Object.assign(new Error(`Se agotó el cupo diario de Strava (${uDia}/${lDia}). El progreso está guardado: vuelve a ejecutar sync.mjs mañana (se reinicia a las 00:00 UTC).`), { cupoDiario: true });
    }
    if (intento >= 12) throw new Error(`Strava sigue respondiendo 429 tras ${intento} esperas (uso ${uso}). Prueba de nuevo más tarde.`);
    const espera = Math.min(15 * 60, 60 * (intento + 1)) * 1000;
    console.warn(`· límite de la API alcanzado (uso ${uso}). Esperando ${Math.round(espera / 1000)} s…`);
    await dormir(espera);
    return api(cfg, ruta, params, intento + 1);
  }
  if (r.status >= 500 && intento < 4) {
    await dormir(1500 * (intento + 1));
    return api(cfg, ruta, params, intento + 1);
  }
  if (!r.ok) throw new Error(`GET ${ruta} → ${r.status}: ${await r.text()}`);

  const limite = r.headers.get('x-ratelimit-limit'), uso = r.headers.get('x-ratelimit-usage');
  if (limite && uso) {
    const [q15] = uso.split(',').map(Number), [l15] = limite.split(',').map(Number);
    if (l15 && q15 / l15 > 0.85) await dormir(2000);   // frenar antes de chocar
  }
  return r.json();
}
