# Implementation Plan: Library Load Performance & Correctness

**Spec**: [spec.md](./spec.md)  
**Created**: 2026-06-16

## Summary

Root cause of slow library load is an **N+1 API pattern** in `KavitaClient.getSeries`: one `all-v2` call plus **one `getVolumes` per series** (up to 100 parallel HTTP requests for a single library). Secondary issues: incorrect loading states, non-virtualized series detail, blocking chapter cache, and missing pagination.

## Architecture

### Current flow (slow)

```
LibraryDetailScreen.loadSeries()
  └─ getSeries(libraryId, 0, 100)
       ├─ POST /api/Series/all-v2          (1 request)
       └─ Promise.all(series.map(getVolumes))  (N requests, unbounded concurrency)
            └─ GET /api/Series/volumes?seriesId=…  × N
```

For N=100 on emulator + LAN server: 101 HTTP round-trips before `setSeries` — explains multi-second (or minute-scale) waits.

### Target flow

```
LibraryDetailScreen.loadSeries()
  └─ getSeriesList(libraryId, page)   // thin wrapper, no enrichment
       └─ POST /api/Series/all-v2     (1 request per page)
  └─ map subtitle from series.pages, series.pagesRead, series.volumes, series.chapters
  └─ FlatList onEndReached → next page
```

Volume/chapter structure fetched **only** on `SeriesDetailScreen` (already does `getVolumes` once).

## Findings Summary

| ID | Severity | Area | Issue |
|----|----------|------|-------|
| F-001 | **Critical** | `kavitaClient.getSeries` | N+1 `getVolumes` per series in list |
| F-002 | **High** | `LibraryDetailScreen` | `loadSeries` sets `loading=true` on refresh → full-screen blocker |
| F-003 | **High** | `LibraryDetailScreen` | Early `return` when `!client` leaves `loading=true` forever |
| F-004 | **High** | `LibraryDetailScreen` | API errors only `console.error`; user sees empty/wrong state |
| F-005 | **Medium** | `LibraryDetailScreen` | Hard cap 100 series, no pagination |
| F-006 | **Medium** | `LibraryDetailScreen` | `keyExtractor` fallback `Math.random()` causes list remounts |
| F-007 | **Medium** | `LibraryDetailScreen` | `filter`/`sort` not memoized; re-sort every keystroke |
| F-008 | **Medium** | `SeriesDetailScreen` | `ScrollView` renders all chapters + covers (no virtualization) |
| F-009 | **Medium** | `SeriesDetailScreen` | `await cacheChapter()` blocks navigation |
| F-010 | **Medium** | `serverStore` | `searchSeriesAcrossServers` calls `getSeries` per library (N+1²) |
| F-011 | **Low** | `kavitaClient` | Request interceptor may hit AsyncStorage per request if token unset |
| F-012 | **Low** | `types/kavita.ts` | `SeriesDto` missing count fields; encourages `any` |
| F-013 | **Info** | Emulator | x86 emulator + 100 cover downloads adds perceived slowness after metadata loads |

## Contracts

### `getSeries` (breaking internal contract)

**Before**: Returns enriched series with `volumeCount`, `chapterCount` from N volume fetches.

**After**:
- `getSeriesList(libraryId, pageNumber, pageSize)` → raw paginated result from `all-v2`
- `getSeries` deprecated or delegates to list without enrichment
- UI uses Kavita-native fields: `pages`, `pagesRead`; probe live API for `volumes`/`chapters` integer counts on list DTO

### `LibraryDetailScreen.getSeriesInfo`

Use list payload only:

```typescript
// Prefer API counts if present; fallback to pages
volumes ?? volumeCount
chapters ?? chapterCount  
pages / pagesRead for progress subtitle
```

## Constitution Check

Compliant. Removes redundant server load; improves reader-first browse. No privacy impact.

## Risks

- **API field names**: Kavita list DTO may use `volumes`/`chapters` vs camelCase — verify against live server response once and document in `contracts/series-list.md`.
- **Subtitle accuracy**: Without per-series volume fetch, edge-case labels ("X books" vs "X volumes") rely on list metadata — acceptable tradeoff; detail screen still authoritative.

## Validation

See [quickstart.md](./quickstart.md).
