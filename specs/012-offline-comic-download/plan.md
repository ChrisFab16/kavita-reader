# Plan: Offline Comic Download (shared assets)

**Feature**: `012-offline-comic-download`  
**Shared with**: `011` reader prefetch via `chapterPageAssets.ts`

## Architecture

```
chapterPageAssets.ts     → page indices + concurrency
readerPagePrefetch.ts    → expo-image warm (transient cache)
offlineChapterStorage.ts → react-native-blob-util durable files
downloadStore.ts           → queue + job state
ImageReaderScreen          → local file:// first, then network
```

Both paths use `KavitaClient.getPageImageUrl` / `getPageImageAuthSource` for the same page assets.

## Phase 1 (implemented)

- Single-album download from series detail (long-press)
- Page-based offline storage (comic/PDF/archive)
- Downloads queue screen + Settings entry
- Reader prefers offline copy when manifest + pages exist

## Deferred

- Series bulk download + album picker (FR-001/004)
- EPUB/PDF file download (non-paged)
- Wi‑Fi-only enforcement (needs NetInfo)
- System notifications (FR-008)
- Library grid long-press download
