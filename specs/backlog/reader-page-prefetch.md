# Backlog: Reader page prefetch & album cache

**Status:** Absorbed into [011-reader-zoom-gestures](../011-reader-zoom-gestures/spec.md) Phase 4 (T029–T031)  
**Created:** 2026-06-16

## Requirement

When the user **starts reading** (opens a chapter/album in the image/CBZ reader):

1. **Default:** Auto-cache the **next 2 pages** ahead of the current page so forward page turns stay responsive on slow networks.
2. **Optional (Settings):** Allow **cache entire album** — prefetch all pages in the current chapter/CBZ, not just the 2-page window.

## Notes

- Distinct from series-detail cover prefetch and background `cacheChapter` on chapter tap (see `specs/009-series-detail-load/`).
- Full-album mode should be user-controlled (storage/bandwidth); default stays conservative (2 pages).
- Settings entry should live alongside other reader preferences (same area as page-turn sounds, grayscale, etc.).

## Related

- `specs/011-reader-zoom-gestures/` — primary spec
- `src/screens/ImageReaderScreen.tsx` — page load path
- `src/api/kavitaClient.ts` — `cacheChapter`, image URL helpers
- `feature_roadmap_doc.md` — Reading Experience
