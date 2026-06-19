# Quickstart: Image Reader Zoom, Fit & Gestures

Manual acceptance for feature `011-reader-zoom-gestures`. Run on **physical Android device** where possible (gestures differ on emulator).

## Prerequisites

- Kavita server with at least one **CBZ/CBR** chapter (multi-page) and one **PDF** chapter if available
- Logged-in app build from branch with Phase completed
- Optional: slow network throttling (developer options) for Phase 4

## Phase 1 — Foundation

1. Open a CBZ chapter in portrait — page fits screen (letterboxing top/bottom if tall page).
2. Rotate to landscape — page **fills width** (may letterbox vertically).
3. Rotate back to portrait — layout updates without black bars stuck at old size.
4. Turn 10+ pages — no growing lag; no crash (memory).
5. Enable **Grayscale** in Settings — reader still shows grayscale overlay.

**Pass**: Rotation correct; images load without long base64 stalls.

## Phase 2 — Zoom & pan

1. Hide chrome (tap center or start with chrome hidden).
2. **Double-tap** page — zooms in with animation.
3. **Double-tap** again — returns to fit (toggle).
4. **Pinch** in/out — scale follows fingers; does not exceed reasonable max.
5. While zoomed, **drag** — page pans; cannot drag past page edges into empty void.
6. Tap center at fit — chrome toggles.

**Pass**: Zoom/pan feel smooth; no stuck scale.

## Phase 3 — Navigation

1. At fit, hidden chrome: tap **right 20%** — next page; **left 20%** — previous page.
2. Zoom in, pan to **center** — tap right zone — **no** page turn.
3. Zoom in, pan to **right edge** — tap right zone — **next** page.
4. Zoom to ~2×, turn 3 pages forward — **scale stays** ~2× each page.
5. Exit chapter and re-enter — zoom resets to fit.
6. Page turn sound (if enabled) still plays.
7. Leave reader — progress saved on Kavita (spot-check server or re-open chapter).

**Pass**: Contextual navigation matches comic-reader expectations.

## Phase 4 — Settings & prefetch

1. Settings → Reading → set **Fit height** — open new chapter — page fits height.
2. Default prefetch: on page 1, wait briefly, turn to page 2–3 — loads feel instant vs cold start.
3. Enable **Cache entire album** on small chapter (&lt;30 pages) — all pages warm; disable after test.
4. Airplane mode after prefetch window warmed — forward page in window still displays (if cached).
5. Toggle fit back to **Auto** — portrait/landscape defaults restore.

**Pass**: All prefs in Settings; prefetch improves turns.

## Phase 5 — EPUB toggle (no behavior change)

1. Open EPUB chapter — scroll/tap behavior **unchanged** from before feature.
2. Enable "Enhanced EPUB gestures" in Settings — open same EPUB — still **unchanged** (stub).
3. Toggle off — persists after app restart.

**Pass**: EPUB parity with pre-011 behavior.

## Regression bundle (any phase)

- [ ] End-of-chapter alert on last page
- [ ] Hardware back saves progress and exits
- [ ] Progress error banner if server offline (existing behavior)
- [ ] PDF chapter: `chapter-info` warm on open; pages load with `extractPdf` (first page may take longer on cold server)

## Sign-off

Record device model, Android version, and pass/fail per phase in `validation-results.md`.
