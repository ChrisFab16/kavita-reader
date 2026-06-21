# Feature Specification: Kavita Personal Lists & Server Sync

**Feature Branch**: `014-kavita-personal-lists`

**Created**: 2026-06-19

**Status**: Specified — evaluation complete, implementation phased

**Input**: Review Kavita server features (starred/want-to-read, collections, reading lists, bookmarks, on deck) and define how KavitaReader implements them aligned to the server as source of truth.

## Executive evaluation

Kavita exposes five user-facing organization features. KavitaReader today implements **one** fully (collections browse). The rest are **server-backed gaps** — no local-only substitutes; all new work MUST read/write Kavita APIs so phone and web stay in sync.

| Feature | Kavita meaning | Server API (canonical) | App today | Sync model | Recommended phase |
|---------|----------------|------------------------|-----------|------------|-------------------|
| **Collections** | Admin/user tags grouping series across libraries | `GET /api/Collection`, `GET /api/Series/series-by-collection` | **Done** — Home + library grid (006/007) | Read-only browse | Maintain |
| **Want to read** | Per-user queue of series to read later | `POST /api/want-to-read/v2`, `POST …/add-series`, `POST …/remove-series` | **Missing** | Read list + toggle on series | **P1** |
| **On deck** | Continue-reading shelf (progress + recency rules) | `POST /api/Series/on-deck`, `POST …/remove-from-on-deck` | **Missing** | Read shelf; dismiss syncs removal | **P1** |
| **Starred** | User **rating** (stars), not a separate favorite flag | `GET rating?seriesId=`, `POST /api/Review/series`, FilterV2 `UserRating` | **Missing** | Read/write rating on series | **P2** |
| **Reading lists** | Ordered lists of series/chapters (curated or promoted) | `POST /api/ReadingList/lists`, `GET /api/ReadingList/items` | **Missing** | Read lists + open next item | **P2** |
| **Bookmarks** | Page-level marks inside chapters | `POST /api/Reader/bookmark`, `GET …/chapter-bookmarks`, `POST …/unbookmark` | **Missing** | Read all + toggle in reader | **P3** |

### Terminology alignment

- **Starred** in Kavita web UI maps to **user star rating** (`userRating` on series, Review/Rating APIs). There is no independent “favorite” bit — filtering “highly rated” uses `UserRating` FilterV2.
- **Collections** are **tags** (`CollectionTagDto`), not the same as **Reading Lists** (ordered reading sequences).
- **On deck** is algorithmic (progress + server settings), not user-editable ordering.

## Scope

| In scope | Out of scope |
|----------|--------------|
| Browse/sync all five feature areas from Kavita | Creating/editing collection tags on server (admin) |
| Add/remove want-to-read from series detail | Full reading-list authoring (create, reorder, merge) in v1 |
| On deck home shelf + remove from deck | Multi-user profile sharing / OPDS |
| Star rating display + set/clear on series | Community reviews text, AniList/MAL write-back |
| Reading list browse + read-through | Bookmark notes/highlights (text annotations) |
| Bookmark page in reader + bookmarks library | Local-only lists when offline (cache display only) |

## User Scenarios & Testing

### User Story 1 — On Deck shelf (Priority: P1)

As a returning reader, I want an **On Deck** section on Home showing series I am actively reading so I can resume in one tap.

**Why**: Highest daily-use value; mirrors Kavita dashboard.

**Independent Test**: User with in-progress series on server sees On Deck on Home; tap opens series detail; after “remove from deck” on server/web, item disappears on refresh.

**Acceptance Scenarios**:

1. **Given** logged-in user with progress on series A, **When** Home loads and the user selects the **Currently Reading** shelf, **Then** On Deck shows series A with cover and progress hint. On Deck does **not** appear inside the Libraries or Collections shelves.
2. **Given** On Deck item, **When** user long-presses or uses overflow “Remove from deck”, **Then** `remove-from-on-deck` is called and item hides until next read event on server.
3. **Given** empty On Deck on server, **When** Home loads, **Then** section hidden or shows empty state without error.

---

### User Story 2 — Want to read (Priority: P1)

As a reader, I want to mark series **Want to Read** and browse that list on my phone, synced with Kavita.

**Acceptance Scenarios**:

1. **Given** series detail, **When** user toggles Want to Read on, **Then** `add-series` succeeds and toggle reflects server state.
2. **Given** Want to Read list on server, **When** user opens Home → Want to Read, **Then** paginated grid matches server (reuse library grid patterns).
3. **Given** series removed on web, **When** app refreshes, **Then** it no longer appears in Want to Read.

---

### User Story 3 — Collections (Priority: maintain)

As a reader, I want to browse **Collections** already on my server (existing behavior).

**Acceptance**: No regression; collections remain on Home; grid pagination unchanged (006/007).

---

### User Story 4 — Starred / ratings (Priority: P2)

As a reader, I want to **star** series and filter starred items, matching Kavita’s rating model.

**Acceptance Scenarios**:

