# Plan: Landscape Interface

## Approach

1. Enable app-wide rotation in `app.json`.
2. Add pure `responsiveLayout.ts` helpers (column breakpoints at 500 / 700 / 900 px).
3. Refactor browse screens to derive card width and row chunking from `useWindowDimensions`.
4. Fix readers: drop portrait lock on image reader exit; EPUB uses live dimensions + shared edge ratio.
5. Move Home/Library search to header icon; show compact search bar only when active; tighten landscape padding.

## Files

| File | Change |
|------|--------|
| `app.json` | `orientation: "default"` |
| `src/utils/responsiveLayout.ts` | New grid helpers + tests |
| `src/components/ScreenHeaderActions.tsx` | Optional magnify/close search toggle |
| `src/screens/LibraryDetailScreen.tsx` | Dynamic grid, header search, compact landscape |
| `src/screens/HomeScreen.tsx` | Dynamic card width, header search, compact landscape |
| `src/screens/EpubReaderScreen.tsx` | `useWindowDimensions` |
| `src/screens/ImageReaderScreen.tsx` | Remove portrait lock on cleanup |

## Risks

- FlatList `getItemLayout` must use dynamic row height — remount list on column change via `key`.
- Android config change may restart activity on rotation — acceptable for dev client.
- Native rebuild may be required after `app.json` orientation change.
