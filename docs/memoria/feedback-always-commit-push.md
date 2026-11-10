---
name: feedback-always-commit-push
description: In the strava repo, always commit + push to main as emiliodom and update docs after every change, without asking
metadata:
  type: feedback
---

After any change in the strava project, commit and push to main as emiliodom and update the docs (CHANGELOG, README version, CLAUDE.md, memory copied to docs/memoria/) — no need to ask first. Bump the patch/minor version and `?v=` in index.html.

**Why:** User said on 2026-11-10 "ok, always commit and push as emiliodom and update docs" after I left a change uncommitted waiting for approval.

**How to apply:** Finish every task with docs + version bump + commit + push; verify `gh auth status` shows emiliodom. Supersedes the "commit only when asked" note in CLAUDE.md for this project. See [[git-identity-emiliodom]].
