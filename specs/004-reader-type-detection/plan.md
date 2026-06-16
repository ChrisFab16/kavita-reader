# Plan: Reader Type Detection

## Root cause

`ReaderScreen` called `/api/Reader/chapter-info` on mount with empty `useEffect` deps. EPUB-only chapters (and some formats) may not respond on that endpoint. Detection also ran before client was guaranteed ready.

## Implementation

1. `readerKindFromChapterMeta()` — uses Kavita `format` enum + `fileName` extension.
2. `detectReaderKind()` — hint → chapter-info → book-info fallback → default image.
3. `SeriesDetailScreen` passes `chapterFormat`, `fileName` in navigation params.
4. `ReaderScreen` — stable client selector; deps `[client, chapterId, format, fileName]`.

## Validation

Open image comic chapter and EPUB book from series detail; no "Failed to detect reader type" in console.
