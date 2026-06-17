# Kavita API contracts (KavitaReader)

**Purpose:** Single source of truth for client ↔ Kavita server integration. Read these **before** changing `src/api/kavitaClient.ts`, filter bodies, or library browse pagination.

**Upstream:** This folder is the **only** `specs/` content contributed to [cbytestech/kavita-reader](https://github.com/cbytestech/kavita-reader). Feature specs (`specs/001`–`010`) stay on fork branch `speckit-work` — see [docs/upstream-contribution.md](../../docs/upstream-contribution.md).

**Upstream reference:** [Kareadita/Kavita](https://github.com/Kareadita/Kavita) — verify enums against `API/DTOs/Filtering/` when upgrading Kavita versions.

**Documentation lookup:** Use **Context7 MCP** (`user-context7`) before guessing API shapes. See [AGENTS.md](../../AGENTS.md#context7-kavita-documentation-lookup) for workflow and Kavita library IDs. Context7 informs contracts; this folder is the **client source of truth** after distillation.

**Code constants (must stay in sync):**

| Contract | Implementation |
|----------|----------------|
| FilterV2 bodies | `src/api/kavitaFilterV2.ts` |
| Pagination header | `src/utils/kavitaPagination.ts` |
| Page merge / hasMore | `src/utils/seriesPagination.ts` |
| Empty-load detection | `src/utils/librarySeriesLoad.ts` |
| Reading progress | `src/utils/readingProgress.ts`, `getProgress` / `markProgress` in `kavitaClient.ts` |

## Contract index

| Document | Scope |
|----------|--------|
| [kavita-filter-v2.md](./kavita-filter-v2.md) | FilterField / Comparison / Combination / SortField enums, library filter body |
| [kavita-pagination.md](./kavita-pagination.md) | `Pagination` response header, page numbering, `hasMore` rules |
| [kavita-series-list.md](./kavita-series-list.md) | Library series browse (`all-v2`, `v2`), attempt order, pitfalls |
| [kavita-series-detail.md](./kavita-series-detail.md) | Series detail / volumes tree, FlatList virtualization |
| [kavita-collections.md](./kavita-collections.md) | Collection tags and `series-by-collection` |
| [kavita-reader-progress.md](./kavita-reader-progress.md) | Reading progress GET/POST, `ProgressDto`, page indexing |
| [../002-auth-login-fix/contracts/auth-routes.md](../002-auth-login-fix/contracts/auth-routes.md) | Public auth routes (no Bearer) |

## Known pitfalls (regression checklist)

Use this checklist when library browse breaks:

1. **Wrong FilterField for library** — `Libraries` is **`19`**, not `0` (`Summary`). Wrong field → **empty grid** with HTTP 200.
2. **Wrong FilterCombination** — use **`1` (And)**, not `0` (Or), for a single library statement.
3. **Pagination in header, not body** — Kavita returns a JSON **array** in the body; page metadata is in the **`Pagination` response header**. Missing header parsing → false end-of-list at ~100 items (alphabetically through “B”).
4. **`libraryId` query param on `all-v2` is ignored** — scope ONLY via FilterV2 `Libraries` statement in POST body ([SeriesController.GetAllSeriesV2](https://github.com/Kareadita/Kavita/blob/main/API/Controllers/SeriesController.cs)).
5. **Do not use empty POST body** — returns cross-library global pages; client-side filter + missing pagination = wrong slice and early stop.
6. **PageNumber is 1-based** in query params (`internalPage + 1`).
7. **Empty grid with 200 OK** — treat as failure unless `Pagination.totalItems === 0` (see `describeEmptyLibraryLoad`).
8. **Missing `libraryId` on progress POST** — Kavita `ProgressDto` requires five ids + `pageNum`. Omitting `libraryId` (from `chapter-info`) fails save. Resume must use `GET get-progress`, not `chapter-info`.

## When to update contracts

- Any change to Kavita request/response handling in `kavitaClient.ts`
- New filter, sort, or list endpoint
- Enum value changes (add row to filter-v2 doc + constant in `kavitaFilterV2.ts`)
- After a production bug — add a row to **Known pitfalls** above
- After Context7 or upstream OpenAPI lookup resolves a new field/requirement — capture it here (do not rely on MCP alone)

## Feature spec cross-links (fork `speckit-work` only)

On branch **`speckit-work`**, numbered feature specs duplicate summaries but MUST link here for full detail:

- `specs/001-library-load-review/` — library perf / scroll
- `specs/006-library-data-reset/` — reset / refresh
- `specs/007-library-browse-stability/` — pagination / scoping fixes
- `specs/008-reading-progress-sync/` — reading progress GET/POST
- `specs/011-reader-zoom-gestures/` — image reader zoom, fit, gestures, prefetch (fork-only; feature contract at `specs/011-reader-zoom-gestures/contracts/`)
