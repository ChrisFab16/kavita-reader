# Contract: Kavita reading progress

Sync per-user chapter position between KavitaReader and Kavita. The client **reads** progress when opening a chapter and **writes** it on page turns and exit.

**Related:** [kavita-series-detail.md](./kavita-series-detail.md) (chapter open) · [../002-auth-login-fix/contracts/auth-routes.md](../002-auth-login-fix/contracts/auth-routes.md) (Bearer auth)

**Implementation:** `KavitaClient.getProgress()` / `markProgress()` in `src/api/kavitaClient.ts` · `buildProgressPayload()` in `src/utils/readingProgress.ts`

**Upstream source (Kavita v0.8.4.x):**

| File | Role |
|------|------|
| `API/DTOs/Progress/ProgressDto.cs` | Request/response schema |
| `API/DTOs/Reader/ChapterInfoDto.cs` | Id sources for POST body |
| `API/Controllers/ReaderController.cs` | `get-progress`, `progress`, `chapter-info` |
| `API/Services/ReaderService.cs` | `SaveReadingProgress`, `CapPageToChapter` |

**Context7 (verified 2026-06-16):**

| Library ID | Use |
|------------|-----|
| `/openapi/raw_githubusercontent_kareadita_kavita_develop_openapi_json` | OpenAPI — required fields, paths (primary for this contract) |
| `/kareadita/kavita` | Source / reader behavior |

