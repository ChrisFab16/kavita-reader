# Feature Specification: Tablet Layout Support

**Feature**: `016-tablet-layout`

**Created**: 2026-06-23

**Status**: Specified — analysis and planning phase

**Input**: Make the KavitaReader Android app usable and visually comfortable on tablet-class devices (7"–13" screens), not just phones.

## Scope

| In scope | Out of scope |
|----------|--------------|
| Layouts adapt to screen width classes (phone, tablet portrait, tablet landscape) | iOS-specific tablet work |
| Two-pane master/detail on Home + Library + Series Detail for large screens | Split-window multi-instance support |
| Responsive grids that use larger column counts on tablets | Replacing Kavita web UI |
| Reader adapts tap zones and chrome to wider screens | Foldable-window-state transitions beyond simple orientation |
| Settings and Login remain readable on tablets | Desktop / DeX windowed mode beyond basic scaling |

## Executive evaluation

Currently the app targets phones:
- `013-landscape-interface` fixed landscape to **5 columns** regardless of width.
- Home, Library, and Series Detail are single-pane screens.
- Reader uses tap zones based on screen edges and limited-screen real estate.

Tablets introduce the following new constraints and opportunities:
- Much more horizontal real estate in both portrait and landscape.
- Users expect a two-pane "browse on the left, read on the right" or "list on the left, detail on the right" pattern.
- The 5-column cap wastes space on 10"+ screens.
- Touch targets should not shrink; cards should not blow up to huge sizes.

This feature is a **cross-cutting UX foundation** that touches the same components as `013`, `014`, `009`, and reader screens. It should be implemented as a separate Spec Kit feature so that `013` and `014` can remain scoped to phones.

## Terminology

- **Screen width class**: compact, medium, expanded (Material 3 breakpoints).
- **Two-pane**: persistent left pane for navigation/list + right pane for detail/reader.
- **Single-pane**: current phone layout where each screen is full-screen.
- **Master/detail**: Home or Library as master, Series Detail or Reader as detail.

## User Stories

### US1 — Browse libraries on a tablet (P1)

As a tablet user, I want to browse libraries and collections without cards becoming oversized or the list wasting half the screen.

**Acceptance**:
1. In tablet portrait, Home/Library grids use **more than 5 columns** when the width supports it, with card widths capped at a comfortable maximum (~160–180 dp).
2. In tablet landscape, Home shows a **two-pane layout**: shelf chips + library/collection list on the left (~40% of width), and the selected library's series grid on the right (~60%).
3. Default selection is Libraries; tapping a library or collection loads its series on the right.
4. On tablet landscape, tapping a series in the right pane opens Series Detail on the same screen (not a full-screen push) or navigates if detail is not yet available.

### US2 — Series detail on tablets (P1)

As a tablet user, I want to see series info and the chapter/volume list side by side.

**Acceptance**:
1. In tablet landscape, Series Detail uses a two-pane layout: series cover + summary on the left (~40%), chapter/volume list on the right (~60%).
2. Tapping a chapter/volume opens the reader directly from the tablet layout.
3. In tablet portrait, the layout remains single-pane (stacks vertically) but is not cramped.

### US3 — Reader on tablets (P2)

As a tablet user, I want the reader to use the larger screen effectively without oversized pages or awkward tap zones.

**Acceptance**:
1. Image/PDF reader fits pages to a maximum readable width; background letterboxes for wide screens.
2. EPUB reader uses a readable maximum line length; margins scale, text does not span the full width of a 13" tablet.
3. Tap zones are adjusted for tablet width (edge zones still near the sides, not 20% of a very wide screen).
4. Reader chrome (toolbars, page numbers) adapts to landscape orientation and is not clipped.

### US4 — Settings and forms (P2)

As a tablet user, I want Settings, Login, and Connect screens to be readable and not stretch fields to uncomfortable widths.

**Acceptance**:
1. Form fields have a max width (~600 dp) and are centered on very wide screens.
2. Settings list items do not span the full width of a 13" tablet.
3. No input is clipped or hidden by the on-screen keyboard.

