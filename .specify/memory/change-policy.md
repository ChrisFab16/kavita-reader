# Code Change Policy (KavitaReader)

**Effective:** 2026-06-16

## Rule

**Every code change** MUST be traceable to a numbered feature under `specs/<NNN>-<name>/` through the full Spec Kit workflow. No drive-by edits.

## Required workflow (in order)

```
/speckit-specify → /speckit-clarify → /speckit-checklist → /speckit-plan → /speckit-tasks → /speckit-analyze → /speckit-implement
```

| Step | Gate |
|------|------|
| **specify** | `spec.md` exists with user stories + FR-xxx |
| **plan** | `plan.md` describes approach, files, risks |
| **tasks** | `tasks.md` has checkboxes; each code change maps to a task ID |
| **analyze** | spec ↔ plan ↔ tasks consistent (read-only); gaps fixed before implement |
| **implement** | Code matches tasks; tasks marked `[x]` as completed |
| **validate** | `quickstart.md` run; results in `validation-results.md` when manual QA applies |

**Kavita API:** canonical contracts in `specs/contracts/` — update alongside `src/api/kavitaClient.ts` / `kavitaFilterV2.ts`.

## Before editing `src/` or `App.tsx`

1. Read `.specify/feature.json` — know the active feature directory.
2. If no feature covers the work: **create one first** (`specs/004-…` via Spec Kit scripts or hand from templates).
3. If work spans features: update **each** affected `specs/<NNN>/` (cross-feature deps per constitution).
4. Add or update tasks **before** writing code (or in the same commit series — never code-only).

## Exceptions (narrow)

- **Markdown-only** outside `specs/` when user explicitly requests doc-only work.
- **Dependency version bumps** — still need a task under an appropriate feature or `chore/deps` spec stub.

## Retroactive changes

If code landed without specs (e.g. hotfix), **backfill** `spec.md`, `plan.md`, `tasks.md` immediately and mark tasks `[x]` to match reality before the next PR or commit.

## Upstream contributions

Fork PRs to **cbytestech/kavita-reader** ship **`specs/contracts/`** only (not `.specify/`, `.cursor/speckit-*`, or `specs/00N/`). Full Spec Kit stays on **`speckit-work`**.

See **[docs/upstream-contribution.md](../docs/upstream-contribution.md)** and **[upstream-contribution-policy.md](./upstream-contribution-policy.md)**.

## Active features (this branch)

| ID | Scope | Status |
|----|-------|--------|
| 001 | Library load perf + scroll stability | **Signed off** — T011–T016 deferred |
| 002 | Auth login + logout credential cleanup | Signed off |
| 003 | App session bootstrap (skip Connect on restart) | Implemented — validation pending |
| 006 | Library reset, refresh, collections, scoping | **Signed off** |
| 007 | Library browse pagination, loading, scoping | **Signed off** |
| 008 | Reading progress sync to Kavita | **Active** — save currently failing |
| 009 | Series detail load (FlatList, progressive) | **Signed off** |
