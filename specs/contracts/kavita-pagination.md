# Contract: Kavita pagination

Kavita paginates list endpoints via **query parameters** and returns metadata in a **response header**, not in the JSON body.

**Source:** `API/Extensions/HttpExtensions.cs` (`AddPaginationHeader`), `API/Helpers/UserParams.cs`, `API/Helpers/PaginationHeader.cs`

## Query parameters

| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `PageNumber` | int | 1 | **1-based** first page |
| `PageSize` | int | max | Client uses `100` for library browse |

**Client internal convention:** zero-based page index in app code (`pageRef` 0, 1, 2…); convert with `PageNumber = internalPage + 1`.

Optional on some endpoints: `libraryId` (ignored by `all-v2` for scoping — see [kavita-series-list.md](./kavita-series-list.md)).

## Response body

List endpoints return a **JSON array** of DTOs (e.g. `SeriesDto[]`). The body does **not** reliably include `{ result, pagination }` wrappers.

## Pagination header

```http
Pagination: {"currentPage":1,"itemsPerPage":100,"totalItems":350,"totalPages":4}
Access-Control-Expose-Headers: Pagination
```

| Header field | Maps to client `PaginationMetadata` |
|--------------|-------------------------------------|
| `currentPage` | `currentPage` (1-based) |
| `totalPages` | `totalPages` |
| `totalItems` | `totalItems` |
| `itemsPerPage` | `pageSize` |

Parsed by `parsePaginationHeader()` in `src/utils/kavitaPagination.ts`. Axios may lowercase header keys to `pagination`.

## hasMore (client rules)

Implemented in `hasMoreSeriesPages()` — **order matters**:

1. If `hasNextPage` is set → use it.
2. Else if `currentPage` and `totalPages` → `currentPage < totalPages`.
3. Else if **no pagination metadata** → `resultCount >= pageSize` (weak fallback).
4. Else → `false`.

**Critical:** When pagination header is present, **never** infer end-of-list from a short row count after client-side filtering. That caused “stops at letter B” when global pages were filtered locally.

## Empty result interpretation

| Condition | Meaning |
|-----------|---------|
| `totalItems === 0` in header | Library legitimately empty on server |
| Empty array, **no** header | Likely API/filter failure — show error (`describeEmptyLibraryLoad`) |
| Empty array, `totalItems > 0` | Server/client mismatch — show error |

## Tests

- `src/utils/kavitaPagination.test.ts`
- `src/utils/seriesPagination.test.ts` — hasMore with header vs filtered count
- `src/utils/librarySeriesLoad.test.ts` — empty failure detection

## Verified

- 2026-06-16: Kavita source + regression fix for header parsing.
