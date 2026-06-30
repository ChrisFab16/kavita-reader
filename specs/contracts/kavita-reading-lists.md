# Contract: Kavita Reading Lists

**Status**: Draft — verify on live server (T001)

Curated ordered lists of reading items (events/storylines). **Not** the same as Collection tags.

## Endpoints (expected)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/ReadingList/lists` | Paginated lists for user (`pageNumber`, `pageSize`, `includePromoted`) |
| GET | `/api/ReadingList` | Single list metadata (`readingListId`) |
| GET | `/api/ReadingList/items` | Ordered items with series/volume/chapter metadata |

## v1 client scope (read-only)

- Browse lists and items
- Open reader from item (chapterId, seriesId, volumeId from item DTO)
- No create/update/delete in v1 (defer to future spec)

## Pagination

Lists endpoint paginated; items may be full list per id (confirm size limits in spike).

## Client usage

- Home → Reading Lists → list detail → tap item → Reader

## Related

- Collections: [kavita-collections.md](./kavita-collections.md) — different API surface
