# Tasks: Reading Progress Sync

**Status**: Reader exit signed off — progress API fix still open

## Reader exit (signed off 2026-06-16)

- [x] T006 Fix reader back arrow + hardware back (`exitReader`, chrome z-index, tap zone gating)
- [x] T007 Manual validation: back from reading view — [validation-results.md](./validation-results.md)

## Progress sync (pending sign-off)

- [x] T001 Reproduce + document root cause — missing `libraryId`; wrong resume source (`currentPage` vs `get-progress`)
- [x] T002 Document `POST /api/Reader/progress` in `specs/contracts/kavita-reader-progress.md`
- [x] T003 Fix `markProgress` payload + `getProgress` on chapter load
- [x] T004 Surface save failure in reader UI (error banner); debounce unchanged
- [x] T008 Refresh series detail chapter progress on return from reader (`useFocusEffect` + silent volumes reload)
- [x] T005 Quickstart + progress sync sign-off in validation-results.md
