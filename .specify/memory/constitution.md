# KavitaReader Constitution

## Core Principles

### I. Reader First, Not a Server Replacement

KavitaReader is a **mobile client** for self-hosted [Kavita](https://www.kavitareader.com/) servers. Features MUST complement Kavita's library management — not duplicate server-side cataloging, metadata editing, or user administration. The app reads, syncs progress, and presents library content; the server remains the source of truth.

### II. Privacy and Zero Telemetry (NON-NEGOTIABLE)

No analytics, crash reporting to third parties, ads, or cloud dependency. Credentials and reading data stay on the device and the user's Kavita server. Logging MUST NOT include tokens, passwords, or API keys. User-facing copy MUST accurately reflect the no-collection posture (see `privacy_policy_plain.md`, `google_play_data_safety.md`).

### III. Offline-Capable Reading Where Practical

Reading sessions SHOULD tolerate intermittent connectivity. Progress sync with Kavita is important but MUST fail gracefully when offline and resume when connectivity returns. Cached credentials and server config use device-local storage only (`AsyncStorage` / Zustand persist).

### IV. Format Fidelity

Supported formats (EPUB, PDF, CBZ/CBR/CB7, images) MUST render reliably on Android. New format support requires explicit reader implementation and acceptance criteria — do not claim support without a working reader path. Reader UX (themes, font size, page sounds, grayscale) MUST remain consistent across formats where applicable.

### V. Multi-Server Awareness

Users may connect multiple Kavita instances (local IP, OPDS, remote). Server identity, credentials, and API clients MUST remain isolated per server (`KavitaClient` per-server storage keys, `serverStore` client cache). Cross-server search and primary-server semantics MUST not leak credentials between servers.

### VI. Expo / React Native Conventions

Stay within the Expo SDK 54 toolchain unless a native module is justified. Prefer existing dependencies (`react-native-paper`, `@react-navigation`, `zustand`, `axios`) over new stacks. Screen logic lives in `src/screens/`; API in `src/api/`; shared state in `src/stores/`; types in `src/types/`. Keep `AppNavigator` route params typed via `RootStackParamList`.

### VII. User Configuration in Settings

Any persisted user preference (themes, sounds, notifications, server options) MUST be reachable from **Settings** (`SettingsScreen`), not only from first-run or connect flows. Setup-only config is a defect unless explicitly documented as one-time.

## Technology Standards

| Area | Requirement |
|------|-------------|
| Platform | Android primary (iOS aspirational); API 21+ via Expo |
| Framework | React Native 0.81 · Expo SDK 54 · TypeScript |
| UI | React Native Paper (Material 3) · React Navigation 7 |
| State | Zustand (+ persist to AsyncStorage) |
| HTTP | Axios (`KavitaClient`) with token refresh |
| Package / bundle | `com.hesshomestead.reader` |
| Builds | EAS (`eas.json` profiles: preview, production) |

## Quality Gates

- Reading progress MUST sync to Kavita when authenticated and online
- Auth failures MUST surface actionable errors (not silent empty states)
- Theme changes (Homestead, Pipboy) MUST apply app-wide via `themeStore` / `useAppTheme`
- New screens MUST register in `AppNavigator` with typed params
- Cleartext HTTP for local LAN servers is intentional (`withAndroidCleartextTraffic` plugin) — document security implications in specs touching networking

## Specification Workflow

1. **Spec phase** (`/speckit-specify`): Technology-agnostic requirements; reference `.specify/memory/project-brief.md` and `feature_roadmap_doc.md`.
2. **Plan phase** (`/speckit-plan`): Architecture artifacts per `.specify/memory/spec-artifacts-checklist.md` for foundation or cross-cutting features.
3. **Tasks phase** (`/speckit-tasks`): Tasks grouped by user story; paths use `src/` layout.
4. **Analyze** (`/speckit-analyze`): Spec/plan/tasks consistency only — not runtime regressions.
5. **Implement** (`/speckit-implement`): No implementation until spec, plan, and tasks exist.

Do NOT generate implementation code during specification or planning unless explicitly running `/speckit-implement`.

## Governance

This constitution supersedes ad-hoc decisions. Amendments require updating this file, bumping the version below, and reconciling `.cursor/rules/specify-rules.mdc`.

All specs and plans MUST include a **Constitution Check** section verifying compliance with principles I–VII.

**Version**: 1.0.0 | **Ratified**: 2026-06-16 | **Last Amended**: 2026-06-16

**Upstream**: Fork of [cbytestech/kavita-reader](https://github.com/cbytestech/kavita-reader) · maintained at [ChrisFab16/kavita-reader](https://github.com/ChrisFab16/kavita-reader)
