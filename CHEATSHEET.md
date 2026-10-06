# Cheatsheet · mistrava

Comandos de uso diario y de montaje. Para el detalle y los diagramas, mira [README.md](README.md).

Rutas del servidor (Hostinger), todas dentro de
`~/domains/lightgray-loris-461230.hostingersite.com/`:

| Carpeta | Qué es | ¿La borra el deploy? |
|---|---|---|
| `public_html/` | El sitio que sirve el dominio | **Sí**, en cada publicación |
| `mistrava-store/` | `config.php` + fotos del registro de comidas | No (hermana de public_html) |
| `mistrava-cron/` | Clon del repo + `.env` + `.tokens.json` para el cron | No (hermana de public_html) |

Regla de oro: **lo secreto o lo que se escribe en el servidor** vive a la par de
`public_html`; **lo que descarga el navegador** (`ano2026_datos.min.json`) vive
dentro de `public_html` y se repone solo en cada deploy desde git.

---

## En tu PC (local)

```bash
# autorizar con Strava (UNA vez, abre el navegador)
cd connector && npm run auth

# uso diario: bajar de Strava y regenerar el JSON + datos.js
npm run actualizar          # = sync.mjs && build.mjs --js

# ver la página en el móvil por la red local
npm run serve               # imprime http://localhost:8000 y la IP de red
```

Abrir `index.html` con doble clic funciona sólo si generaste `datos.js` (lo hace
`build.mjs --js`); el navegador bloquea `fetch` sobre `file://`.

---

## Montaje del servidor (UNA sola vez)

```bash
cd ~/domains/lightgray-loris-461230.hostingersite.com

# 1) almacén persistente del registro de comidas
mkdir -p mistrava-store/datos
cat > mistrava-store/config.php <<'PHP'
<?php return ['token' => 'PON-UNA-FRASE-LARGA-Y-UNICA'];
PHP
chmod 600 mistrava-store/config.php

# 2) clon del repo para el cron (fuera de public_html; no hay deps npm que instalar)
git clone https://github.com/emiliodom/strava.git mistrava-cron
```

Desde tu PC, sube los dos secretos al clon (no están en git):

```powershell
scp connector/.env         u437428262@TU-HOST:~/domains/lightgray-loris-461230.hostingersite.com/mistrava-cron/connector/.env
scp connector/.tokens.json u437428262@TU-HOST:~/domains/lightgray-loris-461230.hostingersite.com/mistrava-cron/connector/.tokens.json
```

Permitir `git push` desde el servidor (PAT fine-grained de GitHub con permiso
*Contents: Read and write* sobre `emiliodom/strava`):

```bash
cd ~/domains/lightgray-loris-461230.hostingersite.com/mistrava-cron
git config user.name  "emiliodom"
git config user.email "TU-EMAIL-DE-GITHUB"
git remote set-url origin https://emiliodom:github_pat_XXXX@github.com/emiliodom/strava.git
git push origin main        # comprueba que empuja
```

Prueba manual (la 1.ª vez baja todos los detalles: ~40-45 min por el límite de
100 peticiones/15 min de Strava; déjalo con `nohup` para que sobreviva al SSH):

```bash
cd ~/domains/lightgray-loris-461230.hostingersite.com/mistrava-cron
nohup bash connector/actualizar.sh > cron.log 2>&1 &
tail -f cron.log
```

---

## Cron (Hostinger · Avanzado → Cron Jobs)

Comando (una línea), p. ej. a las 08:00 y 20:00:

```
/usr/bin/bash /home/u437428262/domains/lightgray-loris-461230.hostingersite.com/mistrava-cron/connector/actualizar.sh >> /home/u437428262/domains/lightgray-loris-461230.hostingersite.com/mistrava-cron/cron.log 2>&1
```

---

## Si algo falla

| Síntoma | Causa / arreglo |
|---|---|
| `node: command not found` en el cron | nvm no se cargó; el script hace `source $NVM_DIR/nvm.sh`. Verifica `echo $NVM_DIR` y la ruta de Node. |
| `No hay sesión de Strava` | Falta `connector/.tokens.json` en el clon. Córrelo con `npm run auth` en tu PC y vuelve a copiarlo. |
| El push del cron pide usuario/clave | No configuraste el PAT en el remoto (`git remote set-url …github_pat_…`). |
| La página dice que no encuentra los datos | El deploy no dejó `ano2026_datos.min.json` junto a `index.html` en `public_html`. Revisa que el deploy mapee la raíz del repo a la raíz de public_html. |
| El registro de comidas pierde el token/fotos tras publicar | `mistrava-store/` no existe o no es hermana de `public_html`. |
| `límite de la API alcanzado` | Normal en la 1.ª sync (100 req/15 min). El connector espera solo; déjalo correr. |

## Secretos (nunca en git)

`connector/.env` · `connector/.tokens.json` · `registro/config.php` · `registro/datos/*`
