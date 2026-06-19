# Plan: Kavita Personal Lists & Server Sync

## Architecture principle

**Server is source of truth.** Client holds ephemeral UI state + optional cache for offline *display* only. Every shelf mutation goes to Kavita first; optimistic UI optional but must reconcile on error.

```
HomeScreen (shelves)
  ├── Libraries (existing)
  ├── Collections (existing → LibraryDetail collectionId)
  ├── OnDeckShelf → POST /api/Series/on-deck → SeriesDetail / Reader
  ├── WantToReadShelf → POST /api/want-to-read/v2 → …
  ├── ReadingListsScreen → POST /api/ReadingList/lists → ReadingListDetail
  ├── StarredShelf → FilterV2 UserRating or highly-rated query
  └── BookmarksScreen → POST /api/Reader/all-bookmarks → Reader

SeriesDetailScreen
  ├── Want to read toggle → add/remove series
  ├── Star rating control → Review/series or rating API
  └── Link to series bookmarks (P3)

ImageReaderScreen / EpubReaderScreen
  └── Bookmark toggle → bookmark / unbookmark
```

## API layer (`kavitaClient.ts`)

Add grouped methods (names tentative):

| Group | Methods |
|-------|---------|
| On deck | `getOnDeck(page, size, libraryId?)`, `removeFromOnDeck(seriesId)` |
| Want to read | `getWantToReadV2(filter, page, size)`, `addToWantToRead(seriesIds)`, `removeFromWantToRead(seriesIds)`, `isInWantToRead(seriesId)` |
| Ratings | `getSeriesRating(seriesId)`, `updateSeriesRating(seriesId, rating)`, `getStarredSeries(page, size)` |
| Reading lists | `getReadingLists(page, size)`, `getReadingList(id)`, `getReadingListItems(id)` |
| Bookmarks | `getAllBookmarks()`, `getChapterBookmarks(chapterId)`, `bookmarkPage(...)`, `unbookmarkPage(...)`, `getBookmarkImageUrl(...)` |

Contracts in `specs/contracts/kavita-*.md` — probe live server during T001 spike to confirm paths/query params for installed Kavita version.

## UI approach

1. **Home redesign (P1)**: Replace single “Libraries + Collections” scroll with **shelf selector** (chips or segmented control): `On Deck` | `Libraries` | `Collections` | `Want to Read` | …  
   - Default shelf: **On Deck** when non-empty, else Libraries.
   - Preserves header search (013) scoped to active shelf where applicable.
2. **Reuse `LibraryDetailScreen` patterns** via shared `SeriesGridScreen` params: `{ mode: 'library' | 'collection' | 'wantToRead' | 'onDeck' | 'starred' }` OR separate thin wrapper screens — prefer **one grid screen + mode enum** to avoid duplication (plan task T010).
3. **Series detail actions row**: icons for Want to Read, Rating stars, (future) bookmark count link.
4. **Reader**: overflow or icon for bookmark; show filled state if page bookmarked (chapter-bookmarks prefetch).

## FilterV2 extensions

Extend `kavitaFilterV2.ts` with documented fields:

- `FilterField.WantToRead` — for filtered want-to-read queries
- `FilterField.UserRating` — for starred/highly-rated shelves

Add contract doc `kavita-filter-v2-personal.md` or extend existing filter doc with personal-list fields (verify enum values from Kavita source during spike).

## Phasing

| Phase | Deliverables | User value |
|-------|--------------|------------|
| **1** | API spike + contracts; On Deck + Want to Read shelves; series toggles | Resume reading + queue |
| **2** | Starred/ratings + Reading lists browse/read-through | Full Kavita organization parity (read) |
| **3** | Bookmarks shelf + reader bookmark/unbookmark | Page-level sync |

## Risks

| Risk | Mitigation |
|------|------------|
| Kavita version drift on routes | T001 live probe + contract version note |
| Home UI clutter with 6 shelves | Chip selector + remember last shelf |
| Bookmark API differs by format | Gate bookmark UI by format capability from server |
| Optimistic toggle desync | Re-fetch series metadata after mutation |

## Files (expected)

| Area | Files |
|------|-------|
| API | `src/api/kavitaClient.ts`, new `src/api/kavitaPersonalLists.ts` (optional split) |
| Types | `src/types/kavita.ts` — ReadingListDto, BookmarkDto, … |
| Screens | `HomeScreen.tsx`, `SeriesGridScreen.tsx` (new or refactor LibraryDetail), `ReadingListDetailScreen.tsx`, `BookmarksScreen.tsx`, `SeriesDetailScreen.tsx`, readers |
| Utils | Extend `kavitaFilterV2.ts`, tests |
| Contracts | `specs/contracts/kavita-on-deck.md`, etc. |

## Constitution alignment

- **Reader First**: Consumes Kavita features; does not replace library admin.
- **Privacy**: No new telemetry; all data from user's server.
- **Settings**: If shelf default or starred threshold becomes configurable → expose in Settings (Principle VII).
