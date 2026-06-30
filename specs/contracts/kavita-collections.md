# Contract: Kavita collections

Collection tags group series across libraries. Implemented for Home browse + `LibraryDetailScreen` in collection mode.

**Implementation:** `getCollections()`, `getSeriesByCollectionList()` in `src/api/kavitaClient.ts`

## Endpoints

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/Collection` | Returns `CollectionTagDto[]` (`id`, `title`, …) |
| GET | `/api/Series/series-by-collection` | Query: `collectionId`, `PageNumber`, `PageSize` |

## Pagination

Same as [kavita-pagination.md](./kavita-pagination.md):

- `PageNumber` is **1-based**
- Parse **`Pagination` response header**
- Reuse `hasMoreSeriesPages` / append flow from library browse

## Navigation

`HomeScreen` → `LibraryDetail` with `{ collectionId, libraryName: title }` (no `libraryId`).

Collection grid uses the same infinite-scroll and loading patterns as library browse (spec 007).

## Verified

- 2026-06-16: Implemented under spec 006.
