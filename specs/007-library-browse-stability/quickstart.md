# Quickstart: Library Browse Stability

## Prerequisites

- Kavita server with a library of **100+ series** (Comics on `https://comics.skadaha.dk` if available)
- Android emulator or device with dev build
- Metro: `npm start`

## Pagination

1. Open Home → tap a library with 100+ series.
2. **Pass**: First screen shows up to 100 series (not ~6).
3. Scroll to bottom slowly.
4. **Pass**: More series append; scroll position preserved (no jump to top).
5. Continue until no new items load.
6. **Pass**: No error flash; no infinite spinner at bottom.

## Loading & back

1. Open a large library (slow network optional: enable airplane mode briefly after tap).
2. Immediately press hardware back (or header back).
3. **Pass**: Previous screen appears without multi-second freeze.
4. Re-open library; wait for grid.
5. **Pass**: Full-screen loader clears; grid interactive.

## Refresh vs reset

1. Pull-to-refresh on library grid.
2. **Pass**: Inline refresh indicator only; grid stays visible.
3. Settings → Reset & reload libraries → confirm.
4. **Pass**: Returns to Home; reopen library — fresh page 0, scroll loads more if needed.

## Library scope

1. Open Comics library — note series titles.
2. Open a different library (e.g. Manga if present).
3. **Pass**: No series from the other library appear in the grid.

## Collections (006 integration)

1. Home → tap a collection tag if listed.
2. **Pass**: Collection grid paginates same as library browse.

## Sign-off

Record pass/fail and device in [validation-results.md](./validation-results.md).
