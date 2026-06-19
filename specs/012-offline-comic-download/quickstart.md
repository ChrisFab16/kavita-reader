# Quickstart: Offline Comic Download (Phase 1)

**Prerequisites**: Authenticated Kavita server; comic/CBZ chapter with multiple pages.

1. **Settings** — open **Downloads** entry; confirm **Download on mobile data** toggle exists (default off).
2. **Series detail** — long-press an album row → **Download** → confirm snackbar; open **Downloads** → job shows **Downloading** then **Completed**.
3. **Offline chip** — return to series detail; completed album shows **Offline** chip.
4. **Airplane mode** — enable; open same album → reader loads pages from local storage within 5 s.
5. **Cancel** — enqueue another album; cancel from Downloads queue → job **Cancelled**, no **Completed** badge.
6. **Retry** — (if failed job available) tap **Retry** → job re-queues.
7. **EPUB album** — long-press Download → expect clear failure message (not supported in P1).

Record pass/fail in [validation-results.md](./validation-results.md).
