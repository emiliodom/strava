# Instrucciones para Claude (proyecto strava)

**Lee primero `docs/memoria/MEMORY.md` y los archivos que enlaza**: contienen el estado del proyecto (v0.14.1), la arquitectura,
las trampas de CSS/Pico ya resueltas, las herramientas de verificación (`connector/contraste.mjs`, `pdf.mjs`) y las preferencias del usuario.

Cuenta de Git de este repo: **emiliodom** (comprueba `gh auth status` antes de empujar). Commits y push sólo cuando el usuario lo pida.

## En un portátil nuevo
Copia la memoria a la carpeta de memoria de Claude Code de ese proyecto (la ruta lleva la ruta absoluta del repo con `/` → `-`):

```bash
M=~/.claude/projects/$(pwd | sed 's|/|-|g')/memory
mkdir -p "$M" && cp docs/memoria/*.md "$M"/
```

Después de actualizar la memoria en una sesión, vuelve a copiar `$M/*.md` a `docs/memoria/` y haz commit para mantenerlas sincronizadas.
