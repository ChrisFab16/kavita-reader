# Feature Specification: Offline Comic Download

**Feature**: `012-offline-comic-download`

**Created**: 2026-06-17

**Status**: Phase 1 implemented — manual validation pending (T008)

**Input**: Download a local copy of one or more comics to the device for offline reading. Long-press a series in library view or a single album in series view and choose Download. Default: download on Wi‑Fi only, in series order. User can allow downloads on mobile data. Queue view for download status. Progress in system notifications.

**Related**: [008-reading-progress-sync](../008-reading-progress-sync/spec.md), [005-volume-display](../005-volume-display/spec.md), `feature_roadmap_doc.md` (v1.2 Offline Downloads Manager), `.specify/memory/constitution.md` (Principles III, V, VII)

## Scope

| In scope | Out of scope |
|----------|--------------|
| Long-press **Download** on library series cards and series-detail album rows | Bulk “download entire library” or auto-download on subscribe |
| Series download: confirm dialog (count/size) + optional album picker | Server-side Kavita changes |
| Persistent local copies usable when offline | Cloud backup of downloaded files |
| Enqueue one album or selected/all albums in a series (series order) | iOS shipping / platform parity |
| Offline download for all reader formats (EPUB, PDF, CBZ/CBR/CB7, images) | OPDS-only servers without standard chapter APIs (defer unless contract exists) |
| Download queue screen with per-job status | Background download while app process killed (best-effort within OS limits) |
| Foreground/system notification with aggregate progress | Social/sharing of downloaded files |
| Wi‑Fi-only default; mobile-data toggle in **Settings**; per-server download isolation | Social/sharing of downloaded files |

## Constitution Check

| Principle | Compliance |
|-----------|------------|
| I. Reader first | Downloads complement Kavita; server remains catalog source of truth |
| II. Privacy | No third-party analytics; download metadata stays on device |
| III. Offline-capable | Core purpose of feature |
| IV. Format fidelity | Offline copies MUST support same reader paths as online (EPUB, PDF, CBZ/CBR/CB7, images) |
| V. Multi-server | Queue entries and storage keyed by server identity |
| VI. Expo/RN | Plan phase selects storage/notification modules |
| VII. Settings parity | Mobile-data policy and queue entry reachable from Settings |

## Clarifications

### Session 2026-06-17

- Q: When user long-presses a series in the library and taps Download, enqueue immediately or confirm first? → A: Show confirmation with album count and estimated size when available; provide **Review albums** (or equivalent) to open a detailed picker for subset selection before enqueueing.
- Q: Which content formats should offline download support in v1? → A: All reader-supported formats (EPUB, PDF, CBZ/CBR/CB7, image sequences).

## User Scenarios & Testing

### User Story 1 - Download one album from series detail (Priority: P1)

As a reader on a series page, I long-press one album (readable volume/chapter row) and choose **Download** so I can read that title offline later.

**Why this priority**: Smallest slice that delivers offline value; validates enqueue, storage, and reader handoff for one unit.

**Independent Test**: Long-press one album → confirm download → turn on airplane mode → open same album → reader loads without network.

**Acceptance Scenarios**:

1. **Given** series detail is loaded, **When** I long-press an album row and tap **Download**, **Then** a download job is enqueued for that album and I see brief confirmation (snackbar or equivalent).
2. **Given** a job is **Completed**, **When** I open that album with no connectivity, **Then** the reader opens using the local copy within 5 seconds of tap.
3. **Given** the album is already fully downloaded, **When** I choose **Download** again, **Then** the app skips re-download or offers **Re-download** without corrupting the existing copy (exact UX in plan; no silent duplicate full fetch).
4. **Given** a completed download of an EPUB, PDF, or comic archive, **When** I open that album offline, **Then** the correct reader opens with full content (not cover-only or first-page cache).

---

### User Story 2 - Download series from library (Priority: P1)

As a reader browsing a library, I long-press a series and choose **Download**, review how many albums will transfer, and confirm—or open a detailed picker to choose specific albums—so the right titles are saved locally in reading order.

**Why this priority**: Primary bulk workflow; matches “comics on a trip” use case while avoiding accidental large downloads.

**Independent Test**: Long-press series → confirm dialog shows count → tap **Download** (or **Review albums** → subset → confirm) → queue shows jobs in volume/chapter order → offline open works.

**Acceptance Scenarios**:

