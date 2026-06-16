# Contract: Kavita series detail (volumes tree)

**Endpoints used by `SeriesDetailScreen`:**

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/Series/{seriesId}` | Series metadata (title, summary) |
| GET | `/api/Series/volumes?seriesId=` | Full volume + chapter tree in **one response** (no server pagination) |

## Client performance strategy

Kavita does not paginate volumes. Apply the same **client-side** patterns as library browse:

1. **Progressive load** — show series header after `GET /Series/{id}`; load volumes second with inline footer spinner.
2. **Seed header** — pass `seriesName` / `seriesSummary` from library grid navigation when available.
3. **Virtualize** — `FlatList` over flattened rows from `buildSeriesDetailRows()` (see `volumeDisplay` rules).
4. **Cover images** — `recyclingKey`, `cachePolicy="memory-disk"`, prefetch visible + ahead rows only.
5. **Reader tap** — navigate immediately; `cacheChapter` in background (do not await before navigation).
6. **Progress refresh** — on return from reader, silently re-fetch `GET /api/Series/volumes` via `useFocusEffect` (updates `pagesRead` / progress bars without clearing the list).
7. **In-series search** — client-side filter on volumes tree; see [010-series-detail-search](../010-series-detail-search/spec.md).

## Row model

Built by `src/utils/seriesDetailList.ts`:

- `volume-header` — multi-chapter volume section header
- `volume-card` — collapsed single-archive volume (tappable)
- `chapter` — chapter row

## Related

- [kavita-series-list.md](./kavita-series-list.md) — library browse
- Spec [009-series-detail-load](../009-series-detail-load/spec.md)
