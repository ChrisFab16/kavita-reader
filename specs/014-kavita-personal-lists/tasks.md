# Tasks: Kavita Personal Lists & Server Sync

## Phase 0 — Spike & contracts

- [ ] T001 Live API probe on user's Kavita instance (on-deck, want-to-read, reading-list, bookmark, rating routes) — record in contract docs
- [ ] T002 Add `specs/contracts/kavita-on-deck.md`
- [ ] T003 Add `specs/contracts/kavita-want-to-read.md`
- [ ] T004 Add `specs/contracts/kavita-reading-lists.md`
- [ ] T005 Add `specs/contracts/kavita-bookmarks.md`
- [ ] T006 Add `specs/contracts/kavita-ratings.md` (starred)
- [ ] T007 Extend `kavita-filter-v2.md` with WantToRead + UserRating fields (after enum probe)

## Phase 1 — On Deck + Want to Read (P1)

- [ ] T008 `kavitaClient` methods: on-deck list + remove-from-on-deck
- [ ] T009 `kavitaClient` methods: want-to-read v2 list + add/remove + membership check
- [ ] T010 Refactor or parametrize series grid for `onDeck` / `wantToRead` modes (reuse 007 pagination)
- [ ] T011 Home shelf selector; On Deck + Want to Read shelves
- [ ] T012 Series detail: Want to Read toggle with server sync
- [ ] T013 Unit tests for new client wrappers (mock axios)
- [ ] T014 Quickstart + validation-results Phase 1

## Phase 2 — Starred + Reading Lists (P2)

- [ ] T015 Rating read/write on series detail
- [ ] T016 Starred shelf (FilterV2 UserRating or dedicated endpoint)
- [ ] T017 Reading lists list + detail screens
- [ ] T018 Read-through navigation (open chapter from list item)
- [ ] T019 Quickstart + validation-results Phase 2

## Phase 3 — Bookmarks (P3)

- [ ] T020 Bookmarks shelf (all-bookmarks)
- [ ] T021 Reader bookmark/unbookmark + indicator
- [ ] T022 Jump from bookmark to reader page
- [ ] T023 Quickstart + validation-results Phase 3

## Maintenance

- [ ] T024 Regression: Collections + library browse (006/007 quickstart)
