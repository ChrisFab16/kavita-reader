# Upstream contribution vs fork Spec Kit workflow

**Decision date:** 2026-06-16  
**Fork:** [ChrisFab16/kavita-reader](https://github.com/ChrisFab16/kavita-reader)  
**Upstream:** [cbytestech/kavita-reader](https://github.com/cbytestech/kavita-reader)  
**Upstream PR:** [#5](https://github.com/cbytestech/kavita-reader/pull/5)  
**Cleanup commit:** `4df4b2a` on `fix/login-credential-handling`

This document records **why** we split documentation between branches, **what** each branch contains, and **how** to develop on the fork while contributing cleanly upstream.

---

## Summary

We ship **application code + Kavita API contracts** upstream. We keep **Spec Kit tooling and numbered feature specs** on a dedicated fork branch for our own traceability and agent workflow.

| Audience | Branch | What they need |
|----------|--------|----------------|
| Upstream maintainers | `fix/login-credential-handling` → `cbytestech/main` | `src/`, tests, `specs/contracts/`, slim `AGENTS.md` |
| Fork development (us) | `speckit-work` | Full `.specify/`, `.cursor/speckit-*`, `specs/001`–`010`, backlog |
| Either | Both (when synced) | Same `src/` at shared commits; docs diverge after `4df4b2a` |

---

## Why we made this choice

The integration branch originally included **~93 Spec Kit files** (40 under `.specify`/`.cursor`, 53 under `specs/001`–`010`) alongside real app changes. That created problems for an upstream first contribution:

1. **Review noise** — Maintainers must review app behavior, not Cursor slash-command skills or PowerShell scaffolding scripts.
2. **Tooling coupling** — `.specify/` and `.cursor/skills/speckit-*` are agent/IDE workflow, not runtime dependencies.
3. **Duplication** — Feature specs repeated content already distilled into `specs/contracts/` (FilterV2, pagination, progress, auth).
4. **Fork-specific process** — Spec Kit is our development methodology; upstream did not adopt it.

We still value Spec Kit on the fork for:

- Traceable feature history (`spec.md` → `plan.md` → `tasks.md` → `validation-results.md`)
- Agent instructions and analyze gates
- Manual QA quickstarts and sign-off records

So we **preserved the full tree** on `speckit-work` and **stripped tooling + feature dirs** from the upstream-facing branch, keeping only **`specs/contracts/`** as portable API documentation.

---

## Branch layout

```
speckit-work                    ← full Spec Kit tree (fork-only development)
    │
    │  shared history through 3c13458
    │
fix/login-credential-handling   ← upstream PR branch (contracts only)
    │
    └── 4df4b2a  chore: drop Spec Kit artifacts, keep specs/contracts only
```

### `speckit-work` (full tree)

**Purpose:** Continue Spec Kit workflow, agents, and feature artifact history.

**Contains everything on the integration branch before cleanup, plus this doc:**

| Path | Role |
|------|------|
| `.specify/` | Spec Kit config, memory, templates, scripts, workflows |
| `.cursor/rules/specify-rules.mdc` | Cursor rules for Spec Kit |
| `.cursor/skills/speckit-*` | Slash-command skill definitions |
| `specs/001`–`specs/010/` | Numbered feature specs, plans, tasks, validation |
| `specs/backlog/` | Ideas not yet specified (e.g. reader page prefetch) |
| `specs/contracts/` | **Canonical Kavita API contracts** (also on upstream branch) |
| `docs/upstream-contribution.md` | This file |
| `AGENTS.md` | Full Spec Kit + Context7 agent instructions |

**Remote:** `origin/speckit-work` on ChrisFab16/kavita-reader.

### `fix/login-credential-handling` (upstream PR)

**Purpose:** Contribution to cbytestech/kavita-reader.

**Documentation included:**

| Path | Role |
|------|------|
| `specs/contracts/` | Kavita client ↔ server contracts (8 files) |
| `docs/upstream-contribution.md` | This policy (so upstream reviewers see the rationale) |
| `AGENTS.md` | Slim: contracts + Context7 + conventions (no Spec Kit gates) |
| `src/test-fixtures/` | Test data moved out of `specs/005-…/fixtures/` |

**Excluded after `4df4b2a`:**

- `.specify/`, `.cursor/` (speckit)
- `specs/001`–`specs/010/`, `specs/README.md`

---

## What stayed in `specs/contracts/`

These files are the **portable, maintainer-facing** API documentation. They map directly to `src/` and are safe to merge upstream.

| Contract | Implementation touchpoints |
|----------|---------------------------|
| [kavita-auth.md](../specs/contracts/kavita-auth.md) | `kavitaClient` interceptors, login/logout |
| [kavita-filter-v2.md](../specs/contracts/kavita-filter-v2.md) | `src/api/kavitaFilterV2.ts` |
| [kavita-pagination.md](../specs/contracts/kavita-pagination.md) | `src/utils/kavitaPagination.ts` |
| [kavita-series-list.md](../specs/contracts/kavita-series-list.md) | Library browse, `getSeries` |
| [kavita-series-detail.md](../specs/contracts/kavita-series-detail.md) | `SeriesDetailScreen`, FlatList |
| [kavita-collections.md](../specs/contracts/kavita-collections.md) | Collection tags |
| [kavita-reader-progress.md](../specs/contracts/kavita-reader-progress.md) | `readingProgress.ts`, reader screens |
| [README.md](../specs/contracts/README.md) | Index + regression checklist |

Content formerly only in feature specs was **merged or relocated**:

- `specs/002-auth-login-fix/contracts/auth-routes.md` → `specs/contracts/kavita-auth.md`
- `specs/005-volume-display/fixtures/dungeon-meshi-volumes.json` → `src/test-fixtures/dungeon-meshi-volumes.json`

---

## Workflows

### Day-to-day development (fork)

1. Check out **`speckit-work`** (or a feature branch cut from it).
2. Follow Spec Kit: `.specify/feature.json`, `specs/<NNN>/`, `AGENTS.md`.
3. Update **`specs/contracts/`** whenever Kavita API behavior changes.
4. Run `npm test`; record manual QA in `validation-results.md`.

### Preparing an upstream contribution

1. Implement on `speckit-work` (or merge feature work into `fix/login-credential-handling`).
2. Ensure **`specs/contracts/`** reflects all API changes.
3. On the upstream branch, **do not** add `.specify/`, `.cursor/speckit-*`, or new `specs/00N/` dirs unless upstream explicitly asks.
4. Open PR: `ChrisFab16:<branch>` → `cbytestech/main`.
5. PR description: link contracts, test plan, **not** Spec Kit task IDs.

### Syncing branches after cleanup

```bash
# App code: merge or cherry-pick from speckit-work → fix/login-credential-handling
git checkout fix/login-credential-handling
git merge speckit-work   # resolve: keep contracts-only tree on conflicts in specs/

# Contracts only: can cherry-pick doc commits both ways
git checkout speckit-work
git cherry-pick <commit>   # e.g. contract updates from upstream branch
```

**Rule of thumb:** `src/` and `specs/contracts/` should stay aligned across branches; Spec Kit dirs exist only on `speckit-work`.

### Recovering full Spec Kit after checking out the clean branch

```bash
git checkout speckit-work
# or
git show speckit-work:specs/008-reading-progress-sync/spec.md
```

Deleting artifacts from the PR branch **does not** delete them from `speckit-work` or git history before `4df4b2a`.

---

## For upstream reviewers

- **No behavioral change** from the cleanup commit — only documentation and agent tooling removed.
- **Contracts** document Kavita integration pitfalls we hit in production (FilterV2 field 19, `Pagination` header, `libraryId` on progress POST, etc.).
- **Tests:** `npm test` (34 unit tests); fixture at `src/test-fixtures/dungeon-meshi-volumes.json`.
- Questions about removed feature specs: see fork branch `speckit-work` or ask the contributor.

---

## Related documents

| Document | Branch | Purpose |
|----------|--------|---------|
| This file | both | Policy and branch strategy |
| [.specify/memory/upstream-contribution-policy.md](../.specify/memory/upstream-contribution-policy.md) | `speckit-work` | Agent summary + gates |
| [.specify/memory/change-policy.md](../.specify/memory/change-policy.md) | `speckit-work` | Spec Kit change policy |
| [specs/contracts/README.md](../specs/contracts/README.md) | both | API contract index |
| [AGENTS.md](../AGENTS.md) | branch-specific | Agent instructions |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-16 | Opened upstream PR #5; fork PR #2 |
| 2026-06-16 | Created `speckit-work` at `3c13458`; cleaned PR branch in `4df4b2a` |
| 2026-06-16 | Added this documentation on `speckit-work` |
