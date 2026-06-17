# Tasks: Image Reader Zoom, Fit & Gestures

**Feature**: `011-reader-zoom-gestures`  
**Phases**: 1 → 5 sequential; Phase 6 deferred

---

## Phase 1 — Foundation (memory + rotation + fit static)

- [ ] **T001** Add `getPageImageAuthSource(chapterId, page, { extractPdf? })` — `extractPdf=true` only when chapter is PDF (Q6-A)
- [ ] **T001b** Extend `getChapterInfo(chapterId, options?)` — for PDF: `extractPdf=true`, `includeDimensions=true` on open (Q6-C); use `pageDimensions` for fit math when available
- [ ] **T002** Add `readerFit.ts`: `computeFitScale(imageSize, viewport, mode)`, `autoFitMode(orientation)`, unit tests with fixture aspect ratios
- [ ] **T003** Replace module `SCREEN_WIDTH`/`SCREEN_HEIGHT` with `useWindowDimensions` in `ImageReaderScreen`
- [ ] **T004** Remove base64 `fetch`/`FileReader` pipeline; render with `expo-image` + auth headers
- [ ] **T005** Apply auto fit: portrait `fitScreen`, landscape `fitWidth` (static `contentFit` / layout until T008)
- [ ] **T006** Add `onLoad` / `onError` handlers; retry button on failure
- [ ] **T007** Verify grayscale overlay still covers full page
- [ ] **T008** Manual: rotate mid-read on CBZ chapter; confirm layout

**Phase 1 gate**: No `imageData` base64 state; landscape fit-to-width visible.

---

## Phase 2 — Zoom & pan core

- [ ] **T009** Create `ZoomablePageView.tsx` with Reanimated shared values (`scale`, `translateX`, `translateY`)
- [ ] **T010** Implement pinch gesture (clamp `fitScale` … `maxScale`, default 4×)
- [ ] **T011** Implement double-tap toggle (Q1); portrait → 2× fitScale, landscape → fitWidth (2× fitWidth if already at fitWidth — Q4)
- [ ] **T012** Implement pan gesture with bounds from `readerFit.ts`
- [ ] **T013** Compose gestures (`Gesture.Exclusive` / simultaneous) so pinch+pan work together
- [ ] **T014** Integrate `ZoomablePageView` into `ImageReaderScreen`; remove conflicting `TouchableOpacity` on image area
- [ ] **T015** Center single-tap at fit scale toggles chrome (preserve behavior)
- [ ] **T016** Unit tests: pan bounds clamp for over-zoomed translations
- [ ] **T017** Manual: pinch and double-tap on device

**Phase 2 gate**: Zoom and pan functional; chrome toggle works at fit.

---

## Phase 3 — Contextual navigation + zoom persistence

- [ ] **T018** Add `readerGestures.ts`: `canTurnPage(direction, gestureState)`, `isAtEdge(...)`, unit tests
- [ ] **T019** Wire L/R 30% tap zones through gesture router (only when `canTurnPage`)
- [ ] **T020** Suppress page turn while pan gesture active
- [ ] **T021** Edge-then-next-page when zoomed at horizontal (and vertical per **Q8**) edge
- [ ] **T022** Lift zoom `scale` to `ImageReaderScreen` state; persist across `currentPage`
- [ ] **T023** Reset `translateX/Y` on page change (**confirm Q2**)
- [ ] **T024** Reset scale to fit on new chapter open (**Q9** assumption)
- [ ] **T025** Regression: progress save, page sounds, hardware back, end-of-chapter alert
- [ ] **T026** Manual: zoomed exploration does not accidental page turn

**Phase 3 gate**: Research-aligned navigation; zoom survives page turns.

---

## Phase 4 — Settings, prefetch & polish

- [ ] **T027** Add `readerSettingsStore` (or extend theme store): `fitMode`, `prefetchPages`, `cacheEntireAlbum`, persisted
- [ ] **T028** Settings UI: fit mode selector + prefetch switches (**Constitution VII**)
- [ ] **T029** Create `readerPagePrefetch.ts`: warm N ahead, concurrency cap, cancel on unmount
- [ ] **T030** Hook prefetch on `currentPage` change; use `Image.prefetch` with auth headers
- [ ] **T031** Full-album mode: queue all pages with bounded parallelism when enabled
- [ ] **T032** Respect `fitMode` Settings override over auto landscape/portrait (**Q7**)
- [ ] **T033** Reduce-motion: shorten/disable zoom animation when system requests
- [ ] **T034** Unit/integration tests for prefetch window logic (mock client)
- [ ] **T035** Trim verbose `console.log` in reader hot path (minor hygiene)
- [ ] **T036** Manual quickstart (see [quickstart.md](./quickstart.md))
- [ ] **T037** Record results in `validation-results.md`

**Phase 4 gate**: Settings reachable; prefetch improves forward turns.

---

## Phase 5 — EPUB toggle shell (default off, no EPUB behavior change)

- [ ] **T038** Define `epubGestureOverrides` + global default in store (**confirm Q3** granularity)
- [ ] **T039** Settings: "Enhanced EPUB gestures" global switch (default off) + helper copy
- [ ] **T040** Optional: per-series override entry point on `SeriesDetailScreen` (long-press or ⋮ menu) — **if Q3 = per-series**
- [ ] **T041** `ReaderScreen`: read flag; stub branch does not alter `EpubReaderScreen`
- [ ] **T042** Document follow-up feature `012-epub-gesture-reader` in spec if EPUB implementation deferred
- [ ] **T043** Contract update: [reader-image-pipeline.md](./contracts/reader-image-pipeline.md) EPUB section

**Phase 5 gate**: EPUB unchanged; toggle persists.

---

## Phase 6 — Deferred (not scheduled in 011)

- [ ] **T044** Double-page spread view (new spec)
- [ ] **T045** Unify `cacheChapter` (series detail) with reader prefetch (**Q10**)
- [ ] **T046** EPUB gesture reader implementation
- [ ] **T047** Haptic feedback on edge reach (minor)
- [ ] **T048** User-configurable double-tap zoom level (**Q4** advanced)

---

## Traceability

| Spec FR | Tasks |
|---------|-------|
| FR-001 | T003 |
| FR-002 | T009–T014 |
| FR-003 | T002, T005, T032 |
| FR-004 | T012, T016 |
| FR-005 | T018–T021 |
| FR-006 | T022–T024 |
| FR-007 | T001, T001b, T004 |
| FR-008 | T029–T031 |
| FR-009 | T027–T028 |
| FR-010 | T038–T041 |
| FR-011 | T002, T016, T018, T034 |
| FR-012 | T025 |
