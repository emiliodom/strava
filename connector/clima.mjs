// clima.mjs — extractor de clima con APIs gratuitas y sin clave. Escribe data/clima.json con:
//   · actividades: el clima de cada actividad del año (hora de inicio y de mitad), del lugar donde se hizo.
//   · pronostico: los próximos 7 días por horas del lugar actual (Retalhuleu o Charlotte durante el viaje).
// Fuentes (por orden de precisión):
//   1. NWS api.weather.gov, estación KCLT (aeropuerto de Charlotte): observaciones MEDIDAS de los últimos ~7 días.
//   2. Open-Meteo forecast (past_days=10): modelos de alta resolución para los días recientes.
//   3. Open-Meteo archive (reanálisis ERA5, ~5 días de retraso): todo lo anterior.
// Open-Meteo es CC BY 4.0 (se cita en la web). El lugar se decide por fecha (viajes) y por nombre de la actividad;
// para Charlotte se usa Revolution Park (punto público), no la dirección de la familia.
// Uso: node clima.mjs   (lo corre actualizar.sh después del sync de Strava)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATOS = path.join(RAIZ, 'ano2026_datos.min.json');
const SALIDA = path.join(RAIZ, 'data', 'clima.json');
const UA = 'strava-clima/1.0 (uso personal)';

export const LUGARES = {
  reu: { nom: 'Retalhuleu', lat: 14.536, lon: -91.678 },
  clt: { nom: 'Charlotte (Revolution Park)', lat: 35.2085, lon: -80.871, nws: 'KCLT' },
  coban: { nom: 'Cobán', lat: 15.470, lon: -90.371 },
  cantel: { nom: 'Cantel', lat: 14.811, lon: -91.457 },
  xela: { nom: 'Quetzaltenango', lat: 14.845, lon: -91.518 },
  toto: { nom: 'Totonicapán', lat: 14.911, lon: -91.361 },
  antigua: { nom: 'Antigua Guatemala', lat: 14.557, lon: -90.733 },
  tecpan: { nom: 'Tecpán', lat: 14.762, lon: -90.994 },
  pana: { nom: 'Panajachel', lat: 14.740, lon: -91.159 },
  amatitlan: { nom: 'Amatitlán', lat: 14.477, lon: -90.617 },
  esquipulas: { nom: 'Esquipulas', lat: 14.563, lon: -89.351 }
};
// Viajes (copia de VIAJE en assets/ajuste.js): fuera de estas fechas, Retalhuleu salvo que el nombre diga otra cosa.
const VIAJES = [{ lugar: 'clt', desde: '2026-11-25', hasta: '2027-01-13' }];
const POR_NOMBRE = [
  [/cob[aá]n/i, 'coban'], [/cantel/i, 'cantel'], [/xela|quetzaltenango/i, 'xela'], [/campanabaj|totonicap/i, 'toto'],
  [/antigua|utg/i, 'antigua'], [/tecp[aá]n/i, 'tecpan'], [/panajachel|pana epic|sibaná?\b.*pana/i, 'pana'],
  [/amatitl[aá]n|utam/i, 'amatitlan'], [/esquipulas|chat[uú]n/i, 'esquipulas']
];

const HORAS = 'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,precipitation';
const r1 = (x) => (x == null || !isFinite(x) ? null : Math.round(x * 10) / 10);

export function lugarDe(fecha, nombre = '') {
  for (const [re, k] of POR_NOMBRE) if (re.test(nombre)) return k;
  const v = VIAJES.find((x) => fecha >= x.desde && fecha <= x.hasta);
  return v ? v.lugar : 'reu';
}

// Sensación térmica (fórmula de Environment Canada / NWS, válida con T ≤ 10 °C y viento > 4,8 km/h).
export function sensacion(t, vKmh) {
  if (t == null || vKmh == null || t > 10 || vKmh <= 4.8) return t;
  const p = Math.pow(vKmh, 0.16);
  return 13.12 + 0.6215 * t - 11.37 * p + 0.3965 * t * p;
}

async function json(url, headers = {}) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA, ...headers } });
      if (r.ok) return await r.json();
      if (r.status < 500) throw new Error(r.status + ' ' + url);
    } catch (e) { if (i === 2) throw e; }
    await new Promise((res) => setTimeout(res, 1500 * (i + 1)));
  }
}

function aMapa(h, fuente, mapa) {
  (h.time || []).forEach((t, i) => {
    mapa[t] = { t: r1(h.temperature_2m[i]), st: r1(h.apparent_temperature[i]), hr: h.relative_humidity_2m[i], v: r1(h.wind_speed_10m[i]), pp: r1(h.precipitation[i]), f: fuente };
  });
}

// Horas locales 'AAAA-MM-DDTHH:00' → valores, de archive + forecast (forecast pisa a archive en los días recientes).
async function horasModelo(L, desde, hasta) {
  const mapa = {};
  const hoy = new Date().toISOString().slice(0, 10);
  const finArchivo = new Date(Date.now() - 6 * 864e5).toISOString().slice(0, 10);
  if (desde <= finArchivo) {
    const fin = hasta < finArchivo ? hasta : finArchivo;
    const a = await json(`https://archive-api.open-meteo.com/v1/archive?latitude=${L.lat}&longitude=${L.lon}&start_date=${desde}&end_date=${fin}&hourly=${HORAS}&timezone=auto`);
    aMapa(a.hourly, 'open-meteo ERA5', mapa);
  }
  if (hasta >= finArchivo || hasta >= hoy) {
    const f = await json(`https://api.open-meteo.com/v1/forecast?latitude=${L.lat}&longitude=${L.lon}&hourly=${HORAS}&past_days=10&forecast_days=1&timezone=auto`);
    aMapa(f.hourly, 'open-meteo modelo', mapa);
  }
  return mapa;
}

