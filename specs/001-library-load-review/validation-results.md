# Validation Results: Library Load Performance (Phase 1)

**Date:** 2026-06-16  
**Build:** `fix/login-credential-handling` (PR #4)  
**Server:** `https://comics.skadaha.dk`  
**Method:** Manual quickstart on Android emulator (`SweetHomeNG_API35`)

| Test | Result | Notes |
|------|--------|-------|
| Library opens quickly (100+ series) | **Pass** | User sign-off: library load is fast after Phase 1 N+1 removal |
| Single `all-v2` per open (no list `volumes`) | **Pass** | Inferred from fast load + code path; logcat not formally counted |
| Pull-to-refresh without full-screen loader | **Pending** | Not explicitly exercised |
| Stable scroll while browsing grid | **Fix applied — re-test** | User reported scroll jumping to top; see T020 in tasks.md |
| Error state / null client | **Not re-tested** | Implemented in Phase 1; no regression reported |

## Scroll regression (manual QA)

**Reported:** While scrolling down the library grid, the list repeatedly jumped back to the top.

**Likely cause:** FlatList layout remeasurement as `expo-image` covers decode (variable row height) plus missing `flex: 1` on the list container.

**Remediation (T020):** Fixed row height, `getItemLayout`, `flex: 1`, `removeClippedSubviews={false}` on Android, memoized `SeriesCard`, stable Zustand client selector.

**Follow-up:** User to re-test scroll after Metro reload.
