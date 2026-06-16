# KavitaReader — Required Specification Artifacts

When planning **foundation** or **cross-cutting** features, `/speckit-plan` MUST ensure the feature directory contains (or references) these artifacts. Feature-scoped work may subset this list but MUST not contradict foundation specs.

## Product & Requirements

- [ ] Product specification (feature scope aligned to `feature_roadmap_doc.md` / README)
- [ ] Functional requirements (testable FR-xxx)
- [ ] Non-functional requirements (NFR-xxx) — privacy, offline, performance on device

## Domain & Behavior

- [ ] Domain model (servers, libraries, series, chapters, progress, settings)
- [ ] User stories with acceptance scenarios
- [ ] Kavita API touchpoints (endpoints, auth, error cases) — reference `src/api/kavitaClient.ts`
- [ ] Reader state flows (open → navigate → sync progress → background/return)

## Architecture

- [ ] Screen / navigation map (`AppNavigator`, `RootStackParamList`)
- [ ] State ownership (Zustand stores vs local screen state)
- [ ] API client contracts (new methods on `KavitaClient` or separate module)

## Data & Contracts

- [ ] TypeScript types (`src/types/kavita.ts` amendments)
- [ ] AsyncStorage / persist keys (no collisions across servers)
- [ ] Contracts folder for API request/response shapes when non-trivial

## Cross-Cutting

- [ ] UI specifications (Paper components, theme tokens from `src/utils/theme.ts`)
- [ ] Settings parity — new config exposed in `SettingsScreen`
- [ ] Error handling (user-facing messages vs `debugLogger`)
- [ ] Testing strategy (manual quickstart; unit tests when logic is extractable)

## Cross-Feature Dependencies

When a feature changes semantics of an existing field or flow:

- [ ] Upstream contract amendments (link prior `specs/` or `kavitaClient` behavior)
- [ ] Manual quickstart step with **external outcome** (e.g. progress visible in Kavita web UI)
- [ ] No FR that “defers to existing X” without a task validating X

## Delivery

- [ ] EAS build impact (new permissions, plugins, `app.json` changes)
- [ ] Play Store / privacy doc updates when data handling changes

## Every code change (2026-06-16)

- [ ] Work maps to `specs/<NNN>/tasks.md` task IDs
- [ ] `spec.md` and `plan.md` updated if scope or approach changed
- [ ] `/speckit-analyze` or `analysis-report.md` before merge
- [ ] See `.specify/memory/change-policy.md`

## Milestone Phases (from roadmap)

| Phase | Scope |
|-------|-------|
| v1.0.x | Core read + sync + themes (shipped baseline) |
| v1.1.0 | Notifications, reading goals, audiobook playback |
| v1.2+ | Offline downloads, statistics, tablet layouts — see roadmap |