1. **Given** library series list, **When** I long-press a series and tap **Download**, **Then** a confirmation dialog shows **album count** and **estimated total size** when size can be determined.
2. **Given** the confirmation dialog, **When** I tap **Download** (primary confirm), **Then** a batch is created enqueueing **all** readable albums in canonical series order (volumes/chapters as shown in series detail).
3. **Given** the confirmation dialog, **When** I tap **Review albums** (or equivalent), **Then** I see a picker listing albums in series order with checkboxes; I can select a subset and confirm to enqueue only selected albums in order.
4. **Given** Wi‑Fi-only mode and device on mobile data, **When** I confirm a series batch, **Then** jobs enter **Waiting for Wi‑Fi** and do not consume cellular data until policy changes or Wi‑Fi connects.
5. **Given** a multi-volume manga series, **When** downloads run, **Then** albums complete in the same order as series detail (Volume 1 before Volume 2, etc.).

---

### User Story 3 - Network policy: Wi‑Fi default, mobile data opt-in (Priority: P1)

As a reader, downloads use Wi‑Fi by default so I do not burn mobile data; I can allow cellular downloads in Settings when I choose.

**Why this priority**: Explicit user requirement; prevents bill shock.

**Independent Test**: Toggle setting → enqueue on cellular → observe pause vs active download.

**Acceptance Scenarios**:

1. **Given** fresh install or first use of downloads, **When** I check Settings, **Then** **Download on mobile data** is **off** (Wi‑Fi only).
2. **Given** Wi‑Fi-only and active queue on cellular, **When** device joins Wi‑Fi, **Then** waiting jobs resume automatically without re-enqueueing.
3. **Given** mobile data allowed, **When** only cellular is available, **Then** downloads proceed and notification shows progress.

---

### User Story 4 - Download queue view (Priority: P1)

As a reader, I open a **Downloads** queue to see what is downloading, waiting, completed, or failed, and to cancel or retry jobs.

**Why this priority**: User explicitly requested queue tracking.

**Independent Test**: Enqueue 3+ items → open queue → states match reality → cancel one → retry failed.

**Acceptance Scenarios**:

1. **Given** active or past jobs, **When** I open **Downloads** (from Settings and/or notification tap), **Then** I see each job with title, series name, status, and per-album progress where applicable.
2. **Given** a **Downloading** job, **When** I tap **Cancel**, **Then** the job stops and partial data is removed or marked incomplete per policy (no “complete” badge for partial).
3. **Given** a **Failed** job with retryable error, **When** I tap **Retry**, **Then** the job re-enters the queue without duplicating completed siblings in a series batch.
4. **Given** empty queue, **When** I open Downloads, **Then** I see an empty state with short guidance (long-press to download).

---

### User Story 5 - Notification progress (Priority: P1)

As a reader, I see download progress in the system notification area so I can monitor large series downloads without keeping the app open.

**Why this priority**: Explicit user requirement for notification progress.

**Independent Test**: Start series download → leave app → notification shows percent → completes or shows error.

**Acceptance Scenarios**:

1. **Given** at least one active download, **When** the app backgrounds, **Then** a persistent notification shows current item title and overall progress (e.g. “Series X — 3/14 albums, 42%”).
2. **Given** all jobs finish successfully, **When** the queue is idle, **Then** the notification dismisses or shows a completable summary within 30 seconds.
3. **Given** a fatal error on the current job, **When** download stops, **Then** the notification reflects failure and tapping opens the queue to the failed item.

---

### User Story 6 - Manage local storage (Priority: P2)

As a reader, I can remove downloaded albums or entire series from device storage when I need space.

**Why this priority**: Required for sustainable offline library; not blocking first offline read.

**Independent Test**: Download → delete from queue or series detail → offline open falls back to online-required message.

**Acceptance Scenarios**:

1. **Given** a completed download, **When** I remove it from the queue (or long-press **Remove download** on the album), **Then** local files are deleted and status returns to not downloaded.
2. **Given** low device storage below a threshold, **When** I start a large download, **Then** I see a warning before enqueueing (threshold defined in plan; default assumption: warn under ~500 MB free).

---

### Edge Cases

