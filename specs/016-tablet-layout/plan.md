# Plan: Tablet Layout Support

**Branch**: `speckit-work`  
**Spec**: [spec.md](./spec.md) · **Analysis**: [analysis-report.md](./analysis-report.md)

## Technical context

| Area | Choice |
|------|--------|
| Platform | Android · Expo SDK 54 · React Native 0.81 |
| Breakpoints | Material 3 window-width classes: compact (<600 dp), medium (600–840 dp), expanded (>840 dp) |
| Orientation | Phone = single-pane; tablet landscape = two-pane where specified |
| UI | React Native Paper · conditional two-pane layouts inside existing screens |
| State | Local screen state for selected library/series in two-pane mode; no new Zustand stores |
| Testing | Unit tests for breakpoint helpers + new responsive layout tests; manual tablet emulator quickstart |

## Non-functional requirements

- **NFR-001 (Privacy)**: No telemetry; breakpoints computed locally via `useWindowDimensions`.
- **NFR-002 (Performance)**: Memoize layout class per dimension change; avoid recalculating grid metrics on every render.
- **NFR-003 (Accessibility)**: Minimum 48 dp touch targets; cover cards do not exceed a max readable width.
- **NFR-004 (Offline)**: Display-only; no impact.
- **NFR-005 (Multi-server)**: No impact.

## Architecture principle

**Progressive enhancement.** Tablet layout is additive. The existing phone single-pane UI remains the default. On expanded-width screens, screens render a two-pane layout when it improves the experience. The navigation stack remains unchanged so that deep links, back buttons, and screen transitions work the same way.

## Navigation map

```
Phone (unchanged)
  Home → LibraryDetail → SeriesDetail → Reader

Tablet landscape (expanded)
  Home (two-pane)
    ├── Left: shelf chips + Libraries / Collections / Currently Reading / Want to Read
    └── Right: selected shelf grid (Library, Collection, On Deck, Want to Read)
  SeriesDetail (two-pane)
    ├── Left: cover + summary + actions
    └── Right: chapter/volume list
  Reader (single-pane, but content constrained)
    └── Page/EPUB content limited to max readable width

Settings / Login / Connect (content constrained, centered)
```

## New / changed files

| Area | File | Change |
|------|------|--------|
| Utils | `src/utils/responsiveLayout.ts` | Add `useWindowSizeClass()`, `isTabletExpanded()`, `getTabletGridMetrics()` |
| Utils | `src/utils/responsiveLayout.test.ts` | Add tests for breakpoint helpers and tablet grid metrics |
| Components | `src/components/TabletTwoPane.tsx` | Reusable two-pane shell with left/right panes |
| Components | `src/components/TabletHomeMaster.tsx` | Left pane content for Home (shelves, libraries, collections) |
| Components | `src/components/TabletHomeDetail.tsx` | Right pane content for Home (series grid) |
| Screens | `src/screens/HomeScreen.tsx` | Conditional two-pane render on expanded landscape |
| Screens | `src/screens/LibraryDetailScreen.tsx` | Accept `inline` prop; render grid without navigation chrome |
| Screens | `src/screens/SeriesDetailScreen.tsx` | Conditional two-pane layout on expanded landscape |
| Screens | `src/screens/SettingsScreen.tsx` | Constrain content width on very wide screens |
| Screens | `src/screens/LoginScreen.tsx` | Constrain content width on very wide screens |
| Screens | `src/screens/ConnectScreen.tsx` | Constrain content width on very wide screens |
| Screens | `src/screens/ImageReaderScreen.tsx` | Limit page width + letterbox background |
| Screens | `src/screens/EpubReaderScreen.tsx` | Limit max content width + adaptive margins |

## API layer

No new Kavita API calls. Existing `KavitaClient` methods are reused for the selected library/collection/shelf in the detail pane.

## FilterV2 / contracts

No contract changes. This feature is purely UI layout.

## Phasing

| Phase | Deliverables | User value |
|-------|--------------|------------|
| **1** | Breakpoint helpers, `responsiveLayout` tablet metrics, unit tests | Foundation for all tablet work |
| **2** | Home two-pane master/detail + Library/Collection detail grid on right | Efficient tablet browsing |
| **3** | Series Detail two-pane layout | Better series overview |
| **4** | Reader max-width + tap zone adjustments | Comfortable reading on large screens |
| **5** | Settings/Login/Connect width constraints | Polished forms on tablets |

## Risks

| Risk | Mitigation |
|------|------------|
| Breaking phone 5-column landscape from 013 | Add tablet-only code paths; keep existing phone metrics unchanged |
| Two-pane state management conflicts with navigation | Keep selected item in local state; push full screen when needed (e.g. reader) |
| Reader max-width changes affect phone layout | Gate reader changes behind `isTabletExpanded()` |
| FlatList remount performance on large grids | Use `getItemLayout` and stable keys already in 013 |
| Foldable / DeX window resize | React to `useWindowDimensions` updates; defer complex fold states |

## Constitution alignment

- **Reader First**: Layout only; no server-side replacement.
- **Privacy**: No telemetry.
- **Offline**: No impact.
- **Format Fidelity**: Reader preserves readability.
- **Multi-Server**: No impact.
- **Expo Conventions**: Uses existing RN APIs and Paper components.
- **Settings**: No new persisted settings required.
