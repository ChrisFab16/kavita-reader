# Contract: Series list (`POST /api/Series/all-v2`)

## Request

```json
{
  "libraryId": 1,
  "pageNumber": 0,
  "pageSize": 100
}
```

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
