# Research: Kavita Personal Lists & Server Sync

**Feature**: 014-kavita-personal-lists  
**Date**: 2026-06-19

## R1 — Kavita API surface (personal organization)

**Decision**: Implement all five user-facing features via documented Kavita REST endpoints; no local-only list database.

**Rationale**: Constitution I (server source of truth) and user expectation that phone and Kavita web stay aligned. Collections already follow this pattern (`GET /api/Collection`).

**Alternatives considered**:
- Local SQLite shelves with background sync — rejected (complexity, conflict resolution, violates FR-002).
- OPDS feeds for on-deck — rejected (incomplete mutation support, out of scope).

**Open until T001**: Exact query param names and response DTO shapes on user's Kavita version (≥ 0.8.x assumed).

## R2 — “Starred” semantics

**Decision**: Map UI “Starred” to **user star rating** (`userRating`, Review/Rating APIs), not a separate favorite flag.

**Rationale**: Kavita web uses ratings; FilterV2 exposes `UserRating` for filtered shelves. Avoid misleading “Favorite” copy.

**Alternatives considered**:
- Custom local favorites — rejected (not synced with server).

## R3 — Home navigation pattern

**Decision**: Horizontal **shelf chip selector** on Home; default shelf = On Deck when non-empty, else Libraries.

**Rationale**: Six shelves would overflow a single scroll; chips match Material 3 patterns and preserve 013 header search per shelf.

**Alternatives considered**:
- Separate bottom tabs per shelf — rejected (nav clutter).
- Nested drawer — rejected (hidden discoverability).

**Settings note**: If “default home shelf” becomes user-configurable → add to Settings (Principle VII). Deferred to post-P1 unless requested.

## R4 — Series grid reuse

**Decision**: Parameterize existing library grid (`LibraryDetailScreen` or extracted `SeriesGridScreen`) with `mode: onDeck | wantToRead | starred | collection | library`.

**Rationale**: 007 already solved pagination, refresh reset, and FlatList stability; duplicating grids risks regression.

**Alternatives considered**:
- One screen per shelf — rejected (maintenance burden).

## R5 — Offline behavior

**Decision**: Shelves show last successful fetch with stale banner when offline; mutations (toggle, remove from deck, bookmark) fail with actionable message — no silent queue in v1.

**Rationale**: Constitution III (graceful offline); write-queue adds conflict complexity beyond P1 scope.

**Alternatives considered**:
- Optimistic queue with retry — deferred to future offline spec (012).

## R6 — FilterV2 enum values

**Decision**: Probe Kavita source or live API in T001/T007 for `FilterField.WantToRead` and `FilterField.UserRating` numeric values before client constants.

**Rationale**: Regression lesson from field 0 vs 19 (see `kavita-filter-v2.md`).

## R7 — Bookmark format support

**Decision**: Show bookmark control only when chapter format is supported by server bookmark API (image/PDF/archive paths first; EPUB confirm in spike).

**Rationale**: Constitution IV (format fidelity); avoid broken affordance.

## R8 — Multi-server isolation

**Decision**: All shelf fetches and toggles use active `KavitaClient` from `serverStore`; switching server clears shelf UI and re-fetches.

**Rationale**: Constitution V — no cross-server leakage.
