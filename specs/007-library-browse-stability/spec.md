# Feature Specification: Library Browse Stability

**Feature Branch**: `fix/login-credential-handling` (shared with 001–006)

**Created**: 2026-06-16

**Status**: Signed off — 2026-06-16 (see validation-results.md)

**Input**: After 006 library scoping and refresh, manual QA found regressions: only ~6 series visible, scroll-to-bottom showed no more items then jumped to top, back button unresponsive during load, and loading spinner never cleared. Work was implemented without Spec Kit artifacts; this spec backfills traceability.

**Related specs**: [001-library-load-review](../001-library-load-review/spec.md) (FR-002 pagination, scroll), [006-library-data-reset](../006-library-data-reset/spec.md) (scoping, refresh, collections).

## User Scenarios & Testing

### User Story 1 - Full library via infinite scroll (Priority: P1)

As a reader with 100+ series in a library, I can scroll the grid and load additional pages until the server reports no more items.

**Acceptance Scenarios**:

1. **Given** a library with more than `PAGE_SIZE` (100) series, **When** I open the library, **Then** the first page renders and I can scroll to load more without losing scroll position.
2. **Given** I reach the last page, **When** `onEndReached` fires, **Then** no duplicate fetch runs and the list does not jump to the top.
3. **Given** server returns pagination metadata, **When** append completes, **Then** `hasMore` derives from `hasNextPage` or `currentPage < totalPages` (1-based response pages).

---

### User Story 2 - Loading completes and back works (Priority: P1)

As a reader, I can leave a library while data is loading without a stuck spinner or frozen back navigation.

**Acceptance Scenarios**:

1. **Given** initial series load in progress, **When** I press hardware back or navigate away, **Then** the in-flight request is cancelled (request id bump) and the previous screen responds immediately.
2. **Given** `onEndReached` fires during initial load, **When** append and main load share request tracking, **Then** append MUST NOT invalidate the main load's `setLoading(false)`.
3. **Given** load completes successfully, **When** the grid is visible, **Then** `loading` is false and inline refresh does not show a full-screen blocker.

---

### User Story 3 - Correct library scope and sort (Priority: P1)

As a reader, the library grid shows only series belonging to the opened library, sorted consistently with the server.

**Acceptance Scenarios**:

1. **Given** Kavita returns cross-library rows in an `all-v2` attempt, **When** `libraryId` is present on DTOs, **Then** client filters to matching `libraryId` and tries alternate request shapes until scoped results or exhaustion.
2. **Given** user selects sort mode, **When** list loads, **Then** sort is applied via FilterV2 `sortOptions` on the server (no client re-sort on append that would reorder the grid).
3. **Given** Kavita query params, **When** requesting page 0 internally, **Then** API receives `PageNumber=1` (1-based).

---

## Functional Requirements

- **FR-001**: Library browse MUST use separate code paths for initial/refresh load vs append (`append: true`), so pagination does not share `loadRequestRef` cancellation with the main load.
- **FR-002**: `onEndReached` MUST be gated until initial load completes (`endReachedReadyRef`) and after `onMomentumScrollBegin` on first paint.
- **FR-003**: Append MUST merge pages with stable dedupe by series `id` (`mergeSeriesPages`).
- **FR-004**: `getSeriesList` MUST try legacy body-first then FilterV2 attempts; scope results with `filterSeriesForLibrary`; skip attempts that return provably cross-library data when filterable.
- **FR-005**: Refresh and reset reload page 0 only; further pages load on scroll (supersedes 006 FR-007 "fetch all pages" for browse).
- **FR-006**: `LibraryDetailScreen` MUST register blur + `BackHandler` to bump `loadRequestRef` on navigate away.
- **FR-007**: Collection browse MUST use the same pagination and loading patterns as library browse.

## Non-Functional Requirements

- **NFR-001**: At most one append request in flight (`loadingMoreRef`).
- **NFR-002**: Default page size 100 for library and collection lists.

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Reader first | Pass | Browse reliability |
| VII. Settings parity | Pass | Reset from 006 unchanged |

## Out of Scope

- Replacing `getAllSeriesInLibrary` helper (retained for callers that need full fetch)
- SeriesDetail chapter virtualization (001 T011)
- Live probe of Kavita `sortField` enum values

## Key Files

- `src/screens/LibraryDetailScreen.tsx`
- `src/api/kavitaClient.ts`
- `src/api/kavitaFilterV2.ts`
- `src/utils/seriesPagination.ts`
- `src/utils/seriesLibraryFilter.ts`
- **Contracts:** [specs/contracts/](../../contracts/README.md)
