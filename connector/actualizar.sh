#!/usr/bin/env bash
# actualizar.sh — tarea de cron del servidor: baja Strava, regenera ano2026_datos.min.json
# y lo publica por git para que el deploy de Hostinger lo republique en public_html.
#
# Vive en un CLON del repo FUERA de public_html (así sobrevive al deploy y guarda los
# secretos: connector/.env y connector/.tokens.json, ambos ignorados por git).
#
# Requisitos (una sola vez): npm install en connector/, connector/.env con las claves de
# Strava, connector/.tokens.json copiado tras hacer `npm run auth` en local, y un remoto
# con permiso de push (PAT o deploy key).
set -euo pipefail

# nvm no está en el PATH de cron: lo cargamos a mano.
export NVM_DIR="$HOME/.nvm"
# shellcheck disable=SC1090
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$RAIZ"

git pull --rebase --autostash origin main
( cd connector && npm run actualizar )   # sync.mjs + build.mjs --js

if git diff --quiet -- ano2026_datos.min.json; then
  echo "· $(date +%F' '%H:%M) sin cambios en los datos"
else
  git add ano2026_datos.min.json
  git commit -m "datos: sync automático $(date +%F' '%H:%M)"
  # el sync puede tardar y main avanzar entretanto: rebase antes de empujar
  git pull --rebase --autostash origin main
  git push origin main
  echo "✓ $(date +%F' '%H:%M) datos actualizados y publicados"
fi
