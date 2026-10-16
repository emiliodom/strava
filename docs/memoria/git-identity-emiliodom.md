---
name: git-identity-emiliodom
description: This repo must be committed and pushed as GitHub account emiliodom, not emiliodparasol
metadata:
  type: feedback
---

Commit and push the strava project as **emiliodom** (remote `https://github.com/emiliodom/strava.git`). The machine's `gh` also has `emiliodparasol` logged in; the user switched to emiliodom with `gh auth switch --user emiliodom`.

**Why:** the user said this project uses emiliodom for committing and pushing; the other account would push as the wrong user or get a 403.

**How to apply:** before any push run `gh auth status` and confirm emiliodom is active. Repo-local git identity is `emiliodom <1676547+emiliodom@users.noreply.github.com>` (noreply, set with `git config`, not global). Only commit/push when asked; push to `main` was explicitly approved for v0.11.0. If a 403 appears, a cached Keychain credential for the other account is the likely cause.
