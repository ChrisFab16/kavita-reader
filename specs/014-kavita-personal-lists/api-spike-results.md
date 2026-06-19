# API Spike Results: 014-kavita-personal-lists (Phase 1)

**Date**: 2026-06-19  
**Source**: Kavita OpenAPI / [PBXg33k/kavita-client](https://github.com/PBXg33k/kavita-client) generated docs (Kavita ≥ 0.8.x)  
**Status**: **Verified (documented)** — live probe optional via `KAVITA_URL` + credentials

## On Deck

| Item | Value |
|------|-------|
| Method | `POST /api/Series/on-deck` |
| Body | empty `{}` |
| Query | `PageNumber`, `PageSize` (1-based page), optional `libraryId` |
| Response | `SeriesDto[]` + `Pagination` header |
| Remove | `POST /api/Series/remove-from-on-deck?seriesId={id}` |

**Client**: `getOnDeckList`, `removeFromOnDeck` in `kavitaClient.ts`

## Want to Read

| Item | Value |
|------|-------|
| List | `POST /api/want-to-read/v2` + `SeriesFilterV2Dto` body + pagination query |
| Add | `POST /api/want-to-read/add-series` body `{ seriesIds: number[] }` |
| Remove | `POST /api/want-to-read/remove-series` body `{ seriesIds: number[] }` |
| Check | `GET /api/want-to-read?seriesId={id}` → `boolean` |

**Client**: `getWantToReadList`, `addToWantToRead`, `removeFromWantToRead`, `isInWantToRead`

**Note**: Empty filter body (`statements: []`, `combination: And`) returns full want-to-read list.

## Deferred (Phase 2+)

- Reading lists, bookmarks, ratings — contracts draft; probe in Phase 2/3
- FilterV2 `WantToRead` / `UserRating` enum values — T007 before starred shelf

## Live probe (optional)

```bash
# Requires logged-in token or run against local Kavita with env:
# KAVITA_URL=http://host:5000 KAVITA_USER=... KAVITA_PASS=...
node scripts/probe-kavita-personal-lists.mjs
```
