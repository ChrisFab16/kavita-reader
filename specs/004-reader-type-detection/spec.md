# Feature Specification: Reader Type Detection

**Feature**: `004-reader-type-detection`  
**Created**: 2026-06-16  
**Status**: Implemented — validation pending

**Input**: Console error "Failed to detect reader type" when opening a chapter from series detail.

## User Story

As a reader opening a chapter, the app picks the correct reader (image/PDF/CBZ vs EPUB) without failing when `/api/Reader/chapter-info` is unavailable.

## Acceptance Scenarios

1. **Given** a CBZ/CBR/image chapter, **When** user taps chapter, **Then** image reader opens without detection error.
2. **Given** an EPUB chapter, **When** user taps chapter, **Then** EPUB reader opens (via format hint or Book API fallback).
3. **Given** chapter metadata from series list, **When** Reader mounts, **Then** detection uses hint before network calls.

## Functional Requirements

- **FR-001**: Pass `chapterFormat` and `fileName` in `Reader` route params from `SeriesDetailScreen`.
- **FR-002**: `detectReaderKind()` tries hint → `chapter-info` → `book-info` fallback.
- **FR-003**: `ReaderScreen` waits for active client; re-runs detection when client becomes available.

## Key Files

- `src/utils/readerKind.ts`
- `src/screens/ReaderScreen.tsx`
- `src/screens/SeriesDetailScreen.tsx`
- `src/navigation/AppNavigator.tsx`
