# Quickstart: Library Load Performance Validation

## Prerequisites

- Kavita server on LAN with a library of **50+ series** (100+ ideal)
- Android emulator or device with KavitaReader dev build installed
- Metro running (`npx expo start --dev-client`)

## Baseline (before fix)

1. Open app → connect → Home → tap slow library.
2. Note time until series grid appears (spinner clears).
3. In logcat, count `GET /api/Series/volumes` requests during load.

**Expected baseline failure mode**: 1 `all-v2` + N `volumes` requests; multi-second to minute wait for large N.

## After Phase 1 fix

1. Repeat library open.
2. **Pass**: Spinner clears in <3s on LAN for 100-series library.
3. **Pass**: Logcat shows **one** `all-v2` (or one per page), **zero** `volumes` calls until opening a series.
4. Pull-to-refresh: grid stays visible; refresh indicator only.
5. Disconnect server / invalid token: error message, no infinite spinner.
6. **Scroll stability**: Scroll down through 50+ series — list must **not** jump back to the top as covers load.

## After Phase 1b scroll fix

1. Reload app (Metro) after `LibraryDetailScreen` scroll changes.
2. Open large library, scroll continuously for 10+ seconds.
3. **Pass**: Scroll position preserved; no snap to top.

## After Phase 2 fix

1. Library with >100 series: scroll loads more items.
2. Series with 50+ chapters: smooth scroll; covers load as rows appear.
3. Tap chapter: reader opens immediately.

## Sign-off

Record timings in [validation-results.md](./validation-results.md).
