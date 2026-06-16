# Spec Kit Features

Feature specifications live in numbered directories: `specs/001-<short-name>/`, `specs/002-<short-name>/`, …

## Required workflow for ALL code changes

See **`.specify/memory/change-policy.md`** and **`AGENTS.md`**.

```
specify → clarify → checklist → plan → tasks → analyze → implement → validate
```

No edits to `src/` or `App.tsx` without a matching feature directory and task IDs.

## Per-feature artifacts

| Artifact | Purpose |
|----------|---------|
| `spec.md` | Requirements and user stories |
| `plan.md` | Technical approach and architecture |
| `tasks.md` | Implementation checklist (code maps to task IDs) |
| `quickstart.md` | Manual validation steps |
| `validation-results.md` | QA sign-off (when applicable) |
| `analysis-report.md` | spec ↔ plan ↔ tasks consistency |
| `checklists/` | Quality gates |
| `contracts/` | API shapes when non-trivial |

Create a new feature with `/speckit-specify` or `.specify/scripts/powershell/create-new-feature.ps1`.

Active feature path: `.specify/feature.json`.

## Features on this branch

| ID | Directory |
|----|-----------|
| 001 | `specs/001-library-load-review/` |
| 002 | `specs/002-auth-login-fix/` |
| 003 | `specs/003-app-session-bootstrap/` |
| 004 | `specs/004-reader-type-detection/` |
| 005 | `specs/005-volume-display/` |
| 006 | `specs/006-library-data-reset/` |
| 007 | `specs/007-library-browse-stability/` — signed off |
| 008 | `specs/008-reading-progress-sync/` — signed off |
| 009 | `specs/009-series-detail-load/` — signed off |
| 010 | `specs/010-series-detail-search/` — **active** |

## Next action queue

1. **010** — series detail search (T003 manual sign-off).
2. **003 / 004** — session bootstrap + reader type manual QA.
