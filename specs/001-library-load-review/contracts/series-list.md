# Contract: Series list (`POST /api/Series/all-v2`)

## Request

**Query parameters** (required — not in JSON body):

| Param | Type | Notes |
|-------|------|-------|
| `libraryId` | number | Target library |
| `PageNumber` | number | 0-based page |
| `PageSize` | number | Items per page |
| `context` | number | `1` for library browse |

**Body** (`FilterV2Dto`):

```json
{
  "statements": [
    { "field": 0, "comparison": 0, "value": "1" }
  ],
  "combination": 0
}
```

`field: 0` = Libraries, `comparison: 0` = Equal, `value` = library id string.

## Collections

`GET /api/Collection` — list collection tags.

`GET /api/Series/series-by-collection?collectionId=N&PageNumber=0&PageSize=100` — series in a collection.

## Request (legacy — wrong)

Do **not** send `{ libraryId, pageNumber, pageSize }` in the POST body only; Kavita ignores library scope.

## Response (paginated)

```json
{
  "result": [ { /* SeriesDto */ } ],
  "pagination": {
    "currentPage": 0,
    "totalPages": 3,
    "totalItems": 250,
    "pageSize": 100,
    "hasNextPage": true
  }
}
```

## SeriesDto fields used by library grid

| Field | Type | UI use |
|-------|------|--------|
| `id` | number | Navigation, cover URL, list keys |
| `name` | string | Card title |
| `pages` | number | Subtitle / progress denominator |
| `pagesRead` | number | Progress bar |
| `volumes` | number | Subtitle: "N volumes" (count, not array) |
| `chapters` | number | Subtitle: "N books" when single volume |
| `created` | string | "Recently Added" sort |

## Client rules

- **Do not** call `/api/Series/volumes` during library list load.
- Volume/chapter tree is fetched only on `SeriesDetailScreen`.
- Fallback endpoint `GET /api/Series/series` returns a plain array (no pagination metadata).

## Verified

- 2026-06-16: Static review against Kavita SeriesDto documentation (`volumes`, `chapters` as statistics on list items). Live probe: pending manual quickstart.
