# Contract: Kavita On Deck

**Status**: Draft — verify paths on live server (T001)

On Deck is Kavita's "continue reading" shelf: series with reading progress subject to server rules (`OnDeckProgressDays`, `OnDeckUpdateDays`) minus user removals.

## Endpoints (expected)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/Series/on-deck` | Paginated series with progress on deck |
| POST | `/api/Series/remove-from-on-deck?seriesId={id}` | Hide until next read event |

Query/body params (confirm in spike): `pageNumber`, `pageSize`, optional `libraryId`.

## Response

- Array of `SeriesDto` enriched with progress/rating (same shape as library browse).
- Pagination via `Pagination` header — see [kavita-pagination.md](./kavita-pagination.md).

## Client usage

- Home → On Deck shelf
- Remove action → `removeFromOnDeck(seriesId)` then refresh shelf
- Tap series → existing `SeriesDetail` navigation

## Not in scope

- Changing on-deck algorithm (server settings)
- OPDS on-deck feed

## Related

- Progress: [kavita-reader-progress.md](./kavita-reader-progress.md) — reading updates restore on-deck eligibility
