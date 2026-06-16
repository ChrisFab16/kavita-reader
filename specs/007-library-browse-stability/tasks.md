# Tasks: Library Browse Stability

**Plan**: [plan.md](./plan.md)

## Phase 1 — Pagination & merge (P1)

- [x] T001 Add `seriesPagination.ts`: `mergeSeriesPages`, `hasMoreSeriesPages`, `sortOptionsForMode`
- [x] T002 Unit tests for pagination helpers (`seriesPagination.test.ts`)
- [x] T003 `getSeriesList`: 1-based `PageNumber` query param via `toApiPageNumber`
- [x] T004 `getSeriesList`: attempt order (legacy body → FilterV2 → empty → GET fallback)
- [x] T005 `getSeriesByCollectionList`: 1-based page params; shared parse path
- [x] T006 `LibraryDetailScreen`: `PAGE_SIZE=100`, `pageRef`, `hasMoreRef`, append path separate from main load
- [x] T007 `LibraryDetailScreen`: `onEndReached` + `handleLoadMore` with append-only fetch
- [x] T008 Server-side sort via FilterV2 `sortOptions`; remove client re-sort on append

## Phase 2 — Loading & navigation (P1)

- [x] T009 Split `loadSeries`: append branch returns early without touching `loadRequestRef`
- [x] T010 Main load: request id guard on setState and `setLoading(false)` in `finally`
- [x] T011 Blur listener bumps `loadRequestRef` on navigate away
- [x] T012 `BackHandler` for hardware back during load
- [x] T013 `endReachedReadyRef` gate; set false at main load start, true on successful finally
- [x] T014 `onMomentumScrollBegin` enables end-reached after user scroll

## Phase 3 — Library scoping (P1)

- [x] T015 Add `seriesLibraryFilter.ts`: `filterSeriesForLibrary`, `hasCrossLibrarySeries`
- [x] T016 Unit tests for library filter (`seriesLibraryFilter.test.ts`)
- [x] T017 Wire scoping in `getSeriesList` attempt loop

## Phase 4 — Cross-spec & contracts

- [x] T018 Update [001 contracts/series-list.md](../001-library-load-review/contracts/series-list.md): 1-based pages, sortOptions, attempt order
- [x] T019 Amend [006 spec FR-007](../006-library-data-reset/spec.md): browse uses infinite scroll, not fetch-all
- [x] T020 Mark [001 T009](../001-library-load-review/tasks.md) implementation detail satisfied via 007

## Phase 5 — Validate & sign-off

- [x] T024 Fix FilterV2 library field (19 not 0) and AND combination; empty-load detection
- [x] T025 Central API contracts under [specs/contracts/](../../contracts/README.md) (filter, pagination, series list, collections)
- [x] T021 Run quickstart on emulator + live server (`https://comics.skadaha.dk`); record [validation-results.md](./validation-results.md)
- [x] T022 `/speckit-analyze` — [analysis-report.md](./analysis-report.md) (signed off 2026-06-16)

**Next:** [008 reading progress sync](../008-reading-progress-sync/spec.md) — progress save still failing.
