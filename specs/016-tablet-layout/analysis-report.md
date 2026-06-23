# Analysis Report: 016-tablet-layout

**Date**: 2026-06-23  
**Scope**: spec.md ↔ plan.md ↔ tasks.md consistency; no code review

## Specification Analysis Report

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| C1 | Coverage | LOW | spec FR-004, tasks | "Cap card width ~160–180 dp" is a range; T005 should pick a single value or document threshold | T005: choose max card width 160 dp for consistency; mention phone cap remains 5 columns |
| C2 | Underspec | MEDIUM | plan.md, tasks | No mention of how to handle the currently selected item when rotating from two-pane to single-pane | Add T008/T014 note: preserve selected item in local state; if none selected, default to first library |
| C3 | Underspec | LOW | spec US3 | Tap zones based on "comfortable physical distance" is vague | T021: define as ~80 dp from screen edges, or use a percentage capped at 120 dp |
| C4 | Coverage | LOW | spec FR-009, tasks | Settings/Login/Connect width constraints are P2 but no specific max-width helper is proposed | T023–T025: use a shared `maxFormWidth` constant (~600 dp) |
| D1 | Duplication | LOW | spec FR-002 vs plan | Both describe two-pane Home; acceptable because plan adds implementation detail | Keep as-is |
| G1 | Gap | LOW | tasks | No contract update task for reader tap zone changes | T002 already covers tablet layout breakpoints; T021 will document reader-specific behavior inline |

## Coverage Summary

| Requirement | Has Task? | Task IDs | Notes |
|-------------|-----------|----------|-------|
| FR-001 Breakpoint system | Yes | T004 | |
| FR-002 Home two-pane | Yes | T007–T012 | |
| FR-003 Library detail inline | Yes | T011 | |
| FR-004 Expanded grid columns | Yes | T005 | C1 to resolve exact cap |
| FR-005 Series detail two-pane | Yes | T014–T017 | |
| FR-006 Image/PDF max width | Yes | T019 | |
| FR-007 EPUB max width | Yes | T020 | |
| FR-008 Tap zone distance | Yes | T021 | C3 to resolve exact distance |
| FR-009 Form width constraints | Yes | T023–T025 | C4 to share constant |
| FR-010 Phone regression | Yes | T030, T031 | |
| SC-001 10" tablet landscape | Manual | T026 | |
| SC-002 10" tablet portrait | Manual | T026 | |
| SC-003 Phone unchanged | Manual | T027 | |
| SC-004 Reader no stretching | Manual | T022 | |
| SC-005 Unit tests | Yes | T006, T013 | |
| US1 Browse libraries | Yes | T008–T013 | |
| US2 Series detail | Yes | T014–T018 | |
| US3 Reader | Yes | T019–T022 | |
| US4 Forms | Yes | T023–T025 | |

## Constitution Alignment

| Principle | Status | Notes |
|-----------|--------|-------|
| I Reader First | **Pass** | Layout only; no admin features |
| II Privacy | **Pass** | Local breakpoints |
| III Offline | **Pass** | Display-only |
| IV Format Fidelity | **Pass** | Reader limits preserve readability |
| V Multi-server | **Pass** | No server state impact |
| VI Expo Conventions | **Pass** | RN APIs + Paper |
| VII Settings | **Pass** | No new settings required |

**No CRITICAL constitution violations.**

## Unmapped Tasks

None — all tasks map to at least one FR, user story, or maintenance gate.

## Metrics

| Metric | Value |
|--------|-------|
| Functional requirements | 10 |
| Success criteria | 5 |
| User stories | 4 |
| Tasks | 31 |
| Requirement coverage | 100% |
| Ambiguity count | 3 |
| Duplication count | 1 |
| Critical issues | 0 |

## Cross-feature dependencies

| Feature | Dependency | Status |
|---------|------------|--------|
| 013 | Grid helpers, landscape 5-column rule | Must preserve phone behavior |
| 014 | Home shelf selector, personal-list navigation | Must work in two-pane master |
| 009 | Series detail structure | Reused in two-pane layout |
| 011 | Reader tap zones | Adjusted for tablets |

## Verdict

**Ready for Phase 0 implementation review.** The plan is consistent with the spec and tasks. The three LOW/MEDIUM ambiguities (card width cap, rotation state, tap zone distance) should be resolved during T004/T005/T021 implementation before code is merged.

## Next actions

1. Resolve C1, C3, C4 in implementation or update spec/plan with concrete values.
2. Set `.specify/feature.json` to `specs/016-tablet-layout`.
3. Begin T004 once feature is marked active.
