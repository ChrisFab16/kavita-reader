# Feature Specification: Image Reader Zoom, Fit & Gestures

**Feature Branch**: `011-reader-zoom-gestures`

**Created**: 2026-06-16

**Status**: Specified — all open questions resolved (2026-06-16)

**Input**: Phased reader improvements for CBZ/CBR/image/PDF page reader: landscape fit-to-width, double-tap zoom, 2D pan when zoomed, contextual page-turn vs pan, persist zoom across pages, memory-safe `expo-image` pipeline. EPUB excluded by default; optional per-album/series toggle planned later. Include all research recommendations (pinch, Settings fit modes, edge-then-next-page, prefetch, rotation, tests).

**Related**: [008-reading-progress-sync](../008-reading-progress-sync/spec.md), [reader-page-prefetch backlog](../backlog/reader-page-prefetch.md), [kavita-reader-progress contract](../contracts/kavita-reader-progress.md), `feature_roadmap_doc.md` (Reading Experience)

## Scope

| In scope (default) | Out of scope (this feature) |
|--------------------|-----------------------------|
| `ImageReaderScreen` (image/CBZ/CBR/PDF pages) | EPUB gesture implementation (Phase 5 is toggle + contract only) |
| `expo-image` authenticated URI loading | Double-page spread view (defer to `012` or roadmap) |
| RNGH + Reanimated zoom/pan | Server-side Kavita API changes |
| Settings for fit mode & prefetch | iOS-specific QA (Android primary) |

## User Scenarios & Testing

### User Story 1 - Landscape fit-to-width (Priority: P1)

As a reader holding my phone in landscape, I want each page to use the full screen width so I can read without letterboxing on the sides.

**Why this priority**: Most-requested layout fix; no gesture complexity required for MVP value.

**Independent Test**: Open any manga/CBZ chapter, rotate to landscape — page fills width, height may crop or letterbox per aspect ratio.

**Acceptance Scenarios**:

1. **Given** portrait orientation, **When** the page loads, **Then** default fit is **fit-to-screen** (equivalent to current `contain` within viewport).
2. **Given** landscape orientation, **When** the page loads or device rotates, **Then** default fit is **fit-to-width** (page width matches viewport width).
3. **Given** orientation changes mid-read, **When** rotation completes, **Then** fit recalculates from `useWindowDimensions` without requiring app restart.

---

### User Story 2 - Double-tap and pinch zoom (Priority: P1)

As a reader, I want to zoom into panel detail with double-tap (and pinch) like other comic apps.

**Why this priority**: Industry-standard affordance; pairs with pan for readable detail.

**Independent Test**: Double-tap center of page — scale increases per orientation (portrait → 2×; landscape → fit-width scale); double-tap again returns to fit.

**Acceptance Scenarios**:

1. **Given** page at default fit in **portrait**, **When** I double-tap, **Then** zoom animates to **2× fit scale** centered on tap point (or viewport center).
2. **Given** page at default fit in **landscape**, **When** I double-tap, **Then** zoom animates to **fit-width scale** (page width = viewport width).
3. **Given** page zoomed (either target), **When** I double-tap again, **Then** zoom returns to current fit mode (**toggle** — Q1).
4. **Given** landscape default is already fit-width, **When** I double-tap to zoom in, **Then** use **2× fit-width scale** so zoom-in is not a no-op (derived rule — see Q4).
3. **Given** two fingers on page, **When** I pinch, **Then** scale updates smoothly between min (fit scale) and max zoom cap (**4×** fit scale — Q5).
4. **Given** `Reduce motion` / accessibility settings (if detectable), **When** zooming, **Then** animation duration respects system preference or falls back to instant snap.

---

### User Story 3 - Pan when zoomed; tap to turn when not (Priority: P1)

As a reader, I want dragging to pan within a zoomed page, and short taps on the sides to turn pages only when I am not panning or at the page edge.

**Why this priority**: Core gesture disambiguation; prevents accidental page turns while exploring a zoomed panel.

**Independent Test**: Zoom in, drag — image moves; release at interior — right tap does not turn page until panned to right edge.

**Acceptance Scenarios**:

