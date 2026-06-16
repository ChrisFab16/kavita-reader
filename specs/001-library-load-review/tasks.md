# Tasks: Library Load Performance & Correctness

**Plan**: [plan.md](./plan.md)

## Phase 1 — Critical path (P1)

- [x] T001 Probe live Kavita `all-v2` response; document fields in `contracts/series-list.md`
- [x] T002 Remove `Promise.all(getVolumes)` enrichment from `getSeries` in `kavitaClient.ts`
- [x] T003 Add `getSeriesList` (or rename) returning paginated `{ result, pagination }` from `all-v2`
- [x] T004 Update `LibraryDetailScreen.getSeriesInfo` to use list DTO fields only
- [x] T005 Fix null-client path: set `loading=false`, show error UI
- [x] T006 Fix refresh: use `refreshing` only; do not set `loading=true` on pull-to-refresh
- [x] T007 Add user-visible error state on `loadSeries` failure (Snackbar/Alert)
- [x] T008 Fix `keyExtractor` — never use `Math.random()`; filter items without `id`

## Phase 2 — Scalability (P2)

- [ ] T009 Add FlatList pagination (`onEndReached`) for libraries > page size
- [ ] T010 Memoize `filteredSeries` / `sortedSeries` with `useMemo`
- [ ] T011 Replace `SeriesDetailScreen` `ScrollView` chapter list with `FlatList`
- [ ] T012 Navigate to reader immediately; run `cacheChapter` in background
- [ ] T013 Gate `searchSeriesAcrossServers` on fixed list API (or add server-side search endpoint)

## Phase 3 — Polish (P3)

- [ ] T014 Extend `SeriesDto` in `types/kavita.ts` with list count fields
- [ ] T015 Add FlatList perf props (`initialNumToRender`, `windowSize`) on library grid
- [ ] T016 Optional: expo-image `cachePolicy` / placeholder for covers
- [ ] T017 Run quickstart on emulator + real server; record times in `validation-results.md`

## Phase 4 — Analyze & sign-off

- [ ] T018 `/speckit-analyze` — spec/plan/tasks consistency
- [ ] T019 Manual quickstart sign-off