- Server unreachable mid-download → job **Failed**, resumable retry; no silent discard of completed siblings in a batch.
- Auth token expired during download → pause with actionable “Sign in again” state; resume after re-auth.
- Series metadata changes on server (new volume added) → existing batch does not auto-include new albums; user must download series again or new album individually.
- User switches active server → queue shows only current server’s jobs (or filter by server); no cross-server path confusion.
- Duplicate enqueue of same album while in progress → single active job (idempotent enqueue).
- App killed by OS → on next launch, queue restores state and resumes per policy (Wi‑Fi/cellular).
- Very large archive (hundreds of MB) → progress updates at least every few seconds; no UI freeze.
- Reading offline → progress saved locally and syncs when online (existing progress feature behavior).

## Requirements

### Functional Requirements

- **FR-001**: Library series cards MUST support long-press context menu with **Download**, opening a confirmation dialog (album count, estimated size when known) with primary **Download** and secondary **Review albums** leading to a checkbox picker for subset selection.
- **FR-002**: Series detail album rows MUST support long-press context menu with **Download** (single album).
- **FR-003**: System MUST persist downloaded content on device until user removes it or uninstalls the app.
- **FR-004**: System MUST enqueue series downloads in canonical series order (as ordered in series detail), whether all albums or a picker-selected subset.
- **FR-004a**: Album picker MUST list albums in series order; default selection is all albums not yet fully downloaded (already-complete albums unchecked unless user selects them).
- **FR-005**: System MUST default to **Wi‑Fi only** for active transfers; cellular transfers disabled until user enables **Download on mobile data** in Settings.
- **FR-006**: Settings MUST expose **Download on mobile data** (default off) and navigation to **Downloads** queue.
- **FR-007**: System MUST provide a **Downloads** queue listing jobs with states: Queued, Waiting for Wi‑Fi, Downloading, Completed, Failed, Cancelled.
- **FR-008**: System MUST show download progress in a system notification while work is active.
- **FR-009**: Reader MUST prefer local copy when available and valid; otherwise require network with clear error if offline.
- **FR-010**: Download jobs MUST be scoped to the Kavita server they originated from (no cross-server file paths).
- **FR-011**: User MUST be able to cancel in-progress or queued jobs from the queue view.
- **FR-012**: User MUST be able to retry failed jobs from the queue view.
- **FR-013**: System MUST support offline download and offline reading for **all** formats currently readable in the app: EPUB, PDF, CBZ/CBR/CB7, and image sequences (v1 scope per clarification).
- **FR-014**: Completed downloads MUST be identifiable in series detail (e.g. downloaded indicator on album row).
- **FR-015**: System MUST NOT upload downloaded files to third parties or include download content in analytics.

### Key Entities

- **Download job**: Single album transfer; attributes include server id, series id, album/chapter id, display title, status, bytes progress, error message, created/updated time.
- **Download batch**: Optional grouping for “download series” (shared batch id, ordered children).
- **Offline copy**: Local file set for one album; linked to server + album ids; tracks format and byte size.
- **Download policy**: User preference for mobile data (boolean, default false).

## Success Criteria

### Measurable Outcomes

- **SC-001**: User can enqueue a single-album download and read it offline within 2 taps after completion (long-press → Download → later open reader).
- **SC-002**: User can enqueue a 10+ album series and observe ordered completion in the queue without manual reordering.
- **SC-003**: With Wi‑Fi-only enabled and device on cellular only, zero bytes transfer for 15 minutes while jobs remain waiting.
- **SC-004**: Notification progress updates at least once every 10 seconds during active multi-album download.
- **SC-005**: 95% of retry attempts after transient network failure succeed without re-downloading already-complete albums in the same batch.
- **SC-006**: User can find mobile-data and queue controls in Settings in under 3 taps from Home.
- **SC-007**: User can download and read offline at least one album each of: comic archive (CBZ/CBR), EPUB, and PDF without network after job completion.

## Assumptions

- **Album** means the same readable unit as a tappable row in series detail (chapter/volume entry that opens the reader).
- Series download default confirm path enqueues albums from the confirmation count; **Review albums** allows subset selection before enqueue.
- v1 offline download includes all reader formats (EPUB, PDF, archives, images), not comics-only.
- Existing HTTP warm-cache (`cacheChapter` on open) is separate; this feature adds durable offline storage and explicit user intent.
- Progress sync while offline follows feature 008 (local queue, sync when online).
- Android is the primary validation target.
- Estimated size in confirmation may be approximate or “unknown” when server metadata lacks file sizes; count is always shown.
