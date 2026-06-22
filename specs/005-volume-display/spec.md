# Feature Specification: Volume Display (Series Detail)

**Feature**: `005-volume-display`  
**Created**: 2026-06-16  
**Status**: Implemented

**Input**: A multi-volume manga series has 14 volumes but app listing omits volume numbering.

## Root cause

1. `shouldHideVolumeHeader` hid numeric volume names (`"1"`…`"14"`) — fixed in T001–T004.
2. Kavita archive chapters use `range: "-100000"` (whole volume = one CBZ). The UI showed **both** a volume header and a duplicate chapter card titled `Chapter -100000`.

## User Story

As a reader browsing a multi-volume manga series, I see **Volume 1 … Volume N** section headers and a series summary of **N Volumes**.

## Acceptance Scenarios

1. **Given** 14 volumes named `"1"`–`"14"`, **When** series detail renders, **Then** all 14 volume headers are visible with titles `Volume 1` … `Volume 14`.
2. **Given** loose-leaf volume `-100000`, **When** rendered, **Then** header remains hidden.
3. **Given** single EPUB volume, **When** rendered, **Then** redundant numeric header stays hidden; stats show `1 Book`.
4. **Given** one CBZ chapter with `range: "-100000"` per volume, **When** series detail renders, **Then** each volume is **one** tappable row (no duplicate chapter card).

## Automated tests

```bash
npm test
```

Uses Node test runner + `specs/005-volume-display/fixtures/sample-manga-volumes.json`.

## Key Files

- `src/utils/volumeDisplay.ts`
- `src/utils/volumeDisplay.test.ts`
- `src/screens/SeriesDetailScreen.tsx`
