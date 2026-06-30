# Contract: Kavita Want to Read

**Status**: Verified (Phase 1 spike — see `specs/014-kavita-personal-lists/api-spike-results.md`)

Per-user list of series marked "Want to Read". Distinct from On Deck and Reading Lists.

## Endpoints (expected)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/want-to-read/v2` | Filtered, paginated want-to-read series (`SeriesFilterV2Dto` body) |
| POST | `/api/want-to-read/add-series` | Body: series id list |
| POST | `/api/want-to-read/remove-series` | Body: series id list |
| GET | `/api/want-to-read` | Legacy full list (avoid; prefer v2) |

## Pagination

- `PageNumber` **1-based**, `PageSize` — same as library browse.
- Parse `Pagination` header.

## FilterV2

Want-to-read-only queries may use `FilterField.WantToRead` in filter statements (enum value — confirm in T007).

## Client usage

- Home → Want to Read shelf (grid)
- Series detail toggle → add/remove single series id
- Membership check optional before toggle UI state

## Sync rules

- Toggle MUST round-trip to server before showing persistent success.
- Refresh shelf after add/remove.
