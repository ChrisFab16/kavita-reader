# Feature Specification: Library Load Performance & Correctness Review

**Feature Branch**: `001-library-load-review`

**Created**: 2026-06-16

**Status**: Phase 1 implemented — manual QA in progress (scroll fix T020 pending re-test)

**Input**: User reports loading a real library is slow on the emulator. Request comprehensive code review for correctness and performance bottlenecks using Spec Kit.

## User Scenarios & Testing

### User Story 1 - Fast library browse (Priority: P1)

As a reader, when I open a library with many series, I see the grid within a few seconds on a LAN-connected server, without waiting for per-series detail fetches.

**Why this priority**: Directly matches reported slowness; blocks daily use.

**Independent Test**: Open a library with 50+ series on emulator against a real Kavita server; time from tap to first paint of series grid. Target: <3s on LAN (excluding cover image decode).

**Acceptance Scenarios**:

1. **Given** a library with 100 series, **When** LibraryDetail opens, **Then** at most **one** paginated series list API call runs before the grid renders.
2. **Given** series list is loaded, **When** subtitle text shows volume/book counts, **Then** counts come from list payload fields (`pages`, `pagesRead`, `volumes`, `chapters` or equivalent) — not per-series volume fetches.
3. **Given** pull-to-refresh, **When** user refreshes, **Then** inline refresh indicator is used without full-screen blocking loader.

---

### User Story 1b - Stable library grid scroll (Priority: P1)

As a reader browsing a large library, I can scroll through the series grid without the list jumping back to the top.

**Why this priority**: Discovered during Phase 1 manual QA; makes a fast library unusable.

**Acceptance Scenarios**:

1. **Given** a library with 50+ series and covers loading progressively, **When** user scrolls down, **Then** scroll offset is preserved (no snap to top).
2. **Given** fixed grid layout, **When** images finish loading, **Then** row heights do not invalidate scroll position.

---

### User Story 2 - Correct loading and error states (Priority: P1)

As a reader, I never get stuck on an infinite spinner when the client is unavailable or a request fails.

**Acceptance Scenarios**:

1. **Given** `getActiveClient()` is null on mount, **When** load runs, **Then** loading ends and user sees an actionable error/empty state.
2. **Given** API failure, **When** series load fails, **Then** user sees error feedback (not silent empty grid).
3. **Given** missing `item.id`, **When** list renders, **Then** keys are stable (no `Math.random()` in `keyExtractor`).

---

### User Story 3 - Scalable series detail (Priority: P2)

As a reader opening a large series, chapter list scrolls smoothly without loading hundreds of cover images upfront.

**Acceptance Scenarios**:

1. **Given** a series with 50+ chapters, **When** SeriesDetail opens, **Then** chapter list uses virtualization (`FlatList`/`FlashList`) or lazy cover loading.
2. **Given** user taps a chapter, **When** navigation occurs, **Then** reader opens immediately; caching runs in background.

---

## Functional Requirements

- **FR-001**: `getSeries` MUST NOT call `getVolumes` for every series in a library list response.
- **FR-002**: Library series list MUST support pagination beyond 100 items (infinite scroll or paged fetch).
- **FR-003**: `LibraryDetailScreen` MUST handle null client and API errors without infinite loading.
- **FR-004**: Pull-to-refresh MUST NOT toggle full-screen `loading` state.
- **FR-005**: `getSeriesInfo` MUST use Kavita list fields already present on `SeriesDto` (`pages`, `pagesRead`; verify `volumes`/`chapters` count fields from live API).
- **FR-006**: Cross-server search (`searchSeriesAcrossServers`) MUST NOT use unbounded `getSeries` enrichment until list path is fixed.
- **FR-007**: Library `FlatList` MUST use stable row measurements (`getItemLayout` or fixed item height) so cover image decode does not reset scroll offset.

## Non-Functional Requirements

- **NFR-001**: Library open on LAN — series metadata visible in <3s for 100-series library (P95).
- **NFR-002**: No more than 2 concurrent series-list requests per library open (initial + optional next page).
- **NFR-003**: Debug logging MUST remain disabled in production paths (`DEBUG_ENABLED = false`).

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Reader first | Pass | Fixes align with client-only browse |
| II. Privacy | Pass | No new telemetry |
| III. Offline tolerance | Partial | No caching layer yet — future work |
| IV. Format fidelity | Pass | No reader changes in scope |
| V. Multi-server | Warn | `searchSeriesAcrossServers` amplifies N+1 |
| VI. RN conventions | Pass | FlatList/memoization fixes in scope |
| VII. Settings parity | N/A | |

## Out of Scope

- Image CDN / cover disk cache (follow-up)
- Full offline library cache
- Server-side Kavita changes

## Key Files Under Review

- `src/api/kavitaClient.ts` — `getSeries`, interceptors
- `src/screens/LibraryDetailScreen.tsx`
- `src/screens/SeriesDetailScreen.tsx`
- `src/screens/HomeScreen.tsx`
- `src/stores/serverStore.ts` — `searchSeriesAcrossServers`
