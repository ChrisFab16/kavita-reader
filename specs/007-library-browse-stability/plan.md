# Plan: Library Browse Stability

## Root causes (QA regressions)

1. **Shared request id**: `onEndReached` during initial load incremented `loadRequestRef`, so the main load's `finally` skipped `setLoading(false)`.
2. **Pagination off**: Refresh/reset or wrong page numbering yielded partial lists (~6 items) or false "no more" at bottom.
3. **Scroll jump**: Client re-sort on append or unstable list identity after partial reload reset scroll offset.
4. **Blocked navigation**: Long-running load with no cancel on blur/back.

## Approach

1. **Split load paths** in `LibraryDetailScreen.loadSeries`:
   - Main path: initial, refresh, reset — uses `loadRequestRef`, sets `loading`/`refreshing`.
   - Append path: `{ append: true, page: pageRef + 1 }` — uses `loadingMoreRef` only; never bumps `loadRequestRef`.

2. **Pagination utilities** (`seriesPagination.ts`):
   - `mergeSeriesPages`, `hasMoreSeriesPages`, `sortOptionsForMode`.
   - Unit tests for merge, hasMore, sort options.

3. **API client** (`kavitaClient.ts`):
   - `toApiPageNumber(page + 1)` for query params.
   - Attempt order: legacy body → FilterV2 without sort → FilterV2 with sort → empty body → GET fallback.
   - `scopeSeriesToLibrary` + `hasCrossLibrarySeries` to pick first scoped non-empty result.

4. **End-reach gating**:
   - `endReachedReadyRef = false` at start of main load; set `true` only when main load completes for this request id.
   - `onMomentumScrollBegin` sets ready if user scrolls before gate opens (FlatList quirk).

5. **Cancel on leave**: blur listener + hardware back both bump `loadRequestRef`; stale responses ignored.

6. **006 alignment**: Refresh/reset fetch page 0 with `noCache`; user scroll loads subsequent pages. Update 006 FR-007 wording accordingly.

## Risks

- Kavita `sortField` IDs (1=name, 3=recent) are inferred — wrong enum causes silent wrong sort; document in contract, validate on live server.
- `filterSeriesForLibrary` passes through unscoped lists when DTOs omit `libraryId` — may show cross-library data on some server versions.

## Validation

See [quickstart.md](./quickstart.md). Record in [validation-results.md](./validation-results.md).
