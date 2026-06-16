# Plan: Library Data Reset

## Approach

1. Add a small Zustand store with a monotonic `resetToken` and `requestFullReload()` that clears expo-image caches then bumps the token.
2. Settings confirms, calls `requestFullReload()`, then `navigation.reset` to `Home`.
3. `HomeScreen` and `LibraryDetailScreen` subscribe via `useLibraryReloadOnFocus`: on focus, if `resetToken` changed, clear local list state and call load with `{ reset: true }` (empty grid + full-screen loader, not pull-to-refresh overlay).

## Risks

- Clearing image cache may briefly flash placeholders on next open — acceptable for explicit reset.
- Does not invalidate Kavita server-side cache — relies on fresh API fetch.
