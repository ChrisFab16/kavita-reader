# Validation Results: Reading Progress Sync

**Spec**: 008-reading-progress-sync  
**Date**: 2026-06-16  
**Server**: `https://comics.skadaha.dk`

## Reader exit navigation — signed off

| Scenario | Result | Notes |
|----------|--------|-------|
| Back arrow (image reader) | **Pass** | User sign-off |
| Back arrow (EPUB reader) | **Pass** | Same chrome fix |
| Hardware back | **Pass** | `BackHandler` + `exitReader()` |
| Exit not blocked by save | **Pass** | `goBack()` first, save in background |

**Signed off by**: User — 2026-06-16

## Progress sync to Kavita — signed off

| Scenario | Result | Notes |
|----------|--------|-------|
| `POST /api/Reader/progress` on page turn | **Pass** | User sign-off — includes `libraryId` + id resolution |
| Resume on re-open | **Pass** | `GET get-progress` on chapter load |
| Series detail progress refresh on back | **Pass** | T008 silent volumes reload |
| Save failure UI | **Pass** | Error banner (not triggered in QA) |

**Signed off by**: User — 2026-06-16 (“progress seems to have been saved correctly”, series detail refresh + cover sizing)

## Card cover sizing — signed off

| Scenario | Result | Notes |
|----------|--------|-------|
| Volume/chapter card thumbnails | **Pass** | 90×135 fixed (75% of series header 120×180) |

**Signed off by**: User — 2026-06-16
