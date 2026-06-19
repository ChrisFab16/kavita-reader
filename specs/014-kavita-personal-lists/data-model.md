# Data Model: Kavita Personal Lists & Server Sync

**Feature**: 014-kavita-personal-lists  
**Source of truth**: Kavita server (per active server in `serverStore`)

## Existing entities (unchanged)

| Entity | Storage | Notes |
|--------|---------|-------|
| `CollectionTagDto` | Server | id, title, summary, promoted — browse only |
| `SeriesDto` | Server | Shared grid row; may include `pagesRead`, `userRating` |
| `LibraryDto` | Server | Existing Home libraries shelf |
| Paginated list | Server header/body | `Pagination` metadata — 007 pattern |

## New / extended server DTOs (client types in `src/types/kavita.ts`)

### OnDeckSeries (alias SeriesDto + progress)

Same as series list row enriched with reading progress. No separate client entity; shelf is `SeriesDto[]` from `POST /api/Series/on-deck`.

**Client state**: ephemeral list + `removedLocally` optimistic hide until refresh.

### WantToReadMembership

| Field | Type | Source |
|-------|------|--------|
| seriesId | number | toggle target |
| inList | boolean | from list query or add/remove response |

No local persist; series detail re-fetches on focus.

### UserRating

| Field | Type | Source |
|-------|------|--------|
| seriesId | number | |
| userRating | 0–5 | `GET /api/rating`, `SeriesDto.userRating` |
| reviewText | string? | optional; out of scope v1 display |

### ReadingList

| Field | Type | Source |
|-------|------|--------|
| id | number | |
| title | string | |
| summary | string? | |
| promoted | boolean | |
| lastModified | string? | |

### ReadingListItem

| Field | Type | Source |
|-------|------|--------|
| id | number | |
| order | number | |
| seriesId | number | |
| seriesName | string? | |
| volumeId | number? | |
| chapterId | number? | |
| chapterTitle | string? | |

Navigation: `(seriesId, volumeId?, chapterId?)` → existing reader routes.

### BookmarkDto

| Field | Type | Source |
|-------|------|--------|
| id | number? | if exposed |
| seriesId | number | |
| seriesName | string? | |
| chapterId | number | |
| chapterTitle | string? | |
| page | number | 0-based or 1-based — confirm T001 |
| created | string? | |

Thumbnail: `GET /api/Reader/bookmark-image` with apiKey query (same as covers).

## UI / navigation state (local only)

| State | Owner | Persist? |
|-------|-------|----------|
| `activeHomeShelf` | `HomeScreen` | optional AsyncStorage key `homeShelf` per server — only if added in Settings |
| `searchOpen` | Home/Library headers | ephemeral (013) |
| Grid page index | Series grid screen | ephemeral |
| Bookmark set for chapter | Reader screen | in-memory Set<number> synced from `chapter-bookmarks` |

## Relationships

```
Server (1) ──< CollectionTag ──< Series (via series-by-collection)
Server (1) ──< WantToRead ──< Series
Server (1) ──< OnDeck ──< Series (algorithmic)
Server (1) ──< ReadingList ──< ReadingListItem ──> Chapter
Server (1) ──< Bookmark ──> (Series, Chapter, page)
User ──> UserRating ──> Series
```

## Validation rules

- Toggle want-to-read: require authenticated client; seriesId > 0.
- Remove from on-deck: require seriesId; refresh shelf after success.
- Bookmark: require chapterId + page; unbookmark idempotent.
- Starred shelf: default filter userRating ≥ 1 unless Settings threshold added.

## AsyncStorage keys (no new keys in P1)

Existing server credentials unchanged. If `homeShelf` preference added later: key pattern `kavita:{serverId}:homeShelf` to satisfy multi-server isolation.
