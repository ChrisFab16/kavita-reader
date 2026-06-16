# Feature Specification: Series Detail Search

**Created**: 2026-06-16

**Status**: In progress

## User Story

As a reader browsing a series with many volumes/chapters, I want to search within the series detail list so I can jump to a specific volume or file without scrolling.

## Requirements

- **FR-001**: `SeriesDetailScreen` shows a `Searchbar` (same styling pattern as library browse).
- **FR-002**: Search filters **client-side** over the loaded volumes tree (no new Kavita API).
- **FR-003**: Match volume title, chapter display title, `titleName`, `range`, and `fileName` (case-insensitive substring).
- **FR-004**: Empty search shows full list; no matches shows a clear empty state.
- **FR-005**: Filtering preserves existing row layout rules via `buildSeriesDetailRows`.

## Key files

- `src/screens/SeriesDetailScreen.tsx`
- `src/utils/seriesDetailList.ts` — `filterVolumesForSearch`

## Related

- [009-series-detail-load](../009-series-detail-load/spec.md)
- [kavita-series-detail.md](../contracts/kavita-series-detail.md)