1. **Given** scale &gt; fit scale, **When** I drag, **Then** the page pans in 2D with translation clamped so no empty margin beyond page edges (CDisplayEx-style bounds).
2. **Given** scale &gt; fit scale and pan not at horizontal edge, **When** I tap the right 30% zone, **Then** page does **not** advance (pan gesture wins).
3. **Given** scale &gt; fit scale and pan at **right** edge, **When** I tap the right zone or swipe past edge, **Then** `goToNextPage` fires (edge-then-next-page).
4. **Given** scale at fit and chrome hidden, **When** I short-tap left/right 30% zones, **Then** previous/next page (preserve existing behavior).
5. **Given** scale at fit, **When** I tap center, **Then** chrome toggles (preserve existing behavior).
6. **Given** a pan gesture in progress, **When** finger lifts, **Then** no tap-to-turn fires for that touch sequence.

---

### User Story 4 - Persist zoom across page turns (Priority: P2)

As a reader who prefers a fixed zoom level, I want the same zoom level kept when I turn pages so I do not re-zoom every page.

**Why this priority**: Documented UX pain point in comic reader research; depends on Stories 1–3.

**Independent Test**: Zoom to 2×, turn 3 pages — scale remains 2×; pan resets per page (**assumption**).

**Acceptance Scenarios**:

1. **Given** user zoomed to scale S &gt; fit, **When** `goToNextPage` / `goToPreviousPage`, **Then** scale S is preserved on the new page.
2. **Given** page turn while zoomed, **When** new image loads, **Then** pan translation resets; scale preserved (Q2).
3. **Given** fit mode page, **When** page turns, **Then** scale remains at fit for new page dimensions.
4. **Given** user opens a **new chapter**, **When** reader loads, **Then** zoom resets to fit (Q9).

---

### User Story 5 - Memory-safe image loading (Priority: P1)

As a reader on a mid-range device, I want pages loaded without holding full base64 strings in JS heap.

**Why this priority**: Current `FileReader` + `RNImage` base64 path does not scale for large pages or prefetch.

**Independent Test**: Read 20+ pages — no proportional JS heap growth; images decode via native pipeline.

**Acceptance Scenarios**:

1. **Given** authenticated Kavita page URL, **When** page displays, **Then** `expo-image` loads via `uri` + `headers.Authorization` (no base64 `data:` in React state).
2. **Given** page change, **When** previous page unmounts, **Then** prior `expo-image` source is released (`recyclingKey` or key change); at most **current + prefetch window** images retained.
3. **Given** prefetch warms next pages, **When** user turns page, **Then** display prefers warmed cache without duplicate full fetch in JS.
4. **Given** OOM pressure, **When** `expo-image` `onError`, **Then** user sees recoverable error UI with retry (no silent hang).

---

### User Story 6 - Settings: fit mode & prefetch (Priority: P3)

As a reader, I want to override default fit (width / height / screen) and control prefetch depth from Settings.

**Why this priority**: Power-user parity with CDisplayEx; depends on core zoom existing.

**Independent Test**: Change fit mode in Settings — next opened chapter uses selection; prefetch toggle changes warm window.

**Acceptance Scenarios**:

1. **Given** Settings → Reading, **When** I select **Fit width | Fit height | Fit screen**, **Then** preference persists and applies to new reader sessions.
2. **Given** default prefetch (2 pages), **When** I start reading, **Then** next 2 pages prefetch in background without blocking first paint.
3. **Given** **Cache entire album** enabled, **When** I open a chapter, **Then** all pages prefetch with concurrency cap and cancel on exit.
4. **Given** any reader preference, **When** I look in Settings, **Then** it is reachable per Constitution VII (not setup-only).

---

### User Story 7 - EPUB gesture toggle (planned, default off) (Priority: P4)

As a reader, I may want the same zoom/pan gestures on reflowable EPUB in the future, but only when I opt in per series or album.

**Why this priority**: Explicitly deferred implementation; architecture and Settings contract only in this feature.

**Acceptance Scenarios**:

1. **Given** default install, **When** I open EPUB, **Then** `EpubReaderScreen` behavior is unchanged (scroll + tap zones).
2. **Given** Phase 5 complete, **When** toggle enabled for a series, **Then** reader routes to gesture-enabled path (implementation may be follow-up feature).
3. **Given** toggle storage, **When** user disables globally, **Then** per-series overrides respect precedence: global off wins unless series override explicitly enabled (Q3).

---

## Functional Requirements

