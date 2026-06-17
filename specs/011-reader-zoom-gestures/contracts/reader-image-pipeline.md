# Contract: Reader Image Pipeline & Gestures

**Feature**: `011-reader-zoom-gestures`  
**Consumers**: `ImageReaderScreen`, `readerPagePrefetch`, future EPUB gesture reader

## Double-tap zoom targets (Q4)

| Orientation | Fit (toggle out) | Zoom in (toggle in) |
|-------------|------------------|---------------------|
| Portrait | fitScreen (default) | 2× fitScale |
| Landscape | fitWidth (default) | fitWidth scale, or 2× fitWidth if already at fitWidth |

Toggle behavior (Q1): double-tap alternates between fit row and zoom-in row for current orientation.

## Authenticated page image source

```ts
type PageImageSource = {
  uri: string;       // KavitaClient.getPageImageUrl(chapterId, page, { extractPdf? })
  headers: {
    Authorization: `Bearer ${token}`;
  };
};
```

- **MUST NOT** hold page bytes as base64 in React state for display.
- **MUST** use `expo-image` for decode and native memory management.
- **MAY** append `apiKey` query param when client has API key (existing URL helper behavior).
- **PDF chapters (Q6 A+C)**:
  - Image URL: `extractPdf=true` **only** when chapter is PDF (`seriesFormat === 4` or `.pdf` filename).
  - Chapter open: `GET /api/Reader/chapter-info?chapterId=&extractPdf=true&includeDimensions=true` for PDF — warms server cache; use `pageDimensions` for fit bounds when present.
  - CBZ/archive/image: omit `extractPdf` on image requests.

## Prefetch

| Mode | Window | Concurrency |
|------|--------|-------------|
| Default | `currentPage + 1` … `currentPage + prefetchPages` (default 2) | 2 |
| Cache entire album | `0` … `totalPages - 1` | 3 (tunable) |

- Cancel all prefetch on reader unmount.
- At most **3** hot decoded pages under default settings (**NFR-001**).

## Fit modes

| Mode | Behavior |
|------|----------|
| `auto` | Portrait → fit screen; landscape → fit width |
| `fitScreen` | Entire page visible (`contain`) |
| `fitWidth` | Page width = viewport width |
| `fitHeight` | Page height = viewport height |

Settings override `auto` orientation defaults (**Q7**).

## Zoom state machine

| State | scale | Page turn |
|-------|-------|-----------|
| Fit | `scale === fitScale` | Tap L/R zones turn immediately |
| Zoomed interior | `scale > fitScale`, not at edge | Pan only; taps do not turn |
| Zoomed at edge | at min/max translation for direction | Tap/swipe turns page |

- **Persist** `scale` across page index within chapter.
- **Reset** `translateX/Y` on page index change (default; **Q2**).
- **Reset** `scale` to fit on new chapter (**Q9**).

## EPUB gesture opt-in (Phase 5+)

```ts
type EpubGesturePrefs = {
  globalEnabled: boolean;  // default false
  seriesOverrides: Record<number, boolean>;  // seriesId → enabled
  // chapterOverrides?: Record<number, boolean>;  // if Q3 = per-album
};
```

- When `globalEnabled === false` and no series override: `EpubReaderScreen` legacy behavior.
- Image reader (`ImageReaderScreen`) **ignores** EPUB prefs.
- Implementation of EPUB zoom/pan is **out of contract** until `012` spec.

## Progress & side effects

Page turns via gestures **MUST** call the same `goToNextPage` / `goToPreviousPage` paths as today (sounds, progress debounce unchanged). See [kavita-reader-progress.md](../contracts/kavita-reader-progress.md).
