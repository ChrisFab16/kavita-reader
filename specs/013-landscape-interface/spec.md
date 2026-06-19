# Feature Specification: Landscape Interface

**Feature Branch**: `013-landscape-interface`

**Created**: 2026-06-19

**Status**: Implemented — validation pending (T007)

**Input**: Interface must be functional and optimized when using the app in horizontal (landscape) mode.

## Scope

| In scope | Out of scope |
|----------|--------------|
| App-wide rotation support (browse + readers) | Tablet-only split-pane master/detail |
| Responsive library/home grids | iOS-specific QA |
| Compact browse chrome in landscape (header search, reduced top padding) | Series detail search relocation (stays inline; see 010) |
| Series detail + settings usability in landscape | New reader gestures (see 011) |
| EPUB reader tap zones + layout refresh on rotate | Web/desktop layout |

## User Stories

### US1 — Browse libraries in landscape (P1)

As a user with the phone rotated, I want library and series grids to use horizontal space efficiently so I can browse without oversized cards or broken layouts.

**Acceptance**:
1. Rotating on Home or Library Detail recalculates column count (2 portrait → 3–5 landscape by width).
2. No stale `Dimensions.get` at module load — layouts update via `useWindowDimensions`.
3. FlatList scroll position stable after rotation (list remounts with new key if needed).
4. Permanent search bar removed from browse body; search opens from header magnify icon only when needed.
5. Landscape browse uses compact section padding (no wasted top band below header).

### US2 — Navigation screens remain usable (P1)

As a user in landscape, I want Connect, Login, Settings, and Series Detail to remain readable and scrollable.

**Acceptance**:
1. Forms and lists do not clip off-screen.
2. Series header row layout preserved; search bar accessible.

### US3 — Readers support landscape (P1)

As a reader in landscape, I want image and EPUB readers to respect orientation without forcing portrait on exit.

**Acceptance**:
1. `app.json` allows rotation (`default`).
2. Image reader keeps unlock while open; does **not** lock portrait on exit.
3. EPUB reader tap zones and chrome use live window dimensions.

## Functional Requirements

- **FR-001**: Set Expo `orientation` to `default`.
- **FR-002**: Shared `responsiveLayout` helpers for grid columns and card sizing.
- **FR-003**: `LibraryDetailScreen` dynamic N-column grid.
- **FR-004**: `HomeScreen` dynamic library/collection card widths.
- **FR-005**: `EpubReaderScreen` uses `useWindowDimensions` for layout and tap zones.
- **FR-006**: `ImageReaderScreen` removes portrait re-lock on unmount.
- **FR-007**: Home and Library Detail expose search via header magnify/close icon; search bar hidden by default.
- **FR-008**: Landscape browse uses compact padding and smaller section chrome on Home/Library Detail.
