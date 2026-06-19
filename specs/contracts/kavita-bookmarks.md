# Contract: Kavita Bookmarks

**Status**: Draft — verify on live server (T001)

Page-level bookmarks inside chapters (comics, PDF, etc.). Stored on server per user.

## Endpoints (expected)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/Reader/bookmark` | Create bookmark (chapterId, page) |
| POST | `/api/Reader/unbookmark` | Remove bookmark for page |
| GET | `/api/Reader/chapter-bookmarks` | List for chapter |
| GET | `/api/Reader/series-bookmarks` | List for series |
| POST | `/api/Reader/all-bookmarks` | All bookmarks for user (shelf) |
| GET | `/api/Reader/bookmark-image` | Thumbnail (`seriesId`, `page`, apiKey) |

## Client usage

- **Reader**: toggle bookmark on current page; prefetch chapter bookmarks on open
- **Bookmarks shelf**: `all-bookmarks` → navigate to reader at page
- Image URLs may require apiKey query param (same pattern as cover images)

## Format support

Confirm per-format behavior in spike (archive vs EPUB). Hide bookmark control when server returns unsupported.

## Sync rules

- Bookmark state MUST reflect server after reader load (`chapter-bookmarks`).
- Unbookmark on web removes entry on next shelf refresh.