// Observaciones medidas de una estación NWS (últimos ~7 días), por hora local de la zona dada.
async function horasNws(estacion, zona) {
  const d = await json(`https://api.weather.gov/stations/${estacion}/observations?limit=500`, { Accept: 'application/geo+json' });
  const fmt = new Intl.DateTimeFormat('sv-SE', { timeZone: zona, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' });
  const mapa = {};
  for (const f of d.features || []) {
    const p = f.properties, t = p.temperature && p.temperature.value;
    if (t == null) continue;
    const k = fmt.format(new Date(p.timestamp)).replace(' ', 'T').slice(0, 13) + ':00';
    if (mapa[k]) continue;   // la primera (más reciente) de cada hora
    const v = p.windSpeed && p.windSpeed.value, hr = p.relativeHumidity && p.relativeHumidity.value;
    const st = (p.windChill && p.windChill.value != null) ? p.windChill.value : (p.heatIndex && p.heatIndex.value != null ? p.heatIndex.value : t);
    mapa[k] = { t: r1(t), st: r1(st), hr: hr == null ? null : Math.round(hr), v: r1(v), pp: null, f: 'NWS ' + estacion + ' (medido)' };
  }
  return mapa;
}

function horaLocal(iso, minMas = 0) {
  // start_local viene como hora local con «Z» falsa: se trata como reloj de pared.
  const d = new Date(Date.parse(iso.replace('Z', '') + 'Z') + minMas * 60000);
  return d.toISOString().slice(0, 13) + ':00';
}

async function main() {
  const datos = JSON.parse(fs.readFileSync(DATOS, 'utf8'));
  const acts = (datos.actividades || []).filter((a) => a.start_local);
  const porLugar = {};
  for (const a of acts) {
    const f = a.start_local.slice(0, 10), k = lugarDe(f, a.name);
    (porLugar[k] = porLugar[k] || []).push(a);
  }
  const salida = { meta: { generado: new Date().toISOString(), fuentes: ['Open-Meteo (CC BY 4.0) · open-meteo.com', 'NWS api.weather.gov (EE. UU., dominio público)'], nota: 'Clima del modelo o reanálisis en el punto del lugar; en Charlotte, los últimos ~7 días son observaciones medidas en el aeropuerto (KCLT).' }, lugares: LUGARES, actividades: {}, pronostico: null };

  for (const [k, lista] of Object.entries(porLugar)) {
    const L = LUGARES[k];
    const fechas = lista.map((a) => a.start_local.slice(0, 10)).sort();
    let horas = await horasModelo(L, fechas[0], fechas[fechas.length - 1]);
    if (L.nws) {
      try { const obs = await horasNws(L.nws, 'America/New_York'); horas = { ...horas, ...obs }; }
      catch (e) { console.warn('· NWS no respondió (' + e.message + '); sigo con Open-Meteo'); }
    }
    for (const a of lista) {
      const h0 = horas[horaLocal(a.start_local)], hm = horas[horaLocal(a.start_local, (a.elapsed_time || a.moving_time || 0) / 120)];
      const h = hm || h0;
      if (!h) continue;
      salida.actividades[a.id] = { l: k, ini: h0 ? h0.t : null, ...h };
    }
    console.log(`✓ ${L.nom}: ${lista.length} actividades`);
  }

  // Pronóstico de 7 días del lugar de hoy.
  const hoy = new Date().toISOString().slice(0, 10), k = lugarDe(hoy), L = LUGARES[k];
  const p = await json(`https://api.open-meteo.com/v1/forecast?latitude=${L.lat}&longitude=${L.lon}&hourly=${HORAS},precipitation_probability,weather_code&daily=temperature_2m_min,temperature_2m_max,precipitation_sum,sunrise,sunset&forecast_days=7&timezone=auto`);
  const H = p.hourly;
  salida.pronostico = {
    lugar: k, nom: L.nom, zona: p.timezone,
    dias: p.daily.time.map((t, i) => ({ f: t, min: r1(p.daily.temperature_2m_min[i]), max: r1(p.daily.temperature_2m_max[i]), pp: r1(p.daily.precipitation_sum[i]), sale: p.daily.sunrise[i].slice(11), pone: p.daily.sunset[i].slice(11) })),
    horas: H.time.map((t, i) => [t, r1(H.temperature_2m[i]), r1(H.apparent_temperature[i]), r1(H.wind_speed_10m[i]), H.precipitation_probability[i], H.weather_code[i]])
  };
  fs.mkdirSync(path.dirname(SALIDA), { recursive: true });
  fs.writeFileSync(SALIDA, JSON.stringify(salida));
  console.log(`✓ data/clima.json: ${Object.keys(salida.actividades).length} actividades con clima · pronóstico de ${L.nom}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((e) => { console.error('✗ clima:', e.message); process.exit(1); });
}
