# Tasks: Library Load Performance & Correctness

**Plan**: [plan.md](./plan.md)

## Phase 1 — Critical path (P1)

- [x] T001 Probe live Kavita `all-v2` response; document fields in `contracts/series-list.md`
- [x] T002 Remove `Promise.all(getVolumes)` enrichment from `getSeries` in `kavitaClient.ts`
- [x] T003 Add `getSeriesList` (or rename) returning paginated `{ result, pagination }` from `all-v2`
- [x] T004 Update `LibraryDetailScreen.getSeriesInfo` to use list DTO fields only (`seriesInfo.ts`)
- [x] T005 Fix null-client path: set `loading=false`, show error UI
- [x] T006 Fix refresh: use `refreshing` only; do not set `loading=true` on pull-to-refresh
- [x] T007 Add user-visible error state on `loadSeries` failure (retry UI)
- [x] T008 Fix `keyExtractor` — never use `Math.random()`; filter items without `id`
- [x] T010 Memoize `filteredSeries` / `sortedSeries` with `useMemo` (done in Phase 1)
- [x] T015 Add FlatList perf props (`initialNumToRender`, `windowSize`, `maxToRenderPerBatch`) on library grid

## Phase 1b — Scroll stability (P1, QA regression)

- [x] T020 Fix library grid scroll jump: `getItemLayout`, fixed `ITEM_HEIGHT`, `flex: 1` on FlatList
- [x] T021 Memoize `SeriesCard`; `recyclingKey` on covers; disable cover fade `transition`
- [x] T022 `removeClippedSubviews={false}` on Android; `keyboardDismissMode="on-drag"`
- [x] T023 Stable Zustand client subscription (`serverUrl`); full-screen loader only when no cached series
- [x] T024 Re-test scroll on emulator after reload; update `validation-results.md`
- [x] T025 Replace `numColumns` grid with explicit row model + accurate `getRowLayout`
- [x] T026 Fixed cover frame, reserved subtitle/progress slots, `Image.prefetch` for visible + ahead rows
- [ ] T027 Re-test scroll while covers load from server; confirm no jump

## Phase 2 — Scalability (P2)

- [ ] T009 Add FlatList pagination (`onEndReached`) for libraries > page size
- [ ] T011 Replace `SeriesDetailScreen` `ScrollView` chapter list with `FlatList`
- [ ] T012 Navigate to reader immediately; run `cacheChapter` in background
- [ ] T013 Gate `searchSeriesAcrossServers` on fixed list API (or add server-side search endpoint)

## Phase 3 — Polish (P3)

- [ ] T014 Extend `SeriesDto` in `types/kavita.ts` with list count fields
- [ ] T016 Optional: expo-image `cachePolicy` / placeholder for covers

## Phase 4 — Analyze & sign-off

- [ ] T017 Complete quickstart on emulator + real server; record in [validation-results.md](./validation-results.md)
- [ ] T018 `/speckit-analyze` — spec/plan/tasks consistency
- [ ] T019 Manual quickstart sign-off (pull-to-refresh + scroll re-test)
