# Analysis Report: Library Load Code Review

**Date**: 2026-06-16  
**Scope**: Correctness + performance — library browse path  
**Method**: Static code review + API contract research (Spec Kit `001-library-load-review`)

---

## Executive Summary

**Primary bottleneck (confirmed):** `KavitaClient.getSeries` performs **1 + N HTTP requests** where N = number of series returned (up to 100). Each extra call fetches full volume/chapter trees only to display subtitle text on library cards. This alone explains slow library loads on emulator and will be worse on device with remote servers.

**Recommended fix:** Return `all-v2` list data as-is; use `pages` / `pagesRead` (and Kavita list count fields if present) for card subtitles. Fetch volumes only on series detail.

---

## Critical: N+1 in `getSeries`

```219:236:src/api/kavitaClient.ts
      const enrichedSeries = await Promise.all(
        seriesList.map(async (series) => {
          try {
            const volumes = await this.getVolumes(series.id);
            const totalChapters = volumes.reduce((sum, vol) => {
              return sum + (vol.chapters?.length || 0);
            }, 0);
            return {
              ...series,
              volumeCount: volumes.length,
              chapterCount: totalChapters,
            };
```

**Impact**: 100-series library → 101 requests fired concurrently. Server connection pool, emulator networking, and JSON parsing all multiply. User sees blank spinner until **all** complete.

**Call site**:

```40:40:src/screens/LibraryDetailScreen.tsx
      const response = await client.getSeries(libraryId, 0, 100);
```

**Also affects** `serverStore.searchSeriesAcrossServers` — loops all libraries × `getSeries` (compound disaster).

---

## High: Loading state bugs (`LibraryDetailScreen`)

### Infinite spinner if client null

```31:35:src/screens/LibraryDetailScreen.tsx
  const loadSeries = async () => {
    if (!client) {
      console.log('No client available');
      return;
    }
```

Initial `loading=true`. Early return never reaches `finally` → **permanent spinner**.

### Refresh triggers full-screen loader

`onRefresh` → `loadSeries()` → `setLoading(true)` despite separate `refreshing` state. Pull-to-refresh replaces grid with blocking loader.

### Silent failures

Errors only logged; UI may show misleading empty state string referencing `series.length`.

---

## Medium: UI / render performance

| Issue | Location | Effect |
|-------|----------|--------|
| No pagination | `getSeries(..., 0, 100)` | Libraries >100 truncated; still pays N+1 for 100 |
| `Math.random()` keys | `keyExtractor` line 195 | Unstable keys → unnecessary remounts |
| Unmemoized sort/filter | every render | Extra CPU on search |
| 100 cover URLs at once | `expo-image` in grid | Network/decode storm after metadata finally loads |
| `ScrollView` all chapters | `SeriesDetailScreen` | Large series = many simultaneous cover requests |
| `await cacheChapter` before navigate | `handleChapterPress` | Tap feels laggy |

---

## Medium: API / types

- `SeriesDto` in `types/kavita.ts` lacks volume/chapter count fields; code uses `any` everywhere.
- Kavita `all-v2` list items likely already expose `pages`, `pagesRead`, and possibly `volumes`/`chapters` counts (per Kavita SeriesDto docs) — enrichment is redundant.
- Request interceptor re-reads AsyncStorage when `this.token` is null — minor latency on first burst of parallel requests.

---

## Low: Emulator-specific factors

- x86_64 emulator networking to LAN Kavita adds latency vs physical device.
- Debug dev client + Metro overhead unrelated to library API path.
- Cover image loading is sequential bottleneck **after** metadata — separate optimization track.

---

## Correctness notes (non-performance)

- `getSeries` fallback to `/api/Series/series` returns **unenriched** data — inconsistent subtitles if primary path partially fails.
- `loadSeries` `useEffect([])` ignores `libraryId` / `client` changes — stale data if navigated without unmount (stack usually remounts — low risk).
- Progress bar uses `pagesRead / pages` without zero guard — possible NaN width if `pages` is 0.

---

## Priority remediation order

1. **Remove N+1 enrichment** in `getSeries` (largest win)
2. **Fix loading/error states** in `LibraryDetailScreen`
3. **Pagination** for large libraries
4. **Virtualize** series detail chapter list
5. **Background cache** on chapter open

---

## Spec Kit alignment

| Artifact | Status |
|----------|--------|
| spec.md | Complete |
| plan.md | Complete |
| tasks.md | 19 tasks, none implemented |
| Constitution check | Pass |

Next step: `/speckit-implement` Phase 1 tasks or request implementation of T001–T008.