- **FR-001**: Replace module-level `Dimensions.get` constants with `useWindowDimensions` in reader layout.
- **FR-002**: Extract `ZoomablePageView` (or equivalent) using `react-native-gesture-handler` + `react-native-reanimated` for pinch, pan, double-tap.
- **FR-003**: Implement fit modes: `fitScreen`, `fitWidth`, `fitHeight`; defaults: portrait → `fitScreen`, landscape → `fitWidth` unless Settings override.
- **FR-004**: Clamp pan translation so zoomed image never exposes more than configurable edge bleed (default 0px).
- **FR-005**: Gesture router: active pan/pinch suppresses tap-to-turn; at fit scale, preserve 30% L/R tap zones and center chrome toggle.
- **FR-006**: Persist `scale` across `currentPage` changes; reset `translateX/Y` on page change unless clarified otherwise.
- **FR-007**: `getPageImageAuthSource` uses `expo-image` with auth headers (no base64). **`extractPdf=true` only for PDF chapters** (Q6-A). On PDF open, `getChapterInfo` uses `extractPdf=true` and `includeDimensions=true` to warm server cache and supply page dimensions (Q6-C).
- **FR-008**: Prefetch: default next **2** pages; optional full-album with bounded concurrency (see backlog).
- **FR-009**: Settings entries for fit mode, prefetch window, cache-entire-album (Constitution VII).
- **FR-010**: EPUB gesture enablement stored as opt-in metadata keyed by series and/or chapter (**granularity TBD**); default `false`.
- **FR-011**: Unit tests for fit-scale math, pan bounds, edge-then-next-page decision function.
- **FR-012**: Progress save, page sounds, grayscale overlay remain functional with new view hierarchy.

## Non-Functional Requirements

- **NFR-001**: No more than **3** decoded page bitmaps hot at once under default prefetch (current + 2).
- **NFR-002**: Page turn perceived latency &lt; 100ms when prefetch hit; show existing loading indicator on miss.
- **NFR-003**: Zoom animations ≤ 250ms default (respect reduce motion).
- **NFR-004**: Max zoom scale cap **4×** fit scale (Q5).
- **NFR-005**: No tokens or API keys in logs (Constitution II).

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Reader first | Pass | Core reading UX |
| IV. Format fidelity | Pass | Image path only in Phases 1–4 |
| VI. Expo conventions | Pass | `expo-image`, existing RNGH/Reanimated |
| VII. Settings parity | Pass | Fit + prefetch in Settings |

## Resolved decisions (2026-06-16)

| ID | Decision |
|----|----------|
| **Q1** | Double-tap **toggles** fit ↔ zoom |
| **Q2** | Page turn while zoomed: **reset pan**, keep scale |
| **Q3** | EPUB gestures: **per-series override** + global default off |
| **Q4** | Double-tap zoom target: **portrait → 2× fit scale**; **landscape → fit-width scale** (if already at fit-width, zoom-in → 2× fit-width) |
| **Q5** | Max pinch zoom **4×** fit scale |
| **Q6** | **A+C**: `extractPdf=true` on image requests **PDF only**; on PDF open, `chapter-info` with `extractPdf=true` + `includeDimensions=true` |
| **Q7** | Settings fit mode **overrides** auto portrait/landscape defaults |
| **Q8** | Edge-then-next on **both axes** when zoomed (incl. tall webtoon pages) |
| **Q9** | Reset zoom to fit on **new chapter**; persist scale across pages within chapter |
| **Q10** | Defer `cacheChapter` unification to Phase 6 |

## Key Files

- `src/screens/ImageReaderScreen.tsx`
- `src/components/reader/ZoomablePageView.tsx` (new)
- `src/utils/readerFit.ts` (new) — fit scale & bounds math
- `src/utils/readerGestures.ts` (new) — edge detection, tap vs pan
- `src/services/readerPagePrefetch.ts` (new)
- `src/stores/readerSettingsStore.ts` (new or extend `themeStore`)
- `src/api/kavitaClient.ts` — `getPageImageUrl`, auth headers helper
- `src/screens/SettingsScreen.tsx`
- **Contract:** [reader-image-pipeline.md](./contracts/reader-image-pipeline.md)

## Out of Scope (later features)

- Double-page spread for tablets/landscape (`feature_roadmap_doc.md`)
- EPUB gesture implementation (Phase 5 toggle shell only)
- Kavita server pagination for chapter pages