1. **Given** series detail, **When** user sets 4★, **Then** `Review/series` (or rating update) persists and shows on reopen.
2. **Given** starred filter on server, **When** user opens Starred shelf, **Then** series with user rating above threshold appear (FilterV2 `UserRating` or dedicated query).

---

### User Story 5 — Reading lists (Priority: P2)

As a reader, I want to open **Reading Lists** from my server and read items in list order.

**Acceptance Scenarios**:

1. **Given** reading lists on server, **When** user opens Reading Lists on Home, **Then** promoted and personal lists appear paginated.
2. **Given** a list with mixed series/chapters, **When** user taps an item, **Then** reader opens at correct chapter with progress respected.
3. **Given** list updated on web, **When** user refreshes, **Then** order and items match server.

---

### User Story 6 — Bookmarks (Priority: P3)

As a reader, I want to **bookmark pages** in the comic/PDF reader and browse all bookmarks.

**Acceptance Scenarios**:

1. **Given** image reader on page N, **When** user bookmarks, **Then** `POST /api/Reader/bookmark` succeeds and indicator shows.
2. **Given** existing bookmark, **When** user opens Bookmarks shelf, **Then** entries show series/chapter/page and jump to reader on tap.
3. **Given** bookmark removed on web, **When** app refreshes, **Then** entry is gone.

---

### Edge Cases

- Server version lacks an endpoint → hide feature with version note, no crash.
- Offline: show last cached shelf with stale banner; writes fail with clear message (no silent queue in v1).
- Multi-server: shelves scoped to active server; switching server reloads all lists.
- Empty permissions / 401: redirect to login, clear stale shelf data.

## Requirements

### Functional Requirements

- **FR-001**: Home MUST expose navigable shelves: Libraries (existing), Collections (existing), On Deck, Want to Read, Reading Lists, Bookmarks (as implemented per phase).
- **FR-002**: All shelf data MUST come from authenticated Kavita API calls for the active server — no parallel local database as source of truth.
- **FR-003**: Series grids for On Deck and Want to Read MUST reuse pagination patterns from spec 007 (`Pagination` header, 1-based pages).
- **FR-004**: Want to Read toggle on series detail MUST call add/remove series endpoints and reflect server confirmation.
- **FR-005**: On Deck remove action MUST call `remove-from-on-deck` and refresh shelf.
- **FR-006**: Star rating on series detail MUST read/write via Kavita rating/review APIs; UI labels MUST say “Rating” or “Stars”, not imply a separate favorite system.
- **FR-007**: Reading list detail MUST fetch items via `ReadingList/items` and navigate to reader with correct ids.
- **FR-008**: Reader bookmark control MUST call bookmark/unbookmark for current chapter/page; image and EPUB/PDF paths as server supports.
- **FR-009**: Pull-to-refresh on any shelf MUST re-fetch from server (respect 006 reset token where applicable).
- **FR-010**: API contracts MUST be documented under `specs/contracts/` before client implementation.

### Key Entities

- **CollectionTag**: id, title, summary, promoted — *implemented*.
- **SeriesDto shelf row**: id, name, cover, pagesRead, userRating?, libraryId — shared grid model.
- **WantToReadEntry**: series reference; membership boolean per user.
- **OnDeckEntry**: series with progress metadata; optional removal record on server.
- **ReadingList**: id, title, summary, promoted, lastModified.
- **ReadingListItem**: order, seriesId, volumeId?, chapterId?, progress hints.
- **BookmarkDto**: seriesId, chapterId, page, created date; optional thumbnail via bookmark-image.

## Success Criteria

- **SC-001**: User can resume from On Deck in ≤2 taps from Home cold start.
- **SC-002**: Want to Read toggle round-trips to server and matches Kavita web within one refresh cycle.
- **SC-003**: No shelf shows data from a different server after server switch.
- **SC-004**: Collections regression: existing 006/007 quickstart still passes.
- **SC-005**: Contract tests cover each new endpoint wrapper (mock or live harness per 008 pattern).

## Assumptions

- Target Kavita server ≥ 0.8.x with documented REST routes (verify against user's instance during Phase 1 spike).
- Android primary; same API surface for future iOS.
- Read-first: list creation/editing on mobile deferred unless user explicitly requests in a follow-up spec.
- “Starred” UX uses Kavita’s 0–5 star rating; threshold for “Starred shelf” defaults to rating ≥ 1 unless Settings adds threshold later (Settings rule applies if added).

## Dependencies

- **006/007**: Library grid, pagination, refresh reset.
- **008**: Progress sync patterns, error handling.
- **009**: Series detail screen for toggles and navigation.
- **011/013**: Reader and landscape layouts for bookmark affordance.

## Open questions (resolved for planning)

| ID | Decision |
|----|----------|
| Q1 | Starred = user rating, not separate favorite |
| Q2 | Home uses horizontal shelf chips or section list — **plan**: scrollable shelf tabs on Home |
| Q3 | Reading list write (create/edit) deferred to future spec |
| Q4 | Bookmarks v1: page bookmarks only, no highlight notes |
