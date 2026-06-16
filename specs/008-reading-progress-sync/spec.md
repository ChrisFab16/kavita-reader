# Feature Specification: Reading Progress Sync

**Created**: 2026-06-16

**Status**: Signed off — 2026-06-16

**Input**: Progress saving to Kavita still fails in manual testing (Axios errors reported; may relate to server file reorg or `/api/Reader/progress` contract). Do not investigate in parallel with 007 scroll QA.

## Root cause (2026-06-16)

Kavita `ProgressDto` requires **`libraryId`** (and four other ids + `pageNum`). Client sent only `seriesId`, `volumeId`, `chapterId`, `pageNum`. Resume also used nonexistent `chapterInfo.currentPage` instead of `GET /api/Reader/get-progress`.

See [specs/contracts/kavita-reader-progress.md](../contracts/kavita-reader-progress.md).

## User Story (draft)

As a reader, when I turn pages in the image or EPUB reader, my position syncs to Kavita so I can resume on another device.

## Known symptoms (2026-06-16)

- **Reader back arrow / hardware back** — **Fixed & signed off** (`exitReader`, chrome z-index). See validation-results.md.
- **`markProgress` / `POST /api/Reader/progress`** — **Fix implemented** (missing `libraryId`); pending manual sign-off (T005)

## Prerequisites

- [x] Spec **007** signed off
- [x] Reader exit navigation signed off (T006–T007)

## API contract

Full request/response detail: [specs/contracts/kavita-reader-progress.md](../contracts/kavita-reader-progress.md)

## Key files

- `src/api/kavitaClient.ts` — `getProgress`, `markProgress`
- `src/utils/readingProgress.ts` — `buildProgressPayload`
- `src/screens/ImageReaderScreen.tsx`, `EpubReaderScreen.tsx` — load/save + error banner
- `src/utils/readerNavigation.ts` — `exitReader`

## Constitution

Principle I (Reader first) — progress sync is core reader behavior; priority P1 once 007 closes.
