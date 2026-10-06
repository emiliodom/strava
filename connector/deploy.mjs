/* deploy.mjs — publica la pagina en Google Cloud Storage con `gcloud storage`.
   Sube solo lo que la pagina necesita y nunca credenciales ni el crudo de la API. */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { RAIZ, config } from './strava.mjs';

const args = new Set(process.argv.slice(2));
const SIMULAR = args.has('--simular') || args.has('--dry-run');

let cfg = {};
try { cfg = config(); } catch { cfg = { ...process.env }; }   // desplegar no exige credenciales de Strava
const BUCKET = (cfg.GCS_BUCKET || '').replace(/^gs:\/\//, '').replace(/\/+$/, '');
if (!BUCKET) {
  console.error('✗ Falta GCS_BUCKET en connector/.env (p. ej. GCS_BUCKET=analisis-emilio).');
  console.error('  Crear el bucket una sola vez:');
  console.error('    gcloud storage buckets create gs://TU-BUCKET --location=us-central1 --uniform-bucket-level-access');
  console.error('    gcloud storage buckets add-iam-policy-binding gs://TU-BUCKET --member=allUsers --role=roles/storage.objectViewer');
  console.error('    gcloud storage buckets update gs://TU-BUCKET --web-main-page-suffix=index.html --web-error-page=index.html');
  process.exit(1);
}

/* Lista blanca: todo lo demas se queda en tu disco. */
const ARCHIVOS = ['index.html', 'ano2026_datos.min.json'];
const CARPETAS = ['assets'];

for (const f of ARCHIVOS) {
  if (!fs.existsSync(path.join(RAIZ, f))) {
    console.error(`✗ Falta ${f}. Genera los datos antes con: node connector/build.mjs`);
    process.exit(1);
  }
}

const gcloud = (...a) => {
  console.log('  gcloud ' + a.join(' '));
  if (SIMULAR) return;
  execFileSync('gcloud', a, { stdio: 'inherit', cwd: RAIZ, shell: process.platform === 'win32' });
};

console.log(`· publicando en gs://${BUCKET}${SIMULAR ? ' (simulacion)' : ''}…`);
try {
  for (const f of ARCHIVOS) {
    // El JSON y el HTML cambian en cada sincronizacion: sin cache.
    gcloud('storage', 'cp', f, `gs://${BUCKET}/${f}`, '--cache-control=no-cache, max-age=0');
  }
  for (const c of CARPETAS) {
    gcloud('storage', 'rsync', c, `gs://${BUCKET}/${c}`, '--recursive', '--delete-unmatched-destination-objects',
      '--cache-control=public, max-age=3600');
  }
} catch (e) {
  console.error('\n✗ gcloud fallo. Comprueba que esta instalado y con sesion iniciada:');
  console.error('    gcloud auth login && gcloud config set project TU-PROYECTO');
  process.exit(1);
}

console.log(`\n✓ Listo: https://storage.googleapis.com/${BUCKET}/index.html`);
console.log('  (Si configuraste el bucket como sitio web, tambien responde en tu dominio.)');