## Functional Requirements

- **FR-001**: Introduce a screen-size classification system (compact, medium, expanded) based on window width/height, separate from phone-landscape 5-column rule.
- **FR-002**: On expanded-width landscape, Home uses a two-pane master/detail layout where the left pane lists shelves/libraries/collections and the right pane shows the selected grid.
- **FR-003**: On expanded-width landscape, Library Detail (when invoked from a narrow layout) is replaced by inline display in the right pane.
- **FR-004**: On expanded-width screens, browse grids may exceed 5 columns up to a maximum that keeps card width within a comfortable range (cap card width ~160 dp).
- **FR-005**: On expanded-width landscape, Series Detail uses a two-pane layout: cover/metadata left, chapter/volume list right.
- **FR-006**: Image/PDF reader limits displayed page width to a maximum readable width and letterboxes the background on wide tablets.
- **FR-007**: EPUB reader limits maximum line width to a readable measure on tablets (max content width ~800 dp, adaptive margins).
- **FR-008**: Tap zone ratios are derived from a comfortable physical distance from the screen edges, not a fixed percentage of total width.
- **FR-009**: Settings and form screens constrain content width and center on very wide screens.
- **FR-010**: All existing phone behavior remains unchanged; no regression on phone portrait/landscape.

## Non-Functional Requirements

- **NFR-001 (Privacy)**: No new telemetry; device size classification is computed locally.
- **NFR-002 (Performance)**: Layout calculations run on window-dimension change, not per render; no heavy re-renders on scroll.
- **NFR-003 (Accessibility)**: Minimum touch target remains 48 dp; cards do not shrink below readable cover sizes.
- **NFR-004 (Offline)**: No offline impact; this is a display-only feature.
- **NFR-005 (Multi-server)**: No impact; layout is independent of active server.

## Key Decisions / Open Questions

| ID | Decision | Status |
|----|----------|--------|
| Q1 | Use Material 3 breakpoints (compact <600 dp, medium 600–840 dp, expanded >840 dp) or custom thresholds? | Proposed: Material 3 |
| Q2 | Should two-pane Series Detail be a separate screen component or conditional layout inside `SeriesDetailScreen`? | Proposed: conditional layout inside existing screen |
| Q3 | Should Home two-pane be a new `TabletHomeScreen` or conditional render in `HomeScreen`? | Proposed: conditional render in `HomeScreen` to keep navigation simple |
| Q4 | Does React Native Paper already expose window-size class hooks? | To verify: use `useWindowDimensions` + local breakpoints |
| Q5 | How to handle foldable intermediate states (half-open)? | Deferred: treat as expanded landscape if width >= 840 dp |

## Success Criteria

- **SC-001**: On a 10" tablet emulator in landscape, Home shows left/right panes and tapping a library loads its series on the right.
- **SC-002**: On a 10" tablet emulator in portrait, browse grids use 6+ columns without cards exceeding ~180 dp width.
- **SC-003**: Phone portrait and landscape behavior is unchanged from `013` baseline.
- **SC-004**: Reader displays pages at a comfortable size; no horizontal stretching on a 13" tablet.
- **SC-005**: All unit tests for `responsiveLayout` continue to pass; new tablet tests added.

## Dependencies

- **013**: Landscape interface, grid helpers, responsive layout foundation.
- **014**: Home shelf selector and personal-list navigation patterns must be respected in tablet layout.
- **009**: Series Detail screen structure and chapter/volume list.
- **011**: Reader tap zones and gesture zones.

## Constitution Check

- **I Reader First**: Only layout changes; no server-side duplication.
- **II Privacy**: No telemetry or cloud breakpoints.
- **III Offline**: Display-only; no offline impact.
- **IV Format Fidelity**: Reader limits preserve readability; no format support claims added.
- **V Multi-Server**: Layout independent of server state.
- **VI Expo Conventions**: Uses `useWindowDimensions`, no new native modules unless justified.
- **VII Settings**: No new persistent settings required for layout; optional default could be added later.


