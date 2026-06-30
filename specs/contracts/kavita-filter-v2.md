# Contract: Kavita FilterV2

FilterV2 is how Kavita scopes and sorts series list queries. **All library browse requests MUST use these values** — do not hardcode magic numbers without updating this doc and `src/api/kavitaFilterV2.ts`.

**Source files (Kavita):**

- `API/DTOs/Filtering/v2/FilterField.cs`
- `API/DTOs/Filtering/v2/FilterCombination.cs`
- `UI/Web/src/app/_models/metadata/v2/filter-comparison.ts`
- `API/DTOs/Filtering/SortField.cs`

## FilterField (statement `field`)

| Value | Name | Use in KavitaReader |
|------:|------|---------------------|
| 0 | Summary | **Do not use for library scope** |
| 1 | SeriesName | Search (future) |
| 19 | **Libraries** | **Library browse — required** |
| … | (others) | Not used in reader yet |

### Regression: field 0 vs 19

We once documented `field: 0` as “Libraries”. That filters **Summary text equal to the library id string**, which matches nothing → empty library grid with HTTP 200. Always use **`19`**.

## FilterComparison (statement `comparison`)

| Value | Name | KavitaReader usage |
|------:|------|-------------------|
| 0 | Equal | Library id match |
| 9 | NotEqual | Not used |

## FilterCombination (body `combination`)

| Value | Name | KavitaReader usage |
|------:|------|-------------------|
| 0 | Or | **Do not use** for single-library filter |
| 1 | **And** | **Default for library browse** |

Kavita’s `FilterV2Dto` default is `And`.

## SortField (body `sortOptions.sortField`)

| Value | Name | KavitaReader `LibrarySortMode` |
|------:|------|--------------------------------|
| 1 | SortName | `'name'` ascending |
| 2 | CreatedDate | `'recent'` descending |
| 3 | LastModifiedDate | Not used |
| 4 | LastChapterAdded | Alternative for “recent” (future) |

## Library filter body (canonical)

Built by `buildLibraryFilterBody(libraryId, sortBy?)` in `src/api/kavitaFilterV2.ts`:

```json
{
  "statements": [
    {
      "field": 19,
      "comparison": 0,
      "value": "3"
    }
  ],
  "combination": 1,
  "sortOptions": {
    "sortField": 1,
    "isAscending": true
  }
}
```

- `value` is the library id as a **string** (e.g. `"3"` not `3`).
- `sortOptions` is optional; omit for server default sort when debugging.

## Tests

- `src/api/kavitaFilterV2.test.ts` — asserts field 19, combination 1, sort shape.

## Verified

- 2026-06-16: Enum values cross-checked against Kavita `main` branch source.
- Empty-library bug traced to `field: 0` — fixed same day.
