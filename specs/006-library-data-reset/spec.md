# Feature Specification: Library Data Reset

**Created**: 2026-06-16

**Status**: Signed off — 2026-06-16 (see validation-results.md)

**Input**: After comics move off a Kavita library/selection, pull-to-refresh keeps stale grid entries; user needs a full reset from Settings.

## User Scenarios & Testing

### User Story 1 - Full library reset from Settings (Priority: P1)

As a user who reorganized comics on Kavita, I can reset cached library display from Settings so the grid clears and reloads entirely from the server.

**Acceptance Scenarios**:

1. **Given** I am on Settings, **When** I tap "Reset & reload libraries" and confirm, **Then** cover cache is cleared, I return to My Libraries, and the library list reloads from the server.
2. **Given** I open a library after reset, **When** the grid loads, **Then** it shows only series currently on the server (no stale cards from prior session).
3. **Given** I cancel the confirmation, **When** I dismiss the alert, **Then** no reset occurs.

## Functional Requirements

- **FR-001**: Settings MUST expose "Reset & reload libraries" with a confirmation dialog.
- **FR-002**: Reset MUST clear expo-image disk and memory caches for covers.
- **FR-003**: Reset MUST clear in-memory library/series lists and show loading state before fetching fresh data.
- **FR-004**: After reset, navigation MUST return to `Home` so library detail screens remount clean.
- **FR-006**: Series list MUST use Kavita `all-v2` with `libraryId` query param and FilterV2 library statement.
- **FR-007**: Refresh and reset MUST reload page 0 from the server with `noCache`; subsequent pages load via infinite scroll ([007](../007-library-browse-stability/spec.md) FR-005). `getAllSeriesInLibrary` remains for callers that need a full in-memory fetch.
- **FR-008**: Home MUST list Kavita collection tags; collection grid MUST use `series-by-collection`.

## Constitution Check

| Principle | Status |
|-----------|--------|
| VII. Settings parity | Pass — user config/control in Settings |

## Key Files

- `src/stores/libraryDisplayStore.ts`
- `src/hooks/useLibraryReloadOnFocus.ts`
- `src/screens/SettingsScreen.tsx`
- `src/screens/HomeScreen.tsx`
- `src/screens/LibraryDetailScreen.tsx`
