# Quickstart: Tablet Layout Support

Test on Android tablet emulator configurations (e.g. 10" Pixel C in Android Studio).

## Prerequisites

- `npm install` completed
- Tablet emulator created with resolution at least 1280×800 (10" class)
- Phone emulator available for regression check

## Phase 1 foundation

1. Run `npm test` and confirm all `responsiveLayout` tests pass, including new tablet breakpoint tests.
2. Launch app on tablet emulator in **landscape**.
3. Verify no crash on cold start; Home loads.

## Phase 2 Home two-pane

4. On tablet landscape, confirm Home shows left pane (shelves/libraries) and right pane (series grid).
5. Tap a library in the left pane — series grid appears on the right.
6. Tap a collection — collection series appears on the right.
7. Tap **Currently Reading** shelf — On Deck grid appears on the right.
8. Rotate to **portrait** — layout switches to single-pane phone-style.
9. On tablet portrait, confirm browse grids use more than 5 columns and cards are not oversized.

## Phase 3 Series detail two-pane

10. From a series grid, tap a series.
11. On tablet landscape, confirm cover/summary on left and chapter/volume list on right.
12. Tap a chapter/volume — reader opens.
13. On tablet portrait, confirm Series Detail stacks vertically and is readable.

## Phase 4 Reader

14. Open image/PDF reader on a comic page.
15. Confirm page is not stretched to full tablet width; background letterboxes if needed.
16. Tap left/right edges — page turns; edge zones feel comfortable, not too wide.
17. Open EPUB reader — confirm text column does not span full width; margins are comfortable.

## Phase 5 Forms

18. Open Settings, Login, and Connect screens on tablet landscape.
19. Confirm content is centered and does not stretch to full width.

## Phase 6 Regression

20. Run the same flows on a phone emulator and confirm 013/014 behavior is unchanged.

Record pass/fail in `validation-results.md`.
