# Contract: Kavita library series list

Browse series in a library via FilterV2 + paginated `all-v2` (or fallback `v2`).

**Related:** [kavita-filter-v2.md](./kavita-filter-v2.md) · [kavita-pagination.md](./kavita-pagination.md)

**Implementation:** `KavitaClient.getSeriesList()` in `src/api/kavitaClient.ts`

## Endpoints

| Method | Path | Body | Purpose |
|--------|------|------|---------|
| POST | `/api/Series/all-v2` | `FilterV2Dto` | Primary — all series matching filter |
| POST | `/api/Series/v2` | `FilterV2Dto` | Fallback — same repository method in Kavita |
| GET | `/api/Series/series` | — | **Deprecated fallback** — avoid (no pagination header) |

Kavita controller: `GetAllSeriesV2` calls `GetSeriesDtoForLibraryIdV2Async(userId, userParams, filterDto)` — **`libraryId` query param is not passed to the repository**. Library scope comes **only** from FilterV2.

## Request shape

**Query:** `PageNumber`, `PageSize` (see pagination contract).

**Body:** Library filter from `buildLibraryFilterBody(libraryId, sortBy?)` — see [kavita-filter-v2.md](./kavita-filter-v2.md).

### Client attempt order

1. `POST /api/Series/all-v2` — FilterV2 **without** sort (most compatible)
2. `POST /api/Series/all-v2` — FilterV2 **with** `sortOptions`
3. `POST /api/Series/v2` — FilterV2 without sort

Each attempt:

- Parse body as `SeriesDto[]`
- Parse `Pagination` header
- Reject if `hasCrossLibrarySeries()` (safety check when DTOs include `libraryId`)
- Accept first attempt with non-empty scoped results

### Do NOT

| Anti-pattern | Why |
|--------------|-----|
| POST body `{ libraryId, pageNumber, pageSize }` | Not valid FilterV2; ignored / wrong results |
| POST empty body `{}` | Global cross-library list; breaks pagination + scope |
| Rely on `libraryId` query param alone | Ignored by `all-v2` |
| Client-side filter as primary scope | Hides wrong API usage; truncates at first global page (~A–B) |
| N+1 `GET /api/Series/volumes` on list load | Performance — list DTO has counts |

## Response: SeriesDto fields (library grid)

| Field | Type | UI use |
|-------|------|--------|
| `id` | number | Keys, navigation, cover URL |
| `name` | string | Card title |
| `libraryId` | number | Scope validation (when present) |
| `pages` | number | Progress denominator |
| `pagesRead` | number | Progress bar |
| `volumes` | number | Subtitle count (not array) |
| `chapters` | number | Subtitle “books” when single volume |
| `created` | string | Sort / “recent” display |

Volume/chapter tree: **`GET /api/Series/volumes`** only on `SeriesDetailScreen`.

## UI integration

| Screen | Behavior |
|--------|----------|
| `LibraryDetailScreen` | Page 0 on open; `onEndReached` append; separate append vs main load request ids |
| Pull-to-refresh | Reload page 0 only |
| Settings reset | Page 0 + `noCache`; see spec 006 |

**Page size:** `PAGE_SIZE = 100` in `LibraryDetailScreen`.

## Tests

| Test file | Covers |
|-----------|--------|
| `src/api/kavitaFilterV2.test.ts` | Filter body |
| `src/utils/kavitaPagination.test.ts` | Header parse |
| `src/utils/seriesPagination.test.ts` | merge / hasMore |
| `src/utils/seriesLibraryFilter.test.ts` | Cross-library detection |
| `src/utils/librarySeriesLoad.test.ts` | Empty failure |

## Verified

- 2026-06-16: Kavita `SeriesController.cs` + FilterField enum fix (field 19).
- Live server (`comics.skadaha.dk`): pending quickstart sign-off in 007.
