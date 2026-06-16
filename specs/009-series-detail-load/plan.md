# Plan: Series Detail Load Performance

## Root causes

1. `Promise.all(getSeriesById, getVolumes)` — UI blocked on slower of two calls.
2. `ScrollView` + `volumes.map` — all chapter `Image` components mount at once.
3. `await cacheChapter` on tap — multi-second delay before reader.
4. Verbose debug logging on every volume/chapter during load.

## Approach (mirror library browse)

1. **Progressive fetch**: series metadata → paint header → volumes → build rows.
2. **Seed header** from navigation params when available (`seriesName` from library card).
3. **`buildSeriesDetailRows`**: flatten volumes using existing `volumeDisplay` helpers.
4. **`FlatList`**: `initialNumToRender`, `windowSize`, memoized row components, `recyclingKey` on covers.
5. **Prefetch**: `onViewableItemsChanged` for chapter/volume cover URLs.
6. **Navigate first**: `cacheChapter` in background after `navigate`.
7. **Cancel**: bump `loadRequestRef` on unmount.

## API note

`GET /api/Series/volumes?seriesId=` returns the full tree — no pagination. Virtualization is the primary win.

## Validation

Open multi-volume manga (14+ vols) and large chapter count — header appears first, scroll stays responsive, reader opens on tap without cache wait.