See [AGENTS.md](../../AGENTS.md#context7-kavita-documentation-lookup) for MCP workflow.

## Endpoints (in scope)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/Reader/chapter-info?chapterId=` | JWT | Chapter metadata + **id fields** for progress POST |
| GET | `/api/Reader/get-progress?chapterId=` | JWT | Resume page for logged-in user |
| POST | `/api/Reader/progress` | JWT | Save current page |

**Not used by mobile reader yet** (documented for cross-device / future work):

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/Reader/has-progress?seriesId=` | Whether user has any progress on series |
| GET | `/api/Reader/continue-point?seriesId=` | Next chapter to resume for series |
| POST | `/api/Reader/mark-read` | Mark chapter/volume read (separate from page progress) |

## ProgressDto

Kavita serializes C# properties as **camelCase** JSON.

| Field | Type | Required on POST | Notes |
|-------|------|------------------|-------|
| `seriesId` | int | yes | From `chapter-info.seriesId` |
| `volumeId` | int | yes | From `chapter-info.volumeId` |
| `chapterId` | int | yes | Route / navigation param |
| `pageNum` | int | yes | **0-based** page index |
| `libraryId` | int | yes | From `chapter-info.libraryId` — **was missing in pre-008 client** |
| `bookScrollId` | string? | no | EPUB scroll anchor within combined pages |
| `lastModifiedUtc` | datetime? | no | Server-managed on read |

### Example: GET get-progress (saved position)

```http
GET /api/Reader/get-progress?chapterId=789
Authorization: Bearer {jwt}
```

```json
{
  "seriesId": 123,
  "volumeId": 456,
  "chapterId": 789,
  "pageNum": 4,
  "libraryId": 1,
  "bookScrollId": null,
  "lastModifiedUtc": "2026-06-16T12:00:00Z"
}
```

When the user has **no** saved progress, Kavita returns HTTP 200 with defaults:

```json
{
  "pageNum": 0,
  "chapterId": 789,
  "volumeId": 0,
  "seriesId": 0,
  "libraryId": 0
}
```

Client: treat `pageNum > 0` as resume; otherwise start at page `0`.

### Example: POST progress (save)

```http
POST /api/Reader/progress
Authorization: Bearer {jwt}
Content-Type: application/json

{
  "seriesId": 123,
  "volumeId": 456,
  "chapterId": 789,
  "pageNum": 4,
  "libraryId": 1
}
```

| Response | Body | Meaning |
|----------|------|---------|
| `200 OK` | `true` | Saved (or no-op — see server rules) |
| `400 Bad Request` | localized string | Save failed (`generic-read-progress`) |
| `401 Unauthorized` | — | Token expired / invalid |

## Chapter-info (id source for POST)

Progress POST requires ids that live on **`ChapterInfoDto`**, not on navigation params alone.

```http
GET /api/Reader/chapter-info?chapterId=789
Authorization: Bearer {jwt}
```

| Field | Type | Progress use |
|-------|------|--------------|
| `seriesId` | int | POST `seriesId` (preferred over route param) |
| `volumeId` | int | POST `volumeId` |
| `libraryId` | int | POST `libraryId` |
| `pages` | int | Total pages in chapter (UI denominator) |
| `title` | string | Reader chrome |
| `fileName` | string? | Format detection (EPUB/PDF/image) |
| `seriesFormat` | int | `MangaFormat` enum |

**`ChapterInfoDto` does NOT include saved page.** There is no `currentPage` field. Never use `chapter-info` for resume.

## Page indexing

All reader page APIs use **0-based** indices. Display as `pageNum + 1` in UI.

| API | Param | Index |
|-----|-------|-------|
| `GET /api/Reader/image` | `page` | 0-based |
| `GET /api/Book/{chapterId}/book-page` | `page` | 0-based |
| `ProgressDto.pageNum` | — | 0-based |

Server caps `pageNum` to chapter bounds via `CapPageToChapter` before persist.

## Client save/load flow

```
Open chapter
  ├─ GET chapter-info  → chapterInfo (ids, pages, format)
  ├─ GET get-progress  → startPage = pageNum > 0 ? pageNum : 0
  └─ load page startPage

Page turn (currentPage changes)
  └─ debounce 1000ms → POST progress (buildProgressPayload)

Exit reader (back / hardware back)
  └─ navigation.goBack() first
  └─ POST progress in background (exitReader — never block exit)

Unmount
  └─ saveProgressRef.current() (latest closure via ref)
```

### Payload builder

`buildProgressPayload(chapterInfo, chapterId, pageNum, seriesIdFallback)` in `src/utils/readingProgress.ts`:

| POST field | Source |
|------------|--------|
| `seriesId` | `chapterInfo.seriesId \|\| seriesIdFallback` |
| `volumeId` | `chapterInfo.volumeId` |
| `chapterId` | argument |
| `pageNum` | `currentPage` (0-based) |
| `libraryId` | `chapterInfo.libraryId` |

### Error handling

- `markProgress` **throws** via `handleError()` — callers must catch.
- Readers set `progressSaveError` banner on failure; clear on success.
- `exitReader` logs background save failures; does not block navigation.

## Server behavior (SaveReadingProgress)

From `ReaderService.SaveReadingProgress`:

1. Cap `pageNum` to valid range for chapter.
2. If no existing progress row and `pageNum === 0` → return success **without** creating a row (prevents “last read” bump on open-only).
3. Create or update `AppUserProgress` with all ids including `LibraryId`.
4. On last page → enqueue scrobble update; clear on-deck removal.

## Do NOT

| Anti-pattern | Why |
|--------------|-----|
| POST progress without `libraryId` | `[Required]` on server DTO; fails validation / save |
| Resume from `chapterInfo.currentPage` | Field does not exist on `ChapterInfoDto` |
| Swallow `markProgress` errors | User sees no failure but progress does not persist |
| Block reader exit on save | Use `exitReader()` — `goBack()` then background save |
| Save page `0` expecting new row | Server skips insert when no prior progress |
| Use 1-based `pageNum` in POST | Off-by-one vs image/book-page APIs |
| Stale closure on unmount save | Mount-only `useEffect` cleanup captures old `currentPage` |

## UI integration

| Screen | Read progress | Write progress |
|--------|---------------|----------------|
| `ImageReaderScreen` | `getProgress` in `loadChapter` | Debounced on `currentPage`; exit + unmount |
| `EpubReaderScreen` | `getProgress` in `loadEpub` (parallel with book-info) | Same |
| `SeriesDetailScreen` | — | `useFocusEffect` → silent `GET volumes` refresh when returning from reader |

**Debounce:** 1000 ms after last page change (unchanged from pre-008).

**Failure UI:** red banner at top of reader (`progressSaveError`).

## Tests

| Test file | Covers |
|-----------|--------|
| `src/utils/readingProgress.test.ts` | `buildProgressPayload` — all required fields, seriesId fallback |

## Related specs

- [008-reading-progress-sync](../008-reading-progress-sync/spec.md) — progress sync feature
- [009-series-detail-load](../009-series-detail-load/spec.md) — instant reader open (cache in background)

## Regression checklist

- [ ] Open chapter → resumes at last saved page (after prior save)
- [ ] Turn pages → `POST /api/Reader/progress` body includes `seriesId`, `volumeId`, `chapterId`, `pageNum`, **`libraryId`**
- [ ] Exit reader → progress persisted; reopen same chapter resumes
- [ ] Failed save shows banner; success clears banner
- [ ] Progress visible in Kavita web UI or second client (external outcome)
