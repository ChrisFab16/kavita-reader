# Tasks: Tablet Layout Support

## Phase 0 — Analysis & contracts

- [ ] T001 Read existing `013` responsive layout code and `014` Home navigation patterns
- [ ] T002 Add contract doc `specs/contracts/tablet-layout-breakpoints.md` summarizing breakpoint helpers and expected column counts
- [ ] T003 Add `analysis-report.md` for 016-tablet-layout (spec ↔ plan ↔ tasks consistency)

## Phase 1 — Foundation

- [ ] T004 Add `useWindowSizeClass()` hook and `isTabletExpanded()` helper in `src/utils/responsiveLayout.ts`
- [ ] T005 Add `getTabletGridMetrics()` helper with max-card-width cap (160–180 dp) and column count beyond 5 for expanded widths
- [ ] T006 Add unit tests for breakpoint helpers and tablet grid metrics
- [ ] T007 Add `TabletTwoPane.tsx` reusable two-pane shell component with left/right pane props and divider

## Phase 2 — Home two-pane

- [ ] T008 Refactor `HomeScreen.tsx` to detect expanded landscape and render two-pane layout
- [ ] T009 Add `TabletHomeMaster.tsx` left pane: shelf chips + Libraries + Collections + Currently Reading + Want to Read
- [ ] T010 Add `TabletHomeDetail.tsx` right pane: selected grid (library, collection, on-deck, want-to-read)
- [ ] T011 Update `LibraryDetailScreen.tsx` to support an `inline` render mode (no header, no navigation chrome) for the right pane
- [ ] T012 Wire selection state in Home: default to first library; tapping shelf/library updates right pane
- [ ] T013 Add unit tests for Home tablet layout helpers (optional) or update fixtures

## Phase 3 — Series detail two-pane

- [ ] T014 Update `SeriesDetailScreen.tsx` with conditional two-pane layout on expanded landscape
- [ ] T015 Extract left pane content (cover, summary, actions) into a pure component
- [ ] T016 Extract right pane content (chapter/volume list) into a pure component
- [ ] T017 Ensure tapping a chapter/volume from the right pane opens the reader
- [ ] T018 Add quickstart step for tablet Series Detail layout

## Phase 4 — Reader on tablets

- [ ] T019 Update `ImageReaderScreen.tsx` to limit displayed page width and letterbox background on wide screens
- [ ] T020 Update `EpubReaderScreen.tsx` to limit max content width to ~800 dp and adjust margins
- [ ] T021 Update tap zone helpers to use a comfortable physical edge distance rather than a fixed percentage of total width
- [ ] T022 Add quickstart step for tablet reader

## Phase 5 — Forms and settings

- [ ] T023 Constrain `SettingsScreen.tsx` content width and center on very wide screens
- [ ] T024 Constrain `LoginScreen.tsx` content width and center on very wide screens
- [ ] T025 Constrain `ConnectScreen.tsx` content width and center on very wide screens

## Phase 6 — Validation

- [ ] T026 Manual quickstart on tablet emulator (10" landscape + portrait)
- [ ] T027 Manual quickstart on phone emulator to confirm no regression from 013/014
- [ ] T028 Record results in `validation-results.md`
- [ ] T029 Update `specs/README.md` and `feature_roadmap_doc.md` if tablet scope changes roadmap milestones

## Maintenance

- [ ] T030 Regression: `013` browse grid tests still pass (phone breakpoints unchanged)
- [ ] T031 Regression: `014` personal-list navigation still works on phones
