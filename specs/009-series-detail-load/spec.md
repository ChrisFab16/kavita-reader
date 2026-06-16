# Feature Specification: Series Detail Load Performance

**Created**: 2026-06-16

**Status**: Signed off — 2026-06-16 (see validation-results.md)

**Input**: Opening a series with many volumes/chapters is slow — full-screen block until all volumes load, ScrollView renders every chapter cover at once, chapter tap waits on `cacheChapter`.

**Related**: [001](../001-library-load-review/spec.md) T011–T012 (deferred), library browse patterns in [007](../007-library-browse-stability/spec.md).

## User Stories

### US1 — Fast series shell (P1)

As a reader, when I tap a series, I see the title/cover quickly while volumes load.

**Acceptance**: Series metadata visible before `GET /api/Series/volumes` completes; inline loader for chapter list only.

### US2 — Smooth scroll for large series (P1)

As a reader with 50+ chapters, I can scroll the chapter list without rendering all rows upfront.

**Acceptance**: `FlatList` virtualization; cover images load for visible rows only (`recyclingKey`, prefetch ahead).

### US3 — Instant reader open (P1)

As a reader, tapping a chapter opens the reader immediately; caching runs in background.

**Acceptance**: No `await cacheChapter` before `navigation.navigate('Reader')`.

## Functional Requirements

- **FR-001**: Fetch `GET /api/Series/{id}` first; fetch volumes second (progressive load).
- **FR-002**: Optional route params `seriesName` / `seriesSummary` from library grid for instant header.
- **FR-003**: Chapter list MUST use `FlatList` with flattened rows from `buildSeriesDetailRows`.
- **FR-004**: Reuse `volumeDisplay` rules for row shape (unchanged UX).
- **FR-005**: Request cancellation on unmount (request id bump).
- **FR-006**: Error + retry UI when load fails.

## Out of Scope

- Server-side volume pagination (Kavita returns full volume tree in one call)
- Disk cache of volume payloads

## Key Files

- `src/screens/SeriesDetailScreen.tsx`
- `src/utils/seriesDetailList.ts`
- `src/navigation/AppNavigator.tsx`
- `src/screens/LibraryDetailScreen.tsx`
